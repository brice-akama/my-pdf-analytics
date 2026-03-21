"use client";
import React, { useState, useEffect } from 'react';
import { Check, FileText, Users, Lock, BarChart3, Video, Download, Shield, Eye, Folder, Droplet, AlertCircle, Mail, Gauge, Cloud, Zap, Star } from 'lucide-react';

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
      name: 'Free',
      description: 'Get started with secure sharing',
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: 'forever',
      cta: 'Get Started Free',
      popular: false,
      features: [
        { icon: Users, text: '1 user included' },
        { icon: FileText, text: '5 documents' },
        { icon: BarChart3, text: 'Basic analytics' },
        { icon: Shield, text: '3 share links' },
        { icon: Cloud, text: '1 Space' },
        { icon: FileText, text: '2 eSignatures per month' },
      ],
    },
    {
      name: 'Starter',
      description: 'For individuals and freelancers',
      monthlyPrice: 19,
      yearlyPrice: 15,
      period: 'user/month',
      cta: 'Start Free Trial',
      popular: false,
      features: [
        { icon: Users, text: '1 user included' },
        { icon: FileText, text: 'Unlimited documents' },
        { icon: BarChart3, text: 'Full document analytics' },
        { icon: Shield, text: 'Unlimited share links' },
        { icon: Cloud, text: '3 Spaces' },
        { icon: FileText, text: '10 eSignatures per month' },
        { icon: Video, text: 'Video walkthroughs' },
        { icon: Droplet, text: 'Custom branding' },
      ],
    },
    {
      name: 'Pro',
      description: 'For growing teams and sales',
      monthlyPrice: 49,
      yearlyPrice: 39,
      period: 'user/month',
      cta: 'Start Free Trial',
      popular: true,
      badge: 'Most Popular',
      features: [
        { icon: Users, text: '3 users included' },
        { icon: FileText, text: 'Everything in Starter' },
        { icon: Cloud, text: 'Unlimited Spaces' },
        { icon: FileText, text: 'Unlimited eSignatures' },
        { icon: Zap, text: 'Bulk send' },
        { icon: BarChart3, text: 'Diligence tracking' },
        { icon: Shield, text: 'NDA and agreements' },
        { icon: Droplet, text: 'Dynamic watermarking' },
        { icon: AlertCircle, text: 'Compliance reports' },
        { icon: FileText, text: 'Version history' },
        { icon: Cloud, text: 'Google Drive + OneDrive' },
      ],
    },
    {
      name: 'Business',
      description: 'For teams that need full control',
      monthlyPrice: 99,
      yearlyPrice: 79,
      period: 'month',
      cta: 'Start Free Trial',
      popular: false,
      features: [
        { icon: Users, text: '10 users included' },
        { icon: FileText, text: 'Everything in Pro' },
        { icon: Cloud, text: 'Advanced data rooms' },
        { icon: AlertCircle, text: 'Full audit logs' },
        { icon: Lock, text: 'Folder level permissions' },
        { icon: Mail, text: 'Priority support' },
        { icon: Shield, text: 'Custom docs domain' },
        { icon: Gauge, text: 'Advanced team management' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6">
            <Star className="w-4 h-4" />
            No credit card required · Cancel anytime
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Simple, transparent pricing for every team
          </h1>
          <p className="text-lg text-slate-600">
            Start free and scale as you grow. DocMetrics gives you everything you need to track, share, and close deals faster.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className="flex items-center gap-2"
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
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
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              billingCycle === 'yearly' ? 'border-slate-900' : 'border-slate-400'
            }`}>
              {billingCycle === 'yearly' && (
                <div className="w-3 h-3 rounded-full bg-slate-900" />
              )}
            </div>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Billed yearly
            </span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              Save up to 40%
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
                    <span className="text-slate-600 text-sm">/{plan.period}</span>
                  </div>
                  {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/year
                    </p>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <p className="text-xs text-slate-400 mt-1">No credit card required</p>
                  )}
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 mb-8 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                      : plan.monthlyPrice === 0
                      ? 'bg-slate-900 text-white hover:bg-slate-800'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                    What is included:
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-blue-600" />
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
        <div className="mt-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Need a custom plan for your enterprise?</h3>
          <p className="text-slate-500 mb-6">
            We offer custom pricing for large teams, white labeling, SSO, and dedicated support.
          </p>
          <button className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl">
            Contact DocMetrics Sales
          </button>
        </div>

        {/* Compare Plans Section */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-4">Compare All Plans</h2>
          <p className="text-center text-slate-500 mb-12">See exactly what is included in each plan</p>

          {/* Comparison Header */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-2">
            <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="col-span-1" />
              {plans.map((plan) => (
                <div key={plan.name} className="text-center">
                  <p className="font-bold text-slate-900">{plan.name}</p>
                  <p className="text-sm text-slate-500">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    {plan.monthlyPrice > 0 ? `/${plan.period}` : ' free'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Features Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Core Features
              </h3>
              <div className="space-y-1">
                <FeatureRow name="Unlimited documents" availability={[false, true, true, true]} />
                <FeatureRow name="Share links" availability={[true, true, true, true]} />
                <FeatureRow name="Document analytics" availability={[true, true, true, true]} />
                <FeatureRow name="Video walkthroughs" availability={[false, true, true, true]} />
                <FeatureRow name="Custom branding" availability={[false, true, true, true]} />
                <FeatureRow name="eSignatures" availability={[true, true, true, true]} />
                <FeatureRow name="Unlimited eSignatures" availability={[false, false, true, true]} />
                <FeatureRow name="Bulk send" availability={[false, false, true, true]} />
                <FeatureRow name="Version history" availability={[false, false, true, true]} isLast />
              </div>
            </div>
          </div>

          {/* Spaces and Data Rooms */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Spaces and Data Rooms
              </h3>
              <div className="space-y-1">
                <FeatureRow name="Spaces" availability={[true, true, true, true]} />
                <FeatureRow name="Unlimited Spaces" availability={[false, false, true, true]} />
                <FeatureRow name="Diligence tracking" availability={[false, false, true, true]} />
                <FeatureRow name="Advanced data rooms" availability={[false, false, false, true]} />
                <FeatureRow name="Folder level permissions" availability={[false, false, false, true]} />
                <FeatureRow name="Full audit logs" availability={[false, false, false, true]} isLast />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Security
              </h3>
              <div className="space-y-1">
                <FeatureRow name="Password protected links" availability={[false, true, true, true]} />
                <FeatureRow name="NDA and agreements" availability={[false, false, true, true]} />
                <FeatureRow name="Dynamic watermarking" availability={[false, false, true, true]} />
                <FeatureRow name="Email OTP verification" availability={[false, false, true, true]} />
                <FeatureRow name="Access code protection" availability={[false, false, true, true]} />
                <FeatureRow name="Compliance reports" availability={[false, false, true, true]} isLast />
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Storage
              </h3>
              <div className="space-y-1">
                <StorageRow
                  name="Storage included"
                  values={['1 GB', '10 GB', '50 GB', '100 GB']}
                />
                <StorageRow
                  name="Max file size"
                  values={['10 MB', '100 MB', '500 MB', '2 GB']}
                />
                <StorageRow
                  name="Cloud integrations"
                  values={['-', '-', 'Google Drive + OneDrive', 'Google Drive + OneDrive']}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Team and Support
              </h3>
              <div className="space-y-1">
                <StorageRow
                  name="Users included"
                  values={['1', '1', '3', '10']}
                />
                <FeatureRow name="Team management" availability={[false, false, true, true]} />
                <FeatureRow name="Priority support" availability={[false, false, false, true]} />
                <FeatureRow name="Custom docs domain" availability={[false, false, false, true]} isLast />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                q: 'Can I try DocMetrics for free?',
                a: 'Yes. The Free plan is free forever with no credit card required. You can upgrade anytime when you need more features.',
              },
              {
                q: 'What happens when my free trial ends?',
                a: 'You will be moved to the Free plan automatically. Your documents and data are kept safe. You can upgrade at any time.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. There are no long-term contracts. You can cancel your subscription at any time and you will not be charged again.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied contact our support team.',
              },
              {
                q: 'Can I change my plan later?',
                a: 'Yes. You can upgrade or downgrade your plan at any time from your account settings.',
              },
              {
                q: 'Is my data secure?',
                a: 'Yes. DocMetrics uses enterprise-grade encryption. Your documents are stored securely and never shared with third parties.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-900 mb-2">{item.q}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-2">
              Trusted by thousands of sales teams, founders, and investors worldwide
            </p>
            <p className="text-xs text-slate-400">
              No credit card required · GDPR compliant · Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buttons */}
      {showStickyButtons && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 py-4 z-50 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plans.map((plan) => (
                <div key={plan.name} className="text-center">
                  <p className="text-xs text-slate-400 mb-1">{plan.name} — ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}{plan.monthlyPrice > 0 ? '/mo' : ''}</p>
                  <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                    {plan.monthlyPrice === 0 ? 'Get Started Free' : 'Start Free Trial'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const FeatureRow = ({ name, availability, isLast = false }: {
  name: string;
  availability: boolean[];
  isLast?: boolean;
}) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-3 ${!isLast ? 'border-b border-slate-100' : ''}`}>
    <div className="col-span-1">
      <span className="text-sm text-slate-700">{name}</span>
    </div>
    {availability.map((available, idx) => (
      <div key={idx} className="flex justify-center">
        {available ? (
          <Check className="w-5 h-5 text-blue-600" />
        ) : (
          <span className="text-slate-300 text-lg">—</span>
        )}
      </div>
    ))}
  </div>
);

const StorageRow = ({ name, values, isLast = false }: {
  name: string;
  values: string[];
  isLast?: boolean;
}) => (
  <div className={`grid grid-cols-5 gap-4 items-center py-3 ${!isLast ? 'border-b border-slate-100' : ''}`}>
    <div className="col-span-1">
      <span className="text-sm text-slate-700">{name}</span>
    </div>
    {values.map((value, idx) => (
      <div key={idx} className="flex justify-center">
        {value === '-' ? (
          <span className="text-slate-300 text-lg">—</span>
        ) : (
          <span className="text-sm text-slate-700 text-center">{value}</span>
        )}
      </div>
    ))}
  </div>
);

export default PricingPage;