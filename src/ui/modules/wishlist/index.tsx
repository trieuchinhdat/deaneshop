import { cn } from '@/lib/utils'
import { moduleAttributes } from '..'
import WishlistClient from './wishlist-client'

export interface WishlistModuleProps {
	_type?: 'wishlist'
	_key?: string
	title?: string
	description?: string
	emptyTitle?: string
	emptyDescription?: string
	emptyButtonText?: string
	emptyButtonLink?: string
	showMoveAllToCart?: boolean
	showClearAll?: boolean
	width?: boolean
	productSettings?: any
}

export default function WishlistModule({
	title,
	description,
	emptyTitle,
	emptyDescription,
	emptyButtonText,
	emptyButtonLink,
	showMoveAllToCart,
	showClearAll,
	width,
	productSettings,
	...props
}: WishlistModuleProps) {
	return (
		<section
			className={cn(width ? 'w-full' : 'section')}
			{...moduleAttributes(props)}
		>
			<WishlistClient
				title={title}
				description={description}
				emptyTitle={emptyTitle}
				emptyDescription={emptyDescription}
				emptyButtonText={emptyButtonText}
				emptyButtonLink={emptyButtonLink}
				showMoveAllToCart={showMoveAllToCart}
				showClearAll={showClearAll}
				productSettings={productSettings}
			/>
		</section>
	)
}
