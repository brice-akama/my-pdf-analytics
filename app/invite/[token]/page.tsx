'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  Shield,
  ArrowRight,
} from 'lucide-react'

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'accepted'

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()

  const [status, setStatus] = useState<InviteStatus>('loading')
  const [invitation, setInvitation] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [accepting, setAccepting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    checkInviteAndAuth()
  }, [])

  const checkInviteAndAuth = async () => {
    try {
      const authRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (authRes.ok) {
        const authData = await authRes.json()
        if (authData.success) {
          setIsAuthenticated(true)
          setCurrentUser(authData.user)
        }
      }

      const inviteRes = await fetch(`/api/invitations/${params.token}`)
      const inviteData = await inviteRes.json()

      if (inviteData.success) {
        setInvitation(inviteData.invitation)
        setEmail(inviteData.invitation.email || '')
        setStatus('valid')
      } else {
        setStatus('invalid')
      }
    } catch {
      setStatus('invalid')
    }
  }

  const acceptInvite = async (userId: string): Promise<string | null> => {
    const res = await fetch(`/api/invitations/${params.token}/accept`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (data.success) return data.spaceId
    return null
  }

  const handleAcceptInvite = async () => {
    if (!currentUser?.id) return
    setAccepting(true)
    try {
      const spaceId = await acceptInvite(currentUser.id)
      if (spaceId) {
        setStatus('accepted')
        setTimeout(() => router.push(`/spaces/${spaceId}`), 2000)
      } else {
        setAuthError('Failed to accept invitation')
      }
    } catch {
      setAuthError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    try {
      if (isSignup) {
        if (!firstName.trim() || !email.trim() || !password) {
          setAuthError('Please fill all required fields')
          return
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            email: email.trim(),
            password,
          }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          const spaceId = await acceptInvite(data.user.id)
          if (spaceId) {
            setStatus('accepted')
            setTimeout(() => router.push(`/spaces/${spaceId}`), 2000)
          } else {
            setAuthError('Account created but failed to accept invitation')
          }
        } else {
          setAuthError(data.error || 'Signup failed')
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          const spaceId = await acceptInvite(data.user.id)
          if (spaceId) {
            setStatus('accepted')
            setTimeout(() => router.push(`/spaces/${spaceId}`), 2000)
          } else {
            setAuthError('Signed in but failed to accept invitation')
          }
        } else {
          setAuthError(data.error || 'Login failed')
        }
      }
    } catch {
      setAuthError('Network error. Please try again.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center text-2xl">Invalid Invitation</CardTitle>
            <CardDescription className="text-center text-base">
              This invitation link is not valid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">You're In! 🎉</CardTitle>
            <CardDescription className="text-center text-base">
              You've successfully joined <strong>{invitation?.spaceName}</strong>. Redirecting to your space...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            You're Invited!
          </CardTitle>
          <CardDescription className="text-base">
            You've been invited to join the space <strong className="text-slate-800">{invitation?.spaceName}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Space</p>
                <p className="font-semibold text-slate-900">{invitation?.spaceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Your Role</p>
                <p className="font-semibold text-slate-900 capitalize">{invitation?.role}</p>
              </div>
            </div>
            {invitation?.inviterEmail && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Invited by</p>
                  <p className="font-semibold text-slate-900">{invitation?.inviterEmail}</p>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated && currentUser ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Signed in as {currentUser.email}</p>
                    <p className="text-xs text-green-700 mt-1">Click below to accept the invitation</p>
                  </div>
                </div>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}

              <Button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Not you?{' '}
                <button
                  onClick={() => {
                    document.cookie = 'token=; path=/; max-age=0'
                    document.cookie = 'auth-token=; path=/; max-age=0'
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                  }}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Sign in with a different account
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setIsSignup(false); setAuthError('') }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    !isSignup
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignup(true); setAuthError('') }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    isSignup
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}

              {isSignup && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={!!invitation?.email}
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSignup ? 'Create Account & Join Space' : 'Sign In & Join Space'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-slate-500">
            By accepting, you'll get access to all documents in this space
          </p>
        </CardContent>
      </Card>
    </div>
  )
}