import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import {
	FaCcVisa,
	FaCcMastercard,
	FaCcAmex,
	FaCcJcb,
	FaCcPaypal,
	FaCcApplePay,
} from 'react-icons/fa6'
import { CreditCard, QrCode, ShieldCheck, Banknote } from 'lucide-react'

interface PaymentBadgesProps {
	paymentMethods?: string[]
	trustBadges?: Array<{
		title: string
		image: any
		url?: string
	}>
	showPaymentMethods?: boolean
	showTrustBadges?: boolean
}

export default function PaymentBadges({
	paymentMethods = ['visa', 'mastercard', 'momo', 'vnpay', 'cod'],
	trustBadges = [],
	showPaymentMethods = true,
	showTrustBadges = false,
}: PaymentBadgesProps) {
	const renderPaymentIcon = (method: string) => {
		switch (method) {
			case 'visa':
				return (
					<div
						key="visa"
						title="Visa"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcVisa className="size-5 text-[#1A1F71] dark:text-white" />
					</div>
				)
			case 'mastercard':
				return (
					<div
						key="mastercard"
						title="Mastercard"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcMastercard className="size-5 text-[#EB001B]" />
					</div>
				)
			case 'amex':
				return (
					<div
						key="amex"
						title="American Express"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcAmex className="size-5 text-[#006FCF]" />
					</div>
				)
			case 'jcb':
				return (
					<div
						key="jcb"
						title="JCB"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcJcb className="size-5 text-[#0E4294] dark:text-white" />
					</div>
				)
			case 'paypal':
				return (
					<div
						key="paypal"
						title="PayPal"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcPaypal className="size-5 text-[#003087] dark:text-white" />
					</div>
				)
			case 'apple_pay':
				return (
					<div
						key="apple_pay"
						title="Apple Pay"
						className="flex h-7 items-center justify-center rounded-md border border-border/50 bg-surface px-2 text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<FaCcApplePay className="size-5 text-foreground" />
					</div>
				)
			case 'momo':
				return (
					<div
						key="momo"
						title="MoMo"
						className="flex h-7 items-center justify-center gap-1 rounded-md border border-border/50 bg-surface px-2 text-xs font-bold text-[#A50064] shadow-2xs transition-colors hover:border-primary/50"
					>
						<span className="size-2 rounded-full bg-[#A50064]" />
						<span>MoMo</span>
					</div>
				)
			case 'vnpay':
				return (
					<div
						key="vnpay"
						title="VNPay"
						className="flex h-7 items-center justify-center gap-1 rounded-md border border-border/50 bg-surface px-2 text-xs font-bold text-[#005BAA] shadow-2xs transition-colors hover:border-primary/50"
					>
						<QrCode className="size-3.5 text-[#ED1C24]" />
						<span>VNPay</span>
					</div>
				)
			case 'zalopay':
				return (
					<div
						key="zalopay"
						title="ZaloPay"
						className="flex h-7 items-center justify-center gap-1 rounded-md border border-border/50 bg-surface px-2 text-xs font-bold text-[#008FE5] shadow-2xs transition-colors hover:border-primary/50"
					>
						<span className="size-2 rounded-full bg-[#008FE5]" />
						<span>ZaloPay</span>
					</div>
				)
			case 'cod':
				return (
					<div
						key="cod"
						title="Cash on Delivery"
						className="flex h-7 items-center justify-center gap-1.5 rounded-md border border-border/50 bg-surface px-2 text-xs font-medium text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<Banknote className="size-3.5 text-primary" />
						<span>COD</span>
					</div>
				)
			case 'bank_transfer':
				return (
					<div
						key="bank_transfer"
						title="Bank Transfer"
						className="flex h-7 items-center justify-center gap-1.5 rounded-md border border-border/50 bg-surface px-2 text-xs font-medium text-foreground/80 shadow-2xs transition-colors hover:border-primary/50"
					>
						<CreditCard className="size-3.5 text-primary" />
						<span>Bank</span>
					</div>
				)
			default:
				return null
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-4">
			{/* Trust Badges */}
			{showTrustBadges && trustBadges && trustBadges.length > 0 && (
				<div className="flex flex-wrap items-center gap-3">
					{trustBadges.map((badge, idx) => {
						const imgUrl = badge?.image ? urlFor(badge.image).url() : null
						if (!imgUrl) return null

						const content = (
							<div
								key={idx}
								title={badge.title}
								className="flex h-9 items-center rounded-md border border-border/40 bg-surface/60 p-1 transition-all hover:border-primary/40 hover:bg-surface"
							>
								<Image
									src={imgUrl}
									alt={badge.title || 'Trust Badge'}
									width={80}
									height={28}
									className="h-7 w-auto object-contain"
								/>
							</div>
						)

						return badge.url ? (
							<Link
								key={idx}
								href={badge.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={badge.title}
							>
								{content}
							</Link>
						) : (
							content
						)
					})}
				</div>
			)}

			{/* Payment Gateway Icons */}
			{showPaymentMethods && paymentMethods && paymentMethods.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{paymentMethods.map((method) => renderPaymentIcon(method))}
				</div>
			)}
		</div>
	)
}
