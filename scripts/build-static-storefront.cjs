const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawnSync } = require('node:child_process')
const ts = require('typescript')

const root = process.cwd()
const stage = path.join(root, '.static-storefront-build')
const assets = path.join(root, '.open-next/free-assets')
const runtimePrefixes = require('../shared/runtime-routes.json')

function files(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const file = path.join(dir, entry.name)
		return entry.isDirectory() ? files(file) : [file]
	})
}

function buildStaticStorefront() {
	if (process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE !== 'free') return
	fs.rmSync(stage, { recursive: true, force: true })
	fs.rmSync(assets, { recursive: true, force: true })
	fs.rmSync('wrangler.free.generated.json', { force: true })
	fs.rmSync('.open-next/free-static-manifest.json', { force: true })
	fs.mkdirSync(stage, { recursive: true })
	for (const name of ['src', 'shared', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) {
		fs.cpSync(path.join(root, name), path.join(stage, name), { recursive: true })
	}
	fs.symlinkSync(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), 'dir')
	// Isolate the official Next static export from all request-bound routes.
	for (const name of ['src/proxy.ts', 'src/app/(admin)', ...runtimePrefixes.map((prefix) => `src/app/(frontend)/${prefix}`)]) {
		fs.rmSync(path.join(stage, name), { recursive: true, force: true })
	}
	// Exclude preview's Server Actions from the static build dependency graph.
	fs.writeFileSync(path.join(stage, 'src/sanity/lib/live.ts'), "export { sanityFetchPublished as sanityFetchLive } from './published'\n")
	fs.writeFileSync(path.join(stage, 'src/ui/visual-editing.tsx'), 'export default function VisualEditingControls() { return null }\n')
	for (const file of files(path.join(stage, 'src/app')).filter((file) => /\.(ts|tsx)$/.test(file))) {
		let source = fs.readFileSync(file, 'utf8')
		source = source.replace(/^export const revalidate = [^\n]+\n/gm, '')
		source = source.replace(/^export const dynamic = [^\n]+\n/gm, '')
		if (/\/(?:route|sitemap|robots)\.tsx?$/.test(file)) source += "\nexport const dynamic = 'force-static'\n"
		if (source.includes('export async function generateStaticParams')) source += '\nexport const dynamicParams = false\n'
		fs.writeFileSync(file, source)
	}
	const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
		cwd: stage,
		stdio: 'inherit',
		env: { ...process.env, DEANFLOW_STATIC_EXPORT: '1' },
	})
	if (result.status !== 0) throw new Error('Public static export failed; deployment artifact is incomplete')
	const out = path.join(stage, 'out')
	for (const file of files(out)) {
		const relative = path.relative(out, file).split(path.sep).join('/')
		if (runtimePrefixes.some((prefix) => relative === `${prefix}.html` || relative === `${prefix}.txt` || relative.startsWith(`${prefix}/`))) {
			throw new Error(`Private/runtime route was included in static export: ${relative}`)
		}
	}
	// Keep Worker chunks and read-only OpenNext cache assets for private/runtime routes.
	fs.cpSync('.open-next/assets', assets, { recursive: true })
	for (const file of files(out)) {
		const target = path.join(assets, path.relative(out, file))
		if (fs.existsSync(target) && !fs.readFileSync(target).equals(fs.readFileSync(file))) {
			throw new Error(`Worker/static export asset collision: ${path.relative(out, file)}`)
		}
		fs.mkdirSync(path.dirname(target), { recursive: true })
		fs.copyFileSync(file, target)
	}
	const redirects = JSON.parse(fs.readFileSync('.next/routes-manifest.json', 'utf8')).redirects.filter((rule) => !rule.internal)
	const redirectLines = redirects.map((rule) => {
		if (rule.has?.length || rule.missing?.length || /[()*+?\\]/.test(rule.source) || /[\r\n\s]/.test(rule.source + rule.destination)) {
			throw new Error(`Redirect requires an explicit static mapping: ${rule.source}`)
		}
		return `${rule.source} ${rule.destination} ${rule.statusCode}`
	})
	if (redirectLines.length) fs.appendFileSync(path.join(assets, '_redirects'), '\n' + redirectLines.join('\n') + '\n')
	fs.appendFileSync(path.join(assets, '_headers'), '\n/_next/static/*\n  Cache-Control: public,max-age=31536000,immutable\n')
	const raw = fs.readFileSync('wrangler.jsonc', 'utf8')
	const parsed = ts.parseConfigFileTextToJson('wrangler.jsonc', raw)
	if (parsed.error) throw new Error('Invalid Wrangler config')
	const config = parsed.config
	config.main = './worker-free.ts'
	config.assets = {
		directory: '.open-next/free-assets', binding: 'ASSETS',
		html_handling: 'drop-trailing-slash', not_found_handling: '404-page',
		run_worker_first: runtimePrefixes.flatMap((prefix) => [`/${prefix}`, `/${prefix}/*`]),
	}
	fs.writeFileSync('wrangler.free.generated.json', JSON.stringify(config, null, 2) + '\n')
	const html = files(out).filter((file) => file.endsWith('.html')).map((file) => path.relative(out, file))
	fs.writeFileSync('.open-next/free-static-manifest.json', JSON.stringify({
		version: 1, html, runtimePrefixes,
		workerBuildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim(),
		configHash: crypto.createHash('sha256').update(raw).digest('hex'),
		generatedConfigHash: crypto.createHash('sha256').update(fs.readFileSync('wrangler.free.generated.json')).digest('hex'),
	}) + '\n')
	console.log(`Static storefront ready: ${html.length} HTML files; API/admin/private routes remain on Worker`)
}

module.exports = { buildStaticStorefront }
if (require.main === module) {
	require('@next/env').loadEnvConfig(root, false)
	buildStaticStorefront()
}
