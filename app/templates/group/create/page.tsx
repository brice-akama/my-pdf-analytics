// app/templates/group/create/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  FileText,
  Plus,
  X,
  Check,
  Users,
  Settings,
  Loader2,
  Eye,
  Edit3,
  Calendar,
  CheckSquare,
  Paperclip,
  Type,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SignatureFieldEditor from "./components/SignatureFieldEditor"
import { Label } from "recharts"

type Document = {
  _id: string
  originalFilename: string
  numPages: number
  cloudinaryPdfUrl: string
}

type SelectedDocument = {
  documentId: string
  filename: string
  numPages: number
  cloudinaryPdfUrl: string
  order: number
  signatureFields: SignatureField[]
}

type SignatureField = {
  id: string
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'attachment'
  x: number
  y: number
  page: number
  width: number
  height: number
  recipientIndex: number
}

type RecipientRole = {
  index: number
  role: string
  color: string
}

export default function CreateGroupTemplatePage() {
  const router = useRouter()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  
  // Template data
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([])
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0)
  const [showDocumentDrawer, setShowDocumentDrawer] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
const [previewDocIndex, setPreviewDocIndex] = useState(0)
 
const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null)
const [previewPdfLoading, setPreviewPdfLoading] = useState(false)
const [previewPdfError, setPreviewPdfError] = useState<string | null>(null)
  const [recipientRoles, setRecipientRoles] = useState<RecipientRole[]>([
    { index: 0, role: "Recipient 1", color: "#8B5CF6" }
  ])
  const [settings, setSettings] = useState({
    viewMode: "shared",
    signingOrder: "any",
    expirationDays: "30"
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/documents", {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAvailableDocuments(data.documents.filter((doc: any) => !doc.archived))
        }
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }


  // Fetch PDF for preview modal
useEffect(() => {
  if (!showPreview || selectedDocuments.length === 0) {
    // Clean up blob URL when preview closes
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl)
      setPreviewPdfBlobUrl(null)
    }
    return
  }

  const currentDoc = selectedDocuments[previewDocIndex]
  if (!currentDoc) return

  const fetchPreviewPdf = async () => {
    try {
      setPreviewPdfLoading(true)
      setPreviewPdfError(null)
      
      console.log('🔄 [PREVIEW] Fetching PDF for:', currentDoc.filename);
      console.log('📄 [PREVIEW] Document ID:', currentDoc.documentId);
      
      const res = await fetch(`/api/documents/${currentDoc.documentId}/file?serve=blob`, {
        credentials: 'include',
      })

      console.log('📡 [PREVIEW] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ [PREVIEW] Fetch failed:', errorText);
        throw new Error(`Failed to fetch PDF: ${res.status}`)
      }

      const blob = await res.blob()
      console.log('✅ [PREVIEW] PDF blob received:', blob.size, 'bytes');
      
      // Revoke old blob URL if exists
      if (previewPdfBlobUrl) {
        URL.revokeObjectURL(previewPdfBlobUrl)
      }
      
      const blobUrl = URL.createObjectURL(blob)
      setPreviewPdfBlobUrl(blobUrl)
      console.log('✅ [PREVIEW] Blob URL created');
      
    } catch (error) {
      console.error('❌ [PREVIEW] PDF fetch error:', error)
      setPreviewPdfError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setPreviewPdfLoading(false)
    }
  }

  fetchPreviewPdf()

  // Cleanup function
  return () => {
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl)
    }
  }
}, [showPreview, previewDocIndex, selectedDocuments])

  const handleSelectDocument = (doc: Document) => {
    if (selectedDocuments.find(d => d.documentId === doc._id)) {
      // Remove document
      setSelectedDocuments(prev => prev.filter(d => d.documentId !== doc._id))
    } else {
      // Add document
      setSelectedDocuments(prev => [
        ...prev,
        {
          documentId: doc._id,
          filename: doc.originalFilename,
          numPages: doc.numPages,
          cloudinaryPdfUrl: doc.cloudinaryPdfUrl,
          order: prev.length + 1,
          signatureFields: []
        }
      ])
    }
  }

  const addRecipientRole = () => {
    const newIndex = recipientRoles.length
    const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]
    
    setRecipientRoles(prev => [
      ...prev,
      {
        index: newIndex,
        role: `Recipient ${newIndex + 1}`,
        color: colors[newIndex % colors.length]
      }
    ])
  }

  const removeRecipientRole = (index: number) => {
    if (recipientRoles.length === 1) {
      alert("Template must have at least 1 recipient")
      return
    }
    
    setRecipientRoles(prev => prev.filter(r => r.index !== index))
    
    // Remove signature fields for this recipient
    setSelectedDocuments(prev => 
      prev.map(doc => ({
        ...doc,
        signatureFields: doc.signatureFields.filter(f => f.recipientIndex !== index)
      }))
    )
  }

  const handleSaveTemplate = async () => {
    // Validation
    if (!templateName.trim()) {
      alert("Please enter a template name")
      return
    }
    
    if (selectedDocuments.length < 2) {
      alert("Please select at least 2 documents")
      return
    }
    
    // Check if all documents have signature fields
    const docsWithoutFields = selectedDocuments.filter(doc => doc.signatureFields.length === 0)
    if (docsWithoutFields.length > 0) {
      if (!confirm(`${docsWithoutFields.length} document(s) have no signature fields. Continue anyway?`)) {
        return
      }
    }

    try {
      setSavingTemplate(true)
      
      const res = await fetch("/api/templates/group", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          documents: selectedDocuments,
          recipientRoles: recipientRoles,
          settings: settings
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert("✅ Template created successfully!")
        router.push('/templates/group')
      } else {
        alert(`❌ Failed to create template: ${data.error}`)
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Failed to create template")
    } finally {
      setSavingTemplate(false)
    }
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
           
          </div>
         {/* Preview Button (if has content) */}
{templateName && selectedDocuments.length > 0 && (
  <Button
    variant="outline"
    onClick={() => {
      if (selectedDocuments.length === 0) {
        alert('⚠️ Please select at least one document first')
        return
      }
      setShowPreview(true)
      setPreviewDocIndex(0)
    }}
    className="gap-2"
  >
    <Eye className="h-4 w-4" />
    Preview
  </Button>
)}
          <Button
            onClick={handleSaveTemplate}
            disabled={savingTemplate || selectedDocuments.length < 2 || !templateName}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {savingTemplate ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </header>

      
      

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: Template Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl border shadow-sm p-8 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Template Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Template Name *
                    </label>
                    <Input
                      placeholder="e.g., Employee Onboarding Package"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (optional)
                    </label>
                    <Textarea
                      placeholder="Describe what this template is for..."
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!templateName}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Next: Select Documents
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Documents */}

            {/* STEP 2: Place Fields */}
{currentStep === 2 && (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="h-[calc(100vh-200px)]"
  >
    <div className="h-full flex gap-6">
      
      {/* Center - PDF Viewer (FULL WIDTH) */}
      <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
        {selectedDocuments.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <FileText className="h-20 w-20 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No Documents Selected
              </h3>
              <p className="text-slate-600 mb-6">
                Click "Select Documents" in the toolbar above to choose documents for your template
              </p>
              <Button
                onClick={() => setShowDocumentDrawer(true)}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <FileText className="h-4 w-4" />
                Select Documents
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Document Tabs */}
            <div className="border-b bg-slate-50 px-4 py-2 flex items-center gap-3 overflow-x-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentDrawer(true)}
                className="flex-shrink-0 gap-2"
              >
                <FileText className="h-4 w-4" />
                Manage ({selectedDocuments.length})
              </Button>
              
              <div className="h-6 w-px bg-slate-300" />
              
              {selectedDocuments.map((doc, index) => (
                <button
                  key={doc.documentId}
                  onClick={() => setActiveDocumentIndex(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeDocumentIndex === index
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[150px]">
                      {doc.filename}
                    </span>
                    {doc.signatureFields.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeDocumentIndex === index
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {doc.signatureFields.length}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <SignatureFieldEditor
                document={selectedDocuments[activeDocumentIndex]}
                recipientRoles={recipientRoles}
                onFieldsUpdate={(documentId, fields) => {
                  setSelectedDocuments(prev =>
                    prev.map(doc =>
                      doc.documentId === documentId
                        ? { ...doc, signatureFields: fields }
                        : doc
                    )
                  )
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar - Field Tools (COMPACT) */}
      <div className="w-64 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="font-bold text-slate-900 text-base">Field Toolbox</h3>
          <p className="text-xs text-slate-600 mt-1">Drag fields to PDF pages</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Assign To
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="h-6 px-2 text-xs"
              >
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {recipientRoles.map((role, index) => (
                <div
                  key={role.index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: role.color }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs font-medium text-slate-900 truncate">
                    {role.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Draggable Fields */}
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Fields
            </p>
            <div className="space-y-2">
              
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("fieldType", "signature");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Edit3 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">Signature</p>
                  <p className="text-xs text-slate-600">140×50px</p>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("fieldType", "date");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">Date</p>
                  <p className="text-xs text-slate-600">120×36px</p>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("fieldType", "text");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Type className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">Text Input</p>
                  <p className="text-xs text-slate-600">120×36px</p>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("fieldType", "checkbox");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">Checkbox</p>
                  <p className="text-xs text-slate-600">24×24px</p>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("fieldType", "attachment");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="group flex items-center gap-2 p-3 bg-gradient-to-r from-rose-50 to-rose-100 border-2 border-rose-200 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Paperclip className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs">Attachment</p>
                  <p className="text-xs text-slate-600">120×36px</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Tip */}
        <div className="p-3 border-t bg-blue-50">
          <p className="text-xs text-blue-900">
            <strong>💡 Tip:</strong> Drag fields onto any page to place them
          </p>
        </div>
      </div>

    </div>

    {/* Navigation */}
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <Button
        onClick={() => setCurrentStep(3)}
        disabled={selectedDocuments.length < 2}
        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        Next: Define Recipients
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Button>
    </div>
  </motion.div>
)}

{/* Document Selection Drawer */}
{showDocumentDrawer && (
  <>
    <div 
      className="fixed inset-0 bg-black/50 z-50"
      onClick={() => setShowDocumentDrawer(false)}
    />
    
    <div className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Select Documents</h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose 2+ documents for this template
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDocumentDrawer(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Selected Count */}
      {selectedDocuments.length > 0 && (
        <div className="px-6 py-3 bg-purple-50 border-b">
          <p className="text-sm font-medium text-purple-900">
            ✅ {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {availableDocuments.map((doc) => {
              const isSelected = selectedDocuments.some(d => d.documentId === doc._id)
              const selectedDoc = selectedDocuments.find(d => d.documentId === doc._id)
              const fieldCount = selectedDoc?.signatureFields.length || 0
              
              return (
                <button
                  key={doc._id}
                  onClick={() => handleSelectDocument(doc)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                    isSelected
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-slate-200 hover:border-purple-300 bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected 
                        ? "bg-purple-600 scale-105" 
                        : "bg-slate-100 group-hover:bg-purple-100"
                    }`}>
                      {isSelected ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <FileText className="h-6 w-6 text-slate-400 group-hover:text-purple-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">
                        {doc.originalFilename}
                      </h3>
                      <p className="text-xs text-slate-600 mb-2">
                        📄 {doc.numPages} page{doc.numPages !== 1 ? 's' : ''}
                      </p>
                      {isSelected && fieldCount > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                          <p className="text-xs font-medium text-purple-700">
                            {fieldCount} field{fieldCount !== 1 ? 's' : ''} placed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-slate-50">
        {selectedDocuments.length < 2 ? (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="h-5 w-5 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-yellow-900">
              Select at least 2 documents to create a template
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-900">
              Ready to proceed with {selectedDocuments.length} documents
            </p>
          </div>
        )}
        
        <Button
          onClick={() => setShowDocumentDrawer(false)}
          disabled={selectedDocuments.length < 2}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Continue with {selectedDocuments.length} Document{selectedDocuments.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  </>
)}

      {/* STEP 3: Define Recipients */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-xl border shadow-sm p-8 mb-6 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Define Recipient Roles
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Create roles for recipients (you'll enter actual names when using the template)
                  </p>

                  <div className="space-y-4">
                    {recipientRoles.map((role, index) => (
                      <div key={role.index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: role.color }}
                        >
                          {index + 1}
                        </div>
                        
                        <Input
                          value={role.role}
                          onChange={(e) => {
                            setRecipientRoles(prev => 
                              prev.map(r => r.index === role.index ? { ...r, role: e.target.value } : r)
                            )
                          }}
                          placeholder={`Recipient ${index + 1} role...`}
                          className="flex-1"
                        />
                        
                        {recipientRoles.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRecipientRole(role.index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={addRecipientRole}
                    variant="outline"
                    className="w-full mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Recipient Role
                  </Button>
                </div>

                <div className="flex justify-between max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Next: Settings
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Settings */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-xl border shadow-sm p-8 mb-6 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Template Settings
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Configure how signatures will be collected
                  </p>

                  <div className="space-y-6">
                    {/* View Mode */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        View Mode
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, viewMode: "shared" }))}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            settings.viewMode === "shared"
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900 mb-1">Shared View</h4>
                          <p className="text-sm text-slate-600">
                            All signers see each other's signatures
                          </p>
                        </button>
                        
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, viewMode: "isolated" }))}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            settings.viewMode === "isolated"
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900 mb-1">Isolated View</h4>
                          <p className="text-sm text-slate-600">
                            Each signer only sees their own fields
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Signing Order */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Signing Order
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, signingOrder: "any" }))}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            settings.signingOrder === "any"
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900 mb-1">Any Order</h4>
                          <p className="text-sm text-slate-600">
                            Recipients can sign in any order
                          </p>
                        </button>
                        
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, signingOrder: "sequential" }))}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            settings.signingOrder === "sequential"
                              ? "border-purple-600 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300"
                          }`}
                        >
                          <h4 className="font-semibold text-slate-900 mb-1">Sequential</h4>
                          <p className="text-sm text-slate-600">
                            Recipients must sign in order
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Expiration */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Default Expiration
                      </label>
                      <select
                        value={settings.expirationDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, expirationDays: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="never">Never expires</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {savingTemplate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Preview Modal */}
{showPreview && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
      onClick={() => setShowPreview(false)}
    />
    
    {/* Modal */}
    <div className="fixed inset-4 md:inset-8 bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="h-6 w-6 text-purple-600" />
            Template Preview
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Review your template before saving
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPreview(false)}
          className="hover:bg-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* Left Sidebar - Template Info */}
        <div className="w-80 border-r bg-slate-50 overflow-y-auto p-6 space-y-6">
          
          {/* Template Name */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Template Name
            </h3>
            <p className="font-semibold text-slate-900 text-lg">
              {templateName || "Untitled Template"}
            </p>
            {templateDescription && (
              <p className="text-sm text-slate-600 mt-2">
                {templateDescription}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Documents</p>
              <p className="text-2xl font-bold text-purple-600">
                {selectedDocuments.length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Recipients</p>
              <p className="text-2xl font-bold text-blue-600">
                {recipientRoles.length}
              </p>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Recipient Roles
            </h3>
            <div className="space-y-2">
              {recipientRoles.map((role, index) => {
                const fieldCount = selectedDocuments[previewDocIndex]?.signatureFields.filter(
                  f => f.recipientIndex === role.index
                ).length || 0
                
                return (
                  <div
                    key={role.index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: role.color }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{role.role}</p>
                      <p className="text-xs text-slate-600">
                        {fieldCount} field{fieldCount !== 1 ? 's' : ''} in current doc
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Settings
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-xs text-slate-600">View Mode</span>
                <span className="text-xs font-medium text-slate-900">
                  {settings.viewMode === 'shared' ? 'Shared' : 'Isolated'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-xs text-slate-600">Signing Order</span>
                <span className="text-xs font-medium text-slate-900">
                  {settings.signingOrder === 'sequential' ? 'Sequential' : 'Any Order'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-xs text-slate-600">Expiration</span>
                <span className="text-xs font-medium text-slate-900">
                  {settings.expirationDays === 'never' ? 'Never' : `${settings.expirationDays} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Documents
            </h3>
            <div className="space-y-2">
              {selectedDocuments.map((doc, index) => (
                <button
                  key={doc.documentId}
                  onClick={() => {
                    setPreviewDocIndex(index)
                    
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                    previewDocIndex === index
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-slate-900 hover:bg-slate-100 border'
                  }`}
                >
                  <div className={`h-6 w-6 rounded flex items-center justify-center text-xs font-bold ${
                    previewDocIndex === index ? 'bg-white/20' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{doc.filename}</p>
                    <p className={`text-xs ${previewDocIndex === index ? 'text-white/70' : 'text-slate-500'}`}>
                      {doc.numPages} pages • {doc.signatureFields.length} fields
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side - Document Preview */}
        <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col">
          
          {/* Document Viewer Header */}
<div className="bg-white border-b p-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-slate-900">
        {selectedDocuments[previewDocIndex]?.filename || "No Document"}
      </h3>
      <p className="text-sm text-slate-600 mt-1">
        {selectedDocuments[previewDocIndex]?.numPages || 0} pages • {
          selectedDocuments[previewDocIndex]?.signatureFields.length || 0
        } total fields
      </p>
    </div>

    {/* Field Count by Recipient */}
    {selectedDocuments[previewDocIndex] && (
      <div className="flex items-center gap-2 flex-wrap">
        {recipientRoles.map((role) => {
          const count = selectedDocuments[previewDocIndex].signatureFields.filter(
            f => f.recipientIndex === role.index
          ).length
          if (count === 0) return null
          
          return (
            <span
              key={role.index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: role.color }}
            >
              {role.role}: {count} field{count !== 1 ? 's' : ''}
            </span>
          )
        })}
      </div>
    )}
  </div>
</div>
          {/* PDF Preview - ALL PAGES */}
<div className="flex-1 overflow-auto p-6 bg-slate-100">
  <div className="max-w-4xl mx-auto space-y-6">
    {selectedDocuments[previewDocIndex] ? (
      previewPdfLoading ? (
        // Loading State
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading PDF...</p>
          <p className="text-sm text-slate-500 mt-2">
            {selectedDocuments[previewDocIndex].filename}
          </p>
        </div>
      ) : previewPdfError ? (
        // Error State
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load PDF</h3>
          <p className="text-sm text-slate-600 mb-4">{previewPdfError}</p>
          <Button
            onClick={() => {
              setPreviewPdfError(null)
              setPreviewPdfLoading(true)
            }}
            variant="outline"
            className="gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </Button>
        </div>
      ) : previewPdfBlobUrl ? (
        // ALL PAGES - Render each page separately
        Array.from({ length: selectedDocuments[previewDocIndex].numPages }, (_, pageIndex) => {
          const pageNumber = pageIndex + 1
          const pageFields = selectedDocuments[previewDocIndex].signatureFields.filter(
            f => f.page === pageNumber
          )

          return (
            <div key={pageNumber} className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              {/* Page Number Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Page {pageNumber} of {selectedDocuments[previewDocIndex].numPages}
                </div>
              </div>

              {/* Page Field Count Badge */}
              {pageFields.length > 0 && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                    {pageFields.length} field{pageFields.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* PDF Page */}
              <iframe
                src={`${previewPdfBlobUrl}#page=${pageNumber}&toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100`}
                className="w-full border-0 pointer-events-none"
                style={{ height: '1122px' }} // A4 height at 96 DPI (11.69 inches * 96)
                title={`${selectedDocuments[previewDocIndex].filename} - Page ${pageNumber}`}
                onLoad={() => console.log(`✅ [PREVIEW] Page ${pageNumber} loaded`)}
              />

              {/* Signature Fields Overlay for THIS page */}
              <div className="absolute inset-0 pointer-events-none">
                {pageFields.map((field) => {
                  const recipient = recipientRoles[field.recipientIndex]
                  
                  // Calculate position relative to this page
                  // Since each page is 1122px tall, we need to position relative to page start
                  const relativeY = field.y // This is already a percentage of the page
                  
                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute"
                      style={{
                        left: `${field.x}%`,
                        top: `${relativeY}%`,
                        width: `${field.width}px`,
                        height: `${field.height}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className="w-full h-full rounded shadow-lg border-2 flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: `${recipient?.color}20`,
                          borderColor: recipient?.color,
                          color: recipient?.color,
                        }}
                      >
                        {field.type === 'signature' && '✍️'}
                        {field.type === 'date' && '📅'}
                        {field.type === 'text' && '📝'}
                        {field.type === 'checkbox' && '☑️'}
                        {field.type === 'attachment' && '📎'}
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

              {/* No Fields Message */}
              {pageFields.length === 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                    No signature fields on this page
                  </div>
                </div>
              )}
            </div>
          )
        })
      ) : (
        // No PDF loaded yet
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Preparing PDF...</p>
        </div>
      )
    ) : (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center">
        <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">No document selected</p>
      </div>
    )}
  </div>
</div>
</div>
</div>

      {/* Modal Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-slate-50">
        <p className="text-sm text-slate-600">
          💡 This is a preview. Changes are not saved yet.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
          >
            Close Preview
          </Button>
          <Button
            onClick={() => {
              setShowPreview(false)
              // Optionally jump to final step
              setCurrentStep(4)
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Continue Editing
          </Button>
        </div>
      </div>

    </div>
  </>
)}
    </div>
  )
}