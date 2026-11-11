import { defineArrayMember, defineField, defineType } from 'sanity'
import { UsersIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'person-list',
	title: 'Leadership & Experts',
	description:
		'Member profiles showcasing executive leadership, advisory board, and sustainability experts.',
	type: 'object',
	icon: UsersIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'EXECUTIVE LEADERSHIP',
			layout: 'grid',
			columns: 3,
			mobileLayout: 'carousel',
			headerAlign: 'center',
			textAlign: 'left',
			cardStyle: 'card',
			imageAspectRatio: '3/4',
			imageEffect: 'color',
			showBio: true,
			bioLength: 'clamp-3',
			showSocial: true,
			enableFilter: false,
			spacing: 'default',
			intro: [
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Pioneering Sustainable Commerce & Enterprise Scale',
							marks: [],
						},
					],
					style: 'h2',
				},
				{
					_key: genKey(),
					_type: 'block',
					children: [
						{
							_key: genKey(),
							_type: 'span',
							text: 'Our executive leaders, material scientists, and ESG advisors unite decades of polymer research, high-volume manufacturing, and ethical supply chain execution across the US and UK.',
							marks: [],
						},
					],
					style: 'normal',
				},
			],
			people: [
				{
					_key: genKey(),
					_type: 'inlinePerson',
					name: 'Dr. Victoria Sterling',
					role: 'Chief Executive Officer & Co-Founder',
					credentials: 'PhD (Oxon)',
					department: 'Executive Leadership',
					shortBio:
						'Former VP of Material Innovation at Global Bio-Polymers with 18+ years leading breakthrough zero-plastic packaging conversions across Europe and North America.',
					socialLinks: [
						{
							_key: genKey(),
							platform: 'linkedin',
							url: 'https://www.linkedin.com',
						},
						{
							_key: genKey(),
							platform: 'twitter',
							url: 'https://x.com',
						},
					],
				},
				{
					_key: genKey(),
					_type: 'inlinePerson',
					name: 'Marcus Thorne',
					role: 'Head of Global Operations & ESG',
					credentials: 'MBA, MCIPS',
					department: 'Operations & ESG',
					shortBio:
						'Architect of DeanFlow’s zero-landfill manufacturing pipeline. Oversees certified ISO 14001 facilities, carbon-neutral logistics, and UK/US port fulfillment.',
					socialLinks: [
						{
							_key: genKey(),
							platform: 'linkedin',
							url: 'https://www.linkedin.com',
						},
						{
							_key: genKey(),
							platform: 'website',
							url: 'https://deanflow.com',
						},
					],
				},
				{
					_key: genKey(),
					_type: 'inlinePerson',
					name: 'Elena Rostova',
					role: 'VP of Sustainable Product Design',
					credentials: 'MID, RISD',
					department: 'Product Design',
					shortBio:
						'Recognized in Fast Company World Changing Ideas for biodegradable industrial molding. Leads our custom debossing, thermal testing, and ergonomic tooling studio.',
					socialLinks: [
						{
							_key: genKey(),
							platform: 'linkedin',
							url: 'https://www.linkedin.com',
						},
						{
							_key: genKey(),
							platform: 'twitter',
							url: 'https://x.com',
						},
					],
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout & Grid' },
		{ name: 'design', title: 'Appearance & Style' },
		{ name: 'settings', title: 'Settings' },
	],
	fields: [
		// ---------------- Settings Tab ----------------
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// ---------------- Content Tab ----------------
		defineField({
			name: 'badge',
			title: 'Section Eyebrow Badge',
			description:
				'Optional small pill tag displayed above the main heading (e.g. "EXECUTIVE LEADERSHIP", "OUR ADVISORY COUNCIL").',
			type: 'string',
			group: 'content',
		}),
		defineField({
			name: 'intro',
			title: 'Section Header & Description',
			description:
				'Section title (H2) and optional introductory copy explaining your leadership, advisory board, or expert team.',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'people',
			title: 'Team & Leadership Members',
			description:
				'Add existing author/team documents from the CMS or configure custom inline member profiles with photo, title, bio, and credentials.',
			type: 'array',
			group: 'content',
			validation: (Rule) =>
				Rule.min(1).warning(
					'Add at least one leadership member to display this section.',
				),
			of: [
				defineArrayMember({
					name: 'personRef',
					title: 'Referenced Team Member',
					type: 'reference',
					to: [{ type: 'person' }],
				}),
				defineArrayMember({
					name: 'inlinePerson',
					title: 'Custom Member (Inline)',
					type: 'object',
					fieldsets: [
						{
							name: 'identity',
							title: 'Name, Role & Credential',
							options: { columns: 1 },
						},
						{
							name: 'details',
							title: 'Profile Bio & Social Links',
						},
					],
					fields: [
						defineField({
							name: 'name',
							title: 'Full Name',
							type: 'string',
							validation: (Rule) => Rule.required(),
							fieldset: 'identity',
						}),
						defineField({
							name: 'role',
							title: 'Job Title / Position',
							description: 'e.g., Chief Executive Officer, Chief Scientific Advisor',
							type: 'string',
							fieldset: 'identity',
						}),
						defineField({
							name: 'credentials',
							title: 'Credentials & Accreditations',
							description: 'e.g., PhD, MBA, MD, FACS, Chartered Engineer',
							type: 'string',
							fieldset: 'identity',
						}),
						defineField({
							name: 'department',
							title: 'Department / Group',
							description:
								'e.g., Executive Leadership, Scientific Advisory Board, Sustainable Engineering',
							type: 'string',
							fieldset: 'identity',
						}),
						defineField({
							name: 'image',
							title: 'Profile Portrait / Headshot',
							description:
								'Recommended size: 400 × 533 px (3:4 ratio) or 400 × 400 px (1:1 square), WebP/PNG.',
							type: 'image',
							options: {
								hotspot: true,
							},
						}),
						defineField({
							name: 'shortBio',
							title: 'Short Biography',
							description: 'Brief executive bio highlighting domain expertise, pedigree, or key career achievements.',
							type: 'text',
							rows: 3,
							fieldset: 'details',
						}),
						defineField({
							name: 'socialLinks',
							title: 'Professional Profiles & Social Links',
							description: 'Verified public profiles (e.g. LinkedIn, X, Website, GitHub, Email).',
							type: 'array',
							fieldset: 'details',
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
													{ title: 'GitHub', value: 'github' },
													{ title: 'Email (Contact)', value: 'email' },
													{ title: 'Instagram', value: 'instagram' },
													{ title: 'Facebook', value: 'facebook' },
													{ title: 'YouTube', value: 'youtube' },
												],
											},
										}),
										defineField({
											name: 'url',
											title: 'Profile URL or Mailto Link',
											type: 'string',
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
						prepare({ title, subtitle, media }) {
							return {
								title: title || 'Unnamed Member',
								subtitle: subtitle || 'Custom Team Member',
								media,
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'ctas',
			title: 'Section Call-to-actions',
			description:
				'Optional conversion action buttons below the team grid (e.g. "Join Our Team", "Contact Press Relations").',
			type: 'array',
			of: [{ type: 'cta' }],
			group: 'content',
		}),

		// ---------------- Layout & Grid Tab ----------------
		defineField({
			name: 'layout',
			title: 'Display Layout Mode',
			description:
				'Select the overall architectural layout for presenting leadership and expert profiles.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Responsive Grid — Balanced multi-column cards (Recommended)',
						value: 'grid',
					},
					{
						title: 'Interactive Carousel — Swipeable horizontal track with navigation arrows',
						value: 'carousel',
					},
					{
						title: 'Executive Spotlight — Featured leader highlighted first, followed by supporting team',
						value: 'featured',
					},
					{
						title: 'Compact Directory — Space-saving horizontal layout for large advisory rosters',
						value: 'compact',
					},
				],
				layout: 'radio',
			},
			initialValue: 'grid',
			group: 'layout',
		}),
		defineField({
			name: 'columns',
			title: 'Desktop Grid Columns',
			description: 'Number of profile cards per row on desktop screens.',
			type: 'number',
			options: {
				list: [
					{ title: '2 Columns — Large cards with detailed bios', value: 2 },
					{ title: '3 Columns — Balanced presentation (Recommended)', value: 3 },
					{ title: '4 Columns — Compact grid for larger leadership teams', value: 4 },
				],
				layout: 'radio',
			},
			initialValue: 3,
			group: 'layout',
			hidden: ({ parent }) => parent?.layout === 'compact',
		}),
		defineField({
			name: 'mobileLayout',
			title: 'Mobile Display Layout',
			description:
				'How profiles adapt on smartphone screens (under 640px).',
			type: 'string',
			options: {
				list: [
					{
						title: 'Horizontal Swipe Carousel — Space-saving cards with smooth touch swipe (Recommended)',
						value: 'carousel',
					},
					{
						title: '1 Column Stack — Standard vertical scrolling feed',
						value: 'stack',
					},
					{
						title: '2 Columns Grid — Ultra-compact side-by-side cards',
						value: 'grid-2',
					},
				],
				layout: 'radio',
			},
			initialValue: 'carousel',
			group: 'layout',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Section Header Alignment',
			description: 'Alignment for the badge, main heading, and intro paragraph.',
			type: 'string',
			options: {
				list: [
					{ title: 'Center — Symmetric pitch style (Recommended)', value: 'center' },
					{ title: 'Left — Clean editorial / Corporate B2B style', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
		}),
		defineField({
			name: 'textAlign',
			title: 'Card Content Alignment',
			description: 'Alignment of member name, role, bio, and social icons inside each card.',
			type: 'string',
			options: {
				list: [
					{ title: 'Left — Clean & easily readable (Recommended)', value: 'left' },
					{ title: 'Center — Formal symmetric focus', value: 'center' },
				],
				layout: 'radio',
			},
			initialValue: 'left',
			group: 'layout',
		}),
		defineField({
			name: 'enableFilter',
			title: 'Enable Department / Group Filter Tabs',
			description:
				'When enabled, category filter pills (e.g. "All", "Executive", "Advisors") will appear above the cards if members have department tags.',
			type: 'boolean',
			initialValue: false,
			group: 'layout',
		}),

		// ---------------- Appearance & Style Tab ----------------
		defineField({
			name: 'cardStyle',
			title: 'Card Visual Style',
			description: 'Container styling and border treatment for each member card.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Bordered Card — Clean borders & subtle shadow (Standard)',
						value: 'card',
					},
					{
						title: 'Elevated — Soft elevated shadow with floating hover lift',
						value: 'elevated',
					},
					{
						title: 'Minimal Editorial — Clean borderless with subtle hover tint',
						value: 'minimal',
					},
					{
						title: 'Glassmorphism — Translucent surface with soft backdrop blur',
						value: 'glass',
					},
				],
				layout: 'radio',
			},
			initialValue: 'card',
			group: 'design',
		}),
		defineField({
			name: 'imageAspectRatio',
			title: 'Portrait Aspect Ratio',
			description: 'Proportion for member headshot photos.',
			type: 'string',
			options: {
				list: [
					{
						title: '3:4 Executive Portrait — Classic corporate headshot (Recommended)',
						value: '3/4',
					},
					{
						title: '1:1 Square — Modern tech and SaaS avatar style',
						value: '1/1',
					},
					{
						title: 'Circular Avatar — Soft friendly rounded portrait',
						value: 'circle',
					},
					{
						title: '4:3 Landscape — Cinematic wide portrait',
						value: '4/3',
					},
				],
				layout: 'radio',
			},
			initialValue: '3/4',
			group: 'design',
		}),
		defineField({
			name: 'imageEffect',
			title: 'Portrait Color Filter',
			description: 'Visual filter treatment applied to headshot photos.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Full Color — Natural photography (Default)',
						value: 'color',
					},
					{
						title: 'Monochrome to Color — Editorial black & white, reveals color on hover',
						value: 'grayscale',
					},
				],
				layout: 'radio',
			},
			initialValue: 'color',
			group: 'design',
		}),
		defineField({
			name: 'showBio',
			title: 'Display Biography',
			description: 'Show executive biographies below member roles.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'bioLength',
			title: 'Bio Display Length',
			description: 'Maximum lines before truncating biography text.',
			type: 'string',
			options: {
				list: [
					{ title: '3 Lines — Compact summary (Recommended)', value: 'clamp-3' },
					{ title: '5 Lines — Extended paragraph', value: 'clamp-5' },
					{ title: 'Full Bio — Unclamped complete biography', value: 'full' },
				],
				layout: 'radio',
			},
			initialValue: 'clamp-3',
			group: 'design',
			hidden: ({ parent }) => !parent?.showBio,
		}),
		defineField({
			name: 'showSocial',
			title: 'Show Professional & Social Profile Links',
			description: 'Display interactive icons for verified LinkedIn, X, Website, GitHub, or Email profiles.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'spacing',
			title: 'Section Vertical Spacing',
			description: 'Vertical padding between this section and neighboring page modules.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default — Balanced padding (Recommended)', value: 'default' },
					{ title: 'Compact — Reduced padding for dense layouts', value: 'compact' },
					{ title: 'Spacious — Generous editorial whitespace', value: 'spacious' },
					{ title: 'None — Zero vertical padding', value: 'none' },
				],
				layout: 'radio',
			},
			initialValue: 'default',
			group: 'design',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'person-list',
		icon: UsersIcon,
		titleFields: ['badge', 'intro'],
		select: {
			people: 'people',
			layout: 'layout',
			columns: 'columns',
		},
		metadata: (doc) => [
			doc.people?.length
				? `${doc.people.length} member${doc.people.length === 1 ? '' : 's'}`
				: 'No members',
			doc.layout ? `${doc.layout}` : 'grid',
		],
	}),
})
