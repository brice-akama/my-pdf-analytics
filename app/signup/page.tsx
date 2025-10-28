"use client"

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Sparkles, Bell, Clock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from "react"

// Industry options for step 2
const industries = [
  'Legal',
  'Media & entertainment',
  'Real Estate',
  'Financial services',
  'Lending & investment',
  'Healthcare',
  'Education',
  'Manufacturing & distribution',
  'Technology (Hardware & Software)',
  'Professional services & consulting',
  'Other'
]

interface SignupFormData {
  firstName: string;
  lastName?: string;      // optional
  companyName: string;
  email: string;
  password: string;
  avatar?: string;        // optional
}

// Company size options for step 3
const companySizes = [
  { value: '1', label: 'Just me', icon: '👤' },
  { value: '2-10', label: '2-10 people', icon: '👥' },
  { value: '11-50', label: '11-50 people', icon: '👨‍👩‍👧' },
  { value: '51-200', label: '51-200 people', icon: '👨‍👩‍👧‍👦' },
  { value: '201-500', label: '201-500 people', icon: '🏢' },
  { value: '501+', label: '501+ people', icon: '🏛️' }
]

// Use case options for step 4
const useCases = [
  { value: 'board-investor', label: 'Board and investor updates' },
  { value: 'raising-capital', label: 'Raising capital for an investment fund' },
  { value: 'selling-product', label: 'Selling a product or service' },
  { value: 'employee-onboarding', label: 'Employee onboarding and hiring' },
  { value: 'client-partner', label: 'Client or partner relationships management' },
  { value: 'merger-acquisition', label: 'Merger or acquisition' },
  { value: 'raising-funds', label: 'Raising funds for a company' },
  { value: 'other', label: 'Other' }
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
  firstName: "",
  companyName: "",
  email: "",
  password: "",
});

  const [loading, setLoading] = useState(false)
 const [signupError, setSignupError] = useState<string | null>(null)

  // Calculate trial dates dynamically
  const trialInfo = useMemo(() => {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric'
      })
    }

    return {
      startDate: formatDate(today),
      endDate: formatDate(endDate),
      currentYear: today.getFullYear()
    }
  }, [])

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleIndustryNext = () => {
    if (selectedIndustry) {
      setStep(3)
    }
  }

  const handleCompanySizeNext = () => {
    if (selectedCompanySize) {
      setStep(4)
    }
  }

  const toggleUseCase = (value: string) => {
    setSelectedUseCases(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }



// ...existing code...
  // If OAuth returns the user with ?step=4 (or any step), pick 
  useEffect(() => {
  const handle = async () => {
    try {
      // 1️⃣ Respect explicit ?step= query
      const s = searchParams?.get("step");
      if (s) {
        const n = parseInt(s, 10);
        if (!isNaN(n) && n >= 1 && n <= 4) {
          setStep(n);
        }
      }

      // 2️⃣ Verify OAuth state (anti-CSRF)
      const stateParam = searchParams?.get("state");
      if (stateParam) {
        const saved = sessionStorage.getItem("oauth_state");
        if (!saved || stateParam !== saved) {
          setSignupError("OAuth verification failed (state mismatch). Please try again.");
          return;
        }
        sessionStorage.removeItem("oauth_state");
      }

      // 3️⃣ Decode Google profile data (if present)
      const profileB64 = searchParams?.get("profile");
      const oauthProcessed = sessionStorage.getItem("oauth_processed");
      if (profileB64 && !oauthProcessed) {
        try {
          const profileJson = JSON.parse(atob(profileB64));

          // Prefill fields for the user
          setFormData(prev => ({
            ...prev,
            firstName: profileJson.firstName || prev.firstName,
            companyName: profileJson.companyName || prev.companyName,
            email: profileJson.email || prev.email,
            password: "" // no password for Google users
          }));

          // Move user to step 2 (instead of 4)
          setStep(2);

          // Mark processed so it won’t re-run
          sessionStorage.setItem("oauth_processed", "1");
        } catch (err) {
          console.error("Invalid OAuth profile:", err);
          setSignupError("Invalid OAuth profile data");
        }
      }
    } catch (e) {
      console.error("OAuth handling error:", e);
    }
  };
  handle();
}, [searchParams]);

  const handleGoogleSignUp = () => {
    const state = Math.random().toString(36).slice(2)
    sessionStorage.setItem('oauth_state', state)

    // Ask the backend to redirect back to signup with step=4 after OAuth completes
    const next = encodeURIComponent('/signup?step=2')
    window.location.href = `/api/auth/google?mode=signup&next=${next}&state=${state}`
  }

 

  const handleUseCaseNext = async () => {
  if (selectedUseCases.length === 0) return
  setSignupError(null)
  setLoading(true)
  try {
const payload = {
  firstName: formData.firstName,
  companyName: formData.companyName,
  email: formData.email,
  password: formData.password, // may be empty for Google users
  avatar: formData.avatar || "", // 👈 new
  full_name: `${formData.firstName} ${formData.lastName || ""}`, // 👈 new
  industry: selectedIndustry,
  companySize: selectedCompanySize,
  useCases: selectedUseCases
};


    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) {
      setSignupError(data?.error || "Signup failed")
      setLoading(false)
      return
    }

    // ✅ CRITICAL: Save the token to localStorage
    if (data.token) {
      localStorage.setItem("token", data.token)
    } else {
      // If your API doesn't return a token on signup, you may need to auto-login
      // or adjust your backend to include it.
      console.warn("No token returned from signup")
    }

    // Now redirect — dashboard will find the token
    router.push("/dashboard")
  } catch (err) {
    console.error("Signup request failed", err)
    setSignupError("Network error. Please try again.")
  } finally {
    setLoading(false)
  }
}
 

  // Progress calculation
  const progress = (step / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {signupError && <div className="mb-4 text-sm text-red-600">{signupError}</div>}
        {/* Progress Bar */}
        {step > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Step {step} of 4</span>
              <span className="text-sm font-medium text-slate-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Sign Up Form */}
        {step === 1 && (
          <Card className="overflow-hidden shadow-2xl border-0">
            <div className="grid lg:grid-cols-2 min-h-[550px]">
              {/* Left Side - Sign Up Form */}
              <div className="bg-white p-6 lg:p-10 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  {/* Logo */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                          <defs>
                            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                            </linearGradient>
                          </defs>
                          <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGrad)"/>
                          <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                          <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                          <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
                        </svg>
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        DocMetrics
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      Start your 14-day free trial now
                    </h1>
                    <p className="text-slate-600">
                      No credit card required. Cancel anytime.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="h-12 px-4 bg-slate-50 border-slate-200"
                    />

                    <Input
                      type="text"
                      placeholder="Company name"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="h-12 px-4 bg-slate-50 border-slate-200"
                    />

                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-12 px-4 bg-slate-50 border-slate-200"
                    />

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="h-12 px-4 pr-12 bg-slate-50 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <Button 
                      onClick={handleGetStarted}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                    >
                      Get Started
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-500">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignUp}
                      className="w-full h-12 border-slate-200 hover:bg-slate-50"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with Google
                    </Button>
                  </div>

                  <p className="mt-6 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Log in
                    </a>
                  </p>
                </div>
              </div>

              {/* Right Side - Trial Info */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 lg:p-10 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 max-w-md mx-auto w-full">
                  <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
                    How your free trial works
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Trial starts today, {trialInfo.startDate}</h3>
                        <p className="text-blue-100">Try the latest advanced data room features built for your workflow</p>
                      </div>
                    </div>

                    <div className="ml-6 h-6 w-0.5 bg-white/20"></div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Trial ending reminder</h3>
                        <p className="text-blue-100">We'll remind you 3 days before your trial ends</p>
                      </div>
                    </div>

                    <div className="ml-6 h-6 w-0.5 bg-white/20"></div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Trial ends {trialInfo.endDate}</h3>
                        <p className="text-blue-100">You will not be charged unless you choose to upgrade</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Industry Selection */}
        {step === 2 && (
          <Card className="overflow-hidden shadow-2xl border-0 p-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Tell us about yourself</h1>
                <p className="text-slate-600">This helps us customize your experience</p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">What industry are you in?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => setSelectedIndustry(industry)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                        selectedIndustry === industry
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Company Size */}
        {step === 3 && (
          <Card className="overflow-hidden shadow-2xl border-0 p-8">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Before we get started</h1>
                <p className="text-slate-600">Help us understand your team size</p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">How many people work at your company?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companySizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setSelectedCompanySize(size.value)}
                      className={`p-5 rounded-xl border-2 transition-all text-left ${
                        selectedCompanySize === size.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{size.icon}</span>
                        <span className="font-semibold text-slate-900">{size.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCompanySizeNext}
                disabled={!selectedCompanySize}
                className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Use Case Selection */}
        {step === 4 && (
          <Card className="overflow-hidden shadow-2xl border-0">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Left Side - Use Case Selection */}
              <div className="bg-white p-8 lg:p-10 flex flex-col justify-center">
                <div className="max-w-xl mx-auto w-full">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                      Tell us about yourself
                    </h1>
                    <p className="text-slate-600">
                      This helps us customize your experience.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      What are you planning to use DocMetrics for?
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Select all that apply.</p>
                    
                    <div className="space-y-3">
                      {useCases.map((useCase) => (
                        <button
                          key={useCase.value}
                          onClick={() => toggleUseCase(useCase.value)}
                          className={`w-full px-5 py-4 rounded-xl border-2 transition-all text-left font-medium ${
                            selectedUseCases.includes(useCase.value)
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{useCase.label}</span>
                            {selectedUseCases.includes(useCase.value) && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

<Button
                    onClick={handleUseCaseNext}
                    disabled={selectedUseCases.length === 0 || loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating account..." : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Right Side - Illustration */}
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-8 lg:p-10 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 max-w-md mx-auto w-full flex items-center justify-center">
                  {/* Artistic Illustration */}
                  <svg viewBox="0 0 400 400" className="w-full max-w-md" xmlns="http://www.w3.org/2000/svg">
                    {/* Artist figure */}
                    <g transform="translate(100, 80)">
                      {/* Head with hat */}
                      <ellipse cx="50" cy="40" rx="35" ry="38" fill="#1e293b" opacity="0.15"/>
                      <rect x="20" y="10" width="60" height="30" rx="15" fill="#475569" opacity="0.2"/>
                      <circle cx="50" cy="45" r="25" fill="#f1f5f9"/>
                      
                      {/* Body */}
                      <path d="M 30 70 L 30 150 L 70 150 L 70 70 Z" fill="#cbd5e1" opacity="0.3"/>
                      
                      {/* Arms */}
                      <path d="M 30 80 L 10 120 L 15 125 L 35 85 Z" fill="#cbd5e1" opacity="0.3"/>
                      <path d="M 70 80 Q 90 100 85 120" stroke="#475569" strokeWidth="12" fill="none" opacity="0.3"/>
                      
                      {/* Tool/Chisel */}
                      <line x1="85" y1="120" x2="120" y2="160" stroke="#64748b" strokeWidth="4" opacity="0.4"/>
                      <rect x="118" y="158" width="8" height="25" fill="#94a3b8" opacity="0.4" transform="rotate(45 122 170)"/>
                    </g>

                    {/* Statue/Sculpture */}
                    <g transform="translate(220, 100)">
                      {/* Head */}
                      <ellipse cx="50" cy="40" rx="30" ry="35" fill="#e2e8f0" opacity="0.4"/>
                      
                      {/* Classical hair/curls */}
                      <path d="M 25 25 Q 20 20 25 15 Q 30 10 35 15 Q 40 20 35 25" fill="#cbd5e1" opacity="0.4"/>
                      <path d="M 65 30 Q 70 25 75 30 Q 75 35 70 38" fill="#cbd5e1" opacity="0.4"/>
                      
                      {/* Face features */}
                      <circle cx="40" cy="38" r="2" fill="#64748b" opacity="0.3"/>
                      <circle cx="60" cy="38" r="2" fill="#64748b" opacity="0.3"/>
                      <path d="M 45 50 Q 50 52 55 50" stroke="#64748b" strokeWidth="1.5" fill="none" opacity="0.3"/>
                      
                      {/* Neck and shoulders */}
                      <rect x="40" y="70" width="20" height="15" fill="#e2e8f0" opacity="0.4"/>
                      <path d="M 30 85 L 30 100 L 70 100 L 70 85 Z" fill="#f1f5f9" opacity="0.4"/>
                      
                      {/* Decorative draping */}
                      <path d="M 25 90 Q 30 95 35 90" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.3"/>
                      <path d="M 65 90 Q 70 95 75 90" stroke="#cbd5e1" strokeWidth="2" fill="none" opacity="0.3"/>
                    </g>

                    {/* Decorative elements */}
                    <circle cx="80" cy="320" r="4" fill="#a78bfa" opacity="0.3"/>
                    <circle cx="320" cy="100" r="6" fill="#60a5fa" opacity="0.3"/>
                    <circle cx="300" cy="340" r="5" fill="#c084fc" opacity="0.3"/>
                    
                    {/* Sparkles */}
                    <path d="M 140 60 L 142 66 L 148 68 L 142 70 L 140 76 L 138 70 L 132 68 L 138 66 Z" fill="#818cf8" opacity="0.4"/>
                    <path d="M 280 280 L 282 284 L 286 286 L 282 288 L 280 292 L 278 288 L 274 286 L 278 284 Z" fill="#818cf8" opacity="0.4"/>
                  </svg>
                </div>

                {/* Decorative text */}
                <div className="relative z-10 mt-8 text-center">
                  <p className="text-slate-600 text-lg font-medium">Customize your experience</p>
                  <p className="text-slate-500 text-sm mt-2">Help us tailor DocMetrics to your needs</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-slate-600 text-sm">
          <p>© {trialInfo.currentYear} DocMetrics. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}