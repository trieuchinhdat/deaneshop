import { defineField, defineType } from 'sanity'
import { CommentIcon } from '@sanity/icons'

export default defineType({
	name: 'blog.comment',
	title: 'Blog Comments & Q&A',
	type: 'document',
	icon: CommentIcon,
	groups: [
		{ name: 'content', title: 'Comment Content', default: true },
		{ name: 'moderation', title: 'Moderation & Status' },
	],
	fields: [
		defineField({
			name: 'post',
			title: 'Target Blog Article',
			description: 'The blog post this comment belongs to.',
			type: 'reference',
			to: [{ type: 'blog.post' }],
			validation: (Rule) => Rule.required(),
			group: 'content',
		}),
		defineField({
			name: 'authorName',
			title: 'Author Name',
			description: 'Full name or display name of the commenter.',
			type: 'string',
			validation: (Rule) => Rule.required().min(2).max(80),
			group: 'content',
		}),
		defineField({
			name: 'authorEmail',
			title: 'Author Email (Private Lead Info)',
			description: 'Used for lead follow-up or reply notifications. Never shown publicly.',
			type: 'string',
			validation: (Rule) => Rule.required().email(),
			group: 'content',
		}),
		defineField({
			name: 'content',
			title: 'Comment Text',
			description: 'The body of the comment or question.',
			type: 'text',
			rows: 4,
			validation: (Rule) => Rule.required().min(5).max(1000),
			group: 'content',
		}),
		defineField({
			name: 'isAuthorReply',
			title: 'Official Author / Specialist Reply?',
			description: 'Enable to display the verified "Author / Specialist" badge on the website.',
			type: 'boolean',
			initialValue: false,
			group: 'moderation',
		}),
		defineField({
			name: 'parentComment',
			title: 'Parent Comment (For Threaded Replies)',
			description: 'Select if this comment is a direct reply to an existing comment.',
			type: 'reference',
			to: [{ type: 'blog.comment' }],
			group: 'content',
		}),
		defineField({
			name: 'isApproved',
			title: 'Approved for Public Display?',
			description: 'Must be approved by an editor/admin to be visible on the live blog.',
			type: 'boolean',
			initialValue: false,
			group: 'moderation',
		}),
		defineField({
			name: 'createdAt',
			title: 'Submitted At',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
			group: 'content',
		}),
	],
	preview: {
		select: {
			authorName: 'authorName',
			content: 'content',
			postTitle: 'post.title',
			isApproved: 'isApproved',
			isAuthorReply: 'isAuthorReply',
		},
		prepare({ authorName, content, postTitle, isApproved, isAuthorReply }) {
			const status = isApproved ? '✅ LIVE' : '⏳ PENDING'
			const authorType = isAuthorReply ? ' [AUTHOR]' : ''
			return {
				title: `${authorName || 'Anonymous'}${authorType} • ${status}`,
				subtitle: `${postTitle ? `[${postTitle}] ` : ''}${content || ''}`,
				media: CommentIcon,
			}
		},
	},
})
