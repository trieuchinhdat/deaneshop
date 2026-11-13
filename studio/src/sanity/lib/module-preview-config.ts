/**
 * SANITY STUDIO — CENTRALIZED MODULE PREVIEW CONFIGURATION
 * Single source of truth for all Page Builder module display names.
 */

export const MODULE_FRIENDLY_NAMES = {
	// ================= Pure Dynamic Modules (23 modules) =================
	'accordion-list': 'FAQ Drawer',
	'blog-post-list': 'Content Hub / Insights',
	callout: 'Promo Callout',
	'card-list': 'Feature Cards',
	'carousel-banner-list': 'Banner Carousel',
	'comparison-table': 'Comparison Table',
	'compliance-vault': 'Compliance Vault',
	'countdown-banner': 'Countdown Banner',
	'custom-html': 'Code & App Embed',
	'hero-slider': 'Hero Slider',
	'hero.split': 'Hero Split',
	'lead-capture-form': 'Lead Capture Form',
	'logo-list': 'Logo Marquee',
	'media-grid': 'Media Gallery Grid',
	'person-list': 'Leadership & Experts',
	'product-list': 'Product Showcase',
	prose: 'Editorial Story',
	'quote-list': 'Wall of Love (Testimonials)',
	'social-proof': 'Verified Reviews',
	'stat-list': 'Impact Metrics',
	'step-list': 'Process Steps',
	'sticky-mobile-cta': 'Sticky Buy Bar',
	'tiered-pricing': 'Tiered Volume Pricing',

	// ================= Legacy / Deprecated Modules (7 modules) =================
	'blog-index': 'Blog Index (Deprecated)',
	'blog-post-content': 'Blog Post Content (Deprecated)',
	breadcrumbs: 'Breadcrumbs Navigation',
	'cart-checkout': 'Cart & Checkout',
	'collection-content': 'Collection Content',
	'product-content': 'Product Content',
	'search-module': 'Search Bar Module',

	// ================= Portable Text / Embedded Blocks (6 objects) =================
	'callout-box': 'Callout Box',
	'cta-banner': 'CTA Banner',
	'faq-accordion': 'FAQ Accordion',
	'image-gallery': 'Image Gallery',
	'product-embed': 'Product Embed',
	'video-embed': 'Video Embed',
} as const

export type KnownSchemaModuleName = keyof typeof MODULE_FRIENDLY_NAMES

/**
 * Resolves a schema name to its friendly Title Case merchant display name.
 * Falls back to auto-converting kebab/snake/camelCase to Title Case if not in mapping.
 */
export function getFriendlyModuleName(
	schemaName: string,
	fallback?: string,
): string {
	if (schemaName in MODULE_FRIENDLY_NAMES) {
		return MODULE_FRIENDLY_NAMES[schemaName as KnownSchemaModuleName]
	}
	if (fallback) {
		return fallback
	}
	// Fallback: convert kebab-case, snake_case or dot notation to Title Case
	return schemaName
		.replace(/[-_.]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase())
		.trim()
}
