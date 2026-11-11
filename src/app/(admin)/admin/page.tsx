import { getAdminSession } from '@/lib/admin-auth'
import { adminUsersDb } from '@/lib/d1'
import { writeClient } from '@/sanity/lib/write-client'
import AdminLoginForm from './admin-login-form'
import LeadWorkspaceClient from './lead-workspace-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
	const [session, siteInfo] = await Promise.all([
		getAdminSession(),
		writeClient
			.fetch(
				`*[_type == "site"][0]{ "logoUrl": logo.image.default.asset->url, "logoLightUrl": logo.image.light.asset->url, "logoDarkUrl": logo.image.dark.asset->url, siteName, title }`,
			)
			.catch(() => null),
	])

	const brandLogo = siteInfo?.logoDarkUrl || siteInfo?.logoUrl || siteInfo?.logoLightUrl || undefined
	const brandTitle = siteInfo?.siteName || siteInfo?.title || 'DeanFlow'

	if (!session) {
		return (
			<AdminLoginForm
				logoUrl={brandLogo}
				brandName={brandTitle}
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
			brandLogoUrl={brandLogo}
			brandName={brandTitle}
		/>
	)
}
