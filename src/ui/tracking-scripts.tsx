'use client'

import { useConsentStore } from '@/store/use-consent-store'
import { useEffect, useState } from 'react'
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
	const marketing = useConsentStore(s => s.marketing)
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])
	if (!mounted || !marketing) return null
	if (!scripts || scripts.length === 0) return null

	const activeScripts = scripts.filter((s) => s.isActive === true)

	return (
		<>
			{activeScripts.map((script) => {
				// 1. Process Attributes
				const extraAttributes =
					script.attributes?.reduce(
						(acc, curr) => {
							if (curr.key) {
								acc[curr.key] = curr.value || ''
							}
							return acc
						},
						{} as Record<string, string>,
					) || {}

				// 2. Process Strategy
				let finalStrategy = script.strategy || 'afterInteractive'
				if (script.location === 'body' && !script.strategy) {
					finalStrategy = 'lazyOnload'
				}

				// Cast strategy type
				const strategyProp = finalStrategy as
					| 'afterInteractive'
					| 'lazyOnload'
					| 'beforeInteractive'

				// CASE A: External URL
				if (script.scriptType === 'url' && script.src) {
					return (
						<Script
							key={script._key}
							id={`script-${script._key}`}
							src={script.src || undefined}
							strategy={strategyProp}
							{...(extraAttributes as any)}
						/>
					)
				}

				// CASE B: Inline Code
				if (script.scriptType === 'inline' && script.code) {
					return (
						<Script
							key={script._key}
							id={`script-${script._key}`}
							strategy={strategyProp}
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
