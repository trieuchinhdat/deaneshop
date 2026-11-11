import { defineField, defineType } from 'sanity'
import { TfiLayoutMediaLeft } from 'react-icons/tfi'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'hero.split',
	title: 'Split Hero',
	description: 'High-impact split section with headline, marketing copy, action CTAs, and featured media.',
	type: 'object',
	icon: TfiLayoutMediaLeft,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: '🌱 Certified Sustainable Bio-Packaging',
			content: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Next-Generation Sustainable Bio-Packaging for Global Brands',
							marks: [],
						},
					],
					style: 'h1',
				},
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Certified 100% home-compostable food serviceware engineered to replace single-use plastics without compromising temperature resistance or durability.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			ctas: [
				{
					_key: genKey(),
					actionType: 'link',
					style: 'action',
					link: {
						label: 'Request Official Quotation',
						type: 'internal',
						params: '#lead-form',
					},
				},
				{
					_key: genKey(),
					actionType: 'link',
					style: 'action-outline',
					link: {
						label: 'Explore Catalog',
						type: 'internal',
						params: '#products',
					},
				},
			],
			trustText: '⭐️ Rated 4.9/5 by 1,200+ global brands • Free worldwide sample dispatch • ISO 9001 Certified',
			desktopLayout: 'mediaRight',
			mobileLayout: 'textFirst',
			splitRatio: '50-50',
			verticalAlignment: 'center',
			mediaAspectRatio: 'auto',
			mediaCornerRadius: 'xl',
			mediaElevation: 'shadow',
			colorTheme: 'transparent',
			loadingStrategy: 'eager',
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design & Layout' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Headline & Value Proposition',
			options: { columns: 1 },
		},
		{
			name: 'actionSection',
			title: 'Calls to Action & Social Proof',
			options: { columns: 1 },
		},
		{
			name: 'mediaAsset',
			title: 'Hero Visual Media',
			options: { columns: 1 },
		},
		{
			name: 'layoutOptions',
			title: 'Layout & Ordering',
			options: { columns: 1 },
		},
		{
			name: 'mediaStyling',
			title: 'Media Styling & Elevation',
			options: { columns: 1 },
		},
		{
			name: 'sectionStyle',
			title: 'Section Background & Performance',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'badge',
			title: 'Eyebrow Badge (Optional)',
			description: 'Attention-grabbing pill tag above headline (e.g. "🌱 100% Certified Biodegradable" or "Special Launch Offer").',
			type: 'string',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'content',
			title: 'Headline & Body Copy',
			description: 'Main heading (H1) and supporting pitch for this hero section.',
			type: 'array',
			of: [{ type: 'block' }],
			validation: (Rule) => Rule.required().min(1).error('Headline and content are required for the hero section.'),
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-Action Buttons',
			description: 'Primary and secondary action buttons guiding visitors toward conversion.',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
			fieldset: 'actionSection',
		}),
		defineField({
			name: 'trustText',
			title: 'Trust & Reassurance Subtext (Optional)',
			description: 'Micro-copy or trust badge displayed under the CTAs (e.g. "⭐️ Rated 4.9/5 by 1,200+ brands • Free worldwide sample dispatch").',
			type: 'string',
			group: 'content',
			fieldset: 'actionSection',
		}),
		defineField({
			name: 'image',
			title: 'Hero Visual Media',
			description: 'High-resolution hero photography, product rendering, or media graphic.',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			group: 'content',
			fieldset: 'mediaAsset',
			fields: [
				defineField({
					name: 'alt',
					title: 'Alt Text (SEO & Accessibility)',
					description: 'Describe what appears in this image for screen readers and search engines (WCAG 2.2 AA).',
					type: 'string',
					validation: (Rule) => Rule.warning('Alt text is recommended for SEO and screen reader accessibility.'),
				}),
				defineField({
					name: 'mobileImage',
					title: 'Mobile Image Override (Optional)',
					description: 'Custom cropped 1:1 or 4:5 image optimized specifically for smartphones.',
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
				}),
				defineField({
					name: 'mediaCaption',
					title: 'Floating Media Badge / Micro-Card (Optional)',
					description: 'Floating overlay pill on top of the media (e.g. "Over 50,000 units shipped this month").',
					type: 'string',
				}),
				// Backward-compatibility legacy fields
				defineField({
					name: 'loading',
					title: 'Legacy Image Loading Strategy',
					type: 'string',
					hidden: true,
				}),
				defineField({
					name: 'onRight',
					title: 'Legacy Media on Right',
					type: 'boolean',
					hidden: true,
				}),
				defineField({
					name: 'afterContent',
					title: 'Legacy Media Below Text',
					type: 'boolean',
					hidden: true,
				}),
			],
		}),
		// --- Tab: Design & Layout ---
		defineField({
			name: 'desktopLayout',
			title: 'Desktop Media Position',
			description: 'Position of media relative to headline text on desktop viewports (768px+).',
			type: 'string',
			options: {
				list: [
					{ title: 'Media on Right (Standard)', value: 'mediaRight' },
					{ title: 'Media on Left (Inverted)', value: 'mediaLeft' },
				],
				layout: 'radio',
			},
			initialValue: 'mediaRight',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Display Order',
			description: 'Determine whether mobile visitors see the headline hook first or the visual media first.',
			type: 'string',
			options: {
				list: [
					{ title: 'Headline First (Recommended for Conversion)', value: 'textFirst' },
					{ title: 'Media First (Visual Hook on Top)', value: 'mediaFirst' },
				],
				layout: 'radio',
			},
			initialValue: 'textFirst',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'splitRatio',
			title: 'Column Width Ratio',
			description: 'Desktop proportion allocated to content vs media column.',
			type: 'string',
			options: {
				list: [
					{ title: '50% / 50% (Balanced 1:1)', value: '50-50' },
					{ title: '58% / 42% (Content-Focused)', value: '60-40' },
					{ title: '42% / 58% (Media-Focused)', value: '40-60' },
				],
				layout: 'radio',
			},
			initialValue: '50-50',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'verticalAlignment',
			title: 'Vertical Alignment',
			description: 'Vertical alignment of the text column relative to the media container.',
			type: 'string',
			options: {
				list: [
					{ title: 'Center (Balanced)', value: 'center' },
					{ title: 'Top (Aligned to top edge)', value: 'top' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'design',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'mediaAspectRatio',
			title: 'Media Aspect Ratio',
			description: 'Aspect ratio constraint applied to media container to eliminate layout shift (CLS).',
			type: 'string',
			options: {
				list: [
					{ title: 'Natural (Preserve image proportions)', value: 'auto' },
					{ title: 'Landscape (4:3 Standard)', value: '4/3' },
					{ title: 'Widescreen (16:9 Cinematic)', value: '16/9' },
					{ title: 'Square (1:1 Modern)', value: '1/1' },
					{ title: 'Portrait (4:5 Editorial)', value: '4/5' },
				],
			},
			initialValue: 'auto',
			group: 'design',
			fieldset: 'mediaStyling',
		}),
		defineField({
			name: 'mediaCornerRadius',
			title: 'Media Corner Radius',
			description: 'Border radius curvature applied to the hero media.',
			type: 'string',
			options: {
				list: [
					{ title: 'Square (0px)', value: 'none' },
					{ title: 'Subtle Rounded (8px)', value: 'md' },
					{ title: 'Modern Rounded (16px — Default)', value: 'xl' },
					{ title: 'Luxe Rounded (24px)', value: '2xl' },
				],
			},
			initialValue: 'xl',
			group: 'design',
			fieldset: 'mediaStyling',
		}),
		defineField({
			name: 'mediaElevation',
			title: 'Media Shadow & Border',
			description: 'Visual depth and subtle framing around the media container.',
			type: 'string',
			options: {
				list: [
					{ title: 'Flat (Clean / No shadow)', value: 'none' },
					{ title: 'Ambient Soft Shadow (Default)', value: 'shadow' },
					{ title: 'Bordered with Soft Shadow', value: 'bordered' },
				],
			},
			initialValue: 'shadow',
			group: 'design',
			fieldset: 'mediaStyling',
		}),
		defineField({
			name: 'colorTheme',
			title: 'Section Background',
			description: 'Background styling for this split hero section.',
			type: 'string',
			options: {
				list: [
					{ title: 'Transparent / Default Canvas', value: 'transparent' },
					{ title: 'Muted Surface Tone (bg-surface)', value: 'muted' },
					{ title: 'Soft Brand Tint (Primary hue accent)', value: 'brand' },
				],
			},
			initialValue: 'transparent',
			group: 'design',
			fieldset: 'sectionStyle',
		}),
		defineField({
			name: 'loadingStrategy',
			title: 'Image Loading Optimization',
			description: 'Eager loading boosts Google Core Web Vitals (LCP) for above-the-fold hero banners.',
			type: 'string',
			options: {
				list: [
					{ title: 'Eager / High Priority (Recommended — Above the Fold)', value: 'eager' },
					{ title: 'Lazy Loading (Below the fold)', value: 'lazy' },
				],
				layout: 'radio',
			},
			initialValue: 'eager',
			group: 'design',
			fieldset: 'sectionStyle',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'hero.split',
		icon: TfiLayoutMediaLeft,
		imageField: 'image',
		titleFields: ['content', 'badge'],
		select: {
			desktopLayout: 'desktopLayout',
			imageOnRight: 'image.onRight',
			badge: 'badge',
			splitRatio: 'splitRatio',
		},
		metadata: (doc) => {
			const isRight = doc.desktopLayout
				? doc.desktopLayout === 'mediaRight'
				: doc.imageOnRight !== false
			return [
				doc.badge ? `Badge: ${doc.badge}` : null,
				isRight ? 'Media on Right' : 'Media on Left',
				doc.splitRatio && doc.splitRatio !== '50-50' ? `Ratio: ${doc.splitRatio}` : null,
			]
		},
	}),
})
