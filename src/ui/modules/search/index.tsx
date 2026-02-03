import { PortableText, stegaClean } from 'next-sanity'
import Link from 'next/link'
import { Suspense } from 'react'
import { FiSearch } from 'react-icons/fi'
import type { SearchModule } from '@/sanity/types'
import Loading from '@/ui/loading'
import AnchoredHeading from '../prose/anchored-heading'
import SearchForm from './search-form'

export default function ({ intro = [], scope }: SearchModule) {
	return (
		<section className="section">
			<div className="space-y-8 rounded-xl bg-white p-2 lg:p-4">
				<header className="prose text-center">
					<PortableText
						value={intro}
						components={{
							block: {
								h1: (node) => <AnchoredHeading as="h1" {...node} />,
								h2: (node) => <AnchoredHeading as="h2" {...node} />,
								h3: (node) => <AnchoredHeading as="h3" {...node} />,
								h4: (node) => <AnchoredHeading as="h4" {...node} />,
								h5: (node) => <AnchoredHeading as="h5" {...node} />,
								h6: (node) => <AnchoredHeading as="h6" {...node} />,
							},
							types: {
								tag: ({ value }) => {
									return (
										<Link
											href={value.href}
											className="border-border text-foreground hover:bg-muted mx-2 inline-flex items-center gap-1 rounded-full border px-5 py-2 text-sm font-medium transition"
										>
											<FiSearch className="h-3.5 w-3.5" />
											<span>{value.label}</span>
										</Link>
									)
								},
							},
						}}
					/>
				</header>

				<Suspense fallback={<Loading>Loading search...</Loading>}>
					<SearchForm scope={stegaClean(scope)} />
				</Suspense>
			</div>
		</section>
	)
}
