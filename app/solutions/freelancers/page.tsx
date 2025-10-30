"use client";


import React, { JSX } from "react";
import { Briefcase, Eye, Clock, DollarSign, Shield, CheckCircle2, TrendingUp, Users, FileText, Zap, Award, BarChart3, Lock, Download, Mail, Target, Star } from "lucide-react";

export default function FreelancersAgenciesPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" />
            For Freelancers & Agencies
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Win More Clients with Smart Proposal Tracking
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Stop wondering if clients viewed your proposals. Know exactly when they open your portfolio, 
            which projects interest them most, and when to follow up. DocMetri helps freelancers and 
            agencies close more deals with data-driven insights.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 md:p-12 border border-red-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Freelancer's Dilemma
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              You spend hours crafting the perfect proposal, designing your portfolio, or preparing project 
              documents. You send them to potential clients and then... crickets. Did they even open it? 
              Are they interested? When should you follow up without being annoying?
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">😰</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Proposal Anxiety</p>
                <p className="text-sm text-slate-600">No idea if clients saw your work</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">⏰</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Bad Timing</p>
                <p className="text-sm text-slate-600">Follow up too early or too late</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">💸</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Lost Revenue</p>
                <p className="text-sm text-slate-600">Deals slip through the cracks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How DocMetri Helps You Win More Work
          </h2>

          <div className="space-y-16">
            {/* Know When Clients View Your Work */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Know When Clients View Your Work</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get instant notifications the moment a client opens your proposal, portfolio, or contract. 
                  No more guessing games. You'll know exactly when they're reviewing your work, allowing you 
                  to follow up at the perfect moment while you're fresh in their mind.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Track multiple opens to gauge interest level. If a client views your portfolio three times 
                  in one day, they're serious. If they haven't opened it in a week, maybe it's time to send 
                  a gentle reminder or move on to better opportunities.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Client Just Viewed!</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Sarah from TechCorp opened your proposal 2 minutes ago</p>
                    <div className="text-xs text-slate-500">Currently on page 3 (Pricing)</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Extended Session</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Mike spent 8 minutes reviewing your portfolio</p>
                    <div className="text-xs text-slate-500">Hot lead - Follow up now!</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Shared Internally</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Your proposal was forwarded to 2 decision-makers</p>
                    <div className="text-xs text-slate-500">Deal is progressing!</div>
                  </div>
                </div>
              </div>
            </div>

            {/* See What Interests Them Most */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg border mb-4">
                  <div className="text-xs text-slate-600 mb-3">Portfolio Project Engagement</div>
                  <div className="space-y-2">
                    {[
                      { project: 'E-commerce Redesign', time: '4m 30s', engagement: 95, hot: true },
                      { project: 'Mobile App UI', time: '3m 45s', engagement: 88, hot: true },
                      { project: 'Brand Identity', time: '2m 10s', engagement: 72, hot: false },
                      { project: 'Website Development', time: '5m 20s', engagement: 100, hot: true },
                      { project: 'Logo Design', time: '1m 05s', engagement: 45, hot: false }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{item.project}</span>
                            {item.hot && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🔥 HOT</span>}
                          </div>
                          <span className="text-slate-600">{item.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.engagement > 80 ? 'bg-green-500' :
                                item.engagement > 60 ? 'bg-yellow-500' :
                                'bg-slate-400'
                              }`}
                              style={{ width: `${item.engagement}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 text-center">
                  Know which projects capture attention and lead conversations accordingly
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">See What Interests Them Most</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Understand exactly which portfolio pieces, case studies, or proposal sections capture your 
                  client's attention. If they spend 5 minutes on your e-commerce project but skip your branding 
                  work, you know what to emphasize in your pitch.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Use engagement data to tailor your follow-up conversations. Reference the specific projects 
                  they spent time on, answer questions about features they reviewed, and position yourself as 
                  the perfect match for what they actually need.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Track time spent on each portfolio piece</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Identify which case studies drive decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Optimize your portfolio based on real data</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Follow Up at the Perfect Time */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Follow Up at the Perfect Time</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Timing is everything in freelancing. Follow up too soon and you seem desperate. Wait too 
                  long and they've moved on to someone else. DocMetri tells you exactly when clients are 
                  actively reviewing your work, so you can reach out at the optimal moment.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get alerts when high-value actions happen: when a client views your pricing page, downloads 
                  your contract, or shares your proposal with their team. These are buying signals that demand 
                  immediate follow-up.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-900 text-sm">
                    <strong>Pro Tip:</strong> Send your follow-up email within 15 minutes of getting a "high engagement" 
                    alert. Strike while you're top of mind and conversion rates skyrocket.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Engagement Timeline</p>
                  </div>
                  {[
                    { time: '9:30 AM', action: 'Proposal opened', status: 'viewed' },
                    { time: '9:35 AM', action: 'Spent 6 min on Services page', status: 'engaged' },
                    { time: '9:42 AM', action: 'Downloaded pricing PDF', status: 'hot' },
                    { time: '9:45 AM', action: 'YOU: Follow-up email sent', status: 'action' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        item.status === 'hot' ? 'bg-red-100 text-red-700' :
                        item.status === 'engaged' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'action' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.time.split(':')[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Protect Your Work */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Lock className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Password Protection</span>
                    </div>
                    <p className="text-xs text-slate-600">Require password for sensitive client work</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">View-Only Mode</span>
                    </div>
                    <p className="text-xs text-slate-600">Prevent unauthorized downloads and copying</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-semibold text-slate-900">Auto-Expiration</span>
                    </div>
                    <p className="text-xs text-slate-600">Proposals expire after 30 days automatically</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Email Verification</span>
                    </div>
                    <p className="text-xs text-slate-600">Know exactly who's viewing your work</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Protect Your Intellectual Property</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Your portfolio represents months or years of work. Protect it from unauthorized distribution, 
                  copying, or use without permission. DocMetri gives you control over who sees your work and 
                  how they can interact with it.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Enable view-only mode so clients can review your designs without downloading them. Add watermarks 
                  showing viewer information to discourage sharing. Set expiration dates so old proposals don't 
                  circulate with outdated pricing or availability.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Track every download and share event. If someone forwards your portfolio without permission, 
                  you'll know immediately and can revoke access to prevent further distribution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Perfect For Every Freelancer & Agency
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Graphic Designers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share your portfolio with potential clients. Track which design projects get the most attention. 
                Know when clients are reviewing your work so you can follow up at the perfect moment.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Portfolio analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Project-level engagement tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Protect design files from unauthorized use</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Web Developers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Send proposals and technical documentation with confidence. Track client engagement with project 
                specifications. Know when they're ready to discuss implementation and pricing.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Proposal tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Technical spec engagement metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Contract and SOW tracking</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Marketing Consultants</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share marketing strategies, campaign plans, and audit reports. Track which sections clients spend 
                time on. Use engagement data to refine your services and close more retainers.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Strategy document tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Campaign proposal analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Client audit report engagement</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Content Writers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share writing samples and service packages. Know when clients review your work. Track engagement 
                with your portfolio to understand which writing styles resonate most.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Writing sample analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Service package tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Protect unpublished work</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Business Coaches</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share program materials and course outlines. Track which coaching packages generate the most interest. 
                Know when prospects are ready to book discovery calls.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Program material tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Coaching package analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Lead qualification insights</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Creative Agencies</h3>
              <p className="text-slate-700 text-sm mb-4">
                Manage multiple client pitches simultaneously. Track team performance on proposals. Know which agency 
                capabilities clients care about most and win more business.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multi-client tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Team collaboration features</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Agency capability analytics</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Everything Freelancers Need to Close More Deals
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Eye className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Real-Time View Notifications</h4>
              <p className="text-sm text-slate-600">
                Get instant alerts when clients open your proposals, portfolios, or contracts. Never miss an opportunity.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Page-Level Engagement</h4>
              <p className="text-sm text-slate-600">
                See which portfolio pieces or proposal sections capture the most attention and optimize accordingly.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Clock className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Time-on-Page Analytics</h4>
              <p className="text-sm text-slate-600">
                Track exactly how long clients spend reviewing each section of your work to gauge interest levels.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Lock className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Password Protection</h4>
              <p className="text-sm text-slate-600">
                Secure your confidential work with password protection. Only share with verified clients.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Mail className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Email Capture</h4>
              <p className="text-sm text-slate-600">
                Require email verification to identify exactly who's viewing your work and build your client list.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Download className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Download Control</h4>
              <p className="text-sm text-slate-600">
                Choose whether clients can download your work or only view it online to prevent unauthorized distribution.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Zap className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Instant Alerts</h4>
              <p className="text-sm text-slate-600">
                Get email or Slack notifications for high-value actions like downloads, extended sessions, or shares.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Users className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Team Collaboration</h4>
              <p className="text-sm text-slate-600">
                For agencies: manage multiple client proposals, assign team members, and track performance together.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Engagement Scoring</h4>
              <p className="text-sm text-slate-600">
                Automatically rank prospects by engagement level. Focus your time on the warmest leads.
              </p>
            </div>
          </div>
        </div>

        {/* Real Results */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Real Results from Freelancers Using DocMetri
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">3x</div>
              <p className="text-slate-700 font-medium mb-1">More Responses</p>
              <p className="text-sm text-slate-600">Follow-up at the right time = better results</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">45%</div>
              <p className="text-slate-700 font-medium mb-1">Higher Close Rate</p>
              <p className="text-sm text-slate-600">Focus on clients who are actually interested</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">10hrs</div>
              <p className="text-slate-700 font-medium mb-1">Saved Per Month</p>
              <p className="text-sm text-slate-600">Stop chasing dead-end leads</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8 border">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  JL
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Jessica Lee</p>
                  <p className="text-sm text-slate-600">Freelance Designer</p>
                </div>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "Before DocMetri, I'd send my portfolio and hope for the best. Now I know exactly when clients 
                are reviewing my work. I follow up within minutes and my response rate has tripled. I've booked 
                more projects in 3 months than I did all of last year."
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 border">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  RC
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Robert Chen</p>
                  <p className="text-sm text-slate-600">Web Development Agency Owner</p>
                </div>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "As an agency, we send dozens of proposals every month. DocMetri helps us prioritize which 
                deals to chase and which to let go. The engagement scoring alone has improved our win rate 
                by 45%. It's like having a sales assistant that never sleeps."
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-6">
            Affordable Pricing for Freelancers
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We built DocMetri with freelancers in mind. Simple, transparent pricing that scales with your business.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
              <h3 className="font-bold text-slate-900 mb-2">Starter</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">$19</div>
              <p className="text-sm text-slate-600 mb-4">per month</p>
              <ul className="space-y-2 text-sm text-slate-700 mb-6">
                <li>50 tracked documents</li>
                <li>Unlimited views</li>
                <li>Basic analytics</li>
                <li>Email notifications</li>
              </ul>
              <a href="/pricing" className="block text-center text-purple-600 font-medium hover:underline text-sm">
                View Details →
              </a>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl border-2 border-purple-600 p-6 text-center text-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
              <h3 className="font-bold mb-2">Professional</h3>
              <div className="text-3xl font-bold mb-1">$49</div>
              <p className="text-sm text-purple-100 mb-4">per month</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>500 tracked documents</li>
                <li>Advanced analytics</li>
                <li>Email capture</li>
                <li>Custom branding</li>
              </ul>
              <a href="/pricing" className="block text-center bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm">
                Start Free Trial
              </a>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
              <h3 className="font-bold text-slate-900 mb-2">Agency</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">$99</div>
              <p className="text-sm text-slate-600 mb-4">per month</p>
              <ul className="space-y-2 text-sm text-slate-700 mb-6">
                <li>Unlimited documents</li>
                <li>Team collaboration</li>
                <li>Priority support</li>
                <li>API access</li>
              </ul>
              <a href="/pricing" className="block text-center text-purple-600 font-medium hover:underline text-sm">
                View Details →
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600 mt-8">
            All plans include 14-day free trial • No credit card required
          </p>
        </div>

        {/* How to Get Started */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Get Started in 3 Easy Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                1
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Upload Your Portfolio</h3>
              <p className="text-slate-600 text-sm">
                Drag and drop your PDF portfolio, proposal, or contract. Takes less than 30 seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                2
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Share with Clients</h3>
              <p className="text-slate-600 text-sm">
                Get a trackable link and send it via email, messaging, or however you prefer.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                3
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Track & Close</h3>
              <p className="text-slate-600 text-sm">
                Get instant notifications when clients view your work. Follow up and close more deals.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Common Questions from Freelancers
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Will clients know they're being tracked?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you enable email capture, clients know they're providing their email. For anonymous tracking, 
                clients aren't explicitly notified—similar to how websites use analytics. This is standard practice 
                for business documents and completely legal.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I use DocMetri for client work?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Absolutely! Many freelancers use DocMetri to share deliverables, track client feedback, and ensure 
                project documents are being reviewed. It's perfect for client communication and project management.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Is my portfolio secure?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes. All documents are encrypted with bank-level security. You control who sees your work with 
                passwords, expiration dates, and view-only modes. Your intellectual property is protected.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">What if I need to update my portfolio?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                You can upload new versions anytime. Existing tracking links automatically point to the updated 
                version, so clients always see your latest work. All historical analytics are preserved.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I track multiple proposals at once?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes! Upload as many documents as your plan allows. Track all your proposals, portfolios, and client 
                materials in one dashboard. Organize by client, project type, or any way that works for you.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Do you offer a free trial?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes! Start with a 14-day free trial. Full access to all features, no credit card required. Cancel 
                anytime if it's not right for you (but we think you'll love it).
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="border-t pt-16">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Close More Deals?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers and agencies using DocMetri to win more clients, 
              protect their work, and grow their business with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/signup" 
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Start Free Trial
              </a>
              <a 
                href="/demo" 
                className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                See It In Action
              </a>
            </div>
            <p className="text-sm text-purple-200 mt-6">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t">
          <p className="text-center text-slate-600 text-sm mb-6">
            Trusted by freelancers and agencies worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            <div className="text-slate-400 text-xs">5,000+ Freelancers</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">50+ Countries</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">4.8★ Rating</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">99.9% Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}