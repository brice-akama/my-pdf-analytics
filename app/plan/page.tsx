"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Check, 
  ArrowLeft,
  Zap,
  Users,
  Shield,
  BarChart3,
  Sparkles
} from "lucide-react"

type PlanType = 'monthly' | 'annual'

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<PlanType>('monthly')
  const [currentPlan, setCurrentPlan] = useState('free')

  useEffect(() => {
    // Fetch user's current plan
    const fetchCurrentPlan = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const res = await fetch("/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          setCurrentPlan(data.user.profile.plan?.toLowerCase() || 'free')
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error)
      }
    }

    fetchCurrentPlan()
  }, [])

  const plans = [
    {
      id: 'personal',
      name: 'Personal',
      description: 'For secure sharing',
      monthlyPrice: 15,
      annualPrice: 10,
      features: [
        '1 user included',
        'Basic sharing controls',
        'Document level analytics',
        '4 eSignatures per month',
        'Unlimited visitors'
      ],
      cta: currentPlan === 'personal' ? 'Current Plan' : 'Select Plan',
      highlighted: false
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'For multi-file secure sharing',
      monthlyPrice: 65,
      annualPrice: 45,
      popular: true,
      features: [
        'All Personal features, plus:',
        '1 user included',
        'Multi-file sharing',
        'Video and rich media analytics',
        'File requests',
        'Customizable branding'
      ],
      cta: currentPlan === 'standard' ? 'Current Plan' : 'Select Plan',
      highlighted: true
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'For advanced security',
      monthlyPrice: 250,
      annualPrice: 150,
      features: [
        'All Standard features, plus:',
        '3 users included',
        'Lightweight data rooms (Spaces)',
        'Email authentication for visitors',
        'Allow/block visitors lists',
        'Folder and file level security'
      ],
      cta: currentPlan === 'advanced' ? 'Current Plan' : 'Select Plan',
      highlighted: false
    },
    {
      id: 'advanced-data-rooms',
      name: 'Advanced Data Rooms',
      description: 'For complete deal control',
      monthlyPrice: 300,
      annualPrice: 180,
      features: [
        'All Advanced features, plus:',
        '3 users included',
        'Enhanced data rooms (Spaces)',
        'Group visitor permissions',
        'Data room audit log',
        'Automatic file indexing'
      ],
      cta: currentPlan === 'advanced-data-rooms' ? 'Current Plan' : 'Select Plan',
      highlighted: false,
      badge: 'Your trial'
    }
  ]

  const getPrice = (plan: typeof plans[0]) => {
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
    return `$${price}`
  }

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) return
    
    // Here you would integrate with your payment processor (Stripe, etc.)
    console.log('Selected plan:', planId, 'Billing:', billingCycle)
    // For now, just navigate back
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300">
      {/* Header */}
      <header className="border-b bg-white/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2 text-slate-900 hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-900" />
              <span className="font-bold text-xl text-slate-900">
                DocMetrics
              </span>
            </div>

            {/* Your trial badge */}
            <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Your trial
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            There's a plan for everyone
          </h1>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-900 text-white shadow-lg'
                  : 'text-slate-900 hover:bg-white/30'
              }`}
            >
              Billed monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-purple-900 text-white shadow-lg'
                  : 'text-slate-900 hover:bg-white/30'
              }`}
            >
              <span>Billed annually (Save up to 40%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white/90 backdrop-blur p-6 transition-all hover:shadow-2xl hover:scale-105 ${
                plan.highlighted
                  ? 'shadow-2xl ring-2 ring-purple-900 scale-105'
                  : 'shadow-lg'
              }`}
            >
              {/* Most Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-900 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              
              {/* Your trial badge */}
              {plan.badge && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {plan.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      {getPrice(plan)}
                    </span>
                    <span className="text-slate-600 text-sm">
                      /user/month
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={currentPlan === plan.id}
                className={`w-full mb-6 py-6 font-semibold text-base ${
                  plan.highlighted
                    ? 'bg-purple-900 hover:bg-purple-800 text-white shadow-lg'
                    : currentPlan === plan.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  {plan.id === 'personal' ? 'Key Features:' : `All ${plans[0].name} features, plus:`}
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-purple-900" />
                        </div>
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-700 max-w-3xl mx-auto">
            Relevant taxes will be automatically included for jurisdictions where DocMetrics Inc. and DocMetrics International are registered. 
            For more information, visit our Help Center.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-3">
              <Shield className="h-8 w-8 text-purple-900" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Bank-level Security</h4>
            <p className="text-sm text-slate-700">256-bit SSL encryption</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-3">
              <Users className="h-8 w-8 text-purple-900" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">10,000+ Companies</h4>
            <p className="text-sm text-slate-700">Trust DocMetrics</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-3">
              <BarChart3 className="h-8 w-8 text-purple-900" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Real-time Analytics</h4>
            <p className="text-sm text-slate-700">Track every view</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/80 mb-3">
              <Zap className="h-8 w-8 text-purple-900" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Lightning Fast</h4>
            <p className="text-sm text-slate-700">99.9% uptime guarantee</p>
          </div>
        </div>
      </div>
    </div>
  )
}