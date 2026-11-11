import { NextResponse } from 'next/server'
import { slug } from '@/lib/utils'
import { client } from '@/sanity/lib/client'

function genKey(): string {
	return Math.random().toString(36).substring(2, 11)
}

interface RawProductInput {
	title?: string
	sku?: string
	categoryName?: string
	categories?: string[]
	tags?: string[]
	conversionType?: 'rfq' | 'consultation' | 'order_request'
	pricingModel?: 'fixed' | 'range' | 'starting_at' | 'tiered' | 'quote_only'
	currency?: string
	price?: number | string
	maxPrice?: number | string
	compareAtPrice?: number | string
	priceNote?: string
	customCtaText?: string
	customCtaSubtext?: string
	moq?: number | string
	leadTime?: string
	stock?: number | string
	shortPitch?: string
	keyBenefits?: Array<{ title?: string; description?: string } | string>
	specs?: Array<{ label?: string; value?: string } | { [key: string]: string }>
	priceTiers?: Array<{
		minQty?: number | string
		maxQty?: number | string
		unitPrice?: number | string
		incoterm?: string
		discountPercent?: number | string
		badge?: string
		isCustomQuote?: boolean
	}>
	storyDescription?: string[] | string
	seo?: {
		metaTitle?: string
		metaDescription?: string
		slug?: string
	}
	mediaChecklist?: Array<{
		slot?: string
		guide?: string
		suggestedAlt?: string
	}>
}

function parseNumber(val: any, fallback?: number): number | undefined {
	if (typeof val === 'number') return isNaN(val) ? fallback : val
	if (typeof val === 'string') {
		const cleaned = val.replace(/[^0-9.-]+/g, '')
		const num = parseFloat(cleaned)
		return isNaN(num) ? fallback : num
	}
	return fallback
}

function cleanString(val: any): string {
	if (!val) return ''
	return String(val).trim()
}

function convertMarkdownTextToPortableText(rawText: string | string[]) {
	const blocks: any[] = []
	const lines = Array.isArray(rawText)
		? rawText.join('\n\n').split('\n')
		: String(rawText || '').split('\n')

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		if (line.startsWith('## ')) {
			blocks.push({
				_key: genKey(),
				_type: 'block',
				style: 'h2',
				children: [
					{
						_key: genKey(),
						_type: 'span',
						text: line.replace(/^##\s+/, '').trim(),
					},
				],
			})
			continue
		}

		if (line.startsWith('### ')) {
			blocks.push({
				_key: genKey(),
				_type: 'block',
				style: 'h3',
				children: [
					{
						_key: genKey(),
						_type: 'span',
						text: line.replace(/^###\s+/, '').trim(),
					},
				],
			})
			continue
		}

		blocks.push({
			_key: genKey(),
			_type: 'block',
			style: 'normal',
			children: [
				{
					_key: genKey(),
					_type: 'span',
					text: line,
				},
			],
		})
	}

	return blocks
}

// Fallback regex parser if the user pasted Markdown instead of JSON
function parseMarkdownFallback(rawText: string): RawProductInput {
	const result: RawProductInput = {
		tags: [],
		keyBenefits: [],
		specs: [],
		priceTiers: [],
		mediaChecklist: [],
	}

	const lines = rawText.split('\n')
	let activeSection: 'none' | 'shortPitch' | 'benefits' | 'specs' | 'tiers' | 'story' = 'none'
	const storyLines: string[] = []
	const shortPitchLines: string[] = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue

		// Section headers
		if (/^shortpitch:?/i.test(line)) {
			activeSection = 'shortPitch'
			continue
		}
		if (/^keybenefits:?/i.test(line)) {
			activeSection = 'benefits'
			continue
		}
		if (/^(?:specifications|specs):?/i.test(line)) {
			activeSection = 'specs'
			continue
		}
		if (/^(?:pricetiers|tiered\s*pricing):?/i.test(line)) {
			activeSection = 'tiers'
			continue
		}
		if (/^(?:storydescription|story|description):?/i.test(line)) {
			activeSection = 'story'
			continue
		}

		// Direct Key-Value pairs
		const titleMatch = line.match(/^(?:#\s*title:?|#\s+|title:)\s*(.+)$/i)
		if (titleMatch && !result.title) {
			result.title = titleMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const skuMatch = line.match(/^sku:\s*(.+)$/i)
		if (skuMatch) {
			result.sku = skuMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const catMatch = line.match(/^(?:category|categoryname):\s*(.+)$/i)
		if (catMatch) {
			result.categoryName = catMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const tagsMatch = line.match(/^tags:\s*(.+)$/i)
		if (tagsMatch) {
			result.tags = tagsMatch[1]
				.replace(/[\[\]]/g, '')
				.split(/[,;]/)
				.map((t) => t.trim().replace(/^#/, ''))
				.filter(Boolean)
			activeSection = 'none'
			continue
		}

		const convMatch = line.match(/^conversiontype:\s*(.+)$/i)
		if (convMatch) {
			const c = convMatch[1].toLowerCase().trim()
			if (['rfq', 'consultation', 'order_request'].includes(c)) {
				result.conversionType = c as any
			}
			activeSection = 'none'
			continue
		}

		const modelMatch = line.match(/^pricingmodel:\s*(.+)$/i)
		if (modelMatch) {
			const m = modelMatch[1].toLowerCase().trim()
			if (['fixed', 'range', 'starting_at', 'tiered', 'quote_only'].includes(m)) {
				result.pricingModel = m as any
			}
			activeSection = 'none'
			continue
		}

		const priceMatch = line.match(/^price:\s*(.+)$/i)
		if (priceMatch) {
			result.price = parseNumber(priceMatch[1], 0)
			activeSection = 'none'
			continue
		}

		const comparePriceMatch = line.match(/^compareatprice:\s*(.+)$/i)
		if (comparePriceMatch) {
			result.compareAtPrice = parseNumber(comparePriceMatch[1])
			activeSection = 'none'
			continue
		}

		const priceNoteMatch = line.match(/^pricenote:\s*(.+)$/i)
		if (priceNoteMatch) {
			result.priceNote = priceNoteMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const customCtaMatch = line.match(/^customctatext:\s*(.+)$/i)
		if (customCtaMatch) {
			result.customCtaText = customCtaMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const customCtaSubMatch = line.match(/^customctasubtext:\s*(.+)$/i)
		if (customCtaSubMatch) {
			result.customCtaSubtext = customCtaSubMatch[1].trim()
			activeSection = 'none'
			continue
		}

		const moqMatch = line.match(/^moq:\s*(.+)$/i)
		if (moqMatch) {
			result.moq = parseNumber(moqMatch[1], 1)
			activeSection = 'none'
			continue
		}

		const leadMatch = line.match(/^leadtime:\s*(.+)$/i)
		if (leadMatch) {
			result.leadTime = leadMatch[1].trim()
			activeSection = 'none'
			continue
		}

		// Handle section items
		if (activeSection === 'shortPitch') {
			shortPitchLines.push(line)
		} else if (activeSection === 'benefits') {
			if (line.startsWith('- ') || line.startsWith('* ')) {
				const content = line.replace(/^[-*]\s*/, '').trim()
				const colonIdx = content.indexOf(':')
				if (colonIdx > 0) {
					result.keyBenefits?.push({
						title: content.slice(0, colonIdx).trim(),
						description: content.slice(colonIdx + 1).trim(),
					})
				} else {
					result.keyBenefits?.push({
						title: content,
						description: '',
					})
				}
			}
		} else if (activeSection === 'specs') {
			if (line.startsWith('- ') || line.startsWith('* ')) {
				const content = line.replace(/^[-*]\s*/, '').trim()
				const colonIdx = content.indexOf(':')
				if (colonIdx > 0) {
					result.specs?.push({
						label: content.slice(0, colonIdx).trim(),
						value: content.slice(colonIdx + 1).trim(),
					})
				}
			}
		} else if (activeSection === 'tiers') {
			if (line.startsWith('- ') || line.startsWith('* ')) {
				const content = line.replace(/^[-*]\s*/, '').trim()
				// Format: Min: 5000 | Max: 19999 | Price: 0.45 | Incoterm: FOB
				const parts = content.split('|').map((p) => p.trim())
				const tier: any = {}
				for (const part of parts) {
					const [k, v] = part.split(':').map((s) => s.trim())
					if (!k || !v) continue
					const keyLower = k.toLowerCase()
					if (keyLower.includes('min')) tier.minQty = parseNumber(v, 1)
					if (keyLower.includes('max')) tier.maxQty = parseNumber(v)
					if (keyLower.includes('price')) tier.unitPrice = parseNumber(v)
					if (keyLower.includes('incoterm')) tier.incoterm = v.toUpperCase()
					if (keyLower.includes('badge')) tier.badge = v
					if (keyLower.includes('customquote')) tier.isCustomQuote = v.toLowerCase() === 'true'
				}
				if (tier.minQty !== undefined) {
					result.priceTiers?.push(tier)
				}
			}
		} else if (activeSection === 'story') {
			storyLines.push(line)
		}
	}

	if (shortPitchLines.length > 0) {
		result.shortPitch = shortPitchLines.join(' ')
	}
	if (storyLines.length > 0) {
		result.storyDescription = storyLines
	}

	return result
}

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}))
		const rawText = cleanString(body.rawContent)

		if (!rawText) {
			return NextResponse.json(
				{ error: 'Please provide product JSON or Markdown content.' },
				{ status: 400 },
			)
		}

		// 1. Fetch available Product Categories from Sanity for auto-linking
		const existingCategories = await client
			.fetch<Array<{ _id: string; title: string; slug?: string }>>(
				`*[_type == "product.category"]{ _id, title, "slug": slug.current }`,
				{},
				{ cache: 'no-store' },
			)
			.catch(() => [])

		// 2. Parse payload: try JSON first, fallback to structured Markdown
		let parsedData: RawProductInput | RawProductInput[] | null = null

		// Check if JSON block exists
		const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
		const candidateJson = jsonBlockMatch ? jsonBlockMatch[1].trim() : rawText

		try {
			// Find JSON start and end
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
					const cleanJsonString = candidateJson.substring(jsonStart, jsonEnd + 1)
					parsedData = JSON.parse(cleanJsonString)
				}
			}
		} catch (e) {
			// JSON parse error, will fallback
		}

		if (!parsedData) {
			parsedData = parseMarkdownFallback(rawText)
		}

		const isBatch = Array.isArray(parsedData)
		const productsToProcess: RawProductInput[] = Array.isArray(parsedData)
			? (parsedData as RawProductInput[])
			: parsedData
				? [parsedData as RawProductInput]
				: []

		if (productsToProcess.length === 0 || !productsToProcess[0]) {
			return NextResponse.json(
				{ error: 'Failed to parse product data. Please check JSON or Markdown formatting.' },
				{ status: 400 },
			)
		}

		const results = productsToProcess.map((item: RawProductInput) => {
			const title = cleanString(item.title) || 'New Commercial Product'
			const generatedSlug = cleanString(item.seo?.slug) || slug(title || 'new-commercial-product')

			// SKU handling (Sanity Rule: required)
			let sku = cleanString(item.sku)
			if (!sku) {
				const slugSnippet = generatedSlug.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
				sku = `DF-${slugSnippet || 'PRD'}-${Math.floor(1000 + Math.random() * 9000)}`
			}

			// Category Matching
			const targetCategoryNames: string[] = []
			if (item.categoryName) {
				targetCategoryNames.push(item.categoryName.toLowerCase().trim())
			}
			if (Array.isArray(item.categories)) {
				item.categories.forEach((c: any) => targetCategoryNames.push(String(c).toLowerCase().trim()))
			}

			const matchedCatRefs: Array<{ _type: 'reference'; _ref: string; _key: string }> = []
			for (const catName of targetCategoryNames) {
				const matched = existingCategories.find((c) => {
					const t = (c.title || '').toLowerCase()
					const s = (c.slug || '').toLowerCase()
					return t === catName || s === catName || t.includes(catName) || catName.includes(t)
				})
				if (matched && !matchedCatRefs.some((r) => r._ref === matched._id.replace(/^drafts\./, ''))) {
					matchedCatRefs.push({
						_type: 'reference',
						_ref: matched._id.replace(/^drafts\./, ''),
						_key: genKey(),
					})
				}
			}

			// Fallback: If no category matched, match title or tags against category names
			if (matchedCatRefs.length === 0 && existingCategories.length > 0) {
				const autoMatch = existingCategories.find((c) => {
					const catTitle = (c.title || '').toLowerCase()
					if (!catTitle) return false
					return (
						title.toLowerCase().includes(catTitle) ||
						(item.tags || []).some((t: any) => String(t).toLowerCase().includes(catTitle))
					)
				})
				if (autoMatch) {
					matchedCatRefs.push({
						_type: 'reference',
						_ref: autoMatch._id.replace(/^drafts\./, ''),
						_key: genKey(),
					})
				}
			}

			// Commercial Matrix sanitization
			const price = parseNumber(item.price, 0) ?? 0
			let compareAtPrice = parseNumber(item.compareAtPrice)
			// Sanity validation rule: compareAtPrice must be >= price
			if (compareAtPrice !== undefined && compareAtPrice < price) {
				compareAtPrice = undefined
			}

			const maxPrice = parseNumber(item.maxPrice)
			const moq = Math.max(1, parseNumber(item.moq, 1) ?? 1)
			const stock = parseNumber(item.stock, 0) ?? 0
			const leadTime = cleanString(item.leadTime) || 'Dispatches within 2-4 business days worldwide'
			const currency = cleanString(item.currency).toUpperCase() || 'USD'
			const conversionType = ['rfq', 'consultation', 'order_request'].includes(cleanString(item.conversionType))
				? item.conversionType
				: 'rfq'
			const pricingModel = ['fixed', 'range', 'starting_at', 'tiered', 'quote_only'].includes(
				cleanString(item.pricingModel),
			)
				? item.pricingModel
				: 'fixed'

			// Price Tiers array
			const priceTiers = Array.isArray(item.priceTiers)
				? item.priceTiers.map((t: any) => {
						const minQty = Math.max(1, parseNumber(t.minQty, 1) ?? 1)
						const maxQty = parseNumber(t.maxQty)
						const unitPrice = parseNumber(t.unitPrice)
						const incoterm = ['FOB', 'EXW', 'CIF', 'DDP'].includes(cleanString(t.incoterm).toUpperCase())
							? cleanString(t.incoterm).toUpperCase()
							: 'FOB'
						return {
							_key: genKey(),
							_type: 'priceTier',
							minQty,
							...(maxQty !== undefined && maxQty > minQty ? { maxQty } : {}),
							...(unitPrice !== undefined ? { unitPrice } : {}),
							incoterm,
							...(t.badge ? { badge: cleanString(t.badge) } : {}),
							...(t.discountPercent ? { discountPercent: parseNumber(t.discountPercent) } : {}),
							isCustomQuote: Boolean(t.isCustomQuote),
						}
					})
				: []

			// Key Benefits array
			const keyBenefits = Array.isArray(item.keyBenefits)
				? item.keyBenefits
						.map((b: any) => {
							if (typeof b === 'string') {
								return {
									_key: genKey(),
									_type: 'benefit',
									title: b.trim(),
									description: '',
								}
							}
							return {
								_key: genKey(),
								_type: 'benefit',
								title: cleanString(b.title) || 'Product Feature',
								description: cleanString(b.description),
							}
						})
						.filter((b: any) => Boolean(b.title))
				: []

			// Specifications array
			const specs = Array.isArray(item.specs)
				? item.specs
						.map((s: any) => {
							if ('label' in s && 'value' in s) {
								return {
									_key: genKey(),
									_type: 'specItem',
									label: cleanString(s.label),
									value: cleanString(s.value),
								}
							}
							const keys = Object.keys(s)
							if (keys.length > 0) {
								return {
									_key: genKey(),
									_type: 'specItem',
									label: cleanString(keys[0]),
									value: cleanString((s as any)[keys[0]]),
								}
							}
							return null
						})
						.filter((s: any): s is { _key: string; _type: string; label: string; value: string } =>
							Boolean(s && s.label && s.value),
						)
				: []

			// Story Description (PortableText)
			const description = convertMarkdownTextToPortableText(item.storyDescription || '')

			// Metadata / SEO
			const metadata = {
				_type: 'metadata',
				title: cleanString(item.seo?.metaTitle) || title,
				description: cleanString(item.seo?.metaDescription) || cleanString(item.shortPitch),
				slug: {
					_type: 'slug',
					current: generatedSlug,
				},
			}

			// Media Checklist for editor guidance (user manual photo upload)
			const mediaChecklist = Array.isArray(item.mediaChecklist)
				? item.mediaChecklist.map((m: any) => ({
						slot: cleanString(m.slot) || 'Product Photography',
						guide: cleanString(m.guide),
						suggestedAlt: cleanString(m.suggestedAlt) || title,
					}))
				: [
						{
							slot: 'Hero Storefront Image 1',
							guide: 'High-resolution front or 45-degree angle studio photography on clean white background.',
							suggestedAlt: `${title} - primary storefront photography`,
						},
						{
							slot: 'Material & Texture Detail 2',
							guide: 'Macro close-up capturing surface density, texture, and structural finish quality.',
							suggestedAlt: `${title} - material texture and finish detail`,
						},
						{
							slot: 'Export Packaging & Logistics 3',
							guide: 'Nested stacking configuration inside master carton with pallet specifications.',
							suggestedAlt: `${title} - export packaging and pallet specifications`,
						},
					]

			return {
				title,
				sku,
				categories: matchedCatRefs,
				tags: Array.isArray(item.tags) ? item.tags.map(cleanString).filter(Boolean) : [],
				shortPitch: cleanString(item.shortPitch),
				keyBenefits,
				description,
				conversionType,
				pricingModel,
				currency,
				price,
				...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
				...(maxPrice !== undefined ? { maxPrice } : {}),
				...(item.priceNote ? { priceNote: cleanString(item.priceNote) } : {}),
				...(item.customCtaText ? { customCtaText: cleanString(item.customCtaText) } : {}),
				...(item.customCtaSubtext ? { customCtaSubtext: cleanString(item.customCtaSubtext) } : {}),
				priceTiers,
				inStock: true,
				stock,
				moq,
				leadTime,
				specs,
				metadata,
				mediaChecklist,
			}
		})

		return NextResponse.json({
			success: true,
			isBatch,
			count: results.length,
			product: results[0],
			products: results,
			stats: {
				matchedCategories: results[0].categories.length,
				specsCount: results[0].specs.length,
				benefitsCount: results[0].keyBenefits.length,
				tiersCount: results[0].priceTiers.length,
				storyBlocksCount: results[0].description.length,
				mediaChecklistCount: results[0].mediaChecklist.length,
			},
		})
	} catch (error: any) {
		console.error('Smart Product Importer Error:', error)
		return NextResponse.json(
			{ error: error?.message || 'Failed to process product import.' },
			{ status: 500 },
		)
	}
}
