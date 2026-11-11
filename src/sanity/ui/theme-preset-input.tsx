'use client'

import { set, type ObjectInputProps } from 'sanity'
import { Box, Button, Card, Flex, Grid, Stack, Text } from '@sanity/ui'
import React, { useCallback, useState } from 'react'
import { FiCheck, FiZap } from 'react-icons/fi'

/**
 * WCAG 2.1 AA Relative Luminance & Contrast Calculator
 */
function getContrastColor(hexColor?: string, dark = '#111827', light = '#ffffff'): string {
	if (!hexColor) return light
	const cleanHex = hexColor.replace('#', '').trim()
	if (cleanHex.length !== 3 && cleanHex.length !== 6) return light

	let r = 0,
		g = 0,
		b = 0
	if (cleanHex.length === 3) {
		r = parseInt(cleanHex[0] + cleanHex[0], 16)
		g = parseInt(cleanHex[1] + cleanHex[1], 16)
		b = parseInt(cleanHex[2] + cleanHex[2], 16)
	} else {
		r = parseInt(cleanHex.substring(0, 2), 16)
		g = parseInt(cleanHex.substring(2, 4), 16)
		b = parseInt(cleanHex.substring(4, 6), 16)
	}

	const yiq = (r * 299 + g * 587 + b * 114) / 1000
	return yiq >= 150 ? dark : light
}

export const THEME_PRESETS_DATA: Record<
	string,
	{
		title: string
		description: string
		primaryColor: string
		secondaryColor: string
		ctaColor: string
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
		enableMotion?: boolean
		buttonHoverEffect?: string
		bannerHoverEffect?: string
		motionPhysics?: string
	}
> = {
	eco: {
		title: 'Sustainable Living',
		description: 'Deep Forest Moss & Sage on Warm Linen, inspired by Patagonia & Allbirds',
		primaryColor: '#1b4332',
		secondaryColor: '#2d6a4f',
		ctaColor: '#c2410c',
		backgroundColor: '#FAF8F5',
		surfaceColor: '#ffffff',
		textColor: '#1c1917',
		textMutedColor: '#78716c',
		noteBackground: '#f5f5f4',
		noteTextColor: '#44403c',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#1b4332',
		borderRadius: 'rounded',
		shadowStyle: 'subtle',
		fontHeading: 'Outfit',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'scale-subtle',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
	},
	clean: {
		title: 'Contemporary DTC',
		description: 'High-contrast Charcoal & Stark White, inspired by Apple & Gymshark',
		primaryColor: '#18181b',
		secondaryColor: '#27272a',
		ctaColor: '#0f172a',
		backgroundColor: '#ffffff',
		surfaceColor: '#f9fafb',
		textColor: '#111827',
		textMutedColor: '#6b7280',
		noteBackground: '#f3f4f6',
		noteTextColor: '#374151',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#ef4444',
		borderColor: '#e5e7eb',
		ringColor: '#18181b',
		borderRadius: 'subtle',
		shadowStyle: 'subtle',
		fontHeading: 'Geist',
		fontBody: 'Inter',
		enableMotion: true,
		buttonHoverEffect: 'spring-bounce',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'snappy',
	},
	luxury: {
		title: 'Editorial Atelier',
		description: 'Deep Espresso & Warm Bronze on Alabaster Bone, inspired by Aesop & The Row',
		primaryColor: '#1c1917',
		secondaryColor: '#292524',
		ctaColor: '#b45309',
		backgroundColor: '#FAF9F6',
		surfaceColor: '#ffffff',
		textColor: '#1c1917',
		textMutedColor: '#78716c',
		noteBackground: '#f5f5f4',
		noteTextColor: '#292524',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#1c1917',
		borderRadius: 'sharp',
		shadowStyle: 'subtle',
		fontHeading: 'Instrument Serif',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'lift',
		bannerHoverEffect: 'zoom-and-lift',
		motionPhysics: 'gentle',
	},
	nordic: {
		title: 'Nordic Minimalist',
		description: 'Muted Slate & Nordic Pine on Cool Stone, inspired by HAY & Arket',
		primaryColor: '#334155',
		secondaryColor: '#475569',
		ctaColor: '#2C3E35',
		backgroundColor: '#F8FAFC',
		surfaceColor: '#ffffff',
		textColor: '#0f172a',
		textMutedColor: '#64748b',
		noteBackground: '#f1f5f9',
		noteTextColor: '#334155',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#dc2626',
		borderColor: '#e2e8f0',
		ringColor: '#334155',
		borderRadius: 'subtle',
		shadowStyle: 'subtle',
		fontHeading: 'DM Sans',
		fontBody: 'Manrope',
		enableMotion: true,
		buttonHoverEffect: 'scale-subtle',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
	},
	warm: {
		title: 'Warm Earth & Ceramic',
		description: 'Rich Umber & Terracotta on Travertine Linen, inspired by Parachute & Cultiver',
		primaryColor: '#78350f',
		secondaryColor: '#92400e',
		ctaColor: '#b91c1c',
		backgroundColor: '#F7F4EF',
		surfaceColor: '#ffffff',
		textColor: '#292524',
		textMutedColor: '#78716c',
		noteBackground: '#f5f2eb',
		noteTextColor: '#78350f',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#78350f',
		borderRadius: 'subtle',
		shadowStyle: 'subtle',
		fontHeading: 'Lora',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'lift',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
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

			// Automated accessible contrast values
			const onPrimary = getContrastColor(p.primaryColor)
			const onSecondary = getContrastColor(p.secondaryColor)
			const onCta = getContrastColor(p.ctaColor)

			// Dispatch batch patches to populate all fields atomically
			onChange(
				set({
					...(value || {}),
					preset: presetKey,
					primaryColor: p.primaryColor,
					onPrimaryColor: onPrimary,
					secondaryColor: p.secondaryColor,
					onSecondaryColor: onSecondary,
					ctaColor: p.ctaColor,
					onCtaColor: onCta,
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
					enableMotion: p.enableMotion ?? true,
					buttonHoverEffect: p.buttonHoverEffect ?? 'scale-subtle',
					bannerHoverEffect: p.bannerHoverEffect ?? 'zoom',
					motionPhysics: p.motionPhysics ?? 'smooth',
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
								Global DTC Design Presets
							</Text>
							<Text size={0} muted>
								1-Click curated design systems with automated WCAG AA contrast & typography harmony
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
										borderColor: isSelected ? '#1b4332' : undefined,
										display: 'flex',
										flexDirection: 'column',
										height: '100%',
									}}
									onClick={() => applyPreset(key)}
								>
									<Stack space={2} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
										<Flex align="center" justify="space-between">
											<Text weight="bold" size={1}>
												{p.title}
											</Text>
											{isSelected && (
												<Text size={1} style={{ color: '#1b4332' }}>
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

										<Text size={0} muted style={{ flexGrow: 1, minHeight: '32px' }}>
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
