"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams?.get("reset") === "success") {
      setSuccessMessage("Password reset successful. You can now sign in with your new password.")
    }
  }, [searchParams])

  useEffect(() => {
    const redirect = searchParams?.get("redirect")
    if (redirect && redirect.includes("/invite-team/")) {
      const token = redirect.split("/invite-team/")[1]
      if (token) sessionStorage.setItem("pendingTeamInvite", token)
    }
    if (redirect && redirect.includes("/invite/") && !redirect.includes("/invite-team/")) {
      const token = redirect.split("/invite/")[1]
      if (token) sessionStorage.setItem("pendingSpaceInvite", token)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedPassword = password.trim()
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Invalid email or password")
        return
      }
      const pendingTeamInvite = sessionStorage.getItem("pendingTeamInvite")
      if (pendingTeamInvite) {
        sessionStorage.removeItem("pendingTeamInvite")
        router.push(`/invite-team/${pendingTeamInvite}`)
        return
      }
      const pendingSpaceInvite = sessionStorage.getItem("pendingSpaceInvite")
      if (pendingSpaceInvite) {
        sessionStorage.removeItem("pendingSpaceInvite")
        router.push(`/invite/${pendingSpaceInvite}`)
        return
      }
      const redirect = searchParams?.get("redirect")
      if (redirect && redirect !== "/login") {
        router.push(redirect)
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    try {
      const state = Math.random().toString(36).slice(2)
      sessionStorage.setItem("oauth_state", state)
      const pendingTeamInvite = sessionStorage.getItem("pendingTeamInvite")
      const pendingSpaceInvite = sessionStorage.getItem("pendingSpaceInvite")
      const redirect = searchParams?.get("redirect")
      let nextUrl = "/dashboard"
      if (pendingTeamInvite) {
        nextUrl = `/invite-team/${pendingTeamInvite}`
      } else if (pendingSpaceInvite) {
        nextUrl = `/invite/${pendingSpaceInvite}`
      } else if (redirect && redirect !== "/login") {
        nextUrl = redirect
      }
      window.location.href = `/api/auth/google?mode=login&next=${encodeURIComponent(nextUrl)}&state=${state}`
    } catch {
      setError("Failed to initiate Google sign-in")
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">

        {/* Back to home arrow */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
            <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Card — same split layout as signup step 1 */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid lg:grid-cols-2 min-h-[560px]">

            {/* LEFT — Login form */}
            <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">

                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-10">
                  <div className="h-9 w-9">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                      <defs>
                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: "#a855f7", stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: "#0ea5e9", stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGrad)" />
                      <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2" />
                      <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2" />
                      <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-slate-900">DocMetrics</span>
                </div>

                <div className="mb-7">
                  <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                    Welcome back
                  </h1>
                  <p className="text-sm text-slate-500">
                    Sign in to continue to DocMetrics
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-11 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="text-right -mt-1">
                    <Link
                      href="/reset-password"
                      className="text-xs text-slate-400 hover:text-sky-600 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Don't have an account?{" "}
                  <Link href="/signup" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                    Sign up free
                  </Link>
                </p>
              </div>
            </div>

            {/* RIGHT — Branding panel (matches signup dark panel) */}
            <div className="bg-slate-900 p-8 lg:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">

                <div className="inline-block px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold text-white/80 mb-8">
                  Why teams choose DocMetrics
                </div>

                <h2 className="text-2xl font-semibold text-white leading-snug mb-4">
                  Know exactly what happens after you hit send.
                </h2>
                <p className="text-sm text-white/50 leading-relaxed mb-10">
                  Track every document interaction in real time. See who read it,
                  which pages held their attention, and when to follow up.
                </p>

                <div className="space-y-8">
                  {[
                    {
                      title: "Real-time page-by-page analytics",
                      description: "See exactly how long viewers spend on each page so you know what resonates.",
                    },
                    {
                      title: "Secure data rooms with NDA gating",
                      description: "Control access to sensitive documents with built-in NDA acceptance flows.",
                    },
                    {
                      title: "E-signatures with reading tracking",
                      description: "Combine signing with full visibility into whether the document was actually read.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 h-2 w-2 rounded-full bg-sky-400 mt-2" />
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                        <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} DocMetrics. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  )
}
