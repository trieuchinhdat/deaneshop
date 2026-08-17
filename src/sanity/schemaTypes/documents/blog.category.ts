import { defineField, defineType } from 'sanity'
import { TagIcon } from '@sanity/icons'
import CategoryPostsList from '@/sanity/ui/category-posts-list'

export default defineType({
	name: 'blog.category',
	title: 'Blog Category',
	type: 'document',
	icon: TagIcon,
	groups: [
		{ name: 'general', title: 'General', default: true },
		{ name: 'seo', title: 'SEO & Metadata' },
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Category Title',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'general',
		}),
		defineField({
			name: 'slug',
			title: 'Category Slug (URL)',
			type: 'slug',
			options: { source: 'title' },
			validation: (Rule) => Rule.required(),
			group: 'general',
		}),
		defineField({
			name: 'description',
			title: 'Category Description',
			description: 'Brief overview displayed on the category landing page header.',
			type: 'text',
			rows: 2,
			group: 'general',
		}),
		defineField({
			name: 'image',
			title: 'Category Cover Image (Optional)',
			description:
				'Category cover image displayed on category hub pages. Recommended size: 1200 × 500 px or 800 × 450 px (16:9 ratio, max 250 KB, WebP/JPG).',
			type: 'image',
			options: { hotspot: true, metadata: ['lqip'] },
			group: 'general',
		}),
		defineField({
			name: 'postsList',
			title: 'Assigned Posts',
			type: 'string',
			components: {
				input: CategoryPostsList,
			},
			readOnly: true,
			group: 'general',
		}),
		defineField({
			name: 'metadata',
			title: 'SEO Metadata',
			type: 'metadata',
			group: 'seo',
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'description',
			media: 'image',
		},
		prepare: ({ title, subtitle, media }) => ({
			title: title || 'Unnamed Category',
			subtitle: subtitle || 'Blog Category',
			media,
		}),
	},
})
