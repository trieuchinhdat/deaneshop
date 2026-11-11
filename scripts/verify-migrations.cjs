const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const REQUIRED_TABLES = [
	'leads',
	'admin_users',
	'orders',
	'reviews',
	'comments',
	'request_limits',
	'quote_access',
	'quote_versions',
	'quote_events',
	'outbox',
	'admin_events',
	'order_payments',
	'order_notes',
	'lead_notes',
	'lead_assessments',
	'import_batches',
]

const REQUIRED_TRIGGERS = [
	'record_quote_transition',
	'order_committed',
	'order_changed',
	'lead_committed',
	'lead_changed',
	'issued_quote_snapshot',
	'quote_snapshot_immutable_update',
	'quote_snapshot_immutable_delete',
	'order_email_job',
	'quote_email_job',
	'lock_issued_commercial_terms',
	'lock_approved_quote',
	'lead_notify_job',
	'lead_dossier_job',
	'validate_order_financials_insert',
	'validate_order_financials_update',
	'prevent_last_superadmin_demotion',
	'prevent_last_superadmin_delete',
	'prevent_ineligible_order_soft_delete',
	'prevent_deleted_order_mutation',
	'cleanup_soft_deleted_order',
	'wholesale_rfq_to_lead',
	'wholesale_rfq_lead_priority',
]

const pyInspect = `
import json, sqlite3, sys
db_path = sys.argv[1]
script = sys.stdin.read()
conn = sqlite3.connect(db_path)
conn.executescript(script)
conn.execute('SELECT submission_key, submission_hash, submission_result, dossier_payload FROM leads LIMIT 0')
conn.execute('SELECT lead_id FROM wholesale_rfq_lead_projection LIMIT 0')
assert any(r[1] == 'idx_leads_submission_key' and r[2] == 1 for r in conn.execute('PRAGMA index_list(leads)')), 'Unique lead submission index missing'
conn.commit()
rows = conn.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'trigger')").fetchall()
conn.close()
print(json.dumps({"tables": [r[1] for r in rows if r[0] == 'table'], "triggers": [r[1] for r in rows if r[0] == 'trigger']}))
`

function verifyScript(label, sqlScript) {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deanflow-mig-'))
	const dbPath = path.join(tmpDir, 'verify.sqlite')
	try {
		const out = execFileSync('python3', ['-c', pyInspect, dbPath], {
			input: sqlScript,
			encoding: 'utf8',
		})
		const { tables, triggers } = JSON.parse(out)
		const missingTables = REQUIRED_TABLES.filter((t) => !tables.includes(t))
		const missingTriggers = REQUIRED_TRIGGERS.filter((t) => !triggers.includes(t))
		if (missingTables.length || missingTriggers.length) {
			throw new Error(
				`${label}: missing tables=[${missingTables.join(',')}], missing triggers=[${missingTriggers.join(',')}]`,
			)
		}
		console.log(`PASS ${label}: ${tables.length} tables, ${triggers.length} triggers verified`)
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	}
}

const migrationFiles = fs
	.readdirSync('migrations')
	.filter((f) => f.endsWith('.sql'))
	.sort()

if (!migrationFiles.includes('0000_baseline.sql')) {
	throw new Error('migrations/0000_baseline.sql is required for fresh D1 provisioning')
}

const migrationsSql = migrationFiles
	.map((f) => `-- ${f}\n${fs.readFileSync(path.join('migrations', f), 'utf8')}`)
	.join('\n')

// 1. Verify fresh empty D1 migration path (`wrangler d1 migrations apply` behavior)
verifyScript('fresh-d1-migrations', migrationsSql)

// 2. Verify idempotent baseline + incremental migration path (`schema.sql` followed by `0001+`)
const incrementalSql =
	fs.readFileSync('schema.sql', 'utf8') +
	'\n' +
	migrationFiles
		.filter((f) => f !== '0000_baseline.sql')
		.map((f) => `-- ${f}\n${fs.readFileSync(path.join('migrations', f), 'utf8')}`)
		.join('\n')
verifyScript('schema-plus-incremental', incrementalSql)

