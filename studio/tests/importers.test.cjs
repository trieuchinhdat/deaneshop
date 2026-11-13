const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const fixtures = {
	post: JSON.stringify({
		title: 'Material Testing Guide',
		excerpt: 'Practical material testing',
		categoryName: 'Testing',
		authorName: 'Jane',
		sections: [
			{
				heading: 'Verification',
				paragraphs: ['Review the source test reports before ordering.'],
			},
		],
	}),
	product: JSON.stringify({
		title: 'Export Cup',
		price: 12,
		currency: 'USD',
		categoryName: 'Cups',
		description: 'A durable cup for export.',
	}),
	page: JSON.stringify({
		title: 'Supply Programme',
		slug: 'supply-programme',
		modules: [
			{
				_type: 'hero.split',
				headline: 'Reliable supply',
				content: 'Planning and samples.',
			},
		],
	}),
}
for (const kind of ['post', 'product', 'page']) {
	const parse = load(`src/importers/${kind}.ts`)[
		`parse${kind[0].toUpperCase() + kind.slice(1)}`
	]
	test(`${kind}: reject missing content, produce editable Sanity payload with no network write`, async () => {
		const client = { fetch: async () => [] }
		assert.equal((await parse('', client)).status, 400)
		const result = await parse(fixtures[kind], client)
		assert.equal(result.status, 200)
		assert.equal(result.data.success, true)
		const doc = kind === 'product' ? result.data.product : result.data
		assert.ok(doc.title)
		if (kind === 'post') assert.ok(result.data.content.length > 0)
		if (kind === 'page') assert.ok(result.data.modules.length > 0)
		if (kind === 'product') assert.equal(doc.title, 'Export Cup')
	})
}
