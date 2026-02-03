import { defineField, defineType } from 'sanity'
import { UsersIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'person-list',
	title: 'Person list',
	type: 'object',
	icon: UsersIcon,
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'people',
			type: 'array',
			of: [{ type: 'person' }, { type: 'reference', to: [{ type: 'person' }] }],
		}),
	],
	preview: {
		select: {
			intro: 'intro',
		},
		prepare: ({ intro }) => ({
			title: getBlockText(intro),
			subtitle: 'Person list',
		}),
	},
})
