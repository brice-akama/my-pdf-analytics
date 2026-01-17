
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  X,
  Inbox,
} from "lucide-react"

type FileRequestPublic = {
  title: string
  description: string
  expectedFiles: number
  dueDate: string | null
  status: string
}

export default function PublicFileRequestPage() {
  const params = useParams()
  const token = params.token as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [request, setRequest] = useState<FileRequestPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [uploaderName, setUploaderName] = useState('')
  const [uploaderEmail, setUploaderEmail] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchRequest()
  }, [token])

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/public/file-request/${token}`)
      
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setRequest(data.request)
        } else {
          setError(data.error || 'Request not found')
        }
      } else {
        setError('Failed to load file request')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Failed to load file request')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }

    if (!uploaderName.trim() || !uploaderEmail.trim()) {
      alert('Please enter your name and email')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('uploaderName', uploaderName.trim())
    formData.append('uploaderEmail', uploaderEmail.trim())
    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const res = await fetch(`/api/public/file-request/${token}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUploadSuccess(true)
        setSelectedFiles([])
        setUploaderName('')
        setUploaderEmail('')
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h1>
          <p className="text-slate-600">{error || 'This file request may have expired or been deleted.'}</p>
        </div>
      </div>
    )
  }

  if (request.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <Inbox className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Closed</h1>
          <p className="text-slate-600">This file request is no longer accepting uploads.</p>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Files Uploaded Successfully!</h1>
          <p className="text-slate-600 mb-6">
            Thank you for submitting your files. The requester has been notified.
          </p>
          <Button
            onClick={() => {
              setUploadSuccess(false)
              setSelectedFiles([])
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Upload More Files
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Inbox className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{request.title}</h1>
              <p className="text-slate-600">{request.description || 'Please upload the requested files below.'}</p>
            </div>
          </div>

          {request.dueDate && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                <strong>Due Date:</strong> {new Date(request.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Your Email *</Label>
                <Input
                  type="email"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="mt-2"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div>
              <Label className="mb-2 block">Upload Files *</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-purple-600' : 'text-slate-400'}`} />
                <p className="text-lg font-semibold text-slate-900 mb-1">
                  {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-500">
                  {request.expectedFiles > 1
                    ? `Upload up to ${request.expectedFiles} files`
                    : 'Upload your file'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-slate-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Powered by <span className="font-semibold text-slate-700">DocMetrics</span>
          </p>
        </div>
      </div>
    </div>
  )
}
