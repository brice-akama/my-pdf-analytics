"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams();


  useEffect(() => {
    // Check for reset success
    if (searchParams?.get('reset') === 'success') {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
    }
  }, [searchParams]);

  useEffect(() => {
    // ✅ Detect invitation type from URL
    const redirect = searchParams?.get('redirect');
    
    // Team invitation
    if (redirect && redirect.includes('/invite-team/')) {
      const token = redirect.split('/invite-team/')[1];
      if (token) {
        sessionStorage.setItem('pendingTeamInvite', token);
      }
    }
    
    // Space invitation
    if (redirect && redirect.includes('/invite/') && !redirect.includes('/invite-team/')) {
      const token = redirect.split('/invite/')[1];
      if (token) {
        sessionStorage.setItem('pendingSpaceInvite', token);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim(); // ✅ Remove accidental whitespace

      console.log('🔍 Attempting login with:', { email: trimmedEmail }); // Debug log

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
        credentials: 'include'
      });

      const data = await res.json();
      console.log('📥 Login response:', { status: res.status, data }); // Debug log

      if (!res.ok) {
        setError(data?.error || "Invalid email or password");
        return;
      }

      console.log('✅ Login successful, redirecting...'); // Debug log

      // ✅ Priority 1a: Team invitation
      const pendingTeamInvite = sessionStorage.getItem('pendingTeamInvite');
      if (pendingTeamInvite) {
        sessionStorage.removeItem('pendingTeamInvite');
        console.log('📍 Redirecting to team invite:', pendingTeamInvite);
        router.push(`/invite-team/${pendingTeamInvite}`);
        return;
      }

      // ✅ Priority 1b: Space invitation
      const pendingSpaceInvite = sessionStorage.getItem('pendingSpaceInvite');
      if (pendingSpaceInvite) {
        sessionStorage.removeItem('pendingSpaceInvite');
        console.log('📍 Redirecting to space invite:', pendingSpaceInvite);
        router.push(`/invite/${pendingSpaceInvite}`);
        return;
      }

      // ✅ Priority 2: Check for redirect URL from query params
      const redirect = searchParams?.get('redirect');
      if (redirect && redirect !== '/login') {
        console.log('📍 Redirecting to query param:', redirect);
        router.push(redirect);
        return;
      }

      // ✅ Priority 3: Default redirect to dashboard
      console.log('📍 Redirecting to dashboard');
      router.push("/dashboard");
      
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = () => {
    try {
      const state = Math.random().toString(36).slice(2);
      sessionStorage.setItem("oauth_state", state);

      // ✅ Store any pending invitations before OAuth redirect
      const pendingTeamInvite = sessionStorage.getItem('pendingTeamInvite');
      const pendingSpaceInvite = sessionStorage.getItem('pendingSpaceInvite');
      const redirect = searchParams?.get('redirect');

      let nextUrl = "/dashboard"; // Default

      if (pendingTeamInvite) {
        nextUrl = `/invite-team/${pendingTeamInvite}`;
      } else if (pendingSpaceInvite) {
        nextUrl = `/invite/${pendingSpaceInvite}`;
      } else if (redirect && redirect !== '/login') {
        nextUrl = redirect;
      }

      console.log('🔵 Google OAuth - Next URL:', nextUrl); // Debug log

      const oauthUrl = `/api/auth/google?mode=login&next=${encodeURIComponent(nextUrl)}&state=${state}`;
      console.log('🔵 Redirecting to:', oauthUrl); // Debug log
      
      window.location.href = oauthUrl;
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      setError('Failed to initiate Google sign-in');
    }
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

      {/* Right Side - Simple Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to continue to DocMetrics</p>
          </div>

          {/*   SUCCESS MESSAGE */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {/* ✅ ONLY Google Sign In */}
          <Button
            type="button"
            className="w-full mb-6 h-12 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Sign up
            </Link>
          </div>

          {/* ✅ RESET PASSWORD LINK */}
          <div className="mt-4 text-center">
            <Link 
              href="/reset-password" 
              className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
            >
              Want to set a password or forgot yours? Reset here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}