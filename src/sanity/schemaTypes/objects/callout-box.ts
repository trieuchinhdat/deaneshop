import { defineField, defineType } from 'sanity'
import { InfoOutlineIcon } from '@sanity/icons'

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
					{ title: '💡 Tip (Green/Positive)', value: 'tip' },
					{ title: 'ℹ️ Information (Blue/Neutral)', value: 'info' },
					{ title: '⚠️ Warning (Amber/Notice)', value: 'warning' },
					{ title: '🛑 Danger / Caution (Red/Critical)', value: 'danger' },
					{ title: '💬 Quote / Editorial Highlight', value: 'quote' },
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
	preview: {
		select: {
			title: 'title',
			type: 'type',
		},
		prepare: ({ title, type }) => ({
			title: title || 'Callout Box',
			subtitle: `Tone: ${type || 'info'}`,
		}),
	},
})
