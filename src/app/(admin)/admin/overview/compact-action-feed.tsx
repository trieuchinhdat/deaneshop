'use client'

import { useState } from 'react'
import {
	FiAlertCircle,
	FiArrowRight,
	FiBriefcase,
	FiCheckCircle,
	FiExternalLink,
	FiEye,
	FiPackage,
	FiPrinter,
	FiZap,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { formatPrice } from '@/lib/utils'

interface CompactActionFeedProps {
	urgentB2BLeads: any[]
	actionableOrders: any[]
	onSelectLead: (lead: any) => void
	onSelectOrder: (order: any) => void
	onPrintOrder: (order: any) => void
	onViewAllLeads: () => void
	onViewAllOrders: () => void
}

export default function CompactActionFeed({
	urgentB2BLeads = [],
	actionableOrders = [],
	onSelectLead,
	onSelectOrder,
	onPrintOrder,
	onViewAllLeads,
	onViewAllOrders,
}: CompactActionFeedProps) {
	const [activeSubTab, setActiveSubTab] = useState<'leads' | 'orders'>('leads')

	const STATUS_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
		PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
		PROCESSING: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
		CONFIRMED: { label: 'Confirmed', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
		SHIPPING: { label: 'In Transit', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
	}

	return (
		<div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
			{/* Top Bar with Switcher */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
				<div className="flex items-center gap-2.5 min-w-0">
					<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400 font-black text-sm shadow-xs shrink-0">
						<FiZap className="h-4.5 w-4.5" />
					</span>
					<div className="min-w-0">
						<h3 className="font-black text-base text-slate-900 tracking-tight whitespace-nowrap">
							Urgent Action Queue
						</h3>
						<p className="text-[11px] text-slate-400 truncate">
							Prioritize high-ticket fulfillment & rapid SLA prospect outreach
						</p>
					</div>
				</div>

				{/* Tab Selector Pills */}
				<div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
					<button
						type="button"
						onClick={() => setActiveSubTab('leads')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
							activeSubTab === 'leads'
								? 'bg-white text-slate-900 shadow-2xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						<FiBriefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
						<span>B2B Inquiries</span>
						<span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.2 text-[10px] font-black shrink-0">
							{urgentB2BLeads.length}
						</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveSubTab('orders')}
						className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
							activeSubTab === 'orders'
								? 'bg-white text-slate-900 shadow-2xs'
								: 'text-slate-600 hover:text-slate-900'
						}`}
					>
						<FiPackage className="h-3.5 w-3.5 text-amber-600 shrink-0" />
						<span>Fulfillment Queue</span>
						<span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-black shrink-0">
							{actionableOrders.length}
						</span>
					</button>
				</div>
			</div>

			{/* SubTab 1: B2B Urgent Quotes */}
			{activeSubTab === 'leads' && (
				<div className="space-y-2.5">
					{urgentB2BLeads.length === 0 ? (
						<div className="text-center py-10 text-slate-400 text-xs">
							No urgent B2B custom quote requests awaiting action.
						</div>
					) : (
						urgentB2BLeads.slice(0, 4).map((lead) => {
							const aiScore = Number(lead.ai_score) || 0
							const isHot = aiScore >= 70

							return (
								<div
									key={lead.id || lead._id}
									className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
								>
									{/* Info column */}
									<div className="space-y-1 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-black text-sm text-slate-900 truncate">
												{lead.company_name || lead.name || 'B2B Prospect'}
											</span>
											{lead.country && (
												<span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 whitespace-nowrap shrink-0">
													{lead.country}
												</span>
											)}
											{isHot && (
												<span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 whitespace-nowrap shrink-0">
													Score: {aiScore}
												</span>
											)}
											<span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase whitespace-nowrap shrink-0">
												{lead.status || 'new'}
											</span>
										</div>

										<div className="text-xs text-slate-500 truncate flex items-center gap-2">
											<span className="truncate">
												<strong>Contact:</strong> {lead.name}
											</span>
											{lead.budget_range && (
												<>
													<span>•</span>
													<span className="text-slate-800 font-semibold whitespace-nowrap shrink-0">
														Budget: {lead.budget_range}
													</span>
												</>
											)}
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-nowrap">
										{lead.phone && (
											<a
												href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition whitespace-nowrap shrink-0"
												title="Fast WhatsApp Outreach"
											>
												<FaWhatsapp className="h-3.5 w-3.5 shrink-0" />
												<span className="whitespace-nowrap">WhatsApp</span>
											</a>
										)}
										<button
											type="button"
											onClick={() => onSelectLead(lead)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
										>
											<FiEye className="h-3.5 w-3.5 shrink-0" />
											<span className="whitespace-nowrap">Review 360°</span>
										</button>
									</div>
								</div>
							)
						})
					)}

					<div className="pt-1 flex justify-end">
						<button
							type="button"
							onClick={onViewAllLeads}
							className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
						>
							<span>Open Full B2B Pipeline ({urgentB2BLeads.length} leads)</span>
							<FiArrowRight className="h-3.5 w-3.5 shrink-0" />
						</button>
					</div>
				</div>
			)}

			{/* SubTab 2: Orders Need Action */}
			{activeSubTab === 'orders' && (
				<div className="space-y-2.5">
					{actionableOrders.length === 0 ? (
						<div className="text-center py-10 text-slate-400 text-xs">
							No orders awaiting fulfillment or priority dispatch.
						</div>
					) : (
						actionableOrders.slice(0, 4).map((order) => {
							const statusBadge =
								STATUS_BADGES[order.fulfillmentStatus] || STATUS_BADGES.PENDING
							const grandTotal = Number(order.pricing?.grandTotal) || 0
							const isHighTicket = grandTotal >= 100

							return (
								<div
									key={order._id}
									className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
								>
									{/* Info column */}
									<div className="space-y-1 min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-mono font-black text-sm text-slate-900 whitespace-nowrap">
												{order.orderId || order._id.slice(0, 8)}
											</span>
											{isHighTicket && (
												<span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap shrink-0">
													High-Ticket
												</span>
											)}
											<span
												className={`rounded-md px-2 py-0.5 text-[10px] font-bold border whitespace-nowrap shrink-0 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
											>
												{statusBadge.label}
											</span>
											<span className="font-mono font-black text-sm text-slate-900 whitespace-nowrap">
												{formatPrice(grandTotal)}
											</span>
										</div>

										<div className="text-xs text-slate-500 truncate flex items-center gap-2">
											<span className="truncate">
												<strong>Buyer:</strong> {order.customer?.name || 'Guest Customer'}
											</span>
											<span>•</span>
											<span className="truncate">
												{order.items?.[0]?.title || 'Product Offer'}
												{order.items?.length > 1 ? ` (+${order.items.length - 1})` : ''}
											</span>
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-nowrap">
										<button
											type="button"
											onClick={() => onPrintOrder(order)}
											className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0"
											title="Print Packing Slip"
										>
											<FiPrinter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
											<span className="whitespace-nowrap">Print Slip</span>
										</button>
										<button
											type="button"
											onClick={() => onSelectOrder(order)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
										>
											<FiEye className="h-3.5 w-3.5 shrink-0" />
											<span className="whitespace-nowrap">Fulfill Order</span>
										</button>
									</div>
								</div>
							)
						})
					)}

					<div className="pt-1 flex justify-end">
						<button
							type="button"
							onClick={onViewAllOrders}
							className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap shrink-0"
						>
							<span>Open Full Orders Queue ({actionableOrders.length} orders)</span>
							<FiArrowRight className="h-3.5 w-3.5 shrink-0" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
