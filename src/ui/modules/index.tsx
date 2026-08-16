import { createDataAttribute, stegaClean } from 'next-sanity'
import type {
	BLOG_POST_QUERY_RESULT,
	ModuleAttributes,
	PAGE_QUERY_RESULT,
	PRODUCT_QUERY_RESULT,
	PRODUCT_SETTINGS_QUERY_RESULT,
} from '@/sanity/types'
import AccordionList from './accordion-list'
import BlogIndex from './blog/blog-index'
import BlogPostContent from './blog/blog-post-content'
import BlogPostList from './blog/blog-post-list'
import Breadcrumbs from './breadcrumbs'
import Callout from './callout'
import CardList from './card-list'
import WrapCarouselBannerList from './carousel-banner-list'
import WrapCartCheckout from './cart-checkout'
import CustomHTML from './custom-html'
import HeroSplit from './hero.split'
import LogoList from './logo-list'
import PersonList from './person-list'
import CollectionContent from './collection/collection-content'
import productContent from './product/product-content'
import productList from './product/product-list'
import Prose from './prose'
import QuoteList from './quote-list'
import SearchModule from './search'
import StatList from './stat-list'
import StepList from './step-list'
import ThemeBackground from './theme-background'

const MODULES_MAP = {
	'accordion-list': AccordionList,
	'blog-index': BlogIndex,
	'blog-post-content': BlogPostContent,
	'blog-post-list': BlogPostList,
	breadcrumbs: Breadcrumbs,
	callout: Callout,
	'card-list': CardList,
	'custom-html': CustomHTML,
	'theme-background': ThemeBackground,
	'hero.split': HeroSplit,
	'logo-list': LogoList,
	'person-list': PersonList,
	prose: Prose,
	'quote-list': QuoteList,
	'search-module': SearchModule,
	'stat-list': StatList,
	'step-list': StepList,
	'carousel-banner-list': WrapCarouselBannerList,
	'product-content': productContent,
	'product-list': productList,
	'collection-content': CollectionContent,
	'cart-checkout': WrapCartCheckout,
} as const

export default function ({
	page,
	post,
	product,
	collection,
	productSettings,
}: {
	page?: PAGE_QUERY_RESULT
	post?: BLOG_POST_QUERY_RESULT
	product?: PRODUCT_QUERY_RESULT
	collection?: any
	productSettings?: PRODUCT_SETTINGS_QUERY_RESULT
}) {
	const modules = [page, post, product, collection].flatMap((item) => item?.modules ?? [])

	const moduleSpecificProps = (module: ModuleProps) => {
		switch (module._type) {
			case 'blog-post-content':
				return { post }
			case 'product-content':
				return { product, productSettings }
			case 'collection-content':
				return { collection, productSettings }
			case 'breadcrumbs':
				return { currentPage: page || post || product || collection }
			case 'product-list':
				return {
					collection:
						(module as any).collection ||
						(collection ? { _id: collection._id } : undefined),
					productSettings,
				}
			default:
				return {}
		}
	}

	return (
		<>
			{modules?.map((module) => {
				if (!module) return null

				const Module = MODULES_MAP[
					module._type as keyof typeof MODULES_MAP
				] as React.ComponentType

				if (!Module) return null

				const attributes = page
					? {
							id: page._id,
							type: page._type,
							path: `page[_key == "${module._key}"]`,
						}
					: post
						? {
								id: post._id,
								type: post._type,
								path: `post[_key == "${module._key}"]`,
							}
						: product
							? {
									id: product._id,
									type: product._type,
									path: `product[_key == "${module._key}"]`,
								}
							: collection
								? {
										id: collection._id,
										type: collection._type,
										path: `collection[_key == "${module._key}"]`,
									}
								: {}

				return (
					<Module
						{...module}
						{...moduleSpecificProps(module)}
						data-sanity={createDataAttribute(attributes)}
						key={module._key}
					/>
				)
			})}
		</>
	)
}

export type ModuleProps = {
	_key?: string
	_type?: string
	attributes?: ModuleAttributes
}

export function moduleAttributes({ _key, _type, attributes }: ModuleProps) {
	return {
		id: stegaClean(attributes?.uid) || `module-${_key}`,
		'data-module': _type,
		hidden: attributes?.hidden,
	}
}
