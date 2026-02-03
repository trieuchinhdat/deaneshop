// components/theme-provider.tsx
'use client'

export default function ThemeProvider({ theme }: { theme: any }) {
	if (!theme) return null

	return (
		<style jsx global>{`
			:root {
				--bg-color: ${theme.backgroundColor || '#ffffff'};
				--text-color: ${theme.textColor || '#000000'};
				--primary-color: ${theme.primaryColor || '#000000'};
				--header-bg: ${theme.headerBackground || '#ffffff'};
				--header-text: ${theme.headerText || '#000000'};
				--footer-bg: ${theme.footerBackground || '#000000'};
				--footer-text: ${theme.footerText || '#ffffff'};
			}
		`}</style>
	)
}
