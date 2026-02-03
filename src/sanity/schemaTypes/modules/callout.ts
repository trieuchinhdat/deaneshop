import { defineArrayMember, defineField, defineType } from 'sanity'
import { FiTag } from 'react-icons/fi'
import { VscInspect } from 'react-icons/vsc'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'callout',
	title: 'Callout',
	type: 'object',
	icon: VscInspect,
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
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
			name: 'ctas',
			title: 'Call-to-actions',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),
	],
	preview: {
		select: {
			intro: 'intro',
		},
		prepare: ({ intro }) => ({
			title: getBlockText(intro),
			subtitle: 'Callout',
		}),
	},
})
