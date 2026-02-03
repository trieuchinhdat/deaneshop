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
			{...(enableSchema && {
				itemScope: true,
				itemType: 'https://schema.org/HowTo',
			})}
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
						className="gap-ch flex items-start [counter-increment:step]"
						{...(enableSchema && {
							itemScope: true,
							itemProp: 'step',
							itemType: 'https://schema.org/HowToStep',
						})}
						key={step._key}
					>
						<span className="h2 bg-foreground text-background size-8 shrink-0 rounded-full text-center before:content-[counter(step)]" />

						<div className="prose" {...(enableSchema && { itemProp: 'text' })}>
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
