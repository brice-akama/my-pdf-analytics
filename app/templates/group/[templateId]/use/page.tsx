// app/templates/group/[templateId]/use/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  Loader2,
  Send,
  CheckCircle2,
} from "lucide-react"

type Template = {
  _id: string
  name: string
  description: string
  documents: Array<{
    documentId: string
    filename: string
    numPages: number
  }>
  recipientRoles: Array<{
    index: number
    role: string
    color: string
  }>
  settings: {
    viewMode: string
    signingOrder: string
    expirationDays: string
  }
}

type Recipient = {
  name: string
  email: string
}

export default function UseTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.templateId as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [message, setMessage] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/templates/group/${templateId}`, {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setTemplate(data.template)
          
          // Initialize recipients array based on template roles
          setRecipients(
            data.template.recipientRoles.map((role: any) => ({
              name: "",
              email: ""
            }))
          )
        }
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    // Validation
    const emptyRecipients = recipients.filter(r => !r.name || !r.email)
    if (emptyRecipients.length > 0) {
      alert("Please fill in all recipient details")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(r => !emailRegex.test(r.email))
    if (invalidEmails.length > 0) {
      alert("Please enter valid email addresses for all recipients")
      return
    }

    try {
      setSending(true)
      
      const res = await fetch(`/api/templates/group/${templateId}/send`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          message,
          dueDate: dueDate || null
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`✅ ${data.message}`)
        router.push('/documents-page')
      } else {
        alert(`❌ Failed to send: ${data.error}`)
      }
    } catch (error) {
      console.error("Send error:", error)
      alert("❌ Failed to send template")
    } finally {
      setSending(false)
    }
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Template not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              Use Template: {template.name}
            </h1>
            <p className="text-sm text-slate-600">
              {template.documents.length} documents • {template.recipientRoles.length} recipients
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || recipients.some(r => !r.name || !r.email)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send for Signature
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Template Info */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Template Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Documents</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {template.documents.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Recipients</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {template.recipientRoles.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">View Mode</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {template.settings.viewMode === 'shared' ? 'Shared' : 'Isolated'}
                  </p>
                </div>
              </div>
            </div>

            {template.description && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">{template.description}</p>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Enter Recipient Details
            </h2>
            
            <div className="space-y-4">
              {template.recipientRoles.map((role, index) => (
                <div key={role.index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: role.color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{role.role}</h3>
                      <p className="text-sm text-slate-600">
                        {template.settings.signingOrder === 'sequential' && index > 0 
                          ? `Will receive invitation after Recipient ${index} signs`
                          : 'Will receive invitation immediately'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={recipients[index]?.name || ""}
                        onChange={(e) => {
                          const newRecipients = [...recipients]
                          newRecipients[index] = {
                            ...newRecipients[index],
                            name: e.target.value
                          }
                          setRecipients(newRecipients)
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={recipients[index]?.email || ""}
                        onChange={(e) => {
                          const newRecipients = [...recipients]
                          newRecipients[index] = {
                            ...newRecipients[index],
                            email: e.target.value
                          }
                          setRecipients(newRecipients)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Message */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Optional Message & Due Date
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Personal Message (optional)
                </label>
                <Textarea
                  placeholder="Add a personal message to recipients..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date (optional)
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Documents Included
            </h2>
            
            <div className="space-y-2">
              {template.documents.map((doc, index) => (
                <div key={doc.documentId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{doc.filename}</p>
                    <p className="text-sm text-slate-600">{doc.numPages} pages</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}