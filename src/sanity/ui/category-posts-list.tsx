'use client'

import React, { useEffect, useState } from 'react'
import { useClient, useFormValue } from 'sanity'
import { IntentLink } from 'sanity/router'
import { Card, Flex, Text, Spinner, Button } from '@sanity/ui'
import { DocumentIcon, LaunchIcon } from '@sanity/icons'

interface PostItem {
	_id: string
	title?: string
	publishDate?: string
	slug?: string
}

export default function CategoryPostsList() {
	const rawId = useFormValue(['_id']) as string | undefined
	const categoryId = rawId ? rawId.replace(/^drafts\./, '') : null

	const client = useClient({ apiVersion: '2024-01-01' })

	const [posts, setPosts] = useState<PostItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!categoryId) {
			setLoading(false)
			return
		}

		let isMounted = true
		setLoading(true)

		const query = `*[_type == "blog.post" && references($id)] | order(publishDate desc) {
			_id,
			title,
			publishDate,
			"slug": slug.current
		}`

		client
			.fetch<PostItem[]>(query, { id: categoryId })
			.then((data) => {
				if (isMounted) {
					setPosts(data || [])
					setLoading(false)
				}
			})
			.catch((err) => {
				if (isMounted) {
					console.error('Error fetching posts for category:', err)
					setError('Unable to load assigned posts.')
					setLoading(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [client, categoryId])

	if (!categoryId) {
		return (
			<Card padding={3} radius={2} shadow={1} tone="transparent">
				<Text size={1} muted>
					Please save the category before viewing assigned posts.
				</Text>
			</Card>
		)
	}

	if (loading) {
		return (
			<Card padding={3} radius={2} shadow={1}>
				<Flex align="center" gap={3}>
					<Spinner size={1} />
					<Text size={1} muted>
						Loading posts...
					</Text>
				</Flex>
			</Card>
		)
	}

	if (error) {
		return (
			<Card padding={3} radius={2} shadow={1} tone="critical">
				<Text size={1}>{error}</Text>
			</Card>
		)
	}

	return (
		<div style={{ width: '100%', boxSizing: 'border-box', marginTop: '4px' }}>
			<div style={{ marginBottom: '10px' }}>
				<Text size={1} weight="semibold" muted>
					Posts in this category ({posts.length})
				</Text>
			</div>

			{posts.length === 0 ? (
				<Card padding={3} radius={2} border tone="transparent">
					<Text size={1} muted align="center">
						No posts assigned to this category.
					</Text>
				</Card>
			) : (
				<div
					style={{
						maxHeight: '400px',
						overflowY: 'auto',
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						paddingRight: '4px',
						boxSizing: 'border-box',
					}}
				>
					{posts.map((post) => {
						const cleanPostId = post._id.replace(/^drafts\./, '')
						return (
							<div
								key={post._id}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: '12px',
									padding: '10px 14px',
									borderRadius: '6px',
									border: '1px solid var(--card-border-color, #e6e8ec)',
									background: 'var(--card-bg-color, #ffffff)',
									boxSizing: 'border-box',
									width: '100%',
								}}
							>
								{/* Left side: Icon + Title & Date */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
										minWidth: 0,
										flex: 1,
									}}
								>
									<div
										style={{
											flexShrink: 0,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: '#6e7683',
										}}
									>
										<DocumentIcon style={{ fontSize: '20px' }} />
									</div>

									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '4px',
											minWidth: 0,
											flex: 1,
										}}
									>
										<span
											style={{
												fontSize: '13px',
												fontWeight: 500,
												color: 'var(--card-fg-color, #101112)',
												whiteSpace: 'nowrap',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: 'block',
												lineHeight: '1.3',
											}}
										>
											{post.title || 'Untitled Post'}
										</span>
										{post.publishDate && (
											<span
												style={{
													fontSize: '11px',
													color: '#6e7683',
													lineHeight: '1.2',
												}}
											>
												Published: {post.publishDate}
											</span>
										)}
									</div>
								</div>

								{/* Right side: Open Button */}
								<div style={{ flexShrink: 0 }}>
									<IntentLink
										intent="edit"
										params={{ id: cleanPostId, type: 'blog.post' }}
										style={{ textDecoration: 'none', display: 'inline-block' }}
									>
										<Button
											mode="ghost"
											tone="primary"
											fontSize={1}
											padding={2}
											icon={LaunchIcon}
											text="Open post"
										/>
									</IntentLink>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
