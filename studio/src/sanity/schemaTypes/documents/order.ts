import { defineField, defineType } from 'sanity'
import {
	FiShoppingBag,
	FiUser,
	FiCheckCircle,
	FiFileText,
	FiDollarSign,
	FiTruck,
	FiShield,
	FiClock,
} from 'react-icons/fi'

export default defineType({
	name: 'order',
	title: 'B2B Quotations & Orders',
	description: 'Manage B2B commercial proposals, proforma invoices, and international wholesale orders.',
	type: 'document',
	icon: FiFileText,
	groups: [
		{ name: 'quoteTerms', title: '1. Quotation & Terms', icon: FiFileText, default: true },
		{ name: 'items', title: '2. Line Items', icon: FiShoppingBag },
		{ name: 'financials', title: '3. Pricing & Taxes', icon: FiDollarSign },
		{ name: 'customer', title: '4. Buyer Profile', icon: FiUser },
		{ name: 'status', title: '5. Workflow & Acceptance', icon: FiCheckCircle },
		{ name: 'notes', title: '6. Notes & Revisions', icon: FiClock },
	],
	fieldsets: [
		{
			name: 'quoteIdentifiers',
			title: 'Quotation Identity & Timing',
			options: { columns: 2 },
		},
		{
			name: 'tradeTermsRow',
			title: 'International Trade & Delivery Terms',
			options: { columns: 2 },
		},
		{
			name: 'acceptanceRow',
			title: 'Buyer Digital Acceptance Metadata',
			options: { columns: 2 },
		},
		{
			name: 'pricingRow',
			title: 'Financial Breakdown',
			options: { columns: 3 },
		},
		{
			name: 'statusRow',
			title: 'Commercial Status',
			options: { columns: 2 },
		},
	],
	fields: [
		/* ==================== GROUP 1: QUOTATION & TERMS ==================== */
		defineField({
			name: 'orderId',
			title: 'Quotation Reference / Order Number',
			description: 'Unique commercial identifier (e.g., RFQ-2026-US-1042 or ORD-2026-8942).',
			type: 'string',
			group: 'quoteTerms',
			fieldset: 'quoteIdentifiers',
			validation: (Rule) => Rule.required().error('Quotation Reference is required.'),
		}),

		defineField({
			name: 'quoteStatus',
			title: 'Quotation Lifecycle Status',
			description: 'Current stage of the quotation agreement.',
			type: 'string',
			group: 'quoteTerms',
			fieldset: 'quoteIdentifiers',
			options: {
				list: [
					{ title: 'Draft (Internal Preparation)', value: 'draft' },
					{ title: 'Sent (Active & Awaiting Buyer Review)', value: 'sent' },
					{ title: 'Viewed (Buyer Opened Online)', value: 'viewed' },
					{ title: 'Approved / Accepted (Digitally Signed)', value: 'approved' },
					{ title: 'Revision Requested (Buyer Proposed Changes)', value: 'revision_requested' },
					{ title: 'Expired (Past Validity Window)', value: 'expired' },
					{ title: 'Cancelled / Withdrawn', value: 'cancelled' },
				],
			},
			initialValue: 'sent',
		}),

		defineField({
			name: 'quoteValidUntil',
			title: 'Validity Expiration Date',
			description: 'Commercial quotes cannot be accepted after this date without re-authorization.',
			type: 'datetime',
			group: 'quoteTerms',
			fieldset: 'tradeTermsRow',
		}),

		defineField({
			name: 'incoterm',
			title: 'International Commercial Term (Incoterms® 2020)',
			description: 'Defines delivery obligations, insurance, and freight liability.',
			type: 'string',
			group: 'quoteTerms',
			fieldset: 'tradeTermsRow',
			options: {
				list: [
					{ title: 'FOB — Free on Board (Vietnam Export Port)', value: 'FOB' },
					{ title: 'CIF — Cost, Insurance & Freight (Destination Port)', value: 'CIF' },
					{ title: 'CFR — Cost and Freight', value: 'CFR' },
					{ title: 'EXW — Ex Works (Factory Gate Pickup)', value: 'EXW' },
					{ title: 'DDP — Delivered Duty Paid (Doorstep Landed)', value: 'DDP' },
					{ title: 'FCA — Free Carrier', value: 'FCA' },
					{ title: 'Standard Domestic Delivery', value: 'STANDARD' },
				],
			},
			initialValue: 'FOB',
		}),

		defineField({
			name: 'portOfDestination',
			title: 'Port of Destination / Delivery Hub',
			description: 'Target seaport, airport, or regional logistics hub (e.g., Long Beach Port, CA or Port of Rotterdam).',
			type: 'string',
			group: 'quoteTerms',
			placeholder: 'e.g. Long Beach Port, CA / Southampton Hub, UK',
		}),

		defineField({
			name: 'targetDeliveryDate',
			title: 'Target Dispatch / Vessel Departure Schedule',
			description: 'Estimated fulfillment window or ETD/ETA schedule.',
			type: 'string',
			group: 'quoteTerms',
			placeholder: 'e.g. Within 2-3 Weeks / Vessel Booking ETD April 2026',
		}),

		defineField({
			name: 'paymentTerms',
			title: 'Agreed Payment & Settlement Terms',
			description: 'Commercial remittance schedule specified on proforma invoices.',
			type: 'string',
			group: 'quoteTerms',
			placeholder: 'e.g. T/T 30% advance upon PO, 70% before vessel departure',
			options: {
				list: [
					{ title: 'T/T 30% advance upon PO, 70% against B/L copy (Standard Trade)', value: 'T/T 30% advance upon PO, 70% against B/L copy' },
					{ title: 'T/T 50% deposit, 50% balance before factory dispatch', value: 'T/T 50% deposit, 50% balance before factory dispatch' },
					{ title: '100% Irrevocable Letter of Credit (L/C at sight)', value: '100% Irrevocable Letter of Credit (L/C at sight)' },
					{ title: 'Net 30 Days (Corporate Procurement Account)', value: 'Net 30 Days (Corporate Procurement Account)' },
					{ title: '100% T/T Upfront Wire Remittance', value: '100% T/T Upfront Wire Remittance' },
					{ title: 'Cash on Delivery (COD) / Inspection on Delivery', value: 'Cash on Delivery (COD)' },
				],
			},
			initialValue: 'T/T 30% advance upon PO, 70% against B/L copy',
		}),

		defineField({
			name: 'intentType',
			title: 'Commercial Intent Category',
			type: 'string',
			group: 'quoteTerms',
			options: {
				list: [
					{ title: 'B2B Wholesale / Export Quotation', value: 'B2B_RFQ' },
					{ title: 'Direct Order Request (Without Upfront Payment)', value: 'ORDER_REQUEST' },
					{ title: 'OEM / Custom Manufacturing Consultation', value: 'CONSULTATION' },
				],
			},
			initialValue: 'B2B_RFQ',
		}),

		/* ==================== GROUP 2: LINE ITEMS ==================== */
		defineField({
			name: 'items',
			title: 'Itemized Schedule & Specifications',
			type: 'array',
			group: 'items',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'title', title: 'Product / Specification Title', type: 'string', validation: (Rule) => Rule.required() }),
						defineField({ name: 'sku', title: 'SKU / Model Number', type: 'string' }),
						defineField({ name: 'quantity', title: 'Quantity (Units)', type: 'number', validation: (Rule) => Rule.required().min(1) }),
						defineField({ name: 'price', title: 'Unit Price', type: 'number', validation: (Rule) => Rule.required().min(0) }),
						defineField({ name: 'total', title: 'Line Item Subtotal', type: 'number' }),
						defineField({ name: 'productId', title: 'Product Reference ID', type: 'string' }),
						defineField({ name: 'image', title: 'Product Thumbnail URL', type: 'string' }),
					],
					preview: {
						select: {
							title: 'title',
							sku: 'sku',
							price: 'price',
							qty: 'quantity',
							total: 'total',
						},
						prepare({ title, sku, price, qty, total }) {
							const q = qty || 1
							const p = price || 0
							const t = total !== undefined ? total : p * q
							return {
								title: title || 'Item',
								subtitle: `${sku ? `[${sku}] ` : ''}${q.toLocaleString()} units @ $${p.toFixed(2)} = $${t.toFixed(2)}`,
								media: FiShoppingBag,
							}
						},
					},
				},
			],
		}),

		/* ==================== GROUP 3: PRICING & FINANCIALS ==================== */
		defineField({
			name: 'pricing',
			title: 'Financial Breakdown',
			type: 'object',
			group: 'financials',
			fields: [
				defineField({
					name: 'currency',
					title: 'Commercial Currency',
					type: 'string',
					options: {
						list: [
							{ title: 'USD ($) — US Dollar', value: 'USD' },
							{ title: 'GBP (£) — British Pound', value: 'GBP' },
							{ title: 'EUR (€) — Euro', value: 'EUR' },
							{ title: 'VND (₫) — Vietnamese Dong', value: 'VND' },
							{ title: 'CAD (CA$) — Canadian Dollar', value: 'CAD' },
							{ title: 'AUD (AU$) — Australian Dollar', value: 'AUD' },
							{ title: 'SGD (SG$) — Singapore Dollar', value: 'SGD' },
							{ title: 'JPY (¥) — Japanese Yen', value: 'JPY' },
						],
					},
					initialValue: 'USD',
				}),
				defineField({ name: 'subtotal', title: 'FOB Products Subtotal', type: 'number', validation: (Rule) => Rule.min(0) }),
				defineField({ name: 'shippingFee', title: 'Freight & Ocean Logistics Charge', type: 'number', initialValue: 0 }),
				defineField({ name: 'discount', title: 'Negotiated Commercial Discount', type: 'number', initialValue: 0 }),
				defineField({ name: 'taxRate', title: 'Applicable Tax / VAT Rate (%)', type: 'number', initialValue: 0 }),
				defineField({ name: 'taxAmount', title: 'Tax / Duty Amount', type: 'number', initialValue: 0 }),
				defineField({ name: 'grandTotal', title: 'Total Landed Value', type: 'number', validation: (Rule) => Rule.required() }),
			],
		}),

		/* ==================== GROUP 4: BUYER PROFILE ==================== */
		defineField({
			name: 'customer',
			title: 'Buyer & Importer Entity',
			type: 'object',
			group: 'customer',
			fields: [
				defineField({ name: 'name', title: 'Authorized Representative / Contact Name', type: 'string' }),
				defineField({ name: 'companyName', title: 'Company / Organization Name', type: 'string' }),
				defineField({ name: 'email', title: 'Official Procurement Email', type: 'string', validation: (Rule) => Rule.email() }),
				defineField({ name: 'phone', title: 'Business Telephone (with Country Code)', type: 'string' }),
				defineField({ name: 'taxId', title: 'VAT / EIN / Tax Registration Number', type: 'string' }),
				defineField({ name: 'address', title: 'Business / Destination Address', type: 'text', rows: 2 }),
				defineField({ name: 'city', title: 'Destination City / Port', type: 'string' }),
				defineField({ name: 'state', title: 'State / Province', type: 'string' }),
				defineField({ name: 'postalCode', title: 'ZIP / Postal Code', type: 'string' }),
				defineField({ name: 'country', title: 'Destination Country', type: 'string' }),
			],
		}),

		defineField({
			name: 'customerRef',
			title: 'Linked CRM Customer Record',
			type: 'reference',
			group: 'customer',
			to: [{ type: 'customer' }],
		}),

		/* ==================== GROUP 5: STATUS & ACCEPTANCE ==================== */
		defineField({
			name: 'fulfillmentStatus',
			title: 'Order Processing Stage',
			type: 'string',
			group: 'status',
			options: {
				list: [
					{ title: 'Pending Approval / Review', value: 'PENDING' },
					{ title: 'Confirmed / Contract Countersigned', value: 'CONFIRMED' },
					{ title: 'In Production / Vessel Staging', value: 'PROCESSING' },
					{ title: 'Dispatched / In Transit', value: 'SHIPPING' },
					{ title: 'Port Delivered / Completed', value: 'DELIVERED' },
					{ title: 'Cancelled / Void', value: 'CANCELLED' },
				],
			},
			initialValue: 'PENDING',
		}),

		defineField({
			name: 'quoteApprovedAt',
			title: 'Electronic Approval Timestamp',
			type: 'datetime',
			group: 'status',
			fieldset: 'acceptanceRow',
		}),

		defineField({
			name: 'quoteApprovedBy',
			title: 'Authorized Signatory Name & Title',
			type: 'string',
			group: 'status',
			fieldset: 'acceptanceRow',
		}),

		defineField({
			name: 'quotePoNumber',
			title: 'Buyer Purchase Order (PO) Number',
			type: 'string',
			group: 'status',
			placeholder: 'e.g. PO-2026-US-894',
		}),

		defineField({
			name: 'paymentStatus',
			title: 'Financial Settlement Status',
			type: 'string',
			group: 'status',
			options: {
				list: [
					{ title: 'Unpaid (Proforma Stage)', value: 'UNPAID' },
					{ title: 'Deposit Received (Production Confirmed)', value: 'PARTIAL' },
					{ title: 'Fully Paid / Remitted', value: 'PAID' },
					{ title: 'Letter of Credit Issued', value: 'LC_ISSUED' },
					{ title: 'Refunded', value: 'REFUNDED' },
				],
			},
			initialValue: 'UNPAID',
		}),

		defineField({
			name: 'carrier',
			title: 'Freight Carrier / Logistics Line',
			type: 'string',
			group: 'status',
		}),

		defineField({
			name: 'trackingCode',
			title: 'Waybill / Bill of Lading (B/L) Reference',
			type: 'string',
			group: 'status',
		}),

		/* ==================== GROUP 6: NOTES & REVISIONS ==================== */
		defineField({
			name: 'customerNote',
			title: 'Customer Instructions & OEM Requests',
			type: 'text',
			rows: 3,
			group: 'notes',
		}),

		defineField({
			name: 'revisionHistory',
			title: 'Buyer Revision Requests & Dialogue',
			description: 'Requests submitted online by the client via the Request Revision form.',
			type: 'array',
			group: 'notes',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'timestamp', title: 'Submitted At', type: 'datetime' }),
						defineField({ name: 'customerName', title: 'Requester Name', type: 'string' }),
						defineField({ name: 'customerEmail', title: 'Requester Email', type: 'string' }),
						defineField({ name: 'requestedChanges', title: 'Requested Modifications', type: 'text' }),
						defineField({
							name: 'status',
							title: 'Resolution Status',
							type: 'string',
							options: {
								list: [
									{ title: 'Under Review by Sales', value: 'pending' },
									{ title: 'Addressed / Revised Quote Issued', value: 'addressed' },
									{ title: 'Declined (Terms Non-negotiable)', value: 'declined' },
								],
							},
							initialValue: 'pending',
						}),
					],
					preview: {
						select: {
							title: 'customerName',
							subtitle: 'requestedChanges',
							status: 'status',
							date: 'timestamp',
						},
						prepare({ title, subtitle, status, date }) {
							return {
								title: `Revision Request by ${title || 'Buyer'} [${status || 'pending'}]`,
								subtitle: subtitle ? String(subtitle).slice(0, 70) : '',
								media: FiShield,
							}
						},
					},
				},
			],
		}),

		defineField({
			name: 'internalNotes',
			title: 'Export Team Internal Notes (Private)',
			description: 'Confidential commercial notes for sales specialists; never exposed to buyers.',
			type: 'array',
			group: 'notes',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'author', title: 'Author', type: 'string' }),
						defineField({ name: 'note', title: 'Note Content', type: 'text' }),
						defineField({ name: 'timestamp', title: 'Timestamp', type: 'datetime' }),
					],
				},
			],
		}),

		defineField({
			name: 'history',
			title: 'System Audit Trail',
			type: 'array',
			group: 'notes',
			of: [
				{
					type: 'object',
					fields: [
						defineField({ name: 'timestamp', title: 'Timestamp', type: 'datetime' }),
						defineField({ name: 'action', title: 'Action Taken', type: 'string' }),
						defineField({ name: 'user', title: 'User / Agent', type: 'string' }),
					],
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'orderId',
			subtitle: 'customer.name',
			company: 'customer.companyName',
			status: 'quoteStatus',
			fulfillment: 'fulfillmentStatus',
			total: 'pricing.grandTotal',
			currency: 'pricing.currency',
			validUntil: 'quoteValidUntil',
		},
		prepare({ title, subtitle, company, status, fulfillment, total, currency, validUntil }) {
			const curr = currency || 'USD'
			const formattedTotal =
				total !== undefined ? `${curr} ${Number(total).toLocaleString()}` : 'Custom Estimate'
			const party = company ? `${company} (${subtitle || 'Procurement'})` : subtitle || 'Client'
			const st = (status || fulfillment || 'sent').toUpperCase()

			return {
				title: `${title || 'Quote'} — ${party}`,
				subtitle: `[${st}] ${formattedTotal} ${validUntil ? `• Valid: ${new Date(validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`,
				media: FiFileText,
			}
		},
	},
})

