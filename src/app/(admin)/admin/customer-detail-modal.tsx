'use client'

import { useState } from 'react'
import {
	FiAward,
	FiCheck,
	FiClock,
	FiGift,
	FiMail,
	FiMapPin,
	FiMessageSquare,
	FiPhone,
	FiSave,
	FiShoppingBag,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiX,
} from 'react-icons/fi'
import { formatVND } from '@/lib/utils'

type CustomerDetailModalProps = {
	customer: any
	onClose: () => void
	onCustomerUpdated: (updatedCustomer: any) => void
}

export default function CustomerDetailModal({
	customer,
	onClose,
	onCustomerUpdated,
}: CustomerDetailModalProps) {
	const [cskhStatus, setCskhStatus] = useState(customer.cskhStatus || 'lead')
	const [newNote, setNewNote] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	const safeNotes = Array.isArray(customer?.internalNotes) ? customer.internalNotes : []
	const phoneClean = customer?.phone?.replace(/\D/g, '')

	const handleSaveChanges = async () => {
		try {
			setIsSaving(true)
			setSaveSuccess(false)

			const res = await fetch('/api/admin/customers/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerId: customer._id,
					cskhStatus,
					internalNote: newNote.trim() ? newNote.trim() : undefined,
				}),
			})

			const data = await res.json()
			if (data.success) {
				setSaveSuccess(true)
				const updated = {
					...customer,
					cskhStatus,
					internalNotes: newNote.trim()
						? [
								...safeNotes,
								{
									_key: Math.random().toString(),
									author: 'Admin CSKH',
									content: newNote.trim(),
									createdAt: new Date().toISOString(),
								},
							]
						: safeNotes,
				}
				onCustomerUpdated(updated)
				setNewNote('')
				setTimeout(() => setSaveSuccess(false), 2500)
			}
		} catch (err) {
			console.error('Update customer failed:', err)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-xs">
							<FiUser className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base sm:text-lg font-black text-slate-900">
								Hồ Sơ Khách Hàng 360°
							</h3>
							<p className="text-xs text-slate-500">
								{customer.name || 'Khách vãng lai'} - {customer.phone}
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
					>
						<FiX className="h-5 w-5" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* KPI Profile Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{/* Orders Count */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Số Đơn Mua
								</span>
								<FiShoppingBag className="h-4 w-4 text-slate-500" />
							</div>
							<p className="mt-1 font-mono text-2xl font-black text-slate-900">
								{customer.orderCount || 0}
							</p>
						</div>

						{/* Total Spent */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Tổng Chi Tiêu
								</span>
								<FiAward className="h-4 w-4 text-amber-500" />
							</div>
							<p className="mt-1 font-mono text-xl font-black text-emerald-700">
								{formatVND(customer.totalSpent || 0)}
							</p>
						</div>

						{/* Source */}
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
									Nguồn Tiếp Cận
								</span>
								<FiGift className="h-4 w-4 text-purple-500" />
							</div>
							<p className="mt-1 font-bold text-sm text-slate-800">
								{customer.source === 'popup'
									? '🎁 Popup Voucher'
									: customer.source === 'checkout'
										? '🛍️ Đặt đơn checkout'
										: customer.source || 'Trực tiếp'}
							</p>
							{customer.couponReceived && (
								<span className="text-[10px] text-amber-700 font-mono font-bold block mt-0.5">
									Mã: {customer.couponReceived}
								</span>
							)}
						</div>
					</div>

					{/* Customer Segment & Quick Call Action */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Segment Settings */}
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
							<label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
								Phân Khúc Khách Hàng (CRM Tier)
							</label>
							<select
								value={cskhStatus}
								onChange={(e) => setCskhStatus(e.target.value)}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden cursor-pointer"
							>
								<option value="lead">🟢 Khách tiềm năng (Popup / Form Lead)</option>
								<option value="customer">🛒 Khách hàng đã mua hàng</option>
								<option value="vip">🌟 Khách VIP (Ưu tiên chăm sóc)</option>
							</select>
							<p className="text-[11px] text-slate-400 leading-snug">
								Chuyển đổi phân khúc giúp nhân viên CSKH lọc nhanh danh sách để gọi điện tư vấn và tặng voucher.
							</p>
						</div>

						{/* Contact Quick Actions */}
						<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
							<span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
								Liên Hệ Trực Tiếp
							</span>
							<div className="space-y-1.5 text-xs">
								<div className="flex items-center gap-2">
									<FiPhone className="h-3.5 w-3.5 text-slate-400" />
									<span className="font-mono font-bold text-slate-900">{customer.phone}</span>
								</div>
								{customer.email && (
									<div className="flex items-center gap-2">
										<FiMail className="h-3.5 w-3.5 text-slate-400" />
										<span className="text-slate-700">{customer.email}</span>
									</div>
								)}
								{customer.address && (
									<div className="flex items-start gap-2">
										<FiMapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-none" />
										<span className="text-slate-700 leading-snug">{customer.address}</span>
									</div>
								)}
							</div>

							{phoneClean && (
								<div className="flex items-center gap-2 pt-2 border-t border-slate-100">
									<a
										href={`tel:${customer.phone}`}
										className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition no-underline"
									>
										<FiPhone className="h-3.5 w-3.5" />
										<span>Gọi điện</span>
									</a>
									<a
										href={`https://zalo.me/${phoneClean}`}
										target="_blank"
										className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition no-underline"
									>
										<FiMessageSquare className="h-3.5 w-3.5" />
										<span>Nhắn Zalo</span>
									</a>
								</div>
							)}
						</div>
					</div>

					{/* CSKH Internal Notes Section */}
					<div className="rounded-2xl border border-slate-200 p-4 bg-white shadow-2xs space-y-3">
						<div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700">
							<FiClock className="h-4 w-4 text-slate-400" />
							<span>Lịch Sử Chăm Sóc & Ghi Chú CSKH</span>
						</div>

						{/* Existing Notes */}
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{safeNotes.length === 0 ? (
								<p className="text-xs text-slate-400 italic">Chưa có ghi chú CSKH nào cho khách hàng này.</p>
							) : (
								safeNotes.map((note: any, idx: number) => (
									<div key={idx} className="rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-200/60">
										<div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
											<span>👤 {note.author || 'Admin CSKH'}</span>
											<span>{note.createdAt ? new Date(note.createdAt).toLocaleString('vi-VN') : ''}</span>
										</div>
										<p className="text-slate-800 font-medium">{note.content}</p>
									</div>
								))
							)}
						</div>

						{/* Add New Note */}
						<div className="flex gap-2 pt-2 border-t border-slate-100">
							<input
								type="text"
								value={newNote}
								onChange={(e) => setNewNote(e.target.value)}
								placeholder="Thêm ghi chú sở thích, phản hồi tư vấn của khách..."
								className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden"
							/>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
					<div>
						{saveSuccess && (
							<span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in">
								<FiCheck className="h-4 w-4" /> Đã cập nhật hồ sơ khách hàng thành công!
							</span>
						)}
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							Đóng
						</button>

						<button
							type="button"
							onClick={handleSaveChanges}
							disabled={isSaving}
							className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 cursor-pointer"
						>
							<FiSave className="h-4 w-4" />
							<span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
