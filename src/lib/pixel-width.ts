/**
 * Global Multi-Script Pixel Width Estimator (Latin, Vietnamese, German, CJK)
 * Used on both Server (API route) and Client (Sanity Studio UI) for SERP simulation.
 * - 'title': ~20px font (SERP Title cutoff ~580-600px, 50-70 chars)
 * - 'description': ~13-14px font (SERP snippet cutoff ~650-1180px, 140-200 chars)
 */
export function getGlobalPixelWidth(
	text: string,
	type: 'title' | 'description' = 'title',
): number {
	if (!text) return 0
	let width = 0
	const isDesc = type === 'description'
	for (const char of text) {
		// CJK characters (Chinese, Japanese, Korean) -> Title ~18px, Desc ~13px
		if (
			/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7af]/.test(
				char,
			)
		) {
			width += isDesc ? 13 : 18
		} else if (/[A-ZMW@]/.test(char)) {
			width += isDesc ? 8 : 11 // Wide capital Latin
		} else if (/[il1.,'|! ]/.test(char)) {
			width += isDesc ? 3.2 : 4.5 // Narrow punctuation / glyphs
		} else {
			width += isDesc ? 5.8 : 8.5 // Average Latin, Vietnamese, Cyrillic glyphs
		}
	}
	return Math.round(width)
}
