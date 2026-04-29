// app/documents-page/components/DocumentList.tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText, Trash2, Clock, Loader2,
  Users, FolderOpen, Upload, BarChart3,
  Share2, Mail, Eye, Edit, MoreVertical,
  CheckCircle2, FileSignature,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import PdfThumbnail from "@/components/PdfThumbnail"
import DocumentCard, { DocumentType, formatFileSize, formatTimeAgo } from "./DocumentCard"

type Props = {
  // Which view is active
  activeView: "documents" | "templates" | "archive" | "team-documents" | "team-templates"

  // Data
  documents: DocumentType[]
  templates: DocumentType[]
  archivedDocuments: DocumentType[]
  teamDocuments: any[]
  teamName: string
  loadingTeamDocs: boolean

  // Selection
  selectedDocuments: Set<string>
  bulkSelectionMode: boolean

  // Maps
  drafts: Map<string, any>
  sentRequests: Map<string, any>

  // Handlers
  onSelect: (id: string) => void
  onDelete: (id: string, name: string) => void
  onRestore: (id: string, name: string) => void
  onShareToTeam: (id: string, name: string) => void
  onUnshareFromTeam: (id: string, name: string) => void
  onOpenPreview: (id: string) => void
  onOpenExport: (id: string) => void
  onOpenShare: (id: string) => void

  // Pagination
  currentPage: number
  totalPages: number
  totalDocuments: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function DocumentList({
  activeView, documents, templates, archivedDocuments, teamDocuments,
  teamName, loadingTeamDocs, selectedDocuments, bulkSelectionMode,
  drafts, sentRequests, onSelect, onDelete, onRestore,
  onShareToTeam, onUnshareFromTeam, onOpenPreview, onOpenExport, onOpenShare,
  currentPage, totalPages, totalDocuments, itemsPerPage, onPageChange,
}: Props) {
  const router = useRouter()
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null)

  // ── ARCHIVE VIEW ──────────────────────────────────────────────────
  if (activeView === "archive") {
    if (archivedDocuments.length === 0) {
      return (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No archived documents</h3>
          <p className="text-slate-600">Deleted documents will appear here</p>
        </div>
      )
    }
    return (
      <div className="mb-8">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-orange-900">
            📦 <strong>{archivedDocuments.length}</strong> document(s) in archive. Can be restored anytime.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {archivedDocuments.map((doc) => (
            <div key={doc._id} className="p-4 hover:bg-slate-50 transition-colors rounded-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {doc.originalFilename || doc.filename}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      Archived
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                    <span>{doc.numPages} pages</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />Deleted {formatTimeAgo(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onRestore(doc._id, doc.originalFilename || doc.filename)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 gap-2 text-white"
                >
                  <Upload className="h-4 w-4 rotate-180" />
                  <span className="hidden sm:inline">Restore</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── TEAM DOCUMENTS VIEW ───────────────────────────────────────────
  if (activeView === "team-documents") {
    if (loadingTeamDocs) return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
    if (teamDocuments.filter(d => !d.isTemplate).length === 0) return (
      <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No team documents yet</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Go to <strong>Personal → Documents</strong>, click the 3-dot menu on any document
          and select <strong>"Move to Team"</strong>.
        </p>
      </div>
    )
    return (
      <div className="divide-y divide-slate-100">
        {teamDocuments.filter(d => !d.isTemplate).map((doc) => (
          <TeamDocRow key={doc._id} doc={doc} hoveredDocId={hoveredDocId}
            setHoveredDocId={setHoveredDocId} onOpenPreview={onOpenPreview}
            onOpenShare={onOpenShare} onUnshareFromTeam={onUnshareFromTeam}
            router={router} />
        ))}
      </div>
    )
  }

  // ── TEAM TEMPLATES VIEW ───────────────────────────────────────────
  if (activeView === "team-templates") {
    if (loadingTeamDocs) return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
    const teamTpls = teamDocuments.filter(d => d.isTemplate && !d.archived)
    if (teamTpls.length === 0) return (
      <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
        <FileSignature className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No team templates yet</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Share a template from <strong>Personal → Templates</strong> to see it here.
        </p>
      </div>
    )
    return (
      <div className="divide-y divide-slate-100">
        {teamTpls.map((doc) => (
          <TeamDocRow key={doc._id} doc={doc} isTemplate hoveredDocId={hoveredDocId}
            setHoveredDocId={setHoveredDocId} onOpenPreview={onOpenPreview}
            onOpenShare={onOpenShare} onUnshareFromTeam={onUnshareFromTeam}
            router={router} />
        ))}
      </div>
    )
  }

  // ── DOCUMENTS / TEMPLATES VIEW ────────────────────────────────────
  const list = activeView === "documents" ? documents : templates

  if (list.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        {activeView === "documents" ? "Your Documents" : "Your Templates"}
      </h2>

      <div className="divide-y divide-slate-100">
        {list.map((doc) => (
          <DocumentCard
            key={doc._id}
            doc={doc}
            isSelected={selectedDocuments.has(doc._id)}
            draft={drafts.get(doc._id)}
            sentRequest={sentRequests.get(doc._id)}
            onSelect={onSelect}
            onDelete={onDelete}
            onShareToTeam={onShareToTeam}
            onUnshareFromTeam={onUnshareFromTeam}
            onOpenPreview={onOpenPreview}
            onOpenExport={onOpenExport}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t pt-6 flex-wrap gap-4">
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalDocuments)}</span> of{" "}
            <span className="font-medium">{totalDocuments}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm"
              onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Team document row (used for both team-docs and team-templates) ──
function TeamDocRow({ doc, isTemplate, hoveredDocId, setHoveredDocId, onOpenPreview, onOpenShare, onUnshareFromTeam, router }: any) {
  const docName = doc.originalFilename || doc.filename
  return (
    <div
      className="flex items-center gap-4 px-2 py-3 hover:bg-slate-50 rounded-xl transition-colors"
      onMouseEnter={() => setHoveredDocId(doc._id)}
      onMouseLeave={() => setHoveredDocId(null)}
    >
      {/* Thumbnail */}
      <div
        className="relative h-32 sm:h-36 w-24 sm:w-28 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-200 shadow-sm cursor-pointer"
        onClick={() => onOpenPreview(doc._id)}
      >
        <div className="absolute inset-0 overflow-hidden">
          <PdfThumbnail documentId={doc._id} filename={docName} />
        </div>
        <AnimatePresence>
          {hoveredDocId === doc._id && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <Eye className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{docName}</h3>
          {isTemplate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <FileSignature className="h-3 w-3 mr-1" />Template
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Team</span>
          {doc.isOwner && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              You shared this
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
          <span>{doc.numPages} pages</span>
          <span>•</span>
          <span>{formatFileSize(doc.size)}</span>
          {!isTemplate && <><span>•</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Shared by {doc.isOwner ? "you" : doc.sharedByEmail}
            </span>
          </>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isTemplate && (
          <Button variant="outline" size="sm"
            onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
            className="hidden sm:flex gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
          >
            <Mail className="h-3.5 w-3.5" />Send for Signature
          </Button>
        )}

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden md:flex"
          onClick={() => router.push(`/documents/${doc._id}`)}>
          <BarChart3 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-lg rounded-2xl p-1">
            <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}`)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Eye className="h-4 w-4 text-slate-400" />Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}`)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
              <BarChart3 className="h-4 w-4 text-slate-400" />View Analytics
            </DropdownMenuItem>
            {isTemplate && (
              <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Mail className="h-4 w-4 text-slate-400" />Send for Signature
              </DropdownMenuItem>
            )}
            {doc.isOwner && (
              <>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <DropdownMenuItem onClick={() => onUnshareFromTeam(doc._id, docName)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <Trash2 className="h-4 w-4" />Remove from Team
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}