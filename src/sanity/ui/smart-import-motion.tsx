import React, { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Stack,
	Text,
} from '@sanity/ui'
import {
	FiAlertCircle,
	FiCamera,
	FiCheck,
	FiCheckSquare,
	FiCopy,
	FiCpu,
	FiLayers,
	FiRefreshCw,
} from 'react-icons/fi'

export type ImportStepId = 1 | 2 | 3

export interface SmartImportProcessingHudProps {
	currentStep: ImportStepId
	entityName: string
	stepLabels?: [string, string, string]
	customMessage?: string
}

const DEFAULT_STEP_LABELS: [string, string, string] = [
	'1. Validate Syntax',
	'2. Structure Schema',
	'3. Commit Lake',
]

const STEP_MESSAGES: Record<ImportStepId, string> = {
	1: 'Validating payload syntax and verifying schema requirements...',
	2: 'Normalizing document structure, specifications, and SEO metadata...',
	3: 'Committing transaction to Sanity Content Lake...',
}

const STEP_PROGRESS: Record<ImportStepId, number> = {
	1: 30,
	2: 70,
	3: 95,
}

export function SmartImportProcessingHud({
	currentStep,
	entityName,
	stepLabels = DEFAULT_STEP_LABELS,
	customMessage,
}: SmartImportProcessingHudProps) {
	const progress = STEP_PROGRESS[currentStep] || 30
	const message = customMessage || STEP_MESSAGES[currentStep]

	return (
		<motion.div
			initial={{ opacity: 0, y: -6, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -6, scale: 0.98 }}
			transition={{ duration: 0.22, ease: 'easeOut' }}
		>
			<Card
				tone="primary"
				padding={4}
				radius={2}
				border
				style={{
					background: 'rgba(34, 118, 252, 0.04)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<Stack space={3}>
					{/* Header with spinning radar icon */}
					<Flex align="center" justify="space-between">
						<Flex align="center" gap={3}>
							<div
								style={{
									position: 'relative',
									width: 28,
									height: 28,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{/* Pulsing halo */}
								<motion.div
									animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.05, 0.4] }}
									transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
									style={{
										position: 'absolute',
										inset: 0,
										borderRadius: '50%',
										backgroundColor: '#2276fc',
									}}
								/>
								{/* Rotating center icon */}
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
									style={{ display: 'flex', color: '#2276fc' }}
								>
									<FiRefreshCw size={16} />
								</motion.div>
							</div>

							<Stack space={1}>
								<Text size={1} weight="bold">
									AI Import Engine: {entityName}
								</Text>
								<Text size={0} muted>
									Automated parsing & Content Lake synchronization
								</Text>
							</Stack>
						</Flex>

						<Badge tone="primary" mode="outline">
							Step {currentStep} of 3
						</Badge>
					</Flex>

					{/* 3-Step Milestones */}
					<Flex gap={2} wrap="wrap">
						{stepLabels.map((label, idx) => {
							const stepNumber = (idx + 1) as ImportStepId
							const isCompleted = currentStep > stepNumber
							const isActive = currentStep === stepNumber

							return (
								<motion.div
									key={label}
									style={{ flex: '1 1 0px', minWidth: 100 }}
									animate={isActive ? { scale: [1, 1.02, 1] } : { scale: 1 }}
									transition={isActive ? { duration: 1.2, repeat: Infinity } : undefined}
								>
									<Card
										padding={2}
										radius={2}
										tone={isCompleted ? 'positive' : isActive ? 'primary' : 'transparent'}
										border
									>
										<Flex align="center" justify="center" gap={1}>
											{isCompleted ? (
												<FiCheck size={12} style={{ color: '#10b981' }} />
											) : isActive ? (
												<motion.div
													animate={{ rotate: 360 }}
													transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
													style={{ display: 'flex', color: '#2276fc' }}
												>
													<FiCpu size={12} />
												</motion.div>
											) : null}
											<Text
												size={0}
												weight={isActive ? 'bold' : 'medium'}
												muted={!isActive && !isCompleted}
											>
												{label}
											</Text>
										</Flex>
									</Card>
								</motion.div>
							)
						})}
					</Flex>

					{/* Animated Progress Bar */}
					<div
						style={{
							height: 4,
							width: '100%',
							backgroundColor: 'rgba(128, 128, 128, 0.15)',
							borderRadius: 999,
							overflow: 'hidden',
						}}
					>
						<motion.div
							initial={{ width: '10%' }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.4, ease: 'easeOut' }}
							style={{
								height: '100%',
								background: 'linear-gradient(90deg, #2276fc 0%, #10b981 100%)',
								borderRadius: 999,
							}}
						/>
					</div>

					{/* Real-time Message */}
					<Flex align="center" justify="space-between">
						<Text size={0} muted style={{ fontStyle: 'italic' }}>
							{message}
						</Text>
						<Text size={0} muted>
							Preserving existing media
						</Text>
					</Flex>
				</Stack>
			</Card>
		</motion.div>
	)
}

export interface SmartImportErrorBannerProps {
	error: string | null
	onDismiss?: () => void
}

export function SmartImportErrorBanner({
	error,
	onDismiss,
}: SmartImportErrorBannerProps) {
	if (!error) return null

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96 }}
			animate={{
				opacity: 1,
				scale: 1,
				x: [-6, 6, -4, 4, -2, 2, 0],
			}}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={{ duration: 0.35, ease: 'easeOut' }}
		>
			<Card tone="critical" padding={3} radius={2} border>
				<Flex justify="space-between" align="center" gap={3}>
					<Flex align="center" gap={2}>
						<FiAlertCircle size={18} style={{ flexShrink: 0 }} />
						<Stack space={1}>
							<Text size={1} weight="bold">
								Import Failed
							</Text>
							<Text size={0}>{error}</Text>
						</Stack>
					</Flex>
					{onDismiss && (
						<Button
							mode="ghost"
							tone="critical"
							text="Dismiss"
							fontSize={0}
							padding={2}
							onClick={onDismiss}
						/>
					)}
				</Flex>
			</Card>
		</motion.div>
	)
}

export interface MediaChecklistItem {
	slot: string
	guide?: string
	suggestedAlt: string
}

export interface SmartImportMediaChecklistProps {
	items: MediaChecklistItem[]
	onCopyText: (text: string, label: string) => void
	title?: string
	subtitle?: string
}

const listContainerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.05,
		},
	},
}

const listItemVariants: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.22, ease: 'easeOut' },
	},
}

export function SmartImportMediaChecklist({
	items,
	onCopyText,
	title = 'Suggested Photography & Ready-to-Use SEO Alt Texts',
	subtitle = 'Product data populated successfully. Upload high-res photography and use the pre-optimized SEO Alt texts below:',
}: SmartImportMediaChecklistProps) {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

	const handleCopy = (alt: string, idx: number) => {
		onCopyText(alt, 'SEO Alt Text')
		setCopiedIndex(idx)
		setTimeout(() => setCopiedIndex(null), 2000)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 12, scale: 0.99 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.28, ease: 'easeOut' }}
		>
			<Card tone="positive" padding={3} radius={2} border>
				<Stack space={3}>
					<Flex align="center" gap={2}>
						<motion.div
							initial={{ scale: 0.7 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring', stiffness: 350, damping: 20 }}
						>
							<FiCamera size={18} style={{ color: '#10b981' }} />
						</motion.div>
						<Text size={1} weight="bold">
							{title}
						</Text>
					</Flex>

					<Text size={1} muted>
						{subtitle}
					</Text>

					<motion.div
						variants={listContainerVariants}
						initial="hidden"
						animate="visible"
					>
						<Stack space={2}>
							{items.map((item, idx) => {
								const isCopied = copiedIndex === idx

								return (
									<motion.div
										key={idx}
										variants={listItemVariants}
										whileHover={{ x: 2, transition: { duration: 0.15 } }}
									>
										<Card padding={2} radius={1} tone="transparent" border>
											<Flex justify="space-between" align="center" gap={2}>
												<Stack space={1} style={{ flex: 1 }}>
													<Text size={1} weight="semibold">
														{item.slot}
													</Text>
													{item.guide && (
														<Text size={0} muted>
															Guide: {item.guide}
														</Text>
													)}
													<Text size={0}>
														<strong>Alt Text:</strong> {item.suggestedAlt}
													</Text>
												</Stack>

												<Button
													icon={isCopied ? FiCheck : FiCopy}
													mode={isCopied ? 'default' : 'ghost'}
													tone={isCopied ? 'positive' : 'default'}
													fontSize={1}
													padding={2}
													onClick={() => handleCopy(item.suggestedAlt, idx)}
													title={isCopied ? 'Copied to Clipboard!' : 'Copy Alt Text'}
													text={isCopied ? 'Copied' : undefined}
												/>
											</Flex>
										</Card>
									</motion.div>
								)
							})}
						</Stack>
					</motion.div>
				</Stack>
			</Card>
		</motion.div>
	)
}

export interface ManualActionNoteItem {
	step: number
	location?: string
	targetLocation?: string
	title?: string
	action?: string
	instruction?: string
}

export interface SmartImportActionNotesProps {
	notes: ManualActionNoteItem[]
	title?: string
	subtitle?: string
}

export function SmartImportActionNotes({
	notes,
	title = 'Funnel Assembled! Interactive Checklist Pinned to Page',
	subtitle = 'You can close this modal now. The persistent checklist banner with checkboxes and 1-click Alt text copy buttons is now active at the top of Tab 1.',
}: SmartImportActionNotesProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12, scale: 0.99 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.28, ease: 'easeOut' }}
		>
			<Card tone="positive" padding={3} radius={2} border>
				<Stack space={3}>
					<Flex align="center" gap={2}>
						<motion.div
							initial={{ scale: 0.7 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring', stiffness: 350, damping: 20 }}
						>
							<FiCheckSquare size={18} style={{ color: '#10b981' }} />
						</motion.div>
						<Text size={1} weight="bold">
							{title}
						</Text>
					</Flex>

					<Text size={1} muted>
						{subtitle}
					</Text>

					{notes.length > 0 && (
						<motion.div
							variants={listContainerVariants}
							initial="hidden"
							animate="visible"
						>
							<Stack space={2}>
								{notes.map((note, idx) => {
									const stepNumber = note.step || idx + 1
									const noteTitle = note.title || note.action || 'Finishing Step'
									const location = note.location || note.targetLocation

									return (
										<motion.div
											key={idx}
											variants={listItemVariants}
											whileHover={{ x: 2, transition: { duration: 0.15 } }}
										>
											<Card padding={2} radius={1} tone="transparent" border>
												<Flex align="center" justify="space-between" gap={2}>
													<Flex align="center" gap={2}>
														<Badge tone="default">Step {stepNumber}</Badge>
														<Text size={0} weight="semibold">
															{noteTitle}
														</Text>
													</Flex>
													{location && (
														<Text size={0} muted>
															<em>{location}</em>
														</Text>
													)}
												</Flex>
											</Card>
										</motion.div>
									)
								})}
							</Stack>
						</motion.div>
					)}
				</Stack>
			</Card>
		</motion.div>
	)
}
