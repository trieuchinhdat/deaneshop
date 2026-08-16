import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'widget-settings',
	title: 'Floating Widgets & Contact',
	type: 'document',
	fields: [
		defineField({
			name: 'widgetPosition',
			title: 'Floating Widget Position',
			type: 'string',
			options: {
				list: [
					{ title: 'Bottom Right (Default)', value: 'bottom-right' },
					{ title: 'Bottom Left', value: 'bottom-left' },
				],
				layout: 'radio',
			},
			initialValue: 'bottom-right',
		}),
		defineField({
			name: 'displayMode',
			title: 'Widget Display Mode (Chế độ hiển thị)',
			description:
				'Choose between collapsing into 1 Master FAB button (Speed Dial - Recommended for clean UX) or showing all buttons stacked.',
			type: 'string',
			options: {
				list: [
					{
						title: '⚡ Expandable Speed Dial (Collapse into 1 Master Icon - Recommended)',
						value: 'expandable',
					},
					{
						title: '📌 Always Expanded Stack (Show all buttons vertically)',
						value: 'stack',
					},
				],
				layout: 'radio',
			},
			initialValue: 'expandable',
		}),
		defineField({
			name: 'mainButtonLabel',
			title: 'Master Button Label / Tooltip',
			description: 'Tooltip or badge displayed on the main button (e.g. "Need Help?", "Chat with us").',
			type: 'string',
			initialValue: 'Need Help?',
			hidden: ({ parent }) => parent?.displayMode === 'stack',
		}),
		defineField({
			name: 'mainButtonIcon',
			title: 'Master Button Icon Style',
			type: 'string',
			options: {
				list: [
					{ title: '💬 Chat Bubble (Default)', value: 'chat' },
					{ title: '📞 Phone Call', value: 'phone' },
					{ title: '🎧 Customer Support', value: 'support' },
				],
			},
			initialValue: 'chat',
			hidden: ({ parent }) => parent?.displayMode === 'stack',
		}),
		defineField({
			name: 'floatingButtons',
			title: 'Floating Action Buttons',
			description:
				'Quick contact buttons fixed on the screen (Call, WhatsApp, Messenger, etc.).',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'type',
							title: 'Action Type',
							type: 'string',
							options: {
								list: [
									{ title: 'Phone Call (Hotline)', value: 'phone' },
									{ title: 'WhatsApp / Zalo Chat', value: 'zalo' },
									{ title: 'Facebook Messenger', value: 'messenger' },
									{ title: 'Custom URL / Contact Form', value: 'custom' },
								],
							},
						}),
						defineField({
							name: 'label',
							title: 'Tooltip Label',
							type: 'string',
						}),
						defineField({
							name: 'value',
							title: 'Phone Number or URL',
							description: 'E.g. +1234567890 or https://wa.me/...',
							type: 'string',
						}),
						defineField({
							name: 'icon',
							title: 'Custom Icon (Optional)',
							type: 'image',
						}),
						defineField({
							name: 'isActive',
							title: 'Active',
							type: 'boolean',
							initialValue: true,
						}),
						defineField({
							name: 'pulse',
							title: 'Pulse Animation',
							type: 'boolean',
							initialValue: true,
						}),
					],
					preview: {
						select: { title: 'label', subtitle: 'value', active: 'isActive' },
						prepare({ title, subtitle, active }) {
							return {
								title: title || 'Contact Button',
								subtitle: `${active ? '🟢 Active' : '⚪ Disabled'} - ${subtitle || ''}`,
							}
						},
					},
				},
			],
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Floating Widgets & Contact',
			subtitle: 'Speed Dial & Quick Contact Buttons',
		}),
	},
})
