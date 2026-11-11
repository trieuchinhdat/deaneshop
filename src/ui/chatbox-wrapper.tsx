'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

// Dynamic client-side import for chatbox
const ChatBox = dynamic(() => import('@/ui/chatbox'), {
	ssr: false, // Disabling SSR is safe here inside a client component
})

export default function ChatBoxWrapper(props: ComponentProps<typeof ChatBox>) {
	return <ChatBox {...props} />
}
