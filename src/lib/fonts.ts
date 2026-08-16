import {
	Plus_Jakarta_Sans,
	Inter,
	Be_Vietnam_Pro,
	Outfit,
	Montserrat,
	Nunito_Sans,
	Poppins,
	Roboto,
	Open_Sans,
	Manrope,
	DM_Sans,
	Raleway,
	Urbanist,
	Lexend,
	Playfair_Display,
	Lora,
	Merriweather,
	Cinzel,
	Cormorant_Garamond,
	Space_Grotesk,
	Syne,
	Oswald,
} from 'next/font/google'

export const plusJakartaSans = Plus_Jakarta_Sans({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-plus-jakarta-sans',
	display: 'swap',
})

export const inter = Inter({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-inter',
	display: 'swap',
})

export const beVietnamPro = Be_Vietnam_Pro({
	weight: ['300', '400', '500', '600', '700', '800'],
	subsets: ['vietnamese', 'latin'],
	variable: '--font-be-vietnam-pro',
	display: 'swap',
})

export const outfit = Outfit({
	subsets: ['latin'],
	variable: '--font-outfit',
	display: 'swap',
})

export const montserrat = Montserrat({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-montserrat',
	display: 'swap',
})

export const nunitoSans = Nunito_Sans({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-nunito-sans',
	display: 'swap',
})

export const poppins = Poppins({
	weight: ['300', '400', '500', '600', '700'],
	subsets: ['latin'],
	variable: '--font-poppins',
	display: 'swap',
})

export const roboto = Roboto({
	weight: ['300', '400', '500', '700'],
	subsets: ['vietnamese', 'latin'],
	variable: '--font-roboto',
	display: 'swap',
})

export const openSans = Open_Sans({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-open-sans',
	display: 'swap',
})

export const manrope = Manrope({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-manrope',
	display: 'swap',
})

export const dmSans = DM_Sans({
	subsets: ['latin'],
	variable: '--font-dm-sans',
	display: 'swap',
})

export const raleway = Raleway({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-raleway',
	display: 'swap',
})

export const urbanist = Urbanist({
	subsets: ['latin'],
	variable: '--font-urbanist',
	display: 'swap',
})

export const lexend = Lexend({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-lexend',
	display: 'swap',
})

export const playfairDisplay = Playfair_Display({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-playfair-display',
	display: 'swap',
})

export const lora = Lora({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-lora',
	display: 'swap',
})

export const merriweather = Merriweather({
	weight: ['300', '400', '700'],
	subsets: ['vietnamese', 'latin'],
	variable: '--font-merriweather',
	display: 'swap',
})

export const cinzel = Cinzel({
	subsets: ['latin'],
	variable: '--font-cinzel',
	display: 'swap',
})

export const cormorantGaramond = Cormorant_Garamond({
	weight: ['400', '500', '600', '700'],
	subsets: ['vietnamese', 'latin'],
	variable: '--font-cormorant-garamond',
	display: 'swap',
})

export const spaceGrotesk = Space_Grotesk({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-space-grotesk',
	display: 'swap',
})

export const syne = Syne({
	subsets: ['latin'],
	variable: '--font-syne',
	display: 'swap',
})

export const oswald = Oswald({
	subsets: ['vietnamese', 'latin'],
	variable: '--font-oswald',
	display: 'swap',
})

export const GOOGLE_FONTS_OBJECTS: Record<string, { variable: string }> = {
	'Plus Jakarta Sans': plusJakartaSans,
	Inter: inter,
	'Be Vietnam Pro': beVietnamPro,
	Outfit: outfit,
	Montserrat: montserrat,
	'Nunito Sans': nunitoSans,
	Poppins: poppins,
	Roboto: roboto,
	'Open Sans': openSans,
	Manrope: manrope,
	'DM Sans': dmSans,
	Raleway: raleway,
	Urbanist: urbanist,
	Lexend: lexend,
	'Playfair Display': playfairDisplay,
	Lora: lora,
	Merriweather: merriweather,
	Cinzel: cinzel,
	'Cormorant Garamond': cormorantGaramond,
	'Space Grotesk': spaceGrotesk,
	Syne: syne,
	Oswald: oswald,
}

export const GOOGLE_FONTS_MAP: Record<string, string> = {
	'Plus Jakarta Sans': 'var(--font-plus-jakarta-sans), sans-serif',
	Inter: 'var(--font-inter), sans-serif',
	'Be Vietnam Pro': 'var(--font-be-vietnam-pro), sans-serif',
	Outfit: 'var(--font-outfit), sans-serif',
	Montserrat: 'var(--font-montserrat), sans-serif',
	'Nunito Sans': 'var(--font-nunito-sans), sans-serif',
	Poppins: 'var(--font-poppins), sans-serif',
	Roboto: 'var(--font-roboto), sans-serif',
	'Open Sans': 'var(--font-open-sans), sans-serif',
	Manrope: 'var(--font-manrope), sans-serif',
	'DM Sans': 'var(--font-dm-sans), sans-serif',
	Raleway: 'var(--font-raleway), sans-serif',
	Urbanist: 'var(--font-urbanist), sans-serif',
	Lexend: 'var(--font-lexend), sans-serif',
	'Playfair Display': 'var(--font-playfair-display), serif',
	Lora: 'var(--font-lora), serif',
	Merriweather: 'var(--font-merriweather), serif',
	Cinzel: 'var(--font-cinzel), serif',
	'Cormorant Garamond': 'var(--font-cormorant-garamond), serif',
	'Space Grotesk': 'var(--font-space-grotesk), sans-serif',
	Syne: 'var(--font-syne), sans-serif',
	Oswald: 'var(--font-oswald), sans-serif',
}

/**
 * Tối ưu Tree-shaking: Chỉ lấy đúng class của font đang được kích hoạt ở website
 */
export function getActiveFontClasses(fontBody?: string, fontHeading?: string): string {
	const bodyFontName = fontBody || 'Plus Jakarta Sans'
	const headingFontName = fontHeading || 'Plus Jakarta Sans'

	const classes = new Set<string>()

	const bodyFont = GOOGLE_FONTS_OBJECTS[bodyFontName]
	if (bodyFont) {
		classes.add(bodyFont.variable)
	} else {
		classes.add(plusJakartaSans.variable)
	}

	const headingFont = GOOGLE_FONTS_OBJECTS[headingFontName]
	if (headingFont) {
		classes.add(headingFont.variable)
	}

	return Array.from(classes).join(' ')
}

export function resolveFontFamily(fontName?: string, customName?: string): string {
	if (fontName === 'custom' && customName?.trim()) {
		return `'${customName.trim()}', sans-serif`
	}
	if (fontName && GOOGLE_FONTS_MAP[fontName]) {
		return GOOGLE_FONTS_MAP[fontName]
	}
	return 'var(--font-plus-jakarta-sans), sans-serif'
}
