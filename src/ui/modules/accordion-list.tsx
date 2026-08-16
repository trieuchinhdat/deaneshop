import { PortableText, stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { AccordionList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'

export default function ({
	_key: _module_key,
	intro,
	ctas,
	accordions,
	exclusive,
	enableSchema = true,
	layout: l,
}: AccordionList & { _key: string }) {
	const layout = stegaClean(l)

	return (
		<section
			className={cn(
				'section grid gap-8',
				layout === 'horizontal' && 'items-start md:grid-cols-2',
			)}
			{...(enableSchema && {
				itemScope: true,
				itemType: 'https://schema.org/FAQPage',
			})}
		>
			<div className="rounded-xl bg-white p-2 lg:p-4">
				{intro && (
					<header
						className={cn(
							'prose',
							layout === 'horizontal'
								? 'md:sticky-below-header [--offset:1rem]'
								: 'text-center',
						)}
					>
						<PortableText value={intro} />
						<CTAList ctas={ctas} />
					</header>
				)}

				<div className="mx-auto w-full max-w-3xl">
					{accordions?.map(({ _key, summary, content, open }, index) => (
						<details
							key={_key || `accordion-${index}`}
							className="accordion border-stroke not-last:border-b"
							name={exclusive ? _module_key : undefined}
							open={open}
							itemScope={enableSchema ? true : undefined}
							itemProp={enableSchema ? 'mainEntity' : undefined}
							itemType={enableSchema ? 'https://schema.org/Question' : undefined}
						>
							<summary
								className="py-2 font-bold"
								itemProp={enableSchema ? 'name' : undefined}
							>
								{summary}
							</summary>

							<div
								className="not-supports-[interpolate-size:allow-keywords]:anim-fade-to-b pb-lh"
								itemScope={enableSchema ? true : undefined}
								itemProp={enableSchema ? 'acceptedAnswer' : undefined}
								itemType={enableSchema ? 'https://schema.org/Answer' : undefined}
							>
								<div
									className="prose"
									itemProp={enableSchema ? 'text' : undefined}
								>
									<PortableText value={content ?? []} />
								</div>
							</div>
						</details>
					))}
				</div>
			</div>
		</section>
	)
}
