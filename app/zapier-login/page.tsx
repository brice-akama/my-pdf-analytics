export const dynamic = 'force-dynamic'
"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"

export default function ZapierLoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid session.</p>
          <p className="text-slate-500 text-sm mt-1">
            Please start the connection from Zapier again.
          </p>
        </div>
      </div>
    )
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }

    setLoading(true)
    try {
      // Step 1 — Authenticate with your normal login endpoint
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        toast.error(loginData.error || "Invalid email or password")
        return
      }

      // Step 2 — Redirect to OAuth callback with userId + sessionId
      window.location.href =
        `/api/zapier/oauth/callback?session=${sessionId}&userId=${loginData.userId}`

    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Your app logo */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">Y</span>
            </div>
            <div className="text-slate-400 text-2xl">↔</div>
            {/* Zapier logo */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">Z</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Connect to Zapier
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Sign in to authorize Zapier to access your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

          {/* Info banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700">
              Zapier will be able to trigger automations based on your document
              activity and perform actions in your account.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-11 font-semibold mt-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authorizing...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Authorize Zapier</>
              )}
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-400 text-center mt-4">
            By authorizing, you allow Zapier to access your account
            according to our{" "}
            <a href="/privacy" className="underline hover:text-slate-600">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Cancel */}
        <p className="text-center mt-4">
          <button
            onClick={() => window.close()}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel — close this window
          </button>
        </p>

      </div>
    </div>
  )
}


