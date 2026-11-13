'use client'

import { useMemo, useState } from 'react'
import {
	FiAlertCircle,
	FiBriefcase,
	FiCheck,
	FiCheckCircle,
	FiEdit2,
	FiKey,
	FiLock,
	FiMail,
	FiPlus,
	FiRefreshCw,
	FiSearch,
	FiShield,
	FiSliders,
	FiTrash2,
	FiTrendingUp,
	FiUnlock,
	FiUser,
	FiUserCheck,
	FiUserPlus,
	FiUsers,
	FiX,
} from 'react-icons/fi'
import { AdminUserRole, D1AdminUser } from '@/lib/d1'

interface StaffManagementProps {
	authMode?: 'password' | 'sanity'
	initialStaff: D1AdminUser[]
	currentStaff?: any
}

interface RoleConfig {
	label: string
	badge: string
	IconComponent: React.ComponentType<{ className?: string }>
	desc: string
}

const ROLE_DEFINITIONS: Record<AdminUserRole, RoleConfig> = {
	superadmin: {
		label: 'Super Admin',
		badge: 'bg-rose-50 text-rose-700 border-rose-200',
		IconComponent: FiShield,
		desc: 'Full administrative access: User governance, system configuration, and data purging.',
	},
	admin: {
		label: 'Admin',
		badge: 'bg-purple-50 text-purple-700 border-purple-200',
		IconComponent: FiSliders,
		desc: 'Operational management: Team assignment, password resets, B2B pipeline controls, and customer directory.',
	},
	sales: {
		label: 'Sale',
		badge: 'bg-blue-50 text-blue-700 border-blue-200',
		IconComponent: FiBriefcase,
		desc: 'Lead operations: Scoped pipeline, deal qualification, email outreach, and scheduled follow-ups.',
	},
	marketing: {
		label: 'Marketing',
		badge: 'bg-amber-50 text-amber-700 border-amber-200',
		IconComponent: FiTrendingUp,
		desc: 'Growth analytics: Marketing attribution, source quality insights, and read-only lead visibility.',
	},
}

export default function StaffManagement({ initialStaff = [], currentStaff, authMode = 'password' }: StaffManagementProps) {
	const isSuperAdmin = currentStaff?.role === 'superadmin'
	const isAdminOrSuperAdmin = currentStaff?.role === 'superadmin' || currentStaff?.role === 'admin'

	const [staffList, setStaffList] = useState<D1AdminUser[]>(initialStaff)
	const [searchQuery, setSearchQuery] = useState('')
	const [roleFilter, setRoleFilter] = useState<string>('all')

	// Modals
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [editingUser, setEditingUser] = useState<D1AdminUser | null>(null)
	const [editPassword, setEditPassword] = useState('')
	const [editError, setEditError] = useState<string | null>(null)
	const [isUpdating, setIsUpdating] = useState(false)
	const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

	// Create Form State
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [selectedRole, setSelectedRole] = useState<AdminUserRole>('sales')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	// Filtered Staff
	const filteredStaff = useMemo(() => {
		return staffList.filter((user) => {
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim()
				const matchName = user.full_name.toLowerCase().includes(q)
				const matchEmail = user.email.toLowerCase().includes(q)
				if (!matchName && !matchEmail) return false
			}
			if (roleFilter !== 'all' && user.role !== roleFilter) {
				return false
			}
			return true
		})
	}, [staffList, searchQuery, roleFilter])

	// KPI Metrics
	const metrics = useMemo(() => {
		const total = staffList.length
		const salesCount = staffList.filter((u) => u.role === 'sales').length
		const marketingCount = staffList.filter((u) => u.role === 'marketing').length
		const activeCount = staffList.filter((u) => u.status === 'active').length
		return { total, salesCount, marketingCount, activeCount }
	}, [staffList])

	if (!isAdminOrSuperAdmin) {
		return (
			<div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center my-6">
				<FiShield className="mx-auto h-12 w-12 text-amber-600 mb-3" />
				<h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
				<p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
					Only Super Administrators and Administrators have permission to manage team members and role configurations.
				</p>
			</div>
		)
	}

	const openEditModal = (user: D1AdminUser) => {
		setEditingUser({ ...user })
		setEditPassword('')
		setEditError(null)
	}

	// Create User Handler
	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault()
		setFormError(null)
		setIsSubmitting(true)

		try {
			const res = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					full_name: fullName.trim(),
					email: email.trim(),
					...(authMode === 'password' ? { password } : {}),
					role: selectedRole,
					status: 'active',
				}),
			})
			const result = await res.json()
			if (!res.ok || !result.success) {
				throw new Error(result.error || 'Failed to create team member.')
			}

			setStaffList((prev) => [result.user, ...prev])
			setIsCreateModalOpen(false)
			setFullName('')
			setEmail('')
			setPassword('')
			setActionFeedback({ type: 'success', message: `Created account for ${result.user.email}.` })
		} catch (err: any) {
			setFormError(err.message || 'Server error occurred.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Update User Handler
	const handleUpdateUser = async (
		id: string,
		patch: Partial<D1AdminUser> & { password?: string },
	): Promise<{ ok: boolean; error?: string }> => {
		setActionFeedback(null)
		try {
			const res = await fetch('/api/admin/users', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, ...patch }),
			})
			const result = await res.json().catch(() => ({}))
			if (!res.ok || !result.success) {
				const message = result.error || 'Failed to update team member.'
				setActionFeedback({ type: 'error', message })
				return { ok: false, error: message }
			}

			const { password: _omittedPassword, ...safePatch } = patch
			setStaffList((prev) =>
				prev.map((u) => (u.id === id ? { ...u, ...safePatch, updated_at: new Date().toISOString() } : u)),
			)
			if (editingUser?.id === id) {
				setEditingUser((prev) => (prev ? { ...prev, ...safePatch } : null))
			}
			return { ok: true }
		} catch (err: any) {
			const message = err?.message || 'Update staff failed.'
			setActionFeedback({ type: 'error', message })
			return { ok: false, error: message }
		}
	}

	const handleSaveEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingUser) return
		setEditError(null)

		const cleanName = editingUser.full_name.trim()
		if (!cleanName) {
			setEditError('Full name cannot be empty.')
			return
		}
		if (authMode === 'password' && editPassword) {
			const passwordBytes = new TextEncoder().encode(editPassword).length
			if (editPassword.length < 12 || passwordBytes > 72) {
				setEditError('New password must be at least 12 characters and at most 72 UTF-8 bytes.')
				return
			}
		}

		setIsUpdating(true)
		try {
			const didResetPassword = authMode === 'password' && Boolean(editPassword)
			const res = await handleUpdateUser(editingUser.id, {
				full_name: cleanName,
				role: editingUser.role,
				status: editingUser.status,
				...(didResetPassword ? { password: editPassword } : {}),
			})
			if (!res.ok) {
				setEditError(res.error || 'Failed to update team member.')
				return
			}
			setEditingUser(null)
			setEditPassword('')
			setActionFeedback({
				type: 'success',
				message: didResetPassword
					? `Updated ${cleanName} and reset their password. Existing sessions were revoked.`
					: `Updated ${cleanName}.`,
			})
		} finally {
			setIsUpdating(false)
		}
	}

	// Delete User Handler
	const handleDeleteUser = async (id: string, name: string) => {
		if (!confirm(`Are you sure you want to remove team member "${name}"?`)) return
		try {
			const res = await fetch(`/api/admin/users?id=${id}`, {
				method: 'DELETE',
			})
			const result = await res.json()
			if (result.success) {
				setStaffList((prev) => prev.filter((u) => u.id !== id))
			} else {
				alert(result.error || 'Could not delete team member.')
			}
		} catch (err) {
			console.error('Delete staff failed:', err)
		}
	}

	return (
		<div className="space-y-6">
			{actionFeedback && (
				<div
					role={actionFeedback.type === 'error' ? 'alert' : 'status'}
					className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${
						actionFeedback.type === 'error'
							? 'border-rose-200 bg-rose-50 text-rose-700'
							: 'border-emerald-200 bg-emerald-50 text-emerald-700'
					}`}
				>
					<span className="flex items-center gap-2">
						{actionFeedback.type === 'error' ? (
							<FiAlertCircle className="h-4 w-4 shrink-0" />
						) : (
							<FiCheckCircle className="h-4 w-4 shrink-0" />
						)}
						{actionFeedback.message}
					</span>
					<button
						type="button"
						onClick={() => setActionFeedback(null)}
						className="text-current/70 hover:text-current cursor-pointer"
						aria-label="Dismiss notification"
					>
						<FiX className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Top KPI Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
							Team Members
						</span>
						<FiUsers className="h-4 w-4 text-slate-400" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-slate-900">{metrics.total}</span>
						<span className="text-[11px] text-slate-500 font-bold">staff</span>
					</div>
				</div>

				<div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1">
							<FiBriefcase className="h-3.5 w-3.5" />
							Sale
						</span>
						<FiUserCheck className="h-4 w-4 text-blue-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-blue-800">{metrics.salesCount}</span>
						<span className="text-[11px] text-blue-600 font-bold">Active in CRM</span>
					</div>
				</div>

				<div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
							<FiTrendingUp className="h-3.5 w-3.5" />
							Marketing
						</span>
						<FiTrendingUp className="h-4 w-4 text-amber-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-amber-800">{metrics.marketingCount}</span>
						<span className="text-[11px] text-amber-600 font-bold">Growth Analytics</span>
					</div>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
							<FiCheckCircle className="h-3.5 w-3.5" />
							Active Status
						</span>
						<FiCheckCircle className="h-4 w-4 text-emerald-600" />
					</div>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-2xl font-black text-slate-900">{metrics.activeCount}</span>
						<span className="text-[11px] text-emerald-600 font-bold">Active</span>
					</div>
				</div>
			</div>

			{/* RBAC Role Matrix Guide */}
			<div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-2xs space-y-3">
				<h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
					<FiShield className="h-4 w-4 text-indigo-600" />
					Role-Based Access Control (RBAC Matrix)
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
					{(['superadmin', 'admin', 'sales', 'marketing'] as AdminUserRole[]).map((r) => {
						const def = ROLE_DEFINITIONS[r]
						const Icon = def.IconComponent
						return (
							<div key={r} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
								<div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
									<Icon className="h-3.5 w-3.5 text-indigo-600" />
									<span>{def.label}</span>
								</div>
								<p className="text-[11px] text-slate-500 leading-snug">{def.desc}</p>
							</div>
						)
					})}
				</div>
			</div>

			{/* Filter Toolbar & Add Button */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2 flex-1 max-w-md">
					<div className="relative flex-1">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
							<FiSearch className="h-4 w-4" />
						</div>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by name or email..."
							className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-hidden shadow-2xs"
						/>
					</div>

					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs cursor-pointer focus:outline-hidden"
					>
						<option value="all">All Roles</option>
						<option value="superadmin">Super Admin</option>
						<option value="admin">Admin</option>
						<option value="sales">Sale</option>
						<option value="marketing">Marketing</option>
					</select>
				</div>

				<button
					type="button"
					onClick={() => {
						setFormError(null)
						setIsCreateModalOpen(true)
					}}
					className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
				>
					<FiUserPlus className="h-4 w-4" />
					Add Team Member
				</button>
			</div>

			{/* Staff Table */}
			<div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
							<tr>
								<th className="py-3 px-4">Team Member</th>
								<th className="py-3 px-4">Role</th>
								<th className="py-3 px-4">Status</th>
								<th className="py-3 px-4">Assigned Leads</th>
								<th className="py-3 px-4">Last Login</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-100">
							{filteredStaff.map((user) => {
								const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.sales
								const Icon = roleDef.IconComponent
								const isActive = user.status === 'active'

								return (
									<tr key={user.id} className="hover:bg-slate-50/80 transition">
										{/* User Info */}
										<td className="py-3 px-4">
											<div className="flex items-center gap-3">
												{user.avatar_url ? (
													<img
														src={user.avatar_url}
														alt={user.full_name}
														className="w-9 h-9 rounded-xl object-cover border border-slate-200"
													/>
												) : (
													<div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
														{user.full_name.charAt(0)}
													</div>
												)}
												<div>
													<div className="font-bold text-slate-900 flex items-center gap-1.5">
														{user.full_name}
														{user.id === currentStaff?.id && (
															<span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-bold">
																You
															</span>
														)}
													</div>
													<div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
												</div>
											</div>
										</td>

										{/* Role */}
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleDef.badge}`}
											>
												<Icon className="h-3 w-3" />
												<span>{roleDef.label}</span>
											</span>
										</td>

										{/* Status */}
										<td className="py-3 px-4">
											<span
												className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
													isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
												}`}
											>
												<span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
												{isActive ? 'Active' : 'Deactivated'}
											</span>
										</td>

										{/* Assigned Leads */}
										<td className="py-3 px-4">
											<span className="font-mono font-bold text-slate-800 text-xs">
												{user.assigned_leads_count || 0} leads
											</span>
										</td>

										{/* Last Login */}
										<td className="py-3 px-4">
											<span className="text-[11px] text-slate-400 font-mono">
												{user.last_login_at
													? new Date(user.last_login_at).toLocaleString('en-US', {
															month: 'short',
															day: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
														})
													: 'Never'}
											</span>
										</td>

										{/* Actions */}
										<td className="py-3 px-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<button
													type="button"
													disabled={user.role === 'superadmin' && !isSuperAdmin}
													onClick={() =>
														handleUpdateUser(user.id, {
															status: isActive ? 'inactive' : 'active',
														})
													}
													className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
														isActive
															? 'border-slate-200 text-slate-600 hover:bg-slate-100'
															: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
													}`}
													title={
														user.role === 'superadmin' && !isSuperAdmin
															? 'Only Super Admin can deactivate a Super Admin'
															: isActive
																? 'Deactivate Account'
																: 'Reactivate Account'
													}
												>
													{isActive ? <FiLock className="h-3.5 w-3.5" /> : <FiUnlock className="h-3.5 w-3.5" />}
												</button>

												<button
													type="button"
													disabled={user.role === 'superadmin' && !isSuperAdmin}
													onClick={() => openEditModal(user)}
													className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
													title={
														user.role === 'superadmin' && !isSuperAdmin
															? 'Only Super Admin can edit a Super Admin'
															: 'Edit Role, Status & Reset Password'
													}
												>
													<FiEdit2 className="h-3.5 w-3.5" />
												</button>

												{isSuperAdmin && user.id !== currentStaff?.id && user.id !== 'admin-root' && (
													<button
														type="button"
														onClick={() => handleDeleteUser(user.id, user.full_name)}
														className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
														title="Delete User (Superadmin Only)"
													>
														<FiTrash2 className="h-3.5 w-3.5" />
													</button>
												)}
											</div>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modal: Add Team Member */}
			{isCreateModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between pb-3 border-b border-slate-100">
							<h3 className="text-base font-black text-slate-900 flex items-center gap-2">
								<FiUserPlus className="h-5 w-5 text-indigo-600" />
								Add New Team Member
							</h3>
							<button
								type="button"
								onClick={() => setIsCreateModalOpen(false)}
								className="text-slate-400 hover:text-slate-800 cursor-pointer"
							>
								<FiX className="h-5 w-5" />
							</button>
						</div>

						{formError && (
							<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
								<FiAlertCircle className="h-4 w-4 shrink-0" />
								{formError}
							</div>
						)}

						<form onSubmit={handleCreateUser} className="space-y-3.5">
							<div>
								<label className="text-xs font-bold text-slate-700 block">Full Name{authMode !== 'password' ? ' (optional)' : ''}:</label>
								<input
									type="text"
									required={authMode === 'password'}
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									placeholder="e.g. Alexander Nguyen"
									className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-hidden"
								/>
							</div>

							<div>
								<label className="text-xs font-bold text-slate-700 block">Work Email:</label>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="alex.nguyen@deanflow.com"
									className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-hidden"
								/>
							</div>

							{authMode === 'password' && <div>
								<label className="text-xs font-bold text-slate-700 block">Initial Password:</label>
								<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12} placeholder="At least 12 characters" className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl" />
							</div>}
							{authMode === 'sanity' && <p className="text-xs text-slate-600">The member signs in with their Sanity account. No invitation link or Account ID is needed.</p>}

							<div>
								<label className="text-xs font-bold text-slate-700 block">Assign Role:</label>
								<select
									value={selectedRole}
									onChange={(e) => setSelectedRole(e.target.value as any)}
									className="w-full mt-1 px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:border-slate-900 focus:outline-hidden cursor-pointer"
								>
									<option value="sales">Sale (Lead & Pipeline Ops)</option>
									<option value="marketing">Marketing (Attribution & Analytics)</option>
									<option value="admin">Admin (Operations & Team Governance)</option>
									{isSuperAdmin && (
										<option value="superadmin">Super Admin (Full System Privileges)</option>
									)}
								</select>
							</div>


							<div className="pt-2 flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsCreateModalOpen(false)}
									className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
								>
									{isSubmitting ? <FiRefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FiCheck className="h-3.5 w-3.5" />}
									Create Account
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal: Edit Member Role & Reset Password */}
			{editingUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
					<div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between pb-3 border-b border-slate-100">
							<h3 className="text-base font-black text-slate-900 flex items-center gap-2">
								<FiEdit2 className="h-4 w-4 text-indigo-600" />
								Edit Member: {editingUser.full_name}
							</h3>
							<button
								type="button"
								onClick={() => {
									setEditingUser(null)
									setEditPassword('')
									setEditError(null)
								}}
								className="text-slate-400 hover:text-slate-800 cursor-pointer"
							>
								<FiX className="h-5 w-5" />
							</button>
						</div>

						{editError && (
							<div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
								<FiAlertCircle className="h-4 w-4 shrink-0" />
								{editError}
							</div>
						)}

						<form onSubmit={handleSaveEdit} className="space-y-3.5">
							<div>
								<label className="text-xs font-bold text-slate-700 block">Full Name:</label>
								<input
									type="text"
									required
									value={editingUser.full_name}
									onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
									className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-hidden"
								/>
							</div>

							<div>
								<label className="text-xs font-bold text-slate-700 block">Assigned Role:</label>
								<select
									value={editingUser.role}
									onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
									className="w-full mt-1 px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:border-slate-900 focus:outline-hidden cursor-pointer"
								>
									<option value="sales">Sale (Lead & Pipeline Ops)</option>
									<option value="marketing">Marketing (Attribution & Analytics)</option>
									<option value="admin">Admin (Operations & Team Governance)</option>
									{isSuperAdmin && (
										<option value="superadmin">Super Admin (Full System Privileges)</option>
									)}
								</select>
							</div>

							<div>
								<label className="text-xs font-bold text-slate-700 block">Account Status:</label>
								<select
									value={editingUser.status}
									onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
									className="w-full mt-1 px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:border-slate-900 focus:outline-hidden cursor-pointer"
								>
									<option value="active">Active Status</option>
									<option value="inactive">Deactivated (Locked)</option>
								</select>
							</div>

							{authMode === 'password' && (
								<div>
									<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<FiKey className="h-3.5 w-3.5 text-slate-500" />
										Reset Password <span className="font-normal text-slate-400">(optional)</span>
									</label>
									<input
										type="password"
										value={editPassword}
										onChange={(e) => setEditPassword(e.target.value)}
										autoComplete="new-password"
										minLength={12}
										maxLength={72}
										placeholder="Leave blank to keep current password (min 12 chars)"
										className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-hidden"
									/>
									<p className="mt-1 text-[11px] text-slate-500">
										Entering a new password immediately signs out active sessions for this user.
									</p>
								</div>
							)}

							{authMode === 'sanity' && (
								<p className="text-xs text-slate-600">
									{editingUser.sanity_user_id ? 'Sanity account linked.' : 'Account will be linked on first Sanity sign-in.'}
								</p>
							)}
							<div className="pt-2 flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={() => {
										setEditingUser(null)
										setEditPassword('')
										setEditError(null)
									}}
									className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isUpdating}
									className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
								>
									{isUpdating ? <FiRefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FiCheck className="h-3.5 w-3.5" />}
									Save Changes
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
