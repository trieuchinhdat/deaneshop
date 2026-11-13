import { groq, stegaClean } from 'next-sanity'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { enrichProductsWithD1Reviews } from '@/lib/reviews'
import { isStaticStorefront } from '@/lib/deployment-profile'
import { sanityFetchLive } from '@/sanity/lib/live'
import { PRODUCT_CARD_FIELDS } from '@/sanity/lib/product-card-query'
import type { ProductList } from '@/sanity/types'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'
import ProductListClient, { type Product } from './product-list-client'
import ProductListIntro from './product-list-intro'

// 1. Explicit return type definition
type ProductListQueryResult = {
	collectionData: {
		_id: string
		title: string
		slug: string
	} | null
	totalCount: number
	categories: Array<{
		title: string
		slug: string
		count: number
	}>
	products: Product[]
} | null

// Helper function to resolve dynamic links based on schema type
const resolveInternalLink = (slug: string, type?: string) => {
	switch (type) {
		case 'product':
			return `/products/${slug}`
		case 'collection':
			return `/collections/${slug}`
		case 'blog.post':
			return `/blog/${slug}`
		case 'page':
			return slug === 'home' || slug === 'index' ? '/' : `/${slug}`
		default:
			return `/${slug}`
	}
}

type ProductListModuleProps = Partial<ProductList> & {
	_key?: string
	collection?: { _id: string; title?: string; slug?: string }
	badge?: string
	showViewAll?: boolean
	viewAllLabel?: string
	columnsDesktop?: number
	columnsMobile?: number
	autoSlideInterval?: number
	theme?: 'default' | 'flat' | 'subtle' | 'dark' | 'custom'
	enableSort?: boolean
	defaultSort?: string
	productSettings?: any
	image?: any
}

export default async function ProductListCategory({
	image,
	badge,
	intro = [],
	collection,
	showViewAll = false,
	viewAllLabel = 'View All Products',
	limit = 8,
	itemsPerPage = 8,
	layout = 'grid',
	columnsDesktop = 4,
	columnsMobile = 2,
	rowsDesktop = 1,
	rowsMobile = 1,
	autoSlide = false,
	autoSlideInterval = 5,
	enableFilter = false,
	enableSort = false,
	defaultSort = 'default',
	theme = 'default',
	backgroundColor = '#ffffff',
	textColor = '#000000',
	productSettings,
	...props
}: ProductListModuleProps) {
	// Builder pages with product lists need request-bound D1 reviews, too.
	if (!isStaticStorefront) await connection()
	// Query Sanity API
	const result = await sanityFetchLive<ProductListQueryResult>({
		query: PRODUCTS_BY_COLLECTION_QUERY,
		params: {
			limit,
			collectionId: collection?._id || null,
		},
	})

	const products = await enrichProductsWithD1Reviews(result?.products || [])
	const collectionData = result?.collectionData || null
	const totalCount = result?.totalCount ?? products.length
	const categories = result?.categories ?? []

	// Resolve effective collection title and slug
	const collectionTitle = collectionData?.title || collection?.title || ''
	const collectionSlug = collectionData?.slug || collection?.slug || ''

	// Resolve banner link href
	let bannerHref: string | null = null
	if (image?.linkBannerType === 'external' && image?.external) {
		bannerHref = image.external
	} else if (image?.linkBannerType === 'internal' && image?.internalSlug) {
		bannerHref = resolveInternalLink(image.internalSlug, image.internalType)
	}

	// Do not render empty section unless there is an intro or banner image
	if (!products.length && !intro.length && !image) {
		return null
	}

	// Container style presets
	let themeContainerClasses =
		'rounded-2xl p-4 sm:p-6 lg:p-8 bg-white border border-gray-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800'
	let customStyles: React.CSSProperties | undefined = undefined

	if (theme === 'flat') {
		themeContainerClasses = 'p-2 sm:p-4 bg-transparent'
	} else if (theme === 'subtle') {
		themeContainerClasses =
			'rounded-2xl p-4 sm:p-6 lg:p-8 bg-slate-50/80 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800'
	} else if (theme === 'dark') {
		themeContainerClasses =
			'rounded-2xl p-4 sm:p-6 lg:p-8 bg-slate-900 text-white border border-slate-800 shadow-md'
	} else if (theme === 'custom') {
		themeContainerClasses =
			'rounded-2xl p-4 sm:p-6 lg:p-8 border border-transparent shadow-xs'
		customStyles = {
			backgroundColor: backgroundColor
				? stegaClean(backgroundColor)
				: undefined,
			color: textColor ? stegaClean(textColor) : undefined,
		}
	}

	return (
		<section
			className="section py-6 lg:py-10"
			aria-label="Product Showcase"
			{...moduleAttributes(props)}
		>
			{/* Optional Promotional Banner */}
			{image && (
				<div className="mb-6 w-full overflow-hidden rounded-2xl">
					{bannerHref ? (
						<Link
							href={bannerHref}
							target={
								image.linkBannerType === 'external' ? '_blank' : undefined
							}
							rel={
								image.linkBannerType === 'external'
									? 'noopener noreferrer'
									: undefined
							}
							className="block rounded-2xl transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
						>
							<ResponsiveImage
								className="w-full object-cover"
								image={image}
								desktop={{ width: 1440 }}
								mobile={{ width: 640 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							className="w-full object-cover"
							image={image}
							desktop={{ width: 1440 }}
							mobile={{ width: 640 }}
						/>
					)}
				</div>
			)}

			<div
				className={`relative space-y-4 ${themeContainerClasses}`}
				style={customStyles}
			>
				{/* Section Header & Intro */}
				<ProductListIntro
					badge={badge}
					intro={intro}
					collectionTitle={collectionTitle}
					collectionSlug={collectionSlug}
					showViewAll={showViewAll}
					viewAllLabel={viewAllLabel}
					enableFilter={enableFilter}
					textColor={
						theme === 'custom' && textColor ? stegaClean(textColor) : undefined
					}
				/>

				{/* Products List (Client Component with Suspense) */}
				<Suspense fallback={<ProductListSkeleton columns={columnsDesktop} />}>
					<ProductListClient
						products={products}
						collectionId={collection?._id}
						initialTotalCount={totalCount}
						initialCategories={categories}
						layout={layout}
						columnsDesktop={columnsDesktop}
						columnsMobile={columnsMobile}
						itemsPerPage={itemsPerPage}
						rowsDesktop={rowsDesktop}
						rowsMobile={rowsMobile}
						autoSlide={autoSlide}
						autoSlideInterval={autoSlideInterval}
						enableFilter={enableFilter}
						enableSort={enableSort}
						defaultSort={defaultSort}
						productSettings={productSettings}
					/>
				</Suspense>
			</div>
		</section>
	)
}

function ProductListSkeleton({ columns = 4 }: { columns?: number }) {
	const colClass =
		columns === 2
			? 'grid-cols-2'
			: columns === 3
				? 'grid-cols-2 md:grid-cols-3'
				: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

	return (
		<div className={`grid gap-4 ${colClass}`} aria-hidden="true">
			{[...Array(columns * 2)].map((_, i) => (
				<div
					key={i}
					className="flex flex-col space-y-3 rounded-xl border border-gray-100 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
				>
					<div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800" />
					<div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
					<div className="h-3 w-1/2 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
					<div className="h-4 w-1/3 animate-pulse rounded-md bg-gray-200 dark:bg-slate-800" />
				</div>
			))}
		</div>
	)
}

export const PRODUCTS_BY_COLLECTION_QUERY = groq`
{
  "collectionData": *[_type == "collection" && _id == $collectionId][0]{ 
    _id, 
    title,
    "slug": coalesce(metadata.slug.current, slug.current)
  },

  "totalCount": select(
    defined($collectionId) => count(*[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref]),
    count(*[_type == "product" && !(_id in path("drafts.**"))])
  ),

  "categories": select(
    defined($collectionId) => *[_type == "product.category" && count(*[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref && references(^._id)]) > 0]{
      title,
      "slug": slug.current,
      "count": count(*[_type == "product" && !(_id in path("drafts.**")) && _id in *[_type == "collection" && _id == $collectionId][0].products[]._ref && references(^._id)])
    },
    *[_type == "product.category" && count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)]) > 0]{
      title,
      "slug": slug.current,
      "count": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)])
    }
  ),

  "products": select(
    defined($collectionId) => *[_type == "collection" && _id == $collectionId][0].products[@-> != null][0...$limit]->{
      ${PRODUCT_CARD_FIELDS}
},

    *[_type == "product" && !(_id in path("drafts.**"))] | order(_createdAt desc)[0...$limit] {
      ${PRODUCT_CARD_FIELDS}
}
  )
}
`
