import { defineField, defineType } from 'sanity'
import { CodeIcon, JsonIcon, LogoJsIcon } from '@sanity/icons'

export default defineType({
	name: 'custom-html',
	title: 'Custom HTML',
	icon: CodeIcon,
	type: 'object',
	groups: [
		{ name: 'html', title: 'HTML', default: true },
		{ name: 'css', title: 'CSS' },
		{ name: 'options' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'options',
		}),
		defineField({
			name: 'className',
			description: 'Optional class name to apply to the root HTML element',
			type: 'string',
			group: 'options',
		}),
		defineField({
			name: 'html',
			title: 'HTML',
			type: 'code',
			options: {
				language: 'html',
				languageAlternatives: [{ title: 'HTML', value: 'html' }],
			},
			group: 'html',
		}),
		defineField({
			name: 'css',
			title: 'CSS',
			type: 'code',
			options: {
				language: 'css',
				languageAlternatives: [{ title: 'CSS', value: 'css' }],
			},
			group: 'css',
		}),
	],
	preview: {
		select: {
			html: 'html.code',
			css: 'css.code',
		},
		prepare: ({ html, css }) => {
			return {
				title: html || css,
				...(html?.includes('<script')
					? {
							subtitle: 'Custom JavaScript',
							media: LogoJsIcon,
						}
					: css
						? {
								subtitle: 'Custom CSS',
								media: JsonIcon,
							}
						: {
								subtitle: 'Custom HTML',
								media: CodeIcon,
							}),
			}
		},
	},
})
