import { defineField, defineType } from 'sanity'
import CharacterCount from '@/sanity/ui/character-count'

export default defineType({
	name: 'metadata',
	title: 'Metadata',
	type: 'object',
	fields: [
		defineField({
			name: 'title',
			title: 'Meta Title',
			description:
				'Headline for search engines and social cards. Optimal SEO & GEO range: 50–70 characters (300–580px SERP).',
			type: 'string',
			validation: (Rule) =>
				Rule.max(70).warning('Titles longer than 70 characters may be truncated on Google or search engines.'),
			components: {
				input: (props) => <CharacterCount min={50} max={70} {...props} />,
			},
		}),
		defineField({
			name: 'description',
			title: 'Meta Description',
			description:
				'Snippet for search engines and AI answer engines (GEO). Optimal range: 150–200 characters (max 200).',
			type: 'text',
			validation: (Rule) =>
				Rule.max(200).warning('Descriptions longer than 200 characters may be truncated in search snippets.'),
			components: {
				input: (props) => <CharacterCount as="textarea" min={150} max={200} {...props} />,
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
				'Used for social media cards (Facebook, LinkedIn, X) and Google Discover previews. Recommended size: 1200 × 630 px (1.91:1 ratio, max 300 KB, JPG/WebP).',
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
