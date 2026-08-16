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
					name: 'typography',
					title: '5. Typography & Font Families',
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

				// --- 5. TYPOGRAPHY & FONT FAMILIES (HYBRID GOOGLE FONTS) ---
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
