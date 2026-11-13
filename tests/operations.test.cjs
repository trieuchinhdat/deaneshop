const {test}=require('node:test')
const assert=require('node:assert/strict')
const {load}=require('./load-ts.cjs')
test('outbox records provider failure and sends stable idempotency key on retry',async()=>{
 let success=false, headers, writes=[]
 const repo={ordersDb:{getById:async()=>({id:'o'})},d1Query:async(sql,params)=>{
  if(sql.includes('RETURNING'))return {results:[{id:'order:o',payload:'{"orderId":"o"}',attempts:1,event_type:'order.created'}]}
  writes.push({sql,params});return {results:[],meta:{changes:1}}
 }}
 const box=load('src/lib/outbox.ts',{'./d1':repo,'./quote-access':{}},{process:{env:{ORDER_WEBHOOK_URL:'https://example.test/webhook'}},fetch:async(url,opts)=>{headers=opts.headers;return {ok:success,status:503}}})
 assert.equal((await box.processOutbox()).status,'failed');assert.match(writes[0].sql,/status = 'failed'/)
 success=true;assert.equal((await box.processOutbox()).status,'sent');assert.equal(headers['Idempotency-Key'],'order:o')
 assert.equal(box.escapeEmailHtml('<a "x">&'), '&lt;a &quot;x&quot;&gt;&amp;')
})
test('SSE filters orders and other-owner leads for sales; resumes after requested cursor',async()=>{
 let cursor
 const runFor=async(role,id)=>{
  const route=load('src/app/(frontend)/api/admin/events/route.ts',{
   'next/server':{},'@/lib/admin-auth':{getAdminSession:async()=>({id,role}),ROLE_PERMITTED_TABS:{sales:['overview','leads','customers']}},
   '@/lib/d1':{d1Query:async(sql,params)=>{cursor=params[0];return {results:[{id:11,type:'NEW_ORDER',resource_id:'o'},{id:12,type:'NEW_LEAD',resource_id:'other',assigned_to:'sales-b'},{id:13,type:'NEW_LEAD',resource_id:'mine',assigned_to:id}]}}}
  },{ReadableStream})
  const res=await route.GET({headers:new Headers({'last-event-id':'10'}),nextUrl:new URL('https://test/api'),signal:new AbortController().signal})
  const reader=res.body.getReader();const first=await reader.read();await reader.cancel()
  return new TextDecoder().decode(first.value)
 }
 const salesText=await runFor('sales','sales-a')
 assert.equal(cursor,10);assert.match(salesText,/mine/);assert.doesNotMatch(salesText,/NEW_ORDER|other/)
})
test('image policy rejects spoofed content and oversized uploads',()=>{
 const {validImage,MAX_IMAGE_BYTES}=load('src/lib/upload-policy.ts')
 assert.equal(validImage(new Uint8Array(20),'image/jpeg'),false)
 assert.equal(validImage(new Uint8Array(MAX_IMAGE_BYTES+1),'image/png'),false)
 const png=new Uint8Array(16);png.set([137,80,78,71,13,10,26,10]);assert.equal(validImage(png,'image/png'),true)
})
