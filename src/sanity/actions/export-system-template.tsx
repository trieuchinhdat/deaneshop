import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import {
	Box,
	Button,
	Card,
	Code,
	Dialog,
	Flex,
	Stack,
	Text,
	TextArea,
	useToast,
} from '@sanity/ui'
import React, { useMemo, useState } from 'react'
import { FiCheck, FiCode, FiCopy, FiInfo } from 'react-icons/fi'
import { deepCloneAndRegenerateKeys } from '../lib/deep-clone-and-regenerate-keys'

/**
 * Strips internal Sanity metadata while preserving valid modules structure.
 */
function cleanModulesForExport(modules: any[]): any[] {
	return deepCloneAndRegenerateKeys(modules)
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export const ExportSystemTemplateAction: DocumentActionComponent = (
	props: DocumentActionProps,
) => {
	const { draft, published, type } = props
	const doc = draft || published
	const toast = useToast()

	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isCopied, setIsCopied] = useState(false)

	// Available strictly on 'page'
	if (type !== 'page') {
		return null
	}

	const modules = (doc?.modules as any[]) || []
	const hasModules = modules.length > 0

	const generatedCode = useMemo(() => {
		if (!hasModules) return ''

		const title = (doc?.title as string) || 'Custom Landing Page Template'
		const idSlug = slugify(title) || 'custom-template'
		const pillar = (doc?.funnelPillar as string) || 'd2c_fast'
		const industry = (doc?.industry as string) || 'Multi-category / General'
		const badge = (doc?.conversionBadge as string) || 'System Standard'
		const description =
			(doc?.description as string) ||
			'Conversion-engineered landing page template crafted for DeanFlow.'

		const templateObject = {
			_id: `builtin-${idSlug}`,
			title,
			description,
			funnelPillar: pillar,
			industry,
			conversionBadge: badge,
			thumbnailUrl: (doc?.thumbnailUrl as string) || '',
			moduleCount: modules.length,
			isBuiltin: true,
			modules: cleanModulesForExport(modules),
		}

		return JSON.stringify(templateObject, null, 2)
	}, [doc, hasModules, modules])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(`${generatedCode},`)
			setIsCopied(true)
			toast.push({
				status: 'success',
				title: 'Code Copied',
				description:
					'Template object copied to clipboard with trailing comma. Paste it into DEFAULT_TEMPLATES.',
			})
			setTimeout(() => setIsCopied(false), 2500)
		} catch (error) {
			console.error('Failed to copy to clipboard:', error)
			toast.push({
				status: 'error',
				title: 'Clipboard Copy Failed',
				description: 'Please manually select and copy the code text.',
			})
		}
	}

	return {
		label: 'Export as System Code',
		icon: FiCode,
		title: hasModules
			? 'Export this layout as a TypeScript object for src/sanity/constants/default-templates.ts (Dev Only)'
			: 'Add modules to this document first before exporting',
		disabled: !hasModules,
		onHandle: () => {
			setIsDialogOpen(true)
		},
		dialog: isDialogOpen
			? {
					type: 'dialog',
					onClose: () => setIsDialogOpen(false),
					header: 'Export as System Template Code',
					content: (
						<Box paddingX={[3, 4]} paddingY={[4, 4]}>
							<Stack space={4}>
								<Card tone="primary" padding={3} radius={2}>
									<Flex align="center" gap={2}>
										<FiInfo size={16} />
										<Text size={1} weight="medium">
											Developer Utility: Copy this pre-formatted object and
											paste it into the <code>DEFAULT_TEMPLATES</code> array
											inside{' '}
											<code>src/sanity/constants/default-templates.ts</code>.
										</Text>
									</Flex>
								</Card>

								<Stack space={2}>
									<Flex justify="space-between" align="center">
										<Text size={1} weight="semibold">
											Generated TypeScript Object ({modules.length} modules)
										</Text>
										<Button
											tone={isCopied ? 'positive' : 'primary'}
											icon={isCopied ? FiCheck : FiCopy}
											fontSize={1}
											padding={2}
											text={isCopied ? 'Copied to Clipboard!' : 'Copy Code'}
											onClick={handleCopy}
										/>
									</Flex>

									<TextArea
										readOnly
										rows={16}
										value={`${generatedCode},`}
										style={{
											fontFamily: 'monospace',
											fontSize: '12px',
											lineHeight: 1.45,
											backgroundColor: '#0f172a',
											color: '#e2e8f0',
										}}
									/>
								</Stack>

								<Flex justify="flex-end" gap={2}>
									<Button
										mode="ghost"
										text="Close"
										onClick={() => setIsDialogOpen(false)}
									/>
									<Button
										tone={isCopied ? 'positive' : 'primary'}
										icon={isCopied ? FiCheck : FiCopy}
										text={isCopied ? 'Copied!' : 'Copy to Clipboard'}
										onClick={handleCopy}
									/>
								</Flex>
							</Stack>
						</Box>
					),
				}
			: null,
	}
}
