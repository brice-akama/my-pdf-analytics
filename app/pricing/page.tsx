"use client"
import React, { useState, useEffect } from 'react';
import { Check, FileText, Users, Lock, BarChart3, Video, Download, Shield, Eye, Folder, Droplet, AlertCircle, Mail, Gauge, Cloud } from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showStickyButtons, setShowStickyButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowStickyButtons(true);
      } else {
        setShowStickyButtons(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = [
    {
      name: 'Personal',
      description: 'For secure sharing',
      monthlyPrice: 15,
      yearlyPrice: 12,
      period: 'user/month',
      cta: 'Get Started Free',
      popular: false,
      features: [
        { icon: Users, text: '1 user included' },
        { icon: Shield, text: 'Basic sharing controls' },
        { icon: BarChart3, text: 'Document level analytics' },
        { icon: FileText, text: '4 eSignatures per month' },
        { icon: Eye, text: 'Unlimited visitors' },
      ],
    },
    {
      name: 'Standard',
      description: 'For multi-file secure sharing',
      monthlyPrice: 65,
      yearlyPrice: 52,
      period: 'user/month',
      cta: 'Get Started Free',
      popular: true,
      badge: 'Most Popular',
      features: [
        { icon: Users, text: '1 user included' },
        { icon: Folder, text: 'Multi-file sharing' },
        { icon: Video, text: 'Video and rich media analytics' },
        { icon: Download, text: 'File requests' },
        { icon: Droplet, text: 'Customizable branding' },
        { icon: FileText, text: 'Unlimited eSignature' },
      ],
    },
    {
      name: 'Advanced',
      description: 'For advanced security',
      monthlyPrice: 250,
      yearlyPrice: 200,
      period: 'month',
      cta: 'Get Started Free',
      popular: false,
      features: [
        { icon: Users, text: '3 users included' },
        { icon: Cloud, text: 'Lightweight data rooms (Spaces)' },
        { icon: Mail, text: 'Email authentication for visitors' },
        { icon: Lock, text: 'Allow/block visitors lists' },
        { icon: Shield, text: 'Folder and file level security' },
        { icon: Droplet, text: 'Dynamic watermarking' },
        { icon: FileText, text: 'NDAs and gating agreements' },
      ],
    },
    {
      name: 'Advanced Data Rooms',
      description: 'For complete deal control',
      monthlyPrice: 300,
      yearlyPrice: 240,
      period: 'month',
      cta: 'Get Started Free',
      popular: false,
      features: [
        { icon: Users, text: '3 users included' },
        { icon: Cloud, text: 'Enhanced data rooms (Spaces)' },
        { icon: Shield, text: 'Group visitor permissions' },
        { icon: AlertCircle, text: 'Data room audit log' },
        { icon: Gauge, text: 'Automatic file indexing' },
        { icon: BarChart3, text: 'Data room analytics' },
        { icon: Mail, text: 'Priority email support' },
        { icon: Cloud, text: '2X capacity per data room' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Find the best DocSend plan for your business needs
          </h1>
          <p className="text-lg text-slate-600">
            Secure, end-to-end deal solutions for businesses of all sizes. Close deals confidently with DocSend.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className="flex items-center gap-2"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              billingCycle === 'monthly' ? 'border-slate-900' : 'border-slate-400'
            }`}>
              {billingCycle === 'monthly' && (
                <div className="w-3 h-3 rounded-full bg-slate-900" />
              )}
            </div>
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Billed monthly
            </span>
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            className="flex items-center gap-2"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              billingCycle === 'yearly' ? 'border-slate-900' : 'border-slate-400'
            }`}>
              {billingCycle === 'yearly' && (
                <div className="w-3 h-3 rounded-full bg-slate-900" />
              )}
            </div>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Billed yearly (Save up to 40%)
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group ${
                plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                  {plan.badge}
                </div>
              )}

              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-slate-600">/{plan.period}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-xs text-green-600 mt-1">Billed annually</p>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-4">
                    Key Features:
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <feature.icon className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            Need a custom solution for your enterprise?
          </p>
          <button className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl">
            Contact Sales Team
          </button>
        </div>

        {/* Compare Plans Section */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Compare Plans</h2>
          
          {/* Billing Toggle for Compare Section */}
          <div className="flex items-center gap-4 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className="flex items-center gap-2"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                billingCycle === 'monthly' ? 'border-slate-900' : 'border-slate-400'
              }`}>
                {billingCycle === 'monthly' && (
                  <div className="w-3 h-3 rounded-full bg-slate-900" />
                )}
              </div>
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                Billed monthly
              </span>
            </button>

            <button
              onClick={() => setBillingCycle('yearly')}
              className="flex items-center gap-2"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                billingCycle === 'yearly' ? 'border-slate-900' : 'border-slate-400'
              }`}>
                {billingCycle === 'yearly' && (
                  <div className="w-3 h-3 rounded-full bg-slate-900" />
                )}
              </div>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
                Billed yearly (Save up to 40%)
              </span>
            </button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl shadow-md p-6 ${
                  plan.popular ? 'ring-2 ring-green-600' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}
                
                <div className="text-center pt-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-slate-600">/{plan.period}</span>
                  </div>
                  <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Core Features Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Core DocSend Features</h3>
              
              <div className="space-y-4">
                <FeatureRow 
                  name="Shared link access controls"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Real-time document analytics"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="One-click NDA"
                  availability={[false, true, true, true]}
                />
                <FeatureRow 
                  name="Custom branding"
                  availability={[false, true, true, true]}
                />
                <FeatureRow 
                  name="Dynamic watermarking"
                  availability={[false, false, true, true]}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Team Management and Control</h3>
              
              <div className="space-y-4">
                <FeatureRow 
                  name="User Roles and Permissions"
                  availability={[false, false, false, true]}
                />
                <FeatureRow 
                  name="Teams"
                  availability={[false, false, false, true]}
                />
                <FeatureRow 
                  name="Manager Approvals"
                  availability={[false, false, false, true]}
                />
                <FeatureRow 
                  name="Content Locking"
                  availability={[false, false, false, true]}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Security and Compliance</h3>
              
              <div className="space-y-4">
                <FeatureRow 
                  name="Two-Factor Authentication (2FA)"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Password Protect Your Documents"
                  availability={[false, true, true, true]}
                />
                <FeatureRow 
                  name="GDPR Compliant"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="US and EU Legislation Compliant"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Unique Document Links"
                  availability={[true, true, true, true]}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Storage</h3>
              
              <div className="space-y-4">
                <StorageRow 
                  name="Easy, secure sharing and storage"
                  values={['10 GB/user', '50 GB/user', '50 GB/user', '50 GB/user']}
                />
                <StorageRow 
                  name="Upload large documents"
                  values={['2 GB', '2 GB', '2 GB', '2 GB']}
                />
                <StorageRow 
                  name="Data Room Storage"
                  values={['-', '200 assets (per data room)', '2,000 assets (per data room)', '4,000 assets (per data room)']}
                />
                <StorageRow 
                  name="# of Data Rooms"
                  values={['-', 'Unlimited', 'Unlimited', 'Unlimited']}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8 mb-8">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Analytics and Insights</h3>
              
              <div className="space-y-4">
                <FeatureRow 
                  name="Page-by-page analytics"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Viewer engagement metrics"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Email notifications"
                  availability={[true, true, true, true]}
                />
                <FeatureRow 
                  name="Download tracking"
                  availability={[false, true, true, true]}
                  isLast
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-8">Trusted by over 30,000 companies worldwide</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
              {['Netflix', 'Airbnb', 'Stripe', 'Notion', 'Figma'].map((company) => (
                <div key={company} className="text-2xl font-bold text-slate-400">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buttons */}
      {showStickyButtons && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 py-4 z-50 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div key={plan.name} className="text-center">
                  <button className="w-full py-3 px-4 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors">
                    Try it Free
                  </button>
                  <p className="text-xs text-slate-400 mt-2">No credit card required. Cancel any time</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Helper Components
const FeatureRow = ({ name, availability, isLast = false }: { name: string; availability: boolean[]; isLast?: boolean }) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-4 ${!isLast ? 'border-b border-slate-200' : ''}`}>
    <div className="col-span-1 flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">{name}</span>
      <button className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-slate-400 text-xs">
        ?
      </button>
    </div>
    {availability.map((available, idx) => (
      <div key={idx} className="flex justify-center">
        {available ? (
          <Check className="w-5 h-5 text-blue-600" />
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>
    ))}
  </div>
);

const StorageRow = ({ name, values, isLast = false }: { name: string; values: string[]; isLast?: boolean }) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-4 ${!isLast ? 'border-b border-slate-200' : ''}`}>
    <div className="col-span-1 flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700">{name}</span>
      <button className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-slate-400 text-xs">
        ?
      </button>
    </div>
    {values.map((value, idx) => (
      <div key={idx} className="flex justify-center">
        {value === '-' ? (
          <span className="text-slate-400">-</span>
        ) : (
          <span className="text-sm text-slate-700">{value}</span>
        )}
      </div>
    ))}
  </div>
);

export default PricingPage;