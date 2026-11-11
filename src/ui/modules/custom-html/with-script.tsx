'use client'

import { useEffect, useRef } from 'react'

export interface WithScriptProps extends React.ComponentProps<'div'> {
	code?: string
	executeScripts?: boolean
}

/**
 * Extracts and executes <script> tags on client-side mount,
 * while ensuring non-script HTML is rendered immediately during SSR to prevent layout shifts.
 */
export default function WithScript({
	code,
	executeScripts = true,
	className,
	...props
}: WithScriptProps) {
	if (!code) return null

	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!executeScripts || !code) return

		const container = containerRef.current
		if (!container) return

		// Parse the code snippet to find all script elements
		const parser = new DOMParser()
		const doc = parser.parseFromString(code, 'text/html')
		const scripts = Array.from(doc.querySelectorAll('script'))

		if (scripts.length === 0) return

		const createdScripts: HTMLScriptElement[] = []
		let isCancelled = false

		const executeAllScripts = async () => {
			for (const oldScript of scripts) {
				if (isCancelled) break

				const newScript = document.createElement('script')

				// Preserve all script attributes (src, type, async, defer, id, data-*, etc.)
				Array.from(oldScript.attributes).forEach((attr) => {
					newScript.setAttribute(attr.name, attr.value)
				})

				if (oldScript.src) {
					// External script handling with deduplication check
					await new Promise<void>((resolve) => {
						const safeSrc = oldScript.src.replace(/["\\]/g, '\\$&')
						const existingScript = document.querySelector(
							`script[src="${safeSrc}"]`,
						)

						if (existingScript) {
							// If already present in DOM, continue
							resolve()
							return
						}

						newScript.onload = () => resolve()
						newScript.onerror = () => resolve() // Continue even if one script fails

						container.appendChild(newScript)
						createdScripts.push(newScript)
					})
				} else {
					// Inline script execution
					newScript.text = oldScript.textContent || ''
					container.appendChild(newScript)
					createdScripts.push(newScript)
				}
			}
		}

		executeAllScripts()

		return () => {
			isCancelled = true
			createdScripts.forEach((s) => {
				try {
					s.remove()
				} catch {
					// Element may have already been cleaned up
				}
			})
		}
	}, [code, executeScripts])

	// Strip <script> tags for initial HTML render so static structure renders immediately
	// without inert script tags polluting the DOM before client hydration
	const sanitizedHtml = code.replace(
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		'',
	)

	return (
		<div
			ref={containerRef}
			className={className}
			dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
			{...props}
		/>
	)
}
