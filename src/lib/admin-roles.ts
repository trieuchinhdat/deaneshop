export type AdminRole = 'superadmin' | 'admin' | 'sales' | 'marketing'

export type AdminTab =
	| 'overview'
	| 'leads'
	| 'orders'
	| 'customers'
	| 'reviews'
	| 'comments'
	| 'staff'

export const ROLE_PERMITTED_TABS: Record<AdminRole, AdminTab[]> = {
	superadmin: ['overview', 'leads', 'orders', 'customers', 'reviews', 'comments', 'staff'],
	admin: ['overview', 'leads', 'orders', 'customers', 'reviews', 'comments', 'staff'],
	sales: ['overview', 'leads', 'customers'],
	marketing: ['overview', 'comments', 'reviews', 'leads'],
}

export const ROLE_DEFAULT_TAB: Record<AdminRole, AdminTab> = {
	superadmin: 'overview',
	admin: 'overview',
	sales: 'leads',
	marketing: 'overview',
}

export function canAccessTab(role: AdminRole | undefined | null, tab: AdminTab): boolean {
	if (!role) return false
	const allowed = ROLE_PERMITTED_TABS[role]
	return Array.isArray(allowed) && allowed.includes(tab)
}

export function getDefaultTabForRole(role?: AdminRole | null): AdminTab {
	if (!role || !ROLE_DEFAULT_TAB[role]) return 'overview'
	return ROLE_DEFAULT_TAB[role]
}
