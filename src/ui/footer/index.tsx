import { getFooterSettings, getSite } from '@/sanity/lib/queries'
import Logo from '@/ui/logo'
import SocialNavigation from '@/ui/social-navigation'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Navigation from './navigation'
import UspBar from './usp-bar'
import NewsletterForm from './newsletter-form'
import PaymentBadges from './payment-badges'
import CookiePreferencesTrigger from './cookie-preferences-trigger'
import BackToTop from './back-to-top'
import { Phone, Mail, MapPin, Clock, FileText, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function Footer() {
	const [site, footerSettings] = await Promise.all([
		getSite(),
		getFooterSettings(),
	])

	const currentYear = new Date().getFullYear()
	const siteName = (site as any)?.siteName || (site as any)?.title || 'Store'

	// Dynamic Copyright Macro Replacement
	const rawCopyright = footerSettings?.copyrightText || '© {year} {siteName}. All rights reserved.'
	const formattedCopyright = rawCopyright
		.replace(/{year}/g, currentYear.toString())
		.replace(/{siteName}/g, siteName)

	// Determine Color Styling & Theme Presets
	const themeStyle = footerSettings?.footerThemeStyle || 'default'
	const isCustomColor = themeStyle === 'custom'

	const footerStyle: React.CSSProperties = isCustomColor
		? {
				backgroundColor: footerSettings?.footerBackground || undefined,
				color: footerSettings?.footerText || undefined,
				borderColor: footerSettings?.footerBorder || undefined,
			}
		: {}

	const themeClass =
		themeStyle === 'dark'
			? 'bg-slate-950 text-slate-100 border-slate-800'
			: themeStyle === 'light'
				? 'bg-slate-50 text-slate-900 border-slate-200'
				: themeStyle === 'navy'
					? 'bg-[#0B132B] text-slate-100 border-slate-800/80'
					: themeStyle === 'warm'
						? 'bg-[#F7F5F0] text-[#1C1917] border-[#E7E5E4]'
						: isCustomColor
							? 'border-t'
							: 'bg-surface/50 text-foreground border-border/40'

	// Sizing & Spacing Presets
	const spacing = footerSettings?.spacing || 'normal'
	const spacingClasses =
		spacing === 'compact'
			? 'py-6 md:py-8 space-y-6 md:space-y-8'
			: spacing === 'spacious'
				? 'py-12 md:py-16 space-y-10 md:space-y-14'
				: 'py-8 md:py-12 space-y-8 md:space-y-12'

	// Brand Contact Data (Inherited from Site Profile)
	const showBrandInfo =
		footerSettings?.showContactInfo !== false &&
		(footerSettings?.showHotline ||
			footerSettings?.showEmail ||
			footerSettings?.showAddress ||
			footerSettings?.showWorkingHours ||
			footerSettings?.showTaxCode)

	const legalLinks = footerSettings?.legalLinks || []
	const regionLabel = footerSettings?.regionLabel || 'United States (USD $)'
	const showCookieTrigger = footerSettings?.showCookieSettingsTrigger ?? true
	const showBackToTop = footerSettings?.showBackToTop ?? true
	const desktopLayout = footerSettings?.desktopLayout || 'standard'
	const headingCase = footerSettings?.headingCase || 'title'
	const showNewsletter = Boolean(footerSettings?.showNewsletter)

	return (
		<footer
			id="site-footer"
			role="contentinfo"
			aria-label="Site Footer"
			className={cn(
				'footer relative border-t overflow-hidden transition-colors duration-300 print:hidden',
				themeClass
			)}
			style={footerStyle}
		>
			<h2 className="sr-only">Footer Information & Navigation</h2>

			<div className={cn('section relative z-1', spacingClasses)}>
				{/* ================= TIER 1: USP HIGHLIGHTS BAR ================= */}
				{footerSettings?.showUspBar && (
					<UspBar
						items={footerSettings?.uspItems}
						layout={footerSettings?.uspLayout || 'grid'}
					/>
				)}

				{/* ================= OPTIONAL FULL-WIDTH NEWSLETTER BANNER ================= */}
				{desktopLayout === 'expanded_nav' && showNewsletter && (
					<div className="pb-4">
						<NewsletterForm
							title={footerSettings?.newsletterTitle}
							description={footerSettings?.newsletterDescription}
							placeholder={footerSettings?.newsletterPlaceholder}
							buttonText={footerSettings?.newsletterButtonText}
							consentText={footerSettings?.newsletterConsentText}
							layout="banner"
						/>
					</div>
				)}

				{/* ================= TIER 2: MAIN MULTI-COLUMN GRID ================= */}
				{desktopLayout === 'expanded_nav' ? (
					/* EXPANDED NAVIGATION LAYOUT */
					<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
						{/* Brand & Contact Column */}
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
									{siteName} is dedicated to delivering conscious, sustainable lifestyle products crafted with timeless care.
								</p>
							)}

							{showBrandInfo && (
								<div className="flex flex-col gap-2 pt-1 text-sm text-muted-foreground">
									{footerSettings?.showAddress && (site as any)?.address && (
										<div className="flex items-start gap-2.5">
											<MapPin className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
											<span className="leading-snug">{(site as any).address}</span>
										</div>
									)}

									{footerSettings?.showHotline && (site as any)?.hotline && (
										<div className="flex items-center gap-2.5">
											<Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<a
												href={`tel:${(site as any).hotline.replace(/\s+/g, '')}`}
												className="hover:text-primary transition-colors font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
											>
												{(site as any).hotline}
											</a>
										</div>
									)}

									{footerSettings?.showEmail && (site as any)?.email && (
										<div className="flex items-center gap-2.5">
											<Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<a
												href={`mailto:${(site as any).email}`}
												className="hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
											>
												{(site as any).email}
											</a>
										</div>
									)}

									{footerSettings?.showWorkingHours && (site as any)?.workingHours && (
										<div className="flex items-center gap-2.5">
											<Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<span>{(site as any).workingHours}</span>
										</div>
									)}

									{footerSettings?.showTaxCode && (site as any)?.taxCode && (
										<div className="flex items-center gap-2.5">
											<FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<span>Tax ID: {(site as any).taxCode}</span>
										</div>
									)}
								</div>
							)}

							{footerSettings?.showSocialLinks && (
								<div className="pt-2">
									<SocialNavigation socialData={site?.socialLinks || (site as any)?.social} />
								</div>
							)}
						</div>

						{/* Multi-Column Navigation Showcase */}
						<div className="lg:col-span-8">
							<Navigation
								footerMenu={footerSettings?.footerMenu}
								mobileAccordion={footerSettings?.mobileAccordion}
								headingCase={headingCase}
							/>
						</div>
					</div>
				) : desktopLayout === 'compact' ? (
					/* COMPACT CLEAN LAYOUT */
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
						{/* Brand & Tagline */}
						<div className="flex flex-col gap-4 lg:col-span-5">
							{footerSettings?.showLogo && (
								<Logo site={site} className="[&_img]:h-9" />
							)}

							{footerSettings?.brandDescription && (
								<p className="text-sm text-muted-foreground leading-relaxed max-w-md">
									{footerSettings.brandDescription}
								</p>
							)}

							{footerSettings?.showSocialLinks && (
								<div className="pt-1">
									<SocialNavigation socialData={site?.socialLinks || (site as any)?.social} />
								</div>
							)}
						</div>

						{/* Navigation */}
						<div className="lg:col-span-7">
							<Navigation
								footerMenu={footerSettings?.footerMenu}
								mobileAccordion={footerSettings?.mobileAccordion}
								headingCase={headingCase}
							/>
						</div>
					</div>
				) : (
					/* STANDARD BALANCED 3-COLUMN LAYOUT */
					<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
						{/* Column 1 (Desktop) / Column 3 (Mobile): Brand & Contact Info */}
						<div className="order-3 flex flex-col gap-4 lg:order-1 lg:col-span-4">
							{footerSettings?.showLogo && (
								<Logo site={site} className="[&_img]:h-9" />
							)}

							{footerSettings?.brandDescription ? (
								<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
									{footerSettings.brandDescription}
								</p>
							) : (
								<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
									{siteName} is dedicated to delivering conscious, sustainable lifestyle products crafted with timeless care.
								</p>
							)}

							{/* Contact Details inherited from Site Profile */}
							{showBrandInfo && (
								<div className="flex flex-col gap-2 pt-1 text-sm text-muted-foreground">
									{footerSettings?.showAddress && (site as any)?.address && (
										<div className="flex items-start gap-2.5">
											<MapPin className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
											<span className="leading-snug">{(site as any).address}</span>
										</div>
									)}

									{footerSettings?.showHotline && (site as any)?.hotline && (
										<div className="flex items-center gap-2.5">
											<Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<a
												href={`tel:${(site as any).hotline.replace(/\s+/g, '')}`}
												className="hover:text-primary transition-colors font-medium text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
											>
												{(site as any).hotline}
											</a>
										</div>
									)}

									{footerSettings?.showEmail && (site as any)?.email && (
										<div className="flex items-center gap-2.5">
											<Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<a
												href={`mailto:${(site as any).email}`}
												className="hover:text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
											>
												{(site as any).email}
											</a>
										</div>
									)}

									{footerSettings?.showWorkingHours && (site as any)?.workingHours && (
										<div className="flex items-center gap-2.5">
											<Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<span>{(site as any).workingHours}</span>
										</div>
									)}

									{footerSettings?.showTaxCode && (site as any)?.taxCode && (
										<div className="flex items-center gap-2.5">
											<FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
											<span>Tax ID: {(site as any).taxCode}</span>
										</div>
									)}
								</div>
							)}

							{/* Social Media Links */}
							{footerSettings?.showSocialLinks && (
								<div className="pt-2">
									<SocialNavigation socialData={site?.socialLinks || (site as any)?.social} />
								</div>
							)}
						</div>

						{/* Column 2: Navigation Menus */}
						<div className="order-2 lg:order-2 lg:col-span-4">
							<Navigation
								footerMenu={footerSettings?.footerMenu}
								mobileAccordion={footerSettings?.mobileAccordion}
								headingCase={headingCase}
							/>
						</div>

						{/* Column 3 (Desktop) / Column 1 (Mobile): Newsletter Capture */}
						<div className="order-1 flex flex-col gap-4 lg:order-3 lg:col-span-4">
							{showNewsletter ? (
								<NewsletterForm
									title={footerSettings?.newsletterTitle}
									description={footerSettings?.newsletterDescription}
									placeholder={footerSettings?.newsletterPlaceholder}
									buttonText={footerSettings?.newsletterButtonText}
									consentText={footerSettings?.newsletterConsentText}
								/>
							) : (
								<div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-surface/40 p-5">
									<div className="flex items-center gap-2 text-foreground font-semibold text-sm">
										<ShieldCheck className="size-5 text-primary" aria-hidden="true" />
										<span>Secure Shopping Guarantee</span>
									</div>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Every order is safeguarded by 256-bit encrypted checkout and backed by our dedicated customer care team.
									</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* ================= TIER 3: BOTTOM BAR & LEGAL COMPLIANCE ================= */}
				<div className="border-t border-border/40 pt-6 md:pt-8 flex flex-col gap-4">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						{/* Copyright & Legal Navigation Links */}
						<div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground md:items-start md:text-left">
							<p>{formattedCopyright}</p>

							{/* Legal & Compliance Links Row */}
							<nav aria-label="Legal & Policies" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-0.5 md:justify-start">
								{legalLinks.length > 0 ? (
									legalLinks.map((link: any, idx: number) => (
										<SanityLink
											key={link._key || idx}
											link={link as SanityLinkType}
											className="hover:text-primary transition-colors hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
										/>
									))
								) : (
									<>
										<a href="/privacy-policy" className="hover:text-primary transition-colors hover:underline">
											Privacy Policy
										</a>
										<a href="/terms-of-service" className="hover:text-primary transition-colors hover:underline">
											Terms of Service
										</a>
										<a href="/shipping-returns" className="hover:text-primary transition-colors hover:underline">
											Shipping & Returns
										</a>
									</>
								)}

								{showCookieTrigger && <CookiePreferencesTrigger />}
							</nav>
						</div>

						{/* Right Utilities: Region Indicator, Payment Badges & Back to Top */}
						<div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
							{regionLabel && (
								<div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/80 px-3 py-1 text-xs font-medium text-foreground/80 shadow-2xs select-none">
									<span className="text-xs" aria-hidden="true">🌐</span>
									<span>{regionLabel}</span>
								</div>
							)}

							<PaymentBadges
								paymentMethods={footerSettings?.paymentMethods}
								trustBadges={footerSettings?.trustBadges}
								showPaymentMethods={footerSettings?.showPaymentMethods}
								showTrustBadges={footerSettings?.showTrustBadges}
							/>

							{showBackToTop && <BackToTop />}
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}
