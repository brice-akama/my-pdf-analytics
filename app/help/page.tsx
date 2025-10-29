"use client";

import React, { JSX } from "react";
import { HelpCircle, Search, Book, CreditCard, Shield, Settings, BarChart3, Link2, Mail } from "lucide-react";

export default function HelpCenterPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Help Center
              </h1>
            </div>
            <p className="text-lg text-slate-600">
              Find answers to common questions, learn about features, and get the most out of DocMetri.
            </p>
          </div>

          {/* Search Box (Placeholder) */}
          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for help..." 
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-900"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <a href="#getting-started" className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border hover:shadow-lg transition-all">
              <Book className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Getting Started</h3>
              <p className="text-sm text-slate-600">Learn the basics and upload your first document</p>
            </a>
            <a href="#account" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border hover:shadow-lg transition-all">
              <Settings className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Account & Billing</h3>
              <p className="text-sm text-slate-600">Manage your account, plans, and payments</p>
            </a>
            <a href="#security" className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border hover:shadow-lg transition-all">
              <Shield className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Security & Privacy</h3>
              <p className="text-sm text-slate-600">Learn how we protect your documents</p>
            </a>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-12">
            {/* Getting Started */}
            <section id="getting-started">
              <div className="flex items-center gap-3 mb-6">
                <Book className="h-6 w-6 text-purple-600" />
                <h2 className="text-3xl font-bold text-slate-900">Getting Started</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I create an account?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Click the "Sign Up" button in the top right corner of our homepage. Enter your email address, create a secure password, and verify your email. You can start uploading documents immediately after signing up. No credit card required for the free trial.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I upload a document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    After logging in, click the "Upload Document" button in your dashboard. You can drag and drop PDF files directly or click to browse your computer. Files are uploaded securely and encrypted immediately. Maximum file size is 100MB per document.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What file types are supported?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    DocMetri currently supports PDF files only. We recommend using high-quality, optimized PDFs for the best viewing experience. If you have documents in other formats (Word, PowerPoint, etc.), please convert them to PDF before uploading.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What's the maximum file size?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    The maximum file size is 100MB per document. If your file is larger, try compressing it using PDF optimization tools. Most business documents (proposals, contracts, reports) are well under this limit. Contact support if you need to upload larger files.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I share a document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    After uploading, DocMetri generates a unique tracking link for your document. Click the "Share" button to copy the link, then send it via email, messaging apps, or any channel you prefer. You can create multiple links with different settings for the same document.
                  </p>
                </div>
              </div>
            </section>

            {/* Account & Billing */}
            <section id="account" className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h2 className="text-3xl font-bold text-slate-900">Account & Billing</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What payment methods do you accept?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. Payments are processed securely through Stripe. We do not store your credit card information on our servers. Enterprise customers can pay via invoice.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I upgrade or downgrade my plan?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Go to Settings → Billing → Change Plan. Select your desired plan and confirm. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. You'll be prorated if upgrading mid-cycle.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I cancel my subscription?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes, you can cancel anytime. Go to Settings → Billing → Cancel Subscription. You'll retain access to paid features until the end of your billing period. No refunds for partial months, but you won't be charged again. You can reactivate your subscription at any time.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Do you offer refunds?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    We offer a 14-day money-back guarantee. If you're not satisfied within the first 14 days of your paid subscription, contact support@docmetri.com for a full refund. After 14 days, subscriptions are non-refundable, but you can cancel at any time to avoid future charges.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I update my billing information?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Go to Settings → Billing → Payment Method. Click "Update Card" to enter new payment details. Changes take effect immediately. You'll receive a confirmation email when your billing information is updated successfully.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Do you offer discounts for annual plans?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes! Annual plans receive a 20% discount compared to monthly billing. You'll see the discounted price when selecting an annual plan on our pricing page. Annual plans are billed once per year and cannot be refunded after 14 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Document Management */}
            <section id="documents" className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <Link2 className="h-6 w-6 text-green-600" />
                <h2 className="text-3xl font-bold text-slate-900">Document Management</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I delete a document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Go to your dashboard, find the document you want to delete, click the three-dot menu, and select "Delete". Confirm the deletion. This action is permanent and cannot be undone. All associated analytics data will also be deleted.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I edit a document after uploading?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    You cannot edit the PDF content directly in DocMetri. To update a document, upload a new version and replace the old one. Existing tracking links will automatically point to the new version. All previous analytics data is preserved unless you delete the document.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How many documents can I upload?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Document limits depend on your plan. Free plans allow 5 documents, Starter allows 50, Professional allows 500, and Enterprise has unlimited documents. You can see your current usage in Settings → Usage. Upgrade anytime if you need more capacity.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I organize documents into folders?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes, you can create folders and subfolders to organize your documents. Click "New Folder" in your dashboard, name it, and drag documents into it. Use folders to separate clients, projects, or document types. You can move documents between folders anytime.
                  </p>
                </div>
              </div>
            </section>

            {/* Sharing & Security */}
            <section id="security" className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-purple-600" />
                <h2 className="text-3xl font-bold text-slate-900">Sharing & Security</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I password protect a document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Open your document settings, go to Security tab, and enable "Password Protection". Set a strong password and save. Viewers will be required to enter this password before accessing the document. You can change or remove the password anytime.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I set an expiration date?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes. In document settings, go to Security → Expiration and choose an expiration date. After this date, the document becomes inaccessible to all viewers. You can extend the expiration date or remove it entirely if needed. Expired documents can be reactivated anytime.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I prevent downloads?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    In document settings, go to Permissions and disable "Allow Downloads". This enables view-only mode where viewers can read the document online but cannot save or download it. Note that determined users may still capture content via screenshots or other methods.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I revoke access to a document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes, you can revoke access instantly. Go to document settings and click "Revoke All Access" or revoke specific links individually. Once revoked, anyone attempting to access the document will see a message that access has been removed. This cannot be undone, but you can create new links.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Is my data secure?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes. All documents are encrypted in transit (TLS/HTTPS) and at rest (AES-256). We use enterprise-grade security, regular security audits, and comply with GDPR and other data protection regulations. We never access your document content or sell your data. See our <a href="/security" className="text-blue-600 hover:underline font-medium">Security page</a> for details.
                  </p>
                </div>
              </div>
            </section>

            {/* Analytics & Tracking */}
            <section id="analytics" className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-orange-600" />
                <h2 className="text-3xl font-bold text-slate-900">Analytics & Tracking</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How do I see who viewed my document?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Click on your document in the dashboard and go to the Analytics tab. You'll see a list of all viewers with timestamps, locations, and engagement data. If email capture is enabled, you'll see viewer names and email addresses. Otherwise, viewers are shown as anonymous.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What analytics do I get?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    You get comprehensive analytics including: total views, unique visitors, time spent (total and per page), page-level engagement, download counts, link clicks, geographic location, device type, referral sources, and viewing patterns over time. All data is available in real-time.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I export analytics data?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes. Go to Analytics → Export and choose CSV or JSON format. You can export all data or filter by date range, viewer, or other criteria. Exported data includes all tracked metrics and can be imported into Excel, Google Sheets, or your CRM for further analysis.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Do viewers know they're being tracked?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    If you enable email capture, viewers are explicitly asked for their email before viewing, so they know tracking is active. For anonymous tracking (no email capture), viewers are not explicitly notified, similar to how websites use analytics. We follow standard web analytics practices and comply with privacy regulations.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">How long is analytics data retained?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Analytics data is retained indefinitely on paid plans and for 90 days on free plans. You can export your data anytime before the retention period expires. Enterprise customers can request custom retention periods to meet compliance requirements.
                  </p>
                </div>
              </div>
            </section>

            {/* Technical */}
            <section id="technical" className="pt-8 border-t">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-6 w-6 text-indigo-600" />
                <h2 className="text-3xl font-bold text-slate-900">Technical Questions</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Does DocMetri work on mobile devices?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes! DocMetri works on all modern mobile devices (iOS and Android). Both uploading and viewing are optimized for mobile. Viewers can access your documents from any device, and you can monitor analytics from your phone or tablet through our mobile-responsive dashboard.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">What browsers are supported?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    DocMetri supports all modern browsers: Chrome, Firefox, Safari, Edge, and Opera. We recommend using the latest version of your browser for the best experience. Internet Explorer is not supported. Mobile browsers (Safari iOS, Chrome Android) are fully supported.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Do you have an API?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes! DocMetri provides a REST API for creating tracking links, uploading documents, retrieving analytics, and managing documents programmatically. API access is available on Professional and Enterprise plans. Visit our <a href="/api-docs" className="text-blue-600 hover:underline font-medium">API documentation</a> for details.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Do you integrate with other tools?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    Yes. We integrate with popular CRMs (Salesforce, HubSpot, Pipedrive), communication tools (Slack, Teams), and cloud storage (Google Drive, Dropbox). We also support Zapier for connecting to 3,000+ apps. Webhooks allow you to push events to any system in real-time.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-6 border">
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">Can I white-label DocMetri?</h3>
                  <p className="text-slate-700 leading-relaxed">
                    White-labeling (custom branding) is available on Enterprise plans. You can customize the viewer with your logo, colors, and domain name. Viewers will see your branding instead of DocMetri's. Contact our sales team at enterprise@docmetri.com to learn more.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Still Need Help */}
          <div className="mt-16 pt-12 border-t">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
              <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:support@docmetri.com" 
                  className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Email Support
                </a>
                <a 
                  href="/contact" 
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Contact Us
                </a>
              </div>
              <p className="text-sm text-purple-200 mt-4">
                Average response time: Under 24 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}