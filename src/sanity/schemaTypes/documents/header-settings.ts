import { defineField, defineType } from 'sanity'
import { VscLayoutMenubar } from 'react-icons/vsc'

export default defineType({
	name: 'header-settings',
	title: 'Header Settings',
	icon: VscLayoutMenubar,
	type: 'document',
	groups: [
		{ name: 'navigation', title: 'Navigation', default: true },
		{ name: 'desktop', title: 'Desktop' },
		{ name: 'mobile', title: 'Mobile' },
		{ name: 'style_topbar', title: 'Topbar & Style' },
	],
	fieldsets: [
		{
			name: 'headerColor',
			title: 'Header Color Scheme',
			options: { columns: 2 },
		},
	],
	fields: [
		// ================= TAB 1: NAVIGATION =================
		defineField({
			name: 'menu',
			title: 'Desktop Navigation',
			description: 'Primary menu displayed on desktop devices',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'categoryMenu',
			title: 'Category Navigation (Master-Detail Panel)',
			description: 'Dedicated category catalog menu displayed next to the Logo in Layout 2',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'mobileMenu',
			title: 'Mobile Navigation',
			description: 'Optional menu for mobile devices. If unselected, desktop navigation is used as fallback',
			type: 'reference',
			to: [{ type: 'navigation' }],
			group: 'navigation',
		}),
		defineField({
			name: 'ctas',
			title: 'Header CTAs',
			description: 'Action buttons displayed on header (Search, Cart, Account, Hotline, etc.)',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'navigation',
		}),

		// ================= TAB 2: DESKTOP =================
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Header Layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 1: Single Row (Logo - Navigation - CTAs)', value: 'layout01' },
					{ title: 'Layout 2: Two-Tier Superstore (Row 1: Logo - Search - CTAs | Row 2: Navigation)', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'desktop',
		}),
		defineField({
			name: 'showCategoryMenu',
			title: 'Enable Category Dropdown (Layout 2)',
			description: 'Displays the dedicated Master-Detail Category dropdown button next to the Logo',
			type: 'boolean',
			initialValue: true,
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02',
		}),
		defineField({
			name: 'categoryButtonLabel',
			title: 'Category Button Label',
			type: 'string',
			initialValue: 'Danh mục sản phẩm',
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02' || parent?.showCategoryMenu === false,
		}),
		defineField({
			name: 'categoryButtonIcon',
			title: 'Category Button Icon',
			type: 'string',
			options: {
				list: [
					{ title: 'Grid / 4-Squares Icon', value: 'grid' },
					{ title: 'Menu / Hamburger Icon', value: 'menu' },
					{ title: 'Folder / Catalog Icon', value: 'folder' },
				],
			},
			initialValue: 'grid',
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02' || parent?.showCategoryMenu === false,
		}),
		defineField({
			name: 'categoryButtonStyle',
			title: 'Category Button Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Soft Tint (Subtle Primary Tint - Default)', value: 'soft' },
					{ title: 'Solid Primary (High-Emphasis Brand CTA)', value: 'solid' },
					{ title: 'Neutral Outline (Clean Bordered Minimalist)', value: 'outline' },
				],
				layout: 'radio',
			},
			initialValue: 'soft',
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02' || parent?.showCategoryMenu === false,
		}),
		defineField({
			name: 'showDesktopRow2Navigation',
			title: 'Enable Row 2: Navigation Menu (Layout 2)',
			description: 'Turn off if you only want to use the Category dropdown button in Row 1 and hide the secondary menu bar',
			type: 'boolean',
			initialValue: true,
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02',
		}),
		defineField({
			name: 'desktopMenuAlign',
			title: 'Desktop Navigation Alignment',
			type: 'string',
			options: {
				list: [
					{ title: 'Left (Next to Logo)', value: 'left' },
					{ title: 'Center (Default)', value: 'center' },
					{ title: 'Right (Next to CTAs)', value: 'right' },
				],
			},
			initialValue: 'center',
			group: 'desktop',
		}),
		defineField({
			name: 'headerPaddingDesktop',
			title: 'Desktop Header Padding / Height',
			description: 'Controls vertical thickness of the header on desktop screens',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (Slim - py-2.5 ~ 52px)', value: 'compact' },
					{ title: 'Default (Standard - py-4 ~ 64px)', value: 'default' },
					{ title: 'Spacious (Luxury / Breathable - py-6 ~ 80px)', value: 'spacious' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'desktop',
		}),
		defineField({
			name: 'logoHeightDesktop',
			title: 'Desktop Logo Height (px)',
			description: 'Adjust maximum logo height in pixels on desktop (Default: 40px)',
			type: 'number',
			initialValue: 40,
			validation: (Rule) => Rule.min(20).max(80),
			group: 'desktop',
		}),
		defineField({
			name: 'desktopSearchVariant',
			title: 'Desktop Search Variant',
			description: 'Applies only when Desktop Header Layout is set to Layout 2',
			type: 'string',
			options: {
				list: [
					{ title: 'Live Search Input Field', value: 'input' },
					{ title: 'Search Modal Trigger Button', value: 'modal' },
				],
				layout: 'radio',
			},
			initialValue: 'input',
			group: 'desktop',
			hidden: ({ parent }) => parent?.desktopLayout !== 'layout02',
		}),
		defineField({
			name: 'behavior',
			title: 'Scroll Behavior',
			type: 'string',
			options: {
				list: [
					{ title: 'Sticky (Fixed top)', value: 'sticky' },
					{ title: 'Smart Sticky (Hide on scroll down, show on scroll up)', value: 'smart' },
					{ title: 'Static (Scrolls with page)', value: 'static' },
				],
				layout: 'radio',
			},
			initialValue: 'sticky',
			group: 'desktop',
		}),
		defineField({
			name: 'style',
			title: 'Background Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Solid Color', value: 'solid' },
					{ title: 'Glassmorphism (Backdrop Blur)', value: 'blur' },
					{ title: 'Transparent', value: 'transparent' },
				],
				layout: 'radio',
			},
			initialValue: 'solid',
			group: 'desktop',
		}),

		// ================= TAB 3: MOBILE =================
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Header Layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Layout 1 (Classic): [Menu Toggle] - [Logo] - [Cart/CTAs]', value: 'layout01' },
					{ title: 'Layout 2 (Thumb-friendly): [Logo] - [Cart/CTAs] - [Menu Toggle]', value: 'layout02' },
				],
				layout: 'radio',
			},
			initialValue: 'layout01',
			group: 'mobile',
		}),
		defineField({
			name: 'headerPaddingMobile',
			title: 'Mobile Header Padding / Height',
			description: 'Controls vertical thickness of the header on mobile screens (Mobile First)',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (Slim - py-2 ~ 48px)', value: 'compact' },
					{ title: 'Default (Standard - py-2.5 ~ 56px)', value: 'default' },
					{ title: 'Comfortable (Roomy - py-3.5 ~ 64px)', value: 'comfortable' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'mobile',
		}),
		defineField({
			name: 'logoHeightMobile',
			title: 'Mobile Logo Height (px)',
			description: 'Adjust maximum logo height in pixels on mobile screens (Default: 32px)',
			type: 'number',
			initialValue: 32,
			validation: (Rule) => Rule.min(18).max(56),
			group: 'mobile',
		}),
		defineField({
			name: 'mobileLogoAlign',
			title: 'Mobile Logo Position',
			description: 'Applies only when Mobile Header Layout is set to Layout 1',
			type: 'string',
			options: {
				list: [
					{ title: 'Center', value: 'center' },
					{ title: 'Left', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'mobile',
			hidden: ({ parent }) => parent?.mobileLayout !== 'layout01',
		}),
		defineField({
			name: 'mobileSearchDisplay',
			title: 'Mobile Search Display Mode',
			type: 'string',
			options: {
				list: [
					{ title: 'Full-width Search Bar (Row 2)', value: 'bar' },
					{ title: 'Compact Search Icon (Row 1 next to Cart)', value: 'icon' },
				],
				layout: 'radio',
			},
			initialValue: 'bar',
			group: 'mobile',
		}),

		// ================= TAB 4: TOPBAR & STYLE =================
		defineField({
			name: 'headerBackground',
			title: 'Header Background Color (Override)',
			description: 'Leave empty to automatically inherit from Global Theme Preset (Recommended)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color (e.g. #ffffff)'),
			fieldset: 'headerColor',
			group: 'style_topbar',
		}),
		defineField({
			name: 'headerText',
			title: 'Header Text & Icon Color (Override)',
			description: 'Leave empty to automatically inherit from Global Theme Preset (Recommended)',
			type: 'string',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error('Invalid Hex Color (e.g. #000000)'),
			fieldset: 'headerColor',
			group: 'style_topbar',
		}),
		defineField({
			name: 'enableScrolledEffect',
			title: 'Enable Scrolled Elevation & Blur Effect',
			description: 'Automatically enhances depth, shadow and border when scrolling down the page',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
		}),
		defineField({
			name: 'showTopBar',
			title: 'Enable Topbar',
			description: 'Display top announcement banner for marketing campaigns',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
		}),
		defineField({
			name: 'allowDismiss',
			title: 'Allow Dismissing Topbar',
			description: 'Show a close (×) button allowing visitors to dismiss the announcement bar',
			type: 'boolean',
			initialValue: true,
			group: 'style_topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'autoPlayInterval',
			title: 'Slide Autoplay Duration',
			description: 'Duration (in seconds) per announcement when multiple items are added',
			type: 'number',
			options: {
				list: [
					{ title: '3 Seconds', value: 3 },
					{ title: '4 Seconds (Recommended)', value: 4 },
					{ title: '5 Seconds', value: 5 },
					{ title: '6 Seconds', value: 6 },
					{ title: 'Disable Autoplay (Manual Only)', value: 0 },
				],
			},
			initialValue: 4,
			group: 'style_topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
		defineField({
			name: 'announcements',
			title: 'Announcement Banners',
			description: 'Select announcement items to display in Topbar (Drag to reorder)',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'announcement-item' }] }],
			group: 'style_topbar',
			hidden: ({ parent }) => parent?.showTopBar === false,
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Header Settings',
			subtitle: 'Global Header Layout, Navigation & Style Configurations',
		}),
	},
})


