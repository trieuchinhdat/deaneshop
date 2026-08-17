import { PortableText } from 'next-sanity'
import { getFooterSettings, getSite } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Logo from '@/ui/logo'
import SocialNavigation from '@/ui/social-navigation'
import Navigation from './navigation'
import UspBar from './usp-bar'
import NewsletterForm from './newsletter-form'
import PaymentBadges from './payment-badges'
import { Phone, Mail, MapPin, Clock, FileText } from 'lucide-react'

export default async function Footer() {
	const [site, footerSettings] = await Promise.all([
		getSite(),
		getFooterSettings(),
	])

	const currentYear = new Date().getFullYear()
	const siteTitle = (site as any)?.title || 'Ecocros'

	// Dynamic Copyright Macro Replacement
	const rawCopyright = footerSettings?.copyrightText || '© {year} {siteName}. All rights reserved.'
	const formattedCopyright = rawCopyright
		.replace(/{year}/g, currentYear.toString())
		.replace(/{siteName}/g, siteTitle)

	// Determine Color Styling (Default inherits Theme Tokens, or Custom Override)
	const isCustomColor = footerSettings?.footerThemeStyle === 'custom'
	const isDarkTheme = footerSettings?.footerThemeStyle === 'dark'
	const isLightTheme = footerSettings?.footerThemeStyle === 'light'

	const footerStyle: React.CSSProperties = isCustomColor
		? {
				backgroundColor: footerSettings?.footerBackground || undefined,
				color: footerSettings?.footerText || undefined,
			}
		: {}

	const themeClass = isDarkTheme
		? 'bg-slate-950 text-slate-100 border-slate-800'
		: isLightTheme
			? 'bg-slate-50 text-slate-900 border-slate-200'
			: 'bg-surface/50 text-foreground border-border/40'

	// Background Image & Pattern Processing
	const hasBgImage = Boolean(footerSettings?.enableBgImage && footerSettings?.backgroundImage)
	const bgImageUrl = hasBgImage && footerSettings?.backgroundImage
		? urlFor(footerSettings.backgroundImage).auto('format').fit('max').url()
		: null

	const bgDisplayMode = footerSettings?.bgDisplayMode || 'cover'
	const bgOverlayStyle = footerSettings?.bgOverlayStyle || 'dark'
	const bgOverlayOpacity = typeof footerSettings?.bgOverlayOpacity === 'number'
		? footerSettings.bgOverlayOpacity / 100
		: 0.6
	const bgBlur = footerSettings?.bgBlur || 'none'

	const blurClass = bgBlur === 'sm'
		? 'backdrop-blur-xs'
		: bgBlur === 'md'
			? 'backdrop-blur-sm'
			: bgBlur === 'lg'
				? 'backdrop-blur-md'
				: ''

	// Brand Contact Data (Inherited from Site Profile or Toggles)
	const showBrandInfo =
		footerSettings?.showHotline ||
		footerSettings?.showEmail ||
		footerSettings?.showAddress ||
		footerSettings?.showWorkingHours ||
		footerSettings?.showTaxCode

	return (
		<footer
			className={`footer relative border-t overflow-hidden transition-colors duration-300 ${themeClass}`}
			style={footerStyle}
		>
			{/* Background Image / Pattern Layer */}
			{hasBgImage && bgImageUrl && (
				<div
					className="absolute inset-0 pointer-events-none z-0"
					style={{
						backgroundImage: `url(${bgImageUrl})`,
						backgroundPosition: 'center',
						backgroundSize: bgDisplayMode === 'repeat' ? 'auto' : bgDisplayMode,
						backgroundRepeat: bgDisplayMode === 'repeat' ? 'repeat' : 'no-repeat',
					}}
				/>
			)}

			{/* Background Overlay Tint Layer (For WCAG Legibility) */}
			{hasBgImage && bgOverlayStyle !== 'none' && (
				<div
					className={`absolute inset-0 pointer-events-none z-0 ${blurClass}`}
					style={{
						backgroundColor:
							bgOverlayStyle === 'dark'
								? '#000000'
								: bgOverlayStyle === 'light'
									? '#ffffff'
									: undefined,
						backgroundImage:
							bgOverlayStyle === 'primary_gradient'
								? 'linear-gradient(to bottom right, var(--color-primary, #059669), #0f172a)'
								: undefined,
						opacity: bgOverlayOpacity,
					}}
				/>
			)}

			<div className="section relative z-1 space-y-8 py-8 md:space-y-12 md:py-12">
				{/* ================= TIER 1: USP HIGHLIGHTS BAR ================= */}
				{footerSettings?.showUspBar && (
					<UspBar items={footerSettings?.uspItems} />
				)}

				{/* ================= TIER 2: MAIN MULTI-COLUMN GRID ================= */}
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
					{/* Column 1: Brand & Contact Info */}
					<div className="flex flex-col gap-4 lg:col-span-4">
						{footerSettings?.showLogo && (
							<Logo site={site} className="[&_img]:h-9" />
						)}

						{footerSettings?.brandDescription ? (
							<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
								{footerSettings.brandDescription}
							</p>
						) : (
							<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
								{siteTitle} is dedicated to delivering conscious, sustainable lifestyle products crafted with timeless care.
							</p>
						)}

						{/* Contact Details */}
						{showBrandInfo && (
							<div className="flex flex-col gap-2 pt-2 text-sm text-muted-foreground">
								{footerSettings?.showAddress && (site as any)?.address && (
									<div className="flex items-start gap-2.5">
										<MapPin className="size-4 shrink-0 text-primary mt-0.5" />
										<span className="leading-snug">{(site as any).address}</span>
									</div>
								)}

								{footerSettings?.showHotline && (site as any)?.hotline && (
									<div className="flex items-center gap-2.5">
										<Phone className="size-4 shrink-0 text-primary" />
										<a
											href={`tel:${(site as any).hotline.replace(/\s+/g, '')}`}
											className="hover:text-primary transition-colors font-medium text-foreground"
										>
											{(site as any).hotline}
										</a>
									</div>
								)}

								{footerSettings?.showEmail && (site as any)?.email && (
									<div className="flex items-center gap-2.5">
										<Mail className="size-4 shrink-0 text-primary" />
										<a
											href={`mailto:${(site as any).email}`}
											className="hover:text-primary transition-colors"
										>
											{(site as any).email}
										</a>
									</div>
								)}

								{footerSettings?.showWorkingHours && (site as any)?.workingHours && (
									<div className="flex items-center gap-2.5">
										<Clock className="size-4 shrink-0 text-primary" />
										<span>{(site as any).workingHours}</span>
									</div>
								)}

								{footerSettings?.showTaxCode && (site as any)?.taxCode && (
									<div className="flex items-center gap-2.5">
										<FileText className="size-4 shrink-0 text-primary" />
										<span>Tax ID: {(site as any).taxCode}</span>
									</div>
								)}
							</div>
						)}

						{/* Social Media Links */}
						{footerSettings?.showSocialLinks && (
							<div className="pt-2">
								<SocialNavigation socialData={footerSettings?.social} />
							</div>
						)}

						{/* Custom Rich Text Fallback */}
						{footerSettings?.footerContent && footerSettings.footerContent.length > 0 && (
							<div className="pt-2 text-xs text-muted-foreground prose prose-sm dark:prose-invert">
								<PortableText value={footerSettings.footerContent} />
							</div>
						)}
					</div>

					{/* Column 2..N: Navigation Menus */}
					<div className="lg:col-span-4">
						<Navigation
							footerMenu={footerSettings?.footerMenu}
							mobileAccordion={footerSettings?.mobileAccordion}
						/>
					</div>

					{/* Column Last: Newsletter Capture */}
					<div className="lg:col-span-4">
						{footerSettings?.showNewsletter ? (
							<NewsletterForm
								title={footerSettings?.newsletterTitle}
								description={footerSettings?.newsletterDescription}
								placeholder={footerSettings?.newsletterPlaceholder}
								buttonText={footerSettings?.newsletterButtonText}
							/>
						) : (
							<div className="flex flex-col gap-4">
								<h4 className="text-base font-semibold text-foreground">
									Secure Shopping Guarantee
								</h4>
								<p className="text-sm text-muted-foreground leading-relaxed">
									We ensure secure transactions with 256-bit SSL encryption and multiple trusted payment partners.
								</p>
								<PaymentBadges
									paymentMethods={footerSettings?.paymentMethods}
									trustBadges={footerSettings?.trustBadges}
									showPaymentMethods={footerSettings?.showPaymentMethods}
									showTrustBadges={footerSettings?.showTrustBadges}
								/>
							</div>
						)}
					</div>
				</div>

				{/* ================= TIER 3: BOTTOM BAR & TRUST SIGNALS ================= */}
				<div className="border-t border-border/40 pt-6 md:pt-8">
					<div className="flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
						{/* Copyright & Legal */}
						<div className="text-center text-xs text-muted-foreground md:text-left">
							<p>{formattedCopyright}</p>
							{footerSettings?.copyright && footerSettings.copyright.length > 0 && (
								<div className="mt-1 [&_a]:underline [&_a]:hover:text-primary">
									<PortableText value={footerSettings.copyright} />
								</div>
							)}
						</div>

						{/* Payment Gateways & Badges */}
						<PaymentBadges
							paymentMethods={footerSettings?.paymentMethods}
							trustBadges={footerSettings?.trustBadges}
							showPaymentMethods={footerSettings?.showPaymentMethods}
							showTrustBadges={footerSettings?.showTrustBadges}
						/>
					</div>
				</div>
			</div>
		</footer>
	)
}
