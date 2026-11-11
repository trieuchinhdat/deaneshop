import { moduleAttributes, type ModuleProps } from '@/ui/modules'
import StickyMobileCTAClient from './sticky-mobile-cta-client'

export interface StickyMobileCTAProps extends ModuleProps {
	// Canonical & legacy content fields
	title?: string
	dealTitle?: string
	image?: any
	linkedProduct?: any
	badge?: string
	price?: string
	originalPrice?: string
	priceOrBadge?: string
	dealPrice?: string
	ratingScore?: string
	ratingCount?: string
	ratingText?: string
	ratingSnippet?: string
	trustNote?: string

	// Actions
	actionType?: 'anchor' | 'direct_cart' | 'link'
	primaryButtonText?: string
	buttonText?: string
	primaryButtonLink?: string
	targetUrl?: string
	primaryButtonSubtext?: string
	secondaryButtonType?: 'none' | 'whatsapp' | 'phone' | 'link'
	supportType?: 'none' | 'whatsapp' | 'phone' | 'link'
	secondaryButtonLabel?: string
	supportLabel?: string
	secondaryButtonValue?: string

	// Layout & Appearance
	barPosition?: 'bottom' | 'top'
	barStyle?: 'docked' | 'floating'
	deviceVisibility?: 'all' | 'mobile_only' | 'desktop_only'
	themeStyle?: 'light' | 'dark' | 'brand' | 'urgent'
	buttonStyle?: 'accent' | 'dark' | 'pulse'

	// Behavior & Settings
	triggerMode?: 'scroll' | 'target_element' | 'always'
	scrollThreshold?: number
	targetElementId?: string
	autoHideOnTarget?: boolean
	syncWithProduct?: boolean
	allowDismiss?: boolean
	dismissDurationHours?: number
}

export default function StickyMobileCTA(props: StickyMobileCTAProps) {
	// Resolve canonical values with robust fallback for older documents
	const resolvedTitle = props.title || props.dealTitle || 'Special Promo Package'
	const resolvedPrice = props.price || props.dealPrice || props.priceOrBadge || '$49.00'
	const resolvedPrimaryText = props.primaryButtonText || props.buttonText || 'Order Now'
	const resolvedPrimaryLink = props.primaryButtonLink || props.targetUrl || '#lead-form'
	const resolvedSecondaryType = props.secondaryButtonType || props.supportType || 'whatsapp'
	const resolvedSecondaryLabel = props.secondaryButtonLabel || props.supportLabel || 'Chat'
	const resolvedSecondaryValue = props.secondaryButtonValue || ''
	const resolvedRatingText = props.ratingText || props.ratingSnippet

	return (
		<div {...moduleAttributes(props)}>
			<StickyMobileCTAClient
				title={resolvedTitle}
				image={props.image}
				linkedProduct={props.linkedProduct}
				badge={props.badge}
				price={resolvedPrice}
				originalPrice={props.originalPrice}
				ratingScore={props.ratingScore}
				ratingCount={props.ratingCount}
				ratingText={resolvedRatingText}
				trustNote={props.trustNote}
				actionType={props.actionType || 'anchor'}
				primaryButtonText={resolvedPrimaryText}
				primaryButtonLink={resolvedPrimaryLink}
				primaryButtonSubtext={props.primaryButtonSubtext}
				secondaryButtonType={resolvedSecondaryType}
				secondaryButtonLabel={resolvedSecondaryLabel}
				secondaryButtonValue={resolvedSecondaryValue}
				barPosition={props.barPosition || 'bottom'}
				barStyle={props.barStyle || 'docked'}
				deviceVisibility={props.deviceVisibility || 'all'}
				themeStyle={props.themeStyle || 'light'}
				buttonStyle={props.buttonStyle || 'accent'}
				triggerMode={props.triggerMode || 'scroll'}
				scrollThreshold={props.scrollThreshold ?? 250}
				targetElementId={props.targetElementId || 'lead-form'}
				autoHideOnTarget={props.autoHideOnTarget ?? true}
				syncWithProduct={props.syncWithProduct ?? true}
				allowDismiss={props.allowDismiss ?? false}
				dismissDurationHours={props.dismissDurationHours ?? 24}
				moduleKey={props._key}
			/>
		</div>
	)
}
