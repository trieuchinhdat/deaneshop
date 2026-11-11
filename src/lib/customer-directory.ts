import type { AdminSessionUser } from './admin-auth'

export interface CustomerRecord {
	customer_key: string
	name: string
	email: string | null
	phone: string | null
	company: string | null
	country: string | null
	sources: string
	interactions: number
	first_seen: string
	last_seen: string
}
export interface CustomerInteraction {
	customer_key: string
	id: string
	kind: string
	source: string
	name: string
	email: string | null
	phone: string | null
	company: string | null
	country: string | null
	content: string | null
	created_at: string
	status: string | null
}
// Scope records BEFORE grouping. Shared email never expands a representative's access.
export function customerDirectoryScope(
	session: Pick<AdminSessionUser, 'role' | 'id'>,
) {
	const scoped = ['sales', 'cskh'].includes(session.role)
	const key = (email: string, fallback: string) =>
		`CASE WHEN NULLIF(TRIM(${email}),'') IS NOT NULL THEN 'email:' || LOWER(TRIM(${email})) ELSE ${fallback} END`
	const leads = `SELECT ${key('email', "'lead:' || id")} AS customer_key, id, 'lead' AS kind,
 COALESCE(NULLIF(source,''),'inquiry') AS source, name, email, phone, company_name AS company, country,
 message AS content, created_at, status FROM leads ${scoped ? 'WHERE assigned_to = ?' : ''}`
	const other = scoped
		? ''
		: ` UNION ALL SELECT ${key('author_email', "'comment:' || id")}, id, 'comment', 'blog_comment', author_name, author_email, NULL, NULL, NULL, content, created_at, CASE WHEN is_approved=1 THEN 'approved' ELSE 'pending' END FROM comments WHERE COALESCE(is_author_reply,0)=0
 UNION ALL SELECT ${key('author_email', "'review:' || id")}, id, 'review', 'product_review', author, author_email, NULL, NULL, NULL, comment, created_at, CASE WHEN is_approved=1 THEN 'approved' ELSE 'pending' END FROM reviews`
	return {
		cte: `WITH interactions AS (${leads}${other})`,
		params: scoped ? [session.id] : [],
	}
}
