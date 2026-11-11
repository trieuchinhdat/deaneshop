/**
 * Serialize structured data safely for `<script type="application/ld+json">`.
 * Escapes `<` as `\u003c` so `</script>` or `<!--` in user/CMS content cannot break out
 * of the script element while preserving valid JSON per RFC 8259.
 */
export function serializeJsonLd(data: unknown): string {
	const json = JSON.stringify(data)
	if (!json) return '{}'
	return json
		.replace(/</g, '\\u003c')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029')
}
