import { parseProduct } from '../../importers/product'
import guideUrl from '@guides/AGENT-GUIDE-PRODUCT.md?url'
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
import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
	FiPackage,
	FiZap,
} from 'react-icons/fi'

export const MASTER_PRODUCT_SYSTEM_PROMPT = `You are an International B2B Product Director & Global E-Commerce Copywriting Specialist (US/UK Market Standards).
Your task is to transform the provided product briefing into a single, strictly typed JSON object adhering 100% to this structure for automated Sanity CMS import:

MANDATORY RULES:
1. Return ONLY a single \`\`\`json ... \`\`\` block. Absolutely NO conversational filler, greetings, or text outside the JSON code block.
2. ATTACHED SPECIFICATION: Reference the attached "AGENT-GUIDE-PRODUCT.md" specification as your Ground Truth for all fields, conversion funnels, and pricing models.
3. Numeric fields (price, compareAtPrice, maxPrice, moq, stock, minQty, maxQty, unitPrice) MUST be raw floating-point numbers (e.g. 0.45, NOT "$0.45" or "0,45").
4. DO NOT generate placeholder or fabricated image URLs. Instead, populate "mediaChecklist" with professional photo shoot shot guides and Google SEO Alt texts so the catalog manager can upload real photography manually.
5. "compareAtPrice" (if set) must be greater than or equal to "price".
6. "conversionType" must be one of: "rfq", "consultation", "order_request".
7. "pricingModel" must be one of: "fixed", "range", "starting_at", "tiered", "quote_only".
8. Commercial CTAs & Disclaimers: Populate "priceNote" (Incoterms & freight disclaimers), "customCtaText" (high-converting action label), and "customCtaSubtext" (risk-reversal subtext).

JSON STRUCTURE SCHEMA:
{
  "title": "Full Commercial Product Name (50-80 chars)",
  "sku": "MODEL-SKU-2026",
  "categoryName": "Target Category Name",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "conversionType": "rfq",
  "pricingModel": "tiered",
  "currency": "USD",
  "price": 0.45,
  "compareAtPrice": 0.55,
  "priceNote": "Ex-works export price. International shipping, insurance and customs clearance quoted upon inquiry.",
  "customCtaText": "Request Official B2B Quotation",
  "customCtaSubtext": "No upfront payment required. Dedicated export specialist confirms delivery timeline within 12 hours.",
  "moq": 5000,
  "leadTime": "Dispatches within 5-7 business days worldwide",
  "shortPitch": "1-2 sentence compelling executive summary of the core commercial value proposition.",
  "keyBenefits": [
    {
      "title": "Core Commercial Advantage 1",
      "description": "1-2 sentence quantified commercial benefit."
    },
    {
      "title": "Operational Efficiency 2",
      "description": "Cost savings or logistics efficiency advantage."
    },
    {
      "title": "Compliance & Safety 3",
      "description": "Certified standard or structural durability."
    }
  ],
  "specs": [
    { "label": "Material", "value": "100% Natural Biodegradable Fiber & Food-Grade Additives" },
    { "label": "Dimensions", "value": "230 x 185 x 42 mm" },
    { "label": "Volume Capacity", "value": "850 ml (3 compartments)" },
    { "label": "Unit Weight", "value": "28g ± 2g" },
    { "label": "Thermal Tolerance", "value": "-20°C to 120°C (Microwave & Freezer Safe)" },
    { "label": "International Certifications", "value": "US FDA 21 CFR 176.170, BPI, EN 13432, LFGB" },
    { "label": "Master Carton Packaging", "value": "500 pcs / 5-ply reinforced export master carton" }
  ],
  "priceTiers": [
    { "minQty": 5000, "maxQty": 19999, "unitPrice": 0.45, "incoterm": "FOB", "badge": "Standard" },
    { "minQty": 20000, "maxQty": 49999, "unitPrice": 0.38, "incoterm": "FOB", "badge": "Most Popular" },
    { "minQty": 50000, "isCustomQuote": true, "incoterm": "CIF", "badge": "VIP Contract" }
  ],
  "storyDescription": [
    "## 1. Industry Context & Sustainable Transition\\nComprehensive paragraph analyzing environmental compliance and market dynamics...",
    "## 2. Engineered Thermal & Leak-Proof Performance\\nDetailed technical paragraph on structural integrity and food contact safety...",
    "## 3. Global Freight & Pallet Optimization\\nAnalysis on interlocking nested geometry reducing ocean shipping container volume..."
  ],
  "seo": {
    "metaTitle": "SEO Page Title (50-65 chars) | Brand Name",
    "metaDescription": "Concise meta description (150-160 chars) with strong commercial RFQ call-to-action."
  },
  "mediaChecklist": [
    {
      "slot": "Hero Storefront Image 1",
      "guide": "Front 45-degree angle studio shot on seamless white background",
      "suggestedAlt": "Commercial product front perspective on white background"
    },
    {
      "slot": "Material & Texture Detail 2",
      "guide": "Close-up macro capturing surface density and rim finish",
      "suggestedAlt": "Detail of natural fiber surface texture and rim finish"
    },
    {
      "slot": "Export Packaging & Pallet 3",
      "guide": "Nested stack configuration inside master carton with pallet label",
      "suggestedAlt": "Export master carton packaging and pallet configuration"
    }
  ]
}`

export const SmartProductImporterAction: DocumentActionComponent = (
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
	const [importedChecklist, setImportedChecklist] = useState<
		Array<{ slot: string; guide?: string; suggestedAlt: string }> | null
	>(null)

	// Only apply this action to the 'product' document type
	if (type !== 'product') {
		return null
	}

	const existingImagesCount =
		(draft?.images as any[])?.length || (published?.images as any[])?.length || 0

	const livePreview = useMemo(() => {
		if (!rawContent.trim()) return null
		try {
			const jsonBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
			const candidateJson = jsonBlockMatch
				? jsonBlockMatch[1].trim()
				: rawContent
			const firstBrace = candidateJson.indexOf('{')
			const lastBrace = candidateJson.lastIndexOf('}')
			if (firstBrace !== -1 && lastBrace > firstBrace) {
				const parsed = JSON.parse(
					candidateJson.substring(firstBrace, lastBrace + 1),
				)
				return {
					title: parsed.title,
					sku: parsed.sku,
					specsCount: Array.isArray(parsed.specs) ? parsed.specs.length : 0,
					tiersCount: Array.isArray(parsed.priceTiers) ? parsed.priceTiers.length : 0,
					benefitsCount: Array.isArray(parsed.keyBenefits) ? parsed.keyBenefits.length : 0,
				}
			}
		} catch (e) {
			// typing in progress or incomplete JSON
		}
		return null
	}, [rawContent])

	const handleDownloadGuide = () => {
		const link = document.createElement('a')
		link.href = guideUrl
		link.download = 'AGENT-GUIDE-PRODUCT.md'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		toast.push({
			status: 'info',
			title: 'AGENT-GUIDE-PRODUCT.md Downloaded',
			description:
				'Attach this specification into ChatGPT, Claude, or Gemini alongside the Master Prompt & brief.',
		})
	}

	const handleCopyPrompt = () => {
		navigator.clipboard.writeText(MASTER_PRODUCT_SYSTEM_PROMPT)
		toast.push({
			status: 'info',
			title: 'AI Prompt Copied to Clipboard',
			description:
				'Paste this prompt into ChatGPT, Claude, or Gemini along with your raw product specs.',
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
			const result = await parseProduct(rawContent, client)
			const data = result.data
			if (result.status >= 400) {
				throw new Error(data.error || 'Failed to parse product data.')
			}

			const product = data.product
			if (!product) {
				throw new Error('Invalid product payload received.')
			}

			setImportStep(2)

			// Apply patch to current Sanity document
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
				title: product.title,
				sku: product.sku,
				shortPitch: product.shortPitch || '',
				keyBenefits: product.keyBenefits || [],
				description: product.description || [],
				conversionType: product.conversionType || 'rfq',
				pricingModel: product.pricingModel || 'fixed',
				currency: product.currency || 'USD',
				price: product.price ?? 0,
				moq: product.moq ?? 1,
				leadTime: product.leadTime || 'Dispatches within 2-4 business days worldwide',
				stock: product.stock ?? 0,
				inStock: typeof product.inStock === 'boolean' ? product.inStock : true,
				priceTiers: product.priceTiers || [],
				specs: product.specs || [],
				metadata: product.metadata,
				tags: product.tags || [],
			}

			if (product.categories && product.categories.length > 0) {
				patchData.categories = product.categories
			}
			if (product.compareAtPrice !== undefined) {
				patchData.compareAtPrice = product.compareAtPrice
			}
			if (product.maxPrice !== undefined) {
				patchData.maxPrice = product.maxPrice
			}
			if (product.priceNote) {
				patchData.priceNote = product.priceNote
			}
			if (product.customCtaText) {
				patchData.customCtaText = product.customCtaText
			}
			if (product.customCtaSubtext) {
				patchData.customCtaSubtext = product.customCtaSubtext
			}

			setImportStep(3)

			// Safeguard: Intentionally omit `images` to preserve 100% of user-uploaded media!
			await client.patch(draftId).set(patchData).commit()

			setImportedChecklist(product.mediaChecklist || null)

			toast.push({
				status: 'success',
				title: 'Product Imported Successfully',
				description: `Populated ${data.stats?.specsCount || 0} specifications, ${data.stats?.benefitsCount || 0} benefits, and ${data.stats?.tiersCount || 0} price tiers. ${existingImagesCount} existing media items preserved.`,
			})
		} catch (err: any) {
			console.error('Product Import Error:', err)
			const errMsg = err?.message || 'Unable to update product document.'
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
		label: 'Smart Importer (JSON/Text)',
		icon: FiDownloadCloud,
		title:
			'1-Click populate all 3 product tabs from AI Agent (preserves uploaded media)',
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
					header: '1-Click Smart Product Importer',
					content: (
						<Box padding={4}>
							<Stack space={4}>
								{/* Safeguard & Architecture Notice Banner */}
								<Card tone="primary" padding={3} radius={2}>
									<Stack space={2}>
										<Flex align="center" gap={2}>
											<FiPackage />
											<Text size={1} weight="semibold">
												Intelligent 3-Tab Mapping & Media Safeguard
											</Text>
										</Flex>
										<Text size={1}>
											The engine automatically populates <strong>Overview & Content</strong>{' '}
											(Title, SKU, Pitch, Benefits, Story),{' '}
											<strong>Commercial & Sales</strong> (Pricing Model, MOQ, Lead Time, Tiers),{' '}
											and <strong>Specs & SEO</strong> (Technical Specs, Slug, Meta).
										</Text>
										<Flex align="center" gap={2}>
											<Badge tone={existingImagesCount > 0 ? 'positive' : 'caution'}>
												{existingImagesCount > 0
													? `Preserving ${existingImagesCount} existing media item(s) (Never overwritten)`
													: 'No images yet (Upload photography manually in Tab 1)'}
											</Badge>
										</Flex>
									</Stack>
								</Card>

								{/* Animated Processing State HUD */}
								<AnimatePresence>
									{isImporting && (
										<SmartImportProcessingHud
											currentStep={importStep}
											entityName="Product Specifications"
											stepLabels={[
												'1. Validate JSON',
												'2. Map Specs & Tiers',
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
											title="Suggested Photography & Ready-to-Use SEO Alt Texts"
											subtitle="Product data populated successfully. Head to Tab 1 (Product Media), upload your photography, and copy the prepared Alt texts below:"
										/>
									)}
								</AnimatePresence>

								{/* Paste Area with Prominent Buttons */}
								<Stack space={2}>
									<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
										<Text size={1} weight="semibold">
											Paste JSON or Markdown from AI Agent *
										</Text>
										<Flex align="center" gap={2}>
											<Button
												icon={FiDownloadCloud}
												mode="ghost"
												tone="default"
												fontSize={1}
												padding={2}
												text="Download AGENT-GUIDE-PRODUCT.md"
												title="Download AGENT-GUIDE-PRODUCT.md specification to attach to ChatGPT/Claude"
												onClick={handleDownloadGuide}
											/>
											<Button
												icon={FiClipboard}
												mode="ghost"
												tone="primary"
												fontSize={1}
												padding={2}
												text="Copy AI System Prompt"
												onClick={handleCopyPrompt}
											/>
										</Flex>
									</Flex>

									{/* Instant Live Preview Badge */}
									{livePreview && (
										<Card tone="positive" padding={2} radius={2}>
											<Flex align="center" justify="space-between">
												<Flex align="center" gap={2}>
													<FiCheck size={14} />
													<Text size={1} weight="medium">
														{livePreview.title || 'Valid Product Payload'}
														{livePreview.sku ? ` (${livePreview.sku})` : ''}
													</Text>
												</Flex>
												<Badge tone="positive" fontSize={0}>
													{livePreview.specsCount} Specs • {livePreview.tiersCount} Price Tiers • {livePreview.benefitsCount} Highlights
												</Badge>
											</Flex>
										</Card>
									)}

									<TextArea
										rows={11}
										value={rawContent}
										onChange={(e) => setRawContent(e.currentTarget.value)}
										disabled={isImporting}
										placeholder={`{\n  "title": "Biodegradable Bagasse Food Tray 850ml",\n  "sku": "ECO-TRAY-850",\n  "categoryName": "Food Packaging",\n  "conversionType": "rfq",\n  "pricingModel": "tiered",\n  "currency": "USD",\n  "price": 0.45,\n  "moq": 5000,\n  "specs": [{ "label": "Material", "value": "100% Bagasse Fiber" }],\n  "priceTiers": [{ "minQty": 5000, "unitPrice": 0.45, "incoterm": "FOB" }]\n}`}
										style={{
											resize: 'vertical',
											fontFamily: 'monospace',
											fontSize: 13,
											opacity: isImporting ? 0.6 : 1,
											transition: 'opacity 0.2s ease',
										}}
									/>
									<Text size={0} muted>
										💡 1. Click &quot;Download AGENT-GUIDE-PRODUCT.md&quot; &amp; &quot;Copy AI System Prompt&quot;. 2. Attach file and paste prompt into ChatGPT / Claude. 3. Paste generated JSON here.
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
												? 'Parsing & Populating Product...'
												: importedChecklist
													? 'Re-import / Update'
													: 'Parse & Populate Product'
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
