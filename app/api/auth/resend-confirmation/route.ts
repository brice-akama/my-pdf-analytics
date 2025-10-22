// app/api/auth/resend-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // TODO: Implement when domain + Zoho Mail is configured
    // This endpoint will:
    // 1. Validate email exists
    // 2. Check if already confirmed
    // 3. Generate new confirmation token
    // 4. Send confirmation email via Zoho Mail
    
    return NextResponse.json(
      {
        success: false,
        error: 'Email confirmation resend is temporarily unavailable. Please contact support.',
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

// FUTURE IMPLEMENTATION GUIDE (When domain + Zoho is ready):
// 
// 1. Install nodemailer: npm install nodemailer @types/nodemailer
// 
// 2. Create Zoho Mail config (lib/email.ts):
// import nodemailer from 'nodemailer'
// 
// const transporter = nodemailer.createTransporter({
//   host: 'smtp.zoho.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.ZOHO_EMAIL,
//     pass: process.env.ZOHO_PASSWORD
//   }
// })
//
// export async function sendEmail(to: string, subject: string, html: string) {
//   return transporter.sendMail({
//     from: process.env.ZOHO_EMAIL,
//     to,
//     subject,
//     html
//   })
// }