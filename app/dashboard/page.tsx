"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  CreditCard, 
  Building, 
  Users as UsersIcon,
  Book,
  Puzzle,
  Mail,
  Gift,
  CheckCircle,
  Download,
  Plus, Grid ,
  Eye
} from "lucide-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  FileText,
  Upload,
  Search,
  Folder,
  Users,
  FileSignature,
  Inbox,
  UserCircle,
  Settings,
  Bell,
  Share2,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  Trash2,
  ChevronRight,
  BarChart3,
  FileCheck,
  Clock,
  TrendingUp,
  Activity,
  Menu,
   CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X
} from "lucide-react"

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

type DocumentType = {
  _id: string
  filename: string
  size: number
  numPages: number
  createdAt: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

const getInitials = (email: string) => {
  return email.charAt(0).toUpperCase()
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

const getAvatarColor = (email: string) => {
  const colors = [
    'from-purple-500 to-purple-600',
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
  ]
  const index = email.charCodeAt(0) % colors.length
  return colors[index]
}

type PageType = 'dashboard' | 'content-library' | 'spaces' | 'agreements' | 'file-requests' | 'contacts' | 'accounts'
type NotificationType = 'view' | 'download' | 'signature' | 'share' | 'comment' | 'system'

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activePage, setActivePage] = useState<PageType>('content-library')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([])
const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
const [uploadMessage, setUploadMessage] = useState('')
const [isDragging, setIsDragging] = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)
const router = useRouter()
const [showSettingsDialog, setShowSettingsDialog] = useState(false)
const [showBillingDialog, setShowBillingDialog] = useState(false)
const [showTeamDialog, setShowTeamDialog] = useState(false)
const [showResourcesDialog, setShowResourcesDialog] = useState(false)
const [showHelpDialog, setShowHelpDialog] = useState(false)
const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false)
const [showContactDialog, setShowContactDialog] = useState(false)
const [showSwitchCompanyDialog, setShowSwitchCompanyDialog] = useState(false)
const [feedbackText, setFeedbackText] = useState('')
const [notifications, setNotifications] = useState<any[]>([])
const [unreadCount, setUnreadCount] = useState(0)
const [notificationsOpen, setNotificationsOpen] = useState(false)
const [showEarnCreditDialog, setShowEarnCreditDialog] = useState(false)
const [referralEmail, setReferralEmail] = useState('')
const [copiedLink, setCopiedLink] = useState(false)

  const handleSidebarItemClick = (pageId: PageType) => {
    setActivePage(pageId)
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
  }

  const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'view': return <Eye className="h-4 w-4 text-blue-500" />
    case 'download': return <Download className="h-4 w-4 text-green-500" />
    case 'signature': return <FileSignature className="h-4 w-4 text-purple-500" />
    case 'share': return <Share2 className="h-4 w-4 text-orange-500" />
    case 'comment': return <Mail className="h-4 w-4 text-pink-500" />
    default: return <Bell className="h-4 w-4 text-slate-500" />
  }
}

// Fetch notifications
const fetchNotifications = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await fetch("/api/notifications", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
  }
}

// Mark notification as read
const markAsRead = async (notificationId?: string) => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await fetch("/api/notifications/mark-read", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ notificationId })
    })

    if (res.ok) {
      fetchNotifications()
    }
  } catch (error) {
    console.error("Failed to mark as read:", error)
  }
}

// Poll for notifications every 30 seconds
useEffect(() => {
  fetchNotifications()
  const interval = setInterval(fetchNotifications, 30000)
  return () => clearInterval(interval)
}, [])

  const sidebarItems = [
    { id: 'dashboard' as PageType, icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'content-library' as PageType, icon: Folder, label: 'Content library', badge: null },
    { id: 'spaces' as PageType, icon: FolderOpen, label: 'Spaces', badge: 'Data rooms' },
    { id: 'agreements' as PageType, icon: FileSignature, label: 'Agreements', badge: null },
    { id: 'file-requests' as PageType, icon: Inbox, label: 'File requests', badge: null },
    { id: 'contacts' as PageType, icon: Users, label: 'Contacts', badge: null },
    { id: 'accounts' as PageType, icon: UserCircle, label: 'Accounts', badge: null },
  ]

  // Handle logout
const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

// Handle feedback submit
const handleFeedbackSubmit = async () => {
  if (!feedbackText.trim()) {
    alert('Please enter your feedback')
    return
  }

  try {
    const token = localStorage.getItem("token")
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback: feedbackText }),
    })

    if (res.ok) {
      alert('Thank you for your feedback!')
      setFeedbackText('')
      setShowFeedbackDialog(false)
    }
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    alert('Failed to submit feedback. Please try again.')
  }
}

  const quickActions = [
    {
      icon: FileText,
      title: "Share content with secure file sharing",
      description: "Share content",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: BarChart3,
      title: "Track viewer analytics to see who engages with your file",
      description: "View analytics",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: FolderOpen,
      title: "Manage large projects and organize deals in one place",
      description: "Create a data room",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: FileSignature,
      title: "Collect eSignatures on contracts and agreements",
      description: "Request signatures",
      color: "from-pink-500 to-pink-600"
    },
    {
      icon: Clock,
      title: "Safely receive files in one place with file requests",
      description: "Request files",
      color: "from-orange-500 to-orange-600"
    }
  ]

   useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found in localStorage");
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch user:", errorText);
        return;
      }

      const data = await res.json();
      console.log("User data received:", data);

      if (data.success && data.user) {
        // Map the API response to match UserType interface
        setUser({
          email: data.user.email,
          first_name: data.user.profile.firstName,
          last_name: data.user.profile.lastName,
          company_name: data.user.profile.companyName,
          profile_image: data.user.profile.avatarUrl || null,
          plan: data.user.profile.plan || "Free Plan"
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  fetchUser();
}, []);

// Fetch documents
const fetchDocuments = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await fetch("/api/documents", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
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
  // Refresh every 30 seconds to update "time ago"
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
    const token = localStorage.getItem("token")
    const res = await fetch("/api/upload", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await res.json()

    if (res.ok && data.success) {
      setUploadStatus('success')
      setUploadMessage(`Successfully uploaded ${file.name}`)
      // Refresh documents list
      fetchDocuments()
      // Reset after 3 seconds
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

  // Render different content based on active page
  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Total Documents</h3>
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">24</p>
                <p className="text-sm text-slate-500 mt-2">+3 this week</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Total Views</h3>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">1,248</p>
                <p className="text-sm text-slate-500 mt-2">+156 this week</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Engagement Rate</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">68%</p>
                <p className="text-sm text-slate-500 mt-2">+12% this week</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Document {i} was viewed</p>
                      <p className="text-sm text-slate-500">{i} hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'content-library':
        return (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Content library</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Team Folders</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium">My Company Content</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button 
  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
  onClick={() => fileInputRef.current?.click()}
>
  <Upload className="h-4 w-4" />
  Upload
</Button>
<input
  ref={fileInputRef}
  type="file"
  accept="application/pdf"
  onChange={handleFileInputChange}
  className="hidden"
/>
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-slate-900">My Company Content</span>
                  </div>
                  <div className="ml-8 space-y-2">
                    <div
                     onClick={() => setActivePage('content-library')}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <Folder className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-slate-700">My Content</span>
                      <span className="ml-auto text-xs text-slate-500">{documents.length} items</span>
                    </div>
                    <div
                    onClick={() => {
            // Show deleted documents
            alert('Deleted content feature - coming soon!')
          }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <Trash2 className="h-5 w-5 text-slate-400" />
                      <span className="font-medium text-slate-500">Deleted Content</span>
                    </div>
                    <span className="text-xs text-slate-400">0 items</span>
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
            </div>

            <div className="mb-8">
              <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-12 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
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
                  </div>
                  </div>
              </div>
            </div>

            <div>
              {/* Documents List */}
{documents.length > 0 && (
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
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
              <h2 className="text-xl font-semibold text-slate-900 mb-6">5 ways to get the most out of DocMetrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {quickActions.map((action, index) => (
                  <div key={index} className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer group">
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-4">{action.title}</h3>
                    <p className="text-sm text-purple-600 font-medium">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'spaces':
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Spaces (Data Rooms)</h1>
          <p className="text-slate-600">Organize deals and projects in secure data rooms</p>
        </div>
        <Button 
          onClick={() => router.push('/spaces')}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          View All Spaces
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Get started with Spaces</h3>
        <p className="text-slate-600 mb-6">Create secure data rooms for deals, fundraising, and more</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.push('/spaces')}
            variant="outline"
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            Browse Templates
          </Button>
          <Button 
            onClick={() => router.push('/spaces')}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Space
          </Button>
        </div>
      </div>

      {/* Popular Templates Preview */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Popular Templates</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'M&A Deal Room', icon: '🤝', color: 'from-blue-500 to-blue-600' },
            { name: 'Fundraising', icon: '💰', color: 'from-green-500 to-green-600' },
            { name: 'Client Portal', icon: '🎯', color: 'from-cyan-500 to-cyan-600' },
          ].map((template, i) => (
            <div
              key={i}
              onClick={() => router.push('/spaces')}
              className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl mb-3`}>
                {template.icon}
              </div>
              <h3 className="font-semibold text-slate-900">{template.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

      case 'agreements':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Agreements</h1>
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <FileSignature className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No agreements yet</h3>
              <p className="text-slate-600 mb-6">Send documents for eSignature</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Request Signature
              </Button>
            </div>
          </div>
        )

      case 'file-requests':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">File Requests</h1>
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <Inbox className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No file requests yet</h3>
              <p className="text-slate-600 mb-6">Request files from clients or team members</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Create Request
              </Button>
            </div>
          </div>
        )

      case 'contacts':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Contacts</h1>
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No contacts yet</h3>
              <p className="text-slate-600 mb-6">Add contacts to share documents quickly</p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Add Contact
              </Button>
            </div>
          </div>
        )

      case 'accounts':
        return (
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Accounts</h1>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                  <p className="text-slate-600">{user?.email}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-1">Plan</h3>
                  <p className="text-slate-600">{user?.plan}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-1">Company</h3>
                  <p className="text-slate-600">{user?.company_name}</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <defs>
                  <linearGradient id="navLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#navLogoGrad)"/>
                <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">
              DocMetrics
            </span>
          </div>

          {/* Desktop Search Bar - Centered */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search"
                className="w-full pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Search Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-auto"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Button
            onClick={() => router.push('/plan')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4">
              ⬆ Upgrade
            </Button>

            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5 text-slate-600" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-96 p-0" align="end">
    <div className="border-b p-4 flex items-center justify-between">
      <h3 className="font-semibold text-slate-900">Notifications</h3>
      {unreadCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => markAsRead()}
        >
          Mark all as read
        </Button>
      )}
    </div>
    
    <ScrollArea className="h-[400px]">
      {notifications.length > 0 ? (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div 
              key={notification._id}
              className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
              onClick={() => {
                markAsRead(notification._id)
                setNotificationsOpen(false)
                // Navigate to document if applicable
                if (notification.documentId) {
                  router.push(`/documents/${notification.documentId}`)
                }
              }}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No notifications yet</p>
        </div>
      )}
    </ScrollArea>
  </PopoverContent>
</Popover>

            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5 text-slate-600" />
            </Button>

            {/* User Profile with Email */}
            {/* User Profile with Email */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
               <button className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors">
  <div className="text-right hidden lg:block">
    <div className="text-sm font-semibold text-slate-900">{user?.company_name}</div>
    <div className="text-xs text-slate-600">{user?.email}</div>
  </div>
  <div
    className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-lg shadow-md`}
  >
    {user?.profile_image ? (
      <Image
        src={user.profile_image}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    ) : (
      getInitials(user?.email || "")
    )}
  </div>
</button>

              </DropdownMenuTrigger>
<DropdownMenuContent align="end" className="w-72">
  <div className="px-4 py-3 bg-slate-50">
    <div className="font-semibold text-slate-900 text-base">
      {user?.company_name || "My Company"}
    </div>
    <div className="text-sm text-slate-600 mt-0.5">
      Advanced Data Rooms
    </div>
  </div>
  <DropdownMenuSeparator className="my-0" />
  <div className="px-4 py-3 bg-white">
    <div className="font-medium text-slate-900">
      {user?.first_name} {user?.last_name}
    </div>
    <div className="text-sm text-slate-600">{user?.email}</div>
  </div>
  <DropdownMenuSeparator />
  
  <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
    <Settings className="mr-2 h-4 w-4" />
    <span>Settings</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
    <LogOut className="mr-2 h-4 w-4" />
    <span>Log out</span>
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  
  <DropdownMenuItem onClick={() => setShowSwitchCompanyDialog(true)}>
    <Building className="mr-2 h-4 w-4" />
    <span>Switch Company</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowTeamDialog(true)}>
    <UsersIcon className="mr-2 h-4 w-4" />
    <span>Team</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowBillingDialog(true)}>
    <CreditCard className="mr-2 h-4 w-4" />
    <span>Billing</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowResourcesDialog(true)}>
    <Book className="mr-2 h-4 w-4" />
    <span>Resources</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
    <HelpCircle className="mr-2 h-4 w-4" />
    <span>Help</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowFeedbackDialog(true)}>
    <Mail className="mr-2 h-4 w-4" />
    <span>Feedback</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowEarnCreditDialog(true)}>
  <Gift className="mr-2 h-4 w-4" />
  <span>Earn Credit</span>
</DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowIntegrationsDialog(true)}>
    <Puzzle className="mr-2 h-4 w-4" />
    <span>Integrations</span>
  </DropdownMenuItem>
  
  <DropdownMenuItem onClick={() => setShowContactDialog(true)}>
    <Mail className="mr-2 h-4 w-4" />
    <span>Contact Us</span>
  </DropdownMenuItem>
  
  <DropdownMenuSeparator />
  <div className="px-2 py-2">
    <Button
    onClick={() => {
      router.push('/plan')
    }}
    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold">
      ⚡ Upgrade
    </Button>
  </div>
</DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile User Avatar */}
         <div className="md:hidden ml-auto">
  <div
    className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-lg shadow-md`}
  >
    {user?.profile_image ? (
      <Image
        src={user.profile_image}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    ) : (
      getInitials(user?.email || "")
    )}
  </div>
</div>

        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-white">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <defs>
                    <linearGradient id="mobileLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#mobileLogoGrad)"/>
                  <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                  <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                  <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DocMetrics
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Search in Mobile Menu */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search"
                className="w-full pl-10 bg-slate-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${
                  activePage === item.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs text-slate-500">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User Info in Mobile Menu */}
          <div className="border-t p-4">
  <div className="flex items-center gap-3 mb-4">
    <div
      className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-xl`}
    >
      {getInitials(user?.email || "")}
    </div>
    <div>
      <div className="font-semibold text-slate-900">
        {user?.first_name} {user?.last_name}
      </div>
      <div className="text-sm text-slate-600">{user?.email}</div>
    </div>
  </div>


            <Button variant="outline" className="w-full mb-2">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Search Sidebar */}
      <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b p-6">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search documents..."
                className="w-full pl-10 bg-slate-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            {searchQuery ? (
              <div className="text-sm text-slate-600">
                Searching for "{searchQuery}"...
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                Type to search documents, contacts, and more
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Sidebar with clickable links */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-white/800 backdrop-blur">
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarItemClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activePage === item.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs text-slate-500">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="border-t p-4">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
              <Share2 className="h-5 w-5" />
              <span>Shared with me</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      {/* Settings Dialog */}
<Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>Manage your account settings and preferences</DialogDescription>
    </DialogHeader>
    
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input defaultValue={user?.first_name} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input defaultValue={user?.last_name} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input defaultValue={user?.email} type="email" />
        </div>
        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input defaultValue={user?.company_name} />
        </div>
        <Button className="w-full">Save Changes</Button>
      </TabsContent>
      
      <TabsContent value="notifications" className="space-y-4 mt-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-slate-500">Receive email when someone views your document</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Document Reminders</p>
            <p className="text-sm text-slate-500">Get reminders about pending signatures</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Marketing Emails</p>
            <p className="text-sm text-slate-500">Receive updates about new features</p>
          </div>
          <Switch />
        </div>
      </TabsContent>
      
      <TabsContent value="security" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input type="password" placeholder="Enter current password" />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" placeholder="Enter new password" />
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input type="password" placeholder="Confirm new password" />
        </div>
        <Button className="w-full">Update Password</Button>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>

{/* Billing Dialog */}
{/* Billing Dialog - SMART VERSION */}
<Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Billing & Subscription</DialogTitle>
      <DialogDescription>
        {!user?.plan || user?.plan?.toLowerCase() === 'free' 
          ? 'Upgrade to unlock premium features'
          : 'Manage your subscription and billing'
        }
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* FREE PLAN VIEW */}
      {!user?.plan || user?.plan?.toLowerCase() === 'free' ? (
        <>
          {/* Free Plan Status */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
              <FileText className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the Free Plan</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Upgrade to unlock unlimited documents, advanced analytics, team collaboration, and more!
            </p>
            
            {/* Feature Preview */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-3">What you're missing:</p>
              <div className="grid md:grid-cols-2 gap-3 text-left">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-slate-600">Unlimited documents</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-slate-600">Advanced analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-slate-600">Team collaboration</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-slate-600">Custom branding</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setShowBillingDialog(false)
                router.push('/plan')
              }}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto px-8"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Compare Plans
            </Button>
          </div>

          {/* Current Usage */}
          <div className="bg-white rounded-lg border p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Current Usage</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Documents</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
                  <p className="text-sm text-slate-500">/ 5</p>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${(documents.length / 5) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">eSignatures</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">/ 4</p>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 mb-1">Team Members</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-slate-900">1</p>
                  <p className="text-sm text-slate-500">/ 1</p>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PAID PLAN VIEW */
        <>
          {/* Active Subscription */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">{user.plan} Plan</h3>
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Billed monthly • Next billing: <span className="font-semibold">Jan 15, 2025</span>
                </p>
              </div>
              <Button 
                onClick={() => {
                  setShowBillingDialog(false)
                  router.push('/plan')
                }}
                variant="outline"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Compare Plans
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-purple-200">
              <div>
                <p className="text-xs text-slate-600 mb-1">Monthly Cost</p>
                <p className="text-3xl font-bold text-slate-900">$45</p>
                <p className="text-xs text-slate-500 mt-1">per user</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Documents</p>
                <p className="text-3xl font-bold text-slate-900">{documents.length}</p>
                <p className="text-xs text-green-600 mt-1">Unlimited</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Storage Used</p>
                <p className="text-3xl font-bold text-slate-900">2.4 GB</p>
                <p className="text-xs text-slate-500 mt-1">of unlimited</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Payment Method</h4>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Visa ending in 4242</p>
                <p className="text-sm text-slate-500">Expires 12/2025</p>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Billing History</h4>
              <Button variant="ghost" size="sm" className="text-purple-600">View All</Button>
            </div>
            <div className="space-y-2">
              {[
                { date: 'Dec 15, 2024', amount: '$45.00', status: 'Paid', invoice: 'INV-001' },
                { date: 'Nov 15, 2024', amount: '$45.00', status: 'Paid', invoice: 'INV-002' },
                { date: 'Oct 15, 2024', amount: '$45.00', status: 'Paid', invoice: 'INV-003' },
              ].map((invoice, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{invoice.invoice}</p>
                      <p className="text-xs text-slate-500">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{invoice.amount}</span>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Subscription */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Settings className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 mb-1">Need to make changes?</p>
                <p className="text-xs text-slate-600 mb-3">Update your payment method, cancel subscription, or change your plan.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Cancel Subscription</Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowBillingDialog(false)
                      router.push('/plan')
                    }}
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Close Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setShowBillingDialog(false)}
        >
          Close
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
{/* Team Dialog */}
<Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Team Members</DialogTitle>
      <DialogDescription>Invite and manage team members</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Invite Section */}
      <div className="flex gap-2">
        <Input placeholder="Enter email address" type="email" />
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          Invite
        </Button>
      </div>

      {/* Team Members List */}
      <div className="border rounded-lg divide-y">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {getInitials(user?.email || "")}
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">Owner</span>
        </div>
      </div>

      {/* Upgrade prompt for more team members */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">Need more team members?</p>
        <p className="text-sm text-blue-800 mb-3">Upgrade to Pro to add unlimited team members</p>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Upgrade Now</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Resources Dialog */}
<Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle>Resources</DialogTitle>
      <DialogDescription>Helpful guides and documentation</DialogDescription>
    </DialogHeader>
    
    <div className="grid md:grid-cols-2 gap-4 bg-white">
      <a href="https://docs.docmetrics.com" target="_blank" rel="noopener noreferrer" 
         className="border rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer">
        <Book className="h-8 w-8 text-purple-600 mb-3" />
        <h4 className="font-semibold text-slate-900 mb-2">Documentation</h4>
        <p className="text-sm text-slate-600">Complete guides and API reference</p>
      </a>
      
      <a href="https://help.docmetrics.com" target="_blank" rel="noopener noreferrer"
         className="border rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer">
        <HelpCircle className="h-8 w-8 text-blue-600 mb-3" />
        <h4 className="font-semibold text-slate-900 mb-2">Help Center</h4>
        <p className="text-sm text-slate-600">FAQs and troubleshooting</p>
      </a>
      
      <a href="https://blog.docmetrics.com" target="_blank" rel="noopener noreferrer"
         className="border rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer">
        <FileText className="h-8 w-8 text-green-600 mb-3" />
        <h4 className="font-semibold text-slate-900 mb-2">Blog</h4>
        <p className="text-sm text-slate-600">Tips, updates, and best practices</p>
      </a>
      
      <a href="https://www.youtube.com/@docmetrics" target="_blank" rel="noopener noreferrer"
         className="border rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer">
        <Activity className="h-8 w-8 text-red-600 mb-3" />
        <h4 className="font-semibold text-slate-900 mb-2">Video Tutorials</h4>
        <p className="text-sm text-slate-600">Step-by-step video guides</p>
      </a>
    </div>
  </DialogContent>
</Dialog>

{/* Help Dialog */}
<Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>Help & Support</DialogTitle>
      <DialogDescription>Get help with DocMetrics</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <h4 className="font-semibold text-slate-900 mb-2">📚 Browse Help Articles</h4>
        <p className="text-sm text-slate-600">Find answers in our knowledge base</p>
      </div>
      
      <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <h4 className="font-semibold text-slate-900 mb-2">💬 Live Chat Support</h4>
        <p className="text-sm text-slate-600">Chat with our support team (Mon-Fri, 9am-5pm EST)</p>
      </div>
      
      <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <h4 className="font-semibold text-slate-900 mb-2">📧 Email Support</h4>
        <p className="text-sm text-slate-600">support@docmetrics.com</p>
      </div>
      
      <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <h4 className="font-semibold text-slate-900 mb-2">🎥 Schedule a Demo</h4>
        <p className="text-sm text-slate-600">Book a personalized walkthrough</p>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Feedback Dialog */}
<Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>Send Feedback</DialogTitle>
      <DialogDescription>Help us improve DocMetrics</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Your Feedback</Label>
        <Textarea 
          placeholder="Tell us what you think, report bugs, or suggest new features..."
          rows={6}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleFeedbackSubmit}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Integrations Dialog */}
<Dialog  open={showIntegrationsDialog} onOpenChange={setShowIntegrationsDialog}>
  <DialogContent className="max-w-3xl bg-whie">
    <DialogHeader>
      <DialogTitle >Integrations</DialogTitle>
      <DialogDescription>Connect DocMetrics with your favorite tools</DialogDescription>
    </DialogHeader>
    
    <div className="grid md:grid-cols-2 gap-4 bg-white">
      {[
        { name: 'Slack', desc: 'Get notifications in Slack', icon: '💬', connected: false },
        { name: 'Google Drive', desc: 'Import from Google Drive', icon: '📁', connected: false },
        { name: 'Dropbox', desc: 'Sync with Dropbox', icon: '📦', connected: false },
        { name: 'Zapier', desc: 'Automate workflows', icon: '⚡', connected: false },
        { name: 'Salesforce', desc: 'CRM integration', icon: '☁️', connected: false },
        { name: 'HubSpot', desc: 'Marketing automation', icon: '🎯', connected: false },
      ].map((integration) => (
        <div key={integration.name} className="border rounded-lg p-4 flex items-center justify-between hover:border-purple-500 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{integration.icon}</span>
            <div>
              <p className="font-semibold text-slate-900">{integration.name}</p>
              <p className="text-sm text-slate-600">{integration.desc}</p>
            </div>
          </div>
          {integration.connected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Button size="sm" variant="outline">Connect</Button>
          )}
        </div>
      ))}
    </div>
  </DialogContent>
</Dialog>

{/* Contact Us Dialog */}
<Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
  <DialogContent className="max-w-xl bg-white">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-slate-900">Contact Us</DialogTitle>
      <DialogDescription className="text-slate-600 text-base mt-2">
        Get in touch with our team. We'll get back to you within 24 hours.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-5 mt-2">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">Your Name</Label>
        <Input 
          placeholder="John Doe" 
          defaultValue={`${user?.first_name} ${user?.last_name}`}
          className="h-11 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">Email Address</Label>
        <Input 
          type="email" 
          placeholder="you@example.com" 
          defaultValue={user?.email}
          className="h-11 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">Subject</Label>
        <Input 
          placeholder="How can we help?" 
          className="h-11 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">Message</Label>
        <Textarea 
          placeholder="Tell us more about your inquiry..." 
          rows={6}
          className="bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400 resize-none"
        />
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button 
          variant="outline" 
          className="flex-1 h-11 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
          onClick={() => setShowContactDialog(false)}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30"
          onClick={() => {
            alert('Message sent! We\'ll get back to you soon.')
            setShowContactDialog(false)
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
{/* Switch Company Dialog */}
<Dialog open={showSwitchCompanyDialog} onOpenChange={setShowSwitchCompanyDialog}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Switch Company</DialogTitle>
      <DialogDescription>Select a company to switch to</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-2">
      <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {user?.company_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{user?.company_name}</p>
            <p className="text-sm text-slate-600">Current company</p>
          </div>
          <CheckCircle className="h-5 w-5 text-purple-600" />
        </div>
      </div>
      
      <div className="border rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer">
        <p className="text-sm text-slate-600">+ Create New Company</p>
      </div>
    </div>
  </DialogContent>
</Dialog>
{/* Earn Credit Dialog */}
<Dialog open={showEarnCreditDialog} onOpenChange={setShowEarnCreditDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle className="text-xl font-bold text-center text-slate-900">
        Get $15* towards any plan for every friend you invite to DocMetrics!
      </DialogTitle>
      <DialogDescription className="text-center text-slate-600 mt-2 text-sm">
        For every friend who signs up for DocMetrics, we'll give you both $15* towards any DocMetrics plan when they get their first visit!
      </DialogDescription>
      <p className="text-center text-xs text-slate-500 mt-1">
        *For non-USD currencies, you will receive credit equivalent to 1 month of DocSend Personal.
      </p>
    </DialogHeader>
    
    <div className="space-y-4 mt-4">
      {/* Invite by Email Section */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input 
            type="email"
            placeholder="add emails (comma separated)"
            className="flex-1 h-10 text-sm"
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
          />
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-10 font-semibold text-sm"
            onClick={() => {
              if (referralEmail) {
                alert(`Invitations sent to: ${referralEmail}`)
                setReferralEmail('')
              }
            }}
          >
            INVITE
          </Button>
        </div>
        
        {/* Referral Link */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <code className="text-xs text-blue-600 font-mono">
              docmetrics.com/invite/{user?.email?.split('@')[0] || 'user'}
            </code>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8"
              onClick={() => {
                navigator.clipboard.writeText(`docmetrics.com/invite/${user?.email?.split('@')[0] || 'user'}`)
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 2000)
              }}
            >
              {copiedLink ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <span className="text-blue-600 font-medium text-sm">Copy</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-slate-500">OR</span>
        </div>
      </div>

      {/* Social Share Section */}
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-slate-900 text-base">
          Share with your friends on social media
        </h3>
        <p className="text-xs text-slate-500">
          (we'll let you preview the post before it goes out)
        </p>
        
        <div className="flex justify-center gap-3 pt-1">
          <Button 
            className="bg-[#1877F2] hover:bg-[#1565D8] text-white px-6 h-10 font-semibold gap-2 text-sm"
            onClick={() => window.open('https://facebook.com/sharer/sharer.php?u=docmetrics.com', '_blank')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Share
          </Button>
          
          <Button 
            className="bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white px-6 h-10 font-semibold gap-2 text-sm"
            onClick={() => window.open('https://twitter.com/intent/tweet?text=Check out DocMetrics!&url=docmetrics.com', '_blank')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Tweet
          </Button>
          
          <Button 
            className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 h-10 font-semibold gap-2 text-sm"
            onClick={() => window.open('https://www.linkedin.com/sharing/share-offsite/?url=docmetrics.com', '_blank')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Share
          </Button>
        </div>
      </div>

      {/* Check Referrals Link */}
      <div className="text-center pt-2 border-t border-slate-200">
        <Button 
          variant="link" 
          className="text-blue-600 hover:text-blue-700 font-medium text-sm h-8"
          onClick={() => {
            setShowEarnCreditDialog(false)
            alert('Referral tracking feature - coming soon!')
          }}
        >
          Check out the status of your referrals here
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}