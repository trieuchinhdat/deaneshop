import { type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import {
	ActivityIcon,
	CheckmarkCircleIcon,
	CheckmarkIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ClipboardIcon,
	CloseCircleIcon,
	DocumentTextIcon,
	EarthGlobeIcon,
	InfoOutlineIcon,
	LockIcon,
	SearchIcon,
	SparklesIcon,
	SyncIcon,
	TrendUpwardIcon,
	WarningOutlineIcon,
} from '@sanity/icons'
import { Badge, Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import {
	auditArticle,
	generateAuditMarkdownReport,
	type CategoryAuditResult,
	type GateResult,
	type GeqsrAuditResult,
	type PriorityActionItem,
} from '@/sanity/lib/article-audit'

export const AiAuditAction: DocumentActionComponent = (
	props: DocumentActionProps,
) => {
	const { draft, published } = props
	const doc = draft || published || {}
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	return {
		label: 'AI Audit',
		icon: SparklesIcon,
		title: 'Run GEQSR AI Editorial & Search Quality Audit Engine',
		tone: 'primary',
		onHandle: () => {
			setIsDialogOpen(true)
		},
		dialog: isDialogOpen
			? {
					type: 'dialog',
					header: 'Global Editorial Quality & Search Readiness (GEQSR-1.0)',
					onClose: () => setIsDialogOpen(false),
					width: 'large',
					content: (
						<AiAuditModalContent
							doc={doc}
							onClose={() => setIsDialogOpen(false)}
						/>
					),
				}
			: null,
	}
}

export interface AiAuditModalContentProps {
	doc: any
	onClose: () => void
}

interface ScanStep {
	step: number
	label: string
	progress: number
	pillar: string
	message: string
}

const AUDIT_SCAN_STEPS: ScanStep[] = [
	{
		step: 1,
		label: 'Critical Compliance & Legal Gates',
		progress: 20,
		pillar: 'Layer 01: Compliance',
		message:
			'Verifying US FTC (16 CFR Part 255), EU Consumer Directives, and UK ASA commercial disclosures...',
	},
	{
		step: 2,
		label: 'Content Depth & E-E-A-T Authority',
		progress: 40,
		pillar: 'Pillar I: Content Depth',
		message:
			'Auditing author credentials, technical reviewer attribution, fact-checking date, and source citations...',
	},
	{
		step: 3,
		label: 'Search & Generative Engine Optimization',
		progress: 65,
		pillar: 'Pillar II: Search & AI',
		message:
			'Measuring multi-script SERP title pixel widths and parsing Key Takeaways for Google AI Overviews & Perplexity...',
	},
	{
		step: 4,
		label: 'WCAG 2.2 AA Accessibility & Inclusive UX',
		progress: 85,
		pillar: 'Pillar III: Experience',
		message:
			'Inspecting inline image Alt text coverage, landmark heading hierarchy, and reading pacing...',
	},
	{
		step: 5,
		label: 'Synthesis & GEQSR-1.0 Tier Allocation',
		progress: 100,
		pillar: 'Quality Readiness Score',
		message:
			'Assembling 12-category rubric matrix, executing gatekeeper logic, and drafting actionable recommendations...',
	},
]

type ActiveTab = 'overview' | 'categories' | 'gates' | 'report'

export function AiAuditModalContent({
	doc,
	onClose,
}: AiAuditModalContentProps) {
	const [stage, setStage] = useState<'scanning' | 'reveal'>('scanning')
	const [currentStepIndex, setCurrentStepIndex] = useState(0)
	const [scanProgress, setScanProgress] = useState(0)
	const [displayScore, setDisplayScore] = useState(0)
	const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
	const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
		null,
	)
	const [copiedReport, setCopiedReport] = useState(false)

	const auditResult: GeqsrAuditResult = useMemo(
		() => auditArticle(doc),
		[doc],
	)

	const skipScan = () => {
		setStage('reveal')
		setDisplayScore(auditResult.totalScore)
	}

	const runScan = () => {
		setStage('scanning')
		setCurrentStepIndex(0)
		setScanProgress(0)
		setDisplayScore(0)
		setActiveTab('overview')

		let idx = 0
		const stepDuration = 480 // 5 steps * 480ms = 2.4s total

		const interval = setInterval(() => {
			if (idx < AUDIT_SCAN_STEPS.length) {
				setCurrentStepIndex(idx)
				setScanProgress(AUDIT_SCAN_STEPS[idx].progress)
				idx += 1
			} else {
				clearInterval(interval)
				setTimeout(() => {
					setStage('reveal')
				}, 150)
			}
		}, stepDuration)
	}

	// Trigger initial scan on open
	useEffect(() => {
		runScan()
	}, [])

	// Animated score counter when entering reveal stage
	useEffect(() => {
		if (stage === 'reveal') {
			let current = 0
			const target = auditResult.totalScore
			if (target === 0) {
				setDisplayScore(0)
				return
			}
			const step = Math.max(1, Math.floor(target / 25))
			const timer = setInterval(() => {
				current += step
				if (current >= target) {
					setDisplayScore(target)
					clearInterval(timer)
				} else {
					setDisplayScore(current)
				}
			}, 24)
			return () => clearInterval(timer)
		}
	}, [stage, auditResult.totalScore])

	const activeStep =
		AUDIT_SCAN_STEPS[currentStepIndex] || AUDIT_SCAN_STEPS[0]

	const handleCopyReport = async () => {
		const reportText = generateAuditMarkdownReport(
			auditResult,
			doc.title || doc.metadata?.title || 'Article',
		)
		try {
			await navigator.clipboard.writeText(reportText)
			setCopiedReport(true)
			setTimeout(() => setCopiedReport(false), 2500)
		} catch {
			// Fallback if clipboard API is restricted
			console.warn('Clipboard write failed')
		}
	}

	const toggleCategory = (catId: string) => {
		setExpandedCategoryId((prev) => (prev === catId ? null : catId))
	}

	return (
		<Box padding={4} style={{ minHeight: '520px' }}>
			<AnimatePresence mode="wait">
				{/* =========================================================================
				    STAGE 1: SCANNING ANIMATION (HIGH-TECH EDITORIAL RADAR - ~2.4s)
				    ========================================================================= */}
				{stage === 'scanning' && (
					<motion.div
						key="scanning"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.2 }}
					>
						<Card
							padding={5}
							radius={3}
							tone="default"
							border
							style={{ textAlign: 'center', position: 'relative' }}
						>
							<Stack space={4}>
								{/* Glowing Wave Radar Scanner */}
								<div
									style={{
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										height: '110px',
										position: 'relative',
									}}
								>
									{/* Outer Pulse Ring */}
									<motion.div
										animate={{
											scale: [1, 1.4, 1],
											opacity: [0.35, 0.05, 0.35],
										}}
										transition={{
											duration: 2.2,
											repeat: Infinity,
											ease: 'easeInOut',
										}}
										style={{
											position: 'absolute',
											width: '96px',
											height: '96px',
											borderRadius: '50%',
											border: '2px solid #2563eb',
										}}
									/>

									{/* Inner Rotating Hex/Circle Container */}
									<motion.div
										animate={{
											rotate: [0, 360],
										}}
										transition={{
											duration: 4,
											repeat: Infinity,
											ease: 'linear',
										}}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '74px',
											height: '74px',
											borderRadius: '50%',
											background:
												'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.06))',
											border: '1px solid rgba(37,99,235,0.4)',
											color: '#2563eb',
											boxShadow: '0 0 25px rgba(37,99,235,0.25)',
										}}
									>
										<SparklesIcon style={{ fontSize: '32px' }} />
									</motion.div>
								</div>

								{/* Checkpoint Step Counter & Headline */}
								<Stack space={2}>
									<Flex justify="center" align="center" gap={2}>
										<Badge tone="primary" fontSize={1} padding={2} radius={2}>
											{activeStep.pillar.toUpperCase()}
										</Badge>
										<Badge tone="default" fontSize={1} padding={2} radius={2}>
											CHECKPOINT {activeStep.step} OF 5
										</Badge>
										<Text size={1} weight="semibold" muted>
											{scanProgress}% Completed
										</Text>
									</Flex>

									<Text size={3} weight="bold">
										{activeStep.label}
									</Text>

									<Text
										size={1}
										muted
										style={{ minHeight: '36px', lineHeight: 1.5 }}
									>
										{activeStep.message}
									</Text>
								</Stack>

								{/* High-Precision Progress Bar */}
								<div
									style={{
										width: '100%',
										maxWidth: '480px',
										margin: '0 auto',
										height: '6px',
										borderRadius: '999px',
										background: 'var(--card-border-color, rgba(0,0,0,0.1))',
										overflow: 'hidden',
									}}
								>
									<motion.div
										style={{
											height: '100%',
											background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
											borderRadius: '999px',
										}}
										initial={{ width: '0%' }}
										animate={{ width: `${scanProgress}%` }}
										transition={{ ease: 'easeOut', duration: 0.35 }}
									/>
								</div>

								{/* Step Dots Chain */}
								<Flex justify="center" align="center" gap={2} paddingTop={1}>
									{AUDIT_SCAN_STEPS.map((s, idx) => {
										const isPassed = idx < currentStepIndex
										const isCurrent = idx === currentStepIndex
										return (
											<div
												key={s.step}
												style={{
													width: isCurrent ? '24px' : '8px',
													height: '8px',
													borderRadius: '999px',
													background: isPassed
														? '#10b981'
														: isCurrent
															? '#2563eb'
															: 'var(--card-border-color, rgba(0,0,0,0.15))',
													transition: 'all 0.3s ease',
												}}
												title={`Step ${s.step}: ${s.label}`}
											/>
										)
									})}
								</Flex>

								{/* Skip Button & Standards Footnote */}
								<Flex justify="space-between" align="center" paddingTop={3}>
									<Text size={0} muted>
										Standards: GEQSR-1.0, US FTC (16 CFR Part 255), WCAG 2.2 AA,
										Google E-E-A-T
									</Text>
									<Button
										text="Skip to Results"
										mode="ghost"
										fontSize={0}
										padding={2}
										onClick={skipScan}
									/>
								</Flex>
							</Stack>
						</Card>
					</motion.div>
				)}

				{/* =========================================================================
				    STAGE 2: REVEAL STAGE (EDITORIAL INTELLIGENCE HUD WITH TABS)
				    ========================================================================= */}
				{stage === 'reveal' && (
					<motion.div
						key="reveal"
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
					>
						<Stack space={4}>
							{/* HERO SCORE & READINESS BANNER */}
							<Card
								padding={4}
								radius={3}
								tone="default"
								border
								style={{
									borderLeft: `5px solid ${
										auditResult.scoreTone === 'positive'
											? '#10b981'
											: auditResult.scoreTone === 'caution'
												? '#f59e0b'
												: '#ef4444'
									}`,
									boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
								}}
							>
								<Flex
									justify="space-between"
									align="center"
									wrap="wrap"
									gap={3}
								>
									{/* Left Column: Readiness Index & Tier Description */}
									<Stack space={2} style={{ flex: 1, minWidth: '280px' }}>
										<Flex align="center" gap={2} wrap="wrap">
											<Text size={1} weight="semibold" muted>
												Editorial Quality & Search Readiness Index
											</Text>
											<Badge
												tone={auditResult.scoreTone}
												fontSize={1}
												padding={2}
												radius={2}
											>
												{auditResult.scoreTier}
											</Badge>
											{auditResult.gates.allPassed ? (
												<Badge tone="positive" fontSize={0} padding={2}>
													All Gates Passed
												</Badge>
											) : (
												<Badge tone="critical" fontSize={0} padding={2}>
													Compliance Blocked
												</Badge>
											)}
										</Flex>
										<Text size={1} muted style={{ lineHeight: 1.45 }}>
											{auditResult.tierDescription}
										</Text>
									</Stack>

									{/* Right Column: Animated Score Odometer */}
									<Flex align="center" gap={3} style={{ flexShrink: 0 }}>
										<div
											style={{
												fontFamily: 'monospace',
												fontSize: '34px',
												fontWeight: 800,
												letterSpacing: '-0.03em',
												color:
													auditResult.scoreTone === 'positive'
														? '#10b981'
														: auditResult.scoreTone === 'caution'
															? '#f59e0b'
															: '#ef4444',
											}}
										>
											{displayScore}{' '}
											<span style={{ fontSize: '15px', color: '#6b7280' }}>
												/ 100 PTS
											</span>
										</div>
									</Flex>
								</Flex>
							</Card>

							{/* INTERACTIVE HUD TAB SELECTOR */}
							<Flex
								gap={1}
								style={{
									borderBottom:
										'1px solid var(--card-border-color, rgba(0,0,0,0.12))',
									paddingBottom: '2px',
								}}
							>
								<Button
									icon={ActivityIcon}
									mode={activeTab === 'overview' ? 'default' : 'ghost'}
									tone={activeTab === 'overview' ? 'primary' : 'default'}
									text="Executive Overview"
									fontSize={1}
									padding={2}
									onClick={() => setActiveTab('overview')}
								/>
								<Button
									icon={DocumentTextIcon}
									mode={activeTab === 'categories' ? 'default' : 'ghost'}
									tone={activeTab === 'categories' ? 'primary' : 'default'}
									text={`12 Categories (${auditResult.categories.length})`}
									fontSize={1}
									padding={2}
									onClick={() => setActiveTab('categories')}
								/>
								<Button
									icon={LockIcon}
									mode={activeTab === 'gates' ? 'default' : 'ghost'}
									tone={
										auditResult.gates.allPassed
											? activeTab === 'gates'
												? 'primary'
												: 'default'
											: 'critical'
									}
									text={`Compliance Gates (${auditResult.gates.items.length})`}
									fontSize={1}
									padding={2}
									onClick={() => setActiveTab('gates')}
								/>
								<Button
									icon={ClipboardIcon}
									mode={activeTab === 'report' ? 'default' : 'ghost'}
									tone={activeTab === 'report' ? 'primary' : 'default'}
									text="Executive Report"
									fontSize={1}
									padding={2}
									onClick={() => setActiveTab('report')}
								/>
							</Flex>

							{/* =====================================================================
							    TAB 1: EXECUTIVE OVERVIEW & PRIORITY ACTIONS
							    ===================================================================== */}
							{activeTab === 'overview' && (
								<motion.div
									key="overview"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Stack space={4}>
										{/* 3 Pillars Visual Progress Grid */}
										<div>
											<Text
												size={0}
												weight="bold"
												muted
												style={{
													textTransform: 'uppercase',
													letterSpacing: '0.05em',
													marginBottom: '8px',
													display: 'block',
												}}
											>
												Core Rubric Pillars
											</Text>
											<div
												style={{
													display: 'grid',
													gridTemplateColumns:
														'repeat(auto-fit, minmax(210px, 1fr))',
													gap: '12px',
												}}
											>
												{/* Pillar 1 */}
												<Card padding={3} radius={2} border tone="default">
													<Stack space={2}>
														<Flex justify="space-between" align="center">
															<Text size={1} weight="bold">
																Content & Authority
															</Text>
															<Badge tone="primary" fontSize={0}>
																{
																	auditResult.pillars.contentAuthority
																		.awardedScore
																}{' '}
																/{' '}
																{auditResult.pillars.contentAuthority.maxScore}{' '}
																PTS
															</Badge>
														</Flex>
														<div
															style={{
																width: '100%',
																height: '5px',
																borderRadius: '999px',
																background: 'rgba(0,0,0,0.08)',
																overflow: 'hidden',
															}}
														>
															<div
																style={{
																	width: `${auditResult.pillars.contentAuthority.percentage}%`,
																	height: '100%',
																	background: '#2563eb',
																	borderRadius: '999px',
																	transition: 'width 0.4s ease',
																}}
															/>
														</div>
														<Flex justify="space-between" align="center">
															<Text size={0} muted>
																Search Intent, Depth, E-E-A-T
															</Text>
															<Text size={0} weight="semibold">
																{
																	auditResult.pillars.contentAuthority
																		.percentage
																}
																%
															</Text>
														</Flex>
													</Stack>
												</Card>

												{/* Pillar 2 */}
												<Card padding={3} radius={2} border tone="default">
													<Stack space={2}>
														<Flex justify="space-between" align="center">
															<Text size={1} weight="bold">
																Search & AI Readiness
															</Text>
															<Badge tone="primary" fontSize={0}>
																{auditResult.pillars.searchAi.awardedScore} /{' '}
																{auditResult.pillars.searchAi.maxScore} PTS
															</Badge>
														</Flex>
														<div
															style={{
																width: '100%',
																height: '5px',
																borderRadius: '999px',
																background: 'rgba(0,0,0,0.08)',
																overflow: 'hidden',
															}}
														>
															<div
																style={{
																	width: `${auditResult.pillars.searchAi.percentage}%`,
																	height: '100%',
																	background: '#0891b2',
																	borderRadius: '999px',
																	transition: 'width 0.4s ease',
																}}
															/>
														</div>
														<Flex justify="space-between" align="center">
															<Text size={0} muted>
																SERP Pixels, GEO, Schema
															</Text>
															<Text size={0} weight="semibold">
																{auditResult.pillars.searchAi.percentage}%
															</Text>
														</Flex>
													</Stack>
												</Card>

												{/* Pillar 3 */}
												<Card padding={3} radius={2} border tone="default">
													<Stack space={2}>
														<Flex justify="space-between" align="center">
															<Text size={1} weight="bold">
																Experience & Compliance
															</Text>
															<Badge tone="primary" fontSize={0}>
																{
																	auditResult.pillars.experienceCompliance
																		.awardedScore
																}{' '}
																/{' '}
																{
																	auditResult.pillars.experienceCompliance
																		.maxScore
																}{' '}
																PTS
															</Badge>
														</Flex>
														<div
															style={{
																width: '100%',
																height: '5px',
																borderRadius: '999px',
																background: 'rgba(0,0,0,0.08)',
																overflow: 'hidden',
															}}
														>
															<div
																style={{
																	width: `${auditResult.pillars.experienceCompliance.percentage}%`,
																	height: '100%',
																	background: '#059669',
																	borderRadius: '999px',
																	transition: 'width 0.4s ease',
																}}
															/>
														</div>
														<Flex justify="space-between" align="center">
															<Text size={0} muted>
																WCAG 2.2, CRO, Multi-Market
															</Text>
															<Text size={0} weight="semibold">
																{
																	auditResult.pillars.experienceCompliance
																		.percentage
																}
																%
															</Text>
														</Flex>
													</Stack>
												</Card>
											</div>
										</div>

										{/* Priority Action Items */}
										<Stack space={2}>
											<Flex justify="space-between" align="center">
												<Text
													size={0}
													weight="bold"
													muted
													style={{
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
													}}
												>
													Priority Action Items to Maximize Score
												</Text>
												<Text size={0} muted>
													{auditResult.topActionItems.length} recommendations
													available
												</Text>
											</Flex>

											{auditResult.topActionItems.length === 0 ? (
												<Card padding={4} radius={2} tone="positive" border>
													<Flex align="center" gap={3}>
														<CheckmarkCircleIcon
															style={{ fontSize: '24px', color: '#10b981' }}
														/>
														<Stack space={1}>
															<Text size={1} weight="bold">
																Exemplary Editorial & Technical Standards
															</Text>
															<Text size={0} muted>
																No blocking issues or high-priority
																optimizations remaining. Article is fully
																prepared for publication.
															</Text>
														</Stack>
													</Flex>
												</Card>
											) : (
												<Stack space={2}>
													{auditResult.topActionItems.map(
														(item: PriorityActionItem, index: number) => (
															<motion.div
																key={item.id}
																initial={{ opacity: 0, x: -6 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{
																	duration: 0.2,
																	delay: index * 0.04,
																}}
															>
																<Card
																	padding={3}
																	radius={2}
																	border
																	tone="default"
																	style={{
																		borderLeft: `4px solid ${
																			item.impact === 'critical'
																				? '#ef4444'
																				: item.impact === 'high'
																					? '#f59e0b'
																					: '#2563eb'
																		}`,
																		background: 'var(--card-bg-color)',
																	}}
																>
																	<Flex
																		align="flex-start"
																		justify="space-between"
																		gap={3}
																	>
																		<Stack
																			space={2}
																			style={{ flex: 1, minWidth: 0 }}
																		>
																			<Flex
																				align="center"
																				gap={2}
																				wrap="wrap"
																			>
																				<Badge
																					tone={
																						item.impact === 'critical'
																							? 'critical'
																							: item.impact === 'high'
																								? 'caution'
																								: 'primary'
																					}
																					fontSize={0}
																				>
																					{item.impact.toUpperCase()}
																				</Badge>
																				<Badge
																					tone="default"
																					fontSize={0}
																				>
																					Tab: {item.targetTab.toUpperCase()}
																				</Badge>
																				<Text size={1} weight="semibold">
																					{item.title}
																				</Text>
																			</Flex>
																			<Text
																				size={1}
																				muted
																				style={{
																					lineHeight: 1.45,
																					wordBreak: 'break-word',
																				}}
																			>
																				{item.instruction}
																			</Text>
																		</Stack>

																		<Badge
																			tone="positive"
																			fontSize={0}
																			style={{
																				flexShrink: 0,
																				fontFamily: 'monospace',
																				fontWeight: 700,
																			}}
																		>
																			+{item.pointsRecoverable} PTS
																		</Badge>
																	</Flex>
																</Card>
															</motion.div>
														),
													)}
												</Stack>
											)}
										</Stack>
									</Stack>
								</motion.div>
							)}

							{/* =====================================================================
							    TAB 2: 12 QUALITY CATEGORIES (DRILL-DOWN & EVIDENCE)
							    ===================================================================== */}
							{activeTab === 'categories' && (
								<motion.div
									key="categories"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Card radius={3} border tone="default" style={{ overflow: 'hidden' }}>
										{/* Table Header */}
										<div
											style={{
												padding: '10px 16px',
												background: 'var(--card-bg-color)',
												borderBottom:
													'1px solid var(--card-border-color, rgba(0,0,0,0.1))',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
										>
											<Text
												size={0}
												weight="bold"
												muted
												style={{
													textTransform: 'uppercase',
													letterSpacing: '0.05em',
												}}
											>
												Category / Rubric (Click row to inspect evidence)
											</Text>
											<Text
												size={0}
												weight="bold"
												muted
												style={{
													textTransform: 'uppercase',
													letterSpacing: '0.05em',
												}}
											>
												Awarded Score
											</Text>
										</div>

										{/* Accordion Rows */}
										<div>
											{auditResult.categories.map(
												(cat: CategoryAuditResult, idx: number) => {
													const isExpanded = expandedCategoryId === cat.id
													const isLast =
														idx === auditResult.categories.length - 1
													return (
														<div
															key={cat.id}
															style={{
																borderBottom: isLast
																	? 'none'
																	: '1px solid var(--card-border-color, rgba(0,0,0,0.08))',
															}}
														>
															{/* Clickable Row Header */}
															<div
																onClick={() => toggleCategory(cat.id)}
																style={{
																	padding: '12px 16px',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'space-between',
																	gap: '12px',
																	cursor: 'pointer',
																	background: isExpanded
																		? 'color-mix(in srgb, var(--card-bg-color) 92%, #2563eb 8%)'
																		: idx % 2 === 1
																			? 'color-mix(in srgb, var(--card-bg-color) 97%, transparent)'
																			: 'var(--card-bg-color)',
																	transition: 'background-color 0.15s ease',
																}}
															>
																<Flex
																	align="center"
																	gap={2.5}
																	style={{ minWidth: 0, flex: 1 }}
																>
																	<div style={{ flexShrink: 0 }}>
																		{isExpanded ? (
																			<ChevronDownIcon
																				style={{ fontSize: '18px' }}
																			/>
																		) : (
																			<ChevronRightIcon
																				style={{
																					fontSize: '18px',
																					color: '#6b7280',
																				}}
																			/>
																		)}
																	</div>

																	<Badge
																		tone="default"
																		fontSize={0}
																		style={{
																			fontFamily: 'monospace',
																			flexShrink: 0,
																		}}
																	>
																		{cat.number}
																	</Badge>

																	<Text
																		size={1}
																		weight="semibold"
																		style={{ minWidth: 0 }}
																	>
																		{cat.name}
																	</Text>

																	<Badge
																		tone={
																			cat.level === 4
																				? 'positive'
																				: cat.level === 3
																					? 'primary'
																					: cat.level === 2
																						? 'caution'
																						: 'critical'
																		}
																		fontSize={0}
																		style={{ flexShrink: 0 }}
																	>
																		{cat.level === 4
																			? 'Exemplary'
																			: cat.level === 3
																				? 'Strong'
																				: cat.level === 2
																					? 'Partial'
																					: 'Weak'}
																	</Badge>
																</Flex>

																<Badge
																	tone={
																		cat.level === 4
																			? 'positive'
																			: cat.level === 3
																				? 'primary'
																				: cat.level === 2
																					? 'caution'
																					: 'default'
																	}
																	fontSize={0}
																	style={{
																		flexShrink: 0,
																		fontFamily: 'monospace',
																		fontWeight: 700,
																	}}
																>
																	{cat.awardedScore} / {cat.weight} PTS
																</Badge>
															</div>

															{/* Expanded Sub-Criteria Drawer */}
															<AnimatePresence>
																{isExpanded && (
																	<motion.div
																		initial={{
																			opacity: 0,
																			height: 0,
																		}}
																		animate={{
																			opacity: 1,
																			height: 'auto',
																		}}
																		exit={{
																			opacity: 0,
																			height: 0,
																		}}
																		transition={{ duration: 0.2 }}
																		style={{
																			overflow: 'hidden',
																			background:
																				'color-mix(in srgb, var(--card-bg-color) 94%, transparent)',
																			borderTop:
																				'1px dashed var(--card-border-color, rgba(0,0,0,0.1))',
																		}}
																	>
																		<Box padding={3}>
																			<Stack space={3}>
																				<Text size={0} muted>
																					<em>{cat.summary}</em>
																				</Text>

																				<Stack space={2}>
																					{cat.subCriteria.map((sub) => (
																						<Card
																							key={sub.id}
																							padding={2}
																							radius={2}
																							border
																							tone="default"
																							style={{
																								background:
																									'var(--card-bg-color)',
																							}}
																						>
																							<Flex
																								align="flex-start"
																								justify="space-between"
																								gap={2}
																							>
																								<Stack
																									space={1}
																									style={{
																										minWidth: 0,
																										flex: 1,
																									}}
																								>
																									<Flex
																										align="center"
																										gap={2}
																										wrap="wrap"
																									>
																										<Text
																											size={1}
																											weight="semibold"
																										>
																											{sub.label}
																										</Text>
																										<Badge
																											tone={
																												sub.level === 4
																													? 'positive'
																													: sub.level >=
																														  2
																														? 'caution'
																														: 'critical'
																											}
																											fontSize={0}
																										>
																											Level {sub.level}{' '}
																											(
																											{sub.level *
																												25}
																											%)
																										</Badge>
																									</Flex>

																									<Text size={0} muted>
																										<strong>
																											Evidence:
																										</strong>{' '}
																										{sub.evidence}
																									</Text>

																									{sub.suggestion && (
																										<Text
																											size={0}
																											style={{
																												color:
																													'#2563eb',
																											}}
																										>
																											<strong>
																												Guidance:
																											</strong>{' '}
																											{sub.suggestion}
																										</Text>
																									)}
																								</Stack>

																								<Badge
																									tone="default"
																									fontSize={0}
																									style={{
																										flexShrink: 0,
																										fontFamily:
																											'monospace',
																									}}
																								>
																									{sub.awardedScore} /{' '}
																									{sub.maxScore} PTS
																								</Badge>
																							</Flex>
																						</Card>
																					))}
																				</Stack>
																			</Stack>
																		</Box>
																	</motion.div>
																)}
															</AnimatePresence>
														</div>
													)
												},
											)}
										</div>
									</Card>
								</motion.div>
							)}

							{/* =====================================================================
							    TAB 3: CRITICAL COMPLIANCE GATES (P0 & P1)
							    ===================================================================== */}
							{activeTab === 'gates' && (
								<motion.div
									key="gates"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Stack space={3}>
										<Card
											padding={3}
											radius={2}
											tone={auditResult.gates.allPassed ? 'positive' : 'critical'}
											border
										>
											<Flex align="center" gap={2}>
												{auditResult.gates.allPassed ? (
													<CheckmarkCircleIcon
														style={{ fontSize: '20px', color: '#10b981' }}
													/>
												) : (
													<CloseCircleIcon
														style={{ fontSize: '20px', color: '#ef4444' }}
													/>
												)}
												<Stack space={1}>
													<Text size={1} weight="bold">
														{auditResult.gates.allPassed
															? 'All Critical Compliance Gates Certified'
															: 'Compliance & Technical Blockers Detected'}
													</Text>
													<Text size={0} muted>
														{auditResult.gates.allPassed
															? 'Zero regulatory or indexation blockers. Document qualifies for publication certification.'
															: 'Critical blockers have absolute veto power. Articles cannot be certified as Publish-Ready while gates fail.'}
													</Text>
												</Stack>
											</Flex>
										</Card>

										{/* Gates List */}
										<Stack space={2}>
											{auditResult.gates.items.map((gate: GateResult) => (
												<Card
													key={gate.id}
													padding={3}
													radius={2}
													border
													tone="default"
													style={{
														borderLeft: `4px solid ${
															gate.passed
																? '#10b981'
																: gate.severity === 'P0_CRITICAL'
																	? '#ef4444'
																	: '#f59e0b'
														}`,
													}}
												>
													<Flex align="flex-start" justify="space-between" gap={3}>
														<Flex align="flex-start" gap={2.5} style={{ flex: 1 }}>
															<div style={{ marginTop: '2px', flexShrink: 0 }}>
																{gate.passed ? (
																	<CheckmarkCircleIcon
																		style={{
																			fontSize: '18px',
																			color: '#10b981',
																		}}
																	/>
																) : (
																	<CloseCircleIcon
																		style={{
																			fontSize: '18px',
																			color: '#ef4444',
																		}}
																	/>
																)}
															</div>

															<Stack space={1} style={{ flex: 1, minWidth: 0 }}>
																<Flex align="center" gap={2} wrap="wrap">
																	<Badge
																		tone={
																			gate.severity === 'P0_CRITICAL'
																				? 'critical'
																				: 'caution'
																		}
																		fontSize={0}
																	>
																		{gate.code}
																	</Badge>
																	<Badge
																		tone={gate.passed ? 'positive' : 'critical'}
																		fontSize={0}
																	>
																		{gate.passed ? 'PASSED' : 'BLOCKED'}
																	</Badge>
																	<Text size={1} weight="semibold">
																		{gate.label}
																	</Text>
																</Flex>

																<Text size={0} muted>
																	<strong>Evidence:</strong> {gate.evidence}
																</Text>

																{!gate.passed && gate.fixAction && (
																	<Text
																		size={0}
																		style={{
																			color: '#ef4444',
																			fontWeight: 500,
																		}}
																	>
																		<strong>Required Action:</strong>{' '}
																		{gate.fixAction}
																	</Text>
																)}
															</Stack>
														</Flex>
													</Flex>
												</Card>
											))}
										</Stack>
									</Stack>
								</motion.div>
							)}

							{/* =====================================================================
							    TAB 4: SHAREABLE EXECUTIVE REPORT
							    ===================================================================== */}
							{activeTab === 'report' && (
								<motion.div
									key="report"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
								>
									<Stack space={3}>
										<Flex justify="space-between" align="center">
											<Text size={1} weight="bold">
												Executive Markdown Audit Report
											</Text>
											<Button
												icon={copiedReport ? CheckmarkIcon : ClipboardIcon}
												tone={copiedReport ? 'positive' : 'primary'}
												text={copiedReport ? 'Report Copied' : 'Copy Report'}
												fontSize={1}
												padding={2}
												onClick={handleCopyReport}
											/>
										</Flex>

										<Card
											padding={3}
											radius={2}
											tone="default"
											border
											style={{
												maxHeight: '340px',
												overflowY: 'auto',
												background: 'rgba(0,0,0,0.03)',
												fontFamily: 'monospace',
												fontSize: '12px',
												whiteSpace: 'pre-wrap',
												lineHeight: 1.5,
											}}
										>
											{generateAuditMarkdownReport(
												auditResult,
												doc.title || doc.metadata?.title || 'Article',
											)}
										</Card>

										<Text size={0} muted>
											This standardized report can be attached to editorial review
											tickets, client sign-off briefs, or compliance records.
										</Text>
									</Stack>
								</motion.div>
							)}

							{/* =====================================================================
							    MODAL FOOTER ACTIONS
							    ===================================================================== */}
							<Flex
								justify="space-between"
								align="center"
								gap={2}
								paddingTop={2}
								style={{
									borderTop:
										'1px solid var(--card-border-color, rgba(0,0,0,0.1))',
								}}
							>
								<Button
									icon={SyncIcon}
									mode="ghost"
									tone="default"
									text="Re-run Audit"
									onClick={runScan}
								/>
								<Flex gap={2}>
									<Button
										icon={copiedReport ? CheckmarkIcon : ClipboardIcon}
										mode="ghost"
										tone="default"
										text={copiedReport ? 'Copied' : 'Copy Report'}
										onClick={handleCopyReport}
									/>
									<Button tone="primary" text="Close" onClick={onClose} />
								</Flex>
							</Flex>
						</Stack>
					</motion.div>
				)}
			</AnimatePresence>
		</Box>
	)
}
