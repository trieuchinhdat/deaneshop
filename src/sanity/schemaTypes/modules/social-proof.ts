import { defineArrayMember, defineField, defineType } from 'sanity'
import { StarIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'social-proof',
	title: 'Verified Reviews',
	description:
		'Customer reviews, ratings, trust counter metrics, and verified buyer badges to maximize conversion rates.',
	type: 'object',
	icon: StarIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: '4.9/5 RATED BY 2,500+ VERIFIED BUYERS',
			badgeIcon: 'star',
			headline: 'Loved by Customers Across the US & UK',
			subtitle:
				'Real verified stories from individuals and commercial partners who trust our quality, delivery, and dedicated customer support.',
			headerAlignment: 'center',
			showTrustStats: true,
			trustStats: [
				{
					_key: genKey(),
					value: '4.9 / 5',
					label: 'Average Client Rating',
					sublabel: 'Over 2,500+ verified ratings',
				},
				{
					_key: genKey(),
					value: '10,000+',
					label: 'Orders Delivered',
					sublabel: 'Fast US & UK fulfillment',
				},
				{
					_key: genKey(),
					value: '99.4%',
					label: 'Satisfaction Rate',
					sublabel: 'Based on post-delivery surveys',
				},
				{
					_key: genKey(),
					value: '24/7',
					label: 'Direct Support',
					sublabel: 'Dedicated account specialists',
				},
			],
			reviews: [
				{
					_key: genKey(),
					authorName: 'Sarah Jenkins',
					authorRole: 'Procurement Specialist',
					authorCompany: 'Aura Living Co.',
					authorCountry: 'United States',
					rating: 5,
					title: 'Exceptional craftsmanship and seamless shipping',
					quote:
						'The build quality and attention to detail completely surpassed our expectations. Delivery to New York was expedited smoothly, and the customer experience team went above and beyond to answer every query.',
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Purchase',
					productTag: 'Signature Series Bundle',
					date: '3 days ago',
					helpfulCount: 24,
					videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
					videoDuration: '0:15',
				},
				{
					_key: genKey(),
					authorName: 'Oliver Harrington',
					authorRole: 'Operations Director',
					authorCompany: 'Kensington Brand House',
					authorCountry: 'London, United Kingdom',
					rating: 5,
					title: 'Transformed our brand perception overnight',
					quote:
						'We spent months searching for a reliable supplier that met strict sustainability standards. These products exceeded all compliance marks. Our clients have consistently praised the premium texture and durability.',
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Buyer',
					productTag: 'Enterprise Package',
					date: '1 week ago',
					helpfulCount: 19,
				},
				{
					_key: genKey(),
					authorName: 'Dr. Michael Vance',
					authorRole: 'Creative Director',
					authorCompany: 'Vance & Studio',
					authorCountry: 'Austin, Texas',
					rating: 5,
					title: 'Unrivaled reliability and stellar communication',
					quote:
						'From unboxing to full operational deployment, everything felt intentional and world-class. It is rare to encounter a team so deeply invested in customer satisfaction. Will definitely be placing regular reorders.',
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Purchase',
					productTag: 'Premier Set',
					date: '2 weeks ago',
					helpfulCount: 12,
				},
			],
			layout: 'grid',
			columns: 3,
			carouselAutoplay: false,
			showCarouselArrows: true,
			showCarouselDots: true,
			bgStyle: 'white',
			cardElevation: 'bordered',
			showCta: false,
			ctaLabel: 'Explore All Verified Reviews',
			ctaLink: '#reviews',
			trustFootnote:
				'All reviews are submitted by verified purchasing customers and monitored for authentic customer sentiment.',
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout' },
		{ name: 'design', title: 'Appearance' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Section Header & Rating Hook',
			options: { columns: 1 },
		},
		{
			name: 'metricsGroup',
			title: 'Trust Counter Metrics',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'reviewsGroup',
			title: 'Customer Testimonial Reviews',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'layoutOptions',
			title: 'Layout & Column Controls',
			options: { columns: 1 },
		},
		{
			name: 'appearanceOptions',
			title: 'Theme & Elevation Styling',
			options: { columns: 1 },
		},
		{
			name: 'ctaGroup',
			title: 'Call to Action & Trust Footer',
			options: { collapsible: true, collapsed: true },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- Group: Content / Fieldset: headerInfo ---
		defineField({
			name: 'badge',
			title: 'Trust Header Badge',
			description:
				'Catchy top badge with trust signal. E.g. "4.9/5 RATED BY 2,500+ GLOBAL CLIENTS"',
			type: 'string',
			initialValue: '4.9/5 RATED BY 2,500+ VERIFIED BUYERS',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'badgeIcon',
			title: 'Badge Icon',
			description: 'Icon displayed beside the trust header badge.',
			type: 'string',
			options: {
				list: [
					{ title: 'Gold Star (Rating & Reviews)', value: 'star' },
					{ title: 'Shield Check (Security & Guarantee)', value: 'shield' },
					{ title: 'Checkmark (Verified Trust)', value: 'check' },
					{ title: 'None (Text Only)', value: 'none' },
				],
			},
			initialValue: 'star',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headline',
			title: 'Section Headline',
			description: 'Main social proof headline to capture buyer trust.',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: 'Loved by Customers Across the US & UK',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'subtitle',
			title: 'Subtitle / Overview',
			description:
				'Brief description highlighting authentic experiences and satisfaction.',
			type: 'text',
			rows: 2,
			initialValue:
				'Real verified stories from individuals and commercial partners who trust our quality, delivery, and dedicated customer support.',
			group: 'content',
			fieldset: 'headerInfo',
		}),

		// --- Group: Content / Fieldset: metricsGroup ---
		defineField({
			name: 'showTrustStats',
			title: 'Display Key Metric Counters Bar',
			description:
				'Toggle to show or hide the 4-column trust counter metrics row.',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'metricsGroup',
		}),
		defineField({
			name: 'trustStats',
			title: 'Key Metric Counters',
			description: 'Metrics establishing authority, volume, and satisfaction.',
			type: 'array',
			hidden: ({ parent }) => parent?.showTrustStats === false,
			group: 'content',
			fieldset: 'metricsGroup',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'value',
							title: 'Metric Value',
							description: 'High-contrast number or percentage (e.g. 4.9/5, 10,000+, 99.4%)',
							type: 'string',
							placeholder: '99.4%',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'label',
							title: 'Metric Label',
							description: 'Short descriptor (e.g. Satisfaction Rate, Delivered Globally)',
							type: 'string',
							placeholder: 'Satisfaction Rate',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'sublabel',
							title: 'Supporting Context (Optional)',
							description: 'Optional helper text (e.g. Across 2,500+ verified purchases)',
							type: 'string',
							placeholder: 'Across 2,500+ verified purchases',
						}),
					],
					preview: {
						select: { title: 'value', subtitle: 'label' },
						prepare({ title, subtitle }) {
							return {
								title: title || '0',
								subtitle: subtitle || 'Metric',
							}
						},
					},
				}),
			],
		}),

		// --- Group: Content / Fieldset: reviewsGroup ---
		defineField({
			name: 'reviews',
			title: 'Featured Customer Reviews',
			description:
				'Curated list of verified buyer reviews and testimonials.',
			type: 'array',
			group: 'content',
			fieldset: 'reviewsGroup',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'authorName',
							title: 'Customer / Buyer Name',
							type: 'string',
							placeholder: 'e.g., Sarah Jenkins',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'authorRole',
							title: 'Role / Designation (Optional)',
							type: 'string',
							placeholder: 'e.g., Procurement Specialist or Verified Owner',
						}),
						defineField({
							name: 'authorCompany',
							title: 'Company / Organization (Optional)',
							type: 'string',
							placeholder: 'e.g., Kensington Brand House',
						}),
						defineField({
							name: 'authorCountry',
							title: 'Location / Country (Optional)',
							type: 'string',
							placeholder: 'e.g., London, UK or New York, USA',
						}),
						defineField({
							name: 'authorAvatar',
							title: 'Avatar Photo (Optional)',
							description:
								'Clear customer headshot. If omitted, initials avatar will be rendered.',
							type: 'image',
							options: { hotspot: true },
						}),
						defineField({
							name: 'rating',
							title: 'Star Rating (1-5)',
							type: 'number',
							initialValue: 5,
							validation: (Rule) => Rule.required().min(1).max(5),
						}),
						defineField({
							name: 'title',
							title: 'Review Hook / Headline',
							description: 'Bold subject summary for the review.',
							type: 'string',
							placeholder: 'e.g., Exceeded all our quality expectations!',
						}),
						defineField({
							name: 'quote',
							title: 'Review Testimony Body',
							type: 'text',
							rows: 3,
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'verifiedBuyer',
							title: 'Verified Buyer Badge',
							description: 'Display trust badge certifying an authentic purchase.',
							type: 'boolean',
							initialValue: true,
						}),
						defineField({
							name: 'verifiedBadgeText',
							title: 'Badge Label (Optional)',
							description: 'Custom text. Defaults to "Verified Buyer".',
							type: 'string',
							placeholder: 'Verified Buyer',
						}),
						defineField({
							name: 'productTag',
							title: 'Purchased Product / Order Tag (Optional)',
							type: 'string',
							placeholder: 'e.g., Signature Series Bundle',
						}),
						defineField({
							name: 'date',
							title: 'Date / Relative Time (Optional)',
							type: 'string',
							placeholder: 'e.g., 3 days ago or Oct 2025',
						}),
						defineField({
							name: 'helpfulCount',
							title: 'Helpful Votes Count (Optional)',
							description: 'e.g., 24 people found this review helpful.',
							type: 'number',
							placeholder: '24',
						}),
						defineField({
							name: 'videoUrl',
							title: 'UGC Video Review URL (Optional)',
							description:
								'Direct video URL (MP4/WebM) or short-form embed link (YouTube Shorts, TikTok, Vimeo). Clicking opens an instant video lightbox popup.',
							type: 'url',
							placeholder: 'https://example.com/review-video.mp4',
						}),
						defineField({
							name: 'videoThumbnail',
							title: 'Video Cover / Poster Image (Optional)',
							description:
								'Visual poster thumbnail displayed behind the play button. If omitted, card uses default styling.',
							type: 'image',
							options: { hotspot: true },
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
						defineField({
							name: 'videoDuration',
							title: 'Video Duration Tag (Optional)',
							description: 'e.g., "0:30" or "1:15"',
							type: 'string',
							placeholder: '0:30',
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
					],
					preview: {
						select: {
							title: 'authorName',
							rating: 'rating',
							subtitle: 'title',
							media: 'authorAvatar',
							country: 'authorCountry',
							video: 'videoUrl',
						},
						prepare({ title, rating, subtitle, media, country, video }) {
							const stars = rating ? `[${rating}★]` : ''
							const location = country ? `(${country})` : ''
							const videoBadge = video ? '🎬 UGC Video' : null
							const sub = [videoBadge, subtitle].filter(Boolean).join(' • ')
							return {
								title: [title || 'Customer', stars, location].filter(Boolean).join(' '),
								subtitle: sub || 'Review Testimony',
								media,
							}
						},
					},
				}),
			],
		}),

		// --- Group: Layout ---
		defineField({
			name: 'layout',
			title: 'Display Mode',
			description: 'Choose between responsive multi-column grid or horizontal touch slider.',
			type: 'string',
			options: {
				list: [
					{ title: 'Responsive Grid (Multi-column)', value: 'grid' },
					{ title: 'Horizontal Snap Carousel (Touch slider)', value: 'carousel' },
				],
			},
			initialValue: 'grid',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'columns',
			title: 'Grid Columns (Desktop)',
			description: 'Number of columns when displayed in Grid mode.',
			type: 'number',
			options: {
				list: [
					{ title: '2 Columns (Featured Focus)', value: 2 },
					{ title: '3 Columns (Standard Balance)', value: 3 },
					{ title: '4 Columns (Dense Catalog)', value: 4 },
				],
			},
			initialValue: 3,
			hidden: ({ parent }) => parent?.layout === 'carousel',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'headerAlignment',
			title: 'Header Alignment',
			type: 'string',
			options: {
				list: [
					{ title: 'Centered (Standard)', value: 'center' },
					{ title: 'Left Aligned (Modern Editorial)', value: 'left' },
				],
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'showCarouselArrows',
			title: 'Show Carousel Navigation Arrows',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => parent?.layout !== 'carousel',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'showCarouselDots',
			title: 'Show Carousel Pagination Dots',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => parent?.layout !== 'carousel',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),
		defineField({
			name: 'carouselAutoplay',
			title: 'Enable Carousel Autoplay',
			description: 'Smoothly cycles through reviews with automatic pause on hover.',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.layout !== 'carousel',
			group: 'layout',
			fieldset: 'layoutOptions',
		}),

		// --- Group: Appearance (Design) ---
		defineField({
			name: 'bgStyle',
			title: 'Container Background Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Clean Light / White', value: 'white' },
					{ title: 'Subtle Slate Gray (Warm Neutral)', value: 'slate' },
					{ title: 'Dark Charcoal / Onyx (High Contrast)', value: 'dark' },
					{ title: 'Subtle Brand Gradient', value: 'gradient' },
				],
			},
			initialValue: 'white',
			group: 'design',
			fieldset: 'appearanceOptions',
		}),
		defineField({
			name: 'cardElevation',
			title: 'Review Card Style',
			type: 'string',
			options: {
				list: [
					{ title: 'Bordered with Soft Shadow (Default)', value: 'bordered' },
					{ title: 'Elevated Floating Shadow', value: 'elevated' },
					{ title: 'Flat Subtle Contrast', value: 'subtle' },
				],
			},
			initialValue: 'bordered',
			group: 'design',
			fieldset: 'appearanceOptions',
		}),

		// --- Group: Content / Fieldset: ctaGroup ---
		defineField({
			name: 'showCta',
			title: 'Display Trust Call to Action Button',
			type: 'boolean',
			initialValue: false,
			group: 'content',
			fieldset: 'ctaGroup',
		}),
		defineField({
			name: 'ctaLabel',
			title: 'CTA Button Text',
			type: 'string',
			placeholder: 'e.g., Explore All 2,500+ Reviews',
			hidden: ({ parent }) => !parent?.showCta,
			group: 'content',
			fieldset: 'ctaGroup',
		}),
		defineField({
			name: 'ctaLink',
			title: 'CTA Destination Link / Anchor',
			type: 'string',
			placeholder: 'e.g., /reviews or #testimonials',
			hidden: ({ parent }) => !parent?.showCta,
			group: 'content',
			fieldset: 'ctaGroup',
		}),
		defineField({
			name: 'trustFootnote',
			title: 'Trust & Verification Footnote (Optional)',
			description: 'Small disclaimer text displayed at the bottom of the section.',
			type: 'string',
			placeholder: 'e.g., All reviews are submitted by verified purchasers and checked for authenticity.',
			group: 'content',
			fieldset: 'ctaGroup',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'social-proof',
		icon: StarIcon,
		titleFields: ['headline', 'badge'],
		select: {
			layout: 'layout',
			badge: 'badge',
			bgStyle: 'bgStyle',
		},
		metadata: (doc) => [
			doc.layout ? `Layout: ${doc.layout}` : null,
			doc.badge || null,
			doc.bgStyle ? `Theme: ${doc.bgStyle}` : null,
		],
	}),
})
