import { createDataAttribute, stegaClean } from 'next-sanity'
import type {
	BLOG_POST_QUERY_RESULT,
	ModuleAttributes,
	PAGE_QUERY_RESULT,
	PRODUCT_QUERY_RESULT,
	PRODUCT_SETTINGS_QUERY_RESULT,
} from '@/sanity/types'
import { moduleAttributes, type ModuleProps } from './module-utils'
import AccordionList from './accordion-list'
import BlogPostList from './blog/blog-post-list'
import Callout from './callout'
import CardList from './card-list'
import WrapCarouselBannerList from './carousel-banner-list'
import ComparisonTable from './comparison-table'
import ComplianceVault from './compliance-vault'
import CountdownBanner from './countdown-banner'
import CustomHTML from './custom-html'
import HeroSlider from './hero-slider'
import HeroSplit from './hero.split'
import LeadCaptureForm from './lead-capture-form'
import LogoList from './logo-list'
import MediaGrid from './media-grid'
import PersonList from './person-list'
import productList from './product/product-list'
import Prose from './prose'
import QuoteList from './quote-list'
import ScrollRevealWrapper, {
	type ScrollRevealEffect,
	type ScrollRevealSpeed,
} from './scroll-reveal-wrapper'
import SocialProof from './social-proof'
import StatList from './stat-list'
import StepList from './step-list'
import StickyMobileCTA from './sticky-mobile-cta'
import TieredPricing from './tiered-pricing'

const MODULES_MAP = {
	'accordion-list': AccordionList,
	'blog-post-list': BlogPostList,
	callout: Callout,
	'card-list': CardList,
	'carousel-banner-list': WrapCarouselBannerList,
	'comparison-table': ComparisonTable,
	'compliance-vault': ComplianceVault,
	'countdown-banner': CountdownBanner,
	'custom-html': CustomHTML,
	'hero.split': HeroSplit,
	'hero-slider': HeroSlider,
	'media-grid': MediaGrid,
	'lead-capture-form': LeadCaptureForm,
	'logo-list': LogoList,
	'person-list': PersonList,
	'product-list': productList,
	prose: Prose,
	'quote-list': QuoteList,
	'social-proof': SocialProof,
	'stat-list': StatList,
	'step-list': StepList,
	'sticky-mobile-cta': StickyMobileCTA,
	'tiered-pricing': TieredPricing,
} as const

export default function ModulesResolver({
	modules: directModules,
	page,
	post,
	product,
	collection,
	productSettings,
	blogSettings,
	scrollReveal: directScrollReveal,
	scrollRevealSpeed: directScrollRevealSpeed,
	scrollRevealOffset: directScrollRevealOffset,
}: {
	modules?: any[]
	page?: PAGE_QUERY_RESULT
	post?: BLOG_POST_QUERY_RESULT
	product?: PRODUCT_QUERY_RESULT
	collection?: any
	productSettings?: PRODUCT_SETTINGS_QUERY_RESULT
	blogSettings?: any
	scrollReveal?: ScrollRevealEffect
	scrollRevealSpeed?: ScrollRevealSpeed
	scrollRevealOffset?: string
}) {
	const pageAppearance = (page as any)?.appearance
	const scrollReveal =
		directScrollReveal ??
		(stegaClean(pageAppearance?.scrollReveal) as ScrollRevealEffect | undefined) ??
		'none'
	const scrollRevealSpeed =
		directScrollRevealSpeed ??
		(stegaClean(pageAppearance?.scrollRevealSpeed) as ScrollRevealSpeed | undefined) ??
		'standard'
	const scrollRevealOffset =
		directScrollRevealOffset ??
		(stegaClean(pageAppearance?.scrollRevealOffset) as string | undefined) ??
		'20%'

	const rawModules =
		directModules ??
		[page, post, product, collection].flatMap((item) => item?.modules ?? [])

	const modules = rawModules.filter(
		(module: any) => module && !module.hidden && !module.attributes?.hidden,
	)

	const moduleSpecificProps = (module: ModuleProps) => {
		switch (module._type) {
			case 'blog-post-list':
				return { blogSettings }
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
			{modules?.map((module, index) => {
				if (!module) return null

				const Module = MODULES_MAP[
					module._type as keyof typeof MODULES_MAP
				] as React.ComponentType

				if (!Module) return null

				const targetDoc = page || post || product || collection
				const sanityAttr = targetDoc
					? createDataAttribute({
							id: targetDoc._id,
							type: targetDoc._type,
							path: `modules[_key == "${module._key}"]`,
						})
					: undefined

				const isClientComponent =
					module._type === 'tiered-pricing' ||
					module._type === 'compliance-vault' ||
					module._type === 'hero-slider' ||
					Boolean(
						Module &&
						typeof Module === 'object' &&
						((Module as any).$$typeof ===
							Symbol.for('react.client.reference') ||
							(Module as any).$$typeof
								?.toString?.()
								.includes('react.client.reference')),
					)

				const isSticky = module._type === 'sticky-mobile-cta'
				const shouldAnimate = scrollReveal !== 'none' && index > 0 && !isSticky

				const renderedModule = (
					<Module
						{...module}
						{...moduleSpecificProps(module)}
						data-sanity={sanityAttr?.toString()}
						sanityAttr={isClientComponent ? undefined : sanityAttr}
						key={shouldAnimate ? undefined : module._key}
					/>
				)

				if (shouldAnimate) {
					return (
						<ScrollRevealWrapper
							key={module._key}
							effect={scrollReveal}
							speed={scrollRevealSpeed}
							offset={scrollRevealOffset}
						>
							{renderedModule}
						</ScrollRevealWrapper>
					)
				}

				return renderedModule
			})}
		</>
	)
}

export * from './module-utils'
