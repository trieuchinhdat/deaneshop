import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'site',
	title: 'Branding & Business Profile',
	type: 'document',
	groups: [
		{ name: 'branding', title: '1. Branding & Global SEO', default: true },
		{ name: 'business', title: '2. Business Profile & Contact' },
	],
	fields: [
		// ================= GROUP 1: BRANDING & GLOBAL SEO =================
		defineField({
			name: 'title',
			title: 'Website Title',
			description:
				'Primary title of the website used for branding, headers, and meta titles.',
			type: 'string',
			validation: (Rule) => Rule.required(),
			group: 'branding',
		}),
		defineField({
			name: 'siteName',
			title: 'Site Short Name',
			description:
				'Short brand name used for App / PWA Manifest / Schema Organization.',
			type: 'string',
			group: 'branding',
		}),
		defineField({
			name: 'logo',
			title: 'Website Logo',
			type: 'logo',
			group: 'branding',
		}),
		defineField({
			name: 'favicon',
			title: 'Favicon (.ico / .png / .svg)',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
		}),
		defineField({
			name: 'appleTouchIcon',
			title: 'Apple Touch Icon (iOS Safari)',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
		}),
		defineField({
			name: 'defaultSeoDescription',
			title: 'Default Meta Description',
			description:
				'Fallback search engine description when individual pages do not specify SEO description.',
			type: 'text',
			rows: 3,
			group: 'branding',
		}),
		defineField({
			name: 'defaultOgImage',
			title: 'Default Social Share Image (OG Image)',
			description:
				'Fallback image displayed when sharing links on social media (Facebook, X, LinkedIn, etc.).',
			type: 'image',
			options: { hotspot: true },
			group: 'branding',
		}),
		defineField({
			name: 'googleSiteVerification',
			title: 'Google Search Console Verification Code',
			placeholder: 'google-site-verification-code',
			type: 'string',
			group: 'branding',
		}),

		// ================= GROUP 2: BUSINESS PROFILE =================
		defineField({
			name: 'companyName',
			title: 'Legal Business / Company Name',
			description:
				'Used for invoices, legal footer notices, and Schema Organization.',
			type: 'string',
			group: 'business',
		}),
		defineField({
			name: 'hotline',
			title: 'Customer Service Phone / Hotline',
			type: 'string',
			group: 'business',
		}),
		defineField({
			name: 'email',
			title: 'Support Email Address',
			type: 'string',
			group: 'business',
		}),
		defineField({
			name: 'address',
			title: 'Business Address / Showroom',
			type: 'text',
			rows: 2,
			group: 'business',
		}),
		defineField({
			name: 'taxCode',
			title: 'Tax Identification Number (VAT/EIN)',
			type: 'string',
			group: 'business',
		}),
		defineField({
			name: 'workingHours',
			title: 'Business Hours',
			placeholder: 'Mon - Sun: 8:00 AM - 9:00 PM',
			type: 'string',
			group: 'business',
		}),
		defineField({
			name: 'socialLinks',
			title: 'Official Social Media Links',
			description:
				'Used for Footer display and Google Schema Organization structured data (sameAs).',
			type: 'array',
			group: 'business',
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
									{ title: 'WhatsApp / Zalo', value: 'zalo' },
									{ title: 'Other', value: 'other' },
								],
							},
						}),
						defineField({
							name: 'title',
							title: 'Display Title',
							type: 'string',
						}),
						defineField({
							name: 'url',
							title: 'Profile URL',
							type: 'url',
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
			title: 'Branding & Business Profile',
			subtitle: 'Logo, SEO, Contact & Social Links',
		}),
	},
})
