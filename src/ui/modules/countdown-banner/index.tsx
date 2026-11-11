import { moduleAttributes, type ModuleProps } from '@/ui/modules'
import CountdownBannerClient from './countdown-banner-client'

export interface CountdownBannerProps extends ModuleProps {
	badge?: string
	headline?: string
	subheadline?: string
	countdownType?: 'fixed' | 'evergreen'
	targetDate?: string
	fallbackHours?: number
	urgencyNote?: string
	showProgressBar?: boolean
	stockRemaining?: number
	stockTotal?: number
	ctaText?: string
	ctaLink?: string
	ctaSubtext?: string
	themeStyle?: 'urgent' | 'brand' | 'dark' | 'light' | 'accent'
	layout?: 'card' | 'split' | 'strip'
	expiredAction?: 'show_message' | 'hide' | 'evergreen_fallback'
	expiredMessage?: string

	// Legacy template backward-compatibility aliases
	subtext?: string
	hoursRemaining?: number
	stockUrgencyText?: string
	ctaLabel?: string
	ctaUrl?: string
	trustBadge?: string
	colorScheme?: 'urgent' | 'brand' | 'dark' | 'light' | 'accent'
}

export default function CountdownBanner(props: CountdownBannerProps) {
	const resolvedHeadline = props.headline || 'Special Launch Offer — Save Up To 40% Today'
	const resolvedSubheadline = props.subheadline ?? props.subtext
	const resolvedFallbackHours = props.fallbackHours ?? props.hoursRemaining ?? 48
	const resolvedUrgencyNote = props.urgencyNote ?? props.stockUrgencyText
	const resolvedCtaText = props.ctaText ?? props.ctaLabel
	const resolvedCtaLink = props.ctaLink ?? props.ctaUrl
	const resolvedCtaSubtext = props.ctaSubtext ?? props.trustBadge
	const resolvedThemeStyle = props.themeStyle ?? props.colorScheme ?? 'brand'
	const moduleKey = props._key || props.attributes?.uid || 'countdown-banner'

	return (
		<section
			className="section relative my-6 sm:my-10 lg:my-12 overflow-hidden"
			aria-label="Promotional Countdown"
			{...moduleAttributes(props)}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<CountdownBannerClient
					moduleKey={moduleKey}
					badge={props.badge}
					headline={resolvedHeadline}
					subheadline={resolvedSubheadline}
					countdownType={props.countdownType}
					targetDate={props.targetDate}
					fallbackHours={resolvedFallbackHours}
					urgencyNote={resolvedUrgencyNote}
					showProgressBar={props.showProgressBar}
					stockRemaining={props.stockRemaining}
					stockTotal={props.stockTotal}
					ctaText={resolvedCtaText}
					ctaLink={resolvedCtaLink}
					ctaSubtext={resolvedCtaSubtext}
					themeStyle={resolvedThemeStyle}
					layout={props.layout}
					expiredAction={props.expiredAction}
					expiredMessage={props.expiredMessage}
				/>
			</div>
		</section>
	)
}
