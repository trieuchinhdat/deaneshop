import { defineField, defineType } from 'sanity'
import { SplitVerticalIcon } from '@sanity/icons'

export default defineType({
	name: 'comparison-table',
	title: 'Comparison & Specs Table',
	type: 'object',
	icon: SplitVerticalIcon,
	fields: [
		defineField({
			name: 'title',
			title: 'Table Title (Optional)',
			type: 'string',
			placeholder: 'Feature Comparison / Specification Matrix',
		}),
		defineField({
			name: 'caption',
			title: 'Table Caption / Note (Optional)',
			type: 'string',
		}),
		defineField({
			name: 'headers',
			title: 'Column Headers',
			description: 'Header titles for each column (e.g., Feature, Model A, Model B).',
			type: 'array',
			of: [{ type: 'string' }],
			validation: (Rule) => Rule.min(2).required(),
		}),
		defineField({
			name: 'highlightedColumnIndex',
			title: 'Highlighted Column (0-indexed)',
			description: 'Optionally highlight a recommended product/column (e.g. 1 for 2nd column).',
			type: 'number',
		}),
		defineField({
			name: 'rows',
			title: 'Table Rows',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'tableRow',
					title: 'Row',
					fields: [
						defineField({
							name: 'cells',
							title: 'Cells (Must match number of headers)',
							type: 'array',
							of: [{ type: 'string' }],
						}),
					],
					preview: {
						select: {
							cells: 'cells',
						},
						prepare: ({ cells }) => ({
							title: cells ? cells.join(' | ') : 'Empty row',
						}),
					},
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
			headers: 'headers',
			rows: 'rows',
		},
		prepare: ({ title, headers, rows }) => ({
			title: title || 'Comparison Table',
			subtitle: `${headers?.length || 0} cols × ${rows?.length || 0} rows`,
		}),
	},
})
