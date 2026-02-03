import {
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLink,
	FaLinkedinIn,
	FaTiktok,
	FaXTwitter,
	FaYoutube,
} from 'react-icons/fa6'
import { getSite } from '@/sanity/lib/queries'
import SanityLink, { type SanityLinkType } from './sanity-link'

export default async function (props: React.ComponentProps<'nav'>) {
	const site = await getSite()

	return (
		<nav {...props}>
			{site?.social?.items?.map((link) => {
				switch (link._type) {
					case 'link':
						const url = link.external

						return (
							<SanityLink
								link={link as SanityLinkType}
								className="text-footer-foreground"
								aria-label={link.label || url}
								key={link._key}
							>
								{url?.includes('facebook.com') ? (
									<FaFacebook />
								) : url?.includes('instagram.com') ? (
									<FaInstagram />
								) : url?.includes('twitter.com') || url?.includes('x.com') ? (
									<FaXTwitter />
								) : url?.includes('youtube.com') ? (
									<FaYoutube />
								) : url?.includes('linkedin.com') ? (
									<FaLinkedinIn />
								) : url?.includes('tiktok.com') ? (
									<FaTiktok />
								) : url?.includes('github.com') ? (
									<FaGithub />
								) : (
									<FaLink />
								)}
							</SanityLink>
						)

					default:
						return null
				}
			})}
		</nav>
	)
}
