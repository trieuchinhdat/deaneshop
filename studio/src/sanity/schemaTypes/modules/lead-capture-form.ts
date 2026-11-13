import { defineArrayMember, defineField, defineType } from 'sanity'
import { EnvelopeIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'lead-capture-form',
	title: 'RFQ & Lead Form',
	description:
		'High-converting opt-in & RFQ quotation form with customizable input fields, value propositions, and direct lead pipeline integration.',
	type: 'object',
	icon: EnvelopeIcon,
	initialValue: () => ({
		badge: 'Fast Response Guarantee',
		headline: 'Request Your Free Quote & Consultation',
		subtitle:
			'Fill out the form below and one of our dedicated commercial specialists will connect with you within 24 business hours to discuss your project.',
		benefits: [
			'Fast turnaround with 24-hour response guarantee',
			'Tailored quotation matching your exact business specifications',
			'Completely free with zero purchase obligation',
			'Strict confidentiality & non-disclosure protection',
		],
		fieldOptions: {
			showName: true,
			nameRequired: true,
			showEmail: true,
			emailRequired: true,
			showPhone: true,
			phoneRequired: false,
			showCompany: true,
			companyRequired: false,
			showCountry: false,
			countryRequired: false,
			showBudget: false,
			budgetRequired: false,
			showMessage: true,
			messageRequired: false,
			messagePlaceholder:
				'Tell us about your requirements, specifications, or questions...',
			showConsent: false,
			consentRequired: true,
			consentText:
				'I agree to receive communications regarding this inquiry and accept the Privacy Policy.',
		},
		ctaText: 'Request Free Quote',
		ctaSubtext: '100% confidential. Strict privacy and zero spam guarantee.',
		layout: 'split',
		bgStyle: 'slate',
		successBehavior: {
			action: 'message',
			thankYouHeading: 'Thank you! We received your request.',
			thankYouMessage:
				'A representative will review your inquiry and reach out within 24 hours. Check your inbox for confirmation.',
		},
	}),
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'fields', title: 'Form Fields' },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fieldsets: [
		{
			name: 'headerInfo',
			title: 'Header & Copywriting',
			options: { columns: 1 },
		},
		{
			name: 'ctaSettings',
			title: 'Submission Button & Trust Micro-Copy',
			options: { columns: 1 },
		},
	],
	fields: [
		defineField({
			name: 'attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
		defineField({
			name: 'badge',
			title: 'Header Badge (Optional)',
			description: 'E.g., "Fast Response Guarantee" or "Wholesale Inquiry"',
			type: 'string',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'headline',
			title: 'Form Headline',
			description: 'Main heading visible to prospective clients and buyers.',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: 'Request Your Free Quote & Consultation',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'subtitle',
			title: 'Subtitle / Value Proposition',
			description:
				'Supporting copy explaining the response turnaround, process, or benefits.',
			type: 'text',
			rows: 2,
			initialValue:
				'Fill out the form below and one of our dedicated specialists will connect with you within 24 hours to discuss your project.',
			group: 'content',
			fieldset: 'headerInfo',
		}),
		defineField({
			name: 'benefits',
			title: 'Value Proposition Bullets (Split Layout)',
			description:
				'List of key guarantees and selling points displayed alongside the form in split layout.',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			initialValue: [
				'Fast turnaround with 24-hour response guarantee',
				'Tailored solution matching your exact business needs',
				'Completely free with zero purchase obligation',
				'Strict privacy & zero spam policy',
			],
			group: 'content',
		}),

		// Tab: Form Fields
		defineField({
			name: 'fieldOptions',
			title: 'Input Fields Configuration',
			description:
				'Toggle and customize input fields to capture the right level of buyer data.',
			type: 'object',
			group: 'fields',
			fieldsets: [
				{
					name: 'contactFields',
					title: 'Primary Contact Fields',
					options: { columns: 1 },
				},
				{
					name: 'businessFields',
					title: 'Business & RFQ Qualification Fields',
					options: { columns: 1 },
				},
				{
					name: 'messageField',
					title: 'Project Notes & Inquiries',
					options: { columns: 1 },
				},
				{
					name: 'complianceFields',
					title: 'Legal & Consent Options',
					options: { columns: 1 },
				},
			],
			fields: [
				// Name
				defineField({
					name: 'showName',
					title: 'Name Field Active',
					type: 'boolean',
					initialValue: true,
					fieldset: 'contactFields',
				}),
				defineField({
					name: 'nameRequired',
					title: 'Name Required',
					type: 'boolean',
					initialValue: true,
					hidden: ({ parent }) => !parent?.showName,
					fieldset: 'contactFields',
				}),

				// Email
				defineField({
					name: 'showEmail',
					title: 'Email Field Active',
					type: 'boolean',
					initialValue: true,
					fieldset: 'contactFields',
				}),
				defineField({
					name: 'emailRequired',
					title: 'Email Required',
					type: 'boolean',
					initialValue: true,
					hidden: ({ parent }) => !parent?.showEmail,
					fieldset: 'contactFields',
				}),

				// Phone
				defineField({
					name: 'showPhone',
					title: 'Phone / WhatsApp Active',
					type: 'boolean',
					initialValue: true,
					fieldset: 'contactFields',
				}),
				defineField({
					name: 'phoneRequired',
					title: 'Phone Required',
					type: 'boolean',
					initialValue: false,
					hidden: ({ parent }) => !parent?.showPhone,
					fieldset: 'contactFields',
				}),

				// Company
				defineField({
					name: 'showCompany',
					title: 'Company / Organization Active',
					type: 'boolean',
					initialValue: true,
					fieldset: 'businessFields',
				}),
				defineField({
					name: 'companyRequired',
					title: 'Company Required',
					type: 'boolean',
					initialValue: false,
					hidden: ({ parent }) => !parent?.showCompany,
					fieldset: 'businessFields',
				}),

				// Country / Destination Region
				defineField({
					name: 'showCountry',
					title: 'Country / Region Field Active',
					description:
						'Useful for international shipping quotes, export inquiries, and geolocation.',
					type: 'boolean',
					initialValue: false,
					fieldset: 'businessFields',
				}),
				defineField({
					name: 'countryRequired',
					title: 'Country / Region Required',
					type: 'boolean',
					initialValue: false,
					hidden: ({ parent }) => !parent?.showCountry,
					fieldset: 'businessFields',
				}),

				// Budget / Volume Tier
				defineField({
					name: 'showBudget',
					title: 'Budget / Order Volume Field Active',
					description:
						'Captures estimated project budget or batch quantity to qualify high-value leads.',
					type: 'boolean',
					initialValue: false,
					fieldset: 'businessFields',
				}),
				defineField({
					name: 'budgetRequired',
					title: 'Budget / Volume Required',
					type: 'boolean',
					initialValue: false,
					hidden: ({ parent }) => !parent?.showBudget,
					fieldset: 'businessFields',
				}),

				// Message
				defineField({
					name: 'showMessage',
					title: 'Message / Project Notes Active',
					type: 'boolean',
					initialValue: true,
					fieldset: 'messageField',
				}),
				defineField({
					name: 'messageRequired',
					title: 'Message Required',
					type: 'boolean',
					initialValue: false,
					hidden: ({ parent }) => !parent?.showMessage,
					fieldset: 'messageField',
				}),
				defineField({
					name: 'messagePlaceholder',
					title: 'Message Placeholder Text',
					type: 'string',
					initialValue:
						'Tell us about your requirements, specifications, or questions...',
					hidden: ({ parent }) => !parent?.showMessage,
					fieldset: 'messageField',
				}),

				// Consent / GDPR
				defineField({
					name: 'showConsent',
					title: 'GDPR / Privacy Consent Checkbox Active',
					description:
						'Adds a mandatory or optional consent checkbox compliant with UK GDPR & CCPA.',
					type: 'boolean',
					initialValue: false,
					fieldset: 'complianceFields',
				}),
				defineField({
					name: 'consentRequired',
					title: 'Consent Mandatory to Submit',
					type: 'boolean',
					initialValue: true,
					hidden: ({ parent }) => !parent?.showConsent,
					fieldset: 'complianceFields',
				}),
				defineField({
					name: 'consentText',
					title: 'Consent Statement Copy',
					type: 'string',
					initialValue:
						'I agree to receive communications regarding this inquiry and accept the Privacy Policy.',
					hidden: ({ parent }) => !parent?.showConsent,
					fieldset: 'complianceFields',
				}),
			],
		}),

		// CTA Button
		defineField({
			name: 'ctaText',
			title: 'Submit Button Text',
			description:
				'Primary action label, e.g., "Request Free Quote" or "Submit RFQ".',
			type: 'string',
			validation: (Rule) => Rule.required(),
			initialValue: 'Request Free Quote',
			group: 'content',
			fieldset: 'ctaSettings',
		}),
		defineField({
			name: 'ctaSubtext',
			title: 'Trust Subtext Below Button',
			description: 'E.g., "100% confidential. Strict privacy and zero spam."',
			type: 'string',
			initialValue:
				'100% confidential. Strict privacy and zero spam guarantee.',
			group: 'content',
			fieldset: 'ctaSettings',
		}),

		// Tab: Design
		defineField({
			name: 'layout',
			title: 'Visual Layout',
			description: 'Select how the form and copywriting are arranged.',
			type: 'string',
			options: {
				list: [
					{
						title: 'Split (Copy & Bullets Left + Form Right - Recommended)',
						value: 'split',
					},
					{
						title: 'Contained Card (Centered Framed Box)',
						value: 'card',
					},
					{
						title: 'Centered Minimal (Hero Header + Streamlined Form)',
						value: 'centered',
					},
				],
				layout: 'radio',
			},
			initialValue: 'split',
			group: 'design',
		}),
		defineField({
			name: 'bgStyle',
			title: 'Container Background Tone',
			description:
				'Color theme and elevation scheme for the module container.',
			type: 'string',
			options: {
				list: [
					{ title: 'Subtle Slate Gray (Professional Neutral)', value: 'slate' },
					{ title: 'Clean Light / White', value: 'white' },
					{ title: 'Brand Gradient Subtle', value: 'gradient' },
					{ title: 'Dark Premium (High Contrast)', value: 'dark' },
				],
			},
			initialValue: 'slate',
			group: 'design',
		}),

		// Tab: Settings
		defineField({
			name: 'leadSource',
			title: 'Lead Source Identifier (Optional)',
			description:
				'Custom campaign or funnel identifier saved in CRM/leads database. Defaults to "lead_capture_form".',
			type: 'string',
			placeholder: 'e.g., wholesale_rfq_q1',
			group: 'settings',
		}),
		defineField({
			name: 'successBehavior',
			title: 'Submission Success Behavior',
			type: 'object',
			group: 'settings',
			fields: [
				defineField({
					name: 'action',
					title: 'On Submit Action',
					type: 'string',
					options: {
						list: [
							{ title: 'Display Thank You Message', value: 'message' },
							{
								title: 'Redirect to Thank You Page / Custom URL',
								value: 'redirect',
							},
						],
						layout: 'radio',
					},
					initialValue: 'message',
				}),
				defineField({
					name: 'thankYouHeading',
					title: 'Thank You Heading',
					type: 'string',
					initialValue: 'Thank you! We received your request.',
					hidden: ({ parent }) => parent?.action === 'redirect',
				}),
				defineField({
					name: 'thankYouMessage',
					title: 'Thank You Message',
					type: 'text',
					rows: 3,
					initialValue:
						'A representative will review your inquiry and reach out within 24 hours. Check your inbox for confirmation.',
					hidden: ({ parent }) => parent?.action === 'redirect',
				}),
				defineField({
					name: 'redirectUrl',
					title: 'Redirect Destination URL',
					type: 'string',
					placeholder: '/thank-you',
					hidden: ({ parent }) => parent?.action !== 'redirect',
					validation: (Rule) =>
						Rule.custom((value, context: any) => {
							if (context.parent?.action === 'redirect' && !value) {
								return 'Please provide a redirect URL.'
							}
							return true
						}),
				}),
			],
		}),
	],
	preview: defineModulePreview({
		schemaName: 'lead-capture-form',
		icon: EnvelopeIcon,
		titleFields: ['headline', 'badge'],
		select: {
			layout: 'layout',
			badge: 'badge',
			bgStyle: 'bgStyle',
		},
		metadata: (doc) => [
			doc.layout ? `Layout: ${doc.layout}` : 'Layout: split',
			doc.bgStyle ? `Theme: ${doc.bgStyle}` : null,
			doc.badge || null,
		],
	}),
})
