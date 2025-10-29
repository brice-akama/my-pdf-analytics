import React, { JSX } from "react";
import { Shield, Lock, Server, Eye, FileCheck, AlertTriangle, CheckCircle2, Database, Key, RefreshCw } from "lucide-react";

export default function SecurityPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Security
              </h1>
            </div>
            <p className="text-lg text-slate-600">
              Your trust is our top priority. We implement industry-leading security practices to protect your documents and data.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              At DocMetri, security is fundamental to everything we build. We understand that you're entrusting us with sensitive documents and analytics data. This page outlines our comprehensive approach to protecting your information.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 m-0">
                <strong>Security is not a feature—it's our foundation.</strong> We follow industry best practices and continuously monitor emerging threats to keep your data safe.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Data Encryption
            </h2>
            <p>
              <strong>Encryption in Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.3 (Transport Layer Security) with strong cipher suites. This ensures that your documents and analytics data cannot be intercepted during transmission.
            </p>
            <p>
              <strong>Encryption at Rest:</strong> All documents and user data stored on our servers are encrypted using AES-256 encryption, the same standard used by financial institutions and government agencies. Your files are encrypted before being written to disk and remain encrypted until retrieved for authorized access.
            </p>
            <p>
              <strong>End-to-End Security:</strong> Document metadata and analytics data are encrypted throughout their entire lifecycle—from upload to storage to retrieval. Encryption keys are managed securely and rotated regularly following industry best practices.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Infrastructure Security
            </h2>
            <p>
              <strong>Cloud Infrastructure:</strong> DocMetri is hosted on enterprise-grade cloud infrastructure (AWS/Google Cloud Platform) with multiple layers of security. Our hosting providers maintain SOC 2, ISO 27001, and other security certifications, and undergo regular independent security audits.
            </p>
            <p>
              <strong>Network Security:</strong> We employ firewalls, intrusion detection systems (IDS), and distributed denial-of-service (DDoS) protection to safeguard our infrastructure. Our network architecture follows the principle of least privilege, with strict access controls at every layer.
            </p>
            <p>
              <strong>Data Centers:</strong> Your data is stored in geographically distributed, redundant data centers with 24/7 physical security, environmental controls, and backup power systems. We offer data residency options to comply with regional data protection requirements.
            </p>
            <p>
              <strong>Regular Backups:</strong> We perform automated, encrypted backups of all data multiple times daily. Backups are stored in geographically separate locations and are regularly tested to ensure successful recovery in the event of data loss.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Application Security
            </h2>
            <p>
              <strong>Secure Authentication:</strong> User passwords are hashed using industry-standard algorithms (bcrypt/Argon2) with per-user salts. We never store passwords in plain text, and our authentication system is protected against brute-force attacks with rate limiting and account lockout mechanisms.
            </p>
            <p>
              <strong>Multi-Factor Authentication (MFA):</strong> We support two-factor authentication (2FA) using time-based one-time passwords (TOTP) for an additional layer of account security. We strongly recommend enabling MFA for all accounts.
            </p>
            <p>
              <strong>Session Management:</strong> User sessions are managed securely with cryptographically secure session tokens. Sessions automatically expire after periods of inactivity, and users can revoke active sessions at any time from their account settings.
            </p>
            <p>
              <strong>Protection Against Common Vulnerabilities:</strong> Our application is designed and regularly tested to protect against common security threats including SQL injection, cross-site scripting (XSS), cross-site request forgery (CSRF), and other OWASP Top 10 vulnerabilities.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Access Control & Privacy
            </h2>
            <p>
              <strong>Principle of Least Privilege:</strong> Access to user data is restricted to authorized personnel on a need-to-know basis. Our employees and systems have only the minimum permissions necessary to perform their functions.
            </p>
            <p>
              <strong>Role-Based Access Control (RBAC):</strong> Within your organization, you can assign granular permissions to team members, ensuring that users only have access to the documents and analytics data appropriate for their role.
            </p>
            <p>
              <strong>Document Privacy:</strong> Your documents are private by default. We do not access, read, or use your document content for any purpose other than providing our service. Analytics data is collected solely to provide you with insights about document engagement.
            </p>
            <p>
              <strong>Employee Access:</strong> DocMetri employees do not access customer documents or data except when explicitly authorized by the customer for support purposes, or as required for system maintenance and security. All access is logged and audited.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Compliance & Certifications
            </h2>
            <p>
              <strong>GDPR Compliance:</strong> We are fully compliant with the European Union's General Data Protection Regulation (GDPR). We provide data processing agreements (DPAs), support data subject access requests (DSARs), and ensure that data transfers comply with GDPR requirements including Standard Contractual Clauses (SCCs).
            </p>
            <p>
              <strong>Data Protection:</strong> We adhere to data protection principles including data minimization, purpose limitation, and storage limitation. We collect only the data necessary to provide our service and retain it only as long as needed.
            </p>
            <p>
              <strong>Privacy Shield & International Transfers:</strong> For international data transfers, we implement appropriate safeguards including Standard Contractual Clauses approved by the European Commission and adequacy decisions where applicable.
            </p>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900">
              <strong>Compliance Roadmap:</strong> We are currently pursuing SOC 2 Type II certification and ISO 27001 certification. Enterprise customers can request our security questionnaire and compliance documentation.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Monitoring & Incident Response
            </h2>
            <p>
              <strong>24/7 Security Monitoring:</strong> We continuously monitor our infrastructure and applications for security threats using automated detection systems and security information and event management (SIEM) tools. Suspicious activity triggers immediate alerts to our security team.
            </p>
            <p>
              <strong>Vulnerability Management:</strong> We regularly scan our systems for security vulnerabilities and apply security patches promptly. Our development team follows secure coding practices and conducts security reviews for all code changes.
            </p>
            <p>
              <strong>Penetration Testing:</strong> We engage independent security firms to conduct regular penetration testing and security assessments of our platform. Findings are addressed according to severity and risk.
            </p>
            <p>
              <strong>Incident Response Plan:</strong> We maintain a documented incident response plan to quickly identify, contain, and remediate security incidents. In the event of a data breach affecting your information, we will notify you within 72 hours as required by GDPR and other applicable regulations.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Data Retention & Deletion
            </h2>
            <p>
              <strong>Data Retention:</strong> We retain your documents and analytics data for as long as your account is active or as needed to provide you with our services. You can delete individual documents or analytics data at any time from your dashboard.
            </p>
            <p>
              <strong>Account Deletion:</strong> If you close your account, we will delete your documents and personal data within 30 days, except where we are required to retain information for legal, compliance, or security purposes. You can request immediate deletion by contacting our support team.
            </p>
            <p>
              <strong>Secure Deletion:</strong> When data is deleted, it is permanently removed from our production systems and backups using secure deletion methods that prevent recovery. Deleted data cannot be restored.
            </p>
            <p>
              <strong>Data Portability:</strong> You can export your documents and analytics data at any time in common formats (PDF, CSV, JSON) to transfer to another service or maintain your own records.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Third-Party Security
            </h2>
            <p>
              <strong>Vendor Management:</strong> We carefully vet all third-party service providers who process or have access to customer data. Our vendors are required to maintain appropriate security standards and sign data processing agreements.
            </p>
            <p>
              <strong>Subprocessors:</strong> We maintain a list of subprocessors (third-party service providers) who may process customer data. This list is available upon request and we notify customers of any changes to our subprocessors.
            </p>
            <p>
              <strong>Payment Security:</strong> Payment card information is processed by PCI DSS compliant payment processors (Stripe). We do not store credit card numbers, CVV codes, or other sensitive payment information on our servers.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Security Best Practices for Users
            </h2>
            <p>
              While we implement robust security measures, protecting your account also requires vigilance on your part. We recommend the following best practices:
            </p>
            <p>
              <strong>Use Strong Passwords:</strong> Create unique, complex passwords for your DocMetri account. Use a password manager to generate and store strong passwords securely.
            </p>
            <p>
              <strong>Enable Two-Factor Authentication:</strong> Activate 2FA on your account for an additional layer of security. This significantly reduces the risk of unauthorized access even if your password is compromised.
            </p>
            <p>
              <strong>Keep Software Updated:</strong> Ensure your browser, operating system, and security software are up to date to protect against known vulnerabilities.
            </p>
            <p>
              <strong>Be Cautious with Sharing:</strong> Only share document links with trusted recipients. Use password protection and expiration dates for sensitive documents. Review and revoke access permissions regularly.
            </p>
            <p>
              <strong>Monitor Account Activity:</strong> Regularly review your account activity and active sessions. If you notice any suspicious activity, change your password immediately and contact our support team.
            </p>
            <p>
              <strong>Report Security Concerns:</strong> If you discover a security vulnerability or have concerns about the security of your account, please contact us immediately at <a href="mailto:security@docmetri.com" className="text-blue-600 hover:underline font-medium">security@docmetri.com</a>.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Responsible Disclosure
            </h2>
            <p>
              We value the security research community and welcome reports of potential security vulnerabilities. If you believe you have discovered a security issue in our platform, please report it responsibly by emailing <a href="mailto:security@docmetri.com" className="text-blue-600 hover:underline font-medium">security@docmetri.com</a> with details of the vulnerability.
            </p>
            <p>
              <strong>What to Include:</strong> Please provide a detailed description of the vulnerability, steps to reproduce the issue, and any relevant screenshots or proof-of-concept code. Do not publicly disclose the vulnerability until we have had an opportunity to investigate and address it.
            </p>
            <p>
              <strong>Our Commitment:</strong> We will acknowledge your report within 48 hours, provide an initial assessment within 5 business days, and work with you to understand and resolve the issue. We recognize security researchers who report valid vulnerabilities and may offer recognition on our security acknowledgments page (with your permission).
            </p>
            <p className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-900">
              <strong>Bug Bounty Program:</strong> We are planning to launch a formal bug bounty program in the near future. Security researchers who report valid vulnerabilities will be eligible for rewards based on severity and impact.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Contact Our Security Team
            </h2>
            <p>
              For security-related inquiries, vulnerability reports, or to request additional security documentation, please contact our security team at <a href="mailto:security@docmetri.com" className="text-blue-600 hover:underline font-medium">security@docmetri.com</a>.
            </p>
            <p>
              For enterprise customers requiring detailed security documentation, compliance certifications, or custom security agreements, please contact our enterprise sales team at <a href="mailto:enterprise@docmetri.com" className="text-blue-600 hover:underline font-medium">enterprise@docmetri.com</a>.
            </p>
            <p>
              We maintain transparency about our security practices and are happy to answer questions about how we protect your data. Our security team is committed to working with you to address any concerns and ensure your confidence in our platform.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Continuous Improvement
            </h2>
            <p>
              Security is not a one-time effort but an ongoing commitment. We continuously evaluate and improve our security posture through regular assessments, employee training, and staying informed about emerging threats and best practices. We update our security measures as technology evolves and new threats emerge.
            </p>
            <p>
              This security page is regularly reviewed and updated to reflect our current security practices. We encourage you to review this page periodically to stay informed about how we protect your data.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}