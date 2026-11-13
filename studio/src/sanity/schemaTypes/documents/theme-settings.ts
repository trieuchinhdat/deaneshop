import { defineField, defineType } from 'sanity'
import ThemePresetInput from '@/sanity/ui/theme-preset-input'

export default defineType({
	name: 'theme-settings',
	title: 'Theme & Design System Tokens',
	type: 'document',
	fields: [
		defineField({
			name: 'theme',
			title: 'Global Theme Settings (Design System Tokens)',
			type: 'object',
			components: {
				input: ThemePresetInput,
			},
			options: { collapsible: false },
			fieldsets: [
				{
					name: 'brandColors',
					title: '1. Brand & Action Colors',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'surfaceColors',
					title: '2. Surface & Content Colors',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'statusColors',
					title: '3. Status & Note Colors',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'geometryTokens',
					title: '4. Geometry & Elevation Tokens',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'layoutTokens',
					title: '5. Layout & Spacing Tokens (Container & Sections)',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'typography',
					title: '6. Typography & Font Families',
					options: { collapsible: true, collapsed: false },
				},
				{
					name: 'animationTokens',
					title: '7. Animation & Interactive Tokens',
					options: { collapsible: true, collapsed: false },
				},
			],
			fields: [
				defineField({
					name: 'preset',
					title: 'Selected Preset',
					type: 'string',
					hidden: true,
					initialValue: 'eco',
				}),

				// --- 1. BRAND & ACTION COLORS ---
				defineField({
					name: 'primaryColor',
					title: 'Primary Color (Brand Accent)',
					description: 'Main brand accent used for primary buttons, highlights, and active states.',
					type: 'string',
					initialValue: '#1b4332',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onPrimaryColor',
					title: 'On-Primary Text Color (Override)',
					description: 'Optional override. Leave empty for automated WCAG 2.1 AA accessible contrast calculation.',
					type: 'string',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'secondaryColor',
					title: 'Secondary Color (Badges & Highlights)',
					description: 'Secondary accent for tags, badges, and secondary actions.',
					type: 'string',
					initialValue: '#2d6a4f',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onSecondaryColor',
					title: 'On-Secondary Text Color (Override)',
					description: 'Optional override. Leave empty for automated WCAG 2.1 AA accessible contrast calculation.',
					type: 'string',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'ctaColor',
					title: 'CTA / Accent Color (Buy Now & Checkout)',
					description: 'High-conversion focal color for primary conversion buttons.',
					type: 'string',
					initialValue: '#c2410c',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onCtaColor',
					title: 'On-CTA Text Color (Override)',
					description: 'Optional override. Leave empty for automated WCAG 2.1 AA accessible contrast calculation.',
					type: 'string',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),

				// --- 2. SURFACE & CONTENT COLORS ---
				defineField({
					name: 'backgroundColor',
					title: 'Background Color (Page Body)',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'surfaceColors',
				}),
				defineField({
					name: 'surfaceColor',
					title: 'Surface / Card Background',
					type: 'string',
					initialValue: '#f9fafb',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'surfaceColors',
				}),
				defineField({
					name: 'textColor',
					title: 'Main Text Color (Headings & Body)',
					type: 'string',
					initialValue: '#111827',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'surfaceColors',
				}),
				defineField({
					name: 'textMutedColor',
					title: 'Muted Text Color (Subtitles & Meta)',
					type: 'string',
					initialValue: '#6b7280',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'surfaceColors',
				}),

				// --- 3. STATUS & NOTES COLORS ---
				defineField({
					name: 'noteBackground',
					title: 'Note / Alert Background',
					type: 'string',
					initialValue: '#f3f4f6',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'statusColors',
				}),
				defineField({
					name: 'noteTextColor',
					title: 'Note Text Color',
					type: 'string',
					initialValue: '#374151',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'statusColors',
				}),
				defineField({
					name: 'successColor',
					title: 'Success Color (In Stock / Confirmed)',
					type: 'string',
					initialValue: '#10b981',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'statusColors',
				}),
				defineField({
					name: 'warningColor',
					title: 'Warning Color (Low Stock / Caution)',
					type: 'string',
					initialValue: '#f59e0b',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'statusColors',
				}),
				defineField({
					name: 'destructiveColor',
					title: 'Destructive / Error Color (Out of Stock / Sale %)',
					type: 'string',
					initialValue: '#ef4444',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'statusColors',
				}),

				// --- 4. GEOMETRY & ELEVATION TOKENS ---
				defineField({
					name: 'borderColor',
					title: 'Border Color',
					type: 'string',
					initialValue: '#e5e7eb',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'geometryTokens',
				}),
				defineField({
					name: 'ringColor',
					title: 'Focus Ring Color (Keyboard Accessibility)',
					type: 'string',
					initialValue: '#059669',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'geometryTokens',
				}),
				defineField({
					name: 'borderRadius',
					title: 'Corner Radius Scale (Theme & Buttons)',
					description: 'Select shape aesthetic for buttons, cards, and interactive elements.',
					type: 'string',
					options: {
						list: [
							{ title: 'Sharp / None (0px - Luxury Atelier / Brutalist)', value: 'sharp' },
							{ title: 'Subtle (6px-8px - Contemporary DTC / Recommended)', value: 'subtle' },
							{ title: 'Rounded (12px - Soft Organic / Eco Living)', value: 'rounded' },
							{ title: 'Pill (9999px - Casual / Full Capsule)', value: 'pill' },
						],
					},
					initialValue: 'subtle',
					fieldset: 'geometryTokens',
				}),
				defineField({
					name: 'shadowStyle',
					title: 'Elevation & Shadow Style',
					type: 'string',
					options: {
						list: [
							{ title: 'Flat (None)', value: 'none' },
							{ title: 'Subtle (Recommended)', value: 'subtle' },
							{ title: 'Elevated (Modern Card)', value: 'elevated' },
							{
								title: 'Glassmorphism (Backdrop Blur)',
								value: 'glassmorphism',
							},
						],
					},
					initialValue: 'subtle',
					fieldset: 'geometryTokens',
				}),

				// --- 5. LAYOUT & SPACING TOKENS (CONTAINER & SECTIONS) ---
				defineField({
					name: 'pageMaxWidth',
					title: 'Maximum Page Width (Container Max-Width)',
					description: 'Controls the maximum width of content containers across the entire site.',
					type: 'string',
					options: {
						list: [
							{ title: '1200px (Compact / Balanced)', value: '1200px' },
							{ title: '1280px (Standard / Default 7XL)', value: '1280px' },
							{ title: '1400px (Modern Wide)', value: '1400px' },
							{ title: '1440px (MacBook Pro / High-End E-Commerce)', value: '1440px' },
							{ title: '1536px (2XL Ultra-Wide)', value: '1536px' },
							{ title: '1600px (Full HD Expanded)', value: '1600px' },
							{ title: 'Custom Max Width (Enter below)', value: 'custom' },
						],
					},
					initialValue: '1280px',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'customPageMaxWidth',
					title: 'Custom Max Page Width',
					description: 'Enter a valid CSS width value (e.g. 1360px, 90rem, 1480px).',
					type: 'string',
					placeholder: 'e.g. 1360px',
					hidden: ({ parent }) => parent?.pageMaxWidth !== 'custom',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'sectionSpacingDesktop',
					title: 'Section Spacing Desktop (Vertical Padding)',
					description: 'Controls the vertical padding (top & bottom) for each section on Desktop devices.',
					type: 'string',
					options: {
						list: [
							{ title: '16px (Tight / Minimal)', value: '16px' },
							{ title: '24px (Compact)', value: '24px' },
							{ title: '32px (Balanced / Recommended)', value: '32px' },
							{ title: '40px (Standard)', value: '40px' },
							{ title: '48px (Comfortable / Spacious)', value: '48px' },
							{ title: '64px (Large / Airy)', value: '64px' },
							{ title: '80px (Extra Large / Editorial)', value: '80px' },
							{ title: 'Custom Spacing (Enter below)', value: 'custom' },
						],
					},
					initialValue: '32px',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'customSectionSpacingDesktop',
					title: 'Custom Section Spacing Desktop',
					description: 'Enter a valid CSS spacing value (e.g. 36px, 2.5rem).',
					type: 'string',
					placeholder: 'e.g. 36px',
					hidden: ({ parent }) => parent?.sectionSpacingDesktop !== 'custom',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'sectionSpacingMobile',
					title: 'Section Spacing Mobile (Vertical Padding)',
					description: 'Controls the vertical padding (top & bottom) for each section on Mobile devices.',
					type: 'string',
					options: {
						list: [
							{ title: '8px (Tight)', value: '8px' },
							{ title: '12px (Compact)', value: '12px' },
							{ title: '16px (Standard / Recommended)', value: '16px' },
							{ title: '20px (Comfortable)', value: '20px' },
							{ title: '24px (Spacious)', value: '24px' },
							{ title: '32px (Large)', value: '32px' },
							{ title: 'Custom Spacing (Enter below)', value: 'custom' },
						],
					},
					initialValue: '16px',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'customSectionSpacingMobile',
					title: 'Custom Section Spacing Mobile',
					description: 'Enter a valid CSS spacing value (e.g. 14px, 1rem).',
					type: 'string',
					placeholder: 'e.g. 14px',
					hidden: ({ parent }) => parent?.sectionSpacingMobile !== 'custom',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'containerPaddingDesktop',
					title: 'Container Horizontal Margin/Padding Desktop',
					description: 'Side padding preventing content from touching browser edges on Desktop.',
					type: 'string',
					options: {
						list: [
							{ title: '16px (Compact / 1rem)', value: '16px' },
							{ title: '24px (Standard / 1.5rem)', value: '24px' },
							{ title: '32px (Comfortable / 2rem - Recommended)', value: '32px' },
							{ title: '40px (Spacious / 2.5rem)', value: '40px' },
							{ title: '48px (Extra Spacious / 3rem)', value: '48px' },
							{ title: 'Custom Padding (Enter below)', value: 'custom' },
						],
					},
					initialValue: '32px',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'customContainerPaddingDesktop',
					title: 'Custom Container Padding Desktop',
					type: 'string',
					placeholder: 'e.g. 36px',
					hidden: ({ parent }) => parent?.containerPaddingDesktop !== 'custom',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'containerPaddingMobile',
					title: 'Container Horizontal Margin/Padding Mobile',
					description: 'Side padding preventing content from touching screen edges on Mobile.',
					type: 'string',
					options: {
						list: [
							{ title: '8px (Tight)', value: '8px' },
							{ title: '12px (Compact)', value: '12px' },
							{ title: '16px (Standard / 1rem - Recommended)', value: '16px' },
							{ title: '20px (Spacious / 1.25rem)', value: '20px' },
							{ title: 'Custom Padding (Enter below)', value: 'custom' },
						],
					},
					initialValue: '16px',
					fieldset: 'layoutTokens',
				}),
				defineField({
					name: 'customContainerPaddingMobile',
					title: 'Custom Container Padding Mobile',
					type: 'string',
					placeholder: 'e.g. 14px',
					hidden: ({ parent }) => parent?.containerPaddingMobile !== 'custom',
					fieldset: 'layoutTokens',
				}),

				// --- 6. TYPOGRAPHY & FONT FAMILIES (SELF-HOSTED NEXT/FONT) ---
				defineField({
					name: 'fontHeading',
					title: 'Heading Typography (H1 - H6)',
					description: 'Pre-optimized, self-hosted Next.js Google font for editorial hierarchy & titles.',
					type: 'string',
					options: {
						list: [
							// Contemporary Sans
							{ title: 'Geist (Modern Precision Sans - Top Pick)', value: 'Geist' },
							{ title: 'Plus Jakarta Sans (Geometric & Crisp - Default)', value: 'Plus Jakarta Sans' },
							{ title: 'Inter (Neutral Standard)', value: 'Inter' },
							{ title: 'Outfit (Trendy & Balanced)', value: 'Outfit' },
							{ title: 'DM Sans (Minimalist & Clean)', value: 'DM Sans' },
							{ title: 'Manrope (Modern Semi-Geometric)', value: 'Manrope' },
							{ title: 'Montserrat (Bold & Modern)', value: 'Montserrat' },
							// Editorial & Luxury Serif
							{ title: 'Instrument Serif (Contemporary Editorial Luxury)', value: 'Instrument Serif' },
							{ title: 'Newsreader (High-Fashion Editorial)', value: 'Newsreader' },
							{ title: 'Playfair Display (Classical Luxury)', value: 'Playfair Display' },
							{ title: 'Lora (Refined Book Serif)', value: 'Lora' },
							{ title: 'Cormorant Garamond (Graceful & Traditional)', value: 'Cormorant Garamond' },
							// Display & Accent
							{ title: 'Space Grotesk (Tech & Contemporary Display)', value: 'Space Grotesk' },
							{ title: 'Syne (Avant-Garde & Expressive)', value: 'Syne' },
						],
					},
					initialValue: 'Plus Jakarta Sans',
					fieldset: 'typography',
				}),
				defineField({
					name: 'fontBody',
					title: 'Body Typography (Paragraphs, Menus, UI)',
					description: 'Pre-optimized, self-hosted Next.js Google font for body copy & UI readability.',
					type: 'string',
					options: {
						list: [
							{ title: 'Plus Jakarta Sans (Modern Clean - Default)', value: 'Plus Jakarta Sans' },
							{ title: 'Geist (Modern Precision Sans)', value: 'Geist' },
							{ title: 'Inter (Neutral & High Legibility)', value: 'Inter' },
							{ title: 'Outfit (Trendy Geometric)', value: 'Outfit' },
							{ title: 'DM Sans (Clean Minimalist)', value: 'DM Sans' },
							{ title: 'Manrope (Modern Semi-Geometric)', value: 'Manrope' },
							{ title: 'Nunito Sans (Warm & Friendly)', value: 'Nunito Sans' },
							{ title: 'Be Vietnam Pro (Optimized for Latin & Vietnamese)', value: 'Be Vietnam Pro' },
							{ title: 'Lora (Contemporary Serif for Editorial Stories)', value: 'Lora' },
							{ title: 'Newsreader (Editorial Reading)', value: 'Newsreader' },
						],
					},
					initialValue: 'Plus Jakarta Sans',
					fieldset: 'typography',
				}),

				// --- 7. ANIMATION & INTERACTIVE TOKENS ---
				defineField({
					name: 'enableMotion',
					title: 'Enable Motion & Micro-Interactions',
					description: 'Master toggle for button hover effects, banner transitions, and physical motion across the site.',
					type: 'boolean',
					initialValue: true,
					fieldset: 'animationTokens',
				}),
				defineField({
					name: 'buttonHoverEffect',
					title: 'Button Hover & Tap Micro-Interaction',
					description: 'Interactive motion style for primary CTA buttons, action links, and interactive buttons.',
					type: 'string',
					options: {
						list: [
							{ title: 'Subtle Scale & Tactile Tap (Scale 1.03x + Tap 0.97x - Recommended)', value: 'scale-subtle' },
							{ title: 'Physical Lift & Deep Elevation (Y: -2px + Shadow - Editorial / Luxury)', value: 'lift' },
							{ title: 'Spring Bounce (Elastic physics with spring damping - Dynamic DTC)', value: 'spring-bounce' },
							{ title: 'Brand Ring Glow (Luminous focus glow)', value: 'glow' },
							{ title: 'None (Flat color change without transform)', value: 'none' },
						],
					},
					initialValue: 'scale-subtle',
					fieldset: 'animationTokens',
				}),
				defineField({
					name: 'bannerHoverEffect',
					title: 'Banner & Card Hover Effect',
					description: 'Micro-interaction applied when hovering over promotional banners, carousel slides, and media cards.',
					type: 'string',
					options: {
						list: [
							{ title: 'Inner Image Zoom (1.05x smooth scale inside frame - Recommended)', value: 'zoom' },
							{ title: 'Card Lift & Elevation (Y: -6px + 3D shadow depth)', value: 'lift' },
							{ title: 'Zoom & Lift Combined (Simultaneous inner zoom and card elevation)', value: 'zoom-and-lift' },
							{ title: 'None (Static frame)', value: 'none' },
						],
					},
					initialValue: 'zoom',
					fieldset: 'animationTokens',
				}),
				defineField({
					name: 'motionPhysics',
					title: 'Motion Pacing & Spring Physics',
					description: 'Speed and feel of interactive transitions (applied to both CSS transitions and Framer Motion spring physics).',
					type: 'string',
					options: {
						list: [
							{ title: 'Snappy (150ms / Stiff Spring - High-tech, Crisp)', value: 'snappy' },
							{ title: 'Smooth (250ms-350ms / Balanced Spring - Default DTC)', value: 'smooth' },
							{ title: 'Gentle (450ms-600ms / Soft Spring - Luxury & Editorial)', value: 'gentle' },
						],
					},
					initialValue: 'smooth',
					fieldset: 'animationTokens',
				}),
			],
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Theme & Design System Tokens',
			subtitle: 'Colors, Typography & Design Tokens',
		}),
	},
})
