// app/templates/group/[templateId]/preview/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  FileText,
  Users,
  Eye,
  Send,
  Edit,
  Copy,
  Share2,
  Loader2,
  Calendar,
  Settings,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"

type Template = {
  _id: string
  name: string
  description: string
  documents: Array<{
    documentId: string
    filename: string
    numPages: number
    order: number
    signatureFields: Array<{
      id: string
      type: string
      x: number
      y: number
      page: number
      recipientIndex: number
    }>
    cloudinaryPdfUrl: string
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
  createdAt: string
  lastUsed: string | null
  usageCount: number
  userId: string
}

export default function TemplatePreviewPage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.templateId as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0)
  const [selectedPage, setSelectedPage] = useState(1)

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
        }
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
    } finally {
      setLoading(false)
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
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Template not found</p>
          <Button onClick={() => router.push('/templates/group')}>
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  const selectedDocument = template.documents[selectedDocumentIndex]
  const currentPageFields = selectedDocument.signatureFields.filter(
    f => f.page === selectedPage
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/templates/group')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              {template.name}
            </h1>
            <p className="text-sm text-slate-600">
              Template Preview
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/templates/group/${templateId}/duplicate`)}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push(`/templates/group/${templateId}/share`)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push(`/templates/group/${templateId}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            
            <Button
              onClick={() => router.push(`/templates/group/${templateId}/use`)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="h-4 w-4" />
              Use Template
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Template Info */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Template Stats */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Overview</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-600">Documents</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {template.documents.length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-600">Recipients</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {template.recipientRoles.length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xs text-slate-600">Times Used</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {template.usageCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  {template.description}
                </p>
              </div>
            )}

            {/* Recipients */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Recipient Roles</h3>
              <div className="space-y-2">
                {template.recipientRoles.map((role) => {
                  const fieldCount = selectedDocument.signatureFields.filter(
                    f => f.recipientIndex === role.index
                  ).length
                  
                  return (
                    <div
                      key={role.index}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: role.color }}
                      >
                        {role.index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{role.role}</p>
                        <p className="text-xs text-slate-600">
                          {fieldCount} field{fieldCount !== 1 ? 's' : ''} in this document
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">View Mode</span>
                  <span className="text-sm font-medium text-slate-900">
                    {template.settings.viewMode === 'shared' ? 'Shared' : 'Isolated'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Signing Order</span>
                  <span className="text-sm font-medium text-slate-900">
                    {template.settings.signingOrder === 'sequential' ? 'Sequential' : 'Any Order'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Expiration</span>
                  <span className="text-sm font-medium text-slate-900">
                    {template.settings.expirationDays === 'never' 
                      ? 'Never' 
                      : `${template.settings.expirationDays} days`}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Documents</h3>
              <div className="space-y-2">
                {template.documents.map((doc, index) => (
                  <button
                    key={doc.documentId}
                    onClick={() => {
                      setSelectedDocumentIndex(index)
                      setSelectedPage(1)
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedDocumentIndex === index
                        ? 'bg-purple-50 border-2 border-purple-600'
                        : 'bg-slate-50 border-2 border-transparent hover:border-purple-300'
                    }`}
                  >
                    <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-600">
                        {doc.numPages} pages • {doc.signatureFields.length} fields
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Document Preview */}
        <div className="flex-1 bg-slate-100 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Document Viewer Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">
                  {selectedDocument.filename}
                </h2>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPage(Math.max(1, selectedPage - 1))}
                    disabled={selectedPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-slate-600">
                    Page {selectedPage} of {selectedDocument.numPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPage(Math.min(selectedDocument.numPages, selectedPage + 1))}
                    disabled={selectedPage === selectedDocument.numPages}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Field Legend */}
              {currentPageFields.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-600">Fields on this page:</span>
                  {template.recipientRoles.map((role) => {
                    const count = currentPageFields.filter(f => f.recipientIndex === role.index).length
                    if (count === 0) return null
                    
                    return (
                      <span
                        key={role.index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: role.color }}
                      >
                        {role.role}: {count}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* PDF Preview */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                  {/* PDF Iframe */}
                  <iframe
                    src={`${selectedDocument.cloudinaryPdfUrl}#page=${selectedPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full border-0"
                    style={{ height: '842px' }}
                    title={`${selectedDocument.filename} - Page ${selectedPage}`}
                  />

                  {/* Signature Fields Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {currentPageFields.map((field) => {
                      const recipient = template.recipientRoles[field.recipientIndex]
                      
                      return (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute"
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div
                            className="px-3 py-1.5 rounded shadow-lg border-2 text-xs font-semibold flex items-center gap-1"
                            style={{
                              backgroundColor: `${recipient?.color}20`,
                              borderColor: recipient?.color,
                              color: recipient?.color,
                            }}
                          >
                            {field.type === 'signature' && '✍️ Signature'}
                            {field.type === 'date' && '📅 Date'}
                            {field.type === 'text' && '📝 Text'}
                            {field.type === 'checkbox' && '☑️ Checkbox'}
                            {field.type === 'attachment' && '📎 Attachment'}
                          </div>
                          
                          <div
                            className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
                            style={{ backgroundColor: recipient?.color }}
                          >
                            {recipient?.role}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {currentPageFields.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-900">
                      ℹ️ No signature fields on this page
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}