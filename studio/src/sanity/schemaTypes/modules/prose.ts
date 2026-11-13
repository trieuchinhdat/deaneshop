import { defineArrayMember, defineField, defineType } from 'sanity'
import { BlockContentIcon, ImageIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'prose',
	title: 'Editorial Story',
	description: 'Long-form rich-text editorial copy formatted with headings, typography, quotes, and embedded media.',
	type: 'object',
	icon: BlockContentIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			containerWidth: 'standard',
			containerStyle: 'clean',
			tableOfContents: 'none',
			tocTitle: 'On this page',
			showReadingTime: false,
			enableDropCap: false,
			content: [
				{
					_key: genKey(),
					_type: 'block',
					style: 'h2',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Crafting Sustainable Commerce for a Circular Future',
							marks: [],
						},
					],
				},
				{
					_key: genKey(),
					_type: 'block',
					style: 'normal',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Founded with an unyielding commitment to material integrity and environmental responsibility, our engineering processes transform renewable biological fibers into high-performance commercial packaging.',
							marks: [],
						},
					],
				},
				{
					_key: genKey(),
					_type: 'block',
					style: 'blockquote',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'True sustainability requires redesigning industrial supply chains from extraction to biodegradation.',
							marks: [],
						},
					],
				},
				{
					_key: genKey(),
					_type: 'block',
					style: 'h3',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Rigorous International Compliance & Life-Cycle Standards',
							marks: [],
						},
					],
				},
				{
					_key: genKey(),
					_type: 'block',
					style: 'normal',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Every batch produced in our facilities undergoes independent laboratory verification meeting ASTM D6400, EN 13432, and FDA food-contact criteria. We eliminate fluorinated barrier coatings (PFAS-free) in favor of water-based thermal barriers that decompose without hazardous chemical residues.',
							marks: [],
						},
					],
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design & Layout' },
		{ name: 'settings', title: 'Settings' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'badge',
			title: 'Eyebrow / Category Badge (Optional)',
			description: 'Small uppercase label displayed above the story (e.g. "Brand Manifesto", "Sustainability Report").',
			type: 'string',
			placeholder: 'e.g. Brand Manifesto',
			group: 'content',
		}),
		defineField({
			name: 'content',
			title: 'Story Content & Body',
			description: 'Compose your editorial narrative. Use H2/H3 headings for automatic Table of Contents extraction.',
			type: 'array',
			group: 'content',
			validation: (Rule) => Rule.required().min(1).error('Please add story content.'),
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					title: 'Inline Photo',
					description:
						'Editorial inline image. Recommended size: 1200 × 675 px (16:9 ratio, WebP/JPG).',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							title: 'Alt Text (SEO & Accessibility)',
							description: 'Describe the image for screen readers and search engines.',
							type: 'string',
							placeholder: 'e.g. Sustainable sugarcane fiber takeout containers on factory line',
							validation: (Rule) => Rule.warning('Alt text is strongly recommended for accessibility and SEO.'),
						}),
						defineField({
							name: 'figcaption',
							title: 'Caption',
							description: 'Optional caption displayed beneath the image.',
							type: 'array',
							of: [
								{
									type: 'block',
									styles: [{ title: 'Normal', value: 'normal' }],
								},
							],
						}),
					],
				}),
				defineArrayMember({
					type: 'code',
					title: 'Code block',
					options: { withFilename: true },
				}),
				{ type: 'callout-box' },
				{ type: 'product-embed' },
				{ type: 'comparison-table' },
				{ type: 'video-embed' },
				{ type: 'faq-accordion' },
				{ type: 'image-gallery' },
				{ type: 'cta-banner' },
				{ type: 'custom-html' },
			],
		}),

		// Tab 2: Design & Layout
		defineField({
			name: 'containerWidth',
			title: 'Reading Column Width',
			description: 'Narrow is recommended for long reading pieces; Wide is ideal for media-rich stories.',
			type: 'string',
			options: {
				list: [
					{ title: 'Narrow / Focus (680px - Optimal Reading Line Length)', value: 'narrow' },
					{ title: 'Standard / Balanced (768px - Recommended)', value: 'standard' },
					{ title: 'Wide / Magazine (896px - Great with Media & Tables)', value: 'wide' },
					{ title: 'Full Spread (1024px - Wide Documentation)', value: 'full' },
				],
				layout: 'radio',
			},
			initialValue: 'standard',
			group: 'design',
		}),
		defineField({
			name: 'containerStyle',
			title: 'Container Presentation',
			description: 'Choose whether the story blends seamlessly into the page background or sits in an elevated card.',
			type: 'string',
			options: {
				list: [
					{ title: 'Clean / Seamless (Blends with page background)', value: 'clean' },
					{ title: 'Elevated Card (Boxed with subtle border & shadow)', value: 'card' },
					{ title: 'Subtle Tint (Soft muted background box)', value: 'muted' },
				],
				layout: 'radio',
			},
			initialValue: 'clean',
			group: 'design',
		}),
		defineField({
			name: 'tableOfContents',
			title: 'Table of Contents Navigation',
			description: 'Automatically extract H2/H3 headings into an anchored sidebar directory.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (No Table of Contents)', value: 'none' },
					{ title: 'Left Sticky Sidebar (Recommended for Desktop)', value: 'left' },
					{ title: 'Right Sticky Sidebar', value: 'right' },
				],
				layout: 'radio',
			},
			initialValue: 'none',
			group: 'design',
		}),
		defineField({
			name: 'tocTitle',
			title: 'Table of Contents Title',
			description: 'Header text for the sidebar directory (e.g. "On this page", "In this story").',
			type: 'string',
			placeholder: 'On this page',
			initialValue: 'On this page',
			hidden: ({ parent }) => !parent?.tableOfContents || parent?.tableOfContents === 'none',
			group: 'design',
		}),
		defineField({
			name: 'showReadingTime',
			title: 'Show Reading Time Badge',
			description: 'Display an estimated reading duration badge (e.g. "4 min read") above the story.',
			type: 'boolean',
			initialValue: false,
			group: 'design',
		}),
		defineField({
			name: 'enableDropCap',
			title: 'Enable Editorial Drop-Cap',
			description: 'Styles the first letter of the opening paragraph in an elegant large editorial style.',
			type: 'boolean',
			initialValue: false,
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'prose',
		icon: BlockContentIcon,
		titleFields: ['badge', 'content'],
		select: {
			toc: 'tableOfContents',
			containerStyle: 'containerStyle',
			containerWidth: 'containerWidth',
		},
		metadata: (doc) => [
			doc.toc && doc.toc !== 'none' ? `TOC: ${doc.toc}` : null,
			doc.containerStyle ? `Style: ${doc.containerStyle}` : null,
		],
	}),
})
