/** Return actionable diagnostics without exposing SQL, credentials or database details. */
export function leadStorageError(error: unknown) {
	const e = error as { causeMessage?: string; message?: string } | null
	const cause = `${e?.causeMessage || ''} ${e?.message || ''}`.toLowerCase()
	if (cause.includes('d1 is not configured'))
		return {
			code: 'D1_NOT_CONFIGURED',
			error:
				'Lead storage is not configured. Connect the Cloudflare D1 database before opening this workspace.',
		}
	if (
		/no such table:\s*(?:\w+\.)?lead_assessments/.test(cause) ||
		/no such column:\s*(?:a\.)?(version|qualification|priority|follow_up_at|next_action|reason)\b/.test(
			cause,
		)
	)
		return {
			code: 'LEAD_SCHEMA_MISSING',
			error:
				'Lead workspace schema is missing or outdated. Apply migration 0008 to the database used by this environment.',
		}
	if (cause.includes('no such table') || cause.includes('no such column'))
		return {
			code: 'D1_SCHEMA_OUTDATED',
			error:
				'The database schema is incomplete. Apply the project migrations to the connected database.',
		}
	return {
		code: 'D1_UNAVAILABLE',
		error:
			'Lead storage could not be reached or queried. Check the database connection and server logs, then retry.',
	}
}
