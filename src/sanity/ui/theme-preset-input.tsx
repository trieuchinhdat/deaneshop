'use client'

import { set, type ObjectInputProps } from 'sanity'
import { Box, Button, Card, Flex, Grid, Stack, Text } from '@sanity/ui'
import React, { useCallback, useState } from 'react'
import { FiCheck, FiZap } from 'react-icons/fi'

export const THEME_PRESETS_DATA: Record<
	string,
	{
		title: string
		description: string
		primaryColor: string
		onPrimaryColor: string
		secondaryColor: string
		onSecondaryColor: string
		ctaColor: string
		onCtaColor: string
		backgroundColor: string
		surfaceColor: string
		textColor: string
		textMutedColor: string
		noteBackground: string
		noteTextColor: string
		successColor: string
		warningColor: string
		destructiveColor: string
		borderColor: string
		ringColor: string
		borderRadius: string
		shadowStyle: string
		fontHeading: string
		fontBody: string
	}
> = {
	eco: {
		title: 'Eco Fresh',
		description: '',
		primaryColor: '#059669',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#10b981',
		onSecondaryColor: '#ffffff',
		ctaColor: '#ea580c',
		onCtaColor: '#ffffff',
		backgroundColor: '#ffffff',
		surfaceColor: '#f9fafb',
		textColor: '#111827',
		textMutedColor: '#6b7280',
		noteBackground: '#f3f4f6',
		noteTextColor: '#374151',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#ef4444',
		borderColor: '#e5e7eb',
		ringColor: '#059669',
		borderRadius: 'md',
		shadowStyle: 'subtle',
		fontHeading: 'Outfit',
		fontBody: 'Plus Jakarta Sans',
	},
	luxury: {
		title: 'Luxury',
		description: '',
		primaryColor: '#18181b',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#27272a',
		onSecondaryColor: '#ffffff',
		ctaColor: '#d97706',
		onCtaColor: '#ffffff',
		backgroundColor: '#fafafa',
		surfaceColor: '#ffffff',
		textColor: '#09090b',
		textMutedColor: '#71717a',
		noteBackground: '#f4f4f5',
		noteTextColor: '#27272a',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#ef4444',
		borderColor: '#e4e4e7',
		ringColor: '#18181b',
		borderRadius: 'none',
		shadowStyle: 'subtle',
		fontHeading: 'Playfair Display',
		fontBody: 'Plus Jakarta Sans',
	},
	ocean: {
		title: 'Ocean Breeze',
		description: '',
		primaryColor: '#0284c7',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#0ea5e9',
		onSecondaryColor: '#ffffff',
		ctaColor: '#f43f5e',
		onCtaColor: '#ffffff',
		backgroundColor: '#f0f9ff',
		surfaceColor: '#ffffff',
		textColor: '#0c4a6e',
		textMutedColor: '#64748b',
		noteBackground: '#e0f2fe',
		noteTextColor: '#0369a1',
		successColor: '#059669',
		warningColor: '#eab308',
		destructiveColor: '#e11d48',
		borderColor: '#bae6fd',
		ringColor: '#0284c7',
		borderRadius: 'lg',
		shadowStyle: 'elevated',
		fontHeading: 'Montserrat',
		fontBody: 'Inter',
	},
	warm: {
		title: 'Warm Earth',
		description: '',
		primaryColor: '#78350f',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#92400e',
		onSecondaryColor: '#ffffff',
		ctaColor: '#c2410c',
		onCtaColor: '#ffffff',
		backgroundColor: '#fefce8',
		surfaceColor: '#ffffff',
		textColor: '#451a03',
		textMutedColor: '#78716c',
		noteBackground: '#fef3c7',
		noteTextColor: '#92400e',
		successColor: '#15803d',
		warningColor: '#d97706',
		destructiveColor: '#b91c1c',
		borderColor: '#fde68a',
		ringColor: '#78350f',
		borderRadius: 'md',
		shadowStyle: 'subtle',
		fontHeading: 'Lora',
		fontBody: 'Nunito Sans',
	},
	violet: {
		title: 'Vibrant Purple',
		description: '',
		primaryColor: '#7c3aed',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#9333ea',
		onSecondaryColor: '#ffffff',
		ctaColor: '#db2777',
		onCtaColor: '#ffffff',
		backgroundColor: '#faf5ff',
		surfaceColor: '#ffffff',
		textColor: '#3b0764',
		textMutedColor: '#6b7280',
		noteBackground: '#f3e8ff',
		noteTextColor: '#6b21a8',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#f43f5e',
		borderColor: '#e9d5ff',
		ringColor: '#7c3aed',
		borderRadius: 'full',
		shadowStyle: 'elevated',
		fontHeading: 'Space Grotesk',
		fontBody: 'Be Vietnam Pro',
	},
}

export default function ThemePresetInput(props: ObjectInputProps) {
	const { value = {} as any, onChange, renderDefault } = props
	const currentPreset = (value as any)?.preset || 'eco'
	const [appliedPreset, setAppliedPreset] = useState<string | null>(null)

	const applyPreset = useCallback(
		(presetKey: string) => {
			if (presetKey === 'custom') {
				onChange(set({ ...(value || {}), preset: 'custom' }))
				return
			}

			const p = THEME_PRESETS_DATA[presetKey]
			if (!p) return

			// Dispatch batch patches to populate all fields atomically
			onChange(
				set({
					...(value || {}),
					preset: presetKey,
					primaryColor: p.primaryColor,
					onPrimaryColor: p.onPrimaryColor,
					secondaryColor: p.secondaryColor,
					onSecondaryColor: p.onSecondaryColor,
					ctaColor: p.ctaColor,
					onCtaColor: p.onCtaColor,
					backgroundColor: p.backgroundColor,
					surfaceColor: p.surfaceColor,
					textColor: p.textColor,
					textMutedColor: p.textMutedColor,
					noteBackground: p.noteBackground,
					noteTextColor: p.noteTextColor,
					successColor: p.successColor,
					warningColor: p.warningColor,
					destructiveColor: p.destructiveColor,
					borderColor: p.borderColor,
					ringColor: p.ringColor,
					borderRadius: p.borderRadius,
					shadowStyle: p.shadowStyle,
					fontHeading: p.fontHeading,
					fontBody: p.fontBody,
				}),
			)

			setAppliedPreset(presetKey)
			setTimeout(() => setAppliedPreset(null), 2000)
		},
		[value, onChange],
	)

	return (
		<Stack space={4}>
			<Card padding={3} radius={2} tone="primary" border>
				<Stack space={3}>
					<Flex align="center" justify="space-between">
						<Stack space={1}>
							<Text weight="bold" size={1}>
								Auto Color Palette Generator
							</Text>
						</Stack>
					</Flex>

					<Grid columns={[1, 2, 3]} gap={2}>
						{Object.entries(THEME_PRESETS_DATA).map(([key, p]) => {
							const isSelected = currentPreset === key
							const isJustApplied = appliedPreset === key

							return (
								<Card
									key={key}
									padding={3}
									radius={2}
									border
									tone={isSelected ? 'primary' : 'default'}
									style={{
										cursor: 'pointer',
										transition: 'all 0.15s ease',
										borderColor: isSelected ? '#059669' : undefined,
									}}
									onClick={() => applyPreset(key)}
								>
									<Stack space={2}>
										<Flex align="center" justify="space-between">
											<Text weight="bold" size={1}>
												{p.title}
											</Text>
											{isSelected && (
												<Text size={1} style={{ color: '#059669' }}>
													<FiCheck />
												</Text>
											)}
										</Flex>

										{/* Swatches preview */}
										<Flex gap={1} align="center">
											<Box
												style={{
													width: 20,
													height: 20,
													borderRadius: 4,
													backgroundColor: p.primaryColor,
													border: '1px solid rgba(0,0,0,0.1)',
												}}
												title={`Primary: ${p.primaryColor}`}
											/>
											<Box
												style={{
													width: 20,
													height: 20,
													borderRadius: 4,
													backgroundColor: p.secondaryColor,
													border: '1px solid rgba(0,0,0,0.1)',
												}}
												title={`Secondary: ${p.secondaryColor}`}
											/>
											<Box
												style={{
													width: 20,
													height: 20,
													borderRadius: 4,
													backgroundColor: p.ctaColor,
													border: '1px solid rgba(0,0,0,0.1)',
												}}
												title={`CTA: ${p.ctaColor}`}
											/>
											<Box
												style={{
													width: 20,
													height: 20,
													borderRadius: 4,
													backgroundColor: p.backgroundColor,
													border: '1px solid #ccc',
												}}
												title={`Background: ${p.backgroundColor}`}
											/>
											<Box
												style={{
													width: 20,
													height: 20,
													borderRadius: 4,
													backgroundColor: p.textColor,
													border: '1px solid rgba(0,0,0,0.1)',
												}}
												title={`Text: ${p.textColor}`}
											/>
										</Flex>

										<Text size={0} muted>
											{p.description}
										</Text>

										<Button
											fontSize={1}
											padding={2}
											text={isJustApplied ? 'Applied!' : 'Apply Preset'}
											icon={isJustApplied ? FiCheck : FiZap}
											tone={isSelected ? 'primary' : 'default'}
											mode={isSelected ? 'default' : 'ghost'}
											onClick={(e) => {
												e.stopPropagation()
												applyPreset(key)
											}}
										/>
									</Stack>
								</Card>
							)
						})}
					</Grid>
				</Stack>
			</Card>

			{/* Render standard Sanity fieldsets and fields */}
			{renderDefault(props)}
		</Stack>
	)
}
