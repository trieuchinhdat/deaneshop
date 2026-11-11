import { moduleAttributes, type ModuleProps } from '@/ui/modules'
import LeadCaptureFormClient from './lead-capture-form-client'

export interface LeadCaptureFormProps extends ModuleProps {
	badge?: string
	headline?: string
	subtitle?: string
	benefits?: string[]
	fieldOptions?: {
		showName?: boolean
		nameRequired?: boolean
		showEmail?: boolean
		emailRequired?: boolean
		showPhone?: boolean
		phoneRequired?: boolean
		showCompany?: boolean
		companyRequired?: boolean
		showCountry?: boolean
		countryRequired?: boolean
		showBudget?: boolean
		budgetRequired?: boolean
		showMessage?: boolean
		messageRequired?: boolean
		messagePlaceholder?: string
		showConsent?: boolean
		consentRequired?: boolean
		consentText?: string
	}
	ctaText?: string
	ctaSubtext?: string
	leadSource?: string
	successBehavior?: {
		action?: 'message' | 'redirect'
		thankYouHeading?: string
		thankYouMessage?: string
		redirectUrl?: string
	}
	layout?: 'split' | 'card' | 'centered'
	bgStyle?: 'white' | 'slate' | 'gradient' | 'dark'
}

export default function LeadCaptureForm(props: LeadCaptureFormProps) {
	return (
		<section className="w-full my-8 sm:my-12" {...moduleAttributes(props)}>
			<div className="section">
				<LeadCaptureFormClient
					badge={props.badge}
					headline={props.headline}
					subtitle={props.subtitle}
					benefits={props.benefits}
					fieldOptions={props.fieldOptions}
					ctaText={props.ctaText}
					ctaSubtext={props.ctaSubtext}
					leadSource={props.leadSource}
					successBehavior={props.successBehavior}
					layout={props.layout}
					bgStyle={props.bgStyle}
				/>
			</div>
		</section>
	)
}
