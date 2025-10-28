"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"



export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const router = useRouter()

  
    
  

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Invalid email or password");
      return;
    }

    // ✅ Save token under "token" to match dashboard
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // Redirect to dashboard
    router.push("/dashboard");
  } catch (err) {
    console.error("Login error", err);
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};
  
  const handleGoogleSignIn = () => {
  const state = Math.random().toString(36).slice(2);
  sessionStorage.setItem("oauth_state", state);

  // ❌ remove encodeURIComponent
  const next = "/dashboard";

  window.location.href = `/api/auth/google?mode=login&next=${next}&state=${state}`;
};



  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              {/* Logo */}
              <div className="h-12 w-12">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGradient)"/>
                  <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                  <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                  <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
                </svg>
              </div>
              <span className="text-3xl font-bold text-gray-900">DocMetrics</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back to DocMetrics
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Track every document interaction with powerful analytics. Know exactly when your documents are opened, viewed, and shared.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mt-8">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Real-time document tracking</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Detailed engagement analytics</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-10 w-10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <defs>
                    <linearGradient id="logoGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGradientMobile)"/>
                  <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                  <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                  <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">DocMetrics</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in</h2>
            <p className="text-gray-600">Welcome back! Please enter your details.</p>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-11"
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
              or
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
{error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <span>Didn't receive a confirmation email? </span>
            <Link href="/resend" className="text-purple-600 hover:text-purple-700 hover:underline">
              Send again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}