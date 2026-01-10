'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  ArrowRight
} from 'lucide-react'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orgName, setOrgName] = useState('')

  const orgId = searchParams.get('orgId')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!orgId || !email) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchOrgDetails()
  }, [orgId, email])

  const fetchOrgDetails = async () => {
  try {
    // ✅ NEW: Fetch without auth (public endpoint needed)
    const res = await fetch(`/api/organizations/${orgId}/public-info`)

    if (res.ok) {
      const data = await res.json()
      setOrgName(data.name)
    } else {
      setError('Organization not found')
    }
  } catch (err) {
    setError('Failed to load organization details')
  } finally {
    setLoading(false)
  }
}

  const handleAccept = async () => {
  setAccepting(true);
  setError('');

  try {
    // ✅ 1. Check if user is logged in
    const authCheck = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    const authData = await authCheck.json();
    const isLoggedIn = authCheck.ok && authData.user;

    if (!isLoggedIn) {
      // ❌ User not logged in → redirect to signup
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/signup?email=${email}&redirect=${returnUrl}`);
      return;
    }

    // ✅ 2. Check if logged-in email matches invitation email
    if (authData.user.email.toLowerCase() !== email?.toLowerCase()) {
      setError(`You're logged in as ${authData.user.email}, but this invitation is for ${email}. Please log out and sign in with the correct email.`);
      setAccepting(false);
      return;
    }

    // ✅ 3. Try to accept invitation
    const res = await fetch('/api/organizations/invitations/accept', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId })
    });

    const data = await res.json();

    if (res.status === 404) {
      // ✅ Invitation already accepted (user already in org)
      setSuccess(true);
      setTimeout(() => {
        router.push(`/organization/${orgId}/dashboard`);
      }, 1500);
      return;
    }

    if (res.ok && data.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/organization/${orgId}/dashboard`);
      }, 2000);
    } else {
      setError(data.error || 'Failed to accept invitation');
    }
  } catch (err) {
    console.error('Accept error:', err);
    setError('Failed to accept invitation. Please try again.');
  } finally {
    setAccepting(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center h-[60vh] overflow-y-auto ">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to {orgName}!
            </h2>
            <p className="text-slate-600 mb-6">
              You've successfully joined the organization. Redirecting to dashboard...
            </p>
            <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 text-white text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Organization Invitation</h1>
            <p className="text-purple-100">You've been invited to join a team</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Join {orgName}
                  </h2>
                  <p className="text-slate-600">
                    You've been invited to collaborate with this organization
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900 font-semibold mb-2">
                    Invitation Details:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Email:</strong> {email}</li>
                    <li>• <strong>Organization:</strong> {orgName}</li>
                  </ul>
                </div>

                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      Accept Invitation
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/spaces')}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}