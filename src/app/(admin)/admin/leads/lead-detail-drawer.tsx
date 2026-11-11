'use client'

import { useEffect, useMemo, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import {
	FiAlertCircle,
	FiArrowRight,
	FiBriefcase,
	FiCheck,
	FiCheckCircle,
	FiClock,
	FiDollarSign,
	FiExternalLink,
	FiEye,
	FiGlobe,
	FiLinkedin,
	FiMail,
	FiMapPin,
	FiMaximize2,
	FiMessageCircle,
	FiMessageSquare,
	FiMinimize2,
	FiPhone,
	FiRefreshCw,
	FiSave,
	FiSend,
	FiShield,
	FiTag,
	FiTrendingUp,
	FiUser,
	FiX,
	FiZap,
} from 'react-icons/fi'
import { D1AdminUser, D1Lead } from '@/lib/d1'
import { PIPELINE_STAGES } from './types'

interface LeadDetailDrawerProps {
	lead: D1Lead | null
	isOpen: boolean
	onClose: () => void
	onLeadUpdated: (updatedLead: D1Lead) => void
	staffList: D1AdminUser[]
	currentStaff?: any
	brandName?: string
}

export default function LeadDetailDrawer({
	lead,
	isOpen,
	onClose,
	onLeadUpdated,
	staffList,
	currentStaff,
	brandName,
}: LeadDetailDrawerProps) {
	if (!isOpen || !lead) return null

	const brand = brandName || 'Corporate Solutions'
	const isSales = currentStaff?.role === 'sales'
	const isAdminOrSuperAdmin = currentStaff?.role === 'superadmin' || currentStaff?.role === 'admin'

	const [status, setStatus] = useState<string>(lead.status || 'new')
	const [assignedTo, setAssignedTo] = useState<string>(lead.assigned_to || '')
	const [activeTab, setActiveTab] = useState<'ai' | 'attribution' | 'notes'>(
		'ai',
	)
	const [newNote, setNewNote] = useState('')
	const [isMaximized, setIsMaximized] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)

	// Quick Email state
	const [showEmailComposer, setShowEmailComposer] = useState(false)
	const [emailSubject, setEmailSubject] = useState(
		`${brand} - Proposal Inquiry Response for ${lead.company_name || lead.name}`,
	)
	const [emailBody, setEmailBody] = useState(lead.ai_pitch_draft || '')
	const [isSendingEmail, setIsSendingEmail] = useState(false)
	const [emailSentAlert, setEmailSentAlert] = useState<string | null>(null)

	// Sync local state when selected lead changes
	useEffect(() => {
		setStatus(lead.status || 'new')
		setAssignedTo(lead.assigned_to || '')
		setEmailSubject(
			`${brand} - Proposal Inquiry Response for ${lead.company_name || lead.name}`,
		)
		setEmailBody(lead.ai_pitch_draft || '')
		setShowEmailComposer(false)
		setEmailSentAlert(null)
	}, [lead, brand])

	// Calculate Speed-to-lead elapsed time
	const speedToLeadInfo = useMemo(() => {
		const createdTime = new Date(lead.created_at).getTime()
		const now = Date.now()
		const diffMinutes = Math.floor((now - createdTime) / (1000 * 60))

		if (lead.last_contacted_at) {
			const contactedTime = new Date(lead.last_contacted_at).getTime()
			const responseMinutes = Math.max(
				1,
				Math.floor((contactedTime - createdTime) / (1000 * 60)),
			)
			return {
				isResponded: true,
				label: `Contacted in ${responseMinutes}m`,
				badgeClass:
					responseMinutes <= 5
						? 'bg-emerald-50 text-emerald-700 border-emerald-200'
						: 'bg-slate-100 text-slate-700 border-slate-200',
			}
		}

		if (diffMinutes <= 5) {
			return {
				isResponded: false,
				label: `New (${diffMinutes}m ago - Gold SLA < 5m)`,
				badgeClass:
					'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse font-black',
			}
		}

		if (diffMinutes < 60) {
			return {
				isResponded: false,
				label: `${diffMinutes}m awaiting outreach`,
				badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
			}
		}

		const hours = Math.floor(diffMinutes / 60)
		return {
			isResponded: false,
			label: `SLA Breached (${hours}h pending)`,
			badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
		}
	}, [lead.created_at, lead.last_contacted_at])

	// Parse Journey JSON
	const journeyBreadcrumbs = useMemo(() => {
		if (!lead.journey_json) return []
		try {
			const parsed = JSON.parse(lead.journey_json)
			return Array.isArray(parsed) ? parsed : []
		} catch {
			return []
		}
	}, [lead.journey_json])

	const phoneClean = (lead.phone || '').replace(/\D/g, '')

	// Save status & assigned rep changes
	const handleSave = async (customPatch?: Partial<D1Lead>) => {
		setIsSaving(true)
		setSaveSuccess(false)
		try {
			const patchPayload = {
				leadId: lead.id,
				status: customPatch?.status || status,
				assigned_to:
					customPatch?.assigned_to !== undefined
						? customPatch.assigned_to
						: assignedTo,
				newNote: newNote.trim() || undefined,
				author: currentStaff?.name || 'Staff AE',
				...customPatch,
			}

			const res = await fetch('/api/admin/leads/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patchPayload),
			})

			const data = await res.json()
			if (data.success) {
				setSaveSuccess(true)
				const updatedLead: D1Lead = {
					...lead,
					status: (patchPayload.status as any) || lead.status,
					assigned_to: patchPayload.assigned_to,
					internal_notes: newNote.trim()
						? lead.internal_notes
							? `${lead.internal_notes}\n\n[New Note]: ${newNote.trim()}`
							: newNote.trim()
						: lead.internal_notes,
					...customPatch,
					updated_at: new Date().toISOString(),
				}
				onLeadUpdated(updatedLead)
				setNewNote('')
				setTimeout(() => setSaveSuccess(false), 2000)
			}
		} catch (err) {
			console.error('Failed to update lead:', err)
		} finally {
			setIsSaving(false)
		}
	}

	// 1-Click Send Email via Resend
	const handleSendQuickEmail = async () => {
		if (!lead.email) return
		setIsSendingEmail(true)
		setEmailSentAlert(null)
		try {
			const res = await fetch('/api/admin/leads/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leadId: lead.id,
					toEmail: lead.email,
					subject: emailSubject,
					content: emailBody,
					staffName: currentStaff?.name || `${brand} Advisor`,
				}),
			})
			const result = await res.json()
			if (result.success) {
				setEmailSentAlert(result.message)
				const now = new Date().toISOString()
				const updated = {
					...lead,
					last_contacted_at: now,
					status: (lead.status === 'new' ? 'contacted' : lead.status) as any,
				}
				setStatus(updated.status)
				onLeadUpdated(updated)
				setTimeout(() => {
					setShowEmailComposer(false)
					setEmailSentAlert(null)
				}, 2200)
			} else {
				setEmailSentAlert(result.error || 'Failed to dispatch email.')
			}
		} catch (err) {
			console.error('Send email error:', err)
			setEmailSentAlert('Could not establish connection to the email service.')
		} finally {
			setIsSendingEmail(false)
		}
	}

	return (
		<div className="animate-in fade-in fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs duration-200 print:hidden">
			<div className="absolute inset-y-0 right-0 flex max-w-full sm:pl-10">
				<div
					className={`animate-in slide-in-from-right relative flex w-screen max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl transition-all duration-300 ${
						isMaximized
							? 'sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl'
							: 'sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-[860px]'
					}`}
				>
					{/* Top Header */}
					<div className="border-b border-slate-200 bg-slate-50/80 p-4 sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="truncate text-lg font-black tracking-tight text-slate-900 sm:text-xl">
										{lead.name}
									</h2>
									{lead.company_name && (
										<span className="inline-flex max-w-[200px] items-center gap-1 truncate rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-800">
											<FiBriefcase className="h-3 w-3 shrink-0 text-slate-600" />
											{lead.company_name}
										</span>
									)}
								</div>

								<div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
									{lead.email && (
										<span className="flex max-w-full items-center gap-1 truncate font-medium">
											<FiMail className="h-3.5 w-3.5 shrink-0" />
											<span className="truncate">{lead.email}</span>
											{lead.is_corporate_email ? (
												<span className="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black text-indigo-700 uppercase">
													Work Email
												</span>
											) : null}
										</span>
									)}
									{lead.phone && (
										<span className="flex shrink-0 items-center gap-1 font-medium">
											<FiPhone className="h-3.5 w-3.5" />
											{lead.phone}
										</span>
									)}
									{lead.ip_country && (
										<span className="flex shrink-0 items-center gap-1 font-medium">
											<FiMapPin className="h-3.5 w-3.5" />
											{lead.ip_city ? `${lead.ip_city}, ` : ''}
											{lead.ip_country}
										</span>
									)}
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-1">
								<button
									type="button"
									onClick={() => setIsMaximized(!isMaximized)}
									className="hidden cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 sm:flex"
									title={
										isMaximized
											? 'Restore standard width (860px)'
											: 'Expand to wide view (1150px)'
									}
									aria-label={isMaximized ? 'Restore width' : 'Expand width'}
								>
									{isMaximized ? (
										<FiMinimize2 className="h-4 w-4" />
									) : (
										<FiMaximize2 className="h-4 w-4" />
									)}
								</button>

								<button
									type="button"
									onClick={onClose}
									className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
									aria-label="Close drawer"
								>
									<FiX className="h-5 w-5" />
								</button>
							</div>
						</div>

						{/* Badges: AI Score + Speed-to-lead SLA */}
						<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
							<div className="flex flex-wrap items-center gap-2">
								<div
									className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-black ${
										(lead.ai_score || 0) >= 80
											? 'border-rose-200 bg-rose-50 text-rose-700'
											: (lead.ai_score || 0) >= 55
												? 'border-amber-200 bg-amber-50 text-amber-700'
												: 'border-slate-200 bg-slate-50 text-slate-700'
									}`}
								>
									<FiZap className="h-3.5 w-3.5" />
									AI Score: {lead.ai_score || 0}/100
									<span className="text-[10px] font-bold tracking-wider uppercase">
										{(lead.ai_score || 0) >= 80
											? 'Hot'
											: (lead.ai_score || 0) >= 55
												? 'Warm'
												: 'Cold'}
									</span>
								</div>

								{lead.budget_range && (
									<span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
										<FiDollarSign className="h-3 w-3 text-emerald-600" />
										{lead.budget_range}
									</span>
								)}
							</div>

							<div
								className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs ${speedToLeadInfo.badgeClass}`}
							>
								<FiClock className="h-3.5 w-3.5 shrink-0" />
								<span>{speedToLeadInfo.label}</span>
							</div>
						</div>
					</div>

					{/* 1-Click Speed-to-Lead Direct Actions */}
					<div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
						{/* WhatsApp Direct with Pre-filled Outreach Script */}
						{phoneClean && (
							<button
								type="button"
								onClick={() => {
									const script = `Hi ${lead.name || ''}, this is ${brand} B2B Enterprise Team. We received your custom quote request for ${lead.company_name || 'your organization'}. Would you be available for a brief discussion on specifications, MOQ & wholesale tiers?`
									window.open(
										`https://wa.me/${phoneClean}?text=${encodeURIComponent(script)}`,
										'_blank',
									)
								}}
								className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700"
							>
								<FaWhatsapp className="h-3.5 w-3.5" />
								WhatsApp Outreach
							</button>
						)}

						{/* Online B2B Quote Link */}
						{(() => {
							const linkedRfqNumber =
								(lead.internal_notes || '').match(/RFQ-[\w-]+/)?.[0] ||
								(lead.message || '').match(/RFQ-[\w-]+/)?.[0]
							const quoteTarget = linkedRfqNumber || lead.id
							return (
								<a
									href={`/quote/${quoteTarget}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 transition hover:bg-purple-100"
									title="View or send custom online proposal to client"
								>
									<FiExternalLink className="h-3.5 w-3.5 text-purple-600" />
									Online B2B Quote
								</a>
							)
						})()}

						{/* Zalo Direct */}
						{phoneClean && (
							<button
								type="button"
								onClick={() =>
									window.open(`https://zalo.me/${phoneClean}`, '_blank')
								}
								className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
							>
								<FiMessageCircle className="h-3.5 w-3.5" />
								Zalo Chat
							</button>
						)}

						{/* Quick Email Composer Toggle */}
						{lead.email && (
							<button
								type="button"
								onClick={() => setShowEmailComposer(!showEmailComposer)}
								className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-2xs transition ${
									showEmailComposer
										? 'border-slate-900 bg-slate-900 text-white'
										: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
								}`}
							>
								<FiMail className="h-3.5 w-3.5 text-indigo-600" />
								Compose Email (Resend)
							</button>
						)}

						{/* LinkedIn Search */}
						<button
							type="button"
							onClick={() =>
								window.open(
									`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.company_name || lead.name)}`,
									'_blank',
								)
							}
							className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
						>
							<FiLinkedin className="h-3.5 w-3.5 text-sky-600" />
							LinkedIn
						</button>
					</div>

					{/* Quick Email Composer Accordion */}
					{showEmailComposer && (
						<div className="animate-in fade-in space-y-3 border-b border-indigo-100 bg-indigo-50/50 p-4 duration-200">
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-1.5 text-xs font-black text-indigo-900 uppercase">
									<FiSend className="h-3.5 w-3.5 text-indigo-600" />
									B2B Email Composer (Powered by Resend API)
								</span>
								<button
									type="button"
									onClick={() => setShowEmailComposer(false)}
									className="cursor-pointer text-xs text-slate-500 hover:text-slate-800"
								>
									Close
								</button>
							</div>

							<div>
								<label className="text-[11px] font-bold text-slate-600">
									Email Subject:
								</label>
								<input
									type="text"
									value={emailSubject}
									onChange={(e) => setEmailSubject(e.target.value)}
									className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
								/>
							</div>

							<div>
								<div className="flex items-center justify-between">
									<label className="text-[11px] font-bold text-slate-600">
										Personalized Pitch (AI Draft):
									</label>
									{lead.ai_pitch_draft && (
										<button
											type="button"
											onClick={() => setEmailBody(lead.ai_pitch_draft || '')}
											className="cursor-pointer text-[10px] font-bold text-indigo-700 hover:underline"
										>
											Restore AI Draft
										</button>
									)}
								</div>
								<textarea
									rows={6}
									value={emailBody}
									onChange={(e) => setEmailBody(e.target.value)}
									className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed focus:border-indigo-600 focus:outline-hidden"
								/>
							</div>

							{emailSentAlert && (
								<div
									className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold ${
										emailSentAlert.includes('Failed') || emailSentAlert.includes('Could not')
											? 'border-rose-300 bg-rose-50 text-rose-800'
											: 'border-emerald-300 bg-emerald-100 text-emerald-800'
									}`}
								>
									{emailSentAlert.includes('Failed') || emailSentAlert.includes('Could not') ? (
										<FiAlertCircle className="h-4 w-4 text-rose-600" />
									) : (
										<FiCheck className="h-4 w-4" />
									)}
									{emailSentAlert}
								</div>
							)}

							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={handleSendQuickEmail}
									disabled={isSendingEmail}
									className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
								>
									{isSendingEmail ? (
										<FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
									) : (
										<FiSend className="h-3.5 w-3.5" />
									)}
									Review & Send Email
								</button>
							</div>
						</div>
					)}

					{/* Pipeline Stage Quick Switcher Bar */}
					<div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[11px] font-black text-slate-500 uppercase">
								Pipeline Stage:
							</span>
							<span className="text-xs font-bold text-slate-700">
								{PIPELINE_STAGES.find((s) => s.id === status)?.label}
							</span>
						</div>

						<div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
							{PIPELINE_STAGES.map((stg) => {
								const isCurrent = status === stg.id
								return (
									<button
										key={stg.id}
										type="button"
										onClick={() => {
											setStatus(stg.id)
											handleSave({ status: stg.id })
										}}
										className={`cursor-pointer rounded-xl border px-1 py-2 text-center text-[10px] font-bold transition ${
											isCurrent
												? 'border-slate-900 bg-slate-900 font-black text-white shadow-xs'
												: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
										}`}
										title={stg.description}
									>
										{stg.label.split('/')[0]}
									</button>
								)
							})}
						</div>
					</div>

					{/* Staff Assignment */}
					<div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
						<span className="shrink-0 text-xs font-bold text-slate-700">
							Assigned Account Executive:
						</span>
						{isSales && !isAdminOrSuperAdmin ? (
							<div className="flex items-center gap-2">
								<span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
									{staffList.find((s) => s.id === assignedTo)?.full_name ||
										(assignedTo ? assignedTo : 'Unassigned Pool')}
								</span>
								{!assignedTo && (
									<button
										type="button"
										onClick={() => {
											const myId = currentStaff?.id || ''
											setAssignedTo(myId)
											handleSave({ assigned_to: myId })
										}}
										className="cursor-pointer rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
									>
										Claim This Lead
									</button>
								)}
							</div>
						) : (
							<select
								value={assignedTo}
								onChange={(e) => {
									setAssignedTo(e.target.value)
									handleSave({ assigned_to: e.target.value })
								}}
								className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
							>
								<option value="">-- Unassigned --</option>
								{staffList.map((stf) => (
									<option key={stf.id} value={stf.id}>
										{stf.full_name} ({stf.role})
									</option>
								))}
							</select>
						)}
					</div>

					{/* Drawer Tabs Header */}
					<div className="flex overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-6">
						<button
							type="button"
							onClick={() => setActiveTab('ai')}
							className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition sm:px-4 ${
								activeTab === 'ai'
									? 'border-slate-900 font-black text-slate-900'
									: 'border-transparent text-slate-500 hover:text-slate-800'
							}`}
						>
							<FiZap className="h-3.5 w-3.5 text-indigo-600" />
							AI Insights & Needs
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('attribution')}
							className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition sm:px-4 ${
								activeTab === 'attribution'
									? 'border-slate-900 font-black text-slate-900'
									: 'border-transparent text-slate-500 hover:text-slate-800'
							}`}
						>
							<FiEye className="h-3.5 w-3.5" />
							Session Journey ({journeyBreadcrumbs.length})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('notes')}
							className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition sm:px-4 ${
								activeTab === 'notes'
									? 'border-slate-900 font-black text-slate-900'
									: 'border-transparent text-slate-500 hover:text-slate-800'
							}`}
						>
							<FiMessageSquare className="h-3.5 w-3.5" />
							Timeline & Notes
						</button>
					</div>

					{/* Drawer Body */}
					<div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
						{/* TAB 1: AI Insights */}
						{activeTab === 'ai' && (
							<div className="animate-in fade-in space-y-5 duration-150">
								{/* AI 2-Bullet Summary Card */}
								<div className="space-y-2 rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/60 to-purple-50/40 p-4">
									<div className="flex items-center justify-between">
										<span className="flex items-center gap-1.5 text-[11px] font-black text-indigo-900 uppercase">
											<FiZap className="h-4 w-4 text-indigo-600" />
											AI Executive Summary
										</span>
										<span className="rounded-full bg-indigo-100/70 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
											Gemini AI
										</span>
									</div>
									<div className="text-xs leading-relaxed font-medium whitespace-pre-wrap text-slate-800">
										{lead.ai_summary || 'Analyzing inquiry details...'}
									</div>
								</div>

								{/* Original Message */}
								<div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
									<span className="block text-[11px] font-black text-slate-400 uppercase">
										Customer Inquiry Message:
									</span>
									<p className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
										{lead.message || 'No specific inquiry message provided.'}
									</p>
								</div>

								{/* Corporate Profile & Requirements */}
								<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
									<span className="block text-[11px] font-black text-slate-400 uppercase">
										Corporate Profile & Requirements:
									</span>
									<div className="grid grid-cols-2 gap-2.5 text-xs lg:grid-cols-4">
										<div className="rounded-xl bg-slate-50 p-3">
											<span className="block text-[10px] font-bold text-slate-400">
												Company Name
											</span>
											<span className="font-bold text-slate-900">
												{lead.company_name || 'Individual / Not specified'}
											</span>
										</div>
										<div className="rounded-xl bg-slate-50 p-3">
											<span className="block text-[10px] font-bold text-slate-400">
												Target Market / Region
											</span>
											<span className="font-bold text-slate-900">
												{lead.country || lead.ip_country || 'International'}
											</span>
										</div>
										<div className="rounded-xl bg-slate-50 p-3">
											<span className="block text-[10px] font-bold text-slate-400">
												Target Budget
											</span>
											<span className="font-bold text-emerald-700">
												{lead.budget_range || 'Flexible / Inquiry'}
											</span>
										</div>
										<div className="rounded-xl bg-slate-50 p-3">
											<span className="block text-[10px] font-bold text-slate-400">
												Acquisition Channel
											</span>
											<span className="font-bold text-slate-900 capitalize">
												{lead.source || 'Direct'}
											</span>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: Full-Funnel Attribution */}
						{activeTab === 'attribution' && (
							<div className="animate-in fade-in space-y-5 duration-150">
								{/* Session Journey Breadcrumbs Timeline */}
								<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
									<div className="flex items-center justify-between">
										<span className="text-[11px] font-black text-slate-700 uppercase">
											Pre-Conversion Navigation Journey:
										</span>
										<span className="text-[10px] font-bold text-slate-500">
											{journeyBreadcrumbs.length} Touchpoints
										</span>
									</div>

									{journeyBreadcrumbs.length > 0 ? (
										<div className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-slate-200">
											{journeyBreadcrumbs.map((bc: any, idx: number) => {
												const isLast = idx === journeyBreadcrumbs.length - 1
												return (
													<div key={idx} className="group relative">
														<div
															className={`absolute top-1 -left-6 h-4 w-4 rounded-full border-2 ${
																isLast
																	? 'border-emerald-600 bg-emerald-100 ring-4 ring-emerald-50'
																	: 'border-slate-400 bg-white'
															}`}
														/>
														<div className="text-xs">
															<div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900">
																<span>{bc.title || bc.path}</span>
																{isLast && (
																	<span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[10px] font-black text-emerald-800">
																		Conversion Touchpoint
																	</span>
																)}
															</div>
															<span className="block font-mono text-[11px] text-slate-400">
																{bc.path}
															</span>
														</div>
													</div>
												)
											})}
										</div>
									) : (
										<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 italic">
											No pre-conversion session history detected (Direct visit
											or cookies disabled).
										</p>
									)}
								</div>

								{/* UTM & Attribution Details */}
								<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
									<div className="flex items-center justify-between">
										<span className="block text-[11px] font-black text-slate-700 uppercase">
											Edge Marketing & Click Attribution:
										</span>
										<span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
											1st-Party Cookie
										</span>
									</div>
									<div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
										<div className="rounded-xl bg-slate-50 p-2.5">
											<span className="block text-[10px] font-bold text-slate-400">
												utm_source
											</span>
											<span className="block truncate font-bold text-slate-800">
												{lead.utm_source || '—'}
											</span>
										</div>
										<div className="rounded-xl bg-slate-50 p-2.5">
											<span className="block text-[10px] font-bold text-slate-400">
												utm_medium
											</span>
											<span className="block truncate font-bold text-slate-800">
												{lead.utm_medium || '—'}
											</span>
										</div>
										<div className="rounded-xl bg-slate-50 p-2.5 sm:col-span-2">
											<span className="block text-[10px] font-bold text-slate-400">
												utm_campaign
											</span>
											<span className="block truncate font-bold text-slate-800">
												{lead.utm_campaign || '—'}
											</span>
										</div>
										{lead.click_id && (
											<div className="col-span-2 rounded-xl bg-slate-50 p-2.5 sm:col-span-4">
												<span className="block text-[10px] font-bold text-slate-400">
													Ad Click ID (fbclid / gclid / ttclid)
												</span>
												<span
													className="block truncate font-bold text-emerald-700"
													title={lead.click_id}
												>
													{lead.click_id}
												</span>
											</div>
										)}
										{(lead.utm_term || lead.utm_content) && (
											<div className="col-span-2 flex justify-between gap-2 rounded-xl bg-slate-50 p-2.5 sm:col-span-4">
												<div>
													<span className="block text-[10px] font-bold text-slate-400">
														utm_term
													</span>
													<span className="text-slate-800">
														{lead.utm_term || '—'}
													</span>
												</div>
												<div>
													<span className="block text-[10px] font-bold text-slate-400">
														utm_content
													</span>
													<span className="text-slate-800">
														{lead.utm_content || '—'}
													</span>
												</div>
											</div>
										)}
										<div className="col-span-2 rounded-xl bg-slate-50 p-2.5 sm:col-span-4">
											<span className="block text-[10px] font-bold text-slate-400">
												Landing Page URL
											</span>
											<a
												href={lead.landing_page_url || '#'}
												target="_blank"
												rel="noreferrer"
												className="flex items-center gap-1 truncate text-[11px] text-blue-600 hover:underline"
											>
												<span className="truncate">
													{lead.landing_page_url || '—'}
												</span>
												<FiExternalLink className="h-3 w-3 shrink-0" />
											</a>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* TAB 3: Activity Timeline & Notes */}
						{activeTab === 'notes' && (
							<div className="animate-in fade-in space-y-4 duration-150">
								{/* Activity History */}
								<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
									<span className="block text-[11px] font-black text-slate-400 uppercase">
										Internal Collaborative History & Notes:
									</span>

									{lead.internal_notes ? (
										<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
											{lead.internal_notes}
										</div>
									) : (
										<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 italic">
											No internal notes recorded yet for this prospect.
										</p>
									)}
								</div>

								{/* Add new note box */}
								<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
									<label className="block text-xs font-bold text-slate-700">
										Add Activity or Call Follow-up Note:
									</label>
									<textarea
										rows={3}
										value={newNote}
										onChange={(e) => setNewNote(e.target.value)}
										placeholder="e.g. Conducted discovery call with prospect, agreed to deliver initial quote by 5 PM..."
										className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-hidden"
									/>
									<div className="flex items-center justify-between">
										{saveSuccess ? (
											<span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
												<FiCheck className="h-4 w-4" /> Changes saved
												successfully!
											</span>
										) : (
											<span />
										)}

										<button
											type="button"
											onClick={() => handleSave()}
											disabled={isSaving || !newNote.trim()}
											className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
										>
											{isSaving ? (
												<FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
											) : (
												<FiSave className="h-3.5 w-3.5" />
											)}
											Save Note
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
