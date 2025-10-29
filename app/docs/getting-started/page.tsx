"use client";

import React, { JSX } from "react";
import { Upload, Settings, Link2, BarChart3, CheckCircle2, Video, FileText, Lock, Mail, Eye, Clock, Download } from "lucide-react";

export default function GettingStartedPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Getting Started with DocMetri
            </h1>
            <p className="text-lg text-slate-600">
              Welcome! Track your first document in under 5 minutes. Follow these simple steps to start gaining insights into how people engage with your content.
            </p>
          </div>

          {/* Quick Start Video/Overview */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 mb-12 border">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Quick Start Overview</h2>
                <p className="text-slate-700 mb-4">
                  New to DocMetri? Watch our 2-minute tutorial to see how everything works, or follow the step-by-step guide below.
                </p>
                <a href="#" className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium border hover:bg-purple-50 transition-colors">
                  <Video className="h-4 w-4" />
                  Watch Tutorial Video
                </a>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="space-y-12">
            {/* Step 1: Upload Document */}
            <div className="relative">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Upload className="h-6 w-6 text-purple-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Upload Your Document</h3>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Start by uploading the PDF document you want to track. DocMetri accepts PDF files up to 100MB in size. Your document is encrypted immediately upon upload and stored securely.
                  </p>
                  
                  <div className="bg-slate-50 rounded-lg p-6 border mb-4">
                    <h4 className="font-semibold text-slate-900 mb-3">How to Upload:</h4>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Click the <strong>"Upload Document"</strong> button in your dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Drag and drop your PDF file, or click to browse your computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Wait for the upload to complete (usually 5-30 seconds)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Your document will appear in your library with a unique tracking link</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-blue-900 text-sm">
                      <strong>Supported Formats:</strong> PDF files only. Maximum file size: 100MB. For best results, ensure your PDF is optimized and not password-protected before uploading.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Configure Settings */}
            <div className="relative">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Configure Security Settings</h3>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Customize how viewers can access and interact with your document. Set security controls to protect sensitive information and control distribution.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-slate-900">Password Protection</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Require viewers to enter a password before accessing your document. Great for confidential materials.
                      </p>
                      <p className="text-xs text-slate-500">
                        Enable in Document Settings → Security → Password Protection
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-slate-900">Expiration Date</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Set an automatic expiration date. Documents become inaccessible after the specified time.
                      </p>
                      <p className="text-xs text-slate-500">
                        Enable in Document Settings → Security → Expiration
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-slate-900">Email Capture</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Require viewers to provide their email address before viewing. Identify who's accessing your content.
                      </p>
                      <p className="text-xs text-slate-500">
                        Enable in Document Settings → Access → Email Capture
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex items-center gap-3 mb-2">
                        <Download className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-slate-900">Download Permissions</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        Choose whether viewers can download your PDF or only view it online (view-only mode).
                      </p>
                      <p className="text-xs text-slate-500">
                        Enable in Document Settings → Permissions → Download Control
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mt-4">
                    <p className="text-amber-900 text-sm">
                      <strong>Tip:</strong> For maximum security on confidential documents, enable password protection, set an expiration date, enable email capture, and disable downloads.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Share Your Link */}
            <div className="relative">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Link2 className="h-6 w-6 text-green-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Share Your Tracking Link</h3>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Once your document is uploaded and configured, DocMetri generates a unique, secure tracking link. Share this link with your intended recipients through any channel.
                  </p>

                  <div className="bg-slate-50 rounded-lg p-6 border mb-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Ways to Share:</h4>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Email:</strong> Copy the link and paste it into your email message</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Messaging Apps:</strong> Share via Slack, WhatsApp, Teams, or any messaging platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Social Media:</strong> Post on LinkedIn, Twitter, or other social platforms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Website:</strong> Embed the link on your website or landing pages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>QR Code:</strong> Generate a QR code for offline materials (available in settings)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                    <p className="text-purple-900 text-sm">
                      <strong>Pro Tip:</strong> Create unique links for different recipients or campaigns so you can track engagement separately. For example, create one link for email campaigns and another for social media to see which channel performs better.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Track Engagement */}
            <div className="relative">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                    <h3 className="text-2xl font-bold text-slate-900">View Real-Time Analytics</h3>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Watch as viewers interact with your document. DocMetri tracks every view, click, and engagement metric in real-time, giving you complete visibility into how your content performs.
                  </p>

                  <div className="bg-slate-50 rounded-lg p-6 border mb-4">
                    <h4 className="font-semibold text-slate-900 mb-3">What You Can Track:</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-slate-900 text-sm">Views & Visitors</span>
                        </div>
                        <p className="text-xs text-slate-600">Total views, unique visitors, and return visits</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-slate-900 text-sm">Time Spent</span>
                        </div>
                        <p className="text-xs text-slate-600">Average time, session duration, and engagement time</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-slate-900 text-sm">Page-Level Data</span>
                        </div>
                        <p className="text-xs text-slate-600">Time on each page, hot pages, and drop-off points</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Download className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-slate-900 text-sm">Actions Taken</span>
                        </div>
                        <p className="text-xs text-slate-600">Downloads, link clicks, and shares</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border mb-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Accessing Your Analytics:</h4>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Go to your <strong>Dashboard</strong> to see all tracked documents</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Click on any document to view detailed analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Use the <strong>Analytics</strong> tab for comprehensive insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Export data as CSV or JSON for further analysis</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-green-900 text-sm">
                      <strong>Real-Time Notifications:</strong> Enable email or Slack notifications to get instant alerts when someone views your document. Never miss a hot lead or important engagement event.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5: Take Action */}
            <div className="relative">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Use Insights to Take Action</h3>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">
                    Now that you have data, use it to make better decisions. Follow up with engaged viewers, optimize underperforming content, and close more deals with data-driven insights.
                  </p>

                  <div className="bg-slate-50 rounded-lg p-6 border mb-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Smart Actions to Take:</h4>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Follow up with hot leads:</strong>
                          <p className="text-sm text-slate-600">If someone spent 10+ minutes on your proposal, reach out immediately while you're top of mind.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Optimize weak content:</strong>
                          <p className="text-sm text-slate-600">If viewers consistently skip certain pages, those sections may need improvement or removal.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Identify decision-makers:</strong>
                          <p className="text-sm text-slate-600">Track who forwards your document internally to identify key stakeholders in the buying process.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Measure campaign effectiveness:</strong>
                          <p className="text-sm text-slate-600">Compare engagement across different distribution channels to optimize your marketing spend.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">What's Next?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <a href="/help" className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border hover:shadow-lg transition-all">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Browse Help Center</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Find answers to common questions, detailed guides, and troubleshooting tips.
                </p>
                <span className="text-purple-600 font-medium text-sm">View Help Center →</span>
              </a>

              <a href="/features" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border hover:shadow-lg transition-all">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Explore Advanced Features</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Learn about advanced security controls, integrations, API access, and more.
                </p>
                <span className="text-green-600 font-medium text-sm">View Features →</span>
              </a>

              <a href="mailto:support@docmetri.com" className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border hover:shadow-lg transition-all">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Contact Support</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Need help? Our support team is here to assist you with any questions.
                </p>
                <span className="text-orange-600 font-medium text-sm">Email Support →</span>
              </a>

              <a href="/api-docs" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border hover:shadow-lg transition-all">
                <h3 className="font-bold text-slate-900 mb-2 text-lg">API Documentation</h3>
                <p className="text-slate-600 text-sm mb-3">
                  Integrate DocMetri with your existing tools and workflows using our API.
                </p>
                <span className="text-blue-600 font-medium text-sm">View API Docs →</span>
              </a>
            </div>
          </div>

          {/* Support CTA */}
          <div className="mt-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-3">Need Help Getting Started?</h3>
            <p className="text-purple-100 mb-6">
              Our team is here to help you succeed. Contact us anytime with questions or feedback.
            </p>
            <a 
              href="mailto:support@docmetri.com" 
              className="inline-block bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Contact Support Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}