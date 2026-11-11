import { defineField, defineType } from 'sanity'
import { InfoOutlineIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'callout-box',
	title: 'Callout / Alert Box',
	type: 'object',
	icon: InfoOutlineIcon,
	fields: [
		defineField({
			name: 'type',
			title: 'Callout Tone / Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Tip (Green / Positive)', value: 'tip' },
					{ title: 'Information (Blue / Neutral)', value: 'info' },
					{ title: 'Warning (Amber / Notice)', value: 'warning' },
					{ title: 'Danger / Caution (Red / Critical)', value: 'danger' },
					{ title: 'Quote / Editorial Highlight', value: 'quote' },
				],
				layout: 'radio',
			},
			initialValue: 'info',
		}),
		defineField({
			name: 'title',
			title: 'Callout Title (Optional)',
			type: 'string',
			placeholder: 'Pro Tip / Important Note',
		}),
		defineField({
			name: 'content',
			title: 'Callout Message',
			type: 'array',
			of: [
				{
					type: 'block',
					styles: [{ title: 'Normal', value: 'normal' }],
					lists: [{ title: 'Bullet', value: 'bullet' }],
				},
			],
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: defineModulePreview({
		schemaName: 'callout-box',
		icon: InfoOutlineIcon,
		titleFields: ['title'],
		select: {
			tone: 'type',
		},
		metadata: (doc) => [
			doc.tone ? `Tone: ${doc.tone}` : null,
		],
	}),
})
