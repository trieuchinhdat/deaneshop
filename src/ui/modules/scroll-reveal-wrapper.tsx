'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { stegaClean } from 'next-sanity'

export type ScrollRevealEffect =
	| 'none'
	| 'fade-up'
	| 'fade'
	| 'scale-up'
	| 'blur-reveal'

export type ScrollRevealSpeed = 'fast' | 'standard' | 'relaxed'

interface ScrollRevealWrapperProps {
	children: React.ReactNode
	effect?: ScrollRevealEffect
	speed?: ScrollRevealSpeed
	offset?: string
	className?: string
}

const SPEED_DURATION: Record<ScrollRevealSpeed, number> = {
	fast: 0.45,
	standard: 0.65,
	relaxed: 0.9,
}

const VARIANTS: Record<
	Exclude<ScrollRevealEffect, 'none'>,
	{
		initial: Record<string, any>
		whileInView: Record<string, any>
	}
> = {
	'fade-up': {
		initial: { opacity: 0, y: 48 },
		whileInView: { opacity: 1, y: 0 },
	},
	fade: {
		initial: { opacity: 0 },
		whileInView: { opacity: 1 },
	},
	'scale-up': {
		initial: { opacity: 0, scale: 0.92 },
		whileInView: { opacity: 1, scale: 1 },
	},
	'blur-reveal': {
		initial: { opacity: 0, filter: 'blur(12px)', y: 32 },
		whileInView: { opacity: 1, filter: 'blur(0px)', y: 0 },
	},
}

export function normalizeRootMargin(offset?: string | number): string {
	let clean =
		typeof offset === 'string'
			? stegaClean(offset).trim()
			: String(offset ?? '').trim()
	if (!clean) return '0px 0px -20% 0px'

	// Strip zero-width / invisible characters from Stega encoding
	clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()

	// If already a multi-token margin (e.g. '0px 0px -20% 0px')
	const tokens = clean.split(/\s+/)
	if (tokens.length > 1) {
		const isValidMulti = tokens.every((t) => /^-?\d+(\.\d+)?(px|%)$/.test(t))
		if (isValidMulti) return clean
	}

	// Single offset value (e.g. '20%', '-20%', '50px', '20', '0')
	const unsigned = clean.replace(/^[-+]+/, '').trim()
	const match = unsigned.match(/^(\d+(?:\.\d+)?)(px|%)?$/i)
	if (match) {
		const num = parseFloat(match[1])
		if (num === 0) return '0px 0px 0px 0px'
		const unit = match[2]?.toLowerCase() || '%'
		return `0px 0px -${num}${unit} 0px`
	}

	return '0px 0px -20% 0px'
}

export default function ScrollRevealWrapper({
	children,
	effect = 'none',
	speed = 'standard',
	offset = '20%',
	className = 'w-full',
}: ScrollRevealWrapperProps) {
	const shouldReduceMotion = useReducedMotion()

	const cleanEffect = (stegaClean(effect) || 'none') as ScrollRevealEffect
	const cleanSpeed = (stegaClean(speed) || 'standard') as ScrollRevealSpeed

	if (cleanEffect === 'none' || shouldReduceMotion) {
		return <div className={className}>{children}</div>
	}

	const variant = VARIANTS[cleanEffect] || VARIANTS['fade-up']
	const duration = SPEED_DURATION[cleanSpeed] || 0.65
	const rootMargin = normalizeRootMargin(offset)

	return (
		<motion.div
			className={className}
			initial={variant.initial}
			whileInView={variant.whileInView}
			viewport={{
				once: true,
				margin: rootMargin,
			}}
			transition={{
				duration,
				ease: [0.16, 1, 0.3, 1],
			}}
		>
			{children}
		</motion.div>
	)
}
