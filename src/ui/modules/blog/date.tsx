export default function ({ date }: { date?: string }) {
	if (!date) return null

	return <time dateTime={date}>{format(new Date(date + 'T00:00:00'))}</time>
}

const { format } = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
})
