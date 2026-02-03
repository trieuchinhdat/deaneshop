import { PortableText } from 'next-sanity'
import { cn } from '@/lib/utils'
import type { CardList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import Img from '@/ui/img'

export default function ({ intro = [], cards, ctas, columns }: CardList) {
	return (
		<section className="section space-y-8">
			<div className="rounded-xl bg-white p-2 lg:p-4">
				{intro && (
					<header className="prose text-center">
						<PortableText value={intro} />
					</header>
				)}

				{!!cards?.length && (
					<ul
						className={cn(
							'grid gap-8 md:grid-cols-2',
							columns
								? 'lg:grid-cols-[repeat(var(--columns,1),minmax(0px,1fr))]'
								: 'lg:grid-cols-[repeat(auto-fit,minmax(var(--container-3xs),1fr))]',
						)}
						style={{ '--columns': columns } as React.CSSProperties}
					>
						{cards.map((item) => (
							<li key={item._key} className="prose">
								<Img
									className="aspect-video w-full object-cover"
									image={item.image}
									width={400}
									alt=""
								/>

								<Img
									className="h-12 object-cover"
									image={item.icon}
									width={60}
									alt=""
								/>

								<PortableText value={item.content ?? []} />

								<CTAList ctas={item.ctas} />
							</li>
						))}
					</ul>
				)}

				<CTAList ctas={ctas} className="justify-center" />
			</div>
		</section>
	)
}
