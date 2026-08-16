'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VscClose } from 'react-icons/vsc'

export default function AnnouncementBar({
	data,
}: {
	data?: {
		isActive?: boolean
		text?: string
		link?: string
		bgColor?: string
		textColor?: string
	}
}) {
	const [dismissed, setDismissed] = useState(false)

	if (!data?.isActive || !data?.text || dismissed) return null

	const bg = data.bgColor || '#059669'
	const color = data.textColor || '#ffffff'

	const content = (
		<div className="container mx-auto flex items-center justify-center gap-2 text-center text-xs md:text-sm font-medium">
			<span>{data.text}</span>
		</div>
	)

	return (
		<div
			className="relative z-50 flex items-center justify-between px-4 py-2 transition-all"
			style={{ backgroundColor: bg, color: color }}
		>
			{data.link ? (
				<Link href={data.link} className="grow hover:underline">
					{content}
				</Link>
			) : (
				<div className="grow">{content}</div>
			)}
			<button
				onClick={() => setDismissed(true)}
				className="ml-2 rounded-full p-1 opacity-80 hover:opacity-100 focus:outline-none"
				aria-label="Dismiss announcement"
			>
				<VscClose className="h-4 w-4" />
			</button>
		</div>
	)
}
