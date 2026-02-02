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
  Eye,
  Edit,
  Mail, 
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Drawer } from "@/components/ui/drawer"
import { motion } from "framer-motion"
import { AnimatePresence } from "framer-motion"
import { Label } from "@radix-ui/react-dropdown-menu"
import Link from "next/link"

type DocumentType = {
  _id: string
  filename: string
  size: number
  originalFilename?: string 
  archived?: boolean 
  numPages: number
  createdAt: string
    isTemplate?: boolean
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
  const [templates, setTemplates] = useState<DocumentType[]>([])
const [archivedDocuments, setArchivedDocuments] = useState<DocumentType[]>([])
const [activeView, setActiveView] = useState<'documents' | 'templates' | 'archive'>('documents')
const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)
const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
const [hoveredDocId, setHoveredDocId] = useState<string | null>(null)
const [drafts, setDrafts] = useState<Map<string, any>>(new Map()) 
const [sentRequests, setSentRequests] = useState<Map<string, any>>(new Map()) // ⭐ NEW
const [exportDrawerOpen, setExportDrawerOpen] = useState(false)
const [selectedCloudProvider, setSelectedCloudProvider] = useState<string | null>(null)
const [exportingDocumentId, setExportingDocumentId] = useState<string | null>(null)
const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
const [bulkSelectionMode, setBulkSelectionMode] = useState(false)
const [createMenuOpen, setCreateMenuOpen] = useState(false)
const [shareDrawerOpen, setShareDrawerOpen] = useState(false)
const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null)
const [shareSettings, setShareSettings] = useState({
  requireEmail: true,
  allowDownload: false,
  expiresIn: 7,
  password: '',
  recipientEmails: [] as string[], // Array of allowed emails
  allowedEmails: [] as string[], // ⭐ NEW Whitelist of emails
  sendEmailNotification: true, // Send email to recipients
  customMessage: '', // Note from sender
  requireNDA: false, // Require NDA acceptance
  enableWatermark: false, // ⭐ NEW
  watermarkText: '', // ⭐ NEW
  watermarkPosition: 'bottom', // ⭐ NEW
  ndaText: '', 
  ndaTemplateId: '', // ⭐ NEW - Selected template ID
  customNdaText: '', // ⭐ NEW - Custom override
  useCustomNda: false, // ⭐ N

})
const [ndaTemplates, setNdaTemplates] = useState<any[]>([]) // ⭐ NEW
const [loadingTemplates, setLoadingTemplates] = useState(false) // ⭐ NEW
const [recipientInput, setRecipientInput] = useState('') // For adding emails
const [previewData, setPreviewData] = useState<{
  recipients: any[];
  signatureFields: any[];
  viewMode: string;
} | null>(null);




// Fetch NDA templates when share drawer opens
const fetchNdaTemplates = async () => {
  try {
    setLoadingTemplates(true);
    const res = await fetch('/api/nda-templates', {
      credentials: 'include',
    });
    
    if (res.ok) {
      const data = await res.json();
      setNdaTemplates(data.templates);
      
      // Auto-select default template
      const defaultTemplate = data.templates.find((t: any) => t.isDefault);
      if (defaultTemplate) {
        setShareSettings(prev => ({
          ...prev,
          ndaTemplateId: defaultTemplate.id,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch NDA templates:', error);
  } finally {
    setLoadingTemplates(false);
  }
};

// Call when share drawer opens
useEffect(() => {
  if (shareDrawerOpen) {
    fetchNdaTemplates();
  }
}, [shareDrawerOpen]);


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

// Toggle document selection for bulk actions
  const toggleDocumentSelection = (docId: string) => {
  const newSelected = new Set(selectedDocuments)
  if (newSelected.has(docId)) {
    newSelected.delete(docId)
  } else {
    newSelected.add(docId)
  }
  setSelectedDocuments(newSelected)
  
  // Auto-disable bulk mode if no documents selected
  if (newSelected.size === 0) {
    setBulkSelectionMode(false)
  }
}

// Handle bulk signature action
const handleBulkSignature = () => {
  if (selectedDocuments.size < 2) {
    alert('Please select at least 2 documents for bulk signature')
    return
  }
  
  // Navigate to envelope creation with selected document IDs
  const docIds = Array.from(selectedDocuments).join(',')
  router.push(`/documents/envelope/create?docs=${docIds}`) 
}

  // ⭐ NEW: Fetch sent signature requests
// ⭐ UPDATED: Fetch sent signature requests with status details
const fetchSentRequests = async () => {
  console.log('🔍 [DOCUMENTS PAGE] Fetching sent signature requests...');
  try {
    // Get all documents first
    const allDocs = [...documents, ...templates];
    
    const requestMap = new Map();
    
    // Check each document for signature requests
    for (const doc of allDocs) {
      const res = await fetch(`/api/signature-requests/check/${doc._id}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.hasSentRequest) {
          // ⭐ Calculate signing status
          const signedCount = data.recipients.filter((r: any) => r.status === 'signed').length;
          const totalRecipients = data.recipients.length;
          const allSigned = signedCount === totalRecipients;
          const anySigned = signedCount > 0;
          
          requestMap.set(doc._id, {
            ...data,
            signedCount,
            totalRecipients,
            allSigned,
            anySigned,
          });
          
          console.log(`  ✅ Found signature request for: ${doc._id} (${signedCount}/${totalRecipients} signed)`);
        }
      }
    }
    
    setSentRequests(requestMap);
    console.log(`✅ [DOCUMENTS PAGE] Loaded ${requestMap.size} sent requests`);
  } catch (error) {
    console.error('❌ [DOCUMENTS PAGE] Failed to fetch sent requests:', error);
  }
};


// Fetch archived documents
  const fetchArchivedDocuments = async () => {
  try {
    const res = await fetch("/api/documents?deleted=true", {
      method: "GET",
      credentials: "include",
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setArchivedDocuments(data.documents)
      }
    }
  } catch (error) {
    console.error("Failed to fetch archived documents:", error)
  }
}


// ⭐ NEW: Fetch drafts for all documents
const fetchDrafts = async () => {
  console.log('🔍 [DOCUMENTS PAGE] Fetching drafts...');
  try {
    const res = await fetch("/api/signature-drafts", {
      method: "GET",
      credentials: "include",
    })

    console.log('📡 [DOCUMENTS PAGE] Draft fetch response status:', res.status);

    if (res.ok) {
      const data = await res.json()
      console.log('📋 [DOCUMENTS PAGE] Draft data received:', data);
      
      if (data.success && data.drafts) {
        const draftMap = new Map()
        data.drafts.forEach((draft: any) => {
          console.log(`  ➡️ Mapping draft for document: ${draft.documentId}`);
          draftMap.set(draft.documentId, draft)
        })
        setDrafts(draftMap)
        console.log(`✅ [DOCUMENTS PAGE] Loaded ${data.drafts.length} drafts into state`);
        console.log(`📊 [DOCUMENTS PAGE] Draft map size: ${draftMap.size}`);
        console.log(`📊 [DOCUMENTS PAGE] Draft document IDs:`, Array.from(draftMap.keys()));
      } else {
        console.log('⚠️ [DOCUMENTS PAGE] No drafts in response or success=false');
      }
    } else {
      console.log('❌ [DOCUMENTS PAGE] Draft fetch failed with status:', res.status);
      const errorText = await res.text();
      console.log('❌ [DOCUMENTS PAGE] Error response:', errorText);
    }
  } catch (error) {
    console.error("❌ [DOCUMENTS PAGE] Failed to fetch drafts:", error)
  }
}

const handleRestoreDocument = async (docId: string, docName: string) => {
  try {
    const res = await fetch(`/api/documents/${docId}/restore`, {
      method: 'PATCH',
      credentials: 'include',
    })

    if (res.ok) {
      alert(`✅ "${docName}" restored successfully`)
      // Refresh all lists
      fetchDocuments()
      fetchTemplates()
      fetchArchivedDocuments()
    } else {
      alert('Failed to restore document')
    }
  } catch (error) {
    console.error('Restore error:', error)
    alert('Failed to restore document')
  }
}

 useEffect(() => {
  const loadData = async () => {
    await fetchDocuments();
    await fetchTemplates();
    await fetchArchivedDocuments();
    await fetchDrafts();
     
  };
  
  loadData();
  
  const interval = setInterval(() => {
    loadData();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);

//  Only fetch sent requests when documents/templates are FIRST loaded, not on every change
useEffect(() => {
  if (documents.length > 0 || templates.length > 0) {
    // Add a small delay to prevent flickering
    const timer = setTimeout(() => {
      fetchSentRequests();
    }, 300);
    
    return () => clearTimeout(timer);
  }
}, [documents.length, templates.length]); // ⭐ Only watch LENGTH, not entire array

const handleSearch = async (query: string) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    // If empty, fetch all
    fetchDocuments();
    fetchTemplates();
    return;
  }

  try {
    const res = await fetch(`/api/documents?search=${encodeURIComponent(query)}`, {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const searchResults = data.documents;
        
        // IMPORTANT: Handle empty results properly
        const regularDocs = searchResults.filter((doc: DocumentType) => !doc.isTemplate);
        const templateDocs = searchResults.filter((doc: DocumentType) => doc.isTemplate);
        
        setDocuments(regularDocs);
        setTemplates(templateDocs);
      }
    }
  } catch (error) {
    console.error("Search error:", error);
    // On error, show all documents
    fetchDocuments();
    fetchTemplates();
  }
};

// fetch templates
  const fetchTemplates = async () => {
  try {
    const res = await fetch("/api/documents?templates=true", {
      method: "GET",
      credentials: "include",
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setTemplates(data.documents.filter((doc: DocumentType) => doc.isTemplate))
      }
    }
  } catch (error) {
    console.error("Failed to fetch templates:", error)
  }
}



    // Handle document deletion
const handleDeleteDocument = async (docId: string, docName: string) => {
  if (!confirm(`Move "${docName}" to archive?`)) {
    return
  }

  try {
    const res = await fetch(`/api/documents/${docId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      alert('✅ Document moved to archive')
      // Refresh all lists
      fetchDocuments()
      fetchTemplates()
      fetchArchivedDocuments()
    } else {
      alert('Failed to delete document')
    }
  } catch (error) {
    console.error('Delete error:', error)
    alert('Failed to delete document')
  }
}

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
  onChange={(e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  }}
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
    {/* ⭐ NEW: Create Dropdown Menu */}
<DropdownMenu  open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
  <DropdownMenuTrigger asChild>
        <Button className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mb-6">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </Button>
      </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-80 bg-white border shadow-lg">
    {/* Document Option */}
    <DropdownMenuItem
      onClick={() => {
        setCreateMenuOpen(false)
        fileInputRef.current?.click()
      }}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Document</div>
          <div className="text-sm text-slate-600">Upload a file to get it signed</div>
        </div>
      </div>
    </DropdownMenuItem>

    {/* Template Option */}
    <DropdownMenuItem
      onClick={() => {
        setCreateMenuOpen(false)
        fileInputRef.current?.click()
      }}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Template</div>
          <div className="text-sm text-slate-600">Upload a file to resend it multiple times</div>
        </div>
      </div>
    </DropdownMenuItem>

    <div className="h-px bg-slate-200 my-2" />

    {/* Select from Existing Documents */}
    <DropdownMenuItem
      onClick={() => {
        setCreateMenuOpen(false)
        setBulkSelectionMode(true)
        alert('💡 Select 2+ documents below and click "Send for Signature"')
      }}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Select from Existing Documents</div>
          <div className="text-sm text-slate-600">Choose documents you've already uploaded</div>
        </div>
      </div>
    </DropdownMenuItem>

    {/* Create Document Group Template */}
    <DropdownMenuItem
      onClick={() => {
        setCreateMenuOpen(false)
        alert('🚧 Document Group Templates coming soon!\n\nThis will let you bundle multiple documents into a single signature workflow.')
      }}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
          <Folder className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Create Document Group Template</div>
          <div className="text-sm text-slate-600">Bundle multiple docs for signature</div>
        </div>
      </div>
    </DropdownMenuItem>

    <div className="h-px bg-slate-200 my-2" />

    {/* Import from Cloud */}
    <DropdownMenuItem
      onClick={() => {
        setCreateMenuOpen(false)
        alert('🚧 Cloud Import coming soon!\n\nYou\'ll be able to import documents from:\n• Google Drive\n• Dropbox\n• OneDrive\n• Box')
      }}
      className="p-4 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">Import from Cloud</div>
          <div className="text-sm text-slate-600">Bring documents from Google Drive, Dropbox & more</div>
        </div>
      </div>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
    {/* PERSONAL Section */}
    <div className="mb-6">

      <div className="px-3 mb-2">
        
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Personal
        </span>
      </div>
      
      <button 
        onClick={() => setActiveView('documents')}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium ${
          activeView === 'documents' 
            ? 'bg-purple-50 text-purple-700' 
            : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors'
        }`}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <span>Documents</span>
        </div>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{documents.length}</span>
      </button>
      
      <button 
        onClick={() => setActiveView('templates')}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
          activeView === 'templates' 
            ? 'bg-purple-50 text-purple-700' 
            : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="h-5 w-5" />
          <span>Templates</span>
        </div>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{templates.length}</span>
      </button>
      
      <button 
        onClick={() => setActiveView('archive')}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium transition-colors mt-1 ${
          activeView === 'archive' 
            ? 'bg-purple-50 text-purple-700' 
            : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <Trash2 className="h-5 w-5" />
          <span>Archive</span>
        </div>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{archivedDocuments.length}</span>
      </button>
    </div>

    {/* TEAM Section */}
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Team
        </span>
        <button className="h-5 w-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <button 
        onClick={() => {
          // TODO: Implement team documents view
          alert('🚧 Team Documents feature coming soon!')
        }}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <span>Documents</span>
        </div>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">0</span>
      </button>
      
      <button 
        onClick={() => {
          // TODO: Implement team templates view
          alert('🚧 Team Templates feature coming soon!')
        }}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="h-5 w-5" />
          <span>Templates</span>
        </div>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">0</span>
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
    <h1 className="text-3xl font-bold text-slate-900 mb-2">
      {activeView === 'documents' ? 'Documents' : activeView === 'templates' ? 'Templates' : 'Archive'}
    </h1>
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span>
        {activeView === 'documents' ? 'My Documents' : activeView === 'templates' ? 'Signable Templates' : 'Deleted Documents'}
      </span>
      <span>•</span>
      <span>
        {activeView === 'documents' ? documents.length : activeView === 'templates' ? templates.length : archivedDocuments.length} {activeView === 'documents' ? 'documents' : activeView === 'templates' ? 'templates' : 'archived'}
      </span>
    </div>
  </div>
</div>

{/* Bulk Selection Action Bar */}
<AnimatePresence>
  {bulkSelectionMode && selectedDocuments.size > 0 && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-white">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">
            {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          {selectedDocuments.size >= 2 && (
            <Button
              onClick={handleBulkSignature}
              className="bg-white text-purple-600 hover:bg-slate-100 gap-2 font-semibold"
            >
              <Mail className="h-4 w-4" />
              Send for Signature ({selectedDocuments.size})
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedDocuments(new Set())
              setBulkSelectionMode(false)
            }}
            className="text-white hover:bg-white/20"
          >
            Clear Selection
          </Button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

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
          {activeView === 'archive' ? (
  /* Archive View */
  archivedDocuments.length > 0 ? (
    <div className="mb-8">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-orange-900">
          📦 <strong>{archivedDocuments.length}</strong> document(s) in archive. 
          Archived documents can be restored anytime.
        </p>
      </div>
      
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Archived Documents</h2>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="divide-y">
          {archivedDocuments.map((doc) => (
            <div 
              key={doc._id} 
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-slate-900 truncate">
  {doc.originalFilename || doc.filename}
</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      Archived
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span>{doc.numPages} pages</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Deleted {formatTimeAgo(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleRestoreDocument(doc._id, doc.originalFilename || doc.filename)}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Upload className="h-4 w-4 rotate-180" />
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
      <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No archived documents</h3>
      <p className="text-slate-600 mb-6">Deleted documents will appear here</p>
    </div>
  )
) : (
  /* Documents/Templates View */
  (activeView === 'documents' ? documents : templates).length > 0 ? (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        {activeView === 'documents' ? 'Your Documents' : 'Your Templates'}
      </h2>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="divide-y">
         {(activeView === 'documents' ? documents : templates).map((doc) => (
  <div 
    key={doc._id} 
    className="p-4 hover:bg-slate-50 transition-colors relative group"
    onMouseEnter={() => setHoveredDocId(doc._id)}
    onMouseLeave={() => setHoveredDocId(null)}
  >
    <div className="flex items-center gap-4">
       
       {/* ⭐ NEW: Checkbox for Bulk Selection */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={selectedDocuments.has(doc._id)}
          onChange={(e) => {
            e.stopPropagation()
            toggleDocumentSelection(doc._id)
            if (!bulkSelectionMode) setBulkSelectionMode(true)
          }}
          className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
        />
      </div>
      {/* Document Preview Thumbnail - Shows actual PDF content */}
<div 
  className="relative h-32 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-slate-200 shadow-sm cursor-pointer"
  onClick={async (e) => {
  e.stopPropagation()
  setPreviewDocumentId(doc._id)
  
  // ⭐ FIX: ALWAYS fetch fresh signature data when opening drawer
  console.log('👁️ Opening preview for document:', doc._id);
  
  try {
    const res = await fetch(`/api/signature-requests/check/${doc._id}`, {
      credentials: 'include',
    });
    
    if (res.ok) {
      const data = await res.json();
      
      if (data.hasSentRequest) {
        console.log('✅ Signature data found:', data.recipients.length, 'recipients');
        setPreviewData({
          recipients: data.recipients || [],
          signatureFields: data.signatureFields || [],
          viewMode: data.viewMode || 'isolated',
        });
      } else {
        console.log('ℹ️ No signature data for this document');
        setPreviewData(null);
      }
    } else {
      console.log('⚠️ Failed to fetch signature data');
      setPreviewData(null);
    }
  } catch (error) {
    console.error('❌ Error fetching signature data:', error);
    setPreviewData(null);
  }
  
  setPreviewDrawerOpen(true)
}}
>
  {/* PDF Preview */}
  <div className="absolute inset-0 overflow-hidden">
    <iframe
      src={`/api/documents/${doc._id}/file?serve=blob#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0&zoom=85`}
      className="absolute border-0 pointer-events-none"
      style={{
        width: '500px',
        height: '650px',
        left: '50%',
        top: '0',
        transform: 'translateX(-50%) scale(0.2)',
        transformOrigin: 'top center',
        imageRendering: 'crisp-edges',
      }}
      scrolling="no"
      title={`Preview of ${doc.originalFilename || doc.filename}`}
    />
  </div>
  
  {/* Hover Overlay */}
  <AnimatePresence>
    {hoveredDocId === doc._id && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]"
      >
        <Eye className="h-6 w-6 text-white" />
      </motion.div>
    )}
  </AnimatePresence>
</div>
      {/* Document Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
  <h3 className="font-semibold text-slate-900 truncate">{doc.originalFilename || doc.filename}</h3>
  {/*   NEW: Show "Signed" badge if all signed */}
      {sentRequests.has(doc._id) && sentRequests.get(doc._id)?.allSigned && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Signed
        </span>
      )}
  {doc.isTemplate && (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
      Template
    </span>
  )}
  {/*   Draft badge */}
  {drafts.has(doc._id) && (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
      🟠 Draft
    </span>
  )}
</div>
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* ⭐ UPDATED: Only show "Continue Editing" if draft exists AND no sent request */}
{/* ⭐ Show "Continue Editing" if draft exists AND no sent request */}
{drafts.has(doc._id) && !sentRequests.has(doc._id) && (
  <Button 
    size="sm"
    onClick={(e) => {
      e.stopPropagation()
      router.push(`/documents/${doc._id}/signature?mode=draft&returnTo=/documents-page`)
    }}
    className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
    title="Continue editing signature request draft"
  >
    <Edit className="h-4 w-4" />
    Continue Draft
  </Button>
)}

{/* ⭐ FIX 2: Show "Resend" button if sent but not all signed */}
{sentRequests.has(doc._id) && !sentRequests.get(doc._id)?.allSigned && (
  <Button 
    size="sm"
    onClick={async (e) => {
      e.stopPropagation()
      const requestData = sentRequests.get(doc._id);
      const firstPendingRecipient = requestData.recipients.find((r: any) => r.status !== 'signed');
      
      if (firstPendingRecipient) {
        try {
          const res = await fetch(`/api/signature/${firstPendingRecipient.uniqueId}/resend`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (res.ok) {
            alert(`✅ Reminder sent to ${firstPendingRecipient.name}`);
          } else {
            alert('❌ Failed to send reminder');
          }
        } catch (error) {
          alert('❌ Failed to send reminder');
        }
      }
    }}
    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
    title="Resend signature request"
  >
    <Mail className="h-4 w-4" />
    Resend
  </Button>
)}

{/* ⭐ FIX 3: Show "View Status" if ANY signed BUT NOT all signed */}
{sentRequests.has(doc._id) && sentRequests.get(doc._id)?.anySigned && !sentRequests.get(doc._id)?.allSigned && (
  <Button 
    size="sm"
    onClick={(e) => {
      e.stopPropagation()
      router.push(`/SignatureDashboard?documentId=${doc._id}`)
    }}
    className="bg-green-600 hover:bg-green-700 text-white gap-2"
    title="View signature status"
  >
    <CheckCircle2 className="h-4 w-4" />
    View Status
  </Button>
)}

{/* ⭐ NEW: Show "Export to Cloud" if ALL signed */}
{sentRequests.has(doc._id) && sentRequests.get(doc._id)?.allSigned && (
  <Button 
    size="sm"
    onClick={(e) => {
  e.stopPropagation()
  setExportingDocumentId(doc._id)
  setExportDrawerOpen(true)
}}
    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
    title="Export signed document to cloud"
  >
    <Upload className="h-4 w-4" />
    Export to Cloud
  </Button>
)}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/documents/${doc._id}`)
          }}
          title="View analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={(e) => e.stopPropagation()}
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/documents/${doc._id}`)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>

            <DropdownMenuItem
  onClick={(e) => {
    e.stopPropagation()
    setSharingDocumentId(doc._id)
    setShareDrawerOpen(true)
  }}
  className="text-blue-600 focus:text-blue-600"
>
  <Share2 className="h-4 w-4 mr-2" />
  Share Securely
</DropdownMenuItem>
           {/* ⭐ Convert to Signable - Only show if NOT a template */}
  {!doc.isTemplate && (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation()
        router.push(`/documents/${doc._id}/signature?mode=edit`)
      }}
      className="text-purple-600 focus:text-purple-600"
    >
      <Edit className="h-4 w-4 mr-2" />
      Convert to Signable
    </DropdownMenuItem>
  )}

  {/* ⭐ NEW: Send for Signature - Show for both templates and regular docs */}
  <DropdownMenuItem
    onClick={(e) => {
      e.stopPropagation()
      router.push(`/documents/${doc._id}/signature?mode=send`)
    }}
    className="text-blue-600 focus:text-blue-600"
  >
    <Mail className="h-4 w-4 mr-2" />
    Send for Signature
  </DropdownMenuItem>

  {/* ⭐ NEW: Bulk Send - Only show for templates */}
  {doc.isTemplate && (
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation()
        router.push(`/documents/${doc._id}/bulk-send`)
      }}
      className="text-green-600 focus:text-green-600"
    >
      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
      Bulk Send
    </DropdownMenuItem>
  )}

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteDocument(doc._id, doc.originalFilename || doc.filename)
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
))}
        </div>
      </div>
    </div>
  ) : (
    <div 
      className={`bg-white rounded-xl border-2 border-dashed shadow-sm p-12 text-center transition-colors cursor-pointer ${
        isDragging ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
      }`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {activeView === 'documents' ? 'Drop your PDF here' : 'No templates yet'}
      </h3>
      <p className="text-slate-600 mb-6">
        {activeView === 'documents' 
          ? 'or click the Upload button above' 
          : 'Convert a document to a signable template to see it here'}
      </p>
    </div>
  )
)}
          </div>
        </main>
      </div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Preview Drawer */}
       <Drawer open={previewDrawerOpen} onOpenChange={setPreviewDrawerOpen}>
  {previewDocumentId && (
    <div className="h-full flex">
      {/* Sidebar with document info */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-900 mb-1">Document Preview</h3>
          <p className="text-xs text-slate-600">
            {documents.find(d => d._id === previewDocumentId)?.originalFilename || 
             templates.find(d => d._id === previewDocumentId)?.originalFilename || 'Document'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ⭐ NEW: Recipients Section */}
          {previewData && previewData.recipients.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Recipients ({previewData.recipients.length})
              </label>
              <div className="mt-2 space-y-2">
                {previewData.recipients.map((recipient, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: `hsl(${idx * 60}, 70%, 50%)` }}
                      >
                        {recipient.name?.charAt(0) || idx + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {recipient.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{recipient.email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        recipient.status === 'signed' ? 'bg-green-100 text-green-800' :
                        recipient.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {recipient.status === 'signed' ? '✓ Signed' :
                         recipient.status === 'viewed' ? '👁 Viewed' :
                         '⏳ Pending'}
                      </span>
                       {/* ⭐ NEW: Show signed date */}
            {recipient.status === 'signed' && recipient.signedAt && (
              <p className="text-xs text-slate-500 mt-1">
                Signed on {new Date(recipient.signedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Original Document Info */}
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Owner</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {documents.find(d => d._id === previewDocumentId)?.originalFilename?.charAt(0) || 
                   templates.find(d => d._id === previewDocumentId)?.originalFilename?.charAt(0) || 'D'}
                </span>
              </div>
              <span className="text-sm text-slate-700">You</span>
            </div>
          </div>

          {/* Document Info */}
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Details</label>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>
                  {documents.find(d => d._id === previewDocumentId)?.numPages || 
                   templates.find(d => d._id === previewDocumentId)?.numPages || 0} pages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>
                  {formatTimeAgo(documents.find(d => d._id === previewDocumentId)?.createdAt || 
                                 templates.find(d => d._id === previewDocumentId)?.createdAt || '')}
                </span>
              </div>
            </div>
          </div>

          {/* ⭐ NEW: Signature Fields Count */}
          {previewData && previewData.signatureFields.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Signature Fields
              </label>
              <div className="mt-2 text-sm text-slate-700">
                {previewData.signatureFields.length} fields placed
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={async () => {
              try {
                const response = await fetch(`/api/documents/${previewDocumentId}/file?action=download&serve=blob`)
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = documents.find(d => d._id === previewDocumentId)?.originalFilename || 
                            templates.find(d => d._id === previewDocumentId)?.originalFilename || 
                            'document.pdf'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
              } catch (error) {
                console.error('Download failed:', error)
                alert('Failed to download document')
              }
            }}
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreviewDrawerOpen(false)
              router.push(`/documents/${previewDocumentId}`)
            }}
            className="w-full gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Main PDF Viewer with Signature Field Overlays */}
      {/* Main PDF Viewer with Signature Field Overlays */}
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="flex-1 p-6 overflow-auto">
          <div 
            id="preview-pdf-container"
            className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden relative"
            style={{ minHeight: `${297 * ((documents.find(d => d._id === previewDocumentId)?.numPages || templates.find(d => d._id === previewDocumentId)?.numPages) || 1) * 3.78}px` }}
          >
            <embed
              src={`/api/documents/${previewDocumentId}/file?serve=blob#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              type="application/pdf"
              className="w-full border-0"
              style={{ 
                height: `${297 * ((documents.find(d => d._id === previewDocumentId)?.numPages || templates.find(d => d._id === previewDocumentId)?.numPages) || 1) * 3.78}px`,
                display: 'block',
                pointerEvents: 'none'
              }}
            />
            
            {/* ⭐ FIXED: Signature Field Overlays - Now with correct positioning */}
            <div className="absolute inset-0 pointer-events-none">
              {previewData && previewData.signatureFields.map((field, idx) => {
                const recipient = previewData.recipients[field.recipientIndex];
                const pageHeight = 297 * 3.78; // A4 page height in pixels
                const topPosition = (field.page - 1) * pageHeight + (field.y / 100) * pageHeight;
                
                // ⭐ Find the signed data for this field
                const signedFieldData = recipient?.signedFields?.find(
                  (sf: any) => sf.id === field.id || sf.type === field.type
                );
                
                // ⭐ Check if this field has been signed
                const isSigned = recipient?.status === 'signed' && signedFieldData;
                
                return (
                  <div
                    key={idx}
                    className={`absolute pointer-events-none ${
                      isSigned 
                        ? '' // ⭐ NO border/background when signed
                        : 'border-2 rounded bg-white/90 shadow-lg border-gray-400'
                    }`}
                    style={{
                      left: `${field.x}%`,
                      top: `${topPosition}px`,
                      width: field.type === "signature" ? "140px" : "120px",
                      height: field.type === "signature" ? "50px" : "36px",
                      transform: "translate(-50%, 0%)",
                    }}
                  >
                    {isSigned ? (
                      // ⭐ SHOW ONLY THE ACTUAL SIGNED DATA
                      <div className="h-full w-full flex items-center justify-center">
                        {field.type === "signature" && signedFieldData.signatureData && (
                          <img 
                            src={signedFieldData.signatureData} 
                            alt="Signature"
                            className="max-w-full max-h-full object-contain"
                            style={{ filter: 'none' }}
                          />
                        )}
                        {field.type === "date" && (
                          <span className="text-xs font-semibold text-gray-900">
                            {signedFieldData.dateValue || new Date(recipient.signedAt).toLocaleDateString()}
                          </span>
                        )}
                        {field.type === "text" && (
                          <span className="text-xs font-semibold text-gray-900 truncate px-1">
                            {signedFieldData.textValue || ''}
                          </span>
                        )}
                        {field.type === "checkbox" && (
                          <span className="text-2xl text-gray-900">
                            {signedFieldData.checkboxValue ? '☑' : '☐'}
                          </span>
                        )}
                        {field.type === "attachment" && signedFieldData.attachmentUrl && (
                          <a 
                            href={signedFieldData.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline truncate px-1 pointer-events-auto"
                          >
                            📎 View File
                          </a>
                        )}
                      </div>
                    ) : (
                      // ⭐ SHOW PLACEHOLDER BOX FOR UNSIGNED FIELDS
                      <div className="h-full flex items-center justify-center px-2">
                        <span className="text-xs font-semibold text-gray-600 truncate">
                          {field.type === "signature" ? "✍️ Awaiting Signature" :
                           field.type === "date" ? "📅 Date" :
                           field.type === "text" ? "📝 Text Field" :
                           field.type === "checkbox" ? "☑️ Checkbox" :
                           field.type === "attachment" ? "📎 Attachment" :
                           field.type}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</Drawer>

{/* Cloud Export Drawer */}
<Drawer open={exportDrawerOpen} onOpenChange={setExportDrawerOpen}>
  <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
    {/* Header */}
    <div className="p-6 border-b bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Export to Cloud Storage
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExportDrawerOpen(false)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        Connect your account to export your fully signed document
      </p>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Cloud Provider Options */}
        {[
          {
            id: 'google-drive',
            name: 'Google Drive',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z" fill="#4285F4"/>
                <path d="M9.982 17l-4.018 6.515h8.071L18.053 17H9.982z" fill="#34A853"/>
                <path d="M18.053 17l4.018-6.77-4.018-6.745L14.035 10l4.018 7z" fill="#FBBC04"/>
                <path d="M3.982 15L7.964 8.23 3.946 1.485 0 8.23 3.982 15z" fill="#EA4335"/>
              </svg>
            ),
            gradient: 'from-blue-500 to-green-500',
            description: 'Store in your Google Drive account',
          },
          {
            id: 'dropbox',
            name: 'Dropbox',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6.001-3.822L6 18.371z" fill="#0061FF"/>
              </svg>
            ),
            gradient: 'from-blue-600 to-blue-700',
            description: 'Export to your Dropbox folder',
          },
          {
            id: 'onedrive',
            name: 'OneDrive for Business',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.82 6.12a6.62 6.62 0 016.6 6.57c0 .11 0 .22-.01.33a4.42 4.42 0 012.4 3.9c0 2.44-1.98 4.42-4.42 4.42H7.42A4.42 4.42 0 013 16.92c0-2.01 1.34-3.7 3.18-4.25a6.62 6.62 0 016.64-6.55z" fill="#0078D4"/>
              </svg>
            ),
            gradient: 'from-blue-500 to-blue-600',
            description: 'Save to OneDrive Business',
          },
          {
            id: 'box',
            name: 'Box',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 5.91v12.1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5.91c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm10 10.18l-4.5-2.9V8.73L12 11.63l4.5-2.9v4.46l-4.5 2.9z" fill="#0061D5"/>
              </svg>
            ),
            gradient: 'from-blue-600 to-indigo-600',
            description: 'Upload to Box cloud storage',
          },
          {
            id: 'egnyte',
            name: 'Egnyte',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.48l7 3.51v7.83l-7-3.5V9.48zm16 0v7.84l-7 3.5v-7.83l7-3.51z" fill="#D9272E"/>
              </svg>
            ),
            gradient: 'from-red-500 to-red-600',
            description: 'Export to Egnyte storage',
          },
          {
            id: 'dokushare',
            name: 'DokuShare',
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-3h8v2H8v-2zm0-3h5v2H8V8z" fill="#2C5F9E"/>
              </svg>
            ),
            gradient: 'from-indigo-600 to-blue-700',
            description: 'Save to DokuShare repository',
          },
        ].map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => setSelectedCloudProvider(provider.id)}
            className={`w-full p-5 rounded-xl border-2 transition-all ${
              selectedCloudProvider === provider.id
                ? 'border-purple-500 bg-purple-50 shadow-lg'
                : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center text-white shadow-lg`}>
                {provider.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-slate-900">{provider.name}</h3>
                <p className="text-sm text-slate-600">{provider.description}</p>
              </div>
              {selectedCloudProvider === provider.id && (
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>

    {/* Footer Actions */}
    <div className="p-6 border-t bg-white/80 backdrop-blur">
      <div className="max-w-2xl mx-auto flex gap-3">
        <Button
          variant="outline"
          onClick={() => setExportDrawerOpen(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!selectedCloudProvider) {
              alert('Please select a cloud storage provider')
              return
            }
            // TODO: Implement actual cloud export logic
            alert(`🚀 Exporting to ${selectedCloudProvider}... (Coming soon!)`)
            setExportDrawerOpen(false)
          }}
          disabled={!selectedCloudProvider}
          className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Upload className="h-4 w-4" />
          Connect & Export
        </Button>
      </div>
    </div>
  </div>
</Drawer>

{/* Share Drawer */}
<Drawer open={shareDrawerOpen} onOpenChange={setShareDrawerOpen}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">
          Share Document
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShareDrawerOpen(false)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        {documents.find(d => d._id === sharingDocumentId)?.originalFilename || 
         templates.find(d => d._id === sharingDocumentId)?.originalFilename || 'Document'}
      </p>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ⭐ NEW: Recipients Section */}
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Recipients (Optional)</h3>
      <p className="text-sm text-slate-600 mb-4">
        Add email addresses to restrict access. Leave empty for "anyone with link".
      </p>
      
      {/* Email Input */}
      <div className="flex gap-2 mb-3">
        <Input
          type="email"
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder="recipient@company.com"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
                if (!shareSettings.recipientEmails.includes(recipientInput)) {
                  setShareSettings({
                    ...shareSettings,
                    recipientEmails: [...shareSettings.recipientEmails, recipientInput]
                  })
                  setRecipientInput('')
                }
              }
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => {
            if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
              if (!shareSettings.recipientEmails.includes(recipientInput)) {
                setShareSettings({
                  ...shareSettings,
                  recipientEmails: [...shareSettings.recipientEmails, recipientInput]
                })
                setRecipientInput('')
              }
            }
          }}
          variant="outline"
        >
          Add
        </Button>
      </div>
      {/* Email List */}
      {shareSettings.recipientEmails.length > 0 && (
        <div className="space-y-2">
          {shareSettings.recipientEmails.map((email, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
              <span className="text-sm text-slate-900">{email}</span>
              <button
                onClick={() => {
                  setShareSettings({
                    ...shareSettings,
                    recipientEmails: shareSettings.recipientEmails.filter((_, i) => i !== idx)
                  })
                }}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Email Toggle */}
      {shareSettings.recipientEmails.length > 0 && (
        <label className="flex items-center justify-between cursor-pointer mt-4 pt-4 border-t">
          <div>
            <div className="font-medium text-slate-900">Send Email Notification</div>
            <div className="text-sm text-slate-600">Email recipients with the link</div>
          </div>
          <input
            type="checkbox"
            checked={shareSettings.sendEmailNotification}
            onChange={(e) => setShareSettings({...shareSettings, sendEmailNotification: e.target.checked})}
            className="h-5 w-5 rounded border-slate-300 text-blue-600"
          />
        </label>
      )}
    </div>

    {/* ⭐ NEW: Custom Message */}
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Message to Recipients (Optional)</h3>
      <textarea
        value={shareSettings.customMessage}
        onChange={(e) => setShareSettings({...shareSettings, customMessage: e.target.value})}
        placeholder="Add a personal note that recipients will see when they open the document..."
        rows={4}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        maxLength={500}
      />
      <p className="text-xs text-slate-500 mt-1">
        {shareSettings.customMessage.length}/500 characters
      </p>
    </div>
        {/* Security Settings */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-4">Security Settings</h3>
          
          {/* Require Email */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium text-slate-900">Require Email Verification</div>
              <div className="text-sm text-slate-600">Viewers must enter email to access</div>
            </div>
            <input
              type="checkbox"
              checked={shareSettings.requireEmail}
              onChange={(e) => setShareSettings({...shareSettings, requireEmail: e.target.checked})}
              className="h-5 w-5 rounded border-slate-300 text-blue-600"
            />
          </label>


          {/* Allow Download */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium text-slate-900">Allow Download</div>
              <div className="text-sm text-slate-600">Let viewers download the PDF</div>
            </div>
            <input
              type="checkbox"
              checked={shareSettings.allowDownload}
              onChange={(e) => setShareSettings({...shareSettings, allowDownload: e.target.checked})}
              className="h-5 w-5 rounded border-slate-300 text-blue-600"
            />
          </label>

          {/* Expiration */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Link Expires In
            </Label>
            <select
              value={shareSettings.expiresIn}
              onChange={(e) => setShareSettings({...shareSettings, expiresIn: parseInt(e.target.value)})}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="0">Never</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Password (Optional)
            </Label>
            <Input
              type="password"
              value={shareSettings.password}
              onChange={(e) => setShareSettings({...shareSettings, password: e.target.value})}
              placeholder="Leave empty for no password"
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📊 <strong>Track views:</strong> You'll see who viewed your document, 
            time spent, and location in the analytics page.
          </p>
        </div>

      </div>
    </div>

    {/*  Watermark Settings */}
<div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold text-slate-900">💧 Watermark (Premium)</h3>
    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
      Premium
    </span>
  </div>
  
  <label className="flex items-center justify-between cursor-pointer">
    <div>
      <div className="font-medium text-slate-900">Enable Watermark</div>
      <div className="text-sm text-slate-600">Add viewer's email to each page</div>
    </div>
    <input
      type="checkbox"
      checked={shareSettings.enableWatermark}
      onChange={(e) => setShareSettings({...shareSettings, enableWatermark: e.target.checked})}
      className="h-5 w-5 rounded border-slate-300 text-purple-600"
    />
  </label>

  {shareSettings.enableWatermark && (
    <>
      <div>
        <Label>Watermark Text (Optional)</Label>
        <Input
          value={shareSettings.watermarkText}
          onChange={(e) => setShareSettings({...shareSettings, watermarkText: e.target.value})}
          placeholder="Leave empty to use viewer's email"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label>Position</Label>
        <select
          value={shareSettings.watermarkPosition}
          onChange={(e) => setShareSettings({...shareSettings, watermarkPosition: e.target.value})}
          className="w-full border rounded-lg px-3 py-2 mt-1"
        >
          <option value="bottom">Bottom</option>
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="diagonal">Diagonal</option>
        </select>
      </div>
    </>
  )}
</div>
{/* ⭐ NDA Requirement */}
<div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold text-slate-900">📜 NDA Requirement</h3>
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
        Premium
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/settings/nda-templates')}
        className="text-xs h-7"
      >
        Manage Templates
      </Button>
    </div>
  </div>
  
  <label className="flex items-center justify-between cursor-pointer">
    <div>
      <div className="font-medium text-slate-900">Require NDA Acceptance</div>
      <div className="text-sm text-slate-600">Viewers must accept terms before viewing</div>
    </div>
    <input
      type="checkbox"
      checked={shareSettings.requireNDA}
      onChange={(e) => setShareSettings({...shareSettings, requireNDA: e.target.checked})}
      className="h-5 w-5 rounded border-slate-300 text-purple-600"
    />
  </label>

  {shareSettings.requireNDA && (
    <>

    {/* ⭐ ADD THIS LINK HERE */}
      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div>
          <p className="text-sm font-medium text-purple-900">NDA Templates</p>
          <p className="text-xs text-purple-700">Create & manage custom NDA templates</p>
        </div>
        <Link href="/settings/nda-templates">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Manage
          </Button>
        </Link>
      </div>
      
      {/* Template Selection */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          NDA Template
        </Label>
        
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setShareSettings({...shareSettings, useCustomNda: false})}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              !shareSettings.useCustomNda
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Use Template
          </button>
          <button
            onClick={() => setShareSettings({...shareSettings, useCustomNda: true})}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              shareSettings.useCustomNda
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Custom Text
          </button>
        </div>

        {!shareSettings.useCustomNda ? (
          // Template Selector
          <div>
            {loadingTemplates ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              </div>
            ) : (
              <select
                value={shareSettings.ndaTemplateId}
                onChange={(e) => setShareSettings({...shareSettings, ndaTemplateId: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select a template...</option>
                {ndaTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault && ' (Default)'}
                    {template.isSystemDefault && ' (System)'}
                  </option>
                ))}
              </select>
            )}
            
            {shareSettings.ndaTemplateId && (
              <div className="mt-2 p-3 bg-slate-50 rounded border">
                <p className="text-xs font-medium text-slate-700 mb-2">Preview:</p>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans line-clamp-4">
                  {ndaTemplates.find(t => t.id === shareSettings.ndaTemplateId)?.template || ''}
                </pre>
              </div>
            )}
          </div>
        ) : (
          // Custom Text
          <div>
            <textarea
              value={shareSettings.customNdaText}
              onChange={(e) => setShareSettings({...shareSettings, customNdaText: e.target.value})}
              placeholder="Enter custom NDA text here..."
              rows={10}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              maxLength={2000}
            />
            <p className="text-xs text-slate-500 mt-1">
              {shareSettings.customNdaText.length}/2000 characters
            </p>
            <p className="text-xs text-blue-600 mt-2">
              💡 You can use variables: {`{{viewer_name}}, {{viewer_email}}, {{document_title}}`}
            </p>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs text-green-900">
          ✅ <strong>Legal Protection:</strong> NDA acceptance is logged with timestamp, 
          IP address, and email for legal evidence.
        </p>
      </div>

      <Link href="/settings/nda-templates">
  <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
        <FileText className="h-5 w-5 text-purple-600" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">NDA Templates</h3>
        <p className="text-sm text-slate-600">Manage Non-Disclosure Agreement templates</p>
      </div>
    </div>
  </div>
</Link>
    </>
  )}
</div>





    {/* Footer */}
<div className="p-6 border-t">
  <div className="max-w-2xl mx-auto">
    {/* ⭐ NEW: Preview what will be sent */}
    {shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification && (
      <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
        <p className="text-xs font-medium text-slate-700 mb-2">EMAIL PREVIEW:</p>
        <div className="bg-white rounded border p-3 text-sm">
          <p className="font-semibold">You have {shareSettings.recipientEmails.length} recipient(s)</p>
          <p className="text-slate-600 mt-1">
            Subject: {documents.find(d => d._id === sharingDocumentId)?.originalFilename || 'Document'} has been shared with you
          </p>
          {shareSettings.customMessage && (
            <p className="text-slate-600 mt-2 text-xs italic">
              "{shareSettings.customMessage}"
            </p>
          )}
        </div>
      </div>
    )}

    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => setShareDrawerOpen(false)}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={async () => {
          if (!sharingDocumentId) return;
          // ⭐ AUTO-ADD: If user typed an email but didn't click "Add", add it now
    if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
      if (!shareSettings.recipientEmails.includes(recipientInput)) {
        console.log('⚡ Auto-adding email before sending:', recipientInput);
        shareSettings.recipientEmails.push(recipientInput);
        setRecipientInput(''); // Clear input
      }
    }
    
    console.log('🚀 Creating share link with emails:', shareSettings.recipientEmails);
    
          
          try {
            const res = await fetch(`/api/documents/${sharingDocumentId}/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                requireEmail: shareSettings.requireEmail,
                allowDownload: shareSettings.allowDownload,
                password: shareSettings.password || null,
                expiresIn: shareSettings.expiresIn === 0 ? 'never' : shareSettings.expiresIn.toString(),
                allowedEmails: shareSettings.recipientEmails, // ⭐ Send allowed emails
                customMessage: shareSettings.customMessage || null, // ⭐ Send custom message
                sendEmailNotification: shareSettings.sendEmailNotification, // ⭐ NEW
                notifyOnView: true,
                allowPrint: true,
                trackDetailedAnalytics: true,
                enableWatermark: shareSettings.enableWatermark, // ⭐ NEW
  watermarkText: shareSettings.watermarkText || null, // ⭐ NEW
  watermarkPosition: shareSettings.watermarkPosition, // ⭐ NEW
                requireNDA: shareSettings.requireNDA, // ⭐ NEW
  ndaText: shareSettings.ndaText || null, // ⭐ NEW
  ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId, // ⭐ NEW
  customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null
              }),
            });
            
            console.log('📡 [SHARE] Response status:', res.status);
    const data = await res.json();
    console.log('📦 [SHARE] Response data:', data);

            if (res.ok && data.success) {
              console.log('✅ [SHARE] Share link created:', data.shareLink);
              // ⭐ Show success popup with link
              const shareLink = data.shareLink;
              
              // Create modal content
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
              modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-slate-900">Link Created!</h3>
                      <p class="text-sm text-slate-600">${shareSettings.recipientEmails.length > 0 ? `Sent to ${shareSettings.recipientEmails.length} recipient(s)` : 'Anyone with link can view'}</p>
                    </div>
                  </div>
                  
                  ${shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p class="text-sm text-blue-900">
                        ✉️ <strong>Emails sent to:</strong><br/>
                        ${shareSettings.recipientEmails.map(e => `• ${e}`).join('<br/>')}
                      </p>
                    </div>
                  ` : ''}
                  
                  <div class="mb-4">
                    <label class="text-sm font-medium text-slate-700 block mb-2">Share Link:</label>
                    <div class="flex gap-2">
                      <input 
                        type="text" 
                        value="${shareLink}" 
                        readonly 
                        class="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50"
                        id="shareLinkInput"
                      />
                      <button 
                        onclick="
                          navigator.clipboard.writeText('${shareLink}');
                          this.innerHTML = '✓ Copied';
                          setTimeout(() => this.innerHTML = 'Copy', 2000);
                        "
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div class="space-y-2 text-sm text-slate-600 mb-4">
                    <p>⏰ Expires: ${shareSettings.expiresIn === 0 ? 'Never' : `${shareSettings.expiresIn} days`}</p>
                    <p>📥 Download: ${shareSettings.allowDownload ? 'Allowed' : 'Disabled'}</p>
                    ${shareSettings.password ? '<p>🔒 Password protected</p>' : ''}
                    ${shareSettings.recipientEmails.length > 0 ? `<p>✉️ Email-gated (${shareSettings.recipientEmails.length} recipients)</p>` : '<p>🌐 Open to anyone with link</p>'}
                  </div>
                  
                  <div class="flex gap-3">
                    <button 
                      onclick="window.open('${shareLink}', '_blank'); this.parentElement.parentElement.parentElement.remove();"
                      class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Test Link
                    </button>
                    <button 
                      onclick="this.parentElement.parentElement.parentElement.remove()"
                      class="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              `;
              
              document.body.appendChild(modal);
              modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
              };
              
              setShareDrawerOpen(false);
              
              // Reset settings
              setShareSettings({
                requireEmail: true,
                allowDownload: false,
                expiresIn: 7,
                password: '',
                recipientEmails: [],
                sendEmailNotification: true,
                customMessage: '',
                requireNDA: false,
                allowedEmails: [],
                enableWatermark: false,
                watermarkText: '',
                watermarkPosition: 'bottom',
                ndaText: '',
                 ndaTemplateId: '', // ⭐ NEW - Selected template ID
  customNdaText: '', // ⭐ NEW - Custom override
  useCustomNda: false, // ⭐ N


                
                


                
              });
            } else {
              if (data.upgrade) {
                alert(`❌ ${data.error}\n\nUpgrade to Premium to unlock this feature.`);
              } else {
                alert(`❌ ${data.error || 'Failed to create share link'}`);
              }
            }
          } catch (error) {
            console.error('Share error:', error);
            alert('❌ Failed to create share link. Please try again.');
          }
        }}
        className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Share2 className="h-4 w-4" />
        {shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification ? 
          `Send to ${shareSettings.recipientEmails.length} Recipient${shareSettings.recipientEmails.length > 1 ? 's' : ''}` : 
          'Create Link'}
      </Button>
    </div>
  </div>
</div>
    </div>
</Drawer>

    </div>

    
  )
}