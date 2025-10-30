"use client"

import React, { JSX } from "react";
import { Share2, Users, TrendingUp, Link2, Mail, Network, Zap, Eye, Target, Shield, BarChart3, Globe, MessageCircle, CheckCircle2, ArrowRight, GitBranch, Repeat } from "lucide-react";

export default function ShareDetectionsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Share2 className="h-4 w-4" />
            Viral Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Track How Your PDFs Spread Organically
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Discover the hidden network of people viewing your content. Track shares, forwards, 
            and viral distribution to understand true reach and identify your most influential advocates.
          </p>
        </div>

        {/* Main Value Prop */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 md:p-12 border">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              See Beyond the First Click
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              You send a PDF to 50 people, but it reaches 500. How? Who shared it? Where did it go? 
              Traditional analytics stop at the first recipient. DocMetri's Share Detection tracks every 
              forward, share, and handoff—revealing the complete journey of your content through networks 
              you never knew existed. Understand your true reach, identify brand advocates, and harness 
              the power of organic distribution.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-green-600 mb-2">10x</div>
                <p className="text-sm text-slate-600">Average amplification from organic sharing</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-teal-600 mb-2">Real-time</div>
                <p className="text-sm text-slate-600">Instant share notifications as content spreads</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-sm text-slate-600">Complete visibility into distribution networks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Complete Share Intelligence
          </h2>

          <div className="space-y-16">
            {/* Share Tracking */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Real-Time Share Tracking</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Monitor every share as it happens. See when someone forwards your PDF via email, 
                  shares a link on social media, or passes it to a colleague. Track the complete 
                  distribution chain from original recipient through every subsequent share, creating 
                  a complete map of your content's organic reach.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Email forward detection and tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Social media share monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Link sharing and distribution analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Generation-by-generation share tracking</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-900">Share Overview</span>
                      <Share2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-3xl font-bold text-green-600">847</div>
                        <div className="text-xs text-slate-600">Total Shares</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-teal-600">12.3x</div>
                        <div className="text-xs text-slate-600">Amplification</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+156% share rate this week</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-3">Share Velocity (Last 24 Hours)</div>
                    <div className="flex items-end gap-1 h-20">
                      {[40, 55, 45, 70, 60, 85, 75, 65, 90, 80, 95, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>12 AM</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Viral Network Mapping */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Distribution Network</div>
                  <div className="space-y-4">
                    {/* Generation 1 */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0">
                        You
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-900">Original Send</div>
                        <div className="text-xs text-slate-600">50 recipients</div>
                      </div>
                      <Share2 className="h-4 w-4 text-slate-400" />
                    </div>
                    
                    {/* Generation 2 */}
                    <div className="ml-6 border-l-2 border-green-200 pl-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          SJ
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-slate-900">Sarah Johnson shared</div>
                          <div className="text-xs text-slate-600">Forwarded to 12 people</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          MD
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-slate-900">Mike Davis shared</div>
                          <div className="text-xs text-slate-600">Posted on LinkedIn (347 views)</div>
                        </div>
                      </div>
                    </div>

                    {/* Generation 3 */}
                    <div className="ml-12 border-l-2 border-blue-200 pl-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          AC
                        </div>
                        <div className="text-xs text-slate-700">Alex shared with 8 colleagues</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          JL
                        </div>
                        <div className="text-xs text-slate-700">Jessica tweeted link (89 clicks)</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-center">
                    <div className="text-xs text-slate-600">Total Network Reach</div>
                    <div className="text-2xl font-bold text-green-600">847 people</div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Network className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Viral Network Mapping</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Visualize exactly how your content spreads through networks. See the complete 
                  distribution tree from original recipients through every share generation. Identify 
                  your most influential sharers—the people whose shares generate the most downstream 
                  views and engagement. Understand the paths your content takes to reach new audiences.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Multi-generation share tree visualization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Influencer and super-sharer identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Network reach and amplification metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Viral coefficient calculation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Channel Analytics */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Multi-Channel Share Analytics</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Understand how people share your content across different platforms. Track shares 
                  via email forwards, social media posts, messaging apps, and direct links. Measure 
                  which channels drive the most engagement and which formats perform best on each 
                  platform. Optimize your content distribution strategy based on actual sharing behavior.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Email forward tracking and analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Social platform share detection (LinkedIn, Twitter, Facebook)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Messaging app distribution (Slack, Teams, WhatsApp)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Direct link sharing and clipboard detection</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border mb-4">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Shares by Channel</div>
                  <div className="space-y-3">
                    {[
                      { channel: 'Email Forward', shares: 412, icon: Mail, percent: 100, color: 'bg-blue-600' },
                      { channel: 'LinkedIn', shares: 287, icon: Share2, percent: 70, color: 'bg-indigo-600' },
                      { channel: 'Slack/Teams', shares: 156, icon: MessageCircle, percent: 38, color: 'bg-purple-600' },
                      { channel: 'Direct Link', shares: 98, icon: Link2, percent: 24, color: 'bg-green-600' },
                      { channel: 'Twitter/X', shares: 67, icon: Globe, percent: 16, color: 'bg-teal-600' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-slate-600" />
                            <span className="font-medium text-slate-900">{item.channel}</span>
                          </div>
                          <span className="text-slate-600">{item.shares} shares</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-600">Most Popular</div>
                    <div className="text-sm font-bold text-slate-900">Email</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-600">Fastest Growing</div>
                    <div className="text-sm font-bold text-slate-900">Slack</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Influencer Identification */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Top Influencers & Super Sharers</div>
                  <div className="space-y-4">
                    {[
                      { name: 'Sarah Johnson', role: 'VP of Marketing', shares: 47, reach: 1240, score: 98 },
                      { name: 'Mike Davis', role: 'Sales Director', shares: 34, reach: 890, score: 87 },
                      { name: 'Alex Chen', role: 'Product Manager', shares: 28, reach: 670, score: 76 },
                      { name: 'Jessica Lee', role: 'Content Lead', shares: 23, reach: 580, score: 68 }
                    ].map((influencer, i) => (
                      <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {influencer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{influencer.name}</div>
                          <div className="text-xs text-slate-600">{influencer.role}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>{influencer.shares} shares</span>
                            <span>•</span>
                            <span>{influencer.reach} reach</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-600 mb-1">Influence</div>
                          <div className="text-lg font-bold text-green-600">{influencer.score}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Influencer Identification</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Discover your content champions—the people whose shares generate the most impact. 
                  Our algorithm scores each sharer based on reach, engagement quality, and downstream 
                  amplification. Identify brand advocates, nurture relationships with top influencers, 
                  and create targeted strategies to encourage sharing from your most valuable promoters.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">AI-powered influencer scoring algorithm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Super-sharer leaderboards and rankings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Network reach and amplification metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Advocate engagement and nurturing tools</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Share Alerts */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Real-Time Share Alerts</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Stay informed as your content goes viral. Get instant notifications when someone 
                  shares your PDF, when shares reach milestone numbers, or when high-value contacts 
                  forward your content. Set up custom alerts for specific sharing patterns, viral 
                  velocity thresholds, or influencer activity to never miss important distribution events.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Instant share notifications via email and Slack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Viral velocity and momentum alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Milestone and achievement notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Custom alert rules and triggers</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5" />
                      <span className="font-semibold text-sm">Viral Alert!</span>
                    </div>
                    <p className="text-sm text-orange-50">
                      Your whitepaper is going viral! 50 shares in the last hour
                    </p>
                    <div className="mt-3 text-xs text-orange-100">
                      Now • Trending on LinkedIn
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Share2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm text-slate-900">New Share</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Mike Davis shared your proposal with 12 colleagues
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      3 minutes ago
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm text-slate-900">Milestone</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Your case study reached 500 total shares!
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      12 minutes ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Advanced Share Intelligence Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <GitBranch className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Share Tree Analysis</h4>
              <p className="text-sm text-slate-600">
                Visualize complete distribution paths. See how shares branch and spread through 
                networks with interactive tree diagrams.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Repeat className="h-8 w-8 text-teal-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Viral Coefficient</h4>
              <p className="text-sm text-slate-600">
                Calculate your content's K-factor. Measure how many additional shares each share 
                generates on average.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Share Performance</h4>
              <p className="text-sm text-slate-600">
                Compare share rates across different documents, time periods, and campaigns. 
                Identify what makes content shareable.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Users className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Audience Expansion</h4>
              <p className="text-sm text-slate-600">
                Track how shares introduce your content to new audiences and market segments 
                you never directly targeted.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Eye className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Share-to-View Ratio</h4>
              <p className="text-sm text-slate-600">
                Measure engagement quality. See how many views each share generates and 
                identify the most effective sharers.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Globe className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Geographic Spread</h4>
              <p className="text-sm text-slate-600">
                Watch your content spread across regions and countries. Identify unexpected 
                geographic markets through share patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Share Detection in Action
          </h2>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Sales Amplification</h4>
              <p className="text-slate-700 mb-4">
                You send a product demo to 20 decision-makers. Share detection reveals that 3 of 
                them forwarded it to their entire teams—18 additional stakeholders you didn't know 
                existed. You see exactly who received it through forwards, identify the key 
                influencers, and reach out to the expanded buying committee. Result: Deal size 
                increases 3x because you're engaging the full decision-making group.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Network mapping</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Stakeholder identification</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Deal expansion</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Content Virality Analysis</h4>
              <p className="text-slate-700 mb-4">
                Your marketing team distributes a report to 100 subscribers. Within 48 hours, share 
                detection shows it reached 1,200 people through organic sharing—a 12x amplification. 
                You discover that LinkedIn shares drove 70% of viral growth, with one influencer's 
                share generating 400 views. You build relationships with top sharers, optimize future 
                content for LinkedIn, and triple your organic reach without increasing spend.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Viral coefficient</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Channel optimization</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Influencer partnerships</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Internal Knowledge Sharing</h4>
              <p className="text-slate-700 mb-4">
                HR distributes a new policy document to department heads. Share tracking reveals 
                uneven distribution—some departments forwarded it to all staff while others didn't 
                share at all, creating compliance gaps. You identify which teams need direct 
                communication, measure actual policy reach vs. assumed reach, and ensure 100% 
                coverage. This prevents compliance issues and ensures organizational alignment.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Compliance tracking</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Coverage analysis</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Distribution gaps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Traditional Tracking vs. DocMetri Share Detection
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Capability</th>
                  <th className="text-center p-4 font-bold text-slate-900">Traditional Analytics</th>
                  <th className="text-center p-4 font-bold text-green-600">DocMetri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700">Track email forwards</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">See who shared with whom</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Multi-generation tracking</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Viral network mapping</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Identify influencers</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Cross-platform share tracking</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Real-time share alerts</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BarChart3 className="h-4 w-4" />
              Key Share Metrics
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Measure What Matters
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              DocMetri tracks the metrics that reveal true content performance and viral potential. 
              From viral coefficient to influencer impact scores, get the insights you need to 
              optimize your distribution strategy.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Share Velocity</h4>
                <p className="text-sm text-slate-600">
                  Shares per hour/day showing momentum and viral acceleration patterns
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Amplification Factor</h4>
                <p className="text-sm text-slate-600">
                  Total reach divided by original send size (e.g., 10x amplification)
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Viral Coefficient (K-Factor)</h4>
                <p className="text-sm text-slate-600">
                  Average number of additional shares generated per share
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Network Depth</h4>
                <p className="text-sm text-slate-600">
                  Number of sharing generations (how many degrees of separation)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Privacy-First Tracking
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Ethical Share Detection
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              Share detection is done ethically and transparently. Recipients are informed that 
              sharing is tracked, and we comply with all privacy regulations including GDPR and CCPA. 
              Share data is encrypted, secure, and never sold to third parties.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">GDPR</div>
                <p className="text-sm text-slate-600">Compliant share tracking</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">Transparent</div>
                <p className="text-sm text-slate-600">Recipients know tracking is active</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">Secure</div>
                <p className="text-sm text-slate-600">Encrypted end-to-end</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Discover Your Content's Hidden Network
            </h2>
            <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
              Stop wondering where your content goes after you hit send. Start tracking every share, 
              understanding your viral growth, and harnessing the power of organic distribution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
                aria-label="Start your free trial"
              >
                Start Free Trial
              </button>
              <button 
                className="bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-800 transition-colors border-2 border-white"
                aria-label="See share tracking demo"
              >
                See Demo
              </button>
            </div>
            <p className="text-sm text-green-200 mt-6">
              14-day free trial • No credit card required • Track unlimited shares
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-green-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}