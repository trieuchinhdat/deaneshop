'use client'

import React, { useCallback } from 'react'
import type { ObjectItemProps } from 'sanity'
import { PatchEvent, set, unset } from 'sanity'
import { Box, Button, Flex, Tooltip, Text } from '@sanity/ui'
import { EyeClosedIcon, EyeOpenIcon } from '@sanity/icons'

export default function ModuleItem(props: ObjectItemProps) {
	const isHidden = Boolean(
		(props.value as any)?.hidden || (props.value as any)?.attributes?.hidden,
	)

	const handleToggle = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			const nextHidden = !isHidden

			if (nextHidden) {
				props.inputProps.onChange(PatchEvent.from(set(true, ['hidden'])))
			} else {
				props.inputProps.onChange(
					PatchEvent.from([unset(['hidden']), unset(['attributes', 'hidden'])]),
				)
			}
		},
		[isHidden, props.inputProps],
	)

	return (
		<Flex
			align="center"
			gap={2}
			style={{
				opacity: isHidden ? 0.45 : 1,
				transition: 'opacity 0.2s ease',
			}}
		>
			<Box flex={1} style={{ minWidth: 0 }}>
				{props.renderDefault(props)}
			</Box>
			<Tooltip
				content={
					<Text size={1}>
						{isHidden
							? 'Module is hidden (click to show)'
							: 'Click to hide module from page'}
					</Text>
				}
				fallbackPlacements={['top', 'bottom']}
				placement="left"
				portal
			>
				<Button
					icon={isHidden ? EyeClosedIcon : EyeOpenIcon}
					mode={isHidden ? 'ghost' : 'bleed'}
					tone={isHidden ? 'caution' : 'default'}
					fontSize={1}
					padding={2}
					onClick={handleToggle}
					title={
						isHidden
							? 'Module is hidden (click to show)'
							: 'Click to hide module from page'
					}
					aria-label={isHidden ? 'Show module' : 'Hide module'}
				/>
			</Tooltip>
		</Flex>
	)
}
