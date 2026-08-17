import { cn } from '@/lib/utils'
import Img from '@/ui/img'

interface GalleryImage {
	_key?: string
	alt: string
	caption?: string
	asset?: any
}

interface ImageGalleryProps {
	title?: string
	layout?: 'grid-2' | 'grid-3' | 'slider'
	images?: GalleryImage[]
}

export default function ImageGallery({
	title,
	layout = 'grid-2',
	images = [],
}: ImageGalleryProps) {
	if (!images || images.length === 0) return null

	const gridCols = {
		'grid-2': 'grid-cols-1 sm:grid-cols-2',
		'grid-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		slider: 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-none',
	}[layout] || 'grid-cols-1 sm:grid-cols-2'

	return (
		<figure className="my-8 space-y-3">
			{title && (
				<strong className="block text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
					{title}
				</strong>
			)}
			<div className={cn('grid gap-4', gridCols)}>
				{images.map((img, idx) => (
					<div
						key={img._key || idx}
						className={cn(
							'group relative overflow-hidden rounded-xl bg-zinc-100 shadow-2xs transition-all hover:shadow-md dark:bg-zinc-800',
							layout === 'slider' && 'w-72 sm:w-80 shrink-0 snap-start',
						)}
					>
						<div className="aspect-4/3 w-full overflow-hidden">
							<Img
								image={img}
								width={600}
								height={450}
								alt={img.alt || 'Gallery image'}
								className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							/>
						</div>
						{img.caption && (
							<div className="p-2.5 text-xs text-zinc-600 dark:text-zinc-400 bg-white/90 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800">
								{img.caption}
							</div>
						)}
					</div>
				))}
			</div>
		</figure>
	)
}
