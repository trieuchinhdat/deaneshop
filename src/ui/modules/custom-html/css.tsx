'use client'

export default function ({ code }: { code?: string }) {
	if (!code) return null

	return (
		<style href={`custom-html-${encodeURIComponent(code)}`}>{`
			${code}
		`}</style>
	)
}
