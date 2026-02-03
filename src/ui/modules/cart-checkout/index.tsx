import { cn } from '@/lib/utils'
import type { CartCheckout } from '@/sanity/types'
import { moduleAttributes } from '..'
import CartCheckoutClient from './cart-checkout-client'

export default function WrapCartCheckout({
	title,
	description,
	webhookUrl,
	submitText,
	showSummary,
	priceShipping,
	width,
	...props
}: CartCheckout) {
	return (
		<section
			className={cn(width ? 'w-full' : 'section')}
			{...moduleAttributes(props)}
		>
			<CartCheckoutClient
				title={title}
				description={description}
				webhookUrl={webhookUrl}
				submitText={submitText}
				showSummary={showSummary}
				priceShipping={priceShipping}
			/>
		</section>
	)
}
