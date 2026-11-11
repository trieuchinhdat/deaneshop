'use client'

import config from '@@/sanity.config'
import { NextStudio } from 'next-sanity/studio/client-component'

export default function StudioClient() {
	return (
		<>
			<script
				src="https://core.sanity-cdn.com/bridge.js"
				async
				type="module"
				data-sanity-core="true"
			/>
			<NextStudio config={config} />
		</>
	)
}

