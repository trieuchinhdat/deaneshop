import { importResult, type ImportResult } from './result'
import type { useClient } from 'sanity'
type ImportClient = ReturnType<typeof useClient>
import { slug } from '@shared/content-utils'

function genKey(): string {
	return Math.random().toString(36).substring(2, 11)
}

function cleanString(val: any): string {
	if (!val) return ''
	return String(val).trim()
}

function createTextBlock(text: string, style = 'normal', marks: string[] = []) {
	return {
		_key: genKey(),
		_type: 'block',
		style,
		children: [
			{
				_key: genKey(),
				_type: 'span',
				text: cleanString(text),
				marks: marks || [],
			},
		],
	}
}

interface MediaChecklistItem {
	slot: string
	guide?: string
	suggestedAlt: string
}

interface ManualActionNote {
	step: number
	location: string
	action: string
	instruction: string
}

function normalizePageAppearance(rawApp: any): any {
	if (!rawApp || typeof rawApp !== 'object') {
		return {
			_type: 'page-appearance',
			colorScheme: 'light',
			backgroundType: 'default',
			headerMode: 'default',
			hideFooter: false,
			scrollReveal: 'fade-up',
		}
	}

	const colorScheme = ['light', 'dark'].includes(cleanString(rawApp.colorScheme))
		? rawApp.colorScheme
		: 'light'
	const backgroundType = ['default', 'color', 'image'].includes(cleanString(rawApp.backgroundType))
		? rawApp.backgroundType
		: 'default'
	const headerMode = ['default', 'transparent', 'hidden'].includes(cleanString(rawApp.headerMode))
		? rawApp.headerMode
		: 'default'
	const scrollReveal = ['none', 'fade-up', 'fade-in', 'slide-up', 'zoom-in'].includes(
		cleanString(rawApp.scrollReveal),
	)
		? rawApp.scrollReveal
		: 'fade-up'
	const hideFooter = Boolean(rawApp.hideFooter)

	const result: any = {
		_type: 'page-appearance',
		colorScheme,
		backgroundType,
		headerMode,
		hideFooter,
		scrollReveal,
	}

	if (backgroundType === 'color' && rawApp.solidColor) {
		result.solidColor = cleanString(rawApp.solidColor)
	}

	return result
}

function normalizeSingleModule(
	rawMod: any,
	defaultTitle: string,
	mediaChecklist: MediaChecklistItem[],
): any | null {
	if (!rawMod || typeof rawMod !== 'object') return null

	const rawType = cleanString(rawMod.type || rawMod._type).toLowerCase()

	// 1. Split Hero (hero.split)
	if (rawType === 'hero.split' || rawType === 'hero' || rawType === 'herosplit') {
		const headline = cleanString(rawMod.headline || rawMod.title || defaultTitle)
		const subtext = cleanString(
			rawMod.subtext ||
				rawMod.description ||
				'Accelerate commercial transition with certified high-durability solutions.',
		)
		const badge = cleanString(rawMod.badge || rawMod.tagline) || 'Certified Sustainable Solutions'
		const mediaPosition = ['right', 'left'].includes(cleanString(rawMod.mediaPosition))
			? rawMod.mediaPosition
			: 'right'
		const desktopLayout = mediaPosition === 'left' ? 'mediaLeft' : 'mediaRight'

		const ctas: any[] = []
		if (rawMod.primaryCta) {
			ctas.push({
				_key: genKey(),
				actionType: 'link',
				style: 'action',
				link: {
					label: cleanString(rawMod.primaryCta.label) || 'Request Official Quotation',
					type: 'internal',
					params: cleanString(rawMod.primaryCta.link) || '#rfq-form',
				},
			})
		} else {
			ctas.push({
				_key: genKey(),
				actionType: 'link',
				style: 'action',
				link: {
					label: 'Request Official Quotation',
					type: 'internal',
					params: '#rfq-form',
				},
			})
		}

		if (rawMod.secondaryCta) {
			ctas.push({
				_key: genKey(),
				actionType: 'link',
				style: 'action-outline',
				link: {
					label: cleanString(rawMod.secondaryCta.label) || 'Explore Technical Specifications',
					type: 'internal',
					params: cleanString(rawMod.secondaryCta.link) || '#specs-table',
				},
			})
		}

		const altText = cleanString(
			rawMod.image?.alt || rawMod.alt || rawMod.suggestedAltText || `${headline} - primary hero visual`,
		)

		mediaChecklist.push({
			slot: 'Hero Split Primary Visual (16:9)',
			guide: 'High-resolution 16:9 hero photography, product rendering, or factory aerial view.',
			suggestedAlt: altText,
		})

		return {
			_key: genKey(),
			_type: 'hero.split',
			badge,
			mediaPosition,
			desktopLayout,
			content: [createTextBlock(headline, 'h1'), createTextBlock(subtext, 'normal')],
			ctas,
			image: {
				_type: 'image',
				alt: altText,
			},
		}
	}

	// 2. Hero Slider (hero-slider)
	if (rawType === 'hero-slider' || rawType === 'slider') {
		const slides = Array.isArray(rawMod.slides)
			? rawMod.slides.map((s: any) => ({
					_key: genKey(),
					badge: cleanString(s.badge),
					headline: cleanString(s.headline || s.title),
					subheadline: cleanString(s.subheadline || s.subtext || s.description),
					primaryCtaText: cleanString(s.ctaText || s.primaryCta?.label) || 'Explore Solutions',
					primaryCtaLink: cleanString(s.ctaLink || s.primaryCta?.link) || '#pricing',
				}))
			: [
					{
						_key: genKey(),
						headline: cleanString(rawMod.headline || defaultTitle),
						subheadline: cleanString(rawMod.subheadline || rawMod.description),
						primaryCtaText: 'Explore Solutions',
						primaryCtaLink: '#pricing',
					},
				]

		return {
			_key: genKey(),
			_type: 'hero-slider',
			slides,
		}
	}

	// 3. Countdown Urgency Banner (countdown-banner)
	if (rawType === 'countdown-banner' || rawType === 'countdown') {
		return {
			_key: genKey(),
			_type: 'countdown-banner',
			badge: cleanString(rawMod.badge) || 'LIMITED TIME EXPORT ALLOCATION',
			headline:
				cleanString(rawMod.headline || rawMod.title) ||
				'Factory Direct Launch Allocation — Reserve Priority Batch',
			subheadline:
				cleanString(rawMod.subheadline || rawMod.subtext || rawMod.description) ||
				'Claim guaranteed container allocation before production quota fills. Pricing updates after timer expires.',
			countdownType: cleanString(rawMod.countdownType) || 'fixed',
			endDate: cleanString(rawMod.endDate) || new Date(Date.now() + 7 * 86400000).toISOString(),
			ctaText: cleanString(rawMod.ctaText) || 'Reserve Allocation Today',
			ctaLink: cleanString(rawMod.ctaLink) || '#rfq-form',
		}
	}

	// 4. Logo Marquee / Client Logos (logo-list)
	if (rawType === 'logo-list' || rawType === 'logos') {
		const logoType = ['default', 'dark', 'light'].includes(cleanString(rawMod.logoType))
			? rawMod.logoType
			: 'default'

		return {
			_key: genKey(),
			_type: 'logo-list',
			intro: [
				createTextBlock(
					cleanString(
						rawMod.headline || rawMod.title || 'Trusted by Over 500+ International Brands & Distributors',
					),
					'normal',
				),
			],
			logoType,
		}
	}

	// 5. Impact Metrics / Stat List (stat-list)
	if (rawType === 'stat-list' || rawType === 'stats') {
		const rawStats = Array.isArray(rawMod.stats) ? rawMod.stats : []
		const statsItems = rawStats.map((s: any) => ({
			_key: genKey(),
			value: cleanString(s.value),
			suffix: cleanString(s.suffix),
			label: cleanString(s.label),
			iconPreset: cleanString(s.iconPreset) || 'chart',
			content: s.subtext ? [createTextBlock(cleanString(s.subtext), 'normal')] : [],
		}))

		const columns = [2, 3, 4].includes(Number(rawMod.columns))
			? Number(rawMod.columns)
			: Math.min(4, Math.max(2, statsItems.length || 4))
		const layout = ['grid', 'carousel'].includes(cleanString(rawMod.layout))
			? rawMod.layout
			: 'grid'
		let cardStyle = cleanString(rawMod.cardStyle).toLowerCase()
		if (cardStyle === 'bordered') cardStyle = 'outline'
		if (!['card', 'elevated', 'minimal', 'outline'].includes(cardStyle)) {
			cardStyle = 'card'
		}

		return {
			_key: genKey(),
			_type: 'stat-list',
			badge: cleanString(rawMod.badge) || 'Verified Operational Scale',
			layout,
			columns,
			cardStyle,
			headerAlign: 'center',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Proven Scale & Performance Benchmarks'),
					'h2',
				),
			],
			stats: statsItems,
		}
	}

	// 6. Verified Social Proof (social-proof)
	if (rawType === 'social-proof' || rawType === 'reviews') {
		const rawReviews = Array.isArray(rawMod.reviews) ? rawMod.reviews : []
		const reviews = rawReviews.map((r: any) => ({
			_key: genKey(),
			authorName: cleanString(r.authorName || r.author) || 'Verified Partner',
			authorRole: cleanString(r.authorRole || r.role) || 'Procurement Director',
			authorCompany: cleanString(r.authorCompany || r.company) || 'Global Enterprise',
			authorCountry: cleanString(r.authorCountry || r.country) || 'United States',
			rating: Number(r.rating) || 5,
			title: cleanString(r.title) || 'Exceptional commercial quality and seamless container dispatch',
			quote:
				cleanString(r.quote || r.content) ||
				'The build quality and compliance standards surpassed our expectations. Delivery was smooth and on schedule.',
			verifiedBuyer: true,
			verifiedBadgeText: 'Verified Partner',
		}))

		const headerAlignment = ['center', 'left'].includes(cleanString(rawMod.headerAlignment))
			? rawMod.headerAlignment
			: 'center'
		const showTrustStats = typeof rawMod.showTrustStats === 'boolean' ? rawMod.showTrustStats : true

		return {
			_key: genKey(),
			_type: 'social-proof',
			badge: cleanString(rawMod.badge) || '4.9/5 RATED BY 2,500+ VERIFIED PARTNERS',
			headline: cleanString(rawMod.headline || rawMod.title) || 'Trusted by Global Brands & Supply Chain Leaders',
			subtitle:
				cleanString(rawMod.subtitle || rawMod.description) ||
				'Real verified feedback from procurement directors and institutional buyers who rely on our manufacturing excellence.',
			headerAlignment,
			showTrustStats,
			reviews,
		}
	}

	// 7. Wall of Love / Quotes (quote-list)
	if (rawType === 'quote-list' || rawType === 'quotes' || rawType === 'testimonials') {
		const rawQuotes = Array.isArray(rawMod.testimonials || rawMod.quotes)
			? rawMod.testimonials || rawMod.quotes
			: []
		const testimonials = rawQuotes.map((q: any) => ({
			_key: genKey(),
			_type: 'inlineQuote',
			quote: cleanString(q.quote || q.content),
			author: cleanString(q.author || q.authorName),
			role: cleanString(q.role || q.authorRole),
			company: cleanString(q.company || q.authorCompany),
			rating: Number(q.rating) || 5,
		}))

		const layout = ['masonry', 'grid', 'carousel'].includes(cleanString(rawMod.layout))
			? rawMod.layout
			: 'masonry'
		const columns = [2, 3, 4].includes(Number(rawMod.columns)) ? Number(rawMod.columns) : 3
		const cardStyle = ['bordered', 'card'].includes(cleanString(rawMod.cardStyle))
			? rawMod.cardStyle
			: 'bordered'

		return {
			_key: genKey(),
			_type: 'quote-list',
			badge: cleanString(rawMod.badge) || 'WALL OF LOVE',
			headline: cleanString(rawMod.headline || rawMod.title) || 'What Global Industry Leaders Say',
			subtitle:
				cleanString(rawMod.subtitle || rawMod.description) ||
				'Authentic endorsements and editorial feedback from enterprise partners worldwide.',
			layout,
			columns,
			cardStyle,
			testimonials,
		}
	}

	// 8. Feature Cards (card-list)
	if (rawType === 'card-list' || rawType === 'cards' || rawType === 'features') {
		const rawCards = Array.isArray(rawMod.cards || rawMod.items) ? rawMod.cards || rawMod.items : []
		const cardsItems = rawCards.map((c: any) => ({
			_key: genKey(),
			badge: cleanString(c.badge) || 'Feature Capability',
			iconPreset: cleanString(c.iconPreset) || 'shield',
			content: [
				createTextBlock(cleanString(c.title || c.headline), 'h3', ['strong']),
				createTextBlock(cleanString(c.description || c.content), 'normal'),
			],
		}))

		const columns = [2, 3, 4].includes(Number(rawMod.columns))
			? Number(rawMod.columns)
			: Math.min(3, Math.max(2, cardsItems.length || 3))
		const desktopLayout = ['grid', 'carousel'].includes(cleanString(rawMod.desktopLayout))
			? rawMod.desktopLayout
			: 'grid'
		let cardStyle = cleanString(rawMod.cardStyle).toLowerCase()
		if (cardStyle === 'bordered') cardStyle = 'card'
		if (!['card', 'elevated', 'minimal', 'glass'].includes(cardStyle)) {
			cardStyle = 'card'
		}

		return {
			_key: genKey(),
			_type: 'card-list',
			badge: cleanString(rawMod.badge) || 'Enterprise Capabilities',
			desktopLayout,
			columns,
			cardStyle,
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Engineered for Performance & Sustainability'),
					'h2',
				),
			],
			cards: cardsItems,
		}
	}

	// 9. Process Workflow (step-list)
	if (rawType === 'step-list' || rawType === 'steps' || rawType === 'process') {
		const rawSteps = Array.isArray(rawMod.steps || rawMod.items) ? rawMod.steps || rawMod.items : []
		const stepsItems = rawSteps.map((st: any, idx: number) => ({
			_key: genKey(),
			title: cleanString(st.title),
			badge: cleanString(st.badge || st.step) || `Step 0${idx + 1}`,
			iconPreset: cleanString(st.iconPreset) || 'check',
			content: [createTextBlock(cleanString(st.description || st.content), 'normal')],
		}))

		const layout = ['split', 'vertical', 'grid'].includes(cleanString(rawMod.layout))
			? rawMod.layout
			: 'split'
		const columns = [2, 3, 4].includes(Number(rawMod.columns)) ? Number(rawMod.columns) : 3
		const showConnector = typeof rawMod.showConnector === 'boolean' ? rawMod.showConnector : true

		return {
			_key: genKey(),
			_type: 'step-list',
			badge: cleanString(rawMod.badge) || 'Procurement & Delivery Workflow',
			layout,
			columns,
			showConnector,
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Seamless 4-Step Fulfillment Workflow'),
					'h2',
				),
			],
			steps: stepsItems,
		}
	}

	// 10. Comparison Table (comparison-table)
	if (rawType === 'comparison-table' || rawType === 'comparison' || rawType === 'table') {
		const headers = Array.isArray(rawMod.headers)
			? rawMod.headers.map(cleanString)
			: ['Evaluation Criteria', 'DeanFlow Solution', 'Conventional Standards']

		const rows = Array.isArray(rawMod.rows)
			? rawMod.rows.map((r: any) => ({
					_key: genKey(),
					cells: Array.isArray(r)
						? r.map(cleanString)
						: Array.isArray(r.cells)
							? r.cells.map(cleanString)
							: [],
				}))
			: []

		let tableStyle = cleanString(rawMod.tableStyle).toLowerCase()
		if (tableStyle === 'clean') tableStyle = 'bordered'
		if (!['card', 'bordered', 'minimal'].includes(tableStyle)) {
			tableStyle = 'card'
		}
		const highlightedColumnIndex = Number(rawMod.highlightedColumnIndex) >= 0
			? Number(rawMod.highlightedColumnIndex)
			: 1
		const highlightBadge = cleanString(rawMod.highlightBadge) || 'Our Solution'

		return {
			_key: genKey(),
			_type: 'comparison-table',
			badge: cleanString(rawMod.badge) || 'Competitive Advantage',
			title: cleanString(rawMod.title) || 'DeanFlow vs. Conventional Alternatives',
			caption:
				cleanString(rawMod.caption || rawMod.description) ||
				'Engineered for measurable commercial ROI, strict compliance, and predictable quality.',
			headers,
			highlightedColumnIndex,
			highlightBadge,
			tableStyle,
			rows,
		}
	}

	// 11. Compliance Vault (compliance-vault)
	if (rawType === 'compliance-vault' || rawType === 'compliance' || rawType === 'certificates') {
		const certs = Array.isArray(rawMod.certificates)
			? rawMod.certificates.map((c: any) => ({
					_key: genKey(),
					title: cleanString(c.title),
					issuer: cleanString(c.issuer),
					code: cleanString(c.code),
					description: cleanString(c.description),
				}))
			: [
					{
						_key: genKey(),
						title: 'FDA 21 CFR 176.170',
						issuer: 'US Food & Drug Administration',
						code: 'FDA-GRAS-COMPLIANT',
						description: 'Certified food-contact safe with direct food presentation.',
					},
					{
						_key: genKey(),
						title: 'ASTM D6400 & EN 13432',
						issuer: 'BPI / TÜV AUSTRIA',
						code: 'BPI-COMPOST-2026',
						description: 'Certified industrial and home compostability standards.',
					},
				]

		const vaultTheme = ['dark', 'light'].includes(cleanString(rawMod.vaultTheme))
			? rawMod.vaultTheme
			: 'dark'
		const headerAlignment = ['center', 'left'].includes(cleanString(rawMod.headerAlignment))
			? rawMod.headerAlignment
			: 'center'

		return {
			_key: genKey(),
			_type: 'compliance-vault',
			badge: cleanString(rawMod.badge) || 'International Standards & Compliance',
			headline:
				cleanString(rawMod.headline || rawMod.title) ||
				'Certified Global Manufacturing & Sustainable Supply Chain',
			subtitle:
				cleanString(rawMod.subtitle || rawMod.description) ||
				'Every batch is rigorously tested for international food-contact safety and zero plastic migration.',
			vaultTheme,
			headerAlignment,
			showCertificates: true,
			showMetrics: true,
			showGatedDocuments: true,
			certificates: certs,
		}
	}

	// 12. Volume / Tiered Pricing (tiered-pricing)
	if (rawType === 'tiered-pricing' || rawType === 'pricing' || rawType === 'tiers') {
		const rawTiers = Array.isArray(rawMod.tiers) ? rawMod.tiers : []
		const tiers = rawTiers.map((t: any) => ({
			_key: genKey(),
			minQty: Number(t.minQty) || 1000,
			...(t.maxQty ? { maxQty: Number(t.maxQty) } : {}),
			...(t.unitPrice !== undefined ? { unitPrice: Number(t.unitPrice) } : {}),
			incoterm: cleanString(t.incoterm).toUpperCase() || 'FOB',
			badge: cleanString(t.badge) || 'Wholesale Tier',
			isCustomQuote: Boolean(t.isCustomQuote),
		}))

		let tableStyle = cleanString(rawMod.tableStyle).toLowerCase()
		if (tableStyle === 'bento') tableStyle = 'cards'
		if (!['cards', 'table', 'minimal'].includes(tableStyle)) {
			tableStyle = 'cards'
		}
		const highlightBestValue =
			typeof rawMod.highlightBestValue === 'boolean' ? rawMod.highlightBestValue : true

		return {
			_key: genKey(),
			_type: 'tiered-pricing',
			badge: cleanString(rawMod.badge) || 'Volume-Based Wholesale Pricing',
			headline: cleanString(rawMod.headline || rawMod.title) || 'Transparent Volume Discount Matrix',
			subtitle:
				cleanString(rawMod.subtitle || rawMod.description) ||
				'Higher manufacturing volume unlocks lower unit costs. Quoted on standard FOB export terms.',
			currency: cleanString(rawMod.currency) || 'USD',
			tableStyle,
			highlightBestValue,
			tiers,
		}
	}

	// 13. FAQ Drawer (accordion-list)
	if (rawType === 'accordion-list' || rawType === 'faq' || rawType === 'accordions') {
		const rawFaq = Array.isArray(rawMod.faq || rawMod.items || rawMod.accordions)
			? rawMod.faq || rawMod.items || rawMod.accordions
			: []

		const VALID_FAQ_ICONS = new Set([
			'help',
			'shield',
			'truck',
			'credit-card',
			'refresh',
			'package',
			'leaf',
			'globe',
			'sparkles',
			'fileCheck',
			'none',
		])

		const normalizeFaqIcon = (rawIcon?: string, categoryBadge?: string): string => {
			const icon = cleanString(rawIcon).toLowerCase()
			if (icon && VALID_FAQ_ICONS.has(icon)) return icon
			if (icon === 'filecheck') return 'fileCheck'
			if (icon === 'creditcard' || icon === 'card') return 'credit-card'
			if (icon === 'shipping' || icon === 'logistics' || icon === 'delivery') return 'truck'
			if (icon === 'pricing' || icon === 'payment' || icon === 'moq') return 'credit-card'
			if (icon === 'eco' || icon === 'sustainability' || icon === 'green') return 'leaf'
			if (icon === 'cert' || icon === 'compliance' || icon === 'certificate') return 'fileCheck'
			if (icon === 'custom' || icon === 'mold' || icon === 'feature') return 'sparkles'
			if (icon === 'return' || icon === 'exchange') return 'refresh'
			if (icon === 'product' || icon === 'box') return 'package'
			if (icon === 'security' || icon === 'guarantee') return 'shield'

			const badge = cleanString(categoryBadge).toLowerCase()
			if (badge.includes('ship') || badge.includes('freight') || badge.includes('logistics') || badge.includes('deliver'))
				return 'truck'
			if (badge.includes('cert') || badge.includes('standard') || badge.includes('test') || badge.includes('audit'))
				return 'fileCheck'
			if (badge.includes('moq') || badge.includes('pric') || badge.includes('pay') || badge.includes('cost') || badge.includes('bill'))
				return 'credit-card'
			if (badge.includes('eco') || badge.includes('bio') || badge.includes('compost') || badge.includes('sustain'))
				return 'leaf'
			if (badge.includes('custom') || badge.includes('brand') || badge.includes('mold') || badge.includes('oem'))
				return 'sparkles'
			if (badge.includes('pack') || badge.includes('box') || badge.includes('carton') || badge.includes('tray'))
				return 'package'
			if (badge.includes('guarantee') || badge.includes('warranty') || badge.includes('secure') || badge.includes('shield'))
				return 'shield'
			if (badge.includes('return') || badge.includes('refund') || badge.includes('exchange')) return 'refresh'
			if (badge.includes('global') || badge.includes('export') || badge.includes('world') || badge.includes('port'))
				return 'globe'

			return 'help'
		}

		const accordions = rawFaq.map((f: any) => ({
			_key: genKey(),
			summary: cleanString(f.question || f.summary || f.q),
			badge: cleanString(f.badge) || 'Help & Guidance',
			iconPreset: normalizeFaqIcon(f.iconPreset || f.icon, f.badge),
			content: [createTextBlock(cleanString(f.answer || f.content || f.a), 'normal')],
		}))

		let layout = cleanString(rawMod.layout).toLowerCase()
		if (layout === 'split') layout = 'horizontal'
		if (!['vertical', 'horizontal', 'grid'].includes(layout)) {
			layout = 'vertical'
		}

		let accordionStyle = cleanString(rawMod.accordionStyle).toLowerCase()
		if (accordionStyle === 'bordered') accordionStyle = 'card'
		if (accordionStyle === 'clean' || accordionStyle === 'minimal') accordionStyle = 'separated'
		if (!['card', 'separated', 'contained'].includes(accordionStyle)) {
			accordionStyle = 'card'
		}

		const headerAlign = ['center', 'left'].includes(
			cleanString(rawMod.headerAlign || rawMod.headerAlignment),
		)
			? rawMod.headerAlign || rawMod.headerAlignment
			: 'center'

		return {
			_key: genKey(),
			_type: 'accordion-list',
			badge: cleanString(rawMod.badge) || 'Frequently Asked Questions',
			layout,
			headerAlign,
			accordionStyle,
			iconStyle: 'chevron',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Clear Answers to Commercial & Technical Questions'),
					'h2',
				),
			],
			accordions,
		}
	}

	// 14. Lead Capture Form (lead-capture-form)
	if (rawType === 'lead-capture-form' || rawType === 'leadform' || rawType === 'rfq') {
		const benefits = Array.isArray(rawMod.benefits)
			? rawMod.benefits.map(cleanString)
			: [
					'Guaranteed turnaround with 24-hour response confirmation',
					'Custom quotation tailored to your exact technical specifications',
					'100% free with zero purchase obligation',
				]

		let layout = cleanString(rawMod.layout).toLowerCase()
		if (!['split', 'card', 'centered'].includes(layout)) {
			layout = 'split'
		}

		let bgStyle = cleanString(rawMod.bgStyle).toLowerCase()
		if (bgStyle === 'brand') bgStyle = 'gradient'
		if (!['slate', 'white', 'gradient', 'dark'].includes(bgStyle)) {
			bgStyle = 'slate'
		}

		return {
			_key: genKey(),
			_type: 'lead-capture-form',
			badge: cleanString(rawMod.badge) || 'Fast Response Guarantee',
			headline: cleanString(rawMod.headline || rawMod.title) || 'Request Your Free Official Quotation',
			subtitle:
				cleanString(rawMod.subtitle || rawMod.description) ||
				'Submit your requirements below and our commercial specialist will connect within 12 hours.',
			benefits,
			ctaText: cleanString(rawMod.ctaText) || 'Request Official Quotation',
			layout,
			bgStyle,
		}
	}

	// 15. Promo Callout Box (callout)
	if (rawType === 'callout' || rawType === 'promo') {
		const layout = ['centered', 'split'].includes(cleanString(rawMod.layout)) ? rawMod.layout : 'centered'
		const themeStyle = ['brand', 'dark', 'light', 'subtle'].includes(cleanString(rawMod.themeStyle))
			? rawMod.themeStyle
			: 'brand'
		const borderStyle = ['accent-left', 'full'].includes(cleanString(rawMod.borderStyle))
			? rawMod.borderStyle
			: 'accent-left'

		return {
			_key: genKey(),
			_type: 'callout',
			badge: cleanString(rawMod.badge) || 'PROMOTION NOTICE',
			layout,
			themeStyle,
			borderStyle,
			intro: [
				createTextBlock(cleanString(rawMod.headline || rawMod.title), 'h3', ['strong']),
				createTextBlock(cleanString(rawMod.content || rawMod.subtext || rawMod.description), 'normal'),
			],
			ctaText: cleanString(rawMod.ctaText) || 'Learn More',
			ctaLink: cleanString(rawMod.ctaLink) || '#pricing',
		}
	}

	// 16. Long-Form Editorial Prose (prose)
	if (rawType === 'prose' || rawType === 'story') {
		const rawContent = rawMod.content || rawMod.paragraphs || []
		const contentBlocks: any[] = []

		if (rawMod.headline || rawMod.title) {
			contentBlocks.push(createTextBlock(cleanString(rawMod.headline || rawMod.title), 'h2'))
		}

		if (Array.isArray(rawContent)) {
			for (const p of rawContent) {
				if (typeof p === 'string' && p.trim()) {
					contentBlocks.push(createTextBlock(p.trim(), 'normal'))
				}
			}
		} else if (typeof rawContent === 'string' && rawContent.trim()) {
			contentBlocks.push(createTextBlock(rawContent.trim(), 'normal'))
		}

		return {
			_key: genKey(),
			_type: 'prose',
			content: contentBlocks,
		}
	}

	// 17. Sticky Mobile Buy Bar (sticky-mobile-cta)
	if (rawType === 'sticky-mobile-cta' || rawType === 'stickycta') {
		const headline = cleanString(
			rawMod.title || rawMod.productTitle || rawMod.headline || defaultTitle,
		)
		const ctaText =
			cleanString(rawMod.primaryButtonText || rawMod.ctaText) || 'Request Factory Quote'
		const ctaLink =
			cleanString(rawMod.primaryButtonLink || rawMod.ctaLink) || '#rfq-form'
		const badge = cleanString(rawMod.badge) || 'Save 30%'
		const price = cleanString(rawMod.price) || 'From $0.038 / unit'
		const actionType = ['anchor', 'direct_cart', 'link'].includes(cleanString(rawMod.actionType))
			? rawMod.actionType
			: 'anchor'

		return {
			_key: genKey(),
			_type: 'sticky-mobile-cta',
			title: headline,
			productTitle: headline,
			badge,
			price,
			actionType,
			primaryButtonText: ctaText,
			primaryButtonLink: ctaLink,
			ctaText,
			ctaLink,
		}
	}

	// 18. Leadership & Experts (person-list)
	if (rawType === 'person-list' || rawType === 'leadership' || rawType === 'team' || rawType === 'experts') {
		const rawPeople = Array.isArray(rawMod.people || rawMod.items) ? rawMod.people || rawMod.items : []
		const people = rawPeople.map((p: any) => {
			const personAlt = cleanString(
				p.image?.alt || p.alt || `${cleanString(p.name)} - ${cleanString(p.role)} profile`,
			)
			return {
				_key: genKey(),
				_type: 'inlinePerson',
				name: cleanString(p.name) || 'Executive Member',
				role: cleanString(p.role) || 'Leadership',
				credentials: cleanString(p.credentials),
				department: cleanString(p.department) || 'Executive Management',
				shortBio: cleanString(p.shortBio || p.bio || p.description),
				...(personAlt ? { image: { _type: 'image', alt: personAlt } } : {}),
				socialLinks: Array.isArray(p.socialLinks)
					? p.socialLinks.map((sl: any) => ({
							_key: genKey(),
							platform: cleanString(sl.platform) || 'linkedin',
							url: cleanString(sl.url) || 'https://linkedin.com',
						}))
					: [],
			}
		})

		const columns = [2, 3, 4].includes(Number(rawMod.columns)) ? Number(rawMod.columns) : 3
		const layout = ['grid', 'carousel'].includes(cleanString(rawMod.layout)) ? rawMod.layout : 'grid'
		const cardStyle = ['card', 'minimal', 'bordered'].includes(cleanString(rawMod.cardStyle))
			? rawMod.cardStyle
			: 'card'

		return {
			_key: genKey(),
			_type: 'person-list',
			badge: cleanString(rawMod.badge) || 'EXECUTIVE LEADERSHIP',
			layout,
			columns,
			cardStyle,
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Leadership & Sustainability Experts'),
					'h2',
				),
				...(rawMod.subtitle || rawMod.description
					? [createTextBlock(cleanString(rawMod.subtitle || rawMod.description), 'normal')]
					: []),
			],
			people,
		}
	}

	// 19. Media Gallery Grid (media-grid)
	if (rawType === 'media-grid' || rawType === 'gallery' || rawType === 'mediagrid') {
		const rawItems = Array.isArray(rawMod.items || rawMod.cards) ? rawMod.items || rawMod.cards : []
		const items = rawItems.map((item: any, idx: number) => {
			const itemAlt = cleanString(
				item.alt || item.image?.alt || `${cleanString(item.title || 'Media visual')} 0${idx + 1}`,
			)
			return {
				_key: genKey(),
				title: cleanString(item.title) || `Product Showcase 0${idx + 1}`,
				subtitle: cleanString(item.subtitle || item.description),
				badge: cleanString(item.badge),
				alt: itemAlt,
				image: {
					_type: 'image',
					alt: itemAlt,
				},
				...(item.link
					? {
							link: {
								label: cleanString(item.link.label) || 'View Details',
								type: 'internal',
								params: cleanString(item.link.params || item.link.url || '#'),
							},
						}
					: {}),
			}
		})

		return {
			_key: genKey(),
			_type: 'media-grid',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Visual Product & Application Gallery'),
					'h2',
				),
				...(rawMod.subtitle || rawMod.description
					? [createTextBlock(cleanString(rawMod.subtitle || rawMod.description), 'normal')]
					: []),
			],
			items,
		}
	}

	// 20. Banner Carousel (carousel-banner-list)
	if (rawType === 'carousel-banner-list' || rawType === 'bannerslider' || rawType === 'lookbook') {
		const rawItems = Array.isArray(rawMod.items || rawMod.slides) ? rawMod.items || rawMod.slides : []
		const items = rawItems.map((b: any, idx: number) => {
			const bannerAlt = cleanString(b.alt || b.image?.alt || `Promotional banner 0${idx + 1}`)
			return {
				_key: genKey(),
				_type: 'image',
				alt: bannerAlt,
				linkBannerType: cleanString(b.linkBannerType) || (b.external ? 'external' : 'internal'),
				...(b.external ? { external: cleanString(b.external) } : {}),
			}
		})

		return {
			_key: genKey(),
			_type: 'carousel-banner-list',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Product Showcase & Lookbook Carousel'),
					'h2',
				),
			],
			items,
		}
	}

	// 21. Product Showcase (product-list)
	if (rawType === 'product-list' || rawType === 'products' || rawType === 'catalog') {
		const columns = [2, 3, 4].includes(Number(rawMod.columns)) ? Number(rawMod.columns) : 3
		const layout = ['grid', 'carousel'].includes(cleanString(rawMod.layout)) ? rawMod.layout : 'grid'

		return {
			_key: genKey(),
			_type: 'product-list',
			badge: cleanString(rawMod.badge) || 'FEATURED COLLECTION',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Curated Sustainable Product Catalog'),
					'h2',
				),
				...(rawMod.subtitle || rawMod.description
					? [createTextBlock(cleanString(rawMod.subtitle || rawMod.description), 'normal')]
					: []),
			],
			columns,
			layout,
			showViewAll: typeof rawMod.showViewAll === 'boolean' ? rawMod.showViewAll : true,
			viewAllLabel: cleanString(rawMod.viewAllLabel) || 'Explore Complete Catalog',
		}
	}

	// 22. Content Hub / Insights (blog-post-list)
	if (rawType === 'blog-post-list' || rawType === 'articles' || rawType === 'insights' || rawType === 'blog') {
		const columns = [2, 3, 4].includes(Number(rawMod.columns)) ? Number(rawMod.columns) : 3
		const layout = ['grid', 'carousel'].includes(cleanString(rawMod.layout)) ? rawMod.layout : 'grid'

		return {
			_key: genKey(),
			_type: 'blog-post-list',
			badge: cleanString(rawMod.badge) || 'INDUSTRY INSIGHTS & ESG BRIEFS',
			intro: [
				createTextBlock(
					cleanString(rawMod.headline || rawMod.title || 'Latest Technical Articles & Compliance Updates'),
					'h2',
				),
				...(rawMod.subtitle || rawMod.description
					? [createTextBlock(cleanString(rawMod.subtitle || rawMod.description), 'normal')]
					: []),
			],
			columns,
			layout,
			limit: Number(rawMod.limit) || 3,
		}
	}

	// 23. Code & App Embed (custom-html)
	if (rawType === 'custom-html' || rawType === 'embed' || rawType === 'widget') {
		return {
			_key: genKey(),
			_type: 'custom-html',
			badge: cleanString(rawMod.badge) || 'INTERACTIVE WIDGET',
			headline: cleanString(rawMod.headline || rawMod.title) || 'Interactive Schedule & Assessment',
			subtitle: cleanString(rawMod.subtitle || rawMod.description),
			embedType: cleanString(rawMod.embedType) || 'custom',
			html: cleanString(rawMod.html || rawMod.code) || '<!-- Custom Embed / App Widget -->',
			css: cleanString(rawMod.css),
		}
	}

	// Fallback for any other native Sanity module (pass-through with _key)
	return {
		...rawMod,
		_key: rawMod._key || genKey(),
		_type: rawMod._type || rawMod.type || 'prose',
	}
}

export async function parsePage(rawContent: string, client: ImportClient): Promise<ImportResult> {
	try {
		const body = { rawContent }
		const rawText = cleanString(body.rawContent)

		if (!rawText) {
			return importResult(
				{ error: 'Please provide landing page JSON or structured content.' },
				{ status: 400 },
			)
		}

		// 1. Try parsing JSON
		let parsedJson: any = null
		const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
		const candidateJson = jsonBlockMatch ? jsonBlockMatch[1].trim() : rawText

		try {
			const firstBrace = candidateJson.indexOf('{')
			const firstBracket = candidateJson.indexOf('[')
			let jsonStart = -1

			if (firstBrace !== -1 && firstBracket !== -1) {
				jsonStart = Math.min(firstBrace, firstBracket)
			} else if (firstBrace !== -1) {
				jsonStart = firstBrace
			} else if (firstBracket !== -1) {
				jsonStart = firstBracket
			}

			if (jsonStart !== -1) {
				const isArray = candidateJson[jsonStart] === '['
				const jsonEnd = isArray
					? candidateJson.lastIndexOf(']')
					: candidateJson.lastIndexOf('}')

				if (jsonEnd > jsonStart) {
					const cleanStr = candidateJson.substring(jsonStart, jsonEnd + 1)
					parsedJson = JSON.parse(cleanStr)
				}
			}
		} catch (e) {
			// JSON parse error
		}

		if (!parsedJson || typeof parsedJson !== 'object') {
			return importResult(
				{ error: 'Failed to parse page payload. Please provide a valid JSON structure.' },
				{ status: 400 },
			)
		}

		const assembledModules: any[] = []
		const mediaChecklist: MediaChecklistItem[] = []

		let title = cleanString(parsedJson.title) || 'New Landing Page'
		let targetSlug = cleanString(parsedJson.slug || parsedJson.seo?.slug) || slug(title || 'new-page')
		const metaTitle = cleanString(parsedJson.seo?.metaTitle || parsedJson.metaTitle) || title
		const metaDescription =
			cleanString(parsedJson.seo?.metaDescription || parsedJson.metaDescription) ||
			'Discover high-performance enterprise solutions engineered for global commercial scale.'
		const noIndex = Boolean(parsedJson.seo?.noIndex || parsedJson.noIndex)

		// Page Appearance Normalizer
		const appearance = normalizePageAppearance(parsedJson.appearance)

		// Case 1: Root is an array of modules: `[ { type: 'hero.split', ... }, ... ]`
		if (Array.isArray(parsedJson)) {
			for (const mod of parsedJson) {
				const normalized = normalizeSingleModule(mod, title, mediaChecklist)
				if (normalized) assembledModules.push(normalized)
			}
		}

		// Case 2: `modules` property is an array: `{ title, slug, modules: [ { type: '...', ... } ] }`
		else if (Array.isArray(parsedJson.modules)) {
			for (const mod of parsedJson.modules) {
				const normalized = normalizeSingleModule(mod, title, mediaChecklist)
				if (normalized) assembledModules.push(normalized)
			}
		}

		// Case 3: `modules` property is a semantic object: `{ modules: { hero: {...}, stats: [...], ... } }`
		else if (parsedJson.modules && typeof parsedJson.modules === 'object') {
			const m = parsedJson.modules
			const knownKeys = [
				'hero',
				'countdown',
				'logos',
				'stats',
				'cards',
				'steps',
				'comparison',
				'compliance',
				'pricing',
				'quotes',
				'reviews',
				'faq',
				'leadForm',
				'callout',
				'prose',
				'stickyCta',
				'people',
				'leadership',
				'team',
				'mediaGrid',
				'gallery',
				'banners',
				'carousel',
				'products',
				'catalog',
				'articles',
				'blog',
				'customHtml',
				'embed',
			]

			for (const key of Object.keys(m)) {
				const val = m[key]
				if (!val) continue

				let mappedType = key
				if (key === 'hero') mappedType = 'hero.split'
				if (key === 'logos') mappedType = 'logo-list'
				if (key === 'stats') mappedType = 'stat-list'
				if (key === 'cards') mappedType = 'card-list'
				if (key === 'steps') mappedType = 'step-list'
				if (key === 'comparison') mappedType = 'comparison-table'
				if (key === 'compliance') mappedType = 'compliance-vault'
				if (key === 'pricing') mappedType = 'tiered-pricing'
				if (key === 'faq') mappedType = 'accordion-list'
				if (key === 'leadForm') mappedType = 'lead-capture-form'
				if (key === 'countdown') mappedType = 'countdown-banner'
				if (key === 'reviews') mappedType = 'social-proof'
				if (key === 'quotes') mappedType = 'quote-list'
				if (key === 'stickyCta') mappedType = 'sticky-mobile-cta'
				if (key === 'people' || key === 'leadership' || key === 'team') mappedType = 'person-list'
				if (key === 'mediaGrid' || key === 'gallery') mappedType = 'media-grid'
				if (key === 'banners' || key === 'carousel') mappedType = 'carousel-banner-list'
				if (key === 'products' || key === 'catalog') mappedType = 'product-list'
				if (key === 'articles' || key === 'blog') mappedType = 'blog-post-list'
				if (key === 'customHtml' || key === 'embed') mappedType = 'custom-html'

				const modPayload = Array.isArray(val)
					? { type: mappedType, [key]: val }
					: typeof val === 'object'
						? { type: mappedType, ...val }
						: { type: mappedType, content: val }

				const normalized = normalizeSingleModule(modPayload, title, mediaChecklist)
				if (normalized) assembledModules.push(normalized)
			}
		}

		// Always ensure Social Share Cover Image is on media checklist
		mediaChecklist.unshift({
			slot: 'SEO & Social Share Cover Image (16:9)',
			guide: 'High-impact 1200x630px social card preview for LinkedIn, Twitter, and search engines.',
			suggestedAlt: `${title} - social share and meta preview image`,
		})

		const metadata: Record<string, any> = {
			_type: 'metadata',
			title: metaTitle,
			description: metaDescription,
			slug: {
				_type: 'slug',
				current: targetSlug,
			},
			noIndex,
		}

		// Helper to infer tab & path for 1-click deep navigation
		const inferTargetTabAndPath = (targetLocation: string, actionRequired: string) => {
			const loc = targetLocation.toLowerCase()
			const act = actionRequired.toLowerCase()
			if (
				loc.includes('tab 2') ||
				loc.includes('appearance') ||
				act.includes('theme') ||
				act.includes('atmosphere') ||
				act.includes('canvas')
			) {
				return { targetTab: 'appearance', targetPath: 'appearance' }
			}
			if (
				loc.includes('tab 3') ||
				loc.includes('metadata') ||
				loc.includes('seo') ||
				act.includes('social share') ||
				act.includes('open graph') ||
				act.includes('meta')
			) {
				return { targetTab: 'metadata', targetPath: 'metadata.image' }
			}
			if (loc.includes('hero') || act.includes('hero')) {
				return { targetTab: 'content', targetPath: 'modules' }
			}
			if (loc.includes('logo') || act.includes('logo')) {
				return { targetTab: 'content', targetPath: 'modules' }
			}
			if (loc.includes('vault') || loc.includes('compliance') || act.includes('pdf')) {
				return { targetTab: 'content', targetPath: 'modules' }
			}
			return { targetTab: 'content', targetPath: 'modules' }
		}

		// Generate or adopt Manual Action Notes (Handoff Checklist for Editor: step + title + location)
		const editorialChecklist: Array<{
			_key: string
			step: number
			targetLocation: string
			targetTab?: string
			targetPath?: string
			actionRequired: string
			guidelines?: string
			suggestedAltText?: string
			completed: boolean
		}> = []

		if (Array.isArray(parsedJson.manualActionNotes) && parsedJson.manualActionNotes.length > 0) {
			parsedJson.manualActionNotes.forEach((n: any, idx: number) => {
				const loc = cleanString(n.location || n.targetLocation) || 'Tab 1: Content'
				const titleText = cleanString(n.title || n.actionRequired || n.action) || 'Required Action'
				const inferred = inferTargetTabAndPath(loc, titleText)
				const targetTab = cleanString(n.targetTab) || inferred.targetTab
				const targetPath = cleanString(n.targetPath) || inferred.targetPath

				editorialChecklist.push({
					_key: genKey(),
					step: Number(n.step) || idx + 1,
					targetLocation: loc,
					targetTab,
					targetPath,
					actionRequired: titleText,
					guidelines: cleanString(n.guidelines || n.instruction),
					suggestedAltText: cleanString(n.suggestedAltText || n.altText || n.alt),
					completed: false,
				})
			})
		} else {
			// Auto-generate compact high-value manual action notes based on assembled modules
			let stepCount = 1

			const hasHero = assembledModules.some((m) => m._type === 'hero.split' || m._type === 'hero-slider')
			if (hasHero) {
				editorialChecklist.push({
					_key: genKey(),
					step: stepCount++,
					targetLocation: 'Tab 1: Content -> Hero Split',
					targetTab: 'content',
					targetPath: 'modules',
					actionRequired: 'Upload Primary Visual Asset (16:9)',
					suggestedAltText: `${title} - primary hero visual`,
					completed: false,
				})
			}

			const hasLogos = assembledModules.some((m) => m._type === 'logo-list')
			if (hasLogos) {
				editorialChecklist.push({
					_key: genKey(),
					step: stepCount++,
					targetLocation: 'Tab 1: Content -> Logo Marquee',
					targetTab: 'content',
					targetPath: 'modules',
					actionRequired: 'Link Partner & Certification Logos',
					completed: false,
				})
			}

			const hasVault = assembledModules.some((m) => m._type === 'compliance-vault')
			if (hasVault) {
				editorialChecklist.push({
					_key: genKey(),
					step: stepCount++,
					targetLocation: 'Tab 1: Content -> Compliance Vault',
					targetTab: 'content',
					targetPath: 'modules',
					actionRequired: 'Attach Downloadable Technical PDF (Optional)',
					completed: false,
				})
			}

			editorialChecklist.push({
				_key: genKey(),
				step: stepCount++,
				targetLocation: 'Tab 2: Appearance & Atmosphere',
				targetTab: 'appearance',
				targetPath: 'appearance',
				actionRequired: 'Verify Canvas Theme & Header Transparency',
				completed: false,
			})

			editorialChecklist.push({
				_key: genKey(),
				step: stepCount++,
				targetLocation: 'Tab 3: Metadata & SEO',
				targetTab: 'metadata',
				targetPath: 'metadata.image',
				actionRequired: 'Attach Social Share Card (1200 × 630 px)',
				suggestedAltText: `${title} - social share and meta preview image`,
				completed: false,
			})
		}

		return importResult({
			success: true,
			title,
			slug: targetSlug,
			appearance,
			metadata,
			modules: assembledModules,
			editorialChecklist,
			mediaChecklist,
			manualActionNotes: editorialChecklist.map((item) => ({
				step: item.step,
				title: item.actionRequired,
				location: item.targetLocation,
				targetLocation: item.targetLocation,
				targetTab: item.targetTab,
				targetPath: item.targetPath,
				actionRequired: item.actionRequired,
				suggestedAltText: item.suggestedAltText,
			})),
			stats: {
				moduleCount: assembledModules.length,
				moduleTypes: assembledModules.map((mod) => mod._type),
				mediaChecklistCount: mediaChecklist.length,
				manualActionsCount: editorialChecklist.length,
			},
		})
	} catch (error: any) {
		console.error('Smart Page Importer Error:', error)
		return importResult(
			{ error: error?.message || 'Failed to process page assembly.' },
			{ status: 500 },
		)
	}
}
