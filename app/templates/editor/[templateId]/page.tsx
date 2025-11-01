"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Save,
  Download,
  Eye,
  ChevronLeft,
  Loader2,
  CheckCircle,
  FileText,
  Sparkles
} from "lucide-react"

export default function TemplateEditorPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [documentName, setDocumentName] = useState('')

  // Template data mapping
  const templateData: Record<string, any> = {
    'sales-invoice-001': {
      id: 'sales-invoice-001',
      name: 'Sales Invoice',
      icon: '📄',
      color: 'from-indigo-500 to-purple-600',
      fields: {
        invoice_number: { label: 'Invoice Number', type: 'text', placeholder: 'INV-001', default: 'INV-001' },
        invoice_date: { label: 'Invoice Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        invoice_terms: { label: 'Payment Terms', type: 'text', placeholder: 'Net 30', default: 'Net 30' },
        invoice_due_date: { label: 'Due Date', type: 'date', default: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] },
        company_name: { label: 'Your Company Name', type: 'text', placeholder: 'PandaDoc', default: 'PandaDoc' },
        company_address: { label: 'Company Address', type: 'text', placeholder: '123 Business Street', default: '123 Business Street' },
        company_city: { label: 'City, State, Zip', type: 'text', placeholder: 'San Francisco, CA 94105', default: 'San Francisco, CA 94105' },
        company_email: { label: 'Company Email', type: 'email', placeholder: 'contact@pandadoc.com', default: 'contact@pandadoc.com' },
        company_phone: { label: 'Company Phone', type: 'tel', placeholder: '+1 (555) 123-4567', default: '+1 (555) 123-4567' },
        client_first_name: { label: 'Client First Name', type: 'text', placeholder: 'John' },
        client_last_name: { label: 'Client Last Name', type: 'text', placeholder: 'Doe' },
        client_street_address: { label: 'Client Street Address', type: 'text', placeholder: '456 Client Ave' },
        client_city: { label: 'Client City', type: 'text', placeholder: 'New York' },
        client_state: { label: 'Client State', type: 'text', placeholder: 'NY' },
        client_postal_code: { label: 'Client Postal Code', type: 'text', placeholder: '10001' },
        client_email: { label: 'Client Email', type: 'email', placeholder: 'client@example.com' },
        client_phone: { label: 'Client Phone', type: 'tel', placeholder: '+1 (555) 987-6543' },
        item1_description: { label: 'Item 1 Description', type: 'text', placeholder: 'Web Development Services', default: 'Web Development Services' },
        item1_details: { label: 'Item 1 Details', type: 'text', placeholder: 'Custom website development', default: 'Custom website development and design' },
        item1_qty: { label: 'Item 1 Quantity', type: 'number', placeholder: '1', default: '1' },
        item1_rate: { label: 'Item 1 Rate', type: 'number', placeholder: '5000.00', default: '5000.00' },
        item2_description: { label: 'Item 2 Description', type: 'text', placeholder: 'SEO Optimization', default: 'SEO Optimization' },
        item2_details: { label: 'Item 2 Details', type: 'text', placeholder: 'Search engine optimization', default: 'On-page and off-page SEO services' },
        item2_qty: { label: 'Item 2 Quantity', type: 'number', placeholder: '1', default: '1' },
        item2_rate: { label: 'Item 2 Rate', type: 'number', placeholder: '2000.00', default: '2000.00' },
        item3_description: { label: 'Item 3 Description', type: 'text', placeholder: 'Maintenance Package', default: 'Maintenance Package' },
        item3_details: { label: 'Item 3 Details', type: 'text', placeholder: 'Monthly maintenance', default: 'Monthly website maintenance and updates' },
        item3_qty: { label: 'Item 3 Quantity', type: 'number', placeholder: '3', default: '3' },
        item3_rate: { label: 'Item 3 Rate', type: 'number', placeholder: '500.00', default: '500.00' },
        tax_rate: { label: 'Tax Rate (%)', type: 'number', placeholder: '8.5', default: '8.5' }
      },
      htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Invoice</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #f8f9fa; }
    .invoice-container { max-width: 900px; margin: 0 auto; background: white; padding: 60px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 3px solid #1e293b; margin-bottom: 40px; }
    .company-info { flex: 1; }
    .logo { width: 80px; height: 80px; background: linear-gradient(135deg, #4f46e5, #9333ea); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; margin-bottom: 15px; }
    .company-name { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
    .company-details { font-size: 12px; color: #64748b; line-height: 1.6; }
    .invoice-title-section { text-align: right; }
    .invoice-title { font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
    .invoice-number-box { background: #f1f5f9; padding: 15px 20px; border-radius: 8px; margin-top: 15px; }
    .invoice-label { font-size: 11px; color: #64748b; margin-bottom: 5px; }
    .invoice-value { font-size: 16px; font-weight: bold; color: #1e293b; }
    .invoice-meta { font-size: 11px; color: #64748b; margin-top: 15px; line-height: 1.8; }
    .bill-to-section { margin-bottom: 40px; }
    .bill-to-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 15px; padding-left: 15px; border-left: 5px solid #4f46e5; }
    .bill-to-box { background: #f8fafc; padding: 25px; border-radius: 10px; }
    .client-name { font-weight: bold; font-size: 16px; color: #1e293b; margin-bottom: 10px; }
    .client-details { font-size: 12px; color: #64748b; line-height: 1.8; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
    .items-table thead { background: #1e293b; color: white; }
    .items-table th { padding: 15px; text-align: left; font-weight: 600; font-size: 11px; letter-spacing: 0.5px; }
    .items-table th.center { text-align: center; }
    .items-table th.right { text-align: right; }
    .items-table tbody tr { border-bottom: 1px solid #e2e8f0; }
    .items-table td { padding: 20px 15px; color: #1e293b; }
    .item-description { font-weight: 600; margin-bottom: 8px; }
    .item-details { font-size: 10px; color: #64748b; }
    .items-table td.center { text-align: center; }
    .items-table td.right { text-align: right; font-weight: bold; }
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .totals-box { width: 350px; }
    .totals-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .totals-label { color: #64748b; }
    .totals-value { font-weight: bold; color: #1e293b; }
    .total-final { background: #1e293b; color: white; padding: 20px 25px; border-radius: 10px; margin-top: 15px; }
    .total-final .totals-label { color: white; font-weight: bold; font-size: 13px; }
    .total-final .totals-value { font-size: 24px; }
    .terms-section { border-top: 2px solid #e2e8f0; padding-top: 30px; }
    .terms-box { background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
    .terms-title { font-size: 12px; font-weight: bold; color: #1e293b; margin-bottom: 12px; }
    .terms-text { font-size: 10px; color: #64748b; line-height: 1.8; }
    .highlight { background: #fef3c7; padding: 2px 5px; border-radius: 3px; }
    .signature-section { display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-box-wrapper { flex: 1; }
    .signature-label { font-size: 10px; color: #64748b; margin-bottom: 8px; }
    .signature-box { border: 2px solid #cbd5e1; border-radius: 10px; padding: 30px 40px; background: #f8fafc; text-align: center; }
    .signature-icon { color: #4f46e5; font-size: 18px; }
    .signature-date { font-size: 10px; color: #64748b; margin-top: 12px; }
    .footer-text { text-align: right; font-size: 10px; color: #94a3b8; }
    .footer-thank-you { margin-bottom: 8px; }
    .footer-contact { font-weight: 600; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="logo">{{company_name.substring(0,2).toUpperCase()}}</div>
        <div class="company-name">{{company_name}}</div>
        <div class="company-details">
          <div>{{company_address}}</div>
          <div>{{company_city}}</div>
          <div>{{company_email}}</div>
          <div>{{company_phone}}</div>
        </div>
      </div>
      <div class="invoice-title-section">
        <div class="invoice-title">SALES INVOICE</div>
        <div class="invoice-number-box">
          <div class="invoice-label">Invoice No:</div>
          <div class="invoice-value">{{invoice_number}}</div>
        </div>
        <div class="invoice-meta">
          <div><strong>Payment terms:</strong> {{invoice_terms}}</div>
          <div><strong>Due date:</strong> {{invoice_due_date}}</div>
        </div>
      </div>
    </div>

    <!-- Bill To Section -->
    <div class="bill-to-section">
      <div class="bill-to-title">Bill to:</div>
      <div class="bill-to-box">
        <div class="client-name">{{client_first_name}} {{client_last_name}}</div>
        <div class="client-details">
          <div>{{client_street_address}} {{client_city}} {{client_state}}</div>
          <div>{{client_postal_code}}</div>
          <div style="margin-top: 8px;">{{client_email}}</div>
          <div>{{client_phone}}</div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>DESCRIPTION</th>
          <th class="center" style="width: 80px;">QTY</th>
          <th class="right" style="width: 120px;">RATE</th>
          <th class="right" style="width: 140px;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-description">{{item1_description}}</div>
            <div class="item-details">{{item1_details}}</div>
          </td>
          <td class="center">{{item1_qty}}</td>
          <td class="right"> ${"[item1_rate]"}</td> 
          <td class="right">$<span id="item1-total"></span></td>
        </tr>
        <tr>
          <td>
            <div class="item-description">{{item2_description}}</div>
            <div class="item-details">{{item2_details}}</div>
          </td>
          <td class="center">{{item2_qty}}</td>
          <td class="right">${"[item2_rate]"}</td>
          <td class="right">$<span id="item2-total"></span></td>
        </tr>
        <tr>
          <td>
            <div class="item-description">{{item3_description}}</div>
            <div class="item-details">{{item3_details}}</div>
          </td>
          <td class="center">{{item3_qty}}</td>
          <td class="right"> ${"[item3_rate]"}</td>  
          <td class="right">$<span id="item3-total"></span></td>
        </tr>
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="totals-label">Subtotal:</span>
          <span class="totals-value">$<span id="subtotal"></span></span>
        </div>
        <div class="totals-row">
          <span class="totals-label">Tax ({{tax_rate}}%):</span>
          <span class="totals-value">$<span id="tax-amount"></span></span>
        </div>
        <div class="total-final">
          <div class="totals-row" style="border: none; padding: 0;">
            <span class="totals-label">TOTAL:</span>
            <span class="totals-value">$<span id="total"></span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Terms and Signature -->
    <div class="terms-section">
      <div class="terms-box">
        <div class="terms-title">Payment Terms & Conditions:</div>
        <div class="terms-text">
          I, the undersigned <span class="highlight">{{client_first_name}} {{client_last_name}}</span>, do hereby confirm that this invoice relates to a commercial transaction and this document contains a fair, complete and accurate description of the transaction and the relevant goods and/or services provided as well as a true and realistic description of their value.
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box-wrapper">
          <div class="signature-label">Authorized Signature:</div>
          <div class="signature-box">
            <div class="signature-icon">✍️ Signature</div>
          </div>
          <div class="signature-date">{{invoice_date}}</div>
        </div>
        <div class="footer-text" style="margin-left: 40px;">
          <div class="footer-thank-you">Thank you for your business!</div>
          <div class="footer-contact">Questions? Contact us at {{company_email}}</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Calculate totals
    const item1Qty = parseFloat('{{item1_qty}}') || 0;
    const item1Rate = parseFloat('{{item1_rate}}') || 0;
    const item2Qty = parseFloat('{{item2_qty}}') || 0;
    const item2Rate = parseFloat('{{item2_rate}}') || 0;
    const item3Qty = parseFloat('{{item3_qty}}') || 0;
    const item3Rate = parseFloat('{{item3_rate}}') || 0;
    const taxRate = parseFloat('{{tax_rate}}') || 0;

    const item1Total = (item1Qty * item1Rate).toFixed(2);
    const item2Total = (item2Qty * item2Rate).toFixed(2);
    const item3Total = (item3Qty * item3Rate).toFixed(2);
    const subtotal = (parseFloat(item1Total) + parseFloat(item2Total) + parseFloat(item3Total)).toFixed(2);
    const taxAmount = (parseFloat(subtotal) * (taxRate / 100)).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2);

    document.getElementById('item1-total').textContent = item1Total;
    document.getElementById('item2-total').textContent = item2Total;
    document.getElementById('item3-total').textContent = item3Total;
    document.getElementById('subtotal').textContent = subtotal;
    document.getElementById('tax-amount').textContent = taxAmount;
    document.getElementById('total').textContent = total;
  </script>
</body>
</html>
      `
    },
    
    'service-agreement-001': {
      id: 'service-agreement-001',
      name: 'Service Agreement',
      icon: '📋',
      color: 'from-purple-500 to-purple-600',
      fields: {
        contract_number: { label: 'Contract Number', type: 'text', placeholder: 'SA-001', default: 'SA-001' },
        effective_date: { label: 'Effective Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        provider_company: { label: 'Provider Company Name', type: 'text', placeholder: 'Your Company Inc.' },
        provider_address: { label: 'Provider Address', type: 'text', placeholder: '123 Business St' },
        provider_email: { label: 'Provider Email', type: 'email', placeholder: 'provider@company.com' },
        provider_phone: { label: 'Provider Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
        client_company: { label: 'Client Company Name', type: 'text', placeholder: 'Client Corp.' },
        client_address: { label: 'Client Address', type: 'text', placeholder: '456 Client Ave' },
        client_email: { label: 'Client Email', type: 'email', placeholder: 'client@company.com' },
        client_phone: { label: 'Client Phone', type: 'tel', placeholder: '+1 (555) 987-6543' },
        services_description: { label: 'Services Description', type: 'textarea', placeholder: 'Detailed description of services...', default: 'The Service Provider agrees to provide the following services...' },
        start_date: { label: 'Start Date', type: 'date' },
        end_date: { label: 'End Date', type: 'date' },
        payment_terms: { label: 'Payment Terms', type: 'textarea', placeholder: 'Payment schedule...', default: 'Client agrees to pay $X per month, due on the 1st of each month.' },
        termination_terms: { label: 'Termination Terms', type: 'textarea', placeholder: 'Termination conditions...', default: 'Either party may terminate this agreement with 30 days written notice.' }
      },
      htmlTemplate: `<!-- Service Agreement HTML - similar structure as above -->`
    },
    'payment-receipt-001': {
      id: 'payment-receipt-001',
      name: 'Payment Receipt',
      icon: '🧾',
      color: 'from-cyan-500 to-cyan-600',
      fields: {
        receipt_number: { label: 'Receipt Number', type: 'text', placeholder: 'REC-001', default: 'REC-001' },
        receipt_date: { label: 'Receipt Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        payer_name: { label: 'Payer Name', type: 'text', placeholder: 'John Doe' },
        payer_email: { label: 'Payer Email', type: 'email', placeholder: 'payer@email.com' },
        amount_paid: { label: 'Amount Paid', type: 'number', placeholder: '500.00' },
        payment_method: { label: 'Payment Method', type: 'text', placeholder: 'Credit Card', default: 'Credit Card' },
        transaction_id: { label: 'Transaction ID', type: 'text', placeholder: 'TXN123456789' },
        payment_purpose: { label: 'Payment Purpose', type: 'text', placeholder: 'Invoice #INV-001' },
        company_name: { label: 'Company Name', type: 'text', placeholder: 'Your Company Inc.' },
        company_address: { label: 'Company Address', type: 'text', placeholder: '123 Business St' },
        company_email: { label: 'Company Email', type: 'email', placeholder: 'contact@company.com' },
        company_phone: { label: 'Company Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
        generated_date: { label: 'Generated Date', type: 'date', default: new Date().toISOString().split('T')[0] }
      },
      htmlTemplate: `<!-- Payment Receipt HTML -->`
    },
    'business-proposal-001': {
      id: 'business-proposal-001',
      name: 'Business Proposal',
      icon: '📊',
      color: 'from-green-500 to-green-600',
      fields: {
        project_name: { label: 'Project Name', type: 'text', placeholder: 'Website Redesign Project' },
        client_name: { label: 'Client Name', type: 'text', placeholder: 'ABC Corporation' },
        proposal_date: { label: 'Proposal Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        executive_summary: { label: 'Executive Summary', type: 'textarea', placeholder: 'Brief overview...', default: 'This proposal outlines...' },
        project_scope: { label: 'Project Scope', type: 'textarea', placeholder: 'Detailed scope...' },
        start_date: { label: 'Start Date', type: 'date' },
        end_date: { label: 'End Date', type: 'date' },
        duration: { label: 'Duration', type: 'text', placeholder: '3 months', default: '3 months' },
        total_cost: { label: 'Total Cost', type: 'number', placeholder: '25000' },
        payment_schedule: { label: 'Payment Schedule', type: 'text', placeholder: '50% upfront, 50% on completion' },
        why_choose_us: { label: 'Why Choose Us', type: 'textarea', placeholder: 'Our qualifications...' },
        company_name: { label: 'Company Name', type: 'text', placeholder: 'Your Company' },
        company_address: { label: 'Address', type: 'text', placeholder: '123 Business St' },
        company_email: { label: 'Email', type: 'email', placeholder: 'contact@company.com' },
        company_phone: { label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
        company_website: { label: 'Website', type: 'text', placeholder: 'www.yourcompany.com' },
        proposal_number: { label: 'Proposal Number', type: 'text', placeholder: 'PROP-001', default: 'PROP-001' },
        valid_until: { label: 'Valid Until', type: 'date' }
      },
      htmlTemplate: `<!-- Business Proposal HTML -->`
    },
    'freelance-contract-001': {
      id: 'freelance-contract-001',
      name: 'Freelance Contract',
      icon: '💼',
      color: 'from-teal-500 to-teal-600',
      fields: {
        contract_id: { label: 'Contract ID', type: 'text', placeholder: 'FC-001', default: 'FC-001' },
        agreement_date: { label: 'Agreement Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        client_name: { label: 'Client Name', type: 'text', placeholder: 'Jane Smith' },
        client_company: { label: 'Client Company', type: 'text', placeholder: 'Client Corp' },
        client_address: { label: 'Client Address', type: 'text', placeholder: '456 Client St' },
        client_email: { label: 'Client Email', type: 'email', placeholder: 'client@company.com' },
        freelancer_name: { label: 'Freelancer Name', type: 'text', placeholder: 'John Freelancer' },
        freelancer_business: { label: 'Freelancer Business', type: 'text', placeholder: 'JF Design Studio' },
        freelancer_address: { label: 'Freelancer Address', type: 'text', placeholder: '789 Freelancer Ln' },
        freelancer_email: { label: 'Freelancer Email', type: 'email', placeholder: 'freelancer@email.com' },
        scope_of_work: { label: 'Scope of Work', type: 'textarea', placeholder: 'Detailed description...' },
        deliverables: { label: 'Deliverables', type: 'textarea', placeholder: 'List of deliverables...' },
        start_date: { label: 'Start Date', type: 'date' },
        end_date: { label: 'End Date', type: 'date' },
        duration: { label: 'Duration', type: 'text', placeholder: '2 months' },
        total_fee: { label: 'Total Fee', type: 'number', placeholder: '5000' },
        payment_schedule: { label: 'Payment Schedule', type: 'textarea', placeholder: 'Payment milestones...' },
        ip_terms: { label: 'IP Rights', type: 'textarea', placeholder: 'Upon full payment...', default: 'Upon full payment, all intellectual property rights transfer to the Client.' },
        confidentiality_terms: { label: 'Confidentiality', type: 'textarea', placeholder: 'Both parties agree...', default: 'Both parties agree to maintain confidentiality of all proprietary information.' },
        termination_terms: { label: 'Termination', type: 'textarea', placeholder: 'Either party may...', default: 'Either party may terminate with 14 days written notice.' },
        generated_date: { label: 'Generated Date', type: 'date', default: new Date().toISOString().split('T')[0] }
      },
      htmlTemplate: `<!-- Freelance Contract HTML -->`
    }
  }

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true)
      
      // Get template from local data
      const templateInfo = templateData[templateId]
      
      if (!templateInfo) {
        alert('Template not found')
        router.push('/dashboard')
        return
      }

      setTemplate(templateInfo)
      
      // Initialize form data with default values
      const initialData: Record<string, string> = {}
      Object.entries(templateInfo.fields).forEach(([key, field]: [string, any]) => {
        initialData[key] = field.default || ''
      })
      setFormData(initialData)
      setDocumentName(`${templateInfo.name} - ${new Date().toLocaleDateString()}`)
      
      setLoading(false)
    }

    loadTemplate()
  }, [templateId, router])

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const renderPreview = () => {
    if (!template) return ''
    
    let html = template.htmlTemplate
    Object.entries(formData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, value || `[${key}]`)
    })
    
    return html
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          customizedData: formData,
          documentName
        })
      })

      const data = await res.json()
      
      if (data.success) {
        alert('Document saved successfully!')
        router.push('/dashboard')
      } else {
        alert('Failed to save document')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const html = renderPreview()
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${documentName}</title>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `
    
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentName.replace(/[^a-z0-9]/gi, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex">
      {/* Left Sidebar - Form */}
      <aside className="w-96 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 -ml-2"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}>
              {template.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{template.name}</h1>
              <p className="text-xs text-slate-500">Fill in the details below</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Document Name</Label>
            <Input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Form Fields */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {Object.entries(template.fields).map(([key, field]: [string, any]) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  {field.label}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={formData[key] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-9 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="p-6 border-t space-y-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Document
              </>
            )}
          </Button>
          
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            Download HTML
          </Button>
        </div>
      </aside>

      {/* Right Side - Preview */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-lg font-semibold text-slate-900">Live Preview</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Edit Mode' : 'Preview Mode'}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <ScrollArea className="flex-1 p-8 bg-slate-100">
          <div className="max-w-5xl mx-auto">
            {showPreview ? (
              <div 
                className="bg-white shadow-2xl rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            ) : (
              <div className="bg-white shadow-2xl rounded-lg p-12">
                <div className="text-center py-20">
                  <Sparkles className="h-16 w-16 text-purple-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Fill in the form to see your document
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Enter your information on the left sidebar
                  </p>
                  <Button
                    onClick={() => setShowPreview(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Show Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}