import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
	getCheckoutSettings,
	getGlobalModules,
	getPage,
	getProductSettings,
} from '@/sanity/lib/queries'
import CartCheckoutClient from '@/ui/modules/cart-checkout/cart-checkout-client'
import ModulesResolver from '@/ui/modules'

export async function generateMetadata(): Promise<Metadata> {
	const [checkoutSettings, page] = await Promise.all([
		getCheckoutSettings(),
		getPage(['checkout']),
	])

	const meta = checkoutSettings?.metadata ?? page?.metadata ?? {}
	const title = meta.title || checkoutSettings?.title || 'Fast & Secure Checkout'
	const description =
		meta.description ||
		checkoutSettings?.description ||
		'Complete your order with express delivery and secure payment.'

	return {
		title,
		description,
		robots: {
			index: meta.noIndex ? false : undefined,
		},
	}
}

export default async function CheckoutPage() {
	const [checkoutSettings, productSettings, globalModules, page] = await Promise.all([
		getCheckoutSettings(),
		getProductSettings(),
		getGlobalModules('checkout'),
		getPage(['checkout']),
	])

	const title = checkoutSettings?.title || page?.title || 'Fast & Secure Checkout'
	const description =
		checkoutSettings?.description ||
		(page as any)?.description ||
		'Complete your shipping information and payment details below.'
	const submitText = checkoutSettings?.submitText || 'Place Order'
	const showSummary = checkoutSettings?.showSummary ?? true

	const webhookUrl =
		checkoutSettings?.webhookUrl ||
		(productSettings as any)?.webhookUrl ||
		''

	const priceShipping =
		checkoutSettings?.priceShipping ??
		(productSettings as any)?.priceShipping ??
		0

	const topModules = [
		...(globalModules?.before || []),
		...(checkoutSettings?.topModules || []),
	]

	// Preserve any non-checkout modules from legacy page if present
	const legacyOtherModules = (page?.modules || []).filter(
		(m: any) => m?._type !== 'cart-checkout',
	)

	const bottomModules = [
		...(checkoutSettings?.bottomModules || []),
		...legacyOtherModules,
		...(globalModules?.after || []),
	]

	return (
		<main className="min-h-screen py-6 lg:py-10 bg-gray-50/50">
			{/* 1. Top CRO / Urgency Banners */}
			{topModules.length > 0 && (
				<div className="mb-6">
					<ModulesResolver
						modules={topModules}
						productSettings={productSettings}
					/>
				</div>
			)}

			{/* 2. Fixed Core Functional View */}
			<div className="container-max">
				<Suspense
					fallback={
						<div className="min-h-[400px] flex items-center justify-center text-sm text-slate-400">
							Loading checkout...
						</div>
					}
				>
					<CartCheckoutClient
						title={title}
						description={description}
						webhookUrl={webhookUrl}
						submitText={submitText}
						showSummary={showSummary}
						priceShipping={priceShipping}
					/>
				</Suspense>
			</div>

			{/* 3. Bottom CRO Modules (Trust badges, FAQ, Guarantees) */}
			{bottomModules.length > 0 && (
				<div className="mt-8">
					<ModulesResolver
						modules={bottomModules}
						productSettings={productSettings}
					/>
				</div>
			)}
		</main>
	)
}
