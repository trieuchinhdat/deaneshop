import { NextResponse } from 'next/server'

// Studio identity is not application identity. Use the verified staff login.
export async function POST() {
	return NextResponse.json({ success: false, error: 'Studio session exchange is disabled. Sign in with your staff account.' }, { status: 403 })
}
