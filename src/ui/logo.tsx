import Link from 'next/link'
import { cn } from '@/lib/utils'
import Img from './img'

export default function Logo({
	site,
	variant: style = 'default',
	className,
}: {
	site?: any
	variant?: 'default' | 'light' | 'dark'
	className?: string
}) {
	const logo = site?.logo?.image?.[style]

	return (
		<Link
			href="/"
			className={cn('text-foreground inline-block font-bold', className)}
		>
			{logo ? (
				<Img
					image={logo}
					width={400}
					priority={true}
					imageOptions={{ q: 95 }}
					className="inline-block h-full w-auto object-contain"
					alt={site?.title ?? ''}
				/>
			) : (
				site?.title
			)}
		</Link>
	)
}
