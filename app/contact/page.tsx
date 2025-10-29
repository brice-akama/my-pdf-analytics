"use client";

import React, { JSX } from "react";
import { Mail, MessageSquare, Phone, MapPin, Clock, Send, HelpCircle, Users, Building2 } from "lucide-react";

export default function ContactPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Have questions? Need help? Want to explore enterprise options? We're here to assist you.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border text-center">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Email Support</h3>
            <p className="text-sm text-slate-600 mb-3">
              Get help from our support team
            </p>
            <a href="mailto:support@docmetri.com" className="text-purple-600 font-medium hover:underline">
              support@docmetri.com
            </a>
            <p className="text-xs text-slate-500 mt-2">Response within 24 hours</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Enterprise Sales</h3>
            <p className="text-sm text-slate-600 mb-3">
              Discuss custom solutions for your team
            </p>
            <a href="mailto:sales@docmetri.com" className="text-blue-600 font-medium hover:underline">
              sales@docmetri.com
            </a>
            <p className="text-xs text-slate-500 mt-2">Schedule a demo call</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Help Center</h3>
            <p className="text-sm text-slate-600 mb-3">
              Find answers to common questions
            </p>
            <a href="/help" className="text-green-600 font-medium hover:underline">
              Browse Help Center →
            </a>
            <p className="text-xs text-slate-500 mt-2">Self-service support</p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Get In Touch</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Choose the best way to reach us based on your needs. We're committed to providing excellent support and responding promptly to all inquiries.
            </p>

            <div className="space-y-6">
              {/* Office Location */}
              <div className="bg-slate-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Office Location</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      DocMetri<br />
                      Buea, South-West Region<br />
                      Cameroon
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-slate-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Business Hours</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Monday - Friday: 9:00 AM - 6:00 PM (WAT)<br />
                      Saturday - Sunday: Closed<br />
                      Email support available 24/7
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-slate-50 rounded-xl p-6 border">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <a href="/help" className="flex items-center gap-2 text-slate-700 hover:text-purple-600 transition-colors">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm">Help Center & FAQs</span>
                  </a>
                  <a href="/getting-started" className="flex items-center gap-2 text-slate-700 hover:text-purple-600 transition-colors">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Getting Started Guide</span>
                  </a>
                  <a href="/pricing" className="flex items-center gap-2 text-slate-700 hover:text-purple-600 transition-colors">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">Pricing & Plans</span>
                  </a>
                  <a href="/security" className="flex items-center gap-2 text-slate-700 hover:text-purple-600 transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">Security Information</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How Can We Help?</h2>

            <div className="space-y-6">
              {/* General Support */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">General Inquiries</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Questions about DocMetri, features, or general information? Send us an email.
                    </p>
                    <a 
                      href="mailto:hello@docmetri.com" 
                      className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
                    >
                      Email: hello@docmetri.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Technical Support */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <HelpCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Technical Support</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Need help with your account, having technical issues, or need troubleshooting?
                    </p>
                    <a 
                      href="mailto:support@docmetri.com" 
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                      Email: support@docmetri.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Sales & Enterprise */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <Building2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Sales & Enterprise</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Interested in enterprise features, volume pricing, or scheduling a demo?
                    </p>
                    <a 
                      href="mailto:sales@docmetri.com" 
                      className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
                    >
                      Email: sales@docmetri.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Product Feedback */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border">
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-6 w-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Product Feedback</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Have ideas for new features or suggestions to improve DocMetri?
                    </p>
                    <a 
                      href="mailto:feedback@docmetri.com" 
                      className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors"
                    >
                      Email: feedback@docmetri.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Enterprise CTA */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-2">Enterprise Customers</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Need custom solutions, dedicated support, or volume pricing? Let's talk about how DocMetri can serve your organization.
                </p>
                <a 
                  href="mailto:enterprise@docmetri.com" 
                  className="inline-block bg-white text-purple-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors"
                >
                  Contact Enterprise Sales
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-t pt-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">What's your response time?</h3>
              <p className="text-slate-600 text-sm">
                We aim to respond to all inquiries within 24 hours during business days. Enterprise customers receive priority support with faster response times.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Do you offer phone support?</h3>
              <p className="text-slate-600 text-sm">
                Phone support is available for Enterprise plan customers. All other users can reach us via email, and we're happy to schedule calls for complex issues.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I schedule a demo?</h3>
              <p className="text-slate-600 text-sm">
                Yes! Email sales@docmetri.com to schedule a personalized demo. We'll walk you through DocMetri's features and answer all your questions.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">How do I report a bug?</h3>
              <p className="text-slate-600 text-sm">
                Please email support@docmetri.com with details about the bug, including screenshots if possible. We take bug reports seriously and will investigate promptly.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Do you have a status page?</h3>
              <p className="text-slate-600 text-sm">
                Yes, you can check our system status and uptime at status.docmetri.com. Subscribe to get notifications about any service disruptions.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I request a feature?</h3>
              <p className="text-slate-600 text-sm">
                Absolutely! We love hearing from users. Email us your feature requests at feedback@docmetri.com or use the feedback widget in your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Department Contacts */}
        <div className="mt-16 pt-12 border-t">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Department-Specific Contacts
          </h2>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1 text-sm">General</h4>
              <a href="mailto:hello@docmetri.com" className="text-xs text-purple-600 hover:underline">
                hello@docmetri.com
              </a>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1 text-sm">Support</h4>
              <a href="mailto:support@docmetri.com" className="text-xs text-blue-600 hover:underline">
                support@docmetri.com
              </a>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1 text-sm">Sales</h4>
              <a href="mailto:sales@docmetri.com" className="text-xs text-green-600 hover:underline">
                sales@docmetri.com
              </a>
            </div>

            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1 text-sm">Feedback</h4>
              <a href="mailto:feedback@docmetri.com" className="text-xs text-orange-600 hover:underline">
                feedback@docmetri.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}