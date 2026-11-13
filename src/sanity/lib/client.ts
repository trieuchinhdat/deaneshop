import { sanityStudioUrl } from '@/lib/sanity-studio-url'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
	stega: {
		studioUrl: sanityStudioUrl,
		filter: (props) => {
			const sourcePathStr = props.sourcePath.join('.')
			if (
				sourcePathStr.includes('theme') ||
				sourcePathStr.includes('color') ||
				sourcePathStr.includes('spacing') ||
				sourcePathStr.includes('padding') ||
				sourcePathStr.includes('font') ||
				sourcePathStr.includes('preset') ||
				sourcePathStr.includes('radius') ||
				sourcePathStr.includes('maxWidth') ||
				sourcePathStr.includes('scrollReveal') ||
				sourcePathStr.includes('appearance')
			) {
				return false
			}

			const lastPath = String(props.sourcePath.at(-1) || '')
			const designAndSettingsFields = [
				'layout',
				'themeStyle',
				'theme',
				'columns',
				'columnsDesktop',
				'rowsDesktop',
				'rowsMobile',
				'uid',
				'bgStyle',
				'containerStyle',
				'cardStyle',
				'actionType',
				'style',
				'size',
				'sourceType',
				'headingLevel',
				'loading',
				'onRight',
				'afterContent',
				'tableOfContents',
				'highlightedColumnIndex',
				'exclusive',
				'enableSchema',
				'autoSlide',
				'autoScroll',
				'duration',
				'scrollThreshold',
				'fallbackHours',
				'limit',
				'itemsPerPage',
				'minQty',
				'maxQty',
				'unitPrice',
				'discountPercent',
				'incoterm',
				'currency',
				'scrollReveal',
				'scrollRevealSpeed',
				'scrollRevealOffset',
			]
			if (designAndSettingsFields.includes(lastPath)) {
				return false
			}
			return props.filterDefault(props)
		},
	},
})
