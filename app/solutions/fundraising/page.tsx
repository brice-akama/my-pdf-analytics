"use client";

import React, { JSX } from "react";
import { TrendingUp, Eye, Clock, Users, Target, Bell, Lock, BarChart3, CheckCircle2, DollarSign, Zap, FileText, Shield, MousePointerClick, Award } from "lucide-react";

export default function FundraisingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            Fundraising Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Close Your Funding Round Faster with Document Intelligence
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Stop sending pitch decks into the void. Know exactly which investors opened your materials, 
            which slides they spent time on, and when to follow up. DocMetri gives you the insights 
            you need to raise capital efficiently.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 md:p-12 border border-red-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Fundraising Black Hole Problem
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              You spend weeks perfecting your pitch deck, send it to dozens of investors, and then... 
              silence. You have no idea if they opened it, which investors are genuinely interested, 
              or when to follow up without seeming desperate. Meanwhile, your runway is burning.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">❌</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">No Visibility</p>
                <p className="text-sm text-slate-600">Did they even open your deck?</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">⏰</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Bad Timing</p>
                <p className="text-sm text-slate-600">When should you follow up?</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">🤷</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">No Insights</p>
                <p className="text-sm text-slate-600">Which slides resonated most?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How DocMetri Transforms Fundraising
          </h2>

          <div className="space-y-16">
            {/* Know When Investors Open Your Deck */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Know When Investors Open Your Deck</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get instant notifications the moment an investor opens your pitch deck. No more 
                  wondering if your email got lost or if they're actually reviewing your materials. 
                  See real-time alerts with investor name, time, and location.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Track multiple opens from the same investor to gauge interest level. If someone 
                  opens your deck three times in one day, they're serious. If they open it during 
                  their partner meeting, you know you're being discussed. Use this intelligence to 
                  time your follow-ups perfectly.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white rounded-lg border p-4 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-slate-900">New View Alert</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Sarah Chen from Sequoia Capital just opened your pitch deck</p>
                  <div className="text-xs text-slate-500">2 minutes ago • San Francisco, CA</div>
                </div>
                <div className="bg-white rounded-lg border p-4 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-900">High Engagement</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Michael Ross viewed your deck for 8 minutes</p>
                  <div className="text-xs text-slate-500">15 minutes ago • New York, NY</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-semibold text-slate-900">Shared Internally</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">Your deck was forwarded to 3 partners at Andreessen Horowitz</p>
                  <div className="text-xs text-slate-500">1 hour ago</div>
                </div>
              </div>
            </div>

            {/* See Which Slides Matter Most */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-xs text-slate-600 mb-3">Slide Engagement Analysis</div>
                  <div className="space-y-2">
                    {[
                      { slide: 'Market Opportunity', time: '2m 45s', engagement: 95, hot: true },
                      { slide: 'Product Demo', time: '3m 10s', engagement: 100, hot: true },
                      { slide: 'Business Model', time: '2m 20s', engagement: 85, hot: true },
                      { slide: 'Financials', time: '4m 05s', engagement: 98, hot: true },
                      { slide: 'Team', time: '1m 30s', engagement: 65, hot: false },
                      { slide: 'Traction', time: '2m 50s', engagement: 90, hot: true },
                      { slide: 'Competition', time: '45s', engagement: 35, hot: false },
                      { slide: 'Use of Funds', time: '1m 15s', engagement: 55, hot: false }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{item.slide}</span>
                            {item.hot && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🔥 HOT</span>}
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
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">See Which Slides Matter Most</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Discover exactly which parts of your pitch deck capture investor attention. See 
                  time spent on each slide, identify hot pages that drive engagement, and understand 
                  which sections investors skip or breeze through quickly.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  If investors spend 4 minutes on your financials but only 30 seconds on your team 
                  slide, you know where their concerns lie. Use these insights to refine your deck, 
                  strengthen weak areas, and prepare better responses for follow-up meetings.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Compare engagement across different investor types—early-stage VCs might focus on 
                  market size while growth equity investors scrutinize unit economics. Tailor your 
                  pitch based on who's viewing.
                </p>
              </div>
            </div>

            {/* Identify Serious Investors */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Identify Serious Investors</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Not all investor interest is equal. DocMetri's engagement scoring automatically 
                  ranks investors based on their behavior—time spent, pages viewed, return visits, 
                  and actions taken. Focus your limited time on the warmest leads.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  A "hot" investor who viewed your deck three times, spent 15+ minutes total, and 
                  shared it with partners deserves immediate follow-up. A "cold" investor who opened 
                  page one and bounced after 10 seconds probably isn't interested. Prioritize accordingly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Automatic engagement scoring (Hot, Warm, Cold)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Track return visits and viewing patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Identify decision-makers vs. analysts</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                          SC
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">Sarah Chen</div>
                          <div className="text-xs text-slate-600">Sequoia Capital</div>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        🔥 HOT
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">5</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">23m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-green-600">95/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                          MR
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">Mike Ross</div>
                          <div className="text-xs text-slate-600">Accel Partners</div>
                        </div>
                      </div>
                      <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                        WARM
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">2</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">8m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-yellow-600">62/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm">
                          JD
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">John Doe</div>
                          <div className="text-xs text-slate-600">XYZ Ventures</div>
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
                        <div className="font-bold text-slate-900">45s</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-slate-600">18/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Protect Confidential Information */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Password Protection</span>
                    </div>
                    <p className="text-xs text-slate-600">Require password before viewing deck</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-semibold text-slate-900">Auto-Expiration</span>
                    </div>
                    <p className="text-xs text-slate-600">Deck expires 30 days after sharing</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">View-Only Mode</span>
                    </div>
                    <p className="text-xs text-slate-600">Prevent downloads and screenshots</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">NDA Required</span>
                    </div>
                    <p className="text-xs text-slate-600">Accept terms before viewing</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Protect Confidential Information</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Your pitch deck contains sensitive financial data, strategic plans, and proprietary 
                  information. DocMetri provides enterprise-grade security to ensure only authorized 
                  investors can access your materials and that your information doesn't leak.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Set passwords, expiration dates, and view-only restrictions. Require email 
                  verification so you know exactly who's viewing. Disable downloads to prevent 
                  uncontrolled distribution. Add watermarks showing viewer information to discourage leaks.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Revoke access instantly if a deal falls through or if you need to update information. 
                  Track every view and download attempt in detailed audit logs for compliance and security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features for Fundraising */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Essential Features for Fundraising
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Bell className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Real-Time Alerts</h4>
              <p className="text-sm text-slate-600">
                Get instant notifications when investors open your deck, view specific slides, 
                or share with partners. Never miss a follow-up opportunity.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Users className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Investor Identification</h4>
              <p className="text-sm text-slate-600">
                Capture investor emails and track individual viewing behavior. Know exactly 
                who's interested and build relationships with the right people.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Multiple Deck Versions</h4>
              <p className="text-sm text-slate-600">
                Share different versions with different investors. Track which version performs 
                better and iterate based on real engagement data.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <BarChart3 className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Slide-by-Slide Analytics</h4>
              <p className="text-sm text-slate-600">
                See exactly which slides capture attention. Identify weak slides that need 
                improvement and strengthen your pitch based on data.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Clock className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Engagement Timing</h4>
              <p className="text-sm text-slate-600">
                Track when investors view your materials. Follow up at the perfect moment 
                when you're fresh in their mind.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <DollarSign className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Pipeline Management</h4>
              <p className="text-sm text-slate-600">
                Organize investors by stage, track conversations, and manage your entire 
                fundraising pipeline in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Who Uses DocMetri for Fundraising?
          </h2>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Startup Founders</h4>
              <p className="text-slate-700 mb-4">
                Track investor engagement across your entire fundraising round. Know which VCs are 
                serious, which slides need work, and when to send follow-ups. Founders using DocMetri 
                close rounds 40% faster by focusing on the warmest leads and optimizing their pitch 
                based on real data.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Seed rounds</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Series A-C</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Growth equity</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Venture Capital Firms</h4>
              <p className="text-slate-700 mb-4">
                Share investment memos, term sheets, and portfolio company updates with LPs and 
                partners. Track which deals generate the most interest internally and ensure everyone's 
                aligned before partner meetings. Maintain confidentiality while sharing sensitive deal information.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Deal memos</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">LP reports</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Portfolio updates</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Investment Bankers & Advisors</h4>
              <p className="text-slate-700 mb-4">
                Distribute CIMs (Confidential Information Memorandums) to qualified buyers while 
                maintaining strict security. Track which investors are most engaged with your client's 
                materials, manage NDA compliance, and provide detailed analytics to demonstrate your value.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">M&A deals</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">CIM distribution</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Buyer tracking</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Accelerators & Incubators</h4>
              <p className="text-slate-700 mb-4">
                Share demo day materials with your investor network. Track which startups generate 
                the most interest, facilitate warm introductions, and help your portfolio companies 
                understand investor engagement. Provide data-driven insights that help founders close deals.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Demo day decks</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Investor matching</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Portfolio support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Results */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Real Results from Fundraising with DocMetri
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">40%</div>
              <p className="text-slate-700 font-medium mb-1">Faster Round Closure</p>
              <p className="text-sm text-slate-600">Close deals faster with data-driven follow-ups</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">3x</div>
              <p className="text-slate-700 font-medium mb-1">More Investor Meetings</p>
              <p className="text-sm text-slate-600">Focus on warm leads, not cold outreach</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">85%</div>
              <p className="text-slate-700 font-medium mb-1">Pitch Optimization</p>
              <p className="text-sm text-slate-600">Improve weak slides based on real engagement data</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 border">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                TK
              </div>
              <div>
                <p className="text-slate-700 italic mb-3 leading-relaxed">
                  "DocMetri completely changed how we fundraised. Instead of blindly following up with 
                  every investor, we could see exactly who was engaged. We closed our Series A in 6 weeks 
                  instead of the typical 4-6 months. The slide analytics helped us realize our go-to-market 
                  slide was weak—we strengthened it and immediately saw better engagement."
                </p>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">Tom Kaplan</div>
                  <div className="text-slate-600">CEO & Founder, TechStartup Inc.</div>
                  <div className="text-slate-500">Raised $15M Series A</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works for Fundraising */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How to Use DocMetri for Your Fundraising Round
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold">1</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg">Upload Your Pitch Deck</h4>
                <p className="text-slate-700 leading-relaxed">
                  Upload your PDF pitch deck to DocMetri. Set security controls like password protection, 
                  expiration dates, and view-only mode. Add email capture to identify investors before they 
                  can view your materials. Your deck is encrypted and securely stored.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold">2</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg">Share with Your Target Investors</h4>
                <p className="text-slate-700 leading-relaxed">
                  Generate trackable links for each investor or investor group. Send links via email, add 
                  them to your data room, or share through your preferred channels. Each link is unique and 
                  tracks engagement individually. Set up alerts so you're notified the moment someone views your deck.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-bold">3</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg">Monitor Engagement in Real-Time</h4>
                <p className="text-slate-700 leading-relaxed">
                  Watch as investors view your deck. See which slides they spend time on, when they return 
                  for multiple views, and if they forward to partners. Get instant notifications for high-value 
                  actions like extended viewing sessions or internal sharing. Track engagement scores to 
                  identify your hottest leads.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-700 font-bold">4</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg">Follow Up at the Perfect Time</h4>
                <p className="text-slate-700 leading-relaxed">
                  Use engagement data to time your follow-ups perfectly. Reach out when investors are 
                  actively reviewing your deck, not days later when you're out of mind. Reference specific 
                  slides they spent time on to have more informed conversations. Prioritize high-engagement 
                  investors and save time on those who aren't interested.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold">5</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-lg">Optimize Your Pitch Based on Data</h4>
                <p className="text-slate-700 leading-relaxed">
                  Analyze which slides perform well and which ones don't. If investors consistently skip 
                  your competition slide or spend minimal time on team, strengthen those sections. Create 
                  A/B versions to test different approaches. Continuously improve your pitch deck based on 
                  real investor behavior, not guesswork.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Fundraising Best Practices with DocMetri
          </h2>

          <div className="space-y-6 text-slate-700 leading-relaxed">
            <h3 className="text-xl font-bold text-slate-900">
              Create Different Versions for Different Stages
            </h3>
            <p>
              Don't send the same deck to cold outreach contacts and warm introductions. Create a shorter 
              teaser deck for initial outreach that highlights the opportunity without revealing sensitive 
              details. Use your full deck for investors who've expressed serious interest. Track both 
              versions separately to understand which approach works better.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">
              Set Up Smart Notifications
            </h3>
            <p>
              Configure alerts for high-value events: when an investor views your deck for more than 5 minutes, 
              when they return for a second or third view, when they share with partners, or when they spend 
              significant time on your financials or team slides. These signals indicate serious interest and 
              warrant immediate follow-up.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">
              Use Email Capture Strategically
            </h3>
            <p>
              For warm introductions where you know who's viewing, email capture may feel unnecessary. But 
              for broader distribution—accelerator investor lists, demo days, or when decks get forwarded—email 
              capture ensures you can identify and follow up with every interested party. Balance friction 
              with lead generation based on your distribution strategy.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">
              Protect Your Financials
            </h3>
            <p>
              Consider creating two deck versions: a teaser without detailed financials and a complete deck 
              with full numbers. Share the teaser publicly and the full deck only after initial conversations. 
              Use password protection and expiration dates on decks containing sensitive financial projections, 
              customer lists, or strategic plans.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">
              Review Analytics Before Every Call
            </h3>
            <p>
              Before any investor call or meeting, check their engagement data. If they spent 4 minutes on 
              your go-to-market slide, be prepared to dive deeper into that topic. If they barely looked at 
              your team slide, you might need to sell your experience more. Use viewing data to anticipate 
              questions and tailor your pitch to what they care about most.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6">
              Track Your Entire Pipeline
            </h3>
            <p>
              Use DocMetri to organize your investor pipeline by stage: initial outreach, first meeting, 
              due diligence, term sheet, closed. Track which investors move between stages and how long 
              they spend in each. This helps you forecast your timeline, identify bottlenecks, and 
              understand your conversion rates at each stage.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t pt-16">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Close Your Round Faster?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of founders using DocMetri to track investor engagement, 
              optimize their pitch decks, and raise capital more efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/signup" 
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Start Tracking Your Pitch Deck
              </a>
              <a 
                href="/demo" 
                className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                See How It Works
              </a>
            </div>
            <p className="text-sm text-purple-200 mt-6">
              Free 14-day trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Will investors know they're being tracked?</h4>
              <p className="text-slate-700 leading-relaxed">
                DocMetri operates transparently—we don't use hidden tracking. When you enable email capture, 
                viewers know they're providing their email. However, the detailed analytics (time on page, 
                which slides they viewed) are not visible to them. This is similar to how email marketing 
                tools track opens and clicks, or how websites use analytics.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Can I track investor engagement without email capture?</h4>
              <p className="text-slate-700 leading-relaxed">
                Yes. You can track anonymous engagement data (views, time spent, pages viewed) without 
                requiring email addresses. However, without email capture or unique links per investor, 
                you won't be able to identify which specific investor is viewing. We recommend using 
                unique links for each investor to track them individually while maintaining a smooth viewing experience.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">How secure is my pitch deck?</h4>
              <p className="text-slate-700 leading-relaxed">
                Extremely secure. Your documents are encrypted in transit and at rest using bank-level 
                encryption (AES-256). You can add password protection, set expiration dates, restrict 
                downloads, and revoke access at any time. We're GDPR compliant and follow security best 
                practices. Your intellectual property is protected with the highest standards.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">What if an investor forwards my deck?</h4>
              <p className="text-slate-700 leading-relaxed">
                DocMetri tracks when links are forwarded or shared. You'll receive notifications showing 
                that your deck was accessed by someone who wasn't the original recipient. You can see 
                the entire chain of sharing. If needed, you can immediately revoke access to prevent 
                further distribution. For maximum control, enable email verification so everyone who views 
                must identify themselves.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Do you integrate with CRM or fundraising tools?</h4>
              <p className="text-slate-700 leading-relaxed">
                Yes. DocMetri integrates with popular CRMs like HubSpot, Salesforce, and Pipedrive. You can 
                also export analytics data via CSV/JSON or use our REST API to build custom integrations. 
                Webhooks allow you to push engagement events to your existing tools in real-time. We're 
                constantly adding new integrations based on customer requests.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">How much does it cost?</h4>
              <p className="text-slate-700 leading-relaxed">
                DocMetri offers flexible pricing for founders at every stage. Start with our free trial 
                to track your first pitch deck. Paid plans start at $29/month for individual founders and 
                scale up for teams and enterprise customers who need advanced features like SSO, custom 
                branding, and priority support. Visit our <a href="/pricing" className="text-blue-600 hover:underline font-medium">pricing page</a> for details.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 pt-8 border-t">
          <p className="text-center text-slate-600 text-sm">
            Used by founders at Y Combinator, Techstars, 500 Startups, and leading accelerators worldwide
          </p>
        </div>
      </div>
    </div>
  );
}