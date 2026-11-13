const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function verifyStaticStorefront(root = process.cwd()) {
	const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
	const hash = (file) => crypto.createHash('sha256').update(read(file)).digest('hex')
	const manifest = JSON.parse(read('.open-next/free-static-manifest.json'))
	if (manifest.version !== 1 || !manifest.html.includes('index.html') || !manifest.html.includes('404.html')) throw new Error('Invalid static storefront manifest')
	if (manifest.configHash !== hash('wrangler.jsonc') || manifest.generatedConfigHash !== hash('wrangler.free.generated.json')) throw new Error('Wrangler configuration changed; rebuild the static storefront')
	if (manifest.workerBuildId !== read('.next/BUILD_ID').trim()) throw new Error('Worker and static storefront builds differ; rebuild')
	for (const file of manifest.html) {
		if (file.includes('..') || path.isAbsolute(file) || /^(?:api|admin|quote|order-success|studio)(?:[/.]|$)/.test(file)) throw new Error('Private or invalid static HTML path')
		if (!fs.existsSync(path.join(root, '.open-next/free-assets', file))) throw new Error(`Missing static HTML: ${file}`)
		if (file !== '404.html' && !fs.existsSync(path.join(root, '.open-next/free-assets', file.replace(/\.html$/, '.txt')))) throw new Error(`Missing static navigation payload: ${file}`)
	}
	return manifest
}

module.exports = { verifyStaticStorefront }
if (require.main === module) {
	const manifest = verifyStaticStorefront()
	console.log(`Static storefront verified: ${manifest.html.length} HTML files with navigation payloads`)
}
