import {
	useClient,
	type DocumentActionComponent,
	type DocumentActionProps,
} from 'sanity'
import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Stack,
	Text,
	TextArea,
	useToast,
} from '@sanity/ui'
import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
	SmartImportErrorBanner,
	SmartImportMediaChecklist,
	SmartImportProcessingHud,
	type ImportStepId,
} from '@/sanity/ui/smart-import-motion'
import {
	FiCamera,
	FiCheck,
	FiClipboard,
	FiCopy,
	FiDownloadCloud,
	FiFileText,
} from 'react-icons/fi'

export const MASTER_BLOG_SYSTEM_PROMPT = `You are an International Senior Content Strategist & Google E-E-A-T Editorial Specialist (US/UK Standards).
Your task is to transform the provided editorial briefing into a deeply researched, comprehensive B2B article. Output a single, strictly typed JSON object adhering 100% to this structure for automated 1-Click Sanity CMS import:

MANDATORY EDITORIAL RULES:
1. OUTPUT: Return ONLY a single \`\`\`json ... \`\`\` block. Absolutely NO conversational filler, greetings, or text outside the JSON code block.
2. TITLE: 50–70 characters (optimal SERP pixel width 300–580px), compelling, click-worthy, and search-intent aligned.
3. EXECUTIVE SAPO ("excerpt"): 150–200 characters summarizing core technical findings, commercial impact, and executive takeaways.
4. KEY TAKEAWAYS ("keyTakeaways"): 3–5 high-impact bullet points with quantified metrics or actionable findings (vital for Google AI Overviews and executive skimming).
5. RICH CONTENT BUILDER ("sections"): Construct authoritative narrative sections featuring structured headings (H2), comprehensive body paragraphs, and our full suite of 8 interactive embed blocks:
   - "callout": Supports 5 tone styles ("tip", "info", "warning", "danger", "quote") with "title" and "text".
   - "table": Enterprise comparison table with rich cell formatting ("✅ Supported", "❌ Not available", "⚠️ Partial/Conditional"), highlightColumn, mobileLayout ("sticky-column" or "cards"), footnote, and CTA button.
   - "productEmbed": Interactive commerce card with "productName", layout ("card", "banner", or "minimal"), "customBadge", and "customReviewSnippet".
   - "ctaBanner": Conversion banner with "badge", "title", "description", "buttonText", "buttonUrl", and "style" ("dark", "light", "accent").
   - "videoEmbed": Technical proof video with "url", "title", "caption", and "aspectRatio" ("16:9").
   - "imageGallery": Visual proof gallery with "layout" ("grid-2", "grid-3") and image checklists.
   - "image": Single inline photo placeholder with descriptive WCAG 2.1 AA "alt" text and "caption".
6. FAQ ACCORDION ("faq"): 2–3 genuine technical or commercial questions with direct, authoritative answers (automatically ingested into Google FAQPage Schema).
7. E-E-A-T & LEGAL METADATA:
   - "authorName": Primary author name (auto-linked to Sanity person).
   - "reviewerName": Certified technical specialist who verified the data (maps to "Fact-checked by [Name]").
   - "publishDate": YYYY-MM-DD.
   - "tableOfContents": Always set to "sticky-bar".
   - "ftcDisclosure": Set to "default" (or "affiliate" / "sponsored" if commercial elements are present; NEVER "none" when recommending commercial products).
8. MEDIA CHECKLIST ("mediaChecklist"): Shot guide and pre-written Google Image SEO Alt texts for Featured Cover Image and in-article photos.

JSON STRUCTURE SCHEMA (WITH ADVANCED UI EMBEDS):
{
  "title": "Decarbonizing Global Supply Chains: The 2026 Sustainable Packaging Playbook",
  "publishDate": "2026-03-15",
  "categoryName": "Sustainable Solutions",
  "tags": ["esg-compliance", "packaging", "astm-d6400", "global-trade"],
  "authorName": "DeanFlow Editorial Board",
  "reviewerName": "Dr. Jonathan Vance",
  "featured": true,
  "tableOfContents": "sticky-bar",
  "ftcDisclosure": "default",
  "excerpt": "Comprehensive strategic report on transitioning enterprise supply chains to certified compostable packaging under tightening 2026 ESG and EPR mandates across North America and the EU.",
  "keyTakeaways": [
    "Reduces supply chain lifecycle carbon footprint by over 72% compared to petroleum polymers.",
    "Ensures full compliance with the 2026 Extended Producer Responsibility (EPR) packaging laws.",
    "ASTM D6400 and EN 13432 certifications are now mandatory pre-requisites for EU customs clearance.",
    "Optimized nested bio-molding designs yield up to 35% savings in international ocean freight and warehousing volume."
  ],
  "sections": [
    {
      "heading": "1. Regulatory Frameworks and Material Standards",
      "paragraphs": [
        "Next-generation bio-composites reinforced with natural sugarcane bagasse and modified cornstarch exhibit exceptional tensile strength and wide thermal operating resilience from -20°C up to 120°C.",
        "Unlike legacy molded pulp products that weakened when exposed to boiling oils, contemporary hydraulic thermoforming achieves an ultra-dense molecular matrix resistant to grease permeation without relying on toxic fluorinated substances (PFAS)."
      ],
      "callout": {
        "type": "tip",
        "title": "Customs Verification Pro Tip",
        "text": "When exporting to stringent European markets, always require suppliers to furnish third-party heavy metal test reports showing concentrations below 100 ppm to avoid customs holds."
      },
      "image": {
        "alt": "High-precision automated thermoforming production line for biodegradable meal trays",
        "caption": "Precision hydraulic bio-molding machinery at global manufacturing center"
      }
    },
    {
      "heading": "2. Comparative Performance Matrix: Bio-Packaging vs. Conventional Plastics",
      "paragraphs": [
        "A rigorous side-by-side operational comparison reveals clear sustainability advantages across all core compliance categories:"
      ],
      "table": {
        "badge": "Verified Technical Benchmarking",
        "title": "Technical Performance & Environmental Impact Benchmark",
        "caption": "Laboratory validation conducted under ASTM D6400 and EN 13432 certified test protocols.",
        "headers": ["Evaluation Metric", "DeanFlow Bio-Packaging", "Conventional Fossil Plastic"],
        "rows": [
          ["Degradation Lifecycle", "✅ Under 90 days in industrial compost", "❌ Exceeds 450 years in landfill"],
          ["Food Contact Safety", "✅ Compliant with US FDA 21 CFR 176.170", "⚠️ Risk of microplastic & phthalate migration"],
          ["Microwave & Oven Safety", "✅ 100% safe (-20°C to 120°C, Zero PFAS)", "⚠️ Prone to chemical off-gassing and warping"],
          ["Carbon Footprint (LCA)", "✅ 72% lower net CO2e emissions", "❌ High fossil fuel consumption and emissions"]
        ],
        "highlightedColumnIndex": 1,
        "highlightBadge": "DeanFlow Solution",
        "tableStyle": "card",
        "mobileLayout": "sticky-column",
        "footnote": "Certified lifecycle analysis independently verified by TÜV Rheinland (Report #TR-2026-PKG).",
        "ctaText": "Request Bulk Specification Datasheet",
        "ctaLink": "#rfq-form",
        "ctaStyle": "primary",
        "ctaSubtext": "Dispatched within 24 hours with complete lab certification dossier."
      }
    },
    {
      "heading": "3. Recommended Commercial Transition Solutions",
      "paragraphs": [
        "For enterprise food service and export retail brands, transitioning to certified molded fiber trays provides immediate compliance with minimum operational re-tooling."
      ],
      "productEmbed": {
        "productName": "3-Compartment Compostable Bagasse Meal Container",
        "layout": "banner",
        "customBadge": "Top Export Solution",
        "customReviewSnippet": "Tested across 500+ international catering shipments with zero leak incidents and full FDA compliance."
      },
      "ctaBanner": {
        "badge": "Procurement 2026",
        "title": "Schedule a Sustainable Supply Chain Audit",
        "description": "Our senior packaging engineers will analyze your current shipping SKUs and calculate exact carbon and freight volume savings.",
        "buttonText": "Book Engineering Consultation",
        "buttonUrl": "/contact",
        "style": "dark"
      }
    }
  ],
  "faq": [
    {
      "question": "What is the certified shelf life of bagasse packaging in standard warehousing?",
      "answer": "With proprietary dual-barrier bio-coatings, the packaging retains full moisture and oxygen barrier properties for 12 to 18 months under standard dry warehouse storage."
    },
    {
      "question": "Can custom brand logos be imprinted onto biodegradable packaging?",
      "answer": "Yes. We utilize natural soy-based inks that deliver sharp resolution and vibrant color reproduction without hindering industrial compostability timelines."
    }
  ],
  "mediaChecklist": [
    {
      "slot": "Featured Cover Image (Social & Hero 16:9)",
      "guide": "Wide shot of high-tech sustainable manufacturing line or eco facility",
      "suggestedAlt": "Automated sustainable packaging manufacturing facility meeting ASTM D6400 standards"
    },
    {
      "slot": "In-Article Illustration 1",
      "guide": "Close-up laboratory testing and quality verification",
      "suggestedAlt": "Laboratory verification of biodegradable food-contact packaging material"
    }
  ]
}`

export const SmartBlogImporterAction: DocumentActionComponent = (
	props: DocumentActionProps,
) => {
	const { id, type, draft, published } = props
	const client = useClient({ apiVersion: '2025-01-01' })
	const toast = useToast()

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isImporting, setIsImporting] = useState(false)
	const [importStep, setImportStep] = useState<ImportStepId>(1)
	const [importError, setImportError] = useState<string | null>(null)
	const [rawContent, setRawContent] = useState('')
	const [importedChecklist, setImportedChecklist] = useState<Array<{
		slot: string
		guide?: string
		suggestedAlt: string
	}> | null>(null)

	// Only apply this action to the 'blog.post' document type
	if (type !== 'blog.post') {
		return null
	}

	const existingMetaImage =
		(draft?.metadata as any)?.image || (published?.metadata as any)?.image
	const hasCoverImage = Boolean(existingMetaImage)

	const handleDownloadGuide = () => {
		const link = document.createElement('a')
		link.href = '/api/sanity/guide-articles'
		link.download = 'AGENT-GUIDE-ARTICLES.md'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		toast.push({
			status: 'info',
			title: 'AGENT-GUIDE-ARTICLES.md Downloaded',
			description:
				'Attach this file into ChatGPT, Claude, or Gemini alongside the System Prompt & brief.',
		})
	}

	const handleCopyPrompt = () => {
		navigator.clipboard.writeText(MASTER_BLOG_SYSTEM_PROMPT)
		toast.push({
			status: 'info',
			title: 'AI Prompt Copied to Clipboard',
			description:
				'Paste this prompt into ChatGPT, Claude, or Gemini along with your raw article topic.',
		})
	}

	const handleCopyText = (text: string, label: string) => {
		navigator.clipboard.writeText(text)
		toast.push({
			status: 'info',
			title: 'Copied to Clipboard!',
			description: `Copied ${label}.`,
		})
	}

	const handleImport = async () => {
		if (!rawContent.trim()) {
			toast.push({
				status: 'warning',
				title: 'Content Required',
				description:
					'Please paste structured JSON or Markdown generated by the AI Agent.',
			})
			return
		}

		setIsImporting(true)
		setImportStep(1)
		setImportError(null)

		try {
			const res = await fetch('/api/sanity/import-post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rawContent }),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.error || 'Failed to parse article structure.')
			}

			setImportStep(2)

			// Apply patch to the current Sanity document
			const draftId = id.startsWith('drafts.') ? id : `drafts.${id}`

			// Ensure draft document exists in Sanity Content Lake before patching
			const { _rev, _createdAt, _updatedAt, ...cleanPublishedDoc } =
				(published as any) || {}
			await client.createIfNotExists({
				...cleanPublishedDoc,
				_id: draftId,
				_type: type,
			})

			const patchData: Record<string, any> = {
				title: data.title,
				excerpt: data.excerpt,
				keyTakeaways: data.keyTakeaways || [],
				content: data.content || [],
				metadata: {
					title: data.title,
					description: data.excerpt,
					slug: { _type: 'slug', current: data.slug },
					// Safeguard: Preserve existing featured/social image if present
					...(existingMetaImage ? { image: existingMetaImage } : {}),
				},
			}

			// Dynamically set Publishing & Editorial settings
			if (data.publishing) {
				if (data.publishing.publishDate) {
					patchData.publishDate = data.publishing.publishDate
				}
				if (data.publishing.tags?.length) {
					patchData.tags = data.publishing.tags
				}
				if (data.publishing.categories?.length) {
					patchData.categories = data.publishing.categories
				}
				if (data.publishing.author) {
					patchData.author = data.publishing.author
				}
				if (data.publishing.reviewedBy) {
					patchData.reviewedBy = data.publishing.reviewedBy
				}
				if (data.publishing.factCheckedDate) {
					patchData.factCheckedDate = data.publishing.factCheckedDate
				}
				if (data.publishing.ftcDisclosure) {
					patchData.ftcDisclosure = data.publishing.ftcDisclosure
				}
				if (data.publishing.tableOfContents) {
					patchData.tableOfContents = data.publishing.tableOfContents
				}
				if (typeof data.publishing.allowComments === 'boolean') {
					patchData.allowComments = data.publishing.allowComments
				}
				if (typeof data.publishing.isFeatured === 'boolean') {
					patchData.isFeatured = data.publishing.isFeatured
				}
				if (data.publishing.relatedProducts?.length) {
					patchData.relatedProducts = data.publishing.relatedProducts
				}
			}

			setImportStep(3)

			await client.patch(draftId).set(patchData).commit()

			setImportedChecklist(data.mediaChecklist || null)

			toast.push({
				status: 'success',
				title: 'Article Imported Successfully',
				description: `Parsed ${data.stats?.blocksCount || 0} blocks, ${data.stats?.takeawaysCount || 0} key takeaways, and configured ${data.stats?.publishingMapped || 0} publishing settings.`,
			})
		} catch (err: any) {
			console.error('Blog Import error:', err)
			const errMsg = err?.message || 'Failed to populate article content.'
			setImportError(errMsg)
			toast.push({
				status: 'error',
				title: 'Import Failed',
				description: errMsg,
			})
		} finally {
			setIsImporting(false)
		}
	}

	return {
		label: 'Smart Importer (JSON/Markdown)',
		icon: FiDownloadCloud,
		title:
			'1-Click populate all 3 article tabs from AI Agent (preserves uploaded media)',
		onHandle: () => {
			setIsDialogOpen(true)
			setImportedChecklist(null)
			setImportError(null)
		},
		dialog: isDialogOpen
			? {
					type: 'dialog',
					onClose: () => {
						setIsDialogOpen(false)
						setImportedChecklist(null)
						setImportError(null)
					},
					header: '1-Click Smart Blog Importer',
					content: (
						<Box padding={4}>
							<Stack space={4}>
								{/* Safeguard & Architecture Notice Banner */}
								<Card tone="primary" padding={3} radius={2}>
									<Stack space={2}>
										<Flex align="center" gap={2}>
											<FiFileText />
											<Text size={1} weight="semibold">
												Intelligent Hybrid Editorial Parser (JSON & Markdown)
											</Text>
										</Flex>
										<Text size={1}>
											The engine automatically populates{' '}
											<strong>Story & Content</strong> (Title, Excerpt, TL;DR,
											PortableText, FAQ, Tables),{' '}
											<strong>Publishing & E-E-A-T</strong> (Author, Reviewer,
											Category, Date, FTC), and <strong>SEO & Metadata</strong>.
										</Text>
										<Flex align="center" gap={2}>
											<Badge tone={hasCoverImage ? 'positive' : 'caution'}>
												{hasCoverImage
													? 'Preserving existing Cover Image (Never overwritten)'
													: 'No Cover Image yet (Upload in Tab 3 SEO or in-article photos)'}
											</Badge>
										</Flex>
									</Stack>
								</Card>

								{/* Animated Processing State HUD */}
								<AnimatePresence>
									{isImporting && (
										<SmartImportProcessingHud
											currentStep={importStep}
											entityName="Editorial Article & E-E-A-T"
											stepLabels={[
												'1. Parse Editorial',
												'2. Structure Blocks',
												'3. Commit Lake',
											]}
										/>
									)}
								</AnimatePresence>

								{/* Animated Error Banner */}
								<AnimatePresence>
									{importError && (
										<SmartImportErrorBanner
											error={importError}
											onDismiss={() => setImportError(null)}
										/>
									)}
								</AnimatePresence>

								{/* Animated Photography Guidance & SEO Alt Checklist */}
								<AnimatePresence>
									{importedChecklist && importedChecklist.length > 0 && (
										<SmartImportMediaChecklist
											items={importedChecklist}
											onCopyText={handleCopyText}
											title="Suggested Editorial Photography & Ready-to-Use SEO Alt Texts"
											subtitle="Article structure populated successfully. Upload your media in Tab 3 or in-article embeds, and use the prepared Alt texts below:"
										/>
									)}
								</AnimatePresence>

								{/* Input Area with Download Guide and Copy Prompt Buttons */}
								<Stack space={2}>
									<Flex
										justify="space-between"
										align="center"
										wrap="wrap"
										gap={2}
									>
										<Text size={1} weight="semibold">
											Paste JSON or Markdown from AI Agent *
										</Text>
										<Flex align="center" gap={2}>
											<Button
												icon={FiClipboard}
												mode="ghost"
												tone="primary"
												fontSize={1}
												padding={2}
												text="Copy AI Master Prompt"
												title="Copy full Master System Prompt to paste into ChatGPT, Claude, or Gemini"
												onClick={handleCopyPrompt}
											/>
											<Button
												icon={FiDownloadCloud}
												mode="ghost"
												tone="default"
												fontSize={1}
												padding={2}
												text="Download AGENT-GUIDE-ARTICLES.md (Optional)"
												title="Download AGENT-GUIDE-ARTICLES.md specification (Optional for deep analysis)"
												onClick={handleDownloadGuide}
											/>
										</Flex>
									</Flex>
									<TextArea
										rows={12}
										value={rawContent}
										onChange={(e) => setRawContent(e.currentTarget.value)}
										disabled={isImporting}
										placeholder={`{\n  "title": "Decarbonizing Global Supply Chains: The 2026 Playbook",\n  "categoryName": "Sustainable Solutions",\n  "tags": ["esg", "packaging", "astm-d6400"],\n  "excerpt": "Comprehensive analysis on transitioning to bio-based packaging...",\n  "keyTakeaways": ["72% lifecycle carbon reduction", "Full EPR compliance for 2026"],\n  "sections": [\n    {\n      "heading": "1. Material Science and Compliance Standards",\n      "paragraphs": ["Next-generation bagasse composites withstand high temperatures..."],\n      "callout": {\n        "type": "tip",\n        "title": "Customs Verification",\n        "text": "Verify supplier test reports under ASTM D6400 before customs clearance."\n      }\n    }\n  ]\n}`}
										style={{
											resize: 'vertical',
											fontFamily: 'monospace',
											fontSize: 13,
											opacity: isImporting ? 0.6 : 1,
											transition: 'opacity 0.2s ease',
										}}
									/>
									<Text size={0} muted>
										💡 Quick Workflow: 1. Click &quot;Copy AI Master Prompt&quot; ➔ Paste into ChatGPT / Claude with your topic brief. 2. Paste generated JSON below and click Parse. (Optional: Click &quot;Download AGENT-GUIDE-ARTICLES.md&quot; to attach the full architectural specification).
									</Text>
								</Stack>

								{/* Action Buttons */}
								<Flex justify="flex-end" gap={2} marginTop={2}>
									<Button
										mode="ghost"
										text={importedChecklist ? 'Close' : 'Cancel'}
										onClick={() => {
											setIsDialogOpen(false)
											setImportedChecklist(null)
											setImportError(null)
										}}
										disabled={isImporting}
									/>
									<Button
										tone="primary"
										icon={FiCheck}
										text={
											isImporting
												? 'Parsing & Populating Article...'
												: importedChecklist
													? 'Re-import / Update'
													: 'Parse & Populate Article'
										}
										onClick={handleImport}
										disabled={isImporting || !rawContent.trim()}
									/>
								</Flex>
							</Stack>
						</Box>
					),
				}
			: null,
	}
}
