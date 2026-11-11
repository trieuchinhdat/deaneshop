import React from 'react'
import ReactDOMServer from 'react-dom/server'
import ChatBox, { type FloatingButton } from '../src/ui/chatbox'

function assert(condition: boolean, message: string) {
	if (!condition) {
		console.error(`❌ FAILED: ${message}`)
		process.exit(1)
	}
	console.log(`✅ PASSED: ${message}`)
}

console.log('===========================================================')
console.log('   RUNNING FLOATING CONTACT HUB COMPREHENSIVE TEST SUITE   ')
console.log('===========================================================')

// Test 1: Full Suite with All Supported Global Contact Channels
console.log('\n--- Test 1: All Supported Global Channels ---')
const allChannels: FloatingButton[] = [
	{
		_key: 'c-phone',
		type: 'phone',
		label: 'Call Sales Team',
		subtitle: 'Toll-free 24/7',
		value: '+1 (800) 555-0199',
		isActive: true,
	},
	{
		_key: 'c-whatsapp',
		type: 'whatsapp',
		label: 'Chat on WhatsApp',
		subtitle: 'Replies under 2 mins',
		value: '+1 (555) 234-5678',
		isActive: true,
		pulse: true,
	},
	{
		_key: 'c-email',
		type: 'email',
		label: 'Email Support',
		subtitle: 'Response within 24h',
		value: 'support@deanflow.com',
		isActive: true,
	},
	{
		_key: 'c-sms',
		type: 'sms',
		label: 'Text Message (SMS)',
		subtitle: 'Standard carrier rates',
		value: '+15559876543',
		isActive: true,
	},
	{
		_key: 'c-messenger',
		type: 'messenger',
		label: 'Facebook Messenger',
		value: 'deanflow.official',
		isActive: true,
	},
	{
		_key: 'c-instagram',
		type: 'instagram',
		label: 'Instagram Direct',
		value: 'deanflow_hq',
		isActive: true,
	},
	{
		_key: 'c-telegram',
		type: 'telegram',
		label: 'Telegram Channel',
		value: '@deanflow_support',
		isActive: true,
	},
	{
		_key: 'c-custom',
		type: 'custom',
		label: 'Knowledge Base',
		subtitle: 'Self-serve documentation',
		value: 'https://docs.deanflow.com',
		isActive: true,
	},
	{
		_key: 'c-zalo',
		type: 'zalo',
		label: 'Zalo Support',
		value: '0912345678',
		isActive: true,
	},
]

const html1 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		floatingButtons={allChannels}
		mainButtonLabel="Customer Support"
		mainButtonIcon="chat"
		onlineBadge={true}
	/>,
)

assert(html1.includes('href="tel:+18005550199"'), 'Phone channel generates tel: link')
assert(
	html1.includes('target="_self"') && html1.includes('href="tel:+18005550199"'),
	'Phone channel opens in same window (_self)',
)
assert(
	html1.includes('href="https://wa.me/15552345678"'),
	'WhatsApp channel formats raw phone number into wa.me link',
)
assert(
	html1.includes('href="mailto:support@deanflow.com"'),
	'Email channel generates mailto: link',
)
assert(
	html1.includes('href="sms:15559876543"') || html1.includes('href="sms:+15559876543"'),
	'SMS channel generates sms: link',
)
assert(
	html1.includes('href="https://m.me/deanflow.official"'),
	'Messenger channel formats username into m.me URL',
)
assert(
	html1.includes('href="https://ig.me/m/deanflow_hq"'),
	'Instagram channel formats handle into ig.me URL',
)
assert(
	html1.includes('href="https://t.me/deanflow_support"'),
	'Telegram channel strips @ and formats into t.me URL',
)
assert(
	html1.includes('href="https://docs.deanflow.com"') &&
		html1.includes('target="_blank"') &&
		html1.includes('rel="noopener noreferrer"'),
	'Custom external link has target="_blank" and rel="noopener noreferrer"',
)
assert(
	html1.includes('href="https://zalo.me/0912345678"'),
	'Zalo channel formats into zalo.me URL (legacy backward compatibility)',
)
assert(html1.includes('Replies under 2 mins'), 'Channel subtitles render properly')
assert(
	html1.includes('Customer Support'),
	'Master button label pill renders on desktop',
)
assert(
	html1.includes('bg-emerald-500') && html1.includes('animate-ping'),
	'Online live status badge renders with pulse indicator',
)

// Test 2: Single Channel Mode
console.log('\n--- Test 2: Single Channel Mode ---')
const singleChannel: FloatingButton[] = [
	{
		_key: 'single-wa',
		type: 'whatsapp',
		label: 'Order via WhatsApp',
		value: 'https://wa.me/447700900077',
		isActive: true,
	},
]
const html2 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		floatingButtons={singleChannel}
	/>,
)
assert(
	html2.includes('href="https://wa.me/447700900077"'),
	'Single WhatsApp channel renders directly',
)

// Test 3: Multiple Channels in Stack Mode (Always Expanded)
console.log('\n--- Test 3: Always Expanded Stack Mode ---')
const html3 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		displayMode="stack"
		floatingButtons={allChannels.slice(0, 3)}
	/>,
)
assert(
	html3.includes('id="contact-hub-stack"'),
	'Stack mode renders contact-hub-stack container',
)
assert(
	!html3.includes('aria-haspopup="menu"'),
	'Stack mode does not render the speed dial master toggle FAB',
)
assert(
	html3.includes('href="tel:+18005550199"') &&
		html3.includes('href="mailto:support@deanflow.com"'),
	'Stack mode displays all active buttons directly',
)

// Test 4: Incomplete / Empty Channel Information Gracefully Handled
console.log('\n--- Test 4: Incomplete / Empty Channel Values ---')
const incompleteChannels: FloatingButton[] = [
	{
		_key: 'empty-val',
		type: 'phone',
		label: 'Broken Phone',
		value: '', // empty value
		isActive: true,
	},
	{
		_key: 'valid-email',
		type: 'email',
		label: 'Valid Email',
		value: 'help@deanflow.com',
		isActive: true,
	},
]
const html4 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		floatingButtons={incompleteChannels}
	/>,
)
assert(
	!html4.includes('Broken Phone'),
	'Channels with empty/missing values are safely filtered out without crashing',
)
assert(
	html4.includes('help@deanflow.com'),
	'Valid channels alongside empty ones render cleanly',
)

// Test 5: All Channels Inactive / Empty Destination Values
console.log('\n--- Test 5: No Valid Channels ---')
const inactiveChannels: FloatingButton[] = [
	{
		_key: 'off-1',
		type: 'phone',
		value: '123456789',
		isActive: false,
	},
	{
		_key: 'off-2',
		type: 'email',
		value: '',
		isActive: true,
	},
]
const html5 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		floatingButtons={inactiveChannels}
	/>,
)
assert(html5 === '', 'Renders nothing (zero DOM nodes) when no channels are valid')

// Test 6: Hub Disabled Storewide
console.log('\n--- Test 6: Hub Disabled Storewide ---')
const html6 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={false}
		triggerMode="immediate"
		floatingButtons={allChannels}
	/>,
)
assert(
	html6 === '',
	'Renders nothing when enabled is explicitly false, regardless of configured channels',
)

// Test 7: Device Visibility: Mobile Only
console.log('\n--- Test 7: Mobile-Only Visibility ---')
const html7 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		deviceVisibility="mobile-only"
		floatingButtons={singleChannel}
	/>,
)
assert(
	html7.includes('md:hidden'),
	'Mobile-only visibility applies md:hidden class to hide on desktop',
)

// Test 8: Device Visibility: Desktop Only
console.log('\n--- Test 8: Desktop-Only Visibility ---')
const html8 = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		deviceVisibility="desktop-only"
		floatingButtons={singleChannel}
	/>,
)
assert(
	html8.includes('max-md:hidden'),
	'Desktop-only visibility applies max-md:hidden class to hide on mobile',
)

// Test 9: Floating Positions (Bottom-Left vs Bottom-Right)
console.log('\n--- Test 9: Floating Positions ---')
const htmlLeft = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		position="bottom-left"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlLeft.includes('left-4 md:left-6 items-start'),
	'Bottom-left positioning applies left anchor classes',
)

const htmlRight = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		position="bottom-right"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlRight.includes('right-4 md:right-6 items-end'),
	'Bottom-right positioning applies right anchor classes',
)

// Test 10: Mobile Spacing Clearance with Sticky CTA
console.log('\n--- Test 10: Mobile Spacing Clearance for Sticky CTA ---')
const htmlAvoidCta = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		bottomOffsetMobile="avoid-sticky-cta"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlAvoidCta.includes('5.25rem') &&
		htmlAvoidCta.includes('env(safe-area-inset-bottom'),
	'Avoid-sticky-cta raises mobile bottom anchor above sticky CTA bar',
)

// Test 11: Custom Percentage & Pixel Bottom Offsets
console.log('\n--- Test 11: Custom Percentage & Pixel Bottom Offsets ---')
const htmlCustomPercent = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		bottomOffsetMobile="custom"
		customBottomOffsetMobile="15%"
		bottomOffsetDesktop="custom"
		customBottomOffsetDesktop="8%"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlCustomPercent.includes('--floating-bottom-mobile:calc(15% + env(safe-area-inset-bottom, 0px))') ||
		htmlCustomPercent.includes('--floating-bottom-mobile:calc(15% + env(safe-area-inset-bottom,0px))'),
	'Custom % offset is correctly wrapped with safe-area protection on mobile',
)
assert(
	htmlCustomPercent.includes('--floating-bottom-desktop:8%'),
	'Custom % offset is applied to desktop variable',
)

const htmlCustomPixels = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		bottomOffsetMobile="custom"
		customBottomOffsetMobile="95px"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlCustomPixels.includes('95px') && htmlCustomPixels.includes('env(safe-area-inset-bottom'),
	'Custom px offset works reliably with safe-area protection',
)

// Test 12: Theme Presets (Primary vs Dark vs Light)
console.log('\n--- Test 12: Theme Presets ---')
const htmlDark = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		themeStyle="dark"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlDark.includes('bg-slate-900 text-white'),
	'Dark theme preset applies high-contrast slate styling',
)

const htmlLight = ReactDOMServer.renderToStaticMarkup(
	<ChatBox
		enabled={true}
		triggerMode="immediate"
		themeStyle="light"
		floatingButtons={singleChannel}
	/>,
)
assert(
	htmlLight.includes('bg-white/95 text-slate-800'),
	'Light theme preset applies frosted white styling',
)

// Test 13: WCAG 2.2 AA Accessibility & ARIA Attributes
console.log('\n--- Test 13: WCAG 2.2 AA Accessibility ---')
assert(
	html1.includes('aria-label="Floating contact hub"') &&
		html1.includes('<aside'),
	'Uses semantic <aside> landmark with accessible label',
)
assert(
	html1.includes('role="menu"') && html1.includes('id="contact-hub-options"'),
	'Speed dial menu has role="menu" and valid id',
)
assert(
	html1.includes('aria-haspopup="menu"'),
	'Master trigger FAB exposes aria-haspopup="menu"',
)
assert(
	html1.includes('role="menuitem"'),
	'Channel options use semantic role="menuitem"',
)
assert(
	html1.includes('motion-reduce:transition-none') &&
		html1.includes('motion-reduce:animate-none'),
	'Respects prefers-reduced-motion via motion-reduce utilities',
)
assert(
	html1.includes('focus-visible:ring-'),
	'Focus visible rings are provided for keyboard navigation',
)

console.log('\n===========================================================')
console.log('   🎉 ALL 12 TESTS PASSED! FLOATING HUB AUDIT COMPLETE!    ')
console.log('===========================================================')
