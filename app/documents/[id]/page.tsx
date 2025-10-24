"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  ArrowLeft,
  Share2,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Link as LinkIcon,
  Mail,
  BarChart3,
  Activity,
   Presentation,  // Add this
  FileSignature,  // Add this
  Upload,  // Add this
  Image as ImageIcon,  // Add this
  Clock  // Add this
} from "lucide-react"

type DocumentType = {
  _id: string
  filename: string
  size: number
  numPages: number
  createdAt: string
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<DocumentType | null>(null)
  const [activeTab, setActiveTab] = useState<'activity' | 'performance' | 'utilization'>('activity')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocument()
  }, [params.id])

  const fetchDocument = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDocument(data.document)
        }
      }
    } catch (error) {
      console.error("Failed to fetch document:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
    return Math.floor(seconds / 86400) + ' days ago'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Document not found</h2>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">{document.filename}</h1>
                  <p className="text-xs text-slate-500">
                    📝 Add a note to this document
                  </p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Eye className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-5 w-5" />
              </Button>
              <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuItem>
      <Presentation className="mr-2 h-4 w-4" />
      <span>Present</span>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <FileSignature className="mr-2 h-4 w-4" />
      <span>Convert to signable</span>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Download className="mr-2 h-4 w-4" />
      <span>Download</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Eye className="mr-2 h-4 w-4" />
      <span>Export visits</span>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <ImageIcon className="mr-2 h-4 w-4" />
      <span>Update thumbnail</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600 focus:text-red-600">
      <Trash2 className="mr-2 h-4 w-4" />
      <span>Delete</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Create link
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Last updated info */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Last updated {formatTimeAgo(document.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'performance'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('utilization')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'utilization'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Utilization
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect x='50' y='50' width='300' height='200' rx='10' fill='%233b82f6'/%3E%3Cpath d='M 100 180 Q 150 150 200 180 T 300 180' stroke='%23000' stroke-width='3' fill='none'/%3E%3Cpath d='M 80 120 L 100 100 L 120 110' fill='%23000'/%3E%3C/svg%3E"
                  alt="Put document to work"
                  className="w-64 h-48 mx-auto mb-6"
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Put your document to work
              </h2>
              <p className="text-slate-600 mb-6">
                Create a link to share this document, or customize the document to collect eSignatures
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <LinkIcon className="h-4 w-4" />
                  Create link
                </Button>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Request signatures
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No performance data yet</h3>
            <p className="text-slate-600 mb-6">Share your document to start tracking performance</p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Share Document
            </Button>
          </div>
        )}

        {activeTab === 'utilization' && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No utilization data yet</h3>
            <p className="text-slate-600 mb-6">Share your document to see how it's being used</p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Share Document
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}