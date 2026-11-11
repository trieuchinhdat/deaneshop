'use client'

import React, { createContext, useContext, useMemo } from 'react'
import NextLink from 'next/link'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

const MotionNextLink = motion.create(NextLink)

export type ButtonHoverEffect = 'scale-subtle' | 'lift' | 'spring-bounce' | 'glow' | 'none'
export type BannerHoverEffect = 'zoom' | 'lift' | 'zoom-and-lift' | 'none'
export type MotionPhysics = 'snappy' | 'smooth' | 'gentle'

export interface ThemeMotionTokens {
	enableMotion: boolean
	buttonHoverEffect: ButtonHoverEffect
	bannerHoverEffect: BannerHoverEffect
	motionPhysics: MotionPhysics
}

const defaultMotionTokens: ThemeMotionTokens = {
	enableMotion: true,
	buttonHoverEffect: 'scale-subtle',
	bannerHoverEffect: 'zoom',
	motionPhysics: 'smooth',
}

const ThemeMotionContext = createContext<ThemeMotionTokens>(defaultMotionTokens)

export function ThemeMotionProvider({
	tokens,
	children,
}: {
	tokens?: Partial<ThemeMotionTokens>
	children: React.ReactNode
}) {
	const value = useMemo<ThemeMotionTokens>(() => {
		return {
			enableMotion: tokens?.enableMotion !== false,
			buttonHoverEffect: (tokens?.buttonHoverEffect as ButtonHoverEffect) || 'scale-subtle',
			bannerHoverEffect: (tokens?.bannerHoverEffect as BannerHoverEffect) || 'zoom',
			motionPhysics: (tokens?.motionPhysics as MotionPhysics) || 'smooth',
		}
	}, [tokens])

	return (
		<ThemeMotionContext.Provider value={value}>
			{children}
		</ThemeMotionContext.Provider>
	)
}

export function useThemeMotion() {
	return useContext(ThemeMotionContext)
}

/**
 * Spring physics profiles for Framer Motion
 */
function getSpringPhysics(physics: MotionPhysics) {
	switch (physics) {
		case 'snappy':
			return { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.8 }
		case 'gentle':
			return { type: 'spring' as const, stiffness: 220, damping: 24, mass: 1.2 }
		case 'smooth':
		default:
			return { type: 'spring' as const, stiffness: 380, damping: 22, mass: 1 }
	}
}

/**
 * Motion Button Component:
 * Applies framer-motion micro-interactions (whileHover + whileTap) based on Sanity Studio theme settings.
 */
export const MotionButton = React.forwardRef<
	HTMLButtonElement,
	HTMLMotionProps<'button'> & {
		effectOverride?: ButtonHoverEffect
	}
>(function MotionButton({ children, className, effectOverride, ...props }, ref) {
	const tokens = useThemeMotion()
	const prefersReduced = useReducedMotion()

	const activeEffect = effectOverride || (tokens.enableMotion ? tokens.buttonHoverEffect : 'none')
	const spring = getSpringPhysics(tokens.motionPhysics)

	if (prefersReduced || activeEffect === 'none') {
		return (
			<button ref={ref} className={className} {...(props as any)}>
				{children}
			</button>
		)
	}

	let whileHover: any = {}
	let whileTap: any = { scale: 0.97 }

	switch (activeEffect) {
		case 'scale-subtle':
			whileHover = { scale: 1.03 }
			whileTap = { scale: 0.97 }
			break
		case 'lift':
			whileHover = { y: -3 }
			whileTap = { y: 0, scale: 0.98 }
			break
		case 'spring-bounce':
			whileHover = { scale: 1.05 }
			whileTap = { scale: 0.93 }
			break
		case 'glow':
			whileHover = { scale: 1.02 }
			whileTap = { scale: 0.98 }
			break
		default:
			whileHover = {}
			whileTap = {}
	}

	return (
		<motion.button
			ref={ref}
			className={className}
			whileHover={whileHover}
			whileTap={whileTap}
			transition={spring}
			{...props}
		>
			{children}
		</motion.button>
	)
})

/**
 * Motion Link Button Component:
 * Next.js Link enhanced with Framer Motion hover & tactile tap physics.
 */
export const MotionLinkButton = React.forwardRef<
	HTMLAnchorElement,
	React.ComponentProps<typeof NextLink> & {
		effectOverride?: ButtonHoverEffect
	}
>(function MotionLinkButton({ children, className, effectOverride, href, ...props }, ref) {
	const tokens = useThemeMotion()
	const prefersReduced = useReducedMotion()

	const activeEffect = effectOverride || (tokens.enableMotion ? tokens.buttonHoverEffect : 'none')
	const spring = getSpringPhysics(tokens.motionPhysics)

	if (prefersReduced || activeEffect === 'none') {
		return (
			<NextLink ref={ref} href={href} className={className} {...props}>
				{children}
			</NextLink>
		)
	}

	let whileHover: any = {}
	let whileTap: any = { scale: 0.97 }

	switch (activeEffect) {
		case 'scale-subtle':
			whileHover = { scale: 1.03 }
			whileTap = { scale: 0.97 }
			break
		case 'lift':
			whileHover = { y: -3 }
			whileTap = { y: 0, scale: 0.98 }
			break
		case 'spring-bounce':
			whileHover = { scale: 1.05 }
			whileTap = { scale: 0.93 }
			break
		case 'glow':
			whileHover = { scale: 1.02 }
			whileTap = { scale: 0.98 }
			break
		default:
			whileHover = {}
			whileTap = {}
	}

	return (
		<MotionNextLink
			ref={ref}
			href={href}
			className={className}
			whileHover={whileHover}
			whileTap={whileTap}
			transition={spring}
			{...(props as any)}
		>
			{children}
		</MotionNextLink>
	)
})

/**
 * Motion Banner Wrapper Component:
 * Wraps banners/promotions with Framer Motion hover & spring physics.
 */
export const MotionBanner = React.forwardRef<
	HTMLDivElement,
	HTMLMotionProps<'div'> & {
		effectOverride?: BannerHoverEffect
	}
>(function MotionBanner({ children, className, effectOverride, ...props }, ref) {
	const tokens = useThemeMotion()
	const prefersReduced = useReducedMotion()

	const activeEffect = effectOverride || (tokens.enableMotion ? tokens.bannerHoverEffect : 'none')
	const spring = getSpringPhysics(tokens.motionPhysics)

	if (prefersReduced || activeEffect === 'none') {
		return (
			<div ref={ref} className={cn('theme-banner', className)} {...(props as any)}>
				{children}
			</div>
		)
	}

	let whileHover: any = {}
	if (activeEffect === 'lift' || activeEffect === 'zoom-and-lift') {
		whileHover = { y: -6 }
	}

	return (
		<motion.div
			ref={ref}
			className={cn('theme-banner', className)}
			whileHover={whileHover}
			transition={spring}
			{...props}
		>
			{children}
		</motion.div>
	)
})
