import { defineArrayMember, defineField, defineType } from 'sanity'
import { OlistIcon } from '@sanity/icons'
import { count, getBlockText } from '@/lib/utils'

export default defineType({
	name: 'step-list',
	title: 'Step list',
	type: 'object',
	icon: OlistIcon,
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
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'ctas',
			title: 'Call-to-actions',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),
		defineField({
			name: 'steps',
			type: 'array',
			of: [
				defineArrayMember({
					name: 'step',
					type: 'object',
					fields: [
						defineField({
							name: 'content',
							type: 'array',
							of: [{ type: 'block' }],
						}),
					],
					preview: {
						select: {
							content: 'content',
						},
						prepare: ({ content }) => ({
							title: getBlockText(content),
						}),
					},
				}),
			],
			group: 'content',
		}),
		defineField({
			name: 'enableSchema',
			title: 'Enable schema.org markup',
			type: 'boolean',
			initialValue: true,
			group: 'options',
		}),
	],
	preview: {
		select: {
			intro: 'intro',
			steps: 'steps',
		},
		prepare: ({ intro, steps }) => ({
			title: getBlockText(intro) || count(steps, 'step'),
			subtitle: 'Step list',
		}),
	},
})
