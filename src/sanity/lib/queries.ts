import { groq } from 'next-sanity'
import type { SITE_QUERY_RESULT } from '@/sanity/types'
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
	header->{ ${NAVIGATION_QUERY} },
	ctas[]{
		...,
		link{ ${LINK_QUERY} }
	},
	footer->{ ${NAVIGATION_QUERY} },
	social->{ ${NAVIGATION_QUERY} },
	chatbox->{ ${NAVIGATION_QUERY} },
	announcements->{ 
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
	},
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
			reviews[]{
				_key,
				author,
				rating,
				comment,
				images[]{
					...,
					asset->{
						...,
						metadata
					}
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

/* queries */

export async function getSite() {
	return await sanityFetchLive<SITE_QUERY_RESULT>({
		query: SITE_QUERY,
	})
}
