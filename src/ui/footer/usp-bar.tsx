import {
	Truck,
	ShieldCheck,
	RotateCcw,
	Headphones,
	Leaf,
	Star,
	Lock,
} from 'lucide-react'

interface UspItem {
	icon?: string
	title?: string
	description?: string
}

interface UspBarProps {
	items?: UspItem[]
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

export default function UspBar({ items }: UspBarProps) {
	const uspList = items && items.length > 0 ? items : DEFAULT_USP_ITEMS

	const renderIcon = (iconName?: string) => {
		const iconClasses = 'size-6 shrink-0 text-primary'
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
			case 'shipping':
			default:
				return <Truck className={iconClasses} />
		}
	}

	return (
		<div className="border-b border-border/40 py-6 md:py-8">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{uspList.map((usp, idx) => (
					<div
						key={idx}
						className="flex items-center gap-4 rounded-xl border border-border/20 bg-surface/40 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-surface/80 hover:shadow-xs"
					>
						<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-105">
							{renderIcon(usp.icon)}
						</div>
						<div className="min-w-0 flex-1">
							<h4 className="text-sm font-semibold tracking-tight text-foreground line-clamp-1">
								{usp.title}
							</h4>
							{usp.description && (
								<p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
									{usp.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
