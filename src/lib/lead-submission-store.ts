import { createHash } from 'node:crypto'
import { CommerceError } from '@/lib/commerce'
import { d1Query } from '@/lib/d1'
import { stableLeadSubmission } from './lead-submission'

export class LeadSubmissionConflict extends CommerceError {}
export function leadSubmissionIdentity(
	request: Request,
	body: Record<string, unknown>,
) {
	const key = request.headers.get('Idempotency-Key')
	if (!key) return null // Older integrations remain compatible.
	if (!/^[a-zA-Z0-9_-]{16,128}$/.test(key))
		throw new CommerceError('Invalid submission key')
	return {
		key,
		hash: createHash('sha256')
			.update(JSON.stringify(stableLeadSubmission(body)))
			.digest('hex'),
	}
}

export async function replayLeadSubmission(
	identity: ReturnType<typeof leadSubmissionIdentity>,
) {
	if (!identity) return null
	const { results } = await d1Query<{
		submission_hash: string
		submission_result: string
	}>(
		'SELECT submission_hash, submission_result FROM leads WHERE submission_key = ? LIMIT 1',
		[identity.key],
	)
	if (!results[0]) return null
	if (results[0].submission_hash !== identity.hash)
		throw new LeadSubmissionConflict(
			'Submission key already used for different requirements',
		)
	return JSON.parse(results[0].submission_result) as Record<string, unknown>
}
