import { stegaClean } from 'next-sanity'
import type { CustomHtml } from '@/sanity/types'
import { moduleAttributes } from '..'
import CSS from './css'
import WithScript from './with-script'

export default function ({ className, html, css, ...props }: CustomHtml) {
	if (!html?.code && !css?.code) return null

	const attributes = {
		className: stegaClean(className),
		...moduleAttributes(props),
	}

	return (
		<>
			<CSS code={stegaClean(css?.code)} />

			{html?.code &&
				(html.code.includes('<script') ? (
					<WithScript code={stegaClean(html.code)} {...attributes} />
				) : (
					<div
						dangerouslySetInnerHTML={{ __html: stegaClean(html.code) }}
						{...attributes}
					/>
				))}
		</>
	)
}
