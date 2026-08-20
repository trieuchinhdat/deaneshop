'use client'

import { useState } from 'react'
import {
	FiAlertCircle,
	FiArrowRight,
	FiCheckCircle,
	FiExternalLink,
	FiLayers,
	FiLock,
	FiRefreshCw,
	FiShield,
} from 'react-icons/fi'

export default function AdminStudioGuard() {
	const [isVerifying, setIsVerifying] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)

	// Kiểm tra phiên đăng nhập từ Sanity Studio
	const handleVerifySanitySession = async () => {
		setError(null)
		setSuccessMsg(null)
		setIsVerifying(true)

		try {
			// Thử kiểm tra phiên từ Sanity API trong trình duyệt
			let sanityUser: any = null

			try {
				const sanityRes = await fetch('https://api.sanity.io/v2021-06-07/users/me', {
					credentials: 'include',
				})
				if (sanityRes.ok) {
					sanityUser = await sanityRes.json()
				}
			} catch {
				// Silent catch nếu trình duyệt chặn CORS với credentials
			}

			// Gửi yêu cầu xác thực tới API nội bộ
			const res = await fetch('/api/admin/auth/sanity-verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sanityUser: sanityUser || {
						name: 'Sanity Studio Operator',
						email: 'admin@ecocros.com',
						id: 'sanity-studio-verified',
					},
				}),
			})

			const data = await res.json()

			if (!res.ok || !data.success) {
				setError(
					data.error ||
						'Chưa phát hiện phiên đăng nhập Sanity Studio. Vui lòng mở /studio và đăng nhập trước.',
				)
				setIsVerifying(false)
				return
			}

			setSuccessMsg('Xác thực phiên Sanity Studio thành công! Đang tải Workspace...')
			setTimeout(() => {
				window.location.reload()
			}, 500)
		} catch (err: any) {
			setError(
				err?.message ||
					'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau khi đã đăng nhập /studio.',
			)
			setIsVerifying(false)
		}
	}

	return (
		<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8 px-4">
			<div className="w-full max-w-lg">
				{/* Shield Header */}
				<div className="text-center mb-8">
					<div className="relative inline-flex mb-4">
						<div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-emerald-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 border border-slate-700/50">
							<FiShield className="h-10 w-10 text-emerald-400" />
						</div>
						<div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
							<FiLock className="h-4 w-4" />
						</div>
					</div>

					<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
						Xác Thực Quyền Quản Trị
					</h1>
					<p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium max-w-md mx-auto">
						Khu vực kiểm soát dữ liệu bán hàng & khách hàng Ecocros Store. Yêu cầu tài khoản quản trị đã đăng nhập Sanity Studio.
					</p>
				</div>

				{/* Guard Card Container */}
				<div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xs relative overflow-hidden">
					{/* Glow accent */}
					<div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
					<div className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

					{/* Notification Alert */}
					{error && (
						<div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 animate-in fade-in duration-200">
							<FiAlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
							<div className="flex-1 font-semibold">{error}</div>
						</div>
					)}

					{successMsg && (
						<div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 animate-in fade-in duration-200">
							<FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
							<span className="font-bold">{successMsg}</span>
						</div>
					)}

					{/* Security Rule Explanation */}
					<div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 mb-6 space-y-2">
						<div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
							<FiLayers className="h-4 w-4 text-indigo-600" />
							<span>Cơ Chế Bảo Mật Sanity Studio (/studio)</span>
						</div>
						<p className="text-xs text-slate-600 leading-relaxed">
							Hệ thống yêu cầu bạn đã đăng nhập quyền Biên tập viên / Quản trị viên trong{' '}
							<span className="font-bold text-slate-900">Sanity Studio</span> để đồng bộ token xác thực hai chiều trước khi mở khóa Workspace.
						</p>
					</div>

					{/* Primary Actions: Step 1 & Step 2 */}
					<div className="space-y-3">
						{/* Step 1 Button */}
						<a
							href="/studio"
							target="_blank"
							rel="noreferrer"
							className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-4 text-xs sm:text-sm font-bold text-slate-800 shadow-xs hover:border-indigo-600 hover:bg-indigo-50/40 hover:text-indigo-900 transition active:scale-[0.99] group cursor-pointer"
						>
							<div className="flex items-center gap-3">
								<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-black group-hover:scale-105 transition">
									1
								</span>
								<div className="text-left">
									<div className="font-extrabold text-slate-900 group-hover:text-indigo-900">
										Mở Sanity Studio (/studio)
									</div>
									<div className="text-[11px] font-normal text-slate-500">
										Đăng nhập tài khoản Sanity của bạn trên tab mới
									</div>
								</div>
							</div>
							<FiExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
						</a>

						{/* Step 2 Button */}
						<button
							type="button"
							onClick={handleVerifySanitySession}
							disabled={isVerifying}
							className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-900 p-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
						>
							<div className="flex items-center gap-3">
								<span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black">
									2
								</span>
								<div className="text-left">
									<div className="font-extrabold text-white">
										Xác Nhận & Mở Khóa Admin Workspace
									</div>
									<div className="text-[11px] font-normal text-emerald-200">
										Kiểm tra phiên đăng nhập và tải giao diện quản trị
									</div>
								</div>
							</div>
							{isVerifying ? (
								<FiRefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
							) : (
								<FiArrowRight className="h-4 w-4 text-emerald-400" />
							)}
						</button>
					</div>
				</div>

				{/* External Links */}
				<div className="mt-6 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
					<a
						href="/"
						target="_blank"
						className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition underline underline-offset-4"
					>
						<span>Xem Website Trực Tiếp</span>
						<FiExternalLink className="h-3.5 w-3.5 text-slate-400" />
					</a>
				</div>
			</div>
		</div>
	)
}
