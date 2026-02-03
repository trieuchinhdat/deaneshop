import { PortableText } from 'next-sanity'
import type { StatList } from '@/sanity/types'

export default function ({ intro, stats }: StatList) {
	return (
		<section className="section space-y-8">
			{intro && (
				<header className="prose text-center">
					<PortableText value={intro} />
				</header>
			)}

			<dl className="mx-auto flex flex-wrap items-start justify-evenly gap-x-4 gap-y-8 max-md:max-w-max max-md:flex-col">
				{stats?.map(({ value, suffix, content = [], _key }) => (
					<div key={_key}>
						<dt className="gap-x-ch flex items-baseline">
							<span className="h0">{value}</span>
							{suffix && <span className="h3">{suffix}</span>}
						</dt>
						{content && (
							<dd className="prose">
								<PortableText value={content} />
							</dd>
						)}
					</div>
				))}
			</dl>
		</section>
	)
}
