'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvitation()
  }, [])

  const fetchInvitation = async () => {
    try {
      const res = await fetch(`/api/invitations/${params.token}`)
      const data = await res.json()

      if (data.success) {
        setInvitation(data.invitation)
      } else {
        setError(data.error || 'Invalid invitation')
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    try {
      const res = await fetch(`/api/invitations/${params.token}/accept`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await res.json()

      if (data.requiresAuth) {
        sessionStorage.setItem('pendingInvite', params.token as string)
        router.push(`/login?redirect=/invite/${params.token}`)
        return
      }

      if (data.success) {
        alert('✅ Invitation accepted! Redirecting to space...')
        router.push(`/spaces/${data.spaceId}`)
      } else {
        setError(data.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Failed to accept invitation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h1>
          <p className="text-slate-600 mb-6 text-sm sm:text-base">{error}</p>
          <Button className="w-full sm:w-auto" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">You're Invited!</h1>
          <p className="text-sm sm:text-base text-slate-600">
            You've been invited to join{' '}
            <strong className="text-slate-900">{invitation?.spaceName}</strong>
          </p>
        </div>

        {/* Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-3">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-0.5 sm:gap-4">
    <span className="text-slate-500">Space</span>
    <span className="font-semibold text-slate-900 truncate">{invitation?.spaceName}</span>
  </div>
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-0.5 sm:gap-4">
    <span className="text-slate-500">Your Role</span>
    <span className="font-semibold text-slate-900 capitalize">{invitation?.role}</span>
  </div>
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-0.5 sm:gap-4">
    <span className="text-slate-500">Invited by</span>
    <span className="font-semibold text-slate-900 truncate">{invitation?.inviterEmail}</span>
  </div>
</div>

        {/* Actions */}
        <Button
          onClick={handleAccept}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 text-sm sm:text-base"
        >
          Accept Invitation
        </Button>

        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-3 text-center">
            Don't have an account yet?
          </p>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.setItem('pendingInvite', params.token as string)
              router.push(`/signup?redirect=/invite/${params.token}`)
            }}
            className="w-full h-11 text-sm sm:text-base"
          >
            Create Account First
          </Button>
        </div>

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-4">
          By accepting, you'll get access to all documents in this space
        </p>
      </div>
    </div>
  )
}