const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
require('@next/env').loadEnvConfig(process.cwd(), false)
const [command, ...args] = process.argv.slice(2)
if (!['deploy', 'preview', 'dry-run'].includes(command)) throw new Error('Unknown Cloudflare command')
const artifact = JSON.parse(fs.readFileSync('.open-next/deployment-profile.json', 'utf8'))
const profile = process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE || artifact.profile
if (artifact.profile !== profile) throw new Error('Deployment profile changed; rebuild first')
// Wrangler leaves files from earlier entrypoints in outdir; measure one upload only.
if (command === 'dry-run') fs.rmSync('.wrangler/dry-run', { recursive: true, force: true })
let executable, parameters
if (profile === 'free') {
	if (!artifact.staticStorefront || !fs.existsSync('.open-next/free-static-manifest.json')) throw new Error('Missing static storefront; rebuild first')
	require('./verify-static-storefront.cjs').verifyStaticStorefront()
	executable = path.resolve('node_modules/wrangler/bin/wrangler.js')
	parameters = [command === 'preview' ? 'dev' : 'deploy', '--config', 'wrangler.free.generated.json', ...(command === 'dry-run' ? ['--dry-run', '--outdir=.wrangler/dry-run'] : []), ...args]
} else if (command === 'dry-run') {
	executable = path.resolve('node_modules/wrangler/bin/wrangler.js')
	parameters = ['deploy', '--dry-run', '--outdir=.wrangler/dry-run', ...args]
} else {
	const root = path.resolve('node_modules/@opennextjs/cloudflare')
	executable = path.join(root, require(path.join(root, 'package.json')).bin['opennextjs-cloudflare'])
	parameters = [command, ...args]
}
const result = spawnSync(process.execPath, [executable, ...parameters], {
	stdio: 'inherit', env: { ...process.env, OPEN_NEXT_DEPLOY: 'true' },
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
