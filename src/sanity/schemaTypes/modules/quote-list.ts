import { defineArrayMember, defineField, defineType } from 'sanity'
import { FeedbackIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'quote-list',
	title: 'Wall of Love',
	description:
		'Social proof testimonial wall, verified customer reviews, star ratings, and press features designed to maximize conversion.',
	type: 'object',
	icon: FeedbackIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'WALL OF LOVE',
			headline: 'Trusted by Over 10,000+ Fast-Growing Brands',
			subtitle:
				'Read authentic feedback, editorial reviews, and real experiences from verified partners and customers across the US & UK.',
			headerAlign: 'center',
			showTrustScore: true,
			trustScoreValue: '4.9 / 5.0',
			trustScoreLabel:
				'Average rating from 2,500+ verified orders across the US & UK',
			trustPlatform: 'trustpilot',
			trustPlatformScore: '4.9',
			trustPlatformUrl: 'https://www.trustpilot.com',
			layout: 'masonry',
			columns: 3,
			mobileLayout: 'carousel',
			cardStyle: 'bordered',
			spacing: 'default',
			showRating: true,
			showVerifiedBadge: true,
			showQuoteIcon: true,
			showMediaLogo: true,
			enableCategoryFilter: false,
			testimonials: [
				{
					_key: genKey(),
					_type: 'inlineQuote',
					endorsementType: 'press',
					rating: 5,
					headline: 'A benchmark for sustainable commercial supply chains',
					quote:
						'DeanFlow has set a new gold standard for circular economy standards and product durability. Their rapid fulfillment across the UK and US makes them a trusted pioneer for eco-conscious enterprises.',
					author: {
						name: 'Editorial Review',
						title: 'Senior Lifestyle & Sustainability Editor',
						company: 'British Vogue',
						country: 'London, UK',
					},
					verifiedBuyer: true,
					verifiedBadgeText: 'Press Feature',
					date: 'October 2026',
				},
				{
					_key: genKey(),
					_type: 'inlineQuote',
					endorsementType: 'customer',
					rating: 5,
					headline:
						'Flawless quality, zero plastic, and exceptional account support',
					quote:
						'We audited multiple global manufacturers before standardizing on DeanFlow. The consistency in product texture, fully compostable packaging, and dedicated support have surpassed every compliance mark.',
					author: {
						name: 'Eleanor Vance',
						title: 'Head of Global Procurement',
						company: 'Kensington Brand House',
						country: 'London, UK',
					},
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Client',
					videoUrl:
						'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
					videoDuration: '0:15',
					date: '3 days ago',
				},
				{
					_key: genKey(),
					_type: 'inlineQuote',
					endorsementType: 'expert',
					rating: 5,
					headline:
						'Our retail customers noticed and praised the shift immediately',
					quote:
						'Transitioning our wholesale packaging was the smoothest operational shift we completed this year. Shipments arrived at our New York distribution center right on schedule with zero defect rates.',
					author: {
						name: 'Marcus Thorne',
						title: 'Director of Sustainable Operations',
						company: 'Horizon Living Co.',
						country: 'New York, NY',
					},
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Partner',
					date: '1 week ago',
				},
				{
					_key: genKey(),
					_type: 'inlineQuote',
					endorsementType: 'customer',
					rating: 5,
					headline: 'Unrivaled craftsmanship with responsive communication',
					quote:
						'From sample approvals through bulk container dispatch, every touchpoint was seamless. It is rare to work with a supplier that cares as deeply about quality control and on-time freight arrival.',
					author: {
						name: 'Charlotte Davies',
						title: 'Operations Director',
						company: 'Aura Collective',
						country: 'Manchester, UK',
					},
					verifiedBuyer: true,
					verifiedBadgeText: 'Verified Buyer',
					date: '2 weeks ago',
				},
			],
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
			name: 'headerGroup',
			title: 'Section Header & Trust Hook',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'trustScoreGroup',
			title: 'Aggregate Rating & Social Proof Counter',
			options: { collapsible: true, collapsed: true },
		},
		{
			name: 'itemsGroup',
			title: 'Testimonials & Reviews',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'layoutGroup',
			title: 'Display & Column Controls',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'appearanceGroup',
			title: 'Card Styling & Visual Accents',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'ctaGroup',
			title: 'Call to Action Button',
			options: { collapsible: true, collapsed: true },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- Group: Content / Fieldset: headerGroup ---
		defineField({
			name: 'badge',
			title: 'Header Trust Badge',
			description:
				'Small uppercase pill displayed above the headline. E.g. "WALL OF LOVE" or "VERIFIED REVIEWS"',
			type: 'string',
			initialValue: 'WALL OF LOVE',
			group: 'content',
			fieldset: 'headerGroup',
		}),
		defineField({
			name: 'headline',
			title: 'Section Headline',
			description:
				'Main heading to capture buyer interest and convey social credibility.',
			type: 'string',
			initialValue: 'Trusted by Over 10,000+ Fast-Growing Brands',
			group: 'content',
			fieldset: 'headerGroup',
		}),
		defineField({
			name: 'subtitle',
			title: 'Section Subtitle / Description',
			description:
				'Brief overview summarizing authentic customer satisfaction and feedback.',
			type: 'text',
			rows: 2,
			initialValue:
				'Read authentic feedback, editorial reviews, and real experiences from verified partners and customers across the US & UK.',
			group: 'content',
			fieldset: 'headerGroup',
		}),
		defineField({
			name: 'intro',
			title: 'Rich Text Intro (Optional)',
			description:
				'Optional rich text block for advanced editorial formatting or introductory links.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
			fieldset: 'headerGroup',
		}),

		// --- Group: Content / Fieldset: trustScoreGroup ---
		defineField({
			name: 'showTrustScore',
			title: 'Display Trust Score Pill',
			description:
				'Shows an aggregate star rating badge below the header (e.g. ★ 4.9 / 5.0 from 2,500+ reviews).',
			type: 'boolean',
			initialValue: true,
			group: 'content',
			fieldset: 'trustScoreGroup',
		}),
		defineField({
			name: 'trustScoreValue',
			title: 'Rating Metric Value',
			description: 'E.g. "4.9 / 5.0" or "99.4%"',
			type: 'string',
			initialValue: '4.9 / 5.0',
			group: 'content',
			fieldset: 'trustScoreGroup',
			hidden: ({ parent }) => !parent?.showTrustScore,
		}),
		defineField({
			name: 'trustScoreLabel',
			title: 'Rating Metric Label',
			description:
				'E.g. "Average rating from 2,500+ verified orders across the US & UK"',
			type: 'string',
			initialValue:
				'Average rating from 2,500+ verified orders across the US & UK',
			group: 'content',
			fieldset: 'trustScoreGroup',
			hidden: ({ parent }) => !parent?.showTrustScore,
		}),
		defineField({
			name: 'trustPlatform',
			title: 'External Review Platform Badge',
			description:
				'Link and display an external verified review badge alongside the rating.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Standard Star Pill)', value: 'none' },
					{ title: 'Trustpilot (Green Star Badge)', value: 'trustpilot' },
					{ title: 'Google Reviews (Google Rating Badge)', value: 'google' },
					{ title: 'Feefo (Platinum Trusted Badge)', value: 'feefo' },
					{ title: 'Clutch (Top B2B Rating)', value: 'clutch' },
				],
			},
			initialValue: 'none',
			group: 'content',
			fieldset: 'trustScoreGroup',
			hidden: ({ parent }) => !parent?.showTrustScore,
		}),
		defineField({
			name: 'trustPlatformScore',
			title: 'Platform Score / Rating',
			description: 'E.g. "4.9" or "4.8 / 5.0"',
			type: 'string',
			initialValue: '4.9',
			group: 'content',
			fieldset: 'trustScoreGroup',
			hidden: ({ parent }) =>
				!parent?.showTrustScore ||
				!parent?.trustPlatform ||
				parent?.trustPlatform === 'none',
		}),
		defineField({
			name: 'trustPlatformUrl',
			title: 'External Platform Profile Link',
			description:
				'Direct link to your verified merchant profile (e.g. https://www.trustpilot.com/review/yourdomain.com).',
			type: 'url',
			group: 'content',
			fieldset: 'trustScoreGroup',
			hidden: ({ parent }) =>
				!parent?.showTrustScore ||
				!parent?.trustPlatform ||
				parent?.trustPlatform === 'none',
		}),

		// --- Group: Content / Fieldset: itemsGroup ---
		defineField({
			name: 'enableCategoryFilter',
			title: 'Enable Category Filter Tabs',
			description:
				'Allows website visitors to filter quotes by category (All, Press & Media, Verified Customers, Industry Experts).',
			type: 'boolean',
			initialValue: false,
			group: 'content',
			fieldset: 'itemsGroup',
		}),
		defineField({
			name: 'testimonials',
			title: 'Testimonials, Quotes & Endorsements',
			description:
				'Add reusable quotes from the global library or create custom testimonial cards directly.',
			type: 'array',
			group: 'content',
			fieldset: 'itemsGroup',
			of: [
				defineArrayMember({
					type: 'reference',
					to: [{ type: 'quote' }],
					title: 'Shared Testimonial (Reference)',
				}),
				defineArrayMember({
					type: 'object',
					name: 'inlineQuote',
					title: 'Custom Testimonial Card',
					icon: FeedbackIcon,
					fields: [
						defineField({
							name: 'endorsementType',
							title: 'Category',
							type: 'string',
							options: {
								list: [
									{
										title: 'Featured Customer / Verified VIP',
										value: 'customer',
									},
									{ title: 'Press & Media Feature', value: 'press' },
									{ title: 'Industry Expert / Ambassador', value: 'expert' },
									{ title: 'Brand Partner / B2B Client', value: 'partner' },
								],
								layout: 'radio',
							},
							initialValue: 'customer',
						}),
						defineField({
							name: 'headline',
							title: 'Quote Headline / Key Takeaway',
							description: 'E.g. "Flawless quality and fast shipping"',
							type: 'string',
						}),
						defineField({
							name: 'quote',
							title: 'Quote Statement',
							description: 'The testimonial feedback text.',
							type: 'text',
							rows: 3,
							validation: (Rule) =>
								Rule.required().error('Quote text is required'),
						}),
						defineField({
							name: 'rating',
							title: 'Rating (Stars)',
							type: 'number',
							options: {
								list: [
									{ title: '⭐⭐⭐⭐⭐ (5 Stars)', value: 5 },
									{ title: '⭐⭐⭐⭐ (4 Stars)', value: 4 },
									{ title: '⭐⭐⭐ (3 Stars)', value: 3 },
									{ title: 'No Stars', value: 0 },
								],
							},
							initialValue: 5,
						}),
						defineField({
							name: 'author',
							title: 'Author Details',
							type: 'object',
							fields: [
								defineField({
									name: 'name',
									title: 'Full Name',
									type: 'string',
								}),
								defineField({
									name: 'title',
									title: 'Job Role / Designation',
									description: 'E.g. Procurement Specialist or Senior Editor',
									type: 'string',
								}),
								defineField({
									name: 'company',
									title: 'Company / Publication',
									description: 'E.g. Kensington Living or British Vogue',
									type: 'string',
								}),
								defineField({
									name: 'country',
									title: 'Location / Region',
									description: 'E.g. London, UK or New York, NY',
									type: 'string',
								}),
								defineField({
									name: 'image',
									title: 'Photo / Avatar',
									type: 'image',
									options: { hotspot: true },
								}),
							],
						}),
						defineField({
							name: 'verifiedBuyer',
							title: 'Verified Badge',
							type: 'boolean',
							initialValue: true,
						}),
						defineField({
							name: 'verifiedBadgeText',
							title: 'Badge Label',
							type: 'string',
							initialValue: 'Verified Buyer',
							hidden: ({ parent }) => !parent?.verifiedBuyer,
						}),
						defineField({
							name: 'date',
							title: 'Date / Relative Time',
							description: 'E.g. "2 days ago" or "October 2026"',
							type: 'string',
						}),
						defineField({
							name: 'videoUrl',
							title: 'Video Review URL',
							description:
								'Link to video review on YouTube, TikTok, Vimeo, or direct MP4 stream.',
							type: 'url',
						}),
						defineField({
							name: 'videoThumbnail',
							title: 'Video Poster / Custom Thumbnail',
							description:
								'Custom video poster image displayed on the card with a play overlay button.',
							type: 'image',
							options: { hotspot: true },
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
						defineField({
							name: 'videoDuration',
							title: 'Video Duration (Optional)',
							description: 'E.g. "0:45" or "1:20"',
							type: 'string',
							hidden: ({ parent }) => !parent?.videoUrl,
						}),
						defineField({
							name: 'mediaLogo',
							title: 'Publication / Media Logo (Optional)',
							type: 'image',
							options: { hotspot: true },
						}),
						defineField({
							name: 'sourceUrl',
							title: 'External Review / Article URL (Optional)',
							type: 'url',
						}),
					],
					preview: {
						select: {
							quote: 'quote',
							headline: 'headline',
							author: 'author',
							mediaLogo: 'mediaLogo',
							rating: 'rating',
						},
						prepare: ({ quote, headline, author, mediaLogo, rating }) => {
							const stars = rating && rating > 0 ? '★'.repeat(rating) : ''
							const title =
								headline || (typeof quote === 'string' ? quote : 'Testimonial')
							const subtitle = [
								author?.name,
								author?.company || author?.title,
								stars,
							]
								.filter(Boolean)
								.join(' • ')
							return {
								title,
								subtitle,
								media: mediaLogo?.asset || author?.image?.asset,
							}
						},
					},
				}),
			],
		}),

		// --- Group: Content / Fieldset: ctaGroup ---
		defineField({
			name: 'ctas',
			title: 'Call to Action Buttons',
			description:
				'Optional CTA buttons placed beneath the testimonials (e.g. "Read all reviews on Trustpilot").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
			fieldset: 'ctaGroup',
		}),

		// --- Group: Layout / Fieldset: layoutGroup ---
		defineField({
			name: 'layout',
			title: 'Layout Mode',
			description:
				'Choose how testimonial cards are arranged across the screen.',
			type: 'string',
			group: 'layout',
			fieldset: 'layoutGroup',
			options: {
				list: [
					{
						title: 'Wall of Love (Staggered Masonry Columns)',
						value: 'masonry',
					},
					{ title: 'Uniform Grid (Aligned Height Cards)', value: 'grid' },
					{
						title: 'Interactive Carousel (Touch Slider with Arrows)',
						value: 'carousel',
					},
					{
						title: 'Continuous Marquee (Smooth Infinite Ticker)',
						value: 'marquee',
					},
				],
			},
			initialValue: 'masonry',
		}),
		defineField({
			name: 'columns',
			title: 'Desktop Columns',
			description: 'Number of columns on desktop viewports (1024px+).',
			type: 'number',
			group: 'layout',
			fieldset: 'layoutGroup',
			options: {
				list: [
					{ title: '2 Columns (Spacious)', value: 2 },
					{ title: '3 Columns (Balanced - Recommended)', value: 3 },
					{ title: '4 Columns (Dense Wall of Love)', value: 4 },
				],
			},
			initialValue: 3,
			hidden: ({ parent }) => parent?.layout === 'marquee',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Presentation',
			description: 'How cards behave on mobile screens (under 768px).',
			type: 'string',
			group: 'layout',
			fieldset: 'layoutGroup',
			options: {
				list: [
					{
						title: 'Swipeable Carousel Slider (with indicator dots)',
						value: 'carousel',
					},
					{ title: 'Vertical Stack (Scroll downward)', value: 'stack' },
				],
			},
			initialValue: 'carousel',
			hidden: ({ parent }) => parent?.layout === 'marquee',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Header Alignment',
			description: 'Alignment of the section badge, headline, and subtitle.',
			type: 'string',
			group: 'layout',
			fieldset: 'layoutGroup',
			options: {
				list: [
					{ title: 'Center Aligned', value: 'center' },
					{ title: 'Left Aligned', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
		}),

		// --- Group: Appearance / Fieldset: appearanceGroup ---
		defineField({
			name: 'cardStyle',
			title: 'Card Surface & Elevation',
			description: 'Visual styling and shadow treatment for testimonial cards.',
			type: 'string',
			group: 'design',
			fieldset: 'appearanceGroup',
			options: {
				list: [
					{
						title: 'Clean Bordered (Subtle border, refined background)',
						value: 'bordered',
					},
					{
						title: 'Elevated Shadow (Soft ambient shadow & hover lift)',
						value: 'elevated',
					},
					{
						title: 'Minimalist (Soft background tint, borderless)',
						value: 'minimal',
					},
					{
						title: 'Glassmorphic (Frosted glass backdrop blur)',
						value: 'glass',
					},
				],
			},
			initialValue: 'bordered',
		}),
		defineField({
			name: 'spacing',
			title: 'Vertical Section Spacing',
			description: 'Amount of top and bottom padding for this section.',
			type: 'string',
			group: 'design',
			fieldset: 'appearanceGroup',
			options: {
				list: [
					{ title: 'Compact (py-8 md:py-12)', value: 'compact' },
					{ title: 'Default (py-12 md:py-16)', value: 'default' },
					{ title: 'Relaxed (py-16 md:py-24)', value: 'relaxed' },
				],
			},
			initialValue: 'default',
		}),
		defineField({
			name: 'showRating',
			title: 'Show Star Ratings',
			description: 'Display 5-star rating stars on cards.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'appearanceGroup',
		}),
		defineField({
			name: 'showVerifiedBadge',
			title: 'Show Verified Badges',
			description:
				'Display "Verified Buyer" / "Press Feature" verification pills on cards.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'appearanceGroup',
		}),
		defineField({
			name: 'showQuoteIcon',
			title: 'Show Decorative Quote Mark',
			description:
				'Renders an elegant quote watermark in the top-right corner of each card.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'appearanceGroup',
		}),
		defineField({
			name: 'showMediaLogo',
			title: 'Show Publication / Brand Logo',
			description: 'Display publication SVG/PNG logos when available.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
			fieldset: 'appearanceGroup',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'quote-list',
		friendlyName: 'Wall of Love',
		icon: FeedbackIcon,
		titleFields: ['headline', 'badge', 'intro'],
		select: {
			testimonials: 'testimonials',
			layout: 'layout',
			columns: 'columns',
		},
		metadata: (doc) => [
			doc.layout
				? `${doc.layout.charAt(0).toUpperCase() + doc.layout.slice(1)} layout`
				: 'Masonry',
			doc.testimonials?.length
				? `${doc.testimonials.length} testimonials`
				: null,
		],
	}),
})
