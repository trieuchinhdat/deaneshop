'use client'

import { useState, useRef, useTransition } from 'react'
import {
	FiUploadCloud,
	FiDownload,
	FiX,
	FiCheckCircle,
	FiAlertTriangle,
	FiFileText,
	FiCheck,
	FiRotateCw,
	FiAlertCircle,
} from 'react-icons/fi'
import { cn } from '@/lib/utils'

export type ImportType = 'leads' | 'orders'

interface CsvImportModalProps {
	type: ImportType
	isOpen: boolean
	onClose: () => void
	onSuccess: (result: { total: number; success: number; failed: number }) => void
}

interface ParsedLeadRow {
	name: string
	company_name?: string
	email?: string
	phone?: string
	country?: string
	budget_range?: string
	status?: string
	notes?: string
	isValid: boolean
	errorReason?: string
}

interface ParsedOrderRow {
	order_id: string
	carrier?: string
	tracking_code?: string
	fulfillment_status?: string
	notes?: string
	isValid: boolean
	errorReason?: string
}

type ParsedRow = (ParsedLeadRow & { _kind: 'lead' }) | (ParsedOrderRow & { _kind: 'order' })

// Helper to download clean UTF-8 CSV with BOM for Excel/Sheets compatibility
function downloadCsvWithBom(filename: string, content: string) {
	const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.setAttribute('href', url)
	link.setAttribute('download', filename)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

// RFC 4180 compliant CSV Parser
function parseCsvText(text: string): string[][] {
	const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
	const rows: string[][] = []
	let currentRow: string[] = []
	let currentVal = ''
	let inQuotes = false

	for (let i = 0; i < clean.length; i++) {
		const char = clean[i]
		const nextChar = clean[i + 1]

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				currentVal += '"'
				i++ // skip escaped quote
			} else {
				inQuotes = !inQuotes
			}
		} else if (char === ',' && !inQuotes) {
			currentRow.push(currentVal.trim())
			currentVal = ''
		} else if (char === '\n' && !inQuotes) {
			currentRow.push(currentVal.trim())
			if (currentRow.some((c) => c.length > 0)) {
				rows.push(currentRow)
			}
			currentRow = []
			currentVal = ''
		} else {
			currentVal += char
		}
	}

	if (currentVal.length > 0 || currentRow.length > 0) {
		currentRow.push(currentVal.trim())
		if (currentRow.some((c) => c.length > 0)) {
			rows.push(currentRow)
		}
	}

	return rows
}

const TEMPLATE_CONFIGS = {
	leads: {
		title: 'Import B2B Leads',
		badge: 'B2B Lead Engine',
		filename: 'sample_b2b_leads_template.csv',
		description: 'Upload high-ticket prospect inquiries, corporate event leads, or partner registries.',
		sampleContent: [
			'Full Name,Company Name,Email,Phone,Country,Budget Range,Status,Notes',
			'"Alexander Wright","GreenLogistics Corp","alex@greenlogistics.com","+1 555-019-2834","United States","$10,000 - $50,000","new","Inquiry for custom branded eco-packaging"',
			'"Sophie Dubois","Nordic Eco Goods","sophie@nordicretail.dk","+45 32 12 34 56","Denmark","$5,000 - $10,000","new","Interested in wholesale Bamboo Straws"',
			'"Kenji Sato","Tokyo Sustainable Ltd","kenji@tokyo-eco.jp","+81 90 1234 5678","Japan","$25,000 - $100,000","contacted","Requested custom prototype quotation"',
		].join('\n'),
		columnsPreview: ['Full Name', 'Company Name', 'Email', 'Phone', 'Country', 'Status'],
	},
	orders: {
		title: 'Batch Order Fulfillment',
		badge: 'Quotes & Fulfillment',
		filename: 'sample_order_fulfillment_template.csv',
		description: 'Bulk update tracking codes, shipping carriers, and dispatch statuses directly from 3PL / courier files.',
		sampleContent: [
			'Order ID,Carrier,Tracking Code,Fulfillment Status,Fulfillment Notes',
			'"ORD-2026-1042","DHL Express","DHL982341123US","SHIPPING","Dispatched from Central Warehouse Hub"',
			'"ORD-2026-1045","FedEx Priority","FX78945612300","SHIPPING","Handed over to carrier on Monday morning"',
			'"ORD-2026-1048","USPS Ground","9400100000000000000000","DELIVERED","Delivered to recipient front porch"',
		].join('\n'),
		columnsPreview: ['Order ID', 'Carrier', 'Tracking Code', 'Fulfillment Status', 'Notes'],
	},
}

export default function CsvImportModal({
	type,
	isOpen,
	onClose,
	onSuccess,
}: CsvImportModalProps) {
	const config = TEMPLATE_CONFIGS[type]
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
	const [parseError, setParseError] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [progressPct, setProgressPct] = useState<number>(0)
	const [statusMessage, setStatusMessage] = useState<string>('')
	const [failedRows, setFailedRows] = useState<{ row: any; reason: string }[]>([])

	if (!isOpen) return null

	const handleDownloadTemplate = () => {
		downloadCsvWithBom(config.filename, config.sampleContent)
	}

	const handleFileSelect = (file: File) => {
		if (!file.name.toLowerCase().endsWith('.csv')) {
			setParseError('Please upload a standard .csv file format.')
			return
		}
		if (file.size > 10 * 1024 * 1024) {
			setParseError('File size exceeds the 10MB limit. Please split into smaller batches.')
			return
		}

		setSelectedFile(file)
		setParseError(null)
		setFailedRows([])
		setProgressPct(0)
		setStatusMessage('')

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const text = e.target?.result as string
				if (!text) {
					setParseError('The uploaded file is empty.')
					return
				}
				const matrix = parseCsvText(text)
				if (matrix.length < 2) {
					setParseError('File contains no data rows. Expected header + at least 1 record.')
					return
				}

				const headers = matrix[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''))
				const dataRows = matrix.slice(1)

				if (type === 'leads') {
					// Normalize Lead Headers
					const idxName = headers.findIndex((h) => h.includes('name') || h === 'fullname' || h === 'customer')
					const idxCompany = headers.findIndex((h) => h.includes('company') || h.includes('organization'))
					const idxEmail = headers.findIndex((h) => h.includes('email'))
					const idxPhone = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('tel'))
					const idxCountry = headers.findIndex((h) => h.includes('country') || h.includes('region'))
					const idxBudget = headers.findIndex((h) => h.includes('budget'))
					const idxStatus = headers.findIndex((h) => h.includes('status'))
					const idxNotes = headers.findIndex((h) => h.includes('note') || h.includes('message'))

					if (idxName === -1 && idxEmail === -1) {
						setParseError('Missing required header. CSV must have at least "Full Name" or "Email" column.')
						return
					}

					const parsed: ParsedRow[] = dataRows.map((cols, rowIdx) => {
						const name = (idxName !== -1 ? cols[idxName] : '') || ''
						const company_name = (idxCompany !== -1 ? cols[idxCompany] : '') || ''
						const email = (idxEmail !== -1 ? cols[idxEmail] : '') || ''
						const phone = (idxPhone !== -1 ? cols[idxPhone] : '') || ''
						const country = (idxCountry !== -1 ? cols[idxCountry] : '') || ''
						const budget_range = (idxBudget !== -1 ? cols[idxBudget] : '') || ''
						const status = (idxStatus !== -1 ? cols[idxStatus] : '') || 'new'
						const notes = (idxNotes !== -1 ? cols[idxNotes] : '') || ''

						let isValid = true
						let errorReason: string | undefined

						if (!name && !email) {
							isValid = false
							errorReason = 'Missing both Full Name and Email'
						} else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
							isValid = false
							errorReason = 'Invalid email syntax'
						}

						return {
							_kind: 'lead',
							name: name || email.split('@')[0],
							company_name,
							email,
							phone,
							country,
							budget_range,
							status: status.toLowerCase(),
							notes,
							isValid,
							errorReason,
						}
					})

					setParsedRows(parsed)
				} else {
					// Normalize Orders Fulfillment Headers
					const idxOrderId = headers.findIndex(
						(h) => h.includes('orderid') || h.includes('ordernumber') || h === 'order' || h === 'id',
					)
					const idxCarrier = headers.findIndex((h) => h.includes('carrier') || h.includes('shipping') || h.includes('courier'))
					const idxTracking = headers.findIndex((h) => h.includes('tracking') || h.includes('trackingcode') || h.includes('waybill'))
					const idxStatus = headers.findIndex((h) => h.includes('status') || h.includes('fulfillment'))
					const idxNotes = headers.findIndex((h) => h.includes('note') || h.includes('comment'))

					if (idxOrderId === -1) {
						setParseError('Missing required header. CSV must include an "Order ID" column.')
						return
					}

					const parsed: ParsedRow[] = dataRows.map((cols) => {
						const order_id = (idxOrderId !== -1 ? cols[idxOrderId] : '') || ''
						const carrier = (idxCarrier !== -1 ? cols[idxCarrier] : '') || ''
						const tracking_code = (idxTracking !== -1 ? cols[idxTracking] : '') || ''
						let fulfillment_status = (idxStatus !== -1 ? cols[idxStatus] : '') || ''
						const notes = (idxNotes !== -1 ? cols[idxNotes] : '') || ''

						let isValid = true
						let errorReason: string | undefined

						if (!order_id) {
							isValid = false
							errorReason = 'Missing Order ID'
						} else if (!tracking_code && !fulfillment_status && !carrier) {
							isValid = false
							errorReason = 'Must provide at least Carrier, Tracking Code, or Status'
						}

						// Normalize default status to SHIPPING if tracking code is present
						if (!fulfillment_status && tracking_code) {
							fulfillment_status = 'SHIPPING'
						} else if (fulfillment_status) {
							fulfillment_status = fulfillment_status.toUpperCase() === 'SHIPPED' ? 'SHIPPING' : fulfillment_status.toUpperCase()
						}

						return {
							_kind: 'order',
							order_id,
							carrier,
							tracking_code,
							fulfillment_status,
							notes,
							isValid,
							errorReason,
						}
					})

					setParsedRows(parsed)
				}
			} catch (err: any) {
				setParseError(err?.message || 'Failed to parse CSV file. Ensure valid RFC 4180 formatting.')
			}
		}
		reader.readAsText(file, 'utf-8')
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFileSelect(e.dataTransfer.files[0])
		}
	}

	const validCount = parsedRows.filter((r) => r.isValid).length
	const invalidCount = parsedRows.length - validCount

	const handleExecuteImport = async () => {
		const validRows = parsedRows.filter((r) => r.isValid)
		if (validRows.length === 0) return

		setIsProcessing(true)
		setProgressPct(0)
		setStatusMessage('Initiating batch upload...')

		const CHUNK_SIZE = 50
		const totalChunks = Math.ceil(validRows.length / CHUNK_SIZE)
		let totalSuccess = 0
		let totalFailed = 0
		const failures: { row: any; reason: string }[] = []

		const batchSessionId =
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
				? crypto.randomUUID()
				: `${Date.now()}`

		for (let i = 0; i < totalChunks; i++) {
			const chunk = validRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
			setStatusMessage(`Processing batch ${i + 1} of ${totalChunks} (${chunk.length} records)...`)

			try {
				const res = await fetch('/api/admin/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						type,
						records: chunk,
						importKey: `imp:${batchSessionId}:${i}`,
					}),
				})
				const data = await res.json().catch(() => ({}))

				if (res.ok && data.success) {
					totalSuccess += data.importedCount ?? 0
					if (Array.isArray(data.failedRecords)) {
						totalFailed += data.failedRecords.length
						failures.push(...data.failedRecords)
					}
				} else {
					totalFailed += chunk.length
					chunk.forEach((row) => {
						failures.push({ row, reason: data.message || 'Batch rejected by server' })
					})
				}
			} catch (err: any) {
				totalFailed += chunk.length
				chunk.forEach((row) => {
					failures.push({ row, reason: err?.message || 'Network error during batch sync' })
				})
			}

			const pct = Math.round(((i + 1) / totalChunks) * 100)
			setProgressPct(pct)
		}

		setIsProcessing(false)
		setFailedRows(failures)

		if (totalSuccess > 0) {
			setStatusMessage(`Successfully imported ${totalSuccess} records!`)
			onSuccess({ total: validRows.length, success: totalSuccess, failed: totalFailed })
		} else {
			setStatusMessage('Import failed. Please check the error details below.')
		}
	}

	const handleExportFailures = () => {
		if (failedRows.length === 0) return
		const headers = ['Record Identifier', 'Failure Reason']
		const rows = failedRows.map((f) => [
			`"${(f.row?.order_id || f.row?.name || f.row?.email || 'Unknown').replace(/"/g, '""')}"`,
			`"${(f.reason || '').replace(/"/g, '""')}"`,
		])
		const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
		downloadCsvWithBom(`import_errors_${type}_${Date.now()}.csv`, csvContent)
	}

	const handleReset = () => {
		setSelectedFile(null)
		setParsedRows([])
		setParseError(null)
		setFailedRows([])
		setProgressPct(0)
		setStatusMessage('')
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
				{/* Top Modal Header */}
				<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold shadow-xs shrink-0">
							<FiUploadCloud className="h-5 w-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
									{config.title}
								</h3>
								<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700">
									{config.badge}
								</span>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								{config.description}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isProcessing}
						className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
					>
						<FiX className="h-5 w-5" />
					</button>
				</div>

				{/* Modal Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-5">
					{/* Sample File Download Banner */}
					<div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 transition">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
									<FiFileText className="h-5 w-5" />
								</div>
								<div>
									<h4 className="text-xs sm:text-sm font-bold text-slate-900">
										Need the standard format template?
									</h4>
									<p className="text-xs text-slate-600 mt-0.5 font-medium">
										Download the sample file to your computer.
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleDownloadTemplate}
								className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white border border-blue-300 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 hover:text-blue-900"
							>
								<FiDownload className="h-3.5 w-3.5" />
								<span>Download Sample File</span>
							</button>
						</div>
					</div>

					{/* File Dropzone or Selected File Display */}
					{!selectedFile ? (
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
							className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition hover:border-slate-500 hover:bg-slate-50 cursor-pointer"
						>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv"
								className="hidden"
								onChange={(e) => {
									if (e.target.files && e.target.files[0]) {
										handleFileSelect(e.target.files[0])
									}
								}}
							/>
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 group-hover:scale-110 transition duration-200 text-slate-600">
								<FiUploadCloud className="h-6 w-6" />
							</div>
							<p className="mt-3 text-sm font-bold text-slate-800">
								Click to upload or drag & drop CSV file
							</p>
							<p className="mt-1 text-xs text-slate-500">
								Supports standard UTF-8 CSV with headers (Max 10MB)
							</p>
						</div>
					) : (
						<div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3 min-w-0">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
										<FiFileText className="h-5 w-5" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-black text-slate-900 truncate">
											{selectedFile.name}
										</p>
										<p className="text-xs text-slate-500 font-mono">
											{(selectedFile.size / 1024).toFixed(1)} KB • {parsedRows.length} total rows parsed
										</p>
									</div>
								</div>

								{!isProcessing && (
									<button
										type="button"
										onClick={handleReset}
										className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
									>
										Change File
									</button>
								)}
							</div>
						</div>
					)}

					{/* Parse Error Box */}
					{parseError && (
						<div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
							<FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
							<div>
								<span className="font-bold">File Format Error: </span>
								{parseError}
							</div>
						</div>
					)}

					{/* Preview & Validation Summary */}
					{parsedRows.length > 0 && !parseError && (
						<div className="space-y-3">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
									Pre-Import Validation Preview
								</h4>
								<div className="flex items-center gap-2">
									<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
										<FiCheck className="h-3 w-3" /> {validCount} Ready
									</span>
									{invalidCount > 0 && (
										<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
											<FiAlertCircle className="h-3 w-3" /> {invalidCount} Invalid (will skip)
										</span>
									)}
								</div>
							</div>

							{/* Preview Table */}
							<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
								<table className="w-full text-left text-xs">
									<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
										<tr>
											<th className="py-2.5 px-3 w-12 text-center">Status</th>
											{type === 'leads' ? (
												<>
													<th className="py-2.5 px-3">Name</th>
													<th className="py-2.5 px-3">Company</th>
													<th className="py-2.5 px-3">Email</th>
													<th className="py-2.5 px-3">Phone</th>
													<th className="py-2.5 px-3">Lead Status</th>
												</>
											) : (
												<>
													<th className="py-2.5 px-3">Order ID</th>
													<th className="py-2.5 px-3">Carrier</th>
													<th className="py-2.5 px-3">Tracking Code</th>
													<th className="py-2.5 px-3">Fulfillment Status</th>
												</>
											)}
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 font-medium text-slate-700">
										{parsedRows.slice(0, 5).map((row, idx) => (
											<tr key={idx} className={cn(!row.isValid && 'bg-rose-50/50')}>
												<td className="py-2 px-3 text-center">
													{row.isValid ? (
														<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
															<FiCheck className="h-3 w-3" />
														</span>
													) : (
														<span
															title={row.errorReason}
															className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 cursor-help"
														>
															<FiX className="h-3 w-3" />
														</span>
													)}
												</td>
												{row._kind === 'lead' ? (
													<>
														<td className="py-2 px-3 font-bold text-slate-900">{row.name || '—'}</td>
														<td className="py-2 px-3 text-slate-600">{row.company_name || '—'}</td>
														<td className="py-2 px-3 font-mono text-slate-600">{row.email || '—'}</td>
														<td className="py-2 px-3 font-mono text-slate-600">{row.phone || '—'}</td>
														<td className="py-2 px-3">
															<span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
																{row.status || 'new'}
															</span>
														</td>
													</>
												) : (
													<>
														<td className="py-2 px-3 font-bold font-mono text-slate-900">{row.order_id}</td>
														<td className="py-2 px-3">{row.carrier || '—'}</td>
														<td className="py-2 px-3 font-mono text-blue-700">{row.tracking_code || '—'}</td>
														<td className="py-2 px-3">
															<span
																className={cn(
																	'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
																	row.fulfillment_status === 'DELIVERED'
																		? 'bg-emerald-100 text-emerald-800'
																		: 'bg-blue-100 text-blue-800',
																)}
															>
																{row.fulfillment_status || 'SHIPPED'}
															</span>
														</td>
													</>
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{parsedRows.length > 5 && (
								<p className="text-[11px] text-slate-400 italic text-right">
									Showing first 5 of {parsedRows.length} total rows parsed
								</p>
							)}
						</div>
					)}

					{/* Progress and Execution Status */}
					{isProcessing && (
						<div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="flex items-center justify-between text-xs font-bold text-slate-700">
								<span className="flex items-center gap-1.5">
									<FiRotateCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
									{statusMessage}
								</span>
								<span>{progressPct}%</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full bg-emerald-500 transition-all duration-300"
									style={{ width: `${progressPct}%` }}
								/>
							</div>
						</div>
					)}

					{/* Completion Summary & Failure Report */}
					{!isProcessing && statusMessage && (
						<div
							className={cn(
								'rounded-2xl p-4 text-xs font-medium border flex items-center justify-between',
								failedRows.length > 0
									? 'bg-amber-50 border-amber-200 text-amber-900'
									: 'bg-emerald-50 border-emerald-200 text-emerald-900',
							)}
						>
							<div className="flex items-center gap-2">
								{failedRows.length > 0 ? (
									<FiAlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
								) : (
									<FiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
								)}
								<span>{statusMessage}</span>
							</div>

							{failedRows.length > 0 && (
								<button
									type="button"
									onClick={handleExportFailures}
									className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition cursor-pointer"
								>
									<FiDownload className="h-3 w-3" />
									<span>Download Error Log ({failedRows.length})</span>
								</button>
							)}
						</div>
					)}
				</div>

				{/* Modal Footer Controls */}
				<div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						disabled={isProcessing}
						className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="button"
						onClick={handleExecuteImport}
						disabled={isProcessing || validCount === 0}
						className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isProcessing ? (
							<>
								<FiRotateCw className="h-3.5 w-3.5 animate-spin" />
								<span>Syncing Data...</span>
							</>
						) : (
							<>
								<FiCheck className="h-3.5 w-3.5" />
								<span>Start Import ({validCount} records)</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
