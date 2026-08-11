import { set, useFormValue, type ArrayOfObjectsInputProps } from 'sanity'
import { Button, Card, Flex, Stack, Text } from '@sanity/ui'
import React, { useCallback, useMemo } from 'react'
import { FiZap } from 'react-icons/fi'

type ProductOption = {
	name?: string
	values?: string[]
}

type ProductVariant = {
	_key?: string
	title?: string
	sku?: string
	price?: number
	compareAtPrice?: number
	stock?: number
	image?: any
	options?: Array<{ _key?: string; name: string; value: string }>
}

function generateKey(): string {
	return (
		Math.random().toString(36).substring(2, 10) +
		Date.now().toString(36).substring(4, 8)
	)
}

function slugify(text: string): string {
	return (text || '')
		.toString()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[đĐ]/g, 'd')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export default function VariantGeneratorInput(props: ArrayOfObjectsInputProps) {
	const { onChange, value = [], renderDefault } = props

	const rawOptions = useFormValue(['options']) as ProductOption[] | undefined
	const baseSku = useFormValue(['sku']) as string | undefined
	const basePrice = useFormValue(['price']) as number | undefined
	const baseCompareAtPrice = useFormValue(['compareAtPrice']) as
		| number
		| undefined
	const baseStock = useFormValue(['stock']) as number | undefined

	// Lọc danh sách options hợp lệ
	const validOptions = useMemo(() => {
		if (!Array.isArray(rawOptions)) return []
		return rawOptions.filter(
			(opt) =>
				opt &&
				typeof opt.name === 'string' &&
				opt.name.trim().length > 0 &&
				Array.isArray(opt.values) &&
				opt.values.length > 0,
		)
	}, [rawOptions])

	// Tính toán tích Cartesian từ danh sách options
	const combinations = useMemo(() => {
		if (validOptions.length === 0) return []

		let results: Array<Array<{ name: string; value: string }>> = [[]]

		validOptions.forEach((opt) => {
			const optName = opt.name!.trim()
			const optValues = opt.values!.map((v) => v.trim()).filter(Boolean)

			const temp: Array<Array<{ name: string; value: string }>> = []
			results.forEach((acc) => {
				optValues.forEach((val) => {
					temp.push([...acc, { name: optName, value: val }])
				})
			})
			results = temp
		})

		return results
	}, [validOptions])

	const handleGenerateVariants = useCallback(() => {
		if (combinations.length === 0) return

		const existingVariants = (value || []) as ProductVariant[]

		const newVariants: ProductVariant[] = combinations.map((comb) => {
			const title = comb.map((c) => c.value).join(' / ')

			const combWithKeys = comb.map((c) => ({
				_key: generateKey(),
				name: c.name,
				value: c.value,
			}))

			const existing = existingVariants.find((v) => {
				if (v.title && v.title.toLowerCase() === title.toLowerCase())
					return true
				if (v.options && v.options.length === comb.length) {
					return comb.every((c) =>
						v.options?.some(
							(vo) =>
								vo.name?.toLowerCase() === c.name.toLowerCase() &&
								vo.value?.toLowerCase() === c.value.toLowerCase(),
						),
					)
				}
				return false
			})

			if (existing) {
				const existingOptionsWithKeys = (existing.options || []).map(
					(o, idx) => ({
						_key: o._key || combWithKeys[idx]?._key || generateKey(),
						name: o.name,
						value: o.value,
					}),
				)

				return {
					...existing,
					_key: existing._key || generateKey(),
					title,
					options:
						existingOptionsWithKeys.length > 0
							? existingOptionsWithKeys
							: combWithKeys,
				}
			}

			const skuSuffix = comb.map((c) => slugify(c.value)).join('-')
			const generatedSku = baseSku
				? `${baseSku}-${skuSuffix}`
				: `SKU-${skuSuffix}`

			return {
				_key: generateKey(),
				title,
				sku: generatedSku,
				price: typeof basePrice === 'number' ? basePrice : 0,
				compareAtPrice: baseCompareAtPrice,
				stock: typeof baseStock === 'number' ? baseStock : 0,
				options: combWithKeys,
			}
		})

		onChange(set(newVariants as any))
	}, [
		combinations,
		value,
		baseSku,
		basePrice,
		baseCompareAtPrice,
		baseStock,
		onChange,
	])

	return (
		<Stack space={3}>
			{validOptions.length > 0 && (
				<Card padding={3} radius={2} tone="primary" border>
					<Stack space={3}>
						<Flex align="center" justify="space-between">
							<Stack space={1}>
								<Text weight="bold" size={1}>
									Trình tạo biến thể tự động (Variant Matrix Generator)
								</Text>
								<Text size={1} muted>
									Đã phát hiện {validOptions.length} nhóm thuộc tính ➔ Tự động
									tạo <strong>{combinations.length} biến thể</strong> (
									{validOptions
										.map((o) => `${o.name} (${o.values?.length})`)
										.join(' × ')}
									)
								</Text>
							</Stack>
							<Button
								icon={FiZap}
								text={`Tự động tạo ${combinations.length} Biến thể`}
								tone="primary"
								onClick={handleGenerateVariants}
							/>
						</Flex>
					</Stack>
				</Card>
			)}

			{renderDefault(props)}
		</Stack>
	)
}
