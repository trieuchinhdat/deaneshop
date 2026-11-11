import { defineField, defineType } from 'sanity'
import { VscGlobe } from 'react-icons/vsc'
import React from 'react'
import CharacterCount from '@/sanity/ui/character-count'

export default defineType({
	name: 'site',
	title: 'Brand & Business Profile',
	type: 'document',
	icon: VscGlobe,

	// 1. Strategic 3-Tab Architecture
	groups: [
		{ name: 'branding', title: 'Branding & Global SEO', default: true },
		{ name: 'campaign', title: 'Campaign Home Override' },
		{ name: 'business', title: 'Business Profile & Contact' },
	],

	// 2. Single-column layout with collapsible fieldsets
	fieldsets: [
		{
			name: 'brandIdentity',
			title: 'Brand Identity & Core Logos',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'globalSeo',
			title: 'Search Engine & Social Graph Defaults',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'campaignControl',
			title: 'Campaign Homepage Override Engine',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'legalCompany',
			title: 'Legal Business Identity & Tax',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'contactChannels',
			title: 'Customer Service & Contact Details',
			options: { collapsible: true, collapsed: false },
		},
	],

	fields: [
		/* ==================== TAB 1: BRANDING & GLOBAL SEO ==================== */
		defineField({
			name: 'title',
			title: 'Storefront Brand Title',
			description: 'Primary title of the website used for branding, headers, and meta titles.',
			type: 'string',
			placeholder: 'e.g. DeanFlow — High-Performance Commerce Platform',
			validation: (Rule) => Rule.required(),
			group: 'branding',
			fieldset: 'brandIdentity',
		}),
		defineField({
			name: 'siteName',
			title: 'Short Brand Name',
			description: 'Short brand name used for App / PWA Manifest / Schema Organization.',
			type: 'string',
			placeholder: 'e.g. DeanFlow',
			group: 'branding',
			fieldset: 'brandIdentity',
		}),
		defineField({
			name: 'logo',
			title: 'Website Logo',
			type: 'logo',
			group: 'branding',
			fieldset: 'brandIdentity',
		}),
		defineField({
			name: 'favicon',
			title: 'Favicon (.ico / .png / .svg)',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
			fieldset: 'brandIdentity',
		}),
		defineField({
			name: 'appleTouchIcon',
			title: 'Apple Touch Icon (iOS Safari)',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
			fieldset: 'brandIdentity',
		}),

		defineField({
			name: 'defaultSeoDescription',
			title: 'Default Meta Description',
			description:
				'Fallback search engine description when individual pages do not specify SEO description. Optimal SEO & GEO range: 150–200 characters.',
			type: 'text',
			rows: 3,
			placeholder:
				'e.g. Discover sustainably crafted essentials for modern, conscious living. Worldwide carbon-neutral shipping.',
			validation: (Rule) =>
				Rule.max(200).warning('Descriptions longer than 200 characters may be truncated in search snippets.'),
			components: {
				input: (props: any) =>
					React.createElement(CharacterCount, {
						as: 'textarea',
						min: 150,
						max: 200,
						...props,
					}),
			},
			group: 'branding',
			fieldset: 'globalSeo',
		}),
		defineField({
			name: 'defaultOgImage',
			title: 'Default Social Share Graphic (OG Image)',
			description: 'Fallback image displayed when sharing links on social media (Facebook, X, LinkedIn, etc.).',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
			fieldset: 'globalSeo',
		}),
		defineField({
			name: 'googleSiteVerification',
			title: 'Google Search Console Verification Token',
			placeholder: 'e.g. google-site-verification-token',
			type: 'string',
			group: 'branding',
			fieldset: 'globalSeo',
		}),

		/* ==================== TAB 2: CAMPAIGN HOME OVERRIDE ==================== */
		defineField({
			name: 'campaignHomeEnabled',
			title: 'Activate Campaign Home Override',
			description: 'When enabled, temporarily serves a promotional landing page on the homepage (/) while keeping the exact same URL.',
			type: 'boolean',
			initialValue: false,
			group: 'campaign',
			fieldset: 'campaignControl',
		}),
		defineField({
			name: 'campaignHomePage',
			title: 'Campaign Landing Page',
			description: 'Select the landing page to feature as the active homepage during this campaign.',
			type: 'reference',
			to: [{ type: 'page' }],
			hidden: ({ parent }) => !parent?.campaignHomeEnabled,
			validation: (Rule) =>
				Rule.custom((val, context) => {
					const parent = context.parent as any
					if (parent?.campaignHomeEnabled && !val) {
						return 'Please select a campaign landing page to override the homepage.'
					}
					return true
				}),
			group: 'campaign',
			fieldset: 'campaignControl',
		}),
		defineField({
			name: 'campaignStartDate',
			title: 'Automated Campaign Start Time (Optional)',
			description: 'Leave empty to activate immediately when toggled on.',
			type: 'datetime',
			hidden: ({ parent }) => !parent?.campaignHomeEnabled,
			group: 'campaign',
			fieldset: 'campaignControl',
		}),
		defineField({
			name: 'campaignEndDate',
			title: 'Automated Campaign Expiration Time (Optional)',
			description: 'When this time is reached, the homepage seamlessly reverts to the default base layout.',
			type: 'datetime',
			hidden: ({ parent }) => !parent?.campaignHomeEnabled,
			group: 'campaign',
			fieldset: 'campaignControl',
		}),
		defineField({
			name: 'keepOriginalSeo',
			title: 'Preserve Original Brand SEO Metadata',
			description: 'Recommended. Keeps the canonical brand title, description, and OG images so SEO ranking is unaffected.',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => !parent?.campaignHomeEnabled,
			group: 'campaign',
			fieldset: 'campaignControl',
		}),

		/* ==================== TAB 3: BUSINESS PROFILE ==================== */
		defineField({
			name: 'companyName',
			title: 'Legal Business / Corporate Name',
			description: 'Used for invoices, legal footer notices, and Schema Organization.',
			type: 'string',
			placeholder: 'e.g. DeanFlow Global Corp.',
			group: 'business',
			fieldset: 'legalCompany',
		}),
		defineField({
			name: 'taxCode',
			title: 'Tax Identification Number (VAT / EIN / Tax ID)',
			type: 'string',
			placeholder: 'e.g. US-123456789',
			group: 'business',
			fieldset: 'legalCompany',
		}),

		defineField({
			name: 'hotline',
			title: 'Customer Service Phone / Hotline',
			type: 'string',
			placeholder: 'e.g. +1 (800) 555-0199',
			group: 'business',
			fieldset: 'contactChannels',
		}),
		defineField({
			name: 'email',
			title: 'Official Support Email Address',
			type: 'string',
			placeholder: 'e.g. support@deanflow.com',
			group: 'business',
			fieldset: 'contactChannels',
		}),
		defineField({
			name: 'address',
			title: 'Headquarters / Showroom Address',
			type: 'text',
			rows: 2,
			placeholder: 'e.g. 548 Market St, Suite 12345, San Francisco, CA 94104',
			group: 'business',
			fieldset: 'contactChannels',
		}),
		defineField({
			name: 'workingHours',
			title: 'Business Hours',
			placeholder: 'e.g. Mon – Fri: 9:00 AM – 6:00 PM EST',
			type: 'string',
			group: 'business',
			fieldset: 'contactChannels',
		}),
		defineField({
			name: 'socialLinks',
			title: 'Official Social Media Profiles',
			description: 'Used for Footer social icons and Google Schema Organization structured data (sameAs).',
			type: 'array',
			group: 'business',
			fieldset: 'contactChannels',
			of: [
				{
					type: 'object',
					fields: [
						defineField({
							name: 'platform',
							title: 'Platform',
							type: 'string',
							options: {
								list: [
									{ title: 'Facebook', value: 'facebook' },
									{ title: 'Instagram', value: 'instagram' },
									{ title: 'X (Twitter)', value: 'twitter' },
									{ title: 'TikTok', value: 'tiktok' },
									{ title: 'YouTube', value: 'youtube' },
									{ title: 'LinkedIn', value: 'linkedin' },
									{ title: 'WhatsApp / Direct Chat', value: 'zalo' },
									{ title: 'Other', value: 'other' },
								],
							},
						}),
						defineField({
							name: 'title',
							title: 'Display Title',
							type: 'string',
							placeholder: 'e.g. Instagram',
						}),
						defineField({
							name: 'url',
							title: 'Profile URL',
							type: 'url',
							placeholder: 'https://instagram.com/deanflow',
						}),
					],
					preview: {
						select: { title: 'title', subtitle: 'url' },
					},
				},
			],
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Brand & Business Profile',
			subtitle: 'Logo, SEO, Legal Information & Contact Channels',
		}),
	},
})
