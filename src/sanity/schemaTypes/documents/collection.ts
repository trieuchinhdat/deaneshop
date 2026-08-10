import { defineArrayMember, defineField, defineType } from 'sanity'
import { BsCollection } from 'react-icons/bs'
import { ImageIcon } from '@sanity/icons'
import modules from '../fragments/modules'

export default defineType({
	name: 'collection',
	title: 'Collection',
	type: 'document',
	icon: BsCollection,
	groups: [{ name: 'content', default: true }, { name: 'metadata' }],
	fields: [
		defineField({
			name: 'title',
			type: 'string',
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'image',
			title: 'Banner Image',
			type: 'image',
			group: 'content',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
			fields: [
				defineField({
					name: 'alt',
					type: 'string',
				}),
			],
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'array',
			group: 'content',
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							type: 'string',
						}),
					],
				}),
			],
		}),
		defineField({
			name: 'products',
			title: 'List product',
			type: 'array',
			group: 'content',
			validation: (Rule) => Rule.unique(),
			of: [
				{
					type: 'reference',
					to: [{ type: 'product' }],
					options: {
						filter: ({ document }) => {
							const existingIds =
								(document as any)?.products
									?.map((item: any) => item._ref)
									.filter((id: string) => id) || []

							return {
								filter: '!(_id in $existingIds) && !(_id in path("drafts.**"))',
								params: {
									existingIds,
								},
							}
						},
					},
				},
			],
		}),
		defineField({
			...modules(),
			group: 'content',
		}),
		defineField({
			name: 'metadata',
			type: 'metadata',
			group: 'metadata',
		}),
	],
	preview: {
		select: {
			title: 'title',
			slug: 'metadata.slug.current',
			media: 'image',
		},
		prepare({ title, slug, media }) {
			return {
				title,
				subtitle: slug ? `/collections/${slug}` : '/collections',
				media,
			}
		},
	},
})
