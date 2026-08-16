'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
	HiArrowPath,
	HiArrowRightOnRectangle,
	HiCheck,
	HiOutlineArrowPath,
	HiOutlineBuildingStorefront,
	HiOutlineCheckCircle,
	HiOutlineClock,
	HiOutlineCube,
	HiOutlineInformationCircle,
	HiOutlineMapPin,
	HiOutlinePhone,
	HiOutlineSparkles,
	HiOutlineTruck,
	HiOutlineUser,
	HiOutlineXCircle,
} from 'react-icons/hi2'
import { formatVND } from '@/lib/utils'
import { useAuthStore } from '@/store/use-auth-store'

interface OrderItem {
	productId?: string
	variantId?: string
	title?: string
	sku?: string
	price?: number
	quantity?: number
	total?: number
	image?: string
}

interface OrderPricing {
	subtotal?: number
	shippingFee?: number
	discount?: number
	grandTotal?: number
	paymentMethod?: string
}

interface Order {
	_id: string
	orderId: string
	customer?: {
		name?: string
		phone?: string
		email?: string
		address?: string
	}
	items?: OrderItem[]
	pricing?: OrderPricing
	fulfillmentStatus?: string
	paymentStatus?: string
	carrier?: string
	trackingCode?: string
	status?: string
	createdAt?: string
}

interface AccountClientProps {
	user: {
		id: string
		name?: string
		email?: string
		phone?: string
		avatar?: string
		address?: string
		orderCount?: number
		totalSpent?: number
		cskhStatus?: string
		createdAt?: string
	}
	orders: Order[]
}

export default function AccountClient({ user, orders }: AccountClientProps) {
	const router = useRouter()
	const { setUser, logout } = useAuthStore()
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders')
	const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')

	// Form Profile State
	const [nameInput, setNameInput] = useState(user.name || '')
	const [phoneInput, setPhoneInput] = useState(user.phone || '')
	const [addressInput, setAddressInput] = useState(user.address || '')
	const [isSavingProfile, setIsSavingProfile] = useState(false)
	const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	// Đồng bộ thông tin user vào Zustand client store khi component nạp
	useEffect(() => {
		setUser(user)
		setNameInput(user.name || '')
		setPhoneInput(user.phone || '')
		setAddressInput(user.address || '')
	}, [user, setUser])

	const handleLogout = async () => {
		setIsLoggingOut(true)
		await logout()
		router.replace('/account/login')
		router.refresh()
	}

	const handleRefreshOrders = () => {
		setIsRefreshing(true)
		router.refresh()
		setTimeout(() => setIsRefreshing(false), 800)
	}

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSavingProfile(true)
		setProfileMessage(null)

		try {
			const res = await fetch('/api/account/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: nameInput,
					phone: phoneInput,
					address: addressInput,
				}),
			})

			const data = await res.json()
			if (res.ok && data.success) {
				setProfileMessage({ type: 'success', text: 'Đã lưu thông tin hồ sơ thành công!' })
				setUser(data.user)
				router.refresh()
			} else {
				setProfileMessage({
					type: 'error',
					text: data.message || 'Không thể lưu thông tin. Vui lòng thử lại.',
				})
			}
		} catch (err) {
			setProfileMessage({ type: 'error', text: 'Lỗi kết nối máy chủ. Vui lòng thử lại.' })
		} finally {
			setIsSavingProfile(false)
		}
	}

	// Xác định hạng thành viên dựa trên tổng chi tiêu
	const totalSpent = Number(user?.totalSpent) || 0
	let tierName = 'Thành viên Mới'
	let tierColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'

	if (totalSpent >= 10000000) {
		tierName = '🌟 Hạng Kim Cương (VIP)'
		tierColor = 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
	} else if (totalSpent >= 3000000) {
		tierName = '👑 Hạng Vàng'
		tierColor = 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
	} else if (totalSpent >= 1000000) {
		tierName = '🥈 Hạng Bạc'
		tierColor = 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400'
	}

	// Chuẩn hóa trạng thái đơn hàng (tương thích cả fulfillmentStatus của Admin và status legacy)
	const getEffectiveStatus = (order: Order): string => {
		const raw = order.fulfillmentStatus || order.status || 'PENDING'
		return raw.toUpperCase()
	}

	// Lọc đơn hàng theo trạng thái
	const filteredOrders = orders.filter((order) => {
		if (orderStatusFilter === 'all') return true
		const st = getEffectiveStatus(order)
		if (orderStatusFilter === 'pending') return st === 'PENDING'
		if (orderStatusFilter === 'confirmed') return st === 'CONFIRMED'
		if (orderStatusFilter === 'shipping') return st === 'SHIPPING' || st === 'PROCESSING'
		if (orderStatusFilter === 'completed') return st === 'DELIVERED' || st === 'COMPLETED'
		if (orderStatusFilter === 'cancelled') return st === 'CANCELLED' || st === 'RETURNED'
		return true
	})

	const getStatusBadge = (order: Order) => {
		const st = getEffectiveStatus(order)
		switch (st) {
			case 'CONFIRMED':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
						<HiOutlineCheckCircle className="text-sm" /> Đã xác nhận
					</span>
				)
			case 'PROCESSING':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
						<HiOutlineCube className="text-sm" /> Đang đóng gói
					</span>
				)
			case 'SHIPPING':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
						<HiOutlineTruck className="text-sm" /> Đang giao hàng
						{order.carrier && ` (${order.carrier})`}
					</span>
				)
			case 'DELIVERED':
			case 'COMPLETED':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
						<HiOutlineCheckCircle className="text-sm" /> Giao thành công
					</span>
				)
			case 'RETURNED':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
						<HiOutlineArrowPath className="text-sm" /> Trả hàng / Hoàn về
					</span>
				)
			case 'CANCELLED':
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
						<HiOutlineXCircle className="text-sm" /> Đã hủy
					</span>
				)
			default:
				return (
					<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
						<HiOutlineClock className="text-sm" /> Chờ xác nhận
					</span>
				)
		}
	}

	return (
		<div className="min-h-[85vh] py-8 sm:py-12 bg-muted/20">
			<div className="container-max px-4 sm:px-6">
				{/* 1. PROFILE HEADER CARD */}
				<div className="bg-card rounded-3xl border border-border/80 p-6 sm:p-8 shadow-sm mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
						<div className="flex items-center gap-4 sm:gap-6">
							{/* User Avatar */}
							<div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/30 shrink-0 flex items-center justify-center">
								{user.avatar ? (
									<Image
										src={user.avatar}
										alt={user.name || 'User Avatar'}
										fill
										sizes="80px"
										unoptimized
										className="object-cover"
									/>
								) : (
									<span className="text-xl sm:text-2xl font-bold text-primary">
										{(user.name || user.email || 'U').substring(0, 2).toUpperCase()}
									</span>
								)}
							</div>

							{/* User Info */}
							<div className="space-y-1 sm:space-y-1.5">
								<div className="flex flex-wrap items-center gap-2 sm:gap-3">
									<h1 className="text-xl sm:text-2xl font-bold text-foreground">
										{user.name || 'Khách hàng'}
									</h1>
									<span
										className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierColor}`}
									>
										<HiOutlineSparkles className="text-xs" />
										{tierName}
									</span>
								</div>
								<p className="text-xs sm:text-sm text-muted-foreground">
									{user.email || 'Chưa cập nhật email'}
									{user.phone && ` • ${user.phone}`}
								</p>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex items-center gap-3">
							<Link
								href="/"
								className="px-4 py-2.5 rounded-2xl border border-border bg-background hover:bg-muted/50 text-xs sm:text-sm font-semibold text-foreground transition-all flex items-center gap-2 cursor-pointer"
							>
								<HiOutlineBuildingStorefront className="text-base" />
								Tiếp tục mua sắm
							</Link>
							<button
								type="button"
								onClick={handleLogout}
								disabled={isLoggingOut}
								className="px-4 py-2.5 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
							>
								<HiArrowRightOnRectangle className="text-base" />
								{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}
							</button>
						</div>
					</div>

					{/* Stats Highlights */}
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/60">
						<div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/40">
							<p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
							<p className="text-lg sm:text-xl font-bold text-foreground mt-1">
								{orders?.length || user.orderCount || 0} đơn
							</p>
						</div>
						<div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/40">
							<p className="text-xs text-muted-foreground">Tổng chi tiêu tích lũy</p>
							<p className="text-lg sm:text-xl font-bold text-primary mt-1">
								{formatVND(totalSpent)}
							</p>
						</div>
						<div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/40">
							<p className="text-xs text-muted-foreground">Tài khoản bảo mật</p>
							<p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
								<HiOutlineCheckCircle className="text-base" /> Đã xác thực Google
							</p>
						</div>
					</div>
				</div>

				{/* 2. TABS NAVIGATION */}
				<div className="flex border-b border-border/60 mb-6 gap-2 sm:gap-6">
					<button
						type="button"
						onClick={() => setActiveTab('orders')}
						className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
							activeTab === 'orders'
								? 'border-primary text-primary'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						<HiOutlineCube className="text-lg" />
						Đơn mua của tôi ({orders?.length || 0})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('profile')}
						className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
							activeTab === 'profile'
								? 'border-primary text-primary'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						<HiOutlineUser className="text-lg" />
						Chỉnh sửa Hồ sơ & Địa chỉ
					</button>
				</div>

				{/* TAB 1: DANH SÁCH ĐƠN HÀNG */}
				{activeTab === 'orders' && (
					<div className="space-y-6">
						{/* Status Filters & Refresh Button */}
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex flex-wrap gap-2">
								{[
									{ label: 'Tất cả', value: 'all' },
									{ label: 'Chờ xác nhận', value: 'pending' },
									{ label: 'Đang giao hàng', value: 'shipping' },
									{ label: 'Hoàn thành', value: 'completed' },
									{ label: 'Đã hủy', value: 'cancelled' },
								].map((tab) => (
									<button
										key={tab.value}
										type="button"
										onClick={() => setOrderStatusFilter(tab.value)}
										className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
											orderStatusFilter === tab.value
												? 'bg-primary text-primary-foreground shadow-xs'
												: 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							<button
								type="button"
								onClick={handleRefreshOrders}
								disabled={isRefreshing}
								title="Làm mới trạng thái đơn hàng"
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-xs font-semibold text-foreground transition-all cursor-pointer disabled:opacity-60"
							>
								<HiArrowPath className={`text-sm ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
								{isRefreshing ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
							</button>
						</div>

						{/* Danh sách đơn hàng */}
						{filteredOrders.length > 0 ? (
							<div className="space-y-4">
								{filteredOrders.map((order) => {
									const grandTotal =
										order.pricing?.grandTotal ||
										(order.items || []).reduce(
											(sum, i) => sum + (i.total || (i.price || 0) * (i.quantity || 1)),
											0,
										)
									const formattedDate = order.createdAt
										? new Date(order.createdAt).toLocaleString('vi-VN')
										: 'Gần đây'

									return (
										<div
											key={order._id || order.orderId}
											className="bg-card rounded-3xl border border-border/80 p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all space-y-4"
										>
											{/* Order Header */}
											<div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
												<div className="flex items-center gap-2">
													<span className="font-bold text-sm text-foreground">
														#{order.orderId}
													</span>
													<span className="text-xs text-muted-foreground">
														• {formattedDate}
													</span>
												</div>
												<div>{getStatusBadge(order)}</div>
											</div>

											{/* Order Items */}
											<div className="space-y-3">
												{order.items?.map((item, idx) => (
													<div
														key={idx}
														className="flex items-center justify-between gap-4 text-xs sm:text-sm"
													>
														<div className="flex items-center gap-3">
															<div className="w-12 h-12 rounded-xl bg-muted/60 relative overflow-hidden shrink-0 border border-border/40 flex items-center justify-center text-muted-foreground">
																{item.image ? (
																	<Image
																		src={item.image}
																		alt={item.title || 'Product'}
																		fill
																		sizes="48px"
																		className="object-cover"
																	/>
																) : (
																	<HiOutlineCube className="text-xl" />
																)}
															</div>
															<div>
																<p className="font-semibold text-foreground line-clamp-1">
																	{item.title}
																</p>
																<p className="text-xs text-muted-foreground mt-0.5">
																	Số lượng: x{item.quantity || 1}
																</p>
															</div>
														</div>
														<p className="font-bold text-foreground shrink-0">
															{formatVND(item.total || (item.price || 0) * (item.quantity || 1))}
														</p>
													</div>
												))}
											</div>

											{/* Order Footer */}
											<div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/40">
												<div className="text-xs text-muted-foreground">
													{order.customer?.address && (
														<span className="line-clamp-1">
															📍 Giao đến: {order.customer.address}
														</span>
													)}
												</div>
												<div className="flex items-center gap-3">
													<span className="text-xs text-muted-foreground">
														Tổng thanh toán:
													</span>
													<span className="text-base sm:text-lg font-extrabold text-primary">
														{formatVND(grandTotal)}
													</span>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						) : (
							/* Empty Orders */
							<div className="bg-card rounded-3xl border border-dashed border-border/80 p-12 text-center space-y-4">
								<div className="w-16 h-16 rounded-2xl bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
									<HiOutlineCube className="text-3xl" />
								</div>
								<div className="space-y-1">
									<h3 className="text-base font-bold text-foreground">
										Chưa có đơn hàng nào
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground">
										Bạn chưa có đơn hàng nào trong danh mục này. Hãy khám phá các sản phẩm mới nhất của ECOCROS!
									</p>
								</div>
								<Link
									href="/"
									className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
								>
									Khám phá sản phẩm
								</Link>
							</div>
						)}
					</div>
				)}

				{/* TAB 2: CHỈNH SỬA THÔNG TIN CÁ NHÂN & ĐỊA CHỈ */}
				{activeTab === 'profile' && (
					<div className="bg-card rounded-3xl border border-border/80 p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
						<div className="space-y-1">
							<h2 className="text-lg font-bold text-foreground">Hồ sơ cá nhân & Địa chỉ nhận hàng</h2>
							<p className="text-xs text-muted-foreground">
								Chỉnh sửa thông tin liên hệ và địa chỉ mặc định. Thông tin này sẽ tự động điền khi bạn đặt các đơn hàng tiếp theo.
							</p>
						</div>

						{/* Thông báo cập nhật */}
						{profileMessage && (
							<div
								className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
									profileMessage.type === 'success'
										? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
										: 'bg-destructive/10 border-destructive/20 text-destructive'
								}`}
							>
								{profileMessage.type === 'success' ? (
									<HiOutlineCheckCircle className="text-lg shrink-0" />
								) : (
									<HiOutlineInformationCircle className="text-lg shrink-0" />
								)}
								<span>{profileMessage.text}</span>
							</div>
						)}

						<form onSubmit={handleSaveProfile} className="space-y-5">
							{/* Email (Readonly Google Verified) */}
							<div>
								<label className="text-xs font-semibold text-muted-foreground block mb-1.5">
									Email (Xác thực bởi Google)
								</label>
								<input
									type="email"
									value={user.email || ''}
									disabled
									className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border text-muted-foreground text-sm cursor-not-allowed"
								/>
								<p className="text-[11px] text-muted-foreground mt-1">
									Email được liên kết bảo mật với tài khoản Gmail của bạn.
								</p>
							</div>

							{/* Họ và tên */}
							<div>
								<label className="text-xs font-semibold text-foreground block mb-1.5">
									Họ và tên <span className="text-destructive">*</span>
								</label>
								<input
									type="text"
									value={nameInput}
									onChange={(e) => setNameInput(e.target.value)}
									placeholder="Nhập họ và tên đầy đủ"
									required
									className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
								/>
							</div>

							{/* Số điện thoại */}
							<div>
								<label className="text-xs font-semibold text-foreground block mb-1.5">
									Số điện thoại nhận hàng <span className="text-destructive">*</span>
								</label>
								<div className="relative">
									<input
										type="tel"
										value={phoneInput}
										onChange={(e) => setPhoneInput(e.target.value)}
										placeholder="Ví dụ: 0912345678"
										required
										className="w-full pl-4 pr-10 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
									/>
									<div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
										<HiOutlinePhone className="text-lg" />
									</div>
								</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									Số điện thoại dùng để liên kết tự động lịch sử đơn hàng và nhận thông báo giao vận.
								</p>
							</div>

							{/* Địa chỉ giao hàng gần nhất */}
							<div>
								<label className="text-xs font-semibold text-foreground block mb-1.5">
									Địa chỉ giao hàng mặc định
								</label>
								<div className="relative">
									<textarea
										value={addressInput}
										onChange={(e) => setAddressInput(e.target.value)}
										placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
										rows={3}
										className="w-full pl-4 pr-10 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
									/>
									<div className="absolute right-3.5 top-3 text-muted-foreground">
										<HiOutlineMapPin className="text-lg" />
									</div>
								</div>
							</div>

							{/* Nút lưu thay đổi */}
							<div className="pt-3">
								<button
									type="submit"
									disabled={isSavingProfile}
									className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
								>
									{isSavingProfile && <HiArrowPath className="animate-spin text-base" />}
									{isSavingProfile ? 'Đang lưu thông tin...' : 'Lưu thay đổi'}
								</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	)
}
