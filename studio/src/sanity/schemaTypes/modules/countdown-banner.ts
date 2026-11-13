import { defineField, defineType } from 'sanity'
import { CalendarIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'countdown-banner',
	title: 'Countdown Banner',
	description: 'Urgency countdown timer with deadline date, action copy, and instant checkout CTA.',
	type: 'object',
	icon: CalendarIcon,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'offerCopy',
			title: 'Offer & Promotional Messaging',
			options: { columns: 1 },
		},
		{
			name: 'timerSchedule',
			title: 'Countdown Schedule & Mode',
			options: { columns: 1 },
		},
		{
			name: 'scarcityProof',
			title: 'Scarcity & Social Proof',
			options: { columns: 1 },
		},
		{
			name: 'callToAction',
			title: 'Call to Action Button & Guarantee',
			options: { columns: 1 },
		},
		{
			name: 'expiredHandling',
			title: 'Post-Deadline / Expiration Behavior',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- Group: Content / Fieldset: offerCopy ---
		defineField({
			name: 'badge',
			title: 'Urgency Badge',
			description: 'Short attention-grabbing tag (e.g. "LIMITED TIME OFFER" or "FLASH SALE"). Leave blank to hide.',
			type: 'string',
			initialValue: 'LIMITED TIME OFFER',
			group: 'content',
			fieldset: 'offerCopy',
		}),
		defineField({
			name: 'headline',
			title: 'Promotional Headline',
			description: 'Main high-converting value proposition headline.',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: 'Special Launch Offer — Save Up To 40% Today',
			group: 'content',
			fieldset: 'offerCopy',
		}),
		defineField({
			name: 'subheadline',
			title: 'Offer Description & Terms',
			description: 'Clear summary of the discount, deadline, or terms of the promotion.',
			type: 'text',
			rows: 2,
			initialValue:
				'Claim your exclusive introductory discount before the promotional period ends. Pricing automatically increases once timer hits zero.',
			group: 'content',
			fieldset: 'offerCopy',
		}),

		// --- Group: Content / Fieldset: timerSchedule ---
		defineField({
			name: 'countdownType',
			title: 'Countdown Mode',
			description: 'Choose whether the timer counts down to a specific calendar deadline or runs an evergreen rolling timer per visitor.',
			type: 'string',
			options: {
				list: [
					{ title: 'Specific End Date & Time (Calendar Deadline)', value: 'fixed' },
					{ title: 'Evergreen Rolling Timer (Personalized per visitor)', value: 'evergreen' },
				],
				layout: 'radio',
			},
			initialValue: 'fixed',
			group: 'content',
			fieldset: 'timerSchedule',
		}),
		defineField({
			name: 'targetDate',
			title: 'Target Deadline (Date & Time)',
			description: 'Exact date and time when offer officially expires (used in "Specific End Date" mode).',
			type: 'datetime',
			hidden: ({ parent }) => parent?.countdownType === 'evergreen',
			group: 'content',
			fieldset: 'timerSchedule',
		}),
		defineField({
			name: 'fallbackHours',
			title: 'Evergreen Timer Duration (Hours)',
			description:
				'Hours to count down per visitor. Persists across browser refreshes so return visitors see their remaining time.',
			type: 'number',
			initialValue: 48,
			validation: (Rule) => Rule.min(1).max(720),
			group: 'content',
			fieldset: 'timerSchedule',
		}),

		// --- Group: Content / Fieldset: scarcityProof ---
		defineField({
			name: 'urgencyNote',
			title: 'Scarcity Social Proof Note',
			description: 'E.g., "Only 8 packages remaining at launch pricing" or "Over 85% of batch claimed"',
			type: 'string',
			initialValue: 'Only 8 packages remaining at launch pricing',
			group: 'content',
			fieldset: 'scarcityProof',
		}),
		defineField({
			name: 'showProgressBar',
			title: 'Show Stock / Quota Progress Bar',
			description: 'Enable an animated progress bar showing remaining units or percentage sold.',
			type: 'boolean',
			initialValue: false,
			group: 'content',
			fieldset: 'scarcityProof',
		}),
		defineField({
			name: 'stockRemaining',
			title: 'Remaining Units',
			description: 'Current remaining inventory for this deal (e.g. 8).',
			type: 'number',
			initialValue: 8,
			hidden: ({ parent }) => !parent?.showProgressBar,
			group: 'content',
			fieldset: 'scarcityProof',
		}),
		defineField({
			name: 'stockTotal',
			title: 'Total Quota / Batch Size',
			description: 'Total allocation size used to calculate percentage (e.g. 50).',
			type: 'number',
			initialValue: 50,
			hidden: ({ parent }) => !parent?.showProgressBar,
			group: 'content',
			fieldset: 'scarcityProof',
		}),

		// --- Group: Content / Fieldset: callToAction ---
		defineField({
			name: 'ctaText',
			title: 'CTA Button Label',
			description: 'Action-oriented button text (e.g. "Claim This Deal Now").',
			type: 'string',
			initialValue: 'Claim This Deal Now',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'ctaLink',
			title: 'CTA Link Destination',
			description: 'Anchor link (e.g. "#lead-form" or "#products") or internal/external URL.',
			type: 'string',
			initialValue: '#lead-form',
			group: 'content',
			fieldset: 'callToAction',
		}),
		defineField({
			name: 'ctaSubtext',
			title: 'Subtext Below CTA',
			description: 'Reassurance note (e.g. "Instant confirmation • 30-day money-back guarantee").',
			type: 'string',
			initialValue: 'Instant confirmation • 30-day money-back guarantee',
			group: 'content',
			fieldset: 'callToAction',
		}),

		// --- Tab 2: Design ---
		defineField({
			name: 'layout',
			title: 'Layout Style',
			description: 'Choose how the countdown banner is structured on the page.',
			type: 'string',
			options: {
				list: [
					{ title: 'Featured Hero Card (Stacked Centered — High Visual Impact)', value: 'card' },
					{ title: 'Split Banner (Side-by-Side: Text on left, Timer & CTA on right)', value: 'split' },
					{ title: 'Compact Strip (Slim Horizontal Bar — Ideal for Section Breaks)', value: 'strip' },
				],
			},
			initialValue: 'card',
			group: 'design',
		}),
		defineField({
			name: 'themeStyle',
			title: 'Color Theme Style',
			description: 'Visual palette for the banner background, timer boxes, and accent badges.',
			type: 'string',
			options: {
				list: [
					{ title: 'Brand Dynamic (Blue / Indigo Gradient)', value: 'brand' },
					{ title: 'Urgent Flame (Amber / Red High Scarcity)', value: 'urgent' },
					{ title: 'Dark Elegance (Black / Charcoal)', value: 'dark' },
					{ title: 'Clean Light (Bordered White Surface)', value: 'light' },
					{ title: 'Store Accent (Warm Conversion CTA Palette)', value: 'accent' },
				],
			},
			initialValue: 'brand',
			group: 'design',
		}),

		// --- Tab 3: Settings / Fieldset: expiredHandling ---
		defineField({
			name: 'expiredAction',
			title: 'When Countdown Expires',
			description: 'Action to take when the countdown timer reaches zero.',
			type: 'string',
			options: {
				list: [
					{ title: 'Show Expiration Notice (Keep banner, disable/replace CTA)', value: 'show_message' },
					{ title: 'Hide Module Completely', value: 'hide' },
					{ title: 'Restart Evergreen Countdown (Rolling timer fallback)', value: 'evergreen_fallback' },
				],
				layout: 'radio',
			},
			initialValue: 'show_message',
			group: 'settings',
			fieldset: 'expiredHandling',
		}),
		defineField({
			name: 'expiredMessage',
			title: 'Expiration Notice Text',
			description: 'Message shown to visitors when the promotion deadline has passed.',
			type: 'string',
			initialValue: 'This promotional offer has officially concluded. Stay tuned for our next seasonal event!',
			hidden: ({ parent }) =>
				parent?.expiredAction === 'hide' || parent?.expiredAction === 'evergreen_fallback',
			group: 'settings',
			fieldset: 'expiredHandling',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'countdown-banner',
		icon: CalendarIcon,
		titleFields: ['headline', 'badge'],
		select: {
			badge: 'badge',
			theme: 'themeStyle',
			layout: 'layout',
			mode: 'countdownType',
		},
		metadata: (doc) => [
			doc.theme ? `Theme: ${doc.theme}` : null,
			doc.layout ? `Layout: ${doc.layout}` : null,
			doc.mode === 'evergreen' ? 'Evergreen' : 'Fixed Deadline',
			doc.badge || null,
		],
	}),
})
