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
	SmartImportActionNotes,
	SmartImportErrorBanner,
	SmartImportMediaChecklist,
	SmartImportProcessingHud,
	type ImportStepId,
} from '@/sanity/ui/smart-import-motion'
import {
	FiArrowRight,
	FiCamera,
	FiCheck,
	FiCheckCircle,
	FiCheckSquare,
	FiClipboard,
	FiCopy,
	FiDownloadCloud,
	FiLayers,
	FiZap,
} from 'react-icons/fi'

const HOME_PAGE_ID =
	process.env.NEXT_PUBLIC_SANITY_HOME_PAGE_ID ||
	'7afa548f-8003-4d6e-9fb2-25a3eb2c51a4'

export const MASTER_PAGE_SYSTEM_PROMPT = `You are an International Landing Page Strategist & High-Conversion B2B Funnel Architect (US/UK Standards).
Your task is to transform the provided product/campaign briefing into a complete, high-converting Landing Page JSON structure by strictly referencing the attached "AGENT-GUIDE-PAGE.md" specification.

MANDATORY RULES:
1. Return ONLY a single \`\`\`json ... \`\`\` block. Zero conversational filler, intros, or markdown text outside the JSON block.
2. ATTACHED SPECIFICATION: Deeply study and reference the attached "AGENT-GUIDE-PAGE.md" file as your Ground Truth for all 23 dynamic modules, layout parameters, and allowed enum values.
3. MODULE SELECTION: From the 23-Module Catalog in AGENT-GUIDE-PAGE.md, intelligently select 5 TO 10 MODULES to construct an uninterrupted high-converting narrative (Hook -> Trust -> Proof -> Value -> Workflow -> Benchmark -> Risk Reversal -> Action -> Sticky CTA).
4. PAGE SETTINGS: Include "appearance" (colorScheme, backgroundType, headerMode, hideFooter, scrollReveal) and "seo" (metaTitle, metaDescription, noIndex).
5. AUTO-EMBED SEO ALT TEXT: For every module featuring visual assets ("hero.split", "hero-slider", "media-grid", "person-list", "card-list"), include "image": { "alt": "..." } with descriptive WCAG 2.2 AA compliant Alt text so editors never have to type Alt text manually.
6. COMPACT ACTION NOTES: Provide 3 to 5 clear manual finishing steps for the editor using the compact format: step + title + location (e.g. { "step": 1, "title": "Upload Primary Visual Asset (16:9)", "location": "Tab 1: Content -> Hero Split" }).

JSON STRUCTURE (PAGE SETTINGS + 5-10 MODULES + COMPACT NOTES):
{
  "title": "B2B Export Packaging OEM/ODM Solutions",
  "slug": "oem-export-packaging",
  "appearance": {
    "colorScheme": "light",
    "backgroundType": "default",
    "headerMode": "transparent",
    "hideFooter": false,
    "scrollReveal": "fade-up"
  },
  "seo": {
    "metaTitle": "Global B2B Compostable Packaging OEM & Export Solutions | Brand Name",
    "metaDescription": "Direct-from-factory sustainable packaging for international brands. FDA & EN 13432 certified. Fast RFQ turnaround in 12 hours.",
    "noIndex": false
  },
  "modules": [
    {
      "type": "hero.split",
      "tagline": "CERTIFIED INDUSTRIAL BIO-PACKAGING",
      "headline": "Direct-From-Factory Sustainable Packaging for Global Enterprise Brands",
      "subtext": "Replace single-use plastics with certified 100% biodegradable bagasse solutions engineered for high thermal tolerance, zero leakage, and full international customs compliance.",
      "mediaPosition": "right",
      "image": {
        "alt": "Automated cleanroom sustainable packaging thermoforming line with zero-defect optical scanners"
      },
      "primaryCta": { "label": "Request Official Quotation & Catalog", "link": "#rfq-form" },
      "secondaryCta": { "label": "Explore Technical Specifications", "link": "#specs-table" }
    },
    {
      "type": "logo-list",
      "headline": "Trusted by Over 500+ International Brands, Airlines & Retail Chains",
      "logoType": "default"
    },
    {
      "type": "stat-list",
      "badge": "Verified Operational Scale",
      "headline": "Proven Manufacturing Capacity & Global Export Reach",
      "columns": 4,
      "layout": "grid",
      "cardStyle": "card",
      "stats": [
        { "value": "50M+", "label": "Monthly Output Capacity", "iconPreset": "factory", "subtext": "High-volume automated hydraulic thermoforming" },
        { "value": "99.8%", "label": "On-Time Export Delivery", "iconPreset": "truck", "subtext": "Tracked across 35+ international container ports" },
        { "value": "-72%", "label": "Lifecycle Carbon Footprint", "iconPreset": "leaf", "subtext": "Compared to petroleum-derived polymer packaging" },
        { "value": "100%", "label": "Home Compostable", "iconPreset": "recycle", "subtext": "Naturally degrades within 90 days in compost" }
      ]
    },
    {
      "type": "card-list",
      "badge": "Enterprise Capabilities",
      "headline": "Engineered for Performance & Sustainability",
      "columns": 3,
      "desktopLayout": "grid",
      "cardStyle": "card",
      "cards": [
        { "badge": "High Heat Resilience", "title": "Oven & Microwave Safe (-20°C to 120°C)", "iconPreset": "zap", "description": "Engineered molecular density prevents chemical leaching or structural deformation." },
        { "badge": "Advanced Grease Barrier", "title": "Zero-Leak Food Contact Defense", "iconPreset": "shield", "description": "Proprietary bio-coating provides airtight grease and liquid resistance without toxic PFAS." },
        { "badge": "Logistics Optimized", "title": "Interlocking High-Density Stacking", "iconPreset": "truck", "description": "Tapered nesting geometry saves up to 35% in container volume, directly lowering freight charges." }
      ]
    },
    {
      "type": "step-list",
      "badge": "Fulfillment Workflow",
      "headline": "Seamless 4-Step Procurement Workflow",
      "layout": "split",
      "columns": 3,
      "showConnector": true,
      "steps": [
        { "step": "01", "title": "Technical CAD & Mold Tooling", "iconPreset": "cpu", "description": "Rapid 3D prototyping and custom hydraulic tooling engineered within 7-10 business days." },
        { "step": "02", "title": "Pilot Batch Testing & Lab Certification", "iconPreset": "fileText", "description": "Express physical sample kits dispatched for food-contact, drop-testing, and thermal stress verification." },
        { "step": "03", "title": "Cleanroom Mass Production", "iconPreset": "factory", "description": "High-capacity automated compression molding with inline optical defect scanning at 50M units/month." },
        { "step": "04", "title": "Palletized Container Shipping", "iconPreset": "truck", "description": "Reinforced 5-ply export master cartons stacked for maximum pallet payload with full customs documentation." }
      ]
    },
    {
      "type": "comparison-table",
      "title": "Technical Benchmarking: DeanFlow vs. Conventional Alternatives",
      "caption": "Demonstrated operational ROI, international compliance, and environmental lifecycle leadership.",
      "tableStyle": "card",
      "highlightedColumnIndex": 1,
      "highlightBadge": "DeanFlow Solution",
      "headers": ["Technical Criterion", "DeanFlow Bio-Packaging", "Conventional Alternatives"],
      "rows": [
        ["Compost Degradation Lifecycle", "Under 90 days into organic soil compost", "Exceeds 450 years in landfill"],
        ["Thermal Operating Range", "-20°C to 120°C continuous exposure", "Softens and warps above 70°C"],
        ["Food Safety Compliance", "US FDA 21 CFR 176.170 & German LFGB", "Risk of microplastic migration"],
        ["Chemical Safety (PFAS/BPA)", "100% Free from fluorinated substances", "Commonly present in coated boards"]
      ]
    },
    {
      "type": "compliance-vault",
      "headline": "Internationally Audited Manufacturing & Regulatory Accreditations",
      "subtitle": "Independently verified by leading global testing laboratories to ensure seamless customs clearance worldwide.",
      "vaultTheme": "dark",
      "headerAlignment": "center",
      "certificates": [
        { "title": "FDA 21 CFR 176.170", "issuer": "US Food & Drug Administration", "code": "FDA-GRAS-COMPLIANT", "description": "Certified food-contact safe for direct commercial presentation." },
        { "title": "ASTM D6400 & EN 13432", "issuer": "BPI / TÜV AUSTRIA", "code": "BPI-COMPOST-2026", "description": "Certified industrial and commercial compostability." },
        { "title": "ISO 9001:2015 & ISO 14001", "issuer": "SGS International", "code": "ISO-QA-EMS-SGS", "description": "Quality assurance and zero-discharge environmental compliance." }
      ]
    },
    {
      "type": "accordion-list",
      "badge": "Help & Guidance",
      "headline": "Frequently Asked Questions",
      "layout": "horizontal",
      "accordionStyle": "card",
      "faq": [
        {
          "question": "What is the Minimum Order Quantity (MOQ) for bespoke dimensions or custom embossing?",
          "badge": "Wholesale & MOQ",
          "iconPreset": "package",
          "answer": "Custom branded molds require a 25,000 unit production run, whereas stock unbranded items start at 5,000 units."
        },
        {
          "question": "What are your international freight terms and export ports?",
          "badge": "Logistics & Ocean Freight",
          "iconPreset": "truck",
          "answer": "We offer FOB direct from major Vietnam ports, as well as CIF, DDP, and Ex-Works depending on your logistics requirements."
        },
        {
          "question": "Are your manufacturing facilities audited for FDA and ASTM compliance?",
          "badge": "Certifications & Audits",
          "iconPreset": "fileCheck",
          "answer": "Yes, all production lines hold accredited FDA 21 CFR 176.170, ASTM D6400, and ISO 9001/14001 certifications."
        }
      ]
    },
    {
      "type": "lead-capture-form",
      "badge": "Express 12-Hour Turnaround",
      "headline": "Request Your Official Factory Quotation & Technical Dossier",
      "subtitle": "Submit your packaging dimensions and volume requirements. A dedicated export specialist will reply within 12 business hours.",
      "layout": "split",
      "bgStyle": "slate",
      "ctaText": "Request Official Quotation",
      "benefits": [
        "Instant factory direct pricing with zero middlemen markup",
        "Free physical sample kits dispatched express internationally",
        "Strict non-disclosure confidentiality protection"
      ]
    },
    {
      "type": "sticky-mobile-cta",
      "title": "Certified Sustainable Packaging OEM/ODM",
      "badge": "Save 30%",
      "price": "From $0.038 / unit",
      "ctaText": "Request Factory Quote",
      "ctaLink": "#rfq-form"
    }
  ],
  "manualActionNotes": [
    { "step": 1, "title": "Upload Primary Visual Asset (16:9)", "location": "Tab 1: Content -> Hero Split" },
    { "step": 2, "title": "Select 6+ Partner Logos", "location": "Tab 1: Content -> Logo Marquee" },
    { "step": 3, "title": "Verify Canvas Theme", "location": "Tab 2: Appearance" },
    { "step": 4, "title": "Attach Social Share Image", "location": "Tab 3: Metadata & SEO" }
  ]
}`

export const SmartPageImporterAction: DocumentActionComponent = (
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
	const [importedActionNotes, setImportedActionNotes] = useState<Array<{
		step: number
		location: string
		action: string
		instruction: string
	}> | null>(null)
	const [importedChecklist, setImportedChecklist] = useState<Array<{
		slot: string
		guide?: string
		suggestedAlt: string
	}> | null>(null)

	// Only apply this action to the 'page' document type
	if (type !== 'page') {
		return null
	}

	const isProtectedHomePage =
		id === HOME_PAGE_ID ||
		id === `drafts.${HOME_PAGE_ID}` ||
		id === 'homePage' ||
		id === 'drafts.homePage'

	const existingModuleCount =
		(draft?.modules as any[])?.length ||
		(published?.modules as any[])?.length ||
		0
	const existingMetaImage =
		(draft?.metadata as any)?.image || (published?.metadata as any)?.image
	const existingAppearance =
		(draft as any)?.appearance || (published as any)?.appearance

	// Live Preview on Paste: instantly detects manualActionNotes and module count before assembling
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
				const notes = Array.isArray(parsed.manualActionNotes)
					? parsed.manualActionNotes
					: null
				const moduleCount = Array.isArray(parsed.modules)
					? parsed.modules.length
					: parsed.modules && typeof parsed.modules === 'object'
						? Object.keys(parsed.modules).length
						: 0
				return {
					title: parsed.title,
					moduleCount,
					notes,
				}
			}
		} catch (e) {
			// typing in progress or incomplete JSON
		}
		return null
	}, [rawContent])

	const handleDownloadGuide = () => {
		const link = document.createElement('a')
		link.href = '/api/sanity/guide-modules'
		link.download = 'AGENT-GUIDE-PAGE.md'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		toast.push({
			status: 'info',
			title: 'AGENT-GUIDE-PAGE.md Downloaded',
			description:
				'Attach this file into ChatGPT, Claude, or Gemini alongside the System Prompt.',
		})
	}

	const handleCopyPrompt = () => {
		navigator.clipboard.writeText(MASTER_PAGE_SYSTEM_PROMPT)
		toast.push({
			status: 'info',
			title: 'AI Prompt Copied to Clipboard',
			description:
				'Paste this prompt into ChatGPT, Claude, or Gemini along with your landing page briefing.',
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
		if (isProtectedHomePage) {
			toast.push({
				status: 'error',
				title: 'Protected System Document',
				description:
					'The Core Home Page cannot be auto-overwritten by Smart Page Importer for site stability.',
			})
			return
		}

		if (!rawContent.trim()) {
			toast.push({
				status: 'warning',
				title: 'Content Required',
				description: 'Please paste structured JSON generated by the AI Agent.',
			})
			return
		}

		setIsImporting(true)
		setImportStep(1)
		setImportError(null)

		try {
			const res = await fetch('/api/sanity/import-page', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rawContent }),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(
					data.error || 'Failed to assemble landing page modules.',
				)
			}

			if (!Array.isArray(data.modules) || data.modules.length === 0) {
				throw new Error('No modules assembled from the provided payload.')
			}

			setImportStep(2)

			// Apply patch to the draft Sanity document
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
				modules: data.modules,
				editorialChecklist: data.editorialChecklist || [],
				appearance: {
					...(data.appearance || {}),
					// Safeguard: Preserve existing background images if user already uploaded them
					...(existingAppearance?.image
						? { image: existingAppearance.image }
						: {}),
					...(existingAppearance?.mobileImage
						? { mobileImage: existingAppearance.mobileImage }
						: {}),
				},
				metadata: {
					title: data.metadata?.title || data.title,
					description: data.metadata?.description || '',
					slug: { _type: 'slug', current: data.slug },
					...(data.metadata?.noIndex !== undefined
						? { noIndex: data.metadata.noIndex }
						: {}),
					// Safeguard: Preserve existing cover/social share image
					...(existingMetaImage ? { image: existingMetaImage } : {}),
				},
			}

			setImportStep(3)

			await client.patch(draftId).set(patchData).commit()

			setImportedActionNotes(data.manualActionNotes || null)
			setImportedChecklist(data.mediaChecklist || null)

			toast.push({
				status: 'success',
				title: 'Landing Page Assembled Successfully',
				description: `Assembled ${data.stats?.moduleCount || 0} dynamic blocks. In-Studio Action Checklist pinned at top of page!`,
			})
		} catch (err: any) {
			console.error('Page Import Error:', err)
			const errMsg = err?.message || 'Failed to update landing page modules.'
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
		label: 'Smart Page Importer (JSON)',
		icon: FiDownloadCloud,
		title:
			'1-Click assemble full-stack dynamic landing page modules from AI Agent',
		onHandle: () => {
			setIsDialogOpen(true)
			setImportedActionNotes(null)
			setImportedChecklist(null)
			setImportError(null)
		},
		dialog: isDialogOpen
			? {
					type: 'dialog',
					onClose: () => {
						setIsDialogOpen(false)
						setImportedActionNotes(null)
						setImportedChecklist(null)
						setImportError(null)
					},
					header: '1-Click Smart Landing Page Importer',
					content: (
						<Box padding={4}>
							<Stack space={4}>
								{/* Safety & Status Banner */}
								<Card
									tone={isProtectedHomePage ? 'critical' : 'primary'}
									padding={3}
									radius={2}
								>
									<Stack space={2}>
										<Flex align="center" gap={2}>
											<FiLayers />
											<Text size={1} weight="semibold">
												{isProtectedHomePage
													? 'Protected Home Page Gate'
													: 'Full-Stack Dynamic Funnel Assembler'}
											</Text>
										</Flex>
										<Text size={1}>
											{isProtectedHomePage
												? 'This document is configured as the protected Core Home Page. Auto-overwriting is disabled to safeguard the live storefront layout.'
												: 'The engine automatically constructs Page Appearance, SEO Metadata, and 5 to 10 selected modules. The Interactive Checklist will be pinned at the top of your page for instant completion!'}
										</Text>
										{!isProtectedHomePage && (
											<Flex align="center" gap={2}>
												<Badge
													tone={
														existingModuleCount > 0 ? 'caution' : 'positive'
													}
												>
													{existingModuleCount > 0
														? `Currently contains ${existingModuleCount} module(s) (Will be replaced with new stack)`
														: 'Empty Page (Ready for complete funnel assembly)'}
												</Badge>
											</Flex>
										)}
									</Stack>
								</Card>

								{/* Animated Processing State HUD */}
								<AnimatePresence>
									{isImporting && (
										<SmartImportProcessingHud
											currentStep={importStep}
											entityName="Landing Page Architecture"
											stepLabels={[
												'1. Parse Manifest',
												'2. Assemble Blocks',
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

								{/* Animated Action Notes Checklist Feedback */}
								<AnimatePresence>
									{importedActionNotes && importedActionNotes.length > 0 && (
										<SmartImportActionNotes
											notes={importedActionNotes}
											title="Funnel Assembled! Interactive Checklist Pinned to Page"
											subtitle="You can close this modal now. The persistent checklist banner with checkboxes and 1-click Alt text copy buttons is now active at the top of Tab 1."
										/>
									)}
								</AnimatePresence>

								{/* Animated Media Guidance & Alt Texts */}
								<AnimatePresence>
									{importedChecklist && importedChecklist.length > 0 && (
										<SmartImportMediaChecklist
											items={importedChecklist}
											onCopyText={handleCopyText}
											title="Suggested Module Visuals & Ready-to-Use SEO Alt Texts"
											subtitle="Landing page modules assembled. Upload visual assets into designated module cards and copy the pre-optimized Alt texts below:"
										/>
									)}
								</AnimatePresence>

								{/* Input Area with Download Guide and Copy Prompt Buttons */}
								<Stack space={2}>
									<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
										<Text size={1} weight="semibold">
											Paste Landing Page JSON from AI Agent *
										</Text>
										<Flex align="center" gap={2}>
											<Button
												icon={FiDownloadCloud}
												mode="ghost"
												tone="default"
												fontSize={1}
												padding={2}
												text="Download AGENT-GUIDE-PAGE.md"
												title="Download AGENT-GUIDE-PAGE.md specification to attach to ChatGPT/Claude"
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
									<TextArea
										rows={10}
										value={rawContent}
										onChange={(e) => setRawContent(e.currentTarget.value)}
										disabled={isProtectedHomePage || isImporting}
										placeholder={`{\n  "title": "B2B Export Packaging OEM/ODM Solutions",\n  "slug": "oem-export-packaging",\n  "appearance": {\n    "colorScheme": "light",\n    "headerMode": "transparent"\n  },\n  "modules": [\n    {\n      "type": "hero.split",\n      "headline": "Direct-From-Factory Sustainable Packaging for Global Brands",\n      "image": {\n        "alt": "Cleanroom sustainable packaging production line"\n      },\n      "primaryCta": { "label": "Request Quotation", "link": "#rfq-form" }\n    }\n  ],\n  "manualActionNotes": [\n    {\n      "step": 1,\n      "title": "Upload Primary Visual Asset (16:9)",\n      "location": "Tab 1: Content -> Hero Split"\n    }\n  ]\n}`}
										style={{
											resize: 'vertical',
											fontFamily: 'monospace',
											fontSize: 13,
											opacity: isImporting ? 0.6 : 1,
											transition: 'opacity 0.2s ease',
										}}
									/>
									<Text size={0} muted>
										1. Click "Download AGENT-GUIDE-PAGE.md" & "Copy AI System Prompt". 2. Attach file and paste prompt into ChatGPT / Claude. 3. Paste generated JSON here.
									</Text>
								</Stack>

								{/* Live Preview on Paste: Instantly detected notes before assembling */}
								<AnimatePresence>
									{livePreview && !isImporting && (
										<motion.div
											initial={{ opacity: 0, y: 6, scale: 0.99 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 6, scale: 0.99 }}
											transition={{ duration: 0.2, ease: 'easeOut' }}
										>
											<Card tone="positive" padding={3} radius={2} border>
												<Stack space={2}>
													<Flex align="center" gap={2}>
														<Text size={1} weight="bold">
															Live Payload Detected: "
															{livePreview.title || 'Landing Page'}" (
															{livePreview.moduleCount} modules)
														</Text>
													</Flex>
													{livePreview.notes && livePreview.notes.length > 0 ? (
														<Stack space={1} marginTop={1}>
															<Text size={0} weight="semibold" muted>
																Detected Action Checklist (
																{livePreview.notes.length} steps will be pinned to
																your document):
															</Text>
															{livePreview.notes
																.slice(0, 4)
																.map((n: any, idx: number) => (
																	<Stack key={idx} space={1} paddingY={1}>
																		<Flex align="center" gap={2}>
																			<Badge tone="default">
																				Step {n.step || idx + 1}
																			</Badge>
																			<Text size={0} weight="semibold">
																				{n.title || n.actionRequired || n.action}
																			</Text>
																		</Flex>
																		{(n.location || n.targetLocation) && (
																			<Text size={0} muted style={{ paddingLeft: 8 }}>
																				<em>{n.location || n.targetLocation}</em>
																			</Text>
																		)}
																	</Stack>
																))}
															{livePreview.notes.length > 4 && (
																<Text size={0} muted>
																	+ {livePreview.notes.length - 4} more step(s)...
																</Text>
															)}
														</Stack>
													) : (
														<Text size={0} muted>
															Ready to assemble. Automatic handoff checklist will be
															created for this stack.
														</Text>
													)}
												</Stack>
											</Card>
										</motion.div>
									)}
								</AnimatePresence>

								{/* Action Buttons */}
								<Flex justify="flex-end" gap={2} marginTop={2}>
									<Button
										mode="ghost"
										text={importedActionNotes ? 'Close' : 'Cancel'}
										onClick={() => {
											setIsDialogOpen(false)
											setImportedActionNotes(null)
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
												? 'Assembling Funnel Modules...'
												: importedActionNotes
													? 'Re-assemble / Update'
													: 'Assemble Landing Page'
										}
										onClick={handleImport}
										disabled={
											isImporting || !rawContent.trim() || isProtectedHomePage
										}
									/>
								</Flex>
							</Stack>
						</Box>
					),
				}
			: null,
	}
}
