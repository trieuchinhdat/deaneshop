import { groq, PortableText } from 'next-sanity'
import Link from 'next/link'
import { Suspense } from 'react'
import { sanityFetchLive } from '@/sanity/lib/live'
import type { Product, ProductList } from '@/sanity/types'
import ResponsiveImage from '@/ui/responsiveImage'
import { moduleAttributes } from '..'
import ProductListClient from './product-list-client'
import ProductListIntro from './product-list-intro'

// 1. Định nghĩa Type rõ ràng cho kết quả trả về
type ProductListQueryResult = {
	collectionData: {
		_id: string
		title: string
		slug: string
	} | null
	products: Product[]
} | null

// Helper function để tạo đường dẫn dựa trên Type
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
export default async function ProductListCategory({
	image,
	intro = [],
	collection,
	limit = 8,
	itemsPerPage = 8,
	layout = 'grid',
	rowsDesktop = 1,
	rowsMobile = 1,
	autoSlide = false,
	enableFilter = false,
	backgroundColor = '#ffffff',
	textColor = '#000000',
	...props
}: ProductList & { image: any; _key: string; collection?: { _id: string } }) {
	// 2. Gọi API
	// Kết quả trả về sẽ ép kiểu theo ProductListQueryResult
	const result = await sanityFetchLive<ProductListQueryResult>({
		query: PRODUCTS_BY_COLLECTION_QUERY,
		params: {
			limit,
			collectionId: collection?._id || null,
		},
	})

	const { products } = result || {}

	// Logic tạo href
	let bannerHref = null

	if (image?.linkBannerType === 'external' && image?.external) {
		bannerHref = image.external
	} else if (image?.linkBannerType === 'internal' && image?.internalSlug) {
		bannerHref = resolveInternalLink(image.internalSlug, image.internalType)
	}

	// Nếu không có sản phẩm thì không render
	if (!products?.length) return null

	return (
		<section className="section" {...moduleAttributes(props)}>
			{/* Banner */}
			{image && (
				<div className="w-full">
					{bannerHref ? (
						<Link
							href={bannerHref}
							target={image.type === 'external' ? '_blank' : undefined}
						>
							<ResponsiveImage
								className="w-full"
								image={image}
								desktop={{ width: 1280 }}
								mobile={{ width: 390 }}
							/>
						</Link>
					) : (
						<ResponsiveImage
							className="w-full"
							image={image}
							desktop={{ width: 1280 }}
							mobile={{ width: 390 }}
						/>
					)}
				</div>
			)}

			<div
				className={`relative space-y-2 p-2 lg:space-y-4 lg:p-4 ${
					image?.asset ? 'rounded-b-xl' : 'rounded-xl'
				}`}
				style={{ backgroundColor: backgroundColor, color: textColor }}
			>
				{/* Intro */}
				{/* {intro?.length > 0 && (
					<header className="prose">
						<PortableText value={intro} />
					</header>
				)} */}

				<ProductListIntro intro={intro} enableFilter={enableFilter} />

				{/* Products List */}
				<Suspense fallback={<ProductListSkeleton />}>
					<ProductListClient
						products={products}
						layout={layout}
						itemsPerPage={itemsPerPage}
						rowsDesktop={rowsDesktop}
						rowsMobile={rowsMobile}
						autoSlide={autoSlide}
						enableFilter={enableFilter}
					/>
				</Suspense>
			</div>
		</section>
	)
}

function ProductListSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{[...Array(4)].map((_, i) => (
				<div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
			))}
		</div>
	)
}

export const PRODUCTS_BY_COLLECTION_QUERY = groq`
{
  "collectionData": *[_type == "collection" && _id == $collectionId][0]{ 
    _id, 
    title,
    "slug": metadata.slug.current
  },

  "products": select(
    defined($collectionId) => *[_type == "collection" && _id == $collectionId][0].products[@-> != null][0...$limit]->{
      _id,
      title,
      price,
      "slug": metadata.slug.current,
      images,
	  reviews,
      "compareAtPrice": compareAtPrice,
	  categories[]->{
        title,
        "slug": slug.current
      }
    },

    *[_type == "product"] | order(_createdAt desc)[0...$limit] {
      _id,
      title,
      price,
      "slug": metadata.slug.current,
      images,
	  reviews,
      "compareAtPrice": compareAtPrice,
	  categories[]->{
        title,
        "slug": slug.current
      }
    }
  )
}
`
