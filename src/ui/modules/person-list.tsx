import { PortableText, stegaClean } from 'next-sanity'
import { Users } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { PersonList } from '@/sanity/types'
import CTAList from '@/ui/cta-list'
import { moduleAttributes, type ModuleProps } from '.'
import PersonListClient, { type PersonItemData } from './person-list-client'

export type EnhancedPersonListProps = PersonList &
	ModuleProps & {
		_key?: string
		badge?: string
		layout?: 'grid' | 'carousel' | 'featured' | 'compact'
		columns?: 2 | 3 | 4
		mobileLayout?: 'carousel' | 'stack' | 'grid-2'
		headerAlign?: 'center' | 'left'
		textAlign?: 'left' | 'center'
		cardStyle?: 'card' | 'elevated' | 'minimal' | 'glass'
		imageAspectRatio?: '3/4' | '1/1' | 'circle' | '4/3'
		imageEffect?: 'color' | 'grayscale'
		showBio?: boolean
		bioLength?: 'clamp-3' | 'clamp-5' | 'full'
		showSocial?: boolean
		enableFilter?: boolean
		spacing?: 'default' | 'compact' | 'spacious' | 'none'
		ctas?: any[]
		sanityAttr?: any
	}

export default function PersonListModule({
	intro = [],
	people = [],
	badge,
	layout = 'grid',
	columns = 3,
	mobileLayout = 'carousel',
	headerAlign = 'center',
	textAlign = 'left',
	cardStyle = 'card',
	imageAspectRatio = '3/4',
	imageEffect = 'color',
	showBio = true,
	bioLength = 'clamp-3',
	showSocial = true,
	enableFilter = false,
	spacing = 'default',
	ctas,
	sanityAttr,
	_key,
	...props
}: EnhancedPersonListProps) {
	const headingId = useId()

	// Stega clean all configuration values for deterministic UI rendering
	const stegaBadge = stegaClean(badge)
	const stegaLayout = (stegaClean(layout) || 'grid') as
		| 'grid'
		| 'carousel'
		| 'featured'
		| 'compact'
	const stegaColumns = (Number(stegaClean(columns)) || 3) as 2 | 3 | 4
	const stegaMobileLayout = (stegaClean(mobileLayout) || 'carousel') as
		| 'carousel'
		| 'stack'
		| 'grid-2'
	const stegaHeaderAlign = (stegaClean(headerAlign) || 'center') as
		| 'center'
		| 'left'
	const stegaTextAlign = (stegaClean(textAlign) || 'left') as 'left' | 'center'
	const stegaCardStyle = (stegaClean(cardStyle) || 'card') as
		| 'card'
		| 'elevated'
		| 'minimal'
		| 'glass'
	const stegaAspectRatio = (stegaClean(imageAspectRatio) || '3/4') as
		| '3/4'
		| '1/1'
		| 'circle'
		| '4/3'
	const stegaImageEffect = (stegaClean(imageEffect) || 'color') as
		| 'color'
		| 'grayscale'
	const stegaShowBio = stegaClean(showBio) !== false
	const stegaBioLength = (stegaClean(bioLength) || 'clamp-3') as
		| 'clamp-3'
		| 'clamp-5'
		| 'full'
	const stegaShowSocial = stegaClean(showSocial) !== false
	const stegaEnableFilter = Boolean(stegaClean(enableFilter))
	const stegaSpacing = (stegaClean(spacing) || 'default') as
		| 'default'
		| 'compact'
		| 'spacious'
		| 'none'

	const isLeftAligned = stegaHeaderAlign === 'left'

	// Spacing variation classes
	const spacingClasses =
		{
			compact: 'py-8 sm:py-12 md:py-14',
			default: 'py-12 sm:py-16 md:py-20',
			spacious: 'py-16 sm:py-24 md:py-28',
			none: 'py-0',
		}[stegaSpacing] || 'py-12 sm:py-16 md:py-20'

	// Normalize people array from references or inline definitions
	const normalizedPeople: PersonItemData[] = ((people as any[]) || [])
		.filter((item: any) => Boolean(item && item.name))
		.map(
			(item: any, idx: number): PersonItemData => ({
				_id: item._id,
				_key: item._key || item._id || `person-${idx}`,
				name: item.name,
				role: item.role,
				credentials: item.credentials,
				department: item.department,
				image: item.image,
				shortBio: item.shortBio,
				socialLinks: item.socialLinks,
			}),
		)

	// Studio empty state when no team members exist
	if (!normalizedPeople || normalizedPeople.length === 0) {
		return (
			<section
				className={cn('section', spacingClasses)}
				{...moduleAttributes({ _key, ...props })}
			>
				<div className="border-border/80 bg-muted/20 mx-auto max-w-2xl space-y-3 rounded-3xl border-2 border-dashed p-8 text-center sm:p-12">
					<div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-2xl">
						<Users className="size-6" aria-hidden="true" />
					</div>
					<h3 className="text-foreground text-base font-bold sm:text-lg">
						Leadership & Experts
					</h3>
					<p className="text-muted-foreground mx-auto max-w-md text-xs sm:text-sm">
						No team members selected yet. Click this section in Sanity Studio to link executive profiles or create inline team member cards.
					</p>
				</div>
			</section>
		)
	}

	const hasHeader =
		Boolean(stegaBadge) ||
		(Array.isArray(intro) && intro.length > 0)

	// Build Sanity Studio Visual Editing map for individual member cards
	const sanityAttrMap = sanityAttr
		? normalizedPeople.reduce<Record<string, string>>((acc, person) => {
				if (person._key) {
					try {
						acc[person._key] = sanityAttr
							.scope(`people[_key=="${person._key}"]`)
							.toString()
					} catch {
						// Ignore visual editing scoping errors gracefully
					}
				}
				return acc
			}, {})
		: undefined

	return (
		<section
			aria-labelledby={hasHeader ? headingId : undefined}
			className={cn('section space-y-8 sm:space-y-12', spacingClasses)}
			{...moduleAttributes({ _key, ...props })}
		>
			{/* Section Header */}
			{hasHeader && (
				<header
					className={cn(
						'flex flex-col gap-3.5',
						isLeftAligned
							? 'max-w-3xl text-left'
							: 'mx-auto max-w-3xl items-center text-center',
					)}
				>
					{/* Eyebrow Badge Pill */}
					{stegaBadge && (
						<div className="inline-flex">
							<span className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold tracking-wider uppercase">
								<Users className="size-3.5" aria-hidden="true" />
								<span>{stegaBadge}</span>
							</span>
						</div>
					)}

					{/* Rich Text Heading & Intro Copy */}
					{intro && intro.length > 0 && (
						<div
							id={headingId}
							className="prose prose-base sm:prose-lg dark:prose-invert text-muted-foreground max-w-3xl leading-relaxed"
						>
							<PortableText value={intro} />
						</div>
					)}
				</header>
			)}

			{/* Interactive Presentation Client (Grid, Carousel, Spotlight, Directory, Filtering) */}
			<PersonListClient
				people={normalizedPeople}
				layout={stegaLayout}
				columns={stegaColumns}
				mobileLayout={stegaMobileLayout}
				cardStyle={stegaCardStyle}
				imageAspectRatio={stegaAspectRatio}
				imageEffect={stegaImageEffect}
				textAlign={stegaTextAlign}
				showBio={stegaShowBio}
				bioLength={stegaBioLength}
				showSocial={stegaShowSocial}
				enableFilter={stegaEnableFilter}
				sanityAttrMap={sanityAttrMap}
			/>

			{/* Bottom Call to Actions */}
			{ctas && ctas.length > 0 && (
				<div
					className={cn(
						'flex pt-4 sm:pt-6',
						isLeftAligned ? 'justify-start' : 'justify-center',
					)}
				>
					<CTAList ctas={ctas} />
				</div>
			)}
		</section>
	)
}
