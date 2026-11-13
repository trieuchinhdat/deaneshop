const fs = require('node:fs')
const path = require('node:path')

function walkTsFiles(dir, result = []) {
	if (!fs.existsSync(dir)) return result
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) walkTsFiles(full, result)
		else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) result.push(full)
	}
	return result
}

const checks = [
	['src/lib/admin-auth.ts', /DEFAULT_ADMIN_(SECRET|PASSWORD)|verifyAdminCredentials/, 'Default admin credentials are forbidden'],
	['src/app/(frontend)/api/orders/create/route.ts', /fetch\(webhookUrl|webhook_url:\s*webhookUrl/, 'Public webhook destination is forbidden'],
	['src/ui/modules/cart-checkout/cart-checkout-client.tsx', /webhookUrl:\s*webhookUrl/, 'Checkout client must not transmit webhookUrl'],
	['src/ui/modules/custom-html/sandboxed-frame.tsx', /allow-same-origin/, 'Scriptable srcdoc must not have same-origin privileges'],
	['src/app/(frontend)/api/admin/auth/sanity-verify/route.ts', /sanityUser|req\.json\(|request\.json\(|getByEmail/, 'Sanity exchange must not trust client profiles or bypass verified identity with direct email lookup'],
	['src/lib/dossier-email.ts', /simulated_fallback|simulated_no_api_key/, 'Simulated email delivery must not report success'],
	['src/sanity/lib/live.ts', /^['"]use server['"]/m, 'src/sanity/lib/live.ts must never expose a Server Action directive'],
	['src/ui/modules/compliance-vault/index.tsx', /DEFAULT_CERTS|DEFAULT_DOCS/, 'Compliance Vault must not invent fake fallback certifications'],
]

let failed = false
for (const [file, pattern, message] of checks) {
	const full = path.resolve(file)
	if (!fs.existsSync(full)) {
		console.error(`${file}: Missing file required by security check`)
		failed = true
		continue
	}
	if (pattern.test(fs.readFileSync(full, 'utf8'))) {
		console.error(`${file}: ${message}`)
		failed = true
	}
}

const srcFiles = walkTsFiles(path.resolve('src'))
for (const full of srcFiles) {
	const rel = path.relative(process.cwd(), full)
	const content = fs.readFileSync(full, 'utf8')

	// Client components must never import server-only sanity/lib/live or the modules resolver barrel
	if (/^['"]use client['"]/m.test(content)) {
		if (/@\/sanity\/lib\/live/.test(content)) {
			console.error(`${rel}: Client components must not import @/sanity/lib/live`)
			failed = true
		}
		if (rel.startsWith('src/ui/modules/') && /from\s+['"](?:\.\.?|@\/ui\/modules)['"]/.test(content)) {
			console.error(`${rel}: Client module components must import moduleAttributes from '../module-utils', not the server barrel`)
			failed = true
		}
	}

	// JSON-LD scripts must use serializeJsonLd (or explicit < escaping)
	if (/application\/ld\+json/.test(content) && /dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify\(/.test(content)) {
		console.error(`${rel}: JSON-LD <script> must use serializeJsonLd() instead of raw JSON.stringify()`)
		failed = true
	}

	// Storefront / queries must not read reviews from Sanity (unified on D1)
	if (
		(rel.startsWith('src/app/(frontend)/') || rel.startsWith('src/ui/') || rel === 'src/sanity/lib/queries.ts') &&
		/\*\[_type\s*==\s*['"]review['"]/.test(content)
	) {
		console.error(`${rel}: Product reviews must be queried from Cloudflare D1, not Sanity`)
		failed = true
	}
}

if (failed) process.exitCode = 1
else console.log(`Security regression lint passed (${checks.length} targeted + ${srcFiles.length} scanned files)`)
