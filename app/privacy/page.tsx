"use client"

import { Shield } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Privacy Policy
              </h1>
            </div>
            <p className="text-lg text-slate-600">
              Last updated: October 28, 2024
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="text-purple-900 m-0">
                At DocMetrics, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this policy carefully.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              1. Introduction
            </h2>
            <p>
              DocMetrics Inc. ("DocMetrics," "we," "us," or "our") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data and tell you about your privacy rights. This policy applies to information we collect through our website and application; in email, text, and other electronic messages; when you interact with our advertising and applications on third-party platforms; and through mobile and desktop applications.
            </p>
            <p className="bg-slate-50 border-l-4 border-slate-400 p-4 rounded text-slate-900">
              <strong>Important:</strong> By using DocMetrics, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our service.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              2. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us, including account information (name, email address, password, company name, job title); profile information (profile photo, bio, contact preferences); payment information (credit card details, billing address, processed securely by third-party payment processors); documents (PDF files and related metadata you upload); communications (messages, feedback, and support requests); and preferences (settings, notification preferences, language choices).
            </p>
            <p>
              When you use our service, we automatically collect usage data (pages viewed, features used, time spent, click patterns); device information (IP address, browser type, operating system, device identifiers); location data (approximate location based on IP address); cookies and similar technologies (session data, preferences, authentication tokens); and analytics data (document views, downloads, engagement metrics).
            </p>
            <p className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-blue-900">
              <strong>Document Privacy:</strong> The documents you upload are encrypted and private. We do not access, read, or use your document content for any purpose other than providing the service. Your documents are yours.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to provide our service (create and manage your account, process and store your documents, enable document sharing and collaboration, generate analytics and insights, provide customer support); improve our service (analyze usage patterns and trends, develop new features, fix bugs and technical issues, conduct research and testing, optimize performance); communicate with you (send service announcements and updates, respond to your inquiries, send marketing communications with your consent, notify you about document activity, request feedback); and for security and fraud prevention (detect and prevent fraud, monitor for suspicious activity, enforce our Terms of Service, protect our users and service, comply with legal obligations).
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              4. How We Share Your Information
            </h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
              <p className="text-green-900 font-semibold m-0">
                We do NOT sell your personal information to third parties. Period.
              </p>
            </div>
            <p>
              We may share your information with your consent (when you explicitly share documents with other users or third parties, we share the information necessary to facilitate that sharing); with service providers (we share information with trusted third-party service providers who help us operate our business, including cloud hosting providers, payment processors, email service providers, analytics providers, customer support tools, and security and fraud prevention services - these providers are contractually obligated to protect your data and use it only for the services they provide to us); in business transfers (if we are involved in a merger, acquisition, or sale of assets, your information may be transferred - we will notify you before your information becomes subject to a different privacy policy); for legal requirements (we may disclose your information if required to do so by law or in response to subpoenas, court orders, or legal process; government requests; requests from law enforcement; to protect our rights, property, or safety; or to prevent fraud or illegal activity); and as aggregated data (we may share aggregated or de-identified information that cannot reasonably be used to identify you, such as statistical data about usage patterns).
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              5. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your information, including TLS/SSL encryption in transit, AES-256 encryption at rest, end-to-end document encryption, multi-factor authentication, role-based access control, regular access audits, secure cloud hosting on AWS/GCP, regular security updates, automated backups, 24/7 security monitoring, intrusion detection systems, and regular security audits.
            </p>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900">
              <strong>Important:</strong> While we implement robust security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information. In the event of a data breach that affects your personal information, we will notify you within 72 hours via email and provide details about the breach, the data affected, and steps we're taking to address it.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              6. Your Privacy Rights
            </h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including the right to access (you can request a copy of the personal information we hold about you - we will provide this in a structured, commonly used format within 30 days); the right to rectification (you can request correction of inaccurate or incomplete personal information - you can also update most information directly in your account settings); the right to deletion or "right to be forgotten" (you can request deletion of your personal information - we will delete your data unless we have a legal obligation to retain it - note that deletion is permanent and cannot be undone); the right to data portability (you can request your data in a machine-readable format to transfer to another service - we provide export functionality in your account settings); the right to object (you can object to processing of your personal information for direct marketing purposes or based on legitimate interests - you can opt-out of marketing emails at any time); and the right to restrict processing (you can request restriction of processing in certain circumstances, such as while we verify the accuracy of your data or assess your objection to processing).
            </p>
            <p className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded text-purple-900">
              To exercise any of these rights, you can email us at <a href="mailto:privacy@docmetrics.com" className="underline font-medium">privacy@docmetrics.com</a>, use the data controls in your account settings, or submit a request through our privacy portal. We will respond to your request within 30 days. We may need to verify your identity before processing your request.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              7. Cookies & Tracking
            </h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with our marketing efforts. We use essential cookies (necessary for the website to function - enable core functionality like security, authentication, and accessibility - cannot be disabled); functional cookies (remember your preferences and settings such as language, timezone, and display preferences - enhance user experience); analytics cookies (help us understand how you use our service including pages visited, features used, and time spent - used to improve our service - we use Google Analytics); and marketing cookies (track your activity across websites to deliver targeted advertising - used for remarketing campaigns).
            </p>
            <p>
              You can control cookies through cookie settings (use our cookie preference center in your account settings); browser settings (most browsers allow you to refuse or delete cookies); and opt-out tools (use tools like Google Analytics Opt-out Browser Add-on). Disabling certain cookies may impact your ability to use some features of our service. Essential cookies cannot be disabled as they are necessary for the service to function.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              8. International Data Transfers
            </h2>
            <p>
              DocMetrics is based in the United States. If you access our service from outside the United States, your information may be transferred to, stored, and processed in the United States and other countries. When we transfer your data internationally, we ensure appropriate safeguards are in place, including Standard Contractual Clauses (we use EU-approved SCCs with third-party service providers); data processing agreements (all processors sign agreements ensuring GDPR compliance); adequacy decisions (we transfer data to countries deemed adequate by the EU Commission where applicable); and encryption (all data transfers use encryption in transit and at rest).
            </p>
            <p>
              Your data may be stored in the United States (primary data centers), European Union (for EU customers), and Asia-Pacific (for APAC customers). We use geographically distributed data centers to improve performance and reliability while maintaining data protection standards.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              9. Children's Privacy
            </h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <p className="text-red-900 font-semibold m-0">
                Our service is not intended for children under the age of 18.
              </p>
            </div>
            <p>
              We do not knowingly collect personal information from children under 18 years of age. If you are under 18, do not create an account or use our service, provide any personal information through our service, or upload documents or content. If we learn that we have collected personal information from a child under 18 without parental consent, we will delete that information as quickly as possible.
            </p>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900">
              <strong>Parents & Guardians:</strong> If you believe your child has provided personal information to us, please contact us immediately at <a href="mailto:privacy@docmetrics.com" className="underline font-medium">privacy@docmetrics.com</a>. We will take steps to remove the information and terminate the child's account.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              10. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons. For material changes, we will notify you at least 30 days in advance via email and display a prominent notice in the service. For minor changes, we will update the "Last updated" date at the top of this policy. You can view previous versions of our Privacy Policy by contacting us.
            </p>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of the service after changes are posted constitutes your acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              11. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at <a href="mailto:privacy@docmetrics.com" className="text-blue-600 hover:underline font-medium">privacy@docmetrics.com</a>. For GDPR-related matters and EU inquiries, contact our Data Protection Officer at <a href="mailto:dpo@docmetrics.com" className="text-blue-600 hover:underline font-medium">dpo@docmetrics.com</a>.
            </p>
            <p>
              Our mailing address is DocMetrics Inc., Attn: Privacy Team, 123 Analytics Street, San Francisco, CA 94102, United States. For privacy requests and to access your data, visit <a href="https://privacy.docmetrics.com" className="text-blue-600 hover:underline font-medium">privacy.docmetrics.com</a>.
            </p>
            <p>
              We aim to respond to all privacy inquiries within 3 business days. For complex requests (such as data access or deletion), we will respond within 30 days as required by law. If we need more time, we will inform you of the reason and extension period.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Version 3.2 • Last updated: October 28, 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}