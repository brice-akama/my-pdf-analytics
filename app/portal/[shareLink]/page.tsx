"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FolderOpen,
  FileText,
  Eye,
  Download,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink
} from "lucide-react"

type DocumentType = {
  id: string
  name: string
  type: string
  size: string
  cloudinaryPdfUrl: string
  folderId: string | null
}

type SpaceData = {
  name: string
  description: string
  branding: {
    logoUrl?: string
    primaryColor: string
    companyName?: string
    welcomeMessage: string
    coverImageUrl?: string
  }
  documents: DocumentType[]
  folders: Array<{
    id: string
    name: string
  }>
}

export default function PortalPage() {
  const params = useParams()
  const router = useRouter()
  const shareLink = params.shareLink as string

  // States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null)
  const [requiresEmail, setRequiresEmail] = useState(false)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  
  // Form states
  const [visitorEmail, setVisitorEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch space data
  useEffect(() => {
    fetchPortalData()
  }, [shareLink])

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      
      const res = await fetch(`/api/portal/${shareLink}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        if (res.status === 404) {
          setError("This link is invalid or has expired.")
        } else if (res.status === 403) {
          setError("Access denied. This link may have reached its view limit.")
        } else {
          setError("Failed to load documents. Please try again.")
        }
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data.success) {
        setSpaceData(data.space)
        console.log('📄 Portal Documents:', data.space.documents) // ← ADD THIS
  console.log('📁 Portal Folders:', data.space.folders) // 
        setRequiresEmail(data.requiresEmail)
        setRequiresPassword(data.requiresPassword)
        
        // If no email required, show documents immediately
        if (!data.requiresEmail && !data.requiresPassword) {
          setEmailSubmitted(true)
        }
      } else {
        setError(data.error || "Failed to load space")
      }
    } catch (err) {
      console.error("Portal error:", err)
      setError("Failed to load documents. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  // Submit email/password
  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (requiresEmail && !visitorEmail.trim()) {
      alert("Please enter your email address")
      return
    }

    if (requiresPassword && !password.trim()) {
      alert("Please enter the password")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/portal/${shareLink}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: visitorEmail,
          password: password
        })
      })

      const data = await res.json()

      if (data.success) {
        setEmailSubmitted(true)
        // Track the visitor
        trackVisit()
      } else {
        alert(data.error || "Access denied")
      }
    } catch (err) {
      console.error("Verification error:", err)
      alert("Failed to verify access. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Track visit (we'll implement this in Step 5)
  const trackVisit = async () => {
    try {
      await fetch(`/api/portal/${shareLink}/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: visitorEmail,
          event: 'portal_opened'
        })
      })
    } catch (err) {
      // Silent fail - tracking shouldn't block user
      console.error("Tracking error:", err)
    }
  }

  // Track document view
  const handleDocumentView = async (documentId: string, documentName: string) => {
    // Track the view
    try {
      await fetch(`/api/portal/${shareLink}/track`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: visitorEmail,
          event: 'document_viewed',
          documentId,
          documentName
        })
      })
    } catch (err) {
      console.error("View tracking error:", err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading documents...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !spaceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <p className="text-sm text-slate-500">
            If you believe this is a mistake, please contact the person who shared this link with you.
          </p>
        </div>
      </div>
    )
  }

  // Email/Password gate (before showing documents)
  if (!emailSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border shadow-lg p-8 max-w-md w-full">
          {/* Logo/Branding */}
          {spaceData.branding.logoUrl ? (
            <img 
              src={spaceData.branding.logoUrl} 
              alt="Logo" 
              className="h-12 mx-auto mb-6"
            />
          ) : (
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: spaceData.branding.primaryColor }}
            >
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
          )}

          {/* Welcome Message */}
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            {spaceData.name}
          </h1>
          <p className="text-slate-600 text-center mb-6">
            {spaceData.branding.welcomeMessage}
          </p>

          {/* Email/Password Form */}
          <form onSubmit={handleAccessSubmit} className="space-y-4">
            {requiresEmail && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {requiresPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2"
              style={{ backgroundColor: spaceData.branding.primaryColor }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Access Documents
                </>
              )}
            </Button>
          </form>

          {/* Privacy Note */}
          <p className="text-xs text-slate-500 text-center mt-6">
            🔒 Your information is secure and will only be used to provide access to these documents.
          </p>
        </div>
      </div>
    )
  }

  // Main portal view (after email submitted)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {spaceData.branding.logoUrl ? (
                <img src={spaceData.branding.logoUrl} alt="Logo" className="h-8" />
              ) : (
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: spaceData.branding.primaryColor }}
                >
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900">{spaceData.name}</h1>
                {spaceData.branding.companyName && (
                  <p className="text-xs text-slate-500">{spaceData.branding.companyName}</p>
                )}
              </div>
            </div>
            
            {visitorEmail && (
              <div className="text-sm text-slate-600">
                <Mail className="inline h-3 w-3 mr-1" />
                {visitorEmail}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {spaceData.description && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <p className="text-slate-700">{spaceData.description}</p>
          </div>
        )}

        {/* Documents by Folder */}
        {spaceData.folders.map((folder) => {
          const folderDocs = spaceData.documents.filter(doc => doc.folderId === folder.id)
          
          if (folderDocs.length === 0) return null
          

          return (
            <div key={folder.id} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">{folder.name}</h2>
                <span className="text-sm text-slate-500">({folderDocs.length})</span>
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="divide-y">
                  {folderDocs.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{doc.name}</p>
                            <p className="text-sm text-slate-500">{doc.type} • {doc.size}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={async () => {
    handleDocumentView(doc.id, doc.name)
    
    // Open window immediately (prevents pop-up blocking)
    const newWindow = window.open('about:blank', '_blank')
    
    try {
      const response = await fetch(`/api/portal/${shareLink}/documents/${doc.id}`)
      if (!response.ok) throw new Error('View failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Load PDF into the already-opened window
      if (newWindow) {
        newWindow.location.href = url
      }
    } catch (err) {
      console.error('View error:', err)
      if (newWindow) newWindow.close()
      alert('Failed to open document. Please try again.')
    }
  }}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={async () => {
  try {
    const response = await fetch(`/api/portal/${shareLink}/documents/${doc.id}?download=true`)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('Download error:', err)
    alert('Download failed. Please try again.')
  }
}}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* Documents without folder */}
        {spaceData.documents.filter(doc => !doc.folderId).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Documents</h2>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="divide-y">
                {spaceData.documents.filter(doc => !doc.folderId).map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{doc.name}</p>
                          <p className="text-sm text-slate-500">{doc.type} • {doc.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={async () => {
    handleDocumentView(doc.id, doc.name)
    
    // Open window immediately (prevents pop-up blocking)
    const newWindow = window.open('about:blank', '_blank')
    
    try {
      const response = await fetch(`/api/portal/${shareLink}/documents/${doc.id}`)
      if (!response.ok) throw new Error('View failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Load PDF into the already-opened window
      if (newWindow) {
        newWindow.location.href = url
      }
    } catch (err) {
      console.error('View error:', err)
      if (newWindow) newWindow.close()
      alert('Failed to open document. Please try again.')
    }
  }}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                           onClick={async () => {
  try {
    const response = await fetch(`/api/portal/${shareLink}/documents/${doc.id}?download=true`)
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (err) {
    console.error('Download error:', err)
    alert('Download failed. Please try again.')
  }
}}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {spaceData.documents.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
            <p className="text-slate-600">Documents will appear here when they are added.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-slate-500">
          <p>🔒 This is a secure document portal. Do not share this link with others.</p>
        </div>
      </footer>
    </div>
  )
}