import { NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'

const WISHLIST_PRODUCTS_QUERY = groq`
  *[_type == "product" && _id in $ids] {
    _id,
    title,
    price,
    compareAtPrice,
    tags,
    sold,
    stock,
    hasVariants,
    options[]{
      name,
      values
    },
    variants[]{
      _key,
      title,
      price,
      compareAtPrice,
      stock,
      options[]{
        name,
        value
      },
      image{
        ...,
        asset->
      }
    },
    "slug": metadata.slug.current,
    images[]{
      ...,
      asset->
    },
    "reviews": *[_type == "review" && references(^._id) && isApproved == true]{ rating },
    categories[]->{
      title,
      "slug": slug.current
    }
  }
`

export async function POST(req: Request) {
	try {
		const body = await req.json()
		const ids: string[] = Array.isArray(body?.ids) ? body.ids : []

		if (!ids.length) {
			return NextResponse.json({ products: [] })
		}

		// Giới hạn tối đa 100 ID mỗi lần query để bảo vệ API
		const cleanIds = ids.slice(0, 100)

		const products = await client.fetch(WISHLIST_PRODUCTS_QUERY, { ids: cleanIds }, { cache: 'no-store' })

		// Sắp xếp sản phẩm theo đúng thứ tự mà user đã thêm (theo mảng IDs gửi lên)
		const sortedProducts = cleanIds
			.map((id) => products.find((p: any) => p._id === id))
			.filter(Boolean)

		return NextResponse.json({ products: sortedProducts })
	} catch (error) {
		console.error('[API_WISHLIST_QUERY_ERROR]', error)
		return NextResponse.json({ error: 'Internal Server Error', products: [] }, { status: 500 })
	}
}
