/**
 * Default Built-in Landing Page Templates for DeanFlow
 * Serves as zero-state fallback ensuring the Template Store is immediately usable.
 */

export interface BuiltinTemplate {
	_id: string
	title: string
	description: string
	funnelPillar: 'd2c_fast' | 'high_ticket' | 'b2b_rfq'
	industry: string
	conversionBadge: string
	thumbnailUrl: string
	moduleCount: number
	livePreviewUrl?: string
	isBuiltin?: boolean
	modules: Array<Record<string, any>>
}

export const DEFAULT_TEMPLATES: BuiltinTemplate[] = [
	{
		_id: 'builtin-d2c-flash-sale',
		title: 'D2C Flash Sale & Fast Checkout Funnel',
		description:
			'High-velocity direct-to-consumer promotional landing page with live countdown timer, featured product catalog, social proof metrics, buyer FAQs, and persistent mobile sticky CTA.',
		funnelPillar: 'd2c_fast',
		industry: 'Fashion, Beauty & Retail',
		conversionBadge: 'High CVR (4.8%)',
		thumbnailUrl:
			'https://cdn.hstatic.net/products/1000012173/96e6a79e37f14648827ded4f519d68d9_8ef66fd3f3aa4359894b729c26d4897a.jpg',
		moduleCount: 5,
		isBuiltin: true,
		modules: [
			{
				_type: 'comparison-table',
				badge: 'Competitive Edge',
				title: 'DeanFlow vs. Conventional Solutions',
				caption: '100% Certified High Performance & Rapid Time-to-Market.',
				headers: [
					'Key Feature',
					'DeanFlow Solution',
					'Traditional Alternatives',
				],
				highlightedColumnIndex: 1,
				rows: [
					{
						_key: 'row1',
						cells: [
							'100% Home Compostable',
							'✅ Yes (<90 days)',
							'❌ No (>450 years)',
						],
					},
					{
						_key: 'row2',
						cells: [
							'Food-Contact Safe (FDA)',
							'✅ 21 CFR 176.170',
							'⚠️ Migration Risk',
						],
					},
					{
						_key: 'row3',
						cells: [
							'Heat & Cold Resilient',
							'✅ -20°C to 120°C',
							'❌ Warps & Leaches',
						],
					},
				],
				ctaText: 'Claim Launch Offer',
				ctaLink: '#products',
			},
			{
				_type: 'countdown-banner',
				badge: 'LIMITED TIME OFFER',
				headline: 'Flash Launch Deal — Save Up To 40% Today',
				subtext:
					'Offer expires when timer reaches zero or current batch runs out.',
				hoursRemaining: 48,
				stockUrgencyText: 'Only 12 packages remaining at launch pricing',
				ctaLabel: 'Claim This Deal Now',
				ctaUrl: '#products',
				trustBadge:
					'Instant checkout • 30-day money-back guarantee • Free express shipping',
				layout: 'split',
				colorScheme: 'accent',
				stickyMobile: false,
			},
			{
				_type: 'product-list',
				title: 'Featured Flash Sale Deals',
				description:
					'Hand-picked bestsellers available at exclusive bundle rates.',
				layout: 'grid',
				columns: 4,
				limit: 8,
			},
			{
				_type: 'social-proof',
				badge: 'Trusted Worldwide',
				headline: 'Loved by Over 25,000+ Happy Customers',
				subtitle:
					'Real verified reviews from customers who upgraded their daily experience.',
				description:
					'Real verified reviews from customers who upgraded their daily experience.',
				reviewCount: 25420,
				averageRating: 4.9,
			},
			{
				_type: 'accordion-list',
				intro: [
					{
						_type: 'block',
						children: [
							{
								_type: 'span',
								text: 'Frequently Asked Questions',
							},
						],
						style: 'h2',
					},
				],
				items: [
					{
						summary: 'How fast is delivery for flash sale orders?',
						content: [
							{
								_type: 'block',
								children: [
									{
										_type: 'span',
										text: 'All promotional orders are dispatched via priority express shipping within 24 business hours with end-to-end tracking.',
									},
								],
								style: 'normal',
							},
						],
					},
					{
						summary: 'What is your return & satisfaction guarantee?',
						content: [
							{
								_type: 'block',
								children: [
									{
										_type: 'span',
										text: 'We provide a 100% risk-free 30-day money-back guarantee. If you are not fully satisfied, return it for an instant refund.',
									},
								],
								style: 'normal',
							},
						],
					},
				],
			},
			{
				_type: 'sticky-mobile-cta',
				title: 'Special Launch Promo Package',
				badge: 'Save 30%',
				price: '$49.00',
				originalPrice: '$79.00',
				ratingScore: '4.9',
				ratingCount: '(2.4k+ reviews)',
				trustNote: 'Free shipping & 30-day guarantee',
				primaryButtonText: 'Order Now',
				primaryButtonLink: '#lead-form',
				secondaryButtonType: 'whatsapp',
				secondaryButtonLabel: 'Chat',
				secondaryButtonValue: '+15550001122',
				barPosition: 'bottom',
				barStyle: 'docked',
				deviceVisibility: 'all',
				themeStyle: 'light',
				buttonStyle: 'accent',
				triggerMode: 'scroll',
				scrollThreshold: 250,
				autoHideOnTarget: true,
			},
		],
	},
	{
		_id: 'builtin-high-ticket-trust',
		title: 'High-Ticket Commerce (Dual-CTA & Authority)',
		description:
			'Engineered for premium merchandise and luxury gear. Integrates split-hero storytelling, feature capability cards, international compliance credentials, and executive testimonials.',
		funnelPillar: 'high_ticket',
		industry: 'Luxury, Tech & Equipment',
		conversionBadge: 'Dual-CTA Funnel',
		thumbnailUrl:
			'https://cdn.hstatic.net/products/1000012173/89955ad538f24140b082fcd370aeea91_0ea99a70f4b74bc8b89b2465c320c7a9.png',
		moduleCount: 4,
		isBuiltin: true,
		modules: [
			{
				_type: 'hero.split',
				content: [
					{
						_type: 'block',
						children: [
							{
								_type: 'span',
								text: 'Engineered Precision For Discerning Professionals',
							},
						],
						style: 'h1',
					},
					{
						_type: 'block',
						children: [
							{
								_type: 'span',
								text: 'Crafted with aerospace-grade sustainable materials and backed by an industry-leading 10-year warranty. Experience unmatched craftsmanship.',
							},
						],
						style: 'normal',
					},
				],
				ctas: [
					{
						type: 'internal',
						label: 'Explore Collection',
						style: 'action',
					},
				],
			},
			{
				_type: 'card-list',
				layout: 'grid',
				columns: 3,
			},
			{
				_type: 'compliance-vault',
				badge: 'Verified Standards',
				headline: 'Certified Global Manufacturing & Sustainable Supply Chain',
				subtitle:
					'Full transparency with third-party audited compliance documentation and lab testing.',
			},
			{
				_type: 'quote-list',
			},
		],
	},
	{
		_id: 'builtin-b2b-rfq-funnel',
		title: 'B2B Wholesale & RFQ Sourcing Funnel',
		description:
			'Built for bulk wholesale purchasers, OEM brands, and enterprise procurement. Features tiered discount tables, factory audit credentials, RFQ lead capture, and partner trust logos.',
		funnelPillar: 'b2b_rfq',
		industry: 'B2B, OEM & Manufacturing',
		conversionBadge: 'B2B Wholesale',
		thumbnailUrl:
			'https://cdn.hstatic.net/products/1000012173/cb279d5114a2432fa52436802c7895b9_e2cddfd1012f4109aace3712460880a9.jpg',
		moduleCount: 4,
		isBuiltin: true,
		modules: [
			{
				_type: 'hero.split',
				content: [
					{
						_type: 'block',
						children: [
							{
								_type: 'span',
								text: 'Global Wholesale Sourcing & OEM Manufacturing',
							},
						],
						style: 'h1',
					},
					{
						_type: 'block',
						children: [
							{
								_type: 'span',
								text: 'Direct-from-factory pricing with flexible MOQs, customized packaging, and certified ESG supply chains.',
							},
						],
						style: 'normal',
					},
				],
				ctas: [
					{
						type: 'link',
						label: 'Request Official RFQ',
						style: 'action',
					},
				],
			},
			{
				_type: 'tiered-pricing',
				badge: 'B2B Wholesale & Volume Discounts',
				headline: 'Transparent Volume-Based Pricing',
				description:
					'Tiered wholesale rates customized for retail partners, regional distributors, and enterprise procurement.',
				currency: 'USD',
			},
			{
				_type: 'compliance-vault',
				badge: 'Enterprise Audits',
				headline: 'Certified Factory ESG & Production Compliance',
				subtitle:
					'Verified ISO 9001, ISO 14001, and BSCI audit reports available for download.',
			},
			{
				_type: 'lead-capture-form',
				badge: 'B2B RFQ Inquiry',
				headline: 'Request Your Official Quotation & Volume Discount',
				subtitle:
					'Submit your specification details. Our commercial export team will respond within 24 business hours.',
			},
			{
				_type: 'logo-list',
			},
		],
	},
]
