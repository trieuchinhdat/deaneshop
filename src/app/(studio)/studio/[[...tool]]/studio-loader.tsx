'use client'

import dynamic from 'next/dynamic'

const StudioClient = dynamic(() => import('./studio-client'), {
	ssr: false,
	loading: () => (
		<div
			style={{
				minHeight: '100vh',
				display: 'grid',
				placeItems: 'center',
				fontFamily: 'system-ui, sans-serif',
				fontSize: '0.875rem',
				color: '#666',
			}}
		>
			Loading Sanity Studio...
		</div>
	),
})

export default function StudioLoader() {
	return <StudioClient />
}

