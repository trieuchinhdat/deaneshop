// Offline: read a JSON array of exported admin_users from stdin; emit SQL to stdout.
// Review/apply the generated SQL through your authenticated DB administration channel.
const { hash } = require('bcryptjs')
async function main() {
 let input=''; for await (const chunk of process.stdin) input+=chunk
 const rows=JSON.parse(input)
 if(!Array.isArray(rows))throw new Error('Expected exported admin_users array')
 const quote=s=>"'"+String(s).replaceAll("'","''")+"'"
 const statements=[]
 for(const row of rows){
  if(typeof row.id!=='string'||typeof row.password_hash!=='string')throw new Error('Invalid staff row')
  if(/^\$2[aby]\$\d{2}\$/.test(row.password_hash))continue
  if(Buffer.byteLength(row.password_hash)>72)throw new Error('Legacy password exceeds bcrypt byte limit; reset this account')
  const hashed=await hash(row.password_hash,12)
  // Compare-and-swap avoids overwriting a password changed after export.
  statements.push(`UPDATE admin_users SET password_hash=${quote(hashed)}, updated_at=CURRENT_TIMESTAMP WHERE id=${quote(row.id)} AND password_hash=${quote(row.password_hash)};`)
 }
 process.stdout.write('BEGIN TRANSACTION;\n'+statements.join('\n')+'\nCOMMIT;\n')
}
main().catch(()=>{console.error('Migration preparation failed. Check the input shape and password lengths. No SQL was emitted.');process.exitCode=1})
