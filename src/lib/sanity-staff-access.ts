import { randomUUID } from 'node:crypto'
import { adminUsersDb, d1Query, type D1AdminUser } from './d1'

/** Called only after authenticating a human member of the configured Sanity project. */
export async function resolveSanityStaff(identity: {
	userId: string
	projectId: string
	email: string | null
}): Promise<D1AdminUser | null> {
	if (!identity.email) return null
	const email = identity.email.toLowerCase().trim()
	const now = new Date().toISOString()
	// Preserve the role explicitly assigned in Admin. Never overwrite another identity.
	const linked = await d1Query<D1AdminUser>(
		`UPDATE admin_users SET sanity_user_id = ?, updated_at = ?
		 WHERE email = ? AND status = 'active' AND sanity_user_id IS NULL
		 AND NOT EXISTS (SELECT 1 FROM admin_users WHERE sanity_user_id = ?)
		 RETURNING *`,
		[identity.userId, now, email, identity.userId],
	)
	if (linked.results?.[0]) return linked.results[0]
	// Existing disabled/conflicting email records block provisioning. The unique
	// indexes and conflict guard also handle simultaneous first-login requests.
	const created = await d1Query<D1AdminUser>(
		`INSERT INTO admin_users
		 (id, email, password_hash, full_name, role, status, sanity_user_id, created_at, updated_at)
		 SELECT ?, ?, ?, ?, 'sales', 'active', ?, ?, ?
		 WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = ? OR sanity_user_id = ?)
		 ON CONFLICT DO NOTHING RETURNING *`,
		[`user_${randomUUID()}`, email, `sanity-only:${randomUUID()}`, email,
		 identity.userId, now, now, email, identity.userId],
	)
	return created.results?.[0] || adminUsersDb.getBySanityId(identity.userId)
}
