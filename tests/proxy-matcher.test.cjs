const { test } = require('node:test')
const assert = require('node:assert/strict')
const { unstable_doesMiddlewareMatch } = require('next/experimental/testing/server')
const { load } = require('./load-ts.cjs')

const { config } = load('src/proxy.ts', {
	'next/server': {},
	'./lib/attribution': {},
})
const matches = (url, options = {}) =>
	unstable_doesMiddlewareMatch({ config, url, ...options })
const cookies = { deanflow_consent: 'marketing' }

test('Attribution skips Node middleware without marketing consent and on private/system routes', () => {
	for (const url of ['/', '/b2b', '/products/example']) {
		assert.equal(matches(url), false, url)
		assert.equal(matches(url, { cookies: { deanflow_consent: 'essential' } }), false, url)
		assert.equal(matches(url, { cookies }), true, url)
	}
	for (const url of ['/api', '/api/leads', '/admin', '/admin/staff', '/studio', '/studio/desk', '/_next/static/app.js', '/_next/image', '/favicon.ico', '/sitemap.xml', '/robots.txt']) {
		assert.equal(matches(url, { cookies }), false, url)
	}
})

test('Prefetches skip attribution while actual navigation retains campaign capture', () => {
	const url = '/b2b?utm_source=partner'
	assert.equal(matches(url, { cookies, headers: { 'next-router-prefetch': '1' } }), false)
	assert.equal(matches(url, { cookies, headers: { purpose: 'prefetch' } }), false)
	assert.equal(matches(url, { cookies, headers: { rsc: '1' } }), true)
})
