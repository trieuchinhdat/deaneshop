import Image from 'next/image'
import { ROUTES } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { BlogCategory, BlogPost, Person } from '@/sanity/types'
import Img from '@/ui/img'
import SanityLink, { type SanityLinkType } from '@/ui/sanity-link'
import Byline from './byline'
import Categories from './categories'
import Date from './date'

export default function ({
	post,
	className,
}: { post: BlogPost } & React.ComponentProps<'li'>) {
	return (
		<li className={cn('relative grid gap-2', className)}>
			<figure className="bg-foreground/5 aspect-video">
				{post.metadata?.image ? (
					<Img
						className="aspect-video w-full object-cover"
						image={post.metadata?.image}
						width={400}
						alt={post.title ?? ''}
					/>
				) : (
					<Image
						src={`/api/og?slug=${ROUTES.blog}/${post.metadata?.slug?.current}&invert=1`}
						className="aspect-video w-full object-cover"
						alt={post.title ?? ''}
						width={400}
						height={(400 * 9) / 16}
					/>
				)}
			</figure>
			<strong className="line-clamp-2 text-xs font-semibold lg:text-sm">
				{post.title}
			</strong>
			<SanityLink
				className="link block"
				link={{ type: 'internal', internal: post } as unknown as SanityLinkType}
			>
				<span className="absolute inset-0" />
			</SanityLink>

			{/* {post.metadata?.description && (
				<p className="line-clamp-3">{post.metadata?.description}</p>
			)} */}

			<div className="flex flex-wrap items-center justify-between gap-x-4 text-xs">
				<Date date={post.publishDate} />
				{/* <Categories categories={post.categories as unknown as BlogCategory[]} /> */}
			</div>

			{/* <Byline author={post.author as unknown as Person} /> */}
		</li>
	)
}
