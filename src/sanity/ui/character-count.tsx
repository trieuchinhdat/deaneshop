import type { StringInputProps, StringSchemaType } from 'sanity'
import { Flex, Stack, Text, TextArea, TextInput } from '@sanity/ui'
import React from 'react'

export default function CharacterCount({
	elementProps,
	as = 'input',
	max,
	min,
	children,
}: {
	as?: 'input' | 'textarea'
	max: number
	min?: number
	children?: React.ReactNode
} & StringInputProps<StringSchemaType>) {
	const chars = elementProps.value?.length || 0
	const Input = as === 'textarea' ? TextArea : TextInput
	const { style: elementStyle, ...restProps } = elementProps
	const customStyle: React.CSSProperties =
		as === 'textarea'
			? { resize: 'block', height: '4lh', ...(elementStyle as React.CSSProperties) }
			: (elementStyle as React.CSSProperties) || {}

	let countColor = 'inherit'
	if (chars > max) {
		countColor = 'var(--card-badge-caution-icon-color, #eab308)'
	} else if (min && chars >= min && chars <= max) {
		countColor = 'var(--card-success, #22c55e)'
	} else if (!min && chars > 0 && chars <= max) {
		countColor = 'var(--card-success, #22c55e)'
	}

	return (
		<Stack space={2}>
			<Input
				style={customStyle}
				{...restProps}
			/>
			<Flex align="center" justify="space-between">
				{children}

				<Text style={{ flexGrow: 1, textAlign: 'end' }} size={1} muted>
					<span
						style={{
							color: countColor,
							fontWeight: chars > 0 ? 600 : 'normal',
						}}
					>
						{chars}
					</span>
					/{max}
					{min ? (
						<span style={{ opacity: 0.65, marginLeft: '4px', fontSize: '11px' }}>
							(rec: {min}–{max})
						</span>
					) : null}
				</Text>
			</Flex>
		</Stack>
	)
}
