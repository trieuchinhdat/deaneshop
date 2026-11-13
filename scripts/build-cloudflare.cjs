// Load Next production env before OpenNext evaluates its cache configuration.
// Keep @next/env out of open-next.config.ts: that config is also bundled for Workers.
const path = require('node:path')
const { spawnSync } = require('node:child_process')
require('@next/env').loadEnvConfig(process.cwd(), false)
const root = path.resolve('node_modules/@opennextjs/cloudflare')
const metadata = require(path.join(root, 'package.json'))
const result = spawnSync(process.execPath, [path.join(root, metadata.bin['opennextjs-cloudflare']), 'build', ...process.argv.slice(2)], {
	stdio: 'inherit', env: process.env,
})
if (result.error) throw result.error
process.exitCode = result.status ?? 1
if (result.status === 0) require('./build-static-storefront.cjs').buildStaticStorefront()
