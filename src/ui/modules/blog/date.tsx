const formatter = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'medium',
})

export default function DateComponent({ date }: { date?: string }) {
	if (!date) return null

	try {
		const parsedDate = date.includes('T')
			? new Date(date)
			: new Date(`${date}T00:00:00Z`)

		if (isNaN(parsedDate.getTime())) {
			return <time dateTime={date}>{date}</time>
		}

		return <time dateTime={date}>{formatter.format(parsedDate)}</time>
	} catch {
		return <time dateTime={date}>{date}</time>
	}
}

