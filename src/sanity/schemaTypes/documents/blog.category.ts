import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import CategoryPostsList from '@/sanity/ui/category-posts-list'

export default defineType({
	name: 'blog.category',
	title: 'Blog (category)',
	type: 'document',
	icon: TagIcon,
	fields: [
		defineField({
			name: 'title',
			type: 'string',
		}),
		defineField({
			name: 'slug',
			type: 'slug',
			options: { source: 'title' },
		}),
		defineField({
			name: 'postsList',
			title: 'Assigned Posts',
			type: 'string',
			components: {
				input: CategoryPostsList,
			},
			readOnly: true,
		}),
	],
	preview: {
		select: {
			title: 'title',
		},
	},
})
