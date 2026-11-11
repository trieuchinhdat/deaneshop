import { groq } from 'next-sanity'
import type {
	PAGE_QUERY_RESULT,
	PRODUCT_SETTINGS_QUERY_RESULT,
	SITE_QUERY_RESULT,
} from '@/sanity/types'
import { sanityFetchLive } from './live'

/* fragments */

// @sanity-typegen-ignore
export const LINK_QUERY = groq`
	...,
	type == 'internal' => {
		internal->{
			_type,
			title,
			'slug': select(
				_type == 'collection' => '/collections/' + metadata.slug.current,
				_type == 'product' => '/products/' + metadata.slug.current,
				_type == 'blog.post' => '/blog/' + metadata.slug.current,
				metadata.slug.current == 'index' => '/',
				'/' + metadata.slug.current
			)
		}
	}
`

// @sanity-typegen-ignore
const NAVIGATION_QUERY = groq`
	items[]{
		${LINK_QUERY},
		defined(link) => { link{ ${LINK_QUERY} } },
		defined(links[]) => { links[]{ ${LINK_QUERY} } },
		_type == 'megamenu' => {
			badge,
			defined(link) => { link{ ${LINK_QUERY} } },
			items[]{
				...,
				_type == 'link.list' => {
					defined(link) => { link{ ${LINK_QUERY} } },
					links[]{ ${LINK_QUERY} }
				}
			},
			banner {
				...,
				image {
					...,
					asset->
				},
				link { ${LINK_QUERY} }
			}
		}
	}
`

const SITE_QUERY = groq`*[_type == 'site'][0]{
	...,
	logo {
		...,
		image {
			default,
			light,
			dark
		}
	},
	socialLinks[] {
		_key,
		platform,
		title,
		url
	},
	'theme': coalesce(*[_type == 'theme-settings'][0].theme, theme) { 
		preset,
		primaryColor,
		onPrimaryColor,
		secondaryColor,
		onSecondaryColor,
		ctaColor,
		onCtaColor,
		backgroundColor,
		surfaceColor,
		textColor,
		textMutedColor,
		noteBackground,
		noteTextColor,
		successColor,
		warningColor,
		destructiveColor,
		borderColor,
		ringColor,
		borderRadius,
		shadowStyle,
		pageMaxWidth,
		customPageMaxWidth,
		sectionSpacingDesktop,
		customSectionSpacingDesktop,
		sectionSpacingMobile,
		customSectionSpacingMobile,
		containerPaddingDesktop,
		customContainerPaddingDesktop,
		containerPaddingMobile,
		customContainerPaddingMobile,
		fontHeading,
		customFontHeading,
		fontBody,
		customFontBody,
		enableMotion,
		buttonHoverEffect,
		bannerHoverEffect,
		motionPhysics
	},
	'widgetEnabled': coalesce(*[_type == 'widget-settings'][0].enabled, true),
	'widgetPosition': coalesce(*[_type == 'widget-settings'][0].widgetPosition, widgetPosition, 'bottom-right'),
	'displayMode': coalesce(*[_type == 'widget-settings'][0].displayMode, displayMode, 'expandable'),
	'deviceVisibility': coalesce(*[_type == 'widget-settings'][0].deviceVisibility, 'all'),
	'triggerMode': coalesce(*[_type == 'widget-settings'][0].triggerMode, 'scroll'),
	'themeStyle': coalesce(*[_type == 'widget-settings'][0].themeStyle, 'primary'),
	'onlineBadge': coalesce(*[_type == 'widget-settings'][0].onlineBadge, true),
	'bottomOffsetMobile': coalesce(*[_type == 'widget-settings'][0].bottomOffsetMobile, 'normal'),
	'customBottomOffsetMobile': *[_type == 'widget-settings'][0].customBottomOffsetMobile,
	'bottomOffsetDesktop': coalesce(*[_type == 'widget-settings'][0].bottomOffsetDesktop, 'normal'),
	'customBottomOffsetDesktop': *[_type == 'widget-settings'][0].customBottomOffsetDesktop,
	'mobileDisplayStyle': coalesce(*[_type == 'widget-settings'][0].mobileDisplayStyle, 'expanded'),
	'mainButtonLabel': coalesce(*[_type == 'widget-settings'][0].mainButtonLabel, mainButtonLabel, 'Need Help?'),
	'mainButtonIcon': coalesce(*[_type == 'widget-settings'][0].mainButtonIcon, mainButtonIcon, 'chat'),
	'floatingButtons': coalesce(*[_type == 'widget-settings'][0].floatingButtons, floatingButtons)[] {
		_key,
		type,
		label,
		subtitle,
		value,
		icon,
		isActive,
		pulse
	},
	'announcementBar': coalesce(*[_type == 'system-settings'][0].announcementBar, announcementBar) {
		isActive,
		text,
		link,
		bgColor,
		textColor
	},
	'maintenanceMode': coalesce(*[_type == 'system-settings'][0].maintenanceMode, maintenanceMode, false),
	'scripts': coalesce(*[_type == 'system-settings'][0].scripts, scripts)[] {
		_key,
		title,
		isActive,
		location,
		strategy,
		scriptType,
		src,
		code,
		attributes[] {
			key,
			value
		}
	},
	'popup': coalesce(*[_type == 'popup-settings'][0], popup) {
		isActive,
		type,
		targetPages,
		triggerType,
		delaySeconds,
		scrollPercentage,
		frequencyDays,
		bannerImage {
			...,
			asset->
		},
		mobileBannerImage {
			...,
			asset->
		},
		bannerBadge,
		bannerTitle,
		bannerDescription,
		couponCode,
		bannerCtaText,
		bannerCtaUrl,
		transparentBackground,
		formBadge,
		formTitle,
		formDescription,
		formFields,
		formSubmitLabel,
		rewardCouponCode,
		successTitle,
		successDescription
	}
}`

export const GLOBAL_MODULE_PATH_QUERY = groq`
	string::startsWith($slug, path)
	&& select(
		defined(excludePaths) => count(excludePaths[string::startsWith($slug, @)]) == 0,
		true
	)
`

// @sanity-typegen-ignore
export const MODULES_QUERY = groq`
	...,
	ctas[]{
		...,
		link{ ${LINK_QUERY} }
	},
	_type == 'breadcrumbs' => {
		crumbs[]{ ${LINK_QUERY} }
	},
	_type == 'card-list' => {
		cards[]{
			...,
			link{ ${LINK_QUERY} },
			image{
				...,
				asset->
			},
			icon{
				...,
				asset->
			},
			ctas[]{
				...,
				link{ ${LINK_QUERY} }
			}
		}
	},
	_type == 'stat-list' => {
		stats[]{
			...,
			link{ ${LINK_QUERY} },
			icon{
				...,
				asset->
			}
		}
	},
	_type == 'logo-list' => {
		logos[]{
			...,
			_type == 'reference' => @->
		}
	},
	_type == 'person-list' => {
		people[]{
			...,
			_type == 'reference' => @->{
				...,
				image{
					...,
					asset->{
						...,
						metadata
					}
				}
			},
			defined(image) => {
				image{
					...,
					asset->{
						...,
						metadata
					}
				}
			}
		}
	},
	_type == 'prose' => {
		...,
		content[]{
			...,
			_type == 'image' => {
				...,
				asset->{
					...,
					metadata
				}
			},
			_type == 'affiliateLink' => {
				...,
				affiliateRef->{
					_id,
					title,
					merchant,
					url,
					price,
					originalPrice,
					couponCode,
					rating,
					ratingCount,
					badge,
					highlights,
					description,
					image{
						...,
						asset->
					}
				}
			},
			_type == 'product-embed' => {
				...,
				product->{
					_id,
					title,
					price,
					salePrice,
					hasVariants,
					inStock,
					stock,
					images[]{
						...,
						asset->
					},
					metadata
				}
			},
			_type == 'image-gallery' => {
				...,
				images[]{
					...,
					asset->
				}
			},
			_type == 'cta-banner' => {
				...,
				buttonLink{ ${LINK_QUERY} }
			},
			_type == 'video-embed' => {
				...,
				customThumbnail{
					...,
					asset->
				}
			}
		},
		'headings': select(
			tableOfContents in ['left', 'right'] => content[style in ['h2', 'h3', 'h4', 'h5', 'h6']]{
				style,
				'text': pt::text(@)
			}
		),
		'readingTime': length(string::split(pt::text(content), ' ')) / 200
	},
	_type == 'quote-list' => {
		...,
		testimonials[]{
			...,
			_type == 'reference' => @->{
				...,
				mediaLogo{
					...,
					asset->
				},
				author{
					...,
					image{
						...,
						asset->
					}
				},
				videoThumbnail{
					...,
					asset->
				}
			},
			mediaLogo{
				...,
				asset->
			},
			author{
				...,
				image{
					...,
					asset->
				}
			},
			videoThumbnail{
				...,
				asset->
			}
		}
	},
	_type == 'social-proof' => {
		...,
		reviews[]{
			...,
			authorAvatar {
				...,
				asset->
			},
			videoThumbnail {
				...,
				asset->
			}
		}
	},
	_type == 'step-list' => {
		steps[]{
			...,
			image{
				...,
				asset->
			},
			videoThumbnail{
				...,
				asset->
			},
			icon{
				...,
				asset->
			},
			link{ ${LINK_QUERY} },
			ctas[]{
				...,
				link{ ${LINK_QUERY} }
			}
		}
	},
	_type == 'product-list' => {
        ..., 
        image {
            ..., 
            asset->,
			"internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current 
        },
		collection->{
			_id,	
			title,
			"slug": coalesce(metadata.slug.current, slug.current)
		},
    },
	_type == 'product' => {
		...,
		productDetail->{
			_id,
			_type,
			title,
			sku,
			description,
			images[]{
				...,
				asset->{
					...,
					metadata
				}
			},
			price,
			salePrice,
			sales,
			inStock,
			shortPitch,
			keyBenefits,
			specs,
			hasVariants,
			options[]{
				name,
				values
			},
			variants[]{
				_key,
				title,
				sku,
				price,
				compareAtPrice,
				stock,
				image{
					...,
					asset->{
						...,
						metadata
					}
				},
				options[]{
					name,
					value
				}
			},
		}
	},
	_type == 'carousel-banner-list' => {
        ..., 
        items[]{
            ..., 
            asset->, 
            mobileImage {
                asset->
            },
            "internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current,
        }
    },
	_type == 'hero.split' => {
		...,
		image {
			...,
			asset->,
			mobileImage {
				...,
				asset->
			}
		}
	},
	_type == 'hero-slider' => {
		...,
		slides[]{
			...,
			image {
				...,
				asset->
			},
			mobileImage {
				...,
				asset->
			},
			ctas[]{
				...,
				link{ ${LINK_QUERY} }
			}
		}
	},
	_type == 'media-grid' => {
		...,
		items[]{
			...,
			image {
				...,
				asset->
			},
			mobileImage {
				...,
				asset->
			},
			link{ ${LINK_QUERY} }
		}
	},
	_type == 'blog-post-list' => {
        ..., 
        image {
            ..., 
            asset->,
			"internalType": internal->_type,
            "internalSlug": internal->metadata.slug.current 
        },
        category->{
            _id,
            title,
            slug,
            "postCount": count(*[_type == "blog.post" && references(^._id) && metadata.noIndex != true])
        },
        manualPosts[]->{
            _id,
            title,
            publishDate,
            excerpt,
            isFeatured,
            'readTime': length(string::split(pt::text(content), ' ')) / 200,
            categories[]->{
                _id,
                title,
                slug,
                "postCount": count(*[_type == "blog.post" && references(^._id) && metadata.noIndex != true])
            },
            author->{
                name,
                role,
                image {
                    ...,
                    asset->
                }
            },
            metadata {
                ...,
                image {
                    ...,
                    asset->
                }
            },
            "slug": metadata.slug.current
        }
    },
	_type == 'tiered-pricing' => {
		...,
		linkedProduct->{
			_id,
			_type,
			title,
			price,
			compareAtPrice,
			sku,
			images[]{
				...,
				asset->
			},
			"slug": metadata.slug.current
		}
	},
	_type == 'compliance-vault' => {
		...,
		certificates[]{
			...,
			badgeIcon {
				...,
				asset->
			}
		},
		gatedDocuments[]{
			_key,
			_type,
			title,
			category,
			description,
			fileSize,
			"assetId": coalesce(_key, fileAsset.asset._id),
			"hasFile": defined(fileAsset.asset._ref) || defined(externalDownloadUrl),
			fileAsset {
				_type,
				asset->{
					_id,
					size,
					originalFilename,
					mimeType,
					extension
				}
			}
		}
	},
	_type == 'sticky-mobile-cta' => {
		...,
		image {
			...,
			asset->
		},
		linkedProduct->{
			_id,
			title,
			price,
			compareAtPrice,
			sku,
			images[]{
				...,
				asset->
			},
			"slug": coalesce(metadata.slug.current, slug.current),
			hasVariants,
			variants[]{
				_key,
				title,
				sku,
				price,
				compareAtPrice,
				image{
					...,
					asset->
				}
			}
		}
	},
	_type == 'collection-content' => {
		...,
	},
`

export const PRODUCT_CARD_SETTINGS_QUERY = groq`*[_type == 'product-card-settings'][0]{...}`

export const PRODUCT_SETTINGS_QUERY = groq`*[_type == 'product-settings'][0]{
	...,
	defaultPromotions,
	defaultSpecialConditions,
	trustBadges[]{
		...,
		icon {
			...,
			asset->
		}
	},
	promoBanners[]{
		...,
		image {
			...,
			asset->
		},
		mobileImage {
			...,
			asset->
		},
		link {
			${LINK_QUERY}
		}
	}
}`

export const HEADER_SETTINGS_QUERY = groq`*[_type == 'header-settings'][0]{
	...,
	allowDismiss,
	autoPlayInterval,
	menu->{ ${NAVIGATION_QUERY} },
	mobileMenu->{ ${NAVIGATION_QUERY} },
	mobileDrawerFooterLinks[]{ ${LINK_QUERY} },
	highlightCta{
		...,
		iconType,
		actionType,
		link{ ${LINK_QUERY} }
	},
	ctas[]{
		...,
		iconType,
		actionType,
		link{ ${LINK_QUERY} }
	},
	announcements[]->{
		...,
		enabled,
		variant,
		badgeText,
		badgeBgColor,
		badgeTextColor,
		content,
		backgroundColor,
		textColor,
		image {
			...,
			asset->,
			mobileImage {
				...,
				asset->
			},
			alt,
			loading
		},
			"internalType": internal->_type,
            "internalSlug": coalesce(internal->metadata.slug.current, internal->slug.current) 
	}
}`

/* queries */

export async function getSite() {
	return await sanityFetchLive<SITE_QUERY_RESULT>({
		query: SITE_QUERY,
	})
}

export const FOOTER_SETTINGS_QUERY = groq`*[_type == 'footer-settings'][0]{
	...,
	footerMenu->{ ${NAVIGATION_QUERY} },
	legalLinks[]{ ${LINK_QUERY} },
	trustBadges[]{
		...,
		image{
			...,
			asset->
		}
	}
}`

export async function getFooterSettings() {
	const [footerSettings, site] = await Promise.all([
		sanityFetchLive<any>({
			query: FOOTER_SETTINGS_QUERY,
		}),
		sanityFetchLive<any>({
			query: SITE_QUERY,
		}),
	])

	return {
		// Inherit or override
		footerMenu: footerSettings?.footerMenu ?? site?.footer,
		social: site?.socialLinks || site?.social,
		legalLinks: footerSettings?.legalLinks,
		showCookieSettingsTrigger:
			footerSettings?.showCookieSettingsTrigger ?? true,
		regionLabel: footerSettings?.regionLabel || 'United States (USD $)',
		copyrightText: footerSettings?.copyrightText,
		desktopLayout: footerSettings?.desktopLayout || 'standard',
		spacing: footerSettings?.spacing || 'normal',
		headingCase: footerSettings?.headingCase || 'title',
		showBackToTop: footerSettings?.showBackToTop ?? true,
		footerBackground: footerSettings?.footerBackground,
		footerText: footerSettings?.footerText,
		footerMutedText: footerSettings?.footerMutedText,
		footerBorder: footerSettings?.footerBorder,
		footerThemeStyle: footerSettings?.footerThemeStyle ?? 'default',
		mobileAccordion: footerSettings?.mobileAccordion ?? true,
		showUspBar: footerSettings?.showUspBar ?? true,
		uspLayout: footerSettings?.uspLayout || 'grid',
		uspItems: footerSettings?.uspItems,
		showLogo: footerSettings?.showLogo ?? true,
		brandDescription: footerSettings?.brandDescription,
		showContactInfo: footerSettings?.showContactInfo ?? true,
		showHotline: footerSettings?.showHotline ?? true,
		showEmail: footerSettings?.showEmail ?? true,
		showAddress: footerSettings?.showAddress ?? true,
		showTaxCode: footerSettings?.showTaxCode ?? false,
		showWorkingHours: footerSettings?.showWorkingHours ?? true,
		showSocialLinks: footerSettings?.showSocialLinks ?? true,
		showNewsletter: footerSettings?.showNewsletter ?? true,
		newsletterTitle: footerSettings?.newsletterTitle,
		newsletterDescription: footerSettings?.newsletterDescription,
		newsletterPlaceholder: footerSettings?.newsletterPlaceholder,
		newsletterButtonText: footerSettings?.newsletterButtonText,
		newsletterConsentText: footerSettings?.newsletterConsentText,
		showPaymentMethods: footerSettings?.showPaymentMethods ?? true,
		paymentMethods: footerSettings?.paymentMethods ?? [
			'visa',
			'mastercard',
			'amex',
			'apple_pay',
			'google_pay',
			'paypal',
			'shop_pay',
			'klarna',
		],
		showTrustBadges: footerSettings?.showTrustBadges ?? false,
		trustBadges: footerSettings?.trustBadges,
		...(footerSettings || {}),
	}
}

export async function getHeaderSettings() {
	return await sanityFetchLive<any>({
		query: HEADER_SETTINGS_QUERY,
	})
}

export async function getProductCardSettings() {
	return await sanityFetchLive<any>({
		query: PRODUCT_CARD_SETTINGS_QUERY,
	})
}

export async function getProductSettings() {
	const [productSettings, cardSettings] = await Promise.all([
		sanityFetchLive<PRODUCT_SETTINGS_QUERY_RESULT>({
			query: PRODUCT_SETTINGS_QUERY,
		}),
		sanityFetchLive<any>({
			query: PRODUCT_CARD_SETTINGS_QUERY,
		}),
	])
	return {
		...(productSettings || {}),
		...(cardSettings || {}),
	}
}

export const PAGE_QUERY = groq`
	*[_type == 'page' && metadata.slug.current == $slug][0]{
		...,
		'modules': (
			// global moddules (before)
			*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
			// path modules (before)
			+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].before[]{ ${MODULES_QUERY} }
			// page modules
			+ modules[]{ ${MODULES_QUERY} }
			// path modules (after)
			+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].after[]{ ${MODULES_QUERY} }
			// global moddules (after)
			+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
		)
	}
`

export const CAMPAIGN_HOME_QUERY = groq`
	*[_type == 'site'][0]{
		campaignHomeEnabled,
		'campaignPage': campaignHomePage->{
			...,
			'modules': (
				*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
				+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].before[]{ ${MODULES_QUERY} }
				+ modules[]{ ${MODULES_QUERY} }
				+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].after[]{ ${MODULES_QUERY} }
				+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
			)
		},
		campaignStartDate,
		campaignEndDate,
		keepOriginalSeo
	}
`

export async function getPage(slug?: string[]) {
	const currentSlug = slug ? slug.join('/') : 'index'

	// If accessing root homepage, inspect for active Campaign Home Override
	if (currentSlug === 'index') {
		try {
			const campaign = await sanityFetchLive<any>({
				query: CAMPAIGN_HOME_QUERY,
				params: { slug: 'index' },
			})

			const isCampaignActive = Boolean(
				campaign?.campaignHomeEnabled &&
				campaign?.campaignPage &&
				(!campaign?.campaignStartDate ||
					new Date(campaign.campaignStartDate) <= new Date()) &&
				(!campaign?.campaignEndDate ||
					new Date(campaign.campaignEndDate) >= new Date()),
			)

			if (isCampaignActive) {
				const originalHomePage = await sanityFetchLive<PAGE_QUERY_RESULT>({
					query: PAGE_QUERY,
					params: { slug: 'index' },
				})

				const campaignPage = campaign.campaignPage
				const shouldKeepOriginalSeo = campaign?.keepOriginalSeo !== false

				return {
					...campaignPage,
					_id: originalHomePage?._id || campaignPage._id,
					title: shouldKeepOriginalSeo
						? originalHomePage?.title || campaignPage.title
						: campaignPage.title,
					metadata: shouldKeepOriginalSeo
						? originalHomePage?.metadata || campaignPage.metadata
						: campaignPage.metadata,
					modules: campaignPage.modules || [],
				} as PAGE_QUERY_RESULT
			}
		} catch (error) {
			console.error('Failed to resolve campaign homepage override:', error)
		}
	}

	return await sanityFetchLive<PAGE_QUERY_RESULT>({
		query: PAGE_QUERY,
		params: {
			slug: currentSlug,
		},
	})
}

export const CHECKOUT_SETTINGS_QUERY = groq`*[_type == 'checkout-settings'][0]{
	...,
	topModules[]{ ${MODULES_QUERY} },
	bottomModules[]{ ${MODULES_QUERY} },
	metadata
}`

export async function getCheckoutSettings() {
	return await sanityFetchLive<any>({
		query: CHECKOUT_SETTINGS_QUERY,
	})
}

export async function getCartCheckoutSettings() {
	return await getCheckoutSettings()
}

export const GLOBAL_MODULES_QUERY = groq`{
	'before': (
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].before[]{ ${MODULES_QUERY} }
	),
	'after': (
		*[_type == 'global-module' && path != '*' && ${GLOBAL_MODULE_PATH_QUERY}].after[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	)
}`

export async function getGlobalModules(slug: string = '') {
	return await sanityFetchLive<{ before: any[]; after: any[] }>({
		query: GLOBAL_MODULES_QUERY,
		params: { slug },
	})
}

export const POPUP_SETTINGS_QUERY = groq`coalesce(*[_type == 'popup-settings'][0], *[_type == 'site'][0].popup){
	isActive,
	type,
	targetPages,
	triggerType,
	delaySeconds,
	scrollPercentage,
	frequencyDays,
	bannerImage {
		...,
		asset->
	},
	mobileBannerImage {
		...,
		asset->
	},
	bannerBadge,
	bannerTitle,
	bannerDescription,
	couponCode,
	bannerCtaText,
	bannerCtaUrl,
	transparentBackground,
	formBadge,
	formTitle,
	formDescription,
	formFields,
	formSubmitLabel,
	rewardCouponCode,
	successTitle,
	successDescription
}`

export async function getPopupSettings() {
	return await sanityFetchLive<any>({
		query: POPUP_SETTINGS_QUERY,
	})
}

export const BLOG_SETTINGS_QUERY = groq`*[_type == 'blog-settings'][0]{
	...,
	heroBanner {
		...,
		asset->
	},
	defaultAuthor->{
		name,
		role,
		shortBio,
		image {
			...,
			asset->
		}
	},
	topModules[]{ ${MODULES_QUERY} },
	bottomModules[]{ ${MODULES_QUERY} },
	metadata
}`

export async function getBlogSettings() {
	return await sanityFetchLive<any>({
		query: BLOG_SETTINGS_QUERY,
	})
}

export const BLOG_CATEGORY_QUERY = groq`*[_type == 'blog.category' && slug.current == $slug][0]{
	...,
	image {
		...,
		asset->
	},
	metadata {
		...,
		image {
			...,
			asset->
		}
	},
	'posts': *[_type == 'blog.post' && references(^._id) && metadata.noIndex != true] | order(publishDate desc) {
		...,
		categories[]->{
			title,
			slug
		},
		author->{
			name,
			role,
			image {
				...,
				asset->
			}
		},
		metadata {
			...,
			image {
				...,
				asset->
			}
		},
		'slug': $blogDir + metadata.slug.current,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
	}
}`

export async function getBlogCategory(
	slug: string,
	blogDir: string = '/blog/',
) {
	return await sanityFetchLive<any>({
		query: BLOG_CATEGORY_QUERY,
		params: { slug, blogDir },
	})
}
