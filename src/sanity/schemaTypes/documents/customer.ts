import { defineField, defineType } from 'sanity'
import { FiUsers } from 'react-icons/fi'

export default defineType({
	name: 'customer',
	title: 'Customer CRM [Archive]',
	description: '⚠️ Live customer CRM records are managed in Cloudflare D1 (/admin). Documents here are legacy read-only records.',
	type: 'document',
	readOnly: true,
	icon: FiUsers,
	fields: [
		defineField({
			name: 'name',
			title: 'Full Name',
			type: 'string',
		}),
		defineField({
			name: 'phone',
			title: 'Phone Number',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email Address',
			type: 'string',
		}),
		defineField({
			name: 'avatar',
			title: 'Avatar Image URL',
			type: 'url',
		}),
		defineField({
			name: 'googleId',
			title: 'Google OAuth User ID',
			type: 'string',
		}),
		defineField({
			name: 'authProvider',
			title: 'Identity Provider',
			type: 'string',
			options: {
				list: [
					{ title: 'Google OAuth (Gmail)', value: 'google' },
					{ title: 'Phone / Credentials', value: 'credentials' },
					{ title: 'Guest Checkout', value: 'guest' },
				],
			},
			initialValue: 'guest',
		}),
		defineField({
			name: 'lastLoginAt',
			title: 'Last Active / Login At',
			type: 'datetime',
		}),
		defineField({
			name: 'address',
			title: 'Street Address',
			type: 'text',
			rows: 2,
		}),
		defineField({
			name: 'city',
			title: 'City',
			type: 'string',
		}),
		defineField({
			name: 'state',
			title: 'State / Province / Region',
			type: 'string',
		}),
		defineField({
			name: 'postalCode',
			title: 'Postal / ZIP Code',
			type: 'string',
		}),
		defineField({
			name: 'country',
			title: 'Country',
			type: 'string',
		}),
		defineField({
			name: 'source',
			title: 'Acquisition Source',
			type: 'string',
			options: {
				list: [
					{ title: 'Newsletter Subscription', value: 'newsletter' },
					{ title: 'Popup Voucher Offer', value: 'popup' },
					{ title: 'Commercial Inquiry / Order', value: 'order' },
					{ title: 'Account Registration', value: 'register' },
					{ title: 'Other / Manual Import', value: 'other' },
				],
			},
			initialValue: 'newsletter',
		}),
		defineField({
			name: 'cskhStatus',
			title: 'CRM Lifecycle / Segment',
			type: 'string',
			options: {
				list: [
					{ title: 'Lead / Prospect', value: 'lead' },
					{ title: 'Contacted / In Follow-up', value: 'contacted' },
					{ title: 'Active Customer', value: 'customer' },
					{ title: 'VIP Account', value: 'vip' },
					{ title: 'Inactive / Unsubscribed', value: 'inactive' },
				],
			},
			initialValue: 'lead',
		}),
		defineField({
			name: 'couponReceived',
			title: 'Claimed Discount Code',
			description: 'Coupon code issued via promotional popup or marketing campaign.',
			type: 'string',
		}),
		defineField({
			name: 'orderCount',
			title: 'Total Orders Placed',
			type: 'number',
			initialValue: 0,
		}),
		defineField({
			name: 'totalSpent',
			title: 'Lifetime Value (LTV in USD)',
			type: 'number',
			initialValue: 0,
		}),
		defineField({
			name: 'lastOrderAt',
			title: 'Most Recent Order Date',
			type: 'datetime',
		}),
		defineField({
			name: 'createdAt',
			title: 'Profile Created Date',
			type: 'datetime',
			initialValue: () => new Date().toISOString(),
		}),
		defineField({
			name: 'internalNotes',
			title: 'CRM Activity Log & Notes',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'author', title: 'Staff / Agent', type: 'string' }),
						defineField({ name: 'note', title: 'Note Details', type: 'text', rows: 2 }),
						defineField({
							name: 'timestamp',
							title: 'Recorded At',
							type: 'datetime',
							initialValue: () => new Date().toISOString(),
						}),
					],
					preview: {
						select: {
							author: 'author',
							note: 'note',
							timestamp: 'timestamp',
						},
						prepare({ author, note, timestamp }) {
							const time = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
							return {
								title: `${author || 'CRM'}: ${note || ''}`,
								subtitle: time,
							}
						},
					},
				},
			],
		}),
	],
	preview: {
		select: {
			name: 'name',
			phone: 'phone',
			email: 'email',
			status: 'cskhStatus',
			orders: 'orderCount',
			total: 'totalSpent',
		},
		prepare({ name, phone, email, status, orders, total }) {
			const displayName = name ? `${name} (${phone || email})` : phone || email || 'Guest Customer'
			const formattedTotal = total !== undefined
				? `$${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
				: '$0.00'
			const orderText = orders ? `${orders} order${orders > 1 ? 's' : ''}` : '0 orders'
			const statusLabel =
				status === 'vip'
					? 'VIP'
					: status === 'customer'
						? 'Customer'
						: status === 'contacted'
							? 'In Touch'
							: status === 'lead'
								? 'Lead'
								: 'Inactive'

			return {
				title: displayName,
				subtitle: `[${statusLabel}] • ${orderText} • Total: ${formattedTotal}`,
				media: FiUsers,
			}
		},
	},
})
