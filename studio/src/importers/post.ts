import { importResult, type ImportResult } from './result'
import type { useClient } from 'sanity'
type ImportClient = ReturnType<typeof useClient>
import { slug } from '@shared/content-utils'

function genKey(): string {
	return Math.random().toString(36).substring(2, 11)
}

interface ParsedBlock {
	_key: string
	_type: string
	[key: string]: any
}

interface MediaChecklistItem {
	slot: string
	guide?: string
	suggestedAlt: string
}

export async function parsePost(rawContent: string, client: ImportClient): Promise<ImportResult> {
	try {
		const body = { rawContent }
		const rawText = (body.rawContent || '').trim()

		if (!rawText) {
			return importResult(
				{ error: 'Please provide article content in JSON or Markdown format.' },
				{ status: 400 },
			)
		}

		// Fetch existing Categories, Authors & Products in Sanity for intelligent auto-linking
		const [existingCategories, existingPersons, existingProducts] = await Promise.all([
			client
				.fetch<Array<{ _id: string; title: string; slug?: string }>>(
					`*[_type == "blog.category"]{ _id, title, "slug": slug.current }`,
					{},
				)
				.catch(() => []),
			client
				.fetch<Array<{ _id: string; name: string }>>(
					`*[_type == "person"]{ _id, name }`,
					{},
				)
				.catch(() => []),
			client
				.fetch<Array<{ _id: string; title: string; slug?: string }>>(
					`*[_type == "product"]{ _id, title, "slug": metadata.slug.current }`,
					{},
				)
				.catch(() => []),
		])

		let title = ''
		let excerpt = ''
		let keyTakeaways: string[] = []
		let contentBlocks: ParsedBlock[] = []
		let mediaChecklist: MediaChecklistItem[] = []

		// Publishing Metadata State
		let rawDate = ''
		let rawCategory = ''
		let rawTags: string[] = []
		let rawAuthor = ''
		let rawReviewer = ''
		let rawFeatured: boolean | undefined = undefined
		let rawToc = ''
		let rawFtc = ''
		let rawComments: boolean | undefined = undefined

		// 1. Check if rawText contains a JSON block
		let parsedJson: any = null
		const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
		const candidateJson = jsonBlockMatch ? jsonBlockMatch[1].trim() : rawText

		try {
			const firstBrace = candidateJson.indexOf('{')
			if (firstBrace !== -1) {
				const lastBrace = candidateJson.lastIndexOf('}')
				if (lastBrace > firstBrace) {
					const cleanStr = candidateJson.substring(firstBrace, lastBrace + 1)
					const parsed = JSON.parse(cleanStr)
					if (parsed && typeof parsed === 'object' && (parsed.title || parsed.sections)) {
						parsedJson = parsed
					}
				}
			}
		} catch (e) {
			// Not valid JSON, will fallback to Markdown line-by-line parser
		}

		// ==================== PATH A: STRUCTURED JSON PARSER ====================
		if (parsedJson) {
			title = String(parsedJson.title || '').trim()
			excerpt = String(parsedJson.excerpt || '').trim()

			if (Array.isArray(parsedJson.keyTakeaways)) {
				keyTakeaways = parsedJson.keyTakeaways.map((k: any) => String(k).trim()).filter(Boolean)
			}

			rawDate = String(parsedJson.publishDate || parsedJson.date || '').trim()
			rawCategory = String(
				parsedJson.categoryName ||
					parsedJson.category ||
					(Array.isArray(parsedJson.categories) ? parsedJson.categories.join(', ') : ''),
			).trim()

			if (Array.isArray(parsedJson.tags)) {
				rawTags = parsedJson.tags.map((t: any) => String(t).trim()).filter(Boolean)
			}

			rawAuthor = String(parsedJson.authorName || parsedJson.author || '').trim()
			rawReviewer = String(parsedJson.reviewerName || parsedJson.reviewer || '').trim()
			if (typeof parsedJson.featured === 'boolean') rawFeatured = parsedJson.featured
			if (typeof parsedJson.isFeatured === 'boolean') rawFeatured = parsedJson.isFeatured

			rawToc = String(parsedJson.tableOfContents || parsedJson.toc || '').trim()
			rawFtc = String(parsedJson.ftcDisclosure || parsedJson.ftc || '').trim()
			if (typeof parsedJson.allowComments === 'boolean') rawComments = parsedJson.allowComments

			// Convert structured sections into PortableText
			if (Array.isArray(parsedJson.sections)) {
				for (const section of parsedJson.sections) {
					// Heading H2
					if (section.heading) {
						contentBlocks.push({
							_key: genKey(),
							_type: 'block',
							style: 'h2',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: String(section.heading).trim(),
								},
							],
						})
					}

					// Subheading H3
					if (section.subheading) {
						contentBlocks.push({
							_key: genKey(),
							_type: 'block',
							style: 'h3',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: String(section.subheading).trim(),
								},
							],
						})
					}

					// Body Paragraphs
					if (Array.isArray(section.paragraphs)) {
						for (const p of section.paragraphs) {
							const text = String(p).trim()
							if (text) {
								contentBlocks.push({
									_key: genKey(),
									_type: 'block',
									style: 'normal',
									children: [
										{
											_key: genKey(),
											_type: 'span',
											text,
										},
									],
								})
							}
						}
					} else if (typeof section.content === 'string' && section.content.trim()) {
						contentBlocks.push({
							_key: genKey(),
							_type: 'block',
							style: 'normal',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: section.content.trim(),
								},
							],
						})
					}

					// 1. Comprehensive Callout Box (5 styles: tip, info, warning, danger, quote)
					if (section.callout) {
						const tone = ['tip', 'info', 'warning', 'danger', 'quote'].includes(section.callout.type)
							? section.callout.type
							: 'info'
						const calloutTitle =
							section.callout.title ||
							(tone === 'tip'
								? 'Pro Tip'
								: tone === 'warning'
									? 'Important Warning'
									: tone === 'danger'
										? 'Caution / Risk Notice'
										: tone === 'quote'
											? 'Key Takeaway'
											: 'Information')

						contentBlocks.push({
							_key: genKey(),
							_type: 'callout-box',
							type: tone,
							title: calloutTitle,
							content: [
								{
									_key: genKey(),
									_type: 'block',
									style: 'normal',
									children: [
										{
											_key: genKey(),
											_type: 'span',
											text: String(section.callout.text || section.callout.content || '').trim(),
										},
									],
								},
							],
						})
					} else {
						// Fallback legacy callouts (tip / warning / danger / info / quote)
						const legacyTone = section.tip
							? 'tip'
							: section.warning
								? 'warning'
								: section.danger
									? 'danger'
									: section.info
										? 'info'
										: section.quote
											? 'quote'
											: null

						if (legacyTone) {
							const text = String(
								section[legacyTone] ||
								(legacyTone === 'tip' ? section.tip : section.warning),
							).trim()

							contentBlocks.push({
								_key: genKey(),
								_type: 'callout-box',
								type: legacyTone,
								title:
									legacyTone === 'tip'
										? 'Pro Tip'
										: legacyTone === 'warning'
											? 'Important Warning'
											: legacyTone === 'danger'
												? 'Caution'
												: legacyTone === 'quote'
													? 'Key Takeaway'
													: 'Information',
								content: [
									{
										_key: genKey(),
										_type: 'block',
										style: 'normal',
										children: [
											{
												_key: genKey(),
												_type: 'span',
												text,
											},
										],
									},
								],
							})
						}
					}

					// 2. Advanced Comparison Table (Synced with newest UI features)
					if (section.table && Array.isArray(section.table.headers)) {
						const tableHeaders = section.table.headers.map((h: any) => String(h).trim())
						const tableRows = Array.isArray(section.table.rows)
							? section.table.rows.map((r: any) => ({
									_key: genKey(),
									cells: Array.isArray(r)
										? r.map((c: any) => String(c).trim())
										: Array.isArray(r.cells)
											? r.cells.map((c: any) => String(c).trim())
											: [],
								}))
							: []

						contentBlocks.push({
							_key: genKey(),
							_type: 'comparison-table',
							badge: section.table.badge ? String(section.table.badge).trim() : undefined,
							title: section.table.title ? String(section.table.title).trim() : 'Technical Benchmark Matrix',
							caption: section.table.caption ? String(section.table.caption).trim() : undefined,
							headers: tableHeaders,
							rows: tableRows,
							highlightedColumnIndex:
								typeof section.table.highlightedColumnIndex === 'number'
									? section.table.highlightedColumnIndex
									: 1,
							highlightBadge: section.table.highlightBadge ? String(section.table.highlightBadge).trim() : 'Recommended',
							tableStyle: ['card', 'bordered', 'minimal'].includes(section.table.tableStyle)
								? section.table.tableStyle
								: 'card',
							mobileLayout: ['sticky-column', 'cards', 'scroll'].includes(section.table.mobileLayout)
								? section.table.mobileLayout
								: 'sticky-column',
							rowDensity: ['compact', 'comfortable', 'spacious'].includes(section.table.rowDensity)
								? section.table.rowDensity
								: 'comfortable',
							headerAlignment: ['center', 'left'].includes(section.table.headerAlignment)
								? section.table.headerAlignment
								: 'left',
							footnote: section.table.footnote ? String(section.table.footnote).trim() : undefined,
							ctaText: section.table.ctaText ? String(section.table.ctaText).trim() : undefined,
							ctaLink: section.table.ctaLink ? String(section.table.ctaLink).trim() : undefined,
							ctaStyle: ['primary', 'secondary', 'outline'].includes(section.table.ctaStyle)
								? section.table.ctaStyle
								: 'primary',
							ctaSubtext: section.table.ctaSubtext ? String(section.table.ctaSubtext).trim() : undefined,
						})
					}

					// 3. E-Commerce Product Embed (Auto-links to existing Sanity catalog)
					const rawProduct = section.productEmbed || section.product
					if (rawProduct) {
						const searchName = String(
							typeof rawProduct === 'string'
								? rawProduct
								: rawProduct.productName || rawProduct.title || rawProduct.name || '',
						).toLowerCase().trim()

						let matched = existingProducts.find((p) =>
							p.title.toLowerCase().includes(searchName) || (p.slug && p.slug.toLowerCase().includes(searchName)),
						)

						// Fallback: use first catalog product if no exact match found
						if (!matched && existingProducts.length > 0) {
							matched = existingProducts[0]
						}

						if (matched) {
							contentBlocks.push({
								_key: genKey(),
								_type: 'product-embed',
								product: { _type: 'reference', _ref: matched._id },
								layout: ['card', 'banner', 'minimal'].includes(rawProduct.layout)
									? rawProduct.layout
									: 'card',
								customBadge: rawProduct.customBadge ? String(rawProduct.customBadge).trim() : undefined,
								customReviewSnippet: rawProduct.customReviewSnippet ? String(rawProduct.customReviewSnippet).trim() : undefined,
							})
						}
					}

					// 4. CTA Conversion Banner
					const rawCta = section.ctaBanner || section.cta
					if (rawCta && rawCta.title) {
						const btnUrl = String(rawCta.buttonUrl || rawCta.buttonLink || rawCta.url || '').trim()
						contentBlocks.push({
							_key: genKey(),
							_type: 'cta-banner',
							badge: rawCta.badge ? String(rawCta.badge).trim() : undefined,
							title: String(rawCta.title).trim(),
							description: rawCta.description ? String(rawCta.description).trim() : undefined,
							buttonText: rawCta.buttonText ? String(rawCta.buttonText).trim() : 'Contact Us',
							buttonLink: btnUrl
								? {
										_type: 'link',
										type: btnUrl.startsWith('http') ? 'external' : 'internal',
										external: btnUrl.startsWith('http') ? btnUrl : undefined,
									}
								: undefined,
							style: ['dark', 'light', 'accent'].includes(rawCta.style) ? rawCta.style : 'dark',
						})
					}

					// 5. Technical Video Embed (16:9, YouTube / Vimeo)
					const rawVideo = section.videoEmbed || section.video
					if (rawVideo && rawVideo.url) {
						contentBlocks.push({
							_key: genKey(),
							_type: 'video-embed',
							url: String(rawVideo.url).trim(),
							title: String(rawVideo.title || section.heading || 'Technical Demonstration').trim(),
							caption: rawVideo.caption ? String(rawVideo.caption).trim() : undefined,
							aspectRatio: ['16:9', '4:3', '1:1', '9:16'].includes(rawVideo.aspectRatio)
								? rawVideo.aspectRatio
								: '16:9',
						})
					}

					// 6. Image Gallery / Showcase
					const rawGallery = section.imageGallery || section.gallery
					if (rawGallery && Array.isArray(rawGallery.images)) {
						contentBlocks.push({
							_key: genKey(),
							_type: 'image-gallery',
							title: rawGallery.title ? String(rawGallery.title).trim() : undefined,
							layout: ['grid-2', 'grid-3', 'slider'].includes(rawGallery.layout)
								? rawGallery.layout
								: 'grid-2',
							images: rawGallery.images.map((img: any) => ({
								_key: genKey(),
								_type: 'image',
								alt: String(img.alt || title || 'Gallery image').trim(),
								caption: img.caption ? String(img.caption).trim() : undefined,
							})),
						})
					}

					// 7. Technical Code Block
					if (section.code) {
						const isObject = typeof section.code === 'object'
						contentBlocks.push({
							_key: genKey(),
							_type: 'code',
							language: isObject ? section.code.language || 'typescript' : 'typescript',
							filename: isObject ? section.code.filename : undefined,
							code: isObject ? String(section.code.code || '') : String(section.code),
						})
					}

					// Image Placeholder inside section
					if (section.image) {
						const altText = String(section.image.alt || section.heading || 'Article illustration').trim()
						const captionText = String(section.image.caption || '').trim()

						const imgBlock: ParsedBlock = {
							_key: genKey(),
							_type: 'image',
							alt: altText,
						}
						if (captionText) {
							imgBlock.figcaption = [
								{
									_key: genKey(),
									_type: 'block',
									style: 'normal',
									children: [
										{
											_key: genKey(),
											_type: 'span',
											text: captionText,
										},
									],
								},
							]
						}
						contentBlocks.push(imgBlock)
					}
				}
			}

			// FAQ Accordion from JSON
			if (Array.isArray(parsedJson.faq) && parsedJson.faq.length > 0) {
				const faqItems = parsedJson.faq.map((f: any) => ({
					_key: genKey(),
					question: String(f.question || '').trim(),
					answer: [
						{
							_key: genKey(),
							_type: 'block',
							style: 'normal',
							children: [
								{
									_key: genKey(),
									_type: 'span',
									text: String(f.answer || '').trim() || 'Details to be confirmed.',
								},
							],
						},
					],
				}))

				contentBlocks.push({
					_key: genKey(),
					_type: 'faq-accordion',
					title: 'Frequently Asked Questions',
					items: faqItems,
				})
			}

			// Media Checklist from JSON
			if (Array.isArray(parsedJson.mediaChecklist)) {
				mediaChecklist = parsedJson.mediaChecklist.map((m: any) => ({
					slot: String(m.slot || 'Editorial Image').trim(),
					guide: String(m.guide || '').trim(),
					suggestedAlt: String(m.suggestedAlt || title).trim(),
				}))
			}
		}

		// ==================== PATH B: MARKDOWN / TEXT FALLBACK ====================
		if (!parsedJson) {
			const lines = rawText.split('\n')
			let inTakeaways = false
			let inFaq = false
			let currentFaqItems: Array<{ _key: string; question: string; answer: any[] }> = []

			// Table accumulator
			let inTable = false
			let tableHeaders: string[] = []
			let tableRows: Array<{ _key: string; cells: string[] }> = []

			const flushTable = () => {
				if (inTable && tableHeaders.length > 0) {
					contentBlocks.push({
						_key: genKey(),
						_type: 'comparison-table',
						title: 'Comparison & Specifications',
						headers: tableHeaders,
						rows: tableRows,
					})
					inTable = false
					tableHeaders = []
					tableRows = []
				}
			}

			const flushFaq = () => {
				if (inFaq && currentFaqItems.length > 0) {
					contentBlocks.push({
						_key: genKey(),
						_type: 'faq-accordion',
						title: 'Frequently Asked Questions',
						items: currentFaqItems,
					})
					inFaq = false
					currentFaqItems = []
				}
			}

			for (let i = 0; i < lines.length; i++) {
				const rawLine = lines[i]
				const line = rawLine.trim()

				if (!line) {
					flushTable()
					continue
				}

				if (line === '---') {
					continue
				}

				// Title & Metadata
				const titleKeyMatch = line.match(/^title:\s*(.+)$/i)
				if (titleKeyMatch) {
					if (!title) title = titleKeyMatch[1].trim()
					continue
				}

				const dateMatch = line.match(/^(?:date|publish\s*date|published):\s*(.+)$/i)
				if (dateMatch) {
					rawDate = dateMatch[1].trim()
					continue
				}

				const catMatch = line.match(/^(?:category|categories|topic):\s*(.+)$/i)
				if (catMatch) {
					rawCategory = catMatch[1].trim()
					continue
				}

				const tagsMatch = line.match(/^(?:tags|keywords):\s*(.+)$/i)
				if (tagsMatch) {
					const splitTags = tagsMatch[1]
						.replace(/[\[\]]/g, '')
						.split(/[,;]/)
						.map((t: string) => t.trim().replace(/^#/, ''))
						.filter(Boolean)
					rawTags.push(...splitTags)
					continue
				}

				const authorMatch = line.match(/^(?:author|byline|writer):\s*(.+)$/i)
				if (authorMatch) {
					rawAuthor = authorMatch[1].trim()
					continue
				}

				const reviewerMatch = line.match(/^(?:reviewer|reviewed\s*by|fact\s*checker):\s*(.+)$/i)
				if (reviewerMatch) {
					rawReviewer = reviewerMatch[1].trim()
					continue
				}

				const featMatch = line.match(/^(?:featured|isfeatured):\s*(true|false|yes|no|1|0)$/i)
				if (featMatch) {
					rawFeatured = ['true', 'yes', '1'].includes(featMatch[1].toLowerCase())
					continue
				}

				const tocMatch = line.match(/^(?:toc|table\s*of\s*contents):\s*(.+)$/i)
				if (tocMatch) {
					const val = tocMatch[1].toLowerCase().trim()
					if (['sticky-bar', 'left', 'right', 'hidden', 'default'].includes(val)) {
						rawToc = val
					}
					continue
				}

				const ftcMatch = line.match(/^(?:ftc|ftc\s*disclosure|disclosure):\s*(.+)$/i)
				if (ftcMatch) {
					const val = ftcMatch[1].toLowerCase().trim()
					if (['default', 'affiliate', 'sponsored', 'none'].includes(val)) {
						rawFtc = val
					}
					continue
				}

				const commentsMatch = line.match(/^(?:comments|allow\s*comments):\s*(true|false|yes|no|1|0)$/i)
				if (commentsMatch) {
					rawComments = ['true', 'yes', '1'].includes(commentsMatch[1].toLowerCase())
					continue
				}

				// Heading 1 Title
				if (!title) {
					if (line.startsWith('# ')) {
						title = line.replace(/^#\s+/, '').trim()
						continue
					} else if (!line.startsWith('> ') && !line.startsWith('## ') && !line.startsWith('![')) {
						title = line
						continue
					}
				}

				// Key Takeaways
				if (
					line.toLowerCase().includes('key takeaways') ||
					line.toLowerCase().includes('tl;dr') ||
					line.toLowerCase().includes('tldr')
				) {
					inTakeaways = true
					continue
				}

				if (inTakeaways) {
					if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
						const bullet = line.replace(/^[-*]|\d+\.\s*/, '').trim()
						if (bullet) keyTakeaways.push(bullet)
						continue
					} else if (line.startsWith('## ') || line.startsWith('### ')) {
						inTakeaways = false
					}
				}

				// FAQ
				if (
					line.toLowerCase().includes('frequently asked questions') ||
					line.toLowerCase().includes('## faq') ||
					line.toLowerCase().includes('q&a')
				) {
					flushTable()
					inFaq = true
					continue
				}

				if (inFaq) {
					if (line.startsWith('### ') || line.startsWith('Q:') || line.startsWith('**Q:')) {
						const question = line
							.replace(/^###\s+/, '')
							.replace(/^\*\*Q:\*\*\s*/i, '')
							.replace(/^Q:\s*/i, '')
							.trim()

						let answerText = ''
						while (
							i + 1 < lines.length &&
							!lines[i + 1].trim().startsWith('#') &&
							!lines[i + 1].trim().startsWith('Q:')
						) {
							i++
							const ansLine = lines[i].trim()
							if (ansLine) {
								answerText += (answerText ? ' ' : '') + ansLine.replace(/^\*\*A:\*\*\s*/i, '').replace(/^A:\s*/i, '')
							}
						}

						currentFaqItems.push({
							_key: genKey(),
							question,
							answer: [
								{
									_key: genKey(),
									_type: 'block',
									style: 'normal',
									children: [
										{
											_key: genKey(),
											_type: 'span',
											text: answerText || 'Information pending verification.',
										},
									],
								},
							],
						})
						continue
					}
				}

				// Table
				if (line.startsWith('|') && line.endsWith('|')) {
					const cells = line
						.split('|')
						.map((c: string) => c.trim())
						.filter(Boolean)

					if (cells.every((c: string) => /^[-:]+$/.test(c))) {
						continue
					}

					if (!inTable) {
						inTable = true
						tableHeaders = cells
					} else {
						tableRows.push({
							_key: genKey(),
							cells,
						})
					}
					continue
				} else {
					flushTable()
				}

				// Callout boxes
				if (line.startsWith('> [!TIP]') || line.startsWith('> **Tip:**') || line.startsWith('> Tip:')) {
					const tipText = line
						.replace(/^>\s*\[!TIP\]/i, '')
						.replace(/^>\s*\*\*Tip:\*\*/i, '')
						.replace(/^>\s*Tip:\s*/i, '')
						.trim()

					contentBlocks.push({
						_key: genKey(),
						_type: 'callout-box',
						type: 'tip',
						title: 'Pro Tip',
						content: [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: tipText || 'Keep this best practice in mind.',
									},
								],
							},
						],
					})
					continue
				}

				if (line.startsWith('> [!WARNING]') || line.startsWith('> **Warning:**')) {
					const warnText = line
						.replace(/^>\s*\[!WARNING\]/i, '')
						.replace(/^>\s*\*\*Warning:\*\*/i, '')
						.trim()

					contentBlocks.push({
						_key: genKey(),
						_type: 'callout-box',
						type: 'warning',
						title: 'Important Warning',
						content: [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: warnText || 'Exercise caution with this configuration.',
									},
								],
							},
						],
					})
					continue
				}

				if (line.startsWith('> [!INFO]') || line.startsWith('> **Info:**') || line.startsWith('> **Note:**')) {
					const infoText = line
						.replace(/^>\s*\[!INFO\]/i, '')
						.replace(/^>\s*\*\*(?:Info|Note):\*\*/i, '')
						.trim()

					contentBlocks.push({
						_key: genKey(),
						_type: 'callout-box',
						type: 'info',
						title: 'Information',
						content: [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: infoText || 'Relevant contextual note.',
									},
								],
							},
						],
					})
					continue
				}

				if (line.startsWith('> [!DANGER]') || line.startsWith('> [!CAUTION]') || line.startsWith('> **Danger:**')) {
					const dangerText = line
						.replace(/^>\s*\[!(?:DANGER|CAUTION)\]/i, '')
						.replace(/^>\s*\*\*Danger:\*\*/i, '')
						.trim()

					contentBlocks.push({
						_key: genKey(),
						_type: 'callout-box',
						type: 'danger',
						title: 'Critical Risk',
						content: [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: dangerText || 'Critical caution required.',
									},
								],
							},
						],
					})
					continue
				}

				if (line.startsWith('> [!QUOTE]') || line.startsWith('> **Key Takeaway:**')) {
					const quoteText = line
						.replace(/^>\s*\[!QUOTE\]/i, '')
						.replace(/^>\s*\*\*Key Takeaway:\*\*/i, '')
						.trim()

					contentBlocks.push({
						_key: genKey(),
						_type: 'callout-box',
						type: 'quote',
						title: 'Key Takeaway',
						content: [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: quoteText || 'Strategic insight.',
									},
								],
							},
						],
					})
					continue
				}

				// Images
				const imagePlaceholderMatch = line.match(/^\[IMAGE:\s*([^\]]+)\]$/i)
				const mdImageMatch = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)

				if (imagePlaceholderMatch || mdImageMatch) {
					flushTable()
					flushFaq()

					let altText = ''
					let captionText = ''
					let assetRef = ''

					if (imagePlaceholderMatch) {
						const rawInside = imagePlaceholderMatch[1].trim()
						const parts = rawInside.split('|').map((s: string) => s.trim())
						altText = parts[0] || 'Article image'
						captionText = parts[1] || ''
					} else if (mdImageMatch) {
						altText = mdImageMatch[1].trim() || 'Article image'
						const imgUrl = mdImageMatch[2].trim()

						const sanityCdnRegex = /cdn\.sanity\.io\/images\/[^\/]+\/[^\/]+\/([a-f0-9]+-[0-9]+x[0-9]+)\.([a-z0-9]+)/i
						const sanityMatch = imgUrl.match(sanityCdnRegex)
						if (sanityMatch) {
							assetRef = `image-${sanityMatch[1]}-${sanityMatch[2]}`
						}
					}

					const imageBlock: ParsedBlock = {
						_key: genKey(),
						_type: 'image',
						alt: altText,
					}

					if (assetRef) {
						imageBlock.asset = {
							_type: 'reference',
							_ref: assetRef,
						}
					}

					if (captionText) {
						imageBlock.figcaption = [
							{
								_key: genKey(),
								_type: 'block',
								style: 'normal',
								children: [
									{
										_key: genKey(),
										_type: 'span',
										text: captionText,
									},
								],
							},
						]
					}

					contentBlocks.push(imageBlock)
					mediaChecklist.push({
						slot: `Inline Image ${mediaChecklist.length + 1}`,
						guide: captionText || 'In-article visual illustration',
						suggestedAlt: altText,
					})
					continue
				}

				// Headings
				if (line.startsWith('## ')) {
					flushFaq()
					const headingText = line.replace(/^##\s+/, '').trim()
					contentBlocks.push({
						_key: genKey(),
						_type: 'block',
						style: 'h2',
						children: [
							{
								_key: genKey(),
								_type: 'span',
								text: headingText,
							},
						],
					})
					continue
				}

				if (line.startsWith('### ')) {
					flushFaq()
					const headingText = line.replace(/^###\s+/, '').trim()
					contentBlocks.push({
						_key: genKey(),
						_type: 'block',
						style: 'h3',
						children: [
							{
								_key: genKey(),
								_type: 'span',
								text: headingText,
							},
						],
					})
					continue
				}

				// Regular Paragraph
				if (!excerpt && !inTakeaways && !line.startsWith('#')) {
					excerpt = line.slice(0, 200)
				}

				contentBlocks.push({
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

			flushTable()
			flushFaq()
		}

		// Always ensure a Featured Cover Image checklist item exists
		if (!mediaChecklist.some((m) => m.slot.toLowerCase().includes('cover') || m.slot.toLowerCase().includes('featured'))) {
			mediaChecklist.unshift({
				slot: 'Featured Cover Image (Social & Hero)',
				guide: 'High-impact 16:9 or 1.91:1 ratio image for article hero banner and Google Discover.',
				suggestedAlt: `${title || 'Article'} - featured editorial cover image`,
			})
		}

		// Resolve Categories
		const targetCatNames = rawCategory
			? rawCategory
					.split(/[,;]/)
					.map((s: string) => s.trim().toLowerCase())
					.filter(Boolean)
			: []

		const matchedCatIds = new Set<string>()

		for (const catName of targetCatNames) {
			const matched = existingCategories.find((c) => {
				const titleLower = (c.title || '').toLowerCase()
				const slugLower = (c.slug || '').toLowerCase()
				return (
					titleLower === catName ||
					slugLower === catName ||
					titleLower.includes(catName) ||
					catName.includes(titleLower)
				)
			})
			if (matched) {
				matchedCatIds.add(matched._id.replace(/^drafts\./, ''))
			}
		}

		if (matchedCatIds.size === 0 && existingCategories.length > 0) {
			const autoMatch = existingCategories.find((c) => {
				const catTitle = (c.title || '').toLowerCase()
				if (!catTitle) return false
				return (
					title.toLowerCase().includes(catTitle) ||
					rawTags.some((tag) => tag.toLowerCase().includes(catTitle))
				)
			})
			if (autoMatch) {
				matchedCatIds.add(autoMatch._id.replace(/^drafts\./, ''))
			} else if (existingCategories[0]?._id) {
				matchedCatIds.add(existingCategories[0]._id.replace(/^drafts\./, ''))
			}
		}

		const categoriesRefs = Array.from(matchedCatIds).map((id) => ({
			_type: 'reference',
			_ref: id,
			_key: genKey(),
		}))

		// Resolve Author
		let authorRef: { _type: 'reference'; _ref: string } | null = null
		if (rawAuthor && existingPersons.length > 0) {
			const authorLower = rawAuthor.toLowerCase()
			const matched = existingPersons.find((p) => {
				const nameLower = (p.name || '').toLowerCase()
				return (
					nameLower === authorLower ||
					nameLower.includes(authorLower) ||
					authorLower.includes(nameLower)
				)
			})
			if (matched) {
				authorRef = { _type: 'reference', _ref: matched._id.replace(/^drafts\./, '') }
			}
		} else if (!rawAuthor && existingPersons.length === 1) {
			authorRef = { _type: 'reference', _ref: existingPersons[0]._id.replace(/^drafts\./, '') }
		}

		// Resolve Reviewer
		let reviewedByRef: { _type: 'reference'; _ref: string } | null = null
		let factCheckedDate: string | null = null
		if (rawReviewer && existingPersons.length > 0) {
			const reviewerLower = rawReviewer.toLowerCase()
			const matched = existingPersons.find((p) => {
				const nameLower = (p.name || '').toLowerCase()
				return (
					nameLower === reviewerLower ||
					nameLower.includes(reviewerLower) ||
					reviewerLower.includes(nameLower)
				)
			})
			if (matched) {
				reviewedByRef = { _type: 'reference', _ref: matched._id.replace(/^drafts\./, '') }
				factCheckedDate = new Date().toISOString().split('T')[0]
			}
		}

		// Resolve Publish Date
		let publishDate = new Date().toISOString().split('T')[0]
		if (rawDate) {
			const parsedTime = Date.parse(rawDate)
			if (!isNaN(parsedTime)) {
				publishDate = new Date(parsedTime).toISOString().split('T')[0]
			}
		}

		// Resolve FTC Disclosure
		let ftcDisclosure = rawFtc || 'default'
		const hasCommercial = contentBlocks.some((b) =>
			['comparison-table', 'product-embed', 'cta-banner', 'affiliateLink'].includes(b._type),
		)
		if (hasCommercial && (!rawFtc || rawFtc === 'none')) {
			ftcDisclosure = 'default'
		}

		// Resolve Table of Contents
		const headingsCount = contentBlocks.filter(
			(b) => b._type === 'block' && (b.style === 'h2' || b.style === 'h3'),
		).length
		const tableOfContents = rawToc || (headingsCount >= 2 ? 'sticky-bar' : 'default')

		const allowComments = typeof rawComments === 'boolean' ? rawComments : true
		const isFeatured = typeof rawFeatured === 'boolean' ? rawFeatured : false

		// Extract referenced products from product-embed blocks to also populate relatedProducts showcase
		const embeddedProductRefs = contentBlocks
			.filter((b) => b._type === 'product-embed' && b.product?._ref)
			.map((b) => ({ _type: 'reference', _ref: b.product._ref }))

		const publishing = {
			publishDate,
			tags: rawTags,
			categories: categoriesRefs,
			author: authorRef,
			reviewedBy: reviewedByRef,
			factCheckedDate,
			ftcDisclosure,
			tableOfContents,
			allowComments,
			isFeatured,
			relatedProducts: embeddedProductRefs.length > 0 ? embeddedProductRefs : undefined,
		}

		const publishingCount = [
			publishDate,
			rawTags.length > 0 ? true : null,
			categoriesRefs.length > 0 ? true : null,
			authorRef,
			reviewedByRef,
			tableOfContents,
			ftcDisclosure,
		].filter(Boolean).length

		const finalSlug = slug(title || 'imported-article')

		return importResult({
			success: true,
			title: title || 'Imported Article',
			excerpt: excerpt || '',
			slug: finalSlug,
			keyTakeaways,
			content: contentBlocks,
			publishing,
			mediaChecklist,
			stats: {
				blocksCount: contentBlocks.length,
				takeawaysCount: keyTakeaways.length,
				publishingMapped: publishingCount,
				matchedCategories: categoriesRefs.length,
				matchedAuthor: Boolean(authorRef),
				mediaChecklistCount: mediaChecklist.length,
			},
		})
	} catch (error: any) {
		console.error('Smart Blog Importer Error:', error)
		return importResult(
			{ error: error?.message || 'Failed to process article import.' },
			{ status: 500 },
		)
	}
}
