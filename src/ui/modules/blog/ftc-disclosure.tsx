import { Info, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FTCDisclosureProps {
	disclosureType?: 'default' | 'affiliate' | 'sponsored' | 'none' | string
	customText?: string
	blogSettings?: {
		defaultFtcDisclosure?: string
		affiliateDisclosureText?: string
		sponsoredDisclosureText?: string
	}
	className?: string
}

export default function FTCDisclosure({
	disclosureType = 'default',
	customText,
	blogSettings,
	className,
}: FTCDisclosureProps) {
	const effectiveType =
		disclosureType && disclosureType !== 'default'
			? disclosureType
			: blogSettings?.defaultFtcDisclosure || 'affiliate'

	if (effectiveType === 'none') return null

	const defaultAffiliateText =
		blogSettings?.affiliateDisclosureText ||
		'We maintain strict editorial independence. We may earn an affiliate commission when you purchase through links on our site at no additional cost to you.'
	const defaultSponsoredText =
		blogSettings?.sponsoredDisclosureText ||
		'This article contains sponsored collaboration. All benchmark evaluations, independent testing, and editorial opinions remain 100% our own.'

	const text =
		customText ||
		(effectiveType === 'sponsored'
			? defaultSponsoredText
			: defaultAffiliateText)

	const isSponsored = effectiveType === 'sponsored'

	return (
		<aside
			role="note"
			aria-label="Editorial & Advertising Disclosure"
			className={cn(
				'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[11px] sm:text-xs leading-relaxed transition-all',
				isSponsored
					? 'border-amber-200/80 bg-amber-50/60 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
					: 'border-zinc-200/70 bg-zinc-50/70 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400',
				className,
			)}
		>
			<div className="shrink-0 pt-0.5">
				{isSponsored ? (
					<ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
				) : (
					<Info className="size-3.5 text-zinc-500 dark:text-zinc-400" />
				)}
			</div>
			<div className="flex-1">
				<span className="font-semibold text-zinc-800 dark:text-zinc-200 mr-1.5 uppercase tracking-wider text-[10px]">
					{isSponsored ? 'Sponsored Collaboration:' : 'Editorial Disclosure:'}
				</span>
				<span>{text}</span>{' '}
				<Link
					href="/terms"
					className="font-medium underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
				>
					Read policy
				</Link>
			</div>
		</aside>
	)
}
