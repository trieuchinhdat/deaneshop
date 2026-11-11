const fs = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

const strictCi =
	process.argv.includes('--ci') ||
	process.env.CI === 'true' ||
	process.env.PERF_STRICT === '1'

function walkFiles(dir, result = []) {
	if (!fs.existsSync(dir)) return result
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) walkFiles(full, result)
		else result.push(full)
	}
	return result
}

const chunksDir = path.resolve('.next/static/chunks')
if (!fs.existsSync(chunksDir)) {
	if (strictCi) {
		console.error('FAIL: .next/static/chunks not built yet (CI / --ci requires npm run build first)')
		process.exit(1)
	}
	console.log('Skipping bundle check: .next/static/chunks not built yet (run npm run build first)')
	process.exit(0)
}

const jsFiles = walkFiles(chunksDir).filter((f) => f.endsWith('.js'))
if (jsFiles.length === 0) {
	console.error('FAIL: .next/static/chunks contains zero JS chunks')
	process.exit(1)
}

// Identify chunks referenced exclusively by /studio so Sanity Studio editor libraries
// do not skew storefront client JS budgets.
const studioExclusiveChunks = new Set()
const rlmPath = path.resolve('.next/react-loadable-manifest.json')
if (fs.existsSync(rlmPath)) {
	try {
		const rlm = JSON.parse(fs.readFileSync(rlmPath, 'utf8'))
		const studioSet = new Set()
		const nonStudioSet = new Set()
		for (const [key, entry] of Object.entries(rlm)) {
			const bucket = key.startsWith('app/(studio)/') ? studioSet : nonStudioSet
			for (const file of entry?.files || []) {
				if (typeof file === 'string' && file.endsWith('.js')) {
					bucket.add(path.basename(file))
				}
			}
		}
		for (const name of studioSet) {
			if (!nonStudioSet.has(name)) studioExclusiveChunks.add(name)
		}
	} catch {}
}

let rawBytes = 0
let gzipBytes = 0
const storefrontLargest = []

for (const file of jsFiles) {
	const buf = fs.readFileSync(file)
	const gz = zlib.gzipSync(buf).length
	rawBytes += buf.length
	gzipBytes += gz
	const rel = path.relative(chunksDir, file)
	if (!studioExclusiveChunks.has(path.basename(file))) {
		storefrontLargest.push({
			file: rel,
			rawKb: Math.round(buf.length / 1024),
			gzipKb: Math.round(gz / 1024),
		})
	}
}

storefrontLargest.sort((a, b) => b.gzipKb - a.gzipKb)

console.log(`Client JS chunks: ${jsFiles.length} total (${studioExclusiveChunks.size} Studio-only), raw ${(rawBytes / 1024).toFixed(1)} KB, gzip ${(gzipBytes / 1024).toFixed(1)} KB`)
console.log('Top 5 largest non-Studio chunks (gzip):', storefrontLargest.slice(0, 5))

const manifestPath = path.resolve('.next/build-manifest.json')
let rootMainFiles = []
if (fs.existsSync(manifestPath)) {
	try {
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
		rootMainFiles = Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : []
		let sharedGzipKb = 0
		for (const rel of rootMainFiles) {
			const abs = path.resolve('.next', rel)
			if (fs.existsSync(abs) && abs.endsWith('.js')) {
				sharedGzipKb += zlib.gzipSync(fs.readFileSync(abs)).length / 1024
			}
		}
		console.log(`Shared root client JS (${rootMainFiles.length} files): ${sharedGzipKb.toFixed(1)} KB gzip`)
		if (sharedGzipKb > 250) {
			console.error(`FAIL: Shared root client JS bundle (${sharedGzipKb.toFixed(1)} KB gzip) exceeds 250 KB budget`)
			process.exitCode = 1
		}
	} catch {}
}

// Per-route storefront JS budget check
const frontendAppDir = path.resolve('.next/server/app/(frontend)')
if (fs.existsSync(frontendAppDir)) {
	const routeManifests = walkFiles(frontendAppDir).filter((f) =>
		f.endsWith('page_client-reference-manifest.js'),
	)
	for (const mf of routeManifests) {
		const raw = fs.readFileSync(mf, 'utf8')
		const chunkRefs = new Set((raw.match(/static\/chunks\/[^"']+\.js/g) || []).concat(rootMainFiles))
		let routeGzKb = 0
		for (const rel of chunkRefs) {
			const abs = path.resolve('.next', rel)
			if (fs.existsSync(abs)) {
				routeGzKb += zlib.gzipSync(fs.readFileSync(abs)).length / 1024
			}
		}
		const routeName = '/' + (path.relative(frontendAppDir, path.dirname(mf)) || '')
		if (routeGzKb > 650) {
			console.error(`FAIL: Storefront route ${routeName} client JS (${routeGzKb.toFixed(1)} KB gzip) exceeds 650 KB budget`)
			process.exitCode = 1
		}
	}
	console.log(`Checked ${routeManifests.length} storefront route client manifests against 650 KB gzip budget`)
}

const maxStorefrontChunkKb = storefrontLargest[0]?.gzipKb ?? 0
if (maxStorefrontChunkKb > 250) {
	console.error(`FAIL: Largest non-Studio client JS chunk (${maxStorefrontChunkKb} KB gzip) exceeds 250 KB limit`)
	process.exitCode = 1
}

const openNextWorker = path.resolve('.open-next/worker.js')
if (fs.existsSync(openNextWorker)) {
	const handlerPath = path.resolve('.open-next/server-functions/default/handler.mjs')
	const target = fs.existsSync(handlerPath) ? handlerPath : openNextWorker
	const buf = fs.readFileSync(target)
	const gzMb = zlib.gzipSync(buf).length / (1024 * 1024)
	console.log(`Worker main server bundle (${path.basename(target)}): raw ${(buf.length / (1024 * 1024)).toFixed(2)} MB, gzip ${gzMb.toFixed(2)} MB`)

	const wranglerDryRunDir = path.resolve('.wrangler/dry-run')
	let uploadFiles = []
	if (fs.existsSync(wranglerDryRunDir)) {
		uploadFiles = walkFiles(wranglerDryRunDir).filter(
			(file) => !file.endsWith('.map') && path.basename(file) !== 'README.md',
		)
	} else {
		const candidatePaths = [
			openNextWorker,
			path.resolve('.open-next/middleware/handler.mjs'),
			handlerPath,
			...walkFiles(path.resolve('.open-next/cloudflare')),
			...walkFiles(path.resolve('.open-next/cloudflare-templates')),
		].filter((p) => fs.existsSync(p) && /\.(m?js|cjs|wasm|bin)$/i.test(p))
		uploadFiles = Array.from(new Set(candidatePaths))
	}

	let totalWorkerRaw = 0
	let totalWorkerGzip = 0
	for (const file of uploadFiles) {
		const content = fs.readFileSync(file)
		totalWorkerRaw += content.length
		totalWorkerGzip += zlib.gzipSync(content).length
	}
	const totalWorkerGzipKib = totalWorkerGzip / 1024
	const totalWorkerGzipMb = totalWorkerGzip / (1024 * 1024)
	console.log(
		`Worker upload payload (${uploadFiles.length} file(s)): raw ${(totalWorkerRaw / 1024).toFixed(2)} KiB, gzip ${totalWorkerGzipKib.toFixed(2)} KiB (${totalWorkerGzipMb.toFixed(2)} MiB)`,
	)

	if (gzMb > 8.5 || totalWorkerGzipKib > 10000) {
		console.error(
			`FAIL: Compressed Worker bundle (handler=${gzMb.toFixed(2)} MB, upload=${totalWorkerGzipKib.toFixed(2)} KiB) nears Cloudflare Workers 10 MiB (10240 KiB) paid limit`,
		)
		process.exitCode = 1
	}
}
