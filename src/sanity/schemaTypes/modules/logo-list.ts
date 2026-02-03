import { defineField, defineType } from 'sanity'
import { ComponentIcon } from '@sanity/icons'
import { count, getBlockText } from '@/lib/utils'

export default defineType({
	name: 'logo-list',
	title: 'Logo list',
	type: 'object',
	icon: ComponentIcon,
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'logos',
			type: 'array',
			of: [{ type: 'logo' }, { type: 'reference', to: [{ type: 'logo' }] }],
			group: 'content',
		}),
		defineField({
			name: 'logoType',
			type: 'string',
			options: {
				list: ['default', 'dark', 'light'],
			},
			group: 'content',
		}),
		defineField({
			name: 'autoScroll',
			type: 'boolean',
			initialValue: false,
			group: 'options',
		}),
		defineField({
			name: 'duration',
			type: 'number',
			description: 'Duration in seconds for a complete cycle',
			initialValue: 12,
			hidden: ({ parent }) => !parent?.autoScroll,
			group: 'options',
		}),
	],
	preview: {
		select: {
			intro: 'intro',
			logos: 'logos',
		},
		prepare: ({ intro, logos }) => ({
			title: getBlockText(intro) || count(logos, 'logo'),
			subtitle: 'Logo list',
		}),
	},
})
