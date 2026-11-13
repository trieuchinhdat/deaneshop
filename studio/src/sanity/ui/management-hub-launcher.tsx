'use client'

import React from 'react'
import { webUrl } from '../env'
import { Card, Stack, Text, Heading, Button, Flex, Box } from '@sanity/ui'
import { FiExternalLink, FiPackage, FiUsers, FiStar, FiMessageCircle } from 'react-icons/fi'

export default function ManagementHubLauncher() {
	return (
		<Card padding={5} height="fill" tone="default">
			<Flex direction="column" align="center" justify="center" height="fill" style={{ minHeight: '400px' }}>
				<Card
					padding={5}
					radius={4}
					shadow={2}
					style={{ maxWidth: '540px', width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
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
									Commerce & CRM Admin
								</Heading>
								<Text size={1} style={{ color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Cloudflare D1 Edge Operations Hub
								</Text>
							</Stack>
						</Flex>

						<Text size={2} style={{ color: '#64748b', lineHeight: '1.6' }}>
							All live transactional records (Orders, B2B Leads, Customer CRM, Product Reviews & Blog Comments) are stored in <strong>Cloudflare D1 Edge SQL</strong> and managed at ultra-fast edge speed in Commerce Admin.
						</Text>

						{/* Quick Feature Grid */}
						<Card padding={3} radius={3} tone="transparent" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
							<Stack space={2}>
								<Flex align="center" gap={2}>
									<FiPackage style={{ color: '#0284c7' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Orders:</strong> 1-click status updates, printable A4/A5 commercial invoices & packing slips.
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<FiUsers style={{ color: '#059669' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Leads & CRM:</strong> Kanban pipeline, qualification scoring, and direct customer outreach.
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<FiStar style={{ color: '#d97706' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Reviews:</strong> Moderate verified product reviews and post merchant responses.
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<FiMessageCircle style={{ color: '#8b5cf6' }} />
									<Text size={1} style={{ color: '#334155', fontWeight: '600' }}>
										<strong>Comments:</strong> Approve reader questions and publish expert responses.
									</Text>
								</Flex>
							</Stack>
						</Card>

						{/* Big Launch Button */}
						<Button
							as="a"
							href={`${webUrl}/admin`}
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
