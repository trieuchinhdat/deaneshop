'use client'

import { useEffect, useRef } from 'react'
import { getImageDimensions } from '@sanity/asset-utils'
import type { ImageUrlBuilderOptionsWithAliases } from '@sanity/image-url'
import { stegaClean } from 'next-sanity'
import Image, { getImageProps, type ImageProps } from 'next/image'
import { preload } from 'react-dom'
import { urlFor } from '@/sanity/lib/image'
import type {
	SanityImageAsset,
	SanityImageCrop,
	SanityImageHotspot,
} from '@/sanity/types'

type Image =
	| {
			asset: SanityImageAsset
			crop?: SanityImageCrop
			hotspot?: SanityImageHotspot
	  }
	| any

export type VideoDetails = {
	type: 'video' | 'videoUrl'
	url: string
	embedUrl?: string
	isIframe?: boolean
	poster?: string
}

function getEmbedVideoUrl(url: string): {
	embedUrl: string
	isIframe: boolean
	poster?: string
} | null {
	if (!url || typeof url !== 'string')
		return null

	const trimmedUrl = url.trim()

	// 1. YouTube (Watch, Shorts, Share link, Embed, Mobile) - controls=0, modestbranding=1, rel=0
	const ytMatch = trimmedUrl.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i,
	)
	if (ytMatch && ytMatch[1]) {
		const videoId = ytMatch[1]
		return {
			embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&showinfo=0`,
			isIframe: true,
			poster: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
		}
	}

	// 2. TikTok (Video & Embed URLs)
	const ttMatch = trimmedUrl.match(
		/tiktok\.com\/(?:@[^\/]+\/video\/|v\/|embed\/v2\/)(\d+)/i,
	)
	if (ttMatch && ttMatch[1]) {
		const videoId = ttMatch[1]
		return {
			embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
			isIframe: true,
		}
	}

	// 3. Vimeo - controls=0, background=1
	const vimeoMatch = trimmedUrl.match(
		/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i,
	)
	if (vimeoMatch && vimeoMatch[1]) {
		return {
			embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&autopause=0&background=1&controls=0`,
			isIframe: true,
		}
	}

	// 4. Direct Video Stream (.mp4, .webm, .m3u8, .mov, .m4v, .ogv)
	if (/\.(mp4|webm|m3u8|mov|m4v|ogv)($|\?)/i.test(trimmedUrl)) {
		return { embedUrl: trimmedUrl, isIframe: false }
	}

	return null
}

export function parseVideoMedia(item: any): VideoDetails | null {
	if (!item) return null

	// 1. Direct string URL
	if (typeof item === 'string') {
		const embedInfo = getEmbedVideoUrl(item)
		if (embedInfo) {
			return { type: 'videoUrl', url: item, ...embedInfo }
		}
		return null
	}

	// 2. Video Link URL object (strictly _type === 'videoUrl' or item.videoUrl)
	if (item._type === 'videoUrl' || (item.videoUrl && typeof item.videoUrl === 'string')) {
		const rawUrl = (item.videoUrl || item.url || '').trim()
		if (rawUrl) {
			const embedInfo = getEmbedVideoUrl(rawUrl)
			if (embedInfo) {
				return {
					type: 'videoUrl',
					url: rawUrl,
					...embedInfo,
					poster: item.poster || embedInfo.poster,
				}
			}
		}
	}

	// If item has a url property (e.g. link object) and is NOT a standard image, check if url is a video embed
	if (item.url && typeof item.url === 'string' && item._type !== 'image' && !item.asset) {
		const embedInfo = getEmbedVideoUrl(item.url)
		if (embedInfo) {
			return {
				type: 'videoUrl',
				url: item.url,
				...embedInfo,
				poster: item.poster || embedInfo.poster,
			}
		}
	}

	// 3. Video File Upload (MP4 / WebM / file- asset)
	const ref = item?.asset?._ref || item?.asset?._id || ''
	const url = item?.asset?.url || ''
	const mimeType = item?.asset?.mimeType || ''

	if (
		item._type === 'video' ||
		mimeType.startsWith('video/') ||
		/\.(mp4|webm|mov|m4v|ogv)($|\?)/i.test(url) ||
		/^file-.*-(mp4|webm|mov|m4v|ogv)$/i.test(ref)
	) {
		const videoUrl = getSanityFileUrl(item) || url
		if (!videoUrl) return null
		return {
			type: 'video',
			url: videoUrl,
			embedUrl: videoUrl,
			isIframe: false,
		}
	}

	return null
}

function getSanityFileUrl(image: any): string | null {
	if (image?.asset?.url) return image.asset.url
	const ref = image?.asset?._ref || image?.asset?._id || ''
	const match = ref.match(/^file-([a-f0-9]+)-(\w+)$/i)
	if (match) {
		const [, hash, ext] = match
		const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
		const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
		if (projectId) {
			return `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.${ext}`
		}
	}
	return null
}

function safeGetDimensions(image: any): { width: number; height: number } {
	if (!image?.asset) return { width: 800, height: 600 }
	const ref = typeof image.asset === 'string' ? image.asset : (image.asset._ref || image.asset._id || '')

	if (ref.startsWith('file-') || (!ref.startsWith('image-') && !image.asset.metadata?.dimensions)) {
		return { width: 800, height: 600 }
	}

	try {
		const dim = getImageDimensions(image)
		if (dim && Number.isFinite(dim.width) && Number.isFinite(dim.height) && dim.width > 0 && dim.height > 0) {
			return dim
		}
	} catch {
		// ignore
	}

	const dimensions = image.asset.metadata?.dimensions
	if (dimensions && Number.isFinite(dimensions.width) && Number.isFinite(dimensions.height) && dimensions.width > 0 && dimensions.height > 0) {
		return { width: dimensions.width, height: dimensions.height }
	}

	return { width: 800, height: 600 }
}

function safeUrlFor(
	image: any,
	targetWidth?: number | string,
	targetHeight?: number | string,
	imageOptions?: Partial<ImageUrlBuilderOptionsWithAliases>,
): string {
	if (!image?.asset) return ''
	const ref = typeof image.asset === 'string' ? image.asset : (image.asset._ref || image.asset._id || '')

	if (ref.startsWith('file-')) {
		return getSanityFileUrl(image) || image.asset.url || ''
	}

	try {
		const builder = urlFor(image).withOptions({
			auto: 'format',
			q: 80,
			...(targetWidth && Number.isFinite(Number(targetWidth)) ? { width: Math.round(Number(targetWidth)) } : {}),
			...(targetHeight && Number.isFinite(Number(targetHeight)) ? { height: Math.round(Number(targetHeight)) } : {}),
			...imageOptions,
		})
		return builder.url() ?? image.asset.url ?? ''
	} catch {
		return image.asset.url || ''
	}
}

function VideoMediaItem({
	src,
	className,
	style,
}: {
	src: string
	className?: string
	style?: React.CSSProperties
}) {
	const videoRef = useRef<HTMLVideoElement>(null)

	const resetAndPlay = () => {
		if (videoRef.current) {
			try {
				videoRef.current.currentTime = 0
				videoRef.current.play().catch(() => {})
			} catch {
				// ignore
			}
		}
	}

	useEffect(() => {
		resetAndPlay()
	}, [src])

	return (
		<video
			ref={videoRef}
			src={src}
			autoPlay
			loop
			muted
			playsInline
			controls={false}
			onMouseEnter={resetAndPlay}
			className={`h-full w-full object-cover pointer-events-none select-none ${className || ''}`}
			style={style}
		/>
	)
}

export default function Img({
	image,
	width,
	height,
	imageOptions,
	...props
}: {
	image?: Image
	imageOptions?: Partial<ImageUrlBuilderOptionsWithAliases>
} & Omit<ImageProps, 'src'>) {
	if (!image) return null

	// 1. Check if video (File or Link URL)
	const videoMedia = parseVideoMedia(image)
	if (videoMedia) {
		if (videoMedia.isIframe && videoMedia.embedUrl) {
			return (
				<iframe
					src={videoMedia.embedUrl}
					className={`h-full w-full object-cover border-0 pointer-events-none ${props.className || ''}`}
					allow="autoplay; encrypted-media; picture-in-picture"
					title={(props.alt as string) || 'Product video'}
				/>
			)
		}
		const videoUrl = videoMedia.url || videoMedia.embedUrl
		if (!videoUrl) return null
		return (
			<VideoMediaItem
				src={videoUrl}
				className={props.className as string}
				style={props.style}
			/>
		)
	}

	if (!image?.asset) return null

	const { lqip } = image.asset.metadata ?? {}

	const dimensions = safeGetDimensions(image)
	const rawW = (image?.hotspot?.width ?? 1) * dimensions.width
	const rawH = (image?.hotspot?.height ?? 1) * dimensions.height
	const w = Number.isFinite(rawW) && rawW > 0 ? Math.round(rawW) : 800
	const h = Number.isFinite(rawH) && rawH > 0 ? Math.round(rawH) : 600

	let numW = width ? Number(width) : undefined
	let numH = height ? Number(height) : undefined

	if (numW && Number.isFinite(numW) && !numH) {
		const calcH = Math.round((numW * h) / w)
		numH = Number.isFinite(calcH) && calcH > 0 ? calcH : 600
	} else if (numH && Number.isFinite(numH) && !numW) {
		const calcW = Math.round((numH * w) / h)
		numW = Number.isFinite(calcW) && calcW > 0 ? calcW : 800
	}

	const finalWidth = numW && Number.isFinite(numW) && numW > 0 ? Math.round(numW) : w
	const finalHeight = numH && Number.isFinite(numH) && numH > 0 ? Math.round(numH) : h

	const isPriority =
		Boolean(props.priority) ||
		props.loading === 'eager' ||
		stegaClean(image.loading) === 'eager'

	const loading = isPriority
		? 'eager'
		: stegaClean(props.loading || image.loading)

	const srcUrl = safeUrlFor(image, finalWidth, finalHeight, imageOptions)

	if (!srcUrl) return null

	return (
		<Image
			src={srcUrl}
			width={finalWidth}
			height={finalHeight}
			loading={loading}
			priority={isPriority}
			placeholder={lqip ? 'blur' : undefined}
			blurDataURL={lqip}
			{...props}
		/>
	)
}

export function Source({
	image,
	width: targetWidth,
	height: targetHeight,
	media = '(width < 768px)',
	options,
	...props
}: {
	image: Image
	options?: ImageUrlBuilderOptionsWithAliases
} & React.ComponentProps<'source'>) {
	if (!image?.asset || parseVideoMedia(image)) return null

	try {
		const { src, width, height } = generateSrc(
			image,
			targetWidth,
			targetHeight,
			options,
		)

		if (!src) return null

		const { props: imageProps } = getImageProps({ src, width, height, alt: '' })

		if (stegaClean(image.loading) === 'eager') {
			preload(imageProps.src, { as: 'image' })
		}

		return (
			<source
				srcSet={imageProps.src}
				width={imageProps.width}
				height={imageProps.height}
				media={media}
				{...props}
			/>
		)
	} catch {
		return null
	}
}

function generateSrc(
	image: Image,
	w?: number | `${number}` | string,
	h?: number | `${number}` | string,
	options?: ImageUrlBuilderOptionsWithAliases,
) {
	const dimensions = safeGetDimensions(image)
	const w_orig = Number.isFinite(dimensions.width) && dimensions.width > 0 ? Math.round(dimensions.width) : 800
	const h_orig = Number.isFinite(dimensions.height) && dimensions.height > 0 ? Math.round(dimensions.height) : 600

	let numW = w ? Number(w) : undefined
	let numH = h ? Number(h) : undefined

	if (numW && Number.isFinite(numW) && !numH) {
		const calcH = Math.floor((numW * h_orig) / w_orig)
		numH = Number.isFinite(calcH) && calcH > 0 ? calcH : 600
	} else if (numH && Number.isFinite(numH) && !numW) {
		const calcW = Math.floor((numH * w_orig) / h_orig)
		numW = Number.isFinite(calcW) && calcW > 0 ? calcW : 800
	}

	const finalWidth = numW && Number.isFinite(numW) && numW > 0 ? Math.round(numW) : w_orig
	const finalHeight = numH && Number.isFinite(numH) && numH > 0 ? Math.round(numH) : h_orig

	return {
		src: safeUrlFor(image, finalWidth, finalHeight, options),
		width: finalWidth,
		height: finalHeight,
	}
}
