const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')
const lib = load('src/lib/lead-intelligence.ts')
test('acquisition channels distinguish unknown, organic, paid and direct', () => {
 assert.equal(lib.leadChannel(null,null),'Unknown')
 assert.equal(lib.leadChannel('www.google.com','referral'),'Organic Search')
 assert.equal(lib.leadChannel('google','cpc'),'Paid')
 assert.equal(lib.leadChannel('direct','direct'),'Direct')
})
test('unsafe URLs and invalid journey records are never used as links or activity', () => {
 assert.equal(lib.safeWebUrl('javascript:alert(1)'),undefined)
 assert.equal(lib.readJourney('{broken').length,0)
 assert.equal(lib.readJourney(JSON.stringify([{path:'https://evil.test',timestamp:'2026-01-01'}])).length,0)
 assert.equal(lib.readJourney(JSON.stringify([{path:'/products/a',timestamp:'2026-01-01',event:'page_view'}])).length,1)
})
test('contact clicks do not inflate observed page evidence', () => {
 const evidence = lib.leadEvidence({journey_json:JSON.stringify([{path:'/contact',timestamp:'2026-01-01',event:'contact_click'}])})
 assert.equal(evidence.length,0)
})
function api(role='sales', query=async()=>({results:[]})) {
 return load('src/app/(frontend)/api/admin/intelligence/route.ts', {
  'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200})}},
  '@/lib/admin-auth':{requireAdminSession:async(roles)=>roles&&!roles.includes(role)?{ok:false,status:403,error:'Forbidden'}:{ok:true,session:{id:'rep-1',role}}},
  '@/lib/d1':{d1Query:query, leadsDb:{getById:async()=>({id:'lead-1',assigned_to:'rep-2'})},leadNotesDb:{listByLeadId:async()=>[]},adminUsersDb:{list:async()=>[]}},
 })
}
test('sales cannot read or mutate another representative lead', async()=>{
 const handlers=api()
 assert.equal((await handlers.GET(new Request('https://test/api?id=lead-1'))).status,404)
 assert.equal((await handlers.POST(new Request('https://test/api',{method:'POST',body:JSON.stringify({id:'lead-1'})}))).status,403)
})
test('marketing assessments are read only',async()=>{
 assert.equal((await api('marketing').POST(new Request('https://test/api',{method:'POST',body:'{}'}))).status,403)
})
test('insight aggregation scopes sales in SQL, without a client page limit',async()=>{
 let captured='';let params=[]
 const handlers=api('sales',async(sql,args)=>{captured=sql;params=args;return{results:[]}})
 const result=await handlers.GET(new Request('https://test/api?view=insights'))
 assert.equal(result.status,200)
 assert.match(captured,/l.assigned_to = \?/)
 assert.match(captured,/GROUP BY/)
 assert.doesNotMatch(captured,/LIMIT/)
 assert.equal(params[0],'rep-1')
})
test('wholesale RFQ filter uses lead source in the directory query',async()=>{
 let statements=[]
 const handlers=api('admin',async(sql)=>{statements.push(sql);return{results:[]}})
 assert.equal((await handlers.GET(new Request('https://test/api?filter=wholesale_rfq'))).status,200)
 assert.ok(statements.some(sql=>sql.includes("l.source = 'wholesale_rfq'")))
})
test('analytics view returns aggregated sources, trends, stages and qualifications scoped in SQL', async () => {
 let statements = []
 const handlers = api('admin', async (sql) => {
  statements.push(sql)
  return { results: [] }
 })
 const res = await handlers.GET(new Request('https://test/api?view=analytics&dateRange=30d'))
 assert.equal(res.status, 200)
 const data = await res.json()
 assert.ok(Array.isArray(data.sources))
 assert.ok(Array.isArray(data.trends))
 assert.ok(Array.isArray(data.stages))
 assert.ok(Array.isArray(data.qualifications))
 assert.ok(Array.isArray(data.priorities))
 assert.ok(statements.some(s => s.includes('strftime')))
 assert.ok(statements.some(s => s.includes('l.status')))
})
test('assessment writes persist and reject a stale concurrent update', async () => {
 const fs=require('node:fs'), os=require('node:os'), path=require('node:path')
 const {execFileSync}=require('node:child_process')
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lead-assessment-'))
 const db=path.join(dir,'test.sqlite')
 function sql(query,params=[],script=false){return JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
if sys.argv[4]=='true':
 c.executescript(sys.argv[2]);rows=[]
else:
 rows=[dict(x) for x in c.execute(sys.argv[2],json.loads(sys.argv[3])).fetchall()]
c.commit();print(json.dumps({'results':rows}));c.close()`,db,query,JSON.stringify(params),String(script)],{encoding:'utf8'}))}
 try {
  sql('CREATE TABLE leads(id TEXT PRIMARY KEY); INSERT INTO leads VALUES ("lead-1");'+fs.readFileSync('migrations/0008_lead_intelligence.sql','utf8'),[],true)
  const handler=api('admin',async(q,args)=>sql(q,args))
  const payload={id:'lead-1',qualification:'qualified',priority:'high',reason:'Relevant product and supported destination',next_action:'Call',follow_up_at:null,assessment_version:0}
  const send=()=>handler.POST(new Request('https://test/api',{method:'POST',body:JSON.stringify(payload)}))
  assert.equal((await send()).status,200)
  assert.equal((await send()).status,409)
  payload.assessment_version=1;payload.priority='normal'
  assert.equal((await send()).status,200)
  assert.equal(sql('SELECT version FROM lead_assessments').results[0].version,2)
 } finally {fs.rmSync(dir,{recursive:true,force:true})}
})
test('new touch does not inherit an unrelated old campaign',()=>{
 const attribution=load('src/lib/attribution.ts')
 const value=attribution.mergeAttribution({utm_source:'google',utm_campaign:'old-campaign',first_touch_at:'2026-01-01'}, {utm_source:'partner.example',utm_medium:'referral'})
 assert.equal(value.utm_campaign,undefined)
 assert.equal(value.first_touch.utm_campaign,'old-campaign')
 assert.equal(value.last_touch.utm_source,'partner.example')
})
test('storage errors distinguish configuration, schema and connectivity without leaking details',()=>{
 const {leadStorageError}=load('src/lib/lead-storage-error.ts')
 assert.equal(leadStorageError({causeMessage:'D1 is not configured; persistent storage is required'}).code,'D1_NOT_CONFIGURED')
 assert.equal(leadStorageError({causeMessage:'no such table: lead_assessments'}).code,'LEAD_SCHEMA_MISSING')
 assert.equal(leadStorageError({causeMessage:'no such column: a.version'}).code,'LEAD_SCHEMA_MISSING')
 assert.equal(leadStorageError({causeMessage:'no such table: leads'}).code,'D1_SCHEMA_OUTDATED')
 assert.equal(leadStorageError({causeMessage:'fetch failed secret-token'}).code,'D1_UNAVAILABLE')
 assert.doesNotMatch(JSON.stringify(leadStorageError({causeMessage:'fetch failed secret-token'})),/secret-token/)
})
test('intelligence API identifies missing migration separately from connection failure',async()=>{
 const response=await api('admin',async()=>{throw {causeMessage:'no such table: lead_assessments'}}).GET(new Request('https://test/api?view=insights'))
 assert.equal(response.status,503)
 assert.equal((await response.json()).code,'LEAD_SCHEMA_MISSING')
})
