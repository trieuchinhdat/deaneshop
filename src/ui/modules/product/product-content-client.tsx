'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useCartStore } from '@/store/use-cart-store'
import { showWishlistToast, useWishlistStore } from '@/store/use-wishlist-store'
import Img from '../../img'
import 'swiper/css'
import 'swiper/css/navigation'
import { SlideshowLightbox } from 'lightbox.js-react'
import { PortableText } from 'next-sanity'
import Link from 'next/link'
import {
	FiChevronDown,
	FiChevronUp,
	FiEdit3,
	FiFilm,
	FiPlay,
	FiUser,
	FiVideo,
} from 'react-icons/fi'
import Swal from 'sweetalert2'
import { formatVND } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'
import type { PRODUCT_SETTINGS_QUERY_RESULT } from '@/sanity/types'
import Image from '@/ui/modules/prose/image'
import SanityLink from '@/ui/sanity-link'
import AffiliateLink from '../affiliate-link'
import CustomHtml from '../custom-html'
import AnchoredHeading from '../prose/anchored-heading'
import Categories from './categories'
import FlashSaleCountdown from './flash-sale-countdown'
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
	productId?: string
	stock?: number
	productSettings?: PRODUCT_SETTINGS_QUERY_RESULT
	hasVariants?: boolean
	options?: ProductOption[]
	variants?: ProductVariant[]
	promotionMode?: 'default' | 'custom' | 'disabled'
	promotions?: any
	enableSpecialDeal?: boolean
	specialDealConfig?: any
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

	// 5. Fallback cho mọi link video ngoài: Dùng iframe để nạp trang embed
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

	// 1. Direct Video Link URL (YouTube / Vimeo / TikTok / Link MP4 / Link ngoài)
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
	stock,
	productSettings,
	hasVariants = false,
	options = [],
	variants = [],
	promotionMode = 'default',
	promotions,
	enableSpecialDeal = false,
	specialDealConfig,
}: Props) {
	const router = useRouter()
	const addItem = useCartStore((s) => s.addItem)
	const isWishlisted = useWishlistStore((s) => s.items.some((i) => i._id === productId))
	const toggleWishlist = useWishlistStore((s) => s.toggleItem)

	const [quantity, setQuantity] = useState(1)
	const [activeIndex, setActiveIndex] = useState(0)

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

	// 1. Tự động nhận diện có biến thể hay không
	const effectiveHasVariants = useMemo(() => {
		return Boolean(
			hasVariants || (Array.isArray(variants) && variants.length > 0),
		)
	}, [hasVariants, variants])

	// 2. Tự động trích xuất danh sách options nếu mảng options trong Sanity chưa được định nghĩa
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

	// 3. Khởi tạo state selectedOptions ban đầu
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

	// Chỉ reset selectedOptions khi sản phẩm đổi sang sản phẩm khác (dựa trên productId hoặc slug)
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

	// 4. Thuật toán tìm biến thể (Active Variant) thông minh & linh hoạt
	const activeVariant = useMemo(() => {
		if (
			!effectiveHasVariants ||
			!Array.isArray(variants) ||
			variants.length === 0
		)
			return null

		// Cách 1: So khớp chính xác theo mảng options (không phân biệt hoa/thường, khoảng trắng)
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

		// Cách 2: So khớp theo tiêu đề biến thể (dành cho biến thể đặt tiêu đề dạng "Đen / L")
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

		// Dự phòng: Trả về biến thể đầu tiên nếu có danh sách biến thể
		return variants[0] || null
	}, [effectiveHasVariants, variants, selectedOptions])

	// Index của biến thể đang được chọn (dùng cho dropdown sticky bar)
	const activeVariantIndex = useMemo(() => {
		if (!activeVariant || !variants || variants.length === 0) return 0
		const idx = variants.findIndex((v) => v === activeVariant)
		return idx !== -1 ? idx : 0
	}, [activeVariant, variants])

	// 5. Tính toán Giá bán, Giá so sánh, Tồn kho và SKU động dựa trên activeVariant
	const finalPrice = useMemo(() => {
		if (effectiveHasVariants && activeVariant) {
			if (typeof activeVariant.price === 'number' && activeVariant.price > 0) {
				return activeVariant.price
			}
		}
		return price
	}, [effectiveHasVariants, activeVariant, price])

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

	// 6. Tính toán Khối Khuyến mãi (Effective Promotions)
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

	// 7. Tính toán Điều kiện / Lưu ý mua hàng (Effective Special Conditions)
	const effectiveSpecialConditions = useMemo(() => {
		// 1. Cài đặt riêng theo từng sản phẩm
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

		// 2. Cài đặt mặc định toàn shop (Global)
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

		// 3. Nếu không nhập ở cả cài đặt riêng lẫn global => Trả về null (Không hiển thị)
		return null
	}, [specialDealConfig, productSettings])

	// Tự động cuộn Swiper đến hình ảnh tương ứng của biến thể
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
		})

		router.push('/checkout')
	}

	const handleOnlyAddToCart = () => {
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
		})

		Swal.fire({
			toast: true,
			position: 'top-end',
			showConfirmButton: false,
			timer: 4000,
			timerProgressBar: false,
			customClass: {
				popup:
					'!p-3 !rounded-2xl !border !border-gray-200/90 !shadow-xl !bg-white !w-auto !min-w-[250px]',
				container: 'mt-20 md:mt-24 z-[999]',
			},
			html: `
				<div class="flex flex-col gap-3 p-1 font-sans text-left">
					<div class="flex items-center gap-2.5">
						<div class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
							<svg class="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
						<span class="text-sm sm:text-base font-semibold text-gray-900 leading-none">Đã thêm vào giỏ hàng</span>
					</div>
					<a href="/checkout" class="flex h-10 w-full items-center justify-center rounded-xl bg-[#e8f2ff] hover:bg-[#d8e8ff] text-blue-600 font-bold text-sm transition no-underline shadow-2xs">
						Xem giỏ hàng
					</a>
				</div>
			`,
		})
	}

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
	}, [allReviews])

	// 3. Sửa công thức tính % giảm giá: (Giá Gốc - Giá Bán) / Giá Gốc
	const discountPercent =
		hasSale && currentCompareAtPrice && currentCompareAtPrice > 0
			? Math.round(
					((currentCompareAtPrice - finalPrice) / currentCompareAtPrice) * 100,
				)
			: 0

	// CHUẨN BỊ DATA CHO LIGHTBOX (Chỉ lọc tập tin Hình ảnh)
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

	// State cho Review Lightbox
	const [isReviewOpen, setIsReviewOpen] = useState(false)
	const [reviewImages, setReviewImages] = useState([])
	const [reviewIndex, setReviewIndex] = useState(0)
	const handleOpenReviewLightbox = (
		imagesOfThisReview: any[],
		indexClicked: number,
	) => {
		const formattedImages = imagesOfThisReview.map((img) => ({
			src: img.asset.url,
			alt: img.alt || 'Review image',
		}))

		// 2. Set dữ liệu vào state
		setReviewImages(formattedImages as any)
		setReviewIndex(indexClicked)

		// 3. Mở
		setIsReviewOpen(true)
	}

	// State cho Review Modal Form
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

	// State bộ lọc đánh giá
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

	// State cho Video Lightbox
	const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)

	// Đếm số lượng cho từng bộ lọc
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

	// Filtered Reviews dựa theo activeFilter
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

	// 1. STATE PHÂN TRANG
	const [currentPage, setCurrentPage] = useState(1)
	const REVIEWS_PER_PAGE = 4

	// 2. LOGIC TÍNH TOÁN CẮT MẢNG DỰA TRÊN FILTERED REVIEWS
	const indexOfLastReview = currentPage * REVIEWS_PER_PAGE
	const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE
	const currentReviews = filteredReviews.slice(
		indexOfFirstReview,
		indexOfLastReview,
	)
	const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE)

	// Hàm chuyển trang
	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber)
		document
			.getElementById('product-review')
			?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<div className="space-y-8">
			<div className="grid gap-6 rounded-xl bg-white p-2 lg:grid-cols-2 lg:p-4">
				{/* ================= IMAGES (GIỮ NGUYÊN) ================= */}
				{images.length > 0 && (
					<div className="main-image-product-slide space-y-3">
						{/* MAIN */}
						<Swiper
							modules={[Navigation]}
							onSwiper={(s) => (mainSwiperRef.current = s)}
							onSlideChange={(s) => {
								setActiveIndex(s.activeIndex)
								thumbSwiperRef.current?.slideTo(s.activeIndex)

								// Tạm dừng tất cả video khi chuyển slide
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
							className="aspect-square overflow-hidden rounded-lg border border-[#f5f5f5]"
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
											className="h-full w-full cursor-pointer"
											onClick={() => {
												const imageOnlyIndex = images
													.slice(0, i + 1)
													.filter((m) => parseMediaItem(m).type === 'image').length - 1
												setPhotoIndex(Math.max(0, imageOnlyIndex))
												setIsOpen(true)
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
						{/* LIGHTBOX COMPONENT */}
						<SlideshowLightbox
							images={lightboxImages}
							showThumbnails={true}
							open={isOpen}
							lightboxIdentifier="lbox1"
							startingSlideIndex={photoIndex}
							onClose={() => setIsOpen(false)}
							modalClose="clickOutside"
						/>
						{/* THUMBS */}
						<div className="relative">
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
												onClick={() => {
													setActiveIndex(i)
													mainSwiperRef.current?.slideTo(i)
												}}
												className={`relative aspect-square w-full overflow-hidden rounded-md transition ${
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
								onClick={() => thumbSwiperRef.current?.slidePrev()}
								className="thumb-prev absolute left-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer bg-white p-1 shadow"
							>
								‹
							</button>
							<button
								type="button"
								onClick={() => thumbSwiperRef.current?.slideNext()}
								className="thumb-next absolute right-0 top-1/2 z-10 -translate-y-1/2 cursor-pointer bg-white p-1 shadow"
							>
								›
							</button>
						</div>
					</div>
				)}
				{/* ================= INFO ================= */}
				<div className="space-y-4">
					<h1 className="text-2xl font-semibold">{title}</h1>

					{/* META */}
					<div className="flex flex-wrap items-center gap-2 text-sm">
						{currentSku && (
							<span className="font-semibold">SKU: {currentSku}</span>
						)}

						{(productSettings as any)?.enableReviewStars !== false &&
							totalReviews > 0 && (
								<>
									{currentSku && <span className="text-gray-300">|</span>}
									<Link href="#product-review" className="hover:underline">
										<span className="flex items-center gap-1 text-yellow-500">
											<span className="text-gray-500">
												{averageRating.toFixed(1)}
												{<span className="text-yellow-500"> ★</span>} (
												{totalReviews} reviews)
											</span>
										</span>
									</Link>
								</>
							)}

						{(productSettings as any)?.enableSoldCount !== false &&
							typeof sales === 'number' &&
							sales > 0 && (
								<>
									{(currentSku ||
										((productSettings as any)?.enableReviewStars !== false &&
											totalReviews > 0)) && (
										<span className="text-gray-300">|</span>
									)}
									<span className="text-green-600">Đã bán {sales}</span>
								</>
							)}
					</div>

					{(productSettings as any)?.enableCategoryDisplay !== false &&
						category &&
						category.length > 0 && (
							<div className="categories flex items-center gap-2 text-sm">
								<span className="font-semibold">CATEGORY: </span>
								<Categories categories={category} linked />
							</div>
						)}

					{/* LOW STOCK ALERT */}
					{typeof currentStock === 'number' &&
						currentStock > 0 &&
						currentStock <= (productSettings?.lowStockThreshold ?? 5) && (
							<div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
								⚠️ Chỉ còn {currentStock} sản phẩm trong kho!
							</div>
						)}

					{/* BỘ CHỌN BIẾN THỂ (VARIANT SELECTOR) */}
					{effectiveHasVariants && effectiveOptions.length > 0 && (
						<div className="space-y-3.5 rounded-xl border border-gray-200/80 bg-gray-50/60 p-3.5 sm:p-4">
							{effectiveOptions.map((option) => (
								<div key={option.name} className="space-y-2">
									<div className="flex items-center justify-between text-xs font-semibold text-gray-700">
										<span>
											{option.name}:{' '}
											<strong className="font-bold text-gray-900">
												{selectedOptions[option.name] || 'Chọn'}
											</strong>
										</span>
									</div>
									<div className="flex flex-wrap gap-2">
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

											const variantImg = matchedVariant?.image
											const hasVariantImage = Boolean(
												variantImg &&
													(variantImg.asset ||
														variantImg.url ||
														typeof variantImg === 'string'),
											)

											// Nếu biến thể có gắn hình ảnh riêng -> Hiển thị dạng ô hình ảnh (Image Swatch)
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
														className={`relative flex h-10 w-10 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
															isSelected
																? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs scale-105'
																: isOutOfStock
																	? 'border-gray-200 opacity-40 grayscale'
																	: 'border-gray-200 hover:border-blue-400'
														}`}
														title={`${val}${isOutOfStock ? ' (Hết hàng)' : ''}`}
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

											// Ngược lại -> Hiển thị dạng Text
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
													className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all ${
														isSelected
															? 'border-blue-600 bg-blue-600 font-semibold text-white shadow-xs'
															: isOutOfStock
																? 'border-gray-200 bg-gray-100 text-gray-400 line-through opacity-60'
																: 'border-gray-300 bg-white text-gray-800 hover:border-blue-500 hover:text-blue-600'
													}`}
												>
													{val}
												</button>
											)
										})}
									</div>
								</div>
							))}
						</div>
					)}

					{/* SPECIAL DEAL / FLASH SALE VS STANDARD PRICING & PROMOTIONS */}
					{enableSpecialDeal ? (
						<div className="mt-4 overflow-hidden rounded-2xl border-2 border-red-600 shadow-md">
							{/* FLASH SALE HEADER BANNER (RED) */}
							<div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-600 via-red-600 to-red-700 p-3.5 text-white sm:p-4">
								<div className="space-y-1">
									<div className="flex items-center gap-1.5 text-sm font-bold tracking-wide text-white sm:text-base">
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
											<span className="flex-none text-lg">🔥</span>
										)}
										<span>
											{specialDealConfig?.badgeTitle || 'Online Giá Rẻ Quá'}
										</span>
									</div>
									<div className="space-y-0.5">
										<div className="text-2xl leading-tight font-extrabold text-yellow-300 sm:text-3xl">
											{finalPrice <= 0 ? 'Contact' : formatVND(finalPrice)}
										</div>
										{hasSale &&
											currentCompareAtPrice &&
											currentCompareAtPrice > 0 && (
												<div className="text-xs leading-tight font-normal text-white/90 sm:text-sm">
													<span className="line-through">
														{formatVND(currentCompareAtPrice)}
													</span>
													<span className="ml-1 font-semibold">
														(-{discountPercent}%)
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

							{/* RED BORDER INNER CONTAINER */}
							<div className="space-y-3.5 bg-white p-3.5 sm:p-4">
								{/* CHANNEL BADGE */}
								<div className="text-xs font-extrabold tracking-wider text-amber-700 uppercase sm:text-sm">
									{specialDealConfig?.channelText || 'CHỈ BÁN ONLINE'}
								</div>

								{/* PROMOTIONS LIST BLOCK INSIDE FLASH SALE */}
								{effectivePromotions &&
									effectivePromotions.items &&
									effectivePromotions.items.length > 0 && (
										<div className="space-y-3 rounded-xl border border-gray-200/80 bg-gray-50/50 p-3.5 sm:p-4">
											<div className="space-y-0.5 border-b border-gray-200/60 pb-2">
												<h3 className="my-0 text-sm font-bold text-gray-900 sm:text-base">
													{effectivePromotions.title || 'Khuyến mãi'}
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
																		className="ml-1 inline-block font-medium text-blue-600 hover:underline"
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
										<div className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5">
											{effectiveSpecialConditions.map(
												(cond: string, idx: number) => (
													<div
														key={idx}
														className="flex items-start gap-2 text-xs font-semibold text-amber-900/90 sm:text-sm"
													>
														<span className="font-bold text-amber-700">•</span>
														<span>{cond}</span>
													</div>
												),
											)}
										</div>
									)}

								{/* CTA BUTTONS INSIDE FLASH SALE */}
								{finalPrice <= 0 ? null : (
									<div ref={mainCtaRef} className="pt-1">
										<div className="flex flex-wrap items-center gap-3">
											<div className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50/50">
												<button
													className="flex h-11 w-10 items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60"
													onClick={() => setQuantity((q) => Math.max(1, q - 1))}
												>
													−
												</button>
												<span className="flex h-11 w-10 items-center justify-center text-sm font-bold text-gray-900">
													{quantity}
												</span>
												<button
													className="flex h-11 w-10 items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60"
													onClick={() => setQuantity((q) => q + 1)}
												>
													+
												</button>
											</div>

											{(productSettings as any)?.enableAddToCartButton !==
												false && (
												<button
													onClick={handleOnlyAddToCart}
													className="flex h-11 min-w-[130px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-500 bg-white text-sm font-bold text-blue-600 shadow-2xs transition hover:bg-blue-50 active:scale-[0.98] sm:h-12"
												>
													{(productSettings as any)?.addToCartButtonText ||
														'Thêm vào giỏ'}
												</button>
											)}

											{(productSettings as any)?.enableBuyNowButton !==
												false && (
												<button
													onClick={handleAddToCart}
													className="h-11 min-w-[130px] flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-extrabold text-white shadow-md transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] sm:h-12 sm:text-base"
												>
													{(productSettings as any)?.buyNowButtonText ||
														'Mua ngay'}
												</button>
											)}

											{/* Nút Yêu thích Wishlist */}
											<button
												type="button"
												onClick={() => {
													const isAdded = toggleWishlist(productId)
													showWishlistToast(isAdded, title)
												}}
												className={`flex h-11 w-11 shrink-0 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-all cursor-pointer ${
													isWishlisted
														? 'border-rose-300 bg-rose-50 text-rose-500 shadow-xs'
														: 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50/50'
												}`}
												title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
												aria-label="Wishlist"
											>
												<svg
													className={`h-5 w-5 transition-transform duration-200 active:scale-125 ${
														isWishlisted
															? 'fill-rose-500 text-rose-500'
															: 'fill-none stroke-current stroke-2'
													}`}
													viewBox="0 0 24 24"
												>
													<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
												</svg>
											</button>
										</div>

										{/* CONTACT BUTTON ON A SEPARATE LINE */}
										{(productSettings as any)?.enableContactButton !==
											false && (
											<div className="mt-2.5 w-full">
												<a
													href={
														(productSettings as any)?.contactButtonLink ||
														'https://zalo.me'
													}
													target={
														(
															productSettings as any
														)?.contactButtonLink?.startsWith('http')
															? '_blank'
															: '_self'
													}
													rel="noopener noreferrer"
													className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-emerald-300/80 bg-emerald-50 text-sm font-bold text-emerald-700 no-underline shadow-2xs transition hover:bg-emerald-100 active:scale-[0.98] sm:h-12 sm:text-base"
												>
													{(productSettings as any)?.contactButtonText ||
														'📞 Liên hệ tư vấn ngay'}
												</a>
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					) : (
						<>
							{/* STANDARD PRICING */}
							<div className="flex items-center gap-3">
								<span className="text-2xl font-bold text-red-600">
									{finalPrice <= 0 ? 'Contact' : formatVND(finalPrice)}
								</span>

								{hasSale &&
									currentCompareAtPrice &&
									currentCompareAtPrice > 0 && (
										<>
											<span className="text-sm text-gray-400 line-through">
												{formatVND(currentCompareAtPrice)}
											</span>

											<span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
												-{discountPercent}%
											</span>
										</>
									)}
							</div>

							{/* STANDARD CTA */}
							{finalPrice <= 0 ? null : (
								<div ref={mainCtaRef} className="py-2">
									<div className="flex flex-wrap items-center gap-3">
										<div className="flex items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50/50">
											<button
												className="flex h-10 w-10 items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60"
												onClick={() => setQuantity((q) => Math.max(1, q - 1))}
											>
												−
											</button>
											<span className="flex h-10 w-10 items-center justify-center text-sm font-bold text-gray-900">
												{quantity}
											</span>
											<button
												className="flex h-10 w-10 items-center justify-center font-semibold text-gray-600 transition hover:bg-gray-200/60"
												onClick={() => setQuantity((q) => q + 1)}
											>
												+
											</button>
										</div>

										{(productSettings as any)?.enableAddToCartButton !==
											false && (
											<button
												onClick={handleOnlyAddToCart}
												className="h-10 min-w-[130px] flex-1 cursor-pointer rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600 transition hover:bg-blue-100 active:scale-[0.98]"
											>
												{(productSettings as any)?.addToCartButtonText ||
													'Thêm vào giỏ'}
											</button>
										)}

										{productSettings?.enableBuyNowButton !== false && (
											<button
												onClick={handleAddToCart}
												className="h-10 min-w-[130px] flex-1 cursor-pointer rounded-full bg-blue-600 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
											>
												{(productSettings as any)?.buyNowButtonText ||
													'Mua ngay'}
											</button>
										)}
									</div>

									{/* CONTACT BUTTON ON A SEPARATE LINE */}
									{(productSettings as any)?.enableContactButton !== false && (
										<div className="mt-2.5 w-full">
											<a
												href={
													(productSettings as any)?.contactButtonLink ||
													'https://zalo.me'
												}
												target={
													(
														productSettings as any
													)?.contactButtonLink?.startsWith('http')
														? '_blank'
														: '_self'
												}
												rel="noopener noreferrer"
												className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full border border-emerald-300/80 bg-emerald-50 text-sm font-bold text-emerald-700 no-underline shadow-2xs transition hover:bg-emerald-100 active:scale-[0.98] sm:h-11"
											>
												{(productSettings as any)?.contactButtonText ||
													'📞 Liên hệ tư vấn ngay'}
											</a>
										</div>
									)}
								</div>
							)}

							{/* STANDARD PROMOTIONS LIST BLOCK */}
							{effectivePromotions &&
								effectivePromotions.items &&
								effectivePromotions.items.length > 0 && (
									<div className="mt-3.5 space-y-3 rounded-2xl border border-blue-100/90 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 p-4 shadow-2xs">
										<div className="space-y-0.5 border-b border-blue-100/70 pb-2.5">
											<h3 className="my-0 text-base font-bold text-gray-900">
												{effectivePromotions.title || 'Khuyến mãi'}
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
																	className="ml-1 inline-block font-medium text-blue-600 hover:underline"
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
					{productSettings?.trustBadges &&
						productSettings.trustBadges.length > 0 && (
							<div className="mt-3 grid grid-cols-1 gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:grid-cols-2">
								{productSettings.trustBadges.map((badge: any, idx: number) => {
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
												<div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-700 text-[10px] font-bold text-white">
													✓
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

					{/* PROMO BANNERS BY PRODUCT TAGS (RIGHT BELOW TRUST BADGES) */}
					{(() => {
						const matchingBanners = productSettings?.promoBanners?.filter(
							(banner) => {
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
								{matchingBanners.map((banner, idx) => {
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
							Mô tả sản phẩm
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
							<div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
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
								className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-700/30 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800 shadow-2xs transition hover:border-amber-700/50 hover:bg-amber-100"
							>
								{isDescExpanded ? (
									<>
										Thu gọn nội dung <FiChevronUp className="h-4 w-4" />
									</>
								) : (
									<>
										Xem thêm mô tả <FiChevronDown className="h-4 w-4" />
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{/* REVIEWS SECTION */}
			{productSettings?.enableReviews !== false && (
				<div className="rounded-xl bg-white p-2 lg:p-4">
					<div
						className="scroll-mt-24 space-y-6 border-[#f5f5f5]"
						id="product-review"
					>
						{/* Header Bar */}
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f5f5f5] pb-4">
							<h2 className="my-0 text-xl font-bold text-gray-900">
								Review & Đánh giá
							</h2>

							<button
								onClick={() => setIsReviewModalOpen(true)}
								className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
							>
								<FiEdit3 className="h-4 w-4" />
								Viết đánh giá
							</button>
						</div>

						{/* RATING SUMMARY & FILTER CARD (SHOPEE STYLE) */}
						<div className="rounded-xl border border-red-100 bg-[#fffbf8] p-4 shadow-2xs lg:p-6">
							<div className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
								{/* Left Column: Overall Score */}
								<div className="text-center md:border-r md:border-red-100/80 md:pr-6">
									<div className="flex items-baseline justify-center gap-1.5 text-red-600">
										<span className="text-4xl font-extrabold lg:text-5xl">
											{averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
										</span>
										<span className="text-sm font-semibold">out of 5</span>
									</div>

									<div className="mt-2 flex justify-center gap-1 text-lg text-red-600">
										{'★'.repeat(5)}
									</div>
								</div>

								{/* Right Column: Filter Pills */}
								<div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
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
												className={`rounded-md border px-3.5 py-1.5 text-xs font-medium transition lg:text-sm ${
													isActive
														? 'border-red-600 bg-white font-semibold text-red-600 shadow-2xs'
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
								Chưa có đánh giá nào phù hợp với bộ lọc này.
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

											<div className="flex items-center gap-1 pt-0.5">
												<span className="text-sm text-red-600">
													{'★'.repeat(r.rating || 5)}
													<span className="text-gray-300">
														{'★'.repeat(5 - (r.rating || 5))}
													</span>
												</span>
											</div>

											<p className="text-xs text-gray-400">
												{r.createdAt
													? new Date(r.createdAt)
															.toISOString()
															.replace('T', ' ')
															.substring(0, 16)
													: '2026-04-17 16:25'}
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

						{/* THANH ĐIỀU HƯỚNG PHÂN TRANG */}
						{totalPages > 1 && (
							<div className="flex items-center justify-center gap-2 pt-4 pb-8">
								<button
									onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
									disabled={currentPage === 1}
									className="rounded border border-gray-300 px-3.5 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
								>
									Trước
								</button>

								<span className="text-sm font-medium text-gray-600">
									Trang {currentPage} / {totalPages}
								</span>

								<button
									onClick={() =>
										handlePageChange(Math.min(currentPage + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="rounded border border-gray-300 px-3.5 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
								>
									Sau
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
					/>
				</div>
			)}

			{/* FLOATING STICKY CART BAR (RESPONSIVE) */}
			{productSettings?.enableStickyAddToCart !== false &&
				isStickyVisible &&
				finalPrice > 0 && (
					<div className="animate-in fade-in slide-in-from-bottom-5 fixed right-0 bottom-0 left-0 z-50 w-full transform rounded-none border-t border-gray-200/90 bg-white p-2.5 shadow-2xl transition-all duration-300 sm:bottom-3 sm:left-1/2 sm:w-[95%] sm:max-w-5xl sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:px-5 sm:py-3">
						<div className="flex items-center justify-between gap-2 sm:gap-4">
							{/* Left: Product Thumbnail + Title + Price (HIDDEN ON MOBILE, VISIBLE ON SM+) */}
							<div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
								{(activeVariant?.image || images?.[0]) && (
									<div className="h-11 w-11 flex-none overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
										{(() => {
											const thumbMedia = parseMediaItem(activeVariant?.image || images[0])
											if (thumbMedia.type !== 'image') {
												return (
													<div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
														<FiPlay className="h-4 w-4 fill-white" />
													</div>
												)
											}
											return (
												<Img
													image={activeVariant?.image || images[0]}
													width={100}
													className="h-full w-full object-cover"
													alt={title}
												/>
											)
										})()}
									</div>
								)}
								<div className="min-w-0">
									<p className="line-clamp-1 text-xs leading-snug font-semibold text-gray-900 sm:text-sm">
										{title}
									</p>
								</div>
								<div className="flex-none">
									<span className="text-sm font-extrabold text-blue-600 sm:text-base">
										{formatVND(finalPrice)}
									</span>
								</div>
							</div>

							{/* Middle & Right: Variant Selector + Quantity + CTA Buttons */}
							<div className="flex w-full flex-1 items-center justify-between gap-2 sm:w-auto sm:flex-none sm:justify-end sm:gap-3">
								{/* Interactive Variant Dropdown (Chỉ hiện từ Desktop / Tablet, Ẩn trên Mobile) */}
								{effectiveHasVariants && variants && variants.length > 0 && (
									<div className="relative hidden max-w-[160px] flex-none sm:block sm:max-w-[220px]">
										<select
											value={activeVariantIndex}
											onChange={(e) => {
												const idx = Number(e.target.value)
												const targetVariant = variants[idx]
												if (targetVariant) {
													const newOpts: Record<string, string> = {}
													if (
														targetVariant.options &&
														targetVariant.options.length > 0
													) {
														targetVariant.options.forEach((o) => {
															if (o.name && o.value) newOpts[o.name] = o.value
														})
													} else {
														effectiveOptions.forEach((opt) => {
															const matchedVal = opt.values.find((val) =>
																targetVariant.title
																	?.toLowerCase()
																	.includes(val.toLowerCase()),
															)
															if (matchedVal) newOpts[opt.name] = matchedVal
														})
													}
													if (Object.keys(newOpts).length > 0) {
														setSelectedOptions((prev) => ({
															...prev,
															...newOpts,
														}))
													}
												}
											}}
											className="w-full cursor-pointer appearance-none truncate rounded-full border border-blue-300 bg-blue-50/90 py-1.5 pr-7 pl-3 text-xs font-semibold text-blue-700 shadow-2xs transition outline-none hover:border-blue-500"
										>
											{variants.map((v, idx) => (
												<option key={v._key || v.sku || idx} value={idx}>
													{v.title}
												</option>
											))}
										</select>
										<FiChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-blue-600" />
									</div>
								)}

								{/* Quantity Selector */}
								<div className="flex flex-none items-center overflow-hidden rounded-full border border-gray-200 bg-gray-50/50">
									<button
										className="flex h-8 w-7 cursor-pointer items-center justify-center text-xs font-semibold text-gray-500 transition hover:text-gray-900 sm:w-8 sm:text-sm"
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									>
										−
									</button>
									<span className="flex h-8 w-6 items-center justify-center text-xs font-bold text-gray-900 sm:w-8 sm:text-sm">
										{quantity}
									</span>
									<button
										className="flex h-8 w-7 cursor-pointer items-center justify-center text-xs font-semibold text-gray-500 transition hover:text-gray-900 sm:w-8 sm:text-sm"
										onClick={() => setQuantity((q) => q + 1)}
									>
										+
									</button>
								</div>

								{/* Thêm vào giỏ Button */}
								{(productSettings as any)?.enableAddToCartButton !== false && (
									<button
										onClick={handleOnlyAddToCart}
										className="flex-1 cursor-pointer rounded-full bg-blue-50 px-3.5 py-2 text-center text-xs font-bold whitespace-nowrap text-blue-600 transition hover:bg-blue-100 active:scale-[0.97] sm:flex-none sm:px-6 sm:py-2.5 sm:text-sm"
									>
										{(productSettings as any)?.addToCartButtonText ||
											'Thêm vào giỏ'}
									</button>
								)}

								{/* Mua ngay Button */}
								{productSettings?.enableBuyNowButton !== false && (
									<button
										onClick={handleAddToCart}
										className="flex-1 cursor-pointer rounded-full bg-blue-600 px-3.5 py-2 text-center text-xs font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.97] sm:flex-none sm:px-6 sm:py-2.5 sm:text-sm"
									>
										{(productSettings as any)?.buyNowButtonText || 'Mua ngay'}
									</button>
								)}
							</div>
						</div>
					</div>
				)}
		</div>
	)
}
