'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import {
	FaBluesky,
	FaFacebookF,
	FaFacebookMessenger,
	FaGithub,
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
	items: any[] // Nhận dữ liệu từ Server Component truyền vào
}

export default function ChatBox({ items, className }: ChatBoxProps) {
	const [open, setOpen] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			// Khi scroll quá 200px mới hiển thị
			if (window.scrollY > 200) {
				setIsVisible(true)
				// Quan trọng: Gỡ bỏ lắng nghe ngay sau khi hiện để tối ưu performance
				window.removeEventListener('scroll', handleScroll)
			}
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Nếu không có data hoặc chưa scroll tới -> Không render gì cả (DOM nhẹ)
	if (!items?.length || !isVisible) return null

	return (
		<div
			className={cn(
				'fixed right-8 bottom-16 z-50 flex flex-col items-end gap-2 max-md:right-4 max-md:bottom-16',
				// Animation xuất hiện
				'animate-in fade-in zoom-in duration-300',
				className,
			)}
		>
			{/* List social items */}
			{open && (
				<div className="flex flex-col items-end gap-2 transition-all">
					{items.map((item, key) =>
						item._type === 'link' ? (
							<SanityLink className="group" link={item} key={key}>
								<div className="flex h-13 w-13 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 min-md:h-14 min-md:w-14">
									<Icon
										url={item.external}
										aria-label={item.label}
										className="text-2xl"
									/>
								</div>
							</SanityLink>
						) : null,
					)}
				</div>
			)}

			{/* Toggle Button */}
			<button
				onClick={() => setOpen(!open)}
				className="action flex h-13 w-13 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105 min-md:h-14 min-md:w-14"
				aria-label={open ? 'Close chat menu' : 'Open chat menu'}
			>
				{open ? (
					<FaXmark size={28} />
				) : (
					<LuMessageSquareMore size={28} className="animate-shake" />
				)}
			</button>
		</div>
	)
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

	// Default icon
	return <IoIosLink className={cn('text-gray-500', className)} {...props} />
}
