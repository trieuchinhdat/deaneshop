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
			name: 'badge',
			title: 'Badge Tag',
			type: 'string',
			description: 'Optional tag displayed next to category title (e.g. Hot, New, -20%)',
		}),
		defineField({
			name: 'items',
			type: 'array',
			of: [{ type: 'link.list' }],
		}),
		defineField({
			name: 'banner',
			title: 'Promo Banner (For Master-Detail Panel)',
			type: 'object',
			fields: [
				defineField({
					name: 'image',
					title: 'Banner Image',
					type: 'image',
					description: 'Recommended size: 600 x 450 px (4:3 aspect ratio), WebP/PNG under 150KB. Displayed in the right detail panel when hovering over this category.',
					options: { hotspot: true },
				}),
				defineField({
					name: 'title',
					type: 'string',
				}),
				defineField({
					name: 'subtitle',
					type: 'string',
				}),
				defineField({
					name: 'link',
					type: 'link',
				}),
			],
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
