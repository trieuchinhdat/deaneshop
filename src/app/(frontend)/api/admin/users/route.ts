import { hashPassword, validPassword } from '@/lib/passwords'
import { randomUUID } from 'node:crypto'
import { getAdminAuthMode, validSanityUserId } from '@/lib/admin-auth-mode'
import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { AdminUserRole, PersistenceError, adminUsersDb, d1Query } from '@/lib/d1'

const VALID_ROLES: readonly AdminUserRole[] = ['superadmin', 'admin', 'sales', 'marketing']
const VALID_STATUSES = ['active', 'inactive'] as const

function isLastSuperadminError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false
	const err = error as { message?: unknown; causeMessage?: unknown }
	const msg = `${typeof err.message === 'string' ? err.message : ''} ${typeof err.causeMessage === 'string' ? err.causeMessage : ''}`
	return /last active superadmin/i.test(msg)
}

export async function GET(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}

		const { searchParams } = new URL(req.url)
		const role = searchParams.get('role') || 'all'
		const status = searchParams.get('status') || 'all'
		const search = searchParams.get('search') || ''

		const users = await adminUsersDb.list({ role, status, search })
		const sanitizedUsers = users.map(({ password_hash, ...rest }) => rest)

		return NextResponse.json({
			success: true,
			users: sanitizedUsers,
			total: sanitizedUsers.length,
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/users GET error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Staff database unavailable.' : error?.message || 'Failed to list staff users.' },
			{ status },
		)
	}
}

export async function POST(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { email, password, role = 'sales', avatar_url, status = 'active' } = body
		const externalAuth = getAdminAuthMode() !== 'password'
		const full_name = externalAuth && !body.full_name ? email : body.full_name

		if (
			typeof email !== 'string' ||
			email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
			typeof full_name !== 'string' ||
			!full_name.trim() ||
			(!externalAuth && !validPassword(password))
		) {
			return NextResponse.json(
				{ success: false, error: externalAuth ? 'Provide a valid staff email.' : 'Please provide valid email, full name, and strong password (12–72 chars).' },
				{ status: 400 },
			)
		}

		if (typeof role !== 'string' || !VALID_ROLES.includes(role as AdminUserRole)) {
			return NextResponse.json({ success: false, error: `Invalid staff role: ${String(role)}` }, { status: 400 })
		}
		if (typeof status !== 'string' || !VALID_STATUSES.includes(status as any)) {
			return NextResponse.json({ success: false, error: `Invalid staff status: ${String(status)}` }, { status: 400 })
		}

		if (role === 'superadmin' && session.role !== 'superadmin') {
			return NextResponse.json(
				{ success: false, error: 'Only Super Admin can create Super Admin accounts.' },
				{ status: 403 },
			)
		}

		const existing = await adminUsersDb.getByEmail(email)
		if (existing) {
			return NextResponse.json(
				{ success: false, error: 'This email already exists in the staff directory.' },
				{ status: 400 },
			)
		}

		const newUser = await adminUsersDb.create({
			id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			email: email.toLowerCase().trim(),
			password_hash: externalAuth ? `sanity-only:${randomUUID()}` : await hashPassword(password),
			full_name: full_name.trim(),
			role: role as AdminUserRole,
			avatar_url: typeof avatar_url === 'string' ? avatar_url : null,
			status: status as 'active' | 'inactive',
			assigned_leads_count: 0,
			last_login_at: null,
		})

		const { password_hash, ...sanitizedNewUser } = newUser as any

		return NextResponse.json({
			success: true,
			message: 'Staff user created successfully.',
			user: sanitizedNewUser,
		}, { headers: { 'Cache-Control': 'no-store' } })
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/users POST error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Staff database unavailable.' : error?.message || 'Failed to create staff user.' },
			{ status },
		)
	}
}

export async function PUT(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin', 'admin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const body = await req.json().catch(() => ({}))
		const { id, full_name, email, role, status, avatar_url, password, sanity_user_id } = body

		if (typeof id !== 'string' || !id.trim()) {
			return NextResponse.json({ success: false, error: 'Missing staff user ID to update.' }, { status: 400 })
		}
		const targetId = id.trim()

		if (role !== undefined && (typeof role !== 'string' || !VALID_ROLES.includes(role as AdminUserRole))) {
			return NextResponse.json({ success: false, error: `Invalid staff role: ${String(role)}` }, { status: 400 })
		}
		if (status !== undefined && (typeof status !== 'string' || !VALID_STATUSES.includes(status as any))) {
			return NextResponse.json({ success: false, error: `Invalid staff status: ${String(status)}` }, { status: 400 })
		}

		if (role === 'superadmin' && session.role !== 'superadmin') {
			return NextResponse.json(
				{ success: false, error: 'Only Super Admin can assign the Super Admin role.' },
				{ status: 403 },
			)
		}

		const targetUser = await adminUsersDb.getById(targetId)
		if (!targetUser) {
			return NextResponse.json({ success: false, error: 'Staff user not found.' }, { status: 404 })
		}
		if (targetUser.role === 'superadmin' && session.role !== 'superadmin') {
			return NextResponse.json(
				{ success: false, error: 'Cannot modify a Super Admin account.' },
				{ status: 403 },
			)
		}

		// Prevent accidental self-disable or self-demotion (DF-016)
		if (targetId === session.id) {
			if (status === 'inactive') {
				return NextResponse.json(
					{ success: false, error: 'You cannot deactivate your own active account.' },
					{ status: 409 },
				)
			}
			if (role !== undefined && role !== targetUser.role) {
				return NextResponse.json(
					{ success: false, error: 'You cannot demote or change your own role directly.' },
					{ status: 409 },
				)
			}
		}

		const patch: any = {}
		if (sanity_user_id !== undefined) {
			if (sanity_user_id !== null && !validSanityUserId(sanity_user_id)) return NextResponse.json({ success: false, error: 'Invalid Sanity Account ID.' }, { status: 400 })
			if (targetId === session.id && sanity_user_id !== targetUser.sanity_user_id) return NextResponse.json({ success: false, error: 'Ask another administrator to change your own linked identity.' }, { status: 409 })
			patch.sanity_user_id = sanity_user_id
			if (sanity_user_id) {
				const linked = await adminUsersDb.getBySanityId(sanity_user_id)
				if (linked && linked.id !== targetId) return NextResponse.json({ success: false, error: 'This Sanity identity is already linked.' }, { status: 409 })
			}
		}
		if (full_name !== undefined) {
			if (typeof full_name !== 'string' || !full_name.trim()) {
				return NextResponse.json({ success: false, error: 'Full name cannot be empty.' }, { status: 400 })
			}
			patch.full_name = full_name.trim()
		}
		if (email !== undefined) {
			if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
				return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 })
			}
			patch.email = email.toLowerCase().trim()
		}
		if (role !== undefined) patch.role = role
		if (status !== undefined) patch.status = status
		if (avatar_url !== undefined) patch.avatar_url = avatar_url
		if (password) {
			if (getAdminAuthMode() !== 'password') return NextResponse.json({ success: false, error: 'Passwords are managed by your sign-in provider.' }, { status: 400 })
			if (!validPassword(password)) {
				return NextResponse.json(
					{ success: false, error: 'Password must be 12 characters minimum and 72 UTF-8 bytes maximum' },
					{ status: 400 },
				)
			}
			patch.password_hash = await hashPassword(password)
		}

		const nextRole = patch.role ?? targetUser.role
		const nextStatus = patch.status ?? targetUser.status
		const losingSuperadmin =
			targetUser.role === 'superadmin' &&
			targetUser.status === 'active' &&
			(nextRole !== 'superadmin' || nextStatus !== 'active')

		if (losingSuperadmin) {
			// Atomic SQL guard + DB trigger prevent_last_superadmin_demotion guarantee >= 1 active superadmin
			const sets: string[] = ['updated_at = ?']
			const params: any[] = [new Date().toISOString()]
			if (patch.full_name !== undefined) { sets.push('full_name = ?'); params.push(patch.full_name) }
			if (patch.email !== undefined) { sets.push('email = ?'); params.push(patch.email) }
			if (patch.password_hash !== undefined) { sets.push('password_hash = ?'); params.push(patch.password_hash) }
			if (patch.sanity_user_id !== undefined) { sets.push('sanity_user_id = ?'); params.push(patch.sanity_user_id) }
			if (patch.role !== undefined) { sets.push('role = ?'); params.push(patch.role) }
			if (patch.status !== undefined) { sets.push('status = ?'); params.push(patch.status) }
			if (patch.avatar_url !== undefined) { sets.push('avatar_url = ?'); params.push(patch.avatar_url) }
			params.push(targetId, targetId)

			const res = await d1Query(
				`UPDATE admin_users SET ${sets.join(', ')}
				WHERE id = ?
				  AND (SELECT COUNT(*) FROM admin_users WHERE role = 'superadmin' AND status = 'active' AND id != ?) >= 1`,
				params,
			)
			if ((res.meta?.changes ?? 0) !== 1) {
				return NextResponse.json(
					{ success: false, error: 'Cannot disable or demote the last active superadmin.' },
					{ status: 409 },
				)
			}
		} else {
			const updated = await adminUsersDb.update(targetId, patch)
			if (!updated) {
				return NextResponse.json({ success: false, error: 'Staff user not found.' }, { status: 404 })
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Staff user updated successfully.',
		})
	} catch (error: any) {
		if (isLastSuperadminError(error)) {
			return NextResponse.json(
				{ success: false, error: 'Cannot disable or demote the last active superadmin.' },
				{ status: 409 },
			)
		}
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/users PUT error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Staff database unavailable.' : error?.message || 'Failed to update staff user.' },
			{ status },
		)
	}
}

export async function DELETE(req: Request) {
	try {
		const auth = await requireAdminSession(['superadmin'])
		if (!auth.ok) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
		}
		const session = auth.session

		const { searchParams } = new URL(req.url)
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json({ success: false, error: 'Missing staff user ID to delete.' }, { status: 400 })
		}

		if (id === session.id || id === 'admin-root') {
			return NextResponse.json(
				{ success: false, error: 'Cannot delete your own account or the Root Admin account.' },
				{ status: 400 },
			)
		}

		const target = await adminUsersDb.getById(id)
		if (!target) {
			return NextResponse.json({ success: false, error: 'Staff user not found.' }, { status: 404 })
		}

		if (target.role === 'superadmin' && target.status === 'active') {
			const res = await d1Query(
				`DELETE FROM admin_users WHERE id = ? AND (SELECT COUNT(*) FROM admin_users WHERE role = 'superadmin' AND status = 'active' AND id != ?) >= 1`,
				[id, id],
			)
			if ((res.meta?.changes ?? 0) !== 1) {
				return NextResponse.json(
					{ success: false, error: 'Cannot delete the last active superadmin.' },
					{ status: 409 },
				)
			}
		} else {
			const deleted = await adminUsersDb.delete(id)
			if (!deleted) {
				return NextResponse.json({ success: false, error: 'Staff user not found.' }, { status: 404 })
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Staff user deleted successfully.',
		})
	} catch (error: any) {
		if (isLastSuperadminError(error)) {
			return NextResponse.json(
				{ success: false, error: 'Cannot delete the last active superadmin.' },
				{ status: 409 },
			)
		}
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API /api/admin/users DELETE error:', error)
		return NextResponse.json(
			{ success: false, error: status === 503 ? 'Staff database unavailable.' : error?.message || 'Failed to delete staff user.' },
			{ status },
		)
	}
}
