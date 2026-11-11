import type { Metadata, Viewport } from 'next'
import '@/app.css'

const brandName = process.env.NEXT_PUBLIC_SITE_NAME || 'Store'

export const metadata: Metadata = {
	title: `Lead Workspace | ${brandName}`,
	description:
		'Lead qualification, website activity, acquisition insights, and timely customer follow-ups.',
	robots: {
		index: false,
		follow: false,
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
	themeColor: '#f8fafc',
}

export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className="h-full bg-slate-50" suppressHydrationWarning>
			<body
				className="min-h-screen bg-slate-50/70 text-slate-900 antialiased font-sans flex flex-col selection:bg-emerald-600 selection:text-white"
				suppressHydrationWarning
			>
				{children}
			</body>
		</html>
	)
}
