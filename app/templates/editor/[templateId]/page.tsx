'use client';

import React, { useState, useRef,  useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Plus, Minus, Edit2, Image, PenTool, X, ChevronLeft, FileText } from 'lucide-react';

// Template interface
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  popular: boolean;
  fields: string[];
  sections: Section[];
}

interface Section {
  id: string;
  type: 'text' | 'table' | 'logo' | 'signature';
  label: string;
  value?: string;
  rows?: string[][];
  imageUrl?: string;
}



// ALL TEMPLATES WITH PROFESSIONAL DESIGNS
const ALL_TEMPLATES: Template[] = [
  {
    id: 'sales-invoice-001',
    name: 'Sales Invoice',
    description: 'Professional invoice for products and services',
    category: 'invoices',
    icon: '📄',
    popular: true,
    fields: ['Invoice #', 'Date', 'Items', 'Subtotal', 'Tax', 'Total'],
    sections: [
      { id: 'logo', type: 'logo', label: 'Company Logo', imageUrl: '' },
      { id: 'company', type: 'text', label: 'Company Name', value: 'PandaDoc Inc.' },
      { id: 'address', type: 'text', label: 'Company Address', value: '123 Business Street\nSan Francisco, CA 94105\ncontact@pandadoc.com\n+1 (555) 123-4567' },
      { id: 'invoice-title', type: 'text', label: 'Invoice Title', value: 'SALES INVOICE' },
      { id: 'invoice-number', type: 'text', label: 'Invoice Number', value: 'INV-001' },
      { id: 'payment-terms', type: 'text', label: 'Payment Terms', value: 'Net 30' },
      { id: 'due-date', type: 'text', label: 'Due Date', value: 'December 1, 2025' },
      { id: 'bill-to', type: 'text', label: 'Bill To', value: 'John Doe\n456 Client Ave, New York, NY 10001\njohn@client.com\n+1 (555) 987-6543' },
      { 
        id: 'items', 
        type: 'table', 
        label: 'Invoice Items',
        rows: [
          ['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT'],
          ['Web Development Services\nFull website redesign and development', '1', '$5,000.00', '$5,000.00'],
          ['SEO Optimization\nOn-page and technical SEO implementation', '1', '$1,200.00', '$1,200.00'],
        ]
      },
      { id: 'subtotal', type: 'text', label: 'Subtotal', value: '$6,200.00' },
      { id: 'tax', type: 'text', label: 'Tax', value: '$620.00' },
      { id: 'total', type: 'text', label: 'Total Amount', value: '$6,820.00' },
      { id: 'terms', type: 'text', label: 'Terms & Conditions', value: 'Payment is due within 30 days. Late payments will incur a 1.5% monthly interest charge.' },
      { id: 'signature', type: 'signature', label: 'Authorized Signature', imageUrl: '' }
    ]
  },
  {
    id: 'service-agreement-001',
    name: 'Service Agreement',
    description: 'Professional service contract template',
    category: 'contracts',
    icon: '📋',
    popular: true,
    fields: ['Party Names', 'Services', 'Terms', 'Duration', 'Payment'],
    sections: [
      { id: 'title', type: 'text', label: 'Agreement Title', value: 'SERVICE AGREEMENT' },
      { id: 'contract-number', type: 'text', label: 'Contract Number', value: 'SA-2025-001' },
      { id: 'effective-date', type: 'text', label: 'Effective Date', value: 'January 1, 2025' },
      { id: 'provider-company', type: 'text', label: 'Provider Company', value: 'Your Company Inc.' },
      { id: 'provider-details', type: 'text', label: 'Provider Details', value: '123 Business Street\nprovider@company.com\n+1 (555) 123-4567\nJohn Smith, CEO' },
      { id: 'client-company', type: 'text', label: 'Client Company', value: 'Client Corp' },
      { id: 'client-details', type: 'text', label: 'Client Details', value: '456 Client Ave\nclient@company.com\n+1 (555) 987-6543\nJane Doe, Manager' },
      { id: 'scope', type: 'text', label: 'Scope of Services', value: 'The Service Provider agrees to provide professional services including consultation, implementation, and ongoing support as needed. Services will be delivered according to industry best practices and agreed-upon timelines.' },
      { id: 'start-date', type: 'text', label: 'Start Date', value: 'January 1, 2025' },
      { id: 'end-date', type: 'text', label: 'End Date', value: 'December 31, 2025' },
      { id: 'payment-amount', type: 'text', label: 'Payment Amount', value: '$10,000 per month' },
      { id: 'payment-terms', type: 'text', label: 'Payment Terms', value: 'Invoices issued monthly, due within 15 days. Late payments subject to 1.5% monthly interest.' },
      { id: 'confidentiality', type: 'text', label: 'Confidentiality Clause', value: 'Both parties agree to maintain confidentiality of all proprietary information disclosed during the term of this agreement. This obligation survives termination for 3 years.' },
      { id: 'provider-signature', type: 'signature', label: 'Service Provider Signature', imageUrl: '' },
      { id: 'client-signature', type: 'signature', label: 'Client Signature', imageUrl: '' }
    ]
  },
  {
    id: 'payment-receipt-001',
    name: 'Payment Receipt',
    description: 'Professional payment confirmation receipt',
    category: 'receipts',
    icon: '🧾',
    popular: true,
    fields: ['Receipt #', 'Date', 'Amount', 'Payment Method', 'Transaction ID'],
    sections: [
      { id: 'logo', type: 'logo', label: 'Company Logo', imageUrl: '' },
      { id: 'title', type: 'text', label: 'Document Title', value: 'PAYMENT RECEIPT' },
      { id: 'receipt-number', type: 'text', label: 'Receipt Number', value: 'REC-2025-001' },
      { id: 'date', type: 'text', label: 'Date Issued', value: 'November 1, 2025' },
      { id: 'received-from', type: 'text', label: 'Received From', value: 'John Smith\njohn@email.com\n+1 (555) 123-4567\n789 Customer Lane, Boston, MA 02101' },
      { id: 'amount', type: 'text', label: 'Amount Paid', value: '$2,500.00' },
      { id: 'payment-method', type: 'text', label: 'Payment Method', value: 'Credit Card (Visa ****1234)' },
      { id: 'transaction-id', type: 'text', label: 'Transaction ID', value: 'TXN-ABC123XYZ789' },
      { id: 'reference', type: 'text', label: 'Reference Number', value: 'REF-2025-456' },
      { id: 'purpose', type: 'text', label: 'Payment Purpose', value: 'Invoice #INV-001 - Web Development Services' },
      { id: 'company-name', type: 'text', label: 'Company Name', value: 'Your Company Inc.' },
      { id: 'company-details', type: 'text', label: 'Company Details', value: '123 Business Street\nSan Francisco, CA 94105\ncontact@company.com | +1 (555) 123-4567\nwww.company.com\nTax ID: 12-3456789' }
    ]
  },
  {
    id: 'business-proposal-001',
    name: 'Business Proposal',
    description: 'Comprehensive project proposal template',
    category: 'proposals',
    icon: '💼',
    popular: false,
    fields: ['Project Name', 'Client', 'Budget', 'Timeline', 'Deliverables'],
    sections: [
      { id: 'title', type: 'text', label: 'Proposal Title', value: 'PROJECT PROPOSAL' },
      { id: 'project-name', type: 'text', label: 'Project Name', value: 'Website Redesign & Development' },
      { id: 'prepared-for', type: 'text', label: 'Prepared For', value: 'ABC Corporation' },
      { id: 'prepared-by', type: 'text', label: 'Prepared By', value: 'Your Company Inc.' },
      { id: 'proposal-date', type: 'text', label: 'Proposal Date', value: 'November 1, 2025' },
      { id: 'proposal-number', type: 'text', label: 'Proposal Number', value: 'PROP-2025-001' },
      { id: 'executive-summary', type: 'text', label: 'Executive Summary', value: 'We are pleased to present this comprehensive proposal for your website redesign project. Our team brings extensive experience and a proven track record of delivering exceptional results that drive business growth and exceed client expectations.' },
      { 
        id: 'scope-phases', 
        type: 'table', 
        label: 'Project Phases',
        rows: [
          ['PHASE', 'DESCRIPTION', 'DURATION'],
          ['Discovery & Planning', 'Requirements analysis, user research, strategic planning', '2 weeks'],
          ['Design & Development', 'Modern responsive design and full-stack implementation', '6 weeks'],
          ['Testing & Launch', 'Quality assurance, deployment, and training', '2 weeks'],
        ]
      },
      { id: 'start-date', type: 'text', label: 'Project Start Date', value: 'January 15, 2025' },
      { id: 'duration', type: 'text', label: 'Project Duration', value: '10 weeks' },
      { id: 'completion-date', type: 'text', label: 'Expected Completion', value: 'March 26, 2025' },
      { id: 'investment', type: 'text', label: 'Total Investment', value: '$25,000' },
      { id: 'payment-terms', type: 'text', label: 'Payment Terms', value: '50% deposit upon signing, 50% upon project completion' },
      { id: 'proposer-signature', type: 'signature', label: 'Proposed By (Provider)', imageUrl: '' },
      { id: 'acceptor-signature', type: 'signature', label: 'Accepted By (Client)', imageUrl: '' }
    ]
  },
  {
    id: 'freelance-contract-001',
    name: 'Freelance Contract',
    description: 'Independent contractor agreement',
    category: 'contracts',
    icon: '✍️',
    popular: true,
    fields: ['Freelancer', 'Client', 'Scope', 'Payment', 'Timeline'],
    sections: [
      { id: 'title', type: 'text', label: 'Contract Title', value: 'FREELANCE AGREEMENT' },
      { id: 'contract-id', type: 'text', label: 'Contract ID', value: 'FC-2025-001' },
      { id: 'agreement-date', type: 'text', label: 'Agreement Date', value: 'January 1, 2025' },
      { id: 'client-name', type: 'text', label: 'Client Full Name', value: 'Jane Smith' },
      { id: 'client-company', type: 'text', label: 'Client Company', value: 'Client Corp' },
      { id: 'client-details', type: 'text', label: 'Client Contact Details', value: 'client@company.com\n+1 (555) 987-6543\n456 Client Avenue, New York, NY 10001' },
      { id: 'freelancer-name', type: 'text', label: 'Freelancer Full Name', value: 'John Freelancer' },
      { id: 'freelancer-business', type: 'text', label: 'Freelancer Business Name', value: 'JF Design Studio' },
      { id: 'freelancer-details', type: 'text', label: 'Freelancer Contact Details', value: 'freelancer@email.com\n+1 (555) 123-4567\n789 Freelancer Street, Los Angeles, CA 90001' },
      { id: 'scope-of-work', type: 'text', label: 'Scope of Work', value: 'The Freelancer agrees to provide professional design and development services including website design, branding materials, and digital assets according to the project timeline and specifications outlined in the project brief.' },
      { 
        id: 'deliverables', 
        type: 'table', 
        label: 'Project Deliverables',
        rows: [
          ['DELIVERABLE', 'DESCRIPTION', 'DUE DATE'],
          ['Website Design Mockups', 'Complete design mockups for all pages', 'Week 2'],
          ['Development Implementation', 'Fully functional website with all features', 'Week 6'],
          ['Documentation & Training', 'User guides and training materials', 'Week 8'],
        ]
      },
      { id: 'start-date', type: 'text', label: 'Project Start Date', value: 'January 15, 2025' },
      { id: 'duration', type: 'text', label: 'Project Duration', value: '8 weeks' },
      { id: 'end-date', type: 'text', label: 'Expected Completion', value: 'March 12, 2025' },
      { id: 'total-fee', type: 'text', label: 'Total Project Fee', value: '$5,000' },
      { id: 'payment-schedule', type: 'text', label: 'Payment Schedule', value: '30% deposit upon signing ($1,500)\n40% at midpoint milestone ($2,000)\n30% upon completion ($1,500)' },
      { id: 'freelancer-signature', type: 'signature', label: 'Freelancer Signature', imageUrl: '' },
      { id: 'client-signature', type: 'signature', label: 'Client Signature', imageUrl: '' }
    ]
  },
  // ADD THESE TWO NEW TEMPLATES HERE (after freelance-contract-001 and before the closing bracket)
  
{
  id: 'nda-agreement-001',
  name: 'NDA Agreement',
  description: 'Non-Disclosure Agreement for confidential information',
  category: 'contracts',
  icon: '🔒',
  popular: false,
  fields: ['Parties', 'Confidential Info', 'Duration', 'Obligations'],
  sections: [
    // Header
    { id: 'document-title', type: 'text', label: 'Document Title', value: 'NON-DISCLOSURE AGREEMENT' },
    { id: 'document-subtitle', type: 'text', label: 'Document Subtitle', value: 'Mutual Confidentiality Agreement' },
    { id: 'nda-label', type: 'text', label: 'NDA Badge Text', value: '🔒 CONFIDENTIAL | NDA #' },
    { id: 'nda-number', type: 'text', label: 'NDA Number', value: 'NDA-2025-001' },
    
    // Intro
    { id: 'intro-text-1', type: 'text', label: 'Introduction Text Part 1', value: 'This Non-Disclosure Agreement ("Agreement") is effective as of' },
    { id: 'effective-date', type: 'text', label: 'Effective Date', value: 'January 1, 2025' },
    { id: 'intro-text-2', type: 'text', label: 'Introduction Text Part 2', value: 'and is entered into by and between:' },
    
    // Parties Section
    { id: 'parties-section-title', type: 'text', label: 'Parties Section Title', value: 'DISCLOSING PARTIES' },
    
    // Party A
    { id: 'party-a-label', type: 'text', label: 'Party A Label', value: 'PARTY A (Disclosing Party)' },
    { id: 'party-a-name-label', type: 'text', label: 'Party A Name Label', value: 'Name/Company:' },
    { id: 'party-a-name', type: 'text', label: 'Party A Name/Company', value: 'Company ABC Inc.' },
    { id: 'party-a-rep-label', type: 'text', label: 'Party A Representative Label', value: 'Representative:' },
    { id: 'party-a-representative', type: 'text', label: 'Party A Representative', value: 'John Smith' },
    { id: 'party-a-address-label', type: 'text', label: 'Party A Address Label', value: 'Address:' },
    { id: 'party-a-address', type: 'text', label: 'Party A Address', value: '123 Business Street, San Francisco, CA 94105' },
    { id: 'party-a-title', type: 'text', label: 'Party A Title', value: 'CEO' },
    { id: 'party-a-date', type: 'text', label: 'Party A Signature Date', value: 'January 1, 2025' },
    
    // Party B
    { id: 'party-b-label', type: 'text', label: 'Party B Label', value: 'PARTY B (Receiving Party)' },
    { id: 'party-b-name-label', type: 'text', label: 'Party B Name Label', value: 'Name/Company:' },
    { id: 'party-b-name', type: 'text', label: 'Party B Name/Company', value: 'Client Corp' },
    { id: 'party-b-rep-label', type: 'text', label: 'Party B Representative Label', value: 'Representative:' },
    { id: 'party-b-representative', type: 'text', label: 'Party B Representative', value: 'Jane Doe' },
    { id: 'party-b-address-label', type: 'text', label: 'Party B Address Label', value: 'Address:' },
    { id: 'party-b-address', type: 'text', label: 'Party B Address', value: '456 Client Avenue, New York, NY 10001' },
    { id: 'party-b-title', type: 'text', label: 'Party B Title', value: 'Manager' },
    { id: 'party-b-date', type: 'text', label: 'Party B Signature Date', value: 'January 1, 2025' },
    
    // Section 1: Purpose
    { id: 'section-1-title', type: 'text', label: 'Section 1 Title', value: '1. PURPOSE' },
    { id: 'section-1-content', type: 'text', label: 'Section 1 Content', value: 'The parties wish to explore a business opportunity of mutual interest ("Purpose") and in connection with this Purpose, may disclose certain confidential and proprietary information. This Agreement sets forth the terms under which confidential information will be disclosed and protected.' },
    
    // Section 2: Definition
    { id: 'section-2-title', type: 'text', label: 'Section 2 Title', value: '2. DEFINITION OF CONFIDENTIAL INFORMATION' },
    { id: 'section-2-intro', type: 'text', label: 'Section 2 Introduction', value: '2.1 "Confidential Information" means any information disclosed by either party to the other party, including but not limited to:' },
    { id: 'definition-bullet-1', type: 'text', label: 'Definition - Bullet 1', value: '• Business plans, strategies, and financial information' },
    { id: 'definition-bullet-2', type: 'text', label: 'Definition - Bullet 2', value: '• Technical data, trade secrets, and know-how' },
    { id: 'definition-bullet-3', type: 'text', label: 'Definition - Bullet 3', value: '• Customer lists, supplier information, and business contacts' },
    { id: 'definition-bullet-4', type: 'text', label: 'Definition - Bullet 4', value: '• Product designs, prototypes, and specifications' },
    { id: 'definition-bullet-5', type: 'text', label: 'Definition - Bullet 5', value: '• Marketing plans and promotional strategies' },
    { id: 'definition-bullet-6', type: 'text', label: 'Definition - Bullet 6', value: '• Software, source code, and proprietary algorithms' },
    { id: 'definition-bullet-7', type: 'text', label: 'Definition - Bullet 7', value: '• Any information marked as "Confidential" or similar designation' },
    
    // Section 3: Obligations
    { id: 'section-3-title', type: 'text', label: 'Section 3 Title', value: '3. OBLIGATIONS OF RECEIVING PARTY' },
    { id: 'obligation-1', type: 'text', label: 'Obligation 3.1', value: '3.1 Confidentiality: The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third parties without prior written consent.' },
    { id: 'obligation-2', type: 'text', label: 'Obligation 3.2', value: '3.2 Use Restriction: The Receiving Party shall use the Confidential Information solely for the Purpose and not for any other purpose.' },
    { id: 'obligation-3', type: 'text', label: 'Obligation 3.3', value: '3.3 Protection: The Receiving Party shall protect the Confidential Information with at least the same degree of care it uses to protect its own confidential information, but in no case less than reasonable care.' },
    { id: 'obligation-4', type: 'text', label: 'Obligation 3.4', value: '3.4 Limited Disclosure: The Receiving Party may disclose Confidential Information only to employees, consultants, or advisors who have a legitimate need to know and who are bound by confidentiality obligations at least as protective as those in this Agreement.' },
    
    // Section 4: Exceptions
    { id: 'section-4-title', type: 'text', label: 'Section 4 Title', value: '4. EXCEPTIONS' },
    { id: 'section-4-intro', type: 'text', label: 'Section 4 Introduction', value: 'The obligations under this Agreement shall not apply to information that:' },
    { id: 'exception-a', type: 'text', label: 'Exception a)', value: 'a) Was known to the Receiving Party prior to disclosure' },
    { id: 'exception-b', type: 'text', label: 'Exception b)', value: 'b) Is or becomes publicly available through no breach of this Agreement' },
    { id: 'exception-c', type: 'text', label: 'Exception c)', value: 'c) Is rightfully received from a third party without breach of any confidentiality obligation' },
    { id: 'exception-d', type: 'text', label: 'Exception d)', value: 'd) Is independently developed by the Receiving Party without use of the Confidential Information' },
    { id: 'exception-e', type: 'text', label: 'Exception e)', value: 'e) Is required to be disclosed by law or court order (with prior notice to the Disclosing Party)' },
    
    // Section 5: Term
    { id: 'section-5-title', type: 'text', label: 'Section 5 Title', value: '5. TERM' },
    { id: 'term-5-1-label', type: 'text', label: 'Term 5.1 Label', value: '5.1 Duration: This Agreement shall remain in effect for a period of' },
    { id: 'duration-years', type: 'text', label: 'Agreement Duration (years)', value: '3' },
    { id: 'term-5-1-suffix', type: 'text', label: 'Term 5.1 Suffix', value: 'years from the Effective Date.' },
    { id: 'term-5-2-label', type: 'text', label: 'Term 5.2 Label', value: '5.2 Survival: The confidentiality obligations shall survive termination of this Agreement and continue for an additional' },
    { id: 'survival-years', type: 'text', label: 'Survival Period (years)', value: '5' },
    { id: 'term-5-2-suffix', type: 'text', label: 'Term 5.2 Suffix', value: 'years.' },
    
    // Section 6: Return of Information
    { id: 'section-6-title', type: 'text', label: 'Section 6 Title', value: '6. RETURN OF INFORMATION' },
    { id: 'section-6-content', type: 'text', label: 'Section 6 Content', value: 'Upon request or termination of this Agreement, the Receiving Party shall promptly return or destroy all Confidential Information, including all copies, notes, and derivatives thereof, and certify in writing that it has done so.' },
    
    // Section 7: No License
    { id: 'section-7-title', type: 'text', label: 'Section 7 Title', value: '7. NO LICENSE' },
    { id: 'section-7-content', type: 'text', label: 'Section 7 Content', value: 'Nothing in this Agreement grants any license or right to use any patent, copyright, trademark, or other intellectual property right of either party. All intellectual property rights remain with the Disclosing Party.' },
    
    // Section 8: Remedies
    { id: 'section-8-title', type: 'text', label: 'Section 8 Title', value: '8. REMEDIES' },
    { id: 'section-8-content', type: 'text', label: 'Section 8 Content', value: 'The parties acknowledge that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages may be an inadequate remedy. Therefore, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.' },
    
    // Section 9: General Provisions
    { id: 'section-9-title', type: 'text', label: 'Section 9 Title', value: '9. GENERAL PROVISIONS' },
    { id: 'provision-9-1-label', type: 'text', label: 'Provision 9.1 Label', value: '9.1 Governing Law: This Agreement shall be governed by the laws of' },
    { id: 'jurisdiction', type: 'text', label: 'Governing Jurisdiction', value: 'State of California' },
    { id: 'provision-9-2', type: 'text', label: 'Provision 9.2', value: '9.2 Entire Agreement: This Agreement constitutes the entire agreement regarding confidentiality.' },
    { id: 'provision-9-3', type: 'text', label: 'Provision 9.3', value: '9.3 Amendments: Any amendments must be in writing and signed by both parties.' },
    { id: 'provision-9-4', type: 'text', label: 'Provision 9.4', value: '9.4 Severability: If any provision is invalid, the remaining provisions shall remain in effect.' },
    { id: 'provision-9-5', type: 'text', label: 'Provision 9.5', value: '9.5 Waiver: Failure to enforce any provision shall not constitute a waiver.' },
    
    // Legal Notice
    { id: 'legal-notice-icon', type: 'text', label: 'Legal Notice Icon', value: '⚠️' },
    { id: 'legal-notice', type: 'text', label: 'Legal Notice Text', value: 'LEGAL NOTICE: This is a legally binding Non-Disclosure Agreement. By signing below, you acknowledge that you understand and agree to maintain the confidentiality of all information disclosed under this agreement. Breach of this agreement may result in legal action and damages.' },
    
    // Signature Section
    { id: 'signature-title', type: 'text', label: 'Signature Section Title', value: 'SIGNATURES' },
    { id: 'signature-by-label', type: 'text', label: 'Signature By Label', value: 'By:' },
    { id: 'signature-title-label', type: 'text', label: 'Signature Title Label', value: 'Title:' },
    { id: 'signature-line-label', type: 'text', label: 'Signature Line Label', value: 'Signature:' },
    { id: 'signature-date-label', type: 'text', label: 'Signature Date Label', value: 'Date:' },
    
    // Footer
    { id: 'footer-confidential', type: 'text', label: 'Footer Confidential Text', value: '🔒 CONFIDENTIAL DOCUMENT' },
    { id: 'footer-nda-label', type: 'text', label: 'Footer NDA Label', value: 'NDA #' },
    { id: 'footer-page', type: 'text', label: 'Footer Page Info', value: 'Page 1 of 1' },
    
    // Signatures
    { id: 'party-a-signature', type: 'signature', label: 'Party A Signature', imageUrl: '' },
    { id: 'party-b-signature', type: 'signature', label: 'Party B Signature', imageUrl: '' }
  ]
},
  
{
  id: 'social-media-contract-001',
  name: 'Social Media Management Contract',
  description: 'Comprehensive social media services agreement',
  category: 'contracts',
  icon: '📱',
  popular: true,
  fields: ['Client Info', 'Manager Info', 'Platforms', 'Services', 'Payment', 'Term'],
  sections: [
    // Header
    { id: 'document-title', type: 'text', label: 'Document Title', value: 'SOCIAL MEDIA MANAGEMENT CONTRACT' },
    { id: 'document-subtitle', type: 'text', label: 'Document Subtitle', value: 'Professional Social Media Services Agreement' },
    { id: 'contract-id', type: 'text', label: 'Contract ID', value: 'SMM-2025-001' },
    { id: 'agreement-date', type: 'text', label: 'Agreement Date', value: 'January 1, 2025' },
    
    // Parties Section Title
    { id: 'parties-section-title', type: 'text', label: 'Parties Section Title', value: 'CONTRACTING PARTIES' },
    
    // Client Party
    { id: 'client-label', type: 'text', label: 'Client Section Label', value: 'CLIENT' },
    { id: 'client-sublabel', type: 'text', label: 'Client Section Sublabel', value: '(The business/brand)' },
    { id: 'client-business-label', type: 'text', label: 'Client Business Name Label', value: 'Business Name:' },
    { id: 'client-business-name', type: 'text', label: 'Client Business Name', value: 'ABC Corporation' },
    { id: 'client-contact-label', type: 'text', label: 'Client Contact Label', value: 'Contact Person:' },
    { id: 'client-contact-name', type: 'text', label: 'Client Contact Person', value: 'John Smith' },
    { id: 'client-email-label', type: 'text', label: 'Client Email Label', value: 'Email:' },
    { id: 'client-email', type: 'text', label: 'Client Email', value: 'john@abccorp.com' },
    { id: 'client-phone-label', type: 'text', label: 'Client Phone Label', value: 'Phone:' },
    { id: 'client-phone', type: 'text', label: 'Client Phone', value: '+1 (555) 123-4567' },
    { id: 'client-address-label', type: 'text', label: 'Client Address Label', value: 'Business Address:' },
    { id: 'client-address', type: 'text', label: 'Client Business Address', value: '123 Business Street, New York, NY 10001' },
    { id: 'client-website-label', type: 'text', label: 'Client Website Label', value: 'Website:' },
    { id: 'client-website', type: 'text', label: 'Client Website', value: 'www.abccorp.com' },
    { id: 'client-title', type: 'text', label: 'Client Title', value: 'Marketing Director' },
    { id: 'client-signature-date', type: 'text', label: 'Client Signature Date', value: 'January 1, 2025' },
    
    // Manager Party
    { id: 'manager-label', type: 'text', label: 'Manager Section Label', value: 'SOCIAL MEDIA MANAGER' },
    { id: 'manager-sublabel', type: 'text', label: 'Manager Section Sublabel', value: '(The service provider)' },
    { id: 'manager-name-label', type: 'text', label: 'Manager Name Label', value: 'Name/Agency:' },
    { id: 'manager-name', type: 'text', label: 'Manager Name/Agency', value: 'Sarah Johnson' },
    { id: 'manager-business-label', type: 'text', label: 'Manager Business Name Label', value: 'Business Name:' },
    { id: 'manager-business-name', type: 'text', label: 'Manager Business Name', value: 'Social Growth Agency' },
    { id: 'manager-email-label', type: 'text', label: 'Manager Email Label', value: 'Email:' },
    { id: 'manager-email', type: 'text', label: 'Manager Email', value: 'sarah@socialgrowth.com' },
    { id: 'manager-phone-label', type: 'text', label: 'Manager Phone Label', value: 'Phone:' },
    { id: 'manager-phone', type: 'text', label: 'Manager Phone', value: '+1 (555) 987-6543' },
    { id: 'manager-address-label', type: 'text', label: 'Manager Address Label', value: 'Address:' },
    { id: 'manager-address', type: 'text', label: 'Manager Address', value: '456 Agency Lane, Los Angeles, CA 90001' },
    { id: 'manager-title', type: 'text', label: 'Manager Title', value: 'Social Media Director' },
    { id: 'manager-signature-date', type: 'text', label: 'Manager Signature Date', value: 'January 1, 2025' },
    
    // Section 1: Services Overview
    { id: 'section-1-title', type: 'text', label: 'Section 1 Title', value: '1. SERVICES OVERVIEW' },
    { id: 'section-1-content', type: 'text', label: 'Section 1 Content', value: 'The Social Media Manager agrees to provide comprehensive social media management services for the Client\'s brand across designated platforms. Services include content creation, scheduling, community management, analytics, and strategic planning.' },
    
    // Section 2: Platforms
    { id: 'section-2-title', type: 'text', label: 'Section 2 Title', value: '2. PLATFORMS COVERED' },
    { id: 'platform-fb-name', type: 'text', label: 'Facebook Platform Name', value: 'Facebook' },
    { id: 'fb-account', type: 'text', label: 'Facebook Account Handle', value: '@abccorp' },
    { id: 'platform-ig-name', type: 'text', label: 'Instagram Platform Name', value: 'Instagram' },
    { id: 'ig-account', type: 'text', label: 'Instagram Account Handle', value: '@abccorp' },
    { id: 'platform-twitter-name', type: 'text', label: 'Twitter Platform Name', value: 'Twitter/X' },
    { id: 'twitter-account', type: 'text', label: 'Twitter/X Account Handle', value: '@abccorp' },
    { id: 'platform-linkedin-name', type: 'text', label: 'LinkedIn Platform Name', value: 'LinkedIn' },
    { id: 'linkedin-account', type: 'text', label: 'LinkedIn Account', value: 'ABC Corporation' },
    { id: 'platform-youtube-name', type: 'text', label: 'YouTube Platform Name', value: 'YouTube' },
    { id: 'youtube-channel', type: 'text', label: 'YouTube Channel', value: 'ABC Corporation' },
    { id: 'platform-tiktok-name', type: 'text', label: 'TikTok Platform Name', value: 'TikTok' },
    { id: 'tiktok-account', type: 'text', label: 'TikTok Account Handle', value: '@abccorp' },
    
    // Section 3: Scope of Services - ALL BULLETS EDITABLE
    { id: 'section-3-title', type: 'text', label: 'Section 3 Title', value: '3. SCOPE OF SERVICES' },
    
    // Content Creation
    { id: 'service-1-title', type: 'text', label: 'Service 1 Title', value: 'Content Creation & Curation' },
    { id: 'service-1-bullet-1', type: 'text', label: 'Content Creation - Bullet 1', value: '• Creating original graphics, photos, and videos' },
    { id: 'service-1-bullet-2', type: 'text', label: 'Content Creation - Bullet 2', value: '• Writing engaging captions and copy' },
    { id: 'service-1-bullet-3', type: 'text', label: 'Content Creation - Bullet 3', value: '• Sourcing and curating relevant third-party content' },
    { id: 'service-1-bullet-4', type: 'text', label: 'Content Creation - Bullet 4', value: '• Developing content themes and campaigns' },
    { id: 'service-1-bullet-5-label', type: 'text', label: 'Content Creation - Posts Label', value: '• Posts per month:' },
    { id: 'posts-per-month', type: 'text', label: 'Posts Per Month Value', value: '20 posts' },
    
    // Content Scheduling
    { id: 'service-2-title', type: 'text', label: 'Service 2 Title', value: 'Content Scheduling & Publishing' },
    { id: 'service-2-bullet-1-label', type: 'text', label: 'Scheduling - Bullet 1 Label', value: '• Strategic scheduling using' },
    { id: 'scheduling-tool', type: 'text', label: 'Scheduling Tool Name', value: 'Hootsuite' },
    { id: 'service-2-bullet-2', type: 'text', label: 'Scheduling - Bullet 2', value: '• Optimal timing based on audience analytics' },
    { id: 'service-2-bullet-3', type: 'text', label: 'Scheduling - Bullet 3', value: '• Cross-platform content adaptation' },
    { id: 'service-2-bullet-4', type: 'text', label: 'Scheduling - Bullet 4', value: '• Content calendar management and approval process' },
    
    // Community Management
    { id: 'service-3-title', type: 'text', label: 'Service 3 Title', value: 'Community Management' },
    { id: 'service-3-bullet-1', type: 'text', label: 'Community - Bullet 1', value: '• Responding to comments and messages' },
    { id: 'service-3-bullet-2', type: 'text', label: 'Community - Bullet 2', value: '• Engaging with followers and relevant accounts' },
    { id: 'service-3-bullet-3', type: 'text', label: 'Community - Bullet 3', value: '• Monitoring brand mentions and tags' },
    { id: 'service-3-bullet-4-label', type: 'text', label: 'Community - Response Time Label', value: '• Response time: Within' },
    { id: 'response-time', type: 'text', label: 'Response Time Hours', value: '24' },
    { id: 'service-3-bullet-4-suffix', type: 'text', label: 'Community - Response Time Suffix', value: 'hours during business days' },
    
    // Analytics & Reporting
    { id: 'service-4-title', type: 'text', label: 'Service 4 Title', value: 'Analytics & Reporting' },
    { id: 'service-4-bullet-1', type: 'text', label: 'Analytics - Bullet 1', value: '• Monthly performance reports with insights' },
    { id: 'service-4-bullet-2', type: 'text', label: 'Analytics - Bullet 2', value: '• Tracking key metrics: reach, engagement, growth' },
    { id: 'service-4-bullet-3', type: 'text', label: 'Analytics - Bullet 3', value: '• Competitor analysis and benchmarking' },
    { id: 'service-4-bullet-4', type: 'text', label: 'Analytics - Bullet 4', value: '• Strategy recommendations based on data' },
    
    // Strategy & Growth
    { id: 'service-5-title', type: 'text', label: 'Service 5 Title', value: 'Strategy & Growth' },
    { id: 'service-5-bullet-1', type: 'text', label: 'Strategy - Bullet 1', value: '• Quarterly strategy sessions' },
    { id: 'service-5-bullet-2', type: 'text', label: 'Strategy - Bullet 2', value: '• Hashtag research and optimization' },
    { id: 'service-5-bullet-3', type: 'text', label: 'Strategy - Bullet 3', value: '• Growth campaigns and promotions' },
    { id: 'service-5-bullet-4', type: 'text', label: 'Strategy - Bullet 4', value: '• Trend monitoring and implementation' },
    
    // Section 4: Service Package
    { id: 'section-4-title', type: 'text', label: 'Section 4 Title', value: '4. SERVICE PACKAGE' },
    { id: 'package-name', type: 'text', label: 'Package Name', value: 'PREMIUM' },
    { id: 'package-label-1', type: 'text', label: 'Package Label 1', value: 'Posts/Month' },
    { id: 'posts-count', type: 'text', label: 'Posts Count', value: '20' },
    { id: 'package-label-2', type: 'text', label: 'Package Label 2', value: 'Platforms' },
    { id: 'platform-count', type: 'text', label: 'Platform Count', value: '6' },
    { id: 'package-label-3', type: 'text', label: 'Package Label 3', value: 'Stories/Week' },
    { id: 'stories-count', type: 'text', label: 'Stories Per Week', value: '14' },
    
    // Section 5: Client Responsibilities - ALL BULLETS
    { id: 'section-5-title', type: 'text', label: 'Section 5 Title', value: '5. CLIENT RESPONSIBILITIES' },
    { id: 'responsibility-1', type: 'text', label: 'Responsibility 5.1', value: '5.1 Provide brand guidelines, logos, and approved assets' },
    { id: 'responsibility-2', type: 'text', label: 'Responsibility 5.2', value: '5.2 Grant necessary access to all social media accounts' },
    { id: 'responsibility-3-label', type: 'text', label: 'Responsibility 5.3 Label', value: '5.3 Review and approve content within' },
    { id: 'approval-timeframe', type: 'text', label: 'Approval Timeframe (hours)', value: '48' },
    { id: 'responsibility-3-suffix', type: 'text', label: 'Responsibility 5.3 Suffix', value: 'hours' },
    { id: 'responsibility-4', type: 'text', label: 'Responsibility 5.4', value: '5.4 Provide timely feedback and communication' },
    { id: 'responsibility-5', type: 'text', label: 'Responsibility 5.5', value: '5.5 Supply product information, updates, and promotional materials' },
    { id: 'responsibility-6', type: 'text', label: 'Responsibility 5.6', value: '5.6 Notify Manager of any sensitive issues or crisis situations' },
    
    // Section 6: Content Approval
    { id: 'section-6-title', type: 'text', label: 'Section 6 Title', value: '6. CONTENT APPROVAL PROCESS' },
    { id: 'approval-1-label', type: 'text', label: 'Approval 6.1 Label', value: '6.1 Content calendar submitted by' },
    { id: 'calendar-submission-day', type: 'text', label: 'Calendar Submission Day', value: '25th' },
    { id: 'approval-1-suffix', type: 'text', label: 'Approval 6.1 Suffix', value: 'of each month' },
    { id: 'approval-2-label', type: 'text', label: 'Approval 6.2 Label', value: '6.2 Client reviews and provides feedback within' },
    { id: 'review-days', type: 'text', label: 'Review Period (days)', value: '3' },
    { id: 'approval-2-suffix', type: 'text', label: 'Approval 6.2 Suffix', value: 'business days' },
    { id: 'approval-3-label', type: 'text', label: 'Approval 6.3 Label', value: '6.3 Manager implements revisions within' },
    { id: 'revision-days', type: 'text', label: 'Revision Period (days)', value: '2' },
    { id: 'approval-3-suffix', type: 'text', label: 'Approval 6.3 Suffix', value: 'business days' },
    { id: 'approval-4', type: 'text', label: 'Approval 6.4', value: '6.4 Emergency/time-sensitive posts may be published with verbal approval' },
    { id: 'approval-5-label', type: 'text', label: 'Approval 6.5 Label', value: '6.5 Revisions included:' },
    { id: 'revisions-included', type: 'text', label: 'Revisions Included', value: '2' },
    { id: 'approval-5-suffix', type: 'text', label: 'Approval 6.5 Suffix', value: 'rounds per content calendar' },
    
    // Section 7: Contract Term
    { id: 'section-7-title', type: 'text', label: 'Section 7 Title', value: '7. CONTRACT TERM' },
    { id: 'term-label-1', type: 'text', label: 'Term Label 1', value: 'START DATE' },
    { id: 'start-date', type: 'text', label: 'Start Date', value: 'February 1, 2025' },
    { id: 'term-label-2', type: 'text', label: 'Term Label 2', value: 'CONTRACT LENGTH' },
    { id: 'contract-length', type: 'text', label: 'Contract Length', value: '12 months' },
    { id: 'term-label-3', type: 'text', label: 'Term Label 3', value: 'RENEWAL' },
    { id: 'renewal-type', type: 'text', label: 'Renewal Type', value: 'Auto-Renew' },
    { id: 'notice-label', type: 'text', label: 'Notice Period Label', value: 'Notice Period for Termination:' },
    { id: 'notice-period', type: 'text', label: 'Notice Period (days)', value: '30' },
    { id: 'notice-suffix', type: 'text', label: 'Notice Period Suffix', value: 'days written notice required' },
    
    // Section 8: Payment
    { id: 'section-8-title', type: 'text', label: 'Section 8 Title', value: '8. INVESTMENT & PAYMENT TERMS' },
    { id: 'payment-header', type: 'text', label: 'Payment Header Text', value: 'MONTHLY INVESTMENT' },
    { id: 'monthly-fee', type: 'text', label: 'Monthly Fee', value: '2,500' },
    { id: 'billing-label', type: 'text', label: 'Billing Text', value: 'Billed monthly on the' },
    { id: 'billing-day', type: 'text', label: 'Billing Day', value: '1st' },
    { id: 'billing-suffix', type: 'text', label: 'Billing Suffix', value: 'of each month' },
    { id: 'payment-details-title', type: 'text', label: 'Payment Details Title', value: 'Payment Details:' },
    { id: 'payment-method-label', type: 'text', label: 'Payment Method Label', value: 'Payment Method:' },
    { id: 'payment-method', type: 'text', label: 'Payment Method', value: 'ACH Transfer' },
    { id: 'payment-due-label', type: 'text', label: 'Payment Due Label', value: 'Payment Due:' },
    { id: 'payment-due-value', type: 'text', label: 'Payment Due Value', value: 'Upon receipt of invoice' },
    { id: 'late-fee-label', type: 'text', label: 'Late Fee Label', value: 'Late Payment Fee:' },
    { id: 'late-fee', type: 'text', label: 'Late Payment Fee (%)', value: '1.5' },
    { id: 'late-fee-suffix', type: 'text', label: 'Late Fee Suffix', value: '% per month' },
    { id: 'setup-fee-label', type: 'text', label: 'Setup Fee Label', value: 'First Payment (Setup Fee):' },
    { id: 'setup-fee', type: 'text', label: 'Setup Fee', value: '500' },
    { id: 'setup-fee-suffix', type: 'text', label: 'Setup Fee Suffix', value: '(one-time)' },
    
    // Section 9: Additional Services - ALL ITEMS
    { id: 'section-9-title', type: 'text', label: 'Section 9 Title', value: '9. ADDITIONAL SERVICES (Optional Add-Ons)' },
    { id: 'addon-1-title', type: 'text', label: 'Add-on 1 Title', value: 'Paid Advertising Management' },
    { id: 'addon-1-description', type: 'text', label: 'Add-on 1 Description', value: 'Campaign setup, monitoring, and optimization' },
    { id: 'ads-fee', type: 'text', label: 'Ads Management Fee', value: '750' },
    { id: 'addon-2-title', type: 'text', label: 'Add-on 2 Title', value: 'Professional Photography' },
    { id: 'addon-2-description', type: 'text', label: 'Add-on 2 Description', value: 'Product and lifestyle shoots' },
    { id: 'photo-fee', type: 'text', label: 'Photography Fee', value: '500' },
    { id: 'addon-3-title', type: 'text', label: 'Add-on 3 Title', value: 'Video Production' },
    { id: 'addon-3-description', type: 'text', label: 'Add-on 3 Description', value: 'Reels, TikToks, and promotional videos' },
    { id: 'video-fee', type: 'text', label: 'Video Production Fee', value: '350' },
    { id: 'addon-4-title', type: 'text', label: 'Add-on 4 Title', value: 'Influencer Collaboration' },
    { id: 'addon-4-description', type: 'text', label: 'Add-on 4 Description', value: 'Finding and coordinating with influencers' },
    { id: 'influencer-fee', type: 'text', label: 'Influencer Collaboration Fee', value: '1,000' },
    
    // Sections 10-15 with ALL content editable
    { id: 'section-10-title', type: 'text', label: 'Section 10 Title', value: '10. INTELLECTUAL PROPERTY RIGHTS' },
    { id: 'ip-1', type: 'text', label: 'IP 10.1', value: '10.1 Client Content: Client retains all rights to their brand assets, logos, and provided materials.' },
    { id: 'ip-2', type: 'text', label: 'IP 10.2', value: '10.2 Created Content: Upon full payment, Client owns all content created specifically for their brand (graphics, captions, videos).' },
    { id: 'ip-3', type: 'text', label: 'IP 10.3', value: '10.3 Manager Portfolio: Manager may use created content in portfolio and case studies unless otherwise specified.' },
    { id: 'ip-4', type: 'text', label: 'IP 10.4', value: '10.4 Third-Party Content: Manager ensures proper licensing and attribution for stock images and third-party content.' },
    
    { id: 'section-11-title', type: 'text', label: 'Section 11 Title', value: '11. CONFIDENTIALITY' },
    { id: 'confidentiality-text-label', type: 'text', label: 'Confidentiality Text', value: 'Both parties agree to maintain confidentiality of proprietary information including but not limited to: business strategies, customer data, unpublished content, analytics, and financial information. This obligation continues for' },
    { id: 'confidentiality-years', type: 'text', label: 'Confidentiality Period (years)', value: '2' },
    { id: 'confidentiality-suffix', type: 'text', label: 'Confidentiality Suffix', value: 'years after contract termination.' },
    
    { id: 'section-12-title', type: 'text', label: 'Section 12 Title', value: '12. PERFORMANCE EXPECTATIONS' },
    { id: 'performance-intro', type: 'text', label: 'Performance Introduction', value: 'Target Goals (90-day timeline):' },
    { id: 'goal-1-label', type: 'text', label: 'Goal 1 Label', value: '• Follower Growth:' },
    { id: 'growth-target', type: 'text', label: 'Follower Growth Target (%)', value: '15' },
    { id: 'goal-1-suffix', type: 'text', label: 'Goal 1 Suffix', value: '%' },
    { id: 'goal-2-label', type: 'text', label: 'Goal 2 Label', value: '• Engagement Rate:' },
    { id: 'engagement-target', type: 'text', label: 'Engagement Rate Target (%)', value: '5' },
    { id: 'goal-2-suffix', type: 'text', label: 'Goal 2 Suffix', value: '%' },
    { id: 'goal-3-label', type: 'text', label: 'Goal 3 Label', value: '• Reach Increase:' },
    { id: 'reach-target', type: 'text', label: 'Reach Increase Target (%)', value: '25' },
    { id: 'goal-3-suffix', type: 'text', label: 'Goal 3 Suffix', value: '%' },
    { id: 'goal-4-label', type: 'text', label: 'Goal 4 Label', value: '• Website Clicks:' },
    { id: 'clicks-target', type: 'text', label: 'Website Clicks Target', value: '500' },
    { id: 'goal-4-suffix', type: 'text', label: 'Goal 4 Suffix', value: 'per month' },
    { id: 'performance-note', type: 'text', label: 'Performance Note', value: 'Note: These are goals, not guarantees. Social media success depends on multiple factors including content quality, industry, competition, and algorithm changes. Manager commits to best practices and continuous optimization.' },
    
    { id: 'section-13-title', type: 'text', label: 'Section 13 Title', value: '13. TERMINATION' },
    { id: 'termination-1-label', type: 'text', label: 'Termination 13.1 Label', value: '13.1 Either party may terminate with' },
    { id: 'termination-notice', type: 'text', label: 'Termination Notice Period', value: '30' },
    { id: 'termination-1-suffix', type: 'text', label: 'Termination 13.1 Suffix', value: 'days written notice' },
    { id: 'termination-2', type: 'text', label: 'Termination 13.2', value: '13.2 Upon termination, Client receives all scheduled content and analytics reports' },
    { id: 'termination-3', type: 'text', label: 'Termination 13.3', value: '13.3 Client must pay for all services rendered through termination date' },
    { id: 'termination-4-label', type: 'text', label: 'Termination 13.4 Label', value: '13.4 Manager will provide account access transition support for' },
    { id: 'transition-days', type: 'text', label: 'Transition Support (days)', value: '7' },
    { id: 'termination-4-suffix', type: 'text', label: 'Termination 13.4 Suffix', value: 'days' },
    { id: 'termination-5-label', type: 'text', label: 'Termination 13.5 Label', value: '13.5 Early termination fee:' },
    { id: 'early-termination-fee', type: 'text', label: 'Early Termination Fee', value: '50% of remaining contract value' },
    { id: 'termination-5-suffix', type: 'text', label: 'Termination 13.5 Suffix', value: 'if terminated before' },
    { id: 'minimum-term', type: 'text', label: 'Minimum Term', value: '6 months' },
    
    { id: 'section-14-title', type: 'text', label: 'Section 14 Title', value: '14. LIMITATION OF LIABILITY' },
    { id: 'liability-text', type: 'text', label: 'Liability Text', value: 'Manager is not liable for: platform algorithm changes, account suspension/deletion by social platforms, negative comments/reviews from third parties, or results affected by factors outside Manager\'s control.' },
    { id: 'liability-limit', type: 'text', label: 'Liability Limit Text', value: 'Total liability limited to: Amount paid by Client in the three months prior to claim.' },
    
    { id: 'section-15-title', type: 'text', label: 'Section 15 Title', value: '15. GENERAL PROVISIONS' },
    { id: 'provision-1-label', type: 'text', label: 'Provision 15.1 Label', value: '15.1 Governing Law: This Agreement shall be governed by the laws of' },
    { id: 'jurisdiction', type: 'text', label: 'Governing Jurisdiction', value: 'State of California' },
    { id: 'provision-2', type: 'text', label: 'Provision 15.2', value: '15.2 Entire Agreement: This document constitutes the entire agreement between parties' },
      { id: 'provision-3', type: 'text', label: 'Provision 15.3', value: '15.3 Amendments: Changes must be made in writing and signed by both parties' },
    { id: 'provision-4', type: 'text', label: 'Provision 15.4', value: '15.4 Force Majeure: Neither party liable for delays due to circumstances beyond their control' },
    { id: 'provision-5', type: 'text', label: 'Provision 15.5', value: '15.5 Independent Contractor: Manager is an independent contractor, not an employee' },
    
    // Signature Section
    { id: 'signature-acknowledgment', type: 'text', label: 'Signature Acknowledgment', value: '✓ AGREEMENT ACKNOWLEDGMENT: By signing below, both parties confirm they have read, understood, and agree to all terms and conditions outlined in this Social Media Management Contract.' },
    { id: 'signature-title', type: 'text', label: 'Signature Section Title', value: 'SIGNATURES' },
    { id: 'client-signature-label', type: 'text', label: 'Client Signature Label', value: 'CLIENT SIGNATURE' },
    { id: 'manager-signature-label', type: 'text', label: 'Manager Signature Label', value: 'MANAGER SIGNATURE' },
    { id: 'signature-by-label', type: 'text', label: 'Signature By Label', value: 'By:' },
    { id: 'signature-title-label', type: 'text', label: 'Signature Title Label', value: 'Title:' },
    { id: 'signature-business-label', type: 'text', label: 'Signature Business Label', value: 'Business:' },
    { id: 'signature-line-label', type: 'text', label: 'Signature Line Label', value: 'Signature:' },
    { id: 'signature-date-label', type: 'text', label: 'Signature Date Label', value: 'Date:' },
    
    // Footer
    { id: 'footer-title', type: 'text', label: 'Footer Title', value: '📱 Social Media Management Contract' },
    { id: 'footer-contract-label', type: 'text', label: 'Footer Contract ID Label', value: 'Contract ID:' },
    { id: 'footer-generated-label', type: 'text', label: 'Footer Generated Label', value: 'Generated:' },
    { id: 'generated-date', type: 'text', label: 'Document Generated Date', value: 'January 1, 2025' },
    { id: 'footer-tagline', type: 'text', label: 'Footer Tagline', value: 'Building Your Brand, Growing Your Presence' },
    
    // Signatures
    { id: 'client-signature', type: 'signature', label: 'Client Signature', imageUrl: '' },
    { id: 'manager-signature', type: 'signature', label: 'Manager Signature', imageUrl: '' }
  ]
}
];

export default function DocumentEditor() {
 
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const params = useParams(); // Get URL parameters
  const templateId = params?.id as string; // Get the template ID from URL
   const [showTemplateSelector, setShowTemplateSelector] = useState(!templateId); 
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
const [showColorPicker, setShowColorPicker] = useState(false);


  // AUTO-LOAD TEMPLATE FROM URL
  useEffect(() => {
    if (templateId && !currentTemplate) {
      const template = ALL_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setCurrentTemplate(JSON.parse(JSON.stringify(template)));
        setShowTemplateSelector(false);
      } else {
        // Template not found, show selector
        setShowTemplateSelector(true);
      }
    }
  }, [templateId, currentTemplate]);

  

  const selectTemplate = (template: Template) => {
    setCurrentTemplate(JSON.parse(JSON.stringify(template)));
    setShowTemplateSelector(false);
  };

  const updateSection = (sectionId: string, newValue: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section =>
        section.id === sectionId ? { ...section, value: newValue } : section
      )
    });
  };

  const startEdit = (section: Section) => {
    setEditingSection(section.id);
    setEditValue(section.value || '');
  };

  const saveEdit = () => {
    if (editingSection) {
      updateSection(editingSection, editValue);
      setEditingSection(null);
    }
  };

  const handleLogoUpload = (sectionId: string) => {
    fileInputRef.current?.click();
    fileInputRef.current!.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!currentTemplate) return;
          setCurrentTemplate({
            ...currentTemplate,
            sections: currentTemplate.sections.map(section =>
              section.id === sectionId ? { ...section, imageUrl: event.target?.result as string } : section
            )
          });
        };
        reader.readAsDataURL(file);
      }
    };
  };

  const addTableRow = (sectionId: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => {
        if (section.id === sectionId && section.rows) {
          const newRow = new Array(section.rows[0].length).fill('New Item');
          return { ...section, rows: [...section.rows, newRow] };
        }
        return section;
      })
    });
  };

  const removeTableRow = (sectionId: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => {
        if (section.id === sectionId && section.rows && section.rows.length > 2) {
          return { ...section, rows: section.rows.slice(0, -1) };
        }
        return section;
      })
    });
  };

  const updateTableCell = (sectionId: string, rowIndex: number, colIndex: number, value: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections.map(section => {
        if (section.id === sectionId && section.rows) {
          const newRows = [...section.rows];
          newRows[rowIndex][colIndex] = value;
          return { ...section, rows: newRows };
        }
        return section;
      })
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas && currentTemplate && showSignatureModal) {
      const dataUrl = canvas.toDataURL();
      setCurrentTemplate({
        ...currentTemplate,
        sections: currentTemplate.sections.map(section =>
          section.id === showSignatureModal ? { ...section, imageUrl: dataUrl } : section
        )
      });
      setShowSignatureModal(null);
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleDownload = () => {
    const html = document.getElementById('document-preview')?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${currentTemplate?.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 60px; max-width: 900px; margin: 0 auto; background: white; }
            .whitespace-pre-wrap { white-space: pre-wrap; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplate?.name.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render Professional Preview based on template type
  const renderPreview = () => {
    if (!currentTemplate) return null;

    const getSection = (id: string) => currentTemplate.sections.find(s => s.id === id);

    const getColorStyle = (type: 'primary' | 'secondary' | 'gradient' | 'light') => {
  switch(type) {
    case 'primary':
      return { backgroundColor: primaryColor, borderColor: primaryColor };
    case 'secondary':
      return { backgroundColor: secondaryColor, borderColor: secondaryColor };
    case 'gradient':
      return { backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` };
    case 'light':
      return { backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40` };
    default:
      return {};
  }
};

    // SALES INVOICE PREVIEW
    if (currentTemplate.id === 'sales-invoice-001') {
      return (
        <div className="bg-white p-10 text-sm">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.5rem', borderBottom: `2px solid ${primaryColor}`, marginBottom: '2rem' }}>

            <div>
              {getSection('logo')?.imageUrl && (
                <img src={getSection('logo')?.imageUrl} alt="Logo" className="h-16 w-16 object-contain mb-3 rounded-lg" />
              )}
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#0f172a' }}>{getSection('company')?.value}</div>

              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{getSection('address')?.value}</div>

            </div>
            <div className="text-right">
              <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>{getSection('invoice-title')?.value}</div>

             <div style={getColorStyle('light')} className="px-4 py-2 rounded-lg">

                <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 'bold', marginBottom: '0.25rem' }}>Invoice No:</div>

                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>{getSection('invoice-number')?.value}</div>


              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div><strong>Terms:</strong> {getSection('payment-terms')?.value}</div>
                <div><strong>Due:</strong> {getSection('due-date')?.value}</div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', borderLeft: `4px solid ${primaryColor}`, paddingLeft: '0.75rem' }}>Bill to:</div>

           <div style={getColorStyle('light')} className="p-5 rounded-lg">

             <div style={{ fontSize: '0.75rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{getSection('bill-to')?.value}</div>

            </div>
          </div>

          {/* Items Table */}
          {getSection('items')?.rows && (
            <div className="mb-8">
              <table style={{ width: '100%', fontSize: '0.75rem' }}>
  <thead>
    <tr style={getColorStyle('primary')} className="text-white">

                    {getSection('items')!.rows![0].map((header, i) => (
                      <th key={i} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>{header}</th>

                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getSection('items')!.rows!.slice(1).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>

                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '0.75rem', whiteSpace: 'pre-wrap' }}>{cell}</td>

                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>

                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-900">{getSection('subtotal')?.value}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span className="text-slate-600">Tax:</span>
                <span className="font-bold text-slate-900">{getSection('tax')?.value}</span>
              </div>
              <div style={getColorStyle('primary')} className="text-white px-5 py-4 rounded-lg mt-3 flex justify-between items-center">

                <span className="font-bold text-sm">TOTAL:</span>
                <span className="text-2xl font-bold">{getSection('total')?.value}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
            <div className="text-xs font-bold text-slate-800 mb-2">Terms & Conditions:</div>
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{getSection('terms')?.value}</div>
          </div>

          {/* Signature */}
          {getSection('signature')?.imageUrl && (
            <div className="border-t-2 border-slate-200 pt-6">
              <div className="text-xs text-slate-600 mb-2">Authorized Signature:</div>
              <img src={getSection('signature')?.imageUrl} alt="Signature" className="h-16" />
            </div>
          )}
        </div>
      );
    }

    // NDA AGREEMENT PREVIEW
    // NDA AGREEMENT PREVIEW
if (currentTemplate.id === 'nda-agreement-001') {
  return (
    <div className="bg-white p-10 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `4px double ${primaryColor}` }}>

       <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: primaryColor, marginBottom: '0.5rem' }}>{getSection('document-title')?.value}</div>

        <div className="text-xs text-slate-600">{getSection('document-subtitle')?.value}</div>
        <div className="mt-3 inline-block bg-red-100 text-red-700 px-4 py-2 rounded text-xs font-bold">
          {getSection('nda-label')?.value}{getSection('nda-number')?.value}
        </div>
      </div>

      {/* Effective Date */}
      <div
  style={{
    textAlign: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: `4px double ${primaryColor}`
  }}
>

        <div className="text-xs text-slate-700 leading-relaxed">
          {getSection('intro-text-1')?.value} <span className="bg-yellow-100 px-2 font-bold">{getSection('effective-date')?.value}</span> {getSection('intro-text-2')?.value}
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-red-600 pl-3">{getSection('parties-section-title')?.value}</div>
        
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-bold text-red-800 mb-3">{getSection('party-a-label')?.value}</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-600 font-semibold">{getSection('party-a-name-label')?.value}</div>
              <div className="font-bold text-slate-900">{getSection('party-a-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">{getSection('party-a-rep-label')?.value}</div>
              <div className="font-bold text-slate-900">{getSection('party-a-representative')?.value}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">{getSection('party-a-address-label')?.value}</div>
              <div className="text-slate-900">{getSection('party-a-address')?.value}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-5">
          <div className="text-sm font-bold text-slate-800 mb-3">{getSection('party-b-label')?.value}</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-600 font-semibold">{getSection('party-b-name-label')?.value}</div>
              <div className="font-bold text-slate-900">{getSection('party-b-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">{getSection('party-b-rep-label')?.value}</div>
              <div className="font-bold text-slate-900">{getSection('party-b-representative')?.value}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">{getSection('party-b-address-label')?.value}</div>
              <div className="text-slate-900">{getSection('party-b-address')?.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-1-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('section-1-content')?.value}
          </div>
        </div>
      </div>

      {/* Definition of Confidential Information */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-2-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>{getSection('section-2-intro')?.value}</strong>
            </div>
            <ul className="ml-4 space-y-1">
              <li>{getSection('definition-bullet-1')?.value}</li>
              <li>{getSection('definition-bullet-2')?.value}</li>
              <li>{getSection('definition-bullet-3')?.value}</li>
              <li>{getSection('definition-bullet-4')?.value}</li>
              <li>{getSection('definition-bullet-5')?.value}</li>
              <li>{getSection('definition-bullet-6')?.value}</li>
              <li>{getSection('definition-bullet-7')?.value}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Obligations */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-3-title')?.value}</div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <div>{getSection('obligation-1')?.value}</div>
            <div>{getSection('obligation-2')?.value}</div>
            <div>{getSection('obligation-3')?.value}</div>
            <div>{getSection('obligation-4')?.value}</div>
          </div>
        </div>
      </div>

      {/* Exceptions */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-4-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('section-4-intro')?.value}
          </div>
          <ul className="mt-2 ml-4 space-y-1 text-xs text-slate-700">
            <li>{getSection('exception-a')?.value}</li>
            <li>{getSection('exception-b')?.value}</li>
            <li>{getSection('exception-c')?.value}</li>
            <li>{getSection('exception-d')?.value}</li>
            <li>{getSection('exception-e')?.value}</li>
          </ul>
        </div>
      </div>

      {/* Term */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-5-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-2">
            <div>
              <strong>{getSection('term-5-1-label')?.value}</strong> <span className="bg-yellow-100 px-1 font-bold">{getSection('duration-years')?.value}</span> {getSection('term-5-1-suffix')?.value}
            </div>
            <div>
              <strong>{getSection('term-5-2-label')?.value}</strong> <span className="bg-yellow-100 px-1 font-bold">{getSection('survival-years')?.value}</span> {getSection('term-5-2-suffix')?.value}
            </div>
          </div>
        </div>
      </div>

      {/* Return of Information */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-6-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('section-6-content')?.value}
          </div>
        </div>
      </div>

      {/* No License */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-7-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('section-7-content')?.value}
          </div>
        </div>
      </div>

      {/* Remedies */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-8-title')?.value}</div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('section-8-content')?.value}
          </div>
        </div>
      </div>

      {/* General Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">{getSection('section-9-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-700 leading-relaxed space-y-2">
          <div><strong>{getSection('provision-9-1-label')?.value}</strong> {getSection('jurisdiction')?.value}.</div>
          <div><strong>{getSection('provision-9-2')?.value}</strong></div>
          <div><strong>{getSection('provision-9-3')?.value}</strong></div>
          <div><strong>{getSection('provision-9-4')?.value}</strong></div>
          <div><strong>{getSection('provision-9-5')?.value}</strong></div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-double border-red-700 pt-6">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2 text-xs text-yellow-900">
            <div className="text-xl">{getSection('legal-notice-icon')?.value}</div>
            <div className="leading-relaxed">
              <strong>{getSection('legal-notice')?.value}</strong>
            </div>
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mb-6">{getSection('signature-title')?.value}</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-3 border-red-700 pt-3 mb-3">
              <div className="text-xs text-slate-600 font-semibold">{getSection('party-a-label')?.value}</div>
            </div>
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-900">{getSection('party-a-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-by-label')?.value} {getSection('party-a-representative')?.value}</div>
              <div className="text-slate-600">{getSection('signature-title-label')?.value} {getSection('party-a-title')?.value}</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                {getSection('party-a-signature')?.imageUrl ? (
                  <img src={getSection('party-a-signature')?.imageUrl} alt="Signature" className="h-16" />
                ) : (
                  <div className="text-slate-600">{getSection('signature-line-label')?.value} _______________________</div>
                )}
              </div>
              <div className="text-slate-600">{getSection('signature-date-label')?.value} {getSection('party-a-date')?.value}</div>
            </div>
          </div>
          <div>
            <div className="border-t-3 border-red-700 pt-3 mb-3">
              <div className="text-xs text-slate-600 font-semibold">{getSection('party-b-label')?.value}</div>
            </div>
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-900">{getSection('party-b-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-by-label')?.value} {getSection('party-b-representative')?.value}</div>
              <div className="text-slate-600">{getSection('signature-title-label')?.value} {getSection('party-b-title')?.value}</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                {getSection('party-b-signature')?.imageUrl ? (
                  <img src={getSection('party-b-signature')?.imageUrl} alt="Signature" className="h-16" />
                ) : (
                  <div className="text-slate-600">{getSection('signature-line-label')?.value} _______________________</div>
                )}
              </div>
              <div className="text-slate-600">{getSection('signature-date-label')?.value} {getSection('party-b-date')?.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
        <div className="text-red-600 font-semibold mb-1">{getSection('footer-confidential')?.value}</div>
        <div>{getSection('footer-nda-label')?.value}{getSection('nda-number')?.value} | {getSection('footer-page')?.value}</div>
      </div>
    </div>
  );
}
    // SOCIAL MEDIA CONTRACT PREVIEW
    // SOCIAL MEDIA CONTRACT PREVIEW
if (currentTemplate.id === 'social-media-contract-001') {
  return (
    <div className="bg-white p-10 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `4px solid ${primaryColor}` }}>

        <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: primaryColor, marginBottom: '0.5rem' }}>{getSection('document-title')?.value}</div>

        <div className="text-xs text-slate-600">{getSection('document-subtitle')?.value}</div>
        <div className="mt-3 inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-xs font-bold">
          📱 CONTRACT ID: {getSection('contract-id')?.value}
        </div>
      </div>

      {/* Agreement Date */}
      <div
  style={{
    textAlign: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: `4px solid ${primaryColor}`
  }}
>

        <div className="text-xs text-slate-700 leading-relaxed">
          This Social Media Management Contract ("Agreement") is entered into as of <span className="bg-yellow-100 px-2 font-bold">{getSection('agreement-date')?.value}</span> between:
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-purple-600 pl-3">{getSection('parties-section-title')?.value}</div>
        
        {/* Client */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
            <div>
              <div className="text-sm font-bold text-purple-800">{getSection('client-label')?.value}</div>
              <div className="text-xs text-slate-600">{getSection('client-sublabel')?.value}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-business-label')?.value}</div>
              <div className="text-slate-900 font-bold">{getSection('client-business-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-contact-label')?.value}</div>
              <div className="text-slate-900 font-bold">{getSection('client-contact-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-email-label')?.value}</div>
              <div className="text-slate-900">{getSection('client-email')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-phone-label')?.value}</div>
              <div className="text-slate-900">{getSection('client-phone')?.value}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-address-label')?.value}</div>
              <div className="text-slate-900">{getSection('client-address')?.value}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">{getSection('client-website-label')?.value}</div>
              <div className="text-slate-900">{getSection('client-website')?.value}</div>
            </div>
          </div>
        </div>

        {/* Social Media Manager */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">M</div>
            <div>
              <div className="text-sm font-bold text-pink-800">{getSection('manager-label')?.value}</div>
              <div className="text-xs text-slate-600">{getSection('manager-sublabel')?.value}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('manager-name-label')?.value}</div>
              <div className="text-slate-900 font-bold">{getSection('manager-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('manager-business-label')?.value}</div>
              <div className="text-slate-900 font-bold">{getSection('manager-business-name')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('manager-email-label')?.value}</div>
              <div className="text-slate-900">{getSection('manager-email')?.value}</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">{getSection('manager-phone-label')?.value}</div>
              <div className="text-slate-900">{getSection('manager-phone')?.value}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">{getSection('manager-address-label')?.value}</div>
              <div className="text-slate-900">{getSection('manager-address')?.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-1-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed mb-4">
            {getSection('section-1-content')?.value}
          </div>
        </div>
      </div>

      {/* Platforms Covered */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-2-title')?.value}</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">📘</div>
            <div className="font-bold text-xs text-blue-900">{getSection('platform-fb-name')?.value}</div>
            <div className="text-xs text-blue-700">{getSection('fb-account')?.value}</div>
          </div>
          <div className="bg-pink-50 border-2 border-pink-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">📸</div>
            <div className="font-bold text-xs text-pink-900">{getSection('platform-ig-name')?.value}</div>
            <div className="text-xs text-pink-700">{getSection('ig-account')?.value}</div>
          </div>
          <div className="bg-sky-50 border-2 border-sky-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🐦</div>
            <div className="font-bold text-xs text-sky-900">{getSection('platform-twitter-name')?.value}</div>
            <div className="text-xs text-sky-700">{getSection('twitter-account')?.value}</div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">💼</div>
            <div className="font-bold text-xs text-blue-900">{getSection('platform-linkedin-name')?.value}</div>
            <div className="text-xs text-blue-700">{getSection('linkedin-account')?.value}</div>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">▶️</div>
            <div className="font-bold text-xs text-red-900">{getSection('platform-youtube-name')?.value}</div>
            <div className="text-xs text-red-700">{getSection('youtube-channel')?.value}</div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🎵</div>
            <div className="font-bold text-xs text-purple-900">{getSection('platform-tiktok-name')?.value}</div>
            <div className="text-xs text-purple-700">{getSection('tiktok-account')?.value}</div>
          </div>
        </div>
      </div>

      {/* Scope of Services */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-3-title')?.value}</div>
        <div className="space-y-3">
          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📝</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">{getSection('service-1-title')?.value}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {getSection('service-1-bullet-1')?.value}<br/>
                  {getSection('service-1-bullet-2')?.value}<br/>
                  {getSection('service-1-bullet-3')?.value}<br/>
                  {getSection('service-1-bullet-4')?.value}<br/>
                  {getSection('service-1-bullet-5-label')?.value} <strong>{getSection('posts-per-month')?.value}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📅</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">{getSection('service-2-title')?.value}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {getSection('service-2-bullet-1-label')?.value} {getSection('scheduling-tool')?.value}<br/>
                  {getSection('service-2-bullet-2')?.value}<br/>
                  {getSection('service-2-bullet-3')?.value}<br/>
                  {getSection('service-2-bullet-4')?.value}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">💬</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">{getSection('service-3-title')?.value}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {getSection('service-3-bullet-1')?.value}<br/>
                  {getSection('service-3-bullet-2')?.value}<br/>
                  {getSection('service-3-bullet-3')?.value}<br/>
                  {getSection('service-3-bullet-4-label')?.value} {getSection('response-time')?.value} {getSection('service-3-bullet-4-suffix')?.value}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📊</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">{getSection('service-4-title')?.value}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {getSection('service-4-bullet-1')?.value}<br/>
                  {getSection('service-4-bullet-2')?.value}<br/>
                  {getSection('service-4-bullet-3')?.value}<br/>
                  {getSection('service-4-bullet-4')?.value}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">{getSection('service-5-title')?.value}</div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {getSection('service-5-bullet-1')?.value}<br/>
                  {getSection('service-5-bullet-2')?.value}<br/>
                  {getSection('service-5-bullet-3')?.value}<br/>
                  {getSection('service-5-bullet-4')?.value}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Package */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-4-title')?.value}</div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
          <div className="text-center mb-4">
            <div className="inline-block bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm">
              {getSection('package-name')?.value} PACKAGE
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="text-purple-600 font-bold mb-1">{getSection('package-label-1')?.value}</div>
              <div className="text-2xl font-bold text-slate-900">{getSection('posts-count')?.value}</div>
            </div>
            <div className="border-x border-purple-300">
              <div className="text-purple-600 font-bold mb-1">{getSection('package-label-2')?.value}</div>
              <div className="text-2xl font-bold text-slate-900">{getSection('platform-count')?.value}</div>
            </div>
            <div>
              <div className="text-purple-600 font-bold mb-1">{getSection('package-label-3')?.value}</div>
              <div className="text-2xl font-bold text-slate-900">{getSection('stories-count')?.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Responsibilities */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-5-title')?.value}</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-2">
            <div>{getSection('responsibility-1')?.value}</div>
            <div>{getSection('responsibility-2')?.value}</div>
            <div>{getSection('responsibility-3-label')?.value} {getSection('approval-timeframe')?.value} {getSection('responsibility-3-suffix')?.value}</div>
            <div>{getSection('responsibility-4')?.value}</div>
            <div>{getSection('responsibility-5')?.value}</div>
            <div>{getSection('responsibility-6')?.value}</div>
          </div>
        </div>
      </div>

      {/* Content Approval Process */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-6-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-2">
            <div>{getSection('approval-1-label')?.value} {getSection('calendar-submission-day')?.value} {getSection('approval-1-suffix')?.value}</div>
            <div>{getSection('approval-2-label')?.value} {getSection('review-days')?.value} {getSection('approval-2-suffix')?.value}</div>
            <div>{getSection('approval-3-label')?.value} {getSection('revision-days')?.value} {getSection('approval-3-suffix')?.value}</div>
            <div>{getSection('approval-4')?.value}</div>
            <div>{getSection('approval-5-label')?.value} {getSection('revisions-included')?.value} {getSection('approval-5-suffix')?.value}</div>
          </div>
        </div>
      </div>

      {/* Contract Term */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-7-title')?.value}</div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-purple-600 font-bold mb-2">{getSection('term-label-1')?.value}</div>
              <div className="text-xl font-bold text-slate-900">{getSection('start-date')?.value}</div>
            </div>
            <div className="border-x-2 border-purple-200">
              <div className="text-xs text-purple-600 font-bold mb-2">{getSection('term-label-2')?.value}</div>
              <div className="text-xl font-bold text-slate-900">{getSection('contract-length')?.value}</div>
            </div>
            <div>
              <div className="text-xs text-purple-600 font-bold mb-2">{getSection('term-label-3')?.value}</div>
              <div className="text-xl font-bold text-slate-900">{getSection('renewal-type')?.value}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 text-xs text-slate-700 text-center">
            <strong>{getSection('notice-label')?.value}</strong> {getSection('notice-period')?.value} {getSection('notice-suffix')?.value}
          </div>
        </div>
      </div>

      {/* Investment & Payment */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-8-title')?.value}</div>
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center mb-4 shadow-xl">
          <div className="text-sm opacity-90 font-semibold mb-3">{getSection('payment-header')?.value}</div>
          <div className="text-6xl font-bold mb-4">${getSection('monthly-fee')?.value}</div>
          <div className="text-xs opacity-80">{getSection('billing-label')?.value} {getSection('billing-day')?.value} {getSection('billing-suffix')?.value}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-bold text-slate-900 mb-3">{getSection('payment-details-title')?.value}</div>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>{getSection('payment-method-label')?.value}</span>
              <span className="font-bold">{getSection('payment-method')?.value}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>{getSection('payment-due-label')?.value}</span>
              <span className="font-bold">{getSection('payment-due-value')?.value}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>{getSection('late-fee-label')?.value}</span>
              <span className="font-bold">{getSection('late-fee')?.value}{getSection('late-fee-suffix')?.value}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>{getSection('setup-fee-label')?.value}</span>
              <span className="font-bold">${getSection('setup-fee')?.value} {getSection('setup-fee-suffix')?.value}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-9-title')?.value}</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">{getSection('addon-1-title')?.value}</div>
              <div className="text-slate-600">{getSection('addon-1-description')?.value}</div>
            </div>
            <div className="font-bold text-purple-600">${getSection('ads-fee')?.value}/mo</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">{getSection('addon-2-title')?.value}</div>
              <div className="text-slate-600">{getSection('addon-2-description')?.value}</div>
            </div>
            <div className="font-bold text-purple-600">${getSection('photo-fee')?.value}/session</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">{getSection('addon-3-title')?.value}</div>
              <div className="text-slate-600">{getSection('addon-3-description')?.value}</div>
            </div>
            <div className="font-bold text-purple-600">${getSection('video-fee')?.value}/video</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">{getSection('addon-4-title')?.value}</div>
              <div className="text-slate-600">{getSection('addon-4-description')?.value}</div>
            </div>
            <div className="font-bold text-purple-600">${getSection('influencer-fee')?.value}/campaign</div>
          </div>
        </div>
      </div>

      {/* Intellectual Property */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-10-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-3">
            <div>{getSection('ip-1')?.value}</div>
            <div>{getSection('ip-2')?.value}</div>
            <div>{getSection('ip-3')?.value}</div>
            <div>{getSection('ip-4')?.value}</div>
          </div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-11-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed">
            {getSection('confidentiality-text-label')?.value} {getSection('confidentiality-years')?.value} {getSection('confidentiality-suffix')?.value}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-12-title')?.value}</div>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="bg-white rounded p-3 border border-purple-200">
              <strong>{getSection('performance-intro')?.value}</strong><br/>
              {getSection('goal-1-label')?.value} {getSection('growth-target')?.value}{getSection('goal-1-suffix')?.value}<br/>
              {getSection('goal-2-label')?.value} {getSection('engagement-target')?.value}{getSection('goal-2-suffix')?.value}<br/>
              {getSection('goal-3-label')?.value} {getSection('reach-target')?.value}{getSection('goal-3-suffix')?.value}<br/>
              {getSection('goal-4-label')?.value} {getSection('clicks-target')?.value} {getSection('goal-4-suffix')?.value}
            </div>
            <div className="text-xs text-slate-600 mt-2">
              <strong>{getSection('performance-note')?.value}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Termination */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-13-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-700 leading-relaxed space-y-2">
          <div>{getSection('termination-1-label')?.value} {getSection('termination-notice')?.value} {getSection('termination-1-suffix')?.value}</div>
          <div>{getSection('termination-2')?.value}</div>
          <div>{getSection('termination-3')?.value}</div>
          <div>{getSection('termination-4-label')?.value} {getSection('transition-days')?.value} {getSection('termination-4-suffix')?.value}</div>
          <div>{getSection('termination-5-label')?.value} {getSection('early-termination-fee')?.value} {getSection('termination-5-suffix')?.value} {getSection('minimum-term')?.value}</div>
        </div>
      </div>

      {/* Limitation of Liability */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-14-title')?.value}</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
          <div className="text-xs text-slate-700 leading-relaxed space-y-2">
            <div>{getSection('liability-text')?.value}</div>
            <div className="mt-3"><strong>{getSection('liability-limit')?.value}</strong></div>
          </div>
          </div>
      </div>

      {/* General Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">{getSection('section-15-title')?.value}</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-700 leading-relaxed space-y-2">
          <div>{getSection('provision-1-label')?.value} {getSection('jurisdiction')?.value}</div>
          <div>{getSection('provision-2')?.value}</div>
          <div>{getSection('provision-3')?.value}</div>
          <div>{getSection('provision-4')?.value}</div>
          <div>{getSection('provision-5')?.value}</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-purple-600 pt-6">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
          <div className="text-xs text-green-900 leading-relaxed">
            <strong>{getSection('signature-acknowledgment')?.value}</strong>
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mb-6">{getSection('signature-title')?.value}</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-3 border-purple-600 pt-3 mb-3">
              <div className="text-xs text-slate-600 font-semibold">{getSection('client-signature-label')?.value}</div>
            </div>
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-900">{getSection('client-business-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-by-label')?.value} {getSection('client-contact-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-title-label')?.value} {getSection('client-title')?.value}</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                {getSection('client-signature')?.imageUrl ? (
                  <img src={getSection('client-signature')?.imageUrl} alt="Signature" className="h-16" />
                ) : (
                  <div className="text-slate-600">{getSection('signature-line-label')?.value} _______________________</div>
                )}
              </div>
              <div className="text-slate-600">{getSection('signature-date-label')?.value} {getSection('client-signature-date')?.value}</div>
            </div>
          </div>
          <div>
            <div className="border-t-3 border-purple-600 pt-3 mb-3">
              <div className="text-xs text-slate-600 font-semibold">{getSection('manager-signature-label')?.value}</div>
            </div>
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-900">{getSection('manager-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-business-label')?.value} {getSection('manager-business-name')?.value}</div>
              <div className="text-slate-600">{getSection('signature-title-label')?.value} {getSection('manager-title')?.value}</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                {getSection('manager-signature')?.imageUrl ? (
                  <img src={getSection('manager-signature')?.imageUrl} alt="Signature" className="h-16" />
                ) : (
                  <div className="text-slate-600">{getSection('signature-line-label')?.value} _______________________</div>
                )}
              </div>
              <div className="text-slate-600">{getSection('signature-date-label')?.value} {getSection('manager-signature-date')?.value}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">{getSection('footer-title')?.value}</div>
        <div>{getSection('footer-contract-label')?.value} {getSection('contract-id')?.value} | {getSection('footer-generated-label')?.value} {getSection('generated-date')?.value}</div>
        <div className="mt-2 text-purple-600">{getSection('footer-tagline')?.value}</div>
      </div>
    </div>
  );
}
    // SERVICE AGREEMENT PREVIEW
    if (currentTemplate.id === 'service-agreement-001') {
      return (
        <div className="bg-white p-10 text-sm" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: `4px double ${primaryColor}` }}>

            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>{getSection('title')?.value}</div>

            <div className="text-xs text-slate-600">Contract Number: {getSection('contract-number')?.value}</div>
            <div className="text-xs text-slate-600">Effective Date: {getSection('effective-date')?.value}</div>
          </div>

          {/* Parties */}
          <div className="mb-8">
            <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-purple-600 pl-3">PARTIES</div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div style={getColorStyle('gradient')} className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
SP</div>
                <div className="text-base font-bold text-purple-800">SERVICE PROVIDER</div>
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-900 mb-2">{getSection('provider-company')?.value}</div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap">{getSection('provider-details')?.value}</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">CL</div>
                <div className="text-base font-bold text-blue-800">CLIENT</div>
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-900 mb-2">{getSection('client-company')?.value}</div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap">{getSection('client-details')?.value}</div>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">1. SCOPE OF SERVICES</div>
            <div className="bg-slate-50 p-5 rounded-lg">
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{getSection('scope')?.value}</div>
            </div>
          </div>

          {/* Term */}
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">2. TERM</div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border border-purple-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-purple-700 font-bold mb-1">START DATE</div>
                  <div className="text-xl font-bold text-slate-900">{getSection('start-date')?.value}</div>
                </div>
                <div className="border-l-2 border-purple-300">
                  <div className="text-xs text-purple-700 font-bold mb-1">END DATE</div>
                  <div className="text-xl font-bold text-slate-900">{getSection('end-date')?.value}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">3. PAYMENT TERMS</div>
            <div className="bg-slate-50 p-5 rounded-lg">
              <div className="text-xs text-slate-700 mb-2"><strong>Amount:</strong> {getSection('payment-amount')?.value}</div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap">{getSection('payment-terms')?.value}</div>
            </div>
          </div>

          {/* Confidentiality */}
          <div className="mb-8">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">4. CONFIDENTIALITY</div>
            <div className="bg-slate-50 p-5 rounded-lg">
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{getSection('confidentiality')?.value}</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t-4 border-slate-800 pt-6">
            <div className="text-lg font-bold mb-4">SIGNATURES</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="border-t-2 border-slate-800 pt-2 mb-3 text-xs text-slate-600">Service Provider</div>
                {getSection('provider-signature')?.imageUrl && (
                  <img src={getSection('provider-signature')?.imageUrl} alt="Signature" className="h-16" />
                )}
              </div>
              <div>
                <div className="border-t-2 border-slate-800 pt-2 mb-3 text-xs text-slate-600">Client</div>
                {getSection('client-signature')?.imageUrl && (
                  <img src={getSection('client-signature')?.imageUrl} alt="Signature" className="h-16" />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // PAYMENT RECEIPT PREVIEW
    if (currentTemplate.id === 'payment-receipt-001') {
      return (
        <div className="bg-white p-10 text-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div style={getColorStyle('gradient')} className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">

              <div className="text-6xl text-white">✓</div>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>{getSection('title')?.value}</div>

            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold">
              PAID IN FULL
            </div>
          </div>

          {/* Receipt Details */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-600 font-bold mb-1">RECEIPT NUMBER</div>
                <div className="text-xl font-bold text-slate-900">{getSection('receipt-number')?.value}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600 font-bold mb-1">DATE ISSUED</div>
                <div className="text-xl font-bold text-slate-900">{getSection('date')?.value}</div>
              </div>
            </div>
            
            <div className="border-t-2 border-dashed border-slate-300 pt-4">
              <div className="text-xs text-slate-600 font-bold mb-2">RECEIVED FROM:</div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{getSection('received-from')?.value}</div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-8 mb-6 text-center text-white shadow-xl">
            <div className="text-sm opacity-90 font-bold mb-2">AMOUNT PAID</div>
            <div className="text-6xl font-bold mb-2">{getSection('amount')?.value}</div>
            <div className="text-xs opacity-80">USD - United States Dollar</div>
          </div>

          {/* Payment Details */}
          <div className="bg-slate-50 rounded-lg p-5 mb-6 border border-slate-200">
            <div className="text-sm font-bold text-slate-900 mb-3">PAYMENT DETAILS</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600">Payment Method:</span>
                <span className="font-bold text-slate-900">{getSection('payment-method')?.value}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{getSection('transaction-id')?.value}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-slate-600">Reference:</span>
                <span className="font-mono font-bold text-slate-900">{getSection('reference')?.value}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Purpose:</span>
                <span className="font-bold text-slate-900">{getSection('purpose')?.value}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="text-center bg-white border-2 border-slate-200 rounded-lg p-5">
            <div className="font-bold text-slate-900 mb-2">{getSection('company-name')?.value}</div>
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{getSection('company-details')?.value}</div>
          </div>
        </div>
      );
    }

    // BUSINESS PROPOSAL PREVIEW
    if (currentTemplate.id === 'business-proposal-001') {
      return (
        <div className="bg-white text-sm">
          {/* Cover */}
          <div style={getColorStyle('gradient')} className="text-white p-12 text-center min-h-[400px] flex flex-col justify-center">

            <div style={{ fontSize: '3.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>{getSection('title')?.value}</div>

            <div className="w-24 h-1 bg-white mx-auto mb-6 opacity-80"></div>
            <div className="text-3xl font-semibold mb-8">{getSection('project-name')?.value}</div>
            <div className="text-sm opacity-90 space-y-1">
              <div>Prepared for: <strong>{getSection('prepared-for')?.value}</strong></div>
              <div>Prepared by: <strong>{getSection('prepared-by')?.value}</strong></div>
              <div className="mt-4">Date: {getSection('proposal-date')?.value}</div>
              <div>Proposal #: {getSection('proposal-number')?.value}</div>
            </div>
          </div>

          {/* Content */}
          <div className="p-10">
            {/* Executive Summary */}
            <div className="mb-8">
              <div className="text-3xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">EXECUTIVE SUMMARY</div>
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-lg whitespace-pre-wrap">
                {getSection('executive-summary')?.value}
              </div>
            </div>

            {/* Scope */}
            <div className="mb-8">
              <div className="text-3xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">SCOPE OF WORK</div>
              {getSection('scope-phases')?.rows && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        {getSection('scope-phases')!.rows![0].map((header, i) => (
                          <th key={i} className="p-3 text-left font-bold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getSection('scope-phases')!.rows!.slice(1).map((row, i) => (
                        <tr key={i} className="border-b border-slate-200 bg-white hover:bg-slate-50">
                          {row.map((cell, j) => (
                            <td key={j} className="p-3">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mb-8">
              <div className="text-3xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">PROJECT TIMELINE</div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-2">START DATE</div>
                    <div className="text-2xl font-bold text-slate-900">{getSection('start-date')?.value}</div>
                  </div>
                  <div className="border-x border-blue-200">
                    <div className="text-xs text-blue-600 font-bold mb-2">DURATION</div>
                    <div className="text-2xl font-bold text-slate-900">{getSection('duration')?.value}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-2">COMPLETION</div>
                    <div className="text-2xl font-bold text-slate-900">{getSection('completion-date')?.value}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment */}
            <div className="mb-8">
              <div className="text-3xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">INVESTMENT</div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-10 text-white text-center shadow-2xl">
                <div className="text-sm opacity-90 font-bold mb-3">TOTAL PROJECT INVESTMENT</div>
                <div className="text-7xl font-bold mb-4">{getSection('investment')?.value}</div>
                <div className="text-xs opacity-80">{getSection('payment-terms')?.value}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t-2 border-slate-300 pt-6">
              <div className="text-2xl font-bold text-slate-900 mb-6">ACCEPTANCE</div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="border-t-2 border-slate-800 pt-3 mb-3 text-xs text-slate-600">Proposed By</div>
                  {getSection('proposer-signature')?.imageUrl && (
                    <img src={getSection('proposer-signature')?.imageUrl} alt="Signature" className="h-16" />
                  )}
                </div>
                <div>
                  <div className="border-t-2 border-slate-800 pt-3 mb-3 text-xs text-slate-600">Accepted By</div>
                  {getSection('acceptor-signature')?.imageUrl && (
                    <img src={getSection('acceptor-signature')?.imageUrl} alt="Signature" className="h-16" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // FREELANCE CONTRACT PREVIEW
    if (currentTemplate.id === 'freelance-contract-001') {
      return (
        <div className="bg-white p-10 text-sm">
          {/* Header */}
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: `4px solid ${primaryColor}` }}>

            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: primaryColor, marginBottom: '0.5rem' }}>{getSection('title')?.value}</div>

            <div className="text-xs text-slate-600">Independent Contractor Services Agreement</div>
            <div className="mt-3 inline-block bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-xs font-bold">
              CONTRACT ID: {getSection('contract-id')?.value}
            </div>
          </div>

          {/* Date */}
          <div className="bg-teal-50 border-l-4 border-teal-600 p-4 mb-6 rounded-r-lg">
            <div className="text-xs text-slate-700">
              This Agreement is entered into as of <strong>{getSection('agreement-date')?.value}</strong>
            </div>
          </div>

          {/* Parties */}
          <div className="mb-8">
            <div className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-teal-600 pl-3">CONTRACTING PARTIES</div>
            
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
                <div>
                  <div className="text-base font-bold text-teal-800">CLIENT</div>
                  <div className="text-xs text-slate-600">(Party receiving services)</div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {getSection('client-name')?.value}</div>
                <div><strong>Company:</strong> {getSection('client-company')?.value}</div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap">{getSection('client-details')?.value}</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">F</div>
                <div>
                  <div className="text-base font-bold text-cyan-800">FREELANCER</div>
                  <div className="text-xs text-slate-600">(Independent contractor)</div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {getSection('freelancer-name')?.value}</div>
                <div><strong>Business:</strong> {getSection('freelancer-business')?.value}</div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap">{getSection('freelancer-details')?.value}</div>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">1. SCOPE OF WORK</div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{getSection('scope-of-work')?.value}</div>
            </div>
          </div>

          {/* Deliverables */}
          {getSection('deliverables')?.rows && (
            <div className="mb-6">
              <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">2. DELIVERABLES</div>
              <table className="w-full text-xs">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    {getSection('deliverables')!.rows![0].map((header, i) => (
                      <th key={i} className="p-3 text-left font-bold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getSection('deliverables')!.rows!.slice(1).map((row, i) => (
                    <tr key={i} className="border-b border-slate-200">
                      {row.map((cell, j) => (
                        <td key={j} className="p-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Timeline */}
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">3. PROJECT TIMELINE</div>
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-lg p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-teal-600 font-bold mb-2">START DATE</div>
                  <div className="text-xl font-bold text-slate-900">{getSection('start-date')?.value}</div>
                </div>
                <div className="border-x-2 border-teal-200">
                  <div className="text-xs text-teal-600 font-bold mb-2">DURATION</div>
                  <div className="text-xl font-bold text-slate-900">{getSection('duration')?.value}</div>
                </div>
                <div>
                  <div className="text-xs text-teal-600 font-bold mb-2">END DATE</div>
                  <div className="text-xl font-bold text-slate-900">{getSection('end-date')?.value}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="mb-8">
            <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">4. COMPENSATION & PAYMENT</div>
            <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl p-8 text-white text-center mb-4 shadow-xl">
              <div className="text-sm opacity-90 font-bold mb-2">TOTAL PROJECT FEE</div>
              <div className="text-6xl font-bold mb-2">{getSection('total-fee')?.value}</div>
              <div className="text-xs opacity-80">USD - United States Dollar</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="text-sm font-bold text-slate-900 mb-3">Payment Schedule:</div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{getSection('payment-schedule')?.value}</div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t-4 border-teal-600 pt-6">
            <div className="text-xl font-bold text-slate-900 mb-4">AGREEMENT ACCEPTANCE</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="border-t-2 border-slate-800 pt-3 mb-3 text-xs text-slate-600 font-bold">FREELANCER SIGNATURE</div>
                {getSection('freelancer-signature')?.imageUrl && (
                  <img src={getSection('freelancer-signature')?.imageUrl} alt="Signature" className="h-16" />
                )}
              </div>
              <div>
                <div className="border-t-2 border-slate-800 pt-3 mb-3 text-xs text-slate-600 font-bold">CLIENT SIGNATURE</div>
                {getSection('client-signature')?.imageUrl && (
                  <img src={getSection('client-signature')?.imageUrl} alt="Signature" className="h-16" />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Template Selector Screen
  if (showTemplateSelector || !currentTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">📋 Professional Templates</h1>
            <p className="text-xl text-gray-600">Choose from our collection of beautifully designed templates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-indigo-500 transform hover:-translate-y-2"
              >
                <div className="p-8">
                  {template.popular && (
                    <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                      ⭐ POPULAR
                    </div>
                  )}
                  <div className="text-6xl mb-4">{template.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.fields.slice(0, 3).map((field, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {field}
                      </span>
                    ))}
                    {template.fields.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{template.fields.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                    <span>Use Template</span>
                    <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Editor Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />
      
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Templates</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentTemplate.name}</h1>
                <p className="text-xs text-gray-500">{currentTemplate.description}</p>
              </div>
            </div>
<div className="flex items-center gap-3">
  <button
    onClick={() => setShowColorPicker(!showColorPicker)}
    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
  >
    <div className="flex gap-1">
      <div className="w-5 h-5 rounded border-2 border-white shadow" style={{ backgroundColor: primaryColor }}></div>
      <div className="w-5 h-5 rounded border-2 border-white shadow" style={{ backgroundColor: secondaryColor }}></div>
    </div>
    <span className="font-semibold">Colors</span>
  </button>
  <button 
    onClick={handleDownload}
    className="flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
    style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
  >
    <Download className="h-4 w-4" />
    <span className="font-semibold">Download HTML</span>
  </button>
</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* EDITOR PANEL */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Edit2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Content</h2>
                <p className="text-sm text-gray-500">Customize all document fields</p>
              </div>
            </div>

            {showColorPicker && (
  <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
    <h3 className="text-sm font-bold text-gray-900 mb-4">🎨 Customize Template Colors</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Primary Color */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Primary Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="#4f46e5"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setPrimaryColor('#4f46e5')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#4f46e5'}}></button>
          <button onClick={() => setPrimaryColor('#2563eb')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#2563eb'}}></button>
          <button onClick={() => setPrimaryColor('#dc2626')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#dc2626'}}></button>
          <button onClick={() => setPrimaryColor('#16a34a')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#16a34a'}}></button>
          <button onClick={() => setPrimaryColor('#9333ea')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#9333ea'}}></button>
          <button onClick={() => setPrimaryColor('#ea580c')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#ea580c'}}></button>
        </div>
      </div>
      
      {/* Secondary Color */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Secondary Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
          />
          <input
            type="text"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="#8b5cf6"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setSecondaryColor('#8b5cf6')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#8b5cf6'}}></button>
          <button onClick={() => setSecondaryColor('#3b82f6')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#3b82f6'}}></button>
          <button onClick={() => setSecondaryColor('#ef4444')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#ef4444'}}></button>
          <button onClick={() => setSecondaryColor('#22c55e')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#22c55e'}}></button>
          <button onClick={() => setSecondaryColor('#a855f7')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#a855f7'}}></button>
          <button onClick={() => setSecondaryColor('#f97316')} className="w-8 h-8 rounded-lg border-2 border-gray-300" style={{backgroundColor: '#f97316'}}></button>
        </div>
      </div>
    </div>
    <div className="mt-4">
      <button
        onClick={() => { setPrimaryColor('#4f46e5'); setSecondaryColor('#8b5cf6'); }}
        className="text-xs px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        Reset to Default
      </button>
    </div>
  </div>
)}
            
            {currentTemplate.sections.map((section) => (
              <div key={section.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-indigo-500">•</span>
                    {section.label}
                  </label>
                  
                  {section.type === 'text' && (
                    <button
                      onClick={() => startEdit(section)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  
                  {section.type === 'logo' && (
                    <button
                      onClick={() => handleLogoUpload(section.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                    >
                      <Image className="h-3.5 w-3.5" />
                      Upload
                    </button>
                  )}
                  
                  {section.type === 'signature' && (
                    <button
                      onClick={() => setShowSignatureModal(section.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      Sign
                    </button>
                  )}
                </div>

                {/* TEXT FIELD */}
                {section.type === 'text' && (
                  editingSection === section.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700">
                      {section.value || 'No content yet'}
                    </div>
                  )
                )}

                {/* LOGO PREVIEW */}
                {section.type === 'logo' && (
                  <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 hover:border-green-400 transition">
                    {section.imageUrl ? (
                      <img src={section.imageUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center">
                        <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">Click Upload</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TABLE */}
                {section.type === 'table' && section.rows && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto bg-gray-50 rounded-lg p-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-indigo-600 text-white">
                            {section.rows[0].map((header, i) => (
                              <th key={i} className="p-2 text-left font-semibold first:rounded-l-lg last:rounded-r-lg">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-gray-200">
                              {row.map((cell, colIndex) => (
                                <td key={colIndex} className="p-2">
                                  <textarea
                                    value={cell}
                                    onChange={(e) => updateTableCell(section.id, rowIndex + 1, colIndex, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                    rows={2}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addTableRow(section.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition"
                      >
                        <Plus className="h-4 w-4" />
                        Add Row
                      </button>
                      <button
                        onClick={() => removeTableRow(section.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition"
                      >
                        <Minus className="h-4 w-4" />
                        Remove Row
                      </button>
                    </div>
                  </div>
                )}

                {/* SIGNATURE PREVIEW */}
                {section.type === 'signature' && (
                  <div className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 hover:border-purple-400 transition">
                    {section.imageUrl ? (
                      <img src={section.imageUrl} alt="Signature" className="max-w-full max-h-full p-2" />
                    ) : (
                      <div className="text-center">
                        <PenTool className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">Click Sign to add</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PREVIEW PANEL */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Live Preview</h2>
                <p className="text-sm text-gray-500">See your changes in real-time</p>
              </div>
            </div>
            
            <div id="document-preview" className="shadow-2xl rounded-2xl border border-gray-200 overflow-hidden">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <PenTool className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Your Signature</h2>
                  <p className="text-sm text-gray-500">Draw your signature with your mouse</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSignatureModal(null)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="border-2 border-gray-300 rounded-xl mb-6 bg-gray-50">
              <canvas
                ref={signatureCanvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair rounded-xl"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={clearSignature} 
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
              >
                Clear Canvas
              </button>
              <button 
                onClick={saveSignature} 
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg transition"
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}