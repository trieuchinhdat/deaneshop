import { defineField, defineType } from 'sanity'
import { ComponentIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'logo-list',
	title: 'Logo Marquee',
	description: 'Showcase trusted partners, enterprise clients, certifications, and press coverage with a high-performance continuous marquee or curated logo grid.',
	type: 'object',
	icon: ComponentIcon,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design & Sizing' },
		{ name: 'settings', title: 'Motion & Accessibility' },
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'intro',
			title: 'Section Tagline / Headline',
			description: 'Short headline or trust statement (e.g., "Trusted by 500+ innovative brands worldwide").',
			type: 'array',
			of: [{ type: 'block' }],
			group: 'content',
		}),
		defineField({
			name: 'logos',
			title: 'Partner & Client Logos',
			description: 'Select brand logos to feature. For best marquee visuals, 6 or more logos are recommended.',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'logo' }] }],
			group: 'content',
		}),

		// Tab 2: Design & Sizing
		defineField({
			name: 'logoType',
			title: 'Logo Color Tone',
			description: 'Select how logo colors render against this section background.',
			type: 'string',
			options: {
				list: [
					{ title: 'Original Brand Colors (Muted with color hover)', value: 'default' },
					{ title: 'Monochrome Dark (Dark graphic for light surfaces)', value: 'dark' },
					{ title: 'Monochrome Light (White graphic for dark surfaces)', value: 'light' },
				],
			},
			initialValue: 'default',
			group: 'design',
		}),
		defineField({
			name: 'logoHeight',
			title: 'Logo Scale / Max Height',
			description: 'Controls optical logo sizing across mobile and desktop viewports.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (28px mobile / 36px desktop)', value: 'small' },
					{ title: 'Standard (36px mobile / 44px desktop) — Recommended', value: 'medium' },
					{ title: 'Prominent (44px mobile / 56px desktop)', value: 'large' },
				],
			},
			initialValue: 'medium',
			group: 'design',
		}),
		defineField({
			name: 'gapSize',
			title: 'Logo Spacing (Gap)',
			description: 'Horizontal space between adjacent brand logos.',
			type: 'string',
			options: {
				list: [
					{ title: 'Compact (24px)', value: 'compact' },
					{ title: 'Standard (48px) — Recommended', value: 'normal' },
					{ title: 'Spacious (72px)', value: 'spacious' },
				],
			},
			initialValue: 'normal',
			group: 'design',
		}),

		// Tab 3: Motion & Accessibility
		defineField({
			name: 'autoScroll',
			title: 'Enable Infinite Marquee Scroll',
			description: 'When enabled, smoothly scrolls logos in an infinite loop. When disabled, displays a centered responsive grid.',
			type: 'boolean',
			initialValue: true,
			group: 'settings',
		}),
		defineField({
			name: 'direction',
			title: 'Scroll Direction',
			description: 'Direction of infinite scroll movement.',
			type: 'string',
			options: {
				list: [
					{ title: 'Left (Standard US/UK LTR reading flow)', value: 'left' },
					{ title: 'Right (Reverse flow)', value: 'right' },
				],
			},
			initialValue: 'left',
			hidden: ({ parent }) => !parent?.autoScroll,
			group: 'settings',
		}),
		defineField({
			name: 'speed',
			title: 'Scroll Speed Preset',
			description: 'Pacing of the marquee animation loop.',
			type: 'string',
			options: {
				list: [
					{ title: 'Relaxed (35s) — Optimal for 8+ detailed logos', value: 'slow' },
					{ title: 'Standard (25s) — Balanced readability (Recommended)', value: 'medium' },
					{ title: 'Dynamic (15s) — High-tempo modern vibe', value: 'fast' },
					{ title: 'Custom Duration', value: 'custom' },
				],
			},
			initialValue: 'medium',
			hidden: ({ parent }) => !parent?.autoScroll,
			group: 'settings',
		}),
		defineField({
			name: 'duration',
			title: 'Custom Loop Duration (Seconds)',
			description: 'Duration for one complete marquee cycle. Lower is faster.',
			type: 'number',
			initialValue: 25,
			hidden: ({ parent }) => !parent?.autoScroll || parent?.speed !== 'custom',
			group: 'settings',
		}),
		defineField({
			name: 'pauseOnHover',
			title: 'Pause on Hover & Keyboard Focus',
			description: 'Temporarily pauses marquee animation when visitors hover with mouse or focus into elements via keyboard.',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => !parent?.autoScroll,
			group: 'settings',
		}),
		defineField({
			name: 'showControls',
			title: 'Display Accessible Pause / Play Button',
			description: 'Displays a visible pause/resume toggle (strongly recommended for WCAG 2.2 AA Guideline 2.2.2 Pause, Stop, Hide).',
			type: 'boolean',
			initialValue: true,
			hidden: ({ parent }) => !parent?.autoScroll,
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'logo-list',
		icon: ComponentIcon,
		titleFields: ['intro'],
		select: {
			logos: 'logos',
			autoScroll: 'autoScroll',
		},
		metadata: (doc) => [
			doc.logos?.length ? `${doc.logos.length} logos` : null,
			doc.autoScroll !== undefined
				? doc.autoScroll
					? 'Auto Scroll: On'
					: 'Auto Scroll: Off'
				: null,
		],
	}),
})
