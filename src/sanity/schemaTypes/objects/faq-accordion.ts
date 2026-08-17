import { defineField, defineType } from 'sanity'
import { HelpCircleIcon } from '@sanity/icons'

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
	preview: {
		select: {
			title: 'title',
			items: 'items',
		},
		prepare: ({ title, items }) => ({
			title: title || 'FAQ Accordion',
			subtitle: `${items?.length || 0} Questions (Auto FAQ Schema)`,
		}),
	},
})
