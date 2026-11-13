import { getAdminSession } from '@/lib/admin-auth'
import { adminUsersDb } from '@/lib/d1'
import AdminLoginForm from './admin-login-form'
import LeadWorkspaceClient from './lead-workspace-client'
import { getAdminAuthMode } from '@/lib/admin-auth-mode'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage({ searchParams }: {
	searchParams: Promise<{ login?: string }>
}) {
	const authMode = getAdminAuthMode()
	const session = await getAdminSession()
	const brandTitle = process.env.NEXT_PUBLIC_SITE_NAME || 'DeanFlow'

	if (!session) {
		return (
			<AdminLoginForm
				brandName={brandTitle}
				authMode={authMode}
				loginExpired={(await searchParams).login === 'expired'}
			/>
		)
	}

	const staff = ['superadmin', 'admin'].includes(session.role)
		? await adminUsersDb.list()
		: []
	return (
		<LeadWorkspaceClient
			user={session}
			initialStaff={staff.map(({ password_hash, ...user }) => user)}
			brandName={brandTitle}
			authMode={authMode}
		/>
	)
}
