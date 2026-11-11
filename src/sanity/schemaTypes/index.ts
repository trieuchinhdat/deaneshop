import type { SchemaPluginOptions } from 'sanity'
import { withModuleHidden } from '@/sanity/lib/schema-utils'
// documents
import affiliateProduct from './documents/affiliate-product'
import announcementItem from './documents/announcement-item'
import blogCategory from './documents/blog.category'
import blogComment from './documents/blog-comment'
import blogPost from './documents/blog.post'
import blogSettings from './documents/blog-settings'
import checkoutSettings from './documents/checkout-settings'
import collection from './documents/collection'
import globalModule from './documents/global-module'
import logo from './documents/logo'
import navigation from './documents/navigation'
import order from './documents/order'
import page from './documents/page'
import person from './documents/person'
import product from './documents/product'
import productCategory from './documents/product.category'
import quote from './documents/quote'
import redirect from './documents/redirect'
import productSettings from './documents/product-settings'
import productCardSettings from './documents/product-card-settings'
import headerSettings from './documents/header-settings'
import footerSettings from './documents/footer-settings'
import site from './documents/site'
import themeSettings from './documents/theme-settings'
import widgetSettings from './documents/widget-settings'
import systemSettings from './documents/system-settings'
import trackingScript from './documents/tracking-script'
import popupSettings from './documents/popup-settings'
import lead from './documents/lead'
import customer from './documents/customer'
// pure dynamic modules
import accordionList from './modules/accordion-list'
import blogPostList from './modules/blog-post-list'
import callout from './modules/callout'
import cardList from './modules/card-list'
import carouselBannerList from './modules/carousel-banner-list'
import heroSlider from './modules/hero-slider'
import mediaGrid from './modules/media-grid'
import complianceVault from './modules/compliance-vault'
import countdownBanner from './modules/countdown-banner'
import customHtml from './modules/custom-html'
import heroSplit from './modules/hero.split'
import leadCaptureForm from './modules/lead-capture-form'
import logoList from './modules/logo-list'
import personList from './modules/person-list'
import productList from './modules/product-list'
import prose from './modules/prose'
import quoteList from './modules/quote-list'
import socialProof from './modules/social-proof'
import statList from './modules/stat-list'
import stepList from './modules/step-list'
import stickyMobileCta from './modules/sticky-mobile-cta'
import comparisonTable from './modules/comparison-table'
import tieredPricing from './modules/tiered-pricing'
// legacy / deprecated modules (preserved for backwards-compatibility)
import blogIndex from './modules/blog-index'
import blogPostContent from './modules/blog-post-content'
import breadcrumbs from './modules/breadcrumbs'
import cartCheckout from './modules/cart-checkout'
import collectionContent from './modules/collection-content'
import productContent from './modules/product-content'
import searchModule from './modules/search-module'
// objects
import cta from './objects/cta'
import link from './objects/link'
import linkList from './objects/link.list'
import megamenu from './objects/megamenu'
import metadata from './objects/metadata'
import moduleAttributes from './objects/module-attributes'
import productOption from './objects/product.option'
import productVariant from './objects/product.variant'
import calloutBox from './objects/callout-box'
import productEmbed from './objects/product-embed'
import videoEmbed from './objects/video-embed'
import faqAccordion from './objects/faq-accordion'
import imageGallery from './objects/image-gallery'
import ctaBanner from './objects/cta-banner'
import affiliateLink from './objects/affiliate-link'
import pageAppearance from './objects/page-appearance'

export const schema: SchemaPluginOptions = {
	types: [
		// documents
		site,
		blogSettings,
		checkoutSettings,
		announcementItem,
		themeSettings,
		widgetSettings,
		systemSettings,
		popupSettings,
		headerSettings,
		footerSettings,
		productCardSettings,
		productSettings,
		order,
		customer,
		lead,
		page,
		globalModule,
		blogPost,
		blogComment,
		affiliateProduct,
		product,
		collection,
		redirect,

		// references
		blogCategory,
		logo,
		navigation,
		person,
		quote,
		productCategory,

		// objects
		cta,
		link,
		linkList,
		megamenu,
		metadata,
		moduleAttributes,
		trackingScript,
		productOption,
		productVariant,
		calloutBox,
		productEmbed,
		videoEmbed,
		faqAccordion,
		imageGallery,
		ctaBanner,
		pageAppearance,

		// legacy / deprecated objects (kept for reading existing content)
		affiliateLink,
		breadcrumbs,
		cartCheckout,
		blogIndex,
		blogPostContent,
		searchModule,
		productContent,
		collectionContent,

		// pure dynamic modules (23 modules)
		...[
			accordionList,
			blogPostList,
			productList,
			callout,
			cardList,
			customHtml,
			heroSplit,
			heroSlider,
			mediaGrid,
			logoList,
			personList,
			prose,
			statList,
			stepList,
			quoteList,
			carouselBannerList,
			comparisonTable,
			leadCaptureForm,
			countdownBanner,
			stickyMobileCta,
			socialProof,
			tieredPricing,
			complianceVault,
		].map(withModuleHidden),
	],

	templates: (templates) =>
		templates.filter(({ schemaType }) => !nonCreatableTypes.includes(schemaType)),
}

export const singletonTypes = [
	'site',
	'blog-settings',
	'checkout-settings',
	'theme-settings',
	'widget-settings',
	'system-settings',
	'popup-settings',
	'header-settings',
	'footer-settings',
	'product-settings',
	'product-card-settings',
]

// Exclude singletons, operational/transactional schemas, and deprecated modules from Studio "+" creation
export const nonCreatableTypes = [
	...singletonTypes,
	'order',
	'lead',
	'customer',
	'blog.comment',
	'affiliate.product',
	'affiliateLink',
	'breadcrumbs',
	'cart-checkout',
	'blog-index',
	'blog-post-content',
	'search-module',
	'product-content',
	'collection-content',
	'page-appearance',
]
