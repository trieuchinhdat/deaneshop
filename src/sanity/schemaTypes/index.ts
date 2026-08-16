import type { SchemaPluginOptions } from 'sanity'
// documents
import blogCategory from './documents/blog.category'
import blogPost from './documents/blog.post'
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
import review from './documents/review'
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
// modules
import accordionList from './modules/accordion-list'
import affiliateLink from './modules/affiliate-link'
import announcementItem from './modules/announcement-item'
import blogIndex from './modules/blog-index'
import blogPostContent from './modules/blog-post-content'
import blogPostList from './modules/blog-post-list'
import breadcrumbs from './modules/breadcrumbs'
import callout from './modules/callout'
import cardList from './modules/card-list'
import carouselBannerList from './modules/carousel-banner-list'
import cartCheckout from './modules/cart-checkout'
import customHtml from './modules/custom-html'
import heroSplit from './modules/hero.split'
import logoList from './modules/logo-list'
import personList from './modules/person-list'
import collectionContent from './modules/collection-content'
import productContent from './modules/product-content'
import productList from './modules/product-list'
import prose from './modules/prose'
import quoteList from './modules/quote-list'
import searchModule from './modules/search-module'
import statList from './modules/stat-list'
import stepList from './modules/step-list'
import themeBackground from './modules/theme-background'
// objects
import cta from './objects/cta'
import link from './objects/link'
import linkList from './objects/link.list'
import megamenu from './objects/megamenu'
import metadata from './objects/metadata'
import moduleAttributes from './objects/module-attributes'
import productOption from './objects/product.option'
import productVariant from './objects/product.variant'

export const schema: SchemaPluginOptions = {
	types: [
		// documents
		site,
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
		product,
		review,
		collection,
		redirect,

		// references
		blogCategory,
		logo,
		navigation,
		person,
		quote,
		productCategory,
		announcementItem,

		// objects
		cta,
		link,
		linkList,
		megamenu,
		metadata,
		moduleAttributes,
		trackingScript,
		affiliateLink,
		productOption,
		productVariant,

		// modules
		accordionList,
		blogIndex,
		blogPostContent,
		blogPostList,
		collectionContent,
		productList,
		productContent,
		breadcrumbs,
		callout,
		cardList,
		customHtml,
		heroSplit,
		logoList,
		personList,
		prose,
		searchModule,
		statList,
		stepList,
		quoteList,
		carouselBannerList,
		cartCheckout,
		themeBackground,
	],

	templates: (templates) =>
		templates.filter(({ schemaType }) => !singletonTypes.includes(schemaType)),
}

const singletonTypes = [
	'site',
	'theme-settings',
	'widget-settings',
	'system-settings',
	'popup-settings',
	'header-settings',
	'footer-settings',
	'product-settings',
	'product-card-settings',
]
