import { defineField, defineType } from 'sanity'
import { VscCommentDiscussion } from 'react-icons/vsc'

export default defineType({
	name: 'widget-settings',
	title: 'Floating Contact Hub',
	type: 'document',
	icon: VscCommentDiscussion,

	// Strategic 4-Tab Architecture for Non-Technical Merchants
	groups: [
		{ name: 'general', title: 'General & Display', default: true },
		{ name: 'channels', title: 'Contact Channels' },
		{ name: 'appearance', title: 'Appearance & Position' },
		{ name: 'responsive', title: 'Mobile & Layout Clearance' },
	],

	fieldsets: [
		{
			name: 'hubMaster',
			title: 'Master Hub Control & Display Mode',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'channelsSection',
			title: 'Speed Dial Contact Channels',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'appearanceSection',
			title: 'Floating Hub Styling & Master Button',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'responsiveSection',
			title: 'Mobile Optimization & Position Clearance',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: GENERAL & DISPLAY ==================== */
		defineField({
			name: 'enabled',
			title: 'Enable Floating Contact Hub',
			description:
				'Master toggle to display or hide the Floating Contact Hub across the entire storefront.',
			type: 'boolean',
			initialValue: true,
			group: 'general',
			fieldset: 'hubMaster',
		}),
		defineField({
			name: 'displayMode',
			title: 'Hub Display Mode',
			description:
				'Choose between collapsing into 1 elegant Master FAB button (Speed Dial — Recommended for modern e-commerce) or displaying all contact buttons stacked vertically.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Expandable Speed Dial (Recommended — Clean single FAB that expands on click/tap)',
						value: 'expandable',
					},
					{
						title: 'Always-Expanded Stack (Show all active buttons stacked vertically)',
						value: 'stack',
					},
				],
				layout: 'radio',
			},
			initialValue: 'expandable',
			group: 'general',
			fieldset: 'hubMaster',
		}),
		defineField({
			name: 'deviceVisibility',
			title: 'Device Visibility',
			description: 'Choose which devices the Floating Contact Hub should be shown on.',
			type: 'string',
			options: {
				list: [
					{ title: 'All Devices (Desktop, Tablet & Mobile)', value: 'all' },
					{ title: 'Desktop & Tablet Only (Hide on Mobile)', value: 'desktop-only' },
					{ title: 'Mobile Only (Hide on Desktop/Tablet)', value: 'mobile-only' },
				],
				layout: 'radio',
			},
			initialValue: 'all',
			group: 'general',
			fieldset: 'hubMaster',
		}),
		defineField({
			name: 'triggerMode',
			title: 'Entrance & Visibility Timing',
			description:
				'Control when the floating button appears to visitors for an unobtrusive experience.',
			type: 'string',
			options: {
				list: [
					{
						title: 'After Slight Scroll (Appears once visitor scrolls down 100px — Recommended)',
						value: 'scroll',
					},
					{
						title: 'Immediate on Page Load (Always visible immediately)',
						value: 'immediate',
					},
					{
						title: 'Timed Delay (Smoothly fades in 2 seconds after page load)',
						value: 'delay',
					},
				],
			},
			initialValue: 'scroll',
			group: 'general',
			fieldset: 'hubMaster',
		}),

		/* ==================== TAB 2: CONTACT CHANNELS ==================== */
		defineField({
			name: 'floatingButtons',
			title: 'Contact Channels',
			description:
				'Configure quick communication options for your visitors (Phone, WhatsApp, Email, SMS, Messenger, etc.). Reorder items by dragging.',
			type: 'array',
			group: 'channels',
			fieldset: 'channelsSection',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'type',
							title: 'Communication Channel',
							description: 'Select the communication platform for this button.',
							type: 'string',
							options: {
								list: [
									{ title: 'Phone Call (Direct Hotline / Toll-free)', value: 'phone' },
									{ title: 'WhatsApp (Instant Chat)', value: 'whatsapp' },
									{ title: 'Email Support (Direct Inbox)', value: 'email' },
									{ title: 'SMS / Text Message (Mobile)', value: 'sms' },
									{ title: 'Facebook Messenger', value: 'messenger' },
									{ title: 'Instagram Direct', value: 'instagram' },
									{ title: 'Telegram Chat', value: 'telegram' },
									{ title: 'Custom Destination URL / Help Desk', value: 'custom' },
									{ title: 'Zalo (Vietnam Region)', value: 'zalo' },
								],
							},
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'label',
							title: 'Channel Label / Action Title',
							description:
								'Primary label displayed on the button or tooltip (e.g. "Call Hotline", "Chat on WhatsApp", "Email Sales Team").',
							type: 'string',
							placeholder: 'e.g. Chat on WhatsApp',
							validation: (Rule) =>
								Rule.required()
									.min(2)
									.max(45)
									.error('Label is required (2–45 characters).'),
						}),
						defineField({
							name: 'subtitle',
							title: 'Short Subtitle / Availability (Optional)',
							description:
								'Reassuring status text (e.g. "Usually replies in minutes", "Mon–Fri 9am–5pm EST", "Toll-free 24/7").',
							type: 'string',
							placeholder: 'e.g. Usually replies in 5m',
						}),
						defineField({
							name: 'value',
							title: 'Contact Value / Destination',
							description:
								'Phone number (e.g. +1 800 555 0199), Email (support@brand.com), WhatsApp number (+1234567890), username, or web URL.',
							type: 'string',
							placeholder: 'e.g. +1 800 555 0199 or support@brand.com',
							validation: (Rule) =>
								Rule.required().custom((val, context: any) => {
									if (!val) return 'Contact value or destination is required.'
									const channelType = context.parent?.type

									if (channelType === 'email') {
										const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
										const clean = val.replace(/^mailto:/i, '').trim()
										if (!emailRegex.test(clean)) {
											return 'Please enter a valid email address (e.g. support@domain.com).'
										}
									}

									if (channelType === 'phone' || channelType === 'sms') {
										const hasDigits = /\d{3,}/.test(val)
										if (!hasDigits) {
											return 'Please enter a valid phone number with digits (e.g. +1 800 555 0199).'
										}
									}

									return true
								}),
						}),
						defineField({
							name: 'icon',
							title: 'Custom Brand Icon (Optional)',
							description:
								'Upload a custom icon if you prefer your own branding over the official channel icon.',
							type: 'image',
						}),
						defineField({
							name: 'isActive',
							title: 'Active Channel',
							description: 'Turn off to temporarily hide this channel without deleting it.',
							type: 'boolean',
							initialValue: true,
						}),
						defineField({
							name: 'pulse',
							title: 'Highlight with Subtle Attention Pulse',
							description:
								'Subtly animate this button to emphasize primary conversion channels.',
							type: 'boolean',
							initialValue: false,
						}),
					],
					preview: {
						select: {
							title: 'label',
							subtitle: 'subtitle',
							value: 'value',
							type: 'type',
							active: 'isActive',
							pulse: 'pulse',
						},
						prepare({ title, subtitle, value, type, active, pulse }) {
							const typeLabels: Record<string, string> = {
								phone: '📞 Phone',
								whatsapp: '💬 WhatsApp',
								email: '✉️ Email',
								sms: '📱 SMS',
								messenger: '💬 Messenger',
								instagram: '📷 Instagram',
								telegram: '✈️ Telegram',
								custom: '🔗 Custom URL',
								zalo: '💬 Zalo',
							}
							const typeLabel = (type && typeLabels[type]) || '💬 Contact'
							const statusText = active === false ? '⚪ Inactive' : '🟢 Active'
							const pulseText = pulse ? ' • 🔥 Priority' : ''
							const sub = subtitle ? `${subtitle} (${value || ''})` : value || ''

							return {
								title: `${typeLabel} — ${title || 'Unnamed Channel'}`,
								subtitle: `${statusText}${pulseText} • ${sub}`,
							}
						},
					},
				},
			],
		}),

		/* ==================== TAB 3: APPEARANCE & POSITION ==================== */
		defineField({
			name: 'widgetPosition',
			title: 'Screen Position',
			description: 'Select which corner of the viewport the Floating Hub anchors to.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Bottom Right (E-Commerce Standard — Recommended)',
						value: 'bottom-right',
					},
					{
						title: 'Bottom Left (Alternative when right side has existing elements)',
						value: 'bottom-left',
					},
				],
				layout: 'radio',
			},
			initialValue: 'bottom-right',
			group: 'appearance',
			fieldset: 'appearanceSection',
		}),
		defineField({
			name: 'themeStyle',
			title: 'Visual Theme Preset',
			description: 'Style of the master floating action button and contact panel.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Brand Primary Accent (Uses primary color from Theme Settings)',
						value: 'primary',
					},
					{
						title: 'Dark Slate / Charcoal (Sophisticated, high-contrast modern look)',
						value: 'dark',
					},
					{
						title: 'Crisp Frosted White (Clean, minimal, light glassmorphism)',
						value: 'light',
					},
				],
			},
			initialValue: 'primary',
			group: 'appearance',
			fieldset: 'appearanceSection',
		}),
		defineField({
			name: 'mainButtonLabel',
			title: 'Master Button Label Pill',
			description:
				'Text badge displayed next to the main floating button on desktop (e.g. "Need Help?", "Chat with Us", "Contact Us"). Leave blank for icon-only button.',
			type: 'string',
			placeholder: 'e.g. Need Help?',
			initialValue: 'Need Help?',
			hidden: ({ parent }) => parent?.displayMode === 'stack',
			group: 'appearance',
			fieldset: 'appearanceSection',
		}),
		defineField({
			name: 'mainButtonIcon',
			title: 'Master Button Icon Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Chat Bubble (Default)', value: 'chat' },
					{ title: 'Telephone Receiver', value: 'phone' },
					{ title: 'Customer Support Headset', value: 'support' },
					{ title: 'Help & Question Mark', value: 'question' },
				],
			},
			initialValue: 'chat',
			hidden: ({ parent }) => parent?.displayMode === 'stack',
			group: 'appearance',
			fieldset: 'appearanceSection',
		}),
		defineField({
			name: 'onlineBadge',
			title: 'Show "Available / Active Now" Status Indicator',
			description:
				'Displays a subtle green live indicator dot on the master button to signal immediate response availability.',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => parent?.displayMode === 'stack',
			group: 'appearance',
			fieldset: 'appearanceSection',
		}),

		/* ==================== TAB 4: RESPONSIVE & LAYOUT CLEARANCE ==================== */
		defineField({
			name: 'bottomOffsetMobile',
			title: 'Mobile Bottom Spacing Clearance',
			description:
				'Prevent overlapping with Sticky Mobile CTA bar, bottom navigation, or cookies bar on small screens.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Clearance (16px + iOS safe-area-inset)',
						value: 'normal',
					},
					{
						title:
							'Avoid Sticky Mobile CTA (Lifted ~80px to safely clear bottom sticky order bar)',
						value: 'avoid-sticky-cta',
					},
					{
						title: 'High Clearance (Lifted ~120px for complex mobile footers)',
						value: 'high',
					},
					{
						title: 'Custom Offset (Flexible % / px / rem — Enter below)',
						value: 'custom',
					},
				],
			},
			initialValue: 'normal',
			group: 'responsive',
			fieldset: 'responsiveSection',
		}),
		defineField({
			name: 'customBottomOffsetMobile',
			title: 'Custom Mobile Bottom Offset (% / px / rem / vh)',
			description:
				'Enter a percentage (e.g. 10%, 15%) or length (e.g. 85px, 5.5rem). The system automatically combines your value with iOS safe-area insets.',
			type: 'string',
			placeholder: 'e.g. 12% or 85px',
			hidden: ({ parent }) => parent?.bottomOffsetMobile !== 'custom',
			validation: (Rule) =>
				Rule.custom((val, context: any) => {
					if (context.parent?.bottomOffsetMobile === 'custom' && !val?.trim()) {
						return 'Please enter a custom offset (e.g. 10%, 85px, or 5rem).'
					}
					return true
				}),
			group: 'responsive',
			fieldset: 'responsiveSection',
		}),
		defineField({
			name: 'bottomOffsetDesktop',
			title: 'Desktop Bottom Spacing Clearance',
			description: 'Adjust bottom clearance on desktop screens.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Clearance (24px)',
						value: 'normal',
					},
					{
						title: 'Custom Desktop Offset (Flexible % / px / rem — Enter below)',
						value: 'custom',
					},
				],
			},
			initialValue: 'normal',
			group: 'responsive',
			fieldset: 'responsiveSection',
		}),
		defineField({
			name: 'customBottomOffsetDesktop',
			title: 'Custom Desktop Bottom Offset (% / px / rem / vh)',
			description:
				'Enter a percentage (e.g. 5%, 8%) or length (e.g. 40px, 3rem) for desktop screens.',
			type: 'string',
			placeholder: 'e.g. 5% or 40px',
			hidden: ({ parent }) => parent?.bottomOffsetDesktop !== 'custom',
			validation: (Rule) =>
				Rule.custom((val, context: any) => {
					if (context.parent?.bottomOffsetDesktop === 'custom' && !val?.trim()) {
						return 'Please enter a custom desktop offset (e.g. 5% or 40px).'
					}
					return true
				}),
			group: 'responsive',
			fieldset: 'responsiveSection',
		}),
		defineField({
			name: 'mobileDisplayStyle',
			title: 'Mobile Channel Display Style',
			description: 'Controls how channel items appear when expanded on mobile devices.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Full Pill (Icon + Label + Subtitle — Recommended for clarity)',
						value: 'expanded',
					},
					{
						title: 'Compact Pill (Icon + Concise Title)',
						value: 'compact',
					},
				],
			},
			initialValue: 'expanded',
			group: 'responsive',
			fieldset: 'responsiveSection',
		}),
	],

	preview: {
		select: {
			enabled: 'enabled',
			position: 'widgetPosition',
			displayMode: 'displayMode',
			buttons: 'floatingButtons',
		},
		prepare({ enabled, position, displayMode, buttons }) {
			const activeCount =
				buttons?.filter((b: any) => b?.isActive !== false)?.length || 0
			const posText = position === 'bottom-left' ? 'Bottom Left' : 'Bottom Right'
			const modeText = displayMode === 'stack' ? 'Stack' : 'Speed Dial'
			const isOff = enabled === false

			return {
				title: 'Floating Contact Hub',
				subtitle: isOff
					? '⚪ Disabled Storewide'
					: `🟢 Active • ${activeCount} channels • ${posText} • ${modeText}`,
			}
		},
	},
})
