const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./load-ts.cjs')

test('SPA route transitions do not overwrite external attribution and ref_embed stays internal', () => {
	const prevBase = process.env.NEXT_PUBLIC_BASE_URL
	process.env.NEXT_PUBLIC_BASE_URL = 'https://store.example.com'
	try {
		const { resolveAttributionForVisit } = load('src/lib/attribution.ts')

		const initial = resolveAttributionForVisit({
			pathname: '/matcha',
			searchParams: new URLSearchParams('utm_source=google&utm_medium=cpc&utm_campaign=q4_b2b'),
			referrer: 'https://www.google.com/',
			checkExternalReferrer: true,
		})
		assert.equal(initial?.utm_source, 'google')
		assert.equal(initial?.utm_campaign, 'q4_b2b')

		// Subsequent SPA navigation keeps browser document.referrer at google.com and has internal ?ref_embed=
		const spaNext = resolveAttributionForVisit({
			pathname: '/products/ceremonial-matcha',
			searchParams: new URLSearchParams('ref_embed=blog_product_embed:ceremonial-matcha'),
			referrer: 'https://www.google.com/',
			existingAttribution: initial,
			checkExternalReferrer: false,
		})
		assert.equal(spaNext?.utm_source, 'google')
		assert.equal(spaNext?.utm_campaign, 'q4_b2b')
		assert.equal(spaNext?.internal_ref, 'blog_product_embed:ceremonial-matcha')

		// Unattributed SPA navigation without new params returns null (does not overwrite existing touch)
		const spaPlain = resolveAttributionForVisit({
			pathname: '/contact',
			searchParams: new URLSearchParams(),
			referrer: 'https://www.google.com/',
			existingAttribution: initial,
			checkExternalReferrer: false,
		})
		assert.equal(spaPlain, null)
	} finally {
		if (prevBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
		else process.env.NEXT_PUBLIC_BASE_URL = prevBase
	}
})

test('resolveRequestTrackingContext falls back to body attribution without marketing cookie', () => {
	const { resolveRequestTrackingContext } = load('src/lib/request-tracking.ts', {
		'./analytics-engine': { writeAnalyticsDataPoint: async () => false },
	})

	const req = new Request('https://store.example.com/api/leads', {
		method: 'POST',
		headers: {
			'cf-ipcountry': 'JP',
			'cf-ipcity': 'Tokyo',
			referer: 'https://store.example.com/blog/matcha-guide',
		},
	})

	const body = {
		landing_page_url: 'https://store.example.com/blog/matcha-guide?utm_source=linkedin',
		consent: true,
		marketing_consent: false,
		attribution_json: {
			utm_source: 'linkedin',
			utm_medium: 'paid_social',
			utm_campaign: 'jp_distributors',
			utm_content: 'video_ad_2',
			click_id: 'li_clk_99',
			internal_ref: 'blog_product_embed:uji-matcha',
		},
		journey_json: [
			{
				path: '/blog/matcha-guide',
				title: 'Matcha Guide',
				timestamp: '2026-11-12T10:00:00.000Z',
				event: 'page_view',
			},
			{
				path: '/products/uji-matcha',
				title: 'Uji Matcha',
				timestamp: '2026-11-12T10:02:00.000Z',
				event: 'cta_click',
			},
		],
	}

	const ctx = resolveRequestTrackingContext(req, body, {
		formSource: 'rfq_modal',
		strictJourney: true,
	})

	assert.equal(ctx.cfCountry, 'JP')
	assert.equal(ctx.cfCity, 'Tokyo')
	assert.equal(ctx.utmSource, 'linkedin')
	assert.equal(ctx.utmMedium, 'paid_social')
	assert.equal(ctx.utmCampaign, 'jp_distributors')
	assert.equal(ctx.utmContent, 'video_ad_2')
	assert.equal(ctx.clickId, 'li_clk_99')
	assert.equal(JSON.parse(ctx.attributionJson).internal_ref, 'blog_product_embed:uji-matcha')
	assert.equal(JSON.parse(ctx.journeyJson || '[]').length, 2)
	const consent = JSON.parse(ctx.consentJson)
	assert.equal(consent.marketing, true)
	assert.equal(consent.marketingCookie, false)
	assert.equal(consent.form, 'rfq_modal')
})

test('Analytics Engine validates beacons and streams to ANALYTICS binding with zero D1 writes', async () => {
	const points = []
	const fakeDataset = {
		writeDataPoint(point) {
			points.push(point)
		},
	}

	const aeMod = load('src/lib/analytics-engine.ts', {
		'./cf-env': {
			getCloudflareContextSafe: async () => ({ env: { ANALYTICS: fakeDataset } }),
			getEnvVar: async () => undefined,
		},
	})

	assert.equal(aeMod.normalizeAnalyticsEvent({ event: 'bogus_event', path: '/' }), null)
	const normalized = aeMod.normalizeAnalyticsEvent({
		event: 'cta_click',
		path: '/products/uji-matcha?utm_source=google&secret=1',
		utm_source: 'google',
		utm_medium: 'cpc',
		label: 'Request Wholesale Quote',
	})
	assert.equal(normalized?.path, '/products/uji-matcha')

	const route = load('src/app/(frontend)/api/analytics/beacon/route.ts', {
		'next/server': {
			NextResponse: {
				json: (b, i) =>
					new Response(JSON.stringify(b), {
						status: i?.status || 200,
						headers: i?.headers,
					}),
			},
		},
		'@/lib/analytics-engine': aeMod,
	})

	const badRes = await route.POST(
		new Request('https://store.example.com/api/analytics/beacon', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ event: 'invalid' }),
		}),
	)
	assert.equal(badRes.status, 400)

	const okRes = await route.POST(
		new Request('https://store.example.com/api/analytics/beacon', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'cf-ipcountry': 'vn',
			},
			body: JSON.stringify({
				event: 'form_start',
				path: '/contact?utm_source=meta',
				utm_source: 'meta',
				utm_medium: 'paid_social',
				utm_campaign: 'q4_leadgen',
				device: 'mobile',
				placement: 'lead_capture_form',
				label: 'Wholesale Lead Form',
			}),
		}),
	)
	assert.equal(okRes.status, 202)
	const json = await okRes.json()
	assert.equal(json.ok, true)
	assert.equal(json.recorded, true)
	assert.equal(points.length, 1)
	assert.equal(points[0].blobs[0], 'form_start')
	assert.equal(points[0].blobs[1], '/contact')
	assert.equal(points[0].blobs[2], 'meta')
	assert.equal(points[0].blobs[5], 'VN')
	assert.deepEqual(Array.from(points[0].doubles), [1, 0, 0, 0, 0, 0, 0])
})

test('customer directory merges direct/sample orders without double-counting wholesale RFQs', async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'customers-orders-'))
	const db = path.join(dir, 'db.sqlite')
	function query(sql, params = [], script = false) {
		return JSON.parse(
			execFileSync(
				'python3',
				[
					'-c',
					`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
if sys.argv[4]=='true':
 c.executescript(sys.argv[2]);rows=[]
else:
 rows=[dict(x) for x in c.execute(sys.argv[2],json.loads(sys.argv[3])).fetchall()]
c.commit();print(json.dumps({'results':rows}));c.close()`,
					db,
					sql,
					JSON.stringify(params),
					String(script),
				],
				{ encoding: 'utf8' },
			),
		)
	}

	try {
		const migrationFiles = fs
			.readdirSync('migrations')
			.filter((f) => /^\d+.*\.sql$/.test(f))
			.sort()
		for (const file of migrationFiles) {
			query(fs.readFileSync(path.join('migrations', file), 'utf8'), [], true)
		}

		query(
			`INSERT INTO orders(id,order_number,customer_name,customer_email,shipping_country,shipping_address,items_json,subtotal,total,order_intent,created_at)
			 VALUES
			 ('o1','ORD-1','Buyer One','buyer@example.test','US','1 Main St','[]',150,150,'direct','2026-11-10T10:00:00Z'),
			 ('o2','ORD-2','Buyer One','buyer@example.test','US','1 Main St','[]',25,25,'sample','2026-11-11T10:00:00Z'),
			 ('o3','RFQ-3','Buyer One','buyer@example.test','US','1 Main St','[]',900,900,'wholesale_rfq','2026-11-12T10:00:00Z')`,
		)
		// Assign the projected wholesale_rfq lead to rep1 so rep1 can also see Buyer One orders
		query("UPDATE leads SET assigned_to='rep1' WHERE id='lead_rfq:o3'")

		const route = (role) =>
			load('src/app/(frontend)/api/admin/customer-directory/route.ts', {
				'next/server': {
					NextResponse: {
						json: (b, i) =>
							new Response(JSON.stringify(b), { status: i?.status || 200 }),
					},
				},
				'@/lib/admin-auth': {
					requireAdminSession: async () => ({
						ok: true,
						session: { id: 'rep1', role },
					}),
				},
				'@/lib/d1': { d1Query: async (q, p) => query(q, p) },
			})

		const adminRes = await (
			await route('admin').GET(
				new Request(
					'https://test/api/admin/customer-directory?customer=' +
						encodeURIComponent('email:buyer@example.test'),
				),
			)
		).json()

		assert.equal(adminRes.customer.order_count, 2)
		assert.equal(adminRes.customer.total_spent, 175)
		// 1 wholesale_rfq lead (via trigger) + 1 direct_order + 1 sample_order = 3 interactions
		assert.equal(adminRes.customer.interactions, 3)

		const salesRes = await (
			await route('sales').GET(
				new Request('https://test/api/admin/customer-directory?source=direct_order'),
			)
		).json()
		assert.equal(salesRes.total, 1)
		assert.equal(salesRes.items[0].order_count, 2)
		assert.equal(salesRes.items[0].total_spent, 175)
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
})

