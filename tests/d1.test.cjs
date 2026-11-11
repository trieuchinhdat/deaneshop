const {test}=require('node:test')
const assert=require('node:assert/strict')
const {load}=require('./load-ts.cjs')
function db(fetch,env={D1_DATABASE_ID:'test',D1_ACCOUNT_ID:'test',CLOUDFLARE_API_TOKEN:'test'}) {
 return load('src/lib/d1.ts',{}, {process:{env},fetch,console:{error(){},warn(){}}})
}
test('DB error cannot create a successful order; missing production configuration fails',async()=>{
 const failed=db(async()=>({ok:false,json:async()=>({success:false})}))
 await assert.rejects(failed.ordersDb.create({id:'test',order_number:'test'}))
 await assert.rejects(db(undefined,{NODE_ENV:'production',D1_ALLOW_MEMORY:'true'}).ordersDb.create({id:'test'}))
})
test('zero-row updates return false and missing reads stay null',async()=>{
 const empty=db(async()=>({ok:true,json:async()=>({success:true,result:[{results:[],meta:{changes:0}}]})}))
 assert.equal(await empty.ordersDb.approveQuote('missing',{approvedBy:'test'}),false)
 assert.equal(await empty.ordersDb.getById('missing'),null)
})
test('lead INSERT retains attribution and performs assignment inside SQL',async()=>{
 let query
 const repo=db(async(url,options)=>{query=JSON.parse(options.body);return {ok:true,json:async()=>({success:true,result:[{results:[],meta:{changes:1}}]})}})
 const lead=await repo.leadsDb.create({id:'l',name:'Lead',status:'new',utm_term:'term',utm_content:'content',click_id:'click'})
 assert.equal(lead.click_id,'click');assert.equal(lead.utm_term,'term');assert.equal(lead.utm_content,'content')
 assert.match(query.sql,/SELECT COUNT\(\*\) FROM leads/);assert.ok(query.params.includes('click'))
 assert.equal((query.sql.match(/\?/g)||[]).length,query.params.length)
})
