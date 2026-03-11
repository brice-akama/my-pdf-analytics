// app/documents-page/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, ArrowLeft, MoreVertical, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import PageInfoTooltip from "@/components/PageInfoTooltip"

// Components
import Sidebar from "./components/Sidebar"
import DocumentList from "./components/DocumentList"
import BulkActionBar from "./components/BulkActionBar"
import { DocumentType } from "./components/DocumentCard"

// Drawers (kept from original — not split since they are complex and self-contained)
import { Drawer } from "@/components/ui/drawer"
import PreviewDrawerContent from "./components/PreviewDrawerContent"
import ShareDrawerContent from "./components/ShareDrawerContent"
import ExportDrawerContent from "./components/ExportDrawerContent"

type ActiveView = "documents" | "templates" | "archive" | "team-documents" | "team-templates"
type UploadStatus = "idle" | "uploading" | "success" | "error"

export default function DocumentsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Data state ──────────────────────────────────────────────────
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [templates, setTemplates] = useState<DocumentType[]>([])
  const [archivedDocuments, setArchivedDocuments] = useState<DocumentType[]>([])
  const [teamDocuments, setTeamDocuments] = useState<any[]>([])
  const [teamName, setTeamName] = useState("Team")
  const [loadingTeamDocs, setLoadingTeamDocs] = useState(false)
  const [drafts, setDrafts] = useState<Map<string, any>>(new Map())
  const [sentRequests, setSentRequests] = useState<Map<string, any>>(new Map())
  const [groupTemplatesCount, setGroupTemplatesCount] = useState(0)

  // ── UI state ────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ActiveView>("documents")
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  // ── Drawer state ────────────────────────────────────────────────
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false)
  const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null)
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false)
  const [exportingDocumentId, setExportingDocumentId] = useState<string | null>(null)

  // ── Pagination ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const itemsPerPage = 5

  // ── Fetch functions ─────────────────────────────────────────────
  const fetchDocuments = async (page = 1) => {
    try {
      const res = await fetch(`/api/documents?page=${page}&limit=${itemsPerPage}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDocuments(data.documents.filter((d: DocumentType) => !d.isTemplate))
          setCurrentPage(data.currentPage)
          setTotalPages(data.totalPages)
          setTotalDocuments(data.totalDocuments)
        }
      }
    } catch (e) { console.error(e) }
  }

  const fetchTemplates = async (page = 1) => {
    try {
      const res = await fetch(`/api/documents?templates=true&page=${page}&limit=${itemsPerPage}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setTemplates(data.documents.filter((d: DocumentType) => d.isTemplate))
      }
    } catch (e) { console.error(e) }
  }

  const fetchArchivedDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?deleted=true`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setArchivedDocuments(data.documents)
      }
    } catch (e) { console.error(e) }
  }

  const fetchTeamDocuments = async () => {
    setLoadingTeamDocs(true)
    try {
      const res = await fetch("/api/documents/team", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) { setTeamDocuments(data.documents); setTeamName(data.teamName || "Team") }
      }
    } catch (e) { console.error(e) }
    finally { setLoadingTeamDocs(false) }
  }

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/signature-drafts", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.drafts) {
          const map = new Map()
          data.drafts.forEach((d: any) => map.set(d.documentId, d))
          setDrafts(map)
        }
      }
    } catch (e) { console.error(e) }
  }

  const fetchGroupTemplatesCount = async () => {
    try {
      const res = await fetch("/api/templates/group", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setGroupTemplatesCount(data.templates.length)
      }
    } catch (e) { console.error(e) }
  }

  const fetchSentRequests = async () => {
    try {
      const allDocs = [...documents, ...templates]
      const map = new Map()
      for (const doc of allDocs) {
        const res = await fetch(`/api/signature-requests/check/${doc._id}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (data.hasSentRequest) {
            const signedCount = data.recipients.filter((r: any) => r.status === "signed").length
            map.set(doc._id, {
              ...data,
              signedCount,
              totalRecipients: data.recipients.length,
              allSigned: signedCount === data.recipients.length,
              anySigned: signedCount > 0,
            })
          }
        }
      }
      setSentRequests(map)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const load = async () => {
      await Promise.all([
        fetchDocuments(1), fetchTemplates(1),
        fetchArchivedDocuments(), fetchDrafts(),
        fetchGroupTemplatesCount(), fetchTeamDocuments(),
      ])
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (documents.length > 0 || templates.length > 0) {
      const t = setTimeout(fetchSentRequests, 300)
      return () => clearTimeout(t)
    }
  }, [documents.length, templates.length])

  // ── Handlers ────────────────────────────────────────────────────
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { fetchDocuments(); fetchTemplates(); return }
    try {
      const res = await fetch(`/api/documents?search=${encodeURIComponent(query)}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDocuments(data.documents.filter((d: DocumentType) => !d.isTemplate))
          setTemplates(data.documents.filter((d: DocumentType) => d.isTemplate))
        }
      }
    } catch (e) { fetchDocuments(); fetchTemplates() }
  }

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Move "${docName}" to archive?`)) return
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        toast.success("Moved to archive")
        fetchDocuments(); fetchTemplates(); fetchArchivedDocuments()
      } else toast.error("Failed to delete")
    } catch { toast.error("Network error") }
  }

  const handleRestore = async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/restore`, { method: "PATCH", credentials: "include" })
      if (res.ok) {
        toast.success(`"${docName}" restored`)
        fetchDocuments(); fetchTemplates(); fetchArchivedDocuments()
      } else toast.error("Failed to restore")
    } catch { toast.error("Network error") }
  }

  const handleShareToTeam = async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/team`, { method: "POST", credentials: "include" })
      if (res.ok) {
        toast.success(`"${docName}" moved to team`)
        fetchDocuments(); fetchTeamDocuments()
      } else toast.error("Failed to share")
    } catch { toast.error("Network error") }
  }

  const handleUnshareFromTeam = async (docId: string, docName: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/team`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        toast.success(`"${docName}" removed from team`)
        fetchDocuments(); fetchTeamDocuments()
      } else toast.error("Failed to unshare")
    } catch { toast.error("Network error") }
  }

  const handleOpenPreview = async (id: string) => {
    setPreviewDocumentId(id)
    try {
      const res = await fetch(`/api/signature-requests/check/${id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setPreviewData(data.hasSentRequest ? {
          recipients: data.recipients || [],
          signatureFields: data.signatureFields || [],
          viewMode: data.viewMode || "isolated",
        } : null)
      } else setPreviewData(null)
    } catch { setPreviewData(null) }
    setPreviewDrawerOpen(true)
  }

  const toggleDocumentSelection = (docId: string) => {
    const next = new Set(selectedDocuments)
    next.has(docId) ? next.delete(docId) : next.add(docId)
    setSelectedDocuments(next)
    if (next.size === 0) setBulkSelectionMode(false)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    if (file.type !== "application/pdf") {
      setUploadStatus("error"); setUploadMessage("Please upload a PDF file")
      setTimeout(() => setUploadStatus("idle"), 3000); return
    }
    setUploadStatus("uploading"); setUploadMessage("Uploading your document...")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" })
      const data = await res.json()
      if (res.ok && data.success) {
        setUploadStatus("success"); setUploadMessage(`Uploaded ${file.name}`)
        router.push(`/documents/${data.documentId}`)
        fetchDocuments()
        setTimeout(() => { setUploadStatus("idle"); setUploadMessage("") }, 3000)
      } else {
        setUploadStatus("error"); setUploadMessage(data.error || "Upload failed")
        setTimeout(() => setUploadStatus("idle"), 3000)
      }
    } catch {
      setUploadStatus("error"); setUploadMessage("Upload failed. Please try again.")
      setTimeout(() => setUploadStatus("idle"), 3000)
    }
  }

  const allDocs = [...documents, ...templates]
  const previewDoc = allDocs.find(d => d._id === previewDocumentId)
  const sharingDoc = allDocs.find(d => d._id === sharingDocumentId)

  return (
    <div className="min-h-screen bg-white">
      <PageInfoTooltip
        pageId="documents"
        message="Upload, manage, and organize your PDF documents."
        position="top"
      />

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <Sidebar
          mobile
          activeView={activeView}
          setActiveView={setActiveView}
          counts={{
            documents: documents.length,
            templates: templates.length,
            archive: archivedDocuments.length,
            groupTemplates: groupTemplatesCount,
            teamDocuments: teamDocuments.filter(d => !d.isTemplate).length,
            teamTemplates: teamDocuments.filter(d => d.isTemplate).length,
          }}
          teamName={teamName}
          onClose={() => setMobileSidebarOpen(false)}
          onUploadClick={() => fileInputRef.current?.click()}
          onFetchTeam={fetchTeamDocuments}
          onBulkMode={() => setBulkSelectionMode(true)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 gap-3">

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100">
              <MoreVertical className="h-5 w-5" />
            </button>
            <button onClick={() => router.push("/dashboard")}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:block">
              DocMetrics
            </span>
          </div>

          {/* Search */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="search" placeholder="Search..."
                className="w-full pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value) }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="lg:hidden">
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                {activeView === "documents" ? "Docs" : activeView === "templates" ? "Templates" : activeView === "archive" ? "Archive" : activeView === "team-documents" ? "Team Docs" : "Team Tmpl"}
              </span>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} size="sm"
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Upload</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          counts={{
            documents: documents.length,
            templates: templates.length,
            archive: archivedDocuments.length,
            groupTemplates: groupTemplatesCount,
            teamDocuments: teamDocuments.filter(d => !d.isTemplate).length,
            teamTemplates: teamDocuments.filter(d => d.isTemplate).length,
          }}
          teamName={teamName}
          onUploadClick={() => fileInputRef.current?.click()}
          onFetchTeam={fetchTeamDocuments}
          onBulkMode={() => setBulkSelectionMode(true)}
        />

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                  {activeView === "documents" ? "Documents" : activeView === "templates" ? "Templates" : activeView === "archive" ? "Archive" : activeView === "team-documents" ? `${teamName} Documents` : `${teamName} Templates`}
                </h1>
                <p className="text-sm text-slate-500">
                  {activeView === "documents" ? `${documents.length} documents` : activeView === "templates" ? `${templates.length} templates` : activeView === "archive" ? `${archivedDocuments.length} archived` : activeView === "team-documents" ? `${teamDocuments.filter(d => !d.isTemplate).length} shared` : `${teamDocuments.filter(d => d.isTemplate).length} shared`}
                </p>
              </div>
            </div>

            {/* Bulk bar */}
            <AnimatePresence>
              {bulkSelectionMode && (
                <BulkActionBar
                  count={selectedDocuments.size}
                  onSendForSignature={() => {
                    if (selectedDocuments.size < 2) { toast.error("Select at least 2 documents"); return }
                    router.push(`/documents/envelope/create?docs=${Array.from(selectedDocuments).join(",")}`)
                  }}
                  onClear={() => { setSelectedDocuments(new Set()); setBulkSelectionMode(false) }}
                />
              )}
            </AnimatePresence>

            {/* Upload status */}
            {uploadStatus !== "idle" && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                uploadStatus === "success" ? "bg-green-50 border border-green-200" :
                uploadStatus === "error" ? "bg-red-50 border border-red-200" :
                "bg-blue-50 border border-blue-200"
              }`}>
                {uploadStatus === "uploading" && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                {uploadStatus === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {uploadStatus === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
                <span className={`font-medium text-sm ${
                  uploadStatus === "success" ? "text-green-900" :
                  uploadStatus === "error" ? "text-red-900" : "text-blue-900"
                }`}>{uploadMessage}</span>
              </div>
            )}

            {/* Document list */}
            <DocumentList
              activeView={activeView}
              documents={documents}
              templates={templates}
              archivedDocuments={archivedDocuments}
              teamDocuments={teamDocuments}
              teamName={teamName}
              loadingTeamDocs={loadingTeamDocs}
              selectedDocuments={selectedDocuments}
              bulkSelectionMode={bulkSelectionMode}
              drafts={drafts}
              sentRequests={sentRequests}
              onSelect={(id) => { toggleDocumentSelection(id); if (!bulkSelectionMode) setBulkSelectionMode(true) }}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onShareToTeam={handleShareToTeam}
              onUnshareFromTeam={handleUnshareFromTeam}
              onOpenPreview={handleOpenPreview}
              onOpenExport={(id) => { setExportingDocumentId(id); setExportDrawerOpen(true) }}
              onOpenShare={(id) => { setSharingDocumentId(id); setShareDrawerOpen(true) }}
              currentPage={currentPage}
              totalPages={totalPages}
              totalDocuments={totalDocuments}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                if (activeView === "documents") fetchDocuments(page)
                else if (activeView === "templates") fetchTemplates(page)
                else fetchArchivedDocuments()
              }}
            />
          </div>
        </main>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/pdf"
        onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }}
        className="hidden"
      />

      {/* Preview Drawer */}
      <Drawer open={previewDrawerOpen} onOpenChange={setPreviewDrawerOpen}>
        {previewDoc && (
          <PreviewDrawerContent
            doc={previewDoc}
            previewData={previewData}
            onClose={() => setPreviewDrawerOpen(false)}
            onNavigate={(id) => router.push(`/documents/${id}`)}
          />
        )}
      </Drawer>

      {/* Share Drawer */}
      <Drawer open={shareDrawerOpen} onOpenChange={setShareDrawerOpen}>
        {sharingDoc && (
          <ShareDrawerContent
            doc={sharingDoc}
            onClose={() => setShareDrawerOpen(false)}
          />
        )}
      </Drawer>

      {/* Export Drawer */}
      <Drawer open={exportDrawerOpen} onOpenChange={setExportDrawerOpen}>
        <ExportDrawerContent
          documentId={exportingDocumentId}
          onClose={() => setExportDrawerOpen(false)}
        />
      </Drawer>
    </div>
  )
}