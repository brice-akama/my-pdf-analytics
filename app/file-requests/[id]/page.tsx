"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download,
  Inbox,
  Mail,
  Copy,
  CheckCircle,
  Clock,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Share2,
  Trash2,
  Edit,
  Eye,
  X,
} from "lucide-react"

type UploadedFile = {
  _id: string
  filename: string
  originalName: string
  size: number
  uploadedAt: string
  uploadedBy?: {
    name: string
    email: string
  }
}

type FileRequest = {
  _id: string
  title: string
  description: string
  recipients: Array<{
    email: string
    notified: boolean
    notifiedAt: string | null
  }>
  dueDate: string | null
  expectedFiles: number
  uploadedFiles: UploadedFile[]
  status: string
  shareToken: string
  createdAt: string
  updatedAt: string
}

export default function FileRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<FileRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
const [previewUrl, setPreviewUrl] = useState<string | null>(null)
const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setRequest(data.request)
          setEditTitle(data.request.title)
          setEditDescription(data.request.description)
        }
      } else {
        alert('Failed to load file request')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to load file request')
    } finally {
      setLoading(false)
    }
  }

  const handleViewFile = async (file: UploadedFile) => {
  setPreviewFile(file)
  setPreviewLoading(true)
  
  try {
    const res = await fetch(`/api/file-requests/${requestId}/files/${file._id}`, {
      credentials: 'include',
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } else {
      alert('Failed to load preview')
      setPreviewFile(null)
    }
  } catch (error) {
    console.error('Preview error:', error)
    alert('Failed to load preview')
    setPreviewFile(null)
  } finally {
    setPreviewLoading(false)
  }
}

const handleClosePreview = () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
  }
  setPreviewFile(null)
  setPreviewUrl(null)
}

  const handleCopyLink = () => {
    const link = `${window.location.origin}/public/file-request/${request?.shareToken}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleResendEmail = async (recipientEmail: string) => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recipientEmail }),
      })

      if (res.ok) {
        alert(`Email resent to ${recipientEmail}`)
        fetchRequest()
      } else {
        alert('Failed to resend email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert('Failed to resend email')
    }
  }

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}/files/${fileId}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const handleDownloadAll = async () => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}/files/download-all`, {
        credentials: 'include',
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${request?.title || 'files'}.zip`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download all error:', error)
      alert('Failed to download files')
    }
  }

  const handleUpdateRequest = async () => {
    try {
      const res = await fetch(`/api/file-requests/${requestId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      })

      if (res.ok) {
        alert('Request updated successfully')
        setIsEditing(false)
        fetchRequest()
      } else {
        alert('Failed to update request')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update request')
    }
  }

  const handleDeleteRequest = async () => {
    if (!confirm('Are you sure you want to delete this file request?')) return

    try {
      const res = await fetch(`/api/file-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        alert('Request deleted successfully')
        router.push('/dashboard')
      } else {
        alert('Failed to delete request')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete request')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago'
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h1>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
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
            onClick={() => router.push('/dashboard')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900">File Request Details</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteRequest}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Request Info Card */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateRequest}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Inbox className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{request.title}</h2>
                  <p className="text-slate-600">{request.description || 'No description provided'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  request.status === 'active' ? 'bg-green-100 text-green-700' :
                  request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {request.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Files Received</p>
                    <p className="text-xl font-bold text-slate-900">
                      {request.uploadedFiles.length}/{request.expectedFiles}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Recipients</p>
                    <p className="text-xl font-bold text-slate-900">{request.recipients.length}</p>
                  </div>
                </div>

                {request.dueDate && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Due Date</p>
                      <p className="text-xl font-bold text-slate-900">
                        {new Date(request.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Share Link Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">Public Upload Link</h3>
              <p className="text-sm text-slate-600 mb-4">
                Share this link with recipients to collect files
              </p>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/public/file-request/${request.shareToken}`}
                  readOnly
                  className="flex-1 font-mono text-sm bg-white"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  {copiedLink ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recipients</h3>
          <div className="space-y-3">
            {request.recipients.map((recipient, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {recipient.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{recipient.email}</p>
                    {recipient.notifiedAt && (
                      <p className="text-xs text-slate-500">
                        Notified {formatTimeAgo(recipient.notifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResendEmail(recipient.email)}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Resend
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Files */}
        {/* Uploaded Files */}
<div className="bg-white rounded-xl border shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-slate-900">
      Uploaded Files ({request.uploadedFiles.length})
    </h3>
    {request.uploadedFiles.length > 0 && (
      <Button
        onClick={handleDownloadAll}
        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
      >
        <Download className="h-4 w-4" />
        Download All
      </Button>
    )}
  </div>

  {request.uploadedFiles.length === 0 ? (
    <div className="text-center py-12">
      <Inbox className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-600">No files uploaded yet</p>
      <p className="text-sm text-slate-500 mt-2">
        Files will appear here when recipients upload them
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      {request.uploadedFiles.map((file) => (
        <div key={file._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{file.originalName}</p>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatTimeAgo(file.uploadedAt)}</span>
                {file.uploadedBy && (
                  <>
                    <span>•</span>
                    <span>{file.uploadedBy.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 🟢 VIEW BUTTON */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewFile(file)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            {/* 🟢 DOWNLOAD BUTTON */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadFile(file._id, file.originalName)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

{/* 🟢 PREVIEW DRAWER */}
<Sheet open={!!previewFile} onOpenChange={(open) => !open && handleClosePreview()}>
  <SheetContent 
    side="right" 
    className="w-full sm:w-[90vw] sm:max-w-4xl p-0 overflow-hidden"
  >
    <AnimatePresence>
      {previewFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold text-slate-900 truncate">
                  {previewFile.originalName}
                </SheetTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {formatFileSize(previewFile.size)} • Uploaded by {previewFile.uploadedBy?.name || previewFile.uploadedBy?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePreview}
                className="flex-shrink-0 ml-4"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : previewUrl ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                {/* Check file type and render accordingly */}
                {previewFile.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  // Image preview
                  <img 
                    src={previewUrl} 
                    alt={previewFile.originalName}
                    className="w-full h-auto"
                  />
                ) : previewFile.originalName.match(/\.pdf$/i) ? (
                  // PDF preview
                  <iframe
                    src={previewUrl}
                    className="w-full h-[calc(100vh-200px)]"
                    title={previewFile.originalName}
                  />
                ) : previewFile.originalName.match(/\.(txt|md|csv)$/i) ? (
                  // Text file preview
                  <iframe
                    src={previewUrl}
                    className="w-full h-[calc(100vh-200px)]"
                    title={previewFile.originalName}
                  />
                ) : (
                  // Unsupported preview
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <FileText className="h-16 w-16 text-slate-300 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 mb-2">
                      Preview not available
                    </p>
                    <p className="text-sm text-slate-600 mb-6">
                      This file type cannot be previewed in the browser
                    </p>
                    <Button
                      onClick={() => handleDownloadFile(previewFile._id, previewFile.originalName)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <Download className="h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-white sticky bottom-0">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{formatTimeAgo(previewFile.uploadedAt)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClosePreview}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleDownloadFile(previewFile._id, previewFile.originalName)}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </SheetContent>
</Sheet>

        {/* Status / Progress */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Request Progress
            </h3>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
              style={{
                width: `${Math.min(
                  (request.uploadedFiles.length / request.expectedFiles) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          <p className="text-sm text-slate-600 mt-2">
            {request.uploadedFiles.length} of {request.expectedFiles} files received
          </p>
        </div>
      </main>
    </div>
  )
}
