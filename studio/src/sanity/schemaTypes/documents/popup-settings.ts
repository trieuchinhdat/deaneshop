import { defineField, defineType } from 'sanity'
import { VscMegaphone } from 'react-icons/vsc'

export default defineType({
	name: 'popup-settings',
	title: 'Popup Marketing Settings',
	type: 'document',
	icon: VscMegaphone,

	// 1. Strategic 3-Tab Architecture
	groups: [
		{ name: 'triggers', title: 'Triggers & Targeting', default: true },
		{ name: 'content', title: 'Content & Lead Form' },
		{ name: 'banner', title: 'Banner Graphics & CTA' },
	],

	// 2. Single-column collapsible fieldsets
	fieldsets: [
		{
			name: 'campaignRules',
			title: 'Campaign Intent & Display Mode',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'triggerEvents',
			title: 'Trigger Conditions & Visitor Targeting',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'leadFormContent',
			title: 'Lead Capture Form & Messaging',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'couponReward',
			title: 'Incentive Coupon & Success Response',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'bannerAssets',
			title: 'Banner Imagery & Container Style',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'bannerCta',
			title: 'Destination Link & Action Button',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: TRIGGERS & TARGETING ==================== */
		defineField({
			name: 'isActive',
			title: 'Enable Popup Campaign',
			description: 'Master toggle to activate or pause this promotional modal.',
			type: 'boolean',
			initialValue: false,
			group: 'triggers',
			fieldset: 'campaignRules',
		}),
		defineField({
			name: 'campaignGoal',
			title: 'Campaign Objective',
			description: 'Select the marketing objective for this modal.',
			type: 'string',
			options: {
				list: [
					{ title: 'Lead Capture & Community (Newsletter / Welcome Access)', value: 'lead_capture' },
					{ title: 'Announcement & Drop (Image Banner + Direct Link)', value: 'announcement' },
					{ title: 'Special Promotion (Campaign / Seasonal Sale)', value: 'promotion' },
				],
				layout: 'radio',
			},
			initialValue: 'lead_capture',
			group: 'triggers',
			fieldset: 'campaignRules',
		}),
		defineField({
			name: 'type',
			title: 'Display Mode',
			description: 'Select the popup presentation layout.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Form with Banner Background (Lead Generation)',
						value: 'form',
					},
					{
						title: 'Banner Only (Graphic or Transparent Die-Cut Banner)',
						value: 'banner',
					},
				],
				layout: 'radio',
			},
			initialValue: 'form',
			group: 'triggers',
			fieldset: 'campaignRules',
		}),

		defineField({
			name: 'targetPages',
			title: 'Target Pages',
			description: 'Choose which storefront pages will display this popup.',
			type: 'string',
			options: {
				list: [
					{ title: 'Entire Website (All Pages)', value: 'all' },
					{ title: 'Homepage Only', value: 'home' },
					{ title: 'Products & Collections Only', value: 'products' },
				],
				layout: 'radio',
			},
			initialValue: 'all',
			group: 'triggers',
			fieldset: 'triggerEvents',
		}),
		defineField({
			name: 'triggerType',
			title: 'Trigger Event',
			description: 'How and when the popup triggers for visitors.',
			type: 'string',
			options: {
				list: [
					{ title: 'Time Delay (Show after X seconds)', value: 'delay' },
					{ title: 'Scroll Depth (Show when scrolled X%)', value: 'scroll' },
					{ title: 'Exit-Intent (When cursor moves to exit - Desktop)', value: 'exit-intent' },
				],
				layout: 'radio',
			},
			initialValue: 'delay',
			group: 'triggers',
			fieldset: 'triggerEvents',
		}),
		defineField({
			name: 'delaySeconds',
			title: 'Delay Duration (Seconds)',
			description: 'Seconds to wait before displaying (Recommended: 3–6s).',
			type: 'number',
			initialValue: 4,
			placeholder: '4',
			validation: (Rule) => Rule.min(0).max(120),
			hidden: ({ parent }) => parent?.triggerType !== 'delay',
			group: 'triggers',
			fieldset: 'triggerEvents',
		}),
		defineField({
			name: 'scrollPercentage',
			title: 'Scroll Depth Threshold (%)',
			description: 'Percentage of page scroll depth required to trigger.',
			type: 'number',
			initialValue: 35,
			placeholder: '35',
			validation: (Rule) => Rule.min(10).max(90),
			hidden: ({ parent }) => parent?.triggerType !== 'scroll',
			group: 'triggers',
			fieldset: 'triggerEvents',
		}),
		defineField({
			name: 'frequencyDays',
			title: 'Dismissal Cooldown (Days)',
			description: 'Days to hide popup after visitor closes it (0 = show once per session).',
			type: 'number',
			initialValue: 3,
			placeholder: '3',
			validation: (Rule) => Rule.min(0).max(90),
			group: 'triggers',
			fieldset: 'triggerEvents',
		}),

		/* ==================== TAB 2: CONTENT & LEAD FORM ==================== */
		defineField({
			name: 'formBadge',
			title: 'Header Pill Badge (Optional)',
			placeholder: 'e.g. EXCLUSIVE ACCESS / VIP OFFER',
			type: 'string',
			initialValue: 'EXCLUSIVE ACCESS',
			group: 'content',
			fieldset: 'leadFormContent',
		}),
		defineField({
			name: 'formTitle',
			title: 'Headline',
			placeholder: 'e.g. Join the Community & Enjoy 10% Off',
			type: 'string',
			initialValue: 'Join the Community & Enjoy 10% Off',
			group: 'content',
			fieldset: 'leadFormContent',
		}),
		defineField({
			name: 'formDescription',
			title: 'Description',
			placeholder: 'e.g. Subscribe for exclusive collection drops, conscious living insights, and private member offers.',
			type: 'text',
			rows: 2,
			initialValue: 'Subscribe for exclusive collection drops, conscious living inspiration, and special member access.',
			group: 'content',
			fieldset: 'leadFormContent',
		}),
		defineField({
			name: 'formFields',
			title: 'Fields to Collect',
			type: 'string',
			options: {
				list: [
					{ title: 'Email Only (Highest Conversion — Recommended)', value: 'email' },
					{ title: 'Both Email & Phone', value: 'both' },
					{ title: 'Full (Name + Email + Phone)', value: 'full' },
				],
				layout: 'radio',
			},
			initialValue: 'email',
			hidden: ({ parent }) => parent?.type !== 'form',
			group: 'content',
			fieldset: 'leadFormContent',
		}),
		defineField({
			name: 'formSubmitLabel',
			title: 'Submit Button Label',
			placeholder: 'e.g. Subscribe & Get Access',
			type: 'string',
			initialValue: 'Subscribe & Get Access',
			hidden: ({ parent }) => parent?.type !== 'form',
			group: 'content',
			fieldset: 'leadFormContent',
		}),
		defineField({
			name: 'consentText',
			title: 'GDPR / Privacy Consent Note',
			description: 'Compliance disclaimer shown beneath the form submission button.',
			type: 'string',
			initialValue: 'By subscribing, you agree to our Privacy Policy and consent to receive updates.',
			hidden: ({ parent }) => parent?.type !== 'form',
			group: 'content',
			fieldset: 'leadFormContent',
		}),

		defineField({
			name: 'rewardCouponCode',
			title: 'Optional Reward Coupon Code',
			description: 'Leave empty if this campaign does not provide a coupon code.',
			placeholder: 'e.g. WELCOME10',
			type: 'string',
			group: 'content',
			fieldset: 'couponReward',
		}),
		defineField({
			name: 'successTitle',
			title: 'Success Modal Heading',
			placeholder: 'e.g. Welcome to the Community',
			type: 'string',
			initialValue: 'Welcome to the Community',
			hidden: ({ parent }) => parent?.type !== 'form',
			group: 'content',
			fieldset: 'couponReward',
		}),
		defineField({
			name: 'successDescription',
			title: 'Success Modal Description',
			placeholder: 'e.g. Thank you for subscribing. We have sent a welcome note to your inbox.',
			type: 'text',
			rows: 2,
			initialValue: 'Thank you for subscribing. We have sent a welcome note to your inbox.',
			hidden: ({ parent }) => parent?.type !== 'form',
			group: 'content',
			fieldset: 'couponReward',
		}),

		/* ==================== TAB 3: BANNER GRAPHICS & CTA ==================== */
		defineField({
			name: 'bannerImage',
			title: 'Desktop Banner Graphic',
			description: 'Recommended: 900 × 600 px (3:2) or 800 × 500 px (16:10), WebP/PNG < 350 KB.',
			type: 'image',
			options: { hotspot: true },
			group: 'banner',
			fieldset: 'bannerAssets',
		}),
		defineField({
			name: 'mobileBannerImage',
			title: 'Mobile Banner Graphic (Optional)',
			description: 'Recommended: 600 × 750 px (4:5) or 600 × 600 px (1:1), WebP/PNG < 200 KB.',
			type: 'image',
			options: { hotspot: true },
			group: 'banner',
			fieldset: 'bannerAssets',
		}),
		defineField({
			name: 'transparentBackground',
			title: 'Frameless / Die-Cut Transparent Artwork',
			description: 'Removes outer card container to render transparent PNG/WebP graphics seamlessly.',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.type !== 'banner',
			group: 'banner',
			fieldset: 'bannerAssets',
		}),

		defineField({
			name: 'bannerCtaUrl',
			title: 'Destination URL (Banner Click / Post-Submission)',
			description: 'Target page when visitors click the banner or post-submission CTA (e.g. /collections/all).',
			placeholder: 'e.g. /collections/all or /products/...',
			type: 'string',
			group: 'banner',
			fieldset: 'bannerCta',
		}),
		defineField({
			name: 'bannerCtaText',
			title: 'Action Button Label',
			placeholder: 'e.g. Explore Collection',
			type: 'string',
			initialValue: 'Explore Collection',
			group: 'banner',
			fieldset: 'bannerCta',
		}),
	],

	preview: {
		select: {
			isActive: 'isActive',
			type: 'type',
			formTitle: 'formTitle',
		},
		prepare({ isActive, type, formTitle }) {
			return {
				title: formTitle || 'Popup Marketing Modal',
				subtitle: `${isActive ? '🟢 Active' : '⚪ Inactive'} • Mode: ${type === 'form' ? 'Lead Capture Form' : 'Banner Only'}`,
			}
		},
	},
})
