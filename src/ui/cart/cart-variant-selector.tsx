'use client'

import { useEffect, useState } from 'react'
import { HiChevronDown } from 'react-icons/hi2'
import Swal from 'sweetalert2'
import { cn, formatVND } from '@/lib/utils'
import {
	CartItem,
	ProductVariant,
	useCartStore,
} from '@/store/use-cart-store'

interface CartVariantSelectorProps {
	item: CartItem
	className?: string
}

export default function CartVariantSelector({
	item,
	className,
}: CartVariantSelectorProps) {
	const updateVariant = useCartStore((state) => state.updateVariant)
	const updateItemData = useCartStore((state) => state.updateItemData)

	const [variants, setVariants] = useState<ProductVariant[]>(
		item.variants || [],
	)
	const [isLoading, setIsLoading] = useState(false)

	// Lấy danh sách biến thể từ Sanity nếu trong item chưa có
	useEffect(() => {
		if (item.variants && item.variants.length > 0) {
			setVariants(item.variants)
			return
		}

		if (!item.productId && !item.slug) return

		let isCancelled = false
		setIsLoading(true)

		const params = new URLSearchParams()
		if (item.productId) params.set('productId', item.productId)
		if (item.slug) params.set('slug', item.slug)

		fetch(`/api/products/variants?${params.toString()}`)
			.then((res) => res.json())
			.then((data) => {
				if (isCancelled) return
				if (data.success && data.product?.variants?.length) {
					setVariants(data.product.variants)
					updateItemData(item.id, {
						options: data.product.options || [],
						variants: data.product.variants,
						productTitle: data.product.title,
						hasVariants: true,
					})
				}
				setIsLoading(false)
			})
			.catch(() => {
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [item.id, item.productId, item.slug, item.variants, updateItemData])

	// Nếu chỉ có 1 hoặc 0 biến thể thì chỉ hiển thị dạng text
	const hasMultipleVariants = variants.length > 1

	// Xác định ID biến thể hiện tại
	const currentVariantId =
		item.variantId ||
		variants.find((v) => v.title === item.variantTitle)?._key ||
		variants.find((v) => v.title === item.variantTitle)?.sku ||
		variants[0]?._key ||
		variants[0]?.sku ||
		''

	const handleChange = (targetKey: string) => {
		const selected = variants.find(
			(v) => (v._key || v.sku || v.title) === targetKey,
		)
		if (!selected) return

		const newVariantId = (selected._key ||
			selected.sku ||
			selected.title ||
			'default') as string
		const itemSku = selected.sku || item.sku || ''
		const baseTitle =
			item.productTitle || item.title.replace(/\s*\([^)]*\)$/, '').trim()
		const newTitle = selected.title
			? `${baseTitle} (${selected.title})`
			: baseTitle

		const selectedOpts: Record<string, string> = {}
		if (selected.options && Array.isArray(selected.options)) {
			selected.options.forEach((opt) => {
				if (opt.name && opt.value) selectedOpts[opt.name] = opt.value
			})
		}

		updateVariant(item.id, {
			variantId: newVariantId,
			variantTitle: selected.title,
			selectedOptions: selectedOpts,
			sku: itemSku,
			title: newTitle,
			price:
				typeof selected.price === 'number' && selected.price > 0
					? selected.price
					: item.price,
			compareAtPrice: selected.compareAtPrice,
			image: selected.image || item.image,
		})

		Swal.fire({
			toast: true,
			position: 'top-end',
			showConfirmButton: false,
			timer: 2500,
			customClass: {
				popup:
					'!p-2.5 !rounded-xl !border !border-gray-200/90 !shadow-lg !bg-white !w-auto !min-w-[240px]',
				container: 'mt-20 md:mt-24 z-[999]',
			},
			html: `
				<div class="flex items-center gap-2 p-0.5 font-sans text-left">
					<div class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">
						✓
					</div>
					<div class="text-xs">
						<span class="text-gray-500">Đã đổi:</span> <strong class="text-gray-900 font-semibold">${selected.title}</strong>
					</div>
				</div>
			`,
		})
	}

	if (!hasMultipleVariants && item.variantTitle) {
		return (
			<div className={cn('text-xs text-gray-500 mt-0.5 truncate', className)}>
				Phân loại:{' '}
				<span className="font-medium text-gray-700">{item.variantTitle}</span>
			</div>
		)
	}

	if (!hasMultipleVariants) return null

	return (
		<div className={cn('mt-1 inline-block max-w-full relative', className)}>
			<div className="relative flex items-center group">
				<select
					value={currentVariantId}
					disabled={isLoading}
					onChange={(e) => handleChange(e.target.value)}
					className="appearance-none text-xs font-medium text-gray-800 bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/90 hover:border-neutral-300 rounded-md py-1 pl-2.5 pr-6 cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all max-w-[220px] truncate shadow-2xs"
					title="Bấm để chọn phân loại khác"
				>
					{variants.map((v) => {
						const key = v._key || v.sku || v.title || ''
						const isOut = typeof v.stock === 'number' && v.stock <= 0
						const priceLabel =
							typeof v.price === 'number' && v.price > 0
								? ` - ${formatVND(v.price)}`
								: ''

						return (
							<option key={key} value={key} disabled={isOut}>
								{v.title}
								{priceLabel}
								{isOut ? ' (Hết hàng)' : ''}
							</option>
						)
					})}
				</select>
				<HiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-700 text-xs transition-colors" />
			</div>
		</div>
	)
}
