'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

// Di chuyển logic dynamic import vào đây
const ChatBox = dynamic(() => import('@/ui/chatbox'), {
	ssr: false, // Tại đây ssr: false hoạt động tốt vì file này là 'use client'
})

export default function ChatBoxWrapper(props: ComponentProps<typeof ChatBox>) {
	return <ChatBox {...props} />
}
