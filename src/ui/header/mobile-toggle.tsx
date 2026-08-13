import { VscChromeClose, VscMenu } from 'react-icons/vsc'

export default function () {
	return (
		<label className="rounded-lg text-xl md:hidden cursor-pointer" aria-label="Toggle navigation menu">
			<input id="header-open" type="checkbox" hidden />

			<VscMenu className="header-open:hidden" title="Open menu" />
			<VscChromeClose className="header-not-open:hidden" title="Close menu" />
		</label>
	)
}
