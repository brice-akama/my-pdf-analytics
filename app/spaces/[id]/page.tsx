"use client"

import { useState, useEffect } from "react"
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
  List as ListIcon
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
}

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'qa' | 'analytics' | 'audit'>('home')
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








const handleSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults([])
    setIsSearching(false)
    return
  }

  setIsSearching(true)
  const token = localStorage.getItem("token")

  try {
    const res = await fetch(`/api/documents/search?spaceId=${params.id}&query=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.documents)
      }
    }
  } catch (error) {
    console.error("Search failed:", error)
  } finally {
    setIsSearching(false)
  }
}

const handleCreateFolder = async () => {
  if (!newFolderName.trim()) return

  setCreatingFolder(true)
  const token = localStorage.getItem("token")

  try {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spaceId: params.id,
        name: newFolderName.trim(),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        // Add the new folder to the state
        setFolders([...folders, {
          id: data.folder.id,
          name: data.folder.name,
          documentCount: 0,
          lastUpdated: 'Just now'
        }])
        setNewFolderName("")
        setShowCreateFolderDialog(false)
        
        // Optional: Show success message
        alert("Folder created successfully!")
      }
    } else {
      const errorData = await res.json()
      alert(errorData.message || "Failed to create folder")
    }
  } catch (error) {
    console.error("Failed to create folder:", error)
    alert("Failed to create folder")
  } finally {
    setCreatingFolder(false)
  }
}

const handleAddContact = async () => {
  if (!contactEmail.trim()) return

  setAddingContact(true)
  const token = localStorage.getItem("token")

  try {
    const res = await fetch('/api/spaces/contacts', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spaceId: params.id,
        email: contactEmail.trim(),
        role: contactRole,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setContactEmail("")
        setContactRole('viewer')
        setShowAddContactDialog(false)
        // You can add a success toast here
        alert("Contact added successfully!")
      }
    } else {
      const data = await res.json()
      alert(data.message || "Failed to add contact")
    }
  } catch (error) {
    console.error("Failed to add contact:", error)
    alert("Failed to add contact")
  } finally {
    setAddingContact(false)
  }
}

const fetchRecentFiles = async () => {
  const token = localStorage.getItem("token")
  
  try {
    const res = await fetch(`/api/documents/recent?spaceId=${params.id}&limit=10`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setRecentFiles(data.documents)
      }
    }
  } catch (error) {
    console.error("Failed to fetch recent files:", error)
  }
}

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
    fetchSpace()
  }, [params.id])

  const fetchSpace = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSpace(data.space)
          
          // Fetch documents from API
          const docsRes = await fetch(`/api/documents?spaceId=${params.id}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          if (docsRes.ok) {
            const docsData = await docsRes.json()
            if (docsData.success) {
              setDocuments(docsData.documents)
              
              // Initialize folders with actual document counts
              if (data.space.template) {
                initializeFolders(data.space.template, docsData.documents)
              }
            }
          } else {
            // If documents fetch fails, still initialize folders with 0 count
            if (data.space.template) {
              initializeFolders(data.space.template, [])
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch space:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeFolders = (templateId: string, docs: DocumentType[]) => {
    // Map of template folders
    const templateFolders: { [key: string]: string[] } = {
      'client-portal': ['Company Information', 'Proposals', 'Contracts', 'Invoices', 'Reports'],
      'ma-deal': ['Financial Statements', 'Legal Documents', 'Customer Contracts', 'Employee Information'],
      'fundraising': ['Pitch Deck', 'Financial Projections', 'Cap Table', 'Product Demo'],
      'simple-data-room': ['Documents', 'Financials', 'Legal', 'Presentations'],
    }

    const folderNames = templateFolders[templateId] || ['Documents']
    const initialFolders = folderNames.map((name) => {
      const folderId = name.toLowerCase().replace(/\s+/g, '-')
      const docCount = docs.filter(d => d.folderId === folderId).length
      
      return {
        id: folderId,
        name,
        documentCount: docCount,
        lastUpdated: '6d ago'
      }
    })

    setFolders(initialFolders)
  }

  const filteredDocuments = searchQuery.trim() 
  ? searchResults
  : selectedFolder
    ? documents.filter(doc => doc.folderId === selectedFolder)
    : documents

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
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: space.color }}
              >
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{space.name}</h1>
                <p className="text-xs text-slate-500">Last updated 6d ago</p>
              </div>
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
  onClick={() => setShowCreateFolderDialog(true)}
>
  <Folder className="h-4 w-4" />
  Create folder
</Button>

<Button 
  variant="outline" 
  className="gap-2"
  onClick={() => setShowAddContactDialog(true)}
>
  <Users className="h-4 w-4" />
  Add contact
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
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share space
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

            <button
              onClick={() => setActiveTab('qa')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'qa'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Q&A</span>
            </button>

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

          {/* Space Content Folders */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Space content</h3>
            </div>
            
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedFolder && activeTab === 'home'
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </div>
              </button>

              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id)
                    setActiveTab('home')
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span>{folder.name}</span>
                  </div>
                  {folder.documentCount > 0 && (
                    <span className="text-xs text-slate-500">{folder.documentCount}</span>
                  )}
                </div>
              ))}

              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                <Trash2 className="h-4 w-4" />
                <span>Trash</span>
                <span className="ml-auto text-xs">(0)</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === 'home' && (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                  <span className="font-medium text-slate-900">Home</span>
                  {selectedFolder && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-medium text-slate-900">
                        {folders.find(f => f.id === selectedFolder)?.name}
                      </span>
                    </>
                  )}
                </div>

                {!selectedFolder ? (
                  <>
                    {/* Folders Grid */}
                    {folders.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-slate-900">Folders</h2>
                        </div>
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => setSelectedFolder(folder.id)}
                              className="bg-white border rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all text-left group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <Folder className="h-6 w-6 text-blue-600" />
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
    <button 
      onClick={(e) => e.stopPropagation()}
      className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Share2 className="mr-2 h-4 w-4" />
                                      Share
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <h3 className="font-semibold text-slate-900 mb-1">{folder.name}</h3>
                              <p className="text-sm text-slate-500">
                                {folder.documentCount} {folder.documentCount === 1 ? 'item' : 'items'}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents Table */}
                    {documents.filter(d => !d.folderId).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
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
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                                <th className="text-right px-6 py-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {documents.filter(d => !d.folderId).map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50">
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
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        0
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600">{doc.type}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" defaultChecked className="sr-only peer" />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                      <span className="ml-2 text-sm font-medium text-slate-700">Yes</span>
                                    </label>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                          <Eye className="mr-2 h-4 w-4" />
                                          View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
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
                      </div>
                    )}

                    {/* Empty State */}
                    {folders.length === 0 && documents.length === 0 && (
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
                    )}
                  </>
                ) : (
                  /* Folder View */
                  <div>
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
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                            <th className="text-right px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50">
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
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    0
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">{doc.type}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                              </td>
                              <td className="px-6 py-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" defaultChecked className="sr-only peer" />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                  <span className="ml-2 text-sm font-medium text-slate-700">Yes</span>
                                </label>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
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
                  </div>
                )}
              </>
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
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
            key={doc.id}
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
  <DialogContent className="max-w-md">
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
  <DialogContent className="max-w-md">
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
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Add documents to {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'this space'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900 mb-2">Drop files here to upload</p>
              <p className="text-sm text-slate-500 mb-4">or click to browse</p>
              <Button variant="outline">Select Files</Button>
            </div>
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

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}