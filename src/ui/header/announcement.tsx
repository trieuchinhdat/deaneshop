import { PortableText } from 'next-sanity'
import Link from 'next/link'
import ResponsiveImage from '../responsiveImage'

const resolveInternalLink = (slug: string, type: string) => {
	switch (type) {
		case 'product': // Nếu là sản phẩm
			return `/products/${slug}`
		case 'blog.post': // Nếu là bài viết (check tên schema trong sanity của bạn)
			return `/blog/${slug}`
		case 'page': // Nếu là page thường
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default: // Mặc định
			return `/${slug}`
	}
}

export default function Announcement({ data }: { data: any }) {
	if (!data?.enabled) return null

	// Logic tạo href
	let bannerHref = null

	if (data.linkBannerType === 'external' && data.external) {
		bannerHref = data.external
	} else if (data.linkBannerType === 'internal' && data.internalSlug) {
		bannerHref = resolveInternalLink(data.internalSlug, data.internalType)
	}

	// --- RENDER 1: IMAGE VARIANT ---
	if (data.variant === 'image' && data.image) {
		if (bannerHref) {
			return (
				<div
					style={{
						backgroundColor: data.backgroundColor || '#000',
					}}
				>
					<Link
						href={bannerHref}
						target={data.image.type === 'external' ? '_blank' : undefined}
					>
						<ResponsiveImage
							image={data.image}
							className="mx-auto flex h-auto max-h-[60px] justify-center object-cover"
						/>
					</Link>
				</div>
			)
		}
		return (
			<div
				style={{
					backgroundColor: data.backgroundColor || '#000',
				}}
			>
				<ResponsiveImage
					image={data.image}
					className="mx-auto flex h-auto max-h-[60px] justify-center object-cover"
				/>
			</div>
		)
	}

	// --- RENDER 2: TEXT VARIANT ---
	if (data.variant === 'text' && data.content) {
		if (bannerHref) {
			return (
				<Link
					href={bannerHref}
					target={data.image.type === 'external' ? '_blank' : undefined}
				>
					<div
						className="w-full px-4 py-2 text-center text-sm font-medium transition-colors"
						style={{
							backgroundColor: data.backgroundColor || '#000',
							color: data.textColor || '#fff',
						}}
					>
						{/* PortableText để render link bên trong text */}
						<div className="prose-a:underline hover:prose-a:opacity-80 mx-auto max-w-screen-xl">
							<p>{data.content}</p>
						</div>
					</div>
				</Link>
			)
		}
		return (
			<div
				className="w-full px-4 py-2 text-center text-sm font-medium transition-colors"
				style={{
					backgroundColor: data.backgroundColor || '#000',
					color: data.textColor || '#fff',
				}}
			>
				{/* PortableText để render link bên trong text */}
				<div className="prose-a:underline hover:prose-a:opacity-80 mx-auto max-w-screen-xl">
					<p>{data.content}</p>
				</div>
			</div>
		)
	}

	return null
}
