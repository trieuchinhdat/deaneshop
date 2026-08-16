'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import {
	FaBluesky,
	FaFacebookF,
	FaFacebookMessenger,
	FaGithub,
	FaHeadset,
	FaInstagram,
	FaLinkedinIn,
	FaPhone,
	FaPinterestP,
	FaSnapchat,
	FaTiktok,
	FaXmark,
	FaXTwitter,
	FaYoutube,
} from 'react-icons/fa6'
import { IoIosLink } from 'react-icons/io'
import { LuMessageSquareMore } from 'react-icons/lu'
import { SiZalo } from 'react-icons/si'
import { cn } from '@/lib/utils'
import SanityLink from './sanity-link'

type ChatBoxProps = ComponentProps<'div'> & {
	items?: any[]
	floatingButtons?: any[]
	position?: string
	displayMode?: 'expandable' | 'stack' | string
	mainButtonLabel?: string
	mainButtonIcon?: 'chat' | 'phone' | 'support' | string
}

export default function ChatBox({
	items,
	floatingButtons,
	position = 'bottom-right',
	displayMode = 'expandable',
	mainButtonLabel = 'Need Help?',
	mainButtonIcon = 'chat',
	className,
}: ChatBoxProps) {
	const [open, setOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	// Scroll trigger for clean initial page load
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 120) {
				setIsVisible(true)
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll() // Check initial scroll position
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Click Outside to Close Speed Dial
	useEffect(() => {
		if (!open) return

		const handleClickOutside = (e: MouseEvent | TouchEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false)
			}
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('touchstart', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('touchstart', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [open])

	const buttons = floatingButtons?.filter((b) => b.isActive !== false) || []
	const hasButtons = buttons.length > 0
	const hasLegacyItems = items && items.length > 0

	if ((!hasButtons && !hasLegacyItems) || !isVisible) return null

	const isLeft = position === 'bottom-left'
	const positionClass = isLeft
		? 'left-6 bottom-6 items-start max-md:left-4 max-md:bottom-4'
		: 'right-6 bottom-6 items-end max-md:right-4 max-md:bottom-4'

	const isSpeedDial = displayMode !== 'stack'

	return (
		<div
			ref={containerRef}
			className={cn(
				'fixed z-50 flex flex-col gap-3 select-none transition-all duration-300',
				positionClass,
				className,
			)}
		>
			{/* MODE 1: SPEED DIAL (EXPANDABLE FAB) */}
			{isSpeedDial ? (
				<>
					{/* Sub-buttons list with animated expand/collapse */}
					<div
						className={cn(
							'flex flex-col gap-2.5 transition-all duration-300 ease-out',
							isLeft ? 'items-start' : 'items-end',
							open
								? 'opacity-100 translate-y-0 pointer-events-auto'
								: 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden',
						)}
					>
						{hasButtons ? (
							buttons.map((btn, idx) => {
								const linkUrl =
									btn.type === 'phone' && btn.value && !btn.value.startsWith('tel:')
										? `tel:${btn.value}`
										: btn.type === 'zalo' && btn.value && !btn.value.startsWith('http')
										? `https://zalo.me/${btn.value}`
										: btn.value || '#'

								return (
									<a
										key={btn._key || idx}
										href={linkUrl}
										target={btn.type === 'phone' ? '_self' : '_blank'}
										rel="noopener noreferrer"
										className={cn(
											'group relative flex items-center gap-3 rounded-full bg-white/95 backdrop-blur-md p-2 shadow-lg shadow-black/10 border border-slate-200/80 transition-all duration-200 hover:scale-105 hover:shadow-xl',
											isLeft ? 'flex-row' : 'flex-row-reverse',
											btn.pulse && 'animate-pulse',
										)}
										title={btn.label}
									>
										{/* Button Icon Bubble */}
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 shadow-inner group-hover:bg-slate-200 transition-colors">
											<ButtonIcon type={btn.type} url={btn.value} className="text-xl" />
										</div>

										{/* Tooltip Label Pill */}
										{btn.label && (
											<span
												className={cn(
													'whitespace-nowrap px-2.5 py-1 text-xs font-semibold text-slate-800 transition-opacity md:text-sm',
													'bg-slate-900/5 rounded-full',
												)}
											>
												{btn.label}
											</span>
										)}
									</a>
								)
							})
						) : (
							/* Legacy items fallback */
							items?.map((item, key) =>
								item._type === 'link' ? (
									<SanityLink
										className="group flex items-center gap-2 rounded-full bg-white p-2 shadow-md transition-transform hover:scale-110"
										link={item}
										key={key}
									>
										<div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
											<Icon url={item.external} aria-label={item.label} className="text-xl" />
										</div>
										{item.label && (
											<span className="px-2 text-xs font-semibold text-gray-700 md:text-sm">
												{item.label}
											</span>
										)}
									</SanityLink>
								) : null,
							)
						)}
					</div>

					{/* Master FAB Trigger Button */}
					<div className={cn('relative flex items-center gap-2', isLeft ? 'flex-row' : 'flex-row-reverse')}>
						<button
							onClick={() => setOpen(!open)}
							className={cn(
								'group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl shadow-emerald-900/20 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30',
								open ? 'bg-slate-800' : 'bg-primary animate-bounce-subtle',
							)}
							aria-expanded={open}
							aria-label={open ? 'Close contact menu' : 'Open contact menu'}
						>
							{/* Rotating icon */}
							<div
								className={cn(
									'transition-transform duration-300',
									open ? 'rotate-90' : 'rotate-0',
								)}
							>
								{open ? (
									<FaXmark size={24} className="text-white" />
								) : (
									<MasterIcon style={mainButtonIcon} />
								)}
							</div>

							{/* Ping effect ring when closed */}
							{!open && (
								<span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-primary opacity-30 duration-1000" />
							)}
						</button>

						{/* Master Button Badge Label (When closed) */}
						{!open && mainButtonLabel && (
							<div
								onClick={() => setOpen(true)}
								className={cn(
									'hidden cursor-pointer rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-md border border-slate-200/80 transition-all duration-200 hover:bg-white hover:scale-105 md:inline-block',
								)}
							>
								{mainButtonLabel}
							</div>
						)}
					</div>
				</>
			) : (
				/* MODE 2: ALWAYS EXPANDED STACK */
				<div className={cn('flex flex-col gap-2.5', isLeft ? 'items-start' : 'items-end')}>
					{buttons.map((btn, idx) => {
						const linkUrl =
							btn.type === 'phone' && btn.value && !btn.value.startsWith('tel:')
								? `tel:${btn.value}`
								: btn.type === 'zalo' && btn.value && !btn.value.startsWith('http')
								? `https://zalo.me/${btn.value}`
								: btn.value || '#'

						return (
							<a
								key={btn._key || idx}
								href={linkUrl}
								target={btn.type === 'phone' ? '_self' : '_blank'}
								rel="noopener noreferrer"
								className={cn(
									'group flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md p-2 shadow-lg border border-slate-200/80 transition-transform hover:scale-105',
									isLeft ? 'flex-row' : 'flex-row-reverse',
									btn.pulse && 'animate-pulse',
								)}
								title={btn.label}
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 shadow-inner">
									<ButtonIcon type={btn.type} url={btn.value} className="text-2xl" />
								</div>
								{btn.label && (
									<span className="hidden px-2 text-xs font-semibold text-gray-800 group-hover:inline-block md:text-sm">
										{btn.label}
									</span>
								)}
							</a>
						)
					})}
				</div>
			)}
		</div>
	)
}

function MasterIcon({ style }: { style?: string }) {
	if (style === 'phone') {
		return <FaPhone size={22} className="text-white animate-shake" />
	}
	if (style === 'support') {
		return <FaHeadset size={24} className="text-white animate-shake" />
	}
	return <LuMessageSquareMore size={26} className="text-white animate-shake" />
}

function ButtonIcon({ type, url, className }: { type?: string; url?: string; className?: string }) {
	if (type === 'phone' || url?.startsWith('tel:')) {
		return <FaPhone className={cn('text-emerald-600', className)} />
	}
	if (type === 'zalo' || url?.includes('zalo')) {
		return <SiZalo className={cn('text-blue-500', className)} />
	}
	if (type === 'messenger' || url?.includes('messenger')) {
		return <FaFacebookMessenger className={cn('text-blue-600', className)} />
	}
	return <IoIosLink className={cn('text-slate-700', className)} />
}

function Icon({
	url,
	className = '',
	...props
}: { url?: string } & React.ComponentProps<'svg'>) {
	if (!url) return null
	if (url.startsWith('tel:')) {
		return <FaPhone className={cn('text-green-600', className)} {...props} />
	}
	if (url.includes('zalo') || url.includes('zalo://')) {
		return <SiZalo className={cn('text-blue-500', className)} {...props} />
	}
	if (url.includes('bsky.app')) {
		return <FaBluesky className={cn('text-sky-500', className)} {...props} />
	}
	if (url.includes('facebook.com')) {
		return <FaFacebookF className={cn('text-blue-600', className)} {...props} />
	}
	if (url.includes('messenger.com')) {
		return (
			<FaFacebookMessenger
				className={cn('text-blue-600', className)}
				{...props}
			/>
		)
	}
	if (url.includes('github.com')) {
		return <FaGithub className={cn('text-gray-800', className)} {...props} />
	}
	if (url.includes('instagram.com')) {
		return <FaInstagram className={cn('text-pink-500', className)} {...props} />
	}
	if (url.includes('linkedin.com')) {
		return (
			<FaLinkedinIn className={cn('text-blue-700', className)} {...props} />
		)
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
		return (
			<FaSnapchat className={cn('text-yellow-600', className)} {...props} />
		)
	}

	return <IoIosLink className={cn('text-gray-500', className)} {...props} />
}
