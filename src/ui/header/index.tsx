import { getHeaderSettings, getSite } from '@/sanity/lib/queries'
import Announcement from './announcement'
import HeaderClient from './header-client'
import Navigation from './navigation'

export default async function () {
	const [site, headerSettings] = await Promise.all([
		getSite(),
		getHeaderSettings(),
	])

	// Menu (Desktop & Mobile with Smart Fallback) & CTAs & Announcements
	const desktopNavItems = headerSettings?.menu?.items
	const mobileNavItems = headerSettings?.mobileMenu?.items || desktopNavItems
	const ctas = headerSettings?.ctas
	const announcementData = headerSettings?.announcements?.[0]

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
			announcement={<Announcement data={announcementData} />}
		/>
	)
}
