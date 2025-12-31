

"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Upload,
  FolderOpen,
  FileText,
  Share2,
  Settings,
  Users,
  BarChart3,
  Plus,
  Home,
  Trash2,
  MoreVertical,
  Eye,
  Download,
  Clock,
  Activity,
  Search,
  Folder,
  Edit,
  Lock,
  Globe,
  ChevronRight,
  Filter,
  Grid,
  List as ListIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

type FolderType = {
  id: string
  name: string
  documentCount: number
  lastUpdated: string
}

type DocumentType = {
  id: string
  name: string
  type: string
  size: string
  views: number
  downloads: number
  lastUpdated: string
  folderId: string | null
  cloudinaryPdfUrl: string 
}

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'folders'  | 'qa' | 'analytics' | 'audit'>('home')
  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders')
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'views'>('date')
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
const [showOrganizeMenu, setShowOrganizeMenu] = useState(false)
const [showRecentFiles, setShowRecentFiles] = useState(false)
const [recentFiles, setRecentFiles] = useState<DocumentType[]>([])
const [showAddContactDialog, setShowAddContactDialog] = useState(false)
const [contactEmail, setContactEmail] = useState("")
const [contactRole, setContactRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
const [addingContact, setAddingContact] = useState(false)
const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
const [newFolderName, setNewFolderName] = useState("")
const [creatingFolder, setCreatingFolder] = useState(false)
const [isSearching, setIsSearching] = useState(false)
const [searchResults, setSearchResults] = useState<DocumentType[]>([])
const [showRenameDialog, setShowRenameDialog] = useState(false)
const [showMoveDialog, setShowMoveDialog] = useState(false)
const [selectedFile, setSelectedFile] = useState<DocumentType | null>(null)
const [newFilename, setNewFilename] = useState('')
const [targetFolderId, setTargetFolderId] = useState<string | null>(null)
const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
const [uploadMessage, setUploadMessage] = useState('')
const [isDragging, setIsDragging] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)
const [showShareDialog, setShowShareDialog] = useState(false)
const [shareLink, setShareLink] = useState('')
const [sharingStatus, setSharingStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
const [shareError, setShareError] = useState('')
const [showMembersDialog, setShowMembersDialog] = useState(false)
const [contacts, setContacts] = useState<Array<{
  id: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  addedAt: string
}>>([])
const [user, setUser] = useState<{ email: string } | null>(null)









const handleSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }

  setIsSearching(true);

  try {
    const res = await fetch(
      `/api/documents/search?spaceId=${params.id}&query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        credentials: "include", // ✅ REQUIRED for http-only cookies
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Search request failed");
    }

    const data = await res.json();

    if (data.success) {
      setSearchResults(data.documents);
    } else {
      setSearchResults([]);
    }
  } catch (error) {
    console.error("Search failed:", error);
  } finally {
    setIsSearching(false);
  }
};

const fetchContacts = async () => {
  try {
    const res = await fetch(`/api/spaces/${params.id}/contacts`, {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
        console.log('✅ Loaded contacts:', data.contacts);
      }
    }
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
  }
};


const handleCreateFolder = async () => {
  if (!newFolderName.trim()) return;

  setCreatingFolder(true);

  try {
    // ✅ CORRECT: Use space-specific route
    const res = await fetch(`/api/spaces/${params.id}/folders`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newFolderName.trim(),
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // ✅ Refresh folders from database
      await fetchFolders();
      
      setNewFolderName('');
      setShowCreateFolderDialog(false);
      alert('Folder created successfully!');
    } else {
      alert(data.error || 'Failed to create folder');
    }
  } catch (error) {
    console.error('Failed to create folder:', error);
    alert('Failed to create folder');
  } finally {
    setCreatingFolder(false);
  }
};

// File upload handler
const handleFileUpload = async (file: File) => {
  if (!file) return

  setUploadStatus('uploading')
  setUploadMessage(`Uploading ${file.name}...`)

  const formData = new FormData()
  formData.append('file', file)
  if (selectedFolder) {
    formData.append('folderId', selectedFolder)
  }

  try {
    const res = await fetch(`/api/spaces/${params.id}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    const data = await res.json()

    if (res.ok && data.success) {
      setUploadStatus('success')
      setUploadMessage(`${file.name} uploaded successfully!`)
      fetchSpace() // Refresh
      
      setTimeout(() => {
        setUploadStatus('idle')
        setUploadMessage('')
        setShowUploadDialog(false)
      }, 2000)
    } else {
      setUploadStatus('error')
      setUploadMessage(data.error || 'Upload failed')
      setTimeout(() => setUploadStatus('idle'), 3000)
    }
  } catch (error) {
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
  
  const droppedFiles = e.dataTransfer.files
  if (droppedFiles.length > 0) {
    handleFileUpload(droppedFiles[0])
  }
}

// Rename file
const handleRenameFile = async () => {
  if (!selectedFile || !newFilename.trim()) return

  try {
    const res = await fetch(`/api/spaces/${params.id}/files/${selectedFile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'rename',
        filename: newFilename
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      alert(data.message)
      setShowRenameDialog(false)
      setSelectedFile(null)
      setNewFilename('')
      fetchSpace()
    } else {
      alert(data.error || 'Failed to rename file')
    }
  } catch (error) {
    alert('Failed to rename file')
  }
}

// Move file
const handleMoveFile = async () => {
  if (!selectedFile) return

  try {
    const res = await fetch(`/api/spaces/${params.id}/files/${selectedFile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'move',
        folderId: targetFolderId
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      alert(data.message)
      setShowMoveDialog(false)
      setSelectedFile(null)
      setTargetFolderId(null)
      fetchSpace()
    } else {
      alert(data.error || 'Failed to move file')
    }
  } catch (error) {
    alert('Failed to move file')
  }
}

// Delete file
const handleDeleteFile = async (fileId: string, filename: string) => {
  if (!confirm(`Move "${filename}" to trash?`)) return

  try {
    const res = await fetch(`/api/spaces/${params.id}/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    const data = await res.json()

    if (res.ok && data.success) {
      alert(data.message)
      fetchSpace()
    } else {
      alert(data.error || 'Failed to delete file')
    }
  } catch (error) {
    alert('Failed to delete file')
  }
}

const handleAddContact = async () => {
  if (!contactEmail.trim()) return;

  setAddingContact(true);

  try {
    const res = await fetch(`/api/spaces/${params.id}/contacts`, {  // ✅ CORRECT ENDPOINT
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: contactEmail.trim(),
        role: contactRole,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to add contact');
    }

    if (data.success) {
      // ✅ Refresh contacts list
      await fetchContacts();
      
      setContactEmail('');
      setContactRole('viewer');
      setShowAddContactDialog(false);
      alert('Contact added successfully!');
    }
  } catch (error: any) {
    console.error('Failed to add contact:', error);
    alert(error.message || 'Failed to add contact');
  } finally {
    setAddingContact(false);
  }
};

const fetchRecentFiles = async () => {
  try {
    const res = await fetch(
      `/api/documents/recent?spaceId=${params.id}&limit=10`,
      {
        credentials: 'include', // ✅ http-only cookies
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    if (data.success) {
      setRecentFiles(data.documents);
    }
  } catch (error) {
    console.error('Failed to fetch recent files:', error);
  }
};

const applySorting = (sortType: 'name' | 'date' | 'size' | 'views') => {
  const sorted = [...documents].sort((a, b) => {
    let comparison = 0
    
    switch (sortType) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        // Assuming lastUpdated can be parsed
        comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        break
      case 'size':
        const sizeA = parseFloat(a.size)
        const sizeB = parseFloat(b.size)
        comparison = sizeA - sizeB
        break
      case 'views':
        comparison = a.views - b.views
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })
  
  setDocuments(sorted)
}

  useEffect(() => {
  fetchSpace();
  fetchCurrentUser();
}, [params.id]);

const fetchCurrentUser = async () => {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
};

const fetchSpace = async () => {
  try {
    const res = await fetch(`/api/spaces/${params.id}`, {
      credentials: 'include', // ✅
    });

    if (res.status === 401) {
      router.push('/login');
      return;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch space');
    }

    const data = await res.json();

    if (data.success) {
      setSpace(data.space);
      await fetchFolders();
      await fetchContacts();

      // Fetch documents
      const docsRes = await fetch(
        `/api/documents?spaceId=${params.id}`,
        {
          credentials: 'include', // ✅
        }
      );

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        console.log('🔍 API Response:', docsData); 
        if (docsData.success) {
          const validDocuments = Array.isArray(docsData.documents) 
  ? docsData.documents.filter((doc: { id: any }) => doc && doc.id)
  : [];
console.log('Fetched documents:', validDocuments);
setDocuments(validDocuments);

          if (data.space.template) {
            initializeFolders(
              data.space.template,
              docsData.documents
            );
          }
        }
      } else {
        // Still initialize folders if docs fail
        if (data.space.template) {
          initializeFolders(
            data.space.template,
            []
          );
        }
      }
    }
  } catch (error) {
    setDocuments([]);
    console.error('Failed to fetch space:', error);
  } finally {
    setLoading(false);
  }
};


// ✅ NEW: Handle share with client
const handleShareWithClient = async () => {
  setSharingStatus('generating')
  setShowShareDialog(true)
  setShareError('')
  
  try {
    const res = await fetch(`/api/spaces/${params.id}/public-access`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requireEmail: true,
        requirePassword: false
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      setShareLink(data.publicUrl)
      setSharingStatus('success')
    } else {
      setShareError(data.error || 'Failed to create share link')
      setSharingStatus('error')
    }
  } catch (error) {
    console.error('Share error:', error)
    setShareError('Failed to create share link. Please try again.')
    setSharingStatus('error')
  }
}

//   NEW: Copy link to clipboard
const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink)
    alert('Link copied to clipboard!')
  } catch (error) {
    console.error('Copy error:', error)
    alert('❌ Failed to copy. Please copy manually.')
  }
}

const initializeFolders = (templateId: string, docs: DocumentType[] = []) => {
  const templateFolders: Record<string, string[]> = {
    'client-portal': ['Company Information', 'Proposals', 'Contracts', 'Invoices', 'Reports'],
    'ma-deal': ['Financial Statements', 'Legal Documents', 'Customer Contracts', 'Employee Information'],
    'fundraising': ['Pitch Deck', 'Financial Projections', 'Cap Table', 'Product Demo'],
    'simple-data-room': ['Documents', 'Financials', 'Legal', 'Presentations'],
    'custom': ['General Documents']
  };

  const folderNames = templateFolders[templateId] || templateFolders['custom'];

  const initialFolders = folderNames.map((name) => {
    const folderId = name.toLowerCase().replace(/\s+/g, '-');
    const docCount = docs.filter(d => d.folderId === folderId).length;

    return {
      id: folderId,
      name,
      documentCount: docCount,
      lastUpdated: docCount > 0 ? 'Today' : 'Never'
    };
  });

  setFolders(initialFolders);
  console.log('✅ Folders initialized:', initialFolders);
};
  // Fetch folders from database
const fetchFolders = async () => {
  try {
    const res = await fetch(`/api/spaces/${params.id}/folders`, {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders);
        console.log('✅ Loaded folders:', data.folders);
      }
    }
  } catch (error) {
    console.error('Failed to fetch folders:', error);
  }
};

  const filteredDocuments = searchQuery.trim() 
  ? searchResults.filter(doc => doc && doc.id)
  : selectedFolder
    ? documents.filter(doc => doc && doc.id && doc.folderId === selectedFolder)
    : documents.filter(doc => doc && doc.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Space not found</h2>
          <Button onClick={() => router.push('/spaces')}>Back to Spaces</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 bg-purple-600/10 backdrop-blur-sm z-50 flex items-center justify-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-2xl border-4 border-dashed border-purple-600 p-12 text-center">
            <Upload className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-slate-900 mb-2">Drop file here</p>
            <p className="text-slate-600">Release to upload to this space</p>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/spaces')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
  <div 
    className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm"
    style={{ background: space.color }}
  >
    <FolderOpen className="h-4 w-4 text-white" />
  </div>
  <h1 className="text-base font-semibold text-slate-900">{space.name}</h1>
</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
<Input
  placeholder="Search documents..."
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value)
    handleSearch(e.target.value)
  }}
  className="pl-10 w-64"
/>
            </div>

            <DropdownMenu open={showOrganizeMenu} onOpenChange={setShowOrganizeMenu}>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Filter className="h-4 w-4" />
      Organize
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <div className="px-2 py-1.5 text-sm font-semibold">Sort by</div>
    <DropdownMenuItem 
      key="sort-name"
      onClick={() => {
        setSortBy('name')
        applySorting('name')
      }}
    >
      <FileText className="mr-2 h-4 w-4" />
      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
    </DropdownMenuItem>
    <DropdownMenuItem 
      key="sort-date"
      onClick={() => {
        setSortBy('date')
        applySorting('date')
      }}
    >
      <Clock className="mr-2 h-4 w-4" />
      Date modified {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
    </DropdownMenuItem>
    <DropdownMenuItem 
      key="sort-size"
      onClick={() => {
        setSortBy('size')
        applySorting('size')
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
    </DropdownMenuItem>
    <DropdownMenuItem 
      key="sort-views"
      onClick={() => {
        setSortBy('views')
        applySorting('views')
      }}
    >
      <Eye className="mr-2 h-4 w-4" />
      Views {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem 
      key="sort-order"
      onClick={() => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        applySorting(sortBy)
      }}
    >
      {sortOrder === 'asc' ? 'Descending' : 'Ascending'} order
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<Button 
  variant="outline" 
  className="gap-2"
  onClick={() => {
    fetchRecentFiles()
    setShowRecentFiles(true)
  }}
>
  <Clock className="h-4 w-4" />
  Recent files
</Button>
<Button 
  variant="outline" 
  className="gap-2"
  onClick={() => setShowMembersDialog(true)} //   NEW
>
  <Users className="h-4 w-4" />
  Members ({contacts.length})
</Button>





            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateFolderDialog(true)}>
    <Folder className="mr-2 h-4 w-4" />
    Create Folder
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setShowAddContactDialog(true)}>
    <Users className="mr-2 h-4 w-4" />
    Add Contact
  </DropdownMenuItem>
               <DropdownMenuItem onClick={handleShareWithClient}>
  <Share2 className="mr-2 h-4 w-4" />
  Share with Client
</DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Space settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete space
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
          
<aside className="w-64 border-r bg-white/50 backdrop-blur overflow-y-auto">
  <div className="p-4 space-y-1">
    {/* Home */}
    <button
      onClick={() => {
        setActiveTab('home')
        setSelectedFolder(null)
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'home' && !selectedFolder
          ? 'bg-purple-50 text-purple-700'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Home className="h-4 w-4" />
      <span>Home</span>
    </button>

    {/* Analytics */}
    <button
      onClick={() => setActiveTab('analytics')}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'analytics'
          ? 'bg-purple-50 text-purple-700'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <BarChart3 className="h-4 w-4" />
      <span>Analytics</span>
    </button>

    {/* Audit Log */}
    <button
      onClick={() => setActiveTab('audit')}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
        activeTab === 'audit'
          ? 'bg-purple-50 text-purple-700'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <FileText className="h-4 w-4" />
      <span>Audit log</span>
    </button>
  </div>

  {/* ✅ NEW: Folders Section */}
  <div className="p-4 border-t">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Folders
      </h3>
      <button
        onClick={() => setShowCreateFolderDialog(true)}
        className="h-6 w-6 rounded-md hover:bg-slate-200 flex items-center justify-center transition-colors"
        title="Create new folder"
      >
        <Plus className="h-4 w-4 text-slate-600" />
      </button>
    </div>
    
    <div className="space-y-1">
      {/* All Folders Button */}
      <button
        onClick={() => {
          setActiveTab('folders')
          setSelectedFolder(null)
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          activeTab === 'folders' && !selectedFolder
            ? 'bg-purple-50 text-purple-700 font-medium'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span>All Folders</span>
        </div>
        {folders.length > 0 && (
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
            {folders.length}
          </span>
        )}
      </button>

      {/* Show first 5 folders as quick access */}
      {folders.slice(0, 5).map((folder) => (
        <button
          key={folder.id}
          onClick={() => {
            setSelectedFolder(folder.id)
            setActiveTab('home')
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedFolder === folder.id
              ? 'bg-purple-50 text-purple-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Folder className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{folder.name}</span>
          </div>
          {folder.documentCount > 0 && (
            <span className="text-xs text-slate-500 flex-shrink-0">
              {folder.documentCount}
            </span>
          )}
        </button>
      ))}

      {/* "View All" if more than 5 folders */}
      {folders.length > 5 && (
        <button
          onClick={() => {
            setActiveTab('folders')
            setSelectedFolder(null)
          }}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm text-purple-600 hover:bg-purple-50 transition-colors font-medium"
        >
          <span>View all {folders.length} folders</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  </div>

  {/* Trash */}
  <div className="p-4 border-t">
    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors">
      <Trash2 className="h-4 w-4" />
      <span>Trash</span>
      <span className="ml-auto text-xs">(0)</span>
    </button>
  </div>
</aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">

             

{activeTab === 'home' && (
  <>
    {/* Breadcrumb */}
    <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
      
      {selectedFolder && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-900">
            {folders.find(f => f.id === selectedFolder)?.name}
          </span>
        </>
      )}
    </div>

    {selectedFolder ? (
      /* ✅ Folder View - Show documents in selected folder */
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {folders.find(f => f.id === selectedFolder)?.name}
          </h2>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Upload className="h-4 w-4 text-white" />
            Upload to Folder
          </Button>
        </div>
        
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase w-12">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Activity</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Last updated</th>
                <th className="text-right px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Folder className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">This folder is empty</p>
                    <p className="text-sm text-slate-500 mt-1">Upload documents to get started</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={`folder-doc-${doc.id}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="font-medium text-slate-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {doc.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {doc.downloads}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
  <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
</td>
<td className="px-6 py-4 text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 bg-white">
      <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setNewFilename(doc.name)
        setShowRenameDialog(true)
      }}>
        <Edit className="mr-2 h-4 w-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setShowMoveDialog(true)
      }}>
        <Activity className="mr-2 h-4 w-4" />
        Move to Folder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="text-red-600"
        onClick={() => handleDeleteFile(doc.id, doc.name)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>
</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      /* ✅ Home View - Recent documents + Quick stats (NO FOLDER GRID!) */
      <div>
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
            </div>
            <p className="text-sm text-slate-600">Total Documents</p>
          </div>
          
          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Folder className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{folders.length}</p>
            </div>
            <p className="text-sm text-slate-600">Folders</p>
          </div>
          
          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {documents.reduce((sum, d) => sum + d.views, 0)}
              </p>
            </div>
            <p className="text-sm text-slate-600">Total Views</p>
          </div>
          
          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {documents.reduce((sum, d) => sum + d.downloads, 0)}
              </p>
            </div>
            <p className="text-sm text-slate-600">Downloads</p>
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Documents</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('folders')}
              className="gap-2"
            >
              <Folder className="h-4 w-4" />
              View All Folders
            </Button>
          </div>
          
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <Upload className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
              <p className="text-slate-600 mb-6">Upload documents to get started</p>
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Folder</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Activity</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Last updated</th>
                    <th className="text-right px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.slice(0, 10).map((doc) => (
                    <tr key={`recent-${doc.id}`} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <span className="font-medium text-slate-900">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.folderId ? (
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <Folder className="h-3 w-3" />
                            {folders.find(f => f.id === doc.folderId)?.name || 'Unknown'}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">No folder</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {doc.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {doc.downloads}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                      <td className=" text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 bg-white">
      <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setNewFilename(doc.name)
        setShowRenameDialog(true)
      }}>
        <Edit className="mr-2 h-4 w-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setShowMoveDialog(true)
      }}>
        <Activity className="mr-2 h-4 w-4" />
        Move to Folder
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="text-red-600"
        onClick={() => handleDeleteFile(doc.id, doc.name)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
  </>
)}

            {activeTab === 'folders' && (
  <div>
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">All Folders</h2>
        <p className="text-sm text-slate-600 mt-1">
          {folders.length} {folders.length === 1 ? 'folder' : 'folders'} in this space
        </p>
      </div>
      <Button
        onClick={() => setShowCreateFolderDialog(true)}
        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Plus className="h-4 w-4" />
        New Folder
      </Button>
    </div>

    {/* Empty State */}
    {folders.length === 0 ? (
      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Folder className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No folders yet</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Create folders to organize your documents and keep everything tidy
        </p>
        <Button
          onClick={() => setShowCreateFolderDialog(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Your First Folder
        </Button>
      </div>
    ) : (
      /*   Professional Table View (Like Dropbox/Google Drive) */
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider w-12">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                Items
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                Last Modified
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {folders.map((folder) => (
              <tr
                key={folder.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedFolder(folder.id)
                  setActiveTab('home')
                }}
              >
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded" />
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Folder className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                        {folder.name}
                      </p>
                      <p className="text-xs text-slate-500">Folder</p>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700 font-medium">
                      {folder.documentCount}
                    </span>
                    <span className="text-sm text-slate-500">
                      {folder.documentCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {folder.lastUpdated}
                  </div>
                </td>
                
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFolder(folder.id)
                        setActiveTab('home')
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Open
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFolder(folder.id)
                            setActiveTab('home')
                          }}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Add rename functionality
                            alert('Rename coming soon!')
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Add share functionality
                            alert('Share coming soon!')
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete "${folder.name}"? This cannot be undone.`)) {
                              // TODO: Add delete functionality
                              alert('Delete coming soon!')
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Folder Stats */}
    {folders.length > 0 && (
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Folder className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{folders.length}</p>
              <p className="text-sm text-slate-600">Total Folders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {folders.reduce((sum, f) => sum + f.documentCount, 0)}
              </p>
              <p className="text-sm text-slate-600">Files in Folders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {folders.filter(f => f.documentCount > 0).length}
              </p>
              <p className="text-sm text-slate-600">Active Folders</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

            {activeTab === 'qa' && (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Q&A Coming Soon</h3>
                <p className="text-slate-600">Ask and answer questions about documents</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-slate-600">Track views, downloads, and engagement</p>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Audit Log Coming Soon</h3>
                <p className="text-slate-600">View all activity and changes in this space</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Recent Files Dialog */}
<Dialog open={showRecentFiles} onOpenChange={setShowRecentFiles}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
    <DialogHeader>
      <DialogTitle>Recent Files</DialogTitle>
      <DialogDescription>
        Recently accessed documents in this space
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-2">
      {recentFiles.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p>No recent files</p>
        </div>
      ) : (
        recentFiles.map((doc) => (
          <div
            key={`recent-${doc.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border"
          >
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{doc.name}</p>
              <p className="text-sm text-slate-500">{doc.lastUpdated}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {doc.views}
              </span>
            </div>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        ))
      )}
    </div>
  </DialogContent>
</Dialog>

{/* Add Contact Dialog */}
<Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <DialogTitle>Add Contact to Space</DialogTitle>
      <DialogDescription>
        Invite someone to access this space
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Email address
        </label>
        <Input
          type="email"
          placeholder="contact@example.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Role
        </label>
        <select
          value={contactRole}
          onChange={(e) => setContactRole(e.target.value as 'viewer' | 'editor' | 'admin')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="viewer">Viewer - Can view documents</option>
          <option value="editor">Editor - Can upload and edit</option>
          <option value="admin">Admin - Full access</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> The contact will receive an email invitation to access this space.
        </p>
      </div>
    </div>

    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        onClick={() => {
          setShowAddContactDialog(false)
          setContactEmail("")
          setContactRole('viewer')
        }}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleAddContact}
        disabled={!contactEmail.trim() || addingContact}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {addingContact ? "Adding..." : "Add Contact"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Create Folder Dialog */}
<Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogDescription>
        Add a new folder to organize your documents in this space
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Folder Name
        </label>
        <Input
          placeholder="e.g., Financial Reports, Contracts..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !creatingFolder && newFolderName.trim()) {
              handleCreateFolder()
            }
          }}
          autoFocus
        />
      </div>
    </div>

    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        onClick={() => {
          setShowCreateFolderDialog(false)
          setNewFolderName("")
        }}
        disabled={creatingFolder}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleCreateFolder}
        disabled={!newFolderName.trim() || creatingFolder}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {creatingFolder ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Creating...
          </>
        ) : (
          "Create Folder"
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>

      {/* Upload Dialog */}
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-xl bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Add documents to {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'this space'}
            </DialogDescription>
          </DialogHeader>

          {uploadStatus === 'idle' && (
            <div className="py-6">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  {isDragging ? 'Drop file here' : 'Drop files here to upload'}
                </p>
                <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                <Button variant="outline">Select Files</Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              {selectedFolder && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                  <p className="text-sm text-slate-600">
                    Files will be uploaded to: <span className="font-semibold text-slate-900">
                      {folders.find(f => f.id === selectedFolder)?.name}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-900 font-semibold">{uploadMessage}</p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-slate-900 font-semibold">{uploadMessage}</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-900 font-semibold">{uploadMessage}</p>
              <Button
                onClick={() => setUploadStatus('idle')}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {uploadStatus === 'idle' && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for "{selectedFile?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Filename</label>
              <Input
                placeholder="Enter new filename"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFilename.trim()) {
                    handleRenameFile()
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false)
                setSelectedFile(null)
                setNewFilename('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameFile}
              disabled={!newFilename.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Move File</DialogTitle>
            <DialogDescription>
              Choose a destination folder for "{selectedFile?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Destination Folder</label>
              <select
                value={targetFolderId || 'root'}
                onChange={(e) => setTargetFolderId(e.target.value === 'root' ? null : e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="root">📁 Root (No folder)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    📂 {folder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowMoveDialog(false)
                setSelectedFile(null)
                setTargetFolderId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveFile}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Move File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Share with Client Dialog */}
<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
  <DialogContent className="max-w-lg bg-white scrollball-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-purple-600" />
        Share Space with Client
      </DialogTitle>
      <DialogDescription>
        Generate a secure link to share this space with clients
      </DialogDescription>
    </DialogHeader>

    {/* Generating State */}
    {sharingStatus === 'generating' && (
      <div className="text-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-900 font-semibold">Generating secure link...</p>
        <p className="text-sm text-slate-500 mt-2">This will only take a moment</p>
      </div>
    )}

    {/* Success State */}
    {sharingStatus === 'success' && (
      <div className="py-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 mb-1">Share link created!</p>
              <p className="text-sm text-green-700">
                Send this link to your client. They can view all documents without logging in.
              </p>
            </div>
          </div>
        </div>

        {/* Link Display */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 block">
            Secure Share Link
          </label>
          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="flex-1 font-mono text-sm bg-slate-50"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              onClick={handleCopyLink}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Globe className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* Settings Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
          <p className="text-sm font-semibold text-slate-900 mb-2">Current Settings:</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Email required before viewing
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              No password protection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Link never expires
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowShareDialog(false)
              setSharingStatus('idle')
              setShareLink('')
            }}
          >
            Done
          </Button>
          <Button
            onClick={() => {
              handleCopyLink()
              // Optional: Open email client
              window.location.href = `mailto:?subject=Documents shared with you&body=View the documents here: ${shareLink}`
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Globe className="h-4 w-4" />
            Copy & Email
          </Button>
        </div>
      </div>
    )}

    {/* Error State */}
    {sharingStatus === 'error' && (
      <div className="py-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Failed to create link</p>
              <p className="text-sm text-red-700">{shareError}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowShareDialog(false)
              setSharingStatus('idle')
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShareWithClient}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
{/* Members Dialog */}
<Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
  <DialogContent className="max-w-2xl bg-white scrollball-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-purple-600" />
        Space Members ({contacts.length})
      </DialogTitle>
      <DialogDescription>
        People who have access to this space
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No contacts added yet</p>
          <Button 
            onClick={() => {
              setShowMembersDialog(false)
              setShowAddContactDialog(true)
            }}
            className="mt-4"
          >
            Add First Contact
          </Button>
        </div>
      ) : (
        <>
          {/* Owner */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user?.email}</p>
                  <p className="text-sm text-slate-600">Space Owner</p>
                </div>
              </div>
              <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Owner
              </span>
            </div>
          </div>

          {/* Contacts */}
          {contacts.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold">
                    {contact.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{contact.email}</p>
                    <p className="text-sm text-slate-600">
                      Added {new Date(contact.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    contact.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    contact.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Change Role</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Remove Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>

    <div className="flex gap-2 justify-end pt-4 border-t">
      <Button variant="outline" onClick={() => setShowMembersDialog(false)}>
        Close
      </Button>
      <Button 
        onClick={() => {
          setShowMembersDialog(false)
          setShowAddContactDialog(true)
        }}
        className="bg-gradient-to-r from-purple-600 to-blue-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}