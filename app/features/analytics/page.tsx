import React, { JSX } from "react";
import { BarChart3, Eye, Clock, MousePointerClick, Download, Users, TrendingUp, Activity, Map, Share2, Bell, Target, Zap, PieChart, LineChart, Calendar, Filter, FileText, CheckCircle2 } from "lucide-react";

export default function DocumentAnalyticsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BarChart3 className="h-4 w-4" />
            Powerful Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Document Analytics That Drive Results
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform your PDFs from static files into intelligent assets. Track every interaction, 
            understand engagement patterns, and make data-driven decisions about your content.
          </p>
        </div>

        {/* Main Value Prop */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 border">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              See What Happens After You Click Send
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              Traditional PDFs are a black box—you send them out and hope for the best. DocMetri changes 
              that by giving you complete visibility into how recipients interact with your documents. 
              Know exactly who opened your proposal, which pages they read, how long they spent on each 
              section, and when to follow up.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-purple-600 mb-2">10x</div>
                <p className="text-sm text-slate-600">Faster lead qualification with real-time alerts</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
                <p className="text-sm text-slate-600">Higher close rates with engagement insights</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-green-600 mb-2">5hrs</div>
                <p className="text-sm text-slate-600">Saved per week on manual follow-ups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Analytics Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Comprehensive Analytics at Your Fingertips
          </h2>

          <div className="space-y-16">
            {/* View Tracking */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">View Tracking</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Know exactly when someone opens your document. Track total views, unique visitors, and 
                  returning viewers. See which links drive the most traffic and identify your most engaged audiences.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Real-time view notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Unique vs. returning visitor analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Traffic source attribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Time-series view patterns</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">1,247</div>
                      <div className="text-xs text-slate-600">Total Views</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">342</div>
                      <div className="text-xs text-slate-600">Unique Visitors</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-3">Views Over Time</div>
                    <div className="flex items-end gap-1 h-24">
                      {[30, 45, 60, 55, 75, 90, 85, 70, 95, 80, 100, 90].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Time */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">Average Time Spent</span>
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">4m 32s</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>+23% from last week</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-slate-900">0-1m</div>
                      <div className="text-xs text-slate-600">23%</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-slate-900">1-5m</div>
                      <div className="text-xs text-slate-600">52%</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border text-center">
                      <div className="text-lg font-bold text-slate-900">5m+</div>
                      <div className="text-xs text-slate-600">25%</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Engagement Time</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Understand how long people spend with your content. Track average session duration, 
                  time on each page, and engagement patterns throughout the day. Identify your most 
                  compelling content based on reading time.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Total and average time spent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Time distribution by page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Peak engagement hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Bounce rate analysis</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Page-Level Analytics */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Page-Level Analytics</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Go beyond document-level metrics. See exactly which pages capture attention and which 
                  ones are skipped. Identify hot pages that drive engagement and cold pages that need 
                  improvement. Optimize your content based on real user behavior.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Individual page view counts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Time spent per page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Page completion rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Drop-off point identification</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-4 rounded-lg border mb-4">
                  <div className="text-xs text-slate-600 mb-3">Page Engagement Heatmap</div>
                  <div className="space-y-2">
                    {[
                      { page: 'Cover', views: 342, time: '45s', engagement: 100 },
                      { page: 'Executive Summary', views: 338, time: '2m 15s', engagement: 95 },
                      { page: 'Pricing', views: 312, time: '3m 30s', engagement: 85 },
                      { page: 'Case Studies', views: 298, time: '2m 45s', engagement: 78 },
                      { page: 'Technical Specs', views: 156, time: '1m 20s', engagement: 42 },
                      { page: 'Terms', views: 89, time: '30s', engagement: 25 }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-900 font-medium">{item.page}</span>
                          <span className="text-slate-600">{item.views} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.engagement > 80 ? 'bg-green-500' :
                                item.engagement > 50 ? 'bg-yellow-500' :
                                'bg-red-400'
                              }`}
                              style={{ width: `${item.engagement}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 w-16">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Tracking */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <MousePointerClick className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">Link Clicks</span>
                      <span className="ml-auto text-2xl font-bold text-purple-600">147</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>"Schedule a Demo" button</span>
                        <span className="font-medium">67 clicks</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>"View Pricing" link</span>
                        <span className="font-medium">52 clicks</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>"Contact Sales" button</span>
                        <span className="font-medium">28 clicks</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Download className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Downloads</span>
                      <span className="ml-auto text-2xl font-bold text-blue-600">89</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      26% of viewers downloaded the PDF
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Share2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">Shares</span>
                      <span className="ml-auto text-2xl font-bold text-green-600">34</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Forwarded to 34 additional recipients
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <MousePointerClick className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Interaction Tracking</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Track every action viewers take with your document. Monitor link clicks, downloads, 
                  shares, and form submissions. Understand which calls-to-action drive the most engagement 
                  and optimize your conversion funnel.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">CTA click tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Download monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Share and forward tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Email capture and form fills</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Visitor Intelligence */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Visitor Intelligence</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Know who's viewing your documents. Capture visitor information, track device types, 
                  browser preferences, and geographic locations. Identify returning visitors and understand 
                  viewing patterns across your organization.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Visitor identification (with email capture)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Device and browser analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Geographic location data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Company identification (for B2B)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-3">Recent Visitors</div>
                    <div className="space-y-3">
                      {[
                        { name: 'Sarah Johnson', email: 'sarah.j@company.com', time: '2m ago', views: 3 },
                        { name: 'Mike Davis', email: 'mike.d@enterprise.co', time: '15m ago', views: 1 },
                        { name: 'Anonymous', email: 'Location: San Francisco', time: '1h ago', views: 2 }
                      ].map((visitor, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {visitor.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{visitor.name}</div>
                            <div className="text-slate-500">{visitor.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-600">{visitor.time}</div>
                            <div className="text-slate-500">{visitor.views} views</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border">
                      <Map className="h-5 w-5 text-indigo-600 mb-2" />
                      <div className="text-xs text-slate-600">Top Location</div>
                      <div className="text-sm font-semibold text-slate-900">San Francisco</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <Activity className="h-5 w-5 text-purple-600 mb-2" />
                      <div className="text-xs text-slate-600">Top Device</div>
                      <div className="text-sm font-semibold text-slate-900">Desktop</div>
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
            Advanced Analytics Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Bell className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Real-Time Alerts</h4>
              <p className="text-sm text-slate-600">
                Get instant notifications via email, Slack, or webhook when important events happen. 
                Never miss a hot lead or engagement opportunity.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Trend Analysis</h4>
              <p className="text-sm text-slate-600">
                Compare performance over time. Identify trends, seasonal patterns, and growth 
                opportunities across all your documents.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Filter className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Custom Filters</h4>
              <p className="text-sm text-slate-600">
                Segment your analytics by date range, visitor type, location, device, and more. 
                Drill down into the metrics that matter most.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Target className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Engagement Scoring</h4>
              <p className="text-sm text-slate-600">
                AI-powered scoring system ranks visitors based on engagement level. 
                Prioritize follow-ups with the hottest leads.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Calendar className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Historical Data</h4>
              <p className="text-sm text-slate-600">
                Access unlimited historical analytics. Track long-term trends and measure 
                the lasting impact of your content.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Zap className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">API Access</h4>
              <p className="text-sm text-slate-600">
                Export analytics data via REST API. Integrate with your CRM, data warehouse, 
                or business intelligence tools.
              </p>
            </div>
          </div>
        </div>

        {/* Use Case Examples */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Analytics in Action
          </h2>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Sales Scenario</h4>
              <p className="text-slate-700 mb-4">
                You send a proposal to a prospect. DocMetri shows you that they opened it immediately, 
                spent 8 minutes reading pages 3-5 (your pricing section), and forwarded it to two 
                colleagues. You get an alert and follow up within 15 minutes while they're still 
                actively reviewing. Result: 3x faster deal cycle.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Real-time alerts</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Page-level insights</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Share tracking</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Marketing Scenario</h4>
              <p className="text-slate-700 mb-4">
                You distribute a whitepaper to 500 leads. Analytics reveal that pages 7-9 have 90% 
                engagement while page 4 sees massive drop-off. You revise the content structure, 
                moving your key insights forward. Next campaign sees 45% higher completion rates 
                and 2x more conversions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Page analytics</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Drop-off tracking</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">A/B testing</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Recruitment Scenario</h4>
              <p className="text-slate-700 mb-4">
                HR sends job descriptions to candidates. You discover candidates from LinkedIn 
                spend 6 minutes reading while Indeed referrals only spend 90 seconds. You optimize 
                content for each platform separately. Result: 60% increase in qualified applicant 
                responses from Indeed.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Traffic sources</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Engagement time</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Content optimization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Traditional PDFs vs. DocMetri Analytics
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Feature</th>
                  <th className="text-center p-4 font-bold text-slate-900">Traditional PDF</th>
                  <th className="text-center p-4 font-bold text-purple-600">DocMetri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700">Know when opened</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Track reading time</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Page-by-page analytics</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Visitor identification</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Real-time alerts</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Link click tracking</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Engagement scoring</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Privacy Section */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Privacy & Compliance
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Enterprise-Grade Security & Privacy
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              We take data privacy seriously. All analytics are collected ethically and comply with 
              GDPR, CCPA, and other privacy regulations. Your data is encrypted in transit and at rest, 
              and we never sell or share your analytics with third parties.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">SOC 2</div>
                <p className="text-sm text-slate-600">Type II Certified</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">GDPR</div>
                <p className="text-sm text-slate-600">Fully Compliant</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">256-bit</div>
                <p className="text-sm text-slate-600">Encryption</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Unlock the Power of Analytics?
            </h2>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams using DocMetri to track, analyze, and optimize their 
              document engagement. Start your free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-50 transition-colors shadow-lg"
                aria-label="Start your free trial"
              >
                Start Free Trial
              </button>
              <button 
                className="bg-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-800 transition-colors border-2 border-white"
                aria-label="Schedule a demo"
              >
                Schedule Demo
              </button>
            </div>
            <p className="text-sm text-purple-200 mt-6">
              14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}