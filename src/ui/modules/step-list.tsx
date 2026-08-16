import { PortableText } from 'next-sanity'
import type { StepList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'

export default function ({
	intro = [],
	ctas,
	steps,
	enableSchema = true,
}: StepList) {
	return (
		<section
			className="section grid items-start gap-8 md:grid-cols-2"
			itemScope={enableSchema ? true : undefined}
			itemType={enableSchema ? 'https://schema.org/HowTo' : undefined}
		>
			<header className="prose md:sticky-below-header [--offset:1rem]">
				{enableSchema && intro && (
					<div itemProp="name" className="sr-only">
						<PortableText value={intro} />
					</div>
				)}
				<PortableText value={intro} />
				<CTAList ctas={ctas} />
			</header>

			<ol className="grid gap-8">
				{steps?.map((step, index) => (
					<li
						key={step._key || `step-${index}`}
						className="gap-ch flex items-start [counter-increment:step]"
						itemScope={enableSchema ? true : undefined}
						itemProp={enableSchema ? 'step' : undefined}
						itemType={enableSchema ? 'https://schema.org/HowToStep' : undefined}
					>
						<span className="h2 bg-foreground text-background size-8 shrink-0 rounded-full text-center before:content-[counter(step)]" />

						<div className="prose" itemProp={enableSchema ? 'text' : undefined}>
							<PortableText value={step.content ?? []} />
						</div>

						{enableSchema && (
							<meta itemProp="position" content={String(index + 1)} />
						)}
					</li>
				))}
			</ol>
		</section>
	)
}
