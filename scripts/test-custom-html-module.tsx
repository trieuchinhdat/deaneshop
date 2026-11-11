import React from 'react'
import ReactDOMServer from 'react-dom/server'
import type { CustomHtml } from '../src/sanity/types'
import CustomHTMLModule from '../src/ui/modules/custom-html'
import customHtmlSchema from '../src/sanity/schemaTypes/modules/custom-html'

function assert(condition: boolean, message: string) {
	if (!condition) {
		console.error(`❌ FAILED: ${message}`)
		process.exit(1)
	}
	console.log(`✅ PASSED: ${message}`)
}

console.log('--- RUNNING CODE & APP EMBED (CUSTOM-HTML) COMPREHENSIVE TESTS ---\n')

// =========================================================================
// TEST 1: Legacy Document Backwards-Compatibility
// Existing documents in Sanity only had html.code, css.code, and className.
// =========================================================================
console.log('Test 1: Backwards Compatibility with Legacy Content')
const legacyDoc: CustomHtml = {
	_type: 'custom-html',
	html: {
		_type: 'code',
		code: '<div id="legacy-widget"><p>Legacy Widget Content</p></div>',
		language: 'html',
	},
	css: {
		_type: 'code',
		code: '#legacy-widget { color: blue; }',
		language: 'css',
	},
	className: 'custom-legacy-class',
}

const legacyOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...legacyDoc} />,
)

assert(
	legacyOutput.includes('Legacy Widget Content'),
	'Legacy HTML code rendered correctly',
)
assert(
	legacyOutput.includes('#legacy-widget { color: blue; }'),
	'Legacy CSS styling rendered correctly in style tag',
)
assert(
	legacyOutput.includes('custom-legacy-class'),
	'Legacy className applied to container',
)
assert(
	legacyOutput.includes('<section'),
	'Renders semantic <section> element',
)
assert(
	!legacyOutput.includes('href="custom-html-'),
	'Eliminated bloated URI-encoded href in style element',
)

// =========================================================================
// TEST 2: Modern Section Header (Eyebrow Badge, Headline, Subtitle)
// =========================================================================
console.log('\nTest 2: Section Header & Context (US/UK Commercial Standard)')
const headerDoc = {
	_type: 'custom-html' as const,
	_key: 'block-header-123',
	badge: 'GLOBAL SHOWROOM',
	headline: 'Visit Our London Design Center',
	subtitle: 'Explore our full material collection and test sample finishes in person.',
	headerAlign: 'center' as const,
	html: {
		code: '<iframe src="https://maps.google.com/embed" title="London Office Map"></iframe>',
	},
}

const headerOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...headerDoc} />,
)

assert(
	headerOutput.includes('GLOBAL SHOWROOM'),
	'Eyebrow badge tag rendered',
)
assert(
	headerOutput.includes('Visit Our London Design Center'),
	'Headline rendered in <h2>',
)
assert(
	headerOutput.includes('<h2 id="heading-block-header-123"'),
	'Headline possesses accessible id attribute',
)
assert(
	headerOutput.includes('aria-labelledby="heading-block-header-123"'),
	'Section linked to heading via aria-labelledby',
)
assert(
	headerOutput.includes('Explore our full material collection'),
	'Subtitle description rendered',
)
assert(
	headerOutput.includes('mx-auto text-center'),
	'Centered alignment class applied to header',
)

// =========================================================================
// TEST 3: Left-Aligned Header
// =========================================================================
console.log('\nTest 3: Left-Aligned Header Layout')
const leftHeaderDoc = {
	_type: 'custom-html' as const,
	headline: 'Schedule a Consultation',
	headerAlign: 'left' as const,
	html: { code: '<div>Calendly placeholder</div>' },
}

const leftHeaderOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...leftHeaderDoc} />,
)

assert(
	leftHeaderOutput.includes('text-left mr-auto'),
	'Left alignment classes applied when headerAlign is left',
)

// =========================================================================
// TEST 4: Container Width Variations
// =========================================================================
console.log('\nTest 4: Responsive Container Widths')
const widths: Array<'narrow' | 'standard' | 'wide' | 'full'> = [
	'narrow',
	'standard',
	'wide',
	'full',
]
const expectedWidthClasses = {
	narrow: 'max-w-3xl',
	standard: 'max-w-5xl',
	wide: 'max-w-7xl',
	full: 'w-full max-w-none px-0',
}

for (const w of widths) {
	const doc = {
		_type: 'custom-html' as const,
		containerWidth: w,
		html: { code: `<div>Width test for ${w}</div>` },
	}
	const out = ReactDOMServer.renderToStaticMarkup(<CustomHTMLModule {...doc} />)
	assert(
		out.includes(expectedWidthClasses[w]),
		`Container width '${w}' applies class '${expectedWidthClasses[w]}'`,
	)
}

// =========================================================================
// TEST 5: Spacing Options (Padding)
// =========================================================================
console.log('\nTest 5: Vertical Spacing Options')
const spacings: Array<'none' | 'compact' | 'standard' | 'spacious'> = [
	'none',
	'compact',
	'standard',
	'spacious',
]
const expectedSpacingClasses = {
	none: 'py-0',
	compact: 'py-6 sm:py-8',
	standard: 'py-10 sm:py-16',
	spacious: 'py-16 sm:py-24',
}

for (const s of spacings) {
	const doc = {
		_type: 'custom-html' as const,
		spacing: s,
		html: { code: `<div>Spacing test for ${s}</div>` },
	}
	const out = ReactDOMServer.renderToStaticMarkup(<CustomHTMLModule {...doc} />)
	assert(
		out.includes(expectedSpacingClasses[s]),
		`Spacing '${s}' applies class '${expectedSpacingClasses[s]}'`,
	)
}

// =========================================================================
// TEST 6: Frame Presentation Styles & Rounded Corners
// =========================================================================
console.log('\nTest 6: Frame Presentation & Border Radius')
const cardDoc = {
	_type: 'custom-html' as const,
	containerStyle: 'card' as const,
	borderRadius: 'lg' as const,
	html: { code: '<div>Card framed content</div>' },
}

const cardOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...cardDoc} />,
)

assert(
	cardOutput.includes('bg-card text-card-foreground border border-border/70'),
	'Card container style applies elevated border and background',
)
assert(
	cardOutput.includes('rounded-2xl'),
	'Border radius lg applies rounded-2xl class',
)

// =========================================================================
// TEST 7: Responsive iFrame Auto-Fitting & Aspect Ratio
// =========================================================================
console.log('\nTest 7: Responsive iFrame Auto-Fitting & Aspect Ratio Lock')
const iframeDoc = {
	_type: 'custom-html' as const,
	aspectRatio: '16/9' as const,
	responsiveIframe: true,
	html: {
		code: '<iframe src="https://www.youtube.com/embed/xyz" width="800" height="450"></iframe>',
	},
}

const iframeOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...iframeDoc} />,
)

assert(
	iframeOutput.includes('_iframe') && iframeOutput.includes('max-w-full'),
	'Mobile-safe iframe containment applied to prevent horizontal blowout',
)
assert(
	iframeOutput.includes('_iframe') && iframeOutput.includes('aspect-video'),
	'16:9 aspect ratio class applied to iframe',
)

// =========================================================================
// TEST 8: Script Embeds & SSR Content Preservation
// =========================================================================
console.log('\nTest 8: Script Embeds & SSR Markup')
const scriptDoc = {
	_type: 'custom-html' as const,
	html: {
		code: '<div id="tally-form"><span>Form Ready</span></div><script src="https://tally.so/widgets/embed.js"></script>',
	},
}

const scriptOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...scriptDoc} />,
)

assert(
	scriptOutput.includes('Form Ready'),
	'SSR immediately renders non-script HTML so there is zero CLS and immediate content for crawlers',
)
assert(
	!scriptOutput.includes('src="https://tally.so/widgets/embed.js"'),
	'Inert script tag not rendered in SSR markup (handled cleanly client-side by WithScript)',
)

// =========================================================================
// TEST 9: Embed Caption / Footnote
// =========================================================================
console.log('\nTest 9: Embed Caption & Disclaimers')
const captionDoc = {
	_type: 'custom-html' as const,
	caption: 'Note: Booking calendar requires JavaScript enabled.',
	html: { code: '<div>Widget</div>' },
}

const captionOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...captionDoc} />,
)

assert(
	captionOutput.includes('Note: Booking calendar requires JavaScript enabled.'),
	'Caption footnote rendered with accessible styling',
)

// =========================================================================
// TEST 10: Empty State in Studio Visual Editing vs Public Visitors
// =========================================================================
console.log('\nTest 10: Empty State Guidance in Sanity Studio')
// Public visitor (no data-sanity, no code) -> returns null (clean output)
const publicEmptyDoc = {
	_type: 'custom-html' as const,
}
const publicEmptyOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...publicEmptyDoc} />,
)
assert(
	publicEmptyOutput === '',
	'Empty module renders nothing to public visitors',
)

// Studio visual editing (data-sanity attribute present) -> returns helpful guidance card
const studioEmptyDoc = {
	_type: 'custom-html' as const,
	_key: 'studio-module-1',
	'data-sanity': 'page.modules[0]',
}
const studioEmptyOutput = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...studioEmptyDoc} />,
)
assert(
	studioEmptyOutput.includes('No embed snippet or code configured yet'),
	'Studio empty state displays guidance card for non-technical merchants',
)
assert(
	studioEmptyOutput.includes('border-dashed'),
	'Studio empty state uses visible dashed container placeholder',
)

// =========================================================================
// TEST 11: Schema Configuration & defineModulePreview Verification
// =========================================================================
console.log('\nTest 11: Sanity Schema & Studio Preview Verification')
assert(
	customHtmlSchema.name === 'custom-html',
	'Schema name is custom-html',
)
assert(
	customHtmlSchema.title === 'Code & App Embed',
	'Schema title is Code & App Embed',
)
assert(
	Boolean(customHtmlSchema.icon),
	'Schema has icon defined',
)

// Verify schema groups
const groupNames = customHtmlSchema.groups?.map((g: any) => g.name) || []
assert(
	groupNames.includes('content') &&
	groupNames.includes('layout') &&
	groupNames.includes('design') &&
	groupNames.includes('advanced') &&
	groupNames.includes('settings'),
	'Schema contains content, layout, design, advanced, and settings groups',
)

// Verify preview prepare function with headline
const previewWithHeadline = customHtmlSchema.preview!.prepare!({
	_t_0: 'Interactive Showroom Map',
	html: '<iframe src="..."></iframe>',
	containerWidth: 'wide',
})
assert(
	previewWithHeadline.title === '[Code & App Embed] - Interactive Showroom Map',
	`Preview title with headline: ${previewWithHeadline.title}`,
)
assert(
	Boolean(previewWithHeadline.subtitle?.includes('iFrame Embed')),
	`Preview subtitle identifies iframe embed: ${previewWithHeadline.subtitle}`,
)
assert(
	Boolean(previewWithHeadline.subtitle?.includes('Width: wide')),
	`Preview subtitle includes container width: ${previewWithHeadline.subtitle}`,
)

// Verify preview prepare function with sandboxed flag
const previewSandboxed = customHtmlSchema.preview!.prepare!({
	_t_0: 'Untrusted Partner Widget',
	sandboxMode: true,
	html: '<script src="partner.js"></script>',
})
assert(
	Boolean(previewSandboxed.subtitle?.includes('🛡️ Sandboxed')),
	`Preview subtitle displays Sandboxed badge: ${previewSandboxed.subtitle}`,
)

// Verify preview prepare function without headline (fallback)
const previewFallback = customHtmlSchema.preview!.prepare!({
	html: '<script src="widget.js"></script>',
})
assert(
	previewFallback.title === '[Code & App Embed] - Untitled',
	`Preview fallback title: ${previewFallback.title}`,
)
assert(
	Boolean(previewFallback.subtitle?.includes('JS Widget')),
	`Preview subtitle identifies JS widget: ${previewFallback.subtitle}`,
)

// =========================================================================
// TEST 12: Enterprise Security & Isolated Sandbox Execution
// =========================================================================
console.log('\nTest 12: Enterprise Security & Isolated Sandbox Execution')

// Scenario A: Standard Sandbox Policy (Scripts, Forms & Popups allowed, NO same-origin)
const standardSandboxDoc = {
	_type: 'custom-html' as const,
	headline: 'Third-Party Calculator',
	sandboxMode: true,
	sandboxPolicy: 'standard' as const,
	sandboxHeight: 'medium' as const,
	html: { code: '<div id="widget">Calculator App</div>' },
	css: { code: '#widget { color: green; }' },
}

const standardSandboxOut = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...standardSandboxDoc} />,
)

assert(
	standardSandboxOut.includes('sandbox="allow-scripts allow-forms allow-popups allow-modals"'),
	'Standard sandbox applies safe permissions without allow-same-origin',
)
assert(
	!standardSandboxOut.includes('allow-same-origin'),
	'Standard sandbox prohibits same-origin access, protecting cookies and tokens',
)
assert(
	standardSandboxOut.includes('h-[500px]'),
	'Medium height preset applies h-[500px] to sandbox iframe',
)
assert(
	standardSandboxOut.includes('&lt;!DOCTYPE html&gt;') || standardSandboxOut.includes('srcdoc='),
	'Sandbox iframe utilizes srcdoc for complete isolation',
)
assert(
	!standardSandboxOut.includes('<style data-module="custom-html">'),
	'Custom CSS is encapsulated inside the iframe srcdoc and not injected globally',
)

// Scenario B: Strict Sandbox Policy (Scripts only)
const strictSandboxDoc = {
	_type: 'custom-html' as const,
	sandboxMode: true,
	sandboxPolicy: 'strict' as const,
	sandboxHeight: 'large' as const,
	html: { code: '<div>Strict Widget</div>' },
}

const strictSandboxOut = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...strictSandboxDoc} />,
)

assert(
	strictSandboxOut.includes('sandbox="allow-scripts"'),
	'Strict sandbox permits only scripts without forms or popups',
)
assert(
	strictSandboxOut.includes('h-[700px]'),
	'Large height preset applies h-[700px]',
)

// Scenario C: Permissive Sandbox Policy (Includes Same-Origin)
const permissiveSandboxDoc = {
	_type: 'custom-html' as const,
	sandboxMode: true,
	sandboxPolicy: 'permissive' as const,
	sandboxHeight: 'small' as const,
	html: { code: '<div>Permissive Widget</div>' },
}

const permissiveSandboxOut = ReactDOMServer.renderToStaticMarkup(
	<CustomHTMLModule {...permissiveSandboxDoc} />,
)

assert(
	permissiveSandboxOut.includes('allow-same-origin'),
	'Permissive policy includes allow-same-origin when explicitly requested',
)
assert(
	permissiveSandboxOut.includes('h-[350px]'),
	'Small height preset applies h-[350px]',
)

console.log('\n🎉 ALL 12 TESTS PASSED SUCCESSFULLY! Code & App Embed is fully hardened and verified.')
