import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getGlobalModules, getPage, getProductSettings } from '@/sanity/lib/queries'
import Loading from '@/ui/loading'
import ModulesResolver from '@/ui/modules'
import Breadcrumbs from '@/ui/modules/breadcrumbs'
import SearchModule from '@/ui/modules/search'

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPage(['search'])
	const { title, description, noIndex } = page?.metadata ?? {}

	return {
		title: title || 'Product Search',
		description: description || 'Search all products and resources across the store',
		robots: {
			index: noIndex ? false : undefined,
		},
	}
}

export default async function SearchPage() {
	const [page, productSettings, globalModules] = await Promise.all([
		getPage(['search']),
		getProductSettings(),
		getGlobalModules('search'),
	])

	const currentPage = {
		_type: 'page',
		title: page?.metadata?.title || page?.title || 'Search',
		...page,
	}

	const searchModuleData = page?.modules?.find(
		(m: any) => m?._type === 'search-module',
	) as any

	const sanityBreadcrumbs = page?.modules?.find(
		(m: any) => m?._type === 'breadcrumbs',
	) as any

	const isSearchHidden = Boolean(
		searchModuleData?.hidden || searchModuleData?.attributes?.hidden,
	)
	const isBreadcrumbsHidden = Boolean(
		sanityBreadcrumbs?.hidden || sanityBreadcrumbs?.attributes?.hidden,
	)

	// Filter out search-module and breadcrumbs from custom modules to prevent duplicates
	const customModules = (page?.modules || []).filter(
		(m: any) => m?._type !== 'search-module' && m?._type !== 'breadcrumbs',
	)

	const topModules = [...(globalModules?.before || [])]
	const bottomModules = [
		...customModules,
		...(globalModules?.after || []),
	]

	return (
		<main className="min-h-screen">
			{/* 1. Breadcrumbs Navigation */}
			{!isBreadcrumbsHidden && (
				<Breadcrumbs
					_type="breadcrumbs"
					crumbs={sanityBreadcrumbs?.crumbs}
					currentPage={currentPage}
				/>
			)}

			{/* 2. Top Global Modules */}
			{topModules.length > 0 && (
				<ModulesResolver
					modules={topModules}
					productSettings={productSettings}
				/>
			)}

			{/* 3. Core Search Module */}
			{!isSearchHidden && (
				<Suspense fallback={<Loading>Loading search...</Loading>}>
					<SearchModule
						_type="search-module"
						intro={searchModuleData?.intro || []}
						scope={searchModuleData?.scope || 'all'}
					/>
				</Suspense>
			)}

			{/* 4. Bottom Modules (Recommendations, Trust logos, FAQs) */}
			{bottomModules.length > 0 && (
				<div className="mt-8">
					<ModulesResolver
						modules={bottomModules}
						productSettings={productSettings}
					/>
				</div>
			)}
		</main>
	)
}
