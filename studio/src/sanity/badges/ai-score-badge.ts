import type { DocumentBadgeComponent, DocumentBadgeProps } from 'sanity'
import { auditArticle } from '@/sanity/lib/article-audit'

export const AiScoreBadge: DocumentBadgeComponent = (
	props: DocumentBadgeProps,
) => {
	const doc = props.draft || props.published
	if (!doc || props.type !== 'blog.post') return null

	const audit = auditArticle(doc)

	const tierShortLabel =
		audit.tier === 'blocked'
			? 'Blocked'
			: audit.tier === 'tier1_flagship'
				? 'Flagship'
				: audit.tier === 'tier2_professional'
					? 'Professional'
					: audit.tier === 'tier3_improvement'
						? 'Needs Work'
						: 'Revision'

	return {
		label: `GEQSR: ${tierShortLabel} (${audit.totalScore}/100)`,
		title: `${audit.scoreTier} — ${audit.tierDescription}`,
		color:
			audit.scoreTone === 'positive'
				? 'success'
				: audit.scoreTone === 'caution'
					? 'warning'
					: 'danger',
	}
}
