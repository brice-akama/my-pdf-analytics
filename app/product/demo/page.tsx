"use client";

import React, { JSX } from "react";
import { Play, Calendar, Video, CheckCircle2, Clock, Users, Zap, BarChart3, Shield, ArrowRight, Monitor } from "lucide-react";

export default function SeeItInActionPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Play className="h-4 w-4" />
            Product Demo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            See DocMetri In Action
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Watch how DocMetri transforms your documents into intelligent assets with powerful analytics and security controls.
          </p>
        </div>

        {/* Video Demo Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-2">
            <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <button 
                    className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-all cursor-pointer"
                    aria-label="Play demo video"
                  >
                    <Play className="h-10 w-10 text-white ml-1" />
                  </button>
                  <p className="text-lg font-semibold mb-2">Watch Product Demo</p>
                  <p className="text-sm text-purple-200">5 minutes • Full walkthrough</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-slate-600 mt-6">
            See how easy it is to upload, share, and track your documents with DocMetri
          </p>
        </div>

        {/* What You'll See */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What You'll See in the Demo
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Upload & Configure</h3>
              <p className="text-sm text-slate-600">
                Watch how to upload your first document and set security controls like passwords, expiration dates, and permissions in seconds.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Security Features</h3>
              <p className="text-sm text-slate-600">
                See how password protection, email capture, view-only mode, and other security controls keep your documents safe.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-slate-600">
                Explore the analytics dashboard showing views, engagement time, page-level data, and visitor intelligence.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Smart Notifications</h3>
              <p className="text-sm text-slate-600">
                Learn how to set up instant alerts when someone views your document, so you can follow up at the perfect moment.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
              <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Team Collaboration</h3>
              <p className="text-sm text-slate-600">
                Discover workspace features, team permissions, and how to organize documents for multiple users and projects.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <Monitor className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Integrations & API</h3>
              <p className="text-sm text-slate-600">
                See how DocMetri integrates with your existing tools like CRM, Slack, and other platforms via API and webhooks.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Live Demo Section */}
        <div className="mb-20 border-t pt-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Calendar className="h-4 w-4" />
                Personalized Demo
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Want a Personalized Demo?
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Schedule a one-on-one demo with our team. We'll walk you through DocMetri's features, answer your specific questions, and show you how it can solve your unique challenges.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Tailored to Your Use Case</p>
                    <p className="text-sm text-slate-600">We'll focus on features relevant to your industry and needs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Ask Anything</p>
                    <p className="text-sm text-slate-600">Get answers to your specific questions and concerns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">See Advanced Features</p>
                    <p className="text-sm text-slate-600">Explore enterprise features, integrations, and customization options</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">No Pressure</p>
                    <p className="text-sm text-slate-600">Just a friendly conversation about how DocMetri can help you</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                <Clock className="h-4 w-4" />
                <span>30-45 minutes • Screen sharing • Q&A included</span>
              </div>

              <a 
                href="mailto:demo@docmetri.com?subject=Request%20a%20Demo&body=Hi%2C%20I'd%20like%20to%20schedule%20a%20demo%20of%20DocMetri.%0A%0AName:%0ACompany:%0AUse%20Case:%0APreferred%20Date/Time:%0A"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                <Calendar className="h-5 w-5" />
                Schedule Your Demo
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">What to Expect</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 font-bold text-purple-600">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Choose Your Time</p>
                    <p className="text-sm text-slate-600">Pick a time that works for you. We'll send a calendar invite with video call details.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Join the Call</p>
                    <p className="text-sm text-slate-600">We'll meet via Zoom or Google Meet. No software installation needed.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 font-bold text-green-600">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">See DocMetri Live</p>
                    <p className="text-sm text-slate-600">We'll share our screen and walk you through real examples tailored to your needs.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 font-bold text-orange-600">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Get Your Questions Answered</p>
                    <p className="text-sm text-slate-600">Ask anything about features, pricing, security, or implementation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 font-bold text-purple-600">
                    5
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Next Steps</p>
                    <p className="text-sm text-slate-600">We'll discuss pricing, provide a trial account, and help you get started.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-purple-200">
                <p className="text-sm text-slate-600 text-center">
                  <strong>Still have questions?</strong> Email us at{" "}
                  <a href="mailto:demo@docmetri.com" className="text-purple-600 hover:underline font-medium">
                    demo@docmetri.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Who Should Schedule a Demo */}
        <div className="mb-20 border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Who Should Schedule a Demo?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center hover:border-purple-300 transition-colors">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Sales & Marketing Teams</h3>
              <p className="text-sm text-slate-600">
                Learn how to track proposals, optimize content, and close deals faster with engagement insights.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center hover:border-purple-300 transition-colors">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Enterprise Organizations</h3>
              <p className="text-sm text-slate-600">
                Explore custom solutions, SSO integration, advanced security, and dedicated support options.
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 text-center hover:border-purple-300 transition-colors">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Agencies & Consultants</h3>
              <p className="text-sm text-slate-600">
                See how to manage multiple clients, white-label solutions, and streamline your workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Demo Option */}
        <div className="mb-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-12 border-2 border-slate-200 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Prefer to Try It Yourself?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Start your free 14-day trial and explore DocMetri at your own pace. No credit card required. Full access to all features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/signup" 
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </a>
              <a 
                href="/pricing" 
                className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-900 px-8 py-3 rounded-lg font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            What People Say After Seeing DocMetri
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah Kim</p>
                  <p className="text-sm text-slate-600">Sales Director</p>
                </div>
              </div>
              <p className="text-slate-700 text-sm italic">
                "The demo showed me exactly how to stop chasing cold leads. Now I only follow up with prospects who've actually engaged with my proposals. Game changer!"
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                  MJ
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Michael Johnson</p>
                  <p className="text-sm text-slate-600">Startup Founder</p>
                </div>
              </div>
              <p className="text-slate-700 text-sm italic">
                "Seeing the analytics in real-time during the demo convinced me immediately. We closed our funding round 6 weeks faster using DocMetri to track investor engagement."
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                  EP
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Emily Park</p>
                  <p className="text-sm text-slate-600">Marketing Manager</p>
                </div>
              </div>
              <p className="text-slate-700 text-sm italic">
                "The security features impressed me during the demo. We can finally share confidential materials with clients knowing exactly who views them and for how long."
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to See DocMetri in Action?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Watch the video demo above or schedule a personalized walkthrough with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:demo@docmetri.com?subject=Request%20a%20Demo" 
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Schedule Live Demo
            </a>
            <a 
              href="/signup" 
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="text-sm text-purple-200 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
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