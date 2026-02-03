import { count } from '@/lib/utils'

export default function ({
	value,
	...props
}: { value: number } & React.ComponentProps<'span'>) {
	const minutes = Math.ceil(value)

	return <span {...props}>Read time: {count(minutes, 'minute')}</span>
}
