import { defineField, defineType } from 'sanity'
import { FiUsers, FiMail, FiCheckCircle } from 'react-icons/fi'

export default defineType({
	name: 'lead',
	title: 'Leads & Commercial Inquiries [Archive]',
	description: '⚠️ Live B2B leads and inquiries are managed in Cloudflare D1 (/admin). Documents here are legacy read-only records.',
	type: 'document',
	readOnly: true,
	icon: FiUsers,
	groups: [
		{ name: 'contact', title: 'Contact Information', icon: FiUsers, default: true },
		{ name: 'commercial', title: 'Commercial Requirements', icon: FiMail },
		{ name: 'pipeline', title: 'Pipeline & Notes', icon: FiCheckCircle },
	],
	fieldsets: [
		{
			name: 'contactDetails',
			title: 'Direct Channels',
			options: { columns: 2 },
		},
		{
			name: 'commercialContext',
			title: 'Inquiry Context',
			options: { columns: 2 },
		},
	],
	fields: [
		/* ==================== 1. CONTACT INFORMATION ==================== */
		defineField({
			name: 'name',
			title: 'Full Name / Contact Person',
			type: 'string',
			group: 'contact',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'email',
			title: 'Business Email Address',
			type: 'string',
			group: 'contact',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'phone',
			title: 'Phone Number (with Country Code)',
			type: 'string',
			group: 'contact',
			fieldset: 'contactDetails',
		}),

		defineField({
			name: 'preferredContactMethod',
			title: 'Preferred Communication Channel',
			type: 'string',
			group: 'contact',
			fieldset: 'contactDetails',
			options: {
				list: [
					{ title: 'Email (Proforma Invoice / Official Proposal)', value: 'EMAIL' },
					{ title: 'WhatsApp (Direct Chat)', value: 'WHATSAPP' },
					{ title: 'Video Call (Zoom / Google Meet)', value: 'VIDEO_CALL' },
					{ title: 'Direct Phone Call', value: 'PHONE' },
				],
			},
			initialValue: 'EMAIL',
		}),

		defineField({
			name: 'companyName',
			title: 'Company / Organization Name',
			type: 'string',
			group: 'contact',
		}),

		defineField({
			name: 'country',
			title: 'Destination Country / Region',
			type: 'string',
			group: 'contact',
		}),

		/* ==================== 2. COMMERCIAL REQUIREMENTS ==================== */
		defineField({
			name: 'productRef',
			title: 'Inquired Product',
			description: 'The specific product the prospect requested information on.',
			type: 'reference',
			to: [{ type: 'product' }],
			group: 'commercial',
		}),

		defineField({
			name: 'inquiryType',
			title: 'Inquiry Classification',
			type: 'string',
			group: 'commercial',
			fieldset: 'commercialContext',
			options: {
				list: [
					{ title: 'Request for Quotation / B2B RFQ', value: 'rfq' },
					{ title: 'Consultation & Demo Request', value: 'consultation' },
					{ title: 'Order Inquiry (No Upfront Payment)', value: 'order_inquiry' },
					{ title: 'General Commercial Inquiry', value: 'general' },
				],
			},
			initialValue: 'rfq',
		}),

		defineField({
			name: 'estimatedQuantity',
			title: 'Estimated Quantity Required',
			type: 'number',
			group: 'commercial',
			fieldset: 'commercialContext',
		}),

		defineField({
			name: 'targetBudget',
			title: 'Target Budget / Allocation',
			type: 'string',
			group: 'commercial',
		}),

		defineField({
			name: 'source',
			title: 'Lead Source',
			type: 'string',
			group: 'commercial',
			initialValue: 'landing_page',
		}),

		defineField({
			name: 'pageUrl',
			title: 'Submission Page URL',
			type: 'string',
			group: 'commercial',
		}),

		defineField({
			name: 'couponGiven',
			title: 'Issued Voucher / Promo Code',
			type: 'string',
			group: 'commercial',
		}),

		/* ==================== 3. PIPELINE & NOTES ==================== */
		defineField({
			name: 'status',
			title: 'Pipeline Status',
			type: 'string',
			group: 'pipeline',
			options: {
				list: [
					{ title: 'New Prospect (Action Required)', value: 'new' },
					{ title: 'Contacted / Nurturing', value: 'contacted' },
					{ title: 'Quotation / Proposal Sent', value: 'quoted' },
					{ title: 'Qualified Prospect', value: 'qualified' },
					{ title: 'Converted / Won', value: 'converted' },
					{ title: 'Closed / Lost', value: 'closed' },
				],
			},
			initialValue: 'new',
		}),

		defineField({
			name: 'createdAt',
			title: 'Captured At',
			type: 'datetime',
			group: 'pipeline',
			initialValue: () => new Date().toISOString(),
		}),

		defineField({
			name: 'notes',
			title: 'Specialist Internal Notes',
			type: 'text',
			rows: 3,
			group: 'pipeline',
		}),
	],
	preview: {
		select: {
			name: 'name',
			email: 'email',
			phone: 'phone',
			company: 'companyName',
			status: 'status',
			inquiryType: 'inquiryType',
			createdAt: 'createdAt',
		},
		prepare({ name, email, phone, company, status, inquiryType, createdAt }) {
			const contact = email || phone || 'Guest Prospect'
			const formattedDate = createdAt
				? new Date(createdAt).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					})
				: ''

			const statusMap: Record<string, string> = {
				new: 'NEW',
				contacted: 'CONTACTED',
				quoted: 'QUOTED',
				qualified: 'QUALIFIED',
				converted: 'WON',
				closed: 'CLOSED',
			}
			const statusLabel = statusMap[status] || 'NEW'

			const typeMap: Record<string, string> = {
				rfq: 'RFQ',
				consultation: 'Consultation',
				order_inquiry: 'Order Inquiry',
				general: 'Inquiry',
			}
			const typeLabel = typeMap[inquiryType] || 'Lead'

			const companyDisplay = company ? ` [${company}]` : ''

			return {
				title: `${name ? `${name}${companyDisplay}` : contact}`,
				subtitle: `[${typeLabel}] [${statusLabel}] ${contact} • ${formattedDate}`,
				media: FiUsers,
			}
		},
	},
})

