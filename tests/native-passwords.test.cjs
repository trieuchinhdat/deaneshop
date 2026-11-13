const test = require('node:test')
const assert = require('node:assert/strict')
const { scryptSync } = require('node:crypto')
const { hashPassword, verifyPassword, validPassword } = require('../shared/password-hash.mjs')

test('Native scrypt stores unique salted hashes and verifies without external services', async () => {
 const password = 'native-password-for-test'
 const first = await hashPassword(password)
 const second = await hashPassword(password)
 assert.match(first, /^scrypt\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}$/)
 assert.notEqual(first, second)
 assert.equal(await verifyPassword(password, first), true)
 assert.equal(await verifyPassword('incorrect', first), false)
 assert.equal(first.includes(password), false)
})

test('Native verifier accepts the explicit salt and cost format from the Node synchronous API', async () => {
 const salt = '00112233445566778899aabbccddeeff'
 const digest = scryptSync('interoperability-password', Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 5, maxmem: 33554432 }).toString('hex')
 assert.equal(await verifyPassword('interoperability-password', `scrypt$16384$8$5$${salt}$${digest}`), true)
})

test('Malformed, excessive-cost, plaintext, bcrypt and Sanity marker values never authenticate', async () => {
 for (const stored of [null, '', 'plaintext-password', '$2b$12$' + 'a'.repeat(53), 'sanity-only:random',
  'scrypt$1048576$8$5$' + 'a'.repeat(32) + '$' + 'b'.repeat(64),
  'scrypt$16384$8$5$bad$bad', 'scrypt$16384$8$5$' + 'a'.repeat(32) + '$' + 'b'.repeat(63)]) {
  assert.equal(await verifyPassword('native-password-for-test', stored), false)
 }
 for (const password of [null, '', 'x'.repeat(73)]) assert.equal(await verifyPassword(password, 'malformed'), false)
 assert.equal(validPassword('short'), false)
 assert.equal(validPassword('é'.repeat(37)), false)
 await assert.rejects(hashPassword('short'))
})
