'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { ProductCard, type Product } from '@/ui/modules/product/product-card'
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
		<section className="my-10 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-4 sm:my-14 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
			{/* Section Header */}
			<div className="flex items-center justify-between gap-4 border-b border-zinc-200/60 pb-4 dark:border-zinc-800">
				<div className="flex items-center gap-2.5">
					<div>
						<h3 className="text-lg font-extrabold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100">
							{title}
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Directly referenced products with live pricing, reviews & quick
							add
						</p>
					</div>
				</div>
			</div>

			{/* Reusable ProductCard Grid (Matching Store Grid Layout & Settings) */}
			<div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
