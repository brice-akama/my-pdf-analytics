export const dynamic = 'force-dynamic'
"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Bell, Clock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

const industries = [
  'Legal',
  'Media and entertainment',
  'Real Estate',
  'Financial services',
  'Lending and investment',
  'Healthcare',
  'Education',
  'Manufacturing and distribution',
  'Technology',
  'Professional services and consulting',
  'Other',
]

interface SignupFormData {
  firstName: string
  lastName?: string
  companyName: string
  email: string
  password: string
  avatar?: string
}

const companySizes = [
  { value: '1', label: 'Just me' },
  { value: '2-10', label: '2 to 10 people' },
  { value: '11-50', label: '11 to 50 people' },
  { value: '51-200', label: '51 to 200 people' },
  { value: '201-500', label: '201 to 500 people' },
  { value: '501+', label: '501 or more people' },
]

const useCases = [
  { value: 'board-investor', label: 'Board and investor updates' },
  { value: 'raising-capital', label: 'Raising capital for an investment fund' },
  { value: 'selling-product', label: 'Selling a product or service' },
  { value: 'employee-onboarding', label: 'Employee onboarding and hiring' },
  { value: 'client-partner', label: 'Client or partner relationships management' },
  { value: 'merger-acquisition', label: 'Merger or acquisition' },
  { value: 'raising-funds', label: 'Raising funds for a company' },
  { value: 'other', label: 'Other' },
]

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedCompanySize, setSelectedCompanySize] = useState<string>('')
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([])
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)

  const trialInfo = useMemo(() => {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14)
    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    return {
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      currentYear: today.getFullYear(),
    }
  }, [])

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleIndustryNext = () => {
    if (selectedIndustry) setStep(3)
  }

  const handleCompanySizeNext = () => {
    if (selectedCompanySize) setStep(4)
  }

  const toggleUseCase = (value: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  useEffect(() => {
    const redirect = searchParams?.get('redirect')
    if (redirect && redirect.includes('/invite-team/')) {
      const token = redirect.split('/invite-team/')[1]
      if (token) sessionStorage.setItem('pendingTeamInvite', token)
    }
    if (redirect && redirect.includes('/invite/') && !redirect.includes('/invite-team/')) {
      const token = redirect.split('/invite/')[1]
      if (token) sessionStorage.setItem('pendingSpaceInvite', token)
    }
    const teamInviteParam = searchParams?.get('team_invite')
    if (teamInviteParam) sessionStorage.setItem('pendingTeamInvite', teamInviteParam)
    const spaceInviteParam = searchParams?.get('space_invite')
    if (spaceInviteParam) sessionStorage.setItem('pendingSpaceInvite', spaceInviteParam)
  }, [searchParams])

  useEffect(() => {
    const redirect = searchParams?.get('redirect')
    if (redirect && redirect.includes('/invite/')) {
      const token = redirect.split('/invite/')[1]
      if (token) sessionStorage.setItem('pendingInvite', token)
    }
  }, [searchParams])

  useEffect(() => {
    const handle = async () => {
      try {
        const s = searchParams?.get('step')
        if (s) {
          const n = parseInt(s, 10)
          if (!isNaN(n) && n >= 1 && n <= 4) setStep(n)
        }
        const stateParam = searchParams?.get('state')
        if (stateParam) {
          const saved = sessionStorage.getItem('oauth_state')
          if (!saved || stateParam !== saved) {
            setSignupError('OAuth verification failed. Please try again.')
            return
          }
          sessionStorage.removeItem('oauth_state')
        }
        const profileB64 = searchParams?.get('profile')
        const oauthProcessed = sessionStorage.getItem('oauth_processed')
        if (profileB64 && !oauthProcessed) {
          try {
            const profileJson = JSON.parse(atob(profileB64))
            setFormData((prev) => ({
              ...prev,
              firstName: profileJson.firstName || prev.firstName,
              companyName: profileJson.companyName || prev.companyName,
              email: profileJson.email || prev.email,
              password: '',
            }))
            setStep(2)
            sessionStorage.setItem('oauth_processed', '1')
          } catch {
            setSignupError('Invalid OAuth profile data')
          }
        }
      } catch {
        // silent
      }
    }
    handle()
  }, [searchParams])

  const handleGoogleSignUp = () => {
    const state = Math.random().toString(36).slice(2)
    sessionStorage.setItem('oauth_state', state)
    window.location.href = `/api/auth/google?mode=signup&state=${state}`
  }

  const handleUseCaseNext = async () => {
    if (selectedUseCases.length === 0) return
    setSignupError(null)
    setLoading(true)
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        companyName: formData.companyName || '',
        email: formData.email,
        password: formData.password || undefined,
        avatar: formData.avatar || '',
        ...(formData.password ? {} : { full_name: `${formData.firstName} ${formData.lastName || ''}` }),
        industry: selectedIndustry,
        companySize: selectedCompanySize,
        useCases: selectedUseCases,
      }
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setSignupError(data?.error || 'Signup failed')
        setLoading(false)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      const pendingTeamInvite = sessionStorage.getItem('pendingTeamInvite')
      if (pendingTeamInvite) {
        sessionStorage.removeItem('pendingTeamInvite')
        router.push(`/invite-team/${pendingTeamInvite}`)
        return
      }
      const pendingInvite = sessionStorage.getItem('pendingInvite')
      if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite')
        router.push(`/invite/${pendingInvite}`)
        return
      }
      const sp = new URLSearchParams(window.location.search)
      const redirect = sp.get('redirect')
      if (redirect) {
        router.push(redirect)
        return
      }
      router.push('/dashboard')
    } catch {
      setSignupError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">

        {/* Error */}
        {signupError && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{signupError}</p>
          </div>
        )}

        {/* Progress bar */}
        {step > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Step {step} of 4
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: Sign Up ── */}
        {step === 1 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid lg:grid-cols-2 min-h-[560px]">

              {/* LEFT — Form */}
              <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">

                  {/* Logo */}
                  <div className="flex items-center gap-2.5 mb-10">
                    <div className="h-9 w-9">
                      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <defs>
                          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
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
                      Start your 14-day free trial
                    </h1>
                    <p className="text-sm text-slate-500">
                      No credit card required. Cancel anytime.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        First Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Jane"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-11 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Company Name
                      </label>
                      <Input
                        type="text"
                        placeholder="Acme Inc"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="h-11 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11 border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                    <Button
                      onClick={handleGetStarted}
                      className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-slate-400">Or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignUp}
                      className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign up with Google
                    </button>
                  </div>

                  <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                      Sign in
                    </a>
                  </p>
                </div>
              </div>

              {/* RIGHT — Trial info */}
              <div className="bg-slate-900 p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">

                  <div className="inline-block px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold text-white/80 mb-8">
                    How your free trial works
                  </div>

                  <div className="space-y-8">
                    {[
                      {
                        icon: Sparkles,
                        title: `Trial starts today, ${trialInfo.startDate}`,
                        description: 'Get full access to all DocMetrics features from day one. No restrictions during your trial.',
                      },
                      {
                        icon: Bell,
                        title: 'Trial ending reminder',
                        description: 'We will remind you 3 days before your trial ends so you are never surprised.',
                      },
                      {
                        icon: Clock,
                        title: `Trial ends ${trialInfo.endDate}`,
                        description: 'You will not be charged unless you choose to upgrade to a paid plan.',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-white/70" />
                        </div>
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
        )}

        {/* ── STEP 2: Industry ── */}
        {step === 2 && (
          <div className="border border-slate-200 rounded-2xl bg-white p-8 lg:p-12 shadow-sm">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                  Tell us about yourself
                </h1>
                <p className="text-sm text-slate-500">
                  This helps us customise your experience.
                </p>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  What industry are you in?
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => setSelectedIndustry(industry)}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                        selectedIndustry === industry
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleIndustryNext}
                disabled={!selectedIndustry}
                className="h-11 px-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Company Size ── */}
        {step === 3 && (
          <div className="border border-slate-200 rounded-2xl bg-white p-8 lg:p-12 shadow-sm">
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                  Before we get started
                </h1>
                <p className="text-sm text-slate-500">
                  Help us understand your team size.
                </p>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  How many people work at your company?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {companySizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setSelectedCompanySize(size.value)}
                      className={`px-5 py-4 rounded-xl border text-left transition-all ${
                        selectedCompanySize === size.value
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${
                        selectedCompanySize === size.value
                          ? 'text-sky-700'
                          : 'text-slate-900'
                      }`}>
                        {size.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCompanySizeNext}
                disabled={!selectedCompanySize}
                className="h-11 px-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Use Cases ── */}
        {step === 4 && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid lg:grid-cols-2 min-h-[560px]">

              {/* LEFT — Use case selection */}
              <div className="bg-white p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="mb-7">
                    <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                      What will you use DocMetrics for?
                    </h1>
                    <p className="text-sm text-slate-500">
                      Select all that apply.
                    </p>
                  </div>

                  <div className="space-y-2 mb-8">
                    {useCases.map((useCase) => (
                      <button
                        key={useCase.value}
                        onClick={() => toggleUseCase(useCase.value)}
                        className={`w-full px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                          selectedUseCases.includes(useCase.value)
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{useCase.label}</span>
                        {selectedUseCases.includes(useCase.value) && (
                          <div className="h-5 w-5 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={handleUseCaseNext}
                    disabled={selectedUseCases.length === 0 || loading}
                    className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* RIGHT — Info panel */}
              <div className="bg-slate-50 border-l border-slate-200 p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
                    Almost there
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4 leading-snug">
                    DocMetrics adapts to how you work.
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-8">
                    Your answers help us show you the most relevant features
                    first so you get value from DocMetrics on day one.
                  </p>
                  <div className="space-y-4">
                    {[
                      "Your dashboard is personalised based on your use case",
                      "We surface the features most relevant to your industry",
                      "Your onboarding checklist is tailored to your goals",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            © {trialInfo.currentYear} DocMetrics. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  )
}
