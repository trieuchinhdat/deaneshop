// Legacy import payloads contain heterogeneous Sanity blocks; schema validation runs before publish.
export interface ImportResult {
	status: number
	data: Record<string, any>
}
export function importResult(
	data: Record<string, any>,
	init?: { status: number },
): ImportResult {
	return { status: init?.status || 200, data }
}
