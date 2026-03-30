 "use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Plus,
  FileSignature,
  Clock,
  Eye,
  Share2,
  MoreVertical,
  Trash2,
  Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type AgreementType = {
  _id: string
  title: string
  type: string
  signedCount: number
  totalSigners: number
  status: string
  createdAt: string
  expiresAt: string | null
}

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

// ─── Helpers (local copies so the component is self-contained) ────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  agreements: AgreementType[]
  uploadedAgreementsList: any[]
  user: UserType | null
  onUploadClick: () => void
  onDeleteAgreement: (id: string) => void
  fetchUploadedAgreements: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgreementsSection({
  agreements,
  uploadedAgreementsList,
  user,
  onUploadClick,
  onDeleteAgreement,
  fetchUploadedAgreements,
}: Props) {
  // Fetch uploaded agreements when the section mounts
  useEffect(() => {
    fetchUploadedAgreements()
  }, [])

  // ── Empty state (no agreements at all) ──────────────────────────────────────
  if (agreements.length === 0 && uploadedAgreementsList.length === 0) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Agreements</h1>
            <p className="text-slate-600">Manage NDAs and signature requests</p>
          </div>
          <Button
            onClick={onUploadClick}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Upload Agreement
          </Button>
        </div>

        <div className="shadow-sm p-12 text-center">
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
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onUploadClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Upload Agreement
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Uploaded but not yet sent ────────────────────────────────────────────────
  if (agreements.length === 0 && uploadedAgreementsList.length > 0) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Agreements</h1>
            <p className="text-slate-600">Manage NDAs and signature requests</p>
          </div>
          <Button
            onClick={onUploadClick}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Upload Agreement
          </Button>
        </div>

        <div className="space-y-4">
          {uploadedAgreementsList.map((agreement, index) => (
            <div
              key={agreement._id}
              onClick={() => {}}
              className="p-6 transition-shadow cursor-pointer"
            >
              {index > 0 && <hr className="border-t border-slate-200 mx-4 mb-3" />}

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="h-6 w-6 text-purple-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {agreement.filename}
                  </h3>

                  {/* Show uploader if not current user */}
                  {agreement.uploadedBy?.userId !== user?.email && (
                    <p className="text-xs text-slate-500">
                      Uploaded by {agreement.uploadedBy?.name || "team member"}
                      {agreement.uploadedBy?.role === "admin" && " (Admin)"}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Uploaded {formatTimeAgo(agreement.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    toast.warning("Delete this agreement?", {
                      description: "This action cannot be undone.",
                      duration: 6000,
                      action: {
                        label: "Delete",
                        onClick: () => onDeleteAgreement(agreement._id),
                      },
                      cancel: {
                        label: "Cancel",
                        onClick: () => {},
                      },
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Sent agreements list ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agreements</h1>
          <p className="text-slate-600">Manage NDAs and signature requests</p>
        </div>
        <Button
          onClick={onUploadClick}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Upload Agreement
        </Button>
      </div>

      <div className="space-y-4">
        {agreements.map((agreement) => (
          <div
            key={agreement._id}
            className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <FileSignature className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {agreement.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
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

              <div className="flex items-center gap-2">
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
    </div>
  )
}