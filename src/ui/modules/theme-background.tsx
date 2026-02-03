import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'

// Import helper lấy url ảnh sanity (nếu bạn có file này)
// import { urlForImage } from '@/sanity/lib/image'

export default function ThemeBackground({
	type,
	color,
	image,
	className,
}: {
	type?: 'color' | 'image' | 'none' | string
	color?: string
	image?: any
	className?: string
}) {
	// 1. Nếu type là 'none' hoặc không có dữ liệu -> Không render gì cả
	if (!type || type === 'none') return null

	// 2. Chuẩn bị Object Style động
	let inlineStyle: React.CSSProperties = {}

	// TRƯỜNG HỢP: MÀU NỀN
	if (type === 'color' && color) {
		inlineStyle = {
			backgroundColor: color,
			backgroundAttachment: 'fixed',
			backgroundPosition: 'center center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			zIndex: -1,
		}
	}

	// TRƯỜNG HỢP: ẢNH NỀN
	if (type === 'image' && image?.asset) {
		// Nếu dùng helper urlForImage thì: const bgUrl = urlForImage(image).width(1920).url()
		const bgUrl = urlFor(image).width(1920).url()

		inlineStyle = {
			backgroundImage: `url(${bgUrl})`,
			backgroundAttachment: 'fixed',
			backgroundPosition: 'center center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			zIndex: -1,
		}
	}

	return (
		<>
			<div
				// Dùng fixed inset-0 để nó phủ toàn màn hình và đứng yên
				className={cn(
					'pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-300 ease-in-out',
					className,
				)}
				style={inlineStyle}
			/>
		</>
	)
}
