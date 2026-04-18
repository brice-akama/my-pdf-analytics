// app/documents-page/page.tsx
//
// PLAN GATING CHANGES ADDED:
//
//   1. Fetches the current user's plan on mount via /api/auth/me.
//      Stored in userPlan state. Used by all gate checks below.
//
//   2. handleFileUpload and handleMultipleFileUpload now check:
//        - isFileSizeAllowed()    — rejects files over the plan's per-file cap
//        - isStorageAvailable()   — rejects uploads that would exceed total storage
//      These are the same checks the API route does — we add them on the
//      frontend too so the user gets instant feedback before the network call.
//      The API route still enforces them server-side as the true guard.
//
//   3. handleBrowseDriveFiles and handleBrowseOneDriveFiles now check the plan
//      before opening the file picker. Free and Starter users see an upgrade
//      toast with a "See plans" action link instead of the file browser.
//
//   4. The Upload dropdown now shows a locked state for Drive and OneDrive
//      when the user is on Free or Starter — greyed out with an upgrade label
//      instead of a connect/browse button.
//
//   5. Everything else is completely unchanged — all document list logic,
//      drawers, sidebar, search, pagination, bulk actions, archive — untouched.
//
// WHAT THE PLAN CHECK READS:
//   userPlan is fetched from /api/auth/me on mount. This is the same endpoint
//   the dashboard uses and reflects the latest webhook-written plan.
//   We default to 'free' while loading — safe because free never grants more.

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, ArrowLeft, MoreVertical, Loader2, CheckCircle2, AlertCircle, CheckCircle, X, FileText } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import PageInfoTooltip from "@/components/PageInfoTooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Plan limits helpers
import {
  getPlanLimits,
  isFileSizeAllowed,
  isStorageAvailable,
} from '@/lib/planLimits'

// Components
import Sidebar from "./components/Sidebar"
import DocumentList from "./components/DocumentList"
import BulkActionBar from "./components/BulkActionBar"
import { DocumentType } from "./components/DocumentCard"

// Drawers
import { Drawer } from "@/components/ui/drawer"
import PreviewDrawerContent from "./components/PreviewDrawerContent"
import ShareDrawerContent from "./components/ShareDrawerContent"
import ExportDrawerContent from "./components/ExportDrawerContent"

type ActiveView = "documents" | "templates" | "archive" | "team-documents" | "team-templates"
type UploadStatus = "idle" | "uploading" | "success" | "error"

export default function DocumentsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Plan state ───────────────────────────────────────────────────────────
  // Fetched on mount. Defaults to 'free' while loading — never grants more
  // than paid for. Used by all plan gate checks in this page.
  const [userPlan, setUserPlan] = useState<string>('free')
  const [userStorageUsedBytes, setUserStorageUsedBytes] = useState<number>(0)

  // ── Data state ────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [templates, setTemplates] = useState<DocumentType[]>([])
  const [archivedDocuments, setArchivedDocuments] = useState<DocumentType[]>([])
  const [teamDocuments, setTeamDocuments] = useState<any[]>([])
  const [teamName, setTeamName] = useState("Team")
  const [loadingTeamDocs, setLoadingTeamDocs] = useState(false)
  const [drafts, setDrafts] = useState<Map<string, any>>(new Map())
  const [sentRequests, setSentRequests] = useState<Map<string, any>>(new Map())
  const [groupTemplatesCount, setGroupTemplatesCount] = useState(0)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ActiveView>("documents")
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false)
  const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null)
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false)
  const [exportingDocumentId, setExportingDocumentId] = useState<string | null>(null)

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const itemsPerPage = 5

  // ── Integration state (unchanged) ────────────────────────────────────────
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({})
  const [oneDriveStatus, setOneDriveStatus] = useState<{ connected: boolean; email?: string }>({ connected: false })
  const [showDriveFilesDialog, setShowDriveFilesDialog] = useState(false)
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [loadingDriveFiles, setLoadingDriveFiles] = useState(false)
  const [driveSearchQuery, setDriveSearchQuery] = useState('')
  const [showOneDriveFilesDialog, setShowOneDriveFilesDialog] = useState(false)
  const [oneDriveFiles, setOneDriveFiles] = useState<any[]>([])
  const [loadingOneDriveFiles, setLoadingOneDriveFiles] = useState(false)
  const [oneDriveSearchQuery, setOneDriveSearchQuery] = useState('')
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<Set<string>>(new Set())
  const [selectedOneDriveFiles, setSelectedOneDriveFiles] = useState<Set<string>>(new Set())
  const [importingFiles, setImportingFiles] = useState(false)

  // ── Plan helpers ──────────────────────────────────────────────────────────
  // Returns true if the user's plan includes a Pro+ integration feature.
  const planIsProOrAbove = userPlan === 'pro' || userPlan === 'business'
  const planLimits = getPlanLimits(userPlan)

  // ── Fetch user plan on mount ───────────────────────────────────────────────
  // We read plan and storage from /api/auth/me — the same endpoint the
  // dashboard uses, already reflecting the latest webhook-written values.
  const fetchUserPlan = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.user) {
          setUserPlan(
            data.user.billing?.plan ||
            data.user.plan ||
            data.user.profile?.plan ||
            'free'
          )
          setUserStorageUsedBytes(
            data.user.stats?.storageUsedBytes ||
            data.user.totalStorageUsedBytes ||
            0
          )
        }
      }
    } catch (e) {
      console.error('Failed to fetch user plan:', e)
    }
  }

  // ── Fetch functions (unchanged) ───────────────────────────────────────────
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

  const fetchIntegrationStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status', { credentials: 'include' })
      if (res.ok) setIntegrationStatus(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchOneDriveStatus = async () => {
    try {
      const res = await fetch('/api/integrations/onedrive/status', { credentials: 'include' })
      if (res.ok) setOneDriveStatus(await res.json())
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
        fetchUserPlan(),       // PLAN GATING: fetch plan alongside everything else
        fetchDocuments(1),
        fetchTemplates(1),
        fetchArchivedDocuments(),
        fetchDrafts(),
        fetchGroupTemplatesCount(),
        fetchTeamDocuments(),
        fetchIntegrationStatus(),
        fetchOneDriveStatus(),
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

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  // ── PLAN GATE: handleFileUpload ────────────────────────────────────────────
  // Checks per-file size limit and total storage before uploading.
  // These are instant frontend checks — the API enforces them too server-side.
  const handleFileUpload = async (file: File) => {
    if (!file) return

    if (file.type !== "application/pdf") {
      setUploadStatus("error")
      setUploadMessage("Please upload a PDF file")
      setTimeout(() => setUploadStatus("idle"), 3000)
      return
    }

    // Check per-file size limit for their plan
    if (!isFileSizeAllowed(userPlan, file.size)) {
      const limitMB = Math.round(planLimits.maxFileSizeBytes / (1024 * 1024))
      const fileMB = Math.round(file.size / (1024 * 1024))
      toast.error(`File too large for your plan`, {
        description: `This file is ${fileMB} MB. Your ${userPlan} plan supports files up to ${limitMB} MB.`,
        duration: 7000,
        action: { label: 'Upgrade', onClick: () => router.push('/plan') },
      })
      return
    }

    // Check total storage remaining
    if (!isStorageAvailable(userPlan, userStorageUsedBytes, file.size)) {
      const usedMB = Math.round(userStorageUsedBytes / (1024 * 1024))
      const limitMB = Math.round(planLimits.storageLimitBytes / (1024 * 1024))
      toast.error(`Storage limit reached`, {
        description: `You have used ${usedMB} MB of your ${limitMB} MB limit. Upgrade or delete files to continue.`,
        duration: 7000,
        action: { label: 'Upgrade', onClick: () => router.push('/plan') },
      })
      return
    }

    setUploadStatus("uploading")
    setUploadMessage("Uploading your document...")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" })
      const data = await res.json()
      if (res.ok && data.success) {
        setUploadStatus("success")
        setUploadMessage(`Uploaded ${file.name}`)
        // Update local storage counter optimistically so next upload checks correctly
        setUserStorageUsedBytes(prev => prev + file.size)
        router.push(`/documents/${data.documentId}`)
        fetchDocuments()
        setTimeout(() => { setUploadStatus("idle"); setUploadMessage("") }, 3000)
      } else {
        // API returned an error — may include STORAGE_LIMIT_REACHED or FILE_TOO_LARGE
        setUploadStatus("error")
        setUploadMessage(data.error || "Upload failed")
        setTimeout(() => setUploadStatus("idle"), 3000)
      }
    } catch {
      setUploadStatus("error")
      setUploadMessage("Upload failed. Please try again.")
      setTimeout(() => setUploadStatus("idle"), 3000)
    }
  }

  // ── PLAN GATE: handleMultipleFileUpload ───────────────────────────────────
  // Same two checks applied per-file before uploading.
  const handleMultipleFileUpload = async (files: File[]) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf')
    const nonPdf = files.filter(f => f.type !== 'application/pdf')

    if (nonPdf.length > 0 && pdfFiles.length === 0) {
      setUploadStatus('error')
      setUploadMessage('Only PDF files are supported')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    if (pdfFiles.length === 1) {
      handleFileUpload(pdfFiles[0])
      return
    }

    setUploadStatus('uploading')
    setUploadMessage(`Uploading 0 of ${pdfFiles.length} files...`)

    let successCount = 0
    let failCount = 0
    let runningStorageUsed = userStorageUsedBytes

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i]
      setUploadMessage(`Uploading ${i + 1} of ${pdfFiles.length} — ${file.name}`)

      // Per-file size check
      if (!isFileSizeAllowed(userPlan, file.size)) {
        const limitMB = Math.round(planLimits.maxFileSizeBytes / (1024 * 1024))
        const fileMB = Math.round(file.size / (1024 * 1024))
        toast.error(`${file.name} skipped`, {
          description: `File is ${fileMB} MB — your plan allows up to ${limitMB} MB per file.`,
        })
        failCount++
        continue
      }

      // Running storage check — accounts for files already uploaded this batch
      if (!isStorageAvailable(userPlan, runningStorageUsed, file.size)) {
        toast.error(`${file.name} skipped`, {
          description: `Adding this file would exceed your storage limit.`,
        })
        failCount++
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok && data.success) {
          successCount++
          runningStorageUsed += file.size // track for subsequent files in this batch
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    // Update storage counter with the total bytes actually uploaded
    setUserStorageUsedBytes(runningStorageUsed)

    if (failCount === 0) {
      setUploadStatus('success')
      setUploadMessage(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`)
    } else if (successCount === 0) {
      setUploadStatus('error')
      setUploadMessage(`All ${failCount} uploads failed`)
    } else {
      setUploadStatus('success')
      setUploadMessage(`${successCount} uploaded, ${failCount} skipped or failed`)
    }

    fetchDocuments(1)
    setTimeout(() => { setUploadStatus('idle'); setUploadMessage('') }, 4000)
  }

  // ── PLAN GATE: handleBrowseDriveFiles ─────────────────────────────────────
  const handleBrowseDriveFiles = async () => {
    if (!planIsProOrAbove) {
      toast.error('Google Drive requires Pro or Business', {
        description: 'Upgrade your plan to import files from Google Drive.',
        duration: 6000,
        action: { label: 'See plans', onClick: () => router.push('/plan') },
      })
      return
    }
    // Original logic unchanged
    setLoadingDriveFiles(true)
    setShowDriveFilesDialog(true)
    setSelectedDriveFiles(new Set())
    try {
      const res = await fetch('/api/integrations/google-drive/files', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setDriveFiles(data.files || [])
      } else {
        toast.error('Failed to load Drive files')
        setShowDriveFilesDialog(false)
      }
    } catch { toast.error('Network error') }
    finally { setLoadingDriveFiles(false) }
  }

  // ── PLAN GATE: handleBrowseOneDriveFiles ──────────────────────────────────
  const handleBrowseOneDriveFiles = async () => {
    if (!planIsProOrAbove) {
      toast.error('OneDrive requires Pro or Business', {
        description: 'Upgrade your plan to import files from OneDrive.',
        duration: 6000,
        action: { label: 'See plans', onClick: () => router.push('/plan') },
      })
      return
    }
    // Original logic unchanged
    setLoadingOneDriveFiles(true)
    setShowOneDriveFilesDialog(true)
    setSelectedOneDriveFiles(new Set())
    try {
      const res = await fetch('/api/integrations/onedrive/files', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setOneDriveFiles(data.files || [])
      } else {
        toast.error('Failed to load OneDrive files')
        setShowOneDriveFilesDialog(false)
      }
    } catch { toast.error('Network error') }
    finally { setLoadingOneDriveFiles(false) }
  }

  // ── Integration handlers (unchanged) ─────────────────────────────────────
  const toggleDriveFile = (fileId: string) => {
    setSelectedDriveFiles(prev => {
      const next = new Set(prev)
      next.has(fileId) ? next.delete(fileId) : next.add(fileId)
      return next
    })
  }

  const toggleOneDriveFile = (fileId: string) => {
    setSelectedOneDriveFiles(prev => {
      const next = new Set(prev)
      next.has(fileId) ? next.delete(fileId) : next.add(fileId)
      return next
    })
  }

  const handleImportSelectedDriveFiles = async () => {
    if (selectedDriveFiles.size === 0) return
    setImportingFiles(true)
    const filesToImport = driveFiles.filter(f => selectedDriveFiles.has(f.id))
    let successCount = 0
    for (const file of filesToImport) {
      try {
        const res = await fetch('/api/integrations/google-drive/import', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: file.id, fileName: file.name })
        })
        if (res.ok) successCount++
      } catch { /* continue */ }
    }
    setImportingFiles(false)
    setShowDriveFilesDialog(false)
    setSelectedDriveFiles(new Set())
    fetchDocuments(1)
    fetchUserPlan() // refresh storage count after imports
    toast.success(`${successCount} of ${filesToImport.length} file(s) imported successfully`)
  }

  const handleImportSelectedOneDriveFiles = async () => {
    if (selectedOneDriveFiles.size === 0) return
    setImportingFiles(true)
    const filesToImport = oneDriveFiles.filter(f => selectedOneDriveFiles.has(f.id))
    let successCount = 0
    for (const file of filesToImport) {
      try {
        const res = await fetch('/api/integrations/onedrive/import', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: file.id, fileName: file.name })
        })
        if (res.ok) successCount++
      } catch { /* continue */ }
    }
    setImportingFiles(false)
    setShowOneDriveFilesDialog(false)
    setSelectedOneDriveFiles(new Set())
    fetchDocuments(1)
    fetchUserPlan() // refresh storage count after imports
    toast.success(`${successCount} of ${filesToImport.length} file(s) imported successfully`)
  }

  // ── Document action handlers (all unchanged) ───────────────────────────────
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
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:block">
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

            {/* Upload dropdown — Drive/OneDrive locked for Free/Starter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Upload</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white">
                {/* Local upload — always available */}
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <div>
                    <p className="font-medium">From Computer</p>
                    <p className="text-xs text-slate-500">Browse local PDF files</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Google Drive — Pro+ only */}
                {planIsProOrAbove ? (
                  integrationStatus.google_drive?.connected ? (
                    <DropdownMenuItem onClick={handleBrowseDriveFiles} className="gap-2 cursor-pointer">
                      <span className="text-base">📁</span>
                      <div>
                        <p className="font-medium">Google Drive</p>
                        <p className="text-xs text-green-600">✓ Connected — select multiple</p>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => window.location.href = '/api/integrations/google-drive/connect'} className="gap-2 cursor-pointer">
                      <span className="text-base opacity-50">📁</span>
                      <div>
                        <p className="font-medium text-slate-500">Google Drive</p>
                        <p className="text-xs text-slate-400">Click to connect first</p>
                      </div>
                    </DropdownMenuItem>
                  )
                ) : (
                  // Locked state — show upgrade prompt on click
                  <DropdownMenuItem
                    onClick={() => toast.error('Google Drive requires Pro or Business', {
                      action: { label: 'See plans', onClick: () => router.push('/plan') },
                    })}
                    className="gap-2 cursor-pointer opacity-60"
                  >
                    <span className="text-base">📁</span>
                    <div>
                      <p className="font-medium text-slate-500">Google Drive</p>
                      <p className="text-xs text-indigo-500">Pro plan required</p>
                    </div>
                  </DropdownMenuItem>
                )}

                {/* OneDrive — Pro+ only */}
                {planIsProOrAbove ? (
                  oneDriveStatus.connected ? (
                    <DropdownMenuItem onClick={handleBrowseOneDriveFiles} className="gap-2 cursor-pointer">
                      <span className="text-base">☁️</span>
                      <div>
                        <p className="font-medium">OneDrive</p>
                        <p className="text-xs text-green-600">✓ Connected — select multiple</p>
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => window.location.href = '/api/integrations/onedrive/connect'} className="gap-2 cursor-pointer">
                      <span className="text-base opacity-50">☁️</span>
                      <div>
                        <p className="font-medium text-slate-500">OneDrive</p>
                        <p className="text-xs text-slate-400">Click to connect first</p>
                      </div>
                    </DropdownMenuItem>
                  )
                ) : (
                  // Locked state
                  <DropdownMenuItem
                    onClick={() => toast.error('OneDrive requires Pro or Business', {
                      action: { label: 'See plans', onClick: () => router.push('/plan') },
                    })}
                    className="gap-2 cursor-pointer opacity-60"
                  >
                    <span className="text-base">☁️</span>
                    <div>
                      <p className="font-medium text-slate-500">OneDrive</p>
                      <p className="text-xs text-indigo-500">Pro plan required</p>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length > 0) {
            handleMultipleFileUpload(Array.from(files))
          }
        }}
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

      {/* Google Drive File Browser — unchanged UI */}
      {showDriveFilesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Import from Google Drive</h2>
                  <p className="text-xs text-slate-500">Check files to select, then import all at once</p>
                </div>
              </div>
              <button onClick={() => setShowDriveFilesDialog(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search files..." className="pl-9 h-9 bg-white text-sm" value={driveSearchQuery} onChange={e => setDriveSearchQuery(e.target.value)} />
              </div>
              <button
                onClick={() => {
                  const filtered = driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase()))
                  if (selectedDriveFiles.size === filtered.length) setSelectedDriveFiles(new Set())
                  else setSelectedDriveFiles(new Set(filtered.map(f => f.id)))
                }}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 whitespace-nowrap"
              >
                {selectedDriveFiles.size === driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingDriveFiles ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                  <p className="text-sm text-slate-500">Loading your Drive files...</p>
                </div>
              ) : driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center py-16"><p className="text-slate-500">No PDF files found</p></div>
              ) : (
                <div className="space-y-2">
                  {driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).map(file => (
                    <div key={file.id} onClick={() => toggleDriveFile(file.id)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDriveFiles.has(file.id) ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'}`}>
                      <div className={`h-5 w-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${selectedDriveFiles.has(file.id) ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                        {selectedDriveFiles.has(file.id) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"><FileText className="h-5 w-5 text-red-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-between bg-white rounded-b-2xl">
              <p className="text-sm text-slate-500">{selectedDriveFiles.size > 0 ? `${selectedDriveFiles.size} file(s) selected` : 'No files selected'}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDriveFilesDialog(false)}>Cancel</Button>
                <Button disabled={selectedDriveFiles.size === 0 || importingFiles} onClick={handleImportSelectedDriveFiles} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {importingFiles ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : `Import ${selectedDriveFiles.size || ''} File(s)`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OneDrive File Browser — unchanged UI */}
      {showOneDriveFilesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">☁️</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Import from OneDrive</h2>
                  <p className="text-xs text-slate-500">Check files to select, then import all at once</p>
                </div>
              </div>
              <button onClick={() => setShowOneDriveFilesDialog(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search files..." className="pl-9 h-9 bg-white text-sm" value={oneDriveSearchQuery} onChange={e => setOneDriveSearchQuery(e.target.value)} />
              </div>
              <button
                onClick={() => {
                  const filtered = oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase()))
                  if (selectedOneDriveFiles.size === filtered.length) setSelectedOneDriveFiles(new Set())
                  else setSelectedOneDriveFiles(new Set(filtered.map(f => f.id)))
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                {selectedOneDriveFiles.size === oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())).length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingOneDriveFiles ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-sm text-slate-500">Loading your OneDrive files...</p>
                </div>
              ) : oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center py-16"><p className="text-slate-500">No PDF files found</p></div>
              ) : (
                <div className="space-y-2">
                  {oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())).map(file => (
                    <div key={file.id} onClick={() => toggleOneDriveFile(file.id)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedOneDriveFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                      <div className={`h-5 w-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${selectedOneDriveFiles.has(file.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {selectedOneDriveFiles.has(file.id) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><FileText className="h-5 w-5 text-blue-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-between bg-white rounded-b-2xl">
              <p className="text-sm text-slate-500">{selectedOneDriveFiles.size > 0 ? `${selectedOneDriveFiles.size} file(s) selected` : 'No files selected'}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowOneDriveFilesDialog(false)}>Cancel</Button>
                <Button disabled={selectedOneDriveFiles.size === 0 || importingFiles} onClick={handleImportSelectedOneDriveFiles} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {importingFiles ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : `Import ${selectedOneDriveFiles.size || ''} File(s)`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}