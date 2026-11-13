import { defineField, defineType } from 'sanity'
import { VscInspect } from 'react-icons/vsc'

export default defineType({
	name: 'cta',
	title: 'Call to Action (CTA)',
	icon: VscInspect,
	type: 'object',
	fields: [
		defineField({
			name: 'actionType',
			title: 'Action Type',
			description: 'Action triggered when the user clicks this button',
			type: 'string',
			options: {
				list: [
					{ title: 'Open URL Link', value: 'link' },
					{ title: 'Open Mini-Cart Drawer', value: 'cart-drawer' },
					{ title: 'Open Quick Search Modal', value: 'search-modal' },
				],
			},
			initialValue: 'link',
		}),
		defineField({
			name: 'iconType',
			title: 'Icon Type',
			description: 'Select an icon to display alongside the button label',
			type: 'string',
			options: {
				list: [
					{ title: 'Auto (Detect from label/action)', value: 'auto' },
					{ title: 'Shopping Cart (Cart)', value: 'cart' },
					{ title: 'Search', value: 'search' },
					{ title: 'User Account', value: 'user' },
					{ title: 'Wishlist', value: 'wishlist' },
					{ title: 'Phone Support', value: 'phone' },
					{ title: 'None (Text Only)', value: 'none' },
				],
			},
			initialValue: 'auto',
		}),
		defineField({
			name: 'link',
			title: 'Link & Label',
			type: 'link',
		}),
		defineField({
			name: 'style',
			title: 'Button Style',
			description: 'Visual appearance variant for the button',
			type: 'string',
			options: {
				list: [
					{ title: 'Primary (Brand Solid)', value: 'action' },
					{ title: 'High-Conversion CTA (Accent / Buy Now)', value: 'action-cta' },
					{ title: 'Secondary Soft (Tonal / Muted Background)', value: 'action-secondary' },
					{ title: 'Outline (Bordered Brand)', value: 'action-outline' },
					{ title: 'Glassmorphic (Frosted Glass Overlay)', value: 'action-glass' },
					{ title: 'Ghost (Subtle / Transparent)', value: 'ghost' },
					{ title: 'Text Link (Inline with Underline)', value: 'link' },
				],
			},
			initialValue: 'action',
		}),
		defineField({
			name: 'size',
			title: 'Button Size',
			description: 'Size scaling for touch targets and typography',
			type: 'string',
			options: {
				list: [
					{ title: 'Small (36px / Compact / Cards)', value: 'btn-sm' },
					{ title: 'Medium (44px / Standard / Default)', value: 'btn-md' },
					{ title: 'Large (52px / Hero & Featured Banners)', value: 'btn-lg' },
				],
			},
			initialValue: 'btn-md',
			hidden: ({ parent }) => parent?.style === 'link',
		}),
		defineField({
			name: 'fullWidth',
			title: 'Full Width (100% Width)',
			description: 'Expand button to fill entire container width (useful for mobile & drawer checkout)',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.style === 'link',
		}),
	],
	preview: {
		select: {
			link: 'link',
			actionType: 'actionType',
			iconType: 'iconType',
			style: 'style',
			pageTitle: 'link.internal.title',
			pageSlug: 'link.internal.metadata.slug.current',
		},
		prepare: ({ link, actionType, iconType, style, pageTitle, pageSlug }) => {
			const actionLabels: Record<string, string> = {
				'cart-drawer': 'Mini-Cart Drawer',
				'search-modal': 'Search Modal',
				link: 'Link',
			}

			const slug =
				link?.type === 'internal'
					? pageSlug === 'index'
						? '/'
						: [pageSlug && `/${pageSlug}`, link.params].filter(Boolean).join('')
					: link?.type === 'external'
						? link.external
						: null

			const actionSubtitle = actionLabels[actionType || 'link'] || 'Action'
			const styleInfo = style ? ` • Style: ${style}` : ''
			const subtitle = slug ? `${actionSubtitle} (${slug})${styleInfo}` : `${actionSubtitle}${styleInfo}`

			return {
				title:
					link?.label ||
					pageTitle ||
					(actionType === 'cart-drawer'
						? 'Cart Drawer'
						: actionType === 'search-modal'
							? 'Search'
							: 'CTA Button'),
				subtitle: subtitle,
			}
		},
	},
})

