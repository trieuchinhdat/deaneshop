import { defineField, defineType } from 'sanity'
import { FeedbackIcon } from '@sanity/icons'
import { getBlockText } from '@shared/content-utils'

export default defineType({
	name: 'quote',
	title: 'Testimonial & Press Quote',
	type: 'document',
	icon: FeedbackIcon,
	fieldsets: [
		{
			name: 'contentGroup',
			title: 'Quote & Feedback Content',
			options: { collapsible: false },
		},
		{
			name: 'attributionGroup',
			title: 'Author & Company Details',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'trustGroup',
			title: 'Trust Badges & Verification',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'videoGroup',
			title: 'Video Review / UGC Clip (Optional)',
			options: { collapsible: true, collapsed: true },
		},
		{
			name: 'mediaGroup',
			title: 'Publication Logo & Source Link',
			options: { collapsible: true, collapsed: false },
		},
	],
	fields: [
		defineField({
			name: 'endorsementType',
			title: 'Endorsement Category',
			description:
				'Classifies this testimonial for audience segmentation and category filtering.',
			type: 'string',
			fieldset: 'contentGroup',
			options: {
				list: [
					{
						title: 'Press & Media Feature (Vogue, Forbes, GQ, Elle)',
						value: 'press',
					},
					{ title: 'Featured Customer / Verified VIP', value: 'customer' },
					{
						title: 'Industry Expert / Sustainability Ambassador',
						value: 'expert',
					},
					{ title: 'Commercial Brand Partner / B2B Client', value: 'partner' },
				],
				layout: 'radio',
			},
			initialValue: 'press',
		}),
		defineField({
			name: 'headline',
			title: 'Quote Headline / Summary Hook (Optional)',
			description:
				'Short impactful summary of the feedback, e.g. "Outstanding durability and seamless delivery"',
			type: 'string',
			fieldset: 'contentGroup',
		}),
		defineField({
			name: 'quote',
			title: 'Quote / Testimonial Statement',
			description:
				'The core review or endorsement statement from the client or publication.',
			type: 'array',
			of: [{ type: 'block' }],
			validation: (Rule) =>
				Rule.required().error('Quote statement is required.'),
			fieldset: 'contentGroup',
		}),
		defineField({
			name: 'rating',
			title: 'Rating (1 - 5 Stars)',
			description:
				'Select the star rating awarded by the reviewer. Defaults to 5 stars.',
			type: 'number',
			fieldset: 'contentGroup',
			options: {
				list: [
					{ title: '⭐⭐⭐⭐⭐ (5 Stars - Exceptional)', value: 5 },
					{ title: '⭐⭐⭐⭐ (4 Stars - Very Good)', value: 4 },
					{ title: '⭐⭐⭐ (3 Stars - Good)', value: 3 },
					{ title: 'No Stars (Hidden / Editorial Quote)', value: 0 },
				],
			},
			initialValue: 5,
		}),
		defineField({
			name: 'author',
			title: 'Author & Attribution',
			description:
				'Identity of the person or entity providing this testimonial.',
			type: 'object',
			fieldset: 'attributionGroup',
			fields: [
				defineField({
					name: 'name',
					title: 'Author Name / Source',
					description:
						'Full name of reviewer, or leave blank if representing a publication brand.',
					type: 'string',
				}),
				defineField({
					name: 'title',
					title: 'Role / Designation',
					description:
						'E.g., Senior Fashion Editor, Head of Procurement, or Verified VIP',
					type: 'string',
				}),
				defineField({
					name: 'company',
					title: 'Publication / Company Name',
					description: 'E.g., British Vogue, Kensington Living, or Aura Studio',
					type: 'string',
				}),
				defineField({
					name: 'country',
					title: 'Location / Region',
					description: 'E.g., London, UK or New York, NY',
					type: 'string',
				}),
				defineField({
					name: 'image',
					title: 'Author Avatar / Headshot',
					description:
						'High-res square portrait photo. Displays as a circular avatar.',
					type: 'image',
					options: { hotspot: true },
				}),
			],
		}),
		defineField({
			name: 'verifiedBuyer',
			title: 'Verified Buyer / Endorsement Status',
			description:
				'Show a verified badge pill on this card to bolster buyer confidence.',
			type: 'boolean',
			initialValue: true,
			fieldset: 'trustGroup',
		}),
		defineField({
			name: 'verifiedBadgeText',
			title: 'Verified Badge Text',
			description:
				'Custom badge label, e.g. "Verified Buyer", "Editorial Review", or "Commercial Client"',
			type: 'string',
			initialValue: 'Verified Buyer',
			fieldset: 'trustGroup',
			hidden: ({ parent }) => !parent?.verifiedBuyer,
		}),
		defineField({
			name: 'date',
			title: 'Review Date / Timestamp (Optional)',
			description: 'E.g., "2 days ago", "1 week ago", or "October 2026"',
			type: 'string',
			fieldset: 'trustGroup',
		}),
		defineField({
			name: 'videoUrl',
			title: 'Video Review URL',
			description:
				'Link to video review on YouTube, TikTok, Vimeo, or direct MP4 stream.',
			type: 'url',
			fieldset: 'videoGroup',
		}),
		defineField({
			name: 'videoThumbnail',
			title: 'Video Poster / Custom Thumbnail',
			description:
				'Custom video poster image displayed on the card with a play overlay button.',
			type: 'image',
			options: { hotspot: true },
			fieldset: 'videoGroup',
			hidden: ({ parent }) => !parent?.videoUrl,
		}),
		defineField({
			name: 'videoDuration',
			title: 'Video Duration (Optional)',
			description: 'E.g., "0:45" or "1:20"',
			type: 'string',
			fieldset: 'videoGroup',
			hidden: ({ parent }) => !parent?.videoUrl,
		}),
		defineField({
			name: 'mediaLogo',
			title: 'Media / Publication Logo (Optional)',
			description:
				'Monochrome SVG or transparent PNG logo of the publication or brand. Displayed prominently on the card.',
			type: 'image',
			options: { hotspot: true },
			fieldset: 'mediaGroup',
		}),
		defineField({
			name: 'sourceUrl',
			title: 'Original Source Article / Review URL (Optional)',
			description:
				'Direct link to read the original press review or feature article on the external website.',
			type: 'url',
			fieldset: 'mediaGroup',
		}),
	],
	preview: {
		select: {
			quote: 'quote',
			headline: 'headline',
			author: 'author',
			mediaLogo: 'mediaLogo',
			rating: 'rating',
			endorsementType: 'endorsementType',
		},
		prepare: ({
			quote,
			headline,
			author,
			mediaLogo,
			rating,
			endorsementType,
		}) => {
			const typeLabel =
				{
					press: 'Press',
					customer: 'Customer',
					expert: 'Expert',
					partner: 'Partner',
				}[endorsementType as string] || 'Review'

			const stars = rating && rating > 0 ? '★'.repeat(rating) : ''
			const titleText = headline || getBlockText(quote) || 'Quote'
			const authorDetails = [author?.name, author?.company || author?.title]
				.filter(Boolean)
				.join(' • ')

			return {
				title: titleText,
				subtitle: [typeLabel, stars, authorDetails].filter(Boolean).join(' | '),
				media: mediaLogo?.asset || author?.image?.asset,
			}
		},
	},
})
