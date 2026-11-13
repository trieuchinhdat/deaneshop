import { NextResponse } from 'next/server'

export const ORDERS_DISABLED_MESSAGE = 'Orders API is disabled in B2B RFQ mode'
export const ORDERS_DISABLED_CODE = 'ORDERS_DISABLED'

export function isOrdersApiEnabled(): boolean {
	return process.env.ENABLE_COMMERCE_ORDERS === 'true'
}

export function assertOrdersApiEnabled(): NextResponse | null {
	if (!isOrdersApiEnabled()) {
		return NextResponse.json(
			{
				success: false,
				error: ORDERS_DISABLED_MESSAGE,
				code: ORDERS_DISABLED_CODE,
			},
			{
				status: 410,
				headers: {
					'cache-control': 'no-store',
				},
			},
		)
	}
	return null
}

