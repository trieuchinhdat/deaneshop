import { searchStorefront } from '@/ui/modules/search/actions'

export async function POST(request: Request) {
	const headers = { 'Cache-Control': 'no-store' }
	const input = await request.json().catch(() => null)
	if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.query !== 'string' || input.query.length > 120) {
		return Response.json({ error: 'Invalid search query' }, { status: 400, headers })
	}
	try {
		return Response.json(await searchStorefront(input), { headers })
	} catch {
		return Response.json({ error: 'Search temporarily unavailable' }, { status: 503, headers })
	}
}
