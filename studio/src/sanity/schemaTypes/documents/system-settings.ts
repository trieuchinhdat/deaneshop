import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'system-settings',
	title: 'System & Tracking Scripts',
	type: 'document',
	groups: [
		{ name: 'analytics', title: 'Tracking Scripts & Pixels', default: true },
		{ name: 'system', title: 'Maintenance Mode' },
	],
	fields: [
		// ================= GROUP 1: TRACKING SCRIPTS & PIXELS =================
		defineField({
			name: 'scripts',
			title: 'Tracking Scripts & Pixels',
			description:
				'Manage Google Analytics 4, Facebook Pixel, Google Tag Manager, custom scripts...',
			type: 'array',
			of: [{ type: 'tracking-script' }],
			options: {
				layout: 'tags',
			},
			group: 'analytics',
		}),

		// ================= GROUP 2: MAINTENANCE MODE =================
		defineField({
			name: 'maintenanceMode',
			title: 'Maintenance Mode',
			description:
				'Enable to temporarily display a maintenance page to visitors.',
			type: 'boolean',
			initialValue: false,
			group: 'system',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'System & Tracking Scripts',
			subtitle: 'Tracking Scripts & Maintenance Mode',
		}),
	},
})
