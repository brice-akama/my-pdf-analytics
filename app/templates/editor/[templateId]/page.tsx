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

  // Template data mapping (same as in dashboard)
  const templateData: Record<string, any> = {
    'sales-invoice-001': {
      id: 'sales-invoice-001',
      name: 'Sales Invoice',
      icon: '💰',
      color: 'from-blue-500 to-blue-600',
      fields: {
        company_logo: { label: 'Company Logo (emoji/text)', type: 'text', placeholder: '🏢', default: '💼' },
        company_name: { label: 'Company Name', type: 'text', placeholder: 'Your Company Inc.' },
        company_address: { label: 'Company Address', type: 'text', placeholder: '123 Business St, City, State 12345' },
        company_email: { label: 'Company Email', type: 'email', placeholder: 'contact@company.com' },
        company_phone: { label: 'Company Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
        invoice_number: { label: 'Invoice Number', type: 'text', placeholder: 'INV-001', default: 'INV-001' },
        invoice_date: { label: 'Invoice Date', type: 'date', default: new Date().toISOString().split('T')[0] },
        due_date: { label: 'Due Date', type: 'date' },
        client_name: { label: 'Client Name', type: 'text', placeholder: 'Client Company Name' },
        client_address: { label: 'Client Address', type: 'text', placeholder: 'Client address' },
        client_email: { label: 'Client Email', type: 'email', placeholder: 'client@email.com' },
        client_phone: { label: 'Client Phone', type: 'tel', placeholder: '+1 (555) 987-6543' },
        subtotal: { label: 'Subtotal', type: 'number', placeholder: '1000.00', default: '0.00' },
        tax_rate: { label: 'Tax Rate (%)', type: 'number', placeholder: '10', default: '0' },
        tax_amount: { label: 'Tax Amount', type: 'number', placeholder: '100.00', default: '0.00' },
        total: { label: 'Total Amount', type: 'number', placeholder: '1100.00', default: '0.00' },
        payment_terms: { label: 'Payment Terms', type: 'textarea', placeholder: 'Payment due within 30 days...', default: 'Payment due within 30 days. Late payments subject to 5% monthly interest.' },
        notes: { label: 'Additional Notes', type: 'textarea', placeholder: 'Thank you for your business!', default: 'Thank you for your business!' }
      },
      htmlTemplate: `
        <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: 'Arial', sans-serif; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
            <div>
              <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px; font-weight: bold; margin-bottom: 10px;">
                {{company_logo}}
              </div>
              <h1 style="margin: 0; color: #1e293b; font-size: 28px; font-weight: bold;">{{company_name}}</h1>
              <p style="margin: 5px 0; color: #64748b;">{{company_address}}</p>
              <p style="margin: 5px 0; color: #64748b;">{{company_email}} | {{company_phone}}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #2563eb; font-size: 36px; font-weight: bold;">INVOICE</h2>
              <p style="margin: 10px 0; color: #64748b;"><strong>Invoice #:</strong> {{invoice_number}}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Date:</strong> {{invoice_date}}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Due Date:</strong> {{due_date}}</p>
            </div>
          </div>
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 12px;">BILL TO:</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0; color: #1e293b; font-weight: bold; font-size: 16px;">{{client_name}}</p>
              <p style="margin: 5px 0; color: #64748b;">{{client_address}}</p>
              <p style="margin: 5px 0; color: #64748b;">{{client_email}}</p>
              <p style="margin: 5px 0; color: #64748b;">{{client_phone}}</p>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-weight: 500;">Subtotal:</span>
                <span style="color: #1e293b; font-weight: 600;">${"[subtotal]"}</span>
              </div> 
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-weight: 500;">Tax ({{tax_rate}}%):</span>
                <span style="color: #1e293b; font-weight: 600;">${"[tax_amount]"}</span>
              </div>  
              <div style="display: flex; justify-content: space-between; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-top: 10px;">
                <span style="font-size: 18px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 20px; font-weight: bold;">${"[total]"}</span>
              </div>   
            </div>
          </div>
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 30px;">
            <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">PAYMENT TERMS</h3>
            <p style="margin: 0; color: #64748b; line-height: 1.6;">{{payment_terms}}</p>
          </div>
          <div style="background: #fffbeb; padding: 25px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
            <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">NOTES</h3>
            <p style="margin: 0; color: #64748b; line-height: 1.6;">{{notes}}</p>
          </div>
          <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>{{company_name}}</strong></p>
            <p style="margin: 5px 0;">Thank you for your business!</p>
          </div>
        </div>
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