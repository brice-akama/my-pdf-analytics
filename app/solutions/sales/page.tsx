"use client";

import React, { JSX } from "react";
import Link from "next/link";
import { TrendingUp, Eye, Clock, Target, Shield, CheckCircle2, Bell, Users, FileText, Zap, Award, BarChart3, Lock, Download, Mail, DollarSign, Phone, MessageSquare, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesTeamsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            For Sales Teams
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Close Deals 3x Faster with Proposal Intelligence
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Stop sending proposals into the void. Know exactly when prospects open your pitch, which 
            sections they care about, and when they're ready to buy. DocMetri gives sales teams the 
            insights needed to close more deals with data-driven follow-ups.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 md:p-12 border border-red-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Sales Rep's Nightmare
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              You spend hours crafting the perfect proposal, pricing deck, or sales presentation. You send 
              it to your prospect and then... silence. Did they even open it? Are they interested? Did it 
              get stuck in spam? Should you follow up now or wait? Meanwhile, your competitor who called at 
              the right moment wins the deal.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">📧</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Proposal Black Hole</p>
                <p className="text-sm text-slate-600">No idea if prospects viewed your pitch</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">🤷</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Guessing Game</p>
                <p className="text-sm text-slate-600">When to follow up without being annoying</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">💸</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Lost Deals</p>
                <p className="text-sm text-slate-600">Competitors close while you're still waiting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How DocMetri Supercharges Your Sales Process
          </h2>

          <div className="space-y-16">
            {/* Know When Prospects Open Your Proposals */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Know When Prospects Open Your Proposals</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get instant notifications the moment a prospect opens your proposal, pricing deck, or sales 
                  presentation. No more wondering if they received it or if they're interested. You'll know 
                  exactly when they're reviewing your offer—giving you the perfect window to follow up.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Track multiple opens to gauge buying intent. If a prospect views your proposal three times 
                  in one day, they're serious. If they forward it to their CFO or procurement team, a decision 
                  is being made. Strike while the iron is hot and close deals before your competition even knows 
                  what's happening.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Hot Lead Alert!</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">John from Acme Corp just opened your proposal</p>
                    <div className="text-xs text-slate-500">Enterprise plan • $120K ARR opportunity</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Extended Engagement</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Sarah spent 15 minutes on your pricing page</p>
                    <div className="text-xs text-slate-500">Call her NOW - she's evaluating!</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Decision Makers Involved</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Your proposal was forwarded to 4 stakeholders</p>
                    <div className="text-xs text-slate-500">Deal is moving to procurement stage!</div>
                  </div>
                </div>
              </div>
            </div>

            {/* See What Matters to Your Prospects */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg border mb-4">
                  <div className="text-xs text-slate-600 mb-3">Proposal Section Engagement</div>
                  <div className="space-y-2">
                    {[
                      { section: 'Executive Summary', time: '2m 15s', engagement: 88, hot: true },
                      { section: 'Solution Overview', time: '4m 30s', engagement: 95, hot: true },
                      { section: 'Pricing & Packages', time: '6m 45s', engagement: 100, hot: true },
                      { section: 'Case Studies', time: '3m 20s', engagement: 78, hot: true },
                      { section: 'Implementation Timeline', time: '1m 45s', engagement: 52, hot: false },
                      { section: 'Technical Specs', time: '45s', engagement: 32, hot: false },
                      { section: 'Terms & Conditions', time: '30s', engagement: 18, hot: false }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{item.section}</span>
                            {item.hot && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🔥</span>}
                          </div>
                          <span className="text-slate-600">{item.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.engagement > 80 ? 'bg-green-500' :
                                item.engagement > 50 ? 'bg-yellow-500' :
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
                  Know which sections drive decisions and tailor your pitch accordingly
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">See What Matters to Your Prospects</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Discover exactly which parts of your proposal capture attention and which sections get skipped. 
                  If prospects spend 7 minutes on your pricing page but only 30 seconds on technical specs, you 
                  know they're price-focused, not technical buyers. Adjust your sales approach accordingly.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Use engagement data to prepare for follow-up calls. If they spent significant time on case 
                  studies, come prepared to discuss ROI and success metrics. If they scrutinized your implementation 
                  timeline, address deployment concerns proactively.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Page-by-page engagement analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Identify objections before they're raised</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Optimize proposals based on real data</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Score and Prioritize Leads */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Score and Prioritize Leads Automatically</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Not all prospects are created equal. DocMetri automatically scores leads based on engagement—time 
                  spent, pages viewed, return visits, and actions taken. Focus your energy on high-intent prospects 
                  who are actually ready to buy, not tire-kickers who waste your time.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  A "hot" prospect who viewed your proposal five times, spent 20+ minutes, downloaded pricing, and 
                  forwarded to decision-makers gets immediate attention. A "cold" lead who opened page one and bounced 
                  after 10 seconds gets deprioritized. Work smarter, not harder.
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-900 text-sm">
                    <strong>Sales Tip:</strong> Reps using DocMetri close 40% more deals by focusing only on prospects 
                    with engagement scores above 70. Stop chasing ghosts and start closing hot leads.
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                          AC
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">Acme Corp</div>
                          <div className="text-xs text-slate-600">$120K ARR</div>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        🔥 HOT
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">8</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">42m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-green-600">94/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                          TI
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">TechInc</div>
                          <div className="text-xs text-slate-600">$45K ARR</div>
                        </div>
                      </div>
                      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                        WARM
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">3</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">18m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-yellow-600">71/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm">
                          SC
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">SmallCo</div>
                          <div className="text-xs text-slate-600">$12K ARR</div>
                        </div>
                      </div>
                      <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                        COLD
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">1</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">3m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-slate-600">28/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Perfect Follow-Up Timing */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Perfect Follow-Up Timeline</p>
                  </div>
                  {[
                    { time: 'Monday 10:15 AM', action: 'Proposal sent', status: 'sent' },
                    { time: 'Monday 10:23 AM', action: 'Prospect opened proposal', status: 'viewed' },
                    { time: 'Monday 10:35 AM', action: 'Spent 8 min on pricing', status: 'engaged' },
                    { time: 'Monday 10:50 AM', action: 'YOU: Follow-up call made', status: 'action' },
                    { time: 'Monday 11:30 AM', action: 'Meeting scheduled', status: 'success' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        item.status === 'success' ? 'bg-green-100 text-green-700' :
                        item.status === 'action' ? 'bg-purple-100 text-purple-700' :
                        item.status === 'engaged' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'viewed' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Follow Up at the Perfect Moment</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Timing is everything in sales. Follow up too soon and you seem desperate. Wait too long and they've 
                  moved on to your competitor. DocMetri tells you exactly when prospects are actively reviewing your 
                  proposal—giving you the perfect window to call while you're top of mind.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get alerts for high-intent actions: when they view your pricing page, download your proposal, share 
                  with stakeholders, or return for a second look. These are buying signals that demand immediate follow-up. 
                  Strike while the iron is hot.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Top-performing sales reps follow up within 15 minutes of receiving a "high engagement" alert. By the 
                  time your competition is crafting their follow-up email three days later, you've already booked the 
                  demo and moved to the next stage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Built for Every Sales Team
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">SaaS Sales Teams</h3>
              <p className="text-slate-700 text-sm mb-4">
                Track product demos, pricing proposals, and ROI calculators. Know when prospects are comparing 
                your solution to competitors. Close enterprise deals faster with engagement insights.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Demo deck tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pricing proposal analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Enterprise deal acceleration</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">B2B Sales</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share product catalogs, service proposals, and contracts. Track decision-maker engagement. Know 
                when procurement is reviewing your bid and close complex sales cycles faster.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multi-stakeholder tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Procurement stage insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Complex sales cycle management</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Enterprise Sales</h3>
              <p className="text-slate-700 text-sm mb-4">
                Manage multi-million dollar deals with complete visibility. Track executive engagement. Know when 
                C-suite is reviewing your proposal and orchestrate perfect timing for closes.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Executive engagement tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Large deal orchestration</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Stakeholder mapping</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Inside Sales</h3>
              <p className="text-slate-700 text-sm mb-4">
                High-volume sales teams tracking hundreds of prospects. Prioritize callbacks based on engagement. 
                Convert more leads with data-driven outreach strategies.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>High-volume lead management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Callback prioritization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Conversion rate optimization</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Channel & Partner Sales</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share enablement materials and partner proposals. Track which partners are actively selling. 
                Optimize channel performance with engagement data.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Partner enablement tracking</span>
                </li>
                <li className="flex items-start gap-2">

                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Partner enablement tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Channel performance analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Partner activity monitoring</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Account Executives</h3>
              <p className="text-slate-700 text-sm mb-4">
                Manage multiple deals simultaneously with complete visibility. Track engagement across your entire 
                pipeline. Never miss an opportunity to engage at the right moment.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pipeline visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multi-deal management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Engagement timeline tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results & Stats */}
        <div className="mb-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold text-center mb-4">
            Real Results from Sales Teams Using DocMetri
          </h2>
          <p className="text-center text-green-100 mb-12 max-w-2xl mx-auto">
            Don't just take our word for it—here's what happens when sales teams get real-time proposal intelligence
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">3x</div>
              <p className="text-green-100">Faster deal closing</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">40%</div>
              <p className="text-green-100">More deals closed</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">65%</div>
              <p className="text-green-100">Higher conversion rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">80%</div>
              <p className="text-green-100">Better follow-up timing</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What Sales Leaders Are Saying
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border-2 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div>
                  <div className="font-bold text-slate-900">John Smith</div>
                  <div className="text-sm text-slate-600">VP of Sales, TechCorp</div>
                </div>
              </div>
              <p className="text-slate-700 italic mb-3">
                "DocMetri transformed our sales process. We went from blindly following up to striking at the exact 
                moment prospects are engaged. Our close rate jumped 45% in the first quarter."
              </p>
              <div className="text-yellow-500">★★★★★</div>
            </div>

            <div className="bg-white rounded-xl border-2 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  SR
                </div>
                <div>
                  <div className="font-bold text-slate-900">Sarah Rodriguez</div>
                  <div className="text-sm text-slate-600">Director of Sales, SaaSco</div>
                </div>
              </div>
              <p className="text-slate-700 italic mb-3">
                "The engagement scoring is a game-changer. My team now focuses only on hot leads instead of wasting 
                time on tire-kickers. We're closing bigger deals, faster."
              </p>
              <div className="text-yellow-500">★★★★★</div>
            </div>

            <div className="bg-white rounded-xl border-2 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                  MC
                </div>
                <div>
                  <div className="font-bold text-slate-900">Mike Chen</div>
                  <div className="text-sm text-slate-600">Sales Manager, Enterprise Inc</div>
                </div>
              </div>
              <p className="text-slate-700 italic mb-3">
                "Knowing when C-suite executives are reviewing our proposals is invaluable. We can time our follow-up 
                calls perfectly and address objections before they become deal-breakers."
              </p>
              <div className="text-yellow-500">★★★★★</div>
            </div>
          </div>
        </div>

        {/* Key Features List */}
        <div className="mb-20 bg-slate-50 rounded-2xl p-12 border">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Everything You Need to Close More Deals
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            DocMetri gives sales teams a complete toolkit for proposal intelligence and engagement tracking
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Real-Time Alerts</h3>
                <p className="text-sm text-slate-600">
                  Instant notifications when prospects open, view, or share your proposals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Page-by-Page Analytics</h3>
                <p className="text-sm text-slate-600">
                  See which sections get the most attention and which get skipped
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Lead Scoring</h3>
                <p className="text-sm text-slate-600">
                  Automatic engagement scoring to prioritize your hottest prospects
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Stakeholder Tracking</h3>
                <p className="text-sm text-slate-600">
                  Know when your proposal gets forwarded to decision makers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Time-on-Page Tracking</h3>
                <p className="text-sm text-slate-600">
                  Measure exactly how long prospects spend on each section
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Download className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Download Tracking</h3>
                <p className="text-sm text-slate-600">
                  Get notified when prospects download or save your proposals
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Secure Sharing</h3>
                <p className="text-sm text-slate-600">
                  Password protection, link expiration, and email verification
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Email Integration</h3>
                <p className="text-sm text-slate-600">
                  Get alerts directly in your inbox and CRM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Stop Guessing, Start Knowing
          </h2>

          <div className="bg-white rounded-xl border-2 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b-2">
                  <th className="text-left p-4 font-bold text-slate-900">Feature</th>
                  <th className="text-center p-4 font-bold text-slate-900">Traditional Email</th>
                  <th className="text-center p-4 font-bold text-green-700 bg-green-50">DocMetri</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 text-slate-700">Know when prospect opens</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Track time spent reading</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">See which pages matter</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Track forwarding to stakeholders</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Automatic lead scoring</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Real-time engagement alerts</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Know perfect follow-up timing</td>
                  <td className="p-4 text-center text-slate-400">❌</td>
                  <td className="p-4 text-center text-green-600 font-bold bg-green-50">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Close More Deals?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of sales teams using DocMetri to track proposals, prioritize leads, 
            and close deals 3x faster with real-time engagement intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 gap-2 text-lg px-8">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 gap-2 text-lg px-8">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>

          <p className="text-purple-200 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-slate-900 mb-2">
                How quickly will I see results?
              </h3>
              <p className="text-slate-600">
                Most sales teams see an immediate improvement in follow-up timing and lead prioritization. 
                Within 30 days, you'll have enough data to optimize your proposals and increase close rates significantly.
              </p>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-slate-900 mb-2">
                Does it work with my CRM?
              </h3>
              <p className="text-slate-600">
                Yes! DocMetri integrates with Salesforce, HubSpot, Pipedrive, and most major CRMs. 
                Engagement data flows directly into your existing sales workflow.
              </p>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-slate-900 mb-2">
                Can prospects tell they're being tracked?
              </h3>
              <p className="text-slate-600">
                No. The tracking is completely invisible to recipients. They simply view your proposal 
                as a normal PDF—no special software or accounts required on their end.
              </p>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-slate-900 mb-2">
                What if my team is already using DocuSign or PandaDoc?
              </h3>
              <p className="text-slate-600">
                DocMetri complements those tools perfectly. Use DocMetri for proposal tracking and 
                engagement analytics, then move to DocuSign for signatures. Many teams use both.
              </p>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-slate-900 mb-2">
                How many proposals can I track?
              </h3>
              <p className="text-slate-600">
                Our plans start at 50 tracked documents per month for individuals, and go up to unlimited 
                for enterprise teams. Choose the plan that fits your sales volume.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}