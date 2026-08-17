'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ProductCard, type Product } from '@/ui/modules/product/product-list-client'
import QuickViewModal from '@/ui/modules/product/quick-view-modal'

interface RelatedProductsProps {
	products?: Product[]
	title?: string
	productSettings?: any
}

export default function RelatedProducts({
	products = [],
	title = 'Featured in This Article',
	productSettings,
}: RelatedProductsProps) {
	const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

	if (!products || products.length === 0) return null

	return (
		<section className="my-10 sm:my-14 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
			{/* Section Header */}
			<div className="flex items-center justify-between gap-4 border-b border-zinc-200/60 pb-4 dark:border-zinc-800">
				<div className="flex items-center gap-2.5">
					<div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
						<Sparkles className="size-4" />
					</div>
					<div>
						<h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
							{title}
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Directly referenced products with live pricing, reviews & quick add
						</p>
					</div>
				</div>
				<span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-2xs dark:bg-zinc-800 dark:text-zinc-300">
					{products.length} {products.length === 1 ? 'Product' : 'Products'}
				</span>
			</div>

			{/* Reusable ProductCard Grid (Matching Store Grid Layout & Settings) */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 pt-6">
				{products.map((product) => (
					<div key={product._id} className="h-full">
						<ProductCard
							product={product}
							productSettings={productSettings}
							onOpenQuickView={(p) => setQuickViewProduct(p)}
						/>
					</div>
				))}
			</div>

			{/* Reusable Quick View Modal Popup */}
			<QuickViewModal
				isOpen={Boolean(quickViewProduct)}
				product={quickViewProduct}
				productSettings={productSettings}
				onClose={() => setQuickViewProduct(null)}
			/>
		</section>
	)
}
