'use client'

import React from 'react'
import { Card, Stack, Text, Heading, Button, Flex, Box } from '@sanity/ui'
import { FiExternalLink, FiPackage, FiUsers, FiStar } from 'react-icons/fi'

export default function ManagementHubLauncher() {
	return (
		<Card padding={5} height="fill" tone="default">
			<Flex direction="column" align="center" justify="center" height="fill" style={{ minHeight: '400px' }}>
				<Card
					padding={5}
					radius={4}
					shadow={2}
					style={{ maxWidth: '520px', width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
				>
					<Stack space={4}>
						<Flex align="center" gap={3}>
							<Box
								style={{
									width: '48px',
									height: '48px',
									borderRadius: '16px',
									backgroundColor: '#0f172a',
									color: '#ffffff',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '22px',
									fontWeight: 'bold',
								}}
							>
								E
							</Box>
							<Stack space={1}>
								<Heading size={2} style={{ color: '#0f172a', fontWeight: '800' }}>
									Commerce Admin
								</Heading>
								<Text size={1} style={{ color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Orders, CRM & Customer Operations
								</Text>
							</Stack>
						</Flex>

						<Text size={2} style={{ color: '#64748b', lineHeight: '1.6' }}>
							All operational transactional features including <strong>Order Fulfillment</strong>,{' '}
							<strong>Customer CRM 360°</strong>, and <strong>Product Reviews Moderation</strong> are managed in the high-speed dedicated Commerce Admin workspace.
						</Text>

						{/* Quick Feature Grid */}
						<Card padding={3} radius={3} tone="transparent" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
							<Stack space={2}>
								<Flex align="center" gap={2}>
									<FiPackage style={{ color: '#0284c7' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Orders:</strong> 1-Click status updates, search, and A4/A5 print invoices.
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<FiUsers style={{ color: '#059669' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Customer CRM:</strong> Leads from popup, order history, VIP tiers, and notes.
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<FiStar style={{ color: '#d97706' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Reviews:</strong> 1-Click approval, media preview, and seller response.
									</Text>
								</Flex>
							</Stack>
						</Card>

						{/* Big Launch Button */}
						<Button
							as="a"
							href="/admin"
							target="_blank"
							rel="noopener noreferrer"
							tone="positive"
							padding={4}
							radius={3}
							style={{ cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}
						>
							<Flex align="center" justify="center" gap={2}>
								<Text size={2} weight="bold" style={{ color: '#ffffff' }}>
									Open Commerce Admin (/admin)
								</Text>
								<FiExternalLink style={{ color: '#ffffff', fontSize: '18px' }} />
							</Flex>
						</Button>
					</Stack>
				</Card>
			</Flex>
		</Card>
	)
}
