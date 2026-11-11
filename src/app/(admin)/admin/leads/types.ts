import { D1AdminUser, D1Lead } from '@/lib/d1'

export type LeadStage = 'new' | 'contacted' | 'discovery' | 'proposal' | 'won' | 'lost'

export interface PipelineStageConfig {
	id: LeadStage
	label: string
	color: string
	bgBadge: string
	border: string
	description: string
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
	{
		id: 'new',
		label: 'Inbox / New Lead',
		color: 'text-blue-700',
		bgBadge: 'bg-blue-50 border-blue-200 text-blue-700',
		border: 'border-blue-400',
		description: 'Newly received inquiry requiring fast outreach (SLA < 5 mins)',
	},
	{
		id: 'contacted',
		label: 'Contacted',
		color: 'text-amber-700',
		bgBadge: 'bg-amber-50 border-amber-200 text-amber-700',
		border: 'border-amber-400',
		description: 'Initial greeting email dispatched or phone call attempted',
	},
	{
		id: 'discovery',
		label: 'Discovery & Demo',
		color: 'text-purple-700',
		bgBadge: 'bg-purple-50 border-purple-200 text-purple-700',
		border: 'border-purple-400',
		description: 'Discovery call held, custom sample kit or catalog sent',
	},
	{
		id: 'proposal',
		label: 'Proposal & Quote',
		color: 'text-indigo-700',
		bgBadge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
		border: 'border-indigo-400',
		description: 'B2B commercial proposal delivered, contract in negotiation',
	},
	{
		id: 'won',
		label: 'Won (Closed Deal)',
		color: 'text-emerald-700',
		bgBadge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
		border: 'border-emerald-500',
		description: 'Deal closed, contract signed, initial deposit secured',
	},
	{
		id: 'lost',
		label: 'Lost / Closed',
		color: 'text-rose-700',
		bgBadge: 'bg-rose-50 border-rose-200 text-rose-700',
		border: 'border-rose-400',
		description: 'Disqualified lead, budget mismatch, or postponed',
	},
]
