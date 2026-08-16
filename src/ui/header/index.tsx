import { getHeaderSettings, getSite } from '@/sanity/lib/queries'
import HeaderClient from './header-client'
import Navigation from './navigation'

export default async function () {
	const [site, headerSettings] = await Promise.all([
		getSite(),
		getHeaderSettings(),
	])

	// Menu (Desktop & Mobile with Smart Fallback) & CTAs
	const desktopNavItems = headerSettings?.menu?.items
	const mobileNavItems = headerSettings?.mobileMenu?.items || desktopNavItems
	const ctas = headerSettings?.ctas

	return (
		<HeaderClient
			site={site}
			headerSettings={headerSettings}
			navigation={
				<Navigation
					desktopItems={desktopNavItems}
					mobileItems={mobileNavItems}
					ctas={ctas}
					align={headerSettings?.desktopMenuAlign || 'center'}
				/>
			}
		/>
	)
}
