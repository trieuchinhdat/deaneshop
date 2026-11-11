const {test}=require('node:test')
const assert=require('node:assert/strict')
const {load}=require('./load-ts.cjs')
const fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const {execFileSync}=require('node:child_process')
test('directory merges email across sources, keeps anonymous records separate, paginates and enforces scope',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'customers-')),db=path.join(dir,'db.sqlite')
 function query(sql,params=[],script=false){return JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);c.row_factory=sqlite3.Row
if sys.argv[4]=='true':
 c.executescript(sys.argv[2]);rows=[]
else:
 rows=[dict(x) for x in c.execute(sys.argv[2],json.loads(sys.argv[3])).fetchall()]
c.commit();print(json.dumps({'results':rows}));c.close()`,db,sql,JSON.stringify(params),String(script)],{encoding:'utf8'}))}
 try{
 query(fs.readFileSync('migrations/0000_baseline.sql','utf8'),[],true)
 for(let i=0;i<105;i++)query('INSERT INTO leads(id,name,email,source,assigned_to) VALUES(?,?,?,?,?)',[`l${i}`,'Visitor',`person${i}@example.test`,'newsletter','rep2'])
 query("INSERT INTO leads(id,name,email,source,assigned_to) VALUES('a','Alice',' ALICE@example.test ','popup','rep1'),('b','Alice','alice@example.test','inquiry','rep2'),('c','Same name',NULL,'popup','rep1'),('d','Same name',NULL,'popup','rep1')")
 query("INSERT INTO comments(id,post_id,author_name,author_email,content) VALUES('cm','post','Alice','alice@example.test','Question')")
 query("INSERT INTO comments(id,post_id,author_name,author_email,content,is_author_reply) VALUES('staff','post','Staff','staff@example.test','Reply',1)")
 query("UPDATE leads SET name='Zelda',created_at='2025-01-01T00:00:00Z' WHERE id='a'")
 query("UPDATE leads SET name='Alice latest',created_at='2026-11-11T08:00:00Z' WHERE id='b'")
 query("UPDATE comments SET created_at='2026-01-01T00:00:00Z' WHERE id='cm'")
 const route=(role)=>load('src/app/(frontend)/api/admin/customer-directory/route.ts',{
 'next/server':{NextResponse:{json:(b,i)=>new Response(JSON.stringify(b),{status:i?.status||200})}},
 '@/lib/admin-auth':{requireAdminSession:async()=>({ok:true,session:{id:'rep1',role}})},
 '@/lib/d1':{d1Query:async(q,p)=>query(q,p)},
 })
 const get=async(role,params='')=>{const r=await route(role).GET(new Request('https://test/api?'+params));return{status:r.status,data:await r.json()}}
 let r=await get('admin');assert.equal(r.data.total,108);assert.equal(r.data.items.length,25)
 r=await get('admin','page=5');assert.equal(r.data.items.length,8)
 r=await get('admin','customer='+encodeURIComponent('email:alice@example.test'));assert.equal(r.data.items.length,3);assert.equal(r.data.customer.interactions,3);assert.equal(r.data.customer.name,'Alice latest')
 r=await get('sales','customer='+encodeURIComponent('email:alice@example.test'));assert.equal(r.data.items.length,1);assert.equal(r.data.items[0].id,'a')
 r=await get('sales','customer='+encodeURIComponent('email:person1@example.test'));assert.equal(r.status,404)
 r=await get('admin','search=Zelda');assert.equal(r.data.total,1);assert.equal(r.data.items[0].interactions,3)
 r=await get('admin','page=-1');assert.equal(r.status,400)
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})
