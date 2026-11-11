import { NextResponse } from 'next/server'
import { getAdminSession, ROLE_PERMITTED_TABS } from '@/lib/admin-auth'
import {
	buildUnifiedCustomersProjection,
	formatCommentsForWorkspace,
	formatOrdersWithRelations,
	formatReviewsForWorkspace,
	getRoleScopedAggregates,
} from '@/lib/admin-queries'
import { PersistenceError, commentsDb, leadsDb, ordersDb, reviewsDb } from '@/lib/d1'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
	try {
		const session = await getAdminSession()
		if (!session) {
			return NextResponse.json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const allowedTabs = ROLE_PERMITTED_TABS[session.role] || []
		const shouldFetchOrders = allowedTabs.includes('orders')
		const shouldFetchLeads = allowedTabs.includes('leads')
		const shouldFetchCustomers = allowedTabs.includes('customers')
		const shouldFetchReviews = allowedTabs.includes('reviews')
		const shouldFetchComments = allowedTabs.includes('comments')
		const { searchParams } = new URL(req.url)
		const since = searchParams.get('since')

		const [d1Orders, d1Leads, d1Reviews, d1Comments, summary, customersProjection] = await Promise.all([
			shouldFetchOrders ? ordersDb.list({ limit: 200 }) : Promise.resolve([]),
			shouldFetchLeads
				? leadsDb.list({
						limit: 100,
						assigned_to: session.role === 'sales' ? session.id : undefined,
					})
				: Promise.resolve([]),
			shouldFetchReviews ? reviewsDb.list({ isApproved: 'all', limit: 100 }) : Promise.resolve([]),
			shouldFetchComments ? commentsDb.list({ isApproved: 'all', limit: 100 }) : Promise.resolve([]),
			getRoleScopedAggregates(session),
			shouldFetchCustomers
				? buildUnifiedCustomersProjection(session, { limit: 200, offset: 0 })
				: Promise.resolve({ customers: [], total: 0 }),
		])

		const [formattedD1Orders, formattedD1Reviews, formattedD1Comments] = await Promise.all([
			formatOrdersWithRelations(d1Orders),
			formatReviewsForWorkspace(d1Reviews),
			formatCommentsForWorkspace(d1Comments),
		])

		const newOrders = since
			? formattedD1Orders.filter(
					(o) => new Date(o._createdAt || '').getTime() > new Date(since).getTime(),
				)
			: []

		return NextResponse.json({
			success: true,
			hasNew: newOrders.length > 0,
			newCount: newOrders.length,
			newOrders,
			orders: formattedD1Orders,
			customers: shouldFetchCustomers ? customersProjection.customers : [],
			reviews: formattedD1Reviews,
			comments: formattedD1Comments,
			leads: shouldFetchLeads ? d1Leads : [],
			summary,
			timestamp: new Date().toISOString(),
		})
	} catch (error: any) {
		const status = error instanceof PersistenceError ? 503 : 500
		console.error('API Admin Poll Error:', error)
		return NextResponse.json(
			{
				success: false,
				message:
					status === 503
						? 'Database unavailable'
						: error.message || 'Error checking for updates',
			},
			{ status },
		)
	}
}
