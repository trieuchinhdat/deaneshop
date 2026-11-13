import { defineField, defineType } from 'sanity'
import { CodeIcon } from '@sanity/icons'

export default defineType({
	name: 'tracking-script',
	title: 'Tracking Script',
	type: 'object',
	icon: CodeIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Script Name',
			description: 'E.g. Google Analytics 4, Meta Pixel, Hotjar, Tawk.to',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'isActive',
			title: 'Active',
			type: 'boolean',
			initialValue: true,
		}),
		defineField({
			name: 'location',
			title: 'Placement (DOM)',
			description:
				'Categorization for injection (Next.js Script automatically optimizes real placement)',
			type: 'string',
			options: {
				list: [
					{ title: 'Head (Top of document)', value: 'head' },
					{ title: 'Body (End of body)', value: 'body' },
				],
				layout: 'radio',
			},
			initialValue: 'head',
		}),
		defineField({
			name: 'strategy',
			title: 'Loading Strategy',
			description: 'Controls script loading timing to protect page performance and Core Web Vitals.',
			type: 'string',
			options: {
				list: [
					{
						title: 'afterInteractive (Recommended - GA4, Pixel)',
						value: 'afterInteractive',
					},
					{
						title: 'lazyOnload (Deferred - Live Chat, Social widgets)',
						value: 'lazyOnload',
					},
					{
						title: 'beforeInteractive (Critical - Use sparingly)',
						value: 'beforeInteractive',
					},
				],
			},
			initialValue: 'afterInteractive',
		}),
		defineField({
			name: 'scriptType',
			title: 'Script Type',
			type: 'string',
			options: {
				list: [
					{ title: 'External URL (.js file link)', value: 'url' },
					{ title: 'Inline Code (Direct JavaScript)', value: 'inline' },
				],
				layout: 'radio',
			},
			initialValue: 'url',
		}),
		// --- SCRIPT SOURCE DETAILS ---
		defineField({
			name: 'src',
			title: 'Script Source (URL)',
			placeholder: 'https://example.com/script.js',
			type: 'url',
			hidden: ({ parent }) => parent?.scriptType !== 'url',
		}),
		defineField({
			name: 'code',
			title: 'Inline Script Code',
			description: 'Paste pure JavaScript code without <script> tags.',
			type: 'text',
			rows: 6,
			hidden: ({ parent }) => parent?.scriptType !== 'inline',
		}),
		// --- SCRIPT ATTRIBUTES ---
		defineField({
			name: 'attributes',
			title: 'Custom Attributes',
			description: 'Add extra HTML attributes (e.g. data-domain, id, data-cf-beacon)...',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'key',
							title: 'Attribute Key',
							placeholder: 'data-id',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'value',
							title: 'Attribute Value',
							placeholder: '123456',
							type: 'string',
						}),
					],
					preview: {
						select: { key: 'key', value: 'value' },
						prepare({ key, value }) {
							return {
								title: key,
								subtitle: value ? `= ${value}` : '(Empty value)',
							}
						},
					},
				},
			],
			options: {
				modal: { type: 'popover' },
			},
		}),
	],
	preview: {
		select: {
			title: 'title',
			active: 'isActive',
			type: 'scriptType',
		},
		prepare({ title, active, type }) {
			return {
				title: title,
				subtitle: `${active ? 'Active' : 'Disabled'} - ${type === 'url' ? 'URL' : 'Inline'}`,
				media: CodeIcon,
			}
		},
	},
})
