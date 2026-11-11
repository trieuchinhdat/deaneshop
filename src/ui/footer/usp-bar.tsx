import Link from 'next/link'
import {
	Truck,
	ShieldCheck,
	RotateCcw,
	Headphones,
	Leaf,
	Star,
	Lock,
	Gift,
	Clock,
	CreditCard,
	BadgePercent,
	Sparkles,
} from 'lucide-react'

export interface UspItem {
	icon?: string
	title?: string
	description?: string
	url?: string
}

interface UspBarProps {
	items?: UspItem[]
	layout?: 'grid' | 'inline'
}

const DEFAULT_USP_ITEMS: UspItem[] = [
	{
		icon: 'shipping',
		title: 'Free Worldwide Shipping',
		description: 'On all orders over $50.00',
	},
	{
		icon: 'shield',
		title: '100% Authentic Quality',
		description: 'Curated eco-friendly essentials',
	},
	{
		icon: 'return',
		title: '30-Day Easy Returns',
		description: 'Money back guarantee',
	},
	{
		icon: 'support',
		title: '24/7 Dedicated Support',
		description: 'Expert customer assistance',
	},
]

export default function UspBar({ items, layout = 'grid' }: UspBarProps) {
	const uspList = items && items.length > 0 ? items : DEFAULT_USP_ITEMS

	const renderIcon = (iconName?: string) => {
		const iconClasses = 'size-5 sm:size-6 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110'
		switch (iconName) {
			case 'shield':
				return <ShieldCheck className={iconClasses} />
			case 'return':
				return <RotateCcw className={iconClasses} />
			case 'support':
				return <Headphones className={iconClasses} />
			case 'eco':
				return <Leaf className={iconClasses} />
			case 'star':
				return <Star className={iconClasses} />
			case 'lock':
				return <Lock className={iconClasses} />
			case 'gift':
				return <Gift className={iconClasses} />
			case 'clock':
				return <Clock className={iconClasses} />
			case 'credit_card':
				return <CreditCard className={iconClasses} />
			case 'discount':
				return <BadgePercent className={iconClasses} />
			case 'sparkles':
				return <Sparkles className={iconClasses} />
			case 'shipping':
			default:
				return <Truck className={iconClasses} />
		}
	}

	const count = uspList.length
	const gridCols =
		count === 1
			? 'grid-cols-1'
			: count === 2
				? 'grid-cols-1 sm:grid-cols-2'
				: count === 3
					? 'grid-cols-1 sm:grid-cols-3'
					: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

	if (layout === 'inline') {
		return (
			<section
				aria-label="Value Propositions and Guarantees"
				className="border-b border-border/40 py-4"
			>
				<div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
					{uspList.map((usp, idx) => {
						const CardContent = (
							<div className="group flex items-center gap-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
									{renderIcon(usp.icon)}
								</div>
								<span className="font-semibold text-foreground tracking-tight">
									{usp.title}
								</span>
								{usp.description && (
									<span className="hidden text-muted-foreground sm:inline">
										— {usp.description}
									</span>
								)}
							</div>
						)

						if (usp.url) {
							const isExternal = usp.url.startsWith('http')
							return isExternal ? (
								<a
									key={idx}
									href={usp.url}
									target="_blank"
									rel="noopener noreferrer"
									className="focus:outline-hidden focus:ring-2 focus:ring-primary/40 rounded-lg"
								>
									{CardContent}
								</a>
							) : (
								<Link
									key={idx}
									href={usp.url}
									className="focus:outline-hidden focus:ring-2 focus:ring-primary/40 rounded-lg"
								>
									{CardContent}
								</Link>
							)
						}

						return <div key={idx}>{CardContent}</div>
					})}
				</div>
			</section>
		)
	}

	return (
		<section
			aria-label="Value Propositions and Guarantees"
			className="border-b border-border/40 py-6 md:py-8"
		>
			<div className={`grid gap-4 sm:gap-6 ${gridCols}`}>
				{uspList.map((usp, idx) => {
					const cardInner = (
						<div className="group flex h-full items-center gap-3.5 sm:gap-4 rounded-xl border border-border/40 bg-surface/40 p-3.5 sm:p-4 transition-all duration-300 hover:border-primary/40 hover:bg-surface/80 hover:shadow-xs">
							<div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
								{renderIcon(usp.icon)}
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1">
									{usp.title}
								</h3>
								{usp.description && (
									<p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
										{usp.description}
									</p>
								)}
							</div>
						</div>
					)

					if (usp.url) {
						const isExternal = usp.url.startsWith('http')
						return isExternal ? (
							<a
								key={idx}
								href={usp.url}
								target="_blank"
								rel="noopener noreferrer"
								className="block rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40"
							>
								{cardInner}
							</a>
						) : (
							<Link
								key={idx}
								href={usp.url}
								className="block rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40"
							>
								{cardInner}
							</Link>
						)
					}

					return <div key={idx}>{cardInner}</div>
				})}
			</div>
		</section>
	)
}
