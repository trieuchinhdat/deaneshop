import type { Metadata } from 'next'
import Link from 'next/link'
import '@/app.css'
import { FiExternalLink, FiLayers, FiShield } from 'react-icons/fi'

export const metadata: Metadata = {
	title: 'Quản Trị Bán Hàng & CSKH | Ecocros Store',
	description: 'Trung tâm quản lý Đơn hàng, Khách hàng CRM và Đánh giá sản phẩm dành cho nhân viên vận hành.',
}

export default function AdminRootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="vi">
			<body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
				{/* Top Bar Header */}
				<header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-8 backdrop-blur-md">
					<div className="flex items-center gap-3">
						<Link
							href="/admin"
							className="flex items-center gap-2.5 font-black text-lg tracking-tight text-slate-900 no-underline"
						>
							<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-base font-bold shadow-md">
								E
							</span>
							<div className="flex flex-col leading-none">
								<span className="font-extrabold text-slate-900 tracking-tight">ECOCROS</span>
								<span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase mt-0.5">
									Commerce Admin
								</span>
							</div>
						</Link>
					</div>

					{/* Navigation Links */}
					<div className="flex items-center gap-2 sm:gap-4">
						<Link
							href="/studio"
							target="_blank"
							className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
						>
							<FiLayers className="h-3.5 w-3.5 text-slate-500" />
							<span className="hidden sm:inline">Sanity Studio (CMS)</span>
							<span className="sm:hidden">Studio</span>
						</Link>

						<Link
							href="/"
							target="_blank"
							className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
						>
							<FiExternalLink className="h-3.5 w-3.5 text-slate-500" />
							<span className="hidden sm:inline">Xem Website</span>
						</Link>

						<div className="flex items-center gap-2 pl-2 border-l border-slate-200">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
								<FiShield className="h-4 w-4" />
							</div>
							<span className="hidden md:inline text-xs font-bold text-slate-700">Admin CSKH</span>
						</div>
					</div>
				</header>

				{/* Main Content Area */}
				<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
			</body>
		</html>
	)
}
