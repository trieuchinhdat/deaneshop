'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	HiOutlineCheckBadge,
	HiOutlineCube,
	HiOutlineInformationCircle,
	HiOutlineShieldCheck,
	HiOutlineSparkles,
	HiOutlineTag,
} from 'react-icons/hi2'
import { useAuthStore } from '@/store/use-auth-store'

export default function LoginClient() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const redirectUrl = searchParams.get('redirect') || '/account'
	const errorParam = searchParams.get('error')

	const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false)
	const { checkSession } = useAuthStore()

	// Nếu đã đăng nhập rồi, tự động chuyển về trang đích
	useEffect(() => {
		checkSession().then((user) => {
			if (user) {
				router.replace(redirectUrl)
			}
		})
	}, [checkSession, redirectUrl, router])

	const handleGoogleLogin = () => {
		setIsLoggingInGoogle(true)
		const target = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`
		window.location.href = target
	}

	return (
		<div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
				{/* CỘT TRÁI: QUYỀN LỢI & GIỚI THIỆU THƯƠNG HIỆU */}
				<div className="lg:col-span-5 flex flex-col justify-center space-y-6 max-lg:order-2">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit border border-primary/20">
						<HiOutlineSparkles className="text-sm" />
						Trải nghiệm mua sắm thông minh
					</div>

					<div className="space-y-3">
						<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
							Tài khoản ECOCROS
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
							Đăng nhập nhanh với Google chỉ trong 1 chạm. Quản lý đơn hàng, tích lũy điểm thưởng và nhận các đặc quyền dành riêng cho bạn.
						</p>
					</div>

					{/* Danh sách đặc quyền thành viên */}
					<div className="space-y-4 pt-2">
						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
							<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
								<HiOutlineCube className="text-xl" />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-foreground">Theo dõi lộ trình đơn hàng</h3>
								<p className="text-xs text-muted-foreground mt-0.5">
									Cập nhật trạng thái vận chuyển từ khi đóng gói đến khi nhận hàng 24/7.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
							<div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
								<HiOutlineTag className="text-xl" />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-foreground">Voucher & Quà tặng sinh nhật</h3>
								<p className="text-xs text-muted-foreground mt-0.5">
									Tự động lưu mã giảm giá độc quyền vào ví và thông báo ưu đãi flash sale.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-primary/40 transition-colors">
							<div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
								<HiOutlineShieldCheck className="text-xl" />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-foreground">Bảo mật thông tin tối đa</h3>
								<p className="text-xs text-muted-foreground mt-0.5">
									Xác thực trực tiếp qua Google OAuth 2.0 an toàn, không lo lộ mật khẩu.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* CỘT PHẢI: KHUNG ĐĂNG NHẬP GMAIL */}
				<div className="lg:col-span-7 max-lg:order-1">
					<div className="bg-card/95 backdrop-blur-md rounded-3xl border border-border/80 p-6 sm:p-10 shadow-xl transition-all">
						{/* THÔNG BÁO LỖI NẾU CÓ */}
						{errorParam && (
							<div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
								<HiOutlineInformationCircle className="text-lg shrink-0 mt-0.5" />
								<div>
									<p className="font-semibold">
										{errorParam === 'missing_google_credentials'
											? 'Chưa cấu hình Google Client ID'
											: errorParam === 'cancelled'
												? 'Bạn đã hủy đăng nhập Google'
												: 'Không thể đăng nhập tài khoản'}
									</p>
									<p className="text-xs text-destructive/80 mt-1">
										{errorParam === 'missing_google_credentials'
											? 'Vui lòng bổ sung GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env.local để kích hoạt đăng nhập Gmail.'
											: 'Vui lòng thử lại hoặc liên hệ hỗ trợ nếu sự cố vẫn tiếp diễn.'}
									</p>
								</div>
							</div>
						)}

						<div className="space-y-6">
							<div className="text-center space-y-2">
								<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
									Đăng nhập tài khoản
								</h2>
								<p className="text-xs sm:text-sm text-muted-foreground">
									Sử dụng tài khoản Gmail của bạn để đăng nhập hoặc tạo tài khoản mới ngay lập tức.
								</p>
							</div>

							{/* NÚT ĐĂNG NHẬP GOOGLE NỔI BẬT */}
							<button
								type="button"
								onClick={handleGoogleLogin}
								disabled={isLoggingInGoogle}
								className="w-full flex items-center justify-center gap-3.5 py-4 px-6 rounded-2xl border border-border/80 bg-background hover:bg-muted/50 active:scale-[0.98] transition-all text-sm sm:text-base font-semibold text-foreground shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
							>
								{/* GOOGLE ICON */}
								<svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
									<path
										fill="#4285F4"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="#34A853"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="#FBBC05"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
									/>
									<path
										fill="#EA4335"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
									/>
								</svg>
								<span>
									{isLoggingInGoogle ? 'Đang chuyển hướng Google...' : 'Tiếp tục với Google / Gmail'}
								</span>
							</button>

							<div className="p-4 rounded-2xl bg-muted/40 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
								<HiOutlineCheckBadge className="text-primary text-base shrink-0 mt-0.5" />
								<span>
									Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của ECOCROS. Mọi đơn hàng trước đây sử dụng cùng thông tin sẽ tự động được liên kết.
								</span>
							</div>
						</div>

						<div className="mt-8 text-center text-xs text-muted-foreground">
							Cần hỗ trợ?{' '}
							<Link href="/" className="text-primary font-semibold hover:underline">
								Quay về trang chủ ECOCROS
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
