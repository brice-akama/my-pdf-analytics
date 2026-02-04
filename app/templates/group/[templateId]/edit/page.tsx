// app/templates/group/[templateId]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Plus,
  FileText,
  Edit3,
  Calendar,
  Type,
  CheckSquare,
  Paperclip,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import SignatureFieldEditor from "../../create/components/SignatureFieldEditor"
 

type Template = {
  _id: string
  name: string
  description: string
  documents: Array<{
    documentId: string
    filename: string
    numPages: number
    order: number
    signatureFields: any[]
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
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.templateId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Template data
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([])
  const [recipientRoles, setRecipientRoles] = useState<any[]>([])
  const [settings, setSettings] = useState({
    viewMode: "shared",
    signingOrder: "any",
    expirationDays: "30"
  })
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0)

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
          const template: Template = data.template
          
          // Load existing data
          setTemplateName(template.name)
          setTemplateDescription(template.description || "")
          setSelectedDocuments(template.documents)
          setRecipientRoles(template.recipientRoles)
          setSettings(template.settings)
        }
      }
    } catch (error) {
      console.error("Failed to fetch template:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name")
      return
    }

    try {
      setSaving(true)
      
      const res = await fetch(`/api/templates/group/${templateId}`, {
        method: "PATCH",
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
        alert("✅ Template updated successfully!")
        router.push(`/templates/group/${templateId}/preview`)
      } else {
        alert(`❌ Failed to update template: ${data.error}`)
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Failed to update template")
    } finally {
      setSaving(false)
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
        signatureFields: doc.signatureFields.filter((f: any) => f.recipientIndex !== index)
      }))
    )
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
              Edit Template: {templateName}
            </h1>
            <p className="text-sm text-slate-600">
              Step {currentStep} of 4
            </p>
          </div>

          <Button
            onClick={handleSaveTemplate}
            disabled={saving || !templateName}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, name: "Template Info" },
              { num: 2, name: "Signature Fields" },
              { num: 3, name: "Recipients" },
              { num: 4, name: "Settings" }
            ].map((step) => (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === step.num
                      ? "bg-purple-100 text-purple-700"
                      : currentStep > step.num
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.num
                      ? "bg-purple-600 text-white"
                      : currentStep > step.num
                      ? "bg-green-600 text-white"
                      : "bg-slate-300 text-slate-600"
                  }`}>
                    {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
                  </div>
                  <span className="font-medium">{step.name}</span>
                </button>
                {step.num < 4 && (
                  <div className={`h-0.5 w-16 mx-2 ${
                    currentStep > step.num ? "bg-green-600" : "bg-slate-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

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
                    Next: Edit Signature Fields
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Edit Signature Fields */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-[calc(100vh-280px)]"
              >
                <div className="h-full bg-white rounded-xl border shadow-sm overflow-hidden">
                  {selectedDocuments.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          No Documents
                        </h3>
                        <p className="text-slate-600">
                          This template has no documents
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Document Tabs */}
                      <div className="border-b bg-slate-50 p-2 flex gap-2 overflow-x-auto">
                        {selectedDocuments.map((doc, index) => (
                          <button
                            key={doc.documentId}
                            onClick={() => setActiveDocumentIndex(index)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                              activeDocumentIndex === index
                                ? "bg-purple-600 text-white"
                                : "bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {doc.filename}
                            {doc.signatureFields.length > 0 && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                activeDocumentIndex === index
                                  ? "bg-white/20"
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                                {doc.signatureFields.length}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Field Editor */}
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
                    </div>
                  )}
                </div>

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
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Next: Edit Recipients
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Edit Recipients */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-white rounded-xl border shadow-sm p-8 mb-6 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Edit Recipient Roles
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Modify recipient roles for this template
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
                    disabled={saving}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}