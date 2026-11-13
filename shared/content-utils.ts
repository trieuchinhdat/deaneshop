export function slug(
	str: string,
	{
		removeLeadingNumberAndHyphen,
	}: { removeLeadingNumberAndHyphen?: boolean } = {},
) {
	const result = str
		.toLowerCase()
		.normalize('NFD') // Decompose combined accented characters
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
		.replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
		.replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
		.replace(/-+/g, '-') // Collapse multiple hyphens
		.replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
		.trim()

	if (removeLeadingNumberAndHyphen) return result.replace(/^\d+-/, '')

	return result
}

export function count<T = any>(
	arr: T[] | number,
	singular: string = 'item',
	plural?: string,
) {
	const n = typeof arr === 'number' ? arr : (arr?.length ?? 0)
	return `${n} ${n === 1 ? singular : plural || singular + 's'}`
}

export function getBlockText(
	block?: {
		children?: {
			text: string
		}[]
	}[],
	lineBreakChar: string = '↵ ',
) {
	return (
		block?.reduce((a, c, i) => {
			const text = c.children?.flatMap((c) => c.text).join('') || ''
			return a + text + (i !== block.length - 1 ? lineBreakChar : '')
		}, '') || ''
	)
}
