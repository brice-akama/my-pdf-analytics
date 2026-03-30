 "use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Plus,
  Inbox,
  Upload,
  User,
  Clock,
  MoreVertical,
  Eye,
  Download,
  Share2,
  Trash2,
  FileText,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type FileRequestType = {
  _id: string
  title: string
  description: string
  filesReceived: number
  totalFiles: number
  status: string
  dueDate: string
  createdAt: string
  recipients: { email: string }[]
  shareToken: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const formatFileSizeLocal = (bytes: number) => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  fileRequests: FileRequestType[]
  onCreateClick: () => void
  onDeleteRequest: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileRequestsSection({
  fileRequests,
  onCreateClick,
  onDeleteRequest,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [previewRequest, setPreviewRequest] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fetchRequestFiles = async (requestId: string) => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) return data.request
      }
    } catch (error) {
      console.error("Fetch request detail error:", error)
    }
    return null
  }

  const handleViewFile = async (requestId: string, file: any) => {
    setPreviewFile(file)
    setPreviewLoading(true)
    try {
      const res = await fetch(
        `/api/file-requests/${requestId}/files/${file._id}`,
        { credentials: "include" }
      )
      if (res.ok) {
        const blob = await res.blob()
        setPreviewUrl(URL.createObjectURL(blob))
      } else {
        toast.error("Failed to load preview")
        setPreviewFile(null)
      }
    } catch {
      toast.error("Failed to load preview")
      setPreviewFile(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownloadFile = async (
    requestId: string,
    fileId: string,
    filename: string
  ) => {
    try {
      const res = await fetch(
        `/api/file-requests/${requestId}/files/${fileId}`,
        { credentials: "include" }
      )
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        toast.error("Failed to download file")
      }
    } catch {
      toast.error("Failed to download file")
    }
  }

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewFile(null)
    setPreviewUrl(null)
  }

  const handleCloseDrawer = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewFile(null)
    setPreviewUrl(null)
    setPreviewRequest(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">File Requests</h1>
          <p className="text-slate-600">Collect files from anyone securely</p>
        </div>
        <Button
          onClick={onCreateClick}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Request
        </Button>
      </div>

      {fileRequests.length > 0 && (
        <div className="mb-6 text-sm text-slate-600">
          Showing {fileRequests.length} file request
          {fileRequests.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Empty State */}
      {fileRequests.length === 0 ? (
        <div className="shadow-sm p-12 text-center">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Inbox className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Need to receive files from someone?
          </h3>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            Request files from anyone — whether they have a DocMetrics account
            or not.
          </p>
          <Button
            onClick={onCreateClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Create File Request
          </Button>
        </div>
      ) : (
        /* File Requests List */
        <div className="overflow-hidden">
          {fileRequests.map((request, index) => (
            <div key={request._id}>
              {index > 0 && <div className="border-t border-slate-100 mx-5" />}

              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Inbox className="h-5 w-5 text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {request.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        request.status === "active"
                          ? "bg-green-100 text-green-700"
                          : request.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {request.filesReceived}/{request.totalFiles} files
                    </span>
                    {request.recipients?.length > 0 && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <User className="h-3 w-3 flex-shrink-0" />
                        {request.recipients.map((r) => r.email).join(", ")}
                      </span>
                    )}
                    {request.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {formatTimeAgo(request.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 bg-white p-2">
                    {/* Share link */}
                    <div className="px-2 py-2 mb-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Upload Link
                      </p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/public/file-request/${request.shareToken}`}
                          className="flex-1 font-mono text-xs bg-slate-50 h-8"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(
                              `${window.location.origin}/public/file-request/${request.shareToken}`
                            )
                            setCopiedId(request._id)
                            toast.success("Link copied!")
                            setTimeout(() => setCopiedId(null), 2000)
                          }}
                        >
                          {copiedId === request._id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Share2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* View files */}
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={async () => {
                        setPreviewRequest({ ...request, uploadedFiles: [] })
                        setDrawerLoading(true)
                        const detail = await fetchRequestFiles(request._id)
                        if (detail) {
                          setPreviewRequest({
                            ...request,
                            uploadedFiles: detail.uploadedFiles,
                          })
                        }
                        setDrawerLoading(false)
                      }}
                    >
                      <Eye className="h-4 w-4 text-purple-600" />
                      View Uploaded Files
                      {request.filesReceived > 0 && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          {request.filesReceived}
                        </span>
                      )}
                    </DropdownMenuItem>

                    {/* Download all */}
                    {request.filesReceived > 0 && (
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer"
                        onClick={async () => {
                          const loadingToast = toast.loading(
                            "Preparing download..."
                          )
                          try {
                            const res = await fetch(
                              `/api/file-requests/${request._id}/files/download-all`,
                              { credentials: "include" }
                            )
                            if (res.ok) {
                              const blob = await res.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = `${request.title}.zip`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              window.URL.revokeObjectURL(url)
                              toast.success("Downloaded!", {
                                id: loadingToast,
                              })
                            } else {
                              toast.error("Download failed", {
                                id: loadingToast,
                              })
                            }
                          } catch {
                            toast.error("Network error", { id: loadingToast })
                          }
                        }}
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                        Download All Files
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() => {
                        toast.warning(`Delete "${request.title}"?`, {
                          description: "This cannot be undone.",
                          duration: 6000,
                          action: {
                            label: "Delete",
                            onClick: () => onDeleteRequest(request._id),
                          },
                          cancel: { label: "Cancel", onClick: () => {} },
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                      Delete Request
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files Drawer */}
      <Sheet
        open={!!previewRequest}
        onOpenChange={(open) => {
          if (!open) handleCloseDrawer()
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col bg-white"
        >
          {/* Drawer Header */}
          <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-white z-10">
            <SheetTitle className="text-lg font-semibold truncate">
              {previewRequest?.title}
            </SheetTitle>
            <p className="text-sm text-slate-500">
              {drawerLoading
                ? "Loading files..."
                : `${previewRequest?.uploadedFiles?.length || 0} file(s) uploaded`}
            </p>
          </SheetHeader>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto">
            {drawerLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-sm text-slate-500">Loading files...</p>
              </div>
            ) : previewRequest?.uploadedFiles?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <Inbox className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">
                  No files uploaded yet
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Files will appear here when recipients upload them
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {previewRequest?.uploadedFiles?.map((file: any) => (
                  <div
                    key={file._id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSizeLocal(file.size)} •{" "}
                        {formatTimeAgo(file.uploadedAt)}
                        {file.uploadedBy?.name && ` • ${file.uploadedBy.name}`}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Preview"
                        onClick={() =>
                          handleViewFile(previewRequest._id, file)
                        }
                      >
                        <Eye className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Download"
                        onClick={() =>
                          handleDownloadFile(
                            previewRequest._id,
                            file._id,
                            file.originalName
                          )
                        }
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline file preview */}
            {previewFile && (
              <div className="border-t bg-slate-50">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                  <p className="text-sm font-medium text-slate-900 truncate flex-1">
                    {previewFile.originalName}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={handleClosePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : previewUrl ? (
                    (() => {
                      const fileName = previewFile.originalName.toLowerCase()
                      if (fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
                        return (
                          <img
                            src={previewUrl}
                            alt={previewFile.originalName}
                            className="w-full h-auto max-h-96 object-contain rounded-lg bg-white"
                          />
                        )
                      }
                      if (fileName.match(/\.pdf$/i)) {
                        return (
                          <iframe
                            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            className="w-full rounded-lg border"
                            style={{ height: "500px" }}
                            title={previewFile.originalName}
                          />
                        )
                      }
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm text-slate-600 mb-4">
                            Preview not available for this file type
                          </p>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleDownloadFile(
                                previewRequest._id,
                                previewFile._id,
                                previewFile.originalName
                              )
                            }
                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                          >
                            <Download className="h-4 w-4" />
                            Download to View
                          </Button>
                        </div>
                      )
                    })()
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t bg-white">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCloseDrawer}
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}