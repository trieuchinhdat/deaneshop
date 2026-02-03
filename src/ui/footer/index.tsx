import { PortableText } from 'next-sanity'
import { getSite } from '@/sanity/lib/queries'
import Logo from '@/ui/logo'
import SocialNavigation from '@/ui/social-navigation'
import Navigation from './navigation'

export default async function () {
	const site = await getSite()

	return (
		<footer className="footer bg-footer text-footer-foreground">
			<div className="section space-y-4">
				<div className="flex justify-between gap-4 max-md:flex-col md:items-start">
					<div className="flex flex-col items-center gap-4 max-md:text-center md:items-start">
						<Logo className="[&_img]:h-[2lh]" variant="light" />
						<PortableText value={site?.footerContent ?? []} />
						<SocialNavigation className="[&_svg]:size-lh link flex items-center gap-4 max-md:justify-center" />
					</div>

					<Navigation />
				</div>
				<div className="copyright border-t border-[#f5f5f5] py-2">
					<div className="[&_a]:link text-center">
						<PortableText value={site?.copyright ?? []} />
					</div>
				</div>
			</div>
		</footer>
	)
}
