import { NextResponse } from 'next/server'
import { sanityStudioUrl } from '@/lib/sanity-studio-url'

export async function GET(
	request: Request,
	context: { params: Promise<{ tool?: string[] }> },
) {
	const { tool = [] } = await context.params
	if (tool[0] === 'workspace-login')
		return NextResponse.redirect(
			new URL('/api/admin/auth/sanity/start', request.url),
			307,
		)
	const target = new URL(sanityStudioUrl)
	target.pathname = '/' + tool.map(encodeURIComponent).join('/')
	target.search = new URL(request.url).search
	return NextResponse.redirect(target, 307)
}
