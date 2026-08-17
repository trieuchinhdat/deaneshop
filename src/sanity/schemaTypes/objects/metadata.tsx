import { defineField, defineType } from 'sanity'
import CharacterCount from '@/sanity/ui/character-count'

export default defineType({
	name: 'metadata',
	title: 'Metadata',
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.max(60).warning(),
			components: {
				input: (props) => <CharacterCount max={60} {...props} />,
			},
		}),
		defineField({
			name: 'description',
			type: 'text',
			validation: (Rule) => Rule.max(160).warning(),
			components: {
				input: (props) => <CharacterCount as="textarea" max={160} {...props} />,
			},
		}),
		defineField({
			name: 'slug',
			type: 'slug',
			description: 'URL path or permalink',
			options: {
				source: (doc: any) => doc.title || doc.metadata.title,
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'image',
			title: 'Social Share / Open Graph Image',
			description:
				'Used for social media cards (Facebook, LinkedIn, X, Zalo) and Google Discover previews. Recommended size: 1200 × 630 px (1.91:1 ratio, max 300 KB, JPG/WebP).',
			type: 'image',
			options: {
				hotspot: true,
				metadata: ['lqip'],
			},
		}),
		defineField({
			name: 'noIndex',
			description: 'Prevent search engines from indexing this page',
			type: 'boolean',
			initialValue: false,
		}),
	],
})
