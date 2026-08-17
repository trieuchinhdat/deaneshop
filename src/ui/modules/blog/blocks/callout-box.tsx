import { PortableText } from 'next-sanity'
import {
	Info,
	Lightbulb,
	AlertTriangle,
	AlertCircle,
	Quote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalloutBoxProps {
	type?: 'tip' | 'info' | 'warning' | 'danger' | 'quote'
	title?: string
	content?: any[]
}

const CALLOUT_STYLES = {
	tip: {
		container: 'bg-emerald-50/70 border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200',
		iconColor: 'text-emerald-600 dark:text-emerald-400',
		icon: Lightbulb,
		defaultTitle: 'Pro Tip',
	},
	info: {
		container: 'bg-blue-50/70 border-blue-300 text-blue-950 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200',
		iconColor: 'text-blue-600 dark:text-blue-400',
		icon: Info,
		defaultTitle: 'Information',
	},
	warning: {
		container: 'bg-amber-50/70 border-amber-300 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
		iconColor: 'text-amber-600 dark:text-amber-400',
		icon: AlertTriangle,
		defaultTitle: 'Important Note',
	},
	danger: {
		container: 'bg-rose-50/70 border-rose-300 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200',
		iconColor: 'text-rose-600 dark:text-rose-400',
		icon: AlertCircle,
		defaultTitle: 'Caution',
	},
	quote: {
		container: 'bg-zinc-50 border-zinc-300 text-zinc-900 dark:bg-zinc-900/40 dark:border-zinc-700 dark:text-zinc-100',
		iconColor: 'text-zinc-500 dark:text-zinc-400',
		icon: Quote,
		defaultTitle: 'Key Takeaway',
	},
}

export default function CalloutBox({
	type = 'info',
	title,
	content,
}: CalloutBoxProps) {
	const config = CALLOUT_STYLES[type] || CALLOUT_STYLES.info
	const IconComponent = config.icon
	const headingText = title || config.defaultTitle

	return (
		<aside
			role="note"
			className={cn(
				'my-6 flex gap-3.5 rounded-xl border p-4 sm:p-5 shadow-xs transition-all',
				config.container,
			)}
		>
			<div className="shrink-0 pt-0.5">
				<IconComponent className={cn('size-5 sm:size-6', config.iconColor)} aria-hidden="true" />
			</div>
			<div className="min-w-0 flex-1 space-y-1.5 text-sm sm:text-base leading-relaxed">
				{headingText && (
					<strong className="block font-semibold tracking-tight">
						{headingText}
					</strong>
				)}
				{content && content.length > 0 && (
					<div className="prose prose-sm max-w-none opacity-90">
						<PortableText value={content} />
					</div>
				)}
			</div>
		</aside>
	)
}
