const fs = require('node:fs')
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), false)

const profile = process.env.NEXT_PUBLIC_DEPLOYMENT_PROFILE || 'standard'
const adminAuthMode = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE || 'password'
const studioUrl = (process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'https://deanflow.sanity.studio').replace(/\/+$/, '')
const staticStorefront = profile === 'free'
if (staticStorefront && !fs.existsSync('.open-next/free-static-manifest.json'))
	throw new Error('Missing public static export; rebuild before deploying Free')
if (!['standard', 'free'].includes(profile))
	throw new Error('Unknown deployment profile')
fs.writeFileSync(
	'.open-next/deployment-profile.json',
	JSON.stringify({ profile, adminAuthMode, studioUrl, staticStorefront }) + '\n',
)
console.log(`Recorded build profile: ${profile}`)
