for (const key of [
	'SANITY_AUTH_TOKEN',
	'SANITY_STUDIO_PROJECT_ID',
	'SANITY_STUDIO_DATASET',
	'SANITY_STUDIO_HOST',
	'SANITY_STUDIO_WEB_URL',
]) {
	if (!process.env[key]) throw new Error(`Missing ${key}`)
}
const web = new URL(process.env.SANITY_STUDIO_WEB_URL)
if (
	web.protocol !== 'https:' ||
	web.username ||
	web.password ||
	web.pathname !== '/' ||
	web.search ||
	web.hash
)
	throw new Error('SANITY_STUDIO_WEB_URL must be an HTTPS website origin')
if (!/^[a-z0-9-]+$/.test(process.env.SANITY_STUDIO_HOST))
	throw new Error('Invalid SANITY_STUDIO_HOST')
