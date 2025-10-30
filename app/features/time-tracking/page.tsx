"use client";



import React, { JSX } from "react";
import { Clock, TrendingUp, Eye, BarChart3, Activity, Calendar, Zap, Target, Users, CheckCircle2, Timer, Hourglass, Watch, AlarmClock, PieChart, LineChart } from "lucide-react";

export default function TimeTrackingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            Engagement Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Understand Exactly How People Engage With Your Content
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Go beyond vanity metrics. Track reading time, engagement patterns, and attention spans 
            to truly understand how your audience consumes your PDFs and where they lose interest.
          </p>
        </div>

        {/* Main Value Prop */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12 border">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Time is the Ultimate Engagement Metric
            </h2>
            <p className="text-lg text-slate-700 mb-6 leading-relaxed">
              Anyone can open a PDF. But how long do they actually spend with your content? Which 
              pages capture attention? When do they lose interest? DocMetri's Time Tracking reveals 
              the truth about engagement—measuring not just if people view your content, but how 
              deeply they engage with it. Make data-driven decisions about content quality, structure, 
              and optimization based on actual reading behavior.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-indigo-600 mb-2">4m 32s</div>
                <p className="text-sm text-slate-600">Average engagement time per document</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
                <p className="text-sm text-slate-600">Higher conversion for 5+ minute sessions</p>
              </div>
              <div className="bg-white rounded-lg p-5 border">
                <div className="text-3xl font-bold text-blue-600 mb-2">Real-time</div>
                <p className="text-sm text-slate-600">Live engagement monitoring as it happens</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Comprehensive Time Analytics
          </h2>

          <div className="space-y-16">
            {/* Session Duration Tracking */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Session Duration Tracking</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Measure exactly how long each visitor spends with your document. Track total session 
                  time, active reading time, and idle periods. See average engagement duration across 
                  all viewers and identify patterns in how different segments consume your content. 
                  Understand whether people skim quickly or read thoroughly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Total and active reading time per session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Average session duration across all viewers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Engagement time distribution and patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Idle time vs active engagement detection</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-slate-900">Engagement Time</span>
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="text-4xl font-bold text-indigo-600 mb-2">4m 32s</div>
                    <div className="text-xs text-slate-600 mb-3">Average time spent</div>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+23% from last week</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="text-xs text-slate-600 mb-3">Time Distribution</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-2">
                          <div className="text-lg font-bold">23%</div>
                        </div>
                        <div className="text-xs text-slate-600">0-1 min</div>
                        <div className="text-xs text-slate-500">Quick scan</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-yellow-100 text-yellow-700 rounded-lg p-3 mb-2">
                          <div className="text-lg font-bold">52%</div>
                        </div>
                        <div className="text-xs text-slate-600">1-5 min</div>
                        <div className="text-xs text-slate-500">Engaged</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-green-100 text-green-700 rounded-lg p-3 mb-2">
                          <div className="text-lg font-bold">25%</div>
                        </div>
                        <div className="text-xs text-slate-600">5+ min</div>
                        <div className="text-xs text-slate-500">Deep read</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page-Level Time Analysis */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Time Spent Per Page</div>
                  <div className="space-y-3">
                    {[
                      { page: 1, title: 'Cover', time: '12s', percent: 15, color: 'bg-slate-400' },
                      { page: 2, title: 'Executive Summary', time: '2m 15s', percent: 90, color: 'bg-green-600' },
                      { page: 3, title: 'Problem Statement', time: '1m 45s', percent: 70, color: 'bg-green-500' },
                      { page: 4, title: 'Solution Overview', time: '3m 20s', percent: 100, color: 'bg-green-700' },
                      { page: 5, title: 'Pricing', time: '2m 50s', percent: 95, color: 'bg-green-600' },
                      { page: 6, title: 'Case Studies', time: '1m 30s', percent: 60, color: 'bg-yellow-500' },
                      { page: 7, title: 'Technical Specs', time: '48s', percent: 32, color: 'bg-orange-500' },
                      { page: 8, title: 'FAQ', time: '1m 05s', percent: 43, color: 'bg-yellow-600' },
                      { page: 9, title: 'Terms', time: '22s', percent: 18, color: 'bg-red-500' }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-900">
                            Page {item.page}: {item.title}
                          </span>
                          <span className="text-slate-600">{item.time}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Timer className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Page-Level Time Analysis</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  See exactly how much time readers spend on each individual page. Identify your 
                  highest-engagement pages that capture attention and pages where people rush through 
                  or skip entirely. Understand which content resonates most and where you're losing 
                  reader interest. Optimize your document structure based on real engagement data.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Time spent on each page with precision tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">High-engagement vs low-engagement page identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Page completion rate tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Drop-off point identification and analysis</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Temporal Engagement Patterns */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Temporal Engagement Patterns</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Discover when your audience is most engaged with your content. Track engagement 
                  time by hour of day, day of week, and seasonal patterns. Identify peak engagement 
                  windows when readers spend the most time with your documents. Schedule distribution 
                  and follow-ups during high-engagement periods for maximum impact.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Hour-by-hour engagement time analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Day of week engagement patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Peak engagement window identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Workday vs weekend reading behavior</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-lg border">
                    <div className="text-sm font-semibold text-slate-900 mb-4">Peak Engagement Hours</div>
                    <div className="space-y-3">
                      <div className="flex items-end gap-1 h-32">
                        {[
                          {hour: '6am', height: 20}, {hour: '7am', height: 35}, {hour: '8am', height: 55}, 
                          {hour: '9am', height: 75}, {hour: '10am', height: 90}, {hour: '11am', height: 85},
                          {hour: '12pm', height: 60}, {hour: '1pm', height: 70}, {hour: '2pm', height: 95},
                          {hour: '3pm', height: 100}, {hour: '4pm', height: 80}, {hour: '5pm', height: 65},
                          {hour: '6pm', height: 40}, {hour: '7pm', height: 25}
                        ].map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className={`w-full ${item.height > 80 ? 'bg-green-600' : item.height > 50 ? 'bg-blue-500' : 'bg-slate-400'} rounded-t`}
                              style={{ height: `${item.height}%` }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>6am</span>
                        <span className="font-semibold text-green-600">Peak: 2-3pm</span>
                        <span>7pm</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <div className="text-xs text-slate-600 mb-1">Best Day</div>
                      <div className="text-lg font-bold text-blue-600">Tuesday</div>
                      <div className="text-xs text-slate-500">5m 12s avg</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border text-center">
                      <div className="text-xs text-slate-600 mb-1">Best Time</div>
                      <div className="text-lg font-bold text-blue-600">2-3 PM</div>
                      <div className="text-xs text-slate-500">6m 45s avg</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attention Span Analysis */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border mb-4">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Engagement Over Time</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-600 mb-2">Reading Intensity (minutes 0-10)</div>
                      <div className="flex items-end gap-1 h-20">
                        {[100, 95, 90, 85, 75, 65, 55, 45, 35, 25].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-500">
                        <span>Start</span>
                        <span>End</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 rounded p-3">
                        <div className="text-xs text-slate-600">Avg Attention</div>
                        <div className="text-lg font-bold text-indigo-600">4m 18s</div>
                      </div>
                      <div className="bg-slate-50 rounded p-3">
                        <div className="text-xs text-slate-600">Drop-off At</div>
                        <div className="text-lg font-bold text-orange-600">Page 7</div>
                      </div>
                      <div className="bg-slate-50 rounded p-3">
                        <div className="text-xs text-slate-600">Completion</div>
                        <div className="text-lg font-bold text-green-600">62%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Attention Span Analysis</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Track how engagement intensity changes throughout the reading session. See when 
                  readers are most focused and when attention begins to wane. Identify the exact 
                  point where people lose interest or abandon your document. Measure completion 
                  rates and understand reading stamina for different content lengths.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Engagement intensity curve over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Attention drop-off point identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Document completion rate tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Optimal content length recommendations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Engagement Scoring */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Smart Engagement Scoring</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Automatically score each viewer's engagement level based on time spent, pages viewed, 
                  and interaction patterns. Identify your hottest leads who demonstrate deep engagement 
                  versus those who barely skim. Use engagement scores to prioritize follow-ups and 
                  tailor your outreach based on demonstrated interest level.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">AI-powered engagement scoring algorithm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Hot/warm/cold lead classification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Engagement level comparison across viewers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Priority follow-up recommendations</span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="bg-white p-5 rounded-lg border">
                  <div className="text-sm font-semibold text-slate-900 mb-4">Engagement Leaderboard</div>
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Chen', company: 'Enterprise Corp', time: '12m 45s', score: 98, temp: 'hot' },
                      { name: 'Mike Wilson', company: 'Tech Startup', time: '8m 20s', score: 87, temp: 'hot' },
                      { name: 'Alex Rodriguez', company: 'Growth Inc', time: '5m 30s', score: 72, temp: 'warm' },
                      { name: 'Emily Davis', company: 'Digital Co', time: '3m 15s', score: 58, temp: 'warm' },
                      { name: 'James Lee', company: 'Solutions Ltd', time: '1m 40s', score: 34, temp: 'cold' }
                    ].map((viewer, i) => (
                      <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {viewer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{viewer.name}</div>
                          <div className="text-xs text-slate-600">{viewer.company}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{viewer.time} reading time</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            viewer.temp === 'hot' ? 'bg-red-100 text-red-700' :
                            viewer.temp === 'warm' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {viewer.temp.toUpperCase()}
                          </div>
                          <div className="text-lg font-bold text-indigo-600 mt-1">{viewer.score}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Advanced Time Intelligence Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <LineChart className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Trend Analysis</h4>
              <p className="text-sm text-slate-600">
                Track engagement time trends over weeks and months. Measure if your content 
                optimization efforts are working.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <BarChart3 className="h-8 w-8 text-teal-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Comparative Analytics</h4>
              <p className="text-sm text-slate-600">
                Compare engagement time across different documents, audiences, and campaigns. 
                Identify your best performers.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Time Tracking in Action
          </h2>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Sales Prioritization</h4>
              <p className="text-slate-700 mb-4">
                Your sales team sends proposals to 30 qualified leads. Time tracking shows that 5 
                prospects spent over 10 minutes reading—far above the 3-minute average. These are 
                your hottest leads showing genuine interest. Sales prioritizes these 5 for immediate 
                follow-up and closes 4 of them within a week. Meanwhile, prospects who spent under 
                1 minute get nurture campaigns instead of wasting sales time. Result: 3x higher 
                close rate and 60% more efficient sales process.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Lead scoring</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Engagement alerts</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Priority targeting</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Content Optimization</h4>
              <p className="text-slate-700 mb-4">
                Your marketing team publishes a 15-page whitepaper. Time tracking reveals that 
                readers spend an average of 8 minutes but drop off dramatically at page 11—where 
                you have dense technical specifications. You move the technical content to an 
                appendix and make pages 1-10 more visual and scannable. Next version sees average 
                reading time increase to 12 minutes, completion rate jumps from 35% to 72%, and 
                lead conversion improves by 45%.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Drop-off analysis</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Content restructuring</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">A/B testing</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Timing Optimization</h4>
              <p className="text-slate-700 mb-4">
                HR distributes a benefits guide to employees. Time tracking shows that employees 
                who receive it on Tuesday mornings spend an average of 11 minutes reading, while 
                Friday afternoon recipients spend only 3 minutes. Peak engagement happens between 
                10am-2pm on weekdays. HR reschedules all important document distributions to Tuesday 
                and Wednesday mornings, resulting in 3x higher completion rates and 90% fewer 
                follow-up questions because people actually read the materials thoroughly.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Temporal patterns</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Send time optimization</span>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border">Engagement windows</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Basic Analytics vs. DocMetri Time Tracking
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Capability</th>
                  <th className="text-center p-4 font-bold text-slate-900">Basic Analytics</th>
                  <th className="text-center p-4 font-bold text-indigo-600">DocMetri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700">Track time spent reading</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Page-level time analysis</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Engagement scoring</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Attention span analysis</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Peak engagement timing</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700">Real-time monitoring</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Drop-off identification</td>
                  <td className="p-4 text-center text-red-600 text-xl">✗</td>
                  <td className="p-4 text-center text-green-600 text-xl">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BarChart3 className="h-4 w-4" />
              Time Metrics That Matter
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Understand Engagement Depth
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              Time is the most honest indicator of interest. These metrics reveal true engagement 
              and help you understand what content resonates with your audience.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Average Session Time</h4>
                <p className="text-sm text-slate-600">
                  Mean time spent per viewing session across all users and documents
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Time per Page</h4>
                <p className="text-sm text-slate-600">
                  Average reading time for each individual page to identify hot spots
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Engagement Rate</h4>
                <p className="text-sm text-slate-600">
                  Percentage of viewers who spend meaningful time (3+ minutes) reading
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border text-left">
                <h4 className="font-bold text-slate-900 mb-3">Completion Time</h4>
                <p className="text-sm text-slate-600">
                  Average time taken by users who read through the entire document
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Actionable Insights
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Turn Time Data Into Action
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              Time tracking isn't just about numbers—it's about making smarter decisions. Use 
              engagement time data to prioritize leads, optimize content, schedule distributions, 
              and measure the true impact of your PDF assets.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border">
                <Users className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 mb-2">Lead Scoring</h4>
                <p className="text-sm text-slate-600">
                  Automatically score and prioritize leads based on engagement time
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 mb-2">Content Testing</h4>
                <p className="text-sm text-slate-600">
                  A/B test different versions and measure which holds attention longer
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border">
                <Calendar className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-bold text-slate-900 mb-2">Timing Strategy</h4>
                <p className="text-sm text-slate-600">
                  Schedule sends during peak engagement windows for maximum impact
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="h-4 w-4" />
              Privacy & Transparency
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Ethical Time Tracking
            </h2>
            <p className="text-slate-700 mb-8 leading-relaxed">
              All time tracking is conducted transparently and ethically. Users are informed that 
              engagement metrics are being collected. We aggregate data responsibly and comply with 
              GDPR, CCPA, and all privacy regulations. Your time data is encrypted and secure.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">Transparent</div>
                <p className="text-sm text-slate-600">Users know tracking is active</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">Compliant</div>
                <p className="text-sm text-slate-600">GDPR & CCPA ready</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6 border">
                <div className="text-2xl font-bold text-slate-900 mb-2">Secure</div>
                <p className="text-sm text-slate-600">Encrypted data storage</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Measuring True Engagement
            </h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
              Stop guessing about engagement. Start tracking the metric that matters most—time. 
              Understand how people really interact with your content and make data-driven decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
                aria-label="Start your free trial"
              >
                Start Free Trial
              </button>
              <button 
                className="bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-800 transition-colors border-2 border-white"
                aria-label="See time tracking demo"
              >
                See Demo
              </button>
            </div>
            <p className="text-sm text-indigo-200 mt-6">
              14-day free trial • No credit card required • Unlimited time tracking
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}