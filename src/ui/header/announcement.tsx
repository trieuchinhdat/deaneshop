import Link from 'next/link'
import ResponsiveImage from '../responsiveImage'

const resolveInternalLink = (slug: string, type: string) => {
	switch (type) {
		case 'product':
			return `/products/${slug}`
		case 'blog.post':
			return `/blog/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

export default function Announcement({ data }: { data: any }) {
	if (!data || data.enabled === false) return null

	// Logic tạo href
	let bannerHref: string | null = null

	if (data.linkBannerType === 'external' && data.external) {
		bannerHref = data.external
	} else if (data.linkBannerType === 'internal' && data.internalSlug) {
		bannerHref = resolveInternalLink(data.internalSlug, data.internalType)
	}

	const isExternal =
		data.image?.type === 'external' || data.linkBannerType === 'external'

	// --- RENDER 1: IMAGE VARIANT ---
	if (data.variant === 'image' && data.image) {
		const imgElement = (
			<div
				className="m-0 p-0"
				style={{
					backgroundColor: data.backgroundColor || 'transparent',
				}}
			>
				<ResponsiveImage
					image={data.image}
					className="mx-auto flex h-auto max-h-[60px] justify-center object-cover m-0 p-0"
				/>
			</div>
		)

		if (bannerHref) {
			return (
				<Link href={bannerHref} target={isExternal ? '_blank' : undefined} className="m-0 p-0 block">
					{imgElement}
				</Link>
			)
		}
		return imgElement
	}

	// --- RENDER 2: TEXT VARIANT ---
	if (data.content) {
		const textElement = (
			<div
				className="w-full text-center text-sm font-medium transition-colors m-0 p-0 leading-normal"
				style={{
					backgroundColor: data.backgroundColor || 'transparent',
					color: data.textColor || 'inherit',
				}}
			>
				<div className="prose-a:underline hover:prose-a:opacity-80 mx-auto max-w-screen-xl m-0 p-0">
					<p className="m-0 p-0 inline-block">{data.content}</p>
				</div>
			</div>
		)

		if (bannerHref) {
			return (
				<Link href={bannerHref} target={isExternal ? '_blank' : undefined} className="m-0 p-0 block">
					{textElement}
				</Link>
			)
		}
		return textElement
	}

	return null
}
