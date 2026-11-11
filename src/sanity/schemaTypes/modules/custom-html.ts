import { defineField, defineType } from 'sanity'
import { CodeIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'custom-html',
	title: 'Code & App Embed',
	description:
		'Raw HTML code, third-party embed widgets (Typeform, Calendly, Google Maps), scripts, and custom visual styling blocks.',
	icon: CodeIcon,
	type: 'object',
	groups: [
		{ name: 'content', title: 'Content & Embed Code', default: true },
		{ name: 'layout', title: 'Layout & Sizing' },
		{ name: 'design', title: 'Appearance & Style' },
		{ name: 'advanced', title: 'Advanced & Custom CSS' },
		{ name: 'settings', title: 'Behavior & Anchor' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Section Header & Context (Optional)',
			description:
				'Add an optional heading and explanatory copy above the embedded widget to provide clear context for visitors.',
			options: { columns: 1, collapsible: true, collapsed: false },
		},
		{
			name: 'embedCode',
			title: 'Embed Snippet & Content',
			description:
				'Paste code snippet from your third-party provider or custom HTML markup.',
			options: { columns: 1 },
		},
		{
			name: 'containerDimensions',
			title: 'Container & Layout Dimensions',
			description:
				'Control max-width, alignment, and vertical breathing room for optimal visual hierarchy.',
			options: { columns: 1 },
		},
		{
			name: 'frameStyle',
			title: 'Frame & Visual Presentation',
			description:
				'Style the embed wrapper with card containers, rounded corners, or background tints.',
			options: { columns: 1 },
		},
		{
			name: 'developerOptions',
			title: 'Developer Overrides & Custom CSS',
			description:
				'Target specific elements with custom CSS or wrapper utility classes. Recommended for developers only.',
			options: { columns: 1, collapsible: true, collapsed: true },
		},
		{
			name: 'securityOptions',
			title: 'Enterprise Security & Script Sandboxing',
			description:
				'Isolate untrusted third-party scripts inside a secure, cross-origin sandboxed browsing context (srcdoc). Protects customer data, cookies, and admin sessions.',
			options: { columns: 1, collapsible: true, collapsed: false },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),

		// --- TAB 1: CONTENT & EMBED CODE ---
		defineField({
			name: 'badge',
			title: 'Section Eyebrow / Category Tag',
			description:
				'Optional small pill tag displayed above the headline (e.g., "LOCATIONS", "SCHEDULE A CALL", "COMMUNITY").',
			type: 'string',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headline',
			title: 'Section Main Headline',
			description:
				'Clear, engaging title explaining what visitors see or do in this block.',
			type: 'string',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'subtitle',
			title: 'Supporting Description / Context',
			description:
				'Optional explanatory copy beneath the headline guiding the user.',
			type: 'text',
			rows: 2,
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headerAlign',
			title: 'Header Alignment',
			description: 'Alignment for the eyebrow badge, headline, and subtitle.',
			type: 'string',
			options: {
				list: [
					{ title: 'Centered (Recommended)', value: 'center' },
					{ title: 'Left Aligned', value: 'left' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'content',
			fieldset: 'headerInfo',
		}),

		defineField({
			name: 'embedType',
			title: 'Embed Category Helper',
			description:
				'Categorizes this embed to optimize rendering and mobile responsiveness.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Standard Embed / Custom HTML (Default)',
						value: 'custom',
					},
					{
						title: 'iFrame Widget (Google Maps, Calendly, Typeform, Video)',
						value: 'iframe',
					},
					{
						title: 'Visual CSS Block (Custom styling without HTML)',
						value: 'css-only',
					},
				],
				layout: 'radio',
			},
			initialValue: 'custom',
			group: 'content',
			fieldset: 'embedCode',
		}),
		defineField({
			name: 'html',
			title: 'HTML & Embed Code Snippet',
			description:
				'Paste raw HTML, <iframe> embed code, or <script> tags from third-party services (Google Maps, Typeform, Calendly, Elfsight, Trustpilot, etc.).',
			type: 'code',
			options: {
				language: 'html',
				languageAlternatives: [{ title: 'HTML', value: 'html' }],
			},
			hidden: ({ parent }) => parent?.embedType === 'css-only',
			group: 'content',
			fieldset: 'embedCode',
		}),
		defineField({
			name: 'caption',
			title: 'Embed Caption / Disclaimers',
			description:
				'Optional small note or disclosure text displayed below the embed (e.g. "Appointments must be booked at least 24 hours in advance").',
			type: 'string',
			group: 'content',
			fieldset: 'embedCode',
		}),

		// --- TAB 2: LAYOUT & SIZING ---
		defineField({
			name: 'containerWidth',
			title: 'Container Width',
			description:
				'Determines the horizontal boundary of the embedded widget on desktop and tablets.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Narrow (768px - Best for single forms, Calendly, surveys)',
						value: 'narrow',
					},
					{
						title: 'Standard (1024px - Balanced content width - Recommended)',
						value: 'standard',
					},
					{
						title: 'Wide (1280px - High-res dashboards, wide calendars, media)',
						value: 'wide',
					},
					{
						title: 'Full Bleed / Edge-to-Edge (100% width - Panoramic maps)',
						value: 'full',
					},
				],
			},
			initialValue: 'standard',
			group: 'layout',
			fieldset: 'containerDimensions',
		}),
		defineField({
			name: 'alignment',
			title: 'Embed Alignment',
			description: 'Position of the embed inside the container wrapper.',
			type: 'string',
			options: {
				list: [
					{ title: 'Centered (Recommended)', value: 'center' },
					{ title: 'Left Aligned', value: 'left' },
					{ title: 'Right Aligned', value: 'right' },
				],
				layout: 'radio',
			},
			initialValue: 'center',
			group: 'layout',
			fieldset: 'containerDimensions',
		}),
		defineField({
			name: 'spacing',
			title: 'Vertical Spacing (Padding)',
			description:
				'Vertical breathing room above and below the module.',
			type: 'string',
			options: {
				list: [
					{ title: 'None (Flush / 0 padding - seamless)', value: 'none' },
					{ title: 'Compact (Small top/bottom padding)', value: 'compact' },
					{ title: 'Standard (Balanced section padding - Recommended)', value: 'standard' },
					{ title: 'Spacious (Large breathing room)', value: 'spacious' },
				],
			},
			initialValue: 'standard',
			group: 'layout',
			fieldset: 'containerDimensions',
		}),
		defineField({
			name: 'aspectRatio',
			title: 'Responsive Aspect Ratio (Optional)',
			description:
				'Enforce a proportional height ratio for iframes and media embeds, preventing layout shift.',
			type: 'string',
			options: {
				list: [
					{ title: 'Dynamic / Auto (Default - natural height of embed)', value: 'auto' },
					{ title: 'Widescreen 16:9 (Recommended for Video & Maps)', value: '16/9' },
					{ title: 'Standard 4:3 (Classic display)', value: '4/3' },
					{ title: 'Square 1:1', value: '1/1' },
				],
			},
			initialValue: 'auto',
			group: 'layout',
			fieldset: 'containerDimensions',
		}),
		defineField({
			name: 'responsiveIframe',
			title: 'Mobile-Safe iFrame Auto-Fitting',
			description:
				'Automatically constrain embedded iframes to 100% max-width, preventing horizontal blowout and scrollbars on mobile devices.',
			type: 'boolean',
			initialValue: true,
			group: 'layout',
			fieldset: 'containerDimensions',
		}),

		// --- TAB 3: APPEARANCE & STYLE ---
		defineField({
			name: 'containerStyle',
			title: 'Frame Presentation',
			description:
				'Choose whether the embed blends seamlessly into the page or is framed within an elevated card container.',
			type: 'string',
			options: {
				list: [
					{ title: 'Seamless (Transparent background, blends with page)', value: 'clean' },
					{ title: 'Elevated Card (Boxed with clean border & soft shadow)', value: 'card' },
					{ title: 'Muted Box (Subtle soft background container)', value: 'muted' },
				],
				layout: 'radio',
			},
			initialValue: 'clean',
			group: 'design',
			fieldset: 'frameStyle',
		}),
		defineField({
			name: 'borderRadius',
			title: 'Corner Rounding',
			description: 'Corner radius applied to card containers or clipped embeds.',
			type: 'string',
			options: {
				list: [
					{ title: 'Sharp / None (0px)', value: 'none' },
					{ title: 'Subtle (rounded-lg / 8px)', value: 'md' },
					{ title: 'Standard (rounded-2xl / 16px - Recommended)', value: 'lg' },
					{ title: 'Soft (rounded-3xl / 24px)', value: 'full' },
				],
				layout: 'radio',
			},
			initialValue: 'lg',
			group: 'design',
			fieldset: 'frameStyle',
		}),

		// --- TAB 4: ADVANCED & CUSTOM CSS ---
		defineField({
			name: 'css',
			title: 'Custom CSS Stylesheet',
			description:
				'Optional custom CSS rules injected into the page. Useful for styling third-party widgets.',
			type: 'code',
			options: {
				language: 'css',
				languageAlternatives: [{ title: 'CSS', value: 'css' }],
			},
			group: 'advanced',
			fieldset: 'developerOptions',
		}),
		defineField({
			name: 'className',
			title: 'Wrapper CSS Classes',
			description:
				'Optional Tailwind or custom utility classes applied to the root container.',
			type: 'string',
			group: 'advanced',
			fieldset: 'developerOptions',
		}),
		defineField({
			name: 'executeScripts',
			title: 'Enable Dynamic Script Execution',
			description:
				'Execute JavaScript tags found within the embed code. Disable if embedding pure static HTML.',
			type: 'boolean',
			initialValue: true,
			group: 'advanced',
			fieldset: 'developerOptions',
		}),
		defineField({
			name: 'sandboxMode',
			title: 'Enable Isolated Sandbox (Security Mode)',
			description:
				'Renders the embed inside an isolated HTML5 sandboxed iframe. Untrusted scripts cannot access host page cookies, session tokens, or local storage.',
			type: 'boolean',
			initialValue: false,
			group: 'advanced',
			fieldset: 'securityOptions',
		}),
		defineField({
			name: 'sandboxPolicy',
			title: 'Sandbox Security Policy',
			description:
				'Controls which browser capabilities are granted to the sandboxed embed.',
			type: 'string',
			options: {
				list: [
					{
						title:
							'Standard (Scripts, Forms & Popups allowed - Recommended)',
						value: 'standard',
					},
					{
						title:
							'Strict (Scripts only - No forms, popups, or external navigation)',
						value: 'strict',
					},
					{
						title:
							'Extended (Scripts, Forms, Popups, and Same-Origin access)',
						value: 'permissive',
					},
				],
				layout: 'radio',
			},
			initialValue: 'standard',
			hidden: ({ parent }) => !parent?.sandboxMode,
			group: 'advanced',
			fieldset: 'securityOptions',
		}),
		defineField({
			name: 'sandboxHeight',
			title: 'Sandbox Container Height',
			description: 'Height of the sandboxed iframe container.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Auto / Aspect Ratio (Adapts to layout aspect ratio)',
						value: 'auto',
					},
					{ title: 'Compact (350px)', value: 'small' },
					{
						title: 'Medium (500px - Recommended for interactive widgets)',
						value: 'medium',
					},
					{
						title: 'Spacious (700px - Recommended for full calendars & forms)',
						value: 'large',
					},
				],
				layout: 'radio',
			},
			initialValue: 'medium',
			hidden: ({ parent }) => !parent?.sandboxMode,
			group: 'advanced',
			fieldset: 'securityOptions',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'custom-html',
		icon: CodeIcon,
		titleFields: ['headline', 'title', 'badge', 'embedType', 'className'],
		select: {
			html: 'html.code',
			css: 'css.code',
			containerWidth: 'containerWidth',
			embedType: 'embedType',
			sandboxMode: 'sandboxMode',
		},
		metadata: (doc) => [
			doc.sandboxMode ? '🛡️ Sandboxed' : null,
			doc.html?.includes('<script')
				? 'JS Widget'
				: doc.html?.includes('<iframe')
					? 'iFrame Embed'
					: doc.html
						? 'HTML Embed'
						: doc.css
							? 'CSS Block'
							: '(Empty Embed)',
			doc.containerWidth ? `Width: ${doc.containerWidth}` : null,
		],
	}),
})
