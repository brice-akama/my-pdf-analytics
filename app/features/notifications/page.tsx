"use client"
import React, { JSX, useState } from "react";
import { Bell, Zap, Mail, MessageSquare, Webhook, Smartphone, Clock, Target, Filter, Settings, CheckCircle2, TrendingUp, Eye, Download, Share2, MousePointerClick, Users, AlertCircle, Sparkles, Calendar, BarChart3, Globe, Radio, ArrowRight } from "lucide-react";

export default function RealTimeNotificationsPage(): JSX.Element {
  const [activeDemo, setActiveDemo] = useState<number | null>(null);

  // Mock notification examples
  const notificationExamples = [
    {
      id: 1,
      type: "High Engagement",
      icon: Zap,
      color: "orange",
      title: "Sarah Chen is highly engaged",
      description: "Spent 8+ minutes on your proposal and viewed pricing 3 times",
      time: "Just now",
      priority: "high",
      actions: ["Follow up now", "View activity"]
    },
    {
      id: 2,
      type: "Document Opened",
      icon: Eye,
      color: "blue",
      title: "New viewer on Q4 Sales Proposal",
      description: "Michael Rodriguez from Enterprise Solutions just opened your document",
      time: "2 minutes ago",
      priority: "medium",
      actions: ["View details"]
    },
    {
      id: 3,
      type: "Share Detected",
      icon: Share2,
      color: "purple",
      title: "Your document was shared",
      description: "Emily Watson forwarded your whitepaper to 3 colleagues",
      time: "15 minutes ago",
      priority: "medium",
      actions: ["See who received it"]
    },
    {
      id: 4,
      type: "CTA Clicked",
      icon: MousePointerClick,
      color: "green",
      title: "Call-to-action clicked",
      description: "David Lee clicked 'Schedule Demo' button in your proposal",
      time: "1 hour ago",
      priority: "high",
      actions: ["Contact lead", "View engagement"]
    }
  ];

  const channels = [
    {
      name: "Email",
      icon: Mail,
      color: "blue",
      description: "Instant email alerts to your inbox",
      features: ["Customizable templates", "Batch digests available", "Mobile-friendly"],
      setup: "2 minutes"
    },
    {
      name: "Slack",
      icon: MessageSquare,
      color: "purple",
      description: "Send notifications to Slack channels or DMs",
      features: ["Channel integration", "Rich formatting", "Thread replies"],
      setup: "1 minute"
    },
    {
      name: "Webhook",
      icon: Webhook,
      color: "green",
      description: "Connect to any system via REST API",
      features: ["Custom endpoints", "JSON payloads", "Retry logic"],
      setup: "5 minutes"
    },
    {
      name: "SMS",
      icon: Smartphone,
      color: "orange",
      description: "Critical alerts sent to your mobile",
      features: ["High-priority only", "Delivery reports", "Global coverage"],
      setup: "3 minutes"
    }
  ];

  const triggers = [
    { name: "Document Opened", icon: Eye, enabled: true, color: "blue" },
    { name: "High Engagement (5+ min)", icon: Zap, enabled: true, color: "orange" },
    { name: "Page Milestone (50%, 100%)", icon: Target, enabled: true, color: "green" },
    { name: "Link Clicked", icon: MousePointerClick, enabled: true, color: "purple" },
    { name: "Document Downloaded", icon: Download, enabled: false, color: "indigo" },
    { name: "Document Shared", icon: Share2, enabled: true, color: "pink" },
    { name: "Return Visitor", icon: Users, enabled: false, color: "cyan" },
    { name: "Engagement Score > 80", icon: TrendingUp, enabled: true, color: "yellow" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Bell className="h-4 w-4" />
            Real-Time Alerts
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Never Miss a Hot Lead Again
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get instant notifications when prospects engage with your documents. Know exactly when 
            to follow up, what they're interested in, and who's ready to buy—in real time.
          </p>
        </div>

        {/* Main Value Prop */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 md:p-12 border-2 border-orange-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Strike While the Iron Is Hot
                </h2>
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                  Research shows that responding within 5 minutes of a prospect's action increases 
                  conversion rates by 400%. Our real-time notifications ensure you're always first 
                  to respond when engagement happens.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Instant Delivery</div>
                      <div className="text-sm text-slate-600">Alerts arrive in under 1 second</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Smart Filtering</div>
                      <div className="text-sm text-slate-600">Only get alerts that matter</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Multi-Channel</div>
                      <div className="text-sm text-slate-600">Email, Slack, SMS, or webhook</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-orange-300 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-900">Live Notifications</span>
                </div>
                <div className="space-y-3">
                  {notificationExamples.slice(0, 3).map((notif) => (
                    <div 
                      key={notif.id}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-orange-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg bg-${notif.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <notif.icon className={`h-4 w-4 text-${notif.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm mb-1">{notif.title}</div>
                          <div className="text-xs text-slate-600 mb-2">{notif.description}</div>
                          <div className="text-xs text-slate-500">{notif.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Receive Alerts Where You Work
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Choose from multiple notification channels to stay informed wherever you are. 
            Mix and match channels based on alert priority and your workflow.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {channels.map((channel, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all"
              >
                <div className={`h-12 w-12 rounded-xl bg-${channel.color}-100 flex items-center justify-center mb-4`}>
                  <channel.icon className={`h-6 w-6 text-${channel.color}-600`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{channel.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{channel.description}</p>
                <ul className="space-y-2 mb-4">
                  {channel.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500">Setup time: <span className="font-semibold text-slate-700">{channel.setup}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Smart Notification Triggers
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Configure exactly when you want to be notified. Set up intelligent rules that 
            alert you to the most important engagement signals.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Trigger List */}
            <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Available Triggers</h3>
                <span className="text-sm text-slate-600">{triggers.filter(t => t.enabled).length} active</span>
              </div>
              <div className="space-y-3">
                {triggers.map((trigger, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      trigger.enabled 
                        ? 'bg-white border-green-200' 
                        : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg bg-${trigger.color}-100 flex items-center justify-center`}>
                        <trigger.icon className={`h-4 w-4 text-${trigger.color}-600`} />
                      </div>
                      <span className="font-medium text-slate-900 text-sm">{trigger.name}</span>
                    </div>
                    <div className={`h-5 w-9 rounded-full transition-colors ${
                      trigger.enabled ? 'bg-green-500' : 'bg-slate-300'
                    } relative`}>
                      <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-transform ${
                        trigger.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Rules */}
            <div>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border-2 border-purple-200 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-lg">Advanced Rules</h3>
                </div>
                <p className="text-slate-700 mb-6">
                  Create sophisticated notification rules with conditions, filters, and priority levels. 
                  Combine multiple triggers for precise alerting.
                </p>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="font-semibold text-slate-900 text-sm mb-2">High-Priority Lead Alert</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>IF engagement score greater than 80</div>
                      <div>AND time spent greater than 5 minutes</div>
                      <div>AND viewed pricing page</div>
                      <div className="pt-2 border-t border-slate-200 text-purple-600 font-medium">
                        Send SMS + Slack notification
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="font-semibold text-slate-900 text-sm mb-2">Document Milestone</div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>IF document completion = 100%</div>
                      <div>OR viewed final page</div>
                      <div className="pt-2 border-t border-slate-200 text-purple-600 font-medium">
                        Send email notification
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900">Smart Filtering</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Filter by document type, visitor location, or device</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Set quiet hours to avoid off-hours alerts</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Batch low-priority notifications into digests</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Deduplicate repeated actions from same visitor</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Real Notification Examples */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            See Notifications in Action
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Here's what real-time notifications look like across different channels and scenarios.
          </p>

          <div className="space-y-6">
            {notificationExamples.map((notification) => (
              <div 
                key={notification.id}
                className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-purple-300 transition-all"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => setActiveDemo(activeDemo === notification.id ? null : notification.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-xl bg-${notification.color}-100 flex items-center justify-center flex-shrink-0`}>
                        <notification.icon className={`h-6 w-6 text-${notification.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            notification.priority === 'high' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {notification.priority === 'high' ? '🔥 High Priority' : '📊 Medium Priority'}
                          </span>
                          <span className="text-xs text-slate-500">{notification.type}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{notification.title}</h4>
                        <p className="text-slate-600 mb-3">{notification.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-4 w-4" />
                            {notification.time}
                          </span>
                          <span className="text-purple-600 font-medium">
                            Click to see channel examples
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {activeDemo === notification.id && (
                  <div className="bg-slate-50 border-t border-slate-200 p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Email Preview */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-slate-900 text-sm">Email Alert</span>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-4 text-xs">
                          <div className="border-b border-slate-200 pb-2 mb-2">
                            <div className="font-semibold text-slate-900">DocMetri Alert: {notification.title}</div>
                            <div className="text-slate-500">notifications@docmetri.com</div>
                          </div>
                          <div className="text-slate-700 space-y-2">
                            <p>{notification.description}</p>
                            <div className="flex gap-2 pt-2">
                              {notification.actions.map((action, idx) => (
                                <button 
                                  key={idx}
                                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium"
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Slack Preview */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-slate-900 text-sm">Slack Message</span>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                          <div className="flex items-start gap-2">
                            <div className="h-8 w-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              DM
                            </div>
                            <div className="flex-1 text-xs">
                              <div className="font-semibold text-slate-900 mb-1">DocMetri Bot <span className="text-slate-500 font-normal">APP {notification.time}</span></div>
                              <div className="bg-slate-50 border-l-4 border-purple-600 p-3 rounded">
                                <div className="font-semibold text-slate-900 mb-1">{notification.title}</div>
                                <div className="text-slate-700 mb-2">{notification.description}</div>
                                <div className="flex gap-2">
                                  {notification.actions.map((action, idx) => (
                                    <button 
                                      key={idx}
                                      className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-100"
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Notification Strategies That Win Deals
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Sales Teams</h4>
              <p className="text-sm text-slate-700 mb-4">
                Get alerted when prospects view proposals. Set up high-priority SMS alerts for 
                hot leads spending 5+ minutes on pricing pages. Follow up within minutes, not hours.
              </p>
              <div className="text-xs text-blue-700 font-semibold">
                Result: 3x faster response time
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Marketing Teams</h4>
              <p className="text-sm text-slate-700 mb-4">
                Monitor whitepaper downloads and engagement. Send Slack alerts to your team when 
                content hits milestones. Track which campaigns drive the most engaged readers.
              </p>
              <div className="text-xs text-purple-700 font-semibold">
                Result: 40% better lead scoring
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-bold text-slate-900 mb-3">Account Executives</h4>
              <p className="text-sm text-slate-700 mb-4">
                Know when key stakeholders review contracts. Get webhook alerts to your CRM when 
                decision-makers forward documents internally. Time your outreach perfectly.
              </p>
              <div className="text-xs text-green-700 font-semibold">
                Result: 50% higher close rates
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Advanced Notification Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Settings className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Notification Preferences</h4>
              <p className="text-sm text-slate-600">
                Customize notification frequency, channels, and priority levels for each document 
                or document type. Set team-wide defaults.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Calendar className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Quiet Hours</h4>
              <p className="text-sm text-slate-600">
                Define when you don't want to be disturbed. Queue notifications during quiet hours 
                and deliver them as a summary when you're back.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Users className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Team Notifications</h4>
              <p className="text-sm text-slate-600">
                Route notifications to specific team members based on document ownership, 
                territory, or engagement level. Never miss a handoff.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <BarChart3 className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Digest Mode</h4>
              <p className="text-sm text-slate-600">
                Prefer fewer interruptions? Batch low-priority notifications into daily or 
                weekly summaries with key metrics and trends.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <AlertCircle className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Smart Deduplication</h4>
              <p className="text-sm text-slate-600">
                Avoid alert fatigue. Automatically group related actions from the same visitor 
                to reduce notification spam while keeping you informed.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <Webhook className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Custom Integrations</h4>
              <p className="text-sm text-slate-600">
                Connect to any tool via webhooks. Send notifications to your CRM, help desk, 
                analytics platform, or custom internal systems.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Showcase */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Popular Integrations
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            DocMetri connects seamlessly with the tools your team already uses. 
            Set up integrations in minutes and start receiving alerts where you work.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Slack", logo: "💬", color: "purple" },
              { name: "Microsoft Teams", logo: "👥", color: "blue" },
              { name: "Salesforce", logo: "☁️", color: "cyan" },
              { name: "HubSpot", logo: "🧡", color: "orange" },
              { name: "Zapier", logo: "⚡", color: "yellow" },
              { name: "Webhooks", logo: "🔗", color: "green" },
              { name: "Discord", logo: "🎮", color: "indigo" },
              { name: "Telegram", logo: "✈️", color: "blue" },
              { name: "Google Chat", logo: "💬", color: "green" },
              { name: "Twilio", logo: "📱", color: "red" },
              { name: "PagerDuty", logo: "🚨", color: "green" },
              { name: "Custom API", logo: "⚙️", color: "slate" }
            ].map((integration, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-lg border-2 border-slate-200 p-4 hover:border-purple-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-2">{integration.logo}</div>
                <div className="text-xs font-semibold text-slate-900">{integration.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Why Real-Time Notifications Matter
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-4 font-bold text-slate-900">Scenario</th>
                  <th className="text-center p-4 font-bold text-slate-900">Without Notifications</th>
                  <th className="text-center p-4 font-bold text-orange-600">With DocMetri Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700 font-medium">Prospect opens proposal</td>
                  <td className="p-4 text-center text-slate-600">
                    <div className="text-sm">You find out days later</div>
                    <div className="text-xs text-red-600 mt-1">❌ Missed opportunity</div>
                  </td>
                  <td className="p-4 text-center text-slate-900">
                    <div className="text-sm font-semibold">Instant alert in under 1 second</div>
                    <div className="text-xs text-green-600 mt-1">✓ Follow up immediately</div>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700 font-medium">Hot lead spends 10 minutes</td>
                  <td className="p-4 text-center text-slate-600">
                    <div className="text-sm">No way to know</div>
                    <div className="text-xs text-red-600 mt-1">❌ Lead goes cold</div>
                  </td>
                  <td className="p-4 text-center text-slate-900">
                    <div className="text-sm font-semibold">Priority SMS alert</div>
                    <div className="text-xs text-green-600 mt-1">✓ Strike while hot</div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700 font-medium">Document shared internally</td>
                  <td className="p-4 text-center text-slate-600">
                    <div className="text-sm">Complete blind spot</div>
                    <div className="text-xs text-red-600 mt-1">❌ Unknown stakeholders</div>
                  </td>
                  <td className="p-4 text-center text-slate-900">
                    <div className="text-sm font-semibold">Track all new viewers</div>
                    <div className="text-xs text-green-600 mt-1">✓ Map buying committee</div>
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-4 text-slate-700 font-medium">CTA button clicked</td>
                  <td className="p-4 text-center text-slate-600">
                    <div className="text-sm">Manual check required</div>
                    <div className="text-xs text-red-600 mt-1">❌ Delayed response</div>
                  </td>
                  <td className="p-4 text-center text-slate-900">
                    <div className="text-sm font-semibold">Real-time Slack notification</div>
                    <div className="text-xs text-green-600 mt-1">✓ Instant team coordination</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What Our Users Say
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">⭐</span>
                ))}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "The instant Slack notifications changed everything. We now respond to hot leads 
                within minutes instead of hours. Our close rate has nearly doubled."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  JM
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Jennifer Martinez</div>
                  <div className="text-sm text-slate-600">Sales Director, TechStart</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">⭐</span>
                ))}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "Smart filtering is a game-changer. I only get alerts for high-value prospects, 
                not every single view. It's like having a personal assistant triaging my leads."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  RC
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Robert Chen</div>
                  <div className="text-sm text-slate-600">VP Sales, Enterprise Co</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500">⭐</span>
                ))}
              </div>
              <p className="text-slate-700 mb-4 italic">
                "The webhook integration with our CRM means every notification automatically 
                updates lead scores. Our sales team knows exactly who to call and when."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                  AP
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Amanda Park</div>
                  <div className="text-sm text-slate-600">Head of Revenue Ops, GrowthLabs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-20 border-t pt-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
              Notification Best Practices
            </h2>
            <p className="text-slate-600 text-center mb-12">
              Get the most out of your notifications with these proven strategies from top-performing teams.
            </p>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Prioritize by Intent</h4>
                    <p className="text-sm text-slate-700">
                      Not all views are equal. Set high-priority alerts for actions that signal buying 
                      intent: pricing page views, multiple return visits, and full document reads. 
                      Use email digests for general viewing activity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Match Channel to Urgency</h4>
                    <p className="text-sm text-slate-700">
                      Use SMS for hot leads that need immediate follow-up. Send Slack notifications 
                      for team coordination. Email works well for daily summaries and less time-sensitive 
                      updates. Choose the right channel for each alert type.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Set Smart Thresholds</h4>
                    <p className="text-sm text-slate-700">
                      Configure engagement score thresholds and time thresholds. This ensures you only get 
                      notified about genuinely engaged prospects, not casual browsers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-orange-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Use Quiet Hours Wisely</h4>
                    <p className="text-sm text-slate-700">
                      Enable quiet hours for work-life balance, but consider your audience's timezone. 
                      If you're selling globally, you might want 24/7 alerts for high-priority leads. 
                      Queue low-priority notifications for your working hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-2">How fast are the notifications?</h4>
              <p className="text-sm text-slate-600">
                Notifications are delivered in under 1 second from the moment an action occurs. 
                Our real-time infrastructure ensures you're always first to know about engagement.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-2">Can I customize notification rules per document?</h4>
              <p className="text-sm text-slate-600">
                Absolutely! Set up different rules for proposals, contracts, marketing materials, 
                and more. You can also create templates for common document types and apply them 
                with one click.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-2">Will I get overwhelmed with notifications?</h4>
              <p className="text-sm text-slate-600">
                Not with our smart filtering! Set thresholds, use quiet hours, enable deduplication, 
                and choose digest mode for low-priority alerts. You stay informed without the noise.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-2">Can multiple team members receive the same alerts?</h4>
              <p className="text-sm text-slate-600">
                Yes! Route notifications to individuals, teams, or entire channels based on document 
                ownership, territory, or custom rules. Perfect for collaborative sales processes.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <h4 className="font-bold text-slate-900 mb-2">What if my notification service is down?</h4>
              <p className="text-sm text-slate-600">
                We have automatic failover. If Slack is down, we'll send email. If email fails, 
                we'll try webhooks. All notifications are logged in your dashboard regardless, 
                so you never lose information.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-12 text-white">
            <Bell className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Getting Notified in Real-Time
            </h2>
            <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
              Never miss another hot lead or engagement opportunity. Set up your first notification 
              in under 60 seconds and start responding faster than your competition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg"
                aria-label="Start your free trial"
              >
                Start Free Trial
              </button>
              <button 
                className="bg-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-800 transition-colors border-2 border-white"
                aria-label="See notification demo"
              >
                See Live Demo
              </button>
            </div>
            <p className="text-sm text-orange-200 mt-6">
              No credit card required • All notification channels included • 14-day free trial
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t text-center text-sm text-slate-600">
          <p>© 2025 DocMetri. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-orange-600 transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}