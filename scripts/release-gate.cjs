const fs = require('node:fs')
const path = require('node:path')

const strictProd = process.argv.includes('--env=production')
if (strictProd) require('@next/env').loadEnvConfig(process.cwd(), false)
const failures = []
const warnings = []
const profile = process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE || 'standard'
if (!['standard', 'free'].includes(profile)) failures.push('NEXT_PUBLIC_DEPLOYMENT_PROFILE must be standard or free')

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
	'0011_sanity_staff_identity.sql',
	'0012_sanity_staff_invitations.sql',
	'0013_remove_sanity_staff_invitations.sql',
	'0014_sanity_login_bridge.sql',
	'0015_customer_directory_indexes.sql',
	'0016_order_tracking_and_rfq_attribution.sql',
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
	const parsedConfig = wranglerRaw && require('typescript').parseConfigFileTextToJson('wrangler.jsonc', wranglerRaw)
	if (parsedConfig?.error) failures.push('Cannot parse wrangler.jsonc')
	const runtimeProfile = parsedConfig?.config?.vars?.NEXT_PUBLIC_DEPLOYMENT_PROFILE || 'standard'
	if (runtimeProfile !== profile) failures.push('Build environment and wrangler vars must use the same NEXT_PUBLIC_DEPLOYMENT_PROFILE')
	const authMode = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE || 'password'
	if (authMode === 'sanity') {
		const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL
		let studio
		try { studio = new URL(studioUrl) } catch {}
		if (!studio || studio.protocol !== 'https:' || studio.username || studio.password || studio.pathname !== '/' || studio.search || studio.hash) {
			failures.push('NEXT_PUBLIC_SANITY_STUDIO_URL must be an HTTPS origin for standalone Studio')
		}
		if (studio) {
			for (const value of [process.env.NEXT_PUBLIC_BASE_URL, parsedConfig?.config?.vars?.NEXT_PUBLIC_BASE_URL]) {
				try { if (value && new URL(value).origin === studio.origin) failures.push('Studio and website must use different origins') } catch {}
			}
		}
		for (const value of [process.env.SANITY_STUDIO_ORIGIN, parsedConfig?.config?.vars?.SANITY_STUDIO_ORIGIN, parsedConfig?.config?.vars?.NEXT_PUBLIC_SANITY_STUDIO_URL]) {
			if (!value || !studio || value.replace(/\/+$/, '') !== studio.origin) failures.push('Studio URL and SANITY_STUDIO_ORIGIN must match in build env and Wrangler')
		}
	}
	if (!['password', 'sanity'].includes(authMode) || (parsedConfig?.config?.vars?.NEXT_PUBLIC_ADMIN_AUTH_MODE || 'password') !== authMode) failures.push('NEXT_PUBLIC_ADMIN_AUTH_MODE must be password or sanity and match wrangler vars')
	if (process.argv.includes('--artifact')) {
		const artifact = '.open-next/deployment-profile.json'
		try {
			const built = JSON.parse(fs.readFileSync(artifact, 'utf8'))
			if (built.profile !== profile) failures.push('Build artifact has a different deployment profile; rebuild before deploying')
			if (built.adminAuthMode !== authMode) failures.push('Build artifact has a different admin authentication mode; rebuild before deploying')
			if (profile === 'free') {
				if (!built.staticStorefront) failures.push('Free deployment requires direct static storefront assets; rebuild')
				try { require('./verify-static-storefront.cjs').verifyStaticStorefront() } catch (error) { failures.push(error.message) }
			}
			if (authMode === 'sanity' && built.studioUrl !== (process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '').replace(/\/+$/, '')) failures.push('Build artifact has a different Studio URL; rebuild before deploying')
		} catch {
			failures.push('Missing/invalid build profile artifact; run npm run build:cf before deploying')
		}
	}
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

