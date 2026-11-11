import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import {
	FaCcVisa,
	FaCcMastercard,
	FaCcAmex,
	FaCcDiscover,
	FaCcPaypal,
	FaCcApplePay,
	FaCcJcb,
	FaGooglePay,
} from 'react-icons/fa6'
import { SiAfterpay, SiKlarna } from 'react-icons/si'
import { CreditCard, Banknote } from 'lucide-react'

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
	paymentMethods = ['visa', 'mastercard', 'amex', 'apple_pay', 'google_pay', 'paypal', 'shop_pay', 'klarna'],
	trustBadges = [],
	showPaymentMethods = true,
	showTrustBadges = false,
}: PaymentBadgesProps) {
	const pillClass =
		'flex h-[24px] w-[38px] items-center justify-center rounded-[4px] border border-border/50 bg-white dark:bg-slate-900 text-foreground/80 shadow-2xs transition-all hover:border-primary/50 hover:text-foreground shrink-0 overflow-hidden select-none'

	const renderPaymentIcon = (method: string) => {
		switch (method) {
			case 'visa':
				return (
					<div key="visa" title="Visa" aria-label="Visa" className={pillClass}>
						<FaCcVisa className="size-5 text-[#1A1F71] dark:text-white" />
					</div>
				)
			case 'mastercard':
				return (
					<div key="mastercard" title="Mastercard" aria-label="Mastercard" className={pillClass}>
						<FaCcMastercard className="size-5 text-[#EB001B]" />
					</div>
				)
			case 'amex':
				return (
					<div key="amex" title="American Express" aria-label="American Express" className={pillClass}>
						<FaCcAmex className="size-5 text-[#006FCF]" />
					</div>
				)
			case 'discover':
				return (
					<div key="discover" title="Discover" aria-label="Discover" className={pillClass}>
						<FaCcDiscover className="size-5 text-[#FF6000]" />
					</div>
				)
			case 'paypal':
				return (
					<div key="paypal" title="PayPal" aria-label="PayPal" className={pillClass}>
						<FaCcPaypal className="size-4 text-[#003087] dark:text-white" />
					</div>
				)
			case 'apple_pay':
				return (
					<div key="apple_pay" title="Apple Pay" aria-label="Apple Pay" className={pillClass}>
						<FaCcApplePay className="size-5 text-foreground" />
					</div>
				)
			case 'google_pay':
				return (
					<div key="google_pay" title="Google Pay" aria-label="Google Pay" className={pillClass}>
						<FaGooglePay className="size-6 text-foreground" />
					</div>
				)
			case 'shop_pay':
				return (
					<div key="shop_pay" title="Shop Pay" aria-label="Shop Pay" className={pillClass}>
						<span className="text-[9px] font-black tracking-tight text-[#5A31F4]">Shop</span>
					</div>
				)
			case 'klarna':
				return (
					<div key="klarna" title="Klarna" aria-label="Klarna" className={pillClass}>
						<SiKlarna className="size-4 text-[#FFB3C7] dark:text-pink-300" />
					</div>
				)
			case 'afterpay':
				return (
					<div key="afterpay" title="Afterpay / Clearpay" aria-label="Afterpay" className={pillClass}>
						<SiAfterpay className="size-3.5 text-[#B2FCE4] dark:text-emerald-400" />
					</div>
				)
			case 'jcb':
				return (
					<div key="jcb" title="JCB" aria-label="JCB" className={pillClass}>
						<FaCcJcb className="size-5 text-[#0E4292] dark:text-white" />
					</div>
				)
			case 'maestro':
				return (
					<div key="maestro" title="Maestro" aria-label="Maestro" className={pillClass}>
						<span className="flex items-center -space-x-1">
							<span className="size-2.5 rounded-full bg-[#EB001B]" />
							<span className="size-2.5 rounded-full bg-[#006FCF] opacity-80" />
						</span>
					</div>
				)
			case 'unionpay':
				return (
					<div key="unionpay" title="UnionPay" aria-label="UnionPay" className={pillClass}>
						<span className="text-[8px] font-bold text-[#E21E26] tracking-tighter">Union</span>
					</div>
				)
			case 'cod':
				return (
					<div key="cod" title="Cash on Delivery" aria-label="Cash on Delivery" className={pillClass}>
						<Banknote className="size-3.5 text-foreground/70" />
					</div>
				)
			case 'bank_transfer':
				return (
					<div key="bank_transfer" title="Bank Wire / Transfer" aria-label="Bank Transfer" className={pillClass}>
						<CreditCard className="size-3.5 text-foreground/70" />
					</div>
				)
			default:
				return null
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			{/* Trust Badges & Seals */}
			{showTrustBadges && trustBadges && trustBadges.length > 0 && (
				<div className="flex flex-wrap items-center gap-2" aria-label="Trust and Security Seals">
					{trustBadges.map((badge, idx) => {
						const imgUrl = badge?.image?.asset ? urlFor(badge.image).url() : null
						if (!imgUrl) return null

						const content = (
							<div
								key={idx}
								title={badge.title}
								className="flex h-7 items-center rounded-md border border-border/40 bg-surface/60 px-1.5 py-0.5 transition-all hover:border-primary/40 hover:bg-surface"
							>
								<Image
									src={imgUrl}
									alt={badge.title || 'Trust Badge'}
									width={70}
									height={24}
									unoptimized
									className="h-5 w-auto object-contain"
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
				<div
					className="flex flex-wrap items-center gap-1.5"
					aria-label="Accepted Payment Methods"
				>
					{paymentMethods.map((method) => renderPaymentIcon(method))}
				</div>
			)}
		</div>
	)
}
