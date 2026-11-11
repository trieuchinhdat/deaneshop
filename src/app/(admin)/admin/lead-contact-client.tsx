'use client'

import {
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	Loader2,
	Mail,
	MessageSquare,
	Phone,
	Send,
	User,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { IntelligenceLead } from '@/lib/lead-intelligence'

export default function LeadContactClient({
	lead,
	canEdit,
	canAssign,
	staff,
	onSaved,
}: {
	lead: IntelligenceLead
	canEdit: boolean
	canAssign: boolean
	staff: { id: string; name: string }[]
	onSaved: () => void
}) {
	const emailCommand = useRef({ key: '', id: '' })
	function commandId() {
		const key = JSON.stringify([lead.id, subject, body])
		if (emailCommand.current.key !== key)
			emailCommand.current = { key, id: crypto.randomUUID() }
		return emailCommand.current.id
	}

	const [note, setNote] = useState('')
	const [subject, setSubject] = useState('Regarding your inquiry')
	const [body, setBody] = useState('')
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState('')
	const [isError, setIsError] = useState(false)
	const [owner, setOwner] = useState(lead.assigned_to || '')
	const [status, setStatus] = useState(lead.status)

	const EMAIL_TEMPLATES = [
		{
			id: 'catalog',
			label: 'B2B Catalog & Spec',
			subject: 'DeanFlow — Product Catalog & Wholesale Specifications',
			getBody: (name: string, company: string) =>
				`Hi ${name || 'there'},\n\nThank you for reaching out to us regarding wholesale opportunities with ${company || 'your business'}.\n\nAttached is our latest B2B product catalog and technical specifications. We support custom OEM/ODM packaging, certified compliance standards, and tiered volume pricing.\n\nCould you share your estimated order volume and target delivery timeline so we can prepare an accurate proposal?\n\nBest regards,\nSales & Account Operations`,
		},
		{
			id: 'meet',
			label: 'Video Call Demo',
			subject: 'DeanFlow — Introductory Consultation & B2B Inquiry',
			getBody: (name: string, company: string) =>
				`Hi ${name || 'there'},\n\nWe reviewed your inquiry regarding requirements for ${company || 'your team'}.\n\nTo ensure we provide the best recommendation for your production and logistics needs, would you be available for a brief 15-minute video call this week?\n\nPlease let us know what day and time works best for you (or your local timezone), and we will send over a calendar invitation.\n\nLooking forward to speaking,\nB2B Account Executive`,
		},
		{
			id: 'pricing',
			label: 'MOQ & Volume Quote',
			subject: 'DeanFlow — Minimum Order Quantity (MOQ) & Pricing Tier',
			getBody: (name: string, company: string) =>
				`Hi ${name || 'there'},\n\nThank you for inquiring about pricing terms for ${company || 'your order'}.\n\nOur standard MOQ per SKU starts at 500 units, with tiered volume price breaks starting at 1,000, 2,500, and 5,000+ units. All production batches undergo double-blind QC inspection and include export documentation.\n\nPlease confirm your preferred destination port/address and product variants so we can issue an official quotation.\n\nSincerely,\nCommercial Pricing Desk`,
		},
		{
			id: 'followup',
			label: 'Gentle Follow-up',
			subject: 'Following up regarding your inquiry',
			getBody: (name: string, company: string) =>
				`Hi ${name || 'there'},\n\nI wanted to gently follow up on our previous correspondence regarding your inquiry for ${company || 'your project'}.\n\nDo you have any questions regarding sample kits, lead times, or contract manufacturing specifications that we can assist with?\n\nHappy to help whenever you are ready.\n\nBest regards,\nCustomer Support & Sales`,
		},
	]

	function applyTemplate(tpl: (typeof EMAIL_TEMPLATES)[number]) {
		setSubject(tpl.subject)
		setBody(tpl.getBody(lead.name || '', lead.company_name || ''))
	}

	async function request(url: string, payload: object) {
		setBusy(true)
		setMessage('')
		setIsError(false)
		try {
			const r = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const d = await r.json()
			if (!r.ok || d.success === false)
				throw new Error(d.error || d.message || 'Request failed')
			setMessage('Saved successfully.')
			setNote('')
			onSaved()
		} catch (e) {
			setIsError(true)
			setMessage(e instanceof Error ? e.message : 'Request failed')
		} finally {
			setBusy(false)
		}
	}

	const phone = (lead.phone || '').replace(/[^0-9+]/g, '')

	return (
		<section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
				<div>
					<h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
						<MessageSquare className="h-4 w-4 text-slate-600" />
						Outreach & Activity Logging
					</h2>
					<p className="mt-0.5 text-xs text-slate-500">
						Log representative touchpoints or dispatch outbound email.
					</p>
				</div>

				{/* Quick Contact Actions */}
				<div className="flex flex-wrap items-center gap-2">
					{phone && (
						<a
							href={`tel:${phone}`}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
						>
							<Phone className="h-3.5 w-3.5 text-slate-500" />
							Call
						</a>
					)}
					{phone && (
						<a
							target="_blank"
							rel="noopener noreferrer"
							href={`https://wa.me/${phone.replace(/\D/g, '')}`}
							className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
						>
							<ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
							WhatsApp
						</a>
					)}
				</div>
			</div>

			<p className="mt-3 text-xs text-slate-500">
				External contact links open third-party clients and do not record a
				completed conversation. Log the outcome below to keep records accurate.
			</p>

			{message && (
				<div
					role="status"
					className={`my-3.5 flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
						isError
							? 'border border-rose-200 bg-rose-50 text-rose-800'
							: 'border border-emerald-200 bg-emerald-50 text-emerald-800'
					}`}
				>
					{isError ? (
						<span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
					) : (
						<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
					)}
					{message}
				</div>
			)}

			{canEdit && (
				<div className="mt-4 grid gap-5 lg:grid-cols-2">
					{/* Activity Logging Box */}
					<div className="space-y-3.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
						<div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
							<span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
								<FileText className="h-3.5 w-3.5 text-slate-400" />
								Log Call / Interaction
							</span>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<label className="grid gap-1 text-xs font-medium text-slate-700">
								<span>Pipeline Status</span>
								<select
									className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
									value={status}
									onChange={(e) =>
										setStatus(e.target.value as IntelligenceLead['status'])
									}
								>
									<option value="new">New Inquiry</option>
									<option value="contacted">Contacting</option>
									<option value="discovery">Engaged</option>
									<option value="closed">Closed</option>
									{['proposal', 'won', 'lost'].includes(lead.status) && (
										<option value={lead.status}>Legacy: {lead.status}</option>
									)}
								</select>
							</label>

							{canAssign && (
								<label className="grid gap-1 text-xs font-medium text-slate-700">
									<span className="flex items-center gap-1">
										<User className="h-3 w-3 text-slate-400" />
										Assigned Owner
									</span>
									<select
										className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
										value={owner}
										onChange={(e) => setOwner(e.target.value)}
									>
										<option value="">Unassigned</option>
										{staff.map((s) => (
											<option key={s.id} value={s.id}>
												{s.name}
											</option>
										))}
									</select>
								</label>
							)}
						</div>

						<label className="grid gap-1 text-xs font-medium text-slate-700">
							<span>Notes & Call Outcome</span>
							<textarea
								maxLength={2000}
								rows={3}
								placeholder="Summarize customer requirements, timeline, quantity or objections..."
								className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
								value={note}
								onChange={(e) => setNote(e.target.value)}
							/>
						</label>

						<div className="flex flex-wrap items-center gap-2 pt-1">
							<button
								disabled={busy}
								type="button"
								className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50"
								onClick={() =>
									void request('/api/admin/leads/update', {
										leadId: lead.id,
										expectedVersion: lead.version,
										status,
										...(canAssign ? { assigned_to: owner } : {}),
										newNote: note,
									})
								}
							>
								{busy && <Loader2 className="h-3 w-3 animate-spin" />}
								Save activity
							</button>

							<button
								disabled={busy || !note.trim()}
								type="button"
								className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-slate-800 disabled:opacity-50"
								onClick={() =>
									void request('/api/admin/leads/update', {
										leadId: lead.id,
										expectedVersion: lead.version,
										status: status === 'new' ? 'contacted' : status,
										newNote: note,
										recordContact: true,
									})
								}
							>
								{busy ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
								)}
								Log completed contact
							</button>
						</div>
					</div>

					{/* Outbound Email Box */}
					{lead.email ? (
						<div className="space-y-3.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
							<div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
								<span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
									<Mail className="h-3.5 w-3.5 text-slate-400" />
									Email Composer
								</span>
							</div>

							{/* Quick Templates Pill Bar */}
							<div>
								<span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
									Quick B2B Templates
								</span>

								<div className="flex flex-wrap gap-1.5">
									{EMAIL_TEMPLATES.map((tpl) => (
										<button
											key={tpl.id}
											type="button"
											onClick={() => applyTemplate(tpl)}
											className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-100"
										>
											{tpl.label}
										</button>
									))}
								</div>
							</div>

							<label className="grid gap-1 text-xs font-medium text-slate-700">
								<span>Subject</span>
								<input
									maxLength={250}
									className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
								/>
							</label>

							<label className="grid gap-1 text-xs font-medium text-slate-700">
								<span>Message</span>
								<textarea
									rows={4}
									maxLength={10000}
									placeholder="Write response message..."
									className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-2xs focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
									value={body}
									onChange={(e) => setBody(e.target.value)}
								/>
							</label>

							<div className="flex items-center justify-between pt-1">
								<button
									disabled={busy || !body.trim() || !subject.trim()}
									type="button"
									className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
									onClick={() =>
										void request('/api/admin/leads/email', {
											leadId: lead.id,
											toEmail: lead.email,
											subject,
											content: body,
											commandId: commandId(),
										})
									}
								>
									{busy ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<Send className="h-3.5 w-3.5" />
									)}
									{busy ? 'Sending…' : 'Send via Outbox'}
								</button>
								<p className="text-[11px] text-slate-400">
									Durable queue delivery
								</p>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
							<Mail className="mb-1 h-6 w-6 text-slate-300" />
							No email recorded for this inquiry.
						</div>
					)}
				</div>
			)}
		</section>
	)
}
