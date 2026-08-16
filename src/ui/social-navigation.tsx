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
import { SiZalo } from 'react-icons/si'
import { getFooterSettings } from '@/sanity/lib/queries'
import SanityLink, { type SanityLinkType } from './sanity-link'

interface SocialNavigationProps extends React.ComponentProps<'nav'> {
	socialData?: any
}

export default async function SocialNavigation({
	socialData,
	className,
	...props
}: SocialNavigationProps) {
	const social = socialData || (await getFooterSettings())?.social

	if (!social) return null

	// Support both Navigation document format (items array of links) and Site socialLinks array format
	const rawItems: any[] = Array.isArray(social)
		? social
		: social?.items || []

	if (rawItems.length === 0) return null

	return (
		<nav
			className={`flex flex-wrap items-center gap-2.5 ${className || ''}`}
			{...props}
		>
			{rawItems.map((item: any, idx: number) => {
				const url = item?.external || item?.url
				const platform = item?.platform?.toLowerCase() || ''
				const title = item?.title || item?.label || item?.platform || url
				const key = item?._key || `social-${idx}`

				const renderIcon = () => {
					if (platform === 'facebook' || url?.includes('facebook.com'))
						return <FaFacebook className="size-4" />
					if (platform === 'instagram' || url?.includes('instagram.com'))
						return <FaInstagram className="size-4" />
					if (
						platform === 'twitter' ||
						platform === 'x' ||
						url?.includes('twitter.com') ||
						url?.includes('x.com')
					)
						return <FaXTwitter className="size-4" />
					if (platform === 'youtube' || url?.includes('youtube.com'))
						return <FaYoutube className="size-4" />
					if (platform === 'linkedin' || url?.includes('linkedin.com'))
						return <FaLinkedinIn className="size-4" />
					if (platform === 'tiktok' || url?.includes('tiktok.com'))
						return <FaTiktok className="size-4" />
					if (platform === 'github' || url?.includes('github.com'))
						return <FaGithub className="size-4" />
					if (platform === 'zalo' || url?.includes('zalo.me'))
						return <SiZalo className="size-4" />
					return <FaLink className="size-4" />
				}

				if (!url) return null

				return (
					<a
						key={key}
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={title}
						className="flex size-9 items-center justify-center rounded-full border border-border/40 bg-surface text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95"
					>
						{renderIcon()}
					</a>
				)
			})}
		</nav>
	)
}
