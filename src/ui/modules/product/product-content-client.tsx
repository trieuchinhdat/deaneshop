'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useCartStore } from '@/store/use-cart-store'
import Img from '../../img'
import 'swiper/css'
import 'swiper/css/navigation'
import { SlideshowLightbox } from 'lightbox.js-react'
import { PortableText } from 'next-sanity'
import Link from 'next/link'
import {
	FiAlertCircle,
	FiAnchor,
	FiCheck,
	FiChevronDown,
	FiChevronUp,
	FiEdit3,
	FiFileText,
	FiFilm,
	FiMessageCircle,
	FiPackage,
	FiPlay,
	FiSend,
	FiShare2,
	FiShield,
	FiStar,
	FiUser,
	FiVideo,
} from 'react-icons/fi'
import {
	HiOutlineBuildingStorefront,
	HiOutlineCheck,
	HiOutlineClock,
	HiOutlineDocumentArrowDown,
	HiOutlineSparkles,
	HiOutlineTruck,
} from 'react-icons/hi2'
import { showCartToast } from '@/lib/toast'
import { cn, formatPrice } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { PRODUCT_SETTINGS_QUERY_RESULT } from '@/sanity/types'
import Image from '@/ui/modules/prose/image'
import SanityLink from '@/ui/sanity-link'
import AffiliateLink from '../affiliate-link'
import CustomHtml from '../custom-html'
import AnchoredHeading from '../prose/anchored-heading'
import Categories from './categories'
import FlashSaleCountdown from './flash-sale-countdown'
import InPageRfqModal from './in-page-rfq-modal'
import ReviewFormModal from './review-form-modal'
import ReviewVideoLightbox from './review-video-lightbox'

export type ProductOption = {
	name: string
	values: string[]
}

export type ProductVariant = {
	_key?: string
	title: string
	sku?: string
	price?: number
	compareAtPrice?: number
	stock?: number
	image?: any
	options?: Array<{ name: string; value: string }>
}

type Props = {
	title: string
	sku?: string
	category?: any[]
	tags?: string[]
	slug: string
	description?: any[]
	images?: any[]
	price: number
	compareAtPrice?: number
	sales?: number
	approvedReviews?: any[]
	reviewSummary?: { count: number; avgRating: number }
	productId?: string
	stock?: number
	inStock?: boolean
	shortPitch?: string
	keyBenefits?: Array<{ title: string; description?: string }>
	specs?: Array<{ label: string; value: string }>
	productSettings?: PRODUCT_SETTINGS_QUERY_RESULT
	hasVariants?: boolean
	options?: ProductOption[]
	variants?: ProductVariant[]
	promotionMode?: 'default' | 'custom' | 'disabled'
	promotions?: any
	enableSpecialDeal?: boolean
	specialDealConfig?: any
	moq?: number
	priceTiers?: Array<{
		minQty: number
		maxQty?: number
		unitPrice: number
		incoterm?: string
		discountPercent?: number
		badge?: string
		isCustomQuote?: boolean
	}>
	leadTime?: string
	specSheetPdf?: any
	pricingModel?: string
	currency?: string
	priceNote?: string
	conversionType?: string
}

function getEmbedVideoUrl(url: string): {
	embedUrl: string
	isIframe: boolean
	poster?: string
} {
	if (!url || typeof url !== 'string')
		return { embedUrl: '', isIframe: false }

	const trimmedUrl = url.trim()

	// 1. YouTube (Watch, Shorts, Share link, Embed, Mobile)
	const ytMatch = trimmedUrl.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i,
	)
	if (ytMatch && ytMatch[1]) {
		const videoId = ytMatch[1]
		return {
			embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
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

	// 3. Vimeo
	const vimeoMatch = trimmedUrl.match(
		/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)/i,
	)
	if (vimeoMatch && vimeoMatch[1]) {
		return {
			embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
			isIframe: true,
		}
	}

	// 4. Direct Video Stream (.mp4, .webm, .m3u8, .mov)
	if (/\.(mp4|webm|m3u8|mov)$/i.test(trimmedUrl)) {
		return { embedUrl: trimmedUrl, isIframe: false }
	}

	// 5. Fallback for external video links: Render embed iframe
	return { embedUrl: trimmedUrl, isIframe: true }
}

function parseMediaItem(item: any): {
	type: 'image' | 'video' | 'videoUrl'
	src?: string
	videoUrl?: string
	embedUrl?: string
	isIframe?: boolean
	poster?: string
	alt: string
} {
	if (!item) return { type: 'image', alt: '' }

	// 1. Direct Video Link URL (YouTube / Vimeo / TikTok / MP4 Link / External)
	if (
		item._type === 'videoUrl' ||
		(item.url && typeof item.url === 'string') ||
		(item.videoUrl && typeof item.videoUrl === 'string')
	) {
		const rawUrl = item.url || item.videoUrl || ''
		const { embedUrl, isIframe, poster } = getEmbedVideoUrl(rawUrl)

		return {
			type: 'videoUrl',
			videoUrl: rawUrl,
			embedUrl,
			isIframe,
			poster: item.poster || poster,
			alt: item.alt || 'Product video',
		}
	}

	// 2. Video File Upload (MP4 / WebM)
	if (
		item._type === 'video' ||
		item?.asset?.mimeType?.startsWith('video/') ||
		(item?.asset?.url && /\.(mp4|webm|mov|m4v)$/i.test(item.asset.url))
	) {
		const videoUrl = item?.asset?.url || ''
		return {
			type: 'video',
			videoUrl,
			alt: item.alt || 'Product video',
		}
	}

	// 3. Standard Image
	let src = ''
	if (item?.asset) {
		try {
			src = urlFor(item).width(1200).url()
		} catch {
			src = '/fallback-image.png'
		}
	} else if (typeof item === 'string') {
		src = item
	}
	return {
		type: 'image',
		src: src || '/fallback-image.png',
		alt: item.alt || 'Product image',
	}
}

export default function ProductContentClient({
	title,
	sku,
	category = [],
	tags = [],
	slug,
	description,
	images = [],
	price,
	compareAtPrice,
	sales,
	productId = '',
	approvedReviews = [],
	reviewSummary,
	stock,
	inStock = true,
	shortPitch,
	keyBenefits = [],
	specs = [],
	productSettings,
	hasVariants = false,
	options = [],
	variants = [],
	promotionMode = 'default',
	promotions,
	enableSpecialDeal = false,
	specialDealConfig,
	moq,
	priceTiers = [],
	leadTime,
	specSheetPdf,
	pricingModel,
	currency = 'USD',
	priceNote,
	conversionType,
}: Props) {
	const router = useRouter()
	const addItem = useCartStore((s) => s.addItem)

	// 0. Extract Product Page Settings with Sensible Global Defaults
	const {
		galleryLayout = 'carousel_bottom',
		imageAspectRatio = '1:1',
		mediaPosition = 'left',
		enableImageLightbox = true,
		enableCategoryDisplay = true,
		enableSkuDisplay = true,
		enableSoldCount = true,
		enableStockBadge = true,
		lowStockThreshold = 5,
		enableSocialShare = true,
		showDiscountBadge = true,
		showPriceTiers = true,
		priceDisplayUnit = 'FOB Vietnam Port',
		variantSelectorStyle = 'pills',
		showOutOfStockVariants = 'strike_through',
		enableQuantitySelector = true,
		rfqCtaLabel = 'Request Official Quotation (RFQ)',
		quoteListCtaLabel = '+ Add to Quote List',
		enableSampleButton = true,
		sampleOrderCtaLabel = 'Order Evaluation Sample',
		orderRequestCtaLabel = 'Reserve Order (No Upfront Payment)',
		consultationCtaLabel = 'Schedule Specialist Consultation',
		enableWhatsAppQuickChat = true,
		whatsAppNumber = '+84901234567',
		enableContactButton = true,
		contactButtonText = 'Talk to Export Specialist (WhatsApp / Direct Email)',
		contactButtonLink = 'mailto:sales@deanflow.com',
		enableStickyAddToCart = true,
		stickyBarDevice = 'both',
		enableAddToCartButton = false,
		addToCartButtonText = 'Add to Cart',
		enableBuyNowButton = false,
		buyNowButtonText = 'Buy Now',
		trustBadges = [],
		enableReviews = true,
		enableReviewStars = true,
		defaultReviewSort = 'newest',
		enableShippingEstimator = true,
		defaultOriginPort = 'Origin: Vietnam Port (FOB)',
		globalLandedCostNotice,
		defaultPromotions,
		defaultSpecialConditions,
		promoBanners = [],
	} = (productSettings as any) ?? {}

	const [isCopied, setIsCopied] = useState(false)
	const handleShare = async () => {
		const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
		const shareData = {
			title: title || 'Product',
			text: shortPitch || title,
			url: shareUrl,
		}
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share(shareData)
				return
			} catch {
				// User cancelled or share dismissed
			}
		}
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(shareUrl)
				setIsCopied(true)
				setTimeout(() => setIsCopied(false), 2500)
			} catch {}
		}
	}

	const aspectRatioClass = useMemo(() => {
		switch (imageAspectRatio) {
			case '4:5':
				return 'aspect-[4/5]'
			case '4:3':
				return 'aspect-[4/3]'
			case '1:1':
			default:
				return 'aspect-square'
		}
	}, [imageAspectRatio])

	const [quantity, setQuantity] = useState(() => (moq && moq > 1 ? moq : 1))
	const [targetPort, setTargetPort] = useState('us_west')
	const [activeIndex, setActiveIndex] = useState(0)

	const [isRfqModalOpen, setIsRfqModalOpen] = useState(false)
	const [isSampleMode, setIsSampleMode] = useState(false)

	const handleOpenRfq = (sample = false) => {
		setIsSampleMode(sample)
		setIsRfqModalOpen(true)
	}

	const [isDescExpanded, setIsDescExpanded] = useState(false)
	const [showExpandBtn, setShowExpandBtn] = useState(false)
	const descContentRef = useRef<HTMLDivElement | null>(null)

	const [isStickyVisible, setIsStickyVisible] = useState(false)
	const mainCtaRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		if (descContentRef.current) {
			if (descContentRef.current.scrollHeight > 400) {
				setShowExpandBtn(true)
			} else {
				setShowExpandBtn(false)
			}
		}
	}, [description])

	useEffect(() => {
		const handleScroll = () => {
			if (mainCtaRef.current) {
				const rect = mainCtaRef.current.getBoundingClientRect()
				if (rect.bottom < 0 || window.scrollY > 400) {
					setIsStickyVisible(true)
				} else {
					setIsStickyVisible(false)
				}
			} else if (window.scrollY > 400) {
				setIsStickyVisible(true)
			} else {
				setIsStickyVisible(false)
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const mainSwiperRef = useRef<SwiperType | null>(null)
	const thumbSwiperRef = useRef<SwiperType | null>(null)

	// 1. Detect if product has variants
	const effectiveHasVariants = useMemo(() => {
		return Boolean(
			hasVariants || (Array.isArray(variants) && variants.length > 0),
		)
	}, [hasVariants, variants])

	// 2. Automatically extract options if not defined in Sanity options field
	const effectiveOptions = useMemo(() => {
		if (Array.isArray(options) && options.length > 0) return options
		if (!Array.isArray(variants) || variants.length === 0) return []

		const optionMap: Record<string, Set<string>> = {}
		variants.forEach((v) => {
			v.options?.forEach((o) => {
				if (o.name && o.value) {
					const cleanName = o.name.trim()
					const cleanVal = o.value.trim()
					if (!optionMap[cleanName]) optionMap[cleanName] = new Set()
					optionMap[cleanName].add(cleanVal)
				}
			})
		})

		return Object.entries(optionMap).map(([name, set]) => ({
			name,
			values: Array.from(set),
		}))
	}, [options, variants])

	// 3. Initialize selectedOptions state
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>(() => {
		const initial: Record<string, string> = {}
		if (effectiveHasVariants && effectiveOptions.length > 0) {
			effectiveOptions.forEach((opt) => {
				if (opt.name && opt.values && opt.values.length > 0) {
					initial[opt.name] = opt.values[0]
				}
			})
		}
		return initial
	})

	// Reset selectedOptions only when product changes (via productId or slug)
	useEffect(() => {
		const initial: Record<string, string> = {}
		if (effectiveHasVariants && effectiveOptions.length > 0) {
			effectiveOptions.forEach((opt) => {
				if (opt.name && opt.values && opt.values.length > 0) {
					initial[opt.name] = opt.values[0]
				}
			})
		}
		setSelectedOptions(initial)
	}, [productId, slug])

	// 4. Variant matching algorithm (Active Variant)
	const activeVariant = useMemo(() => {
		if (
			!effectiveHasVariants ||
			!Array.isArray(variants) ||
			variants.length === 0
		)
			return null

		// Match exact options array
		const exactMatch = variants.find((v) => {
			if (!v.options || v.options.length === 0) return false

			return v.options.every((opt) => {
				if (!opt.name || !opt.value) return false
				const targetEntry = Object.entries(selectedOptions).find(
					([k]) => k.trim().toLowerCase() === opt.name.trim().toLowerCase(),
				)
				if (!targetEntry) return false
				return (
					targetEntry[1].trim().toLowerCase() === opt.value.trim().toLowerCase()
				)
			})
		})

		if (exactMatch) return exactMatch

		// Fallback match by variant title (e.g. "Black / L")
		const selectedVals = Object.values(selectedOptions).map((v) =>
			v.trim().toLowerCase(),
		)
		if (selectedVals.length > 0) {
			const titleMatch = variants.find((v) => {
				if (!v.title) return false
				const t = v.title.toLowerCase()
				return selectedVals.every((val) => t.includes(val))
			})
			if (titleMatch) return titleMatch
		}

		// Fallback: Return first variant if available
		return variants[0] || null
	}, [effectiveHasVariants, variants, selectedOptions])

	// Currently selected variant index (used for sticky bar dropdown)
	const activeVariantIndex = useMemo(() => {
		if (!activeVariant || !variants || variants.length === 0) return 0
		const idx = variants.findIndex((v) => v === activeVariant)
		return idx !== -1 ? idx : 0
	}, [activeVariant, variants])

	// 5. Dynamic pricing calculation based on activeVariant & Tiered Pricing
	const baseUnitPrice = useMemo(() => {
		if (effectiveHasVariants && activeVariant) {
			if (typeof activeVariant.price === 'number' && activeVariant.price > 0) {
				return activeVariant.price
			}
		}
		return price
	}, [effectiveHasVariants, activeVariant, price])

	const activeTier = useMemo(() => {
		if (!priceTiers || !Array.isArray(priceTiers) || priceTiers.length === 0) return null
		const sorted = [...priceTiers].sort((a, b) => b.minQty - a.minQty)
		return sorted.find((t) => quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty)) || null
	}, [priceTiers, quantity])

	const finalPrice = useMemo(() => {
		if (activeTier && typeof activeTier.unitPrice === 'number' && !activeTier.isCustomQuote) {
			return activeTier.unitPrice
		}
		return baseUnitPrice
	}, [activeTier, baseUnitPrice])

	const currentCompareAtPrice = useMemo(() => {
		if (effectiveHasVariants && activeVariant) {
			if (
				typeof activeVariant.compareAtPrice === 'number' &&
				activeVariant.compareAtPrice > 0
			) {
				return activeVariant.compareAtPrice
			}
		}
		return compareAtPrice
	}, [effectiveHasVariants, activeVariant, compareAtPrice])

	const currentStock = useMemo(() => {
		if (effectiveHasVariants && activeVariant) {
			if (typeof activeVariant.stock === 'number') {
				return activeVariant.stock
			}
		}
		return stock
	}, [effectiveHasVariants, activeVariant, stock])

	const currentSku = useMemo(() => {
		if (effectiveHasVariants && activeVariant?.sku) {
			return activeVariant.sku
		}
		return sku
	}, [effectiveHasVariants, activeVariant, sku])

	const hasSale =
		typeof currentCompareAtPrice === 'number' &&
		currentCompareAtPrice > finalPrice

	// Global event broadcast for Sticky Buy Bar & conversion modules to sync active variants in real-time
	useEffect(() => {
		if (typeof window === 'undefined') return
		window.dispatchEvent(
			new CustomEvent('product:variant-change', {
				detail: {
					productId,
					title,
					slug,
					variant: activeVariant,
					variantTitle: activeVariant?.title,
					price: finalPrice,
					compareAtPrice: currentCompareAtPrice,
					stock: currentStock,
					sku: currentSku || activeVariant?.sku || sku,
					image: activeVariant?.image || images?.[0],
					selectedOptions,
				},
			}),
		)
	}, [
		activeVariant,
		finalPrice,
		currentCompareAtPrice,
		currentStock,
		currentSku,
		title,
		sku,
		slug,
		images,
		productId,
		selectedOptions,
	])

	// 6. Calculate Effective Promotions Block
	const effectivePromotions = useMemo(() => {
		const currentPromoMode =
			promotionMode || specialDealConfig?.promotionMode || 'disabled'
		const currentCustomPromos = promotions || specialDealConfig?.promotions

		if (currentPromoMode === 'disabled') return null
		if (
			currentPromoMode === 'custom' &&
			currentCustomPromos?.items &&
			Array.isArray(currentCustomPromos.items) &&
			currentCustomPromos.items.length > 0
		) {
			return currentCustomPromos
		}
		const defaultPromos = (productSettings as any)?.defaultPromotions
		if (
			defaultPromos?.items &&
			Array.isArray(defaultPromos.items) &&
			defaultPromos.items.length > 0
		) {
			return defaultPromos
		}
		return null
	}, [promotionMode, promotions, specialDealConfig, productSettings])

	// 7. Calculate Effective Special Conditions
	const effectiveSpecialConditions = useMemo(() => {
		// 1. Custom settings per product
		if (
			specialDealConfig?.specialConditions &&
			Array.isArray(specialDealConfig.specialConditions) &&
			specialDealConfig.specialConditions.length > 0
		) {
			const customConds = specialDealConfig.specialConditions.filter(
				(c: any) => typeof c === 'string' && c.trim().length > 0,
			)
			if (customConds.length > 0) return customConds
		}

		// 2. Global shop default settings
		const defaultConds = (productSettings as any)?.defaultSpecialConditions
		if (
			defaultConds &&
			Array.isArray(defaultConds) &&
			defaultConds.length > 0
		) {
			const globalConds = defaultConds.filter(
				(c: any) => typeof c === 'string' && c.trim().length > 0,
			)
			if (globalConds.length > 0) return globalConds
		}

		// 3. Fallback null if neither product nor global setting is defined
		return null
	}, [specialDealConfig, productSettings])

	// Automatically scroll Swiper to variant image when selected
	useEffect(() => {
		if (activeVariant?.image && images && images.length > 0) {
			const variantImgAssetId =
				activeVariant.image?.asset?._ref || activeVariant.image?.asset?._id
			if (variantImgAssetId) {
				const idx = images.findIndex((img) => {
					const imgAssetId = img?.asset?._ref || img?.asset?._id
					return imgAssetId === variantImgAssetId
				})
				if (idx !== -1) {
					setActiveIndex(idx)
					mainSwiperRef.current?.slideTo(idx)
				}
			}
		}
	}, [activeVariant, images])

	const handleAddToCart = () => {
		const variantId = activeVariant?._key || activeVariant?.sku
		const itemSku = currentSku || activeVariant?.sku || sku || ''
		const cartItemId =
			effectiveHasVariants && variantId
				? `${productId}_${variantId}`
				: itemSku || slug

		const itemTitle =
			effectiveHasVariants && activeVariant?.title
				? `${title} (${activeVariant.title})`
				: title

		const itemImage = activeVariant?.image
			? activeVariant.image?.asset?.url
				? activeVariant.image.asset.url
				: urlFor(activeVariant.image).url()
			: images?.[0]
				? urlFor(images[0]).url()
				: '/fallback-image.png'

		addItem({
			id: cartItemId,
			productId,
			productTitle: title,
			variantId,
			variantTitle: activeVariant?.title,
			selectedOptions,
			sku: itemSku,
			title: itemTitle,
			price: finalPrice,
			compareAtPrice: currentCompareAtPrice,
			image: itemImage,
			quantity,
			slug,
			hasVariants: effectiveHasVariants,
			options,
			variants,
			moq,
			priceTiers,
		})

		router.push('/checkout')
	}

	const handleAddToQuoteList = () => {
		const variantId = activeVariant?._key || activeVariant?.sku
		const itemSku = currentSku || activeVariant?.sku || sku || ''
		const cartItemId =
			effectiveHasVariants && variantId
				? `${productId}_${variantId}`
				: itemSku || slug

		const itemTitle =
			effectiveHasVariants && activeVariant?.title
				? `${title} (${activeVariant.title})`
				: title

		const itemImage = activeVariant?.image
			? activeVariant.image?.asset?.url
				? activeVariant.image.asset.url
				: urlFor(activeVariant.image).url()
			: images?.[0]
				? urlFor(images[0]).url()
				: '/fallback-image.png'

		addItem({
			id: cartItemId,
			productId,
			productTitle: title,
			variantId,
			variantTitle: activeVariant?.title,
			selectedOptions,
			sku: itemSku,
			title: itemTitle,
			price: finalPrice,
			compareAtPrice: currentCompareAtPrice,
			image: itemImage,
			quantity,
			slug,
			hasVariants: effectiveHasVariants,
			options,
			variants,
			moq,
			priceTiers,
		})

		showCartToast({
			title: 'Added to Quote List',
			subtitle: `${quantity} units • ${formatPrice(finalPrice)}/unit`,
			checkoutUrl: '/checkout?mode=rfq',
			checkoutLabel: 'Review Quote List & Submit RFQ →',
			timer: 4500,
		})
	}

	const handleOnlyAddToCart = handleAddToQuoteList

	const allReviews = useMemo(() => {
		const list = [...(approvedReviews || [])]
		const sort = productSettings?.defaultReviewSort ?? 'newest'
		if (sort === 'highest') {
			list.sort((a, b) => (b.rating || 5) - (a.rating || 5))
		} else if (sort === 'lowest') {
			list.sort((a, b) => (a.rating || 5) - (b.rating || 5))
		} else {
			list.sort(
				(a, b) =>
					new Date(b.createdAt || 0).getTime() -
					new Date(a.createdAt || 0).getTime(),
			)
		}
		return list
	}, [approvedReviews, productSettings?.defaultReviewSort])

	const { totalReviews, averageRating } = useMemo(() => {
		if (reviewSummary && reviewSummary.count > 0) {
			return {
				totalReviews: reviewSummary.count,
				averageRating: reviewSummary.avgRating,
			}
		}
		if (!allReviews || allReviews.length === 0) {
			return { totalReviews: 0, averageRating: 0 }
		}

		const total = allReviews.reduce(
			(sum, r) => sum + ((r.rating as number) || 5),
			0,
		)

		return {
			totalReviews: allReviews.length,
			averageRating: total / allReviews.length,
		}
	}, [allReviews, reviewSummary])

	// 3. Discount percentage formula: (CompareAt - Price) / CompareAt
	const discountPercent =
		hasSale && currentCompareAtPrice && currentCompareAtPrice > 0
			? Math.round(
					((currentCompareAtPrice - finalPrice) / currentCompareAtPrice) * 100,
				)
			: 0

	// Lightbox data preparation (Images only)
	const [isOpen, setIsOpen] = useState(false)
	const [photoIndex, setPhotoIndex] = useState(0)

	const lightboxImages = useMemo(() => {
		return images
			.map((item) => {
				const media = parseMediaItem(item)
				if (media.type === 'image' && item?.asset) {
					try {
						return {
							src: urlFor(item).width(1200).url(),
							alt: item.alt || title || 'Product image',
						}
					} catch {
						return null
					}
				}
				return null
			})
			.filter((x): x is { src: string; alt: string } => Boolean(x && x.src))
	}, [images, title])

	// State for Review Lightbox
	const [isReviewOpen, setIsReviewOpen] = useState(false)
	const [reviewImages, setReviewImages] = useState([])
	const [reviewIndex, setReviewIndex] = useState(0)
	const handleOpenReviewLightbox = (
		imagesOfThisReview: any[],
		indexClicked: number,
	) => {
		const formattedImages = imagesOfThisReview
			.map((img) => ({
				src: img?.asset?.url || img?.url || '',
				alt: img?.alt || img?.asset?.alt || 'Review image',
			}))
			.filter((img) => Boolean(img.src))

		if (formattedImages.length === 0) return

		// 2. Set review images state
		setReviewImages(formattedImages as any)
		setReviewIndex(Math.min(indexClicked, formattedImages.length - 1))

		// 3. Open lightbox
		setIsReviewOpen(true)
	}

	// State for Review Modal Form
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

	// Review filter state
	const [activeFilter, setActiveFilter] = useState<
		| 'all'
		| '5star'
		| '4star'
		| '3star'
		| '2star'
		| '1star'
		| 'comment'
		| 'media'
	>('all')

	// State for Video Lightbox
	const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

	// Count reviews per filter
	const counts = useMemo(() => {
		let count5Star = 0
		let count4Star = 0
		let count3Star = 0
		let count2Star = 0
		let count1Star = 0
		let countWithComments = 0
		let countWithMedia = 0

		allReviews.forEach((r) => {
			const rating = r.rating || 5
			if (rating === 5) count5Star++
			else if (rating === 4) count4Star++
			else if (rating === 3) count3Star++
			else if (rating === 2) count2Star++
			else if (rating === 1) count1Star++

			if (r.comment && r.comment.trim().length > 0) {
				countWithComments++
			}
			if (
				(r.images && r.images.length > 0) ||
				(r.videos && r.videos.length > 0)
			) {
				countWithMedia++
			}
		})

		return {
			countAll: allReviews.length,
			count5Star,
			count4Star,
			count3Star,
			count2Star,
			count1Star,
			countWithComments,
			countWithMedia,
		}
	}, [allReviews])

	// Filter reviews based on activeFilter
	const filteredReviews = useMemo(() => {
		if (activeFilter === '5star')
			return allReviews.filter((r) => (r.rating || 5) === 5)
		if (activeFilter === '4star')
			return allReviews.filter((r) => r.rating === 4)
		if (activeFilter === '3star')
			return allReviews.filter((r) => r.rating === 3)
		if (activeFilter === '2star')
			return allReviews.filter((r) => r.rating === 2)
		if (activeFilter === '1star')
			return allReviews.filter((r) => r.rating === 1)
		if (activeFilter === 'comment')
			return allReviews.filter((r) => r.comment && r.comment.trim().length > 0)
		if (activeFilter === 'media')
			return allReviews.filter(
				(r) =>
					(r.images && r.images.length > 0) ||
					(r.videos && r.videos.length > 0),
			)
		return allReviews
	}, [allReviews, activeFilter])

	// 1. Pagination State
	const [currentPage, setCurrentPage] = useState(1)
	const REVIEWS_PER_PAGE = 4

	// 2. Pagination slice calculation
	const indexOfLastReview = currentPage * REVIEWS_PER_PAGE
	const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE
	const currentReviews = filteredReviews.slice(
		indexOfFirstReview,
		indexOfLastReview,
	)
	const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE)

	// Page change handler
	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber)
		document
			.getElementById('product-review')
			?.scrollIntoView({ behavior: 'smooth' })
	}

	const handleImageClick = (i: number) => {
		if (enableImageLightbox === false) return
		const imageOnlyIndex = images
			.slice(0, i + 1)
			.filter((m) => parseMediaItem(m).type === 'image').length - 1
		setPhotoIndex(Math.max(0, imageOnlyIndex))
		setIsOpen(true)
	}

	return (
		<div className="space-y-8">
			<div className="grid gap-6 rounded-xl bg-white p-2 lg:grid-cols-2 lg:p-4">
				{/* ================= IMAGES GALLERY ================= */}
				{images.length > 0 && (
					<div
						className={cn(
							'main-image-product-slide space-y-3',
							mediaPosition === 'right' ? 'order-2 lg:order-2' : 'order-1 lg:order-1',
							galleryLayout === 'carousel_left' && 'lg:flex lg:flex-row-reverse lg:gap-3 lg:space-y-0',
						)}
					>
						{/* 1. MAIN SWIPER (Shown for carousel_bottom, carousel_left, and mobile view of grid/stack) */}
						<div
							className={cn(
								'w-full min-w-0',
								(galleryLayout === 'grid_2col' || galleryLayout === 'single_stack') && 'lg:hidden',
							)}
						>
							<Swiper
								modules={[Navigation]}
								onSwiper={(s) => (mainSwiperRef.current = s)}
								onSlideChange={(s) => {
									setActiveIndex(s.activeIndex)
									thumbSwiperRef.current?.slideTo(s.activeIndex)

									// Pause all videos on slide change
									if (mainSwiperRef.current?.el) {
										const videos = mainSwiperRef.current.el.querySelectorAll('video')
										videos.forEach((v) => {
											try {
												v.pause()
											} catch {}
										})
									}
								}}
								navigation
								watchSlidesProgress
								className={cn('overflow-hidden rounded-lg border border-[#f5f5f5] w-full', aspectRatioClass)}
							>
								{images.map((item, i) => {
									const media = parseMediaItem(item)

									if (media.type === 'video') {
										return (
											<SwiperSlide key={i}>
												<div className="relative h-full w-full bg-black flex items-center justify-center">
													<video
														src={media.videoUrl}
														controls
														preload="metadata"
														className="h-full w-full object-contain"
														playsInline
													/>
												</div>
											</SwiperSlide>
										)
									}

									if (media.type === 'videoUrl') {
										return (
											<SwiperSlide key={i}>
												<div className="relative h-full w-full bg-black flex items-center justify-center">
													{media.isIframe ? (
														<iframe
															src={media.embedUrl}
															className="h-full w-full border-0"
															allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
															allowFullScreen
															title={media.alt || 'Product video'}
														/>
													) : (
														<video
															src={media.videoUrl}
															controls
															preload="metadata"
															className="h-full w-full object-contain"
															playsInline
														/>
													)}
												</div>
											</SwiperSlide>
										)
									}

									return (
										<SwiperSlide key={i}>
											<div
												className={cn(
													'h-full w-full',
													enableImageLightbox ? 'cursor-zoom-in' : 'cursor-default',
												)}
												onClick={() => handleImageClick(i)}
												role={enableImageLightbox ? 'button' : undefined}
												tabIndex={enableImageLightbox ? 0 : undefined}
												aria-label={enableImageLightbox ? `Enlarge image ${i + 1} of ${images.length}` : undefined}
												onKeyDown={(e) => {
													if (enableImageLightbox && (e.key === 'Enter' || e.key === ' ')) {
														e.preventDefault()
														handleImageClick(i)
													}
												}}
											>
												<Img
													image={item}
													width={800}
													priority={i === 0}
													sizes="(max-width: 1024px) 100vw, 50vw"
													className="h-full w-full object-cover"
													alt={title}
												/>
											</div>
										</SwiperSlide>
									)
								})}
							</Swiper>
						</div>

						{/* 2. DESKTOP GRID LAYOUT (Only shown if galleryLayout === 'grid_2col') */}
						{galleryLayout === 'grid_2col' && (
							<div className="hidden lg:grid lg:grid-cols-2 lg:gap-3 w-full">
								{images.map((item, i) => {
									const media = parseMediaItem(item)
									const isVideo = media.type === 'video' || media.type === 'videoUrl'
									return (
										<div
											key={i}
											className={cn(
												'relative overflow-hidden rounded-lg border border-[#f5f5f5] bg-gray-50',
												aspectRatioClass,
												i === 0 && images.length % 2 === 1 && 'col-span-2',
												enableImageLightbox && !isVideo && 'cursor-zoom-in',
											)}
											onClick={() => !isVideo && handleImageClick(i)}
										>
											{isVideo ? (
												media.type === 'video' ? (
													<video
														src={media.videoUrl}
														controls
														preload="metadata"
														className="h-full w-full object-cover"
														playsInline
													/>
												) : media.isIframe ? (
													<iframe
														src={media.embedUrl}
														className="h-full w-full border-0"
														allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
														allowFullScreen
														title={media.alt || 'Product video'}
													/>
												) : (
													<video
														src={media.videoUrl}
														controls
														preload="metadata"
														className="h-full w-full object-cover"
														playsInline
													/>
												)
											) : (
												<Img
													image={item}
													width={800}
													priority={i === 0}
													sizes="(max-width: 1024px) 100vw, 50vw"
													className="h-full w-full object-cover transition-transform duration-300 hover:scale-102"
													alt={`${title} - image ${i + 1}`}
												/>
											)}
										</div>
									)
								})}
							</div>
						)}

						{/* 3. DESKTOP SINGLE STACK LAYOUT (Only shown if galleryLayout === 'single_stack') */}
						{galleryLayout === 'single_stack' && (
							<div className="hidden lg:space-y-4 w-full">
								{images.map((item, i) => {
									const media = parseMediaItem(item)
									const isVideo = media.type === 'video' || media.type === 'videoUrl'
									return (
										<div
											key={i}
											className={cn(
												'relative overflow-hidden rounded-lg border border-[#f5f5f5] bg-gray-50',
												aspectRatioClass,
												enableImageLightbox && !isVideo && 'cursor-zoom-in',
											)}
											onClick={() => !isVideo && handleImageClick(i)}
										>
											{isVideo ? (
												media.type === 'video' ? (
													<video
														src={media.videoUrl}
														controls
														preload="metadata"
														className="h-full w-full object-contain"
														playsInline
													/>
												) : media.isIframe ? (
													<iframe
														src={media.embedUrl}
														className="h-full w-full border-0"
														allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
														allowFullScreen
														title={media.alt || 'Product video'}
													/>
												) : (
													<video
														src={media.videoUrl}
														controls
														preload="metadata"
														className="h-full w-full object-contain"
														playsInline
													/>
												)
											) : (
												<Img
													image={item}
													width={1000}
													priority={i === 0}
													sizes="(max-width: 1024px) 100vw, 50vw"
													className="h-full w-full object-cover"
													alt={`${title} - image ${i + 1}`}
												/>
											)}
										</div>
									)
								})}
							</div>
						)}

						{/* 4. LIGHTBOX COMPONENT */}
						{enableImageLightbox && (
							<SlideshowLightbox
								images={lightboxImages}
								showThumbnails={true}
								open={isOpen}
								lightboxIdentifier="lbox1"
								startingSlideIndex={photoIndex}
								onClose={() => setIsOpen(false)}
								modalClose="clickOutside"
							/>
						)}

						{/* 5. THUMBNAILS (For carousel_bottom and carousel_left) */}
						{galleryLayout !== 'grid_2col' && galleryLayout !== 'single_stack' && (
							<div
								className={cn(
									'relative',
									galleryLayout === 'carousel_left'
										? 'lg:w-20 lg:flex-none lg:overflow-y-auto lg:max-h-[520px] lg:pr-1'
										: 'w-full',
								)}
							>
								{galleryLayout === 'carousel_left' ? (
									// Vertical Thumbnails on desktop
									<div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
										{images.map((item, i) => {
											const media = parseMediaItem(item)
											const isVideo = media.type === 'video' || media.type === 'videoUrl'
											return (
												<button
													key={i}
													type="button"
													onClick={() => {
														setActiveIndex(i)
														mainSwiperRef.current?.slideTo(i)
													}}
													aria-label={`View ${isVideo ? 'video' : 'image'} ${i + 1} of ${images.length}`}
													aria-current={activeIndex === i ? 'true' : undefined}
													className={`relative aspect-square w-16 lg:w-full flex-none overflow-hidden rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
														activeIndex === i
															? 'border-2 border-primary ring-1 ring-primary/40 opacity-100'
															: 'border border-gray-200 opacity-60 hover:opacity-100'
													}`}
												>
													{isVideo ? (
														<div className="relative aspect-square h-full w-full overflow-hidden rounded-md bg-black">
															{media.poster ? (
																<img
																	src={media.poster}
																	alt=""
																	className="h-full w-full object-cover opacity-80"
																/>
															) : (
																<div className="h-full w-full bg-gray-900" />
															)}
															<div className="absolute inset-0 flex items-center justify-center">
																<div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
																	<FiPlay className="ml-0.5 h-2.5 w-2.5 fill-white" />
																</div>
															</div>
														</div>
													) : (
														<Img
															image={item}
															width={120}
															className="aspect-square w-full object-cover"
															alt=""
														/>
													)}
												</button>
											)
										})}
									</div>
								) : (
									// Horizontal Swiper Thumbnails (Default)
									<>
										<Swiper
											onSwiper={(s) => (thumbSwiperRef.current = s)}
											modules={[Navigation]}
											slidesPerView={6}
											spaceBetween={8}
											navigation={{
												nextEl: '.thumb-next',
												prevEl: '.thumb-prev',
											}}
											className="thumb-swiper w-full"
										>
											{images.map((item, i) => {
												const media = parseMediaItem(item)
												const isVideo = media.type === 'video' || media.type === 'videoUrl'

												return (
													<SwiperSlide key={i}>
														<button
															type="button"
															onClick={() => {
																setActiveIndex(i)
																mainSwiperRef.current?.slideTo(i)
															}}
															aria-label={`View ${isVideo ? 'video' : 'image'} ${i + 1} of ${images.length}`}
															aria-current={activeIndex === i ? 'true' : undefined}
															className={`relative aspect-square w-full overflow-hidden rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
																activeIndex === i
																	? 'border-2 border-blue-600 opacity-100'
																	: 'opacity-50 hover:opacity-80'
															}`}
														>
															{isVideo ? (
																<div className="relative aspect-square h-full w-full overflow-hidden rounded-md bg-black">
																	{media.poster ? (
																		<img
																			src={media.poster}
																			alt={title}
																			className="h-full w-full object-cover opacity-80"
																		/>
																	) : media.videoUrl ? (
																		<video
																			src={media.videoUrl}
																			preload="metadata"
																			className="h-full w-full object-cover opacity-80"
																		/>
																	) : (
																		<div className="h-full w-full bg-gray-900" />
																	)}

																	{/* Dark Overlay */}
																	<div className="absolute inset-0 bg-black/20" />

																	{/* Center Play Button Circle */}
																	<div className="absolute inset-0 flex items-center justify-center">
																		<div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-2xs">
																			<FiPlay className="ml-0.5 h-3.5 w-3.5 fill-white" />
																		</div>
																	</div>

																	{/* Bottom Right Badge Pill */}
																	<div className="absolute right-1 bottom-1 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-2xs">
																		<FiFilm className="h-2.5 w-2.5" />
																		<span>Video</span>
																	</div>
																</div>
															) : (
																<Img
																	image={item}
																	width={200}
																	className="aspect-square w-full object-cover"
																	alt={title}
																/>
															)}
														</button>
													</SwiperSlide>
												)
											})}
										</Swiper>

										<button
											type="button"
											aria-label="Previous thumbnail"
											onClick={() => thumbSwiperRef.current?.slidePrev()}
											className="thumb-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer bg-white p-1 shadow rounded-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
										>
											‹
										</button>
										<button
											type="button"
											aria-label="Next thumbnail"
											onClick={() => thumbSwiperRef.current?.slideNext()}
											className="thumb-next absolute right-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer bg-white p-1 shadow rounded-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
										>
											›
										</button>
									</>
								)}
							</div>
						)}
					</div>
				)}
				{/* ================= INFO ================= */}
				<div className={cn('space-y-4', mediaPosition === 'right' ? 'order-1 lg:order-1' : 'order-2 lg:order-2')}>
					<h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>

					{shortPitch && (
						<p className="text-base text-gray-600 leading-relaxed font-normal">
							{shortPitch}
						</p>
					)}

					{/* META */}
					<div className="flex flex-wrap items-center gap-2.5 text-sm">
						{enableSkuDisplay && currentSku && (
							<span className="font-semibold text-gray-700">SKU: {currentSku}</span>
						)}

						{enableReviews && enableReviewStars && totalReviews > 0 && (
							<>
								{enableSkuDisplay && currentSku && <span className="text-gray-300">|</span>}
								<Link href="#product-review" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
									<span className="flex items-center gap-1">
										<span className="text-gray-600 flex items-center gap-1 font-medium">
											{averageRating.toFixed(1)}
											<FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
											({totalReviews} reviews)
										</span>
									</span>
								</Link>
							</>
						)}

						{enableSoldCount && typeof sales === 'number' && sales > 0 && (
							<>
								{((enableSkuDisplay && currentSku) || (enableReviews && enableReviewStars && totalReviews > 0)) && (
									<span className="text-gray-300">|</span>
								)}
								<span className="text-emerald-700 font-medium">Delivered: {sales.toLocaleString()} units globally</span>
							</>
						)}

						{enableSocialShare && (
							<>
								{((enableSkuDisplay && currentSku) || (enableReviews && enableReviewStars && totalReviews > 0) || (enableSoldCount && sales && sales > 0)) && (
									<span className="text-gray-300">|</span>
								)}
								<button
									type="button"
									onClick={handleShare}
									aria-label="Share this product"
									className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
								>
									{isCopied ? (
										<>
											<FiCheck className="h-3.5 w-3.5 text-emerald-600" />
											<span className="text-emerald-700">Link Copied!</span>
										</>
									) : (
										<>
											<FiShare2 className="h-3.5 w-3.5 text-slate-500" />
											<span>Share</span>
										</>
									)}
								</button>
							</>
						)}
					</div>

					{enableCategoryDisplay && category && category.length > 0 && (
						<div className="categories flex items-center gap-2 text-sm">
							<span className="font-semibold text-gray-700">Category: </span>
							<Categories categories={category} linked />
						</div>
					)}

					{/* LOW STOCK ALERT */}
					{enableStockBadge &&
						typeof currentStock === 'number' &&
						currentStock > 0 &&
						currentStock <= lowStockThreshold && (
							<div
								role="status"
								className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
							>
								<FiAlertCircle className="h-3.5 w-3.5 text-amber-600 flex-none" />
								<span>Factory Allocation: Only {currentStock} units remaining in current export batch</span>
							</div>
						)}

					{/* VARIANT SELECTOR */}
					{effectiveHasVariants && effectiveOptions.length > 0 && (
						<div className="space-y-3.5 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3.5 sm:p-4">
							{effectiveOptions.map((option) => (
								<div key={option.name} className="space-y-2">
									<div className="flex items-center justify-between text-xs font-semibold text-gray-700">
										<span>
											{option.name}:{' '}
											<strong className="font-bold text-gray-900">
												{selectedOptions[option.name] || 'Select'}
											</strong>
										</span>
									</div>
									{variantSelectorStyle === 'dropdown' ? (
										<div className="relative">
											<label htmlFor={`option-${option.name}`} className="sr-only">
												Choose {option.name}
											</label>
											<select
												id={`option-${option.name}`}
												value={selectedOptions[option.name] || ''}
												onChange={(e) =>
													setSelectedOptions((prev) => ({
														...prev,
														[option.name]: e.target.value,
													}))
												}
												className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
											>
												{option.values.map((val) => {
													const testOptions = {
														...selectedOptions,
														[option.name]: val,
													}
													const matchedVariant = variants?.find((v) =>
														v.options?.every((o) => {
															const selVal = testOptions[o.name]
															return (
																selVal &&
																selVal.trim().toLowerCase() ===
																	o.value?.trim().toLowerCase()
															)
														}),
													)
													const isOutOfStock =
														matchedVariant &&
														typeof matchedVariant.stock === 'number' &&
														matchedVariant.stock <= 0

													if (showOutOfStockVariants === 'hidden' && isOutOfStock) {
														return null
													}

													return (
														<option key={val} value={val}>
															{val}{isOutOfStock ? ' (Out of stock)' : ''}
														</option>
													)
												})}
											</select>
										</div>
									) : (
										<div className="flex flex-wrap gap-2" role="group" aria-label={`Select ${option.name}`}>
											{option.values.map((val) => {
												const isSelected = selectedOptions[option.name] === val
												const testOptions = {
													...selectedOptions,
													[option.name]: val,
												}
												const matchedVariant = variants?.find((v) =>
													v.options?.every((o) => {
														const selVal = testOptions[o.name]
														return (
															selVal &&
															selVal.trim().toLowerCase() ===
																o.value?.trim().toLowerCase()
														)
													}),
												)
												const isOutOfStock =
													matchedVariant &&
													typeof matchedVariant.stock === 'number' &&
													matchedVariant.stock <= 0

												if (showOutOfStockVariants === 'hidden' && isOutOfStock) {
													return null
												}

												const variantImg = matchedVariant?.image
												const hasVariantImage = Boolean(
													variantImg &&
														(variantImg.asset ||
															variantImg.url ||
															typeof variantImg === 'string'),
												)

												// If variant has an image -> Show image swatch
												if (hasVariantImage) {
													return (
														<button
															key={val}
															type="button"
															onClick={() =>
																setSelectedOptions((prev) => ({
																	...prev,
																	[option.name]: val,
																}))
															}
															aria-label={`${val}${isOutOfStock ? ' (Out of stock)' : ''}`}
															aria-pressed={isSelected}
															className={`relative flex h-10 w-10 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
																isSelected
																	? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs scale-105'
																	: isOutOfStock
																		? 'border-gray-200 opacity-40 grayscale'
																		: 'border-gray-200 hover:border-blue-400'
															}`}
															title={`${val}${isOutOfStock ? ' (Out of stock)' : ''}`}
														>
															<Img
																image={variantImg}
																width={80}
																className="h-full w-full object-cover"
																alt={val}
															/>
															{isOutOfStock && (
																<div className="absolute inset-0 flex items-center justify-center bg-black/40">
																	<div className="h-0.5 w-full -rotate-45 bg-white" />
																</div>
															)}
														</button>
													)
												}

												// Otherwise -> Show text button
												return (
													<button
														key={val}
														type="button"
														onClick={() =>
															setSelectedOptions((prev) => ({
																...prev,
																[option.name]: val,
															}))
														}
														aria-pressed={isSelected}
														className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
															isSelected
																? 'border-primary bg-primary font-semibold text-primary-foreground shadow-xs'
																: isOutOfStock
																	? 'border-gray-200 bg-gray-100 text-gray-400 line-through opacity-60'
																	: 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'
														}`}
													>
														{val}
													</button>
												)
											})}
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* SPECIAL DEAL / FACTORY ALLOCATION RUN VS STANDARD PRICING */}
					{enableSpecialDeal ? (
						<div className="mt-4 overflow-hidden rounded-2xl border-2 border-slate-800 bg-white shadow-md">
							{/* EXECUTIVE ALLOCATION HEADER BANNER */}
							<div className="flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 p-3.5 text-white sm:p-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-sm font-bold tracking-wide text-white sm:text-base">
										{specialDealConfig?.badgeIcon ? (
											<img
												src={
													typeof specialDealConfig.badgeIcon === 'string'
														? specialDealConfig.badgeIcon
														: urlFor(specialDealConfig.badgeIcon).url()
												}
												alt=""
												className="h-5 w-auto flex-none object-contain sm:h-6"
											/>
										) : (
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
												<FiCheck className="h-3 w-3" />
											</span>
										)}
										<span className="tracking-tight">
											{specialDealConfig?.badgeTitle || 'Factory Direct Export Allocation'}
										</span>
									</div>
									<div className="space-y-0.5">
										<div className="text-2xl leading-tight font-extrabold text-emerald-400 sm:text-3xl">
											{finalPrice <= 0 ? 'Inquire for Pricing' : formatPrice(finalPrice)}
											<span className="text-xs font-medium text-slate-300 ml-1.5">
												/ unit ({priceDisplayUnit || 'FOB Vietnam Port'})
											</span>
										</div>
										{showDiscountBadge &&
											hasSale &&
											currentCompareAtPrice &&
											currentCompareAtPrice > 0 && (
												<div className="text-xs leading-tight font-normal text-white/80 sm:text-sm">
													<span className="line-through text-slate-400">
														{formatPrice(currentCompareAtPrice)}
													</span>
													<span className="ml-1.5 font-semibold text-emerald-300">
														(Save {discountPercent}% on volume)
													</span>
												</div>
											)}
									</div>
								</div>

								{/* COUNTDOWN & QUOTA */}
								<FlashSaleCountdown
									endTime={specialDealConfig?.endTime}
									totalQuota={specialDealConfig?.totalQuota ?? 20}
									remainingQuota={specialDealConfig?.remainingQuota ?? 14}
								/>
							</div>

							{/* ALLOCATION INNER DETAILS & CTAS */}
							<div className="space-y-3.5 bg-white p-3.5 sm:p-4">
								{/* CHANNEL TAG */}
								<div className="text-xs font-extrabold tracking-wider text-slate-700 uppercase sm:text-sm flex items-center gap-1.5">
									<span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
									{specialDealConfig?.channelText || 'EXPORT DIRECT BATCH ALLOCATION'}
								</div>

								{/* PROMOTIONS LIST BLOCK INSIDE ALLOCATION */}
								{effectivePromotions &&
									effectivePromotions.items &&
									effectivePromotions.items.length > 0 && (
										<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
											<div className="space-y-0.5 border-b border-slate-200 pb-2">
												<h3 className="my-0 text-sm font-bold text-gray-900 sm:text-base">
													{effectivePromotions.title || 'Export Commercial Terms'}
												</h3>
												{effectivePromotions.subtitle && (
													<p className="my-0 text-xs text-gray-500">
														{effectivePromotions.subtitle}
													</p>
												)}
											</div>

											<div className="space-y-2.5">
												{effectivePromotions.items.map(
													(item: any, idx: number) => (
														<div key={idx} className="flex items-start gap-2.5">
															<span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-2xs">
																{idx + 1}
															</span>
															<div className="min-w-0 flex-1 text-xs leading-snug text-gray-800 sm:text-sm">
																<span
																	className={
																		item.highlight
																			? 'font-semibold text-gray-900'
																			: ''
																	}
																>
																	{item.text}
																</span>
																{item.linkText && item.linkUrl && (
																	<a
																		href={item.linkUrl}
																		target={
																			item.linkUrl.startsWith('http')
																				? '_blank'
																				: '_self'
																		}
																		rel="noopener noreferrer"
																		className="ml-1 inline-block font-medium text-primary hover:underline"
																	>
																		{item.linkText}
																	</a>
																)}
															</div>
														</div>
													),
												)}
											</div>
										</div>
									)}

								{/* SPECIAL CONDITIONS / NOTES BLOCK */}
								{effectiveSpecialConditions &&
									effectiveSpecialConditions.length > 0 && (
										<div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
											{effectiveSpecialConditions.map(
												(cond: string, idx: number) => (
													<div
														key={idx}
														className="flex items-start gap-2 text-xs font-semibold text-slate-800 sm:text-sm"
													>
														<span className="font-bold text-emerald-600">•</span>
														<span>{cond}</span>
													</div>
												),
											)}
										</div>
									)}

								{/* B2B CONVERSION TRIAD CTA (NO PAYMENT REQUIRED) */}
								<div ref={mainCtaRef} className="pt-1 space-y-2.5">
									<div className="flex flex-wrap items-center gap-3">
										{enableQuantitySelector && (
											<div
												className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50/50"
												role="group"
												aria-label="Quantity selector"
											>
												<button
													type="button"
													aria-label="Decrease quantity"
													className="flex h-11 w-10 cursor-pointer items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
													onClick={() => setQuantity((q) => Math.max(moq && moq > 1 ? moq : 1, q - 1))}
												>
													−
												</button>
												<span
													role="status"
													aria-live="polite"
													aria-label={`Current quantity: ${quantity}`}
													className="flex h-11 w-12 items-center justify-center text-sm font-bold text-gray-900"
												>
													{quantity}
												</span>
												<button
													type="button"
													aria-label="Increase quantity"
													className="flex h-11 w-10 cursor-pointer items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
													onClick={() => setQuantity((q) => q + 1)}
												>
													+
												</button>
											</div>
										)}

										{/* PRIMARY ACTION: REQUEST OFFICIAL QUOTE */}
										<button
											type="button"
											onClick={() => handleOpenRfq(false)}
											className="flex h-11 min-w-[200px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 sm:h-12"
										>
											<FiFileText className="text-base text-emerald-400" />
											<span>{rfqCtaLabel || 'Request Official Quotation (RFQ)'}</span>
										</button>
									</div>

									{/* SECONDARY ROW: ADD TO MULTI-ITEM QUOTE + SAMPLE REQUEST */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<button
											type="button"
											onClick={handleAddToQuoteList}
											className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
										>
											<FiFileText className="h-4 w-4 text-primary" />
											<span>{quoteListCtaLabel || '+ Add to Quote List'}</span>
										</button>

										{enableSampleButton && (
											<button
												type="button"
												onClick={() => handleOpenRfq(true)}
												className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											>
												<FiPackage className="h-4 w-4 text-slate-600" />
												<span>{sampleOrderCtaLabel || 'Order Evaluation Sample'}</span>
											</button>
										)}
									</div>

									{/* DIRECT E-COMMERCE CART BUTTONS (IF ENABLED) */}
									{(enableAddToCartButton || enableBuyNowButton) && (
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
											{enableAddToCartButton && (
												<button
													type="button"
													onClick={() => {
														handleAddToCart()
														showCartToast({
															title: 'Added to Cart',
															subtitle: `${quantity} × ${title}`,
															checkoutUrl: '/checkout',
															checkoutLabel: 'Proceed to Checkout →',
															timer: 3500,
														})
													}}
													className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white text-xs sm:text-sm font-bold text-slate-900 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98]"
												>
													<HiOutlineBuildingStorefront className="text-base" />
													<span>{addToCartButtonText || 'Add to Cart'}</span>
												</button>
											)}
											{enableBuyNowButton && (
												<button
													type="button"
													onClick={handleAddToCart}
													className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs sm:text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
												>
													<span>{buyNowButtonText || 'Buy Now'}</span>
												</button>
											)}
										</div>
									)}

									{/* SPECIALIST DIRECT INQUIRY */}
									{enableContactButton && (
										<div className="w-full">
											<a
												href={contactButtonLink || 'mailto:sales@deanflow.com'}
												target={contactButtonLink?.startsWith('http') ? '_blank' : '_self'}
												rel="noopener noreferrer"
												className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 no-underline shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											>
												<FiMessageCircle className="h-4 w-4 text-emerald-600" />
												<span>{contactButtonText || 'Talk to Export Specialist (WhatsApp / Direct Email)'}</span>
											</a>
										</div>
									)}

									{/* WHATSAPP DIRECT INQUIRY */}
									{enableWhatsAppQuickChat && whatsAppNumber && (
										<div className="w-full">
											<a
												href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
													`Hello DeanFlow, I would like to inquire about ${title} (${currentSku || 'SKU'}).`
												)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-emerald-800 no-underline shadow-2xs transition hover:bg-emerald-100 hover:text-emerald-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
											>
												<FiMessageCircle className="h-4 w-4 text-emerald-600" />
												<span>Chat on WhatsApp: {whatsAppNumber}</span>
											</a>
										</div>
									)}

									{/* ZERO PAYMENT REASSURANCE */}
									<div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-gray-500">
										<FiShield className="h-3.5 w-3.5 text-emerald-600 flex-none" />
										<span>No upfront payment required. Dedicated specialist confirms freight & Proforma within 12 hours.</span>
									</div>
								</div>
							</div>
						</div>
					) : (
						<>
							{/* STANDARD PRICING */}
							<div className="flex flex-wrap items-baseline gap-3">
								<span className="text-2xl font-black text-red-600">
									{activeTier?.isCustomQuote
										? 'VIP Custom Quote'
										: finalPrice <= 0
											? 'Inquire for Pricing'
											: formatPrice(finalPrice)}
								</span>

								{activeTier && !activeTier.isCustomQuote && (
									<span className="text-xs font-semibold text-gray-500">
										/ unit ({priceDisplayUnit || activeTier.incoterm || 'FOB'})
									</span>
								)}

								{showDiscountBadge &&
									hasSale &&
									currentCompareAtPrice &&
									currentCompareAtPrice > 0 &&
									!activeTier && (
										<>
											<span className="text-sm text-gray-400 line-through">
												{formatPrice(currentCompareAtPrice)}
											</span>

											<span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
												-{discountPercent}%
											</span>
										</>
									)}
							</div>

							{/* INTERACTIVE B2B TIERED PRICING MATRIX */}
							{showPriceTiers && priceTiers && priceTiers.length > 0 && (
								<div className="my-3 rounded-2xl border border-gray-200/90 bg-gray-50/80 p-3.5 sm:p-4">
									<div className="flex items-center justify-between mb-2.5">
										<span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
											<HiOutlineSparkles className="text-primary text-sm" />
											Volume Tiered Pricing Matrix (B2B)
										</span>
										{moq && moq > 1 && (
											<span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md">
												MOQ: {moq} units
											</span>
										)}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
										{priceTiers.map((tier, idx) => {
											const isCurrentActive =
												activeTier &&
												activeTier.minQty === tier.minQty &&
												activeTier.maxQty === tier.maxQty
											const rangeStr = tier.maxQty
												? `${tier.minQty.toLocaleString()} – ${tier.maxQty.toLocaleString()} units`
												: `${tier.minQty.toLocaleString()}+ units`

											return (
												<button
													key={idx}
													type="button"
													onClick={() => setQuantity(tier.minQty)}
													className={`relative flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
														isCurrentActive
															? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
															: 'border-gray-200 bg-white hover:border-gray-300'
													}`}
												>
													{tier.badge && (
														<span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-white">
															{tier.badge}
														</span>
													)}
													<span className="text-[11px] font-semibold text-gray-600">
														{rangeStr}
													</span>
													<div className="flex items-baseline gap-1 mt-0.5">
														{tier.isCustomQuote ? (
															<span className="text-xs font-bold text-primary">
																VIP Quote
															</span>
														) : (
															<>
																<span className="text-sm font-extrabold text-gray-900">
																	{formatPrice(tier.unitPrice ?? 0)}
																</span>
																<span className="text-[10px] text-gray-500">
																	/{tier.incoterm || 'FOB'}
																</span>
															</>
														)}
													</div>
													{isCurrentActive ? (
														<span className="mt-1 text-[10px] font-bold text-primary flex items-center gap-0.5">
															<HiOutlineCheck className="text-xs" /> Active Tier
														</span>
													) : (
														<span className="mt-1 text-[10px] text-gray-400">
															Select Tier
														</span>
													)}
												</button>
											)
										})}
									</div>
									{priceNote && (
										<p className="mt-2.5 text-[11px] text-gray-500 leading-tight">
											* {priceNote}
										</p>
									)}
								</div>
							)}

							{/* STANDARD B2B CONVERSION TRIAD CTA (NO PAYMENT REQUIRED) */}
							{finalPrice <= 0 ? null : (
								<div ref={mainCtaRef} className="py-2 space-y-2.5">
									<div className="flex flex-wrap items-center gap-3">
										{enableQuantitySelector && (
											<div
												className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50/50"
												role="group"
												aria-label="Quantity selector"
											>
												<button
													type="button"
													aria-label="Decrease quantity"
													className="flex h-11 w-10 cursor-pointer items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
													onClick={() => setQuantity((q) => Math.max(moq && moq > 1 ? moq : 1, q - 1))}
												>
													−
												</button>
												<span
													role="status"
													aria-live="polite"
													aria-label={`Current quantity: ${quantity}`}
													className="flex h-11 w-12 items-center justify-center text-sm font-bold text-gray-900"
												>
													{quantity}
												</span>
												<button
													type="button"
													aria-label="Increase quantity"
													className="flex h-11 w-10 cursor-pointer items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
													onClick={() => setQuantity((q) => q + 1)}
												>
													+
												</button>
											</div>
										)}

										{/* PRIMARY ACTION: REQUEST OFFICIAL QUOTE */}
										<button
											type="button"
											onClick={() => handleOpenRfq(false)}
											className="flex h-11 min-w-[220px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs sm:text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 sm:h-12"
										>
											<FiFileText className="text-base text-emerald-400" />
											<span>{rfqCtaLabel || 'Request Official Quotation (RFQ)'}</span>
										</button>
									</div>

									{/* SECONDARY ROW: ADD TO MULTI-ITEM QUOTE + SAMPLE REQUEST */}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<button
											type="button"
											onClick={handleAddToQuoteList}
											className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
										>
											<FiFileText className="h-4 w-4 text-primary" />
											<span>{quoteListCtaLabel || '+ Add to Quote List'}</span>
										</button>

										{enableSampleButton && (
											<button
												type="button"
												onClick={() => handleOpenRfq(true)}
												className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											>
												<FiPackage className="h-4 w-4 text-slate-600" />
												<span>{sampleOrderCtaLabel || 'Order Evaluation Sample'}</span>
											</button>
										)}
									</div>

									{/* DIRECT E-COMMERCE CART BUTTONS (IF ENABLED) */}
									{(enableAddToCartButton || enableBuyNowButton) && (
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
											{enableAddToCartButton && (
												<button
													type="button"
													onClick={() => {
														handleAddToCart()
														showCartToast({
															title: 'Added to Cart',
															subtitle: `${quantity} × ${title}`,
															checkoutUrl: '/checkout',
															checkoutLabel: 'Proceed to Checkout →',
															timer: 3500,
														})
													}}
													className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-900 bg-white text-xs sm:text-sm font-bold text-slate-900 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98]"
												>
													<HiOutlineBuildingStorefront className="text-base" />
													<span>{addToCartButtonText || 'Add to Cart'}</span>
												</button>
											)}
											{enableBuyNowButton && (
												<button
													type="button"
													onClick={handleAddToCart}
													className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs sm:text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
												>
													<span>{buyNowButtonText || 'Buy Now'}</span>
												</button>
											)}
										</div>
									)}

									{/* SPECIALIST DIRECT INQUIRY */}
									{enableContactButton && (
										<div className="w-full">
											<a
												href={contactButtonLink || 'mailto:sales@deanflow.com'}
												target={contactButtonLink?.startsWith('http') ? '_blank' : '_self'}
												rel="noopener noreferrer"
												className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 no-underline shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											>
												<FiMessageCircle className="h-4 w-4 text-emerald-600" />
												<span>{contactButtonText || 'Talk to Export Specialist (WhatsApp / Direct Email)'}</span>
											</a>
										</div>
									)}

									{/* WHATSAPP DIRECT INQUIRY */}
									{enableWhatsAppQuickChat && whatsAppNumber && (
										<div className="w-full">
											<a
												href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
													`Hello DeanFlow, I would like to inquire about ${title} (${currentSku || 'SKU'}).`
												)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-emerald-800 no-underline shadow-2xs transition hover:bg-emerald-100 hover:text-emerald-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
											>
												<FiMessageCircle className="h-4 w-4 text-emerald-600" />
												<span>Chat on WhatsApp: {whatsAppNumber}</span>
											</a>
										</div>
									)}

									{/* ZERO PAYMENT REASSURANCE */}
									<div className="flex items-center justify-center gap-2 pt-0.5 text-[11px] text-gray-500">
										<FiShield className="h-3.5 w-3.5 text-emerald-600 flex-none" />
										<span>No upfront payment required. Official Proforma Invoice & freight rate confirmed within 12 hours.</span>
									</div>
								</div>
							)}

							{/* B2B LEAD TIME & TRANSIT ESTIMATOR MICRO-WIDGET */}
							{enableShippingEstimator && (
								<div className="mt-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-xs text-slate-800">
									<div className="flex items-center justify-between border-b border-slate-200/70 pb-2 mb-2.5">
										<span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
											<HiOutlineTruck className="text-primary text-sm" />
											Estimated Production & Transit Schedule
										</span>
										<span className="text-[10px] text-slate-500 font-mono">
											{defaultOriginPort || 'Origin: Vietnam Port (FOB)'}
										</span>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-slate-600 flex items-center gap-1">
												<HiOutlineClock className="text-slate-400" />
												Factory Production Time:
											</span>
											<strong className="text-slate-900">
												{leadTime || `${quantity < 5000 ? '2–4' : quantity < 20000 ? '5–8' : '10–15'} business days`}
											</strong>
										</div>

										<div className="flex items-center justify-between gap-2">
											<span className="text-slate-600">Destination Port / Region:</span>
											<select
												value={targetPort}
												onChange={(e) => setTargetPort(e.target.value)}
												className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-primary"
											>
												<option value="us_west">US West Coast (Long Beach / LA Port)</option>
												<option value="us_east">US East Coast (New York / NJ Port)</option>
												<option value="eu_rotterdam">Europe (Rotterdam / Hamburg Port)</option>
												<option value="jp_tokyo">Japan (Tokyo / Yokohama Port)</option>
												<option value="au_sydney">Australia (Sydney / Melbourne Port)</option>
												<option value="asean">Southeast Asia (Singapore / BKK)</option>
												<option value="vn_domestic">Vietnam Domestic (Factory Gate)</option>
											</select>
										</div>

										<div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
											<div className="p-2 rounded-xl bg-white border border-slate-200">
												<span className="text-slate-500 flex items-center gap-1">
													<FiAnchor className="h-3.5 w-3.5 text-slate-500" />
													Ocean Freight (FCL/LCL):
												</span>
												<strong className="text-slate-900 text-xs mt-0.5 block">
													{targetPort === 'vn_domestic'
														? '1–2 business days'
														: targetPort === 'us_west'
															? '16–21 days'
															: targetPort === 'us_east'
																? '24–30 days'
																: targetPort === 'eu_rotterdam'
																	? '26–32 days'
																	: targetPort === 'jp_tokyo'
																		? '7–10 days'
																		: targetPort === 'au_sydney'
																			? '14–18 days'
																			: '4–6 days'}
												</strong>
											</div>
											<div className="p-2 rounded-xl bg-white border border-slate-200">
												<span className="text-slate-500 flex items-center gap-1">
													<FiSend className="h-3.5 w-3.5 text-slate-500" />
													Air Express Courier:
												</span>
												<strong className="text-slate-900 text-xs mt-0.5 block">
													{targetPort === 'vn_domestic' ? 'Same-day dispatch' : '3–5 business days'}
												</strong>
											</div>
										</div>

										{specSheetPdf?.asset?.url && (
											<a
												href={specSheetPdf.asset.url}
												target="_blank"
												rel="noopener noreferrer"
												className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
											>
												<HiOutlineDocumentArrowDown className="text-base text-primary" />
												<span>Download Technical Spec Sheet (TDS PDF)</span>
											</a>
										)}
									</div>
								</div>
							)}

							{/* STANDARD PROMOTIONS LIST BLOCK */}
							{effectivePromotions &&
								effectivePromotions.items &&
								effectivePromotions.items.length > 0 && (
									<div className="mt-3.5 space-y-3 rounded-2xl border border-blue-100/90 bg-linear-to-b from-blue-50/40 via-white to-blue-50/20 p-4 shadow-2xs">
										<div className="space-y-0.5 border-b border-blue-100/70 pb-2.5">
											<h3 className="my-0 text-base font-bold text-gray-900">
												{effectivePromotions.title || 'Promotions & Commercial Terms'}
											</h3>
											{effectivePromotions.subtitle && (
												<p className="my-0 text-xs text-gray-500">
													{effectivePromotions.subtitle}
												</p>
											)}
										</div>

										<div className="space-y-2.5">
											{effectivePromotions.items.map(
												(item: any, idx: number) => (
													<div key={idx} className="flex items-start gap-2.5">
														<span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-2xs">
															{idx + 1}
														</span>
														<div className="min-w-0 flex-1 text-xs leading-snug text-gray-800 sm:text-sm">
															<span
																className={
																	item.highlight
																		? 'font-semibold text-gray-900'
																		: ''
																}
															>
																{item.text}
															</span>
															{item.linkText && item.linkUrl && (
																<a
																	href={item.linkUrl}
																	target={
																		item.linkUrl.startsWith('http')
																			? '_blank'
																			: '_self'
																	}
																	rel="noopener noreferrer"
																	className="ml-1 inline-block font-medium text-primary hover:underline"
																>
																	{item.linkText}
																</a>
															)}
														</div>
													</div>
												),
											)}
										</div>
									</div>
								)}
						</>
					)}

					{/* TRUST BADGES & STORE COMMITMENTS */}
					{trustBadges &&
						trustBadges.length > 0 && (
							<div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:grid-cols-2">
								{trustBadges.map((badge: any, idx: number) => {
									const iconUrl = badge?.icon ? urlFor(badge.icon).url() : null
									return (
										<div key={idx} className="flex items-center gap-2.5">
											{iconUrl ? (
												<img
													src={iconUrl}
													alt={badge.title || ''}
													className="h-6 w-6 flex-none object-contain"
												/>
											) : (
												<div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-800 text-white">
													<FiCheck className="h-3.5 w-3.5" />
												</div>
											)}
											<div className="min-w-0">
												<p className="truncate text-xs leading-tight font-bold text-gray-900">
													{badge.title}
												</p>
												{badge.subtitle && (
													<p className="truncate text-[11px] leading-tight text-gray-500">
														{badge.subtitle}
													</p>
												)}
											</div>
										</div>
									)
								})}
							</div>
						)}

					{/* KEY BENEFITS */}
					{keyBenefits && keyBenefits.length > 0 && (
						<div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-2">
							<h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Key Benefits</h3>
							<ul className="space-y-1.5 text-xs text-gray-700">
								{keyBenefits.map((b: any, idx: number) => (
									<li key={idx} className="flex items-start gap-2">
										<FiCheck className="text-emerald-600 h-4 w-4 shrink-0 mt-0.5" />
										<div>
											<strong className="text-gray-900">{b.title}</strong>
											{b.description && <span className="text-gray-600 ml-1">— {b.description}</span>}
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* SPECIFICATIONS */}
					{specs && specs.length > 0 && (
						<div className="mt-3 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3.5 space-y-2">
							<h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Specifications</h3>
							<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
								{specs.map((s: any, idx: number) => (
									<div key={idx} className="flex justify-between border-b border-gray-200/50 pb-1">
										<dt className="text-gray-500 font-medium">{s.label}:</dt>
										<dd className="font-semibold text-gray-800">{s.value}</dd>
									</div>
								))}
							</dl>
						</div>
					)}

					{/* PROMO BANNERS BY PRODUCT TAGS (RIGHT BELOW TRUST BADGES) */}
					{(() => {
						const matchingBanners = promoBanners?.filter(
							(banner: any) => {
								if (banner.isActive === false) return false
								if (!banner.image) return false
								const bannerTag = (banner.tag || '').trim().toLowerCase()
								if (!bannerTag || bannerTag === '*') return true
								return tags.some((t) => t.toLowerCase() === bannerTag)
							},
						)

						if (!matchingBanners || matchingBanners.length === 0) return null

						return (
							<div className="mt-4 space-y-3">
								{matchingBanners.map((banner: any, idx: number) => {
									const desktopImg = banner.image
										? urlFor(banner.image).url()
										: null
									const mobileImg = banner.mobileImage
										? urlFor(banner.mobileImage).url()
										: desktopImg

									if (!desktopImg) return null

									const bannerContent = (
										<div className="relative overflow-hidden rounded-xl">
											<picture>
												{mobileImg && (
													<source
														media="(max-width: 639px)"
														srcSet={mobileImg}
													/>
												)}
												<img
													src={desktopImg}
													alt={banner.title || 'Promo Banner'}
													className="h-auto w-full object-cover"
												/>
											</picture>
										</div>
									)

									if (banner.link) {
										return (
											<SanityLink
												key={idx}
												link={banner.link as any}
												className="block no-underline"
											>
												{bannerContent}
											</SanityLink>
										)
									}

									return <div key={idx}>{bannerContent}</div>
								})}
							</div>
						)
					})()}
				</div>
			</div>

			{/* PRODUCT DESCRIPTION BLOCK */}
			{description && description.length > 0 && (
				<div
					id="product-description"
					className="relative scroll-mt-24 space-y-6 rounded-xl bg-white p-4 shadow-2xs lg:p-6"
				>
					<div className="border-b border-[#f5f5f5] pb-4">
						<h2 className="my-0 text-xl font-bold text-gray-900">
							Product Overview & Technical Description
						</h2>
					</div>
					<div className="relative">
						<div
							ref={descContentRef}
							className={`prose max-w-none leading-relaxed text-gray-700 transition-all duration-300 ${
								!isDescExpanded && showExpandBtn
									? 'max-h-[400px] overflow-hidden'
									: ''
							}`}
						>
							<PortableText
								value={description ?? []}
								components={{
									block: {
										h1: (node) => <AnchoredHeading as="h1" {...node} />,
										h2: (node) => <AnchoredHeading as="h2" {...node} />,
										h3: (node) => <AnchoredHeading as="h3" {...node} />,
										h4: (node) => <AnchoredHeading as="h4" {...node} />,
										h5: (node) => <AnchoredHeading as="h5" {...node} />,
										h6: (node) => <AnchoredHeading as="h6" {...node} />,
									},
									types: {
										image: Image,
										'custom-html': ({ value }) => (
											<CustomHtml {...value} className="my-6" />
										),
										affiliateLink: ({ value }: any) => {
											return <AffiliateLink {...value} />
										},
									},
								}}
							/>
						</div>

						{/* Fade Gradient Overlay when collapsed */}
						{!isDescExpanded && showExpandBtn && (
							<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-linear-to-t from-white via-white/80 to-transparent" />
						)}
					</div>

					{/* Expand / Collapse Button */}
					{showExpandBtn && (
						<div className="pt-2 text-center">
							<button
								onClick={() => {
									if (isDescExpanded) {
										setIsDescExpanded(false)
										document
											.getElementById('product-description')
											?.scrollIntoView({ behavior: 'smooth' })
									} else {
										setIsDescExpanded(true)
									}
								}}
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-800 shadow-2xs transition hover:border-slate-400 hover:bg-slate-100"
							>
								{isDescExpanded ? (
									<>
										Show Less <FiChevronUp className="h-4 w-4" />
									</>
								) : (
									<>
										Read Full Technical Overview <FiChevronDown className="h-4 w-4" />
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{/* REVIEWS SECTION */}
			{enableReviews && (
				<div className="rounded-xl bg-white p-2 lg:p-4">
					<div
						className="scroll-mt-24 space-y-6 border-[#f5f5f5]"
						id="product-review"
					>
						{/* Header Bar */}
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f5f5f5] pb-4">
							<h2 className="my-0 text-xl font-bold text-gray-900">
								Verified Reviews & Audit Feedback
							</h2>

							<button
								onClick={() => setIsReviewModalOpen(true)}
								className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
							>
								<FiEdit3 className="h-4 w-4" />
								Submit Review
							</button>
						</div>

						{/* RATING SUMMARY & FILTER CARD */}
						<div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs lg:p-6">
							<div className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
								{/* Left Column: Overall Score */}
								<div className="text-center md:border-r md:border-slate-200 md:pr-6">
									<div className="flex items-baseline justify-center gap-1.5 text-slate-900">
										<span className="text-4xl font-extrabold lg:text-5xl">
											{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
										</span>
										<span className="text-sm font-semibold text-gray-500">out of 5</span>
									</div>

									<div
										className="mt-2 flex justify-center gap-1 text-amber-400"
										aria-label={`Rated ${averageRating > 0 ? averageRating.toFixed(1) : '5.0'} out of 5 stars`}
									>
										{[...Array(5)].map((_, idx) => (
											<FiStar key={idx} className="h-5 w-5 fill-amber-400 text-amber-400" />
										))}
									</div>
								</div>

								{/* Right Column: Filter Pills (Horizontal scroll on mobile, wrap on tablet/desktop) */}
								<div className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
									{[
										{ key: 'all', label: 'All', count: counts.countAll },
										{ key: '5star', label: '5 Star', count: counts.count5Star },
										{ key: '4star', label: '4 Star', count: counts.count4Star },
										{ key: '3star', label: '3 Star', count: counts.count3Star },
										{ key: '2star', label: '2 Star', count: counts.count2Star },
										{ key: '1star', label: '1 Star', count: counts.count1Star },
										{
											key: 'comment',
											label: 'With Comments',
											count: counts.countWithComments,
										},
										{
											key: 'media',
											label: 'With Media',
											count: counts.countWithMedia,
										},
									].map((item) => {
										const isActive = activeFilter === item.key
										return (
											<button
												key={item.key}
												onClick={() => {
													setActiveFilter(item.key as any)
													setCurrentPage(1)
												}}
												className={`flex-none sm:flex-initial whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition cursor-pointer lg:text-sm ${
													isActive
														? 'border-slate-900 bg-slate-900 font-semibold text-white shadow-2xs'
														: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
												}`}
											>
												{item.label} ({item.count})
											</button>
										)
									})}
								</div>
							</div>
						</div>

						{/* REVIEWS LIST */}
						{currentReviews.length === 0 ? (
							<div className="py-12 text-center text-sm text-gray-500">
								No customer reviews found matching this filter.
							</div>
						) : (
							currentReviews.map((r, i) => (
								<div
									key={i}
									className="mb-6 space-y-3 border-b border-[#f5f5f5] pb-5 text-sm"
								>
									{/* User Header: Avatar + Name + Rating + Date */}
									<div className="flex gap-3">
										{/* Avatar Circle */}
										<div className="flex-none">
											<div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-200 text-sm font-semibold text-gray-500">
												<FiUser className="h-5 w-5 text-gray-400" />
											</div>
										</div>

										{/* User Details */}
										<div className="space-y-1">
											<p className="leading-none font-bold text-gray-900">
												{r.author}
											</p>

											<div
												className="flex items-center gap-0.5 pt-0.5 text-amber-400"
												aria-label={`Rated ${r.rating || 5} out of 5 stars`}
											>
												{[...Array(5)].map((_, starIdx) => (
													<FiStar
														key={starIdx}
														className={`h-3.5 w-3.5 ${
															starIdx < (r.rating || 5)
																? 'fill-amber-400 text-amber-400'
																: 'fill-gray-200 text-gray-200'
														}`}
													/>
												))}
											</div>

											<p className="text-xs text-gray-400">
												{r.createdAt
													? new Date(r.createdAt).toLocaleDateString('en-US', {
															month: 'short',
															day: 'numeric',
															year: 'numeric',
														})
													: 'Apr 17, 2026'}
											</p>
										</div>
									</div>

									{/* Comment text */}
									<p className="pl-13 leading-relaxed text-gray-800">
										{r.comment}
									</p>

									{/* Image & Video Attachments Container */}
									{((r.images && r.images.length > 0) ||
										(r.videos && r.videos.length > 0)) && (
										<div className="flex flex-wrap gap-2.5 pt-1 pl-13">
											{/* Images */}
											{r.images?.map((img: any, imgIndex: number) =>
												img?.asset ? (
													<Img
														key={imgIndex}
														image={img}
														width={160}
														alt={img.alt || 'Review image'}
														className="h-20 w-20 cursor-pointer rounded-lg border border-gray-200 object-cover transition hover:opacity-80"
														onClick={() =>
															handleOpenReviewLightbox(
																r.images as any[],
																imgIndex,
															)
														}
													/>
												) : null,
											)}

											{/* Videos */}
											{r.videos?.map((vid: any, vidIndex: number) =>
												vid?.asset?.url ? (
													<div
														key={vidIndex}
														onClick={() => setActiveVideoUrl(vid.asset.url)}
														className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-black shadow-2xs transition hover:opacity-90"
													>
														<video
															src={vid.asset.url}
															className="h-full w-full object-cover opacity-80 transition group-hover:scale-105"
															preload="metadata"
														/>
														<div className="absolute inset-0 flex items-center justify-center bg-black/20">
															<div className="backdrop-blur-2xs flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition group-hover:scale-110">
																<FiPlay className="ml-0.5 h-4 w-4 fill-white" />
															</div>
														</div>
														<span className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold text-white">
															<FiFilm className="h-2.5 w-2.5" />
															Video
														</span>
													</div>
												) : null,
											)}
										</div>
									)}

									{/* Seller's Response Box */}
									{r.response && (
										<div className="mt-3 ml-13 rounded-lg border border-gray-100 bg-gray-50/90 p-3.5 text-xs lg:text-sm">
											<p className="mb-1 font-bold text-gray-900">
												Seller's Response:
											</p>
											<p className="leading-relaxed text-gray-700">
												{r.response}
											</p>
										</div>
									)}
								</div>
							))
						)}

						{/* REVIEWS PAGINATION CONTROLS */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 pt-4 pb-8">
								<button
									onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
									disabled={currentPage === 1}
									className="rounded border border-gray-300 px-3.5 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
								>
									Previous
								</button>

								<span className="text-sm font-medium text-gray-600">
									Page {currentPage} of {totalPages}
								</span>

								<button
									onClick={() =>
										handlePageChange(Math.min(currentPage + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="rounded border border-gray-300 px-3.5 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
								>
									Next
								</button>
							</div>
						)}
					</div>

					{/* LIGHTBOX COMPONENT FOR IMAGES */}
					<SlideshowLightbox
						lightboxIdentifier="lightbox-reviews"
						images={reviewImages}
						showThumbnails={true}
						open={isReviewOpen}
						startingSlideIndex={reviewIndex}
						onClose={() => setIsReviewOpen(false)}
						modalClose="clickOutside"
					/>

					{/* LIGHTBOX COMPONENT FOR VIDEOS */}
					<ReviewVideoLightbox
						isOpen={Boolean(activeVideoUrl)}
						videoUrl={activeVideoUrl}
						onClose={() => setActiveVideoUrl(null)}
					/>

					{/* REVIEW FORM MODAL */}
					<ReviewFormModal
						isOpen={isReviewModalOpen}
						onClose={() => setIsReviewModalOpen(false)}
						productId={productId}
						productTitle={title}
						productSlug={slug}
					/>
				</div>
			)}

			{/* FLOATING STICKY B2B RFQ BAR (RESPONSIVE) */}
			{enableStickyAddToCart &&
				isStickyVisible &&
				finalPrice > 0 && (
					<aside
						aria-label="Quick purchase bar"
						className={cn(
							'animate-in fade-in slide-in-from-bottom-5 fixed right-0 bottom-0 left-0 z-50 w-full transform rounded-none border-t border-slate-200 bg-white/95 backdrop-blur-md p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-all duration-300 print:hidden sm:bottom-3 sm:left-1/2 sm:w-[95%] sm:max-w-5xl sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:px-4 sm:py-2.5 sm:pb-2.5',
							stickyBarDevice === 'mobile_only' && 'sm:hidden',
							stickyBarDevice === 'desktop_only' && 'hidden sm:block',
						)}
					>
						{/* MOBILE LAYOUT (<640px) */}
						<div className="flex flex-col gap-2 sm:hidden">
							{/* Top Micro-Row: Thumbnail + Title/Variant + Price */}
							<div className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2 min-w-0 flex-1">
									{(activeVariant?.image || images?.[0]) && (
										<div className="h-8 w-8 flex-none overflow-hidden rounded-md border border-slate-200 bg-slate-50">
											{(() => {
												const thumbMedia = parseMediaItem(activeVariant?.image || images[0])
												if (thumbMedia.type !== 'image') {
													return (
														<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
															<FiPlay className="h-3 w-3 fill-white" />
														</div>
													)
												}
												return (
													<Img
														image={activeVariant?.image || images[0]}
														width={64}
														className="h-full w-full object-cover"
														alt={title}
													/>
												)
											})()}
										</div>
									)}
									<div className="min-w-0 flex-1">
										<p className="line-clamp-1 text-xs font-semibold text-gray-900">
											{title}
										</p>
										{effectiveHasVariants && variants && variants.length > 0 ? (
											<select
												aria-label="Select variant"
												value={activeVariantIndex}
												onChange={(e) => {
													const idx = Number(e.target.value)
													const target = variants[idx]
													if (target?.options) {
														const updated = { ...selectedOptions }
														target.options.forEach((o) => {
															if (o.name && o.value) updated[o.name] = o.value
														})
														setSelectedOptions(updated)
													}
												}}
												className="w-full max-w-[170px] truncate rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] font-medium text-slate-800 outline-none"
											>
												{variants.map((v, i) => (
													<option key={v._key || i} value={i}>
														{v.title || `Variant ${i + 1}`}
													</option>
												))}
											</select>
										) : enableSkuDisplay && currentSku ? (
											<span className="text-[10px] font-mono text-gray-400 block truncate">
												SKU: {currentSku}
											</span>
										) : null}
									</div>
								</div>

								<div className="flex-none text-right">
									<span className="text-xs font-extrabold text-slate-900">
										{formatPrice(finalPrice)}
									</span>
									<span className="text-[9px] text-gray-500 font-normal block leading-none">
										/unit
									</span>
								</div>
							</div>

							{/* Bottom Action Row: Primary CTA + Secondary CTA */}
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => handleOpenRfq(false)}
									className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
								>
									<FiFileText className="text-emerald-400 text-xs flex-none" />
									<span className="truncate">{rfqCtaLabel || 'Request RFQ'}</span>
								</button>
								<button
									type="button"
									onClick={handleAddToQuoteList}
									className="flex h-10 flex-none cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs active:scale-[0.98]"
								>
									{quoteListCtaLabel || '+ Quote'}
								</button>
								{enableSampleButton && (
									<button
										type="button"
										onClick={() => handleOpenRfq(true)}
										className="flex h-10 flex-none cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs active:scale-[0.98]"
									>
										Sample
									</button>
								)}
							</div>
						</div>

						{/* DESKTOP & TABLET LAYOUT (>=640px) */}
						<div className="hidden sm:flex items-center justify-between gap-3">
							{/* Left: Thumbnail + Title + Variant Selector + Price */}
							<div className="min-w-0 flex-1 items-center gap-2.5 flex">
								{(activeVariant?.image || images?.[0]) && (
									<div className="h-10 w-10 flex-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
										{(() => {
											const thumbMedia = parseMediaItem(activeVariant?.image || images[0])
											if (thumbMedia.type !== 'image') {
												return (
													<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
														<FiPlay className="h-3.5 w-3.5 fill-white" />
													</div>
												)
											}
											return (
												<Img
													image={activeVariant?.image || images[0]}
													width={80}
													className="h-full w-full object-cover"
													alt={title}
												/>
											)
										})()}
									</div>
								)}

								<div className="min-w-0 flex-1">
									<p className="line-clamp-1 text-xs font-semibold text-gray-900 lg:text-sm">
										{title}
									</p>
									<div className="flex items-center gap-2 mt-0.5">
										{effectiveHasVariants && variants && variants.length > 0 ? (
											<select
												aria-label="Select product variant"
												value={activeVariantIndex}
												onChange={(e) => {
													const idx = Number(e.target.value)
													const target = variants[idx]
													if (target?.options) {
														const updated = { ...selectedOptions }
														target.options.forEach((o) => {
															if (o.name && o.value) updated[o.name] = o.value
														})
														setSelectedOptions(updated)
													}
												}}
												className="max-w-[170px] truncate rounded border border-slate-200 bg-slate-50 py-0.5 px-1.5 text-[11px] font-medium text-slate-800 outline-none hover:bg-slate-100 cursor-pointer focus:border-primary"
											>
												{variants.map((v, i) => (
													<option key={v._key || i} value={i}>
														{v.title || `Variant ${i + 1}`}
													</option>
												))}
											</select>
										) : enableSkuDisplay && currentSku ? (
											<span className="text-[11px] font-mono text-gray-400">
												SKU: {currentSku}
											</span>
										) : null}
									</div>
								</div>

								<div className="flex-none pl-3 border-l border-slate-100 text-right">
									<span className="text-sm font-extrabold text-slate-900 sm:text-base leading-none block">
										{formatPrice(finalPrice)}
									</span>
									<span className="text-[10px] text-gray-500 font-medium leading-tight">
										/unit ({priceDisplayUnit || activeTier?.incoterm || 'FOB'})
									</span>
								</div>
							</div>

							{/* Right: Quantity + Action Buttons (No overflow) */}
							<div className="flex flex-none items-center gap-2">
								{/* Quantity Selector */}
								{enableQuantitySelector && (
									<div
										className="flex flex-none items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50"
										role="group"
										aria-label="Sticky bar quantity"
									>
										<button
											type="button"
											aria-label="Decrease quantity"
											className="flex h-9 w-7 cursor-pointer items-center justify-center text-xs font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
											onClick={() => setQuantity((q) => Math.max(moq && moq > 1 ? moq : 1, q - 1))}
										>
											−
										</button>
										<span
											role="status"
											aria-live="polite"
											aria-label={`Current quantity: ${quantity}`}
											className="flex h-9 w-8 items-center justify-center text-xs font-bold text-gray-900"
										>
											{quantity}
										</span>
										<button
											type="button"
											aria-label="Increase quantity"
											className="flex h-9 w-7 cursor-pointer items-center justify-center text-xs font-semibold text-gray-500 transition hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
											onClick={() => setQuantity((q) => q + 1)}
										>
											+
										</button>
									</div>
								)}

								{/* Add to Quote List */}
								<button
									type="button"
									onClick={handleAddToQuoteList}
									className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
								>
									{quoteListCtaLabel || '+ Quote List'}
								</button>

								{/* Order Sample Button */}
								{enableSampleButton && (
									<button
										type="button"
										onClick={() => handleOpenRfq(true)}
										className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-center text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									>
										{sampleOrderCtaLabel || 'Sample'}
									</button>
								)}

								{/* Primary Action: Request Quote */}
								<button
									type="button"
									onClick={() => handleOpenRfq(false)}
									className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-center text-xs font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98] flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
								>
									<FiFileText className="text-emerald-400 text-sm flex-none" />
									<span>{rfqCtaLabel || 'Request RFQ'}</span>
								</button>
							</div>
						</div>
					</aside>
				)}

			{/* IN-PAGE B2B RFQ MODAL */}
			<InPageRfqModal
				isOpen={isRfqModalOpen}
				onClose={() => setIsRfqModalOpen(false)}
				productId={productId}
				variantId={activeVariant?._key}
				productTitle={title}
				sku={currentSku}
				quantity={quantity}
				unitPrice={finalPrice}
				currency={currency}
				incoterm={activeTier?.incoterm || 'FOB'}
				image={
					activeVariant?.image
						? activeVariant.image?.asset?.url || urlFor(activeVariant.image).url()
						: images?.[0]
							? urlFor(images[0]).url()
							: undefined
				}
				isSampleMode={isSampleMode}
			/>
		</div>
	)
}
