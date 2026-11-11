'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useEditState } from 'sanity'
import { Button, Dialog } from '@sanity/ui'
import { SparklesIcon } from '@sanity/icons'
import { auditArticle } from '@/sanity/lib/article-audit'
import { AiAuditModalContent } from '@/sanity/actions/ai-audit-action'

interface AiAuditFooterButtonProps {
	documentId: string
	documentType: string
}

function findPublishWrapper(
	publishBtn: HTMLElement,
): { parent: HTMLElement; wrapper: HTMLElement } | null {
	const paneFooter = publishBtn.closest('[data-testid="pane-footer"]')
	if (!paneFooter) return null

	// Walk up until we find an element whose parent has horizontal flex display
	// and contains multiple action items in the footer bar
	let current: HTMLElement = publishBtn
	while (
		current.parentElement &&
		current.parentElement !== paneFooter &&
		current.parentElement !== document.body
	) {
		const parent = current.parentElement
		const style = window.getComputedStyle(parent)
		const isRow =
			(style.display === 'flex' || style.display === 'inline-flex') &&
			style.flexDirection !== 'column'

		if (isRow && parent.children.length >= 2 && current !== publishBtn) {
			return { parent, wrapper: current }
		}

		current = parent
	}

	// Fallback: if loop reached paneFooter without finding a multi-child row
	if (current.parentElement) {
		return { parent: current.parentElement, wrapper: current }
	}

	return null
}

export default function AiAuditFooterButton({
	documentId,
	documentType,
}: AiAuditFooterButtonProps) {
	const editState = useEditState(documentId, documentType)
	const [isOpen, setIsOpen] = useState(false)
	const [mountedTarget, setMountedTarget] = useState<HTMLElement | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)

	const doc = editState?.draft || editState?.published || {}
	const audit = auditArticle(doc)

	useEffect(() => {
		if (typeof document === 'undefined') return

		if (!containerRef.current) {
			const el = document.createElement('div')
			el.setAttribute('data-sanity-custom-action', 'ai-audit')
			el.style.display = 'inline-flex'
			el.style.alignItems = 'center'
			el.style.flexShrink = '0'
			el.style.margin = '0'
			el.style.padding = '0'
			containerRef.current = el
		}

		const container = containerRef.current

		const attachButton = () => {
			const publishBtn = document.querySelector<HTMLElement>(
				'[data-testid="action-publish"]',
			)
			if (!publishBtn) return false

			const found = findPublishWrapper(publishBtn)
			if (found) {
				const { parent, wrapper } = found
				// Check if already positioned correctly immediately before publish wrapper
				if (
					container.parentElement !== parent ||
					container.nextElementSibling !== wrapper
				) {
					parent.insertBefore(container, wrapper)
					setMountedTarget(container)
				}
				return true
			}
			return false
		}

		// Initial mount attempt
		attachButton()

		// Continuous observer to re-anchor whenever Sanity re-renders the footer actions
		const observer = new MutationObserver(() => {
			attachButton()
		})

		const paneFooter =
			document.querySelector('[data-testid="pane-footer"]') || document.body
		observer.observe(paneFooter, { childList: true, subtree: true })

		return () => {
			observer.disconnect()
			container.remove()
			setMountedTarget(null)
		}
	}, [documentId])

	if (!mountedTarget) return null

	return createPortal(
		<>
			<Button
				icon={SparklesIcon}
				text="AI Audit"
				tone="primary"
				mode="ghost"
				fontSize={1}
				padding={2}
				onClick={() => setIsOpen(true)}
				title="Run AI SEO & Quality Audit"
				style={{
					cursor: 'pointer',
					whiteSpace: 'nowrap',
					fontWeight: 600,
				}}
			/>

			{isOpen && (
				<Dialog
					id="ai-audit-dialog"
					header="Global Editorial Quality & Search Readiness (GEQSR-1.0)"
					onClose={() => setIsOpen(false)}
					width={3}
				>
					<AiAuditModalContent doc={doc} onClose={() => setIsOpen(false)} />
				</Dialog>
			)}
		</>,
		mountedTarget,
	)
}
