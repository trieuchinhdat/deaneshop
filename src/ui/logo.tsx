import Link from 'next/link'
import { cn } from '@/lib/utils'
import Img from './img'

export default function Logo({
	site,
	variant: style = 'default',
	logoHeightDesktop = 48,
	logoHeightMobile = 36,
	className,
}: {
	site?: any
	variant?: 'default' | 'light' | 'dark'
	logoHeightDesktop?: number
	logoHeightMobile?: number
	className?: string
}) {
	const logo = site?.logo?.image?.[style]

	const desktopH = logoHeightDesktop || 48
	const mobileH = logoHeightMobile || 36

	return (
		<Link
			href="/"
			className={cn(
				'text-header-foreground inline-flex items-center font-bold text-lg tracking-tight hover:opacity-90 transition-opacity shrink-0',
				className
			)}
		>
			{logo ? (
				<Img
					image={logo}
					width={400}
					priority={true}
					sizes="(max-width: 768px) 200px, 320px"
					imageOptions={{ q: 95 }}
					className="inline-block w-auto max-w-full h-[var(--logo-h-mobile)] md:h-[var(--logo-h-desktop)] max-h-[var(--logo-h-mobile)] md:max-h-[var(--logo-h-desktop)] object-contain transition-all"
					style={
						{
							'--logo-h-mobile': `${mobileH}px`,
							'--logo-h-desktop': `${desktopH}px`,
						} as React.CSSProperties
					}
					alt={site?.title || 'Logo'}
				/>
			) : (
				<span className="truncate text-xl font-bold">{site?.title || 'Ecocros Store'}</span>
			)}
		</Link>
	)
}



