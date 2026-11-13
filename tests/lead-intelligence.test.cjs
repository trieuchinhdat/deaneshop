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
 assert.ok(Array.isArray(data.urgentItems))
 assert.ok(Array.isArray(data.followupItems))
 assert.equal(typeof data.total, 'number')
 assert.ok(statements.some(s => s.includes('strftime')))
 assert.ok(statements.some(s => s.includes('l.status')))
})
test('utmSource filter handles both known sources and unattributed __unknown__ leads', async () => {
 let statements = []
 let bound = []
 const handlers = api('admin', async (sql, args) => {
  statements.push(sql)
  if (args) bound.push(args)
  return { results: [] }
 })
 assert.equal((await handlers.GET(new Request('https://test/api?utmSource=__unknown__'))).status, 200)
 assert.ok(statements.some(s => s.includes("l.utm_source IS NULL OR TRIM(l.utm_source) = ''")))
 statements = []
 assert.equal((await handlers.GET(new Request('https://test/api?utmSource=google'))).status, 200)
 assert.ok(statements.some(s => s.includes('LOWER(TRIM(l.utm_source)) = LOWER(TRIM(?))')))
 assert.ok(bound.some(a => a.includes('google')))
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
test('events cursor check distinguishes NEW_LEAD vs LEAD_UPDATED, scopes sales, resets stale cursor, and sets no-store', async () => {
 const fs=require('node:fs'), os=require('node:os'), path=require('node:path')
 const {execFileSync}=require('node:child_process')
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lead-events-'))
 const db=path.join(dir,'test.sqlite')
 function sql(query,params=[],script=false){return JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
if sys.argv[4]=='true':
 c.executescript(sys.argv[2]);rows=[]
else:
 rows=[dict(x) for x in c.execute(sys.argv[2],json.loads(sys.argv[3])).fetchall()]
c.commit();print(json.dumps({'results':rows}));c.close()`,db,query,JSON.stringify(params),String(script)],{encoding:'utf8'}))}
 const makeApi=(role,id='rep-1')=>load('src/app/(frontend)/api/admin/intelligence/route.ts',{
  'next/server':{NextResponse:{json:(body,init)=>new Response(JSON.stringify(body),{status:init?.status||200,headers:init?.headers})}},
  '@/lib/admin-auth':{requireAdminSession:async()=>({ok:true,session:{id,role}})},
  '@/lib/d1':{d1Query:(q,args)=>Promise.resolve(sql(q,args)),leadsDb:{getById:async()=>null},leadNotesDb:{listByLeadId:async()=>[]},adminUsersDb:{list:async()=>[]}},
 })
 try {
  sql(`
   CREATE TABLE leads(id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, company_name TEXT, assigned_to TEXT, source TEXT, status TEXT, created_at TEXT, updated_at TEXT);
   CREATE TABLE admin_events(id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, resource_id TEXT NOT NULL, created_at TEXT NOT NULL);
   ${fs.readFileSync('migrations/0008_lead_intelligence.sql','utf8')}
   CREATE TRIGGER lead_committed AFTER INSERT ON leads BEGIN
    INSERT INTO admin_events(type,resource_id,created_at) VALUES('NEW_LEAD',NEW.id,NEW.created_at);
   END;
   CREATE TRIGGER lead_changed AFTER UPDATE ON leads BEGIN
    INSERT INTO admin_events(type,resource_id,created_at) VALUES('LEAD_UPDATED',NEW.id,NEW.updated_at);
   END;
   INSERT INTO leads VALUES ('lead-1','Alice','a@b.test','123','Acme','rep-1','landing_page','new','2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
  `,[],true)

  const adminApi=makeApi('admin','admin-1')
  const salesApi=makeApi('sales','rep-1')
  const salesTwoApi=makeApi('sales','rep-2')

  // Invalid after cursor
  const badRes=await adminApi.GET(new Request('https://test/api?view=events&after=-5'))
  assert.equal(badRes.status,400)
  assert.equal(badRes.headers.get('cache-control'),'no-store')

  // Initial cursor load without after
  const initRes=await adminApi.GET(new Request('https://test/api?view=events'))
  assert.equal(initRes.status,200)
  assert.equal(initRes.headers.get('cache-control'),'no-store')
  const initData=await initRes.json()
  assert.equal(initData.latestEventId,1)
  assert.equal(initData.hasNewLead,false)
  assert.equal(initData.hasLeadUpdated,false)

  // List view also returns latestEventId and no-store
  const listRes=await adminApi.GET(new Request('https://test/api?view=leads&page=1'))
  assert.equal(listRes.status,200)
  assert.equal(listRes.headers.get('cache-control'),'no-store')
  assert.equal((await listRes.json()).latestEventId,1)

  // Stale cursor > maxId resets safely
  const resetRes=await adminApi.GET(new Request('https://test/api?view=events&after=999'))
  const resetData=await resetRes.json()
  assert.equal(resetData.latestEventId,1)
  assert.equal(resetData.cursorReset,true)
  assert.equal(resetData.hasNewLead,false)

  // Non-lead event advances cursor without triggering lead reload
  sql(`INSERT INTO admin_events(type,resource_id,created_at) VALUES('NEW_ORDER','ord-1','2026-01-01T00:01:00Z')`)
  const orderOnly=await (await adminApi.GET(new Request('https://test/api?view=events&after=1'))).json()
  assert.equal(orderOnly.latestEventId,2)
  assert.equal(orderOnly.hasNewLead,false)
  assert.equal(orderOnly.hasLeadUpdated,false)

  // Updating lead triggers LEAD_UPDATED (not NEW_LEAD)
  sql(`UPDATE leads SET status='contacted', updated_at='2026-01-01T00:02:00Z' WHERE id='lead-1'`)
  const updatedAdmin=await (await adminApi.GET(new Request('https://test/api?view=events&after=2'))).json()
  assert.equal(updatedAdmin.latestEventId,3)
  assert.equal(updatedAdmin.hasNewLead,false)
  assert.equal(updatedAdmin.hasLeadUpdated,true)

  // rep-2 does NOT see rep-1's lead update, but its cursor still advances
  const updatedSalesTwo=await (await salesTwoApi.GET(new Request('https://test/api?view=events&after=2'))).json()
  assert.equal(updatedSalesTwo.latestEventId,3)
  assert.equal(updatedSalesTwo.hasNewLead,false)
  assert.equal(updatedSalesTwo.hasLeadUpdated,false)

  // New lead assigned to rep-2: admin and rep-2 see NEW_LEAD, sales rep-1 does not
  sql(`INSERT INTO leads VALUES ('lead-2','Bob','b@b.test','456','Beta','rep-2','landing_page','new','2026-01-01T00:03:00Z','2026-01-01T00:03:00Z')`)
  const newAdmin=await (await adminApi.GET(new Request('https://test/api?view=events&after=3'))).json()
  assert.equal(newAdmin.latestEventId,4)
  assert.equal(newAdmin.hasNewLead,true)
  const newSalesTwo=await (await salesTwoApi.GET(new Request('https://test/api?view=events&after=3'))).json()
  assert.equal(newSalesTwo.latestEventId,4)
  assert.equal(newSalesTwo.hasNewLead,true)
  const newSales=await (await salesApi.GET(new Request('https://test/api?view=events&after=3'))).json()
  assert.equal(newSales.latestEventId,4)
  assert.equal(newSales.hasNewLead,false)
  assert.equal(newSales.hasLeadUpdated,false)
 } finally {fs.rmSync(dir,{recursive:true,force:true})}
})
