import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomerUser {
	id: string
	name?: string
	email?: string
	phone?: string
	avatar?: string
	authProvider?: 'google' | 'credentials' | 'guest'
	orderCount?: number
	totalSpent?: number
	cskhStatus?: string
	createdAt?: string
	lastLoginAt?: string
}

interface AuthState {
	user: CustomerUser | null
	isAuthenticated: boolean
	isLoading: boolean
	setUser: (user: CustomerUser | null) => void
	setLoading: (loading: boolean) => void
	checkSession: () => Promise<CustomerUser | null>
	logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			isLoading: false,

			setUser: (user) =>
				set({
					user,
					isAuthenticated: !!user,
					isLoading: false,
				}),

			setLoading: (loading) => set({ isLoading: loading }),

			checkSession: async () => {
				try {
					set({ isLoading: true })
					const res = await fetch('/api/auth/me', {
						method: 'GET',
						headers: { 'Cache-Control': 'no-cache' },
					})
					if (res.ok) {
						const data = await res.json()
						if (data?.user) {
							set({ user: data.user, isAuthenticated: true, isLoading: false })
							return data.user
						}
					}
					set({ user: null, isAuthenticated: false, isLoading: false })
					return null
				} catch {
					set({ isLoading: false })
					return null
				}
			},

			logout: async () => {
				try {
					set({ isLoading: true })
					await fetch('/api/auth/logout', { method: 'POST' })
				} catch (error) {
					console.error('Lỗi khi đăng xuất:', error)
				} finally {
					set({ user: null, isAuthenticated: false, isLoading: false })
				}
			},
		}),
		{
			name: 'ecocros-auth-storage',
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
)
