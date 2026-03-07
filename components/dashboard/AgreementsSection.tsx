"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Plus,
  FileSignature,
  Clock,
  Users,
  Eye,
  Share2,
  MoreVertical,
  Trash2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedAgreement {
  _id: string
  filename: string
  createdAt: string
  uploadedBy?: {
    userId: string
    name: string
    role: string
  }
}

interface Agreement {
  _id: string
  title: string
  type: string
  signedCount: number
  totalSigners: number
  status: string
  createdAt: string
  expiresAt: string | null
}

interface AgreementsSectionProps {
  agreements: Agreement[]
  uploadedAgreementsList: UploadedAgreement[]
  userEmail?: string
  onOpenUploadDialog: () => void
  onRefreshUploaded: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago"
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago"
  if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago"
  return date.toLocaleDateString()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgreementsSection({
  agreements,
  uploadedAgreementsList,
  userEmail,
  onOpenUploadDialog,
  onRefreshUploaded,
}: AgreementsSectionProps) {

  // ── Delete uploaded agreement ──
  const handleDeleteUploaded = async (id: string) => {
    if (!confirm("Delete this agreement?")) return
    const loadingToast = toast.loading("Deleting agreement...")
    try {
      const res = await fetch(`/api/agreements/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        toast.success("Agreement deleted", { id: loadingToast })
        onRefreshUploaded()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete", { id: loadingToast })
      }
    } catch {
      toast.error("Network error", { id: loadingToast })
    }
  }

  // ── Render ──
  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agreements</h1>
          <p className="text-slate-600">Manage NDAs and signature requests</p>
        </div>
        <Button
          onClick={onOpenUploadDialog}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Upload Agreement
        </Button>
      </div>

      {/* ── Empty state: nothing at all ── */}
      {agreements.length === 0 && uploadedAgreementsList.length === 0 && (
        <div className="shadow-sm p-8 sm:p-12 text-center rounded-xl border">
          <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
            <FileSignature className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Need to protect sensitive content?
          </h3>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            Set up a legally-binding agreement that viewers must sign before accessing your
            content. You can upload an NDA or any other gating document.
          </p>
          <Button
            onClick={onOpenUploadDialog}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Upload Agreement
          </Button>
        </div>
      )}

      {/* ── Uploaded but not yet sent ── */}
      {agreements.length === 0 && uploadedAgreementsList.length > 0 && (
        <div className="space-y-0 rounded-xl border overflow-hidden">
          {uploadedAgreementsList.map((agreement, index) => (
            <div key={agreement._id}>
              {index > 0 && <hr className="border-t border-slate-200 mx-4" />}

              <div className="p-5 sm:p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="h-6 w-6 text-purple-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1 truncate">
                    {agreement.filename}
                  </h3>

                  {/* Show uploader if not current user */}
                  {agreement.uploadedBy?.userId !== userEmail && (
                    <p className="text-xs text-slate-500 mb-1">
                      Uploaded by {agreement.uploadedBy?.name ?? "team member"}
                      {agreement.uploadedBy?.role === "admin" && " (Admin)"}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Uploaded {formatTimeAgo(agreement.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={() => handleDeleteUploaded(agreement._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sent agreements ── */}
      {agreements.length > 0 && (
        <div className="space-y-4">
          {agreements.map((agreement) => (
            <div
              key={agreement._id}
              className="bg-white rounded-lg border shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1 truncate">
                      {agreement.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {agreement.signedCount}/{agreement.totalSigners} signed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(agreement.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}