import type { Metadata } from 'next'
import { getCartCheckoutSettings, getPage, getProductSettings } from '@/sanity/lib/queries'
import CartCheckoutClient from '@/ui/modules/cart-checkout/cart-checkout-client'
import ModulesResolver from '@/ui/modules'

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPage(['checkout'])
	const { title, description, noIndex } = page?.metadata ?? {}

	return {
		title: title || 'Thanh toán & Giỏ hàng',
		description: description || 'Trang thanh toán đơn hàng',
		robots: {
			index: noIndex ? false : undefined,
		},
	}
}

export default async function CheckoutPage() {
	const [page, productSettings, cartCheckoutSettings] = await Promise.all([
		getPage(['checkout']),
		getProductSettings(),
		getCartCheckoutSettings(),
	])

	// Tìm module cart-checkout từ page nếu có
	const pageCartCheckoutModule = page?.modules?.find(
		(m: any) => m?._type === 'cart-checkout',
	) as any

	// Lọc bớt các module cart-checkout trong page modules để tránh render đúp
	const otherModules = page?.modules?.filter(
		(m: any) => m?._type !== 'cart-checkout',
	)

	const webhookUrl =
		pageCartCheckoutModule?.webhookUrl ||
		cartCheckoutSettings?.webhookUrl ||
		(productSettings as any)?.webhookUrl ||
		''

	const priceShipping =
		pageCartCheckoutModule?.priceShipping ??
		cartCheckoutSettings?.priceShipping ??
		(productSettings as any)?.priceShipping ??
		0

	const title = pageCartCheckoutModule?.title || page?.title || 'Thanh toán'
	const description =
		pageCartCheckoutModule?.description || (page as any)?.description || ''
	const submitText = pageCartCheckoutModule?.submitText || 'Đặt hàng'
	const showSummary = pageCartCheckoutModule?.showSummary ?? true

	return (
		<main className="min-h-screen py-6 lg:py-10 bg-gray-50/50">
			<div className="container mx-auto px-4 max-w-7xl">
				<CartCheckoutClient
					title={title}
					description={description}
					webhookUrl={webhookUrl}
					submitText={submitText}
					showSummary={showSummary}
					priceShipping={priceShipping}
				/>
			</div>

			{/* Hiển thị các Global Modules hoặc Modules bổ sung từ Sanity nếu có */}
			{otherModules && otherModules.length > 0 && (
				<div className="mt-8">
					<ModulesResolver
						page={{ ...(page as any), modules: otherModules as any }}
						productSettings={productSettings}
					/>
				</div>
			)}
		</main>
	)
}

