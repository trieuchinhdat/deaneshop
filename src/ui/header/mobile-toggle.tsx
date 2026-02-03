import { VscChromeClose, VscMenu } from 'react-icons/vsc'

export default function () {
	return (
		<label className="rounded-lg text-xl md:hidden">
			<input id="header-open" type="checkbox" hidden />

			<VscMenu className="header-open:hidden" title="Open" />
			<VscChromeClose className="header-not-open:hidden" title="Close" />
		</label>

		// New mobile toggle design
		// <label className="relative flex cursor-pointer items-center">
		// 	<input id="header-open" type="checkbox" className="peer hidden" />

		// 	{/* Open icon */}
		// 	<VscMenu className="text-xl peer-checked:hidden" title="Open menu" />

		// 	{/* Close icon */}
		// 	<VscChromeClose
		// 		className="hidden text-xl peer-checked:block"
		// 		title="Close menu"
		// 	/>
		// </label>
	)
}
