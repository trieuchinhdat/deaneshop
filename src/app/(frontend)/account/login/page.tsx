import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './login-client'

export const metadata: Metadata = {
	title: 'Đăng nhập tài khoản | ECOCROS',
	description: 'Đăng nhập hoặc đăng ký tài khoản ECOCROS để quản lý đơn hàng và nhận ưu đãi độc quyền.',
}

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" /></div>}>
			<LoginClient />
		</Suspense>
	)
}
