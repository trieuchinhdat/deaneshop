import { defineArrayMember, defineField, defineType } from 'sanity'
import { SearchIcon } from '@sanity/icons'
import { FiTag } from 'react-icons/fi'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'search-module',
	title: 'Interactive Search Bar [DEPRECATED]',
	description:
		'Legacy module. Interactive Search Bar is now rendered as a fixed system view at /search.',
	deprecated: {
		reason: 'Search module is now rendered as a dedicated system view at /search.',
	},
	type: 'object',
	icon: SearchIcon,
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [
				{ type: 'block' },
				defineArrayMember({
					name: 'tag',
					title: 'Tag',
					type: 'object',
					icon: FiTag,
					fields: [
						defineField({
							name: 'label',
							title: 'Text',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'href',
							title: 'Link',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {
							title: 'label',
						},
						prepare({ title }) {
							return {
								title: `# ${title}`,
							}
						},
					},
				}),
			],
			group: 'content',
		}),
		defineField({
			name: 'scope',
			type: 'string',
			options: {
				list: ['all', 'pages', 'product', 'blog posts'],
				layout: 'radio',
			},
			initialValue: 'all',
			group: 'options',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'search-module',
		icon: SearchIcon,
		titleFields: ['intro'],
		select: {
			scope: 'scope',
		},
		metadata: (doc) => [
			doc.scope ? `Scope: ${doc.scope}` : null,
		],
	}),
})
