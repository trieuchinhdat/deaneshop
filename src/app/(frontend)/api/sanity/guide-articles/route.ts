import { NextResponse } from 'next/server'
import guideContent from '@@/AGENT-GUIDE-ARTICLES.md'

export async function GET() {
	return new NextResponse(guideContent, {
		status: 200,
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Content-Disposition': 'attachment; filename="AGENT-GUIDE-ARTICLES.md"',
			'Cache-Control': 'no-cache',
		},
	})
}
