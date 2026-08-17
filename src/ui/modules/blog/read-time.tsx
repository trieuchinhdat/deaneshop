export default function ReadTime({
	value = 3,
	...props
}: { value?: number } & React.ComponentProps<'span'>) {
	const minutes = Math.max(1, Math.ceil(value))

	return <span {...props}>{minutes} min read</span>
}
