'use client'

import {
	set,
	useFormValue,
	type ArrayInputFunctionsProps,
	type ArrayOfObjectsInputProps,
} from 'sanity'
import { AddIcon } from '@sanity/icons'
import {
	Badge,
	Box,
	Button,
	Card,
	Dialog,
	Flex,
	Grid,
	Heading,
	Stack,
	Tab,
	TabList,
	Text,
	TextInput,
	useToast,
} from '@sanity/ui'
import React, { useCallback, useMemo, useState } from 'react'
import {
	FiCheck,
	FiExternalLink,
	FiEye,
	FiGrid,
	FiInfo,
	FiLayers,
	FiLayout,
	FiPlus,
	FiSearch,
	FiShoppingBag,
	FiTrash2,
	FiZap,
	FiZoomIn,
	FiZoomOut,
} from 'react-icons/fi'
import {
	DEFAULT_TEMPLATES,
	type BuiltinTemplate,
} from '../constants/default-templates'
import { deepCloneAndRegenerateKeys } from '../lib/deep-clone-and-regenerate-keys'

const HOME_PAGE_ID =
	process.env.SANITY_STUDIO_HOME_PAGE_ID ||
	'7afa548f-8003-4d6e-9fb2-25a3eb2c51a4'

type PillarFilter = 'all' | 'd2c_fast' | 'high_ticket' | 'b2b_rfq'

interface StoreTemplateItem {
	_id: string
	title: string
	description?: string
	funnelPillar: 'd2c_fast' | 'high_ticket' | 'b2b_rfq'
	industry?: string
	conversionBadge?: string
	thumbnailUrl?: string
	livePreviewUrl?: string
	moduleCount: number
	isBuiltin?: boolean
	modules: any[]
}

interface VerticalTemplateCardProps {
	template: StoreTemplateItem
	orderNumber?: number
	onPreview: () => void
	onApply: () => void
}

function VerticalTemplateCard({
	template,
	orderNumber,
	onPreview,
	onApply,
}: VerticalTemplateCardProps) {
	const [isHovered, setIsHovered] = useState(false)
	const hasThumbnail = Boolean(template.thumbnailUrl?.trim())

	return (
		<Card
			radius={3}
			border
			tone="default"
			style={{
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
				transition: 'transform 0.18s ease, box-shadow 0.18s ease',
			}}
		>
			{/* Preview Container (320px) */}
			<Box
				style={{
					position: 'relative',
					height: '320px',
					overflow: 'hidden',
					backgroundColor: '#ffffff',
					cursor: 'pointer',
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onPreview}
			>
				{hasThumbnail ? (
					<div
						style={{
							width: '100%',
							height: '100%',
							backgroundImage: `url(${template.thumbnailUrl})`,
							backgroundSize: '100% auto',
							backgroundPosition: isHovered ? 'bottom center' : 'top center',
							backgroundRepeat: 'no-repeat',
							transition: isHovered
								? 'background-position 3.5s ease-in-out'
								: 'background-position 1.2s ease-in-out',
						}}
					/>
				) : (
					<Box
						style={{
							height: '100%',
							padding: '24px 16px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							textAlign: 'center',
							background:
								'linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
							border: '1.5px dashed #cbd5e1',
							borderRadius: '10px',
							margin: '4px',
							boxSizing: 'border-box',
						}}
					>
						{/* Centered Icon */}
						<Box
							style={{
								width: '48px',
								height: '48px',
								borderRadius: '50%',
								backgroundColor: '#ecfdf5',
								border: '1.5px solid #a7f3d0',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#059669',
								marginBottom: '10px',
							}}
						>
							<FiLayers size={24} />
						</Box>

						{/* Centered Badge with Order Number */}
						<Badge tone="positive" fontSize={1}>
							Template #{orderNumber || 1}
						</Badge>

						{/* Centered Info Chips */}
						<Flex
							justify="center"
							align="center"
							gap={1}
							marginTop={3}
							wrap="wrap"
						>
							<Badge tone="primary" fontSize={0}>
								{template.moduleCount} modules
							</Badge>
							{template.industry && (
								<Badge tone="default" fontSize={0}>
									{template.industry}
								</Badge>
							)}
						</Flex>

						<Text
							size={0}
							style={{
								color: '#94a3b8',
								marginTop: '12px',
								fontSize: '11px',
							}}
						>
							Click to preview structure
						</Text>
					</Box>
				)}
			</Box>

			{/* Minimal Info: Title + Module Count (Zero description clutter) */}
			<Stack space={1} padding={3}>
				<Text size={1} weight="bold" textOverflow="ellipsis">
					{template.title}
				</Text>
				<Text size={0} muted>
					{template.moduleCount} modules
				</Text>
			</Stack>

			{/* 2-Button Action Bar */}
			<Grid columns={2} gap={2} padding={3} style={{ paddingTop: 0 }}>
				<Button
					mode="ghost"
					icon={FiEye}
					text="Preview"
					fontSize={1}
					padding={2}
					onClick={onPreview}
				/>
				<Button
					tone="primary"
					icon={FiZap}
					text="Apply"
					fontSize={1}
					padding={2}
					onClick={onApply}
				/>
			</Grid>
		</Card>
	)
}

interface ModuleCatalogItem {
	name: string
	title: string
	category: 'commerce-conversion' | 'story-layout' | 'trust-utilities'
	badgeLabel: string
	badgeTone: 'primary' | 'positive' | 'caution' | 'critical'
	description: string
	thumbnail: string
}

const MODULE_CATALOG_ITEMS: ModuleCatalogItem[] = [
	// 1. Commerce & Conversion (7 modules)
	{
		name: 'product-list',
		title: 'Product Showcase',
		category: 'commerce-conversion',
		badgeLabel: 'Commerce',
		badgeTone: 'positive',
		description:
			'Display curated collection or catalog product grids with category filtering, pagination, and touch carousels.',
		thumbnail: '/thumbnails/modules/product-list.svg',
	},
	{
		name: 'tiered-pricing',
		title: 'Volume Pricing (MOQ)',
		category: 'commerce-conversion',
		badgeLabel: 'CRO / B2B',
		badgeTone: 'positive',
		description:
			'MOQ and volume discount pricing tables tailored for high-conversion B2B wholesale orders.',
		thumbnail: '/thumbnails/modules/tiered-pricing.svg',
	},
	{
		name: 'compliance-vault',
		title: 'Trust & Compliance Vault',
		category: 'commerce-conversion',
		badgeLabel: 'Trust / CRO',
		badgeTone: 'positive',
		description:
			'Showcase industry certifications, factory metrics, and gated document downloads for international buyers.',
		thumbnail: '/thumbnails/modules/compliance-vault.svg',
	},
	{
		name: 'countdown-banner',
		title: 'Urgency Timer',
		category: 'commerce-conversion',
		badgeLabel: 'Urgency',
		badgeTone: 'critical',
		description:
			'Urgency countdown timer with deadline date, action copy, and instant checkout CTA.',
		thumbnail: '/thumbnails/modules/countdown-banner.svg',
	},
	{
		name: 'sticky-mobile-cta',
		title: 'Sticky Buy Bar',
		category: 'commerce-conversion',
		badgeLabel: 'Mobile CRO',
		badgeTone: 'caution',
		description:
			'Fixed bottom purchase bar with product info, pricing, and mobile checkout trigger for conversion rate optimization.',
		thumbnail: '/thumbnails/modules/sticky-mobile-cta.svg',
	},
	{
		name: 'lead-capture-form',
		title: 'RFQ & Lead Form',
		category: 'commerce-conversion',
		badgeLabel: 'Lead Gen',
		badgeTone: 'positive',
		description:
			'High-converting opt-in form with customizable input fields, value propositions, and webhook integration.',
		thumbnail: '/thumbnails/modules/lead-capture-form.svg',
	},
	{
		name: 'social-proof',
		title: 'Verified Reviews',
		category: 'commerce-conversion',
		badgeLabel: 'Proof',
		badgeTone: 'positive',
		description:
			'Live order trust badges, metric counters, and verified buyer reviews to boost conversion rate.',
		thumbnail: '/thumbnails/modules/social-proof.svg',
	},

	// 2. Story & Layout (9 modules)
	{
		name: 'hero.split',
		title: 'Split Hero',
		category: 'story-layout',
		badgeLabel: 'Layout',
		badgeTone: 'primary',
		description:
			'High-impact split section with headline, marketing copy, action CTAs, and featured media.',
		thumbnail: '/thumbnails/modules/hero.split.svg',
	},
	{
		name: 'card-list',
		title: 'Feature Cards',
		category: 'story-layout',
		badgeLabel: 'Features',
		badgeTone: 'primary',
		description:
			'Multi-column cards highlighting key features, services, or product USPs.',
		thumbnail: '/thumbnails/modules/card-list.svg',
	},
	{
		name: 'step-list',
		title: 'Process Steps',
		category: 'story-layout',
		badgeLabel: 'Process',
		badgeTone: 'primary',
		description:
			'Sequential numbered milestone workflow illustrating how your product, fulfillment, or partnership operates.',
		thumbnail: '/thumbnails/modules/step-list.svg',
	},
	{
		name: 'hero-slider',
		title: 'Hero Slider',
		category: 'story-layout',
		badgeLabel: 'Hero / CRO',
		badgeTone: 'positive',
		description:
			'Mobile-first high-impact hero visual carousel with responsive desktop/mobile imagery, headline overlays, and conversion CTAs.',
		thumbnail: '/thumbnails/modules/hero-slider.svg',
	},
	{
		name: 'media-grid',
		title: 'Media Grid',
		category: 'story-layout',
		badgeLabel: 'Zero-JS Grid',
		badgeTone: 'primary',
		description:
			'High-performance visual promo and category grid with zero-JS mobile card-peeking scroll-snap.',
		thumbnail: '/thumbnails/modules/media-grid.svg',
	},
	{
		name: 'carousel-banner-list',
		title: 'Media Slider',
		category: 'story-layout',
		badgeLabel: 'Lookbook',
		badgeTone: 'primary',
		description:
			'Clean visual image and lookbook carousel with responsive images, links, and smooth touch swipe.',
		thumbnail: '/thumbnails/modules/carousel-banner-list.svg',
	},
	{
		name: 'prose',
		title: 'Editorial Story',
		category: 'story-layout',
		badgeLabel: 'Editorial',
		badgeTone: 'primary',
		description:
			'Long-form rich-text editorial copy formatted with headings, typography, quotes, and embedded media.',
		thumbnail: '/thumbnails/modules/prose.svg',
	},
	{
		name: 'callout',
		title: 'Promo Callout',
		category: 'story-layout',
		badgeLabel: 'Highlight',
		badgeTone: 'caution',
		description:
			'Prominent highlight box with colored accent border, tags, notice text, and CTA.',
		thumbnail: '/thumbnails/modules/callout.svg',
	},
	{
		name: 'comparison-table',
		title: 'Us vs. Them Comparison',
		category: 'story-layout',
		badgeLabel: 'CRO / D2C',
		badgeTone: 'positive',
		description:
			'Head-to-head comparison matrix highlighting brand differentiators against competitors.',
		thumbnail: '/thumbnails/modules/comparison-table.svg',
	},

	// 3. Trust & Utilities (7 modules)
	{
		name: 'quote-list',
		title: 'Wall of Love',
		category: 'trust-utilities',
		badgeLabel: 'Reviews',
		badgeTone: 'positive',
		description:
			'Verified reviews, client testimonials, and star-rated customer quote blocks.',
		thumbnail: '/thumbnails/modules/quote-list.svg',
	},
	{
		name: 'logo-list',
		title: 'Logo Marquee',
		category: 'trust-utilities',
		badgeLabel: 'Partners',
		badgeTone: 'primary',
		description:
			'Logo showcase building brand authority with trusted partners, enterprise clients, and press features.',
		thumbnail: '/thumbnails/modules/logo-list.svg',
	},
	{
		name: 'stat-list',
		title: 'Impact Metrics',
		category: 'trust-utilities',
		badgeLabel: 'Proof',
		badgeTone: 'primary',
		description:
			'Large numeric proof points emphasizing business scale, growth, sustainability impact, and achievements.',
		thumbnail: '/thumbnails/modules/stat-list.svg',
	},
	{
		name: 'accordion-list',
		title: 'FAQ Drawer',
		category: 'trust-utilities',
		badgeLabel: 'FAQ',
		badgeTone: 'primary',
		description:
			'Expandable question-and-answer list with built-in Schema.org FAQ SEO markup.',
		thumbnail: '/thumbnails/modules/accordion-list.svg',
	},
	{
		name: 'person-list',
		title: 'Leadership & Experts',
		category: 'trust-utilities',
		badgeLabel: 'Team',
		badgeTone: 'primary',
		description:
			'Member profiles showcasing executive leadership, advisory board, and sustainability experts.',
		thumbnail: '/thumbnails/modules/person-list.svg',
	},
	{
		name: 'blog-post-list',
		title: 'Content Hub / Insights',
		category: 'trust-utilities',
		badgeLabel: 'Articles',
		badgeTone: 'primary',
		description:
			'Dynamic editorial article cards with publication dates, tags, and reading times to build topical authority.',
		thumbnail: '/thumbnails/modules/blog-post-list.svg',
	},
	{
		name: 'custom-html',
		title: 'Code & App Embed',
		category: 'trust-utilities',
		badgeLabel: 'Code',
		badgeTone: 'caution',
		description:
			'Raw HTML code, third-party embed widgets (Typeform, Calendly, Maps), scripts, and custom visual styling blocks.',
		thumbnail: '/thumbnails/modules/custom-html.svg',
	},
]

export default function TemplatePickerInput(props: ArrayOfObjectsInputProps) {
	const { value, onChange, renderDefault } = props
	const toast = useToast()

	const docId = useFormValue(['_id']) as string | undefined
	const docType = useFormValue(['_type']) as string | undefined

	// Safeguard: Landing Page Template Store is restricted strictly to 'page' documents
	if (docType && docType !== 'page') {
		return renderDefault(props)
	}

	const isHomePage =
		docId === HOME_PAGE_ID ||
		docId === `drafts.${HOME_PAGE_ID}` ||
		docId === 'homePage' ||
		docId === 'drafts.homePage'

	const [isOpen, setIsOpen] = useState(false)
	const [isCatalogOpen, setIsCatalogOpen] = useState(false)
	const [catalogCategory, setCatalogCategory] = useState<
		'all' | 'commerce-conversion' | 'story-layout' | 'trust-utilities'
	>('all')
	const [catalogSearch, setCatalogSearch] = useState('')

	const [activeTab, setActiveTab] = useState<PillarFilter>('all')
	const [bypassEmptyState, setBypassEmptyState] = useState(false)
	const [pendingTemplate, setPendingTemplate] =
		useState<StoreTemplateItem | null>(null)
	const [previewTemplate, setPreviewTemplate] =
		useState<StoreTemplateItem | null>(null)
	const [isPreviewActualSize, setIsPreviewActualSize] = useState(false)
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)

	// Filter modules in Visual Catalog
	const filteredCatalogModules = useMemo(() => {
		const query = catalogSearch.trim().toLowerCase()
		return MODULE_CATALOG_ITEMS.filter((item) => {
			const matchesCat =
				catalogCategory === 'all' || item.category === catalogCategory
			const matchesQuery =
				!query ||
				item.title.toLowerCase().includes(query) ||
				item.name.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query)
			return matchesCat && matchesQuery
		})
	}, [catalogCategory, catalogSearch])

	// Dynamic category counts for Visual Module Catalog tabs
	const catalogCategoryCounts = useMemo(() => {
		const counts: Record<string, number> = {
			all: MODULE_CATALOG_ITEMS.length,
			'commerce-conversion': 0,
			'story-layout': 0,
			'trust-utilities': 0,
		}
		for (const item of MODULE_CATALOG_ITEMS) {
			if (item.category in counts) {
				counts[item.category]++
			}
		}
		return counts
	}, [])

	// Handler to add a single module from Visual Catalog
	const handleSelectModule = useCallback(
		(moduleName: string, moduleTitle: string) => {
			const newKey = Math.random().toString(36).substring(2, 10)
			const newItem = {
				_type: moduleName,
				_key: newKey,
			}
			props.onItemAppend(newItem as any)
			setIsCatalogOpen(false)
			setBypassEmptyState(true)
			toast.push({
				status: 'success',
				title: `Added "${moduleTitle}" to page`,
			})
		},
		[props, toast],
	)

	// Custom array functions replacing default popover with the Visual Module Catalog modal
	const ArrayFunctions = useCallback(
		(fnProps: ArrayInputFunctionsProps<any, any>) => {
			if (fnProps.readOnly) return null

			return (
				<Grid>
					<Button
						icon={AddIcon}
						mode="ghost"
						text="Add item..."
						onClick={() => setIsCatalogOpen(true)}
						data-testid="add-object-button"
						style={{ width: '100%' }}
					/>
				</Grid>
			)
		},
		[],
	)

	// Standard curated built-in system templates
	const allTemplates = useMemo<StoreTemplateItem[]>(() => {
		return DEFAULT_TEMPLATES.map((tmpl) => ({
			_id: tmpl._id,
			title: tmpl.title,
			description: tmpl.description,
			funnelPillar: tmpl.funnelPillar,
			industry: tmpl.industry,
			conversionBadge: tmpl.conversionBadge,
			thumbnailUrl: tmpl.thumbnailUrl || '',
			moduleCount: tmpl.modules.length,
			isBuiltin: true,
			modules: tmpl.modules,
		}))
	}, [])

	// Filter by selected tab (All or Funnel Pillar)
	const filteredTemplates = useMemo(() => {
		if (activeTab === 'all') return allTemplates
		return allTemplates.filter((tmpl) => tmpl.funnelPillar === activeTab)
	}, [allTemplates, activeTab])

	// Core application routine
	const applyTemplateData = useCallback(
		(template: StoreTemplateItem, mode: 'replace' | 'append') => {
			if (!template.modules || template.modules.length === 0) {
				toast.push({
					status: 'warning',
					title: 'Template has no modules',
					description: 'Selected template is empty and cannot be applied.',
				})
				return
			}

			const cloned = deepCloneAndRegenerateKeys(template.modules)
			const currentModules = Array.isArray(value) ? value : []

			if (mode === 'replace') {
				onChange(set(cloned))
				toast.push({
					status: 'success',
					title: 'Template Applied',
					description: `Replaced modules with '${template.title}' (${cloned.length} blocks).`,
				})
			} else {
				// Append mode
				onChange(set([...currentModules, ...cloned]))
				toast.push({
					status: 'success',
					title: 'Modules Appended',
					description: `Added ${cloned.length} blocks from '${template.title}' to the bottom.`,
				})
			}

			setIsOpen(false)
			setShowConfirmDialog(false)
			setPendingTemplate(null)
			setBypassEmptyState(true)
		},
		[onChange, toast, value],
	)

	// Trigger handler when clicking Apply button on a template card
	const handleSelectTemplate = useCallback(
		(template: StoreTemplateItem) => {
			const hasExistingModules = Array.isArray(value) && value.length > 0

			if (hasExistingModules) {
				setPendingTemplate(template)
				setShowConfirmDialog(true)
			} else {
				applyTemplateData(template, 'replace')
			}
		},
		[applyTemplateData, value],
	)

	const hasModules = Array.isArray(value) && value.length > 0

	// 1. EMPTY STATE VIEW (When page has no modules yet and user hasn't bypassed)
	if (!hasModules && !bypassEmptyState) {
		return (
			<Card
				padding={[3, 4, 5]}
				radius={3}
				tone="primary"
				border
				style={{ borderStyle: 'dashed' }}
			>
				<Stack space={4}>
					{isHomePage && (
						<Card tone="caution" padding={3} radius={2}>
							<Flex align="center" gap={2}>
								<FiInfo size={16} />
								<Text size={1} weight="medium">
									Base Home Page Notice: You can apply a template here, or use
									Campaign Home Override in Global Settings to run temporary
									campaigns safely without modifying this base page.
								</Text>
							</Flex>
						</Card>
					)}

					<Flex
						direction="column"
						align="center"
						justify="center"
						gap={3}
						paddingY={4}
					>
						<Box
							style={{
								padding: '16px',
								borderRadius: '9999px',
								background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
								color: '#ffffff',
							}}
						>
							<FiLayout size={32} />
						</Box>

						<Stack space={2} style={{ textAlign: 'center', maxWidth: 540 }}>
							<Heading size={2} weight="bold" style={{ marginBottom: '12px' }}>
								Build High-Converting Landing Pages in Seconds
							</Heading>
							<Text size={1} muted>
								Choose a DeanFlow pre-optimized template tailored for D2C Fast
								Checkout, High-Ticket Trust, or B2B Wholesale, or start
								assembling custom blocks from scratch.
							</Text>
						</Stack>

						<Flex gap={3} wrap="wrap" justify="center" marginTop={2}>
							<Button
								tone="primary"
								icon={FiZap}
								text="Open Template Store"
								fontSize={2}
								padding={3}
								onClick={() => setIsOpen(true)}
							/>
							<Button
								mode="ghost"
								icon={FiPlus}
								text="Build from Scratch"
								fontSize={2}
								padding={3}
								onClick={() => setBypassEmptyState(true)}
							/>
						</Flex>
					</Flex>

					{/* Hidden array input trigger for accessibility */}
					<Box
						style={{
							opacity: 0.1,
							pointerEvents: 'none',
							height: 0,
							overflow: 'hidden',
						}}
					>
						{renderDefault({
							...props,
							arrayFunctions: ArrayFunctions,
						})}
					</Box>
				</Stack>

				{renderModal()}
			</Card>
		)
	}

	// 2. ACTIVE MODULES VIEW (Renders standard draggable Sanity Array + Header Toolbar Action)
	return (
		<Stack space={3}>
			<Card padding={2} radius={2} tone="inherit" border>
				<Flex align="center" justify="space-between" wrap="wrap" gap={2}>
					<Flex align="center" gap={2}>
						<FiLayers size={16} />
						<Text size={1} weight="semibold">
							Page Modules ({Array.isArray(value) ? value.length : 0})
						</Text>
						{isHomePage && (
							<Badge tone="caution" fontSize={0}>
								Base Home Page
							</Badge>
						)}
					</Flex>

					<Flex gap={2} wrap="wrap">
						<Button
							icon={FiLayout}
							mode="ghost"
							tone="primary"
							fontSize={1}
							padding={2}
							text="Browse Template Store"
							onClick={() => setIsOpen(true)}
						/>
					</Flex>
				</Flex>
			</Card>

			{/* Standard Sanity Draggable Array of Objects Input with native Add item triggering Visual Catalog */}
			{renderDefault({
				...props,
				arrayFunctions: ArrayFunctions,
			})}

			{renderModal()}
		</Stack>
	)

	// Helper sub-renderer for Template Store Modal Dialog
	function renderModal() {
		return (
			<>
				{isOpen && (
					<Dialog
						id="template-store-modal"
						header="Landing Page Template Store"
						onClose={() => setIsOpen(false)}
						width="auto"
					>
						<Box paddingX={[2, 3, 4]} paddingY={[2, 3, 4]}>
							<Stack space={4}>
								{/* Filter Tabs */}
								<Flex
									justify="space-between"
									align="center"
									wrap="wrap"
									gap={2}
								>
									<TabList space={1}>
										<Tab
											id="tab-all"
											aria-controls="tab-all-panel"
											label={`All (${allTemplates.length})`}
											selected={activeTab === 'all'}
											onClick={() => setActiveTab('all')}
										/>
										<Tab
											id="tab-d2c"
											aria-controls="tab-d2c-panel"
											label="D2C Fast Checkout"
											selected={activeTab === 'd2c_fast'}
											onClick={() => setActiveTab('d2c_fast')}
										/>
										<Tab
											id="tab-high"
											aria-controls="tab-high-panel"
											label="High-Ticket"
											selected={activeTab === 'high_ticket'}
											onClick={() => setActiveTab('high_ticket')}
										/>
										<Tab
											id="tab-b2b"
											aria-controls="tab-b2b-panel"
											label="B2B / RFQ"
											selected={activeTab === 'b2b_rfq'}
											onClick={() => setActiveTab('b2b_rfq')}
										/>
									</TabList>

									<Badge tone="primary" fontSize={0}>
										{filteredTemplates.length} Templates Available
									</Badge>
								</Flex>

								{/* Template Grid (Vertical Minimalist Cards) */}
								<Grid columns={[1, 1, 2, 3]} gap={[3, 4]}>
									{filteredTemplates.map((template, idx) => (
										<VerticalTemplateCard
											key={template._id}
											template={template}
											orderNumber={idx + 1}
											onPreview={() => {
												setPreviewTemplate(template)
												setIsPreviewActualSize(false)
											}}
											onApply={() => handleSelectTemplate(template)}
										/>
									))}
								</Grid>
							</Stack>
						</Box>
					</Dialog>
				)}

				{/* Full-Page Preview Lightbox Modal */}
				{previewTemplate &&
					(() => {
						const hasPreviewThumbnail = Boolean(
							previewTemplate.thumbnailUrl?.trim(),
						)

						return (
							<Dialog
								id="template-preview-lightbox"
								header={`${previewTemplate.title} - Preview`}
								onClose={() => setPreviewTemplate(null)}
								width={3}
							>
								<Box paddingX={[3, 4, 5]} paddingY={[4, 4, 5]}>
									<Stack space={4}>
										<Flex
											justify="space-between"
											align="center"
											wrap="wrap"
											gap={2}
										>
											<Flex align="center" gap={2}>
												<Badge
													tone={
														previewTemplate.funnelPillar === 'd2c_fast'
															? 'critical'
															: previewTemplate.funnelPillar === 'high_ticket'
																? 'primary'
																: 'positive'
													}
													fontSize={1}
												>
													{previewTemplate.funnelPillar === 'd2c_fast'
														? 'D2C Hero Products'
														: previewTemplate.funnelPillar === 'high_ticket'
															? 'High-Ticket Commerce'
															: 'B2B Wholesale / RFQ'}
												</Badge>
												<Badge tone="default" fontSize={1}>
													{previewTemplate.moduleCount} modules
												</Badge>
												{previewTemplate.industry && (
													<Text size={1} muted>
														• {previewTemplate.industry}
													</Text>
												)}
											</Flex>

											<Flex gap={2} align="center">
												{hasPreviewThumbnail && (
													<Button
														mode="ghost"
														icon={isPreviewActualSize ? FiZoomOut : FiZoomIn}
														text={
															isPreviewActualSize ? 'Fit Screen' : '100% Crisp'
														}
														fontSize={1}
														onClick={() =>
															setIsPreviewActualSize((prev) => !prev)
														}
														title={
															isPreviewActualSize
																? 'Fit image to container width'
																: 'View at native 100% resolution without scaling or blur'
														}
													/>
												)}
												{previewTemplate.livePreviewUrl && (
													<Button
														as="a"
														href={previewTemplate.livePreviewUrl}
														target="_blank"
														rel="noreferrer"
														mode="ghost"
														iconRight={FiExternalLink}
														text="Live Demo"
														fontSize={1}
													/>
												)}
												<Button
													tone="primary"
													icon={FiZap}
													text="Apply Template"
													fontSize={1}
													onClick={() => {
														const tmpl = previewTemplate
														setPreviewTemplate(null)
														handleSelectTemplate(tmpl)
													}}
												/>
											</Flex>
										</Flex>

										{hasPreviewThumbnail ? (
											<Card
												radius={2}
												border
												style={{
													maxHeight: '68vh',
													overflowY: 'auto',
													overflowX: 'auto',
													backgroundColor: '#0b1120',
													padding: '24px 16px',
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'flex-start',
												}}
											>
												<img
													src={previewTemplate.thumbnailUrl}
													alt={previewTemplate.title}
													style={{
														maxWidth: isPreviewActualSize ? 'none' : '100%',
														width: isPreviewActualSize ? 'auto' : 'auto',
														height: 'auto',
														display: 'block',
														margin: '0 auto',
														borderRadius: '6px',
														boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
														imageRendering: '-webkit-optimize-contrast',
													}}
												/>
											</Card>
										) : (
											<Card
												padding={[4, 5]}
												radius={3}
												border
												tone="default"
												style={{
													backgroundColor: '#ffffff',
													borderColor: '#e2e8f0',
													textAlign: 'center',
													maxWidth: '720px',
													margin: '0 auto',
													boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
												}}
											>
												<Stack space={4}>
													<Box
														style={{
															width: '56px',
															height: '56px',
															margin: '0 auto',
															borderRadius: '50%',
															backgroundColor: '#ecfdf5',
															border: '1.5px solid #a7f3d0',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															color: '#059669',
														}}
													>
														<FiLayers size={28} />
													</Box>

													<Stack space={2} style={{ textAlign: 'center' }}>
														<Flex justify="center" gap={2}>
															<Badge tone="positive" fontSize={1}>
																Standard Template
															</Badge>
															<Badge tone="primary" fontSize={1}>
																{previewTemplate.moduleCount} modules
															</Badge>
															{previewTemplate.conversionBadge && (
																<Badge tone="caution" fontSize={1}>
																	{previewTemplate.conversionBadge}
																</Badge>
															)}
														</Flex>

														<Heading
															size={3}
															weight="bold"
															style={{ color: '#0f172a' }}
														>
															{previewTemplate.title}
														</Heading>

														{previewTemplate.description ? (
															<Text
																size={1}
																style={{
																	color: '#475569',
																	maxWidth: 540,
																	margin: '0 auto',
																	lineHeight: 1.6,
																}}
															>
																{previewTemplate.description}
															</Text>
														) : (
															<Text
																size={1}
																style={{
																	color: '#64748b',
																	maxWidth: 540,
																	margin: '0 auto',
																	lineHeight: 1.6,
																}}
															>
																Standard landing page template. You can apply
																all {previewTemplate.moduleCount} configured
																modules directly to your page.
															</Text>
														)}
													</Stack>

													{/* List of configured modules */}
													<Card
														padding={3}
														radius={2}
														style={{
															backgroundColor: '#f8fafc',
															border: '1px solid #e2e8f0',
															textAlign: 'left',
														}}
													>
														<Stack space={3}>
															<Flex align="center" gap={2}>
																<FiCheck size={16} color="#059669" />
																<Text
																	size={1}
																	weight="semibold"
																	style={{ color: '#334155' }}
																>
																	Preconfigured modules (
																	{previewTemplate.moduleCount} blocks) to be
																	added:
																</Text>
															</Flex>

															<Flex wrap="wrap" gap={2}>
																{previewTemplate.modules.map(
																	(m: any, idx: number) => (
																		<Badge
																			key={idx}
																			tone="primary"
																			fontSize={1}
																		>
																			#{idx + 1} {m._type}
																		</Badge>
																	),
																)}
															</Flex>
														</Stack>
													</Card>

													<Flex justify="center">
														<Button
															tone="primary"
															icon={FiZap}
															text="Apply This Template"
															fontSize={2}
															padding={3}
															onClick={() => {
																const tmpl = previewTemplate
																setPreviewTemplate(null)
																handleSelectTemplate(tmpl)
															}}
														/>
													</Flex>
												</Stack>
											</Card>
										)}
									</Stack>
								</Box>
							</Dialog>
						)
					})()}

				{/* Confirmation Dialog when page already has modules */}
				{showConfirmDialog && pendingTemplate && (
					<Dialog
						id="confirm-template-apply"
						header="Apply Template to Existing Page"
						onClose={() => setShowConfirmDialog(false)}
						width={1}
					>
						<Box paddingX={[3, 4]} paddingY={[4, 4]}>
							<Stack space={4}>
								<Text size={1}>
									This page currently contains{' '}
									<strong>{value?.length || 0} modules</strong>. How would you
									like to apply <strong>'{pendingTemplate.title}'</strong>?
								</Text>

								<Stack space={2}>
									<Button
										tone="critical"
										icon={FiTrash2}
										text="Replace All Existing Modules"
										onClick={() =>
											applyTemplateData(pendingTemplate, 'replace')
										}
									/>
									<Button
										tone="primary"
										icon={FiPlus}
										text="Append to Bottom (Keep existing)"
										onClick={() => applyTemplateData(pendingTemplate, 'append')}
									/>
									<Button
										mode="ghost"
										text="Cancel"
										onClick={() => setShowConfirmDialog(false)}
									/>
								</Stack>
							</Stack>
						</Box>
					</Dialog>
				)}

				{/* Visual Module Catalog Modal Dialog */}
				{renderCatalogModal()}
			</>
		)
	}

	function renderCatalogModal() {
		if (!isCatalogOpen) return null

		return (
			<Dialog
				id="visual-catalog-modal"
				header="Visual Module Catalog"
				onClose={() => setIsCatalogOpen(false)}
				width="auto"
			>
				<Box paddingX={[2, 3, 4]} paddingY={[3, 4]}>
					<Stack space={4}>
						{/* Top Header: Search & Statistics */}
						<Flex justify="space-between" align="center" wrap="wrap" gap={3}>
							<Box flex={1} style={{ minWidth: 260 }}>
								<TextInput
									icon={FiSearch}
									placeholder={`Search ${MODULE_CATALOG_ITEMS.length} modules (e.g. pricing, hero, faq, countdown, comparison)...`}
									value={catalogSearch}
									onChange={(e) => setCatalogSearch(e.currentTarget.value)}
									fontSize={1}
								/>
							</Box>

							<Flex align="center" gap={2}>
								<Badge tone="primary" fontSize={1}>
									{filteredCatalogModules.length} Modules Available
								</Badge>
								{catalogSearch && (
									<Button
										mode="bleed"
										tone="default"
										fontSize={1}
										text="Clear"
										onClick={() => setCatalogSearch('')}
									/>
								)}
							</Flex>
						</Flex>

						{/* 3 Taxonomy Tabs */}
						<TabList space={1}>
							<Tab
								id="tab-all-catalog"
								aria-controls="tab-all-catalog-panel"
								label={`All (${catalogCategoryCounts.all})`}
								selected={catalogCategory === 'all'}
								onClick={() => setCatalogCategory('all')}
							/>
							<Tab
								id="tab-commerce-catalog"
								aria-controls="tab-commerce-catalog-panel"
								label={`Commerce & Conversion (${catalogCategoryCounts['commerce-conversion']})`}
								selected={catalogCategory === 'commerce-conversion'}
								onClick={() => setCatalogCategory('commerce-conversion')}
							/>
							<Tab
								id="tab-story-catalog"
								aria-controls="tab-story-catalog-panel"
								label={`Story & Layout (${catalogCategoryCounts['story-layout']})`}
								selected={catalogCategory === 'story-layout'}
								onClick={() => setCatalogCategory('story-layout')}
							/>
							<Tab
								id="tab-trust-catalog"
								aria-controls="tab-trust-catalog-panel"
								label={`Trust & Utilities (${catalogCategoryCounts['trust-utilities']})`}
								selected={catalogCategory === 'trust-utilities'}
								onClick={() => setCatalogCategory('trust-utilities')}
							/>
						</TabList>

						{/* Catalog Grid View */}
						<Box
							style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: 4 }}
						>
							{filteredCatalogModules.length === 0 ? (
								<Card
									tone="default"
									padding={5}
									radius={3}
									border
									style={{ textAlign: 'center' }}
								>
									<Text size={1} muted>
										No modules found matching &ldquo;{catalogSearch}&rdquo;. Try
										searching for &ldquo;hero&rdquo;, &ldquo;pricing&rdquo;, or
										&ldquo;form&rdquo;.
									</Text>
								</Card>
							) : (
								<Grid columns={[1, 1, 2, 3, 4]} gap={[3, 3]}>
									{filteredCatalogModules.map((item) => (
										<Card
											key={item.name}
											radius={3}
											border
											tone="default"
											style={{
												display: 'flex',
												flexDirection: 'column',
												cursor: 'pointer',
												overflow: 'hidden',
											}}
											className="module-catalog-card"
											onClick={() => handleSelectModule(item.name, item.title)}
										>
											{/* 16:9 Thumbnail Blueprint */}
											<Box
												style={{
													position: 'relative',
													width: '100%',
													paddingBottom: '56.25%',
													backgroundColor: '#0f172a',
													borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
												}}
											>
												<img
													src={item.thumbnail}
													alt={item.title}
													style={{
														position: 'absolute',
														inset: 0,
														width: '100%',
														height: '100%',
														objectFit: 'contain',
													}}
													loading="lazy"
												/>
											</Box>

											{/* Content Info */}
											<Box paddingX={3} paddingY={2}>
												<Flex justify="space-between" align="center" gap={1}>
													<Text size={1} weight="semibold">
														{item.title}
													</Text>
													<Badge tone={item.badgeTone} fontSize={0}>
														{item.badgeLabel}
													</Badge>
												</Flex>
											</Box>
										</Card>
									))}
								</Grid>
							)}
						</Box>
					</Stack>
				</Box>
			</Dialog>
		)
	}
}
