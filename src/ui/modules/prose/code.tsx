import { stegaClean } from 'next-sanity'
import type { ComponentProps } from 'react'
import { createHighlighterCore, splitLines } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import darkPlus from 'shiki/themes/dark-plus.mjs'
import { cn } from '@/lib/utils'
import type { Code } from '@/sanity/types'
import ClickToCopy from '@/ui/click-to-copy'
import css from './code.module.css'

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>

const LANGUAGE_LOADERS = {
	css: () => import('shiki/langs/css.mjs'),
	html: () => import('shiki/langs/html.mjs'),
	javascript: () => import('shiki/langs/javascript.mjs'),
	json: () => import('shiki/langs/json.mjs'),
	jsx: () => import('shiki/langs/jsx.mjs'),
	markdown: () => import('shiki/langs/markdown.mjs'),
	python: () => import('shiki/langs/python.mjs'),
	shellscript: () => import('shiki/langs/shellscript.mjs'),
	sql: () => import('shiki/langs/sql.mjs'),
	tsx: () => import('shiki/langs/tsx.mjs'),
	typescript: () => import('shiki/langs/typescript.mjs'),
	yaml: () => import('shiki/langs/yaml.mjs'),
} as const

const LANGUAGE_ALIASES: Record<string, keyof typeof LANGUAGE_LOADERS> = {
	bash: 'shellscript',
	sh: 'shellscript',
	shell: 'shellscript',
	zsh: 'shellscript',
	shellscript: 'shellscript',
	css: 'css',
	html: 'html',
	js: 'javascript',
	mjs: 'javascript',
	cjs: 'javascript',
	javascript: 'javascript',
	json: 'json',
	jsonc: 'json',
	jsx: 'jsx',
	md: 'markdown',
	markdown: 'markdown',
	py: 'python',
	python: 'python',
	sql: 'sql',
	mysql: 'sql',
	postgresql: 'sql',
	postgres: 'sql',
	tsx: 'tsx',
	ts: 'typescript',
	typescript: 'typescript',
	yml: 'yaml',
	yaml: 'yaml',
}

const THEME_LOADERS = {
	'dark-plus': () => Promise.resolve({ default: darkPlus }),
	'light-plus': () => import('shiki/themes/light-plus.mjs'),
} as const

type SupportedCodeTheme = keyof typeof THEME_LOADERS

let highlighterPromise: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighterCore({
			themes: [darkPlus],
			langs: [],
			engine: createJavaScriptRegexEngine({ forgiving: true }),
		}).catch((error) => {
			highlighterPromise = null
			throw error
		})
	}
	return highlighterPromise
}

async function resolveLanguage(
	highlighter: Highlighter,
	rawLanguage?: string | null,
): Promise<string> {
	const normalized = stegaClean(rawLanguage || '')
		.trim()
		.toLowerCase()
	const canonical = LANGUAGE_ALIASES[normalized]
	if (!canonical) return 'text'

	if (!highlighter.getLoadedLanguages().includes(canonical)) {
		try {
			await highlighter.loadLanguage(LANGUAGE_LOADERS[canonical])
		} catch {
			return 'text'
		}
	}
	return highlighter.getLoadedLanguages().includes(canonical) ? canonical : 'text'
}

async function resolveTheme(
	highlighter: Highlighter,
	theme: SupportedCodeTheme,
): Promise<SupportedCodeTheme> {
	if (!highlighter.getLoadedThemes().includes(theme)) {
		await highlighter.loadTheme(THEME_LOADERS[theme])
	}
	return theme
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export default async function ProseCode({
	value,
	theme = 'dark-plus',
	className,
}: {
	theme?: SupportedCodeTheme
	value?: Code
} & ComponentProps<'article'>) {
	if (!value?.code) return null

	const cleanedCode = stegaClean(value.code)
	const lines = splitLines(cleanedCode)
	const decorations = value.highlightedLines
		?.filter((row) => typeof row === 'number' && row >= 1 && row <= lines.length)
		.map((row) => ({
			row,
			characters: lines[row - 1]?.[0]?.length ?? 0,
		}))
		.filter(({ characters }) => characters > 0)
		.map(({ row, characters }) => ({
			start: { line: row - 1, character: 0 },
			end: { line: row - 1, character: characters },
			properties: { class: 'highlight' },
		}))

	let html: string
	try {
		const highlighter = await getHighlighter()
		const lang = await resolveLanguage(highlighter, value.language)
		const activeTheme = await resolveTheme(highlighter, theme)
		html = highlighter.codeToHtml(cleanedCode, {
			lang,
			theme: activeTheme,
			decorations,
		})
	} catch {
		html = `<pre class="shiki dark-plus"><code>${escapeHtml(cleanedCode)}</code></pre>`
	}

	const [path, filename] = value.filename?.includes('/')
		? value.filename.split(/(.*)\/(.*)$/).filter(Boolean)
		: [, value.filename]

	return (
		<article
			className={cn(
				'not-prose overflow-hidden rounded-xl border border-border/60 bg-zinc-950 text-zinc-100 shadow-xs my-6',
				className,
			)}
			data-module="code"
			aria-label={value.filename ? `Code: ${value.filename}` : 'Code snippet'}
		>
			<div className="flex min-h-10 items-center border-b border-white/10 bg-zinc-900/90 px-4 text-xs font-mono text-zinc-400">
				{value.filename ? (
					<div className="line-clamp-1 break-all">
						{path && <span className="opacity-50">{path}/</span>}
						<span className="text-zinc-200 font-medium">{filename}</span>
					</div>
				) : (
					<span className="text-zinc-500 uppercase tracking-wider text-[11px]">
						{value.language || 'code'}
					</span>
				)}
				<div className="ml-auto shrink-0 pl-2">
					<ClickToCopy
						value={stegaClean(value.code)}
						aria-label="Copy code to clipboard"
						className={cn(
							'p-1.5 text-base text-zinc-400 hover:text-white transition-colors not-hover:opacity-60 [&.copied]:opacity-100 [&.copied]:text-emerald-400',
						)}
					/>
				</div>
			</div>

			<div
				className={cn(
					css.code,
					'overflow-x-auto text-sm leading-relaxed p-4 font-mono [--highlight-color:var(--color-green-400)]',
				)}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</article>
	)
}
