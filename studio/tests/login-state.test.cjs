const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')

test('Studio retains transaction state across auth URL rewrites and clears it after exchange', () => {
	const state = 's'.repeat(43)
	const store = new Map()
	const window = {
		location: { search: `?state=${state}` },
		sessionStorage: {
			getItem: (key) => store.get(key),
			setItem: (key, value) => store.set(key, value),
			removeItem: (key) => store.delete(key),
		},
	}
	const api = load('src/sanity/lib/login-state.ts', { window })
	assert.equal(api.captureLoginState(), state)
	window.location.search = ''
	assert.equal(api.captureLoginState(), state)
	assert.deepEqual([...store.values()], [state])
	api.clearLoginState()
	assert.equal(api.captureLoginState(), '')
})

test('State capture supports SSR and browsers with storage disabled', () => {
	assert.equal(load('src/sanity/lib/login-state.ts').captureLoginState(), '')
	const state = 's'.repeat(43)
	const window = {
		location: { search: `?state=${state}` },
		get sessionStorage() {
			throw new Error('Storage disabled')
		},
	}
	const api = load('src/sanity/lib/login-state.ts', { window })
	assert.equal(api.captureLoginState(), state)
	api.clearLoginState()
	window.location.search = '?state=invalid'
	assert.equal(api.captureLoginState(), '')
})
