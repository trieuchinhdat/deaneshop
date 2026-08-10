import { defineField, defineType } from 'sanity'
import { BsCollection } from 'react-icons/bs'

export default defineType({
	name: 'collection-content',
	title: 'Collection content',
	type: 'object',
	icon: BsCollection,
	groups: [{ name: 'options', default: true }, { name: 'layout' }],
	fieldsets: [
		{
			name: 'displayOptions',
			title: 'Display Options',
			options: { columns: 3 },
		},
		{
			name: 'paginationOptions',
			title: 'Pagination & Filter',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'showBanner',
			title: 'Show Banner Image',
			type: 'boolean',
			initialValue: true,
			group: 'options',
			fieldset: 'displayOptions',
		}),
		defineField({
			name: 'showTitle',
			title: 'Show Title',
			type: 'boolean',
			initialValue: true,
			group: 'options',
			fieldset: 'displayOptions',
		}),
		defineField({
			name: 'showDescription',
			title: 'Show Description',
			type: 'boolean',
			initialValue: true,
			group: 'options',
			fieldset: 'displayOptions',
		}),
		defineField({
			name: 'itemsPerPage',
			title: 'Items per page',
			type: 'number',
			initialValue: 12,
			validation: (Rule) => Rule.min(1),
			group: 'options',
			fieldset: 'paginationOptions',
		}),
		defineField({
			name: 'enableFilter',
			title: 'Enable Filter & Sort',
			type: 'boolean',
			initialValue: true,
			group: 'options',
			fieldset: 'paginationOptions',
		}),
		defineField({
			name: 'layout',
			type: 'string',
			options: {
				list: [
					{ title: 'Grid', value: 'grid' },
					{ title: 'Carousel', value: 'carousel' },
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'attributes',
			title: 'Module attributes',
			type: 'module-attributes',
			group: 'options',
		}),
	],
	preview: {
		select: {
			uid: 'attributes.uid',
		},
		prepare: ({ uid }) => ({
			title: 'Collection content',
			subtitle: uid ? `#${uid}` : 'Main collection content block',
		}),
	},
})
