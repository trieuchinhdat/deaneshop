import { stegaClean } from 'next-sanity'
import Link from 'next/link'
import Img, { Source } from '@/ui/img'

type ResponsiveImageProps = {
	image: any
	className?: string
	desktop?: { width: number }
	mobile?: { width: number; media?: string }
	priority?: boolean
}

export default function ResponsiveImage({
	image,
	className,
	desktop = { width: 1200 },
	mobile = { width: 600, media: '(max-width: 767px)' },
	priority = false,
}: ResponsiveImageProps) {
	if (!image?.asset) return null

	const loading = stegaClean(image.loading)
	const hasMobile = Boolean(image.mobileImage?.asset)
	const alt = image.alt ?? ''

	const ImageContent = (
		<picture className={className}>
			{hasMobile && (
				<Source
					image={image.mobileImage}
					width={mobile.width * 2}
					media={mobile.media}
				/>
			)}

			<Img
				image={image}
				width={desktop.width}
				alt={alt}
				loading={loading}
				sizes="(max-width: 768px) 100vw, 100vw"
			/>
		</picture>
	)

	// if (image.url) {
	// 	return (
	// 		<Link href={image.url} className="block">
	// 			{ImageContent}
	// 		</Link>
	// 	)
	// }

	return ImageContent
}
