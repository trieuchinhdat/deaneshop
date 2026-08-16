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
					options: { columns: 2 },
				},
				{
					name: 'surfaceColors',
					title: '2. Surface & Content Colors',
					options: { columns: 2 },
				},
				{
					name: 'statusColors',
					title: '3. Status & Note Colors',
					options: { columns: 2 },
				},
				{
					name: 'geometryTokens',
					title: '4. Geometry & Elevation Tokens',
					options: { columns: 2 },
				},
				{
					name: 'layoutTokens',
					title: '5. Layout & Spacing Tokens (Container & Sections)',
					options: { columns: 2 },
				},
				{
					name: 'typography',
					title: '6. Typography & Font Families',
					options: { columns: 2 },
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
					type: 'string',
					initialValue: '#059669',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onPrimaryColor',
					title: 'On-Primary Text Color',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'secondaryColor',
					title: 'Secondary Color (Badges & Highlights)',
					type: 'string',
					initialValue: '#10b981',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onSecondaryColor',
					title: 'On-Secondary Text Color',
					type: 'string',
					initialValue: '#ffffff',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'ctaColor',
					title: 'CTA / Accent Color (Buy Now Buttons)',
					type: 'string',
					initialValue: '#ea580c',
					validation: (Rule) =>
						Rule.regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).error(
							'Invalid Hex Code',
						),
					fieldset: 'brandColors',
				}),
				defineField({
					name: 'onCtaColor',
					title: 'On-CTA Text Color',
					type: 'string',
					initialValue: '#ffffff',
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
					title: 'Border Radius Scale',
					type: 'string',
					options: {
						list: [
							{ title: 'None (0px - Sharp / Brutalist)', value: 'none' },
							{ title: 'Small (4px)', value: 'sm' },
							{ title: 'Medium (8px - Recommended)', value: 'md' },
							{ title: 'Large (12px)', value: 'lg' },
							{ title: 'Full Capsule (Pill)', value: 'full' },
						],
					},
					initialValue: 'md',
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
							{ title: '✨ Custom Max Width (Enter below)', value: 'custom' },
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
							{ title: '✨ Custom Spacing (Enter below)', value: 'custom' },
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
							{ title: '✨ Custom Spacing (Enter below)', value: 'custom' },
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
							{ title: '✨ Custom Padding (Enter below)', value: 'custom' },
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
							{ title: '✨ Custom Padding (Enter below)', value: 'custom' },
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

				// --- 6. TYPOGRAPHY & FONT FAMILIES (HYBRID GOOGLE FONTS) ---
				defineField({
					name: 'fontHeading',
					title: 'Heading Font Family (H1 - H6, Titles)',
					description: 'Select a pre-optimized Google Font or choose Custom Google Font.',
					type: 'string',
					options: {
						list: [
							{ title: 'Plus Jakarta Sans (Modern Clean - Default)', value: 'Plus Jakarta Sans' },
							{ title: 'Inter (Neutral & Crisp)', value: 'Inter' },
							{ title: 'Be Vietnam Pro (Optimized for Vietnamese & Latin)', value: 'Be Vietnam Pro' },
							{ title: 'Outfit (Trendy & Geometric)', value: 'Outfit' },
							{ title: 'Montserrat (Bold & Modern)', value: 'Montserrat' },
							{ title: 'Nunito Sans (Warm & Friendly)', value: 'Nunito Sans' },
							{ title: 'Poppins (Geometric & Rounded)', value: 'Poppins' },
							{ title: 'Roboto (Standard Sans)', value: 'Roboto' },
							{ title: 'Open Sans (Clean & Neutral)', value: 'Open Sans' },
							{ title: 'Manrope (Modern Semi-geometric)', value: 'Manrope' },
							{ title: 'DM Sans (Minimalist & Crisp)', value: 'DM Sans' },
							{ title: 'Raleway (Elegant & Clean)', value: 'Raleway' },
							{ title: 'Urbanist (Contemporary Sans)', value: 'Urbanist' },
							{ title: 'Lexend (Designed for Reading Fluency)', value: 'Lexend' },
							{ title: 'Playfair Display (Luxury & Editorial Serif)', value: 'Playfair Display' },
							{ title: 'Lora (Contemporary Serif with Polish)', value: 'Lora' },
							{ title: 'Merriweather (Classic Editorial Serif)', value: 'Merriweather' },
							{ title: 'Cinzel (High-End Classical Luxury)', value: 'Cinzel' },
							{ title: 'Cormorant Garamond (Graceful & Elegant)', value: 'Cormorant Garamond' },
							{ title: 'Space Grotesk (Tech & Brutalist Display)', value: 'Space Grotesk' },
							{ title: 'Syne (Avant-Garde Display)', value: 'Syne' },
							{ title: 'Oswald (Condensed Impact Display)', value: 'Oswald' },
							{ title: '✨ Custom Google Font (Enter name below)', value: 'custom' },
						],
					},
					initialValue: 'Plus Jakarta Sans',
					fieldset: 'typography',
				}),
				defineField({
					name: 'customFontHeading',
					title: 'Custom Google Font for Headings',
					description: 'Enter the exact Google Font name (e.g. Marcellus, Epilogue, Cabinet Grotesk).',
					type: 'string',
					placeholder: 'e.g. Marcellus',
					hidden: ({ parent }) => parent?.fontHeading !== 'custom',
					fieldset: 'typography',
				}),
				defineField({
					name: 'fontBody',
					title: 'Body Font Family (Paragraphs, Menus, UI)',
					description: 'Select a pre-optimized Google Font or choose Custom Google Font.',
					type: 'string',
					options: {
						list: [
							{ title: 'Plus Jakarta Sans (Modern Clean - Default)', value: 'Plus Jakarta Sans' },
							{ title: 'Inter (Neutral & Crisp)', value: 'Inter' },
							{ title: 'Be Vietnam Pro (Optimized for Vietnamese & Latin)', value: 'Be Vietnam Pro' },
							{ title: 'Outfit (Trendy & Geometric)', value: 'Outfit' },
							{ title: 'Montserrat (Bold & Modern)', value: 'Montserrat' },
							{ title: 'Nunito Sans (Warm & Friendly)', value: 'Nunito Sans' },
							{ title: 'Poppins (Geometric & Rounded)', value: 'Poppins' },
							{ title: 'Roboto (Standard Sans)', value: 'Roboto' },
							{ title: 'Open Sans (Clean & Neutral)', value: 'Open Sans' },
							{ title: 'Manrope (Modern Semi-geometric)', value: 'Manrope' },
							{ title: 'DM Sans (Minimalist & Crisp)', value: 'DM Sans' },
							{ title: 'Raleway (Elegant & Clean)', value: 'Raleway' },
							{ title: 'Urbanist (Contemporary Sans)', value: 'Urbanist' },
							{ title: 'Lexend (Designed for Reading Fluency)', value: 'Lexend' },
							{ title: 'Playfair Display (Luxury & Editorial Serif)', value: 'Playfair Display' },
							{ title: 'Lora (Contemporary Serif with Polish)', value: 'Lora' },
							{ title: 'Merriweather (Classic Editorial Serif)', value: 'Merriweather' },
							{ title: 'Cinzel (High-End Classical Luxury)', value: 'Cinzel' },
							{ title: 'Cormorant Garamond (Graceful & Elegant)', value: 'Cormorant Garamond' },
							{ title: 'Space Grotesk (Tech & Brutalist Display)', value: 'Space Grotesk' },
							{ title: 'Syne (Avant-Garde Display)', value: 'Syne' },
							{ title: 'Oswald (Condensed Impact Display)', value: 'Oswald' },
							{ title: '✨ Custom Google Font (Enter name below)', value: 'custom' },
						],
					},
					initialValue: 'Plus Jakarta Sans',
					fieldset: 'typography',
				}),
				defineField({
					name: 'customFontBody',
					title: 'Custom Google Font for Body',
					description: 'Enter the exact Google Font name (e.g. Inter, Open Sans).',
					type: 'string',
					placeholder: 'e.g. Inter',
					hidden: ({ parent }) => parent?.fontBody !== 'custom',
					fieldset: 'typography',
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
