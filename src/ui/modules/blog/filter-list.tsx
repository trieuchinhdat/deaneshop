import { groq } from 'next-sanity'
import { sanityFetchLive } from '@/sanity/lib/live'
import Filter from './filter'

export default async function FilterList() {
	const data = await sanityFetchLive<{
		totalPosts: number
		categories: Array<{
			_id: string
			title: string
			slug: { current: string }
			postCount: number
		}>
	}>({
		query: CATEGORIES_SUMMARY_QUERY,
	})

	const { totalPosts, categories } = data || { totalPosts: 0, categories: [] }

	return (
		<div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 scrollbar-none">
			<Filter count={totalPosts}>All Topics</Filter>

			{categories?.map((category) => (
				<Filter
					category={category as any}
					count={category.postCount}
					key={category._id}
				/>
			))}
		</div>
	)
}

const CATEGORIES_SUMMARY_QUERY = groq`{
	'totalPosts': count(*[_type == 'blog.post' && metadata.noIndex != true]),
	'categories': *[
		_type == 'blog.category'
		&& count(*[_type == 'blog.post' && references(^._id) && metadata.noIndex != true]) > 0
	]|order(title){
		_id,
		title,
		slug,
		'postCount': count(*[_type == 'blog.post' && references(^._id) && metadata.noIndex != true])
	}
}`
