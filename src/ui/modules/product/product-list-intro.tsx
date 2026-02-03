'use client'

import { PortableText } from 'next-sanity'
import { useQueryState } from 'nuqs'
import { Suspense } from 'react'

// Component con xử lý Logic
function IntroContent({
	intro,
	enableFilter,
}: {
	intro: any[]
	enableFilter: boolean
}) {
	// Chỉ lắng nghe URL nếu enableFilter = true
	// shallow: true để đồng bộ với client side navigation
	const [category] = useQueryState('category', { shallow: true })

	// LOGIC CHÍNH:
	// 1. Phải bật Filter (enableFilter === true)
	// 2. Phải có giá trị trên URL (category)
	if (enableFilter && category) {
		// Format text: "mini" -> "Mini", "ao-thun" -> "Ao Thun"
		const title = category
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')

		return (
			<header className="prose mb-4">
				<h1>{title}</h1>
			</header>
		)
	}

	// Mặc định: Trả về Intro gốc từ Sanity
	if (intro?.length > 0) {
		return (
			<header className="prose mb-4">
				<PortableText value={intro} />
			</header>
		)
	}

	return null
}

// Component chính export ra ngoài (Bọc Suspense để an toàn với useQueryState)
export default function ProductListIntro(props: {
	intro: any[]
	enableFilter: boolean
}) {
	return (
		<Suspense fallback={null}>
			<IntroContent {...props} />
		</Suspense>
	)
}
