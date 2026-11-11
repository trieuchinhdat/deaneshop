import { stegaClean } from 'next-sanity'
import { Code2 } from 'lucide-react'
import type { CustomHtml, ModuleAttributes } from '@/sanity/types'
import { cn } from '@/lib/utils'
import { moduleAttributes } from '../module-utils'
import CSS from './css'
import SandboxedFrame from './sandboxed-frame'
import WithScript from './with-script'

export interface CustomHTMLProps
	extends Omit<Partial<CustomHtml>, 'html' | 'css'> {
	_key?: string
	_type?: 'custom-html'
	badge?: string
	headline?: string
	subtitle?: string
	headerAlign?: 'center' | 'left'
	embedType?: 'custom' | 'iframe' | 'css-only'
	html?: {
		code?: string
		language?: string
		[key: string]: any
	} | null
	css?: {
		code?: string
		language?: string
		[key: string]: any
	} | null
	caption?: string
	containerWidth?: 'narrow' | 'standard' | 'wide' | 'full'
	alignment?: 'center' | 'left' | 'right'
	spacing?: 'none' | 'compact' | 'standard' | 'spacious'
	aspectRatio?: 'auto' | '16/9' | '4/3' | '1/1'
	responsiveIframe?: boolean
	containerStyle?: 'clean' | 'card' | 'muted'
	borderRadius?: 'none' | 'md' | 'lg' | 'full'
	executeScripts?: boolean
	sandboxMode?: boolean
	sandboxPolicy?: 'standard' | 'strict' | 'permissive'
	sandboxHeight?: 'auto' | 'small' | 'medium' | 'large'
	attributes?: ModuleAttributes
	sanityAttr?: any
	'data-sanity'?: string
}

export default function CustomHTML({
	_key,
	_type = 'custom-html',
	badge,
	headline,
	subtitle,
	headerAlign = 'center',
	embedType = 'custom',
	html,
	css,
	caption,
	containerWidth = 'standard',
	alignment = 'center',
	spacing,
	aspectRatio = 'auto',
	responsiveIframe = true,
	containerStyle = 'clean',
	borderRadius = 'lg',
	className,
	executeScripts = true,
	sandboxMode = false,
	sandboxPolicy = 'standard',
	sandboxHeight = 'medium',
	attributes,
	sanityAttr,
	...props
}: CustomHTMLProps) {
	const rawHtmlCode = stegaClean(html?.code)
	const rawCssCode = stegaClean(css?.code)
	const cleanBadge = stegaClean(badge)
	const cleanHeadline = stegaClean(headline)
	const cleanSubtitle = stegaClean(subtitle)
	const cleanCaption = stegaClean(caption)
	const cleanClassName = stegaClean(className)

	const hasCode = Boolean(rawHtmlCode || rawCssCode)
	const hasHeader = Boolean(cleanHeadline || cleanBadge || cleanSubtitle)
	const isVisualEditing = Boolean(props['data-sanity'] || sanityAttr)

	// If no code and no header is configured:
	if (!hasCode && !hasHeader) {
		// Provide guidance placeholder in Sanity Studio Visual Editing / draft preview
		if (isVisualEditing) {
			return (
				<section
					{...moduleAttributes({ _key, _type, attributes, ...props })}
					className="py-10 px-4"
				>
					<div className="border-border/80 bg-muted/20 mx-auto max-w-2xl space-y-3 rounded-2xl border-2 border-dashed p-8 text-center sm:p-10">
						<div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
							<Code2 className="size-6" />
						</div>
						<h3 className="text-foreground text-base font-semibold sm:text-lg">
							Code & App Embed
						</h3>
						<p className="text-muted-foreground mx-auto max-w-md text-xs sm:text-sm leading-relaxed">
							No embed snippet or code configured yet. Select this module in
							Sanity Studio to paste HTML, iFrame widgets, or custom scripts.
						</p>
					</div>
				</section>
			)
		}
		return null
	}

	const cleanWidth = stegaClean(containerWidth) || 'standard'
	const defaultSpacing = hasHeader
		? 'standard'
		: cleanClassName?.includes('my-')
			? 'none'
			: 'compact'
	const cleanSpacing = stegaClean(spacing) || defaultSpacing
	const cleanContainerStyle = stegaClean(containerStyle) || 'clean'
	const cleanRadius = stegaClean(borderRadius) || 'lg'
	const cleanAlignment = stegaClean(alignment) || 'center'
	const cleanHeaderAlign = stegaClean(headerAlign) || 'center'
	const cleanAspectRatio = stegaClean(aspectRatio) || 'auto'
	const cleanResponsiveIframe = responsiveIframe !== false
	const cleanExecuteScripts = executeScripts !== false
	const cleanSandboxMode = process.env.ALLOW_TRUSTED_CUSTOM_HTML !== 'true' || Boolean(stegaClean(sandboxMode))
	const cleanSandboxPolicy =
		(stegaClean(sandboxPolicy) as 'standard' | 'strict' | 'permissive') ||
		'standard'
	const cleanSandboxHeight =
		(stegaClean(sandboxHeight) as 'auto' | 'small' | 'medium' | 'large') ||
		'medium'

	const widthClass =
		{
			narrow: 'max-w-3xl',
			standard: 'max-w-5xl',
			wide: 'max-w-7xl',
			full: 'w-full max-w-none px-0',
		}[cleanWidth] || 'max-w-5xl'

	const spacingClass =
		{
			none: 'py-0',
			compact: 'py-6 sm:py-8',
			standard: 'py-10 sm:py-16',
			spacious: 'py-16 sm:py-24',
		}[cleanSpacing] || 'py-10 sm:py-16'

	const containerStyleClass =
		{
			clean: 'bg-transparent',
			card: 'bg-card text-card-foreground border border-border/70 p-4 sm:p-7 shadow-xs',
			muted: 'bg-muted/40 text-foreground border border-border/40 p-4 sm:p-7',
		}[cleanContainerStyle] || 'bg-transparent'

	const radiusClass =
		{
			none: 'rounded-none',
			md: 'rounded-lg',
			lg: 'rounded-2xl',
			full: 'rounded-3xl',
		}[cleanRadius] || 'rounded-2xl'

	const alignmentClass =
		{
			center: 'text-center [&>*]:mx-auto',
			left: 'text-left [&>*]:mr-auto',
			right: 'text-right [&>*]:ml-auto',
		}[cleanAlignment] || 'text-center [&>*]:mx-auto'

	const aspectRatioClass =
		{
			auto: '',
			'16/9': '[&_iframe]:aspect-video [&_iframe]:h-auto',
			'4/3': '[&_iframe]:aspect-[4/3] [&_iframe]:h-auto',
			'1/1': '[&_iframe]:aspect-square [&_iframe]:h-auto',
		}[cleanAspectRatio] || ''

	const responsiveIframeClass = cleanResponsiveIframe
		? '[&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:border-0'
		: ''

	const embedClasses = cn(
		'relative w-full overflow-x-clip transition-all',
		containerStyleClass,
		cleanContainerStyle !== 'clean' && radiusClass,
		aspectRatioClass,
		responsiveIframeClass,
		alignmentClass,
	)

	const isHeaderCentered = cleanHeaderAlign === 'center'
	const headingId = _key ? `heading-${_key}` : undefined
	const moduleId =
		stegaClean(attributes?.uid) || (_key ? `module-${_key}` : undefined)

	return (
		<section
			{...moduleAttributes({ _key, _type, attributes, ...props })}
			className={cn('relative w-full', spacingClass, cleanClassName)}
			aria-labelledby={cleanHeadline ? headingId : undefined}
			aria-label={
				!cleanHeadline ? cleanBadge || 'Code & App Embed' : undefined
			}
		>
			{!cleanSandboxMode && <CSS code={rawCssCode} id={moduleId} />}

			<div className={cn('container mx-auto px-4 sm:px-6 lg:px-8', widthClass)}>
				{hasHeader && (
					<div
						className={cn(
							'mb-6 sm:mb-10 max-w-3xl',
							isHeaderCentered ? 'mx-auto text-center' : 'text-left mr-auto',
						)}
					>
						{cleanBadge && (
							<span className="bg-primary/10 text-primary mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
								{cleanBadge}
							</span>
						)}
						{cleanHeadline && (
							<h2
								id={headingId}
								className="text-foreground text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
							>
								{cleanHeadline}
							</h2>
						)}
						{cleanSubtitle && (
							<p className="text-muted-foreground mt-3 text-base leading-relaxed sm:text-lg">
								{cleanSubtitle}
							</p>
						)}
					</div>
				)}

				{rawHtmlCode && (
					<div className={embedClasses}>
						{cleanSandboxMode ? (
							<SandboxedFrame
								html={rawHtmlCode}
								css={rawCssCode}
								policy={cleanSandboxPolicy}
								heightPreset={cleanSandboxHeight}
								title={
									cleanHeadline ||
									cleanBadge ||
									'Sandboxed Application Embed'
								}
							/>
						) : rawHtmlCode.includes('<script') && cleanExecuteScripts ? (
							<WithScript
								code={rawHtmlCode}
								executeScripts={cleanExecuteScripts}
								className="w-full"
							/>
						) : (
							<div
								dangerouslySetInnerHTML={{ __html: rawHtmlCode }}
								className="w-full"
							/>
						)}
					</div>
				)}

				{cleanCaption && (
					<p
						className={cn(
							'text-muted-foreground mt-3 text-xs leading-relaxed',
							isHeaderCentered ? 'text-center' : 'text-left',
						)}
					>
						{cleanCaption}
					</p>
				)}
			</div>
		</section>
	)
}
