import { cn } from '@/lib/utils'
import { getSite } from '@/sanity/lib/queries'
import type { Cta } from '@/sanity/types'
import CTAListHeader from '@/ui/cta-list-header'
import Logo from '@/ui/logo'
import Announcement from './announcement'
import css from './header.module.css'
import MobileToggle from './mobile-toggle'
import Navigation from './navigation'
import Wrapper from './wrapper'

export default async function () {
	const site = await getSite()

	return (
		<>
			<Announcement data={site?.announcements} />
			<Wrapper className="bg-header text-header-foreground max-md:header-open:shadow-xl sticky top-0 z-10 shadow-sm">
				<div className={cn(css.root, 'section grid items-center gap-x-4 p-4')}>
					<div className="flex items-center justify-between gap-4 [grid-area:top] has-[img]:h-[2lh]">
						<MobileToggle />
						<Logo className="max-w-[220px] grow has-[img]:-my-2 has-[img]:h-[2lh] max-md:text-center" />
						<CTAListHeader
							ctas={site?.ctas as Cta[]}
							className="[grid-area:ctas] lg:hidden"
						/>
					</div>

					<Navigation />

					<CTAListHeader
						ctas={site?.ctas as Cta[]}
						className="[grid-area:ctas] max-md:hidden *:max-md:w-full"
					/>
				</div>
			</Wrapper>
		</>
		// New header design
		// <Wrapper className="bg-background/80 sticky top-0 z-10 backdrop-blur">
		// 	<div className="header_root__BaDRv section px-2">
		// 		<div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center">
		// 			<div className="flex items-center">
		// 				<MobileToggle />
		// 			</div>

		// 			<div className="flex justify-center">
		// 				<Logo className="h-14" />
		// 			</div>

		// 			<div className="flex justify-end gap-3">
		// 				<CTAList ctas={site?.ctas as Cta[]} />
		// 			</div>
		// 		</div>

		// 		{/* Overlay */}
		// 		<Navigation />
		// 	</div>
		// </Wrapper>
	)
}
