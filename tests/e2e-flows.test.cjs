const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const exec = promisify(execFile)
const { load } = require('./load-ts.cjs')

const CF_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

const pySqlite = `import sqlite3, json, sys
p = json.loads(sys.argv[2])
c = sqlite3.connect(sys.argv[1], timeout=20)
c.row_factory = sqlite3.Row
if 'script' in p:
    c.executescript(p['script'])
    c.commit()
    print('{}')
else:
    q = c.execute(p['sql'], p.get('params', []))
    rows = [dict(r) for r in q.fetchall()]
    changes = c.execute('SELECT changes()').fetchone()[0]
    c.commit()
    print(json.dumps({'success': True, 'results': rows, 'meta': {'changes': changes}}))
c.close()`

function createSqliteBinding(dbFile) {
	async function run(sql, params = []) {
		const { stdout } = await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ sql, params })])
		return JSON.parse(stdout)
	}
	return {
		run,
		binding: {
			prepare(sql) {
				return {
					bind(...params) {
						return { all: () => run(sql, params) }
					},
					all: () => run(sql, []),
				}
			},
		},
	}
}

async function applyAllMigrations(dbFile) {
	const files = fs
		.readdirSync('migrations')
		.filter((f) => f.endsWith('.sql'))
		.sort()
	const script = files.map((f) => fs.readFileSync(path.join('migrations', f), 'utf8')).join('\n')
	await exec('python3', ['-c', pySqlite, dbFile, JSON.stringify({ script })])
}

test('E2E D2C, Lead Capture, and B2B RFQ flows run against Cloudflare D1 binding migrations', async (t) => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-e2e-'))
	t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
	const dbFile = path.join(dir, 'e2e.sqlite')
	await applyAllMigrations(dbFile)
	const { binding, run } = createSqliteBinding(dbFile)

	const envVars = {
		NODE_ENV: 'production',
		ADMIN_JWT_SECRET: 'e2e-test-only-signing-secret-at-least-32-bytes',
		NEXT_PUBLIC_BASE_URL: 'https://store.example.test',
		ORDER_WEBHOOK_URL: 'https://hooks.example.test/orders',
		RESEND_API_KEY: 're_test_key',
		RESEND_FROM_EMAIL: 'orders@example.test',
		D1_ALLOW_MEMORY: 'false',
	}

	const sentRequests = []
	const mockFetch = async (url, opts = {}) => {
		sentRequests.push({ url: String(url), headers: opts.headers || {}, body: opts.body ? JSON.parse(opts.body) : null })
		return { ok: true, status: 200, json: async () => ({ id: 'msg_' + sentRequests.length }) }
	}

	let currentCookieToken = null
	const nextHeadersMock = {
		cookies: async () => ({
			get: (name) => (name === 'deanflow_admin_session' && currentCookieToken ? { value: currentCookieToken } : undefined),
			set: (_name, val) => {
				currentCookieToken = val
			},
		}),
	}

	const nextServerMock = {
		NextResponse: {
			json: (data, init) => Response.json(data, init),
			next: () => {
				const cookieJar = new Map()
				return {
					cookies: {
						set: (c) => cookieJar.set(c.name, c),
						get: (n) => cookieJar.get(n),
					},
				}
			},
		},
	}

	const waitUntilPromises = []
	const cfContext = {
		env: { DB: binding, ASSETS: {}, ...envVars },
		ctx: { waitUntil: (p) => waitUntilPromises.push(p) },
	}

	const globals = {
		process: { env: { ...envVars } },
		fetch: mockFetch,
		console: { error() {}, warn() {}, log() {} },
		ReadableStream,
		[CF_CONTEXT_SYMBOL]: cfContext,
	}

	const sanityCatalog = [
		{
			_id: 'prod_bagasse_01',
			title: 'Compostable Clamshell Box',
			sku: 'DF-CLAM-01',
			price: 12,
			currency: 'USD',
			inStock: true,
			moq: 50,
			conversionType: 'order_request',
			priceTiers: [
				{ minQty: 50, maxQty: 499, unitPrice: 10, incoterm: 'FOB' },
				{ minQty: 500, unitPrice: 8, incoterm: 'FOB' },
			],
		},
		{
			_id: 'prod_direct_01',
			title: 'Hero Eco Starter Kit',
			sku: 'DF-KIT-01',
			price: 25,
			currency: 'USD',
			inStock: true,
			moq: 1,
			conversionType: 'order_request',
			priceTiers: [],
		},
	]

	const sanityClientMock = {
		client: {
			withConfig: () => ({
				fetch: async (query, params = {}) => {
					if (query.includes('checkout-settings')) return { priceShipping: 7 }
					if (query.includes('_type == \'product\'')) {
						return sanityCatalog.filter((p) => !params.ids || params.ids.includes(p._id))
					}
					return null
				},
			}),
			fetch: async () => ({ siteName: 'DeanFlow' }),
		},
	}

	const mocks = {
		'next/server': nextServerMock,
		'next/headers': nextHeadersMock,
		'@/sanity/lib/client': sanityClientMock,
		'@opennextjs/cloudflare': { getCloudflareContext: async () => cfContext },
	}

	const d1Mod = load('src/lib/d1.ts', mocks, globals)
	const pwMod = load('src/lib/passwords.ts', mocks, globals)
	const authMod = load('src/lib/admin-auth.ts', { ...mocks, './d1': d1Mod }, globals)
	const outboxMod = load('src/lib/outbox.ts', { ...mocks, './d1': d1Mod }, globals)

	// Seed admin and two active sales reps
	const adminPass = await pwMod.hashPassword('AdminStrongPass!2026')
	const salesPass = await pwMod.hashPassword('SalesStrongPass!2026')
	await d1Mod.adminUsersDb.create({
		id: 'staff_admin',
		email: 'admin@example.test',
		password_hash: adminPass,
		full_name: 'Admin Lead',
		role: 'admin',
		status: 'active',
		assigned_leads_count: 0,
	})
	await d1Mod.adminUsersDb.create({
		id: 'staff_sales_1',
		email: 'sales1@example.test',
		password_hash: salesPass,
		full_name: 'Sales One',
		role: 'sales',
		status: 'active',
		assigned_leads_count: 0,
	})
	await d1Mod.adminUsersDb.create({
		id: 'staff_sales_2',
		email: 'sales2@example.test',
		password_hash: salesPass,
		full_name: 'Sales Two',
		role: 'sales',
		status: 'active',
		assigned_leads_count: 0,
	})

	// -------------------------------------------------------------------------
	// FLOW 1: D2C Checkout -> Outbox Delivery -> Admin Status & 404 Check
	// -------------------------------------------------------------------------
	const orderCreateRoute = load('src/app/(frontend)/api/orders/create/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/outbox': outboxMod,
	}, globals)
	const ordersListRoute = load('src/app/(frontend)/api/orders/list/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const orderUpdateRoute = load('src/app/(frontend)/api/orders/update-status/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
		'@/lib/outbox': outboxMod,
	}, globals)

	const d2cPayload = {
		mode: 'direct',
		name: 'Alice Buyer',
		email: 'alice@buyer.test',
		phone: '+14155550101',
		shippingAddress: '100 Market St',
		shippingApartment: 'Suite 400',
		shippingCity: 'San Francisco',
		shippingState: 'CA',
		shippingPostalCode: '94105',
		shippingCountry: 'United States',
		itemsDetail: [{ productId: 'prod_direct_01', quantity: 2, price: 0.01 }],
		grandTotal: 0.01,
	}

	const d2cRes1 = await orderCreateRoute.POST(
		new Request('https://store.example.test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'd2c-checkout-idemp-0001' },
			body: JSON.stringify(d2cPayload),
		}),
	)
	assert.equal(d2cRes1.status, 200)
	const d2cBody1 = await d2cRes1.json()
	assert.equal(d2cBody1.total, 57) // 2 * $25 + $7 shipping (client price tampered ignored)

	// Retry same idempotency key returns identical order without duplication
	const d2cRes2 = await orderCreateRoute.POST(
		new Request('https://store.example.test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'd2c-checkout-idemp-0001' },
			body: JSON.stringify(d2cPayload),
		}),
	)
	assert.equal(d2cRes2.status, 200)
	const d2cBody2 = await d2cRes2.json()
	assert.equal(d2cBody2.orderId, d2cBody1.orderId)

	// Wait for background waitUntil outbox delivery triggered by commit (and ensure remaining jobs drain)
	await Promise.all(waitUntilPromises.splice(0))
	await outboxMod.drainOutbox(10)
	assert.equal(sentRequests.length, 2)

	// Admin logs in, lists orders, updates fulfillment, and gets 404 for unknown order
	const loginRoute = load('src/app/(frontend)/api/admin/auth/login/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
		'@/lib/passwords': pwMod,
	}, globals)
	const loginRes = await loginRoute.POST(
		new Request('https://store.example.test/api/admin/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'admin@example.test', password: 'AdminStrongPass!2026' }),
		}),
	)
	assert.equal(loginRes.status, 200)

	const listRes = await ordersListRoute.GET(new Request('https://store.example.test/api/orders/list'))
	assert.equal(listRes.status, 200)
	const listJson = await listRes.json()
	assert.equal(listJson.orders.length, 1)
	assert.equal(listJson.orders[0].customer.city, 'San Francisco')

	const updRes = await orderUpdateRoute.POST(
		new Request('https://store.example.test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({
				docId: d2cBody1.id,
				fulfillmentStatus: 'SHIPPING',
				carrier: 'DHL Express',
				trackingCode: 'DHL123456',
				internalNote: 'Dispatched from hub',
			}),
		}),
	)
	assert.equal(updRes.status, 200)

	const missingUpd = await orderUpdateRoute.POST(
		new Request('https://store.example.test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ docId: 'non-existent-order', fulfillmentStatus: 'SHIPPING' }),
		}),
	)
	assert.equal(missingUpd.status, 404)

	// -------------------------------------------------------------------------
	// FLOW 2: Lead Capture, Attribution, Atomic Assignment & RBAC / SSE Scoping
	// -------------------------------------------------------------------------
	const proxyMod = load('src/proxy.ts', mocks, globals)
	const proxyReq1 = {
		nextUrl: new URL('https://store.example.test/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_term=eco&utm_content=hero&gclid=gcl_1'),
		cookies: { get: (n) => (n === 'deanflow_consent' ? { value: 'marketing' } : undefined), has: () => false },
		headers: new Headers({ referer: 'https://google.com/search' }),
	}
	const proxyResp1 = proxyMod.proxy(proxyReq1)
	const attrCookie1 = proxyResp1.cookies.get('deanflow_attr').value

	const proxyReq2 = {
		nextUrl: new URL('https://store.example.test/solutions?utm_source=linkedin&utm_campaign=b2b'),
		cookies: {
			get: (n) => (n === 'deanflow_consent' ? { value: 'marketing' } : n === 'deanflow_attr' ? { value: attrCookie1 } : undefined),
			has: (n) => n === 'deanflow_attr',
		},
		headers: new Headers(),
	}
	const proxyResp2 = proxyMod.proxy(proxyReq2)
	const attrCookie2 = proxyResp2.cookies.get('deanflow_attr').value

	const leadsRoute = load('src/app/(frontend)/api/leads/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
	}, globals)

	const leadRes1 = await leadsRoute.POST(
		new Request('https://store.example.test/api/leads', {
			method: 'POST',
			headers: {
				cookie: `deanflow_attr=${attrCookie2}`,
				'cf-ipcountry': 'DE',
				'cf-ipcity': 'Berlin',
			},
			body: JSON.stringify({
				name: 'Hans Buyer',
				email: 'hans@corp-buyer.de',
				companyName: 'EcoRetail GmbH',
				consent: true,
				journey_json: [{ path: '/solutions', title: 'Solutions', timestamp: new Date().toISOString() }],
			}),
		}),
	)
	assert.equal(leadRes1.status, 200)
	const leadBody1 = await leadRes1.json()
	const storedLead1 = await d1Mod.leadsDb.getById(leadBody1.leadId)
	// The LinkedIn touch must not inherit Google's keyword or click identifier.
	assert.equal(storedLead1.utm_term, null)
	assert.equal(storedLead1.click_id, null)
	assert.equal(JSON.parse(storedLead1.attribution_json).first_touch.utm_term, 'eco')
	assert.equal(JSON.parse(storedLead1.attribution_json).first_touch.click_id, 'gcl_1')
	assert.equal(JSON.parse(storedLead1.attribution_json).first_touch.utm_source, 'google')
	assert.equal(JSON.parse(storedLead1.attribution_json).last_touch.utm_source, 'linkedin')
	assert.equal(JSON.parse(storedLead1.consent_json).marketing, true)

	// Second lead goes to the other sales rep atomically
	const leadRes2 = await leadsRoute.POST(
		new Request('https://store.example.test/api/leads', {
			method: 'POST',
			body: JSON.stringify({ name: 'Second Lead', email: 'two@corp-buyer.de', consent: false }),
		}),
	)
	assert.equal(leadRes2.status, 200)
	const leadBody2 = await leadRes2.json()
	const storedLead2 = await d1Mod.leadsDb.getById(leadBody2.leadId)
	assert.notEqual(storedLead1.assigned_to, storedLead2.assigned_to)

	// Sales rep 1 signs in and only sees their own lead in GET /api/admin/leads and SSE /api/admin/events
	const salesLoginRes = await loginRoute.POST(
		new Request('https://store.example.test/api/admin/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'sales1@example.test', password: 'SalesStrongPass!2026' }),
		}),
	)
	assert.equal(salesLoginRes.status, 200)

	const adminLeadsRoute = load('src/app/(frontend)/api/admin/leads/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const salesLeadsRes = await adminLeadsRoute.GET(
		new Request('https://store.example.test/api/admin/leads?assigned_to=staff_sales_2'),
	)
	assert.equal(salesLeadsRes.status, 200)
	const salesLeadsJson = await salesLeadsRes.json()
	assert.equal(salesLeadsJson.leads.length, 1)
	assert.equal(salesLeadsJson.leads[0].assigned_to, 'staff_sales_1')

	const adminLeadsUpdateRoute = load('src/app/(frontend)/api/admin/leads/update/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const otherRepLeadId = storedLead1.assigned_to === 'staff_sales_1' ? storedLead2.id : storedLead1.id
	const crossEditRes = await adminLeadsUpdateRoute.POST(
		new Request('https://store.example.test/api/admin/leads/update', {
			method: 'POST',
			body: JSON.stringify({ leadId: otherRepLeadId, status: 'contacted' }),
		}),
	)
	assert.equal(crossEditRes.status, 403)

	const eventsRoute = load('src/app/(frontend)/api/admin/events/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const sseRes = await eventsRoute.GET({
		headers: new Headers({ 'last-event-id': '0' }),
		nextUrl: new URL('https://store.example.test/api/admin/events'),
		signal: new AbortController().signal,
	})
	const sseReader = sseRes.body.getReader()
	const firstChunk = new TextDecoder().decode((await sseReader.read()).value)
	const secondChunk = new TextDecoder().decode((await sseReader.read()).value)
	await sseReader.cancel()
	const combinedSse = firstChunk + secondChunk
	assert.doesNotMatch(combinedSse, /NEW_ORDER|ORDER_UPDATED/)
	const myLeadId = storedLead1.assigned_to === 'staff_sales_1' ? storedLead1.id : storedLead2.id
	assert.match(combinedSse, new RegExp(myLeadId))
	assert.doesNotMatch(combinedSse, new RegExp(otherRepLeadId))

	// -------------------------------------------------------------------------
	// FLOW 3: B2B Wholesale RFQ -> Quote Snapshot -> Token Access -> Approval
	// -------------------------------------------------------------------------
	// Log back in as Admin
	await loginRoute.POST(
		new Request('https://store.example.test/api/admin/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email: 'admin@example.test', password: 'AdminStrongPass!2026' }),
		}),
	)

	const rfqRes = await orderCreateRoute.POST(
		new Request('https://store.example.test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'b2b-rfq-idemp-0001' },
			body: JSON.stringify({
				mode: 'wholesale_rfq',
				companyName: 'Global Packaging Imports LLC',
				taxId: 'DE999888777',
				incoterm: 'FOB',
				portOfDestination: 'Hamburg Port',
				targetDeliveryDate: '2026-12-20',
				name: 'Procurement Lead',
				email: 'procurement@globalpack.de',
				shippingAddress: 'Hafenstrasse 12',
				shippingCity: 'Hamburg',
				shippingCountry: 'Germany',
				itemsDetail: [{ productId: 'prod_bagasse_01', quantity: 500, price: 1 }],
			}),
		}),
	)
	assert.equal(rfqRes.status, 200)
	const rfqBody = await rfqRes.json()
	assert.equal(rfqBody.total, 4000) // 500 * $8 tier price
	const rfqLeadRows = await run(
		`SELECT l.*, a.qualification, a.priority FROM leads l JOIN lead_assessments a ON a.lead_id = l.id WHERE l.id = ?`,
		[`lead_rfq:${rfqBody.id}`],
	)
	assert.equal(rfqLeadRows.results.length, 1)
	assert.equal(rfqLeadRows.results[0].source, 'wholesale_rfq')
	assert.equal(rfqLeadRows.results[0].company_name, 'Global Packaging Imports LLC')
	assert.match(rfqLeadRows.results[0].message, /Wholesale quote RFQ-[^\n]+\nProducts: .* x 500/)
	assert.equal(rfqLeadRows.results[0].qualification, 'not_assessed')
	assert.equal(rfqLeadRows.results[0].priority, 'high')
	const rfqReplay = await orderCreateRoute.POST(
		new Request('https://store.example.test/api/orders/create', {
			method: 'POST',
			headers: { 'Idempotency-Key': 'b2b-rfq-idemp-0001' },
			body: JSON.stringify({
				mode: 'wholesale_rfq', companyName: 'Global Packaging Imports LLC', taxId: 'DE999888777',
				incoterm: 'FOB', portOfDestination: 'Hamburg Port', targetDeliveryDate: '2026-12-20',
				name: 'Procurement Lead', email: 'procurement@globalpack.de', shippingAddress: 'Hafenstrasse 12',
				shippingCity: 'Hamburg', shippingCountry: 'Germany',
				itemsDetail: [{ productId: 'prod_bagasse_01', quantity: 500, price: 1 }],
			}),
		}),
	)
	assert.equal(rfqReplay.status, 200)
	assert.equal((await run('SELECT COUNT(*) AS count FROM leads WHERE id = ?', [`lead_rfq:${rfqBody.id}`])).results[0].count, 1)

	// Issue quote (`quoteStatus: 'SENT'`) -> creates immutable snapshot v1 + quote.email outbox job
	const issueRes = await orderUpdateRoute.POST(
		new Request('https://store.example.test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({
				docId: rfqBody.id,
				quoteStatus: 'SENT',
				paymentTerms: 'T/T 30% advance, 70% against B/L',
				quoteValidUntil: '2099-01-01T00:00:00.000Z',
			}),
		}),
	)
	assert.equal(issueRes.status, 200)
	const snapshots = await run('SELECT version, snapshot FROM quote_versions WHERE order_id = ?', [rfqBody.id])
	assert.equal(snapshots.results.length, 1)
	assert.equal(snapshots.results[0].version, 1)

	// Revising commercial terms while quote is 'sent' is blocked by SQLite trigger (409)
	const blockedEditRes = await orderUpdateRoute.POST(
		new Request('https://store.example.test/api/orders/update-status', {
			method: 'POST',
			body: JSON.stringify({ docId: rfqBody.id, shippingFee: 250, total: 4250 }),
		}),
	)
	assert.equal(blockedEditRes.status, 409)

	// Generate buyer quote link via admin endpoint
	const quoteAccessRoute = load('src/app/(frontend)/api/admin/quotes/access/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const accessRes = await quoteAccessRoute.POST(
		new Request('https://store.example.test/api/admin/quotes/access', {
			method: 'POST',
			body: JSON.stringify({ orderId: rfqBody.id }),
		}),
	)
	assert.equal(accessRes.status, 200)
	const accessJson = await accessRes.json()
	const buyerToken = new URL('https://store.example.test' + accessJson.path).searchParams.get('token')
	assert.ok(buyerToken && buyerToken.length === 64)

	// Clear admin session to simulate anonymous / buyer browser
	currentCookieToken = null
	const approveQuoteRoute = load('src/app/(frontend)/api/orders/approve-quote/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)
	const revisionRoute = load('src/app/(frontend)/api/orders/request-revision/route.ts', {
		...mocks,
		'@/lib/d1': d1Mod,
		'@/lib/admin-auth': authMod,
	}, globals)

	// Anonymous ID-only approval must be rejected
	const anonApprove = await approveQuoteRoute.POST(
		new Request('https://store.example.test/api/orders/approve-quote', {
			method: 'POST',
			body: JSON.stringify({ quoteId: rfqBody.orderId, approvedBy: 'Attacker', version: 1 }),
		}),
	)
	assert.equal(anonApprove.status, 403)

	// Concurrent buyer approvals with valid token: exactly one succeeds (200) and one conflicts (409)
	const [appA, appB] = await Promise.all([
		approveQuoteRoute.POST(
			new Request('https://store.example.test/api/orders/approve-quote', {
				method: 'POST',
				body: JSON.stringify({ quoteId: rfqBody.orderId, token: buyerToken, approvedBy: 'Buyer Dir', version: 1 }),
			}),
		),
		approveQuoteRoute.POST(
			new Request('https://store.example.test/api/orders/approve-quote', {
				method: 'POST',
				body: JSON.stringify({ quoteId: rfqBody.orderId, token: buyerToken, approvedBy: 'Buyer Dir', version: 1 }),
			}),
		),
	])
	assert.deepEqual([appA.status, appB.status].sort(), [200, 409])

	// Subsequent revision request on an already approved quote returns 409
	const revAfterApproval = await revisionRoute.POST(
		new Request('https://store.example.test/api/orders/request-revision', {
			method: 'POST',
			body: JSON.stringify({
				quoteId: rfqBody.orderId,
				token: buyerToken,
				customerName: 'Buyer Dir',
				requestedChanges: 'Attempt to modify after approval',
				version: 1,
			}),
		}),
	)
	assert.equal(revAfterApproval.status, 409)
})
