import { defineArrayMember, defineField, defineType } from 'sanity'
import { FiStar } from 'react-icons/fi'

export default defineType({
	name: 'review',
	title: 'Review',
	type: 'document',
	icon: FiStar,
	fields: [
		defineField({
			name: 'product',
			title: 'Product',
			type: 'reference',
			to: [{ type: 'product' }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'author',
			title: 'Reviewer Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'rating',
			title: 'Rating (1-5 stars)',
			type: 'number',
			validation: (Rule) => Rule.required().min(1).max(5),
		}),
		defineField({
			name: 'comment',
			title: 'Comment / Review Content',
			type: 'text',
			rows: 4,
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'isApproved',
			title: 'Approved',
			description: 'Approve to publish this review publicly on the product page',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'response',
			title: "Seller's Response",
			description: 'Nội dung phản hồi của cửa hàng/admin tới khách hàng',
			type: 'text',
			rows: 3,
		}),
		defineField({
			name: 'images',
			title: 'Review Images',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'image',
					options: {
						hotspot: true,
					},
				}),
			],
		}),
		defineField({
			name: 'videos',
			title: 'Review Videos',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'file',
					options: {
						accept: 'video/*',
					},
				}),
			],
		}),
		defineField({
			name: 'createdAt',
			title: 'Submitted At',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
		}),
	],
	preview: {
		select: {
			author: 'author',
			rating: 'rating',
			isApproved: 'isApproved',
			productTitle: 'product.title',
		},
		prepare({ author, rating, isApproved, productTitle }) {
			const stars = rating ? '★'.repeat(rating) : ''
			const statusLabel = isApproved ? '✅ Approved' : '⏳ Pending'
			const productText = productTitle ? `SP: ${productTitle}` : '[Chưa liên kết SP]'
			return {
				title: `${author || 'Khách hàng'}${stars ? ` (${stars})` : ''}`,
				subtitle: `${statusLabel} | ${productText}`,
				media: FiStar,
			}
		},
	},
	orderings: [
		{
			name: 'createdAtDesc',
			title: 'Newest First',
			by: [{ field: 'createdAt', direction: 'desc' }],
		},
	],
})
