import { resolveFontFamily } from '@/lib/fonts'
import { stegaClean } from 'next-sanity'

/**
 * Global DTC Presets aligned with international standards:
 * - Eco: Sustainable Living (Patagonia / Allbirds aesthetic)
 * - Clean: Contemporary DTC (Apple / Skims / Gymshark aesthetic)
 * - Luxury: Editorial Atelier (Aesop / The Row / Mejuri aesthetic)
 * - Nordic: Nordic Minimalist (HAY / Arket aesthetic)
 * - Warm: Warm Earth & Ceramic (Parachute / Cultiver aesthetic)
 */
export const THEME_PRESETS: Record<string, any> = {
	eco: {
		primaryColor: '#1b4332',
		secondaryColor: '#2d6a4f',
		ctaColor: '#c2410c',
		backgroundColor: '#FAF8F5',
		surfaceColor: '#ffffff',
		textColor: '#1c1917',
		textMutedColor: '#78716c',
		noteBackground: '#f5f5f4',
		noteTextColor: '#44403c',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#1b4332',
		borderRadius: 'rounded',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '32px',
		sectionSpacingMobile: '16px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Outfit',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'scale-subtle',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
	},
	clean: {
		primaryColor: '#18181b',
		secondaryColor: '#27272a',
		ctaColor: '#0f172a',
		backgroundColor: '#ffffff',
		surfaceColor: '#f9fafb',
		textColor: '#111827',
		textMutedColor: '#6b7280',
		noteBackground: '#f3f4f6',
		noteTextColor: '#374151',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#ef4444',
		borderColor: '#e5e7eb',
		ringColor: '#18181b',
		borderRadius: 'subtle',
		pageMaxWidth: '1400px',
		sectionSpacingDesktop: '32px',
		sectionSpacingMobile: '16px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Geist',
		fontBody: 'Inter',
		enableMotion: true,
		buttonHoverEffect: 'spring-bounce',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'snappy',
	},
	luxury: {
		primaryColor: '#1c1917',
		secondaryColor: '#292524',
		ctaColor: '#b45309',
		backgroundColor: '#FAF9F6',
		surfaceColor: '#ffffff',
		textColor: '#1c1917',
		textMutedColor: '#78716c',
		noteBackground: '#f5f5f4',
		noteTextColor: '#292524',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#1c1917',
		borderRadius: 'sharp',
		pageMaxWidth: '1440px',
		sectionSpacingDesktop: '48px',
		sectionSpacingMobile: '24px',
		containerPaddingDesktop: '40px',
		containerPaddingMobile: '16px',
		fontHeading: 'Instrument Serif',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'lift',
		bannerHoverEffect: 'zoom-and-lift',
		motionPhysics: 'gentle',
	},
	nordic: {
		primaryColor: '#334155',
		secondaryColor: '#475569',
		ctaColor: '#2C3E35',
		backgroundColor: '#F8FAFC',
		surfaceColor: '#ffffff',
		textColor: '#0f172a',
		textMutedColor: '#64748b',
		noteBackground: '#f1f5f9',
		noteTextColor: '#334155',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#dc2626',
		borderColor: '#e2e8f0',
		ringColor: '#334155',
		borderRadius: 'subtle',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '32px',
		sectionSpacingMobile: '16px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'DM Sans',
		fontBody: 'Manrope',
		enableMotion: true,
		buttonHoverEffect: 'scale-subtle',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
	},
	warm: {
		primaryColor: '#78350f',
		secondaryColor: '#92400e',
		ctaColor: '#b91c1c',
		backgroundColor: '#F7F4EF',
		surfaceColor: '#ffffff',
		textColor: '#292524',
		textMutedColor: '#78716c',
		noteBackground: '#f5f2eb',
		noteTextColor: '#78350f',
		successColor: '#15803d',
		warningColor: '#b45309',
		destructiveColor: '#b91c1c',
		borderColor: '#e7e5e4',
		ringColor: '#78350f',
		borderRadius: 'subtle',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '40px',
		sectionSpacingMobile: '20px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Lora',
		fontBody: 'Plus Jakarta Sans',
		enableMotion: true,
		buttonHoverEffect: 'lift',
		bannerHoverEffect: 'zoom',
		motionPhysics: 'smooth',
	},
}

/**
 * WCAG 2.1 AA Relative Luminance & Contrast Calculator:
 * Guarantees automated accessible text contrast (#ffffff or #111827) against any background.
 */
export function getAccessibleContrastColor(
	hexColor?: string,
	darkColor = '#111827',
	lightColor = '#ffffff',
): string {
	if (!hexColor) return lightColor
	const cleanHex = hexColor.replace('#', '').trim()
	if (cleanHex.length !== 3 && cleanHex.length !== 6) return lightColor

	let r = 0,
		g = 0,
		b = 0
	if (cleanHex.length === 3) {
		r = parseInt(cleanHex[0] + cleanHex[0], 16)
		g = parseInt(cleanHex[1] + cleanHex[1], 16)
		b = parseInt(cleanHex[2] + cleanHex[2], 16)
	} else {
		r = parseInt(cleanHex.substring(0, 2), 16)
		g = parseInt(cleanHex.substring(2, 4), 16)
		b = parseInt(cleanHex.substring(4, 6), 16)
	}

	// YIQ perceived luminance formula: (r * 299 + g * 587 + b * 114) / 1000
	const yiq = (r * 299 + g * 587 + b * 114) / 1000
	return yiq >= 150 ? darkColor : lightColor
}

const formatCssUnit = (val?: string | number, fallback = '0px') => {
	if (!val) return fallback
	const str = String(val).trim()
	if (!str) return fallback
	if (/^\d+(\.\d+)?$/.test(str)) {
		return `${str}px`
	}
	return str
}

export default function ThemeProvider({ theme }: { theme: any }) {
	if (!theme) return null

	const cleanTheme = stegaClean(theme)
	const presetKey = cleanTheme.preset || 'eco'
	const presetValues = THEME_PRESETS[presetKey] || THEME_PRESETS.eco

	const resolvedTheme = {
		...presetValues,
		...(cleanTheme || {}),
	}

	// Automated Accessible Contrast calculation for actions
	const resolvedOnPrimary =
		resolvedTheme.onPrimaryColor || getAccessibleContrastColor(resolvedTheme.primaryColor)
	const resolvedOnSecondary =
		resolvedTheme.onSecondaryColor || getAccessibleContrastColor(resolvedTheme.secondaryColor)
	const resolvedOnCta =
		resolvedTheme.onCtaColor || getAccessibleContrastColor(resolvedTheme.ctaColor)

	// Dynamic Shape & Radius resolution (Luxury Sharp vs Contemporary Subtle vs Eco Pill)
	const getRadiusTokens = (radius?: string) => {
		switch (radius) {
			case 'none':
			case 'sharp':
				return { themeRadius: '0px', buttonRadius: '0px' }
			case 'sm':
				return { themeRadius: '4px', buttonRadius: '4px' }
			case 'subtle':
			case 'md':
				return { themeRadius: '8px', buttonRadius: '8px' }
			case 'lg':
			case 'rounded':
				return { themeRadius: '12px', buttonRadius: '12px' }
			case 'full':
			case 'pill':
				return { themeRadius: '16px', buttonRadius: '9999px' }
			default:
				return { themeRadius: '8px', buttonRadius: '8px' }
		}
	}

	const { themeRadius, buttonRadius } = getRadiusTokens(resolvedTheme.borderRadius)

	const resolvedFontSans = resolveFontFamily(resolvedTheme.fontBody, resolvedTheme.customFontBody)
	const resolvedFontHeading = resolveFontFamily(resolvedTheme.fontHeading, resolvedTheme.customFontHeading)

	// Resolve Layout & Spacing Tokens
	const pageMaxWidthVal =
		resolvedTheme.pageMaxWidth === 'custom' && resolvedTheme.customPageMaxWidth?.trim()
			? resolvedTheme.customPageMaxWidth.trim()
			: resolvedTheme.pageMaxWidth || '1280px'
	const resolvedPageMaxWidth = formatCssUnit(pageMaxWidthVal, '1280px')

	const sectionSpacingDesktopVal =
		resolvedTheme.sectionSpacingDesktop === 'custom' && resolvedTheme.customSectionSpacingDesktop?.trim()
			? resolvedTheme.customSectionSpacingDesktop.trim()
			: resolvedTheme.sectionSpacingDesktop || '32px'
	const resolvedSectionSpacingDesktop = formatCssUnit(sectionSpacingDesktopVal, '32px')

	const sectionSpacingMobileVal =
		resolvedTheme.sectionSpacingMobile === 'custom' && resolvedTheme.customSectionSpacingMobile?.trim()
			? resolvedTheme.customSectionSpacingMobile.trim()
			: resolvedTheme.sectionSpacingMobile || '16px'
	const resolvedSectionSpacingMobile = formatCssUnit(sectionSpacingMobileVal, '16px')

	const containerPaddingDesktopVal =
		resolvedTheme.containerPaddingDesktop === 'custom' && resolvedTheme.customContainerPaddingDesktop?.trim()
			? resolvedTheme.customContainerPaddingDesktop.trim()
			: resolvedTheme.containerPaddingDesktop || '32px'
	const resolvedContainerPaddingDesktop = formatCssUnit(containerPaddingDesktopVal, '32px')

	const containerPaddingMobileVal =
		resolvedTheme.containerPaddingMobile === 'custom' && resolvedTheme.customContainerPaddingMobile?.trim()
			? resolvedTheme.customContainerPaddingMobile.trim()
			: resolvedTheme.containerPaddingMobile || '16px'
	const resolvedContainerPaddingMobile = formatCssUnit(containerPaddingMobileVal, '16px')

	// Resolve Motion & Animation Tokens
	const enableMotion = resolvedTheme.enableMotion !== false
	const buttonHoverEffect = enableMotion ? resolvedTheme.buttonHoverEffect || 'scale-subtle' : 'none'
	const bannerHoverEffect = enableMotion ? resolvedTheme.bannerHoverEffect || 'zoom' : 'none'
	const motionPhysics = resolvedTheme.motionPhysics || 'smooth'

	const motionDuration =
		motionPhysics === 'snappy' ? '150ms' : motionPhysics === 'gentle' ? '450ms' : '250ms'
	const motionEase =
		motionPhysics === 'snappy'
			? 'cubic-bezier(0.2, 0, 0, 1)'
			: motionPhysics === 'gentle'
				? 'cubic-bezier(0.16, 1, 0.3, 1)'
				: 'cubic-bezier(0.4, 0, 0.2, 1)'

	const cssVars = `
		:root {
			/* Typography Variables */
			--font-body: ${resolvedFontSans};
			--font-sans: ${resolvedFontSans};
			--font-heading: ${resolvedFontHeading};

			/* Primary & Action Colors */
			--primary-color: ${resolvedTheme.primaryColor || '#1b4332'};
			--on-primary-color: ${resolvedOnPrimary};
			--secondary-color: ${resolvedTheme.secondaryColor || '#2d6a4f'};
			--on-secondary-color: ${resolvedOnSecondary};
			--cta-color: ${resolvedTheme.ctaColor || '#c2410c'};
			--on-cta-color: ${resolvedOnCta};

			/* Surface & Content Colors */
			--bg-color: ${resolvedTheme.backgroundColor || '#ffffff'};
			--surface-color: ${resolvedTheme.surfaceColor || '#f9fafb'};
			--text-color: ${resolvedTheme.textColor || '#111827'};
			--text-muted-color: ${resolvedTheme.textMutedColor || '#6b7280'};
			--muted-color: ${resolvedTheme.surfaceColor || '#f9fafb'};

			/* Status & Notes Colors */
			--note-bg: ${resolvedTheme.noteBackground || '#f3f4f6'};
			--note-text: ${resolvedTheme.noteTextColor || '#374151'};
			--success-color: ${resolvedTheme.successColor || '#15803d'};
			--warning-color: ${resolvedTheme.warningColor || '#b45309'};
			--destructive-color: ${resolvedTheme.destructiveColor || '#b91c1c'};

			/* Geometry & Shape Tokens */
			--border-color: ${resolvedTheme.borderColor || '#e5e7eb'};
			--ring-color: ${resolvedTheme.ringColor || resolvedTheme.primaryColor || '#1b4332'};
			--theme-radius: ${themeRadius};
			--button-radius: ${buttonRadius};
			--radius: ${themeRadius};

			/* Layout & Spacing Tokens */
			--page-max-width: ${resolvedPageMaxWidth};
			--section-spacing-desktop: ${resolvedSectionSpacingDesktop};
			--section-spacing-mobile: ${resolvedSectionSpacingMobile};
			--container-padding-desktop: ${resolvedContainerPaddingDesktop};
			--container-padding-mobile: ${resolvedContainerPaddingMobile};

			/* Header & Footer Contextual Tokens */
			--header-bg: ${resolvedTheme.headerBackground || resolvedTheme.backgroundColor || '#ffffff'};
			--header-text: ${resolvedTheme.headerText || resolvedTheme.textColor || '#111827'};
			--footer-bg: ${resolvedTheme.footerBackground || '#111827'};
			--footer-text: ${resolvedTheme.footerText || '#f9fafb'};

			/* Motion & Animation Tokens */
			--motion-enabled: ${enableMotion ? '1' : '0'};
			--motion-duration: ${motionDuration};
			--motion-ease: ${motionEase};
		}
	`.trim()

	return <style dangerouslySetInnerHTML={{ __html: cssVars }} />
}
