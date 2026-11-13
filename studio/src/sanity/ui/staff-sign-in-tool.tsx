'use client'

import { definePlugin, useCurrentUser, useWorkspace } from 'sanity'
import { Button, Card, Stack, Text } from '@sanity/ui'
import { useEffect, useRef, useState } from 'react'
import { webUrl } from '../env'
import { captureLoginState, clearLoginState } from '../lib/login-state'

function StaffSignInTool() {
	const workspace = useWorkspace()
	const user = useCurrentUser()
	const token = useRef<string | null>(null)
	const [ready, setReady] = useState(false)
	const [pending, setPending] = useState(false)
	const [error, setError] = useState('')
	const [state, setState] = useState('')
	useEffect(() => {
		setState(captureLoginState())
	}, [])
	useEffect(() => {
		const subscription = workspace.auth.token?.subscribe((value) => {
			token.current = value
			setReady(Boolean(value))
		})
		return () => {
			subscription?.unsubscribe()
			token.current = null
		}
	}, [workspace.auth])
	async function signIn() {
		if (!token.current || pending || !state) return
		setPending(true)
		setError('')
		try {
			const endpoint = new URL('/api/admin/auth/sanity/exchange', webUrl)
			endpoint.searchParams.set('state', state)
			const response = await fetch(endpoint, {
				method: 'POST',
				credentials: 'omit',
				cache: 'no-store',
				redirect: 'error',
				headers: { Authorization: `Bearer ${token.current}` },
			})
			const result = await response.json().catch(() => null)
			if (!response.ok || typeof result?.code !== 'string')
				throw new Error(
					typeof result?.error === 'string'
						? result.error
						: `Sign-in unavailable (HTTP ${response.status}).`,
				)
			const callback = new URL('/api/admin/auth/sanity/callback', webUrl)
			callback.searchParams.set('state', state)
			callback.searchParams.set('code', result.code)
			clearLoginState()
			window.location.assign(callback.toString())
		} catch (failure) {
			setError(
				failure instanceof Error ? failure.message : 'Sign-in unavailable.',
			)
			setPending(false)
		}
	}
	return (
		<Card padding={5}>
			<Stack space={4}>
				<Text size={3} weight="semibold">
					Lead Workspace
				</Text>
				<Text>
					Continue as {user?.name || user?.email || 'your Sanity account'}.
				</Text>
				<Text size={1} muted>
					Sign in with your Sanity project account. Your staff identity will be
					linked automatically.
				</Text>
				<Button
					text="Continue to Lead Workspace"
					tone="primary"
					disabled={!ready || pending || !state}
					loading={pending}
					onClick={signIn}
				/>
				{(!state || error) && (
					<Button
						as="a"
						href={new URL('/api/admin/auth/sanity/start', webUrl).toString()}
						text="Start sign-in from the website"
						tone="primary"
					/>
				)}
				{!ready && (
					<Text size={1} muted>
						Waiting for your Sanity session. If this does not finish, sign out
						of Studio and sign in again.
					</Text>
				)}
				{error && (
					<Card tone="critical" padding={3} role="alert">
						<Text>{error}</Text>
					</Card>
				)}
			</Stack>
		</Card>
	)
}

export const staffSignInTool = definePlugin({
	name: 'staff-sign-in',
	tools: [
		{
			name: 'workspace-login',
			title: 'Lead Workspace',
			component: StaffSignInTool,
		},
	],
})
