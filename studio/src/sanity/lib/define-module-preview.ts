import type { ComponentType, ReactNode } from 'react'
import type { PreviewConfig } from 'sanity'
import {
	getFriendlyModuleName,
	MODULE_FRIENDLY_NAMES,
} from './module-preview-config'

export interface DefineModulePreviewOptions<T = any> {
	/**
	 * Unique Sanity schema identifier (e.g. 'comparison-table', 'hero.split', 'tiered-pricing').
	 */
	schemaName: string

	/**
	 * Optional friendly name override. If omitted, resolved from MODULE_FRIENDLY_NAMES.
	 */
	friendlyName?: string

	/**
	 * Candidate title fields ordered by priority.
	 * Default: ['heading', 'title', 'headline', 'intro', 'name']
	 */
	titleFields?: string[]

	/**
	 * Optional image field path for preview (e.g. 'image', 'slides.0.image', 'items.0.image').
	 * If defined and document has no valid image, '(No content)' will appear in subtitle metadata.
	 */
	imageField?: string

	/**
	 * Fallback icon or React component for preview media when image is missing or not configured.
	 */
	icon?: ComponentType<any> | ReactNode

	/**
	 * Additional fields to project into Sanity's preview select object.
	 */
	select?: Record<string, string>

	/**
	 * Optional callback returning additional metadata strings/numbers for the subtitle.
	 * Format: `<meta1> | <meta2>`
	 * Falsy values, empty strings, null, and undefined are automatically omitted.
	 */
	metadata?: (
		selection: T,
	) => Array<string | number | boolean | null | undefined>
}

/**
 * Safely extracts human-readable text from Portable Text block arrays without crashing on drafts.
 */
function extractBlockText(blocks?: any[]): string {
	if (!blocks || !Array.isArray(blocks)) return ''
	return (
		blocks.reduce((acc, block, i) => {
			if (!block || typeof block !== 'object') return acc
			const children = block.children
			if (!Array.isArray(children)) return acc
			const text = children.map((child: any) => child?.text || '').join('')
			return acc + text + (i !== blocks.length - 1 ? ' ' : '')
		}, '') || ''
	)
}

/**
 * Safely extracts human-readable text from a string, number, or Portable Text block array.
 */
function extractTitleText(val: any): string | null {
	if (typeof val === 'string') {
		const trimmed = val.trim()
		return trimmed.length > 0 ? trimmed : null
	}
	if (typeof val === 'number') {
		return String(val)
	}
	if (Array.isArray(val)) {
		try {
			const text = extractBlockText(val)
			const trimmed = text.trim()
			return trimmed.length > 0 ? trimmed : null
		} catch {
			return null
		}
	}
	return null
}

/**
 * Checks whether an image object possesses a valid asset reference, ID, or direct URL.
 */
function hasValidImage(img: any): boolean {
	if (!img || typeof img !== 'object') return false
	if (img.asset) {
		if (typeof img.asset._ref === 'string' && img.asset._ref.trim()) return true
		if (typeof img.asset._id === 'string' && img.asset._id.trim()) return true
		if (typeof img.asset.url === 'string' && img.asset.url.trim()) return true
		return true
	}
	if (typeof img.url === 'string' && img.url.trim()) return true
	if (img._type === 'image' && (img._ref || img.asset)) return true
	return false
}

/**
 * Centralized Module Preview helper for Sanity Studio.
 * Enforces unified formatting across all Page Builder sections and blocks:
 *
 * Title: `[Friendly Module Name] - ${heading || title || 'Untitled'}`
 * Subtitle: `<metadata>` (or omitted if no metadata)
 */
export function defineModulePreview<T = any>(
	options: DefineModulePreviewOptions<T>,
): PreviewConfig {
	const {
		schemaName,
		friendlyName,
		titleFields = ['heading', 'title', 'headline', 'intro', 'name'],
		imageField,
		icon,
		select: customSelect = {},
		metadata,
	} = options

	const resolvedFriendlyName =
		friendlyName || getFriendlyModuleName(schemaName)

	// Build Sanity preview select object
	const select: Record<string, string> = {
		...customSelect,
	}

	titleFields.forEach((field, index) => {
		select[`_t_${index}`] = field
	})

	if (imageField) {
		select._previewImage = imageField
	}

	// Always select hidden flags to support draft & visibility states
	select._hidden = 'hidden'
	select._attrHidden = 'attributes.hidden'

	return {
		select,
		prepare(selection: any = {}) {
			// 1. Resolve Title
			let resolvedTitle: string | null = null
			for (let i = 0; i < titleFields.length; i++) {
				const val = selection[`_t_${i}`] ?? selection[titleFields[i]]
				const extracted = extractTitleText(val)
				if (extracted) {
					resolvedTitle = extracted
					break
				}
			}

			const finalTitleText = resolvedTitle || 'Untitled'
			const title = `[${resolvedFriendlyName}] - ${finalTitleText}`

			// 2. Safe Image Preview & Media Fallback
			let media: any = icon
			let isImageMissing = false

			if (imageField) {
				const rawImage = selection._previewImage
				if (hasValidImage(rawImage)) {
					media = rawImage
				} else {
					isImageMissing = true
				}
			}

			// 3. Metadata & Subtitle
			const metaItems: string[] = []

			if (isImageMissing) {
				metaItems.push('(No content)')
			}

			if (metadata) {
				try {
					const items = metadata(selection) || []
					for (const item of items) {
						if (item === null || item === undefined || item === false) continue
						const str = String(item).trim()
						if (!str) continue
						metaItems.push(str)
					}
				} catch {
					// Guard against runtime metadata evaluation errors in incomplete drafts
				}
			}

			const metaStr = metaItems.join(' | ')
			let subtitle: string | undefined = metaStr.length > 0 ? metaStr : undefined

			const isHidden = Boolean(selection._hidden || selection._attrHidden)
			if (isHidden) {
				subtitle = subtitle ? `[Hidden] ${subtitle}` : '[Hidden]'
			}

			return {
				title,
				subtitle,
				media,
			}
		},
	}
}

export default defineModulePreview
