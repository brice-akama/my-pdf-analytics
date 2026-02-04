// app/templates/group/[templateId]/duplicate/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Copy,
  Loader2,
  CheckCircle2,
  FileText,
  Users,
  Calendar,
  AlertCircle,
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
  usageCount: number
}

export default function DuplicateTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.templateId as string

  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)
  const [newTemplateName, setNewTemplateName] = useState("")

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
          setNewTemplateName(`${data.template.name} (Copy)`)
        }
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!newTemplateName.trim()) {
      alert("Please enter a name for the duplicated template")
      return
    }

    try {
      setDuplicating(true)
      
      const res = await fetch(`/api/templates/group/${templateId}/duplicate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`✅ ${data.message}`)
        router.push(`/templates/group/${data.templateId}/preview`)
      } else {
        alert(`❌ Failed to duplicate: ${data.error}`)
      }
    } catch (error) {
      console.error("Duplicate error:", error)
      alert("❌ Failed to duplicate template")
    } finally {
      setDuplicating(false)
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Template not found</p>
          <Button onClick={() => router.push('/templates/group')}>
            Back to Templates
          </Button>
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
              Duplicate Template
            </h1>
            <p className="text-sm text-slate-600">
              Create a copy of this template
            </p>
          </div>

          <Button
            onClick={handleDuplicate}
            disabled={duplicating || !newTemplateName.trim()}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {duplicating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Create Duplicate
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Original Template Info */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
                <Copy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Original Template
                </h2>
                <p className="text-slate-600">{template.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-xs text-slate-600">Documents</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {template.documents.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-xs text-slate-600">Recipients</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {template.recipientRoles.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-xs text-slate-600">Times Used</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {template.usageCount}
                  </p>
                </div>
              </div>
            </div>

            {template.description && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">{template.description}</p>
              </div>
            )}
          </div>

          {/* New Template Name */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Copy className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  New Template
                </h2>
                <p className="text-sm text-slate-600">
                  Give your duplicated template a unique name
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Template Name *
              </label>
              <Input
                placeholder="Enter a name for the duplicate template..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="text-lg"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                The duplicate will include all documents, recipient roles, and settings from the original template.
              </p>
            </div>
          </div>

          {/* What Will Be Copied */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              What will be copied:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  All {template.documents.length} documents
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Signature field placements
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {template.recipientRoles.length} recipient roles
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  View mode settings
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Signing order settings
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Expiration settings
                </div>
              </div>
            </div>
          </div>

          {/* Documents Preview */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Documents Included ({template.documents.length})
            </h3>
            
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

          {/* Recipients Preview */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Recipient Roles ({template.recipientRoles.length})
            </h3>
            
            <div className="space-y-2">
              {template.recipientRoles.map((role) => (
                <div key={role.index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: role.color }}
                  >
                    {role.index + 1}
                  </div>
                  <p className="font-medium text-slate-900">{role.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Preview */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">View Mode</p>
                <p className="font-medium text-slate-900">
                  {template.settings.viewMode === 'shared' ? 'Shared' : 'Isolated'}
                </p>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Signing Order</p>
                <p className="font-medium text-slate-900">
                  {template.settings.signingOrder === 'sequential' ? 'Sequential' : 'Any Order'}
                </p>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Expiration</p>
                <p className="font-medium text-slate-900">
                  {template.settings.expirationDays === 'never' 
                    ? 'Never' 
                    : `${template.settings.expirationDays} days`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
 
 
 