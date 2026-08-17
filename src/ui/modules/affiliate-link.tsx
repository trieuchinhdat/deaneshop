import { ExternalLink, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'

type AffiliateLinkProps = {
	layout: 'button' | 'horizontal' | 'vertical'
	alignment: 'left' | 'center' | 'right'
	buttonColor: 'default' | 'green' | 'red' | 'blue' | 'orange'
	image?: any
	title?: string
	shortInfo?: string
	price?: string
	rating?: number
	url: string
	buttonText?: string
	badge?: string
}

const getButtonStyles = (color: string) => {
	switch (color) {
		case 'green':
			return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 hover:shadow-emerald-300/60'
		case 'red':
			return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200/50 hover:shadow-rose-300/60'
		case 'blue':
			return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/50 hover:shadow-blue-300/60'
		case 'orange':
			return 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200/50 hover:shadow-orange-300/60'
		default:
			return 'bg-gray-900 hover:bg-black text-white shadow-gray-300 hover:shadow-gray-400'
	}
}

const RatingStars = ({ rating }: { rating: number }) => {
	if (!rating) return null
	return (
		<div className="flex items-center gap-1 text-yellow-400">
			<span className="mr-1 text-sm font-bold text-gray-700">{rating}</span>
			{[...Array(5)].map((_, i) => (
				<Star
					key={i}
					size={13}
					fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
					strokeWidth={2}
					className={
						i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-200'
					}
				/>
			))}
		</div>
	)
}

// Sub-component Badge nhỏ gọn và tinh tế
const CompactBadge = ({ text }: { text: string }) => (
	<span className="mb-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-blue-600 uppercase ring-1 ring-blue-600/20 ring-inset">
		{text}
	</span>
)

export default function AffiliateLink({
	layout = 'horizontal',
	alignment = 'center',
	buttonColor = 'default',
	image,
	title,
	shortInfo,
	price,
	rating,
	url,
	buttonText = 'View Offer',
	badge,
}: AffiliateLinkProps) {
	const btnEffectClass = `group/btn inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 lg:px-7 lg:py-3.5 font-bold transition-all duration-300 
    hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] shadow-lg hover:shadow-xl ${getButtonStyles(buttonColor)}`

	const alignContainer = {
		left: 'justify-start',
		center: 'justify-center',
		right: 'justify-end',
	}

	const alignText = {
		left: 'text-left items-start',
		center: 'text-center items-center',
		right: 'text-right items-end',
	}

	if (layout === 'button') {
		return (
			<div className={`my-6 flex lg:my-8 ${alignContainer[alignment]}`}>
				<Link
					href={url}
					target="_blank"
					rel="nofollow sponsored noopener noreferrer"
					className={btnEffectClass}
				>
					<span className="relative z-10">{buttonText}</span>
					<ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5" />
				</Link>
			</div>
		)
	}

	if (layout === 'horizontal') {
		return (
			<Link
				href={url}
				target="_blank"
				rel="nofollow sponsored noopener noreferrer"
				className="group/card my-4 block w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl lg:my-6"
			>
				<div className="flex items-start gap-4">
					{image?.asset && (
						<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-1">
							<Image
								src={urlFor(image).width(200).height(200).url()}
								alt={title || ''}
								fill
								unoptimized
								className="object-contain mix-blend-multiply transition-transform duration-500 group-hover/card:scale-110"
							/>
						</div>
					)}
					<div className="min-w-0 flex-1">
						{badge && <CompactBadge text={badge} />}
						<h3 className="text-base leading-tight font-bold text-gray-900 transition-colors group-hover/card:text-blue-700">
							{title}
						</h3>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
							{rating && <RatingStars rating={rating} />}
							{price && (
								<span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
									{price}
								</span>
							)}
						</div>
						{shortInfo && (
							<p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
								{shortInfo}
							</p>
						)}
					</div>
				</div>
				<div className="mt-4 border-t border-dashed border-gray-100 pt-3">
					<div className={`${btnEffectClass} w-full text-sm lg:text-base`}>
						{buttonText}
						<ExternalLink className="h-4 w-4 opacity-80" />
					</div>
				</div>
			</Link>
		)
	}

	if (layout === 'vertical') {
		return (
			<div className={`my-4 flex lg:my-6 ${alignContainer[alignment]}`}>
				<Link
					href={url}
					target="_blank"
					rel="nofollow sponsored noopener noreferrer"
					className={`group/card relative flex w-full max-w-[320px] flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl ${alignText[alignment]}`}
				>
					{/* Badge nhỏ gọn nằm góc trên bên trái của Card dọc */}
					{badge && (
						<div className="absolute top-5 left-6 z-10">
							<CompactBadge text={badge} />
						</div>
					)}

					{image?.asset && (
						<div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-gray-50 p-4">
							<Image
								src={urlFor(image).width(500).url()}
								alt={title || ''}
								fill
								unoptimized
								className="object-contain mix-blend-multiply transition-transform duration-500 group-hover/card:scale-105"
							/>
						</div>
					)}
					<div
						className={`flex w-full flex-col space-y-2 ${alignText[alignment]}`}
					>
						<h3 className="text-base font-bold text-gray-900 transition-colors group-hover/card:text-blue-700">
							{title}
						</h3>
						<div className="flex flex-wrap items-center gap-3">
							{rating && <RatingStars rating={rating} />}
							{price && (
								<span className="text-base font-bold text-emerald-600">
									{price}
								</span>
							)}
						</div>
						{shortInfo && (
							<p className="mt-3 line-clamp-3 w-full border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
								{shortInfo}
							</p>
						)}
						<div className="w-full pt-2">
							<div className={`${btnEffectClass} w-full text-sm`}>
								{buttonText}
							</div>
						</div>
					</div>
				</Link>
			</div>
		)
	}

	return null
}
