const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const next = { NextResponse: { json: (data, init) => Response.json(data, init) } }

test('Studio bridge rejects even a forged Studio identity', async () => {
 const { POST } = load('src/app/(frontend)/api/admin/auth/sanity-verify/route.ts', { 'next/server': next })
 const response = await POST(new Request('https://test/api', {method:'POST', body: JSON.stringify({sanityUser:{email:'admin@example.com'}})}))
 assert.equal(response.status,403); assert.equal(response.headers.get('set-cookie'),null)
})
test('passwords are native scrypt hashes and legacy plaintext cannot log in', async () => {
 const p = load('src/lib/passwords.ts')
 const hashed = await p.hashPassword('test-password-long-enough')
 assert.notEqual(hashed,'test-password-long-enough')
 assert.equal(await p.verifyPassword('test-password-long-enough', hashed),true)
 assert.equal(await p.verifyPassword('wrong', hashed),false)
 assert.equal(await p.verifyPassword('legacy', 'legacy'),false)
 await assert.rejects(p.hashPassword('short'))
})
test('all four session roles check DB status, role and password on every verification', async () => {
 let user
 const auth = load('src/lib/admin-auth.ts', { './d1': {adminUsersDb:{getById: async()=>user}}, 'next/headers': {cookies:async()=>({get:()=>null})} }, {process:{env:{ADMIN_JWT_SECRET:'test-only-secret-32-characters-long-enough'}}})
 for(const role of ['superadmin','admin','sales','marketing']) {
  user={id:'u',email:'u@test.com',full_name:'User',role,status:'active',created_at:'2026-01-01',password_hash:'hash-a'}
  const token=await auth.createAdminSessionToken({id:'u'})
  assert.equal((await auth.verifyAdminSessionToken(token)).role,role)
  user.status='inactive'; assert.equal(await auth.verifyAdminSessionToken(token),null)
  user.status='active'; user.password_hash='hash-b'; assert.equal(await auth.verifyAdminSessionToken(token),null)
  user.password_hash='hash-a'; user.role='different'; assert.equal(await auth.verifyAdminSessionToken(token),null)
  assert.equal(await auth.verifyAdminSessionToken(token+'x'),null)
 }
 user={id:'u',email:'u@test.com',full_name:'User',role:'cskh',status:'active',created_at:'2026-01-01',password_hash:'hash-a'}
 const legacyToken=await auth.createAdminSessionToken({id:'u'})
 assert.equal(await auth.verifyAdminSessionToken(legacyToken),null)
 assert.equal(await auth.verifyAdminSessionToken(null),null)
})
test('missing signing secret refuses issuance', async () => {
 const auth=load('src/lib/admin-auth.ts',{'./d1':{adminUsersDb:{getById:async()=>({id:'u',status:'active',password_hash:'x'})}},'next/headers':{}},{process:{env:{}}})
 await assert.rejects(auth.createAdminSessionToken({id:'u'}))
})
test('anonymous order listing is rejected before DB access', async () => {
 let touched=false
 const route=load('src/app/(frontend)/api/orders/list/route.ts', {'next/server':next,'@/lib/admin-auth':{requireAdminSession:async()=>({ok:false,status:401})},'@/lib/d1':{ordersDb:{list:async()=>{touched=true}}}})
 assert.equal((await route.GET(new Request('https://test/api'))).status,401);assert.equal(touched,false)
})
test('public review/comments ignore moderation query and remove author email', async () => {
 for(const [route,repo,field] of [['reviews','reviewsDb','reviews'],['blog/comments','commentsDb','comments']]) {
  let opts
  const handler=load(`src/app/(frontend)/api/${route}/route.ts`, {'next/server':next,'next-sanity':{},'@/sanity/env':{},'@/lib/rate-limit':{},'@/lib/d1':{[repo]:{list:async o=>{opts=o;return [{id:'one',author_email:'private@example.com',content:'approved'}]}}}})
  const response=await handler.GET(new Request('https://test/api?isApproved=all'))
  assert.equal(opts.isApproved,1);assert.equal((await response.json())[field][0].author_email,undefined)
 }
})
