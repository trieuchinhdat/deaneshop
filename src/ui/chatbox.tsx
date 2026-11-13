'use client'

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ComponentProps,
	type KeyboardEvent,
} from 'react'
import {
	FaCommentDots,
	FaEnvelope,
	FaFacebookF,
	FaFacebookMessenger,
	FaGithub,
	FaHeadset,
	FaInstagram,
	FaLinkedinIn,
	FaPhone,
	FaPinterestP,
	FaSnapchat,
	FaTelegram,
	FaTiktok,
	FaWhatsapp,
	FaXmark,
	FaXTwitter,
	FaYoutube,
} from 'react-icons/fa6'
import { FiExternalLink, FiHelpCircle, FiMail, FiMessageSquare, FiPhone } from 'react-icons/fi'
import { IoIosLink } from 'react-icons/io'
import { LuMessageSquareMore } from 'react-icons/lu'
import { SiZalo } from 'react-icons/si'
import { urlFor } from '@/sanity/lib/image'
import { cn } from '@/lib/utils'
import SanityLink from './sanity-link'

export type FloatingChannelType =
	| 'phone'
	| 'whatsapp'
	| 'email'
	| 'sms'
	| 'messenger'
	| 'instagram'
	| 'telegram'
	| 'custom'
	| 'zalo'
	| string
	| null

export interface FloatingButton {
	_key?: string | null
	type?: FloatingChannelType
	label?: string | null
	subtitle?: string | null
	value?: string | null
	icon?: any | null
	isActive?: boolean | null
	pulse?: boolean | null
}

export type ChatBoxProps = ComponentProps<'div'> & {
	enabled?: boolean | null
	items?: any[] | null
	floatingButtons?: FloatingButton[] | null
	position?: 'bottom-right' | 'bottom-left' | string | null
	displayMode?: 'expandable' | 'stack' | string | null
	deviceVisibility?: 'all' | 'desktop-only' | 'mobile-only' | string | null
	triggerMode?: 'immediate' | 'scroll' | 'delay' | string | null
	themeStyle?: 'primary' | 'dark' | 'light' | string | null
	onlineBadge?: boolean | null
	bottomOffsetMobile?: 'normal' | 'avoid-sticky-cta' | 'high' | 'custom' | string | null
	customBottomOffsetMobile?: string | null
	bottomOffsetDesktop?: 'normal' | 'custom' | string | null
	customBottomOffsetDesktop?: string | null
	mobileDisplayStyle?: 'expanded' | 'compact' | string | null
	mainButtonLabel?: string | null
	mainButtonIcon?: 'chat' | 'phone' | 'support' | 'question' | string | null
}

const CHANNEL_DEFAULTS: Record<string, { label: string; defaultSubtitle: string }> = {
	phone: { label: 'Call Hotline', defaultSubtitle: 'Toll-free customer line' },
	whatsapp: { label: 'WhatsApp', defaultSubtitle: 'Chat with us directly' },
	email: { label: 'Email Support', defaultSubtitle: 'We reply within 24h' },
	sms: { label: 'Text Message', defaultSubtitle: 'SMS direct support' },
	messenger: { label: 'Messenger', defaultSubtitle: 'Chat on Facebook' },
	instagram: { label: 'Instagram', defaultSubtitle: 'Direct message' },
	telegram: { label: 'Telegram', defaultSubtitle: 'Fast messaging' },
	custom: { label: 'Help Desk', defaultSubtitle: 'Customer assistance' },
	zalo: { label: 'Zalo Chat', defaultSubtitle: 'Direct messaging' },
}

interface ResolvedChannel {
	href: string
	target: '_self' | '_blank'
	rel?: string
	ariaLabel: string
	title: string
	subtitle?: string
	isExternal: boolean
}

function resolveChannelAction(btn: FloatingButton): ResolvedChannel | null {
	const type = btn.type || 'custom'
	const rawValue = (btn.value || '').trim()

	// If no destination is set for actionable channel, skip it gracefully
	if (!rawValue && type !== 'custom') {
		return null
	}

	const fallback = CHANNEL_DEFAULTS[type] || {
		label: 'Contact Us',
		defaultSubtitle: '',
	}
	const label = btn.label?.trim() || fallback.label
	const subtitle = btn.subtitle?.trim() || ''

	switch (type) {
		case 'phone': {
			const cleanPhone = rawValue.replace(/[^\d+*#]/g, '')
			const href = rawValue.startsWith('tel:') ? rawValue : `tel:${cleanPhone || rawValue}`
			return {
				href,
				target: '_self',
				ariaLabel: `${label}: Call ${rawValue}${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: false,
			}
		}

		case 'whatsapp': {
			let href = rawValue
			if (!rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
				const cleanDigits = rawValue.replace(/[^\d]/g, '')
				href = `https://wa.me/${cleanDigits}`
			}
			return {
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
				ariaLabel: `${label}: Open WhatsApp chat${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: true,
			}
		}

		case 'email': {
			const cleanEmail = rawValue.replace(/^mailto:/i, '').trim()
			const href = `mailto:${cleanEmail}`
			return {
				href,
				target: '_self',
				ariaLabel: `${label}: Send email to ${cleanEmail}${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: false,
			}
		}

		case 'sms': {
			const cleanDigits = rawValue.replace(/[^\d+]/g, '')
			const href = rawValue.startsWith('sms:') ? rawValue : `sms:${cleanDigits}`
			return {
				href,
				target: '_self',
				ariaLabel: `${label}: Send text message to ${rawValue}${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: false,
			}
		}

		case 'messenger': {
			let href = rawValue
			if (!rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
				const username = rawValue.replace(/^@/, '').trim()
				href = `https://m.me/${encodeURIComponent(username)}`
			}
			return {
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
				ariaLabel: `${label}: Chat on Facebook Messenger${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: true,
			}
		}

		case 'instagram': {
			let href = rawValue
			if (!rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
				const username = rawValue.replace(/^@/, '').trim()
				href = `https://ig.me/m/${encodeURIComponent(username)}`
			}
			return {
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
				ariaLabel: `${label}: Message on Instagram${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: true,
			}
		}

		case 'telegram': {
			let href = rawValue
			if (!rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
				const username = rawValue.replace(/^@/, '').trim()
				href = `https://t.me/${username}`
			}
			return {
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
				ariaLabel: `${label}: Chat on Telegram${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: true,
			}
		}

		case 'zalo': {
			let href = rawValue
			if (!rawValue.startsWith('http://') && !rawValue.startsWith('https://')) {
				href = `https://zalo.me/${rawValue}`
			}
			return {
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
				ariaLabel: `${label}: Open Zalo chat${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: true,
			}
		}

		case 'custom':
		default: {
			const isInternal = rawValue.startsWith('/') || rawValue.startsWith('#')
			return {
				href: rawValue || '#',
				target: isInternal ? '_self' : '_blank',
				rel: isInternal ? undefined : 'noopener noreferrer',
				ariaLabel: `${label}${subtitle ? ' — ' + subtitle : ''}`,
				title: label,
				subtitle,
				isExternal: !isInternal,
			}
		}
	}
}

function formatCustomBottomOffset(val?: string | null): string | null {
	if (!val) return null
	const clean = val.trim()
	if (!clean) return null

	// If already includes a valid CSS length/percent unit, calc, or var
	if (/^calc\(/i.test(clean) || /^var\(/i.test(clean) || /[%a-z]+$/i.test(clean)) {
		return clean
	}

	// If raw digits without unit, e.g. "10" or "80"
	const num = Number(clean)
	if (!isNaN(num)) {
		// If 50 or less, assume percentage (e.g. 15 -> 15%), otherwise px (e.g. 90 -> 90px)
		return num <= 50 ? `${num}%` : `${num}px`
	}

	return clean
}

export default function ChatBox({
	enabled = true,
	items,
	floatingButtons,
	position = 'bottom-right',
	displayMode = 'expandable',
	deviceVisibility = 'all',
	triggerMode = 'scroll',
	themeStyle = 'primary',
	onlineBadge = true,
	bottomOffsetMobile = 'normal',
	customBottomOffsetMobile,
	bottomOffsetDesktop = 'normal',
	customBottomOffsetDesktop,
	mobileDisplayStyle = 'expanded',
	mainButtonLabel = 'Need Help?',
	mainButtonIcon = 'chat',
	className,
	style,
}: ChatBoxProps) {
	const [open, setOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(triggerMode === 'immediate')
	const containerRef = useRef<HTMLDivElement>(null)
	const triggerButtonRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const prevOpenRef = useRef(false)

	// Filter and validate active contact buttons
	const validButtons = (floatingButtons || []).filter((b) => {
		if (b.isActive === false) return false
		const res = resolveChannelAction(b)
		return res !== null
	})
	const hasButtons = validButtons.length > 0
	const hasLegacyItems = (items || []).length > 0

	// Master disabled check: if disabled storewide or no channels configured, render nothing
	const isEnabled = enabled !== false && (hasButtons || hasLegacyItems)

	// Visibility entrance controller
	useEffect(() => {
		if (!isEnabled) return

		if (triggerMode === 'immediate') {
			setIsVisible(true)
			return
		}

		if (triggerMode === 'delay') {
			const timer = setTimeout(() => {
				setIsVisible(true)
			}, 1800)

			const handleScrollEarly = () => {
				if (window.scrollY > 40) {
					setIsVisible(true)
				}
			}
			window.addEventListener('scroll', handleScrollEarly, { passive: true })

			return () => {
				clearTimeout(timer)
				window.removeEventListener('scroll', handleScrollEarly)
			}
		}

		// Mode: scroll
		const handleScroll = () => {
			if (window.scrollY > 80) {
				setIsVisible(true)
			}
		}

		// Also check if document is too short to scroll
		const checkHeight = () => {
			if (typeof document !== 'undefined') {
				const isShortPage =
					document.documentElement.scrollHeight <= window.innerHeight + 80
				if (isShortPage) {
					setIsVisible(true)
				}
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()
		checkHeight()

		return () => window.removeEventListener('scroll', handleScroll)
	}, [isEnabled, triggerMode])

	// Click Outside & Escape Key Listener
	useEffect(() => {
		if (!open) return

		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}

		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				setOpen(false)
				triggerButtonRef.current?.focus()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('touchstart', handleClickOutside, { passive: true })
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('touchstart', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [open])

	// Accessible focus management when expanding/collapsing
	useEffect(() => {
		if (open && !prevOpenRef.current) {
			// Opened: Move focus to the first interactive item in the menu
			const firstItem = menuRef.current?.querySelector<HTMLAnchorElement>(
				'a[role="menuitem"]',
			)
			firstItem?.focus()
		} else if (!open && prevOpenRef.current) {
			// Closed: Return focus to trigger FAB button if focus was inside the menu
			if (
				menuRef.current &&
				document.activeElement &&
				menuRef.current.contains(document.activeElement)
			) {
				triggerButtonRef.current?.focus()
			}
		}
		prevOpenRef.current = open
	}, [open])

	// Keyboard arrow navigation between contact channels
	const handleMenuKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault()
			const items = Array.from(
				menuRef.current?.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]') ||
					[],
			)
			if (!items.length) return

			const currentIndex = items.indexOf(document.activeElement as HTMLAnchorElement)
			let nextIndex = 0

			if (e.key === 'ArrowDown') {
				nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
			} else if (e.key === 'ArrowUp') {
				nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
			}

			items[nextIndex]?.focus()
		}
	}, [])

	if (!isEnabled || !isVisible) {
		return null
	}

	const isLeft = position === 'bottom-left'
	const isSpeedDial = displayMode !== 'stack'

	// Device visibility classes
	const deviceClass =
		deviceVisibility === 'desktop-only'
			? 'max-md:hidden'
			: deviceVisibility === 'mobile-only'
			? 'md:hidden'
			: ''

	// Custom or preset bottom spacing offsets
	const isCustomMobile =
		bottomOffsetMobile === 'custom' && !!customBottomOffsetMobile?.trim()
	const isCustomDesktop =
		bottomOffsetDesktop === 'custom' && !!customBottomOffsetDesktop?.trim()

	const formattedMobileOffset = isCustomMobile
		? formatCustomBottomOffset(customBottomOffsetMobile)
		: null

	const formattedDesktopOffset = isCustomDesktop
		? formatCustomBottomOffset(customBottomOffsetDesktop)
		: null

	const resolvedMobileBottom = isCustomMobile
		? `calc(${formattedMobileOffset} + env(safe-area-inset-bottom, 0px))`
		: bottomOffsetMobile === 'avoid-sticky-cta'
		? 'calc(5.25rem + env(safe-area-inset-bottom, 0px))'
		: bottomOffsetMobile === 'high'
		? 'calc(7.5rem + env(safe-area-inset-bottom, 0px))'
		: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'

	const resolvedDesktopBottom = isCustomDesktop
		? formattedDesktopOffset!
		: bottomOffsetDesktop === 'high' || bottomOffsetMobile === 'high'
		? '2rem'
		: '1.5rem'

	const positionClass = isLeft
		? 'left-4 md:left-6 items-start'
		: 'right-4 md:right-6 items-end'

	const offsetStyles: React.CSSProperties = {
		...style,
		['--floating-bottom-mobile' as any]: resolvedMobileBottom,
		['--floating-bottom-desktop' as any]: resolvedDesktopBottom,
	}

	// Master FAB theme styling
	const fabThemeClasses =
		themeStyle === 'dark'
			? open
				? 'bg-slate-800 text-white shadow-xl shadow-black/25'
				: 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-black/25 active:scale-95'
			: themeStyle === 'light'
			? open
				? 'bg-slate-800 text-white shadow-xl'
				: 'bg-white/95 text-slate-800 border border-slate-200/90 shadow-xl hover:bg-white active:scale-95'
			: open
			? 'bg-slate-900 text-white shadow-xl shadow-black/25'
			: 'bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:brightness-105 active:scale-95'

	return (
		<aside
			ref={containerRef}
			aria-label="Floating contact hub"
			style={offsetStyles}
			className={cn(
				'fixed z-50 flex flex-col gap-3 select-none transition-all duration-300 print:hidden chatbox-container motion-reduce:transition-none',
				'bottom-[var(--floating-bottom-mobile)] md:bottom-[var(--floating-bottom-desktop)]',
				positionClass,
				deviceClass,
				className,
			)}
		>
			{/* ================= MODE 1: SPEED DIAL (EXPANDABLE FAB) ================= */}
			{isSpeedDial ? (
				<>
					{/* Animated Contact Channel Menu Container */}
					<div
						ref={menuRef}
						id="contact-hub-options"
						role="menu"
						aria-label="Contact options"
						aria-hidden={!open}
						onKeyDown={handleMenuKeyDown}
						className={cn(
							'flex flex-col gap-2.5 transition-all duration-300 ease-out motion-reduce:transition-none',
							isLeft ? 'items-start' : 'items-end',
							open
								? 'opacity-100 translate-y-0 pointer-events-auto visible'
								: 'opacity-0 translate-y-3 pointer-events-none invisible h-0 overflow-hidden',
						)}
					>
						{hasButtons ? (
							validButtons.map((btn, idx) => {
								const channel = resolveChannelAction(btn)
								if (!channel) return null

								return (
									<ChannelButton
										key={btn._key || idx}
										btn={btn}
										channel={channel}
										isLeft={isLeft}
										mobileStyle={mobileDisplayStyle}
									/>
								)
							})
						) : (
							/* Legacy items fallback */
							items?.map((item, key) =>
								item._type === 'link' ? (
									<SanityLink
										role="menuitem"
										className="group flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md p-2 shadow-lg border border-slate-200/80 transition-transform hover:scale-105 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
										link={item}
										key={key}
									>
										<div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 shadow-inner">
											<LegacyIcon url={item.external} aria-label={item.label} className="text-xl" />
										</div>
										{item.label && (
											<span className="px-3 text-xs font-semibold text-slate-800 md:text-sm">
												{item.label}
											</span>
										)}
									</SanityLink>
								) : null,
							)
						)}
					</div>

					{/* Master FAB Trigger Button & Label Pill */}
					<div
						className={cn(
							'relative flex items-center gap-2.5',
							isLeft ? 'flex-row' : 'flex-row-reverse',
						)}
					>
						<button
							ref={triggerButtonRef}
							type="button"
							onClick={() => setOpen(!open)}
							className={cn(
								'group relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer motion-reduce:transition-none',
								fabThemeClasses,
							)}
							aria-haspopup="menu"
							aria-expanded={open}
							aria-controls="contact-hub-options"
							aria-label={
								open
									? 'Close contact options menu'
									: mainButtonLabel
									? `Open contact channels: ${mainButtonLabel}`
									: 'Open contact channels menu'
							}
						>
							{/* Live Online Availability Status Dot */}
							{onlineBadge && !open && (
								<span
									className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center"
									aria-hidden="true"
								>
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
									<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
								</span>
							)}

							{/* Icon with smooth rotate transition */}
							<div
								className={cn(
									'transition-transform duration-300 motion-reduce:transition-none',
									open ? 'rotate-90' : 'rotate-0',
								)}
							>
								{open ? (
									<FaXmark size={22} className="text-current" aria-hidden="true" />
								) : (
									<MasterIcon style={mainButtonIcon} />
								)}
							</div>
						</button>

						{/* Desktop Label Pill (When closed) */}
						{!open && mainButtonLabel && (
							<button
								type="button"
								onClick={() => setOpen(true)}
								className={cn(
									'hidden md:inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-md border border-slate-200/80 dark:border-slate-800 transition-all duration-200 hover:bg-white dark:hover:bg-slate-900 hover:scale-102 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer',
								)}
								aria-label={`Open contact options: ${mainButtonLabel}`}
							>
								<span>{mainButtonLabel}</span>
							</button>
						)}
					</div>
				</>
			) : (
				/* ================= MODE 2: ALWAYS-EXPANDED STACK ================= */
				<div
					id="contact-hub-stack"
					role="region"
					aria-label="Direct contact channels"
					className={cn('flex flex-col gap-2.5', isLeft ? 'items-start' : 'items-end')}
				>
					{validButtons.map((btn, idx) => {
						const channel = resolveChannelAction(btn)
						if (!channel) return null

						return (
							<ChannelButton
								key={btn._key || idx}
								btn={btn}
								channel={channel}
								isLeft={isLeft}
								mobileStyle={mobileDisplayStyle}
								stacked
							/>
						)
					})}
				</div>
			)}
		</aside>
	)
}

interface ChannelButtonProps {
	btn: FloatingButton
	channel: ResolvedChannel
	isLeft: boolean
	mobileStyle?: string | null
	stacked?: boolean
}

function ChannelButton({
	btn,
	channel,
	isLeft,
	mobileStyle = 'expanded',
	stacked = false,
}: ChannelButtonProps) {
	const isCompactMobile = mobileStyle === 'compact'
	const customIconUrl = btn.icon
		? urlFor(btn.icon).width(48).height(48).auto('format').url()
		: null

	return (
		<a
			role="menuitem"
			href={channel.href}
			target={channel.target}
			rel={channel.rel}
			aria-label={channel.ariaLabel}
			data-track-cta={`chat_channel:${btn.type || channel.title}`}
			className={cn(
				'group relative flex items-center gap-3 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-1.5 shadow-lg shadow-black/8 transition-all duration-200 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 hover:scale-102 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-98 motion-reduce:transition-none',
				isLeft ? 'flex-row pr-4' : 'flex-row-reverse pl-4',
				btn.pulse &&
					'ring-2 ring-emerald-500/50 shadow-emerald-500/20 animate-pulse motion-reduce:animate-none',
				isCompactMobile && 'max-md:p-1 max-md:pr-1 max-md:pl-1',
			)}
		>
			{/* Channel Icon Bubble */}
			<div
				className={cn(
					'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none',
					getChannelBadgeBg(btn.type),
				)}
			>
				{customIconUrl ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={customIconUrl}
						alt=""
						className="h-6 w-6 object-contain rounded-full"
						aria-hidden="true"
					/>
				) : (
					<ChannelIcon type={btn.type} className="text-xl" />
				)}
			</div>

			{/* Label & Subtitle Text Pill */}
			<div
				className={cn(
					'flex flex-col',
					isLeft ? 'text-left' : 'text-right',
					isCompactMobile && 'max-md:hidden',
					stacked && 'hidden group-hover:flex md:flex',
				)}
			>
				<span className="whitespace-nowrap text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
					{channel.title}
				</span>
				{channel.subtitle && (
					<span className="whitespace-nowrap text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-normal">
						{channel.subtitle}
					</span>
				)}
			</div>
		</a>
	)
}

function getChannelBadgeBg(type?: string | null) {
	switch (type) {
		case 'whatsapp':
			return 'bg-[#25D366] text-white shadow-[#25D366]/30'
		case 'phone':
			return 'bg-emerald-600 text-white shadow-emerald-600/30'
		case 'email':
			return 'bg-indigo-600 text-white shadow-indigo-600/30'
		case 'sms':
			return 'bg-amber-600 text-white shadow-amber-600/30'
		case 'messenger':
			return 'bg-[#0084FF] text-white shadow-[#0084FF]/30'
		case 'instagram':
			return 'bg-linear-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white'
		case 'telegram':
			return 'bg-[#229ED9] text-white shadow-[#229ED9]/30'
		case 'zalo':
			return 'bg-[#0068FF] text-white shadow-[#0068FF]/30'
		case 'custom':
		default:
			return 'bg-slate-800 dark:bg-slate-700 text-white'
	}
}

function ChannelIcon({ type, className }: { type?: string | null; className?: string }) {
	switch (type) {
		case 'phone':
			return <FiPhone className={cn('text-lg', className)} aria-hidden="true" />
		case 'whatsapp':
			return <FaWhatsapp className={cn('text-xl', className)} aria-hidden="true" />
		case 'email':
			return <FiMail className={cn('text-lg', className)} aria-hidden="true" />
		case 'sms':
			return <FaCommentDots className={cn('text-lg', className)} aria-hidden="true" />
		case 'messenger':
			return <FaFacebookMessenger className={cn('text-lg', className)} aria-hidden="true" />
		case 'instagram':
			return <FaInstagram className={cn('text-lg', className)} aria-hidden="true" />
		case 'telegram':
			return <FaTelegram className={cn('text-lg', className)} aria-hidden="true" />
		case 'zalo':
			return <SiZalo className={cn('text-lg', className)} aria-hidden="true" />
		case 'custom':
		default:
			return <FiExternalLink className={cn('text-base', className)} aria-hidden="true" />
	}
}

function MasterIcon({ style }: { style?: string | null }) {
	if (style === 'phone') {
		return <FaPhone size={20} className="text-current" aria-hidden="true" />
	}
	if (style === 'support') {
		return <FaHeadset size={22} className="text-current" aria-hidden="true" />
	}
	if (style === 'question') {
		return <FiHelpCircle size={22} className="text-current" aria-hidden="true" />
	}
	return <LuMessageSquareMore size={24} className="text-current" aria-hidden="true" />
}

function LegacyIcon({
	url,
	className = '',
	...props
}: { url?: string } & React.ComponentProps<'svg'>) {
	if (!url) return null
	if (url.startsWith('tel:')) {
		return <FaPhone className={cn('text-emerald-600', className)} {...props} />
	}
	if (url.includes('zalo') || url.includes('zalo://')) {
		return <SiZalo className={cn('text-blue-500', className)} {...props} />
	}
	if (url.includes('bsky.app')) {
		return <FaBlueskyIcon className={cn('text-sky-500', className)} {...props} />
	}
	if (url.includes('facebook.com')) {
		return <FaFacebookF className={cn('text-blue-600', className)} {...props} />
	}
	if (url.includes('messenger.com')) {
		return <FaFacebookMessenger className={cn('text-blue-600', className)} {...props} />
	}
	if (url.includes('github.com')) {
		return <FaGithub className={cn('text-gray-800', className)} {...props} />
	}
	if (url.includes('instagram.com')) {
		return <FaInstagram className={cn('text-pink-500', className)} {...props} />
	}
	if (url.includes('linkedin.com')) {
		return <FaLinkedinIn className={cn('text-blue-700', className)} {...props} />
	}
	if (url.includes('tiktok.com')) {
		return <FaTiktok className={cn('text-black', className)} {...props} />
	}
	if (url.includes('twitter.com') || url.includes('x.com')) {
		return <FaXTwitter className={cn('text-black', className)} {...props} />
	}
	if (url.includes('youtube.com')) {
		return <FaYoutube className={cn('text-red-600', className)} {...props} />
	}
	if (url.includes('pinterest.com')) {
		return <FaPinterestP className={cn('text-red-600', className)} {...props} />
	}
	if (url.includes('snapchat.com')) {
		return <FaSnapchat className={cn('text-yellow-600', className)} {...props} />
	}

	return <IoIosLink className={cn('text-gray-500', className)} {...props} />
}

function FaBlueskyIcon(props: React.ComponentProps<'svg'>) {
	return <IoIosLink {...props} />
}
