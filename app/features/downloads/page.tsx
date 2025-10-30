"use client"

import React, { JSX } from "react";
import { Download, TrendingUp, Users, MapPin, Clock, Bell, Shield, BarChart3, Filter, Zap, Globe, Smartphone, CheckCircle2, ArrowRight, Eye, Share2, Calendar } from "lucide-react";

export default function DownloadTrackingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Download className="h-4 w-4" />
            Download Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Know Exactly Who Downloads Your PDFs
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Stop guessing about your document distribution. Track every download with precision, 
            understand your audience, and measure the real reach of your content with enterprise-grade download analytics.
          </p>
        </div>

        {/* Main Value Prop */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 border">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Turn Downloads Into Actionable Intelligence
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              Every time someone downloads your PDF, you're missing critical insights. Who are they? 
              Where did they come from? What device are they using? With DocMetri's Download Tracking, 
              you get complete visibility into your document distribution, enabling smarter follow-ups, 
              better content strategy, and measurable ROI from your PDF assets.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-sm text-slate-600">Download attribution accuracy with zero guesswork</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-indigo-600 mb-2">Real-time</div>
                <p className="text-sm text-slate-600">Instant notifications when key prospects download</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-purple-600 mb-2">3x</div>
                <p className="text-sm text-slate-600">Faster lead response with download alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Complete Download Visibility
          </h2>

          <div className="space-y-16">
            {/* Download Monitoring */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Real-Time Download Monitoring</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Track every single download as it happens. Get instant visibility into who's accessing 
                  your content, when they're downloading, and from which sources. Never miss a download 
                  event with our real-time monitoring dashboard that updates live as downloads occur.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Live download feed with instant updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Total downloads vs unique downloaders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Download conversion rate from views</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Historical download trends and patterns</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-900">Download Overview</span>
                      <Download className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600">1,847</div>
                        <div className="text-xs text-slate-600">Total Downloads</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-indigo-600">524</div>
                        <div className="text-xs text-slate-600">Unique Users</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+34% from last month</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-3">Download Activity (Last 7 Days)</div>
                    <div className="flex items-end gap-1 h-24">
                      {[65, 78, 55, 90, 72, 85, 95].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Mon</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visitor Intelligence */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border mb-4">
                  <div className="text-xs text-slate-600 mb-4">Recent Downloads</div>
                  <div className="space-y-3">
                    {[
                      { name: 'Emily Rodriguez', email: 'emily@techcorp.com', time: '2 min ago', location: 'New York', device: 'Desktop' },
                      { name: 'James Wilson', email: 'jwilson@startup.io', time: '8 min ago', location: 'San Francisco', device: 'Mobile' },
                      { name: 'Sarah Chen', email: 'sarah.chen@enterprise.com', time: '15 min ago', location: 'Austin', device: 'Tablet' },
                      { name: 'Anonymous User', email: 'Visitor from LinkedIn', time: '23 min ago', location: 'Boston', device: 'Desktop' }
                    ].map((download, i) => (
                      <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {download.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 text-sm">{download.name}</div>
                          <div className="text-xs text-slate-600 truncate">{download.email}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {download.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {download.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {download.device}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Downloader Intelligence</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Know exactly who's downloading your PDFs. Capture detailed information about each 
                  downloader including their identity, location, device type, and referral source. 
                  Build comprehensive profiles of your audience and identify high-value prospects 
                  based on download behavior.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Email capture and user identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Device and browser detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Geographic location tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Referral source attribution</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Source Attribution */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Traffic Source Attribution</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Discover exactly where your downloads are coming from. Track which marketing channels, 
                  campaigns, or referral sources drive the most downloads. Measure ROI on your distribution 
                  efforts and optimize your content strategy based on real conversion data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">UTM parameter tracking and campaign attribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Social media platform identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Email campaign tracking and segmentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Direct vs referral download breakdown</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border mb-4">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Top Download Sources</div>
                  <div className="space-y-3">
                    {[
                      { source: 'LinkedIn Campaign', downloads: 487, percent: 85, color: 'bg-blue-600' },
                      { source: 'Email Newsletter', downloads: 342, percent: 60, color: 'bg-indigo-600' },
                      { source: 'Twitter/X', downloads: 298, percent: 52, color: 'bg-purple-600' },
                      { source: 'Direct Link', downloads: 276, percent: 48, color: 'bg-pink-600' },
                      { source: 'Google Search', downloads: 189, percent: 33, color: 'bg-orange-600' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-900">{item.source}</span>
                          <span className="text-slate-600">{item.downloads} downloads</span>
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
                    <Share2 className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-600">Social</div>
                    <div className="text-xl font-bold text-slate-900">42%</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <Globe className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-600">Direct</div>
                    <div className="text-xl font-bold text-slate-900">35%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Insights */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-900">Downloads by Location</span>
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { country: 'United States', city: 'San Francisco', downloads: 487, flag: '🇺🇸' },
                        { country: 'United Kingdom', city: 'London', downloads: 342, flag: '🇬🇧' },
                        { country: 'Germany', city: 'Berlin', downloads: 298, flag: '🇩🇪' },
                        { country: 'Canada', city: 'Toronto', downloads: 276, flag: '🇨🇦' },
                        { country: 'Australia', city: 'Sydney', downloads: 189, flag: '🇦🇺' }
                      ].map((loc, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{loc.flag}</span>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{loc.country}</div>
                              <div className="text-xs text-slate-600">{loc.city}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">{loc.downloads}</div>
                            <div className="text-xs text-slate-600">downloads</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-2">Global Reach</div>
                    <div className="text-2xl font-bold text-slate-900">47 Countries</div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Geographic Insights</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Understand the geographic distribution of your downloads. See which countries, regions, 
                  and cities are engaging with your content most. Identify expansion opportunities, tailor 
                  content for specific markets, and measure the effectiveness of location-based campaigns.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Country and city-level tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Time zone analysis for optimal sending</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Regional performance comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Language preference insights</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Smart Alerts */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Smart Download Alerts</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Never miss an important download. Set up intelligent alerts that notify you instantly 
                  when key prospects, specific companies, or high-value leads download your content. 
                  Receive notifications via email, Slack, or webhook integrations for immediate action.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Real-time email and Slack notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Custom alert rules and filters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">VIP prospect download notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Webhook integrations for CRM updates</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-5 w-5" />
                      <span className="font-semibold text-sm">VIP Download Alert</span>
                    </div>
                    <p className="text-sm text-orange-50">
                      Sarah Chen from Enterprise Corp just downloaded your product brochure
                    </p>
                    <div className="mt-3 text-xs text-orange-100">
                      2 minutes ago • San Francisco, CA
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm text-slate-900">New Download</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      james.wilson@startup.io downloaded your case study
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      8 minutes ago • Mobile
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium text-sm text-slate-900">Milestone Reached</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Your pricing guide reached 1,000 downloads!
                    </p>
                    <div className="mt-2 text-xs text-slate-500">
                      15 minutes ago
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
            Enterprise-Grade Download Analytics
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Smartphone className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Device Analytics</h4>
              <p className="text-sm text-slate-600">
                Track downloads across desktop, mobile, and tablet. Understand device preferences 
                and optimize your PDFs for each platform.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Calendar className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Time-Based Patterns</h4>
              <p className="text-sm text-slate-600">
                Identify peak download hours and days. Schedule your distribution for maximum 
                impact based on audience behavior.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Filter className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Advanced Filtering</h4>
              <p className="text-sm text-slate-600">
                Segment downloads by any criteria. Filter by location, device, source, date 
                range, and custom parameters.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <BarChart3 className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Conversion Tracking</h4>
              <p className="text-sm text-slate-600">
                Measure download-to-action conversion rates. Track what happens after the 
                download with integrated conversion goals.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Zap className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">API Integration</h4>
              <p className="text-sm text-slate-600">
                Export download data to your CRM, marketing automation, or analytics tools. 
                Full REST API access included.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Shield className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Download Protection</h4>
              <p className="text-sm text-slate-600">
                Limit downloads per user, set expiration dates, and require authentication. 
                Full control over content distribution.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Download Tracking in Action
          </h2>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Sales Enablement</h4>
              <p className="text-slate-700 mb-4">
                Your sales team sends product brochures to 50 qualified leads. With download tracking, 
                you instantly know that 38 people downloaded it, 12 are from target accounts, and 5 
                downloaded multiple times (showing high interest). Sales receives real-time alerts and 
                follows up within minutes, resulting in 40% higher response rates and faster deal cycles.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Real-time alerts</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Lead scoring</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">CRM integration</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Content Marketing ROI</h4>
              <p className="text-slate-700 mb-4">
                You publish a whitepaper and promote it across LinkedIn, Twitter, and email. Download 
                tracking reveals that LinkedIn drives 60% of downloads, Twitter only 10%, and email 
                campaigns have a 15% download rate. You reallocate budget to LinkedIn, resulting in 
                3x more qualified leads at half the cost per acquisition.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Source attribution</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Campaign tracking</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">ROI measurement</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Partnership Distribution</h4>
              <p className="text-slate-700 mb-4">
                You share a co-branded eBook with 10 partner companies for distribution to their 
                audiences. Download tracking shows Partner A drove 500 downloads while Partner B only 
                drove 20. You identify top-performing partners, strengthen those relationships, and 
                adjust your partnership strategy based on actual performance data.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Partner analytics</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Distribution tracking</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Performance comparison</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Traditional Distribution vs. DocMetri Download Tracking
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Capability</th>
                  <th className="text-center p-4 font-bold text-slate-900">Traditional PDF</th>
                  <th className="text-center p-4 font-bold text-blue-600">DocMetri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700">Track who downloaded</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Know download source</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Real-time notifications</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Geographic insights</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Device analytics</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Campaign attribution</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Historical download data</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Integration Section */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Seamless Integration
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Works With Your Existing Tools
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              DocMetri integrates seamlessly with your CRM, marketing automation, and analytics 
              platforms. Automatically sync download data to Salesforce, HubSpot, Marketo, and more. 
              Use our REST API or webhook integrations to build custom workflows.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Salesforce', 'HubSpot', 'Marketo', 'Pipedrive', 'Slack', 'Zapier', 'Google Analytics', 'Webhooks'].map((tool, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 border text-center">
                  <div className="font-semibold text-slate-900 text-sm">{tool}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Privacy & Compliance
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Compliant Download Tracking
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              We prioritize privacy and compliance. All download tracking is GDPR and CCPA compliant 
              with built-in consent management. Your download data is encrypted, secure, and never 
              shared with third parties. Full transparency and control over data collection.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">GDPR</div>
                <p className="text-sm text-slate-600">Compliant tracking with consent management</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">CCPA</div>
                <p className="text-sm text-slate-600">California privacy law ready</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">SOC 2</div>
                <p className="text-sm text-slate-600">Enterprise security certified</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Tracking Downloads Today
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using DocMetri to track, analyze, and optimize their 
              PDF distribution. Get complete visibility into your downloads in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                aria-label="Start your free trial"
              >
                Start Free Trial
              </button>
              <button 
                className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors border-2 border-white"
                aria-label="View demo"
              >
                View Demo
              </button>
            </div>
            <p className="text-sm text-blue-200 mt-6">
              14-day free trial • No credit card required • Full feature access
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}