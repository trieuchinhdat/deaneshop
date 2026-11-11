import { defineField, defineType } from 'sanity'
import { HelpCircleIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'faq-accordion',
	title: 'FAQ / Q&A Accordion (Google FAQ Schema)',
	type: 'object',
	icon: HelpCircleIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Section Heading (Optional)',
			type: 'string',
			initialValue: 'Frequently Asked Questions',
		}),
		defineField({
			name: 'items',
			title: 'Questions & Answers',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'faqItem',
					title: 'Question & Answer Pair',
					fields: [
						defineField({
							name: 'question',
							title: 'Question',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'answer',
							title: 'Answer',
							type: 'array',
							of: [{ type: 'block' }],
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {
							title: 'question',
						},
						prepare: ({ title }) => ({
							title: title || 'Question',
							subtitle: 'FAQ Item',
						}),
					},
				},
			],
			validation: (Rule) => Rule.min(1).required(),
		}),
	],
	preview: defineModulePreview({
		schemaName: 'faq-accordion',
		icon: HelpCircleIcon,
		titleFields: ['title'],
		select: {
			items: 'items',
		},
		metadata: (doc) => [
			doc.items?.length ? `${doc.items.length} questions` : null,
		],
	}),
})
