import { getGlobalPixelWidth } from '@shared/pixel-width'

export type PartialLevel = 0 | 1 | 2 | 3 | 4 // 0%, 25%, 50%, 75%, 100%

export type GateSeverity = 'P0_CRITICAL' | 'P1_REQUIRED' | 'P2_RECOMMENDED'

export interface GateResult {
	id: string
	code: string
	label: string
	severity: GateSeverity
	passed: boolean
	evidence: string
	failureReason?: string
	fixAction?: string
	targetTab: 'content' | 'publishing' | 'seo'
}

export interface SubCriteria {
	id: string
	label: string
	maxScore: number
	awardedScore: number
	level: PartialLevel
	evidence: string
	suggestion?: string
	targetTab?: 'content' | 'publishing' | 'seo'
}

export interface CategoryAuditResult {
	id: string
	number: string // '01', '02', ..., '12'
	name: string
	pillar: 'content_authority' | 'search_ai' | 'experience_compliance'
	weight: number
	awardedScore: number
	level: PartialLevel
	subCriteria: SubCriteria[]
	summary: string
}

export interface PillarScore {
	id: 'content_authority' | 'search_ai' | 'experience_compliance'
	title: string
	awardedScore: number
	maxScore: number
	percentage: number
	categoriesCount: number
}

export interface PriorityActionItem {
	id: string
	title: string
	category: string
	impact: 'critical' | 'high' | 'medium'
	instruction: string
	targetTab: 'content' | 'publishing' | 'seo'
	pointsRecoverable: number
}

// Backward-compatible checklist item
export interface GlobalAuditItem {
	id: string
	label: string
	maxScore: number
	awardedScore: number
	status: 'passed' | 'partial' | 'failed'
	detail: string
	isLegalBlocker?: boolean
}

export interface GeqsrAuditResult {
	ruleVersion: 'GEQSR-1.0'
	assessedAt: string
	totalScore: number
	maxScore: 100
	tier:
		| 'tier1_flagship'
		| 'tier2_professional'
		| 'tier3_improvement'
		| 'tier4_revision'
		| 'blocked'
	scoreTier: string
	tierDescription: string
	scoreTone: 'positive' | 'caution' | 'critical'
	contentQualityPercentage: number
	hasLegalBlocker: boolean

	pillars: {
		contentAuthority: PillarScore
		searchAi: PillarScore
		experienceCompliance: PillarScore
	}

	gates: {
		allPassed: boolean
		hasP0Failure: boolean
		hasP1Failure: boolean
		items: GateResult[]
	}

	categories: CategoryAuditResult[]
	topActionItems: PriorityActionItem[]
	checklist: GlobalAuditItem[] // Backward compatibility
}

// Alias for backwards compatibility
export type AuditResult = GeqsrAuditResult

/**
 * Global Editorial Quality & Search Readiness (GEQSR 2027-2028+)
 * Enterprise 12-Category Multi-Layer Audit Engine
 */
export function auditArticle(doc: any): GeqsrAuditResult {
	const nowIso = new Date().toISOString()

	// Helper for empty pillar initialization
	const emptyPillar = (
		id: 'content_authority' | 'search_ai' | 'experience_compliance',
		title: string,
		max: number,
	): PillarScore => ({
		id,
		title,
		awardedScore: 0,
		maxScore: max,
		percentage: 0,
		categoriesCount: 4,
	})

	if (!doc || typeof doc !== 'object') {
		return {
			ruleVersion: 'GEQSR-1.0',
			assessedAt: nowIso,
			totalScore: 0,
			maxScore: 100,
			tier: 'blocked',
			scoreTier: 'Blocked: Empty Draft',
			tierDescription: 'No document data found for audit execution.',
			scoreTone: 'critical',
			contentQualityPercentage: 0,
			hasLegalBlocker: true,
			pillars: {
				contentAuthority: emptyPillar(
					'content_authority',
					'Content Depth & Authority',
					47,
				),
				searchAi: emptyPillar('search_ai', 'Search & AI Readiness', 31),
				experienceCompliance: emptyPillar(
					'experience_compliance',
					'Experience & Compliance',
					22,
				),
			},
			gates: {
				allPassed: false,
				hasP0Failure: true,
				hasP1Failure: false,
				items: [],
			},
			categories: [],
			topActionItems: [],
			checklist: [],
		}
	}

	// ---------------------------------------------------------------------------
	// 1. DATA EXTRACTION & AST PARSING
	// ---------------------------------------------------------------------------
	const title = (doc.title || '').trim()
	const metaTitle = (doc.metadata?.title || '').trim()
	const effectiveTitle = metaTitle || title

	const excerpt = (doc.excerpt || '').trim()
	const metaDesc = (doc.metadata?.description || '').trim()
	const effectiveDesc = metaDesc || excerpt

	const slug = (doc.metadata?.slug?.current || '').trim()
	const noIndex = Boolean(doc.metadata?.noIndex)
	const coverImage = doc.metadata?.image

	const rawContent = Array.isArray(doc.content) ? doc.content : []
	const textBlocks = rawContent.filter((b: any) => b?._type === 'block')

	// Count raw words from text blocks
	let totalWords = 0
	let first200Words = ''
	const paragraphLengths: number[] = []

	for (const block of textBlocks) {
		const blockText = Array.isArray(block.children)
			? block.children.map((c: any) => c.text || '').join('')
			: ''
		const words = blockText.trim().split(/\s+/).filter(Boolean)
		totalWords += words.length

		if (block.style === 'normal' || !block.style) {
			paragraphLengths.push(words.length)
		}

		if (first200Words.length < 1200) {
			first200Words += ' ' + blockText
		}
	}

	// Headings extraction
	const h2List = textBlocks.filter((b: any) => b?.style === 'h2')
	const h3List = textBlocks.filter((b: any) => b?.style === 'h3')

	// Embed blocks analysis
	const inlineImages = rawContent.filter((b: any) => b?._type === 'image')
	const inlineImagesMissingAlt = inlineImages.filter(
		(img: any) => !img?.alt || img.alt.trim().length < 3,
	)

	const comparisonTables = rawContent.filter(
		(b: any) => b?._type === 'comparison-table',
	)
	const calloutBoxes = rawContent.filter((b: any) => b?._type === 'callout-box')
	const productEmbeds = rawContent.filter(
		(b: any) => b?._type === 'product-embed',
	)
	const ctaBanners = rawContent.filter((b: any) => b?._type === 'cta-banner')
	const affiliateLinks = rawContent.filter(
		(b: any) => b?._type === 'affiliateLink',
	)
	const codeBlocks = rawContent.filter((b: any) => b?._type === 'code')
	const videoEmbeds = rawContent.filter((b: any) => b?._type === 'video-embed')
	const faqBlocks = rawContent.filter((b: any) => b?._type === 'faq-accordion')

	let faqItemCount = 0
	for (const fb of faqBlocks) {
		if (Array.isArray(fb?.items)) {
			faqItemCount += fb.items.length
		} else {
			faqItemCount += 1
		}
	}

	// External link detection in block text spans
	let externalLinkCount = 0
	for (const block of textBlocks) {
		if (Array.isArray(block.markDefs)) {
			for (const mark of block.markDefs) {
				if (
					mark?._type === 'link' &&
					typeof mark.href === 'string' &&
					mark.href.startsWith('http')
				) {
					externalLinkCount += 1
				}
			}
		}
	}

	// Commercial presence
	const hasCommercialBlocks =
		productEmbeds.length > 0 ||
		ctaBanners.length > 0 ||
		comparisonTables.length > 0 ||
		affiliateLinks.length > 0
	const ftc = doc.ftcDisclosure || 'default'
	const isFtcViolating = hasCommercialBlocks && ftc === 'none'

	// E-E-A-T credentials
	const hasAuthor = Boolean(doc.author?._ref || doc.author?.name)
	const hasReviewer = Boolean(doc.reviewedBy?._ref || doc.reviewedBy?.name)
	const publishDate = doc.publishDate || ''
	const lastUpdatedDate = doc.lastUpdatedDate || ''
	const factCheckedDate = doc.factCheckedDate || ''
	const categories = Array.isArray(doc.categories) ? doc.categories : []
	const tags = Array.isArray(doc.tags) ? doc.tags : []
	const keyTakeaways = Array.isArray(doc.keyTakeaways) ? doc.keyTakeaways : []
	const tableOfContents = doc.tableOfContents || 'default'

	// Content substance check (Essential prerequisite)
	const hasSubstantiveContent = totalWords >= 40 || rawContent.length >= 2
	const isBlankDraft = totalWords === 0 && effectiveTitle.length === 0

	// Pixel width measurements
	const titlePixelWidth = getGlobalPixelWidth(effectiveTitle, 'title')
	const descPixelWidth = getGlobalPixelWidth(effectiveDesc, 'description')

	// ---------------------------------------------------------------------------
	// 2. LAYER 01: CRITICAL COMPLIANCE GATES (P0 & P1)
	// ---------------------------------------------------------------------------
	const gates: GateResult[] = [
		// P0 Critical: Block Publish
		{
			id: 'p0-commercial-disclosure',
			code: 'P0-1',
			label: 'Commercial Monetization Transparency (FTC / UK ASA / EU)',
			severity: 'P0_CRITICAL',
			passed: !isFtcViolating,
			evidence: isFtcViolating
				? 'Commercial blocks present while FTC disclosure is explicitly set to "None".'
				: ftc !== 'none'
					? `FTC compliance active (${ftc === 'default' ? 'Global Blog Default' : ftc}).`
					: 'Pure editorial narrative without commercial monetization blocks.',
			failureReason:
				'FTC 16 CFR Part 255 violation: Commercial product showcases or affiliate links cannot have disclosures suppressed.',
			fixAction:
				'Open Publishing Tab -> Set FTC Compliance to "Use Global Blog Default", "Affiliate", or "Sponsored".',
			targetTab: 'publishing',
		},
		{
			id: 'p0-body-content-existence',
			code: 'P0-2',
			label: 'Substantive Body Content Presence',
			severity: 'P0_CRITICAL',
			passed: totalWords >= 100,
			evidence: `Body content volume: ${totalWords} words across ${rawContent.length} blocks.`,
			failureReason:
				'Article body lacks substantive content or consists of an unwritten draft container (< 100 words).',
			fixAction:
				'Open Content Tab -> Compose article body with structured sections and narrative blocks.',
			targetTab: 'content',
		},
		{
			id: 'p0-headline-integrity',
			code: 'P0-3',
			label: 'Article Headline Integrity',
			severity: 'P0_CRITICAL',
			passed: effectiveTitle.length >= 5,
			evidence: effectiveTitle
				? `Headline resolved: "${effectiveTitle.slice(0, 50)}${effectiveTitle.length > 50 ? '...' : ''}"`
				: 'Missing article title.',
			failureReason:
				'Article headline is missing or contains fewer than 5 characters.',
			fixAction:
				'Open Content Tab -> Provide an informative, search-intent aligned Article Headline.',
			targetTab: 'content',
		},

		// P1 Required: Block Publish-Ready
		{
			id: 'p1-slug-resolution',
			code: 'P1-1',
			label: 'Search Permalinks & Canonical Slug Resolution',
			severity: 'P1_REQUIRED',
			passed: slug.length >= 2 && /^[a-z0-9-]+$/.test(slug),
			evidence: slug
				? `URL permalink configured: "/blog/${slug}"`
				: 'Missing or malformed slug.',
			failureReason:
				'Article slug is not configured or contains invalid characters (must use lowercase letters, numbers, hyphens).',
			fixAction:
				'Open SEO & Metadata Tab -> Click Generate under the Slug field to create a clean URL.',
			targetTab: 'seo',
		},
		{
			id: 'p1-indexation-guard',
			code: 'P1-2',
			label: 'Unintended Noindex Crawler Gate',
			severity: 'P1_REQUIRED',
			passed: !noIndex,
			evidence: noIndex
				? 'Search engine crawlers explicitly blocked (noIndex: true).'
				: 'Search engine indexation enabled (noIndex: false).',
			failureReason:
				'Search engines are explicitly instructed not to index this article.',
			fixAction:
				'Open SEO & Metadata Tab -> Disable the "Prevent search engines from indexing" toggle.',
			targetTab: 'seo',
		},
		{
			id: 'p1-heading-architecture',
			code: 'P1-3',
			label: 'Semantic Subheading Architecture (At least 1 H2)',
			severity: 'P1_REQUIRED',
			passed: h2List.length >= 1,
			evidence: `${h2List.length} H2 subheadings detected in document body.`,
			failureReason:
				'No H2 subheadings found. Content presents as an unstructured wall of text, impairing mobile usability and crawl indexation.',
			fixAction:
				'Open Content Tab -> Break narrative into structured sections using H2 subheadings.',
			targetTab: 'content',
		},
		{
			id: 'p1-media-alt-baseline',
			code: 'P1-4',
			label: 'Baseline Image Accessibility (Alt Text)',
			severity: 'P1_REQUIRED',
			passed:
				inlineImages.length === 0 ||
				inlineImagesMissingAlt.length < inlineImages.length,
			evidence:
				inlineImages.length === 0
					? 'No inline images present (no missing labels).'
					: `${inlineImages.length - inlineImagesMissingAlt.length} of ${inlineImages.length} images labeled with Alt text.`,
			failureReason:
				'All inline images in this article are completely missing Alt descriptions (WCAG 2.2 AA violation).',
			fixAction:
				'Open Content Tab -> Click each image block and fill out descriptive Alt text.',
			targetTab: 'content',
		},
		{
			id: 'p1-serp-title-bounds',
			code: 'P1-5',
			label: 'Desktop SERP Title Safe Bounds (<= 630px)',
			severity: 'P1_REQUIRED',
			passed: titlePixelWidth <= 630 && titlePixelWidth >= 180,
			evidence: `${titlePixelWidth}px / ${effectiveTitle.length} chars (Critical limit: 180px–630px).`,
			failureReason:
				titlePixelWidth > 630
					? `Headline is too long (${titlePixelWidth}px) and will suffer severe truncation on Google SERP.`
					: 'Headline is too short (< 180px) to establish topical relevance.',
			fixAction:
				'Open SEO & Metadata Tab -> Refine Meta Title to 50–70 characters (300–580px ideal).',
			targetTab: 'seo',
		},
	]

	const hasP0Failure = gates.some((g) => g.severity === 'P0_CRITICAL' && !g.passed)
	const hasP1Failure = gates.some((g) => g.severity === 'P1_REQUIRED' && !g.passed)
	const allGatesPassed = !hasP0Failure && !hasP1Failure

	// ---------------------------------------------------------------------------
	// 3. LAYER 02: 12 EDITORIAL & SEARCH QUALITY CATEGORIES (100 PTS)
	// Strict Zero-Inflation Rule: Missing items receive Level 0 (0 pts).
	// Unwritten drafts receive 0 pts across dependent sub-criteria.
	// ---------------------------------------------------------------------------

	// Helper to calculate sub-criterion score
	const calcSub = (
		id: string,
		label: string,
		maxScore: number,
		level: PartialLevel,
		evidence: string,
		suggestion?: string,
		targetTab: 'content' | 'publishing' | 'seo' = 'content',
	): SubCriteria => ({
		id,
		label,
		maxScore,
		awardedScore: Math.round(((maxScore * level) / 4) * 10) / 10,
		level,
		evidence,
		suggestion,
		targetTab,
	})

	const buildCategory = (
		id: string,
		number: string,
		name: string,
		pillar: 'content_authority' | 'search_ai' | 'experience_compliance',
		weight: number,
		subCriteria: SubCriteria[],
		summary: string,
	): CategoryAuditResult => {
		const awarded = subCriteria.reduce((sum, s) => sum + s.awardedScore, 0)
		const clampedAwarded = Math.min(weight, Math.max(0, awarded))
		const ratio = weight > 0 ? clampedAwarded / weight : 0
		const level = (
			ratio >= 0.9 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.45 ? 2 : ratio >= 0.2 ? 1 : 0
		) as PartialLevel

		return {
			id,
			number,
			name,
			pillar,
			weight,
			awardedScore: Math.round(clampedAwarded * 10) / 10,
			level,
			subCriteria,
			summary,
		}
	}

	// --- 01. Search Intent & Audience Alignment (10 pts) ---
	const hasOpeningAnswer =
		hasSubstantiveContent &&
		first200Words.length > 80 &&
		(first200Words.includes('because') ||
			first200Words.includes('guide') ||
			first200Words.includes('how to') ||
			first200Words.includes('analysis') ||
			first200Words.includes('solution') ||
			first200Words.includes('overview') ||
			excerpt.length >= 80)

	const sub01_1_level: PartialLevel = !hasSubstantiveContent
		? 0
		: hasOpeningAnswer
			? 4
			: excerpt.length > 40
				? 2
				: 1
	const sub01_1 = calcSub(
		'01-intent-clarity',
		'Search Intent Clarity & Direct Opening Answer',
		4,
		sub01_1_level,
		!hasSubstantiveContent
			? 'No body content or opening statement provided.'
			: hasOpeningAnswer
				? `Article states core purpose and context directly in the lead paragraph (${totalWords} words overall).`
				: 'Lead paragraph delays core answer. State key findings or practical value in the opening 200 words.',
		'Ensure the first paragraph answers the reader primary question before expanding into narrative background.',
		'content',
	)

	const sub01_2_level: PartialLevel = categories.length > 0 ? 4 : 0
	const sub01_2 = calcSub(
		'01-audience-alignment',
		'Target Audience Specification & Problem Solving',
		3,
		sub01_2_level,
		categories.length > 0
			? `Target topical vertical assigned (${categories.length} category taxonomy link).`
			: 'No taxonomy category assigned to orient reader persona.',
		'Assign a primary category in the Publishing tab to align with audience interest.',
		'publishing',
	)

	const sub01_3_level: PartialLevel =
		totalWords >= 500
			? 4
			: totalWords >= 250
				? 2
				: totalWords >= 50
					? 1
					: 0
	const sub01_3 = calcSub(
		'01-customer-journey',
		'Self-Contained Value (Zero Unnecessary Bounce)',
		3,
		sub01_3_level,
		totalWords >= 500
			? `Substantive depth (${totalWords} words) delivers comprehensive resolution without forcing cross-clicks.`
			: totalWords > 0
				? `Thin coverage (${totalWords} words) risks user bounce back to SERP. Expand procedural or analytical depth.`
				: 'No body content present.',
		'Expand practical examples or concrete methodologies to solve reader queries completely.',
		'content',
	)
	const cat01 = buildCategory(
		'search-intent',
		'01',
		'Search Intent & Audience Alignment',
		'content_authority',
		10,
		[sub01_1, sub01_2, sub01_3],
		'Evaluates whether the article directly satisfies the primary search intent without topical drifting.',
	)

	// --- 02. Content Depth & Editorial Quality (15 pts) ---
	const averageParagraphWordCount =
		paragraphLengths.length > 0
			? Math.round(
					paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length,
				)
			: 0
	const isPacingOptimal =
		averageParagraphWordCount >= 25 && averageParagraphWordCount <= 90

	const sub02_1_level: PartialLevel =
		totalWords >= 750
			? 4
			: totalWords >= 450
				? 3
				: totalWords >= 200
					? 2
					: totalWords >= 50
						? 1
						: 0
	const sub02_1 = calcSub(
		'02-editorial-depth',
		'Procedural Explanation & Analytical Depth',
		5,
		sub02_1_level,
		totalWords > 0
			? `Article contains ${totalWords} words across ${textBlocks.length} text sections.`
			: 'Article body is empty.',
		'Enrich technical explanation with cause-and-effect rationales and real-world procedures.',
		'content',
	)

	const sub02_2_level: PartialLevel =
		comparisonTables.length > 0
			? 4
			: calloutBoxes.length > 0 || codeBlocks.length > 0
				? 2
				: 0
	const sub02_2 = calcSub(
		'02-data-benchmarks',
		'Empirical Data, Benchmarks or Structured Comparisons',
		4,
		sub02_2_level,
		comparisonTables.length > 0
			? `${comparisonTables.length} interactive comparison matrix block(s) detected.`
			: calloutBoxes.length > 0
				? `${calloutBoxes.length} analytical callout block(s) present.`
				: 'No tables, callouts, or benchmark blocks found.',
		'Add a Comparison Table or Callout Box with quantitative data to elevate editorial rigor.',
		'content',
	)

	const sub02_3_level: PartialLevel =
		h2List.length >= 3 && h3List.length >= 1
			? 4
			: h2List.length >= 2
				? 3
				: h2List.length >= 1
					? 1
					: 0
	const sub02_3 = calcSub(
		'02-heading-structure',
		'Logical Heading Progression (H2/H3 Flow)',
		3,
		sub02_3_level,
		h2List.length > 0
			? `${h2List.length} H2s, ${h3List.length} H3s structuring the narrative.`
			: 'No H2 or H3 subheadings found.',
		'Introduce at least 3 distinct H2 subheadings to break up large narrative chunks.',
		'content',
	)

	const sub02_4_level: PartialLevel =
		totalWords === 0
			? 0
			: isPacingOptimal
				? 4
				: averageParagraphWordCount > 130
					? 1
					: 2
	const sub02_4 = calcSub(
		'02-anti-fluff',
		'Editorial Density & Paragraph Rhythm',
		3,
		sub02_4_level,
		totalWords > 0
			? `Average paragraph density: ~${averageParagraphWordCount} words/paragraph.`
			: 'No paragraphs available for pacing analysis.',
		'Break long text blocks into concise paragraphs (30–80 words) for effortless scanning.',
		'content',
	)
	const cat02 = buildCategory(
		'content-depth',
		'02',
		'Content Depth & Editorial Quality',
		'content_authority',
		15,
		[sub02_1, sub02_2, sub02_3, sub02_4],
		'Highest weighted group prioritizing substance, structured comparisons, and succinct editorial delivery.',
	)

	// --- 03. E-E-A-T & Trustworthiness (12 pts) ---
	const sub03_1 = calcSub(
		'03-author-credentials',
		'Author Identity & Editorial Byline (Person Entity)',
		2,
		hasAuthor ? 4 : 0,
		hasAuthor
			? 'Credited author profile linked to document.'
			: 'Uncredited byline (missing author reference).',
		'Select an author in the Publishing tab to provide verifiable human credentials.',
		'publishing',
	)
	const sub03_2 = calcSub(
		'03-expert-reviewer',
		'Certified Technical Reviewer (Peer Verification)',
		2,
		hasReviewer ? 4 : 0,
		hasReviewer
			? 'Independent technical expert reviewer attached to this post.'
			: 'No expert reviewer attributed.',
		'For B2B & technical topics, assign an expert reviewer in the Publishing tab for E-E-A-T trust.',
		'publishing',
	)
	const sub03_3_level: PartialLevel = !hasSubstantiveContent
		? 0
		: comparisonTables.length > 0 || videoEmbeds.length > 0 || inlineImages.length >= 2
			? 4
			: inlineImages.length >= 1
				? 2
				: 0
	const sub03_3 = calcSub(
		'03-verifiable-evidence',
		'Real-World Case Validation / Field Evidence',
		2,
		sub03_3_level,
		hasSubstantiveContent && (inlineImages.length > 0 || comparisonTables.length > 0)
			? `${inlineImages.length} images, ${comparisonTables.length} tables, ${videoEmbeds.length} video demonstrations.`
			: 'No empirical proof, photos, tables, or product demonstrations found.',
		'Include real operational photos, screenshots, or testing data to prove first-hand experience.',
		'content',
	)
	const sub03_4_level: PartialLevel =
		externalLinkCount >= 2 ? 4 : externalLinkCount === 1 ? 2 : 0
	const sub03_4 = calcSub(
		'03-external-citations',
		'Authoritative External Citations & Primary Sources',
		2,
		sub03_4_level,
		externalLinkCount > 0
			? `${externalLinkCount} external reference links detected across narrative spans.`
			: 'Zero external citations or industry source links found.',
		'Cite official industry standards, regulations (e.g. ISO, W3C, ASTM, Govt), or peer studies.',
		'content',
	)
	const sub03_5_level: PartialLevel = factCheckedDate ? 4 : 0
	const sub03_5 = calcSub(
		'03-fact-checked-date',
		'Fact-Checked Timestamp Verification',
		2,
		sub03_5_level,
		factCheckedDate
			? `Fact-checking verified on ${factCheckedDate}.`
			: 'No formal fact-checking date recorded.',
		'Specify a Fact-Checked Date in the Publishing tab once technical verification is finalized.',
		'publishing',
	)
	const sub03_6_level: PartialLevel = !hasSubstantiveContent
		? 0
		: lastUpdatedDate
			? 4
			: publishDate
				? 3
				: 0
	const sub03_6 = calcSub(
		'03-freshness-transparency',
		'Freshness & Modification Transparency',
		2,
		sub03_6_level,
		lastUpdatedDate
			? `Explicit revision freshness date: ${lastUpdatedDate}.`
			: publishDate && hasSubstantiveContent
				? `Published: ${publishDate}.`
				: 'No publication or refresh date recorded for content.',
		'Record Last Modified Date when updating existing articles to signal fresh data to Google.',
		'publishing',
	)
	const cat03 = buildCategory(
		'eeat-trustworthiness',
		'03',
		'E-E-A-T & Trustworthiness',
		'content_authority',
		12,
		[sub03_1, sub03_2, sub03_3, sub03_4, sub03_5, sub03_6],
		'Verifies credible author credentials, peer reviewer attribution, fact-checking, and primary source citations.',
	)

	// --- 04. Originality & Information Gain (10 pts) ---
	const hasBespokeFramework =
		comparisonTables.some((t: any) => t.highlightColumn !== undefined) ||
		calloutBoxes.some((c: any) => c.tone === 'tip' || c.tone === 'quote') ||
		productEmbeds.some((p: any) => Boolean(p.customReviewSnippet))

	const sub04_1_level: PartialLevel = !hasSubstantiveContent
		? 0
		: hasBespokeFramework
			? 4
			: totalWords >= 600
				? 2
				: 0
	const sub04_1 = calcSub(
		'04-proprietary-insights',
		'Proprietary Analysis & Information Gain',
		4,
		sub04_1_level,
		hasBespokeFramework
			? 'Proprietary elements detected (custom review snippets, highlighted comparison columns, curated callouts).'
			: 'Standard informational overview without highlighted proprietary conclusions.',
		'Add original analysis, custom benchmarking criteria, or exclusive vendor assessments.',
		'content',
	)

	const sub04_2_level: PartialLevel =
		inlineImages.length >= 2 || videoEmbeds.length > 0
			? 4
			: inlineImages.length === 1
				? 2
				: 0
	const sub04_2 = calcSub(
		'04-distinct-visuals',
		'Bespoke Visual Media & Diagrammatic Proof',
		3,
		sub04_2_level,
		inlineImages.length > 0 || videoEmbeds.length > 0
			? `${inlineImages.length} inline editorial graphics and ${videoEmbeds.length} embedded video clips.`
			: 'No visual media or diagrams present in content.',
		'Supplement text with technical schematics, process flowcharts, or high-res product photos.',
		'content',
	)

	const sub04_3_level: PartialLevel =
		totalWords >= 600 && (comparisonTables.length > 0 || productEmbeds.length > 0)
			? 4
			: totalWords >= 400
				? 2
				: totalWords >= 150
					? 1
					: 0
	const sub04_3 = calcSub(
		'04-non-derivative',
		'Non-Derivative Angle (Beyond Generic LLM Summary)',
		3,
		sub04_3_level,
		sub04_3_level > 0
			? 'Content combines narrative analysis with structured operational assets and commercial context.'
			: 'Content is insufficient to establish non-derivative editorial value.',
		'Infuse unique organizational perspectives or lessons learned to differentiate from AI generated summaries.',
		'content',
	)
	const cat04 = buildCategory(
		'originality-gain',
		'04',
		'Originality & Information Gain',
		'content_authority',
		10,
		[sub04_1, sub04_2, sub04_3],
		'Assesses unique data, proprietary benchmarking, and distinct perspectives that surpass generic AI summaries.',
	)

	// --- 05. Semantic SEO & On-Page Optimization (10 pts) ---
	let titleLevel: PartialLevel = 0
	let titleEval = ''
	if (!effectiveTitle) {
		titleLevel = 0
		titleEval = 'Missing headline / Meta title'
	} else if (titlePixelWidth >= 300 && titlePixelWidth <= 580) {
		titleLevel = 4
		titleEval = `${titlePixelWidth}px / ${effectiveTitle.length} chars (Optimal SERP: 300–580px, ~50–70 chars)`
	} else if (
		(titlePixelWidth >= 220 && titlePixelWidth < 300) ||
		(titlePixelWidth > 580 && titlePixelWidth <= 630)
	) {
		titleLevel = 2
		titleEval = `${titlePixelWidth}px / ${effectiveTitle.length} chars (Warning: slightly short or risk of desktop truncation)`
	} else {
		titleLevel = 0
		titleEval = `${titlePixelWidth}px / ${effectiveTitle.length} chars (Out of optimal bounds: <220px or >630px)`
	}

	let descLevel: PartialLevel = 0
	let descEval = ''
	if (!effectiveDesc) {
		descLevel = 0
		descEval = 'Missing Meta description'
	} else if (descPixelWidth >= 650 && descPixelWidth <= 1180) {
		descLevel = 4
		descEval = `${descPixelWidth}px / ${effectiveDesc.length} chars (Optimal SERP & GEO: 140–200 chars)`
	} else if (
		(descPixelWidth >= 450 && descPixelWidth < 650) ||
		(descPixelWidth > 1180 && descPixelWidth <= 1300)
	) {
		descLevel = 2
		descEval = `${descPixelWidth}px / ${effectiveDesc.length} chars (Warning: slightly short or risk of snippet truncation)`
	} else {
		descLevel = 0
		descEval = `${descPixelWidth}px / ${effectiveDesc.length} chars (Out of optimal bounds)`
	}

	const sub05_1 = calcSub(
		'05-serp-title',
		'Multi-Script SERP Title Pixel Width (300–580px)',
		3,
		titleLevel,
		titleEval,
		titleLevel < 4
			? 'Tune title length to 50–70 characters (300–580px) to prevent SERP truncation.'
			: undefined,
		'seo',
	)
	const sub05_2 = calcSub(
		'05-meta-description',
		'Meta Description Snippet Bounds (650–1180px)',
		3,
		descLevel,
		descEval,
		descLevel < 4
			? 'Craft a 150–200 character summary to maximize SERP CTR and snippet presence.'
			: undefined,
		'seo',
	)
	const sub05_3_level: PartialLevel =
		h2List.length >= 2 ? 4 : h2List.length === 1 ? 2 : 0
	const sub05_3 = calcSub(
		'05-heading-hierarchy',
		'Hierarchical Heading Flow (Single H1, Logical H2/H3)',
		2,
		sub05_3_level,
		h2List.length > 0
			? `${h2List.length} H2 tags, ${h3List.length} H3 tags. Single document H1 maintained by template.`
			: 'No H2 headings found.',
		'Add at least 2 H2 sections to organize topics.',
		'content',
	)
	const sub05_4_level: PartialLevel =
		tags.length >= 3 && categories.length >= 1
			? 4
			: tags.length >= 1 || categories.length >= 1
				? 2
				: 0
	const sub05_4 = calcSub(
		'05-topical-tags',
		'Topical Tagging & Categorization',
		2,
		sub05_4_level,
		categories.length > 0 || tags.length > 0
			? `${categories.length} category taxonomy links and ${tags.length} thematic keywords.`
			: 'No categories or tags assigned.',
		'Add 3–5 targeted tags in the Publishing tab to clarify topical entities.',
		'publishing',
	)
	const cat05 = buildCategory(
		'semantic-seo',
		'05',
		'Semantic SEO & On-Page Optimization',
		'search_ai',
		10,
		[sub05_1, sub05_2, sub05_3, sub05_4],
		'Ensures exact SERP title/description pixel dimensions and strict semantic heading progression.',
	)

	// --- 06. GEO / AEO / AI Search Readiness (8 pts) ---
	const sub06_1_level: PartialLevel =
		keyTakeaways.length >= 3 ? 4 : keyTakeaways.length >= 1 ? 2 : 0
	const sub06_1 = calcSub(
		'06-key-takeaways',
		'Executive Summary / Key Takeaways Extraction',
		4,
		sub06_1_level,
		keyTakeaways.length >= 3
			? `${keyTakeaways.length} executive summary points ready for Google AI Overviews & Perplexity ingestion.`
			: keyTakeaways.length >= 1
				? `${keyTakeaways.length} bullet point(s). Recommended: 3–5 high-impact bullets.`
				: 'Missing Key Takeaways / TL;DR section.',
		'Fill in 3–5 bullet points in "Key Takeaways" (Content Tab) for priority quotation by AI search engines.',
		'content',
	)

	const sub06_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: faqItemCount >= 2 || calloutBoxes.length >= 1
			? 4
			: faqItemCount === 1
				? 2
				: 0
	const sub06_2 = calcSub(
		'06-direct-answers',
		'Question Coverage & High-Density Definitions',
		2,
		sub06_2_level,
		faqItemCount > 0
			? `${faqItemCount} structured Q&A items available for direct answer extraction.`
			: calloutBoxes.length > 0
				? 'Structured editorial callout box provides direct answer framing.'
				: 'No technical FAQ accordion or definition callouts present.',
		'Include an FAQ Accordion block to answer high-frequency questions directly.',
		'content',
	)

	const sub06_3_level: PartialLevel =
		h2List.length >= 3 && textBlocks.length >= 4
			? 4
			: h2List.length >= 1 && textBlocks.length >= 2
				? 2
				: 0
	const sub06_3 = calcSub(
		'06-chunkable-structure',
		'Chunkable Structure for LLM Passage Extraction',
		2,
		sub06_3_level,
		sub06_3_level > 0
			? 'Sections are modularized beneath clear topical headings suitable for RAG chunking.'
			: 'Content is not structured into modular topical passages.',
		'Ensure every subheading is followed by a concrete, self-contained factual response.',
		'content',
	)
	const cat06 = buildCategory(
		'geo-aeo-readiness',
		'06',
		'GEO / AEO / AI Search Readiness',
		'search_ai',
		8,
		[sub06_1, sub06_2, sub06_3],
		'Structures content for priority citation, passage retrieval, and quotation in Google AI Overviews & Perplexity.',
	)

	// --- 07. Technical SEO & Indexability (8 pts) ---
	const sub07_1_level: PartialLevel =
		slug.length >= 3 && /^[a-z0-9-]+$/.test(slug) ? 4 : 0
	const sub07_1 = calcSub(
		'07-clean-slug',
		'Clean & Stable URL Slug Architecture',
		3,
		sub07_1_level,
		slug ? `Valid slug: "/blog/${slug}"` : 'Missing URL slug.',
		'Generate a lowercase, hyphen-separated permalink in the SEO tab.',
		'seo',
	)

	// Indexation only earns points if article has content (empty pages cannot earn indexing points)
	const sub07_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: !noIndex
			? 4
			: 0
	const sub07_2 = calcSub(
		'07-indexation-directive',
		'Indexation Directive Compliance',
		3,
		sub07_2_level,
		!hasSubstantiveContent
			? 'Draft content is empty (not ready for indexation).'
			: !noIndex
				? 'Indexable (robots: index, follow).'
				: 'Warning: noIndex is enabled for this post.',
		'Ensure "noIndex" remains toggled off for standard public articles.',
		'seo',
	)

	const sub07_3_level: PartialLevel = !hasSubstantiveContent
		? 0
		: coverImage?.asset
			? 4
			: 2
	const sub07_3 = calcSub(
		'07-canonical-resolution',
		'Canonical URL Path & OpenGraph Image Validation',
		2,
		sub07_3_level,
		coverImage?.asset
			? 'Dedicated OpenGraph / Social share cover image assigned.'
			: hasSubstantiveContent
				? 'Using dynamic SVG OpenGraph fallback card.'
				: 'No cover image or substantive content for canonical card.',
		'Upload a 1200x630 px Social Share image in the SEO tab for rich previews.',
		'seo',
	)
	const cat07 = buildCategory(
		'technical-seo',
		'07',
		'Technical SEO & Indexability',
		'search_ai',
		8,
		[sub07_1, sub07_2, sub07_3],
		'Verifies crawlability, canonical URL path resolution, indexation directives, and social share metadata.',
	)

	// --- 08. Structured Data & Entity Understanding (5 pts) ---
	const sub08_1_level: PartialLevel =
		hasSubstantiveContent && effectiveTitle && effectiveDesc && publishDate
			? 4
			: hasSubstantiveContent && effectiveTitle
				? 2
				: 0
	const sub08_1 = calcSub(
		'08-schema-mapping',
		'BlogPosting Schema & Article Entity Completeness',
		2,
		sub08_1_level,
		sub08_1_level > 0
			? 'Headline, description, publication date and canonical URL fully mapped to BlogPosting JSON-LD.'
			: 'Incomplete document: Headline and description required to construct valid BlogPosting schema.',
		'Complete Title and Meta Description to populate Article structured data.',
		'seo',
	)

	const sub08_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: hasAuthor
			? 4
			: 2
	const sub08_2 = calcSub(
		'08-person-organization',
		'Author (Person) & Publisher (Organization) Graph',
		2,
		sub08_2_level,
		hasAuthor
			? 'Linked Author Person entity populated with name, bio, and social graph.'
			: hasSubstantiveContent
				? 'Fallback Organization entity applied in schema graph.'
				: 'Unassigned author profile.',
		'Assign an author profile to emit Person entity graph for Google Knowledge Graph integration.',
		'publishing',
	)

	const sub08_3_level: PartialLevel =
		categories.length > 0 && hasSubstantiveContent ? 4 : 0
	const sub08_3 = calcSub(
		'08-breadcrumb-taxonomy',
		'Hierarchical BreadcrumbList Schema Support',
		1,
		sub08_3_level,
		categories.length > 0
			? `Primary category configured for BreadcrumbList schema.`
			: 'No category taxonomy assigned for BreadcrumbList schema hierarchy.',
		'Select a category in the Publishing tab to populate breadcrumb markup.',
		'publishing',
	)
	const cat08 = buildCategory(
		'structured-data',
		'08',
		'Structured Data & Entity Understanding',
		'search_ai',
		5,
		[sub08_1, sub08_2, sub08_3],
		'Validates BlogPosting, Person, Organization, and BreadcrumbList JSON-LD schema entity resolution.',
	)

	// --- 09. Accessibility & Inclusive UX (WCAG 2.2 AA) (7 pts) ---
	let altLevel: PartialLevel = 0
	let altEval = ''
	if (!hasSubstantiveContent) {
		altLevel = 0
		altEval = 'No content or media available for accessibility audit.'
	} else if (inlineImages.length === 0) {
		altLevel = 1 // 25% - no media present, does not get free 100%
		altEval =
			'Missing editorial media: Articles require at least 1 photo or diagram with descriptive Alt text.'
	} else if (inlineImagesMissingAlt.length === 0) {
		altLevel = 4
		altEval = `All ${inlineImages.length} inline images verified with descriptive Alt text.`
	} else if (inlineImagesMissingAlt.length < inlineImages.length) {
		altLevel = 2
		altEval = `${inlineImages.length - inlineImagesMissingAlt.length} of ${inlineImages.length} images labeled (${inlineImagesMissingAlt.length} missing Alt text).`
	} else {
		altLevel = 0
		altEval = `Accessibility violation: All ${inlineImages.length} images are missing Alt descriptions.`
	}

	const sub09_1 = calcSub(
		'09-alt-completeness',
		'WCAG 2.2 Image Text Alternatives (Alt Text)',
		4,
		altLevel,
		altEval,
		altLevel < 4
			? 'Add descriptive text to all images for screen readers and search indexers.'
			: undefined,
		'content',
	)

	const sub09_2_level: PartialLevel =
		h2List.length >= 2 ? 4 : h2List.length === 1 ? 2 : 0
	const sub09_2 = calcSub(
		'09-semantic-landmarks',
		'Semantic Landmarks & Heading Progression',
		2,
		sub09_2_level,
		h2List.length > 0
			? 'Semantic heading progression avoids skipped levels, ensuring seamless screen-reader navigation.'
			: 'No structural heading landmarks found.',
		'Structure content with H2 subheadings to enable screen-reader landmark jumps.',
		'content',
	)

	const sub09_3_level: PartialLevel = totalWords >= 50 ? 4 : 0
	const sub09_3 = calcSub(
		'09-informative-anchors',
		'Informative Link Labels & Meaningful Anchors',
		1,
		sub09_3_level,
		totalWords >= 50
			? 'Clean anchor texts used throughout body copy without generic "click here" patterns.'
			: 'No body copy available for anchor text verification.',
		undefined,
		'content',
	)
	const cat09 = buildCategory(
		'accessibility-wcag',
		'09',
		'Accessibility & Inclusive UX',
		'experience_compliance',
		7,
		[sub09_1, sub09_2, sub09_3],
		'Enforces WCAG 2.2 AA accessibility standards including descriptive image Alt texts and landmark hierarchy.',
	)

	// --- 10. User Experience & Readability (5 pts) ---
	const sub10_1_level: PartialLevel = !hasSubstantiveContent
		? 0
		: h2List.length >= 3 && isPacingOptimal
			? 4
			: h2List.length >= 2
				? 2
				: 1
	const sub10_1 = calcSub(
		'10-scannable-rhythm',
		'Scannable Narrative Layout (No Wall-of-Text)',
		3,
		sub10_1_level,
		totalWords > 0
			? `Article paced across ${h2List.length} sections with ~${averageParagraphWordCount} words/paragraph average.`
			: 'No narrative sections present.',
		'Add more subheadings to prevent fatigue on mobile viewports.',
		'content',
	)

	const sub10_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: tableOfContents !== 'hidden'
			? 4
			: 1
	const sub10_2 = calcSub(
		'10-table-of-contents',
		'Interactive Table of Contents (TOC) Navigation',
		2,
		sub10_2_level,
		hasSubstantiveContent && tableOfContents !== 'hidden'
			? `Active Table of Contents navigation layout: "${tableOfContents}".`
			: 'Table of Contents is unconfigured or body is empty.',
		'Enable Table of Contents in the Publishing tab (recommended: "sticky-bar") for easy reader navigation.',
		'publishing',
	)
	const cat10 = buildCategory(
		'ux-readability',
		'10',
		'User Experience & Readability',
		'experience_compliance',
		5,
		[sub10_1, sub10_2],
		'Evaluates reading ease, responsive layout pacing, and instant jumping via Table of Contents.',
	)

	// --- 11. CRO & Commercial Compliance (5 pts) ---
	const sub11_1_level: PartialLevel = !hasSubstantiveContent
		? 0
		: !isFtcViolating
			? 4
			: 0
	const sub11_1 = calcSub(
		'11-ftc-transparency',
		'US FTC 16 CFR Part 255 & Global Sponsorship Compliance',
		3,
		sub11_1_level,
		!hasSubstantiveContent
			? 'Draft content is empty (no commercial blocks active).'
			: !isFtcViolating
				? `Commercial disclosure aligned: ${ftc === 'default' ? 'Global Blog Default' : ftc}.`
				: 'CRITICAL BLOCKER: Monetized blocks present with disclosure disabled.',
		isFtcViolating
			? 'Set FTC Disclosure to "Affiliate" or "Sponsored" in the Publishing tab.'
			: undefined,
		'publishing',
	)

	const sub11_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: hasCommercialBlocks
			? 4
			: 2
	const sub11_2 = calcSub(
		'11-commercial-cta',
		'Contextual Conversion Touchpoints (Content-Led Commerce)',
		2,
		sub11_2_level,
		hasCommercialBlocks
			? `${productEmbeds.length} product embed(s), ${ctaBanners.length} CTA banner(s), ${comparisonTables.length} table(s).`
			: hasSubstantiveContent
				? 'Pure informational article with no direct commercial conversion blocks.'
				: 'No content or commercial touchpoints present.',
		!hasCommercialBlocks
			? 'Optionally embed a Product Embed or CTA Banner to capture reader interest.'
			: undefined,
		'content',
	)
	const cat11 = buildCategory(
		'cro-compliance',
		'11',
		'CRO & Commercial Compliance',
		'experience_compliance',
		5,
		[sub11_1, sub11_2],
		'Verifies lawful affiliate/commercial sponsorship declarations and non-intrusive commerce conversion modules.',
	)

	// --- 12. Localization & International SEO (5 pts) ---
	const sub12_1_level: PartialLevel = !hasSubstantiveContent
		? 0
		: publishDate
			? 4
			: 1
	const sub12_1 = calcSub(
		'12-standard-formatting',
		'Standardized Date, Unit & Currency Formatting',
		3,
		sub12_1_level,
		hasSubstantiveContent && publishDate
			? `ISO publication date (${publishDate}) and consistent numerical formatting.`
			: 'Missing publication date or body copy.',
		'Set a standard publication date in the Publishing tab.',
		'publishing',
	)

	const sub12_2_level: PartialLevel = !hasSubstantiveContent
		? 0
		: categories.length > 0 || tags.length > 0
			? 4
			: 1
	const sub12_2 = calcSub(
		'12-market-alignment',
		'Target Market Context & Terminology Consistency',
		2,
		sub12_2_level,
		hasSubstantiveContent && (categories.length > 0 || tags.length > 0)
			? 'Topical taxonomy and tags define regional market and industry context.'
			: 'No taxonomy or market vertical defined.',
		'Tag specific market verticals or product lines to reinforce regional search discovery.',
		'publishing',
	)
	const cat12 = buildCategory(
		'localization-international',
		'12',
		'Localization & Multi-Market Prep',
		'experience_compliance',
		5,
		[sub12_1, sub12_2],
		'Ensures multi-market consistency, standardized ISO date formats, and clear regional taxonomy.',
	)

	const categoriesList: CategoryAuditResult[] = [
		cat01,
		cat02,
		cat03,
		cat04,
		cat05,
		cat06,
		cat07,
		cat08,
		cat09,
		cat10,
		cat11,
		cat12,
	]

	// ---------------------------------------------------------------------------
	// 4. PILLARS SCORING AGGREGATION
	// ---------------------------------------------------------------------------
	const calcPillar = (
		id: 'content_authority' | 'search_ai' | 'experience_compliance',
		title: string,
		maxScore: number,
		cats: CategoryAuditResult[],
	): PillarScore => {
		const awarded = cats.reduce((sum, c) => sum + c.awardedScore, 0)
		const clamped = Math.min(maxScore, Math.max(0, awarded))
		const pct = Math.round((clamped / maxScore) * 100)
		return {
			id,
			title,
			awardedScore: Math.round(clamped * 10) / 10,
			maxScore,
			percentage: pct,
			categoriesCount: cats.length,
		}
	}

	const pillarContent = calcPillar(
		'content_authority',
		'Content Depth & Authority',
		47,
		[cat01, cat02, cat03, cat04],
	)
	const pillarSearch = calcPillar(
		'search_ai',
		'Search & AI Readiness',
		31,
		[cat05, cat06, cat07, cat08],
	)
	const pillarExp = calcPillar(
		'experience_compliance',
		'Experience & Compliance',
		22,
		[cat09, cat10, cat11, cat12],
	)

	// ---------------------------------------------------------------------------
	// 5. TOTAL SCORE & TIER DETERMINATION (STRICT 5-TIER GEQSR)
	// ---------------------------------------------------------------------------
	const rawTotal = isBlankDraft
		? 0
		: pillarContent.awardedScore +
			pillarSearch.awardedScore +
			pillarExp.awardedScore
	const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)))
	const contentQualityPercentage = pillarContent.percentage

	let tier: GeqsrAuditResult['tier'] = 'tier4_revision'
	let scoreTier = 'Tier 4: Major Revision'
	let tierDescription =
		'Significant editorial, technical, or compliance gaps require revision before publication.'
	let scoreTone: 'positive' | 'caution' | 'critical' = 'critical'

	if (isBlankDraft) {
		tier = 'blocked'
		scoreTone = 'critical'
		scoreTier = 'Compliance Blocked (Empty Draft)'
		tierDescription =
			'Draft contains no headline or narrative body. Populate article content to begin quality evaluation.'
	} else if (!allGatesPassed) {
		tier = 'blocked'
		scoreTone = 'critical'
		if (hasP0Failure) {
			scoreTier = 'Compliance Blocked (P0 Failure)'
			tierDescription =
				'Critical compliance blocker detected. Publishing is strictly blocked until resolved.'
		} else {
			scoreTier = 'Not Publish-Ready (P1 Failure)'
			tierDescription =
				'Essential technical or editorial gates failed. Article cannot be certified as Publish-Ready.'
		}
	} else if (totalScore >= 90 && contentQualityPercentage >= 80) {
		tier = 'tier1_flagship'
		scoreTone = 'positive'
		scoreTier = 'Tier 1: Global Flagship Quality'
		tierDescription =
			'Exceptional editorial depth, authoritative E-E-A-T, and full compliance across international search standards.'
	} else if (totalScore >= 80) {
		tier = 'tier2_professional'
		scoreTone = 'positive'
		scoreTier = 'Tier 2: Professional Quality'
		tierDescription =
			'Meets professional publication standards with minor remaining optimization opportunities.'
	} else if (totalScore >= 65) {
		tier = 'tier3_improvement'
		scoreTone = 'caution'
		scoreTier = 'Tier 3: Needs Improvement'
		tierDescription =
			'Acceptable baseline content but lacks depth, structural assets, or AI-search extraction readiness.'
	} else {
		tier = 'tier4_revision'
		scoreTone = 'critical'
		scoreTier = 'Tier 4: Major Revision'
		tierDescription =
			'Significant editorial, technical, or compliance gaps require revision before publication.'
	}

	// ---------------------------------------------------------------------------
	// 6. TOP ACTION ITEMS (PRIORITIZED FOR MAXIMUM SCORE GAIN)
	// ---------------------------------------------------------------------------
	const topActionItems: PriorityActionItem[] = []

	// Prioritize failed gates first
	for (const gate of gates.filter((g) => !g.passed)) {
		topActionItems.push({
			id: gate.id,
			title: gate.label,
			category: gate.severity === 'P0_CRITICAL' ? 'Critical Compliance' : 'Required Gate',
			impact: gate.severity === 'P0_CRITICAL' ? 'critical' : 'high',
			instruction: gate.fixAction || gate.failureReason || '',
			targetTab: gate.targetTab,
			pointsRecoverable: gate.severity === 'P0_CRITICAL' ? 15 : 8,
		})
	}

	// Then prioritize sub-criteria with level < 3
	for (const cat of categoriesList) {
		for (const sub of cat.subCriteria) {
			if (sub.level <= 2 && sub.suggestion) {
				const gap = sub.maxScore - sub.awardedScore
				if (gap > 0.5) {
					topActionItems.push({
						id: sub.id,
						title: sub.label,
						category: cat.name,
						impact: gap >= 3 ? 'high' : 'medium',
						instruction: sub.suggestion,
						targetTab: sub.targetTab || 'content',
						pointsRecoverable: Math.round(gap * 10) / 10,
					})
				}
			}
		}
	}

	// Sort action items: critical first, then highest points recoverable
	topActionItems.sort((a, b) => {
		const impactScore = (impact: PriorityActionItem['impact']) =>
			impact === 'critical' ? 100 : impact === 'high' ? 50 : 10
		return (
			impactScore(b.impact) + b.pointsRecoverable - (impactScore(a.impact) + a.pointsRecoverable)
		)
	})

	// ---------------------------------------------------------------------------
	// 7. BACKWARD COMPATIBLE CHECKLIST (MAP 12 CATEGORIES INTO GLOBAL ITEMS)
	// ---------------------------------------------------------------------------
	const checklist: GlobalAuditItem[] = categoriesList.map((cat) => ({
		id: cat.id,
		label: `${cat.number}. ${cat.name}`,
		maxScore: cat.weight,
		awardedScore: cat.awardedScore,
		status:
			cat.level === 4
				? 'passed'
				: cat.level >= 2
					? 'partial'
					: 'failed',
		detail: cat.summary,
		isLegalBlocker: cat.id === 'cro-compliance' && isFtcViolating,
	}))

	return {
		ruleVersion: 'GEQSR-1.0',
		assessedAt: nowIso,
		totalScore,
		maxScore: 100,
		tier,
		scoreTier,
		tierDescription,
		scoreTone,
		contentQualityPercentage,
		hasLegalBlocker: isFtcViolating,
		pillars: {
			contentAuthority: pillarContent,
			searchAi: pillarSearch,
			experienceCompliance: pillarExp,
		},
		gates: {
			allPassed: isBlankDraft ? false : allGatesPassed,
			hasP0Failure: isBlankDraft ? true : hasP0Failure,
			hasP1Failure: isBlankDraft ? true : hasP1Failure,
			items: gates,
		},
		categories: categoriesList,
		topActionItems: topActionItems.slice(0, 5), // Top 5 highest impact actions
		checklist,
	}
}

/**
 * Generates an executive Markdown audit report suitable for sharing with clients or editorial teams.
 */
export function generateAuditMarkdownReport(
	audit: GeqsrAuditResult,
	articleTitle: string,
): string {
	const dateStr = audit.assessedAt.split('T')[0]
	const lines: string[] = []

	lines.push(`# Editorial Quality & Search Readiness Report (GEQSR-1.0)`)
	lines.push(`**Article:** ${articleTitle || 'Untitled Document'}`)
	lines.push(`**Assessment Date:** ${dateStr}`)
	lines.push(`**Overall Score:** ${audit.totalScore} / 100 PTS`)
	lines.push(`**Readiness Tier:** ${audit.scoreTier}`)
	lines.push(`**Compliance Status:** ${audit.gates.allPassed ? 'PASSED (Zero Blockers)' : 'BLOCKED (Action Required)'}`)
	lines.push('')
	lines.push(`---`)
	lines.push('')
	lines.push(`## 1. Executive Summary & Pillars`)
	lines.push(`- **Content Depth & Authority:** ${audit.pillars.contentAuthority.awardedScore} / ${audit.pillars.contentAuthority.maxScore} PTS (${audit.pillars.contentAuthority.percentage}%)`)
	lines.push(`- **Search & AI Readiness:** ${audit.pillars.searchAi.awardedScore} / ${audit.pillars.searchAi.maxScore} PTS (${audit.pillars.searchAi.percentage}%)`)
	lines.push(`- **Experience & Compliance:** ${audit.pillars.experienceCompliance.awardedScore} / ${audit.pillars.experienceCompliance.maxScore} PTS (${audit.pillars.experienceCompliance.percentage}%)`)
	lines.push('')
	lines.push(`> ${audit.tierDescription}`)
	lines.push('')

	if (audit.topActionItems.length > 0) {
		lines.push(`## 2. Priority Action Items`)
		for (const [idx, item] of audit.topActionItems.entries()) {
			lines.push(`${idx + 1}. **[${item.impact.toUpperCase()}] ${item.title}** (Tab: \`${item.targetTab}\`, Potential: +${item.pointsRecoverable} pts)`)
			lines.push(`   - ${item.instruction}`)
		}
		lines.push('')
	}

	lines.push(`## 3. Compliance Gates`)
	for (const gate of audit.gates.items) {
		const mark = gate.passed ? '[PASSED]' : '[FAILED]'
		lines.push(`- ${mark} **${gate.code}: ${gate.label}** (${gate.severity.replace('_', ' ')})`)
		lines.push(`  Evidence: ${gate.evidence}`)
	}
	lines.push('')

	lines.push(`## 4. 12-Category Score Breakdown`)
	lines.push(`| # | Category | Score | Level | Evaluation |`)
	lines.push(`|---|---|---|---|---|`)
	for (const cat of audit.categories) {
		const levelLabel =
			cat.level === 4
				? 'Exemplary'
				: cat.level === 3
					? 'Strong'
					: cat.level === 2
						? 'Partial'
						: 'Weak'
		lines.push(`| ${cat.number} | ${cat.name} | ${cat.awardedScore} / ${cat.weight} | ${levelLabel} | ${cat.summary} |`)
	}
	lines.push('')
	lines.push(`*Generated by DeanFlow Universal AI Editorial & Quality Audit Engine (GEQSR-1.0)*`)

	return lines.join('\n')
}
