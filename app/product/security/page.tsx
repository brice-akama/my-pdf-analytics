"use client"

import React, { JSX } from "react";
import { Lock, Clock, Download, Mail, Eye, EyeOff, Shield, Key, Ban, Users, CheckCircle2, AlertTriangle, FileCheck, Globe, Link2, Trash2, RotateCcw, UserX, Fingerprint } from "lucide-react";

export default function SecurityControlPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div>
          {/* Title */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                Security & Control
              </h1>
            </div>
            <p className="text-lg text-slate-600">
              Take complete control over who can access your documents, how they can interact with them, and for how long. DocMetri gives you enterprise-grade security controls that are simple to use.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              When you share sensitive documents—whether proposals, contracts, financial reports, or confidential materials—you need complete control over access and usage. DocMetri provides comprehensive security and control features that protect your content while giving you full visibility into how it's being accessed.
            </p>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="text-purple-900 m-0">
                <strong>Your documents, your rules.</strong> Set granular permissions, enforce access policies, and maintain complete control over your content from sharing to expiration.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Access Control Features
            </h2>
            
            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Password Protection
            </h3>
            <p>
              <strong>Secure your documents with password protection.</strong> Require viewers to enter a password before accessing your content. This ensures that only intended recipients with the correct credentials can view your documents, adding an essential layer of security for confidential materials.
            </p>
            <p>
              You can set unique passwords for each document or use different passwords for different recipient groups. Passwords can be simple for internal sharing or complex for highly sensitive content. Change passwords at any time to maintain security, and track failed password attempts to identify unauthorized access attempts.
            </p>
            <p className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-blue-900">
              <strong>Best Practice:</strong> Use strong, unique passwords for sensitive documents. Combine password protection with email capture to know exactly who accessed your content. Share passwords through a separate, secure channel (not in the same email as the document link).
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Email Verification & Capture
            </h3>
            <p>
              <strong>Require email addresses before granting access.</strong> Enable email capture to identify exactly who views your documents. This feature serves dual purposes: it provides an additional authentication layer while also helping you build qualified lead lists and track engagement by specific individuals.
            </p>
            <p>
              When email capture is enabled, viewers must provide their email address before accessing the document. You can choose to verify email addresses through a confirmation link or allow immediate access after email submission. All captured emails are stored securely and can be exported for CRM integration or follow-up campaigns.
            </p>
            <p>
              <strong>Domain Restrictions:</strong> Limit access to specific email domains. For example, restrict viewing to @yourcompany.com addresses for internal documents, or allow only @clientcompany.com addresses for client-specific materials. This prevents accidental sharing outside authorized organizations and ensures compliance with confidentiality agreements.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              View-Only & Download Control
            </h3>
            <p>
              <strong>Control whether viewers can download your documents.</strong> Enable view-only mode to allow recipients to read your content online without the ability to download, save, or distribute copies. This is essential for protecting intellectual property, preventing unauthorized distribution, and maintaining control over sensitive information.
            </p>
            <p>
              When download protection is enabled, viewers can read your document through DocMetri's secure viewer but cannot save it to their device. This prevents uncontrolled distribution while still allowing legitimate access to your content. You can track every download attempt, even failed ones, to understand user intent and identify potential security concerns.
            </p>
            <p>
              <strong>Print Control:</strong> In addition to download restrictions, you can disable printing to prevent physical copies from being made. This is particularly important for confidential business plans, unreleased products, or legally sensitive materials where physical distribution must be controlled.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Expiration & Time-Limited Access
            </h3>
            <p>
              <strong>Set automatic expiration dates for your documents.</strong> Time-limited access ensures that sensitive information doesn't remain accessible indefinitely. Set expiration dates based on your specific needs—whether hours, days, weeks, or months—and documents automatically become inaccessible after the deadline.
            </p>
            <p>
              This feature is invaluable for time-sensitive materials like proposals with pricing that changes, limited-time offers, confidential previews, or any content that should only be available temporarily. You can extend expiration dates if needed or immediately expire documents that are no longer relevant or have been superseded by updated versions.
            </p>
            <p>
              <strong>View Limits:</strong> In addition to time-based expiration, set view count limits. For example, allow a document to be viewed only 5 times before access is automatically revoked. This is useful for preventing excessive sharing or ensuring content isn't being distributed beyond intended recipients.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Permission Management
            </h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Granular Access Permissions
            </h3>
            <p>
              <strong>Define exactly what recipients can do with your documents.</strong> DocMetri provides comprehensive permission controls that let you specify viewing rights, download privileges, sharing capabilities, and more. Create permission profiles that match your security requirements and apply them consistently across your documents.
            </p>
            <p>
              Available permissions include view (read the document online), download (save a copy to device), print (create physical copies), share (forward to others), comment (add annotations or feedback), and edit (modify content where applicable). Mix and match these permissions to create the exact access level you need for each recipient or recipient group.
            </p>
            <p>
              <strong>Role-Based Access Control (RBAC):</strong> For team and enterprise accounts, assign roles with predefined permission sets. Create roles like "Viewer," "Reviewer," "Editor," and "Admin," each with appropriate access levels. This simplifies permission management at scale and ensures consistent security policies across your organization.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Link Sharing Controls
            </h3>
            <p>
              <strong>Control how your document links can be shared.</strong> Choose between public links (anyone with the link can access), restricted links (only specific email addresses can access), or private links (requires authentication). Each sharing method serves different use cases and security requirements.
            </p>
            <p>
              Public links are ideal for broad distribution like marketing materials or public reports. Restricted links work perfectly for client proposals or partner documents where you know the recipients. Private links provide maximum security for confidential materials that require verified identity before access.
            </p>
            <p>
              <strong>Link Expiration:</strong> Every link can have its own expiration date. Create temporary links that automatically deactivate after a presentation, meeting, or review period. This prevents old links from continuing to provide access after they're no longer needed.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Access Revocation
            </h3>
            <p>
              <strong>Instantly revoke access to any document at any time.</strong> If circumstances change—a deal falls through, an employee leaves, or information becomes outdated—you can immediately disable access for all recipients or specific individuals. Revoked documents display a customizable message explaining that access has been removed.
            </p>
            <p>
              Bulk revocation allows you to deactivate multiple documents simultaneously, useful when terminating a business relationship or when multiple related documents need to be secured. Revocation is immediate and cannot be bypassed—even if someone has the document link, they will be unable to access the content once revoked.
            </p>
            <p>
              <strong>Temporary Suspension:</strong> Rather than permanently revoking access, you can temporarily suspend document access. This is useful during contract negotiations, pending approvals, or when you need to make updates before re-enabling viewing.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Content Protection
            </h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Dynamic Watermarking
            </h3>
            <p>
              <strong>Add visible watermarks to protect your intellectual property.</strong> Apply dynamic watermarks that display viewer information (email address, viewing time, IP address) directly on the document. This discourages unauthorized distribution and helps identify the source if documents are leaked or shared improperly.
            </p>
            <p>
              Watermarks can be customized with your company name, copyright notices, confidentiality warnings, or any text you choose. Position watermarks as headers, footers, diagonal overlays, or background text. Adjust opacity to maintain document readability while clearly marking content as protected.
            </p>
            <p>
              <strong>Forensic Watermarking:</strong> For enterprise customers, we offer invisible forensic watermarks that embed unique identifiers into the document file. If a document is downloaded and later discovered in unauthorized locations, forensic analysis can trace it back to the specific viewer who accessed it.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Screenshot & Screen Recording Prevention
            </h3>
            <p>
              <strong>Protect against screen capture attempts.</strong> While no system can completely prevent determined users from capturing content, DocMetri implements multiple layers of protection to discourage and detect screenshot attempts. These protections make unauthorized copying significantly more difficult and less attractive.
            </p>
            <p>
              Our viewer detects common screenshot tools and screen recording software, displaying warnings when such activity is detected. For highly sensitive documents, enable "blank on capture" mode, which renders the document window blank when screenshot or recording software is active. All capture attempts are logged and you're immediately notified of suspicious activity.
            </p>
            <p className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900">
              <strong>Important:</strong> While these protections significantly increase security, they cannot provide absolute prevention against all capture methods. For maximum security, combine screenshot protection with watermarks, view-only mode, and time-limited access.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Redaction & Version Control
            </h3>
            <p>
              <strong>Control which content is visible to different audiences.</strong> Create multiple versions of the same document with different redactions for different recipient groups. Share full details with trusted partners while showing redacted versions to general audiences. All versions are tracked separately, allowing you to monitor engagement across different content variants.
            </p>
            <p>
              Version control ensures you always know which iteration of a document was shared with whom. When you update a document, choose whether to automatically update all existing links or create new links with the updated version while keeping old links tied to previous versions. This prevents confusion when content evolves and ensures recipients always see the version you intend.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Compliance & Audit Features
            </h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Comprehensive Audit Logs
            </h3>
            <p>
              <strong>Every action is logged and traceable.</strong> DocMetri maintains detailed audit logs of all document access and activity. See exactly who viewed what, when they viewed it, from which location, and what actions they took. Audit logs include timestamps, IP addresses, device information, and authentication methods used.
            </p>
            <p>
              Logs capture document opens, page views, time spent on each page, downloads, print attempts, sharing events, permission changes, password entries (successful and failed), email captures, link clicks, and more. This comprehensive tracking provides complete visibility and accountability for all document interactions.
            </p>
            <p>
              <strong>Audit Log Retention:</strong> All logs are retained indefinitely on enterprise plans and for configurable periods on other plans. Export logs in CSV or JSON format for long-term archival, compliance reporting, or integration with security information and event management (SIEM) systems.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Compliance Reporting
            </h3>
            <p>
              <strong>Generate compliance reports for regulatory requirements.</strong> Create detailed reports demonstrating that you've maintained appropriate controls over sensitive information. Reports can be customized to show specific metrics required by various compliance frameworks including GDPR, HIPAA, SOX, and others.
            </p>
            <p>
              Compliance reports include information about who had access to documents, how long they had access, what permissions were granted, when access was revoked, and complete audit trails of all interactions. These reports can be scheduled to generate automatically and delivered to compliance officers or auditors.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Data Retention & Deletion
            </h3>
            <p>
              <strong>Control how long documents and data are retained.</strong> Set retention policies that automatically delete documents and associated analytics data after specified periods. This ensures compliance with data minimization principles and reduces risk from maintaining unnecessary data.
            </p>
            <p>
              For documents that must be permanently deleted, use secure deletion which removes all copies, backups, and associated data. Deletion is immediate and irreversible, with confirmation provided once complete. You can schedule automatic deletion based on document age, expiration dates, or manual triggers.
            </p>
            <p>
              <strong>Right to Be Forgotten:</strong> Honor data subject requests by completely removing all personal information associated with specific email addresses or individuals. This includes deleting their viewing history, captured emails, and any other personally identifiable information, ensuring full GDPR compliance.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Team & Enterprise Controls
            </h2>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Workspace Management
            </h3>
            <p>
              <strong>Organize documents and manage team access through workspaces.</strong> Create separate workspaces for different projects, clients, or departments. Each workspace has its own security settings, member permissions, and access controls. This isolation ensures that team members only access documents relevant to their responsibilities.
            </p>
            <p>
              Workspace administrators can invite members, assign roles, set default permissions, and establish workspace-wide security policies. Transfer document ownership between team members, create shared folders with specific access rules, and maintain clear organization even as your team and document library grow.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Single Sign-On (SSO)
            </h3>
            <p>
              <strong>Integrate with your existing identity provider.</strong> Enterprise customers can enable Single Sign-On using SAML 2.0 or OAuth 2.0 protocols. Connect DocMetri with identity providers like Okta, Azure AD, Google Workspace, OneLogin, and others to centralize authentication and simplify access management.
            </p>
            <p>
              SSO ensures that employees use their existing corporate credentials to access DocMetri, eliminating the need for separate passwords. When an employee leaves your organization and is deactivated in your identity provider, their DocMetri access is automatically revoked. This centralized control significantly improves security and simplifies user management.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Multi-Factor Authentication (MFA)
            </h3>
            <p>
              <strong>Add an extra layer of security with multi-factor authentication.</strong> Require users to verify their identity using a second factor in addition to their password. Supported methods include time-based one-time passwords (TOTP) via authenticator apps, SMS verification codes, email confirmation links, and hardware security keys.
            </p>
            <p>
              Organization administrators can enforce MFA for all team members, ensuring consistent security across the entire account. Individual users can enable MFA voluntarily for personal accounts. MFA dramatically reduces the risk of unauthorized access even if passwords are compromised.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              IP Whitelisting
            </h3>
            <p>
              <strong>Restrict access to specific IP addresses or ranges.</strong> For maximum security, configure IP whitelisting to allow document access only from approved networks. This is particularly useful for documents that should only be accessible from office locations, VPNs, or other controlled network environments.
            </p>
            <p>
              Define allowed IP addresses or CIDR ranges, and attempts to access documents from unauthorized locations will be blocked. Combine IP restrictions with other access controls for defense-in-depth security. All blocked access attempts are logged for security monitoring and incident response.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Security Best Practices
            </h2>

            <p>
              To maximize the security of your documents, we recommend following these best practices when using DocMetri's security and control features:
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              For Confidential Documents
            </h3>
            <p>
              When sharing highly confidential materials such as financial statements, legal documents, unreleased products, or strategic plans, enable multiple layers of protection. Use password protection combined with email verification to ensure only intended recipients can access the content. Enable view-only mode to prevent downloads, add dynamic watermarks showing viewer information, and set appropriate expiration dates.
            </p>
            <p>
              Restrict access by email domain when sharing with specific organizations. Monitor audit logs regularly for any suspicious activity. Consider using temporary links that expire after a meeting or presentation rather than permanent links that could be saved and used later.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              For Sales & Marketing Materials
            </h3>
            <p>
              Balance security with accessibility for external-facing content. Enable email capture to build your lead database while tracking engagement. Use expiration dates on proposals to create urgency and ensure prospects see current pricing. Allow downloads for materials you want widely distributed, but restrict downloads for premium content or detailed proposals.
            </p>
            <p>
              Set up real-time notifications to know when prospects view your materials, enabling timely follow-up. Use link tracking to understand which distribution channels drive the most engagement. Create different versions of materials for different audience segments with appropriate permissions for each.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              For Team Collaboration
            </h3>
            <p>
              When sharing documents internally, leverage workspace permissions to ensure team members have appropriate access levels. Use role-based access control to assign standard permission sets rather than managing individual permissions. Enable MFA for all team members to protect against credential compromise.
            </p>
            <p>
              Establish clear document lifecycle policies: who can create documents, who reviews them, when they expire, and when they should be deleted. Conduct regular audits of document access to identify and remove unnecessary permissions. Train team members on security best practices and the importance of not sharing credentials or forwarding sensitive links unnecessarily.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">
              Regular Security Reviews
            </h3>
            <p>
              Perform periodic reviews of your document security settings. Audit active document links and revoke access to outdated or no-longer-needed materials. Review permission assignments and remove access for former employees, completed projects, or ended client relationships. Check expiration dates on long-lived documents and update them as needed.
            </p>
            <p>
              Review audit logs for unusual patterns such as excessive failed password attempts, access from unexpected locations, or abnormal viewing patterns. Keep software and security policies up to date as threats evolve. Subscribe to DocMetri's security bulletins to stay informed about new features and security recommendations.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Getting Started with Security Controls
            </h2>

            <p>
              All DocMetri accounts include comprehensive security and control features. Basic controls like password protection, expiration dates, and email capture are available on all plans. Advanced features such as SSO, IP whitelisting, and custom watermarking are available on Business and Enterprise plans.
            </p>

            <p>
              To configure security settings for a document, upload or select your document and navigate to the Security & Control panel in the document settings. Choose the appropriate controls based on your content sensitivity and recipient requirements. Settings can be modified at any time, even after sharing documents.
            </p>

            <p>
              For team and enterprise deployments, administrators can establish organization-wide security policies that apply default settings to all documents. This ensures consistent security practices across your entire organization while still allowing individual users to apply additional restrictions for specific documents.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">
              Support & Assistance
            </h2>

            <p>
              Our security team is available to help you configure appropriate controls for your use case. For questions about security features, implementation guidance, or enterprise security requirements, contact our team at <a href="mailto:security@docmetri.com" className="text-blue-600 hover:underline font-medium">security@docmetri.com</a>.
            </p>

            <p>
              Enterprise customers receive dedicated security consultation as part of their onboarding process. We'll work with your IT and security teams to integrate DocMetri into your existing security infrastructure, configure appropriate policies, and ensure compliance with your security requirements.
            </p>

            <p>
              For general support inquiries, visit our <a href="/support" className="text-blue-600 hover:underline font-medium">Support Center</a> or contact <a href="mailto:support@docmetri.com" className="text-blue-600 hover:underline font-medium">support@docmetri.com</a>. Our documentation includes detailed guides for configuring each security feature, with examples and best practice recommendations.
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