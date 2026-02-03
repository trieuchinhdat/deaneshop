import { Analytics } from '@vercel/analytics/next'
import { Lora } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { preconnect } from 'react-dom'
import { dev } from '@/lib/env'
import Footer from '@/ui/footer'
import Header from '@/ui/header'
import VisualEditing from '@/ui/modules/visual-editing'
import '@/app.css'
import { getSite } from '@/sanity/lib/queries'
// 👇 Import Wrapper thay vì import dynamic trực tiếp
import ChatBoxWrapper from '@/ui/chatbox-wrapper'
import ThemeProvider from '@/ui/theme-provider'
import TrackingScripts from '@/ui/tracking-scripts'

const fontSans = Lora({
	subsets: ['vietnamese'],
	variable: '--font-sans',
	display: 'swap',
})

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	preconnect('https://cdn.sanity.io')
	preconnect('https://ic0n.dev')

	const data = await getSite()
	const theme = data?.theme
	const tracking = data?.scripts
	// Lấy data chatbox
	const chatItems = data?.chatbox?.items || []

	return (
		<html lang="vi" className={fontSans.variable}>
			<body className="bg-background text-foreground font-sans antialiased">
				{tracking && <TrackingScripts scripts={tracking} />}

				<ThemeProvider theme={theme} />

				<NuqsAdapter>
					<div className="flex min-h-screen flex-col">
						<Header />
						<main className="grow">{children}</main>
						<Footer />
					</div>

					{/* 👇 Sử dụng Wrapper */}
					<ChatBoxWrapper
						items={chatItems}
						className="fixed right-8 bottom-16 z-50"
					/>

					<VisualEditing />
					{!dev && <Analytics />}
				</NuqsAdapter>
			</body>
		</html>
	)
}
