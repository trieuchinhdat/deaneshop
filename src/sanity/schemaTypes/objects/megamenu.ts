import { defineField, defineType } from 'sanity'
import { VscFolderLibrary } from 'react-icons/vsc'
import { count } from '@/lib/utils'

export default defineType({
	name: 'megamenu',
	title: 'Mega menu',
	icon: VscFolderLibrary,
	type: 'object',
	fields: [
		defineField({
			name: 'link',
			type: 'link',
		}),
		defineField({
			name: 'items',
			type: 'array',
			of: [{ type: 'link.list' }],
		}),
	],
	preview: {
		select: {
			link: 'link',
			items: 'items',
		},
		prepare: ({ link, items }) => ({
			title: link.label || link.internal?.title,
			subtitle: count(items),
		}),
	},
})
