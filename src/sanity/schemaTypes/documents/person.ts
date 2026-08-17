import { defineField, defineType } from 'sanity'
import { UserIcon } from '@sanity/icons'

export default defineType({
	name: 'person',
	title: 'Author / Team Member',
	type: 'document',
	icon: UserIcon,
	fields: [
		defineField({
			name: 'name',
			title: 'Full Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'role',
			title: 'Professional Role / Job Title',
			description: 'e.g., Senior Editor, Dermatologist, Product Specialist (Google E-E-A-T Authority)',
			type: 'string',
		}),
		defineField({
			name: 'image',
			title: 'Avatar / Profile Photo',
			description:
				'Author avatar photo for E-E-A-T and article bylines. Recommended size: 400 × 400 px (1:1 square ratio, max 100 KB, WebP/PNG).',
			type: 'image',
			options: {
				hotspot: true,
			},
		}),
		defineField({
			name: 'shortBio',
			title: 'Short Biography',
			description: 'Brief author intro displayed at the footer of articles.',
			type: 'text',
			rows: 3,
		}),
		defineField({
			name: 'socialLinks',
			title: 'Author Social & Professional Profiles (sameAs Schema)',
			description: 'Verified profiles to establish authority with Google Search (e.g. LinkedIn, X, Website).',
			type: 'array',
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
									{ title: 'LinkedIn', value: 'linkedin' },
									{ title: 'X (Twitter)', value: 'twitter' },
									{ title: 'Website / Portfolio', value: 'website' },
									{ title: 'Instagram', value: 'instagram' },
									{ title: 'Facebook', value: 'facebook' },
									{ title: 'YouTube', value: 'youtube' },
								],
							},
						}),
						defineField({
							name: 'url',
							title: 'Profile URL',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {
							title: 'platform',
							subtitle: 'url',
						},
					},
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'name',
			subtitle: 'role',
			media: 'image',
		},
		prepare: ({ title, subtitle, media }) => ({
			title: title || 'Unnamed Author',
			subtitle: subtitle || 'Author',
			media,
		}),
	},
})
