'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'

export default function AdminLoginForm({
	brandName = 'DeanFlow',
	logoUrl,
}: {
	brandName?: string
	logoUrl?: string
}) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [pending, setPending] = useState(false)
	const [error, setError] = useState('')

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50/70 p-4 sm:p-6 text-slate-900 font-sans">
			<div className="w-full max-w-md">
				{/* Header branding */}
				<div className="mb-6 text-center">
					{logoUrl ? (
						<img
							src={logoUrl}
							alt={brandName}
							className="mx-auto h-11 w-auto object-contain mb-3"
						/>
					) : (
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-4 ring-slate-100">
							<ShieldCheck className="h-6 w-6 text-emerald-400" />
						</div>
					)}
					<h1 className="text-xl font-bold tracking-tight text-slate-900">
						{brandName} Workspace
					</h1>
					<p className="mt-1 text-xs text-slate-500">
						Authorized personnel & lead operations console
					</p>
				</div>

				{/* Card */}
				<form
					className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xs"
					onSubmit={async (event) => {
						event.preventDefault()
						setPending(true)
						setError('')
						try {
							const response = await fetch('/api/admin/auth/login', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ email, password }),
							})
							const result = await response.json()
							if (!response.ok || !result.success)
								throw new Error(result.error || 'Sign-in failed')
							window.location.assign('/admin')
						} catch (error) {
							setError(
								error instanceof Error
									? error.message
									: 'Sign-in unavailable. Check credentials.',
							)
							setPending(false)
						}
					}}
				>
					<div>
						<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
							Work Email
						</label>
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
								<Mail className="h-4 w-4" />
							</div>
							<input
								required
								type="email"
								autoComplete="username"
								placeholder="name@company.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-colors shadow-2xs"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
							Password
						</label>
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
								<Lock className="h-4 w-4" />
							</div>
							<input
								required
								type="password"
								autoComplete="current-password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-colors shadow-2xs"
							/>
						</div>
					</div>

					{error && (
						<div
							role="alert"
							className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800"
						>
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={pending}
						className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 transition-colors shadow-xs"
					>
						{pending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Authenticating…
							</>
						) : (
							<>
								Sign in to Workspace
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</button>

					<div className="pt-2 text-center">
						<span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
							<ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
							Encrypted Session · Role-Based Staff Access
						</span>
					</div>
				</form>
			</div>
		</main>
	)
}
