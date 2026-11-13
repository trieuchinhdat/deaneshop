// Run on a Node.js host with sufficient CPU, behind an HTTPS reverse proxy.
// This service never accesses D1, knows staff roles, or creates application sessions.
const http = require('node:http')
const { timingSafeEqual } = require('node:crypto')
const { hash, compare } = require('bcryptjs')

const json = (status, body) => ({ status, body })

function createHandler({
	token,
	maximumConcurrency = 2,
	bcrypt = { hash, compare },
}) {
	if (typeof token !== 'string' || Buffer.byteLength(token) < 32)
		throw new Error('PASSWORD_SERVICE_TOKEN requires at least 32 bytes')
	let active = 0
	return async (request) => {
		const headers = {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			'X-Content-Type-Options': 'nosniff',
		}
		const finish = ({ status, body }) =>
			new Response(JSON.stringify(body), { status, headers })
		const supplied = request.headers.get('authorization') || ''
		const expected = `Bearer ${token}`
		if (
			Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
			!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
		)
			return finish(json(401, { error: 'Unauthorized' }))
		const path = new URL(request.url).pathname
		if (request.method !== 'POST' || !['/v1/hash', '/v1/verify'].includes(path))
			return finish(json(404, { error: 'Not found' }))
		if (active >= maximumConcurrency)
			return finish(json(503, { error: 'Service busy' }))
		active++
		try {
			if (!request.headers.get('content-type')?.includes('application/json'))
				return finish(json(415, { error: 'Expected JSON' }))
			const reader = request.body?.getReader()
			if (!reader) return finish(json(400, { error: 'Invalid payload' }))
			const parts = []
			let length = 0
			try {
				while (true) {
					const chunk = await reader.read()
					if (chunk.done) break
					length += chunk.value.byteLength
					if (length > 4096)
						return finish(json(413, { error: 'Payload too large' }))
					parts.push(chunk.value)
				}
			} finally {
				await reader.cancel().catch(() => {})
			}
			let body
			try {
				body = JSON.parse(Buffer.concat(parts).toString('utf8'))
			} catch {
				return finish(json(400, { error: 'Invalid JSON' }))
			}
			if (
				!body ||
				typeof body.password !== 'string' ||
				Buffer.byteLength(body.password) > 72
			)
				return finish(json(400, { error: 'Invalid password' }))
			if (path === '/v1/hash') {
				if (body.password.length < 12)
					return finish(json(400, { error: 'Password too short' }))
				return finish(json(200, { hash: await bcrypt.hash(body.password, 12) }))
			}
			if (
				typeof body.hash !== 'string' ||
				!/^\$2[aby]\$(0[4-9]|1[0-4])\$[./A-Za-z0-9]{53}$/.test(body.hash)
			)
				return finish(json(400, { error: 'Unsupported hash' }))
			return finish(
				json(200, { verified: await bcrypt.compare(body.password, body.hash) }),
			)
		} catch {
			return finish(json(503, { error: 'Password service unavailable' }))
		} finally {
			active--
		}
	}
}

if (require.main === module) {
	const handler = createHandler({ token: process.env.PASSWORD_SERVICE_TOKEN })
	const server = http.createServer(async (incoming, outgoing) => {
		try {
			const request = new Request(`http://password-service${incoming.url}`, {
				method: incoming.method,
				headers: incoming.headers,
				...(incoming.method === 'GET' || incoming.method === 'HEAD'
					? {}
					: { body: incoming, duplex: 'half' }),
			})
			const response = await handler(request)
			outgoing.writeHead(response.status, Object.fromEntries(response.headers))
			outgoing.end(Buffer.from(await response.arrayBuffer()))
		} catch {
			outgoing.writeHead(503, {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store',
			})
			outgoing.end('{"error":"Password service unavailable"}')
		}
	})
	server.requestTimeout = 10_000
	server.headersTimeout = 10_000
	server.listen(
		Number(process.env.PORT || 8080),
		process.env.HOST || '127.0.0.1',
		() => console.log('Password service listening'),
	)
}

module.exports = { createHandler }
