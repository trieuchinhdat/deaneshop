import { defineField, defineType } from 'sanity'
import { PlayIcon } from '@sanity/icons'

export default defineType({
	name: 'video-embed',
	title: 'Video Embed (YouTube / Vimeo / Video)',
	type: 'object',
	icon: PlayIcon,
	fields: [
		defineField({
			name: 'url',
			title: 'Video URL',
			description: 'Supports YouTube (e.g. https://www.youtube.com/watch?v=... or youtu.be/...), Vimeo, or direct MP4.',
			type: 'url',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'title',
			title: 'Video Title (For SEO & Accessibility)',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'customThumbnail',
			title: 'Custom Thumbnail (Optional - Faster Loading)',
			description:
				'Custom preview image shown before the user clicks play. Recommended size: 1280 × 720 px (16:9 HD ratio, max 200 KB, WebP/JPG).',
			type: 'image',
			options: { hotspot: true },
		}),
		defineField({
			name: 'caption',
			title: 'Video Caption / Subtext (Optional)',
			type: 'string',
		}),
		defineField({
			name: 'aspectRatio',
			title: 'Aspect Ratio',
			type: 'string',
			options: {
				list: [
					{ title: '16:9 (Standard Widescreen)', value: '16:9' },
					{ title: '4:3 (Classic)', value: '4:3' },
					{ title: '1:1 (Square)', value: '1:1' },
					{ title: '9:16 (Vertical Shorts/Reels)', value: '9:16' },
				],
			},
			initialValue: '16:9',
		}),
	],
	preview: {
		select: {
			title: 'title',
			url: 'url',
			media: 'customThumbnail',
		},
		prepare: ({ title, url, media }) => ({
			title: title || 'Video Embed',
			subtitle: url,
			media,
		}),
	},
})
