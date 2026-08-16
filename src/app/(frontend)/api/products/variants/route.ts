import { NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'

const PRODUCT_VARIANTS_QUERY = groq`
  *[_type == "product" && (_id == $id || slug.current == $slug || metadata.slug.current == $slug)][0] {
    _id,
    title,
    "slug": coalesce(slug.current, metadata.slug.current, ""),
    price,
    compareAtPrice,
    stock,
    hasVariants,
    images[]{
      ...,
      asset->{
        ...,
        metadata
      }
    },
    options[]{
      name,
      values
    },
    variants[]{
      _key,
      title,
      sku,
      price,
      compareAtPrice,
      stock,
      image{
        ...,
        asset->{
          ...,
          metadata
        }
      },
      options[]{
        name,
        value
      }
    }
  }
`

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const id = searchParams.get('id') || searchParams.get('productId') || ''
		const slug = searchParams.get('slug') || ''

		if (!id && !slug) {
			return NextResponse.json(
				{ error: 'Missing product id or slug', product: null },
				{ status: 400 },
			)
		}

		const product = await client.fetch(
			PRODUCT_VARIANTS_QUERY,
			{ id, slug },
			{ next: { revalidate: 60 } },
		)

		if (!product) {
			return NextResponse.json(
				{ error: 'Product not found', product: null },
				{ status: 404 },
			)
		}

		return NextResponse.json({ success: true, product })
	} catch (error: any) {
		console.error('[API_PRODUCT_VARIANTS_ERROR]', error)
		return NextResponse.json(
			{ error: error?.message || 'Internal Server Error', product: null },
			{ status: 500 },
		)
	}
}
