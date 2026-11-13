import { defineField, defineType } from 'sanity'
import { VscPaintcan } from 'react-icons/vsc'

export default defineType({
	name: 'page-appearance',
	title: 'Page Appearance & Atmosphere',
	type: 'object',
	icon: VscPaintcan,
	fieldsets: [
		{
			name: 'colorSchemeSection',
			title: '1. Page Color Scheme & Text Contrast',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'backgroundSettings',
			title: '2. Canvas & Background Layer',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'imageControls',
			title: '3. Image Display & Art Direction',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'scrimOverlay',
			title: '4. Readability Mask & Scrim Overlay',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'funnelNavigation',
			title: '5. Funnel Navigation & Header / Footer Controls',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'scrollAnimationSection',
			title: '6. Scroll Reveal & Entrance Animation',
			options: { collapsible: true, collapsed: false },
		},
	],
	fields: [
		defineField({
			name: 'colorScheme',
			title: 'Color Scheme (Text & Surface Contrast)',
			description:
				'Defines contrast palette for headlines, body copy, and cards. Use "Dark Mode" if selecting a deep or nocturnal background.',
			type: 'string',
			options: {
				list: [
					{ title: 'Light Mode (Default - Dark text on bright canvas)', value: 'light' },
					{ title: 'Dark Mode (Luminous text on nocturnal canvas)', value: 'dark' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'light',
			fieldset: 'colorSchemeSection',
		}),

		defineField({
			name: 'backgroundType',
			title: 'Background Type',
			description:
				'Choose whether this landing page uses default site theme, solid color tint, or custom background imagery.',
			type: 'string',
			options: {
				list: [
					{ title: 'Theme Default (Inherit global site styling)', value: 'default' },
					{ title: 'Solid Color (Custom hex tint)', value: 'color' },
					{ title: 'Background Image (Visual canvas / Brand imagery)', value: 'image' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'default',
			fieldset: 'backgroundSettings',
		}),

		defineField({
			name: 'solidColor',
			title: 'Hex Background Color',
			description: 'Valid hex color code (e.g. #0F172A for deep slate, #FDFBF7 for warm linen).',
			type: 'string',
			placeholder: '#0F172A',
			validation: (Rule) =>
				Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
					name: 'hex',
					invert: false,
				}).error('Please enter a valid Hex color code (e.g. #0F172A)'),
			hidden: ({ parent }) => parent?.backgroundType !== 'color',
			fieldset: 'backgroundSettings',
		}),

		defineField({
			name: 'image',
			title: 'Desktop Background Image',
			description:
				'High-resolution landscape image (16:9 or 21:9 ratio recommended, e.g. 2400×1350 px).',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip', 'palette'],
			},
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'imageControls',
		}),

		defineField({
			name: 'mobileImage',
			title: 'Mobile Background Image (Optional)',
			description:
				'Custom vertical image cropped for smartphones (9:16 ratio). If empty, desktop image is dynamically adapted.',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'imageControls',
		}),

		defineField({
			name: 'displayMode',
			title: 'Scroll & Presentation Mode',
			description:
				'"Hero Bleed" fades to canvas color below the fold for maximum readability. "Fixed Canvas" stays static while page content glides over it.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Hero Bleed (Vibrant top hero, smooth gradient fade-out below) — Recommended',
						value: 'hero-fade',
					},
					{
						title: 'Fixed Canvas (Parallax depth — stays pinned while content scrolls)',
						value: 'fixed',
					},
					{
						title: 'Full Scroll (Entire document canvas scrolls naturally)',
						value: 'scroll',
					},
				],
			},
			initialValue: 'hero-fade',
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'imageControls',
		}),

		defineField({
			name: 'imageFit',
			title: 'Image Sizing & Pattern',
			type: 'string',
			options: {
				list: [
					{ title: 'Cover (Fill full viewport seamlessly)', value: 'cover' },
					{ title: 'Repeat Pattern (Subtle tile / texture / brand motif)', value: 'repeat' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'cover',
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'imageControls',
		}),

		defineField({
			name: 'overlayStyle',
			title: 'Contrast Scrim / Tint Overlay',
			description:
				'Subtle color layer placed between image and text to guarantee WCAG 2.1 AA legibility.',
			type: 'string',
			options: {
				list: [
					{ title: 'Dark Tint (Recommended for white/bright text)', value: 'dark' },
					{ title: 'Light Tint (Recommended for dark text)', value: 'light' },
					{ title: 'None (Pure raw image)', value: 'none' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'dark',
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'scrimOverlay',
		}),

		defineField({
			name: 'overlayOpacity',
			title: 'Overlay Intensity (%)',
			description:
				'Higher values increase text readability; lower values make background image more vivid.',
			type: 'number',
			initialValue: 40,
			validation: (Rule) => Rule.min(0).max(95),
			hidden: ({ parent }) =>
				parent?.backgroundType !== 'image' || parent?.overlayStyle === 'none',
			fieldset: 'scrimOverlay',
		}),

		defineField({
			name: 'blurBackdrop',
			title: 'Ambient Frosted Blur',
			description: 'Applies subtle Gaussian blur to create a modern Apple/Linear depth effect.',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'scrimOverlay',
		}),

		defineField({
			name: 'hideOnMobile',
			title: 'Disable Background Image on Mobile',
			description:
				'Falls back to clean solid color on smartphones for instant sub-second LCP speed.',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.backgroundType !== 'image',
			fieldset: 'scrimOverlay',
		}),

		defineField({
			name: 'headerMode',
			title: 'Header Navigation Display Mode',
			description:
				'"Hidden" removes the entire header to prevent exit leaks during paid ad campaigns. "Transparent" overlays cleanly on top of the hero image/canvas.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Default (Standard Website Header)',
						value: 'default',
					},
					{
						title: 'Transparent (Overlay on Hero Canvas with Backdrop Blur)',
						value: 'transparent',
					},
					{
						title: 'Hidden (Distraction-Free Funnel / No Header)',
						value: 'hidden',
					},
				],
				layout: 'radio',
			},
			initialValue: 'default',
			fieldset: 'funnelNavigation',
		}),

		defineField({
			name: 'hideFooter',
			title: 'Hide Global Footer',
			description:
				'Eliminates multi-column footer navigation and external links to keep visitors focused entirely on the conversion funnel.',
			type: 'boolean',
			initialValue: false,
			fieldset: 'funnelNavigation',
		}),

		defineField({
			name: 'scrollReveal',
			title: 'Scroll Reveal Effect',
			description:
				'Subtly animates content sections as they enter viewport. The initial hero block remains static to protect Core Web Vitals (LCP).',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Static - No animation)', value: 'none' },
					{
						title: 'Fade Up (Smooth upward entrance - Recommended)',
						value: 'fade-up',
					},
					{ title: 'Fade In (Pure opacity transition)', value: 'fade' },
					{
						title: 'Subtle Scale (Soft scale from 96% to 100%)',
						value: 'scale-up',
					},
					{
						title: 'Blur Reveal (Modern focus pull from blur)',
						value: 'blur-reveal',
					},
				],
				layout: 'radio',
			},
			initialValue: 'none',
			fieldset: 'scrollAnimationSection',
		}),

		defineField({
			name: 'scrollRevealSpeed',
			title: 'Animation Duration & Pacing',
			description:
				'Defines how brisk or cinematic the entrance transition feels.',
			type: 'string',
			options: {
				list: [
					{ title: 'Fast (0.45s - Responsive & snappy)', value: 'fast' },
					{ title: 'Standard (0.65s - Smooth & balanced)', value: 'standard' },
					{ title: 'Relaxed (0.9s - Cinematic & relaxed)', value: 'relaxed' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'standard',
			hidden: ({ parent }) =>
				!parent?.scrollReveal || parent?.scrollReveal === 'none',
			fieldset: 'scrollAnimationSection',
		}),

		defineField({
			name: 'scrollRevealOffset',
			title: 'Trigger Threshold from Bottom (% of Screen Height)',
			description:
				'Calculates the trigger point upwards from the bottom of the screen. A 20% offset triggers well inside the visible viewport so visitors clearly notice the reveal.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Prominent (20% up from bottom - Highly visible)',
						value: '20%',
					},
					{
						title: 'Standard (12% up from bottom - Balanced entrance)',
						value: '12%',
					},
					{
						title: 'Subtle (5% up from bottom - Near bottom edge)',
						value: '5%',
					},
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: '20%',
			hidden: ({ parent }) =>
				!parent?.scrollReveal || parent?.scrollReveal === 'none',
			fieldset: 'scrollAnimationSection',
		}),
	],
	preview: {
		select: {
			backgroundType: 'backgroundType',
			solidColor: 'solidColor',
			image: 'image',
			colorScheme: 'colorScheme',
			headerMode: 'headerMode',
			hideFooter: 'hideFooter',
			scrollReveal: 'scrollReveal',
		},
		prepare({
			backgroundType,
			solidColor,
			image,
			colorScheme,
			headerMode,
			hideFooter,
			scrollReveal,
		}) {
			const schemeBadge = colorScheme === 'dark' ? '[Dark Mode]' : '[Light Mode]'
			const motionBadge =
				scrollReveal && scrollReveal !== 'none'
					? `Motion: ${scrollReveal}`
					: null
			const funnelBadges = [
				headerMode === 'hidden'
					? 'No-Header'
					: headerMode === 'transparent'
						? 'Transparent-Header'
						: null,
				hideFooter ? 'No-Footer' : null,
				motionBadge,
			]
				.filter(Boolean)
				.join(' • ')

			return {
				title: `Page Appearance ${schemeBadge}`,
				subtitle: funnelBadges
					? `[${funnelBadges}] • ${
							backgroundType === 'image'
								? 'Image Canvas'
								: backgroundType === 'color'
									? `Color (${solidColor})`
									: 'Default'
						}`
					: backgroundType === 'image'
						? 'Custom Background Image'
						: backgroundType === 'color'
							? `Solid Color (${solidColor || '#...'})`
							: 'Theme Default',
				media: backgroundType === 'image' ? image : VscPaintcan,
			}
		},
	},
})
