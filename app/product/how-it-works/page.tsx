import React, { JSX } from "react";
import { Upload, Link2, BarChart3, Bell, Lock, Eye, Download, MousePointerClick, Clock, Users, FileText, Zap, Shield, CheckCircle2 } from "lucide-react";

export default function HowItWorksPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            How DocMetri Works
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Track every interaction with your documents. From upload to engagement analytics, 
            DocMetri gives you complete visibility into how your PDFs perform.
          </p>
        </div>

        {/* 3 Simple Steps */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Get Started in 3 Simple Steps
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Your Document</h3>
              <p className="text-slate-600">
                Drag and drop your PDF, or paste a link to an existing document. 
                DocMetri instantly creates a secure, trackable link.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                <Link2 className="h-10 w-10 text-white" />
              </div>
              <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Share the Link</h3>
              <p className="text-slate-600">
                Send your trackable link via email, Slack, social media, or embed it on your website. 
                Recipients click and view your document securely.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Track Engagement</h3>
              <p className="text-slate-600">
                Watch real-time analytics as people view your document. 
                See who opened it, how long they spent, and which pages they read.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Flow */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            The Complete DocMetri Experience
          </h2>

          <div className="space-y-16">
            {/* Upload & Configure */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Upload & Configure</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Start by uploading your PDF document or importing from Google Drive, Dropbox, or any URL. 
                  DocMetri supports files up to 100MB and maintains the original quality and formatting.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Customize your document settings including password protection, download permissions, 
                  expiration dates, and email capture requirements. Set up exactly how you want viewers 
                  to interact with your content.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <span className="font-medium">Proposal_Q4.pdf</span>
                    <span className="text-slate-500">2.4 MB</span>
                  </div>
                  <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-purple-600"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Password: On
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Expires: 7 days
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Securely */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Shareable Link</span>
                    </div>
                    <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-700 break-all">
                      docmetri.com/d/abc123xyz
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Protected with password</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span>Real-time notifications enabled</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Link2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Share Securely</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Generate a unique, trackable link for your document. Share it via email, messaging apps, 
                  social media, or embed it directly on your website. Each link is secure and can be 
                  customized with access controls.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Enable email capture to know exactly who views your document. Require passwords for 
                  sensitive content. Set expiration dates to automatically revoke access after a certain time. 
                  Get instant notifications when someone opens your document.
                </p>
              </div>
            </div>

            {/* Track Everything */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Track Everything</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  See real-time analytics as viewers interact with your document. Track views, time spent 
                  on each page, scroll depth, downloads, and link clicks. Understand exactly how people 
                  engage with your content.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Identify hot pages that capture attention and cold pages where readers lose interest. 
                  Use this data to optimize your content, improve proposals, and close more deals. 
                  Export analytics data for deeper analysis or CRM integration.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">127</div>
                      <div className="text-xs text-slate-600">Views</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">43</div>
                      <div className="text-xs text-slate-600">Unique</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">5m</div>
                      <div className="text-xs text-slate-600">Avg Time</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-xs text-slate-600 mb-2">Page Engagement</div>
                    <div className="space-y-1">
                      {[95, 78, 82, 45, 23].map((percent, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-8">P{i + 1}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 w-10">{percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Insights */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-slate-900">High Engagement Alert</span>
                    </div>
                    <p className="text-xs text-slate-600">John Smith spent 12 minutes on your proposal</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">Document Downloaded</span>
                    </div>
                    <p className="text-xs text-slate-600">Sarah Johnson downloaded the full PDF</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointerClick className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">CTA Clicked</span>
                    </div>
                    <p className="text-xs text-slate-600">Mike Davis clicked "Schedule Meeting" button</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Get Actionable Insights</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Receive instant notifications when important events happen. Know when a prospect opens 
                  your proposal, when a client downloads your contract, or when someone shares your 
                  document with their team.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Use engagement data to prioritize follow-ups. Reach out to hot leads who spent significant 
                  time on your content. Identify which content resonates most with your audience and 
                  replicate what works. Make data-driven decisions about your sales and marketing materials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Powerful Features Built In
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Eye className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Real-Time Tracking</h4>
              <p className="text-sm text-slate-600">
                See live analytics as viewers interact with your document. Know exactly when and how your content is being consumed.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <BarChart3 className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Page-Level Analytics</h4>
              <p className="text-sm text-slate-600">
                Understand engagement at the page level. See which sections capture attention and where readers drop off.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Lock className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Password Protection</h4>
              <p className="text-sm text-slate-600">
                Secure sensitive documents with password protection. Control exactly who can access your content.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Bell className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Smart Notifications</h4>
              <p className="text-sm text-slate-600">
                Get instant alerts via email or Slack when someone views, downloads, or shares your document.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Clock className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Expiration Controls</h4>
              <p className="text-sm text-slate-600">
                Set expiration dates to automatically revoke access. Perfect for time-sensitive proposals and contracts.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Users className="h-8 w-8 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Email Capture</h4>
              <p className="text-sm text-slate-600">
                Require email addresses before viewing. Build your lead list while tracking document engagement.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Download className="h-8 w-8 text-cyan-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Download Control</h4>
              <p className="text-sm text-slate-600">
                Choose whether viewers can download your PDF. Track every download and know who saved your content.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Zap className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">API & Integrations</h4>
              <p className="text-sm text-slate-600">
                Connect DocMetri to your existing tools via REST API, webhooks, and native integrations.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-purple-300 transition-colors">
              <Shield className="h-8 w-8 text-slate-600 mb-3" />
              <h4 className="font-bold text-slate-900 mb-2">Enterprise Security</h4>
              <p className="text-sm text-slate-600">
                Bank-level encryption, GDPR compliance, and SOC 2 certification. Your data is always protected.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Who Uses DocMetri?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Sales Teams</h4>
              <p className="text-slate-700 text-sm mb-4">
                Track when prospects open proposals, which sections they read, and when to follow up. 
                Close deals faster with data-driven insights.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Know when to follow up with hot leads</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Optimize proposals based on engagement data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Identify decision-makers and stakeholders</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Marketing Teams</h4>
              <p className="text-slate-700 text-sm mb-4">
                Measure content performance, track campaign effectiveness, and understand what resonates 
                with your audience.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Track white paper and case study engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Capture leads with email gates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>A/B test different content versions</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border">
              <h4 className="font-bold text-slate-900 mb-3 text-lg">Freelancers & Agencies</h4>
              <p className="text-slate-700 text-sm mb-4">
                Share portfolios, contracts, and project proposals with confidence. Know exactly when 
                clients review your work.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Protect sensitive client work with passwords</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Get notified when contracts are reviewed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Track portfolio views and engagement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t pt-16">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Track Your First Document?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals using DocMetri to understand document engagement and close more deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup" 
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
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
            <p className="text-sm text-purple-200 mt-4">No credit card required • Free 14-day trial</p>
          </div>
        </div>
      </div>
    </div>
  );
}