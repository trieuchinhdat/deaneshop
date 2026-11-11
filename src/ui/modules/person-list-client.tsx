'use client'

import {
	ChevronLeft,
	ChevronRight,
	ExternalLink,
	User,
	X,
} from 'lucide-react'
import Link from 'next/link'
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode,
} from 'react'
import {
	FiFacebook,
	FiGithub,
	FiGlobe,
	FiInstagram,
	FiLinkedin,
	FiMail,
	FiYoutube,
} from 'react-icons/fi'
import { SiX } from 'react-icons/si'
import { cn } from '@/lib/utils'
import Img from '@/ui/img'

export interface PersonSocialLink {
	_key?: string
	platform?: string
	url?: string
}

export interface PersonItemData {
	_id?: string
	_key?: string
	name?: string
	role?: string
	credentials?: string
	department?: string
	image?: any
	shortBio?: string
	socialLinks?: PersonSocialLink[]
}

interface PersonListClientProps {
	people: PersonItemData[]
	layout?: 'grid' | 'carousel' | 'featured' | 'compact'
	columns?: number
	mobileLayout?: 'carousel' | 'stack' | 'grid-2'
	cardStyle?: 'card' | 'elevated' | 'minimal' | 'glass'
	imageAspectRatio?: '3/4' | '1/1' | 'circle' | '4/3'
	imageEffect?: 'color' | 'grayscale'
	textAlign?: 'left' | 'center'
	showBio?: boolean
	bioLength?: 'clamp-3' | 'clamp-5' | 'full'
	showSocial?: boolean
	enableFilter?: boolean
	sanityAttrMap?: Record<string, string>
}

function renderSocialIcon(platform?: string) {
	const p = platform?.toLowerCase().trim()
	switch (p) {
		case 'linkedin':
			return <FiLinkedin className="size-4" aria-hidden="true" />
		case 'twitter':
		case 'x':
			return <SiX className="size-3.5" aria-hidden="true" />
		case 'github':
			return <FiGithub className="size-4" aria-hidden="true" />
		case 'email':
		case 'mail':
			return <FiMail className="size-4" aria-hidden="true" />
		case 'instagram':
			return <FiInstagram className="size-4" aria-hidden="true" />
		case 'facebook':
			return <FiFacebook className="size-4" aria-hidden="true" />
		case 'youtube':
			return <FiYoutube className="size-4" aria-hidden="true" />
		case 'website':
		case 'portfolio':
		default:
			return <FiGlobe className="size-4" aria-hidden="true" />
	}
}

function getPlatformLabel(platform?: string): string {
	const p = platform?.toLowerCase().trim()
	switch (p) {
		case 'linkedin':
			return 'LinkedIn'
		case 'twitter':
		case 'x':
			return 'X (Twitter)'
		case 'github':
			return 'GitHub'
		case 'email':
		case 'mail':
			return 'Email'
		case 'instagram':
			return 'Instagram'
		case 'facebook':
			return 'Facebook'
		case 'youtube':
			return 'YouTube'
		default:
			return 'Website'
	}
}

export default function PersonListClient({
	people = [],
	layout = 'grid',
	columns = 3,
	mobileLayout = 'carousel',
	cardStyle = 'card',
	imageAspectRatio = '3/4',
	imageEffect = 'color',
	textAlign = 'left',
	showBio = true,
	bioLength = 'clamp-3',
	showSocial = true,
	enableFilter = false,
	sanityAttrMap,
}: PersonListClientProps) {
	const carouselId = useId()
	const [activeDepartment, setActiveDepartment] = useState<string>('All')
	const [modalPerson, setModalPerson] = useState<PersonItemData | null>(null)

	// Carousel navigation state
	const scrollRef = useRef<HTMLDivElement>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(true)

	// Extract unique non-empty departments for filtering
	const departments = useMemo(() => {
		const depts = new Set<string>()
		people.forEach((p) => {
			if (p.department && p.department.trim().length > 0) {
				depts.add(p.department.trim())
			}
		})
		if (depts.size <= 1) return []
		return ['All', ...Array.from(depts)]
	}, [people])

	// Filter people based on active department
	const filteredPeople = useMemo(() => {
		if (!enableFilter || activeDepartment === 'All') {
			return people
		}
		return people.filter(
			(p) =>
				p.department &&
				p.department.trim().toLowerCase() === activeDepartment.toLowerCase(),
		)
	}, [people, activeDepartment, enableFilter])

	// Carousel bounds tracking
	const checkScrollBounds = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const tolerance = 6
		const atLeft = el.scrollLeft <= tolerance
		const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance

		setCanScrollLeft(!atLeft)
		setCanScrollRight(!atRight)
	}, [])

	useEffect(() => {
		const el = scrollRef.current
		if (!el) return

		checkScrollBounds()
		el.addEventListener('scroll', checkScrollBounds, { passive: true })
		window.addEventListener('resize', checkScrollBounds)

		return () => {
			el.removeEventListener('scroll', checkScrollBounds)
			window.removeEventListener('resize', checkScrollBounds)
		}
	}, [checkScrollBounds, filteredPeople])

	const scrollPrev = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 280)
		el.scrollBy({ left: -scrollDistance, behavior: 'smooth' })
	}

	const scrollNext = () => {
		const el = scrollRef.current
		if (!el) return
		const scrollDistance = Math.max(el.clientWidth * 0.75, 280)
		el.scrollBy({ left: scrollDistance, behavior: 'smooth' })
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault()
			scrollPrev()
		} else if (e.key === 'ArrowRight') {
			e.preventDefault()
			scrollNext()
		}
	}

	const isDesktopCarousel = layout === 'carousel'
	const isMobileCarousel = mobileLayout === 'carousel'
	const isFeatured = layout === 'featured'
	const isCompact = layout === 'compact'
	const isCentered = textAlign === 'center'

	// Desktop column classes for grid layout
	const gridColsClass =
		{
			2: 'sm:grid-cols-2',
			3: 'sm:grid-cols-2 lg:grid-cols-3',
			4: 'sm:grid-cols-2 lg:grid-cols-4',
		}[columns] || 'sm:grid-cols-2 lg:grid-cols-3'

	// Mobile layout classes
	const mobileLayoutClass =
		mobileLayout === 'grid-2'
			? 'max-sm:grid max-sm:grid-cols-2 max-sm:gap-3.5'
			: mobileLayout === 'stack'
				? 'max-sm:flex max-sm:flex-col max-sm:gap-5'
				: 'max-sm:flex max-sm:overflow-x-auto max-sm:pb-4 max-sm:snap-x max-sm:snap-mandatory max-sm:gap-4 no-scrollbar'

	// Card visual style classes
	const cardStyleClass =
		{
			card: 'border border-border/70 bg-surface dark:bg-zinc-900/80 shadow-2xs hover:border-primary/50 hover:shadow-md',
			elevated:
				'border border-border/40 bg-surface dark:bg-zinc-900 shadow-md hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40',
			minimal:
				'border border-transparent bg-muted/40 dark:bg-zinc-800/40 hover:bg-muted/70',
			glass:
				'border border-border/50 bg-surface/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-2xs hover:border-primary/40',
		}[cardStyle] ||
		'border border-border/70 bg-surface dark:bg-zinc-900/80 shadow-2xs'

	// Image aspect ratio container classes
	const aspectClass =
		{
			'3/4': 'aspect-[3/4]',
			'1/1': 'aspect-square',
			circle: 'aspect-square rounded-full overflow-hidden mx-auto max-w-[220px]',
			'4/3': 'aspect-[4/3]',
		}[imageAspectRatio] || 'aspect-[3/4]'

	// Image hover effect classes
	const imageFilterClass =
		imageEffect === 'grayscale'
			? 'grayscale contrast-105 group-hover:grayscale-0 transition-all duration-500'
			: 'transition-transform duration-500 group-hover:scale-105'

	// Bio clamping classes
	const bioClampClass =
		{
			'clamp-3': 'line-clamp-3',
			'clamp-5': 'line-clamp-5',
			full: 'whitespace-pre-line',
		}[bioLength] || 'line-clamp-3'

	// Render member card
	const renderMemberCard = (
		person: PersonItemData,
		idx: number,
		isSpotlight = false,
	) => {
		const key = person._key || person._id || `person-${idx}`
		const initial = person.name ? person.name.charAt(0).toUpperCase() : 'E'
		const sanityAttr = sanityAttrMap?.[key]
		const hasLongBio =
			Boolean(person.shortBio) &&
			person.shortBio!.length > 150 &&
			bioLength !== 'full'

		if (isCompact) {
			return (
				<li
					key={key}
					data-sanity={sanityAttr}
					className={cn(
						'group flex flex-col justify-between rounded-2xl p-4 transition-all duration-300',
						cardStyleClass,
						isCentered ? 'items-center text-center' : 'items-start text-left',
					)}
				>
					<div className="flex w-full items-center gap-4">
						{/* Compact Avatar */}
						<div
							className={cn(
								'relative shrink-0 overflow-hidden rounded-xl bg-muted/50 size-14 sm:size-16',
								imageAspectRatio === 'circle' && 'rounded-full',
							)}
						>
							{person.image?.asset ? (
								<Img
									className="h-full w-full object-cover object-top"
									width={160}
									image={person.image}
									alt={person.name || 'Member profile'}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-xl font-bold">
									{initial}
								</div>
							)}
						</div>

						{/* Info */}
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-1.5">
								<h3 className="truncate text-sm sm:text-base font-bold text-foreground">
									{person.name}
								</h3>
								{person.credentials && (
									<span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
										{person.credentials}
									</span>
								)}
							</div>

							{person.role && (
								<p className="truncate text-xs font-semibold text-primary/90 mt-0.5">
									{person.role}
								</p>
							)}

							{person.department && (
								<p className="truncate text-[11px] text-muted-foreground mt-0.5">
									{person.department}
								</p>
							)}
						</div>
					</div>

					{/* Social Links */}
					{showSocial && person.socialLinks && person.socialLinks.length > 0 && (
						<div className="mt-3 flex w-full items-center gap-1.5 pt-3 border-t border-border/40">
							{person.socialLinks.map((link, lIdx) => {
								if (!link.url) return null
								const isEmail = link.platform?.toLowerCase() === 'email'
								const href =
									isEmail && !link.url.startsWith('mailto:')
										? `mailto:${link.url}`
										: link.url
								const platformTitle = getPlatformLabel(link.platform)

								return (
									<Link
										key={link._key || lIdx}
										href={href}
										target={isEmail ? undefined : '_blank'}
										rel={isEmail ? undefined : 'noopener noreferrer'}
										className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
										aria-label={`Connect with ${person.name || 'member'} on ${platformTitle}`}
										title={platformTitle}
									>
										{renderSocialIcon(link.platform)}
									</Link>
								)
							})}
						</div>
					)}
				</li>
			)
		}

		if (isSpotlight) {
			return (
				<li
					key={key}
					data-sanity={sanityAttr}
					className={cn(
						'group mb-8 sm:mb-12 rounded-3xl p-6 sm:p-10 transition-all duration-300',
						cardStyleClass,
					)}
				>
					<div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 items-center">
						{/* Spotlight Portrait */}
						<div className="md:col-span-5">
							<div
								className={cn(
									'relative overflow-hidden rounded-2xl bg-muted/40 w-full',
									aspectClass,
								)}
							>
								{person.image?.asset ? (
									<Img
										className={cn(
											'h-full w-full object-cover object-top',
											imageFilterClass,
										)}
										width={600}
										image={person.image}
										alt={person.name || 'Executive leader'}
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-5xl font-black">
										{initial}
									</div>
								)}
							</div>
						</div>

						{/* Spotlight Content */}
						<div className="md:col-span-7 flex flex-col justify-center space-y-4">
							<div className="flex flex-wrap items-center gap-2">
								{person.department && (
									<span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
										{person.department}
									</span>
								)}
								{person.credentials && (
									<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
										{person.credentials}
									</span>
								)}
							</div>

							<div>
								<h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
									{person.name}
								</h3>
								{person.role && (
									<p className="text-sm sm:text-base font-semibold text-primary mt-1">
										{person.role}
									</p>
								)}
							</div>

							{showBio && person.shortBio && (
								<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
									{person.shortBio}
								</p>
							)}

							{/* Social Links */}
							{showSocial && person.socialLinks && person.socialLinks.length > 0 && (
								<div className="pt-2 flex items-center gap-2">
									{person.socialLinks.map((link, lIdx) => {
										if (!link.url) return null
										const isEmail = link.platform?.toLowerCase() === 'email'
										const href =
											isEmail && !link.url.startsWith('mailto:')
												? `mailto:${link.url}`
												: link.url
										const platformTitle = getPlatformLabel(link.platform)

										return (
											<Link
												key={link._key || lIdx}
												href={href}
												target={isEmail ? undefined : '_blank'}
												rel={isEmail ? undefined : 'noopener noreferrer'}
												className="flex size-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
												aria-label={`Connect with ${person.name || 'member'} on ${platformTitle}`}
												title={platformTitle}
											>
												{renderSocialIcon(link.platform)}
											</Link>
										)
									})}
								</div>
							)}
						</div>
					</div>
				</li>
			)
		}

		// Standard Card
		return (
			<li
				key={key}
				data-sanity={sanityAttr}
				className={cn(
					'group flex flex-col justify-between rounded-3xl p-5 sm:p-6 transition-all duration-300',
					cardStyleClass,
					isDesktopCarousel && 'w-[280px] sm:w-[320px] shrink-0 snap-start',
					!isDesktopCarousel &&
						isMobileCarousel &&
						'max-sm:w-[260px] max-sm:shrink-0 max-sm:snap-start',
					isCentered ? 'items-center text-center' : 'items-start text-left',
				)}
			>
				<div className="w-full">
					{/* Portrait Photo */}
					<div
						className={cn(
							'relative mb-4 sm:mb-5 overflow-hidden rounded-2xl bg-muted/40 w-full',
							aspectClass,
						)}
					>
						{person.image?.asset ? (
							<Img
								className={cn(
									'h-full w-full object-cover object-top',
									imageFilterClass,
								)}
								width={480}
								image={person.image}
								alt={person.name || 'Team member'}
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-3xl font-black">
								{initial}
							</div>
						)}

						{/* Subtle Department Tag Overlay (optional) */}
						{person.department && !isCentered && (
							<div className="absolute top-3 left-3 z-10">
								<span className="rounded-full bg-surface/90 px-2.5 py-0.5 text-[10px] font-bold text-foreground shadow-2xs backdrop-blur-xs">
									{person.department}
								</span>
							</div>
						)}
					</div>

					{/* Name & Credentials */}
					<div
						className={cn(
							'flex flex-wrap items-center gap-1.5',
							isCentered && 'justify-center',
						)}
					>
						<h3 className="text-base sm:text-lg font-bold text-foreground">
							{person.name}
						</h3>
						{person.credentials && (
							<span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
								{person.credentials}
							</span>
						)}
					</div>

					{/* Role */}
					{person.role && (
						<p className="text-xs sm:text-sm font-semibold text-primary/95 mt-0.5">
							{person.role}
						</p>
					)}

					{/* Bio */}
					{showBio && person.shortBio && (
						<div className="mt-2.5">
							<p
								className={cn(
									'text-xs sm:text-sm text-muted-foreground leading-relaxed',
									bioClampClass,
								)}
							>
								{person.shortBio}
							</p>
							{hasLongBio && (
								<button
									type="button"
									onClick={() => setModalPerson(person)}
									className="mt-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xs"
								>
									Read full bio
								</button>
							)}
						</div>
					)}
				</div>

				{/* Social Profile Links */}
				{showSocial && person.socialLinks && person.socialLinks.length > 0 && (
					<div
						className={cn(
							'mt-5 flex items-center gap-2 pt-4 border-t border-border/40 w-full',
							isCentered ? 'justify-center' : 'justify-start',
						)}
					>
						{person.socialLinks.map((link, lIdx) => {
							if (!link.url) return null
							const isEmail = link.platform?.toLowerCase() === 'email'
							const href =
								isEmail && !link.url.startsWith('mailto:')
									? `mailto:${link.url}`
									: link.url
							const platformTitle = getPlatformLabel(link.platform)

							return (
								<Link
									key={link._key || lIdx}
									href={href}
									target={isEmail ? undefined : '_blank'}
									rel={isEmail ? undefined : 'noopener noreferrer'}
									className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
									aria-label={`Connect with ${person.name || 'member'} on ${platformTitle}`}
									title={platformTitle}
								>
									{renderSocialIcon(link.platform)}
								</Link>
							)
						})}
					</div>
				)}
			</li>
		)
	}

	return (
		<>
			{/* Department Filter Tabs */}
			{enableFilter && departments.length > 1 && (
				<div
					role="tablist"
					aria-label="Filter leadership by department"
					className="flex flex-wrap items-center justify-center gap-2 pb-6 sm:pb-8"
				>
					{departments.map((dept) => {
						const isSelected = activeDepartment === dept
						return (
							<button
								key={dept}
								type="button"
								role="tab"
								aria-selected={isSelected}
								onClick={() => setActiveDepartment(dept)}
								className={cn(
									'rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200',
									'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
									isSelected
										? 'bg-primary text-primary-foreground shadow-xs'
										: 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								{dept}
							</button>
						)
					})}
				</div>
			)}

			{/* Spotlight Presentation: Featured Leader First */}
			{isFeatured && filteredPeople.length > 0 && (
				<ul className="list-none p-0 m-0">
					{renderMemberCard(filteredPeople[0], 0, true)}
				</ul>
			)}

			{/* Main Grid / Carousel Container */}
			<div className="group/carousel relative">
				{/* Desktop Carousel Navigation: Previous */}
				{isDesktopCarousel && (
					<button
						type="button"
						onClick={scrollPrev}
						disabled={!canScrollLeft}
						aria-label="Previous members"
						className={cn(
							'absolute top-1/2 -left-3.5 z-20 -translate-y-1/2 sm:-left-5',
							'size-10 items-center justify-center rounded-full sm:size-11',
							'border-border/80 bg-surface/95 text-foreground border shadow-md backdrop-blur-md',
							'hover:bg-surface transition-all duration-200 hover:scale-105 active:scale-95',
							'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
							'disabled:pointer-events-none disabled:opacity-0',
							!canScrollLeft && 'pointer-events-none opacity-0',
							'hidden sm:flex',
						)}
					>
						<ChevronLeft className="size-5" />
					</button>
				)}

				{/* Cards Track */}
				<div
					ref={scrollRef}
					tabIndex={isDesktopCarousel || isMobileCarousel ? 0 : undefined}
					role={isDesktopCarousel || isMobileCarousel ? 'region' : undefined}
					aria-roledescription={
						isDesktopCarousel || isMobileCarousel ? 'carousel' : undefined
					}
					aria-label="Leadership team members"
					onKeyDown={isDesktopCarousel ? handleKeyDown : undefined}
					className={cn(
						'outline-none',
						isDesktopCarousel && [
							'flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory no-scrollbar',
							'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:rounded-2xl',
						],
					)}
				>
					<ul
						className={cn(
							'list-none p-0 m-0',
							// If desktop is carousel: flex row
							isDesktopCarousel && 'flex gap-6',
							// If desktop is not carousel: responsive grid
							!isDesktopCarousel && [
								'grid gap-6 sm:gap-8',
								gridColsClass,
								mobileLayoutClass,
							],
						)}
					>
						{(isFeatured
							? filteredPeople.slice(1)
							: filteredPeople
						).map((person, idx) =>
							renderMemberCard(person, isFeatured ? idx + 1 : idx, false),
						)}
					</ul>
				</div>

				{/* Desktop Carousel Navigation: Next */}
				{isDesktopCarousel && (
					<button
						type="button"
						onClick={scrollNext}
						disabled={!canScrollRight}
						aria-label="Next members"
						className={cn(
							'absolute top-1/2 -right-3.5 z-20 -translate-y-1/2 sm:-right-5',
							'size-10 items-center justify-center rounded-full sm:size-11',
							'border-border/80 bg-surface/95 text-foreground border shadow-md backdrop-blur-md',
							'hover:bg-surface transition-all duration-200 hover:scale-105 active:scale-95',
							'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
							'disabled:pointer-events-none disabled:opacity-0',
							!canScrollRight && 'pointer-events-none opacity-0',
							'hidden sm:flex',
						)}
					>
						<ChevronRight className="size-5" />
					</button>
				)}
			</div>

			{/* Full Biography Modal */}
			{modalPerson && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
					onClick={() => setModalPerson(null)}
					role="dialog"
					aria-modal="true"
					aria-labelledby="person-bio-modal-title"
				>
					<div
						className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-2xl transition-all dark:bg-zinc-900"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => setModalPerson(null)}
							aria-label="Close biography modal"
							className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none"
						>
							<X className="size-4" />
						</button>

						<h3
							id="person-bio-modal-title"
							className="text-xl sm:text-2xl font-bold text-foreground"
						>
							{modalPerson.name}
						</h3>

						<div className="mt-1 flex flex-wrap items-center gap-2">
							{modalPerson.role && (
								<p className="text-sm font-semibold text-primary">
									{modalPerson.role}
								</p>
							)}
							{modalPerson.credentials && (
								<span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
									{modalPerson.credentials}
								</span>
							)}
							{modalPerson.department && (
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
									{modalPerson.department}
								</span>
							)}
						</div>

						<div className="mt-4 pt-4 border-t border-border/60">
							<p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
								{modalPerson.shortBio}
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
