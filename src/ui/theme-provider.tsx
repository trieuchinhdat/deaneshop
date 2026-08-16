import { resolveFontFamily } from '@/lib/fonts'

export const THEME_PRESETS: Record<string, any> = {
	eco: {
		primaryColor: '#059669',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#10b981',
		onSecondaryColor: '#ffffff',
		ctaColor: '#ea580c',
		onCtaColor: '#ffffff',
		backgroundColor: '#ffffff',
		surfaceColor: '#f9fafb',
		textColor: '#111827',
		textMutedColor: '#6b7280',
		noteBackground: '#f3f4f6',
		noteTextColor: '#374151',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#ef4444',
		borderColor: '#e5e7eb',
		ringColor: '#059669',
		borderRadius: 'md',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '32px',
		sectionSpacingMobile: '16px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Outfit',
		fontBody: 'Plus Jakarta Sans',
	},
	luxury: {
		primaryColor: '#18181b',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#27272a',
		onSecondaryColor: '#ffffff',
		ctaColor: '#d97706',
		onCtaColor: '#ffffff',
		backgroundColor: '#fafafa',
		surfaceColor: '#ffffff',
		textColor: '#09090b',
		textMutedColor: '#71717a',
		noteBackground: '#f4f4f5',
		noteTextColor: '#27272a',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#ef4444',
		borderColor: '#e4e4e7',
		ringColor: '#18181b',
		borderRadius: 'none',
		pageMaxWidth: '1440px',
		sectionSpacingDesktop: '48px',
		sectionSpacingMobile: '24px',
		containerPaddingDesktop: '40px',
		containerPaddingMobile: '16px',
		fontHeading: 'Playfair Display',
		fontBody: 'Plus Jakarta Sans',
	},
	ocean: {
		primaryColor: '#0284c7',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#0ea5e9',
		onSecondaryColor: '#ffffff',
		ctaColor: '#f43f5e',
		onCtaColor: '#ffffff',
		backgroundColor: '#f0f9ff',
		surfaceColor: '#ffffff',
		textColor: '#0c4a6e',
		textMutedColor: '#64748b',
		noteBackground: '#e0f2fe',
		noteTextColor: '#0369a1',
		successColor: '#059669',
		warningColor: '#eab308',
		destructiveColor: '#e11d48',
		borderColor: '#bae6fd',
		ringColor: '#0284c7',
		borderRadius: 'lg',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '32px',
		sectionSpacingMobile: '16px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Montserrat',
		fontBody: 'Inter',
	},
	warm: {
		primaryColor: '#78350f',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#92400e',
		onSecondaryColor: '#ffffff',
		ctaColor: '#c2410c',
		onCtaColor: '#ffffff',
		backgroundColor: '#fefce8',
		surfaceColor: '#ffffff',
		textColor: '#451a03',
		textMutedColor: '#78716c',
		noteBackground: '#fef3c7',
		noteTextColor: '#92400e',
		successColor: '#15803d',
		warningColor: '#d97706',
		destructiveColor: '#b91c1c',
		borderColor: '#fde68a',
		ringColor: '#78350f',
		borderRadius: 'md',
		pageMaxWidth: '1280px',
		sectionSpacingDesktop: '40px',
		sectionSpacingMobile: '20px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Lora',
		fontBody: 'Nunito Sans',
	},
	violet: {
		primaryColor: '#7c3aed',
		onPrimaryColor: '#ffffff',
		secondaryColor: '#9333ea',
		onSecondaryColor: '#ffffff',
		ctaColor: '#db2777',
		onCtaColor: '#ffffff',
		backgroundColor: '#faf5ff',
		surfaceColor: '#ffffff',
		textColor: '#3b0764',
		textMutedColor: '#6b7280',
		noteBackground: '#f3e8ff',
		noteTextColor: '#6b21a8',
		successColor: '#10b981',
		warningColor: '#f59e0b',
		destructiveColor: '#f43f5e',
		borderColor: '#e9d5ff',
		ringColor: '#7c3aed',
		borderRadius: 'full',
		pageMaxWidth: '1400px',
		sectionSpacingDesktop: '36px',
		sectionSpacingMobile: '18px',
		containerPaddingDesktop: '32px',
		containerPaddingMobile: '16px',
		fontHeading: 'Space Grotesk',
		fontBody: 'Be Vietnam Pro',
	},
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

	const presetKey = theme.preset || 'eco'
	const presetValues = THEME_PRESETS[presetKey] || THEME_PRESETS.eco

	// Nếu chọn preset khác 'custom', lấy giá trị preset làm base và ưu tiên custom overrides nếu có
	const resolvedTheme = {
		...presetValues,
		...(theme || {}),
	}

	const getRadiusValue = (radius: string) => {
		switch (radius) {
			case 'none':
				return '0px'
			case 'sm':
				return '4px'
			case 'lg':
				return '12px'
			case 'full':
				return '9999px'
			case 'md':
			default:
				return '8px'
		}
	}

	const radiusPx = getRadiusValue(resolvedTheme.borderRadius)
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

	// Collect custom Google Fonts URLs if specified
	const customFontsToLoad = [
		resolvedTheme.fontHeading === 'custom' && resolvedTheme.customFontHeading?.trim() ? resolvedTheme.customFontHeading.trim() : null,
		resolvedTheme.fontBody === 'custom' && resolvedTheme.customFontBody?.trim() ? resolvedTheme.customFontBody.trim() : null,
	].filter(Boolean) as string[]

	const googleFontsUrl =
		customFontsToLoad.length > 0
			? `https://fonts.googleapis.com/css2?${customFontsToLoad
					.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700;800`)
					.join('&')}&display=swap`
			: null

	const cssVars = `
		:root {
			/* Typography Variables */
			--font-sans: ${resolvedFontSans};
			--font-heading: ${resolvedFontHeading};

			/* Primary & Action Colors */
			--primary-color: ${resolvedTheme.primaryColor || '#059669'};
			--on-primary-color: ${resolvedTheme.onPrimaryColor || '#ffffff'};
			--secondary-color: ${resolvedTheme.secondaryColor || '#10b981'};
			--on-secondary-color: ${resolvedTheme.onSecondaryColor || '#ffffff'};
			--cta-color: ${resolvedTheme.ctaColor || '#ea580c'};
			--on-cta-color: ${resolvedTheme.onCtaColor || '#ffffff'};

			/* Surface & Content Colors */
			--bg-color: ${resolvedTheme.backgroundColor || '#ffffff'};
			--surface-color: ${resolvedTheme.surfaceColor || '#f9fafb'};
			--text-color: ${resolvedTheme.textColor || '#111827'};
			--text-muted-color: ${resolvedTheme.textMutedColor || '#6b7280'};

			/* Status & Notes Colors */
			--note-bg: ${resolvedTheme.noteBackground || '#f3f4f6'};
			--note-text: ${resolvedTheme.noteTextColor || '#374151'};
			--success-color: ${resolvedTheme.successColor || '#10b981'};
			--warning-color: ${resolvedTheme.warningColor || '#f59e0b'};
			--destructive-color: ${resolvedTheme.destructiveColor || '#ef4444'};

			/* Geometry & Tokens */
			--border-color: ${resolvedTheme.borderColor || '#e5e7eb'};
			--ring-color: ${resolvedTheme.ringColor || '#059669'};
			--radius: ${radiusPx};

			/* Layout & Spacing Tokens */
			--page-max-width: ${resolvedPageMaxWidth};
			--section-spacing-desktop: ${resolvedSectionSpacingDesktop};
			--section-spacing-mobile: ${resolvedSectionSpacingMobile};
			--container-padding-desktop: ${resolvedContainerPaddingDesktop};
			--container-padding-mobile: ${resolvedContainerPaddingMobile};

			/* Header & Footer Fallbacks */
			--header-bg: ${resolvedTheme.headerBackground || resolvedTheme.backgroundColor || '#ffffff'};
			--header-text: ${resolvedTheme.headerText || resolvedTheme.textColor || '#111827'};
			--footer-bg: ${resolvedTheme.footerBackground || '#000000'};
			--footer-text: ${resolvedTheme.footerText || '#ffffff'};
		}
	`.trim()

	return (
		<>
			{googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
			<style dangerouslySetInnerHTML={{ __html: cssVars }} />
		</>
	)
}
