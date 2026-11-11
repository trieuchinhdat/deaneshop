import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
	try {
		const session = await getAdminSession()

		if (!session) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized. Admin session required.' },
				{ status: 401 },
			)
		}

		return NextResponse.json({
			success: true,
			user: session,
		})
	} catch (error: any) {
		console.error('API Admin Me error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to verify session.' },
			{ status: 500 },
		)
	}
}
