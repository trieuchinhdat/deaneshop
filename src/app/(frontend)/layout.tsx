import CookiePreferences from '@/ui/cookie-preferences'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { stegaClean } from 'next-sanity'
import { getActiveFontClasses } from '@/lib/fonts'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { preconnect } from 'react-dom'
import { dev } from '@/lib/env'
import Footer from '@/ui/footer'
import Header from '@/ui/header'
import VisualEditing from '@/ui/visual-editing'
import '@/app.css'
import { getFooterSettings, getPopupSettings, getSite } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import ChatBoxWrapper from '@/ui/chatbox-wrapper'
import OrganizationJsonLd from '@/ui/organization-json-ld'
import PopupModal from '@/ui/popup/popup-modal'
import { FiTool, FiPhone, FiMail, FiClock } from 'react-icons/fi'
import ThemeProvider from '@/ui/theme-provider'
import { ThemeMotionProvider } from '@/ui/motion/theme-motion'
import TrackingScripts from '@/ui/tracking-scripts'
import ScrollToTop from '@/ui/scroll-to-top'
import JourneyTracker from '@/ui/journey-tracker'
import WebVitalsReporter from '@/ui/web-vitals-reporter'
import StaticRuntimeNavigation from '@/ui/static-runtime-navigation'

export async function generateMetadata(): Promise<Metadata> {
	const site = await getSite()

	// Optimized image URLs with exact dimensions for fastest PageSpeed
	const faviconUrl = site?.favicon
		? urlFor(site.favicon).width(64).height(64).fit('crop').auto('format').url()
		: '/favicon.ico'

	const appleIconUrl = site?.appleTouchIcon
		? urlFor(site.appleTouchIcon).width(180).height(180).fit('crop').auto('format').url()
		: undefined

	const ogImageUrl = site?.defaultOgImage
		? urlFor(site.defaultOgImage).width(1200).height(630).fit('crop').auto('format').url()
		: undefined

	const brandName = site?.siteName || site?.title || 'Store'
	const pageTitle = site?.title || brandName
	const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://deanflow.com'
	const baseUrl = rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`

	return {
		metadataBase: new URL(baseUrl),
		title: {
			default: pageTitle,
			template: `%s | ${brandName}`,
		},
		description: site?.defaultSeoDescription || 'Official online store delivering premium products and lifestyle goods.',
		icons: {
			icon: faviconUrl,
			apple: appleIconUrl,
		},
		openGraph: {
			title: pageTitle,
			description: site?.defaultSeoDescription || 'Official online store delivering premium products.',
			images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
		},
		verification: {
			google: site?.googleSiteVerification || undefined,
		},
	}
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	// Preconnect to essential asset CDNs
	preconnect('https://cdn.sanity.io')

	const [data, footerSettings, popupSettings] = await Promise.all([
		getSite(),
		getFooterSettings(),
		getPopupSettings(),
	])

	const theme = {
		...(data?.theme || {}),
		footerBackground: footerSettings?.footerBackground,
		footerText: footerSettings?.footerText,
	}
	const tracking = data?.scripts
	const chatItems = (data as any)?.chatbox?.items || []

	// Selective font loading: Only load the exact fonts used on the page for maximum PageSpeed
	const activeFontClasses = getActiveFontClasses(
		stegaClean(data?.theme?.fontBody) || undefined,
		stegaClean(data?.theme?.fontHeading) || undefined,
	)

	// Motion & Micro-interaction Tokens
	const isMotionEnabled = theme?.enableMotion !== false
	const buttonHoverEffect = isMotionEnabled ? (stegaClean(theme?.buttonHoverEffect) || 'scale-subtle') : 'none'
	const bannerHoverEffect = isMotionEnabled ? (stegaClean(theme?.bannerHoverEffect) || 'zoom') : 'none'
	const motionPhysics = stegaClean(theme?.motionPhysics) || 'smooth'

	// Maintenance Mode Fullscreen Screen
	if (data?.maintenanceMode) {
		return (
			<html lang="en" className={activeFontClasses} suppressHydrationWarning>
				<body
					className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-white px-4"
					suppressHydrationWarning
				>
					<div className="relative w-full max-w-xl p-8 md:p-12 text-center rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 shadow-inner">
							<FiTool className="text-2xl animate-pulse" />
						</div>

						<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
							{data.title || 'Under Maintenance'}
						</h1>

						<p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed">
							Our website is currently undergoing scheduled maintenance and performance upgrades. We apologize for the inconvenience and will be back online shortly!
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 border-y border-slate-800/80 mb-6 text-sm text-slate-300">
							{data.hotline && (
								<div className="flex items-center gap-2">
									<span className="text-slate-400 flex items-center gap-1.5"><FiPhone className="text-emerald-400" /> Hotline:</span>
									<a href={`tel:${data.hotline}`} className="font-semibold text-emerald-400 hover:underline">
										{data.hotline}
									</a>
								</div>
							)}
							{data.hotline && data.email && <span className="hidden sm:inline text-slate-600">•</span>}
							{data.email && (
								<div className="flex items-center gap-2">
									<span className="text-slate-400 flex items-center gap-1.5"><FiMail className="text-emerald-400" /> Email:</span>
									<a href={`mailto:${data.email}`} className="font-semibold text-emerald-400 hover:underline">
										{data.email}
									</a>
								</div>
							)}
						</div>

						{data.workingHours && (
							<p className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1.5">
								<FiClock className="text-slate-500" /> Working Hours: {data.workingHours}
							</p>
						)}

						<div className="mt-8 text-xs text-slate-400">
							&copy; {new Date().getFullYear()} {data.companyName || data.siteName || data.title || 'Store'}. All rights reserved.
						</div>
					</div>
				</body>
			</html>
		)
	}

	return (
		<html lang="en" className={activeFontClasses} suppressHydrationWarning>
			<head>
				<OrganizationJsonLd site={data} />
			</head>
			<body
				className="bg-background text-foreground font-sans antialiased"
				data-motion-enabled={isMotionEnabled ? 'true' : 'false'}
				data-button-hover={buttonHoverEffect}
				data-banner-hover={bannerHoverEffect}
				data-motion-physics={motionPhysics}
				suppressHydrationWarning
			>
				{tracking && <TrackingScripts scripts={tracking} />}

				<ThemeProvider theme={theme} />

				<ThemeMotionProvider
					tokens={{
						enableMotion: isMotionEnabled,
						buttonHoverEffect: buttonHoverEffect as any,
						bannerHoverEffect: bannerHoverEffect as any,
						motionPhysics: motionPhysics as any,
					}}
				>
					<NuqsAdapter>
						<StaticRuntimeNavigation />
						<CookiePreferences />
						<JourneyTracker />
						<WebVitalsReporter />
						<ScrollToTop />
						<div className="flex min-h-screen flex-col print:min-h-0 print:block">
							<Header />
							<main id="main-content" className="grow print:grow-0">{children}</main>
							<Footer />
						</div>

						<ChatBoxWrapper
							enabled={data?.widgetEnabled !== false}
							floatingButtons={data?.floatingButtons || undefined}
							position={data?.widgetPosition || undefined}
							displayMode={data?.displayMode || undefined}
							deviceVisibility={data?.deviceVisibility || undefined}
							triggerMode={data?.triggerMode || undefined}
							themeStyle={data?.themeStyle || undefined}
							onlineBadge={data?.onlineBadge !== false}
							bottomOffsetMobile={data?.bottomOffsetMobile || undefined}
							customBottomOffsetMobile={data?.customBottomOffsetMobile || undefined}
							bottomOffsetDesktop={data?.bottomOffsetDesktop || undefined}
							customBottomOffsetDesktop={data?.customBottomOffsetDesktop || undefined}
							mobileDisplayStyle={data?.mobileDisplayStyle || undefined}
							mainButtonLabel={data?.mainButtonLabel || undefined}
							mainButtonIcon={data?.mainButtonIcon || undefined}
							items={chatItems}
						/>

						<PopupModal settings={data?.popup || popupSettings} />

						<VisualEditing />
						{!dev && process.env.VERCEL && <Analytics />}
					</NuqsAdapter>
				</ThemeMotionProvider>
			</body>
		</html>
	)
}
