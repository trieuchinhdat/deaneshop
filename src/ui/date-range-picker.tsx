'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	FiArrowRight,
	FiCalendar,
	FiCheck,
	FiChevronLeft,
	FiChevronRight,
	FiX,
} from 'react-icons/fi'

export interface DateRange {
	startDate: Date | null
	endDate: Date | null
	preset?: string
}

export interface DateRangePickerProps {
	value?: DateRange
	onChange?: (range: DateRange) => void
	onApply?: (range: DateRange) => void
	onCancel?: () => void
	align?: 'left' | 'right'
	inline?: boolean
	className?: string
	buttonClassName?: string
}

interface PresetOption {
	id: string
	label: string
	getRange: () => { startDate: Date; endDate: Date }
}

// Date helpers
function startOfDay(d: Date): Date {
	const res = new Date(d)
	res.setHours(0, 0, 0, 0)
	return res
}

function endOfDay(d: Date): Date {
	const res = new Date(d)
	res.setHours(23, 59, 59, 999)
	return res
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
	if (!d1 || !d2) return false
	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	)
}

function isBetweenDays(date: Date, start: Date | null, end: Date | null): boolean {
	if (!start || !end) return false
	const t = date.getTime()
	const s = startOfDay(start).getTime()
	const e = endOfDay(end).getTime()
	return t > s && t < e
}

function formatDateInput(d: Date | null): string {
	if (!d) return ''
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDateDisplay(d: Date | null): string {
	if (!d) return 'Select date'
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DateRangePicker({
	value,
	onChange,
	onApply,
	onCancel,
	align = 'left',
	inline = false,
	className = '',
	buttonClassName = '',
}: DateRangePickerProps) {
	// Controlled / Uncontrolled state
	const defaultInitialRange = useMemo<DateRange>(() => {
		const now = new Date()
		const past30 = new Date(now)
		past30.setDate(now.getDate() - 29)
		return {
			startDate: startOfDay(past30),
			endDate: endOfDay(now),
			preset: 'last_30_days',
		}
	}, [])

	const [confirmedRange, setConfirmedRange] = useState<DateRange>(value || defaultInitialRange)
	const [isOpen, setIsOpen] = useState(inline)

	// In-modal draft states
	const [tempStart, setTempStart] = useState<Date | null>(confirmedRange.startDate)
	const [tempEnd, setTempEnd] = useState<Date | null>(confirmedRange.endDate)
	const [tempPreset, setTempPreset] = useState<string | undefined>(confirmedRange.preset)
	const [hoverDate, setHoverDate] = useState<Date | null>(null)

	// Calendar View (month & year)
	const initialViewDate = confirmedRange.endDate || confirmedRange.startDate || new Date()
	const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth())
	const [viewYear, setViewYear] = useState(initialViewDate.getFullYear())

	// Text input buffers for manual typing
	const [startInputText, setStartInputText] = useState(formatDateInput(tempStart))
	const [endInputText, setEndInputText] = useState(formatDateInput(tempEnd))

	const containerRef = useRef<HTMLDivElement>(null)

	// Sync when external value prop changes
	useEffect(() => {
		if (value) {
			setConfirmedRange(value)
			setTempStart(value.startDate)
			setTempEnd(value.endDate)
			setTempPreset(value.preset)
			setStartInputText(formatDateInput(value.startDate))
			setEndInputText(formatDateInput(value.endDate))
			if (value.endDate || value.startDate) {
				const d = value.endDate || value.startDate!
				setViewMonth(d.getMonth())
				setViewYear(d.getFullYear())
			}
		}
	}, [value])

	// Presets definition (Strictly English as requested)
	const PRESETS = useMemo<PresetOption[]>(() => {
		return [
			{
				id: 'today',
				label: 'Today',
				getRange: () => {
					const now = new Date()
					return { startDate: startOfDay(now), endDate: endOfDay(now) }
				},
			},
			{
				id: 'yesterday',
				label: 'Yesterday',
				getRange: () => {
					const y = new Date()
					y.setDate(y.getDate() - 1)
					return { startDate: startOfDay(y), endDate: endOfDay(y) }
				},
			},
			{
				id: 'last_7_days',
				label: 'Last 7 Days',
				getRange: () => {
					const end = new Date()
					const start = new Date(end)
					start.setDate(end.getDate() - 6)
					return { startDate: startOfDay(start), endDate: endOfDay(end) }
				},
			},
			{
				id: 'last_30_days',
				label: 'Last 30 Days',
				getRange: () => {
					const end = new Date()
					const start = new Date(end)
					start.setDate(end.getDate() - 29)
					return { startDate: startOfDay(start), endDate: endOfDay(end) }
				},
			},
			{
				id: 'this_month',
				label: 'This Month',
				getRange: () => {
					const now = new Date()
					const start = new Date(now.getFullYear(), now.getMonth(), 1)
					const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
					return { startDate: startOfDay(start), endDate: endOfDay(end) }
				},
			},
			{
				id: 'last_month',
				label: 'Last Month',
				getRange: () => {
					const now = new Date()
					const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
					const end = new Date(now.getFullYear(), now.getMonth(), 0)
					return { startDate: startOfDay(start), endDate: endOfDay(end) }
				},
			},
			{
				id: 'all_time',
				label: 'All Time',
				getRange: () => {
					const now = new Date()
					const start = new Date(2020, 0, 1)
					return { startDate: startOfDay(start), endDate: endOfDay(now) }
				},
			},
		]
	}, [])

	// Click outside listener when used as popover
	useEffect(() => {
		if (inline) return
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				// Revert unapplied temp states
				setTempStart(confirmedRange.startDate)
				setTempEnd(confirmedRange.endDate)
				setTempPreset(confirmedRange.preset)
				setStartInputText(formatDateInput(confirmedRange.startDate))
				setEndInputText(formatDateInput(confirmedRange.endDate))
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [inline, confirmedRange])

	// Month / Year Navigation
	const handlePrevMonth = () => {
		if (viewMonth === 0) {
			setViewMonth(11)
			setViewYear((y) => y - 1)
		} else {
			setViewMonth((m) => m - 1)
		}
	}

	const handleNextMonth = () => {
		if (viewMonth === 11) {
			setViewMonth(0)
			setViewYear((y) => y + 1)
		} else {
			setViewMonth((m) => m + 1)
		}
	}

	// Preset Selection
	const handleSelectPreset = (preset: PresetOption) => {
		const range = preset.getRange()
		setTempStart(range.startDate)
		setTempEnd(range.endDate)
		setTempPreset(preset.id)
		setStartInputText(formatDateInput(range.startDate))
		setEndInputText(formatDateInput(range.endDate))
		setViewMonth(range.endDate.getMonth())
		setViewYear(range.endDate.getFullYear())
	}

	// Click Day on Calendar
	const handleDayClick = (dayDate: Date) => {
		// If no start date, or both start and end exist, start new selection
		if (!tempStart || (tempStart && tempEnd)) {
			setTempStart(dayDate)
			setTempEnd(null)
			setTempPreset('custom')
			setStartInputText(formatDateInput(dayDate))
			setEndInputText('')
		} else {
			// tempStart exists, selecting tempEnd
			if (dayDate.getTime() < tempStart.getTime()) {
				setTempStart(dayDate)
				setTempEnd(tempStart)
				setStartInputText(formatDateInput(dayDate))
				setEndInputText(formatDateInput(tempStart))
			} else {
				setTempEnd(dayDate)
				setEndInputText(formatDateInput(dayDate))
			}
			setTempPreset('custom')
		}
	}

	// Manual Date input handling
	const handleStartInputBlur = () => {
		if (!startInputText) return
		const parsed = new Date(startInputText)
		if (!isNaN(parsed.getTime())) {
			setTempStart(startOfDay(parsed))
			setTempPreset('custom')
		} else {
			setStartInputText(formatDateInput(tempStart))
		}
	}

	const handleEndInputBlur = () => {
		if (!endInputText) return
		const parsed = new Date(endInputText)
		if (!isNaN(parsed.getTime())) {
			const endD = endOfDay(parsed)
			if (tempStart && endD.getTime() < tempStart.getTime()) {
				// Swap if end is earlier
				setTempStart(startOfDay(parsed))
				setTempEnd(endOfDay(tempStart))
				setStartInputText(formatDateInput(parsed))
				setEndInputText(formatDateInput(tempStart))
			} else {
				setTempEnd(endD)
			}
			setTempPreset('custom')
		} else {
			setEndInputText(formatDateInput(tempEnd))
		}
	}

	// Action buttons
	const handleApply = () => {
		if (!tempStart) return
		const finalEnd = tempEnd || tempStart
		const result: DateRange = {
			startDate: startOfDay(tempStart),
			endDate: endOfDay(finalEnd),
			preset: tempPreset,
		}
		setConfirmedRange(result)
		if (!inline) setIsOpen(false)
		if (onChange) onChange(result)
		if (onApply) onApply(result)
	}

	const handleCancel = () => {
		setTempStart(confirmedRange.startDate)
		setTempEnd(confirmedRange.endDate)
		setTempPreset(confirmedRange.preset)
		setStartInputText(formatDateInput(confirmedRange.startDate))
		setEndInputText(formatDateInput(confirmedRange.endDate))
		if (!inline) setIsOpen(false)
		if (onCancel) onCancel()
	}

	// Days grid calculation
	const calendarDays = useMemo(() => {
		const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
		const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
		const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

		const days: {
			date: Date
			isCurrentMonth: boolean
			dayNumber: number
		}[] = []

		// Leading days from previous month
		for (let i = firstDayIndex - 1; i >= 0; i--) {
			const dayNum = daysInPrevMonth - i
			days.push({
				date: new Date(viewYear, viewMonth - 1, dayNum),
				isCurrentMonth: false,
				dayNumber: dayNum,
			})
		}

		// Days of current month
		for (let i = 1; i <= daysInCurrentMonth; i++) {
			days.push({
				date: new Date(viewYear, viewMonth, i),
				isCurrentMonth: true,
				dayNumber: i,
			})
		}

		// Trailing days to fill standard 35 or 42 cells
		const totalSlots = days.length <= 35 ? 35 : 42
		const remaining = totalSlots - days.length
		for (let i = 1; i <= remaining; i++) {
			days.push({
				date: new Date(viewYear, viewMonth + 1, i),
				isCurrentMonth: false,
				dayNumber: i,
			})
		}

		return days
	}, [viewMonth, viewYear])

	// Selection range duration calculation
	const selectionDurationText = useMemo(() => {
		if (!tempStart) return 'No dates selected'
		const end = tempEnd || tempStart
		const diffTime = Math.abs(endOfDay(end).getTime() - startOfDay(tempStart).getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} selected`
	}, [tempStart, tempEnd])

	// Current active range preview (includes hover when selecting end date)
	const effectiveEndForHover = useMemo(() => {
		if (tempStart && !tempEnd && hoverDate) {
			return hoverDate.getTime() > tempStart.getTime() ? hoverDate : null
		}
		return tempEnd
	}, [tempStart, tempEnd, hoverDate])

	// Picker Panel Content
	const pickerPanel = (
		<div
			className={`flex flex-col sm:flex-row overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur-md transition-all ${className}`}
		>
			{/* ================= LEFT COLUMN: PRESETS LIST ================= */}
			<div className="w-full sm:w-44 lg:w-48 shrink-0 bg-slate-50/70 p-3.5 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col justify-between">
				<div>
					<div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 px-2">
						Presets
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
						{PRESETS.map((preset) => {
							const isActive = tempPreset === preset.id
							return (
								<button
									key={preset.id}
									type="button"
									onClick={() => handleSelectPreset(preset)}
									className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition text-left cursor-pointer ${
										isActive
											? 'bg-slate-900 text-white font-bold shadow-xs'
											: 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
									}`}
								>
									<span>{preset.label}</span>
									{isActive && <FiCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
								</button>
							)
						})}
					</div>
				</div>

				<div className="hidden sm:block pt-3 border-t border-slate-200/80 mt-4 px-2">
					<span className="text-[10px] text-slate-400 font-medium leading-relaxed block">
						Quick presets automatically set starting and ending dates.
					</span>
				</div>
			</div>

			{/* ================= RIGHT COLUMN: INPUTS, CALENDAR & ACTIONS ================= */}
			<div className="flex-1 flex flex-col p-4 sm:p-5 min-w-[300px] sm:min-w-[340px]">
				{/* Top 2 Inputs: [Start Date - End Date] */}
				<div className="flex items-center gap-2 mb-4">
					{/* Start Date input */}
					<div className="relative flex-1">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
							<FiCalendar className="h-3.5 w-3.5" />
						</div>
						<input
							type="text"
							placeholder="YYYY-MM-DD"
							value={startInputText}
							onChange={(e) => setStartInputText(e.target.value)}
							onBlur={handleStartInputBlur}
							className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-base sm:text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
						/>
					</div>

					<span className="text-slate-400 shrink-0">
						<FiArrowRight className="h-3.5 w-3.5" />
					</span>

					{/* End Date input */}
					<div className="relative flex-1">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
							<FiCalendar className="h-3.5 w-3.5" />
						</div>
						<input
							type="text"
							placeholder="YYYY-MM-DD"
							value={endInputText}
							onChange={(e) => setEndInputText(e.target.value)}
							onBlur={handleEndInputBlur}
							className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-base sm:text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
						/>
					</div>
				</div>

				{/* Calendar Month / Year Header */}
				<div className="flex items-center justify-between mb-3 px-1">
					<div className="flex items-center gap-1.5">
						<span className="text-sm font-bold text-slate-900">
							{MONTH_NAMES[viewMonth]}
						</span>
						<span className="text-sm font-semibold text-slate-500 font-mono">
							{viewYear}
						</span>
					</div>

					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handlePrevMonth}
							className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
							title="Previous Month"
						>
							<FiChevronLeft className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={handleNextMonth}
							className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
							title="Next Month"
						>
							<FiChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Days of Week Header */}
				<div className="grid grid-cols-7 gap-1 text-center mb-1">
					{DAY_LABELS.map((label, idx) => (
						<div
							key={idx}
							className="text-[11px] font-bold text-slate-400 py-1 uppercase tracking-wider"
						>
							{label}
						</div>
					))}
				</div>

				{/* Days Grid */}
				<div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
					{calendarDays.map((cell, idx) => {
						const isStart = isSameDay(cell.date, tempStart)
						const isEnd = isSameDay(cell.date, effectiveEndForHover)
						const isInRange = isBetweenDays(cell.date, tempStart, effectiveEndForHover)
						const isToday = isSameDay(cell.date, new Date())

						return (
							<button
								key={idx}
								type="button"
								onClick={() => handleDayClick(cell.date)}
								onMouseEnter={() => tempStart && !tempEnd && setHoverDate(cell.date)}
								className={`group relative flex h-8 sm:h-9 w-full items-center justify-center text-xs font-semibold transition cursor-pointer ${
									!cell.isCurrentMonth
										? 'text-slate-300'
										: isStart || isEnd
											? 'text-white font-bold'
											: isInRange
												? 'text-slate-900 font-bold'
												: 'text-slate-700 hover:bg-slate-100'
								} ${
									isStart
										? 'rounded-l-xl bg-slate-900 z-10'
										: isEnd
											? 'rounded-r-xl bg-slate-900 z-10'
											: isInRange
												? 'bg-slate-100 rounded-none'
												: 'rounded-xl'
								}`}
							>
								{/* Highlight ring for Today */}
								{isToday && !isStart && !isEnd && (
									<span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" />
								)}
								<span>{cell.dayNumber}</span>
							</button>
						)
					})}
				</div>

				{/* ================= BOTTOM ACTION BAR: [CANCEL] & [APPLY] ================= */}
				<div className="mt-5 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
					<div className="text-[11px] font-medium text-slate-500 truncate w-full sm:w-auto text-center sm:text-left">
						{selectionDurationText}
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<button
							type="button"
							onClick={handleCancel}
							className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleApply}
							disabled={!tempStart}
							className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
						>
							<FiCheck className="h-3.5 w-3.5 text-emerald-400" />
							<span>Apply</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	)

	// If inline mode is requested, return the picker directly
	if (inline) {
		return <div className="relative inline-block">{pickerPanel}</div>
	}

	// Popover Trigger Button Mode
	const triggerLabel = useMemo(() => {
		if (confirmedRange.preset && confirmedRange.preset !== 'custom') {
			const found = PRESETS.find((p) => p.id === confirmedRange.preset)
			if (found) return found.label
		}
		if (confirmedRange.startDate && confirmedRange.endDate) {
			return `${formatDateDisplay(confirmedRange.startDate)} – ${formatDateDisplay(confirmedRange.endDate)}`
		}
		if (confirmedRange.startDate) {
			return formatDateDisplay(confirmedRange.startDate)
		}
		return 'Select Date Range'
	}, [confirmedRange, PRESETS])

	return (
		<div ref={containerRef} className="relative inline-block text-left">
			{/* Trigger Button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer ${buttonClassName}`}
			>
				<FiCalendar className="h-3.5 w-3.5 text-slate-500" />
				<span>{triggerLabel}</span>
			</button>

			{/* Floating Popover Container with Responsive Mobile Placement */}
			{isOpen && (
				<>
					{/* Mobile Backdrop Overlay */}
					<div
						className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs sm:hidden"
						onClick={handleCancel}
					/>
					<div
						className={`fixed inset-x-3 top-20 z-50 sm:absolute sm:inset-x-auto sm:top-auto sm:mt-2 ${
							align === 'right' ? 'sm:right-0' : 'sm:left-0'
						} animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-1.5rem)] sm:max-w-none shadow-2xl`}
					>
						{pickerPanel}
					</div>
				</>
			)}
		</div>
	)
}
