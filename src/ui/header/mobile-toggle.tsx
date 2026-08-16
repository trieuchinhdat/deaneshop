'use client'

import { cn } from '@/lib/utils'

interface MobileToggleProps {
	isOpen?: boolean
	onToggle?: () => void
}

export default function MobileToggle({ isOpen = false, onToggle }: MobileToggleProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl p-2.5 text-header-foreground hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all select-none md:hidden"
			aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
			aria-expanded={isOpen}
		>
			{/* Animated Morphing Hamburger to X Icon */}
			<div className="flex h-4 w-5 flex-col justify-between" aria-hidden="true">
				<span
					className={cn(
						'h-0.5 w-full rounded-full bg-current transition-all duration-300 origin-left',
						isOpen && 'rotate-45 translate-x-0.5 translate-y-[-1px]',
					)}
				/>
				<span
					className={cn(
						'h-0.5 w-full rounded-full bg-current transition-all duration-300',
						isOpen && 'opacity-0 scale-x-0',
					)}
				/>
				<span
					className={cn(
						'h-0.5 w-full rounded-full bg-current transition-all duration-300 origin-left',
						isOpen && '-rotate-45 translate-x-0.5 translate-y-[1px]',
					)}
				/>
			</div>
		</button>
	)
}
