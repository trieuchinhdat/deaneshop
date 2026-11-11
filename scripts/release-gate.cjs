const fs = require('node:fs')
const path = require('node:path')

const strictProd = process.argv.includes('--env=production')
if (strictProd) require('@next/env').loadEnvConfig(process.cwd(), false)
const failures = []
const warnings = []

function mustExist(relPath, description) {
	if (!fs.existsSync(path.resolve(relPath))) {
		failures.push(`Missing required file ${relPath} (${description})`)
		return null
	}
	return fs.readFileSync(path.resolve(relPath), 'utf8')
}

const wranglerRaw = mustExist('wrangler.jsonc', 'Cloudflare Workers deployment config')
mustExist('open-next.config.ts', 'OpenNext Cloudflare adapter config')
mustExist('worker.ts', 'Custom Worker entrypoint with scheduled outbox trigger')
mustExist('src/app/(frontend)/api/health/route.ts', 'Public D1 readiness health endpoint')
mustExist('src/app/(frontend)/api/admin/health/route.ts', 'Admin schema & outbox health endpoint')
mustExist('scripts/d1-backup.sh', 'D1 backup script')
mustExist('scripts/d1-restore.sh', 'D1 restore script')

for (const mig of [
	'0000_baseline.sql',
	'0001_security.sql',
	'0002_commerce.sql',
	'0003_leads.sql',
	'0004_quote_versions.sql',
	'0005_delivery.sql',
	'0006_domain_integrity.sql',
	'0007_order_soft_delete.sql',
	'0008_lead_intelligence.sql',
	'0009_wholesale_rfq_leads.sql',
	'0010_lead_delivery_and_submissions.sql',
]) {
	mustExist(path.join('migrations', mig), 'D1 SQL migration')
}

if (wranglerRaw) {
	if (!/"binding"\s*:\s*"DB"/.test(wranglerRaw)) {
		failures.push('wrangler.jsonc must declare d1_databases binding "DB"')
	}
	if (!/"nodejs_compat"/.test(wranglerRaw)) {
		failures.push('wrangler.jsonc must enable "nodejs_compat" compatibility flag')
	}
	if (!/"D1_ALLOW_MEMORY"\s*:\s*"false"/.test(wranglerRaw)) {
		failures.push('wrangler.jsonc vars.D1_ALLOW_MEMORY must be "false"')
	}
	if (!/"ALLOW_TRUSTED_CUSTOM_HTML"\s*:\s*"false"/.test(wranglerRaw)) {
		failures.push('wrangler.jsonc vars.ALLOW_TRUSTED_CUSTOM_HTML must be "false"')
	}
	if (/"database_id"\s*:\s*"00000000-0000-0000-0000-000000000000"/.test(wranglerRaw)) {
		const msg = 'wrangler.jsonc d1_databases[0].database_id is still placeholder 00000000-0000-0000-0000-000000000000'
		if (strictProd) failures.push(msg)
		else warnings.push(msg)
	}
}

const d1Code = mustExist('src/lib/d1.ts', 'D1 repository')
if (d1Code) {
	if (!/getD1Binding/.test(d1Code)) {
		failures.push('src/lib/d1.ts must resolve Cloudflare Worker DB binding via getD1Binding()')
	}
	if (!/nodeEnv === 'production'/.test(d1Code)) {
		failures.push('src/lib/d1.ts must forbid in-memory fallback when NODE_ENV=production')
	}
}

const checkoutClient = mustExist('src/ui/modules/cart-checkout/cart-checkout-client.tsx', 'Checkout client')
if (checkoutClient && /webhookUrl:\s*webhookUrl/.test(checkoutClient)) {
	failures.push('cart-checkout-client.tsx must not transmit webhookUrl in public checkout payload')
}

if (strictProd) {
	const secret = process.env.ADMIN_JWT_SECRET || ''
	if (Buffer.byteLength(secret) < 32) {
		failures.push('ADMIN_JWT_SECRET must be at least 32 bytes in production')
	}
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
	let validBaseUrl = false
	try {
		const parsed = new URL(baseUrl)
		validBaseUrl = parsed.protocol === 'https:' && !parsed.username && !parsed.password &&
			!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) &&
			parsed.pathname === '/' && !parsed.search && !parsed.hash
	} catch {}
	if (!validBaseUrl) {
		failures.push('NEXT_PUBLIC_BASE_URL must be an https:// URL in production')
	}
	if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
		failures.push('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are required')
	}
}

if (warnings.length) {
	for (const w of warnings) console.warn(`WARN: ${w}`)
}

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`)
	process.exitCode = 1
} else {
	console.log(`Release gate passed (${strictProd ? 'production strict' : 'repository & CI check'})`)
}

