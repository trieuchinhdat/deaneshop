import { defineField, defineType } from 'sanity'
import { VscLayoutMenubar } from 'react-icons/vsc'

export default defineType({
	name: 'header-settings',
	title: 'Header Settings',
	icon: VscLayoutMenubar,
	type: 'document',

	// Logical, merchant-friendly groups
	groups: [
		{ name: 'content', title: 'Navigation & Content', default: true },
		{ name: 'layout', title: 'Layout & Structure' },
		{ name: 'spacing', title: 'Sizing & Spacing' },
		{ name: 'appearance', title: 'Appearance & Styling' },
		{ name: 'behavior', title: 'Scroll Dynamics' },
		{ name: 'topbar', title: 'Announcement Bar' },
	],

	// Intuitive, clean fieldsets
	fieldsets: [
		{
			name: 'menuStructure',
			title: 'Navigation Menus & Links',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'utilities',
			title: 'Header Actions & Utility Icons',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'desktopLayoutGroup',
			title: 'Desktop Header Layout',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'mobileLayoutGroup',
			title: 'Mobile Header Layout',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'headerSizingGroup',
			title: 'Header Heights & Thickness',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'logoSizingGroup',
			title: 'Logo Dimensions',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'headerColor',
			title: 'Custom Color Scheme',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'scrollBehaviorGroup',
			title: 'Scroll Behavior & Visual Elevation',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'topbarControls',
			title: 'Announcement Display & Timing',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: NAVIGATION & CONTENT ==================== */
		defineField({
			name: 'menu',
			title: 'Main Navigation Menu',
			description: 'Primary navigation tree for both Desktop header and Mobile Drawer (Single Source of Truth).',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'content',
			fieldset: 'menuStructure',
		}),
		defineField({
			name: 'mobileMenu',
			title: 'Dedicated Mobile Navigation Menu (Optional)',
			description: 'Optional: Select a custom navigation structure for mobile devices. If left blank, the Main Navigation Menu is used automatically.',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'content',
			fieldset: 'menuStructure',
		}),
		defineField({
			name: 'mobileDrawerFooterLinks',
			title: 'Mobile Drawer Footer Utility Links',
			description: 'Secondary links displayed at the bottom of the mobile drawer (e.g. Order Tracking, FAQs, Support, Privacy Policy).',
			type: 'array',
			of: [{ type: 'link' }],
			group: 'content',
			fieldset: 'menuStructure',
		}),

		defineField({
			name: 'showSearch',
			title: 'Enable Quick Search',
			description: 'Display search button in header to open instant search modal.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'utilities',
			group: 'content',
		}),
		defineField({
			name: 'showCart',
			title: 'Enable Cart / Quote List',
			description: 'Display cart / wholesale RFQ trigger with real-time items count badge.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'utilities',
			group: 'content',
		}),
		defineField({
			name: 'cartIconType',
			title: 'Cart / Quote Icon Style',
			description: 'Choose the icon visual style that best matches your business model.',
			type: 'string',
			options: {
				list: [
					{ title: 'Quote List (RFQ / Document) [Recommended for B2B Wholesale]', value: 'rfq' },
					{ title: 'Shopping Bag [DTC / Fashion / Lifestyle]', value: 'bag' },
					{ title: 'Shopping Cart [Traditional Commerce / Supermarket]', value: 'cart' },
				],
				layout: 'radio',
			},
			initialValue: 'rfq',
			fieldset: 'utilities',
			group: 'content',
			hidden: ({ parent }) => parent?.showCart === false,
		}),
		defineField({
			name: 'showAccount',
			title: 'Enable Customer Account / Sign In',
			description: 'Display customer profile / login trigger in header and mobile navigation drawer.',
			type: 'boolean',
			initialValue: false,
			fieldset: 'utilities',
			group: 'content',
		}),
		defineField({
			name: 'highlightCta',
			title: 'Header Highlight Action Button (Optional)',
			description: 'Prominent call-to-action button beside utility icons (e.g. "Get a Quote", "Request Catalog", "Contact Us").',
			type: 'cta',
			group: 'content',
			fieldset: 'utilities',
		}),
		defineField({
			name: 'ctas',
			title: 'Legacy Header CTAs (Fallback)',
			description: 'Legacy header CTAs list preserved for backward compatibility.',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
			hidden: true,
		}),

		/* ==================== TAB 2: LAYOUT & STRUCTURE ==================== */
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Header Layout Structure',
			description: 'Choose between a modern single-row layout or a classic two-tier layout.',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 1: Single Row (Logo — Navigation — Utilities) [Modern DTC — Recommended]', value: 'layout01' },
					{ title: 'Layout 2: Two-Tier (Row 1: Logo, Search & Utilities | Row 2: Navigation) [High-SKU Store]', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'layout',
			fieldset: 'desktopLayoutGroup',
		}),
		defineField({
			name: 'desktopMenuAlign',
			title: 'Desktop Navigation Alignment',
			description: 'Horizontal positioning of main navigation links.',
			type: 'string',
			options: {
				list: [
					{ title: 'Left (Beside Logo)', value: 'left' },
					{ title: 'Center (Balanced — Recommended)', value: 'center' },
					{ title: 'Right (Beside Utilities)', value: 'right' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'desktopLayoutGroup',
		}),
		defineField({
			name: 'desktopSearchVariant',
			title: 'Desktop Search Presentation (Layout 2)',
			description: 'How search is presented in the center of Row 1 when using Layout 2.',
			type: 'string',
			options: {
				list: [
					{ title: 'Interactive Search Input Bar [Instant Typing]', value: 'input' },
					{ title: 'Search Button [Opens Quick Search Modal]', value: 'button' },
				],
				layout: 'radio',
			},
			initialValue: 'input',
			group: 'layout',
			fieldset: 'desktopLayoutGroup',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02',
		}),

		defineField({
			name: 'mobileLayout',
			title: 'Mobile Header Layout Structure',
			description: 'Choose layout arrangement for smartphone screens.',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 1: Standard 3-Column (Menu Toggle — Logo — Utilities) [Recommended]', value: 'layout01' },
					{ title: 'Layout 2: Thumb-Friendly (Logo — Utilities — Menu Toggle) [One-Hand Navigation]', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'layout',
			fieldset: 'mobileLayoutGroup',
		}),
		defineField({
			name: 'mobileLogoAlign',
			title: 'Mobile Logo Alignment (Layout 1)',
			description: 'Positioning of the brand logo on mobile devices when using Layout 1.',
			type: 'string',
			options: {
				list: [
					{ title: 'Center (Balanced)', value: 'center' },
					{ title: 'Left (Beside Menu Toggle)', value: 'left' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'mobileLayoutGroup',
			hidden: ({ parent }) => parent?.mobileLayout === 'layout02',
		}),
		defineField({
			name: 'mobileSearchDisplay',
			title: 'Mobile Search Display Mode',
			description: 'Choose how visitors access search on mobile devices.',
			type: 'string',
			options: {
				list: [
					{ title: 'Icon Only (Opens Modal — Clean Single Row) [Recommended]', value: 'icon' },
					{ title: 'Exposed Search Bar (Full-width Input in Row 2)', value: 'bar' },
				],
				layout: 'radio',
			},
			initialValue: 'icon',
			group: 'layout',
			fieldset: 'mobileLayoutGroup',
			hidden: ({ parent }) => parent?.showSearch === false,
		}),

		/* ==================== TAB 3: SIZING & SPACING ==================== */
		defineField({
			name: 'headerPaddingDesktop',
			title: 'Desktop Header Thickness & Padding',
			description: 'Vertical height and breathable whitespace of the desktop header.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (Slim — py-2.5 ~ 56px)', value: 'compact' },
					{ title: 'Standard (Balanced — py-3.5 ~ 64px) [Recommended]', value: 'default' },
					{ title: 'Spacious (Luxury / Airy — py-5 ~ 76px)', value: 'spacious' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'spacing',
			fieldset: 'headerSizingGroup',
		}),
		defineField({
			name: 'headerPaddingMobile',
			title: 'Mobile Header Thickness & Padding',
			description: 'Vertical padding of the header on smartphone screens.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (py-2 ~ 50px)', value: 'compact' },
					{ title: 'Standard (py-2.5 ~ 56px) [Recommended]', value: 'default' },
					{ title: 'Comfortable (py-3.5 ~ 64px)', value: 'comfortable' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'spacing',
			fieldset: 'headerSizingGroup',
		}),
		defineField({
			name: 'logoHeightDesktop',
			title: 'Desktop Logo Height (px)',
			description: 'Maximum logo graphic height on desktop (Default: 40px, range: 20-80px).',
			type: 'number',
			initialValue: 40,
			placeholder: '40',
			validation: (Rule) => Rule.min(20).max(80),
			group: 'spacing',
			fieldset: 'logoSizingGroup',
		}),
		defineField({
			name: 'logoHeightMobile',
			title: 'Mobile Logo Height (px)',
			description: 'Maximum logo graphic height on mobile screens (Default: 32px, range: 18-56px).',
			type: 'number',
			initialValue: 32,
			placeholder: '32',
			validation: (Rule) => Rule.min(18).max(56),
			group: 'spacing',
			fieldset: 'logoSizingGroup',
		}),

		/* ==================== TAB 4: APPEARANCE & STYLING ==================== */
		defineField({
			name: 'headerThemeStyle',
			title: 'Header Color Theme Preset',
			description: '"Default" automatically inherits colors from your Global Theme Settings.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default (Inherit from Theme Settings) [Recommended]', value: 'default' },
					{ title: 'Light Minimal (Pure White Surface)', value: 'light' },
					{ title: 'Dark Slate (Modern Dark Surface)', value: 'dark' },
					{ title: 'Custom Colors (Specify Hex Codes Below)', value: 'custom' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'appearance',
		}),
		defineField({
			name: 'headerBackground',
			title: 'Custom Header Background Hex',
			description: 'E.g. #ffffff or #0f172a (Leave empty to inherit theme background).',
			type: 'string',
			placeholder: '#ffffff',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex color code (e.g. #ffffff)'),
			fieldset: 'headerColor',
			group: 'appearance',
			hidden: ({ parent }) =>
				parent?.headerThemeStyle !== 'custom' && !parent?.headerBackground,
		}),
		defineField({
			name: 'headerText',
			title: 'Custom Header Text & Icons Hex',
			description: 'E.g. #0f172a or #ffffff (Leave empty to inherit theme text color).',
			type: 'string',
			placeholder: '#0f172a',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Must be a valid hex color code (e.g. #0f172a)'),
			fieldset: 'headerColor',
			group: 'appearance',
			hidden: ({ parent }) =>
				parent?.headerThemeStyle !== 'custom' && !parent?.headerText,
		}),
		defineField({
			name: 'style',
			title: 'Scrolled Background Surface Style',
			description: 'Visual treatment applied to the header when page is scrolled.',
			type: 'string',
			options: {
				list: [
					{ title: 'Solid Color Surface [Clean & High-Contrast]', value: 'solid' },
					{ title: 'Glassmorphism (Backdrop Blur) [Modern & Translucent]', value: 'blur' },
				],
				layout: 'radio',
			},
			initialValue: 'solid',
			group: 'appearance',
		}),
		defineField({
			name: 'enableScrolledEffect',
			title: 'Enable Scrolled Depth & Shadow',
			description: 'Automatically applies subtle elevation shadow and divider line when scrolling.',
			type: 'boolean',
			initialValue: true,
			group: 'appearance',
		}),

		/* ==================== TAB 5: SCROLL DYNAMICS ==================== */
		defineField({
			name: 'behavior',
			title: 'Header Scroll Behavior',
			description: 'How the header responds as the visitor scrolls down the page.',
			type: 'string',
			options: {
				list: [
					{ title: 'Sticky (Stays fixed at top of viewport) [Recommended]', value: 'sticky' },
					{ title: 'Smart Sticky (Hides on scroll down, reappears on scroll up)', value: 'smart' },
					{ title: 'Static (Scrolls naturally away with the page)', value: 'static' },
				],
				layout: 'radio',
			},
			initialValue: 'sticky',
			group: 'behavior',
			fieldset: 'scrollBehaviorGroup',
		}),
		defineField({
			name: 'transparentOnHome',
			title: 'Transparent Header on Homepage Hero',
			description: 'Overlays a transparent header directly over the hero image/banner on the homepage, smoothly transitioning to solid/blur on scroll.',
			type: 'boolean',
			initialValue: false,
			group: 'behavior',
			fieldset: 'scrollBehaviorGroup',
		}),

		/* ==================== TAB 6: ANNOUNCEMENT BAR (TOPBAR) ==================== */
		defineField({
			name: 'showTopBar',
			title: 'Enable Announcement Bar',
			description: 'Display top alert banner for promotions, shipping notices, or special updates.',
			type: 'boolean',
			initialValue: true,
			group: 'topbar',
			fieldset: 'topbarControls',
		}),
		defineField({
			name: 'topbarSticky',
			title: 'Keep Announcement Bar Sticky on Scroll',
			description: 'When enabled, the announcement bar stays pinned alongside the header. When disabled, it scrolls away naturally while only the main navigation sticks.',
			type: 'boolean',
			initialValue: false,
			group: 'topbar',
			fieldset: 'topbarControls',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'allowDismiss',
			title: 'Allow Visitors to Dismiss Announcement Bar',
			description: 'Show a close (×) button allowing visitors to dismiss the bar during their browsing session.',
			type: 'boolean',
			initialValue: true,
			group: 'topbar',
			fieldset: 'topbarControls',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'autoPlayInterval',
			title: 'Slide Autoplay Duration',
			description: 'Rotation speed (in seconds) per announcement when multiple items exist.',
			type: 'number',
			options: {
				list: [
					{ title: '3 Seconds [Fast]', value: 3 },
					{ title: '4 Seconds [Balanced — Recommended]', value: 4 },
					{ title: '5 Seconds [Relaxed]', value: 5 },
					{ title: '6 Seconds [Slow]', value: 6 },
					{ title: 'Manual Only (Disable Autoplay)', value: 0 },
				],
			},
			initialValue: 4,
			group: 'topbar',
			fieldset: 'topbarControls',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'announcements',
			title: 'Announcement Items (Carousel)',
			description: 'Select announcement items to rotate in the topbar (Drag items to reorder).',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'announcement-item' }] }],
			group: 'topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Header Settings',
			subtitle: 'Global Header Layout, Navigation, Colors & Topbar',
		}),
	},
})

