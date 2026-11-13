import { defineModulePreview } from '../src/sanity/lib/define-module-preview'
import { MODULE_FRIENDLY_NAMES, getFriendlyModuleName } from '../src/sanity/lib/module-preview-config'

// Import all 23 dynamic modules
import accordionList from '../src/sanity/schemaTypes/modules/accordion-list'
import blogPostList from '../src/sanity/schemaTypes/modules/blog-post-list'
import productList from '../src/sanity/schemaTypes/modules/product-list'
import callout from '../src/sanity/schemaTypes/modules/callout'
import cardList from '../src/sanity/schemaTypes/modules/card-list'
import customHtml from '../src/sanity/schemaTypes/modules/custom-html'
import heroSplit from '../src/sanity/schemaTypes/modules/hero.split'
import heroSlider from '../src/sanity/schemaTypes/modules/hero-slider'
import mediaGrid from '../src/sanity/schemaTypes/modules/media-grid'
import logoList from '../src/sanity/schemaTypes/modules/logo-list'
import personList from '../src/sanity/schemaTypes/modules/person-list'
import prose from '../src/sanity/schemaTypes/modules/prose'
import statList from '../src/sanity/schemaTypes/modules/stat-list'
import stepList from '../src/sanity/schemaTypes/modules/step-list'
import quoteList from '../src/sanity/schemaTypes/modules/quote-list'
import carouselBannerList from '../src/sanity/schemaTypes/modules/carousel-banner-list'
import comparisonTable from '../src/sanity/schemaTypes/modules/comparison-table'
import leadCaptureForm from '../src/sanity/schemaTypes/modules/lead-capture-form'
import countdownBanner from '../src/sanity/schemaTypes/modules/countdown-banner'
import stickyMobileCta from '../src/sanity/schemaTypes/modules/sticky-mobile-cta'
import socialProof from '../src/sanity/schemaTypes/modules/social-proof'
import tieredPricing from '../src/sanity/schemaTypes/modules/tiered-pricing'
import complianceVault from '../src/sanity/schemaTypes/modules/compliance-vault'

// Import 7 legacy modules
import blogIndex from '../src/sanity/schemaTypes/modules/blog-index'
import blogPostContent from '../src/sanity/schemaTypes/modules/blog-post-content'
import breadcrumbs from '../src/sanity/schemaTypes/modules/breadcrumbs'
import cartCheckout from '../src/sanity/schemaTypes/modules/cart-checkout'
import collectionContent from '../src/sanity/schemaTypes/modules/collection-content'
import productContent from '../src/sanity/schemaTypes/modules/product-content'
import searchModule from '../src/sanity/schemaTypes/modules/search-module'

// Import 6 embedded blocks
import calloutBox from '../src/sanity/schemaTypes/objects/callout-box'
import ctaBanner from '../src/sanity/schemaTypes/objects/cta-banner'
import faqAccordion from '../src/sanity/schemaTypes/objects/faq-accordion'
import imageGallery from '../src/sanity/schemaTypes/objects/image-gallery'
import productEmbed from '../src/sanity/schemaTypes/objects/product-embed'
import videoEmbed from '../src/sanity/schemaTypes/objects/video-embed'

import { withModuleHidden } from '../src/sanity/lib/schema-utils'

function assert(condition: boolean, message: string) {
	if (!condition) {
		console.error(`❌ FAILED: ${message}`)
		process.exit(1)
	}
	console.log(`✅ PASSED: ${message}`)
}

console.log('\n--- 1. SCENARIO TESTING (defineModulePreview helper) ---')

// Helper under test
const dummyIcon = () => null
const testHelper = defineModulePreview({
	schemaName: 'comparison-table',
	titleFields: ['headline', 'title', 'badge'],
	imageField: 'image',
	icon: dummyIcon,
	metadata: (doc: any) => [
		doc.cols?.length ? `${doc.cols.length} cols` : null,
		doc.rows?.length ? `${doc.rows.length} rows` : null,
	],
})

// Scenario A: Complete content
const completeRes = testHelper.prepare!({
	_t_0: 'Why DeanFlow Excels',
	_previewImage: { asset: { _ref: 'image-123' } },
	cols: [1, 2, 3],
	rows: [1, 2],
}, {})
assert(
	completeRes.title === '[Comparison Table] - Why DeanFlow Excels',
	`Scenario A Title: ${completeRes.title}`,
)
assert(
	completeRes.subtitle === '3 cols | 2 rows',
	`Scenario A Subtitle without Type: ${completeRes.subtitle}`,
)
assert(
	(completeRes.media as any)?.asset?._ref === 'image-123',
	`Scenario A Media is image asset`,
)

// Scenario B: Heading missing -> Title fallback priority
const fallbackRes = testHelper.prepare!({
	_t_0: null,
	_t_1: 'Fallback Title Text',
	cols: [1],
}, {})
assert(
	fallbackRes.title === '[Comparison Table] - Fallback Title Text',
	`Scenario B Fallback title priority: ${fallbackRes.title}`,
)

// Scenario C: All title fields missing -> 'Untitled'
const missingTitleRes = testHelper.prepare!({}, {})
assert(
	missingTitleRes.title === '[Comparison Table] - Untitled',
	`Scenario C Missing title fallback: ${missingTitleRes.title}`,
)

// Scenario D: Image missing with imageField configured -> '(No content)' & icon fallback
const missingImageRes = testHelper.prepare!({
	_t_0: 'Headline Text',
	_previewImage: null,
}, {})
assert(
	missingImageRes.subtitle === '(No content)',
	`Scenario D Missing image displays (No content): ${missingImageRes.subtitle}`,
)
assert(
	missingImageRes.media === dummyIcon,
	`Scenario D Missing image falls back to icon`,
)

// Scenario E: Empty metadata -> Undefined subtitle (clean, no "Type:")
const noMetaHelper = defineModulePreview({
	schemaName: 'callout',
	titleFields: ['title'],
})
const emptyMetaRes = noMetaHelper.prepare!({ _t_0: 'Special Offer' }, {})
assert(
	emptyMetaRes.subtitle === undefined,
	`Scenario E Empty metadata has no subtitle: ${emptyMetaRes.subtitle}`,
)

// Scenario F: Empty arrays -> No misleading counts and no subtitle
const emptyArrayRes = testHelper.prepare!({
	_t_0: 'Test Table',
	cols: [],
	rows: [],
	_previewImage: { asset: { _ref: 'img' } },
}, {})
assert(
	emptyArrayRes.subtitle === undefined,
	`Scenario F Empty arrays are filtered out: ${emptyArrayRes.subtitle}`,
)

// Scenario G: Incomplete drafts -> Never throws
const draftRes = testHelper.prepare!(undefined as any, {})
assert(
	draftRes.title === '[Comparison Table] - Untitled',
	`Scenario G Incomplete draft handling: ${draftRes.title}`,
)

// Scenario H: Portable Text block title extraction
const blockTitleRes = testHelper.prepare!({
	_t_0: [
		{
			_type: 'block',
			children: [
				{ _type: 'span', text: 'Extracted from ' },
				{ _type: 'span', text: 'Portable Text' },
			],
		},
	],
}, {})
assert(
	blockTitleRes.title === '[Comparison Table] - Extracted from Portable Text',
	`Scenario H Portable Text extraction: ${blockTitleRes.title}`,
)

// Scenario I: Hidden state and withModuleHidden compatibility
const hiddenRes = testHelper.prepare!({
	_t_0: 'Hidden Module',
	_hidden: true,
}, {})
assert(
	hiddenRes.subtitle === '[Hidden] (No content)',
	`Scenario I Helper handles hidden state: ${hiddenRes.subtitle}`,
)

const wrappedSchema = withModuleHidden({
	name: 'comparison-table',
	title: 'Comparison Table',
	type: 'object',
	preview: testHelper,
})
const wrappedRes = wrappedSchema.preview!.prepare!({
	_t_0: 'Hidden Module',
	_hidden: true,
}, {})
assert(
	wrappedRes.subtitle === '[Hidden] (No content)',
	`Scenario I withModuleHidden does not duplicate [Hidden]: ${wrappedRes.subtitle}`,
)

console.log('\n--- 2. SCHEMA AUDIT & ADOPTION VERIFICATION ---')

const dynamicModules = [
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
]

const legacyModules = [
	blogIndex,
	blogPostContent,
	breadcrumbs,
	cartCheckout,
	collectionContent,
	productContent,
	searchModule,
]

const embeddedBlocks = [
	calloutBox,
	ctaBanner,
	faqAccordion,
	imageGallery,
	productEmbed,
	videoEmbed,
]

const allAudited = [...dynamicModules, ...legacyModules, ...embeddedBlocks]

console.log(`Auditing ${allAudited.length} total schemas...`)

allAudited.forEach((schema: any) => {
	const name = schema.name
	assert(Boolean(name), `Schema has name: ${name}`)
	assert(name in MODULE_FRIENDLY_NAMES, `Friendly name mapped for: ${name} -> "${MODULE_FRIENDLY_NAMES[name as keyof typeof MODULE_FRIENDLY_NAMES]}"`)
	assert(Boolean(schema.icon), `Icon preserved for: ${name}`)
	assert(Boolean(schema.preview), `Preview defined for: ${name}`)
	assert(typeof schema.preview?.prepare === 'function', `preview.prepare is function for: ${name}`)

	// Test prepare with dummy data
	const sampleRes = schema.preview.prepare({})
	assert(
		sampleRes.title?.startsWith(`[${MODULE_FRIENDLY_NAMES[name as keyof typeof MODULE_FRIENDLY_NAMES]}]`),
		`${name} title starts with friendly name: ${sampleRes.title}`,
	)
	assert(
		sampleRes.subtitle === undefined || !sampleRes.subtitle.includes('Type:'),
		`${name} subtitle does NOT contain Type: ${sampleRes.subtitle ?? 'undefined'}`,
	)
})

console.log(`\n🎉 ALL TESTS PASSED! (${allAudited.length}/${allAudited.length} schemas verified)`)
