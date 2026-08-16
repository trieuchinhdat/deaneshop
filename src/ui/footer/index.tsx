import { PortableText } from 'next-sanity'
import { getFooterSettings, getSite } from '@/sanity/lib/queries'
import Logo from '@/ui/logo'
import SocialNavigation from '@/ui/social-navigation'
import Navigation from './navigation'

export default async function Footer() {
	const [site, footerSettings] = await Promise.all([
		getSite(),
		getFooterSettings(),
	])

	return (
		<footer
			className="footer bg-footer text-footer-foreground"
			style={{
				backgroundColor: footerSettings?.footerBackground || undefined,
				color: footerSettings?.footerText || undefined,
			}}
		>
			<div className="section space-y-4">
				<div className="flex justify-between gap-4 max-md:flex-col md:items-start">
					<div className="flex flex-col items-center gap-4 max-md:text-center md:items-start">
						<Logo site={site} className="[&_img]:h-[2lh]" variant="light" />
						<PortableText value={footerSettings?.footerContent ?? (site as any)?.footerContent ?? []} />
						<SocialNavigation
							socialData={footerSettings?.social}
							className="[&_svg]:size-lh link flex items-center gap-4 max-md:justify-center"
						/>
					</div>

					<Navigation footerMenu={footerSettings?.footerMenu} />
				</div>
				<div className="copyright border-t border-[#f5f5f5] py-2">
					<div className="[&_a]:link text-center">
						<PortableText value={footerSettings?.copyright ?? (site as any)?.copyright ?? []} />
					</div>
				</div>
			</div>
		</footer>
	)
}
