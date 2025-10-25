"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Download,
  Lock,
  Eye,
  Clock,
  Shield,
  AlertCircle
} from "lucide-react"

type ShareSettings = {
  requireEmail: boolean
  allowDownload: boolean
  password: string | null
  expiresAt: string | null
}

export default function ViewDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<any>(null)
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  
  // Email gate
  const [emailRequired, setEmailRequired] = useState(false)
  const [viewerEmail, setViewerEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  
  // Password gate
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  
  // Tracking
  const [viewStartTime, setViewStartTime] = useState<Date | null>(null)
  const [pagesViewed, setPagesViewed] = useState(0)
  const [hasDownloaded, setHasDownloaded] = useState(false)

  useEffect(() => {
    fetchDocument()
  }, [params.token])

  // Track view duration and send analytics when leaving
  useEffect(() => {
    if (document && emailSubmitted) {
      setViewStartTime(new Date())
      
      const handleBeforeUnload = () => {
        sendAnalytics()
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Also send analytics periodically
      const interval = setInterval(() => {
        sendAnalytics()
      }, 30000) // Every 30 seconds

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        clearInterval(interval)
        sendAnalytics()
      }
    }
  }, [document, emailSubmitted])

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/view/${params.token}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setDocument(data.document)
        setShareSettings(data.settings)
        
        // Check if email is required
        if (data.settings.requireEmail && !emailSubmitted) {
          setEmailRequired(true)
          setLoading(false)
          return
        }
        
        // Check if password is required
        if (data.settings.password) {
          setPasswordRequired(true)
          setLoading(false)
          return
        }
        
        // Load PDF
        await loadPdf()
      } else {
        // Handle expired or invalid link
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch document:", error)
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!viewerEmail || !viewerEmail.includes('@')) {
      alert('Please enter a valid email')
      return
    }
    
    setEmailSubmitted(true)
    setEmailRequired(false)
    
    // Check if password is needed next
    if (shareSettings?.password) {
      setPasswordRequired(true)
    } else {
      await loadPdf()
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verify password
    const res = await fetch(`/api/view/${params.token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    
    const data = await res.json()
    
    if (data.success) {
      setPasswordRequired(false)
      setPasswordError("")
      await loadPdf()
    } else {
      setPasswordError("Incorrect password")
    }
  }

  const loadPdf = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/view/${params.token}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: viewerEmail })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      }
    } catch (error) {
      console.error("Failed to load PDF:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendAnalytics = async () => {
    if (!viewStartTime || !document) return
    
    const timeSpent = Math.floor((new Date().getTime() - viewStartTime.getTime()) / 1000)
    
    try {
      await fetch('/api/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareToken: params.token,
          documentId: document._id,
          viewerEmail: viewerEmail || null,
          timeSpent,
          pagesViewed: document.numPages, // In production, track actual pages
          downloaded: hasDownloaded
        })
      })
    } catch (error) {
      console.error('Failed to send analytics:', error)
    }
  }

  const handleDownload = async () => {
    if (!shareSettings?.allowDownload) return
    
    if (!document) return
    
    setHasDownloaded(true)
    
    try {
      const res = await fetch(`/api/view/${params.token}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: viewerEmail })
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = document.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        // Track download
        await sendAnalytics()
      }
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  // Email gate UI
  if (emailRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Email Required
          </h2>
          <p className="text-slate-600 text-center mb-6">
            Enter your email to view this document
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={viewerEmail}
                onChange={(e) => setViewerEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Continue
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            Your email will only be used to track document views
          </p>
        </div>
      </div>
    )
  }

  // Password gate UI
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Password Protected
          </h2>
          <p className="text-slate-600 text-center mb-6">
            This document is password protected
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError("")
                }}
                required
                className="mt-1"
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </p>
              )}
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Unlock Document
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Loading state
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

  // Document not found or expired
  if (!document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Document Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            This link may have expired or the document has been removed.
          </p>
          <p className="text-sm text-slate-500">
            Please contact the person who shared this document with you.
          </p>
        </div>
      </div>
    )
  }

  // Main viewer
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">{document.filename}</h1>
                <p className="text-xs text-slate-500">
                  {document.numPages} pages • Shared via DocMetrics
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {shareSettings?.allowDownload && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pdfUrl ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-[calc(100vh-200px)]"
              title="PDF Document"
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading document...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Viewing tracked</span>
            </div>
            {shareSettings?.allowDownload && (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Download allowed</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure sharing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}