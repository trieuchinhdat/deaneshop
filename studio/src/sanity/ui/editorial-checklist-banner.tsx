'use client'

import React, { useCallback } from 'react'
import { set, unset, type ArrayOfObjectsInputProps } from 'sanity'
import { Badge, Box, Button, Card, Checkbox, Flex, Stack, Text, useToast } from '@sanity/ui'
import { FiCheck, FiCheckSquare, FiTrash2 } from 'react-icons/fi'

export default function EditorialChecklistBanner(props: ArrayOfObjectsInputProps) {
	const { value, onChange } = props
	const toast = useToast()

	const items = Array.isArray(value) ? (value as any[]) : []

	// If no checklist items exist, render nothing (invisible state)
	if (items.length === 0) {
		return null
	}

	const completedCount = items.filter((i) => i.completed).length
	const totalCount = items.length
	const percent = Math.round((completedCount / totalCount) * 100)
	const isAllCompleted = completedCount === totalCount

	const handleToggle = useCallback(
		(idx: number) => {
			const nextValue = items.map((item, i) =>
				i === idx ? { ...item, completed: !item.completed } : item,
			)
			onChange(set(nextValue))
		},
		[items, onChange],
	)

	const handleDismiss = useCallback(() => {
		onChange(unset())
		toast.push({
			status: 'info',
			title: 'Checklist Dismissed',
			description: 'Editorial checklist cleared from this page.',
		})
	}, [onChange, toast])

	return (
		<Card
			tone={isAllCompleted ? 'positive' : 'primary'}
			padding={4}
			radius={3}
			shadow={1}
			border
			style={{ marginBottom: 16 }}
		>
			<Stack space={3}>
				{/* Header & Progress Indicator */}
				<Flex justify="space-between" align="center" wrap="wrap" gap={2}>
					<Flex align="center" gap={2}>
						<FiCheckSquare style={{ fontSize: 18 }} />
						<Text size={2} weight="bold">
							AI Editorial Handoff Checklist
						</Text>
						<Badge tone={isAllCompleted ? 'positive' : 'caution'}>
							{completedCount} / {totalCount} Completed ({percent}%)
						</Badge>
					</Flex>

					<Button
						icon={FiTrash2}
						mode="ghost"
						tone="default"
						fontSize={0}
						padding={2}
						text="Dismiss"
						onClick={handleDismiss}
						title="Clear checklist when setup is complete"
					/>
				</Flex>

				{/* Progress Bar */}
				<Box
					style={{
						width: '100%',
						height: 6,
						backgroundColor: 'rgba(0, 0, 0, 0.08)',
						borderRadius: 3,
						overflow: 'hidden',
					}}
				>
					<Box
						style={{
							width: `${percent}%`,
							height: '100%',
							backgroundColor: isAllCompleted ? '#10B981' : '#2563EB',
							transition: 'width 0.3s ease-in-out',
						}}
					/>
				</Box>

				{/* Celebration Banner when 100% completed */}
				{isAllCompleted ? (
					<Card tone="positive" padding={3} radius={2} border>
						<Flex align="center" gap={2}>
							<FiCheck style={{ fontSize: 16 }} />
							<Text size={1} weight="semibold">
								All manual setup tasks completed! This landing page is ready for publish.
							</Text>
						</Flex>
					</Card>
				) : (
					<Text size={1} muted>
						Complete these quick manual actions to finalize your page setup:
					</Text>
				)}

				{/* Checklist Rows: Ultra-clean minimal step + title + location */}
				<Stack space={2}>
					{items.map((item, idx) => {
						const isChecked = Boolean(item.completed)
						const stepNum = item.step || idx + 1
						const titleText = item.actionRequired || item.title || 'Required Action'
						const location = item.targetLocation || item.location

						return (
							<Card
								key={item._key || idx}
								tone={isChecked ? 'transparent' : 'inherit'}
								padding={2}
								paddingX={3}
								radius={2}
								border
								style={{
									opacity: isChecked ? 0.6 : 1,
									transition: 'opacity 0.2s ease',
								}}
							>
								<Flex align="flex-start" gap={3}>
									{/* Checkbox Trigger */}
									<Box style={{ paddingTop: 2 }}>
										<Checkbox
											checked={isChecked}
											onChange={() => handleToggle(idx)}
											style={{ cursor: 'pointer' }}
										/>
									</Box>

									{/* Step Number + Title (Line 1) & Location (Line 2) */}
									<Stack space={1} style={{ flex: 1, minWidth: 0 }}>
										<Flex align="center" gap={2} wrap="wrap">
											<Badge tone={isChecked ? 'default' : 'primary'}>
												Step {stepNum}
											</Badge>
											<Text
												size={1}
												weight="semibold"
												style={{
													textDecoration: isChecked ? 'line-through' : 'none',
												}}
											>
												{titleText}
											</Text>
										</Flex>
										{location && (
											<Text size={0} muted>
												<em>{location}</em>
											</Text>
										)}
									</Stack>
								</Flex>
							</Card>
						)
					})}
				</Stack>
			</Stack>
		</Card>
	)
}
