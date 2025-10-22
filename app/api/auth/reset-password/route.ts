// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // TODO: Implement when domain + Zoho Mail is configured
    // This endpoint will:
    // 1. Validate email exists
    // 2. Generate reset token
    // 3. Send reset email via Zoho Mail
    
    return NextResponse.json(
      {
        success: false,
        error: 'Password reset is temporarily unavailable. Please contact support.',
        code: 'FEATURE_UNAVAILABLE'
      },
      { status: 503 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
