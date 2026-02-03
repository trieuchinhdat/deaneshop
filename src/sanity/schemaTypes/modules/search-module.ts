import { defineArrayMember, defineField, defineType } from 'sanity'
import { SearchIcon } from '@sanity/icons'
import { FiTag } from 'react-icons/fi'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'search-module',
	title: 'Search',
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
	preview: {
		select: {
			intro: 'intro',
		},
		prepare: ({ intro }) => ({
			title: getBlockText(intro),
			subtitle: 'Search',
		}),
	},
})
