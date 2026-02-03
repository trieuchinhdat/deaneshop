'use client'

import Script from 'next/script'

type ScriptAttribute = {
	key?: string | null
	value?: string | null
}

type TrackingScriptItem = {
	_key: string
	title?: string | null
	isActive?: boolean | null
	location?: 'head' | 'body' | string | null
	strategy?:
		| 'afterInteractive'
		| 'lazyOnload'
		| 'beforeInteractive'
		| string
		| null
	scriptType?: 'inline' | 'url' | string | null
	src?: string | null
	code?: string | null
	attributes?: ScriptAttribute[] | null
}

export default function TrackingScripts({
	scripts,
}: {
	scripts: TrackingScriptItem[] | undefined | null
}) {
	if (!scripts || scripts.length === 0) return null

	const activeScripts = scripts.filter((s) => s.isActive === true)

	return (
		<>
			{activeScripts.map((script) => {
				// 1. Xử lý Attributes
				const extraAttributes =
					script.attributes?.reduce(
						(acc, curr) => {
							// Chỉ lấy khi có key (và key không null)
							if (curr.key) {
								// Nếu value null thì lấy chuỗi rỗng
								acc[curr.key] = curr.value || ''
							}
							return acc
						},
						{} as Record<string, string>,
					) || {}

				// 2. Xử lý Strategy
				let finalStrategy = script.strategy || 'afterInteractive'
				if (script.location === 'body' && !script.strategy) {
					finalStrategy = 'lazyOnload'
				}

				// Ép kiểu strategy
				const strategyProp = finalStrategy as
					| 'afterInteractive'
					| 'lazyOnload'
					| 'beforeInteractive'

				// CASE A: External URL
				// 👇 FIX 2: Check kỹ script.src (phải có giá trị string)
				if (script.scriptType === 'url' && script.src) {
					return (
						<Script
							key={script._key}
							id={`script-${script._key}`}
							// 👇 QUAN TRỌNG: script.src có thể là null,
							// nhưng <Script> chỉ nhận undefined. Ta dùng || undefined để convert.
							src={script.src || undefined}
							strategy={strategyProp}
							{...(extraAttributes as any)}
						/>
					)
				}

				// CASE B: Inline Code
				// 👇 FIX 3: Check kỹ script.code
				if (script.scriptType === 'inline' && script.code) {
					return (
						<Script
							key={script._key}
							id={`script-${script._key}`}
							strategy={strategyProp}
							// 👇 QUAN TRỌNG: convert null -> empty string
							dangerouslySetInnerHTML={{ __html: script.code || '' }}
							{...(extraAttributes as any)}
						/>
					)
				}

				return null
			})}
		</>
	)
}
