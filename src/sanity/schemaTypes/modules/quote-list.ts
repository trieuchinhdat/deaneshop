import { defineArrayMember, defineField, defineType } from 'sanity'
import { FeedbackIcon } from '@sanity/icons'
import { getBlockText } from '@/lib/utils'

export default defineType({
	name: 'quote-list',
	title: 'Quote list',
	type: 'object',
	icon: FeedbackIcon,
	fields: [
		defineField({
			name: 'intro',
			type: 'array',
			of: [{ type: 'block' }],
		}),
		defineField({
			name: 'testimonials',
			type: 'array',
			of: [{ type: 'quote' }, { type: 'reference', to: [{ type: 'quote' }] }],
		}),
	],
	preview: {
		select: {
			intro: 'intro',
		},
		prepare: ({ intro }) => ({
			title: getBlockText(intro),
			subtitle: 'Quote list',
		}),
	},
})
