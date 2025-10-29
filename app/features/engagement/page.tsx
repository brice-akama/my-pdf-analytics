"use client"

import React, { JSX, useState } from "react";
import { Activity, Eye, Clock, User, MapPin, Smartphone, Monitor, Globe, AlertCircle, TrendingUp, Zap, Users, Bell, ChevronDown, ChevronUp, ExternalLink, Download, Share2, MousePointerClick, Calendar, Filter, Search, BarChart3, Radio } from "lucide-react";

export default function EngagementTrackingPage(): JSX.Element {
  const [expandedView, setExpandedView] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  // Mock data for live visitors
  const liveVisitors = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@techcorp.com",
      company: "TechCorp Inc.",
      document: "Q4 Sales Proposal",
      currentPage: 5,
      totalPages: 12,
      timeSpent: "4m 32s",
      location: "San Francisco, CA",
      device: "Desktop",
      browser: "Chrome",
      engagement: 85,
      isActive: true,
      timestamp: "Just now",
      actions: ["Viewed pricing", "Downloaded PDF", "Clicked CTA"]
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      email: "m.rodriguez@enterprise.io",
      company: "Enterprise Solutions",
      document: "Product Whitepaper",
      currentPage: 3,
      totalPages: 8,
      timeSpent: "2m 15s",
      location: "New York, NY",
      device: "Mobile",
      browser: "Safari",
      engagement: 62,
      isActive: true,
      timestamp: "2m ago",
      actions: ["Opened document", "Scrolled to page 3"]
    },
    {
      id: 3,
      name: "Emily Watson",
      email: "ewatson@startup.com",
      company: "Startup Co",
      document: "Case Study Collection",
      currentPage: 8,
      totalPages: 10,
      timeSpent: "7m 45s",
      location: "Austin, TX",
      device: "Tablet",
      browser: "Chrome",
      engagement: 92,
      isActive: true,
      timestamp: "5m ago",
      actions: ["Viewed all pages", "Shared document", "Clicked 3 links"]
    }
  ];

  // Mock data for recent activity
  const recentActivity = [
    { id: 1, type: "view", user: "John Smith", document: "Proposal v2", time: "10m ago", icon: Eye, color: "blue" },
    { id: 2, type: "download", user: "Lisa Park", document: "Technical Specs", time: "15m ago", icon: Download, color: "green" },
    { id: 3, type: "share", user: "David Lee", document: "Product Demo", time: "23m ago", icon: Share2, color: "purple" },
    { id: 4, type: "click", user: "Anna White", document: "Pricing Sheet", time: "35m ago", icon: MousePointerClick, color: "orange" },
    { id: 5, type: "view", user: "Tom Johnson", document: "Q4 Report", time: "42m ago", icon: Eye, color: "blue" },
  ];

  // Mock engagement stats
  const stats = [
    { label: "Active Now", value: "12", change: "+3", icon: Radio, color: "green" },
    { label: "Today's Views", value: "247", change: "+18%", icon: Eye, color: "blue" },
    { label: "Avg. Time", value: "3m 45s", change: "+12%", icon: Clock, color: "purple" },
    { label: "Hot Leads", value: "8", change: "+2", icon: Zap, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Engagement Tracking</h1>
              <p className="text-slate-600">Monitor real-time document interactions and visitor activity</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
                <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl border-2 border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("live")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "live"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Live Activity
                </div>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "history"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </div>
              </button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Live Activity View */}
          {activeTab === "live" && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-slate-900">
                  {liveVisitors.length} Active Visitors
                </h3>
              </div>

              <div className="space-y-4">
                {liveVisitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="border-2 border-slate-200 rounded-xl overflow-hidden hover:border-purple-300 transition-colors"
                  >
                    <div
                      className="p-5 bg-white cursor-pointer"
                      onClick={() => setExpandedView(expandedView === visitor.id ? null : visitor.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {visitor.name.split(' ').map(n => n[0]).join('')}
                          </div>

                          {/* Visitor Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 truncate">{visitor.name}</h4>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                                Live
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 truncate mb-2">{visitor.email}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {visitor.location}
                              </span>
                              <span className="flex items-center gap-1">
                                {visitor.device === "Desktop" ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                                {visitor.device}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {visitor.timeSpent}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Engagement Score & Toggle */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              visitor.engagement >= 80 ? 'text-green-600' :
                              visitor.engagement >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {visitor.engagement}
                            </div>
                            <div className="text-xs text-slate-600">Score</div>
                          </div>
                          {expandedView === visitor.id ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Document Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                          <span className="font-medium">{visitor.document}</span>
                          <span>Page {visitor.currentPage} of {visitor.totalPages}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${(visitor.currentPage / visitor.totalPages) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedView === visitor.id && (
                      <div className="bg-slate-50 border-t border-slate-200 p-5">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Recent Actions */}
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3 text-sm">Recent Actions</h5>
                            <div className="space-y-2">
                              {visitor.actions.map((action, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Visitor Details */}
                          <div>
                            <h5 className="font-bold text-slate-900 mb-3 text-sm">Visitor Details</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Company:</span>
                                <span className="font-medium text-slate-900">{visitor.company}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Browser:</span>
                                <span className="font-medium text-slate-900">{visitor.browser}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">First Seen:</span>
                                <span className="font-medium text-slate-900">{visitor.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                          <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <Bell className="h-4 w-4" />
                              Set Alert
                            </div>
                          </button>
                          <button className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              View Profile
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History View */}
          {activeTab === "history" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-full bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className={`h-5 w-5 text-${activity.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        <span className="font-bold">{activity.user}</span> {activity.type}ed{' '}
                        <span className="text-purple-600">{activity.document}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                      Details
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button className="px-6 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors">
                  Load More Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Insights */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Peak Activity Times */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-slate-900">Peak Activity Times</h3>
            </div>
            <div className="space-y-3">
              {[
                { time: "2:00 PM - 3:00 PM", views: 45, bar: 100 },
                { time: "10:00 AM - 11:00 AM", views: 38, bar: 84 },
                { time: "9:00 AM - 10:00 AM", views: 32, bar: 71 },
                { time: "3:00 PM - 4:00 PM", views: 28, bar: 62 }
              ].map((slot, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{slot.time}</span>
                    <span className="font-semibold text-slate-900">{slot.views}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${slot.bar}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Documents */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="font-bold text-slate-900">Top Documents</h3>
            </div>
            <div className="space-y-3">
              {[
                { name: "Q4 Sales Proposal", views: 89, engagement: 92 },
                { name: "Product Whitepaper", views: 76, engagement: 85 },
                { name: "Case Study Pack", views: 64, engagement: 78 },
                { name: "Pricing Guide", views: 52, engagement: 71 }
              ].map((doc, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{doc.name}</span>
                    <span className="text-xs text-slate-600">{doc.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${doc.engagement}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-green-600">{doc.engagement}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hot Leads Alert */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-orange-600" />
              <h3 className="font-bold text-slate-900">Hot Leads</h3>
            </div>
            <p className="text-sm text-slate-700 mb-4">
              These visitors show high engagement and may be ready for follow-up.
            </p>
            <div className="space-y-3">
              {[
                { name: "Emily Watson", score: 92, badge: "🔥 Very Hot" },
                { name: "Sarah Chen", score: 85, badge: "🔥 Hot" },
                { name: "David Kim", score: 78, badge: "⚡ Warm" }
              ].map((lead, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">{lead.name}</span>
                    <span className="text-xs">{lead.badge}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${lead.score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-orange-600">{lead.score}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm">
              View All Hot Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}