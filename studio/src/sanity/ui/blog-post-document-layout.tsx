'use client'

import React from 'react'
import type { DocumentLayoutProps } from 'sanity'
import AiAuditFooterButton from './ai-audit-footer-button'

export function BlogPostDocumentLayout(props: DocumentLayoutProps) {
	const isBlogPost = props.documentType === 'blog.post'

	return (
		<>
			{props.renderDefault(props)}
			{isBlogPost && (
				<AiAuditFooterButton
					documentId={props.documentId}
					documentType={props.documentType}
				/>
			)}
		</>
	)
}
