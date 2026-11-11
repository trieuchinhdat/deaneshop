import { defineField } from 'sanity'
import ModuleItem from '@/sanity/ui/module-item'
import TemplatePickerInput from '@/sanity/ui/template-picker-input'

export default ({
	of = [],
	enableTemplateStore = false,
}: {
	of?: Array<{ type: string }>
	enableTemplateStore?: boolean
} = {}) =>
	defineField({
		name: 'modules',
		type: 'array',
		components: {
			item: ModuleItem,
			...(enableTemplateStore ? { input: TemplatePickerInput } : {}),
		},
		of: [
			{ type: 'hero.split' },
			{ type: 'hero-slider' },
			{ type: 'media-grid' },
			{ type: 'tiered-pricing' },
			{ type: 'compliance-vault' },
			{ type: 'countdown-banner' },
			{ type: 'sticky-mobile-cta' },
			{ type: 'lead-capture-form' },
			{ type: 'social-proof' },
			{ type: 'product-list' },
			{ type: 'card-list' },
			{ type: 'step-list' },
			{ type: 'quote-list' },
			{ type: 'logo-list' },
			{ type: 'stat-list' },
			{ type: 'accordion-list' },
			{ type: 'carousel-banner-list' },
			{ type: 'prose' },
			{ type: 'callout' },
			{ type: 'person-list' },
			{ type: 'blog-post-list' },
			{ type: 'custom-html' },
			{ type: 'comparison-table' },
			...of,
		],
		options: {
			insertMenu: {
				filter: true,
				views: [
					{
						name: 'grid',
						previewImageUrl: (schemaTypeName) =>
							`/thumbnails/modules/${schemaTypeName}.svg`,
					},
					{ name: 'list' },
				],
				groups: [
					{
						name: 'commerce-conversion',
						title: 'Commerce & Conversion',
						of: [
							'product-list',
							'tiered-pricing',
							'compliance-vault',
							'countdown-banner',
							'sticky-mobile-cta',
							'lead-capture-form',
							'social-proof',
						],
					},
					{
						name: 'story-layout',
						title: 'Story & Layout',
						of: [
							'hero.split',
							'hero-slider',
							'media-grid',
							'carousel-banner-list',
							'card-list',
							'step-list',
							'prose',
							'callout',
							'comparison-table',
						],
					},
					{
						name: 'trust-utilities',
						title: 'Trust & Utilities',
						of: [
							'quote-list',
							'logo-list',
							'stat-list',
							'accordion-list',
							'person-list',
							'blog-post-list',
							'custom-html',
						],
					},
				],
			},
		},
	})

