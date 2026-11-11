import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'
import { resolveComplianceAssetUrl } from './outbox'

export interface ResolvedComplianceAsset {
	assetId: string
	title: string
	category: string | null
	fileSize: string | null
	downloadUrl: string | null
}

const PUBLISHED_COMPLIANCE_ASSETS_QUERY = groq`*[
	_type in ['page', 'product', 'global-module']
	&& !(_id in path('drafts.**'))
	&& count(modules[_type == 'compliance-vault']) > 0
]{
	"vaults": modules[_type == 'compliance-vault']{
		gatedDocuments[]{
			_key,
			title,
			category,
			fileSize,
			externalDownloadUrl,
			fileAsset{
				asset->{
					_id,
					url,
					originalFilename
				}
			}
		}
	}
}`

export async function lookupPublishedComplianceAsset(
	assetId: string,
): Promise<ResolvedComplianceAsset | null> {
	const cleanId = typeof assetId === 'string' ? assetId.trim() : ''
	if (!cleanId || cleanId.length > 200) return null

	const docs = await client
		.withConfig({ useCdn: false, perspective: 'published', stega: false })
		.fetch<
			Array<{
				vaults?: Array<{
					gatedDocuments?: Array<{
						_key?: string
						title?: string
						category?: string
						fileSize?: string
						externalDownloadUrl?: string
						fileAsset?: {
							asset?: {
								_id?: string
								url?: string
								originalFilename?: string
							}
						}
					}>
				}>
			}>
		>(PUBLISHED_COMPLIANCE_ASSETS_QUERY)

	for (const doc of docs || []) {
		for (const vault of doc.vaults || []) {
			for (const item of vault.gatedDocuments || []) {
				const matchesKey = item._key && item._key === cleanId
				const matchesAsset = item.fileAsset?.asset?._id && item.fileAsset.asset._id === cleanId
				if (matchesKey || matchesAsset) {
					const rawUrl = item.fileAsset?.asset?.url || item.externalDownloadUrl || null
					const safeUrl = resolveComplianceAssetUrl(rawUrl)
					return {
						assetId: item._key || item.fileAsset?.asset?._id || cleanId,
						title: (item.title || 'Technical Dossier').trim(),
						category: item.category ? String(item.category).trim() : null,
						fileSize: item.fileSize ? String(item.fileSize).trim() : null,
						downloadUrl: safeUrl,
					}
				}
			}
		}
	}

	return null
}

