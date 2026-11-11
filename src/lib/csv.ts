const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

export interface CsvCellOptions {
	preserveLeadingZero?: boolean
}

export function formatCsvCell(value: unknown, options: CsvCellOptions = {}): string {
	if (value === null || value === undefined) return '""'
	if (value instanceof Date) {
		return `"${Number.isFinite(value.getTime()) ? value.toISOString() : ''}"`
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? String(value) : '""'
	}
	if (typeof value === 'boolean') {
		return value ? 'TRUE' : 'FALSE'
	}

	let str = String(value)
	// Neutralize spreadsheet formula prefixes (=, +, -, @, tab, CR) in untrusted text
	if (FORMULA_PREFIX_RE.test(str)) {
		str = `'${str}`
	} else if (options.preserveLeadingZero && /^0\d+$/.test(str)) {
		str = `'${str}`
	}

	return `"${str.replace(/"/g, '""')}"`
}

export function serializeCsv(
	headers: string[],
	rows: Array<Array<unknown | { value: unknown; preserveLeadingZero?: boolean }>>,
): string {
	const headerLine = headers.map((h) => formatCsvCell(h)).join(',')
	const dataLines = rows.map((row) =>
		row
			.map((cell) => {
				if (cell && typeof cell === 'object' && !(cell instanceof Date) && 'value' in cell) {
					const typed = cell as { value: unknown; preserveLeadingZero?: boolean }
					return formatCsvCell(typed.value, { preserveLeadingZero: typed.preserveLeadingZero })
				}
				return formatCsvCell(cell)
			})
			.join(','),
	)
	return [headerLine, ...dataLines].join('\r\n')
}

export function parseCsv(text: string): string[][] {
	const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
	const rows: string[][] = []
	let row: string[] = []
	let cell = ''
	let inQuotes = false

	for (let i = 0; i < clean.length; i++) {
		const ch = clean[i]
		const next = clean[i + 1]
		if (inQuotes) {
			if (ch === '"' && next === '"') {
				cell += '"'
				i++
			} else if (ch === '"') {
				inQuotes = false
			} else {
				cell += ch
			}
		} else if (ch === '"') {
			inQuotes = true
		} else if (ch === ',') {
			row.push(cell)
			cell = ''
		} else if (ch === '\n') {
			row.push(cell)
			rows.push(row)
			row = []
			cell = ''
		} else {
			cell += ch
		}
	}

	if (cell.length > 0 || row.length > 0) {
		row.push(cell)
		rows.push(row)
	}
	return rows
}

