import { groq } from 'next-sanity'
import type { PAGE_QUERY_RESULT, PRODUCT_SETTINGS_QUERY_RESULT, SITE_QUERY_RESULT } from '@/sanity/types'
import { sanityFetchLive } from './live'



/* fragments */

// @sanity-typegen-ignore
const LINK_QUERY = groq`
	...,
	type == 'internal' => {
		internal->{
			_type,
			title,
			'slug': select(
				_type == 'collection' => '/collections/' + metadata.slug.current,
				_type == 'product' => '/products/' + metadata.slug.current,
				_type == 'blog.post' => '/blog/' + metadata.slug.current,
				metadata.slug.current == 'index' => '/',
				'/' + metadata.slug.current
			)
		}
	}
`

// @sanity-typegen-ignore
const NAVIGATION_QUERY = groq`
	items[]{
		${LINK_QUERY},
		defined(link) => { link{ ${LINK_QUERY} } },
		defined(links[]) => { links[]{ ${LINK_QUERY} } },
		_type == 'megamenu' => {
			defined(link) => { link{ ${LINK_QUERY} } },
			items[]{
				...,
				_type == 'link.list' => {
					defined(link) => { link{ ${LINK_QUERY} } },
					links[]{ ${LINK_QUERY} }
				}
			}
		}
	}
`

const SITE_QUERY = groq`*[_type == 'site'][0]{
	...,
	footer->{ ${NAVIGATION_QUERY} },
	social->{ ${NAVIGATION_QUERY} },
	chatbox->{ ${NAVIGATION_QUERY} },
	theme { 
        primaryColor,
        backgroundColor,
        textColor,
        headerBackground,
        headerText,
        footerBackground,
        footerText
    },
	scripts[] {
      _key,
      title,
      isActive,
      location,
      strategy,
      scriptType,
      src,
      code,
      attributes[] {
        key,
        value
      }
    }
}`

export const GLOBAL_MODULE_PATH_QUERY = groq`
	string::startsWith($slug, path)
	&& select(
		defined(excludePaths) => count(excludePaths[string::startsWith($slug, @)]) == 0,
		true
	)
`

// @sanity-typegen-ignore
export const MODULES_QUERY = groq`
	...,
	ctas[]{
		...,
		link{ ${LINK_QUERY} }
	},
	_type == 'breadcrumbs' => {
		crumbs[]{ ${LINK_QUERY} }
	},
	_type == 'card-list' => {
		cards[]{
			...,
			ctas[]{
				...,
				link{ ${LINK_QUERY} }
			}
		}
	},
	_type == 'logo-list' => {
		logos[]{
			...,
			_type == 'reference' => @->
		}
	},
	_type == 'person-list' => {
		people[]{
			...,
			_type == 'reference' => @->
		}
	},
	_type == 'prose' => {
		content[]{
			...,
			_type == 'image' => {
				...,
				asset->{
					...,
					metadata
				}
			}
		},
		'headings': select(
			tableOfContents in ['left', 'right'] => content[style in ['h2', 'h3', 'h4', 'h5', 'h6']]{
				style,
				'text': pt::text(@)
			}
		)
	},
	_type == 'quote-list' => {
		testimonials[]{
			...,
			_type == 'reference' => @->
		}
	},
	_type == 'product-list' => {
        ..., 
        image {
            ..., 
            asset->,
			"internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current 
        },
		collection->{
			_id,	
			title,
			"slug": slug.current
		},
    },
	_type == 'product' => {
		...,
		productDetail->{
			_id,
			_type,
			title,
			sku,
			description,
			images[]{
				...,
				asset->{
					...,
					metadata
				}
			},
			price,
			salePrice,
			sales,
			hasVariants,
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
			},
			"approvedReviews": *[_type == "review" && references(^._id) && isApproved == true] | order(createdAt desc) {
				_id,
				author,
				rating,
				comment,
				response,
				createdAt,
				images[]{
					...,
					asset->
				},
				videos[]{
					...,
					asset->
				}
			},
		}
	},
	_type == 'carousel-banner-list' => {
        ..., 
        items[]{
            ..., 
            asset->, 
            mobileImage {
                asset->
            },
            "internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current,
        }
    },
	_type == 'blog-post-list' => {
        ..., 
        image {
            ..., 
            asset->,
			"internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current 
        }
    },
	_type == 'collection-content' => {
		...,
	},
	
`

export const PRODUCT_CARD_SETTINGS_QUERY = groq`*[_type == 'product-card-settings'][0]{...}`

export const PRODUCT_SETTINGS_QUERY = groq`*[_type == 'product-settings'][0]{
	...,
	defaultPromotions,
	defaultSpecialConditions,
	trustBadges[]{
		...,
		icon {
			...,
			asset->
		}
	},
	promoBanners[]{
		...,
		image {
			...,
			asset->
		},
		mobileImage {
			...,
			asset->
		},
		link {
			${LINK_QUERY}
		}
	}
}`

export const HEADER_SETTINGS_QUERY = groq`*[_type == 'header-settings'][0]{
	...,
	menu->{ ${NAVIGATION_QUERY} },
	mobileMenu->{ ${NAVIGATION_QUERY} },
	ctas[]{
		...,
		iconType,
		actionType,
		link{ ${LINK_QUERY} }
	},
	announcements[]->{
		...,
		enabled,
		variant,
		content,
		backgroundColor,
		textColor,
		image {
			...,
			asset->,
			mobileImage { asset-> }
		},
		"internalType": internal->_type,
		"internalSlug": internal->metadata.slug.current
	}
}`

/* queries */

export async function getSite() {
	return await sanityFetchLive<SITE_QUERY_RESULT>({
		query: SITE_QUERY,
	})
}

export async function getHeaderSettings() {
	return await sanityFetchLive<any>({
		query: HEADER_SETTINGS_QUERY,
	})
}

export async function getProductCardSettings() {
	return await sanityFetchLive<any>({
		query: PRODUCT_CARD_SETTINGS_QUERY,
	})
}

export async function getProductSettings() {
	const [productSettings, cardSettings] = await Promise.all([
		sanityFetchLive<PRODUCT_SETTINGS_QUERY_RESULT>({
			query: PRODUCT_SETTINGS_QUERY,
		}),
		sanityFetchLive<any>({
			query: PRODUCT_CARD_SETTINGS_QUERY,
		}),
	])
	return {
		...(productSettings || {}),
		...(cardSettings || {}),
	}
}

export const PAGE_QUERY = groq`
	*[_type == 'page' && metadata.slug.current == $slug][0]{
		...,
		'modules': (
			// global moddules (before)
			*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
			// path modules (before)
			+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].before[]{ ${MODULES_QUERY} }
			// page modules
			+ modules[]{ ${MODULES_QUERY} }
			// path modules (after)
			+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].after[]{ ${MODULES_QUERY} }
			// global moddules (after)
			+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
		)
	}
`

export async function getPage(slug?: string[]) {
	return await sanityFetchLive<PAGE_QUERY_RESULT>({
		query: PAGE_QUERY,
		params: {
			slug: slug ? slug.join('/') : 'index',
		},
	})
}



export async function getCartCheckoutSettings() {
	return await sanityFetchLive<any>({
		query: groq`*[_type == 'cart-checkout'][0]{...}`,
	})
}

