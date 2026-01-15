//app/documents-page/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Upload,
  Search,
  Folder,
  Share2,
  BarChart3,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MoreVertical,
  ArrowLeft,
  FolderOpen,
} from "lucide-react"

type DocumentType = {
  _id: string
  filename: string
  size: number
  numPages: number
  createdAt: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

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

export default function DocumentsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "GET",
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDocuments(data.documents)
        }
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    }
  }

  useEffect(() => {
    fetchDocuments()
    const interval = setInterval(fetchDocuments, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadStatus('error')
      setUploadMessage('Please upload a PDF file')
      setTimeout(() => setUploadStatus('idle'), 3000)
      return
    }

    setUploadStatus('uploading')
    setUploadMessage('Uploading your document...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch("/api/upload", {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUploadStatus('success')
        setUploadMessage(`Successfully uploaded ${file.name}`)
        router.push(`/documents/${data.documentId}`)
        fetchDocuments()
        
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadMessage('')
        }, 3000)
      } else {
        setUploadStatus('error')
        setUploadMessage(data.error || 'Upload failed')
        setTimeout(() => setUploadStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setUploadMessage('Upload failed. Please try again.')
      setTimeout(() => setUploadStatus('idle'), 3000)
    }
  }

  // Drag and drop handlers
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
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
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
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGrad)"/>
                <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              DocMetrics
            </span>
          </div>

          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="w-full pl-10 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-white/80 backdrop-blur min-h-screen">
          <nav className="flex-1 space-y-1 p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900 px-3 mb-2">PERSONAL</h2>
              
              <button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium bg-purple-50 text-purple-700">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </div>
                <span className="text-xs">{documents.length}</span>
              </button>
              
              <button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors mt-1">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5" />
                  <span>Templates</span>
                </div>
                <span className="text-xs">0</span>
              </button>
              
              <button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors mt-1">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5" />
                  <span>Archive</span>
                </div>
                <span className="text-xs">0</span>
              </button>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900 px-3 mb-2 flex items-center justify-between">
                <span>TEAM</span>
                <div className="flex items-center gap-1">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    M
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="text-lg">+</span>
                  </Button>
                </div>
              </h2>
              
              <button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </div>
                <span className="text-xs">0</span>
              </button>
              
              <button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors mt-1">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5" />
                  <span>Templates</span>
                </div>
                <span className="text-xs">0</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Documents</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>My Documents</span>
                  <span>•</span>
                  <span>{documents.length} documents</span>
                </div>
              </div>
            </div>

            {/* Upload Status Message */}
            {uploadStatus !== 'idle' && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                uploadStatus === 'success' ? 'bg-green-50 border border-green-200' :
                uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                {uploadStatus === 'uploading' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                {uploadStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                <span className={`font-medium ${
                  uploadStatus === 'success' ? 'text-green-900' :
                  uploadStatus === 'error' ? 'text-red-900' :
                  'text-blue-900'
                }`}>
                  {uploadMessage}
                </span>
              </div>
            )}

            {/* Upload Area */}
            <div className="mb-8">
              <div 
                className={`bg-white rounded-lg border-2 border-dashed p-12 text-center transition-all cursor-pointer group ${
                  isDragging 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-purple-200' : 'bg-purple-100 group-hover:bg-purple-200'
                  }`}>
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 mb-1">
                      {isDragging ? 'Drop your PDF here' : 'Drop files here to upload'}
                    </p>
                    <p className="text-sm text-slate-500">or click to browse (PDF only)</p>
                  </div>
                  <Button variant="outline" className="mt-2">Upload PDF</Button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Documents List */}
            {documents.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Documents</h2>
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="divide-y">
                    {documents.map((doc) => (
                      <div 
                        key={doc._id} 
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/documents/${doc._id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{doc.filename}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                              <span>{doc.numPages} pages</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(doc.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : uploadStatus === 'idle' && (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <Folder className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
                <p className="text-slate-600 mb-6">Upload your first document to get started</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}