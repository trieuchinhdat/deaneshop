import { defineField, defineType } from 'sanity'
import { BsBarChartSteps } from 'react-icons/bs'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'breadcrumbs',
	title: 'Navigation Breadcrumbs',
	description: 'Hierarchical navigation trail assisting user orientation and internal linking.',
	icon: BsBarChartSteps,
	type: 'object',
	groups: [{ name: 'content', default: true }, { name: 'options' }],
	fields: [
		defineField({
			name: 'crumbs',
			type: 'array',
			of: [{ type: 'link', initialValue: { type: 'internal' } }],
			description: 'The current page is included by default',
			group: 'content',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'breadcrumbs',
		icon: BsBarChartSteps,
		select: {
			crumbs: 'crumbs',
		},
		metadata: (doc) => [
			doc.crumbs?.length ? `${doc.crumbs.length} crumbs` : null,
		],
	}),
})
