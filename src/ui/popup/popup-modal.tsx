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
	} = settings || {}

	// Kiểm tra trang hợp lệ
	const isTargetPageMatched = () => {
		if (targetPages === 'all') return true
		if (targetPages === 'home') return pathname === '/' || pathname === ''
		if (targetPages === 'products') {
			return pathname.startsWith('/products') || pathname.startsWith('/collections')
		}
		return true
	}

	// Kiểm tra điều kiện tần suất & localStorage
	const checkCanShow = () => {
		if (!isActive || !isTargetPageMatched()) return false
		if (typeof window === 'undefined') return false

		// Đã submit form thành công trước đó
		if (type === 'form' && localStorage.getItem('ecocros_popup_submitted') === 'true') {
			return false
		}

		// Đã đóng popup và còn trong thời hạn frequencyDays
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

	// Lắng nghe Trigger Events
	useEffect(() => {
		if (!isActive || hasTriggered) return
		if (!checkCanShow()) return

		// 1. Trigger Delay Timer
		if (triggerType === 'delay') {
			const timer = setTimeout(() => {
				triggerPopup()
			}, Math.max(delaySeconds * 1000, 500))

			return () => clearTimeout(timer)
		}

		// 2. Trigger Scroll Depth
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

		// 3. Trigger Exit-Intent (Desktop)
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

	// Quản lý khóa cuộn trang & phím Escape
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

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
			onClick={handleClose}
			role="dialog"
			aria-modal="true"
			aria-label={settings?.bannerTitle || settings?.formTitle || 'Thông báo khuyến mãi'}
		>
			<div
				className="relative w-full max-w-3xl max-h-[88dvh] overflow-y-auto rounded-2xl md:rounded-3xl shadow-2xl transform transition-all duration-300 animate-in zoom-in-95 bg-white text-gray-900"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Nút đóng [X] Pinned High-contrast Touch target >= 44x44px */}
				<button
					type="button"
					onClick={handleClose}
					className="sticky top-2.5 right-2.5 ml-auto float-right mr-2.5 mt-2.5 sm:absolute sm:top-3 sm:right-3 sm:m-0 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 sm:bg-white/90 sm:text-gray-700 sm:hover:bg-white sm:hover:text-gray-900 shadow-lg backdrop-blur-xs transition-all active:scale-90 cursor-pointer"
					aria-label="Đóng cửa sổ"
				>
					<FiX className="h-5 w-5 stroke-[2.5]" />
				</button>

				{/* Render Banner hoặc Form theo cài đặt */}
				{type === 'form' ? (
					<PopupForm settings={settings} onClose={handleClose} />
				) : (
					<PopupBanner settings={settings} onClose={handleClose} />
				)}
			</div>
		</div>
	)
}
