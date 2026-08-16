import { stegaClean } from 'next-sanity'
import Link from 'next/link'
import Img, { Source } from '@/ui/img'

type ResponsiveImageProps = {
	image: any
	className?: string
	imgClassName?: string
	desktop?: { width: number }
	mobile?: { width: number; media?: string }
	priority?: boolean
	sizes?: string
}

export default function ResponsiveImage({
	image,
	className,
	imgClassName,
	desktop = { width: 1200 },
	mobile = { width: 600, media: '(max-width: 767px)' },
	priority = false,
	sizes = '(max-width: 768px) 100vw, 100vw',
}: ResponsiveImageProps) {
	if (!image) return null

	const loading = priority ? 'eager' : (stegaClean(image.loading) || 'lazy')
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
				priority={priority}
				loading={loading}
				sizes={sizes}
				className={imgClassName}
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
