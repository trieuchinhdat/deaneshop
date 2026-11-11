'use client'

import { useFormValue } from 'sanity'
import {
	CheckmarkCircleIcon,
	CloseCircleIcon,
	InfoOutlineIcon,
	SparklesIcon,
	WarningOutlineIcon,
} from '@sanity/icons'
import { Badge, Box, Card, Flex, Stack, Text } from '@sanity/ui'
import React from 'react'
import { auditArticle, type GeqsrAuditResult } from '@/sanity/lib/article-audit'

export default function SeoAuditPanel() {
	const doc = (useFormValue([]) as any) || {}
	const audit: GeqsrAuditResult = auditArticle(doc)

	return (
		<Card
			padding={4}
			radius={3}
			tone="default"
			border
			style={{
				marginTop: '8px',
				boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
			}}
		>
			<Stack space={4}>
				{/* Header Section */}
				<Flex
					align="center"
					justify="space-between"
					wrap="wrap"
					gap={3}
					style={{
						paddingBottom: '16px',
						borderBottom: '1px solid var(--card-border-color, rgba(0,0,0,0.1))',
					}}
				>
					<Flex align="center" gap={3}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: '36px',
								height: '36px',
								borderRadius: '10px',
								background: 'color-mix(in srgb, #2563eb 15%, transparent)',
								color: '#2563eb',
								flexShrink: 0,
							}}
						>
							<SparklesIcon style={{ fontSize: '20px' }} />
						</div>

						<Stack space={2}>
							<Text size={2} weight="bold">
								Global Editorial Quality & Search Readiness (GEQSR-1.0)
							</Text>
							<Text size={1} muted>
								Standards: US (FTC/ADA), EU (EAA), UK (ASA), WCAG 2.2 AA & Multi-Script SERP
							</Text>
						</Stack>
					</Flex>

					<Flex align="center" gap={3}>
						<Badge tone={audit.scoreTone} fontSize={2} padding={3} radius={2}>
							<strong>{audit.totalScore} / 100 PTS</strong>
						</Badge>
						<Badge tone={audit.scoreTone} fontSize={1} padding={2} radius={2}>
							{audit.scoreTier}
						</Badge>
					</Flex>
				</Flex>

				{/* Tier Readiness Summary Bar */}
				<Card
					padding={3}
					radius={2}
					tone={audit.scoreTone}
					border
					style={{
						borderLeft: `4px solid ${
							audit.scoreTone === 'positive'
								? '#10b981'
								: audit.scoreTone === 'caution'
									? '#f59e0b'
									: '#ef4444'
						}`,
					}}
				>
					<Stack space={2}>
						<Flex align="center" gap={2}>
							<InfoOutlineIcon style={{ fontSize: '16px', flexShrink: 0 }} />
							<Text size={1} weight="medium">
								{audit.tierDescription}
							</Text>
						</Flex>
						<Text size={0} muted>
							Universal 100-Point Scale (No score inflation)
						</Text>
					</Stack>
				</Card>

				{/* 12 Categories List */}
				<Stack space={2}>
					{audit.categories.map((cat) => (
						<Card
							key={cat.id}
							padding={3}
							radius={2}
							border
							tone="default"
							style={{
								background: 'var(--card-bg-color)',
							}}
						>
							<Flex align="flex-start" justify="space-between" gap={3}>
								<Flex
									align="flex-start"
									gap={2.5}
									style={{ minWidth: 0, flex: 1 }}
								>
									<div
										style={{
											marginTop: '2px',
											marginRight: '4px',
											flexShrink: 0,
										}}
									>
										{cat.level === 4 ? (
											<CheckmarkCircleIcon
												style={{ fontSize: '18px', color: '#10b981' }}
											/>
										) : cat.level >= 2 ? (
											<WarningOutlineIcon
												style={{ fontSize: '18px', color: '#f59e0b' }}
											/>
										) : (
											<CloseCircleIcon
												style={{ fontSize: '18px', color: '#ef4444' }}
											/>
										)}
									</div>

									<Box style={{ minWidth: 0, flex: 1 }}>
										<Stack space={2}>
											<Flex align="center" gap={2} wrap="wrap">
												<Badge tone="default" fontSize={0}>
													{cat.number}
												</Badge>
												<Text size={1} weight="semibold">
													{cat.name}
												</Text>
												{cat.id === 'cro-compliance' && audit.hasLegalBlocker && (
													<Badge tone="critical" fontSize={0}>
														LEGAL BLOCKER
													</Badge>
												)}
											</Flex>

											<Text size={0} muted style={{ lineHeight: 1.45 }}>
												{cat.summary}
											</Text>
										</Stack>
									</Box>
								</Flex>

								<Badge
									tone={
										cat.level === 4
											? 'positive'
											: cat.level >= 2
												? 'caution'
												: 'default'
									}
									fontSize={0}
									style={{ flexShrink: 0 }}
								>
									{cat.awardedScore} / {cat.weight} PTS
								</Badge>
							</Flex>
						</Card>
					))}
				</Stack>
			</Stack>
		</Card>
	)
}
