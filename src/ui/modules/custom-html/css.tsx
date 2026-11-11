'use client'

export default function CSS({
	code,
	id,
}: {
	code?: string
	id?: string
}) {
	if (!code) return null

	return (
		<style data-module="custom-html" data-scope={id}>
			{code}
		</style>
	)
}
