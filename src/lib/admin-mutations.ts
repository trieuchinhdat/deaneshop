export interface BulkOrderItemResult {
	id: string
	status: 'updated' | 'conflict' | 'not_found' | 'invalid'
	message?: string
	version?: number
}

export interface BulkOrderUpdateResponse {
	success?: boolean
	partial?: boolean
	message?: string
	updatedCount?: number
	conflictCount?: number
	failedCount?: number
	results?: BulkOrderItemResult[]
}

export interface BulkOrderDeleteItemResult {
	id: string
	orderNumber?: string
	status: 'deleted' | 'conflict' | 'not_found' | 'invalid'
	message?: string
}

export interface BulkOrderDeleteResponse {
	success?: boolean
	partial?: boolean
	message?: string
	deletedCount?: number
	conflictCount?: number
	failedCount?: number
	results?: BulkOrderDeleteItemResult[]
}

export class OptimisticMutationController {
	private sequences = new Map<string, number>()

	nextSeq(key: string): number {
		const next = (this.sequences.get(key) || 0) + 1
		this.sequences.set(key, next)
		return next
	}

	isLatest(key: string, seq: number): boolean {
		return this.sequences.get(key) === seq
	}

	async run<T>({
		key,
		snapshot,
		applyOptimistic,
		restore,
		request,
		onReconcile,
		onError,
	}: {
		key: string
		snapshot: T
		applyOptimistic: () => void
		restore: (prev: T) => void
		request: () => Promise<Response>
		onReconcile?: (data: any) => void
		onError: (message: string, status?: number) => void
	}): Promise<boolean> {
		const seq = this.nextSeq(key)
		applyOptimistic()

		try {
			const res = await request()
			const data = await res.json().catch(() => ({}))

			if (!this.isLatest(key, seq)) {
				return false
			}

			if (!res.ok || data?.success === false) {
				restore(snapshot)
				const msg =
					data?.message ||
					data?.error ||
					`Request failed with HTTP ${res.status}`
				onError(msg, res.status)
				return false
			}

			onReconcile?.(data)
			return true
		} catch (err: any) {
			if (!this.isLatest(key, seq)) {
				return false
			}
			restore(snapshot)
			onError(
				err?.message || 'Network error while saving changes. Changes rolled back.',
			)
			return false
		}
	}
}

export function reconcileBulkOrderUpdate({
	previousOrders,
	targetIds,
	newStatus,
	responseOk,
	responseData,
}: {
	previousOrders: any[]
	targetIds: string[]
	newStatus: string
	responseOk: boolean
	responseData: BulkOrderUpdateResponse | null | undefined
}) {
	const results = Array.isArray(responseData?.results) ? responseData!.results! : []
	if (!results.length) {
		if (responseOk && responseData?.success) {
			return {
				nextOrders: previousOrders.map((o) =>
					targetIds.includes(o._id) ? { ...o, fulfillmentStatus: newStatus } : o,
				),
				remainingSelectedIds: new Set<string>(),
				updatedCount: targetIds.length,
				failedCount: 0,
				message: responseData?.message || `Updated ${targetIds.length} orders`,
			}
		}
		return {
			nextOrders: previousOrders,
			remainingSelectedIds: new Set(targetIds),
			updatedCount: 0,
			failedCount: targetIds.length,
			message: responseData?.message || 'Bulk order update failed',
		}
	}

	const resultById = new Map(results.map((r) => [r.id, r]))
	const updatedIds = new Set<string>()
	const remainingIds = new Set<string>()

	for (const id of targetIds) {
		const r = resultById.get(id)
		if (r?.status === 'updated') {
			updatedIds.add(id)
		} else {
			remainingIds.add(id)
		}
	}

	const nextOrders = previousOrders.map((o) => {
		const r = resultById.get(o._id) || resultById.get(o.orderId)
		if (r?.status === 'updated') {
			return {
				...o,
				fulfillmentStatus: newStatus,
				version: r.version ?? (o.version ? o.version + 1 : 2),
			}
		}
		return o
	})

	return {
		nextOrders,
		remainingSelectedIds: remainingIds,
		updatedCount: updatedIds.size,
		failedCount: remainingIds.size,
		message:
			responseData?.message ||
			`Updated ${updatedIds.size} orders, ${remainingIds.size} failed or conflicted`,
	}
}

export function reconcileBulkOrderDelete({
	previousOrders,
	targetIds,
	responseOk,
	responseData,
}: {
	previousOrders: any[]
	targetIds: string[]
	responseOk: boolean
	responseData: BulkOrderDeleteResponse | null | undefined
}) {
	const results = Array.isArray(responseData?.results) ? responseData!.results! : []
	if (!results.length) {
		if (responseOk && responseData?.success) {
			const deletedSet = new Set(targetIds)
			return {
				nextOrders: previousOrders.filter((o) => !deletedSet.has(o._id) && !deletedSet.has(o.orderId)),
				remainingSelectedIds: new Set<string>(),
				deletedCount: targetIds.length,
				failedCount: 0,
				message: responseData?.message || `Deleted ${targetIds.length} orders`,
			}
		}
		return {
			nextOrders: previousOrders,
			remainingSelectedIds: new Set(targetIds),
			deletedCount: 0,
			failedCount: targetIds.length,
			message: responseData?.message || 'Bulk order deletion failed',
		}
	}

	const resultById = new Map(results.map((r) => [r.id, r]))
	const deletedIds = new Set<string>()
	const remainingIds = new Set<string>()

	for (const id of targetIds) {
		const r = resultById.get(id)
		if (r?.status === 'deleted') {
			deletedIds.add(id)
		} else {
			remainingIds.add(id)
		}
	}

	const nextOrders = previousOrders.filter((o) => !deletedIds.has(o._id) && !deletedIds.has(o.orderId))

	return {
		nextOrders,
		remainingSelectedIds: remainingIds,
		deletedCount: deletedIds.size,
		failedCount: remainingIds.size,
		message:
			responseData?.message ||
			`Deleted ${deletedIds.size} orders, ${remainingIds.size} ineligible or conflicted`,
	}
}


