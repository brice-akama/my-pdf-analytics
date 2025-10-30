"use client";


import React, { JSX } from "react";
import { Home, Eye, Clock, TrendingUp, Shield, CheckCircle2, Bell, Users, FileText, Zap, Award, BarChart3, Lock, Download, Mail, Target, MapPin, DollarSign } from "lucide-react";

export default function RealEstatePage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Home className="h-4 w-4" />
            For Real Estate Professionals
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Close More Deals with Property Document Intelligence
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Know exactly when buyers view your listings, which properties interest them most, and when 
            they're ready to make an offer. DocMetri helps real estate agents close deals faster with 
            real-time property document analytics.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 md:p-12 border border-red-200">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Real Estate Agent's Challenge
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              You send property brochures, listing packages, and investment prospectuses to dozens of potential 
              buyers every week. But you have no idea who's actually interested, which properties they prefer, 
              or when to follow up. Meanwhile, hot leads go cold and deals slip away to more responsive agents.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">🏠</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Blind Lead Follow-Up</p>
                <p className="text-sm text-slate-600">No idea if buyers viewed your listings</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">⏱️</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Missed Opportunities</p>
                <p className="text-sm text-slate-600">Follow up too late and lose to competitors</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-red-200">
                <div className="text-3xl mb-2">📉</div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Wasted Time</p>
                <p className="text-sm text-slate-600">Chase uninterested buyers instead of hot leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solution Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            How DocMetri Transforms Your Real Estate Business
          </h2>

          <div className="space-y-16">
            {/* Know When Buyers View Listings */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Know When Buyers View Your Listings</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Get instant notifications the moment a potential buyer opens your property brochure, listing 
                  package, or investment prospectus. No more guessing if they received your email or if they're 
                  actually interested. You'll know exactly when they're looking at properties.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Track multiple views from the same buyer to gauge their interest level. If someone views a 
                  property listing three times in one day, they're serious. If they forward it to family or a 
                  business partner, you know a decision is being made. Follow up immediately while you're top of mind.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Buyer Just Viewed!</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">John Smith opened 123 Oak Street listing 2 minutes ago</p>
                    <div className="text-xs text-slate-500">3-bed, 2-bath Colonial • $450K</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Extended Session</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Sarah Johnson spent 12 minutes on luxury condo brochure</p>
                    <div className="text-xs text-slate-500">Hot lead - Call her now!</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Shared with Partner</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">Mike Davis forwarded investment property docs to 2 people</p>
                    <div className="text-xs text-slate-500">Decision makers are reviewing!</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Identify Serious Buyers */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                          JS
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">John Smith</div>
                          <div className="text-xs text-slate-600">First-time buyer</div>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        🔥 HOT
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-600">Views</div>
                        <div className="font-bold text-slate-900">7</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Time</div>
                        <div className="font-bold text-slate-900">34m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-green-600">92/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                          SJ
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">Sarah Johnson</div>
                          <div className="text-xs text-slate-600">Investor</div>
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
                        <div className="font-bold text-slate-900">15m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-yellow-600">68/100</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm">
                          MD
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">Mike Davis</div>
                          <div className="text-xs text-slate-600">Just browsing</div>
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
                        <div className="font-bold text-slate-900">2m</div>
                      </div>
                      <div>
                        <div className="text-slate-600">Score</div>
                        <div className="font-bold text-slate-600">22/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Identify Serious Buyers Instantly</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Not all leads are equal. DocMetri automatically scores buyers based on their engagement—time 
                  spent viewing properties, number of return visits, pages reviewed, and actions taken. Focus 
                  your time on buyers who are actually ready to make offers.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  A "hot" buyer who viewed five listings, spent 30+ minutes total, and downloaded property specs 
                  deserves immediate attention. A "cold" lead who opened one email and bounced after 30 seconds 
                  probably isn't serious. Prioritize your follow-up based on real data, not gut feelings.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Automatic buyer engagement scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Track return visits and viewing patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Identify buyers ready to make offers</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* See Which Properties Interest Them */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">See Which Properties Generate Interest</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Understand exactly which listings capture buyer attention. If a buyer spends 8 minutes reviewing 
                  your $500K suburban home but only 30 seconds on your downtown condo, you know their preferences. 
                  Tailor your recommendations and showings accordingly.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Track which pages buyers spend time on—floor plans, neighborhood info, school districts, or 
                  pricing. This tells you what matters most to them. Use these insights to address their concerns 
                  proactively and position properties more effectively.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Compare engagement across your entire listing portfolio. Identify which properties are hot and 
                  which need better marketing. Optimize your listings based on real buyer behavior, not assumptions.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg border mb-4">
                  <div className="text-xs text-slate-600 mb-3">Property Engagement Heatmap</div>
                  <div className="space-y-2">
                    {[
                      { property: '123 Oak St - Colonial', price: '$450K', time: '8m 20s', engagement: 95, hot: true },
                      { property: '456 Elm Ave - Ranch', price: '$380K', time: '6m 45s', engagement: 88, hot: true },
                      { property: '789 Pine Rd - Victorian', price: '$525K', time: '4m 10s', engagement: 72, hot: false },
                      { property: '321 Maple Dr - Condo', price: '$295K', time: '2m 30s', engagement: 45, hot: false },
                      { property: '654 Cedar Ln - Modern', price: '$675K', time: '1m 15s', engagement: 28, hot: false }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-medium">{item.property}</span>
                            {item.hot && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">🔥</span>}
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
                          <span className="text-xs text-slate-600 w-12">{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Secure Document Sharing */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Lock className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Password Protection</span>
                    </div>
                    <p className="text-xs text-slate-600">Protect sensitive financial documents and buyer offers</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-semibold text-slate-900">Auto-Expiration</span>
                    </div>
                    <p className="text-xs text-slate-600">Listings expire automatically after closing or removal</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Email Capture</span>
                    </div>
                    <p className="text-xs text-slate-600">Build your buyer database automatically</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Download className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Download Tracking</span>
                    </div>
                    <p className="text-xs text-slate-600">Know when buyers save listings for offline review</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Share Listings Securely</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Protect sensitive property information, financial documents, and buyer offers with enterprise-grade 
                  security. Set passwords for confidential listings, expiration dates for time-sensitive offers, and 
                  control who can download documents.
                </p>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Enable email capture to build your buyer database automatically. Every person who views your listings 
                  becomes a verified lead in your CRM. Track their preferences and follow up with similar properties 
                  that match their interests.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Revoke access instantly if a deal falls through or if buyers are no longer interested. Ensure old 
                  listings with outdated pricing don't continue circulating. Maintain complete control over your 
                  property marketing materials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Perfect For Every Real Estate Professional
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Residential Agents</h3>
              <p className="text-slate-700 text-sm mb-4">
                Track buyer engagement with home listings. Know when they're viewing properties, which homes they 
                prefer, and when to schedule showings. Close more deals with data-driven follow-ups.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Listing brochure tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Buyer engagement scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Property preference insights</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Commercial Brokers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share investment prospectuses and property packages with investors. Track which commercial properties 
                generate interest. Know when investors are ready to discuss terms and make offers.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Investment property tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Investor engagement analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Financial document security</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Property Managers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share rental listings and lease agreements with prospective tenants. Track application engagement. 
                Know which units generate the most interest and optimize your rental strategy.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Rental listing analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Lease document tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tenant screening efficiency</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Luxury Real Estate</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share high-end property portfolios with qualified buyers. Protect confidential listings with password 
                protection. Track engagement from serious buyers only.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Luxury listing protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>High-net-worth buyer tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Confidential property marketing</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Real Estate Developers</h3>
              <p className="text-slate-700 text-sm mb-4">
                Share pre-construction plans and development prospectuses with investors. Track interest in new 
                developments. Identify early buyers for pre-sales.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Development plan tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Investor engagement metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Pre-sale opportunity identification</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-3">Real Estate Teams</h3>
              <p className="text-slate-700 text-sm mb-4">
                Manage multiple listings across team members. Track which agents generate the most engagement. 
                Share best practices based on real performance data.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Team performance analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Centralized listing management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Lead distribution optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Essential Features for Real Estate Professionals
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Bell className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Instant View Alerts</h4>
              <p className="text-sm text-slate-600">
                Get notified immediately when buyers open your listings. Follow up while you're fresh in their mind.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <BarChart3 className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Property-Level Analytics</h4>
              <p className="text-sm text-slate-600">
                See engagement metrics for each listing. Identify hot properties and optimize underperformers.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Target className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Buyer Scoring</h4>
              <p className="text-sm text-slate-600">
                Automatically rank buyers by interest level. Focus on hot leads ready to make offers.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Clock className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Viewing Time Tracking</h4>
              <p className="text-sm text-slate-600">
                See exactly how long buyers spend reviewing each property and which sections they focus on.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Users className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Share Tracking</h4>
              <p className="text-sm text-slate-600">
                Know when buyers forward listings to partners, family, or decision-makers. Deal progression insights.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Mail className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Lead Capture</h4>
              <p className="text-sm text-slate-600">
                Build your buyer database automatically. Require email to view listings and grow your CRM.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Lock className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Secure Sharing</h4>
              <p className="text-sm text-slate-600">
                Password-protect sensitive listings. Set expiration dates. Control downloads and access.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Download className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Download Monitoring</h4>
              <p className="text-sm text-slate-600">
                Track when buyers download listings. Know who's saving properties for serious consideration.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-blue-300 transition-colors">
              <Zap className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">CRM Integration</h4>
              <p className="text-sm text-slate-600">
                Connect to your existing CRM. Sync engagement data automatically via API or webhooks.
              </p>
            </div>
          </div>
        </div>

        {/* Real Results */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Real Results from Real Estate Professionals
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">2x</div>
              <p className="text-slate-700 font-medium mb-1">More Showings Booked</p>
              <p className="text-sm text-slate-600">Follow up when buyers are actively interested</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">35%</div>
              <p className="text-slate-700 font-medium mb-1">Faster Closings</p>
              <p className="text-sm text-slate-600">Identify serious buyers and move deals forward</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">60%</div>
              <p className="text-slate-700 font-medium mb-1">Less Time on Cold Leads</p>
              <p className="text-sm text-slate-600">Focus energy on buyers ready to transact</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8 border">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  LM
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Lisa Martinez</p>
                  <p className="text-sm text-slate-600">Top Residential Agent, Miami</p>
                </div>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "DocMetri changed how I work with buyers. I used to send listings and hope for responses. Now I know 
                exactly when buyers are interested. Last month, I closed three deals within a week because I followed 
                up at the perfect moment when buyers were actively viewing properties. My commission increased 40%."
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 border">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  DK
                </div>
                <div>
                  <p className="font-semibold text-slate-900">David Kim</p>
                  <p className="text-sm text-slate-600">Commercial Broker, NYC</p>
                </div>
              </div>
              <p className="text-slate-700 italic leading-relaxed">
                "For commercial properties, timing is everything. DocMetri tells me when investors are seriously 
                reviewing investment prospectuses versus just browsing. I closed a $2.3M deal last quarter because 
                I called the investor 10 minutes after they downloaded the financial projections. Game changer."
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-6">
            Plans Designed for Real Estate Professionals
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            From solo agents to large brokerages, we have a plan that fits your business.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
              <h3 className="font-bold text-slate-900 mb-2">Agent</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">$29</div>
              <p className="text-sm text-slate-600 mb-4">per month</p>
              <ul className="space-y-2 text-sm text-slate-700 mb-6">
                <li>100 tracked listings</li>
                <li>Unlimited buyers</li>
                <li>Real-time notifications</li>
                <li>Basic analytics</li>
              </ul>
              <a href="/pricing" className="block text-center text-blue-600 font-medium hover:underline text-sm">
                View Details →
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl border-2 border-blue-600 p-6 text-center text-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                BEST VALUE
              </div>
              <h3 className="font-bold mb-2">Team</h3>
              <div className="text-3xl font-bold mb-1">$79</div>
              <p className="text-sm text-blue-100 mb-4">per month</p>
              <ul className="space-y-2 text-sm mb-6">
                <li>500 tracked listings</li>
                <li>Team collaboration</li>
                <li>Advanced analytics</li>
                <li>CRM integration</li>
              </ul>
              <a href="/pricing" className="block text-center bg-white text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm">
                Start Free Trial
              </a>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center">
              <h3 className="font-bold text-slate-900 mb-2">Brokerage</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">$199</div>
              <p className="text-sm text-slate-600 mb-4">per month</p>
              <ul className="space-y-2 text-sm text-slate-700 mb-6">
                <li>Unlimited listings</li>
                <li>Unlimited agents</li>
                <li>White-label branding</li>
                <li>Priority support</li>
              </ul>
              <a href="/pricing" className="block text-center text-blue-600 font-medium hover:underline text-sm">
                Contact Sales →
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-slate-600 mt-8">
            All plans include 14-day free trial • No credit card required
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Start Tracking in Minutes
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Upload Listings</h3>
              <p className="text-slate-600 text-sm">
                Upload your property brochures, listing packages, or investment prospectuses as PDFs.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                2
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Share with Buyers</h3>
              <p className="text-slate-600 text-sm">
                Get trackable links and send them via email, text, or your preferred method.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                3
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Get Instant Alerts</h3>
              <p className="text-slate-600 text-sm">
                Receive notifications when buyers view your listings and track their engagement.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                4
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Close More Deals</h3>
              <p className="text-slate-600 text-sm">
                Follow up at the perfect time and focus on buyers who are actually interested.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Common Questions from Real Estate Agents
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Do buyers know they're being tracked?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                If you enable email capture, buyers provide their email before viewing. For anonymous tracking, 
                viewers aren't explicitly notified—similar to how real estate websites track visits. This is 
                standard practice and completely legal.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I track MLS listings?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                DocMetri works with any PDF document you upload. You can create custom property brochures from 
                MLS data and track those. We don't directly integrate with MLS systems, but many agents export 
                listings as PDFs and track them with DocMetri.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Does this work for open houses?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes! Generate QR codes for your listing brochures and display them at open houses. Visitors scan 
                the code, view the full listing on their phone, and you capture their contact information and 
                track their interest automatically.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can my team use one account?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes! Team and Brokerage plans support multiple agents. Each team member gets their own login, 
                can manage their own listings, and the team leader sees consolidated analytics across all agents.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">How secure are property documents?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Very secure. All documents are encrypted with bank-level security (AES-256). You can add password 
                protection, set expiration dates, and control downloads. We're GDPR compliant and follow all data 
                protection regulations.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Does it integrate with my CRM?</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Yes! DocMetri integrates with popular real estate CRMs including Follow Up Boss, LionDesk, and 
                kvCORE. We also offer Zapier integration for connecting to 3,000+ other apps, plus a REST API 
                for custom integrations.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="border-t pt-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Close More Deals This Month?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of real estate professionals using DocMetri to track listings, 
              identify serious buyers, and close deals faster with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/signup" 
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Free Trial
              </a>
              <a 
                href="/demo" 
                className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Schedule a Demo
              </a>
            </div>
            <p className="text-sm text-blue-200 mt-6">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-16 pt-12 border-t">
          <p className="text-center text-slate-600 text-sm mb-6">
            Trusted by real estate professionals in 50+ countries
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            <div className="text-slate-400 text-xs">2,000+ Agents</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">$500M+ in Tracked Listings</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">4.9★ Rating</div>
            <div className="text-slate-400 text-xs">•</div>
            <div className="text-slate-400 text-xs">GDPR Compliant</div>
          </div>
        </div>
      </div>
    </div>
  );
}