'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FiX } from 'react-icons/fi'
import PopupBanner from './popup-banner'
import PopupForm from './popup-form'

type PopupModalProps = {
	settings?: any
}

export default function PopupModal({ settings }: PopupModalProps) {
	const pathname = usePathname()
	const [isOpen, setIsOpen] = useState(false)
	const [hasTriggered, setHasTriggered] = useState(false)

	const {
		isActive = false,
		type = 'banner',
		targetPages = 'all',
		triggerType = 'delay',
		delaySeconds = 4,
		scrollPercentage = 35,
		frequencyDays = 3,
		transparentBackground = false,
	} = settings || {}

	// Validate target page
	const isTargetPageMatched = () => {
		if (targetPages === 'all') return true
		if (targetPages === 'home') return pathname === '/' || pathname === ''
		if (targetPages === 'products') {
			return pathname.startsWith('/products') || pathname.startsWith('/collections')
		}
		return true
	}

	// Check frequency & localStorage conditions
	const checkCanShow = () => {
		if (!isActive || !isTargetPageMatched()) return false
		if (typeof window === 'undefined') return false

		// Already submitted form
		if (type === 'form' && localStorage.getItem('ecocros_popup_submitted') === 'true') {
			return false
		}

		// Closed within frequencyDays window
		const closedUntil = localStorage.getItem('ecocros_popup_closed_until')
		if (closedUntil && Date.now() < Number(closedUntil)) {
			return false
		}

		return true
	}

	const triggerPopup = () => {
		if (hasTriggered) return
		if (!checkCanShow()) return
		setHasTriggered(true)
		setIsOpen(true)
	}

	// Listen for Trigger Events
	useEffect(() => {
		if (!isActive || hasTriggered) return
		if (!checkCanShow()) return

		// 1. Time Delay Trigger
		if (triggerType === 'delay') {
			const timer = setTimeout(() => {
				triggerPopup()
			}, Math.max(delaySeconds * 1000, 500))

			return () => clearTimeout(timer)
		}

		// 2. Scroll Depth Trigger
		if (triggerType === 'scroll') {
			const handleScroll = () => {
				const scrollTop = window.scrollY || document.documentElement.scrollTop
				const docHeight =
					document.documentElement.scrollHeight - document.documentElement.clientHeight
				if (docHeight > 0) {
					const scrollPercent = (scrollTop / docHeight) * 100
					if (scrollPercent >= scrollPercentage) {
						triggerPopup()
					}
				}
			}

			window.addEventListener('scroll', handleScroll, { passive: true })
			return () => window.removeEventListener('scroll', handleScroll)
		}

		// 3. Exit-Intent Trigger (Desktop)
		if (triggerType === 'exit-intent') {
			const handleMouseLeave = (e: MouseEvent) => {
				if (e.clientY <= 10 && window.innerWidth >= 768) {
					triggerPopup()
				}
			}

			document.addEventListener('mouseleave', handleMouseLeave)
			return () => document.removeEventListener('mouseleave', handleMouseLeave)
		}
	}, [isActive, pathname, triggerType, delaySeconds, scrollPercentage, hasTriggered])

	// Manage body scroll lock & Escape key
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') handleClose()
			}
			window.addEventListener('keydown', handleKeyDown)
			return () => {
				document.body.style.overflow = ''
				window.removeEventListener('keydown', handleKeyDown)
			}
		} else {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	const handleClose = () => {
		setIsOpen(false)
		if (typeof window !== 'undefined' && frequencyDays > 0) {
			const expiry = Date.now() + frequencyDays * 24 * 60 * 60 * 1000
			localStorage.setItem('ecocros_popup_closed_until', expiry.toString())
		}
	}

	if (!isActive || !isOpen) return null

	const isBannerOnly = type === 'banner'
	const isFrameless = isBannerOnly && transparentBackground

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
			onClick={handleClose}
			role="dialog"
			aria-modal="true"
			aria-label={settings?.bannerTitle || settings?.formTitle || 'Marketing Popup'}
		>
			<div
				className={`relative w-full max-w-3xl max-h-[90dvh] transform transition-all duration-300 animate-in zoom-in-95 ${
					isFrameless
						? 'bg-transparent shadow-none border-none p-0 overflow-visible'
						: isBannerOnly
							? 'bg-transparent shadow-none border-none overflow-visible'
							: 'rounded-2xl md:rounded-3xl shadow-2xl bg-neutral-900 text-white overflow-y-auto'
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* 
					Nút đóng [X]:
					- Khi là Banner Only: Bỏ hoàn toàn màu nền và border, chỉ là icon nổi bật với drop-shadow và hiệu ứng hover mượt mà.
					- Khi là Form: Nút tròn bán trong suốt sang trọng.
				*/}
				<button
					type="button"
					onClick={handleClose}
					className={`z-50 flex items-center justify-center transition-all cursor-pointer ${
						isBannerOnly
							? 'absolute -top-3 -right-3 sm:-top-4 sm:-right-4 h-9 w-9 sm:h-10 sm:w-10 bg-transparent border-none text-white/90 hover:text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] hover:scale-115 active:scale-95'
							: 'absolute top-3 right-3 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/20 shadow-xl backdrop-blur-md active:scale-90'
					}`}
					aria-label="Close modal"
				>
					<FiX className={`${isBannerOnly ? 'h-7 w-7 sm:h-8 sm:w-8 stroke-[2.5]' : 'h-5 w-5 stroke-[2.5]'}`} />
				</button>

				{/* Render Banner hoặc Form */}
				{type === 'form' ? (
					<PopupForm settings={settings} onClose={handleClose} />
				) : (
					<PopupBanner settings={settings} onClose={handleClose} />
				)}
			</div>
		</div>
	)
}
