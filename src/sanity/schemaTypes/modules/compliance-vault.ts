import { defineArrayMember, defineField, defineType } from 'sanity'
import { CheckmarkCircleIcon, DocumentIcon, NumberIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'compliance-vault',
	title: 'Trust & Compliance Vault',
	description:
		'Showcase industry certifications, factory metrics, and gated document downloads for international buyers.',
	type: 'object',
	icon: CheckmarkCircleIcon,
	initialValue: () => {
		const genKey = () => Math.random().toString(36).substring(2, 9)
		return {
			badge: 'Verified International Standards & ESG Compliance',
			headline: 'Certified Global Manufacturing & Sustainable Supply Chain',
			subtitle:
				'Every batch is rigorously tested for international food-contact safety, home-compostability, and zero plastic migration. Certified by world-class audit bodies.',
			headerAlignment: 'center',
			showMetrics: true,
			showCertificates: true,
			showGatedDocuments: true,
			certificatesTitle: 'Recognized International Standards & Accreditations',
			certificatesSubtitle:
				'Independently audited and certified by leading global inspection authorities',
			dossierBadge: 'Confidential Export Dossier & Compliance Vault',
			dossierHeadline:
				'Download Factory Audit Reports, Technical Data Sheets & 2026 Catalog',
			dossierSubtitle:
				'Exclusively for Procurement Directors, Supply Chain Executives, and Global Wholesalers.',
			privacyNotice:
				'100% privacy protected. Contact information is strictly used for verification and technical dossier access.',
			vaultTheme: 'dark',
			certificates: [
				{
					_key: genKey(),
					title: 'FDA 21 CFR 176.170',
					issuer: 'US Food & Drug Administration',
					code: 'FDA-GRAS-2025',
					description:
						'Certified food-contact safe with aqueous and fatty foods. Zero chemical migration.',
				},
				{
					_key: genKey(),
					title: 'ISO 9001:2015',
					issuer: 'TÜV SÜD Management Service',
					code: 'TUV-ISO-9001-VN',
					description:
						'International quality management system in cleanroom manufacturing.',
				},
				{
					_key: genKey(),
					title: 'ISO 14001:2015',
					issuer: 'SGS International',
					code: 'SGS-EMS-2024',
					description:
						'Environmental management compliance with zero wastewater discharge.',
				},
				{
					_key: genKey(),
					title: 'BPI & OK Compost HOME',
					issuer: 'TÜV Austria & BPI',
					code: 'EN 13432 / ASTM D6400',
					description:
						'100% biodegradable in home and industrial composting conditions within 90 days.',
				},
			],
			gatedDocuments: [
				{
					_key: genKey(),
					title:
						'Full Factory Audit & Social Compliance Report (SMETA 4-Pillar)',
					category: 'audit',
					fileSize: '4.8 MB PDF',
					description:
						'Complete social compliance, labor ethics, environmental health, and fire safety audit.',
				},
				{
					_key: genKey(),
					title: 'Master Technical Data Sheet (TDS) & Material Safety (MSDS)',
					category: 'specs',
					fileSize: '2.1 MB PDF',
					description:
						'Complete technical specifications, mechanical tensile ratings, and thermal stability boundaries.',
				},
				{
					_key: genKey(),
					title: '2026 Export Product Catalog & Volume Price Deck',
					category: 'catalog',
					fileSize: '8.4 MB PDF',
					description:
						'Full range SKU specifications, pallet loading configurations, and tiered volume pricing tiers.',
				},
			],
			factoryMetrics: [
				{
					_key: genKey(),
					value: '500,000+',
					label: 'Daily Output Capacity',
					subtitle: 'Automatic thermoforming lines',
				},
				{
					_key: genKey(),
					value: '25,000 m²',
					label: 'Cleanroom Production Area',
					subtitle: 'ISO Class 8 certified',
				},
				{
					_key: genKey(),
					value: '32+',
					label: 'Global Export Destinations',
					subtitle: 'US, EU, Japan, Australia & ASEAN',
				},
				{
					_key: genKey(),
					value: '100%',
					label: 'Traceable Bio-Feedstock',
					subtitle: 'Upcycled agricultural sugarcane pulp',
				},
			],
		}
	},
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'layout', title: 'Layout & Visibility' },
		{ name: 'design', title: 'Design & Theme' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Header & Value Proposition',
			options: { columns: 1 },
		},
		{
			name: 'visibilityToggles',
			title: 'Section Visibility & Alignment',
			options: { columns: 1 },
		},
		{
			name: 'credentials',
			title: '1. Certifications & Lab Badges',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'dossier',
			title: '2. Gated Confidential Dossier (Lead Capture)',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'metrics',
			title: '3. Factory Scale & Output Metrics',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'appearance',
			title: 'Visual Theme & Atmosphere',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// Header & Positioning
		defineField({
			name: 'badge',
			title: 'Header Badge',
			description:
				'Small uppercase pill badge displayed above the main headline.',
			type: 'string',
			initialValue: 'Verified International Standards & ESG Compliance',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headline',
			title: 'Section Headline',
			description:
				'Primary headline highlighting regulatory compliance and industrial credibility.',
			type: 'string',
			initialValue: 'Certified Global Manufacturing & Sustainable Supply Chain',
			validation: (Rule) =>
				Rule.required().error('Section Headline is required.'),
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'subtitle',
			title: 'Subtitle & Testing Scope',
			description:
				'Contextual explanation of audit bodies and lab testing rigor.',
			type: 'text',
			rows: 2,
			initialValue:
				'Every batch is rigorously tested for international food-contact safety, home-compostability, and zero plastic migration. Certified by world-class audit bodies.',
			group: 'content',
			fieldset: 'headerInfo',
		}),

		// Layout & Visibility
		defineField({
			name: 'headerAlignment',
			title: 'Header Text Alignment',
			type: 'string',
			options: {
				list: [
					{ title: 'Centered (Default)', value: 'center' },
					{ title: 'Left-aligned', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'visibilityToggles',
		}),
		defineField({
			name: 'showMetrics',
			title: 'Show Factory Scale Metrics Bar',
			description:
				'Display quantitative production capacity and facility scale statistics.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
			fieldset: 'visibilityToggles',
		}),
		defineField({
			name: 'showCertificates',
			title: 'Show Public Certifications Grid',
			description:
				'Display international standard badges (FDA, ISO, BPI, etc.).',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
			fieldset: 'visibilityToggles',
		}),
		defineField({
			name: 'showGatedDocuments',
			title: 'Show Gated Dossier Vault (Lead Capture)',
			description:
				'Display confidential downloadable PDF vault requiring business email.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
			fieldset: 'visibilityToggles',
		}),

		// 1. Accreditations / Certificates
		defineField({
			name: 'certificatesTitle',
			title: 'Certificates Section Title',
			type: 'string',
			initialValue: 'Recognized International Standards & Accreditations',
			group: 'content',
			fieldset: 'credentials',
			hidden: ({ parent }) => parent?.showCertificates === false,
		}),
		defineField({
			name: 'certificatesSubtitle',
			title: 'Certificates Section Subtitle',
			type: 'string',
			initialValue:
				'Independently audited and certified by leading global inspection authorities',
			group: 'content',
			fieldset: 'credentials',
			hidden: ({ parent }) => parent?.showCertificates === false,
		}),
		defineField({
			name: 'certificates',
			title: 'Public Certificates & Testing Badges',
			description:
				'Add international certifications, laboratory test reports, and audit certificates.',
			type: 'array',
			group: 'content',
			fieldset: 'credentials',
			hidden: ({ parent }) => parent?.showCertificates === false,
			of: [
				defineArrayMember({
					type: 'object',
					name: 'certItem',
					title: 'Certificate',
					icon: CheckmarkCircleIcon,
					fields: [
						defineField({
							name: 'title',
							title: 'Standard / Certificate Name',
							description:
								'E.g., FDA 21 CFR 176.170, ISO 9001:2015, BPI Compostable',
							type: 'string',
							validation: (Rule) =>
								Rule.required().error('Certificate Name is required.'),
						}),
						defineField({
							name: 'issuer',
							title: 'Audit Body / Testing Lab',
							description: 'E.g., TÜV SÜD, SGS, US FDA, BSI, Intertek',
							type: 'string',
						}),
						defineField({
							name: 'code',
							title: 'Standard Code / Registration ID',
							description: 'E.g., FDA-GRAS-2025, EN 13432',
							type: 'string',
						}),
						defineField({
							name: 'description',
							title: 'Scope of Compliance & Testing Details',
							description:
								'Summary of the testing scope and chemical / environmental safety boundaries.',
							type: 'text',
							rows: 2,
						}),
						defineField({
							name: 'badgeIcon',
							title: 'Certification Logo / Emblem',
							description: 'High-resolution logo or official badge icon.',
							type: 'image',
							options: { hotspot: true },
						}),
						defineField({
							name: 'verifyUrl',
							title: 'Public Verification URL (Optional)',
							description:
								'Link to official registry, database, or certificate validator.',
							type: 'url',
							validation: (Rule) =>
								Rule.uri({
									scheme: ['http', 'https'],
									allowRelative: false,
								}),
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'issuer',
							media: 'badgeIcon',
							code: 'code',
						},
						prepare({ title, subtitle, media, code }) {
							return {
								title: title || 'Certificate',
								subtitle: [
									subtitle ? `Issued by ${subtitle}` : null,
									code ? `(${code})` : null,
								]
									.filter(Boolean)
									.join(' '),
								media: media || CheckmarkCircleIcon,
							}
						},
					},
				}),
			],
		}),

		// 2. Gated Documents Vault
		defineField({
			name: 'dossierBadge',
			title: 'Dossier Vault Pill Badge',
			type: 'string',
			initialValue: 'Confidential Export Dossier & Compliance Vault',
			group: 'content',
			fieldset: 'dossier',
			hidden: ({ parent }) => parent?.showGatedDocuments === false,
		}),
		defineField({
			name: 'dossierHeadline',
			title: 'Dossier Vault Headline',
			type: 'string',
			initialValue:
				'Download Factory Audit Reports, Technical Data Sheets & 2026 Catalog',
			group: 'content',
			fieldset: 'dossier',
			hidden: ({ parent }) => parent?.showGatedDocuments === false,
		}),
		defineField({
			name: 'dossierSubtitle',
			title: 'Dossier Vault Subtitle / Target Audience',
			type: 'text',
			rows: 2,
			initialValue:
				'Exclusively for Procurement Directors, Supply Chain Executives, and Global Wholesalers.',
			group: 'content',
			fieldset: 'dossier',
			hidden: ({ parent }) => parent?.showGatedDocuments === false,
		}),
		defineField({
			name: 'privacyNotice',
			title: 'Privacy & Data Protection Notice',
			description:
				'Reassurance text displayed in the unlock modal dialog (GDPR & CAN-SPAM compliant).',
			type: 'string',
			initialValue:
				'100% privacy protected. Contact information is strictly used for verification and technical dossier access.',
			group: 'content',
			fieldset: 'dossier',
			hidden: ({ parent }) => parent?.showGatedDocuments === false,
		}),
		defineField({
			name: 'gatedDocuments',
			title: 'Gated Confidential Documents',
			description:
				'High-value assets such as Factory Audits, MSDS, and Full Catalog. Buyers submit business email to unlock instant download.',
			type: 'array',
			group: 'content',
			fieldset: 'dossier',
			hidden: ({ parent }) => parent?.showGatedDocuments === false,
			of: [
				defineArrayMember({
					type: 'object',
					name: 'docItem',
					title: 'Document Asset',
					icon: DocumentIcon,
					fields: [
						defineField({
							name: 'title',
							title: 'Document Title',
							description:
								'Clear title indicating the contents (e.g., SMETA 4-Pillar Audit).',
							type: 'string',
							validation: (Rule) =>
								Rule.required().error('Document title is required.'),
						}),
						defineField({
							name: 'category',
							title: 'Asset Type & Category',
							type: 'string',
							options: {
								list: [
									{ title: 'Factory Audit & ESG Report', value: 'audit' },
									{ title: 'Technical Data Sheet (TDS/MSDS)', value: 'specs' },
									{ title: 'Wholesale Catalog & Price Deck', value: 'catalog' },
									{ title: 'Food-Contact Migration Test', value: 'test' },
									{ title: 'Sustainability & Carbon Footprint', value: 'esg' },
								],
							},
							initialValue: 'audit',
						}),
						defineField({
							name: 'description',
							title: 'Document Summary / Teaser',
							description:
								'Brief 1-2 sentence description of what the document contains.',
							type: 'text',
							rows: 2,
							initialValue:
								'Complete dossier including independent test methodologies and comprehensive chemical migration reports.',
						}),
						defineField({
							name: 'fileSize',
							title: 'File Size & Format Label',
							description: 'E.g., "4.8 MB PDF" or "High-Res PDF"',
							type: 'string',
							initialValue: 'PDF Document',
						}),
						defineField({
							name: 'fileAsset',
							title: 'PDF Document File (Upload)',
							description:
								'Upload the secure PDF file asset directly to Sanity CDN.',
							type: 'file',
							options: { accept: 'application/pdf' },
						}),
						defineField({
							name: 'externalDownloadUrl',
							title: 'External Download Link (Fallback / CDN)',
							description:
								'Optional external secure link if hosted on Google Drive, Dropbox, or custom CDN.',
							type: 'url',
							validation: (Rule) =>
								Rule.uri({
									scheme: ['http', 'https'],
									allowRelative: false,
								}),
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'fileSize',
							category: 'category',
						},
						prepare({ title, subtitle, category }) {
							const categoryLabels: Record<string, string> = {
								audit: 'Factory Audit',
								specs: 'TDS / MSDS',
								catalog: 'Price Catalog',
								test: 'Migration Test',
								esg: 'ESG / Sustainability',
							}
							return {
								title: title || 'Document',
								subtitle: [
									subtitle || 'PDF Asset',
									category ? categoryLabels[category] : null,
								]
									.filter(Boolean)
									.join(' • '),
								media: DocumentIcon,
							}
						},
					},
				}),
			],
		}),

		// 3. Factory Scale & Metrics
		defineField({
			name: 'factoryMetrics',
			title: 'Factory Scale & Output Metrics',
			description:
				'Key quantifiable metrics showing manufacturing power, cleanroom size, and global export reach.',
			type: 'array',
			group: 'content',
			fieldset: 'metrics',
			hidden: ({ parent }) => parent?.showMetrics === false,
			of: [
				defineArrayMember({
					type: 'object',
					name: 'metricItem',
					title: 'Metric',
					icon: NumberIcon,
					fields: [
						defineField({
							name: 'value',
							title: 'Statistic / Value',
							description: 'E.g., "500,000+", "25,000 m²", "100%"',
							type: 'string',
							validation: (Rule) => Rule.required().error('Value is required.'),
						}),
						defineField({
							name: 'label',
							title: 'Metric Label',
							description: 'E.g., "Daily Output Capacity", "Production Area"',
							type: 'string',
							validation: (Rule) => Rule.required().error('Label is required.'),
						}),
						defineField({
							name: 'subtitle',
							title: 'Supporting Detail / Subtext',
							description:
								'E.g., "Automatic thermoforming lines", "ISO Class 8 certified"',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'value',
							subtitle: 'label',
							extra: 'subtitle',
						},
						prepare({ title, subtitle, extra }) {
							return {
								title: title || 'Metric',
								subtitle: [subtitle, extra ? `(${extra})` : null]
									.filter(Boolean)
									.join(' '),
								media: NumberIcon,
							}
						},
					},
				}),
			],
		}),

		// Design & Theme
		defineField({
			name: 'vaultTheme',
			title: 'Dossier Vault Card Theme',
			description:
				'Choose between a high-contrast Dark Premium Slate theme or a Crisp Light Corporate design.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Dark Premium (Slate Navy with Amber Accents)',
						value: 'dark',
					},
					{
						title: 'Light Corporate (Crisp White with Indigo/Emerald Accents)',
						value: 'light',
					},
				],
				layout: 'radio',
			},
			initialValue: 'dark',
			group: 'design',
			fieldset: 'appearance',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'compliance-vault',
		icon: CheckmarkCircleIcon,
		titleFields: ['headline', 'badge'],
		select: {
			badge: 'badge',
			vaultTheme: 'vaultTheme',
			certs: 'certificates',
			docs: 'gatedDocuments',
		},
		metadata: (doc) => [
			doc.badge || null,
			doc.vaultTheme ? `Theme: ${doc.vaultTheme}` : null,
			doc.certs?.length ? `${doc.certs.length} certs` : null,
			doc.docs?.length ? `${doc.docs.length} docs` : null,
		],
	}),
})
