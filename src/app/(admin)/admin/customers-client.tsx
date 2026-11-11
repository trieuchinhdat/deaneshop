'use client'

import { useEffect, useState } from 'react'
import type {
	CustomerInteraction,
	CustomerRecord,
} from '@/lib/customer-directory'

const control =
	'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-40'
const date = (value: string) => {
	const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:/.test(value)
		? value.replace(' ', 'T') + 'Z'
		: value
	return Number.isFinite(Date.parse(normalized))
		? new Date(normalized).toLocaleString('en-GB')
		: 'Not recorded'
}
export default function CustomersClient() {
	const [search, setSearch] = useState(''),
		[page, setPage] = useState(1)
	const [key, setKey] = useState<string | null>(null)
	const [items, setItems] = useState<CustomerRecord[]>([]),
		[events, setEvents] = useState<CustomerInteraction[]>([])
	const [customer, setCustomer] = useState<CustomerRecord | null>(null),
		[total, setTotal] = useState(0)
	const [busy, setBusy] = useState(true),
		[error, setError] = useState(''),
		[refresh, setRefresh] = useState(0)
	useEffect(() => {
		const restore = () => {
			setKey(new URLSearchParams(location.search).get('customer'))
			setPage(1)
		}
		restore()
		window.addEventListener('popstate', restore)
		return () => window.removeEventListener('popstate', restore)
	}, [])
	useEffect(() => {
		const controller = new AbortController()
		setBusy(true)
		setError('')
		setCustomer(null)
		const timer = setTimeout(async () => {
			try {
				const params = new URLSearchParams({ page: String(page), search })
				if (key) params.set('customer', key)
				const r = await fetch(`/api/admin/customer-directory?${params}`, {
					signal: controller.signal,
				})
				const d = await r.json()
				if (!r.ok) throw new Error(d.error)
				if (key) {
					setCustomer(d.customer)
					setEvents(d.items)
					setTotal(d.customer.interactions)
				} else {
					setItems(d.items)
					setTotal(d.total)
				}
			} catch (e) {
				if (!controller.signal.aborted)
					setError(e instanceof Error ? e.message : 'Unable to load customers')
			} finally {
				if (!controller.signal.aborted) setBusy(false)
			}
		}, 200)
		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [key, search, page, refresh])
	function select(value: string | null) {
		setKey(value)
		setPage(1)
		const url = new URL(location.href)
		value
			? url.searchParams.set('customer', value)
			: url.searchParams.delete('customer')
		history.pushState({}, '', url)
	}
	return (
		<section className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Customers</h1>
					<p className="mt-1 text-sm text-slate-500">
						Contacts from inquiries, newsletters, popups, blog comments and
						product reviews.
					</p>
				</div>
				<button className={control} onClick={() => setRefresh((n) => n + 1)}>
					Refresh
				</button>
			</div>
			<p className="text-xs text-slate-500">
				Grouped by matching email, not verified identity. Records without email
				stay separate. Only records within your access are shown.
			</p>
			{key ? (
				<button className={control} onClick={() => select(null)}>
					← All customers
				</button>
			) : (
				<label className="block">
					<span className="sr-only">Search customers</span>
					<input
						className={`${control} w-full max-w-lg`}
						placeholder="Search name, email, phone or company"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
					/>
				</label>
			)}
			{error && (
				<p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-700">
					{error}
				</p>
			)}
			{busy ? (
				<p role="status">Loading customers…</p>
			) : (
				!error &&
				(key && customer ? (
					<>
						<article className="rounded-xl border border-slate-200 bg-white p-5">
							<h2 className="text-xl font-semibold">
								{customer.name || 'Customer'}
							</h2>
							<dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
								{[
									['Email', customer.email],
									['Phone', customer.phone],
									['Company', customer.company],
									['Country', customer.country],
									['Sources', customer.sources],
									['First seen', date(customer.first_seen)],
									['Last activity', date(customer.last_seen)],
									['Interactions', String(customer.interactions)],
								].map(([label, value]) => (
									<div key={label}>
										<dt className="text-slate-500">{label}</dt>
										<dd className="break-words">{value || 'Not provided'}</dd>
									</div>
								))}
							</dl>
							<p className="mt-4 text-xs text-slate-500">
								Contact fields show the latest non-empty submitted values.
								Review each interaction for its original information.
							</p>
						</article>
						<h2 className="font-semibold">Customer timeline</h2>
						<ol className="space-y-3">
							{events.map((e) => (
								<li
									key={`${e.kind}-${e.id}`}
									className="rounded-xl border border-slate-200 bg-white p-5"
								>
									<div className="flex flex-wrap justify-between gap-2">
										<strong className="text-sm">
											{e.source.replaceAll('_', ' ')}
										</strong>
										<time className="text-xs text-slate-500">
											{date(e.created_at)}
										</time>
									</div>
									<p className="mt-2 text-xs text-slate-500">
										{e.name} · {e.email || e.phone || 'No contact'} · {e.status}
									</p>
									<p className="mt-3 text-sm break-words whitespace-pre-wrap">
										{e.content || 'No message provided.'}
									</p>
									{e.kind === 'lead' && (
										<a
											className="mt-3 inline-block text-sm underline"
											href={`/admin?view=leads&lead=${encodeURIComponent(e.id)}`}
										>
											Open inquiry & website activity
										</a>
									)}
								</li>
							))}
						</ol>
					</>
				) : (
					<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
						<table className="w-full text-left text-sm">
							<thead className="bg-slate-50">
								<tr>
									{[
										'Customer',
										'Contact',
										'Sources',
										'Interactions',
										'Last activity',
									].map((h) => (
										<th key={h} className="p-4">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{items.map((c) => (
									<tr
										key={c.customer_key}
										className="border-t border-slate-100"
									>
										<td className="p-4">
											<button
												onClick={() => select(c.customer_key)}
												className="font-semibold underline underline-offset-4"
											>
												{c.name || 'Customer'}
											</button>
											<p className="text-xs text-slate-500">{c.company}</p>
										</td>
										<td className="p-4">
											{c.email || c.phone || 'Not provided'}
										</td>
										<td className="p-4">{c.sources.replaceAll('_', ' ')}</td>
										<td className="p-4">{c.interactions}</td>
										<td className="p-4">{date(c.last_seen)}</td>
									</tr>
								))}
							</tbody>
						</table>
						{!items.length && (
							<p className="p-5 text-slate-500">No customers found.</p>
						)}
					</div>
				))
			)}
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-slate-500">
					{total} {key ? 'interactions' : 'customers'} · Page {page}
				</p>
				<div className="flex gap-2">
					<button
						className={control}
						disabled={busy || page === 1}
						onClick={() => setPage((n) => n - 1)}
					>
						Previous
					</button>
					<button
						className={control}
						disabled={busy || page * 25 >= total}
						onClick={() => setPage((n) => n + 1)}
					>
						Next
					</button>
				</div>
			</div>
		</section>
	)
}
