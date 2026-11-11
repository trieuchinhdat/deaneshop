import type { Metadata } from 'next'
import Link from 'next/link'
import {
	HiOutlineCheckCircle,
	HiOutlineShoppingBag,
	HiOutlineHome,
	HiOutlineDocumentText,
	HiOutlineInformationCircle,
	HiOutlineLockClosed,
} from 'react-icons/hi2'
import { ordersDb } from '@/lib/d1'
import { resolveOrderIntent } from '@/lib/order-domain'
import { verifyReceiptToken } from '@/lib/order-receipt'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Request Confirmation | Thank You',
	description: 'Confirmation status for your order or quotation request.',
	robots: { index: false, follow: false },
}

type Props = {
	searchParams: Promise<{ orderId?: string; rt?: string }>
}

export default async function OrderSuccessPage({ searchParams }: Props) {
	const { orderId, rt } = await searchParams
	const cleanOrderId = typeof orderId === 'string' ? orderId.trim() : ''
	const order = cleanOrderId ? await ordersDb.getByOrderNumber(cleanOrderId).catch(() => null) : null
	const hasVerifiedReceipt = Boolean(order && verifyReceiptToken(rt, order.receipt_token_hash))

	if (!hasVerifiedReceipt || !order) {
		return (
			<main className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
				<div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-10 text-center space-y-6">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
						<HiOutlineLockClosed className="h-8 w-8" />
					</div>
					<div className="space-y-2">
						<h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
							Submission Received
						</h1>
						<p className="text-sm text-gray-600 leading-relaxed">
							If you recently submitted an order or quotation request, please retain your confirmation reference from your browser checkout session or email. Full order details are protected against unauthorized lookup.
						</p>
					</div>
					<div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-all"
						>
							<HiOutlineHome className="text-lg" />
							Return to Storefront
						</Link>
					</div>
				</div>
			</main>
		)
	}

	const intent = resolveOrderIntent(order)
	let trade: Record<string, any> = {}
	try {
		trade = JSON.parse(order.commerce_json || '{}') || {}
	} catch {}
	const isRfq = intent === 'wholesale_rfq'
	const isSample = intent === 'sample'
	const isCustomQuote = Boolean(trade.customQuote)

	const headline = isRfq
		? 'Wholesale Quotation Request Received'
		: isSample
			? 'Sample Request Received'
			: 'Order Request Received'

	const subtitle = isRfq
		? 'Your RFQ has been recorded for commercial review. Our export team will prepare and issue your formal proforma quotation.'
		: isSample
			? 'Your sample request has been logged. Our operations team will confirm dispatch details via email.'
			: 'Your order request has been saved and is awaiting fulfillment verification.'

	const statusLabel = isRfq
		? `Quote ${(order.quote_status || 'pending').toUpperCase()}`
		: `Fulfillment ${(order.fulfillment_status || 'pending').toUpperCase()}`

	const paymentMethodLabel = isRfq
		? 'Commercial Terms Pending Quote Issuance'
		: order.payment_method === 'cod'
			? 'Cash on Delivery (Unpaid)'
			: 'Manual Settlement (Unpaid)'

	return (
		<main className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50/50">
			<div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 ring-8 ring-green-50/50">
					<HiOutlineCheckCircle className="h-12 w-12 stroke-[1.5]" />
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
						{headline}
					</h1>
					<p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
				</div>

				<div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5 text-left space-y-3">
					<div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
						<span className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
							<HiOutlineDocumentText className="text-base text-gray-400" />
							{isRfq ? 'RFQ Reference:' : 'Order Number:'}
						</span>
						<span className="font-mono text-sm sm:text-base font-bold text-gray-900 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
							{order.order_number}
						</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">Transaction Type:</span>
						<span className="font-semibold text-gray-800">
							{isRfq ? 'B2B Wholesale RFQ' : isSample ? 'Sample Order' : 'Direct D2C Order'}
						</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">{isRfq ? 'Quoted / Estimated Total:' : 'Order Total:'}</span>
						<span className="font-mono font-bold text-gray-900">
							{isCustomQuote && order.total === 0
								? 'Pending Custom Pricing'
								: `${formatPrice(order.total, order.currency || 'USD')} (${order.currency || 'USD'})`}
						</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">Settlement:</span>
						<span className="font-semibold text-gray-800">{paymentMethodLabel}</span>
					</div>

					<div className="flex items-center justify-between text-xs sm:text-sm">
						<span className="text-gray-500">Current Status:</span>
						<span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-xs">
							{statusLabel}
						</span>
					</div>
				</div>

				<div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100/80 text-left text-xs sm:text-sm text-blue-900 leading-relaxed">
					<p className="font-semibold mb-1 flex items-center gap-1.5 text-blue-800">
						<HiOutlineInformationCircle className="text-base text-blue-600 shrink-0" /> Next Steps:
					</p>
					<p className="text-blue-700/90">
						{isRfq
							? 'Our commercial team will review your quantities, Incoterms, and destination specifications and send a formal quotation link to your email.'
							: 'Our team will verify stock, shipping details, and contact you via email or phone before dispatch.'}
					</p>
				</div>

				<div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						href="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 active:scale-98 transition-all shadow-md cursor-pointer"
					>
						<HiOutlineShoppingBag className="text-lg" />
						Continue Shopping
					</Link>
					<Link
						href="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-98 transition-all cursor-pointer"
					>
						<HiOutlineHome className="text-lg text-gray-500" />
						Back to Home
					</Link>
				</div>
			</div>
		</main>
	)
}
