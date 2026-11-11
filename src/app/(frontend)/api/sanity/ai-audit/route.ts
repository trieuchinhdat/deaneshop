import { NextResponse } from 'next/server'
import { getGlobalPixelWidth } from '@/lib/pixel-width'

// UK to US Spelling dictionary
const UK_TO_US_SPELLINGS: Record<string, string> = {
	colour: 'color',
	colours: 'colors',
	flavour: 'flavor',
	flavours: 'flavors',
	optimise: 'optimize',
	optimised: 'optimized',
	optimising: 'optimizing',
	customise: 'customize',
	customised: 'customized',
	customising: 'customizing',
	specialise: 'specialize',
	specialised: 'specialized',
	specialising: 'specializing',
	analyse: 'analyze',
	analysed: 'analyzed',
	analysing: 'analyzing',
	centre: 'center',
	centres: 'centers',
	theatre: 'theater',
	metre: 'meter',
	metres: 'meters',
	programme: 'program',
	programmes: 'programs',
	catalogue: 'catalog',
	dialogue: 'dialog',
	travelling: 'traveling',
	jewellery: 'jewelry',
	grey: 'gray',
}

// Common AI Clichés and Buzzwords strongly disliked by US audiences
const AI_CLICHES = [
	'delve',
	'delves',
	'delving',
	'tapestry',
	'testament',
	'beacon',
	'symphony',
	'unlock',
	'unlocking',
	'elevate',
	'elevating',
	'game-changer',
	'game changer',
	'pivotal',
	'in conclusion',
	'navigating the landscape',
	'harness',
	'harnessing',
	'foster',
	'fostering',
	'paramount',
	'realm',
	'seamless',
	'seamlessly',
	'bustling',
	'nestled',
	'at the end of the day',
	'needless to say',
	'in today’s fast-paced world',
	"in today's fast-paced world",
	'in this digital age',
]

export interface ActionableFix {
	id: string
	category: 'blocker' | 'eeat' | 'geo' | 'cro' | 'localization'
	severity: 'critical' | 'warning' | 'suggestion'
	title: string
	message: string
	blockKey?: string
	quote?: string
	suggestedFix?: string
}

export interface QuotableSnippetRewrite {
	blockKey: string
	originalText: string
	suggestedRewrite: string
	reason: string
}

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const {
			title = '',
			metaDescription = '',
			keyTakeaways = [],
			blocks = [],
			ftcDisclosure = 'default',
			hasCro = false,
			hasFaq = false,
			missingAltCount = 0,
		} = body

		if (!title.trim()) {
			return NextResponse.json(
				{ error: 'Please provide an article title to run the audit.' },
				{ status: 400 },
			)
		}

		const actionableFixes: ActionableFix[] = []
		const quotableRewrites: QuotableSnippetRewrite[] = []
		let score = 100

		// Extract text representation for all prose blocks
		const proseBlocks: Array<{
			_key: string
			style: string
			text: string
			hasLinks: boolean
		}> = []

		blocks.forEach((b: any) => {
			if (b?._type === 'block') {
				const fullText = (b.children || [])
					.map((c: any) => c.text || '')
					.join('')
					.trim()
				const hasLinks =
					(b.markDefs && b.markDefs.some((m: any) => m._type === 'link')) ||
					(b.children &&
						b.children.some((c: any) => c.marks && c.marks.length > 0))

				if (fullText) {
					proseBlocks.push({
						_key: b._key,
						style: b.style || 'normal',
						text: fullText,
						hasLinks,
					})
				}
			}
		})

		const headings = proseBlocks.filter((b) => ['h2', 'h3'].includes(b.style))
		const normalParagraphs = proseBlocks.filter((b) => b.style === 'normal')
		const fullArticleText = proseBlocks.map((b) => b.text).join(' ')

		/* =========================================================================
		   1. HARD BLOCKERS (Penalties: 20-30 pts each)
		========================================================================= */

		// 1.1. Commercial & Affiliate Disclosure (FTC, ASA/CMA, EU Directive & APAC)
		if (hasCro && ftcDisclosure === 'none') {
			score -= 30
			actionableFixes.push({
				id: 'ftc-violation',
				category: 'blocker',
				severity: 'critical',
				title:
					'Commercial & Affiliate Disclosure Missing (Global Consumer Protection)',
				message:
					'Commercial conversion blocks (Product Embeds or CTA Banners) were detected, but disclosure is disabled. US FTC (16 CFR Part 255), UK ASA/CMA, and EU Unfair Commercial Practices Directive mandate clear sponsorship disclosure.',
				suggestedFix:
					'Enable "Affiliate Disclosure" or "Sponsored Article" in Publishing tab.',
			})
		}

		// 1.2. WCAG 2.1 AA Image Accessibility
		if (missingAltCount > 0) {
			score -= 25
			actionableFixes.push({
				id: 'ada-alt-missing',
				category: 'blocker',
				severity: 'critical',
				title: 'WCAG 2.1 AA Image Accessibility Non-Compliance',
				message: `${missingAltCount} image(s) in this article are missing Alt Text descriptions. Fails global accessibility benchmarks: WCAG 2.1 AA, US ADA Title III, and European Accessibility Act (EAA 2025).`,
				suggestedFix:
					'Provide concise, descriptive Alt text for each image describing its visual content.',
			})
		}

		// 1.3. Structural Hierarchy (H2 Headings)
		if (headings.length < 2) {
			score -= 20
			actionableFixes.push({
				id: 'h2-structure-missing',
				category: 'blocker',
				severity: 'critical',
				title: 'Missing Content Hierarchy (H2 Headings)',
				message:
					'The article contains fewer than 2 subheadings. Search engine web crawlers and screen readers rely on H2 tags to parse document sections.',
				suggestedFix:
					'Organize your narrative with at least 2 to 4 descriptive H2 section headings.',
			})
		}

		/* =========================================================================
		   2. SEARCH INTENT & TIME-TO-VALUE (Speed to Answer)
		========================================================================= */
		const firstParagraph = normalParagraphs[0]
		let timeToValueRating = 'Fast (Direct Answer Delivered)'

		if (firstParagraph) {
			const fluffIntroRegex =
				/\b(in today'?s|in the modern era|in our fast-paced|as we all know|when it comes to|it is important to note|throughout history|in this day and age|let'?s be honest|everybody knows)\b/i
			if (fluffIntroRegex.test(firstParagraph.text)) {
				score -= 10
				timeToValueRating = 'Slow (Cliché Opening Detected)'
				actionableFixes.push({
					id: 'slow-time-to-value',
					category: 'geo',
					severity: 'warning',
					title: 'Slow Time-to-Value: Generic Opening Fluff',
					message:
						'The opening paragraph begins with generic filler. US readers drop off within 3 seconds if the core answer or thesis is delayed.',
					blockKey: firstParagraph._key,
					quote: firstParagraph.text.slice(0, 100) + '...',
					suggestedFix:
						'Remove introductory throat-clearing and state the definitive conclusion or recommendation within the first 60 words.',
				})
			}
		}

		/* =========================================================================
		   3. INFORMATION GAIN & REGULATORY / TESTING PROOF
		========================================================================= */
		let informationGainRating = 'High (Original Data & Testing Proof)'
		const hasCurrency = /\$|€|£|¥|₫|\bUSD\b|\bEUR\b|\bGBP\b/i.test(
			fullArticleText,
		)
		const hasRegulatoryStandards =
			/\b(FDA|FTC|EPA|CPSC|ASTM|ANSI|UL|USDA|ISO|CE|UKCA|REACH|RoHS|GMP|WHO)\b/.test(
				fullArticleText,
			)
		const hasOriginalTesting =
			/\b(we tested|in our testing|our benchmark|we measured|after \d+ (?:days|weeks|months)|hands-on experience|lab results|our verdict)\b/i.test(
				fullArticleText,
			)

		if (!hasOriginalTesting && !hasRegulatoryStandards) {
			score -= 10
			informationGainRating = 'Moderate (Lacks First-Hand Proof)'
			actionableFixes.push({
				id: 'low-information-gain',
				category: 'eeat',
				severity: 'warning',
				title:
					'Information Gain Deficiency: Missing First-Hand Experience or Standards',
				message:
					'Google Helpful Content & global search engines penalize generic synthesis. No first-hand testing phrases ("we measured", "after 30 days") or recognized standards (ISO, CE, FDA, ASTM) were detected.',
				suggestedFix:
					'Incorporate direct experimental findings, benchmark metrics, or recognized industry standard references.',
			})
		}

		/* =========================================================================
		   4. E-E-A-T & CLAIM-TO-CITATION MAPPING (Fact Verification)
		========================================================================= */
		const statClaimRegex =
			/\b(\d+(?:\.\d+)?%|\b\d+(?:,\d{3})+\b|\b\d+\s*(?:million|billion|trillion)\b|studies show|research proves|according to surveys|clinical trials show)\b/i

		normalParagraphs.forEach((p) => {
			if (statClaimRegex.test(p.text) && !p.hasLinks) {
				score -= 5
				const match = p.text.match(statClaimRegex)?.[0] || 'Statistical Claim'
				actionableFixes.push({
					id: `uncited-claim-${p._key}`,
					category: 'eeat',
					severity: 'warning',
					title: `Uncited Claim: "${match}" Without Hyperlink`,
					message:
						'Specific statistics or research assertions presented without an external authoritative citation link decrease E-E-A-T trustworthiness.',
					blockKey: p._key,
					quote: p.text.slice(0, 120) + '...',
					suggestedFix:
						'Add a verified hyperlink reference to the original source (e.g., .gov, .edu, Statista, or peer-reviewed journal).',
				})
			}
		})

		/* =========================================================================
		   5. GEO CITABILITY & QUOTABLE SNIPPET REWRITES (AI Overviews & Perplexity)
		========================================================================= */
		if (!keyTakeaways || keyTakeaways.length < 3) {
			score -= 15
			actionableFixes.push({
				id: 'geo-key-takeaways',
				category: 'geo',
				severity: 'warning',
				title: 'Missing Key Takeaways (TL;DR) for AI Engine Citability',
				message:
					'Google AI Overviews and Perplexity favor structured bulleted takeaways positioned above the fold. Provide 3–5 bullet points.',
				suggestedFix:
					'Populate the "Key Takeaways / TL;DR" field in the Content tab.',
			})
		}

		// Identify candidate paragraph under H2 for Quotable Rewrite
		const longDefParagraph = normalParagraphs.find(
			(p) => p.text.length > 250 && p.text.length < 600,
		)
		if (longDefParagraph) {
			const sentences = longDefParagraph.text.split(/(?<=[.!?])\s+/)
			if (sentences.length >= 2) {
				const conciseVersion = `${sentences[0]} ${sentences[1]}`
					.replace(
						/\b(basically|essentially|it should be noted that|in order to)\b/gi,
						'',
					)
					.replace(/\s+/g, ' ')
					.trim()

				quotableRewrites.push({
					blockKey: longDefParagraph._key,
					originalText: longDefParagraph.text,
					suggestedRewrite: conciseVersion,
					reason:
						'Condensed to standalone 45-word clarity. Formats directly as an answer snippet for Perplexity and ChatGPT Search citation.',
				})
			}
		}

		/* =========================================================================
		   6. US LINGUISTIC LOCALIZATION & "AI-ISM" FILTER (Clean Tone)
		========================================================================= */
		const detectedAiClichés: string[] = []
		AI_CLICHES.forEach((cliché) => {
			const regex = new RegExp(`\\b${cliché}\\b`, 'i')
			if (regex.test(fullArticleText)) {
				detectedAiClichés.push(cliché)
			}
		})

		if (detectedAiClichés.length > 0) {
			score -= Math.min(10, detectedAiClichés.length * 3)
			actionableFixes.push({
				id: 'ai-isms-detected',
				category: 'localization',
				severity: 'suggestion',
				title: `AI-ism Filter: ${detectedAiClichés.length} Cliché Buzzwords Found`,
				message: `Words commonly associated with automated AI generation detected: "${detectedAiClichés.slice(0, 4).join('", "')}". US editorial standards prefer plain, muscular prose.`,
				suggestedFix: `Replace or eliminate phrases like "${detectedAiClichés[0]}" with direct, concrete verbs.`,
			})
		}

		// UK Spelling check
		const detectedUkSpellings: Array<{ uk: string; us: string }> = []
		Object.entries(UK_TO_US_SPELLINGS).forEach(([uk, us]) => {
			const regex = new RegExp(`\\b${uk}\\b`, 'i')
			if (regex.test(fullArticleText)) {
				detectedUkSpellings.push({ uk, us })
			}
		})

		if (detectedUkSpellings.length > 0) {
			score -= 5
			actionableFixes.push({
				id: 'uk-spelling-detected',
				category: 'localization',
				severity: 'suggestion',
				title: `US Localization: UK English Spellings Detected`,
				message: `Found non-US spelling conventions: ${detectedUkSpellings
					.slice(0, 3)
					.map((item) => `"${item.uk}" (Use "${item.us}")`)
					.join(', ')}.`,
				suggestedFix: `Update to standard US spelling conventions: ${detectedUkSpellings
					.slice(0, 3)
					.map((item) => `${item.uk} → ${item.us}`)
					.join(', ')}.`,
			})
		}

		/* =========================================================================
		   7. SERP METADATA (Multi-Script Pixel Width)
		========================================================================= */
		const effectiveTitle = title.trim()
		const titlePx = getGlobalPixelWidth(effectiveTitle, 'title')
		if (titlePx < 300 || titlePx > 630) {
			score -= 5
			actionableFixes.push({
				id: 'title-length',
				category: 'geo',
				severity: 'suggestion',
				title: 'Headline Length (Multi-Script Pixel Width)',
				message: `Title pixel width is ${titlePx}px (${effectiveTitle.length} chars). Optimal global SERP & GEO range across Latin, CJK, and accented scripts is 300px–580px (50–70 chars) to prevent mobile/desktop truncation.`,
			})
		}

		const effectiveDesc = metaDescription.trim()
		const descPx = getGlobalPixelWidth(effectiveDesc, 'description')
		if (descPx < 650 || descPx > 1180) {
			score -= 5
			actionableFixes.push({
				id: 'meta-desc-length',
				category: 'geo',
				severity: 'suggestion',
				title: 'Meta Description Length (Global SERP & GEO Width)',
				message: `Meta description width is ${descPx}px (${effectiveDesc.length} chars). Optimal range for Google SERP & GEO AI Overviews is 140–200 chars (650px–1180px).`,
			})
		}

		// Bound score between 20 and 99
		const finalScore = Math.max(20, Math.min(99, score))

		return NextResponse.json({
			success: true,
			overallScore: finalScore,
			aiCitabilityScore: finalScore,
			timeToValueRating,
			informationGainRating,
			eeatAssessment: actionableFixes.some((f) =>
				f.id.includes('uncited-claim'),
			)
				? 'Moderate (Uncited Statistics Detected)'
				: 'Strong (Documented Credentials & Citations)',
			croSuggestions: hasCro
				? 'Active CRO Modules Configured'
				: 'Unmonetized (Missing Product Embeds or CTA Banners)',
			actionableFixes,
			quotableRewrites,
			stats: {
				totalProseBlocks: proseBlocks.length,
				totalHeadings: headings.length,
				detectedAiClichésCount: detectedAiClichés.length,
				detectedUkSpellingsCount: detectedUkSpellings.length,
			},
		})
	} catch (error: any) {
		console.error('AI Editorial & GEO Audit API Error:', error)
		return NextResponse.json(
			{ error: error?.message || 'Failed to complete AI Editorial Audit.' },
			{ status: 500 },
		)
	}
}
