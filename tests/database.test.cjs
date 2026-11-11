const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const {execFile}=require('node:child_process'),{promisify}=require('node:util')
const exec=promisify(execFile)
const {load}=require('./load-ts.cjs')
const py=`import sqlite3,json,sys
p=json.loads(sys.argv[2]);c=sqlite3.connect(sys.argv[1],timeout=20);c.row_factory=sqlite3.Row
if 'script' in p:
 c.executescript(p['script']);c.commit();print('{}')
else:
 q=c.execute(p['sql'],p.get('params',[]));rows=[dict(r) for r in q.fetchall()];changes=c.execute('SELECT changes()').fetchone()[0];c.commit();print(json.dumps({'success':True,'results':rows,'meta':{'changes':changes}}))
c.close()`
test('real SQLite migrations, concurrent allocation, idempotent checkout and durable events/outbox',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'deanflow-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
 const file=path.join(dir,'test.sqlite')
 async function query(sql,params=[]){return JSON.parse((await exec('python3',['-c',py,file,JSON.stringify({sql,params})])).stdout)}
 const script=fs.readFileSync('schema.sql','utf8')+'\n'+fs.readdirSync('migrations').sort().map(f=>fs.readFileSync('migrations/'+f,'utf8')).join('\n')
 await exec('python3',['-c',py,file,JSON.stringify({script})])
 const repo=load('src/lib/d1.ts',{}, {console:{error(){},warn(){}},DB:{prepare:sql=>({bind:(...params)=>({all:()=>query(sql,params)}),all:()=>query(sql)})}})
 for(const id of ['a','b']) await repo.adminUsersDb.create({id,email:id+'@test.com',password_hash:'hash',full_name:id,role:'sales',status:'active',assigned_leads_count:0})
 await Promise.all(Array.from({length:8},(_,i)=>repo.leadsDb.create({id:'l'+i,name:'Lead',status:'new',click_id:'click-'+i})))
 const counts=await query('SELECT assigned_to, COUNT(*) n FROM leads GROUP BY assigned_to')
 assert.deepEqual(counts.results.map(r=>r.n).sort(),[4,4])
 const limits=load('src/lib/rate-limit.ts',{'./d1':repo})
 const permitted=await Promise.all(Array.from({length:8},()=>limits.takeRateLimit('test','email',5)))
 assert.equal(permitted.filter(Boolean).length,5)
 const product={_id:'p',title:'Product',price:10,currency:'USD',inStock:true,moq:1,conversionType:'order_request'}
 const client={withConfig:()=>({fetch:async q=>q.includes('checkout-settings')?{priceShipping:5}:[product]})}
 const route=load('src/app/(frontend)/api/orders/create/route.ts',{'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}},'@/lib/d1':repo,'@/sanity/lib/client':{client}})
 const body={mode:'direct',name:'Buyer',email:'buyer@example.com',shippingAddress:'10 Street',shippingCountry:'Vietnam',shippingCity:'Hanoi',itemsDetail:[{productId:'p',quantity:2,price:-100}],grandTotal:1}
 const request=()=>new Request('https://test/api/orders/create',{method:'POST',headers:{'Idempotency-Key':'submission-test-0001'},body:JSON.stringify(body)})
 const responses=await Promise.all([route.POST(request()),route.POST(request())])
 for(const res of responses)assert.equal(res.status,200,await res.clone().text())
 const a=await responses[0].json(),b=await responses[1].json();assert.equal(a.orderId,b.orderId)
 const stored=await repo.ordersDb.getById(a.id);assert.equal(stored.total,25);assert.equal(stored.shipping_country,'Vietnam');assert.equal(stored.shipping_city,'Hanoi')
 assert.equal((await query('SELECT COUNT(*) n FROM orders')).results[0].n,1)
 assert.equal((await query('SELECT COUNT(*) n FROM outbox')).results[0].n,2)
 assert.ok((await query('SELECT COUNT(*) n FROM admin_events')).results[0].n>=9)
 body.shippingCountry='Other';assert.equal((await route.POST(request())).status,409)
 const changed=await repo.ordersDb.update('missing',{total:2});assert.equal(changed,false)
 // Issue an RFQ: snapshot and approval are protected by atomic state guards.
 await repo.ordersDb.update(a.id,{quote_status:'sent',quote_valid_until:'2099-01-01T00:00:00.000Z'})
 assert.equal((await query('SELECT COUNT(*) n FROM quote_versions')).results[0].n,1)
 const access=load('src/lib/quote-access.ts',{'./d1':repo,'./admin-auth':{getAdminSession:async()=>null}})
 const token=await access.issueQuoteAccess(a.id)
 assert.equal(await access.canAccessQuote(a.id,token),true)
 assert.equal(await access.canAccessQuote(a.id,null),false)
 assert.equal(await access.canAccessQuote('other',token),false)
 await query('UPDATE quote_access SET revoked_at = ? WHERE order_id = ?', [new Date().toISOString(),a.id])
 assert.equal(await access.canAccessQuote(a.id,token),false)
 await assert.rejects(query('UPDATE quote_versions SET snapshot = ? WHERE order_id = ?', ['{}',a.id]))
 await assert.rejects(repo.ordersDb.update(a.id,{total:999}))
 const trans=load('src/lib/quote-transition.ts',{'./d1':repo,'./quote-access':{canAccessQuote:async()=>true}})
 const approvals=await Promise.all([trans.transitionQuote({quoteId:a.orderId,approvedBy:'Buyer',version:1},'approved'),trans.transitionQuote({quoteId:a.orderId,approvedBy:'Buyer',version:1},'approved')])
 assert.deepEqual(approvals.map(r=>r.status).sort(),[200,409])
 assert.equal((await trans.transitionQuote({quoteId:a.orderId,customerName:'Buyer',version:1,requestedChanges:'Please change terms'},'revision_requested')).status,409)
 // Reopen the DB with a fresh repository: events and orders survive the process boundary.
 assert.equal((await query('SELECT COUNT(*) n FROM quote_events')).results[0].n,2)
})
