import { cn } from '@/lib/utils'

export interface SandboxedFrameProps extends React.ComponentProps<'iframe'> {
	html?: string
	css?: string
	policy?: 'standard' | 'strict' | 'permissive'
	heightPreset?: 'auto' | 'small' | 'medium' | 'large'
	title?: string
}

export default function SandboxedFrame({
	html = '',
	css,
	policy = 'standard',
	heightPreset = 'medium',
	title = 'Sandboxed Application Embed',
	className,
	...props
}: SandboxedFrameProps) {
	// Construct the HTML5 sandbox attribute string
	const sandboxAttribute =
		{
			strict: 'allow-scripts',
			standard: 'allow-scripts allow-forms allow-popups allow-modals',
			permissive:
				'allow-scripts allow-forms allow-popups allow-modals',
		}[policy] || 'allow-scripts allow-forms allow-popups allow-modals'

	const heightClass =
		{
			auto: 'h-full min-h-[350px]',
			small: 'h-[350px]',
			medium: 'h-[500px]',
			large: 'h-[700px]',
		}[heightPreset] || 'h-[500px]'

	// Wrap inside an isolated HTML5 document with security isolation
	const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    img, iframe, video { max-width: 100%; }
    ${css || ''}
  </style>
</head>
<body>
  ${html}
</body>
</html>`

	return (
		<iframe
			srcDoc={srcDoc}
			sandbox={sandboxAttribute}
			title={title}
			aria-label={title}
			loading="lazy"
			className={cn(
				'w-full border-0 rounded-[inherit] transition-all bg-transparent',
				heightClass,
				className,
			)}
			{...props}
		/>
	)
}
