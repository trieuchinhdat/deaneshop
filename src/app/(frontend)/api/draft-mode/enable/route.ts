import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/lib/client'
import { token } from '@/sanity/lib/token'
import { NextResponse } from 'next/server'
import { isStaticStorefront } from '@/lib/deployment-profile'

const draftMode = defineEnableDraftMode({
	client: client.withConfig({ token }),
})

export async function GET(request: Request) {
	if (isStaticStorefront) {
		return NextResponse.json({ error: 'Live preview is unavailable for this published snapshot.' }, { status: 409 })
	}
	return draftMode.GET(request)
}
