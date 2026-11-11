import {
	AlertTriangle,
	CheckCircle2,
	ExternalLink,
	Info,
	Megaphone,
	ShieldCheck,
	Sparkles,
	Tag,
} from 'lucide-react'
import {
	PortableText,
	stegaClean,
	type PortableTextComponents,
} from 'next-sanity'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Callout } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import { moduleAttributes, type ModuleProps } from './module-utils'

/* -------------------------------------------------------------------------
 * ICON MAPPINGS
 * ------------------------------------------------------------------------- */
const HEADER_ICONS = {
	info: Info,
	tag: Tag,
	announcement: Megaphone,
	sparkle: Sparkles,
	shield: ShieldCheck,
	check: CheckCircle2,
	alert: AlertTriangle,
	none: null,
} as const

const TAG_ICONS = {
	tag: Tag,
	sparkle: Sparkles,
	check: CheckCircle2,
	none: null,
} as const

/* -------------------------------------------------------------------------
 * THEME STYLING PRESETS
 * Fully calibrated for WCAG 2.2 AA contrast in Light and Dark modes.
 * ------------------------------------------------------------------------- */
const THEME_STYLES = {
	brand: {
		container:
			'bg-primary/5 dark:bg-primary/10 border-primary/20 text-foreground',
		borderAccentLeft: 'border-l-primary',
		borderAccentTop: 'border-t-primary',
		borderFull: 'border-primary/40',
		iconBox: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
		badge:
			'bg-primary/10 text-primary border-primary/25 dark:bg-primary/20 dark:text-primary',
		tag: 'bg-surface/90 hover:bg-primary/10 border-border/80 text-foreground',
		tagIcon: 'text-primary',
	},
	urgent: {
		container:
			'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/25 text-amber-950 dark:text-amber-100',
		borderAccentLeft: 'border-l-amber-600 dark:border-l-amber-500',
		borderAccentTop: 'border-t-amber-600 dark:border-t-amber-500',
		borderFull: 'border-amber-600/40 dark:border-amber-500/40',
		iconBox:
			'bg-amber-500/20 text-amber-800 dark:bg-amber-500/25 dark:text-amber-300',
		badge:
			'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30',
		tag: 'bg-surface/90 hover:bg-amber-500/15 border-border/80 text-foreground',
		tagIcon: 'text-amber-600 dark:text-amber-400',
	},
	success: {
		container:
			'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/25 text-emerald-950 dark:text-emerald-100',
		borderAccentLeft: 'border-l-emerald-600 dark:border-l-emerald-500',
		borderAccentTop: 'border-t-emerald-600 dark:border-t-emerald-500',
		borderFull: 'border-emerald-600/40 dark:border-emerald-500/40',
		iconBox:
			'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300',
		badge:
			'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/30',
		tag: 'bg-surface/90 hover:bg-emerald-500/15 border-border/80 text-foreground',
		tagIcon: 'text-emerald-600 dark:text-emerald-400',
	},
	dark: {
		container:
			'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl dark:bg-neutral-950 dark:border-neutral-800',
		borderAccentLeft: 'border-l-neutral-400',
		borderAccentTop: 'border-t-neutral-400',
		borderFull: 'border-neutral-700',
		iconBox: 'bg-neutral-800 text-neutral-100',
		badge: 'bg-neutral-800 text-neutral-200 border-neutral-700',
		tag: 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100',
		tagIcon: 'text-neutral-300',
	},
	neutral: {
		container: 'bg-surface border-border text-foreground shadow-2xs',
		borderAccentLeft: 'border-l-foreground/60',
		borderAccentTop: 'border-t-foreground/60',
		borderFull: 'border-border',
		iconBox: 'bg-muted text-foreground',
		badge: 'bg-muted text-foreground border-border/80',
		tag: 'bg-surface hover:bg-muted border-border/80 text-foreground',
		tagIcon: 'text-muted-foreground',
	},
} as const

/* -------------------------------------------------------------------------
 * CONTAINER MAX-WIDTH OPTIONS
 * ------------------------------------------------------------------------- */
const MAX_WIDTH_MAP = {
	narrow: 'max-w-2xl',
	standard: 'max-w-4xl',
	wide: 'max-w-6xl',
} as const

/* -------------------------------------------------------------------------
 * MAIN COMPONENT
 * ------------------------------------------------------------------------- */
export default function CalloutModule({
	badge,
	intro = [],
	ctas,
	ctaSubtext,
	layout = 'centered',
	themeStyle = 'brand',
	customAccentColor,
	customBackgroundColor,
	customTextColor,
	iconStyle = 'info',
	borderStyle = 'accent-left',
	maxWidth = 'standard',
	textAlign = 'center',
	...props
}: Callout & ModuleProps) {
	// Clean stega attributes for presentation mode stability
	const cleanLayout = (stegaClean(layout) || 'centered') as
		'centered' | 'split' | 'compact'
	const cleanTheme = (stegaClean(themeStyle) || 'brand') as
		'brand' | 'urgent' | 'success' | 'dark' | 'neutral' | 'custom'
	const cleanIcon = (stegaClean(iconStyle) || 'info') as
		| 'info'
		| 'tag'
		| 'announcement'
		| 'sparkle'
		| 'shield'
		| 'check'
		| 'alert'
		| 'none'
	const cleanBorderStyle = (stegaClean(borderStyle) || 'accent-left') as
		'accent-left' | 'accent-top' | 'full' | 'subtle'
	const cleanMaxWidth = (stegaClean(maxWidth) || 'standard') as
		'standard' | 'narrow' | 'wide'
	const cleanTextAlign = (stegaClean(textAlign) || 'center') as
		'center' | 'left'
	const cleanBadge = stegaClean(badge)
	const cleanSubtext = stegaClean(ctaSubtext)

	// Custom Accent Color Overrides
	const isCustom = cleanTheme === 'custom'
	const rawAccent = customAccentColor
		? stegaClean(customAccentColor)
		: undefined
	const cleanAccent =
		rawAccent && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawAccent)
			? rawAccent
			: '#6366F1'
	const rawBg = customBackgroundColor
		? stegaClean(customBackgroundColor)
		: undefined
	const cleanCustomBg =
		rawBg && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawBg)
			? rawBg
			: undefined
	const rawText = customTextColor ? stegaClean(customTextColor) : undefined
	const cleanCustomText =
		rawText && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(rawText)
			? rawText
			: undefined

	const customContainerStyle: React.CSSProperties = isCustom
		? {
				backgroundColor: cleanCustomBg || `${cleanAccent}0D`,
				borderColor:
					cleanBorderStyle === 'full' ? `${cleanAccent}55` : `${cleanAccent}33`,
				borderLeftColor:
					cleanBorderStyle === 'accent-left' ? cleanAccent : undefined,
				borderTopColor:
					cleanBorderStyle === 'accent-top' ? cleanAccent : undefined,
				color: cleanCustomText || undefined,
			}
		: {}

	const customIconBoxStyle: React.CSSProperties = isCustom
		? {
				backgroundColor: `${cleanAccent}1F`,
				color: cleanAccent,
			}
		: {}

	const customBadgeStyle: React.CSSProperties = isCustom
		? {
				backgroundColor: `${cleanAccent}18`,
				color: cleanAccent,
				borderColor: `${cleanAccent}40`,
			}
		: {}

	const customTagIconStyle: React.CSSProperties = isCustom
		? {
				color: cleanAccent,
			}
		: {}

	const themeConfig =
		cleanTheme in THEME_STYLES
			? THEME_STYLES[cleanTheme as keyof typeof THEME_STYLES]
			: THEME_STYLES.brand
	const HeaderIconComponent = HEADER_ICONS[cleanIcon]
	const maxWidthClass = MAX_WIDTH_MAP[cleanMaxWidth] || MAX_WIDTH_MAP.standard

	// Resolve border classes based on merchant configuration
	let borderClasses = 'border'
	if (cleanBorderStyle === 'accent-left') {
		borderClasses = cn(
			'border border-l-4',
			!isCustom && themeConfig.borderAccentLeft,
		)
	} else if (cleanBorderStyle === 'accent-top') {
		borderClasses = cn(
			'border border-t-4',
			!isCustom && themeConfig.borderAccentTop,
		)
	} else if (cleanBorderStyle === 'full') {
		borderClasses = cn('border-2', !isCustom && themeConfig.borderFull)
	} else if (cleanBorderStyle === 'subtle') {
		borderClasses = 'border border-border/80'
	}

	// PortableText custom rendering components
	const portableTextComponents: PortableTextComponents = {
		block: {
			h1: ({ children }) => (
				<h1 className="mb-3 text-2xl leading-snug font-bold tracking-tight text-inherit sm:text-3xl lg:text-4xl">
					{children}
				</h1>
			),
			h2: ({ children }) => (
				<h2 className="mb-2.5 text-xl leading-snug font-bold tracking-tight text-inherit sm:text-2xl lg:text-3xl">
					{children}
				</h2>
			),
			h3: ({ children }) => (
				<h3 className="mb-2 text-lg leading-normal font-semibold tracking-tight text-inherit sm:text-xl">
					{children}
				</h3>
			),
			h4: ({ children }) => (
				<h4 className="mb-2 text-base leading-normal font-semibold text-inherit sm:text-lg">
					{children}
				</h4>
			),
			h5: ({ children }) => (
				<h5 className="mb-1.5 text-sm leading-normal font-semibold text-inherit sm:text-base">
					{children}
				</h5>
			),
			h6: ({ children }) => (
				<h6 className="mb-1.5 text-xs font-semibold tracking-wider text-inherit uppercase sm:text-sm">
					{children}
				</h6>
			),
			normal: ({ children }) => (
				<p className="my-2 text-sm leading-relaxed opacity-90 sm:text-base">
					{children}
				</p>
			),
			blockquote: ({ children }) => (
				<blockquote className="my-3 border-l-2 border-current/30 pl-4 text-sm italic opacity-90 sm:text-base">
					{children}
				</blockquote>
			),
		},
		list: {
			bullet: ({ children }) => (
				<ul className="my-2.5 inline-block list-inside list-disc space-y-1 text-left text-sm leading-relaxed opacity-90 sm:text-base">
					{children}
				</ul>
			),
			number: ({ children }) => (
				<ol className="my-2.5 inline-block list-inside list-decimal space-y-1 text-left text-sm leading-relaxed opacity-90 sm:text-base">
					{children}
				</ol>
			),
		},
		types: {
			tag: ({ value }) => {
				if (!value?.label) return null
				const label = stegaClean(value.label)
				const href = value.href ? stegaClean(value.href) : undefined
				const iconKey = (stegaClean(value.icon) || 'tag') as
					'tag' | 'sparkle' | 'check' | 'none'
				const TagIcon = TAG_ICONS[iconKey]
				const isExternal = Boolean(
					href && (href.startsWith('http://') || href.startsWith('https://')),
				)

				const pillClass = cn(
					'mx-1 my-1 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all shadow-2xs',
					!isCustom && themeConfig.tag,
					isCustom &&
						'border-border/80 bg-surface/90 text-foreground hover:bg-muted',
					href &&
						'hover:scale-[1.02] active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
				)

				if (href) {
					if (isExternal) {
						return (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className={pillClass}
							>
								{TagIcon && (
									<TagIcon
										className={cn(
											'size-3.5 shrink-0',
											!isCustom && themeConfig.tagIcon,
										)}
										style={customTagIconStyle}
										aria-hidden="true"
									/>
								)}
								<span>{label}</span>
								<ExternalLink
									className="ml-0.5 size-3 opacity-60"
									aria-hidden="true"
								/>
							</a>
						)
					}
					return (
						<Link href={href} className={pillClass}>
							{TagIcon && (
								<TagIcon
									className={cn(
										'size-3.5 shrink-0',
										!isCustom && themeConfig.tagIcon,
									)}
									style={customTagIconStyle}
									aria-hidden="true"
								/>
							)}
							<span>{label}</span>
						</Link>
					)
				}

				return (
					<span className={pillClass}>
						{TagIcon && (
							<TagIcon
								className={cn(
									'size-3.5 shrink-0',
									!isCustom && themeConfig.tagIcon,
								)}
								style={customTagIconStyle}
								aria-hidden="true"
							/>
						)}
						<span>{label}</span>
					</span>
				)
			},
		},
	}

	return (
		<section className="section py-8 sm:py-12" {...moduleAttributes(props)}>
			<aside
				role="region"
				aria-label={cleanBadge || 'Promotional Announcement'}
				className={cn(
					'relative overflow-hidden rounded-2xl shadow-2xs transition-all sm:rounded-3xl',
					!isCustom && themeConfig.container,
					borderClasses,
					maxWidthClass,
					'mx-auto',
					cleanLayout === 'compact'
						? 'p-4 sm:p-6 lg:p-7'
						: 'p-5 sm:p-8 lg:p-11',
				)}
				style={customContainerStyle}
			>
				{/* --------------------------------------------------------
				 * LAYOUT: CENTERED CARD
				 * -------------------------------------------------------- */}
				{cleanLayout === 'centered' && (
					<div
						className={cn(
							'space-y-4',
							cleanTextAlign === 'center' ? 'text-center' : 'text-left',
						)}
					>
						{/* Header Icon */}
						{HeaderIconComponent && (
							<div
								className={cn(
									'flex size-12 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105',
									cleanTextAlign === 'center' ? 'mx-auto' : 'mr-auto',
									!isCustom && themeConfig.iconBox,
								)}
								style={customIconBoxStyle}
							>
								<HeaderIconComponent className="size-6" aria-hidden="true" />
							</div>
						)}

						{/* Eyebrow / Promo Badge */}
						{cleanBadge && (
							<div
								className={cn(
									'flex',
									cleanTextAlign === 'center'
										? 'justify-center'
										: 'justify-start',
								)}
							>
								<span
									className={cn(
										'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wider uppercase shadow-2xs',
										!isCustom && themeConfig.badge,
									)}
									style={customBadgeStyle}
								>
									{cleanBadge}
								</span>
							</div>
						)}

						{/* Main Content Body */}
						{intro && intro.length > 0 && (
							<div
								className={cn(
									'prose prose-neutral dark:prose-invert max-w-none text-balance',
									cleanTextAlign === 'center' ? 'mx-auto max-w-2xl' : '',
								)}
							>
								<PortableText
									value={intro}
									components={portableTextComponents}
								/>
							</div>
						)}

						{/* Actions & Reassurance Micro-Copy */}
						{((ctas && ctas.length > 0) || cleanSubtext) && (
							<div
								className={cn(
									'space-y-2.5 pt-2',
									cleanTextAlign === 'center'
										? 'flex flex-col items-center'
										: 'flex flex-col items-start',
								)}
							>
								{ctas && ctas.length > 0 && (
									<CTAList
										ctas={ctas}
										className={cn(
											cleanTextAlign === 'center'
												? 'justify-center'
												: 'justify-start',
										)}
									/>
								)}
								{cleanSubtext && (
									<p className="text-muted-foreground text-xs leading-normal opacity-85 sm:text-sm">
										{cleanSubtext}
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{/* --------------------------------------------------------
				 * LAYOUT: SPLIT BANNER (HORIZONTAL ON DESKTOP)
				 * -------------------------------------------------------- */}
				{cleanLayout === 'split' && (
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
						{/* Left / Main Content Column */}
						<div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
							{HeaderIconComponent && (
								<div
									className={cn(
										'mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-105',
										!isCustom && themeConfig.iconBox,
									)}
									style={customIconBoxStyle}
								>
									<HeaderIconComponent className="size-6" aria-hidden="true" />
								</div>
							)}

							<div className="min-w-0 flex-1 space-y-2">
								{cleanBadge && (
									<span
										className={cn(
											'mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-0.5 text-xs font-bold tracking-wider uppercase shadow-2xs',
											!isCustom && themeConfig.badge,
										)}
										style={customBadgeStyle}
									>
										{cleanBadge}
									</span>
								)}

								{intro && intro.length > 0 && (
									<div className="prose prose-neutral dark:prose-invert max-w-none text-balance">
										<PortableText
											value={intro}
											components={portableTextComponents}
										/>
									</div>
								)}
							</div>
						</div>

						{/* Right / CTA & Subtext Column */}
						{((ctas && ctas.length > 0) || cleanSubtext) && (
							<div className="flex shrink-0 flex-col items-start gap-2.5 pt-2 lg:items-end lg:pt-0">
								{ctas && ctas.length > 0 && (
									<CTAList
										ctas={ctas}
										className="justify-start lg:justify-end"
									/>
								)}
								{cleanSubtext && (
									<p className="text-muted-foreground max-w-xs text-left text-xs leading-normal opacity-85 sm:text-sm lg:text-right">
										{cleanSubtext}
									</p>
								)}
							</div>
						)}
					</div>
				)}

				{/* --------------------------------------------------------
				 * LAYOUT: COMPACT STRIP (SLIM BAR)
				 * -------------------------------------------------------- */}
				{cleanLayout === 'compact' && (
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex min-w-0 flex-1 items-center gap-3.5">
							{HeaderIconComponent && (
								<div
									className={cn(
										'flex size-10 shrink-0 items-center justify-center rounded-xl',
										!isCustom && themeConfig.iconBox,
									)}
									style={customIconBoxStyle}
								>
									<HeaderIconComponent className="size-5" aria-hidden="true" />
								</div>
							)}

							<div className="min-w-0 flex-1">
								{cleanBadge && (
									<span
										className={cn(
											'mr-2 inline-block rounded-full border px-2.5 py-0.5 align-middle text-[11px] font-bold tracking-wider uppercase',
											!isCustom && themeConfig.badge,
										)}
										style={customBadgeStyle}
									>
										{cleanBadge}
									</span>
								)}
								{intro && intro.length > 0 && (
									<div className="prose prose-sm dark:prose-invert inline max-w-none align-middle">
										<PortableText
											value={intro}
											components={portableTextComponents}
										/>
									</div>
								)}
							</div>
						</div>

						{ctas && ctas.length > 0 && (
							<div className="shrink-0 pt-1 sm:pt-0">
								<CTAList ctas={ctas} className="justify-start sm:justify-end" />
							</div>
						)}
					</div>
				)}
			</aside>
		</section>
	)
}
