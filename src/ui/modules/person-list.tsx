import { PortableText } from 'next-sanity'
import type { Person, PersonList } from '@/sanity/types'
import Img from '@/ui/img'

export default function ({ intro = [], people }: PersonList) {
	return (
		<section className="section space-y-8">
			<header className="prose">
				<PortableText value={intro} />
			</header>

			<ul className="carousel max-md:full-bleed gap-8 pb-2 max-md:px-4">
				{(people as Partial<Person>[])?.map((person, key) => (
					<li key={key}>
						<article className="space-y-8">
							<Img
								className="aspect-square w-full object-cover"
								width={400}
								image={person.image}
								alt={person.name ?? ''}
							/>
							<div className="font-bold">{person.name}</div>
						</article>
					</li>
				))}
			</ul>
		</section>
	)
}
