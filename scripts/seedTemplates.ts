


import path from "path";
import dotenv from "dotenv";

// ✅ CRITICAL: Load environment variables BEFORE any imports that use them
const envPath = path.resolve(process.cwd(), ".env.local");
console.log('📁 Loading environment from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
  process.exit(1);
}

// Debug: Verify MONGODB_URI is loaded
console.log('🔍 MONGODB_URI loaded:', process.env.MONGODB_URI ? '✓ Yes' : '✗ No');
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

console.log('---\n');

// ✅ FIX: Use dynamic import AFTER loading env vars

 const professionalTemplates = [
  // 1. PROFESSIONAL INVOICE
  {
    name: 'Professional Invoice',
    description: 'Modern business invoice with automatic calculations and itemized billing',
    category: 'invoices',
    icon: '💰',
    color: 'from-blue-500 to-blue-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'companyName', label: 'Your Company Name', type: 'text', required: true, placeholder: 'Acme Corporation' },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true, placeholder: '123 Business Street\nCity, State 12345' },
      { id: 'companyEmail', label: 'Email', type: 'email', required: true, placeholder: 'billing@company.com' },
      { id: 'companyPhone', label: 'Phone', type: 'text', required: true, placeholder: '+1 (555) 123-4567' },
      { id: 'companyWebsite', label: 'Website', type: 'text', required: false, placeholder: 'www.company.com' },
      { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true, placeholder: 'INV-2024-001' },
      { id: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { id: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true, placeholder: 'Client Company Inc.' },
      { id: 'clientAddress', label: 'Client Address', type: 'textarea', required: true, placeholder: '456 Client Avenue\nCity, State 54321' },
      { id: 'clientEmail', label: 'Client Email', type: 'email', required: false, placeholder: 'contact@client.com' },
      { id: 'items', label: 'Invoice Items', type: 'table', required: true },
      { id: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: false, placeholder: '10' },
      { id: 'discount', label: 'Discount (%)', type: 'number', required: false, placeholder: '5' },
      { id: 'notes', label: 'Payment Terms/Notes', type: 'textarea', required: false, placeholder: 'Payment due within 30 days.' }
    ],
    htmlTemplate: `
      <div class="header" style="border-bottom: 4px solid #1e40af; padding-bottom: 25px; margin-bottom: 35px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h1 style="color: #1e40af; margin: 0 0 20px 0; font-size: 48px; font-weight: 700;">INVOICE</h1>
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 18px;">{{companyName}}</h3>
              <p style="margin: 5px 0; color: #475569; white-space: pre-line; font-size: 13px;">{{companyAddress}}</p>
              <p style="margin: 5px 0; color: #475569; font-size: 13px;">{{companyEmail}} | {{companyPhone}}</p>
              {{#if companyWebsite}}<p style="margin: 5px 0; color: #3b82f6; font-size: 13px;">{{companyWebsite}}</p>{{/if}}
            </div>
          </div>
          <div style="text-align: right; min-width: 250px;">
            <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Invoice Number</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{invoiceNumber}}</p>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;"><strong>Issue Date:</strong> {{invoiceDate}}</p>
              <p style="margin: 0; color: #dc2626; font-size: 12px;"><strong>Due Date:</strong> {{dueDate}}</p>
            </div>
          </div>
        </div>
      </div>

      <div style="margin: 35px 0;">
        <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 15px;">BILL TO</h3>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b;">{{clientName}}</p>
          <p style="margin: 5px 0; color: #475569; white-space: pre-line; font-size: 13px;">{{clientAddress}}</p>
          {{#if clientEmail}}<p style="margin: 5px 0; color: #475569; font-size: 13px;">{{clientEmail}}</p>{{/if}}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 35px 0;">
        <thead>
          <tr>
            <th style="background-color: #1e40af; color: white; padding: 16px; text-align: left; font-size: 13px; border: none;">#</th>
            <th style="background-color: #1e40af; color: white; padding: 16px; text-align: left; font-size: 13px; border: none;">Description</th>
            <th style="background-color: #1e40af; color: white; padding: 16px; text-align: right; font-size: 13px; border: none; width: 150px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr style="{{#if @even}}background-color: #f8fafc;{{/if}}">
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">{{@index}}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">{{this.item}}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">\${{this.amount}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 40px;">
        <div style="display: inline-block; min-width: 350px;">
          <div style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b;">Subtotal:</span>
            <span style="margin-left: 40px; font-weight: 600;">\${{subtotal}}</span>
          </div>
          {{#if taxRate}}
          <div style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b;">Tax ({{taxRate}}%):</span>
            <span style="margin-left: 40px; font-weight: 600;">\${{tax}}</span>
          </div>
          {{/if}}
          <div style="padding: 20px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px; margin-top: 10px;">
            <span style="color: white; font-size: 18px; font-weight: 600;">TOTAL DUE:</span>
            <span style="margin-left: 40px; color: white; font-size: 32px; font-weight: 700;">\${{total}}</span>
          </div>
        </div>
      </div>

      {{#if notes}}
      <div style="margin-top: 50px; padding: 25px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; color: #92400e;">PAYMENT TERMS & NOTES</h4>
        <p style="margin: 0; color: #78350f; white-space: pre-line;">{{notes}}</p>
      </div>
      {{/if}}
    `,
    downloads: 2847,
    rating: 4.9
  },

  // 2. SERVICE AGREEMENT
  {
    name: 'Service Agreement',
    description: 'Professional service contract with terms and signature sections',
    category: 'contracts',
    icon: '📋',
    color: 'from-purple-500 to-purple-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'agreementDate', label: 'Agreement Date', type: 'date', required: true },
      { id: 'providerName', label: 'Service Provider Name', type: 'text', required: true },
      { id: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true },
      { id: 'clientAddress', label: 'Client Address', type: 'textarea', required: true },
      { id: 'servicesDescription', label: 'Services Description', type: 'textarea', required: true },
      { id: 'startDate', label: 'Start Date', type: 'date', required: true },
      { id: 'endDate', label: 'End Date', type: 'date', required: false },
      { id: 'paymentAmount', label: 'Payment Amount', type: 'text', required: true },
      { id: 'paymentTerms', label: 'Payment Terms', type: 'textarea', required: true }
    ],
    htmlTemplate: `
      <div class="header">
        <h1 style="text-align: center; color: #7c3aed;">SERVICE AGREEMENT</h1>
        <p style="text-align: center; color: #666;">Effective Date: {{agreementDate}}</p>
      </div>

      <div style="margin: 30px 0;">
        <p>This Service Agreement is entered into as of <strong>{{agreementDate}}</strong> by and between:</p>
        
        <div class="info-box">
          <p><strong>SERVICE PROVIDER:</strong><br>{{providerName}}<br>{{providerAddress}}</p>
        </div>

        <p style="text-align: center; margin: 20px 0;"><strong>AND</strong></p>

        <div class="info-box">
          <p><strong>CLIENT:</strong><br>{{clientName}}<br>{{clientAddress}}</p>
        </div>
      </div>

      <h2>1. Services</h2>
      <p style="white-space: pre-line;">{{servicesDescription}}</p>

      <h2>2. Term</h2>
      <p>This Agreement shall commence on <strong>{{startDate}}</strong>{{#if endDate}} and continue until <strong>{{endDate}}</strong>{{else}} until terminated{{/if}}.</p>

      <h2>3. Compensation</h2>
      <p>Client agrees to pay Service Provider <strong>{{paymentAmount}}</strong>.</p>
      <p><strong>Payment Terms:</strong> {{paymentTerms}}</p>

      <div style="margin-top: 80px;">
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Service Provider:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{providerName}}<br>Date: ______________</p>
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Client:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{clientName}}<br>Date: ______________</p>
            </td>
          </tr>
        </table>
      </div>
    `,
    downloads: 1654,
    rating: 4.7
  },

  // 3. BUSINESS PROPOSAL
  {
    name: 'Business Proposal',
    description: 'Professional project proposal with scope, timeline, and pricing',
    category: 'proposals',
    icon: '📊',
    color: 'from-green-500 to-green-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'proposalTitle', label: 'Proposal Title', type: 'text', required: true },
      { id: 'proposalDate', label: 'Proposal Date', type: 'date', required: true },
      { id: 'companyName', label: 'Your Company Name', type: 'text', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true },
      { id: 'executiveSummary', label: 'Executive Summary', type: 'textarea', required: true },
      { id: 'projectScope', label: 'Project Scope', type: 'textarea', required: true },
      { id: 'timeline', label: 'Project Timeline', type: 'textarea', required: true },
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', required: true },
      { id: 'investmentAmount', label: 'Investment Amount', type: 'text', required: true },
      { id: 'validUntil', label: 'Valid Until', type: 'date', required: true }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 40px 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin: -40px -50px 40px -50px;">
        <h1 style="margin: 0; font-size: 42px; color: white;">{{proposalTitle}}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Prepared for {{clientName}}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">{{proposalDate}}</p>
      </div>

      <div class="info-box" style="background: #d1fae5; border-left-color: #10b981;">
        <p style="margin: 0; color: #065f46;"><strong>Presented by:</strong> {{companyName}}</p>
        <p style="margin: 5px 0 0 0; color: #065f46; font-size: 12px;">Valid until: {{validUntil}}</p>
      </div>

      <h2 style="color: #059669;">Executive Summary</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{executiveSummary}}</p>

      <h2 style="color: #059669;">Project Scope</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{projectScope}}</p>

      <h2 style="color: #059669;">Timeline</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{timeline}}</p>

      <h2 style="color: #059669;">Deliverables</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{deliverables}}</p>

      <div class="total-section" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-color: #10b981;">
        <h2 style="margin: 0 0 10px 0; color: #065f46;">Investment Required</h2>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #047857;">{{investmentAmount}}</p>
      </div>

      <div style="margin-top: 60px; text-align: center; padding: 30px; background: #f0fdf4; border-radius: 8px;">
        <p style="margin: 0; font-size: 16px; color: #065f46; font-weight: 600;">Ready to move forward?</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #047857;">Contact us to get started on this exciting project!</p>
      </div>
    `,
    downloads: 1234,
    rating: 4.8
  },

  // 4. PAYMENT RECEIPT
  {
    name: 'Payment Receipt',
    description: 'Simple payment confirmation receipt for transactions',
    category: 'invoices',
    icon: '🧾',
    color: 'from-cyan-500 to-cyan-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'receiptNumber', label: 'Receipt Number', type: 'text', required: true },
      { id: 'receiptDate', label: 'Receipt Date', type: 'date', required: true },
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { id: 'paymentAmount', label: 'Payment Amount', type: 'text', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Check', 'PayPal'] },
      { id: 'paymentFor', label: 'Payment For', type: 'textarea', required: true },
      { id: 'transactionId', label: 'Transaction ID', type: 'text', required: false }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; margin: -40px -50px 30px -50px;">
        <h1 style="margin: 0; font-size: 36px; color: white;">PAYMENT RECEIPT</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">Receipt #{{receiptNumber}}</p>
      </div>

      <div class="info-box" style="background: #cffafe; border-left-color: #06b6d4;">
        <h3 style="margin: 0 0 10px 0; color: #164e63;">{{companyName}}</h3>
        <p style="margin: 0; color: #0e7490; white-space: pre-line;">{{companyAddress}}</p>
      </div>

      <table style="width: 100%; margin: 30px 0; border: none;">
        <tr style="border: none;">
          <td style="border: none; width: 50%; padding: 10px 0;"><strong>Receipt Date:</strong></td>
          <td style="border: none; padding: 10px 0;">{{receiptDate}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none; padding: 10px 0;"><strong>Received From:</strong></td>
          <td style="border: none; padding: 10px 0;">{{customerName}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none; padding: 10px 0;"><strong>Payment Method:</strong></td>
          <td style="border: none; padding: 10px 0;">{{paymentMethod}}</td>
        </tr>
        {{#if transactionId}}
        <tr style="border: none;">
          <td style="border: none; padding: 10px 0;"><strong>Transaction ID:</strong></td>
          <td style="border: none; padding: 10px 0;">{{transactionId}}</td>
        </tr>
        {{/if}}
      </table>

      <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; border: 2px solid #06b6d4; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; color: #164e63; font-weight: 600;">Payment For:</p>
        <p style="margin: 0; color: #0e7490; white-space: pre-line;">{{paymentFor}}</p>
      </div>

      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 12px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; color: white; font-size: 16px;">AMOUNT PAID</p>
        <p style="margin: 0; color: white; font-size: 48px; font-weight: 700;">{{paymentAmount}}</p>
      </div>

      <div style="text-align: center; margin-top: 50px; padding: 20px; background: #f0fdfa; border-radius: 8px;">
        <p style="margin: 0; color: #0e7490; font-size: 18px; font-weight: 600;">✓ Payment Received Successfully</p>
        <p style="margin: 10px 0 0 0; color: #164e63; font-size: 13px;">Thank you for your payment!</p>
      </div>
    `,
    downloads: 1987,
    rating: 4.6
  },

  // 5. NDA AGREEMENT
  {
    name: 'NDA Agreement',
    description: 'Non-disclosure agreement to protect confidential information',
    category: 'contracts',
    icon: '🔒',
    color: 'from-red-500 to-red-600',
    popular: false,
    isPublic: true,
    fields: [
      { id: 'agreementDate', label: 'Agreement Date', type: 'date', required: true },
      { id: 'party1Name', label: 'First Party Name', type: 'text', required: true },
      { id: 'party1Address', label: 'First Party Address', type: 'textarea', required: true },
      { id: 'party2Name', label: 'Second Party Name', type: 'text', required: true },
      { id: 'party2Address', label: 'Second Party Address', type: 'textarea', required: true },
      { id: 'purposeDescription', label: 'Purpose of Disclosure', type: 'textarea', required: true },
      { id: 'agreementDuration', label: 'Agreement Duration (years)', type: 'number', required: true, placeholder: '2' },
      { id: 'effectiveDate', label: 'Effective Date', type: 'date', required: true }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; margin: -40px -50px 30px -50px;">
        <h1 style="margin: 0; font-size: 36px; color: white;">NON-DISCLOSURE AGREEMENT</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Confidential & Legally Binding</p>
      </div>

      <p style="text-align: center; font-size: 14px; color: #991b1b; font-weight: 600;">Effective Date: {{effectiveDate}}</p>

      <div class="info-box" style="background: #fee2e2; border-left-color: #dc2626;">
        <p style="margin: 0; color: #991b1b;">This Non-Disclosure Agreement is entered into on <strong>{{agreementDate}}</strong> between:</p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #b91c1c;">DISCLOSING PARTY:</h3>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-weight: 600; color: #7f1d1d;">{{party1Name}}</p>
          <p style="margin: 5px 0 0 0; color: #991b1b; white-space: pre-line; font-size: 13px;">{{party1Address}}</p>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #b91c1c;">RECEIVING PARTY:</h3>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-weight: 600; color: #7f1d1d;">{{party2Name}}</p>
          <p style="margin: 5px 0 0 0; color: #991b1b; white-space: pre-line; font-size: 13px;">{{party2Address}}</p>
        </div>
      </div>

      <h2 style="color: #b91c1c;">1. Purpose</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{purposeDescription}}</p>

      <h2 style="color: #b91c1c;">2. Confidential Information</h2>
      <p>The Receiving Party acknowledges that all information disclosed by the Disclosing Party, whether written, oral, or electronic, is confidential and proprietary.</p>

      <h2 style="color: #b91c1c;">3. Obligations</h2>
      <p>The Receiving Party agrees to:</p>
      <ul>
        <li>Keep all Confidential Information strictly confidential</li>
        <li>Not disclose any Confidential Information to third parties</li>
        <li>Use the Confidential Information solely for the stated purpose</li>
        <li>Return or destroy all Confidential Information upon request</li>
      </ul>

      <h2 style="color: #b91c1c;">4. Term</h2>
      <p>This Agreement shall remain in effect for <strong>{{agreementDuration}} years</strong> from the Effective Date.</p>

      <div style="margin-top: 80px;">
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Disclosing Party:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{party1Name}}<br>Date: ______________</p>
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Receiving Party:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{party2Name}}<br>Date: ______________</p>
            </td>
          </tr>
        </table>
      </div>
    `,
    downloads: 876,
    rating: 4.5
  },

  // 6. QUOTATION
  {
    name: 'Price Quotation',
    description: 'Professional price quote for products or services',
    category: 'invoices',
    icon: '💵',
    color: 'from-yellow-500 to-yellow-600',
    popular: false,
    isPublic: true,
    fields: [
      { id: 'quoteNumber', label: 'Quote Number', type: 'text', required: true },
      { id: 'quoteDate', label: 'Quote Date', type: 'date', required: true },
      { id: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { id: 'companyName', label: 'Your Company Name', type: 'text', required: true },
      { id: 'companyEmail', label: 'Email', type: 'email', required: true },
      { id: 'companyPhone', label: 'Phone', type: 'text', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true },
      { id: 'clientEmail', label: 'Client Email', type: 'email', required: false },
      { id: 'items', label: 'Quoted Items', type: 'table', required: true },
      { id: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: false },
      { id: 'notes', label: 'Terms & Conditions', type: 'textarea', required: false }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: white; margin: -40px -50px 30px -50px;">
        <h1 style="margin: 0; font-size: 42px; color: white;">QUOTATION</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Quote #{{quoteNumber}}</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="flex: 1;">
          <div class="info-box" style="background: #fef9c3; border-left-color: #eab308;">
            <h3 style="margin: 0 0 10px 0; color: #854d0e;">{{companyName}}</h3>
            <p style="margin: 5px 0; color: #a16207; font-size: 13px;">{{companyEmail}}</p>
            <p style="margin: 5px 0; color: #a16207; font-size: 13px;">{{companyPhone}}</p>
          </div>
        </div>
        <div style="text-align: right; min-width: 200px; padding-left: 20px;">
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 2px solid #eab308;">
            <p style="margin: 0; font-size: 12px; color: #854d0e;"><strong>Quote Date:</strong></p>
            <p style="margin: 5px 0; color: #a16207;">{{quoteDate}}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #dc2626;"><strong>Valid Until:</strong></p>
            <p style="margin: 5px 0; color: #dc2626; font-weight: 600;">{{validUntil}}</p>
          </div>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #854d0e;">PREPARED FOR:</h3>
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #eab308;">
          <p style="margin: 0; font-weight: 600; color: #78350f;">{{clientName}}</p>
          {{#if clientEmail}}<p style="margin: 5px 0; color: #92400e;">{{clientEmail}}</p>{{/if}}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin: 35px 0;">
        <thead>
          <tr>
            <th style="background-color: #eab308; color: white; padding: 16px; text-align: left; border: none;">#</th>
            <th style="background-color: #eab308; color: white; padding: 16px; text-align: left; border: none;">Item / Service</th>
            <th style="background-color: #eab308; color: white; padding: 16px; text-align: right; border: none; width: 150px;">Price</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr style="{{#if @even}}background-color: #fffbeb;{{/if}}">
            <td style="padding: 14px 16px; border-bottom: 1px solid #fde68a;">{{@index}}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #fde68a;">{{this.item}}</td>
            <td style="padding: 14px 16px; border-bottom: 1px solid #fde68a; text-align: right; font-weight: 600;">\${{this.amount}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 40px;">
        <div style="display: inline-block; min-width: 350px;">
          <div style="padding: 12px 20px; border-bottom: 1px solid #fde68a;">
            <span style="color: #92400e;">Subtotal:</span>
            <span style="margin-left: 40px; font-weight: 600; color: #78350f;">\${{subtotal}}</span>
          </div>
          {{#if taxRate}}
          <div style="padding: 12px 20px; border-bottom: 1px solid #fde68a;">
            <span style="color: #92400e;">Tax ({{taxRate}}%):</span>
            <span style="margin-left: 40px; font-weight: 600; color: #78350f;">\${{tax}}</span>
          </div>
          {{/if}}
          <div style="padding: 20px; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); border-radius: 8px; margin-top: 10px;">
            <span style="color: white; font-size: 18px; font-weight: 600;">TOTAL QUOTE:</span>
            <span style="margin-left: 40px; color: white; font-size: 32px; font-weight: 700;">\${{total}}</span>
          </div>
        </div>
      </div>

      {{#if notes}}
      <div style="margin-top: 50px; padding: 25px; background: #fef3c7; border-left: 4px solid #eab308; border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; color: #854d0e;">TERMS & CONDITIONS</h4>
        <p style="margin: 0; color: #92400e; white-space: pre-line;">{{notes}}</p>
      </div>
      {{/if}}

      <div style="text-align: center; margin-top: 50px; padding: 20px; background: #fffbeb; border-radius: 8px; border: 2px dashed #eab308;">
        <p style="margin: 0; color: #854d0e; font-size: 16px; font-weight: 600;">This quote is valid until {{validUntil}}</p>
        <p style="margin: 10px 0 0 0; color: #92400e; font-size: 13px;">Contact us to accept this quotation and proceed</p>
      </div>
    `,
    downloads: 743,
    rating: 4.4
  },

  // 7. MONTHLY REPORT
  {
    name: 'Monthly Report',
    description: 'Business performance report with metrics and analysis',
    category: 'reports',
    icon: '📈',
    color: 'from-indigo-500 to-indigo-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'reportTitle', label: 'Report Title', type: 'text', required: true, placeholder: 'Monthly Performance Report' },
      { id: 'reportMonth', label: 'Report Month/Year', type: 'text', required: true, placeholder: 'January 2024' },
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      { id: 'preparedBy', label: 'Prepared By', type: 'text', required: true },
      { id: 'executiveSummary', label: 'Executive Summary', type: 'textarea', required: true },
      { id: 'keyMetrics', label: 'Key Metrics', type: 'textarea', required: true },
      { id: 'achievements', label: 'Key Achievements', type: 'textarea', required: true },
      { id: 'challenges', label: 'Challenges Faced', type: 'textarea', required: false },
      { id: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { id: 'reportDate', label: 'Report Date', type: 'date', required: true }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; margin: -40px -50px 40px -50px;">
        <h1 style="margin: 0; font-size: 42px; color: white;">{{reportTitle}}</h1>
        <p style="margin: 15px 0 5px 0; font-size: 24px; opacity: 0.95;">{{reportMonth}}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.85;">{{companyName}}</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #eef2ff; border-radius: 8px;">
        <div>
          <p style="margin: 0; color: #4338ca; font-size: 13px;">Prepared by:</p>
          <p style="margin: 5px 0 0 0; color: #3730a3; font-weight: 600;">{{preparedBy}}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #4338ca; font-size: 13px;">Report Date:</p>
          <p style="margin: 5px 0 0 0; color: #3730a3; font-weight: 600;">{{reportDate}}</p>
        </div>
      </div>

      <h2 style="color: #4f46e5;">📊 Executive Summary</h2>
      <div class="info-box" style="background: #f5f3ff; border-left-color: #6366f1;">
        <p style="margin: 0; color: #3730a3; white-space: pre-line; line-height: 1.8;">{{executiveSummary}}</p>
      </div>

      <h2 style="color: #4f46e5;">📈 Key Metrics</h2>
      <div style="background: #faf5ff; padding: 20px; border-radius: 8px; border: 2px solid #a78bfa;">
        <p style="margin: 0; color: #5b21b6; white-space: pre-line; line-height: 1.8;">{{keyMetrics}}</p>
      </div>

      <h2 style="color: #4f46e5;">✨ Key Achievements</h2>
      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #065f46; white-space: pre-line; line-height: 1.8;">{{achievements}}</p>
      </div>

      {{#if challenges}}
      <h2 style="color: #4f46e5;">⚠️ Challenges Faced</h2>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #991b1b; white-space: pre-line; line-height: 1.8;">{{challenges}}</p>
      </div>
      {{/if}}

      <h2 style="color: #4f46e5;">💡 Recommendations</h2>
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e3a8a; white-space: pre-line; line-height: 1.8;">{{recommendations}}</p>
      </div>

      <div style="margin-top: 60px; text-align: center; padding: 30px; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-radius: 12px;">
        <p style="margin: 0; color: #4338ca; font-size: 16px; font-weight: 600;">End of Report</p>
        <p style="margin: 10px 0 0 0; color: #6366f1; font-size: 13px;">{{reportMonth}} - {{companyName}}</p>
      </div>
    `,
    downloads: 1432,
    rating: 4.7
  },

  // 8. EMPLOYMENT CONTRACT
  {
    name: 'Employment Contract',
    description: 'Standard employment agreement with terms and conditions',
    category: 'contracts',
    icon: '👔',
    color: 'from-pink-500 to-pink-600',
    popular: false,
    isPublic: true,
    fields: [
      { id: 'contractDate', label: 'Contract Date', type: 'date', required: true },
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      { id: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
      { id: 'employeeName', label: 'Employee Name', type: 'text', required: true },
      { id: 'employeeAddress', label: 'Employee Address', type: 'textarea', required: true },
      { id: 'jobTitle', label: 'Job Title', type: 'text', required: true },
      { id: 'startDate', label: 'Start Date', type: 'date', required: true },
      { id: 'salary', label: 'Annual Salary', type: 'text', required: true },
      { id: 'workingHours', label: 'Working Hours', type: 'text', required: true, placeholder: '40 hours per week' },
      { id: 'probationPeriod', label: 'Probation Period', type: 'text', required: false, placeholder: '3 months' },
      { id: 'benefits', label: 'Benefits', type: 'textarea', required: false }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; margin: -40px -50px 30px -50px;">
        <h1 style="margin: 0; font-size: 36px; color: white;">EMPLOYMENT CONTRACT</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Legal Employment Agreement</p>
      </div>

      <p style="text-align: center; font-size: 14px; color: #9f1239; font-weight: 600;">Contract Date: {{contractDate}}</p>

      <div class="info-box" style="background: #fce7f3; border-left-color: #ec4899;">
        <p style="margin: 0; color: #9f1239;">This Employment Contract is made on <strong>{{contractDate}}</strong> between:</p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #db2777;">EMPLOYER:</h3>
        <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; border-left: 4px solid #ec4899;">
          <p style="margin: 0; font-weight: 600; color: #831843;">{{companyName}}</p>
          <p style="margin: 5px 0 0 0; color: #9f1239; white-space: pre-line; font-size: 13px;">{{companyAddress}}</p>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #db2777;">EMPLOYEE:</h3>
        <div style="background: #fdf2f8; padding: 15px; border-radius: 8px; border-left: 4px solid #ec4899;">
          <p style="margin: 0; font-weight: 600; color: #831843;">{{employeeName}}</p>
          <p style="margin: 5px 0 0 0; color: #9f1239; white-space: pre-line; font-size: 13px;">{{employeeAddress}}</p>
        </div>
      </div>

      <h2 style="color: #db2777;">1. Position & Duties</h2>
      <p>The Employee is hired for the position of <strong>{{jobTitle}}</strong>.</p>

      <h2 style="color: #db2777;">2. Commencement</h2>
      <p>Employment shall commence on <strong>{{startDate}}</strong>.</p>
      {{#if probationPeriod}}
      <p>This position includes a probation period of <strong>{{probationPeriod}}</strong>.</p>
      {{/if}}

      <h2 style="color: #db2777;">3. Compensation</h2>
      <div style="background: #fce7f3; padding: 20px; border-radius: 8px; border: 2px solid #ec4899; margin: 20px 0;">
        <p style="margin: 0; color: #9f1239; font-size: 16px;">Annual Salary: <strong style="font-size: 24px;">{{salary}}</strong></p>
      </div>

      <h2 style="color: #db2777;">4. Working Hours</h2>
      <p>Standard working hours: <strong>{{workingHours}}</strong></p>

      {{#if benefits}}
      <h2 style="color: #db2777;">5. Benefits</h2>
      <div style="background: #fdf2f8; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #9f1239; white-space: pre-line;">{{benefits}}</p>
      </div>
      {{/if}}

      <h2 style="color: #db2777;">6. Termination</h2>
      <p>Either party may terminate this agreement with 30 days written notice.</p>

      <div style="margin-top: 80px;">
        <table style="border: none;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Employer Signature:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{companyName}}<br>Date: ______________</p>
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              <p><strong>Employee Signature:</strong></p>
              <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
              <p>{{employeeName}}<br>Date: ______________</p>
            </td>
          </tr>
        </table>
      </div>
    `,
    downloads: 654,
    rating: 4.6
  },

  // 9. PROJECT PROPOSAL
  {
    name: 'Project Proposal',
    description: 'Detailed project plan with objectives, timeline, and budget',
    category: 'proposals',
    icon: '🎯',
    color: 'from-orange-500 to-orange-600',
    popular: false,
    isPublic: true,
    fields: [
      { id: 'projectName', label: 'Project Name', type: 'text', required: true },
      { id: 'proposalDate', label: 'Proposal Date', type: 'date', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true },
      { id: 'companyName', label: 'Your Company Name', type: 'text', required: true },
      { id: 'projectObjectives', label: 'Project Objectives', type: 'textarea', required: true },
      { id: 'projectScope', label: 'Scope of Work', type: 'textarea', required: true },
      { id: 'deliverables', label: 'Key Deliverables', type: 'textarea', required: true },
      { id: 'timeline', label: 'Project Timeline', type: 'textarea', required: true },
      { id: 'resources', label: 'Resources Required', type: 'textarea', required: false },
      { id: 'totalCost', label: 'Total Project Cost', type: 'text', required: true },
      { id: 'validUntil', label: 'Proposal Valid Until', type: 'date', required: true }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; margin: -40px -50px 40px -50px;">
        <h1 style="margin: 0; font-size: 48px; color: white;">PROJECT PROPOSAL</h1>
        <p style="margin: 15px 0; font-size: 28px; font-weight: 600; opacity: 0.95;">{{projectName}}</p>
        <p style="margin: 0; font-size: 14px; opacity: 0.85;">Prepared for {{clientName}}</p>
      </div>

      <div style="display: flex; justify-content: space-between; padding: 20px; background: #fff7ed; border-radius: 8px; margin-bottom: 30px;">
        <div>
          <p style="margin: 0; color: #9a3412; font-size: 13px;">Submitted by:</p>
          <p style="margin: 5px 0 0 0; color: #7c2d12; font-weight: 600; font-size: 16px;">{{companyName}}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #9a3412; font-size: 13px;">Date:</p>
          <p style="margin: 5px 0 0 0; color: #7c2d12; font-weight: 600;">{{proposalDate}}</p>
          <p style="margin: 10px 0 0 0; color: #ea580c; font-size: 12px;">Valid until: {{validUntil}}</p>
        </div>
      </div>

      <h2 style="color: #ea580c;">🎯 Project Objectives</h2>
      <div class="info-box" style="background: #ffedd5; border-left-color: #f97316;">
        <p style="margin: 0; color: #7c2d12; white-space: pre-line; line-height: 1.8;">{{projectObjectives}}</p>
      </div>

      <h2 style="color: #ea580c;">📋 Scope of Work</h2>
      <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border: 2px solid #fed7aa;">
        <p style="margin: 0; color: #7c2d12; white-space: pre-line; line-height: 1.8;">{{projectScope}}</p>
      </div>

      <h2 style="color: #ea580c;">✅ Key Deliverables</h2>
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #78350f; white-space: pre-line; line-height: 1.8;">{{deliverables}}</p>
      </div>

      <h2 style="color: #ea580c;">📅 Project Timeline</h2>
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #1e3a8a; white-space: pre-line; line-height: 1.8;">{{timeline}}</p>
      </div>

      {{#if resources}}
      <h2 style="color: #ea580c;">🔧 Resources Required</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #374151; white-space: pre-line; line-height: 1.8;">{{resources}}</p>
      </div>
      {{/if}}

      <div class="total-section" style="background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%); border: 3px solid #f97316; margin-top: 40px;">
        <h2 style="margin: 0 0 10px 0; color: #9a3412;">💰 Total Project Investment</h2>
        <p style="margin: 0; font-size: 42px; font-weight: 700; color: #ea580c;">{{totalCost}}</p>
      </div>

      <div style="margin-top: 60px; text-align: center; padding: 30px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; border: 2px dashed #f97316;">
        <p style="margin: 0; color: #9a3412; font-size: 18px; font-weight: 600;">Ready to Transform Your Vision into Reality?</p>
        <p style="margin: 10px 0 0 0; color: #ea580c; font-size: 14px;">This proposal is valid until {{validUntil}}</p>
      </div>
    `,
    downloads: 892,
    rating: 4.7
  },

  // 10. FREELANCE CONTRACT
  {
    name: 'Freelance Contract',
    description: 'Independent contractor service agreement',
    category: 'contracts',
    icon: '💼',
    color: 'from-teal-500 to-teal-600',
    popular: true,
    isPublic: true,
    fields: [
      { id: 'contractDate', label: 'Contract Date', type: 'date', required: true },
      { id: 'clientName', label: 'Client Name', type: 'text', required: true },
      { id: 'clientAddress', label: 'Client Address', type: 'textarea', required: true },
      { id: 'freelancerName', label: 'Freelancer Name', type: 'text', required: true },
      { id: 'freelancerAddress', label: 'Freelancer Address', type: 'textarea', required: true },
      { id: 'projectDescription', label: 'Project Description', type: 'textarea', required: true },
      { id: 'scopeOfWork', label: 'Scope of Work', type: 'textarea', required: true },
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', required: true },
      { id: 'projectTimeline', label: 'Project Timeline', type: 'text', required: true },
      { id: 'totalFee', label: 'Total Fee', type: 'text', required: true },
      { id: 'paymentSchedule', label: 'Payment Schedule', type: 'textarea', required: true }
    ],
    htmlTemplate: `
      <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%); color: white; margin: -40px -50px 30px -50px;">
        <h1 style="margin: 0; font-size: 36px; color: white;">FREELANCE CONTRACT</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Independent Contractor Agreement</p>
      </div>

      <p style="text-align: center; font-size: 14px; color: #134e4a; font-weight: 600;">Agreement Date: {{contractDate}}</p>

      <div class="info-box" style="background: #ccfbf1; border-left-color: #14b8a6;">
        <p style="margin: 0; color: #134e4a;">This Freelance Contract is entered into on <strong>{{contractDate}}</strong> between:</p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #0f766e;">CLIENT:</h3>
        <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6;">
          <p style="margin: 0; font-weight: 600; color: #134e4a;">{{clientName}}</p>
          <p style="margin: 5px 0 0 0; color: #115e59; white-space: pre-line; font-size: 13px;">{{clientAddress}}</p>
        </div>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #0f766e;">FREELANCER:</h3>
        <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6;">
          <p style="margin: 0; font-weight: 600; color: #134e4a;">{{freelancerName}}</p>
          <p style="margin: 5px 0 0 0; color: #115e59; white-space: pre-line; font-size: 13px;">{{freelancerAddress}}</p>
        </div>
      </div>

      <h2 style="color: #0f766e;">1. Project Description</h2>
      <p style="white-space: pre-line; line-height: 1.8;">{{projectDescription}}</p>

      <h2 style="color: #0f766e;">2. Scope of Work</h2>
      <div style="background: #f0fdfa; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #134e4a; white-space: pre-line; line-height: 1.8;">{{scopeOfWork}}</p>
      </div>

      <h2 style="color: #0f766e;">3. Deliverables</h2>
      <div style="background: #ccfbf1; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #134e4a; white-space: pre-line; line-height: 1.8;">{{deliverables}}</p>
      </div>

      <h2 style="color: #0f766e;">5. Compensation</h2>
  <div style="background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%); padding: 25px; border-radius: 8px; border: 2px solid #14b8a6; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; color: #134e4a; font-size: 16px;">Total Project Fee:</p>
    <p style="margin: 0; font-size: 36px; font-weight: 700; color: #0f766e;">{{totalFee}}</p>
  </div>

  <h3 style="color: #0f766e;">Payment Schedule:</h3>
  <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; border-left: 4px solid #14b8a6;">
    <p style="margin: 0; color: #134e4a; white-space: pre-line; line-height: 1.8;">{{paymentSchedule}}</p>
  </div>

  <h2 style="color: #0f766e;">6. Independent Contractor Status</h2>
  <p>Freelancer is an independent contractor and not an employee. Freelancer is responsible for all taxes and insurance.</p>

  <h2 style="color: #0f766e;">7. Ownership & Rights</h2>
  <p>Upon full payment, all work product and intellectual property rights shall be transferred to the Client.</p>

  <div style="margin-top: 80px;">
    <table style="border: none;">
      <tr style="border: none;">
        <td style="border: none; width: 50%; vertical-align: top;">
          <p><strong>Client Signature:</strong></p>
          <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
          <p>{{clientName}}<br>Date: ______________</p>
        </td>
        <td style="border: none; width: 50%; vertical-align: top;">
          <p><strong>Freelancer Signature:</strong></p>
          <div style="border-bottom: 2px solid #000; margin: 50px 0 10px 0; width: 80%;"></div>
          <p>{{freelancerName}}<br>Date: ______________</p>
        </td>
      </tr>
    </table>
  </div>
`,
downloads: 1543,
rating: 4.8
 },
 // 11. ANALYTICS REPORT
{
name: 'Analytics Report',
description: 'Data analysis report with insights and recommendations',
category: 'reports',
icon: '📉',
color: 'from-violet-500 to-violet-600',
popular: false,
isPublic: true,
fields: [
{ id: 'reportTitle', label: 'Report Title', type: 'text', required: true },
{ id: 'reportPeriod', label: 'Analysis Period', type: 'text', required: true, placeholder: 'Q1 2024' },
{ id: 'companyName', label: 'Company Name', type: 'text', required: true },
{ id: 'analystName', label: 'Analyst Name', type: 'text', required: true },
{ id: 'reportDate', label: 'Report Date', type: 'date', required: true },
{ id: 'dataSources', label: 'Data Sources', type: 'textarea', required: true },
{ id: 'keyFindings', label: 'Key Findings', type: 'textarea', required: true },
{ id: 'dataAnalysis', label: 'Data Analysis', type: 'textarea', required: true },
{ id: 'insights', label: 'Insights & Trends', type: 'textarea', required: true },
{ id: 'actionItems', label: 'Recommended Actions', type: 'textarea', required: true }
],
htmlTemplate: `
<div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; margin: -40px -50px 40px -50px;">
<h1 style="margin: 0; font-size: 42px; color: white;">ANALYTICS REPORT</h1>
<p style="margin: 15px 0; font-size: 24px; opacity: 0.95;">{{reportTitle}}</p>
<p style="margin: 0; font-size: 16px; opacity: 0.85;">{{reportPeriod}}</p>
</div>
  <div style="display: flex; justify-content: space-between; padding: 20px; background: #f5f3ff; border-radius: 8px; margin-bottom: 30px;">
    <div>
      <p style="margin: 0; color: #5b21b6; font-size: 13px;">Organization:</p>
      <p style="margin: 5px 0 0 0; color: #4c1d95; font-weight: 600; font-size: 16px;">{{companyName}}</p>
    </div>
    <div style="text-align: center;">
      <p style="margin: 0; color: #5b21b6; font-size: 13px;">Prepared by:</p>
      <p style="margin: 5px 0 0 0; color: #4c1d95; font-weight: 600;">{{analystName}}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; color: #5b21b6; font-size: 13px;">Report Date:</p>
      <p style="margin: 5px 0 0 0; color: #4c1d95; font-weight: 600;">{{reportDate}}</p>
    </div>
  </div>

  <h2 style="color: #7c3aed;">📊 Data Sources</h2>
  <div class="info-box" style="background: #faf5ff; border-left-color: #8b5cf6;">
    <p style="margin: 0; color: #5b21b6; white-space: pre-line; line-height: 1.8;">{{dataSources}}</p>
  </div>

  <h2 style="color: #7c3aed;">🔍 Key Findings</h2>
  <div style="background: #ede9fe; padding: 25px; border-radius: 8px; border: 2px solid #a78bfa;">
    <p style="margin: 0; color: #4c1d95; white-space: pre-line; line-height: 1.8; font-size: 15px;">{{keyFindings}}</p>
  </div>

  <h2 style="color: #7c3aed;">📈 Data Analysis</h2>
  <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
    <p style="margin: 0; color: #5b21b6; white-space: pre-line; line-height: 1.8;">{{dataAnalysis}}</p>
  </div>

  <h2 style="color: #7c3aed;">💡 Insights & Trends</h2>
  <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; color: #1e3a8a; white-space: pre-line; line-height: 1.8;">{{insights}}</p>
  </div>

  <h2 style="color: #7c3aed;">✅ Recommended Actions</h2>
  <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
    <p style="margin: 0; color: #065f46; white-space: pre-line; line-height: 1.8;">{{actionItems}}</p>
  </div>

  <div style="margin-top: 60px; text-align: center; padding: 30px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px;">
    <p style="margin: 0; color: #5b21b6; font-size: 18px; font-weight: 600;">📊 End of Analytics Report</p>
    <p style="margin: 10px 0 0 0; color: #7c3aed; font-size: 13px;">{{reportPeriod}} | {{companyName}}</p>
  </div>
`,
downloads: 567,
rating: 4.5
},
// 12. FINANCIAL REPORT
{
name: 'Financial Report',
description: 'Comprehensive financial performance overview',
category: 'reports',
icon: '💹',
color: 'from-emerald-500 to-emerald-600',
popular: false,
isPublic: true,
fields: [
{ id: 'reportTitle', label: 'Report Title', type: 'text', required: true, placeholder: 'Quarterly Financial Report' },
{ id: 'fiscalPeriod', label: 'Fiscal Period', type: 'text', required: true, placeholder: 'Q4 2024' },
{ id: 'companyName', label: 'Company Name', type: 'text', required: true },
{ id: 'reportDate', label: 'Report Date', type: 'date', required: true },
{ id: 'preparedBy', label: 'Prepared By', type: 'text', required: true },
{ id: 'totalRevenue', label: 'Total Revenue', type: 'text', required: true },
{ id: 'totalExpenses', label: 'Total Expenses', type: 'text', required: true },
{ id: 'netIncome', label: 'Net Income', type: 'text', required: true },
{ id: 'revenueBreakdown', label: 'Revenue Breakdown', type: 'textarea', required: true },
{ id: 'expenseBreakdown', label: 'Expense Breakdown', type: 'textarea', required: true },
{ id: 'financialSummary', label: 'Financial Summary', type: 'textarea', required: true },
{ id: 'outlook', label: 'Financial Outlook', type: 'textarea', required: false }
],
htmlTemplate: `
<div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin: -40px -50px 40px -50px;">
<h1 style="margin: 0; font-size: 42px; color: white;">FINANCIAL REPORT</h1>
<p style="margin: 15px 0; font-size: 24px; opacity: 0.95;">{{reportTitle}}</p>
<p style="margin: 0; font-size: 16px; opacity: 0.85;">{{fiscalPeriod}}</p>
</div>
  <div style="display: flex; justify-content: space-between; padding: 20px; background: #d1fae5; border-radius: 8px; margin-bottom: 30px;">
    <div>
      <p style="margin: 0; color: #065f46; font-size: 13px;">Company:</p>
      <p style="margin: 5px 0 0 0; color: #047857; font-weight: 600; font-size: 16px;">{{companyName}}</p>
    </div>
    <div style="text-align: center;">
      <p style="margin: 0; color: #065f46; font-size: 13px;">Prepared by:</p>
      <p style="margin: 5px 0 0 0; color: #047857; font-weight: 600;">{{preparedBy}}</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; color: #065f46; font-size: 13px;">Report Date:</p>
      <p style="margin: 5px 0 0 0; color: #047857; font-weight: 600;">{{reportDate}}</p>
    </div>
  </div>

  <h2 style="color: #059669;">📊 Financial Summary</h2>
  <div class="info-box" style="background: #ecfdf5; border-left-color: #10b981;">
    <p style="margin: 0; color: #065f46; white-space: pre-line; line-height: 1.8;">{{financialSummary}}</p>
  </div>

  <h2 style="color: #059669;">💰 Financial Performance</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 12px; text-align: center; border: 2px solid #10b981;">
      <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; font-weight: 600;">Total Revenue</p>
      <p style="margin: 0; font-size: 28px; font-weight: 700; color: #047857;">{{totalRevenue}}</p>
    </div>
    <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); padding: 25px; border-radius: 12px; text-align: center; border: 2px solid #f97316;">
      <p style="margin: 0 0 10px 0; color: #7c2d12; font-size: 14px; font-weight: 600;">Total Expenses</p>
      <p style="margin: 0; font-size: 28px; font-weight: 700; color: #9a3412;">{{totalExpenses}}</p>
    </div>
    <div style="background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%); padding: 25px; border-radius: 12px; text-align: center; border: 2px solid #3b82f6;">
      <p style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px; font-weight: 600;">Net Income</p>
      <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1e40af;">{{netIncome}}</p>
    </div>
  </div>

  <h2 style="color: #059669;">📈 Revenue Breakdown</h2>
  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
    <p style="margin: 0; color: #065f46; white-space: pre-line; line-height: 1.8;">{{revenueBreakdown}}</p>
  </div>

  <h2 style="color: #059669;">📉 Expense Breakdown</h2>
  <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
    <p style="margin: 0; color: #7c2d12; white-space: pre-line; line-height: 1.8;">{{expenseBreakdown}}</p>
  </div>

  {{#if outlook}}
  <h2 style="color: #059669;">🔮 Financial Outlook</h2>
  <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; color: #1e3a8a; white-space: pre-line; line-height: 1.8;">{{outlook}}</p>
  </div>
  {{/if}}

  <div style="margin-top: 60px; text-align: center; padding: 30px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px;">
    <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600;">💹 End of Financial Report</p>
    <p style="margin: 10px 0 0 0; color: #10b981; font-size: 13px;">{{fiscalPeriod}} | {{companyName}}</p>
  </div>
`,
downloads: 789,
rating: 4.6
}
]



async function seedTemplates() {
  try {
    // ✅ Dynamic import happens here, AFTER env vars are loaded
    const { dbPromise } = await import("@/app/api/lib/mongodb");
    
    const db = await dbPromise;
    const templatesCollection = db.collection('templates');
    
    console.log('🌱 Starting template seeding...');
    console.log(`📊 Total templates to insert: ${professionalTemplates.length}\n`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const template of professionalTemplates) {
      const existing = await templatesCollection.findOne({ name: template.name });
      
      if (!existing) {
        await templatesCollection.insertOne({
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✓ Created: ${template.name} (${template.category})`);
        insertedCount++;
      } else {
        console.log(`⊘ Skipped: ${template.name} (already exists)`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Template seeding completed!');
    console.log('='.repeat(60));
    console.log(`📝 Total templates: ${professionalTemplates.length}`);
    console.log(`✓ Inserted: ${insertedCount}`);
    console.log(`⊘ Skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

seedTemplates();