import { NextResponse } from 'next/server'

export const ORDERS_DISABLED_MESSAGE = 'Orders API is disabled in B2B RFQ mode'
export const ORDERS_DISABLED_CODE = 'ORDERS_DISABLED'

export function isOrdersApiEnabled(): boolean {
	return process.env.ENABLE_COMMERCE_ORDERS === 'true'
}

export function assertOrdersApiEnabled(mode?: string): NextResponse | null {
	if (mode === 'wholesale_rfq' || mode === 'sample') {
		return null
	}
	if (!isOrdersApiEnabled()) {
		return NextResponse.json(
			{
				success: false,
				error:
					mode === 'direct'
						? 'Direct retail checkout is disabled in B2B RFQ mode'
						: ORDERS_DISABLED_MESSAGE,
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

