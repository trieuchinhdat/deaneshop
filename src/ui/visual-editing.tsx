import { VisualEditing } from 'next-sanity/visual-editing'
import { sanityStudioUrl } from '@/lib/sanity-studio-url'
import { draftMode } from 'next/headers'
import { SanityLive } from '@/sanity/lib/live'
import HoverDetails from '@/ui/hover-details'
import { isStaticStorefront } from '@/lib/deployment-profile'

export default async function VisualEditingControls() {
	if (isStaticStorefront) return null
	return (
		<>
			<SanityLive />

			{(await draftMode()).isEnabled && (
				<>
					<VisualEditing />

					<HoverDetails className="accordion fixed right-0 bottom-0 bg-amber-200/60 backdrop-blur-xs">
						<summary className="px-4 py-2">🚧 Draft mode</summary>

						<menu className="p-4 pt-0">
							<li>
								<a href="/api/draft-mode/disable" className="link">
									Exit draft mode
								</a>
							</li>
							<li>
								<a href={sanityStudioUrl} className="link">
									Open the Studio
								</a>
							</li>
						</menu>
					</HoverDetails>
				</>
			)}
		</>
	)
}
