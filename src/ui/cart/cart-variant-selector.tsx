'use client'

import { useEffect, useState } from 'react'
import { HiChevronDown } from 'react-icons/hi2'
import { showSimpleToast } from '@/lib/toast'
import { cn, formatPrice } from '@/lib/utils'
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

	// Fetch variants list from Sanity if not already present on cart item
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

	// If only 1 or 0 variants exist, render plain text
	const hasMultipleVariants = variants.length > 1

	// Determine current variant ID
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

		showSimpleToast({
			title: 'Variant updated',
			subtitle: selected.title,
			timer: 2500,
		})
	}

	if (!hasMultipleVariants && item.variantTitle) {
		return (
			<div className={cn('text-xs text-gray-500 mt-0.5 truncate', className)}>
				Variant:{' '}
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
					title="Click to select another variant"
				>
					{variants.map((v) => {
						const key = v._key || v.sku || v.title || ''
						const isOut = typeof v.stock === 'number' && v.stock <= 0
						const priceLabel =
							typeof v.price === 'number' && v.price > 0
								? ` - ${formatPrice(v.price)}`
								: ''

						return (
							<option key={key} value={key} disabled={isOut}>
								{v.title}
								{priceLabel}
								{isOut ? ' (Out of stock)' : ''}
							</option>
						)
					})}
				</select>
				<HiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-gray-900 text-xs transition-colors" />
			</div>
		</div>
	)
}
