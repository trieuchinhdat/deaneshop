import React from 'react'
import ReactDOMServer from 'react-dom/server'
import type { Callout } from '../src/sanity/types'
import CalloutModule from '../src/ui/modules/callout'

function assert(condition: boolean, message: string) {
	if (!condition) {
		console.error(`❌ FAILED: ${message}`)
		process.exit(1)
	}
	console.log(`✅ PASSED: ${message}`)
}

console.log('--- RUNNING CALLOUT MODULE COMPREHENSIVE TESTS ---')

// 1. Legacy / Backwards-Compatibility Scenario:
// Existing documents that only had intro & ctas
const legacyDoc: Callout = {
	_type: 'callout',
	intro: [
		{
			_key: 'b1',
			_type: 'block',
			children: [
				{
					_key: 's1',
					_type: 'span',
					text: 'Legacy Callout Headline',
					marks: ['strong'],
				},
			],
			style: 'h3',
		},
		{
			_key: 'b2',
			_type: 'block',
			children: [
				{
					_key: 's2',
					_type: 'span',
					text: 'Legacy Callout description text.',
					marks: [],
				},
			],
			style: 'normal',
		},
	],
	ctas: [
		{
			_key: 'c1',
			_type: 'cta',
			link: {
				_type: 'link',
				label: 'Explore Catalog',
				type: 'internal',
			},
		},
	],
}

const legacyHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...legacyDoc} />,
)
assert(
	legacyHtml.includes('Legacy Callout Headline'),
	'Legacy doc renders headline',
)
assert(
	legacyHtml.includes('Legacy Callout description text.'),
	'Legacy doc renders body',
)
assert(
	legacyHtml.includes('border-l-4'),
	'Legacy doc defaults to accent-left border',
)
assert(
	legacyHtml.includes('role="region"'),
	'Legacy doc includes accessible role="region"',
)
assert(
	!legacyHtml.includes('<header'),
	'Semantic fix: <header> is not improperly wrapping callout',
)

// 2. Tag Rendering Scenarios: Clickable Link Tag vs Non-Clickable Badge Tag
const tagDoc: Callout = {
	_type: 'callout',
	intro: [
		{
			_key: 't1',
			_type: 'tag',
			label: 'Clickable Internal Tag',
			href: '/collections/special',
			icon: 'tag',
		},
		{
			_key: 't2',
			_type: 'tag',
			label: 'Clickable External Tag',
			href: 'https://example.com/guide',
			icon: 'sparkle',
		},
		{
			_key: 't3',
			_type: 'tag',
			label: 'Pill Badge No Link',
			icon: 'check',
		},
	],
}

const tagHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...tagDoc} />,
)
assert(
	tagHtml.includes('href="/collections/special"'),
	'Internal tag renders Link with href',
)
assert(
	tagHtml.includes('href="https://example.com/guide"'),
	'External tag renders with external URL',
)
assert(
	tagHtml.includes('rel="noopener noreferrer"'),
	'External tag includes rel="noopener noreferrer"',
)
assert(tagHtml.includes('target="_blank"'), 'External tag opens in new tab')
assert(
	tagHtml.includes('<span>Pill Badge No Link</span>'),
	'Non-link tag renders as badge span',
)

// 3. Layout Scenarios: Centered, Split, Compact
const splitDoc: Callout = {
	_type: 'callout',
	badge: 'EXCLUSIVE PARTNER PERK',
	layout: 'split',
	themeStyle: 'urgent',
	iconStyle: 'announcement',
	borderStyle: 'accent-top',
	ctaSubtext: 'Guaranteed 2-day delivery across US & UK',
	intro: [
		{
			_key: 'sb1',
			_type: 'block',
			children: [
				{
					_key: 'ss1',
					_type: 'span',
					text: 'Split Layout Headline',
					marks: [],
				},
			],
			style: 'h2',
		},
	],
	ctas: [
		{
			_key: 'sc1',
			_type: 'cta',
			link: { _type: 'link', label: 'Claim Offer', type: 'internal' },
		},
	],
}

const splitHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...splitDoc} />,
)
assert(
	splitHtml.includes('EXCLUSIVE PARTNER PERK'),
	'Split layout renders badge',
)
assert(
	splitHtml.includes('lg:flex-row'),
	'Split layout applies responsive flex row',
)
assert(splitHtml.includes('border-t-4'), 'Accent top border is applied')
assert(
	splitHtml.includes('Guaranteed 2-day delivery across US &amp; UK'),
	'Reassurance subtext is rendered',
)

const compactDoc: Callout = {
	_type: 'callout',
	layout: 'compact',
	themeStyle: 'success',
	iconStyle: 'shield',
	badge: 'ECO CERTIFIED',
	intro: [
		{
			_key: 'cb1',
			_type: 'block',
			children: [
				{
					_key: 'cs1',
					_type: 'span',
					text: '100% Biodegradable packaging certified by ASTM D6400',
					marks: [],
				},
			],
			style: 'normal',
		},
	],
}

const compactHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...compactDoc} />,
)
assert(compactHtml.includes('ECO CERTIFIED'), 'Compact banner renders badge')
assert(
	compactHtml.includes('100% Biodegradable packaging certified by ASTM D6400'),
	'Compact banner renders notice',
)

// 4. Empty edge case: Empty callout object renders safely without crashing
const emptyHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule _type="callout" />,
)
assert(emptyHtml.includes('section'), 'Empty callout renders section safely')

// 5. Icon hiding test: iconStyle="none"
const noIconDoc: Callout = {
	_type: 'callout',
	iconStyle: 'none',
	intro: [
		{
			_key: 'nb1',
			_type: 'block',
			children: [
				{ _key: 'ns1', _type: 'span', text: 'No icon callout', marks: [] },
			],
			style: 'normal',
		},
	],
}
const noIconHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...noIconDoc} />,
)
assert(
	!noIconHtml.includes('size-12'),
	'No header icon container is rendered when iconStyle="none"',
)

// 6. Custom Accent Hex Override Test
const customColorDoc: Callout = {
	_type: 'callout',
	themeStyle: 'custom',
	customAccentColor: '#8B5CF6',
	customBackgroundColor: '#0F172A',
	customTextColor: '#F8FAFC',
	borderStyle: 'accent-left',
	intro: [
		{
			_key: 'custom-b1',
			_type: 'block',
			children: [
				{
					_key: 'custom-s1',
					_type: 'span',
					text: 'Custom Color Callout',
					marks: [],
				},
			],
			style: 'h3',
		},
	],
}
const customColorHtml = ReactDOMServer.renderToStaticMarkup(
	<CalloutModule {...customColorDoc} />,
)
assert(
	customColorHtml.includes('background-color:#0F172A') ||
		customColorHtml.includes('background-color:#0f172a'),
	'Custom background hex color is applied via inline style',
)
assert(
	customColorHtml.includes('border-left-color:#8B5CF6') ||
		customColorHtml.includes('border-left-color:#8b5cf6'),
	'Custom accent left border hex color is applied',
)
assert(
	customColorHtml.includes('color:#F8FAFC') ||
		customColorHtml.includes('color:#f8fafc'),
	'Custom text hex color is applied',
)

console.log('🎉 ALL CALLOUT MODULE UNIT TESTS PASSED!')
