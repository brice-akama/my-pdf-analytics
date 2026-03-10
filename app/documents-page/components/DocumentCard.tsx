// app/documents-page/components/DocumentCard.tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3, Clock, MoreVertical, Eye,
  Mail, Trash2, Users, CheckCircle2, Edit, Upload,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import PdfThumbnail from "@/components/PdfThumbnail"
import { toast } from "sonner"

export type DocumentType = {
  _id: string
  filename: string
  originalFilename?: string
  size: number
  numPages: number
  createdAt: string
  isTemplate?: boolean
  sharedToTeam?: boolean
  archived?: boolean
}

type Props = {
  doc: DocumentType
  isSelected: boolean
  draft?: any
  sentRequest?: { allSigned?: boolean; anySigned?: boolean; recipients?: any[] }
  onSelect: (id: string) => void
  onDelete: (id: string, name: string) => void
  onShareToTeam: (id: string, name: string) => void
  onUnshareFromTeam: (id: string, name: string) => void
  onOpenPreview: (id: string) => void
  onOpenExport: (id: string) => void
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago"
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago"
  if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago"
  return date.toLocaleDateString()
}

export default function DocumentCard({
  doc, isSelected, draft, sentRequest,
  onSelect, onDelete, onShareToTeam, onUnshareFromTeam,
  onOpenPreview, onOpenExport,
}: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const docName = doc.originalFilename || doc.filename

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 px-2 py-3 rounded-xl transition-colors relative ${
        isSelected ? "bg-purple-50" : "hover:bg-slate-50"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div className="hidden sm:flex flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onSelect(doc._id) }}
          className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
        />
      </div>

      {/* Thumbnail */}
      <div
        className="relative h-32 sm:h-36 w-24 sm:w-28 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-slate-200 shadow-sm cursor-pointer"
        onClick={() => onOpenPreview(doc._id)}
      >
        <div className="absolute inset-0 overflow-hidden">
          <PdfThumbnail documentId={doc._id} filename={docName} />
        </div>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]"
            >
              <Eye className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{docName}</h3>

          {sentRequest?.allSigned && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />Signed
            </span>
          )}
          {doc.isTemplate && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Template
            </span>
          )}
          {draft && !sentRequest && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
              🟠 Draft
            </span>
          )}
          {doc.sharedToTeam && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              <Users className="h-3 w-3 mr-1" />Team
            </span>
          )}
        </div>

        {/* Meta desktop */}
        <div className="hidden sm:flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
          <span>{doc.numPages} pages</span>
          <span>•</span>
          <span>{formatFileSize(doc.size)}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{formatTimeAgo(doc.createdAt)}
          </span>
        </div>

        {/* Meta mobile */}
        <div className="flex sm:hidden items-center gap-2 text-xs text-slate-500 mt-1">
          <span>{doc.numPages}p</span><span>•</span>
          <span>{formatTimeAgo(doc.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

        {/* Continue draft */}
        {draft && !sentRequest && (
          <Button size="sm"
            onClick={() => router.push(`/documents/${doc._id}/signature?mode=draft&returnTo=/documents-page`)}
            className="hidden sm:flex bg-orange-600 hover:bg-orange-700 text-white gap-1.5 text-xs h-8"
          >
            <Edit className="h-3.5 w-3.5" />Continue
          </Button>
        )}

        {/* Resend */}
        {sentRequest && !sentRequest.allSigned && (
          <Button size="sm"
            onClick={async () => {
              const first = sentRequest.recipients?.find((r: any) => r.status !== "signed")
              if (!first) return
              const res = await fetch(`/api/signature/${first.uniqueId}/resend`, { method: "POST", credentials: "include" })
              if (res.ok) toast.success(`Reminder sent to ${first.name}`)
              else toast.error("Failed to send reminder")
            }}
            className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8"
          >
            <Mail className="h-3.5 w-3.5" />Resend
          </Button>
        )}

        {/* Export when all signed */}
        {sentRequest?.allSigned && (
          <Button size="sm" onClick={() => onOpenExport(doc._id)}
            className="hidden sm:flex bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs h-8"
          >
            <Upload className="h-3.5 w-3.5" />Export
          </Button>
        )}

        {/* Analytics */}
        <Button variant="ghost" size="sm"
          onClick={() => router.push(`/documents/${doc._id}`)}
          className="h-8 w-8 p-0" title="Analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>

        {/* 3-dot menu */}
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

            {doc.isTemplate && (
              <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Mail className="h-4 w-4 text-slate-400" />Send for Signature
              </DropdownMenuItem>
            )}

            {/* Move to Team / Remove from Team */}
            <DropdownMenuItem
              onClick={() => doc.sharedToTeam ? onUnshareFromTeam(doc._id, docName) : onShareToTeam(doc._id, docName)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Users className="h-4 w-4 text-slate-400" />
              {doc.sharedToTeam ? "Remove from Team" : "Move to Team"}
            </DropdownMenuItem>

            <div className="h-px bg-slate-100 my-1 mx-2" />

            <DropdownMenuItem onClick={() => onDelete(doc._id, docName)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 cursor-pointer">
              <Trash2 className="h-4 w-4" />Delete
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}