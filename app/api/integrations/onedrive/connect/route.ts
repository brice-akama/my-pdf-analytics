import { NextRequest, NextResponse } from "next/server"
import { verifyUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const user = await verifyUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID!
  const redirectUri = process.env.ONEDRIVE_REDIRECT_URI!

  const scopes = [
    'offline_access',
    'Files.Read',
    'Files.Read.All',
    'User.Read',
  ].join(' ')

  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('state', user.id)
  authUrl.searchParams.set('response_mode', 'query')

  return NextResponse.redirect(authUrl.toString())
}