const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const { getProductPricing } = load('src/lib/product-pricing.ts')
const { formatCurrency } = load('src/lib/utils.ts')

test('USD has stable two-decimal formatting and VND uses currency precision', () => {
	assert.equal(formatCurrency(1899, 'USD'), '$1,899.00')
	assert.equal(formatCurrency(1899, null), '$1,899.00')
	assert.equal(formatCurrency(1899.5, 'USD'), '$1,899.50')
	assert.equal(formatCurrency(799000, 'VND'), '₫799,000')
	assert.equal(getProductPricing({ price: 799000 }).label, '$799,000.00')
})

test('variant order does not change the starting price; zero is a valid override', () => {
	const p = {
		price: 100,
		currency: 'USD',
		variants: [{ price: 80 }, { price: 50 }],
	}
	assert.equal(getProductPricing(p).label, 'From $50.00')
	assert.equal(
		getProductPricing({ ...p, variants: [...p.variants].reverse() }).label,
		'From $50.00',
	)
	assert.equal(getProductPricing(p, { price: 0 }).price, 0)
	assert.equal(getProductPricing(p, {}).price, 100)
})

test('equal variant prices display as a fixed price', () => {
	assert.equal(
		getProductPricing({ variants: [{ price: 25 }, { price: 25 }] }).label,
		'$25.00',
	)
})

test('quote-only and missing prices never expose a numeric price or sale', () => {
	for (const p of [
		{ price: 100, compareAtPrice: 200, pricingModel: 'quote_only' },
		{},
		{ price: NaN },
		{ price: -1 },
	]) {
		const result = getProductPricing(p)
		assert.equal(result.label, 'Request Quote')
		assert.equal(result.hasSale, false)
	}
})

test('range, starting-at and volume tiers follow their configured models', () => {
	assert.equal(
		getProductPricing({ price: 10, maxPrice: 20, pricingModel: 'range' }).label,
		'$10.00 – $20.00',
	)
	assert.equal(
		getProductPricing({ price: 10, pricingModel: 'starting_at' }).label,
		'From $10.00',
	)
	assert.equal(
		getProductPricing({
			price: 10,
			pricingModel: 'tiered',
			priceTiers: [
				{ unitPrice: 8 },
				{ unitPrice: 4 },
				{ unitPrice: 0, isCustomQuote: true },
			],
		}).label,
		'From $4.00',
	)
})

test('selected variant price and compare-at override base values', () => {
	const result = getProductPricing(
		{ price: 100, compareAtPrice: 120, currency: 'EUR' },
		{ price: 50, compareAtPrice: 60 },
	)
	assert.equal(result.label, '€50.00')
	assert.equal(result.compareAtPrice, 60)
	assert.equal(result.hasSale, true)
})

test('GROQ list projection keeps variant and pricing data across catalog queries', async () => {
	const { parse, evaluate } = require('groq-js')
	const { PRODUCT_CARD_FIELDS } = load('src/sanity/lib/product-card-query.ts')
	const doc = {
		_id: 'p',
		_type: 'product',
		title: 'Kettle',
		price: 100,
		currency: 'EUR',
		pricingModel: 'fixed',
		variants: [
			{ _key: 'v', price: 50, options: [{ name: 'Size', value: 'L' }] },
		],
	}
	const result = await (
		await evaluate(parse(`*[_type == "product"]{${PRODUCT_CARD_FIELDS}}`), {
			dataset: [doc],
		})
	).get()
	assert.equal(result[0].currency, 'EUR')
	assert.equal(result[0].pricingModel, 'fixed')
	assert.equal(result[0].variants[0]._key, 'v')
	assert.equal(result[0].variants[0].options[0].value, 'L')
})

test('server price sort agrees with displayed variant and tier prices before pagination', async () => {
	const { parse, evaluate } = require('groq-js')
	const { PRODUCT_CARD_SORT_PRICE } = load(
		'src/sanity/lib/product-card-query.ts',
	)
	const dataset = [
		{ _id: 'variant', price: 100, variants: [{ price: 80 }, { price: 5 }] },
		{
			_id: 'tier',
			price: 200,
			pricingModel: 'tiered',
			priceTiers: [
				{ unitPrice: 50 },
				{ unitPrice: 3 },
				{ unitPrice: 0, isCustomQuote: true },
			],
		},
		{ _id: 'fixed', price: 10 },
		{ _id: 'fallback', price: 20, variants: [{}] },
	]
	const result = await (
		await evaluate(
			parse(`* | order(${PRODUCT_CARD_SORT_PRICE} asc)[0...3]{_id}`),
			{ dataset },
		)
	).get()
	assert.deepEqual(
		result.map((p) => p._id),
		['tier', 'variant', 'fixed'],
	)
})

test('showcase endpoint preserves variants and currency when filtering and paginating', async () => {
	const { parse, evaluate } = require('groq-js')
	const route = load('src/app/(frontend)/api/products/showcase/route.ts', {
		'next-sanity': {
			groq: (strings, ...values) =>
				strings.reduce((s, part, i) => s + part + (values[i] ?? ''), ''),
		},
		'next/server': {
			NextResponse: { json: (data, options) => Response.json(data, options) },
		},
		'next/headers': { draftMode: async () => ({ isEnabled: false }) },
		'@/sanity/lib/token': { token: 'test-token' },
		'@/lib/reviews': { enrichProductsWithD1Reviews: async (p) => p },
		'@/sanity/lib/client': {
			client: {
				fetch: async (query, params) => {
					const dataset = [
						{
							_id: 'p',
							_type: 'product',
							title: 'Kettle',
							price: 100,
							currency: 'EUR',
							categories: [{ _ref: 'c' }],
							variants: [{ _key: 'v', price: 5 }],
						},
						{
							_id: 'p2',
							_type: 'product',
							title: 'Cup',
							price: 20,
							currency: 'USD',
							categories: [{ _ref: 'c' }],
						},
						{
							_id: 'c',
							_type: 'product.category',
							slug: { current: 'kitchen' },
						},
					]
					return (
						await evaluate(parse(query, { params }), { dataset, params })
					).get()
				},
			},
		},
	})
	const response = await route.GET(
		new Request(
			'https://example.test/api/products/showcase?category=kitchen&sort=price_asc&limit=1',
		),
	)
	assert.equal(response.status, 200)
	const data = await response.json()
	assert.equal(data.total, 2)
	assert.equal(data.hasMore, true)
	assert.equal(data.products[0]._id, 'p')
	assert.equal(data.products[0].currency, 'EUR')
	assert.equal(data.products[0].variants[0]._key, 'v')
})
