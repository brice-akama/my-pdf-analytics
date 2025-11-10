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
  MoreVertical,  
  Send,
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
  sharedAt?: string
  sharedBy?: {
    name: string
    email: string
    avatar: string | null
  }
  permissions?: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
    canShare: boolean
  }
}

type FolderType = {
  _id: string
  name: string
  description: string
  itemCount: number
  createdAt: string
  sharedAt?: string
  sharedBy?: {
    name: string
    email: string
    avatar: string | null
  }
  permissions?: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
    canShare: boolean
  }
  color: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'
type TemplateFieldType = 'text' | 'number' | 'date' | 'email' | 'textarea' | 'select' | 'checkbox' | 'signature' | 'table' | 'image'


type TemplateField = {
  id: string
  label: string
  type: TemplateFieldType
  required: boolean
  placeholder?: string
  defaultValue?: string
  options?: string[] // for select fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

type Template = {
  _id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  popular: boolean
  fields: TemplateField[]
  htmlTemplate: string // HTML structure for PDF generation
  cssTemplate?: string // Custom styling
  createdBy?: string
  isPublic: boolean
  downloads: number
  rating: number
  previewImage?: string
  createdAt: string
  updatedAt: string
}

type GeneratedDocument = {
  _id: string
  templateId: string
  templateName: string
  data: Record<string, any>
  pdfUrl: string
  createdAt: string
}


type AgreementType = {
  _id: string
  title: string
  type: string
  signedCount: number
  totalSigners: number
  status: string
  createdAt: string
  expiresAt: string | null
}

type FileRequestType = {
  _id: string
  title: string
  description: string
  filesReceived: number
  totalFiles: number
  status: string
  dueDate: string
  createdAt: string
}

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

type PageType = 'dashboard' | 'content-library' | 'spaces' | 'agreements' |  'templates' |'file-requests' | 'contacts' | 'accounts'
type NotificationType = 'view' | 'download' | 'signature' | 'share' | 'comment' | 'system'

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  

  
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
const [agreements, setAgreements] = useState<AgreementType[]>([])
const [fileRequests, setFileRequests] = useState<FileRequestType[]>([])
const [showUploadAgreementDialog, setShowUploadAgreementDialog] = useState(false)
const [showCreateFileRequestDialog, setShowCreateFileRequestDialog] = useState(false)
const [showShareDialog, setShowShareDialog] = useState(false)
const [selectedDocumentToShare, setSelectedDocumentToShare] = useState<string | null>(null)
const [shareEmails, setShareEmails] = useState('')
const [shareMessage, setShareMessage] = useState('')
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [loading, setLoading] = useState(true);
const [sharedFolders, setSharedFolders] = useState<FolderType[]>([])
const [sharePermissions, setSharePermissions] = useState({
  canView: true,
  canDownload: true,
  canEdit: false,
  canShare: false
})

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

useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);




// Handle document sharing
const handleShareDocument = async () => {
  if (!selectedDocumentToShare || !shareEmails.trim()) {
    alert('Please enter at least one email address')
    return
  }

  const emails = shareEmails
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0)

  if (emails.length === 0) {
    alert('Please enter valid email addresses')
    return
  }

  try {
    const token = localStorage.getItem("token")
    const res = await fetch(`/api/documents/${selectedDocumentToShare}/share-with-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails,
        permissions: sharePermissions,
        message: shareMessage.trim() || undefined
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      alert(`Document shared successfully with ${data.sharedWith.length} user(s)!`)
      setShowShareDialog(false)
      setShareEmails('')
      setShareMessage('')
      setSelectedDocumentToShare(null)
      setSharePermissions({
        canView: true,
        canDownload: true,
        canEdit: false,
        canShare: false
      })
    } else {
      alert(data.error || 'Failed to share document')
    }
  } catch (error) {
    console.error('Share error:', error)
    alert('Failed to share document. Please try again.')
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

useEffect(() => {
  fetchDocuments()
  fetchAgreements()
  fetchFileRequests()
  const interval = setInterval(() => {
    fetchDocuments()
    fetchAgreements()
    fetchFileRequests()
  }, 30000)
  return () => clearInterval(interval)
}, [])



// Agreements Section Component
const AgreementsSection = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agreements</h1>
          <p className="text-slate-600">Manage NDAs and signature requests</p>
        </div>
        <Button 
          onClick={() => setShowUploadAgreementDialog(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Upload Agreement
        </Button>
      </div>

      {agreements.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
            <FileSignature className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Need to protect sensitive content?</h3>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            Set up a legally-binding agreement that viewers must sign before accessing your content. 
            You can upload an NDA or any other gating document.
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => setShowUploadAgreementDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Upload Agreement
            </Button>
            <Button variant="outline">Use Template</Button>
            <Button variant="outline">Download Template</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map((agreement) => (
            <div key={agreement._id} className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileSignature className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{agreement.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {agreement.signedCount}/{agreement.totalSigners} signed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(agreement.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



// File Requests Section Component
const FileRequestsSection = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">File Requests</h1>
          <p className="text-slate-600">Collect files from anyone securely</p>
        </div>
        <Button 
          onClick={() => setShowCreateFileRequestDialog(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Request
        </Button>
      </div>

      {fileRequests.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Inbox className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Need to receive files from someone?</h3>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            Request files from anyone — whether they have a DocMetrics account or not.
          </p>
          <Button 
            onClick={() => setShowCreateFileRequestDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Create File Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {fileRequests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Inbox className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{request.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{request.filesReceived}/{request.totalFiles} files received</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due {formatTimeAgo(request.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Templates Section Component
// Templates Section Component with BEAUTIFUL REALISTIC PREVIEWS
const TemplatesSection = () => {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid, count: 33 },
    { id: 'invoices', name: 'Invoices', icon: FileText, count: 2 },
    { id: 'contracts', name: 'Contracts', icon: FileSignature, count: 2 },
    { id: 'proposals', name: 'Proposals', icon: FileCheck, count: 1 },

  ]

  // BEAUTIFUL TEMPLATES WITH REALISTIC PREVIEW DESIGNS
  const templates = [
  {
    id: 'sales-invoice-001',
    name: 'Sales Invoice',
    description: 'Professional invoice for products and services',
    category: 'invoices',
    popular: true,
    fields: ['Invoice #', 'Date', 'Items', 'Subtotal', 'Tax', 'Total'],
    // COMPLETE DETAILED PREVIEW
    previewComponent: (
      <div className="w-full h-full bg-white p-8 text-[10px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header with Logo and Company Info */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-800">
          <div>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-2">
              PD
            </div>
            <div className="text-sm font-bold text-slate-900">PandaDoc</div>
            <div className="text-[8px] text-slate-600 mt-1">
              <div>123 Business Street</div>
              <div>San Francisco, CA 94105</div>
              <div>contact@pandadoc.com</div>
              <div>+1 (555) 123-4567</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-800 mb-2">SALES INVOICE</div>
            <div className="bg-slate-100 px-3 py-2 rounded mt-2">
              <div className="text-[8px] text-slate-600">Invoice No:</div>
              <div className="text-sm font-bold text-slate-900">[Invoice No]</div>
            </div>
            <div className="mt-2 text-[8px] text-slate-600">
              <div><strong>Payment terms:</strong> [Invoice Terms]</div>
              <div><strong>Due date:</strong> [Invoice Due Date]</div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-800 mb-2 border-l-4 border-indigo-600 pl-2">Bill to:</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="font-bold text-slate-900">[Client.FirstName] [Client.LastName]</div>
            <div className="text-[8px] text-slate-600 mt-1">
              <div>[Client.StreetAddress] [Client.City] [Client.State]</div>
              <div>[Client.PostalCode]</div>
              <div className="mt-1">[Client.Email]</div>
              <div>[Client.Phone]</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left p-2 font-semibold">DESCRIPTION</th>
                <th className="text-center p-2 font-semibold w-16">QTY</th>
                <th className="text-right p-2 font-semibold w-20">RATE</th>
                <th className="text-right p-2 font-semibold w-24">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">
                  <div className="font-semibold">Product/Service Name</div>
                  <div className="text-[7px] text-slate-500 mt-1">Detailed description of the product or service provided</div>
                </td>
                <td className="p-2 text-center text-slate-900">1</td>
                <td className="p-2 text-right text-slate-900">$0.00</td>
                <td className="p-2 text-right font-bold text-slate-900">$0.00</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">
                  <div className="font-semibold">Product/Service Name</div>
                  <div className="text-[7px] text-slate-500 mt-1">Detailed description of the product or service provided</div>
                </td>
                <td className="p-2 text-center text-slate-900">1</td>
                <td className="p-2 text-right text-slate-900">$0.00</td>
                <td className="p-2 text-right font-bold text-slate-900">$0.00</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">
                  <div className="font-semibold">Product/Service Name</div>
                  <div className="text-[7px] text-slate-500 mt-1">Detailed description of the product or service provided</div>
                </td>
                <td className="p-2 text-center text-slate-900">1</td>
                <td className="p-2 text-right text-slate-900">$0.00</td>
                <td className="p-2 text-right font-bold text-slate-900">$0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-slate-200 text-[8px]">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-bold text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 text-[8px]">
              <span className="text-slate-600">Tax (0%):</span>
              <span className="font-bold text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between py-3 bg-slate-800 text-white px-4 rounded-lg mt-2">
              <span className="font-bold">TOTAL:</span>
              <span className="text-lg font-bold">$0.00</span>
            </div>
          </div>
        </div>

        {/* Terms and Signature */}
        <div className="border-t-2 border-slate-200 pt-4 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] font-bold text-slate-800 mb-2">Payment Terms & Conditions:</div>
            <div className="text-[7px] text-slate-600 leading-relaxed">
              I, the undersigned <span className="bg-yellow-100 px-1">[Client.FirstName] [Client.LastName]</span>, do hereby confirm that this invoice relates to a commercial transaction and this document contains a fair, complete and accurate description of the transaction and the relevant goods and/or services provided as well as a true and realistic description of their value.
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-[7px] text-slate-600 mb-1">Authorized Signature:</div>
              <div className="border-2 border-slate-300 rounded-lg px-8 py-4 bg-slate-50">
                <div className="text-indigo-600 text-sm">✍️ Signature</div>
              </div>
              <div className="text-[7px] text-slate-600 mt-2">MM / DD / YYYY</div>
            </div>
            <div className="text-[7px] text-slate-500 text-right">
              <div>Thank you for your business!</div>
              <div className="mt-1 font-semibold">Questions? Contact us at contact@pandadoc.com</div>
            </div>
          </div>
        </div>
      </div>
    ),
    htmlTemplate: `<!-- Full HTML -->`
  },

  {
    id: 'service-agreement-001',
    name: 'Service Agreement',
    description: 'Professional service contract template',
    category: 'contracts',
    popular: true,
    fields: ['Party Names', 'Services', 'Terms', 'Duration', 'Payment'],
    previewComponent: (
      <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Georgia, serif' }}>
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-4 border-double border-slate-800">
          <div className="text-4xl font-bold text-slate-900 mb-2">SERVICE AGREEMENT</div>
          <div className="text-[8px] text-slate-600">Contract Number: [Contract.Number]</div>
          <div className="text-[8px] text-slate-600">Effective Date: [Effective.Date]</div>
        </div>

        {/* Agreement Statement */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border-l-4 border-purple-600">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            This Service Agreement ("Agreement") is entered into as of <span className="font-bold bg-yellow-100 px-1">[Effective Date]</span> by and between:
          </div>
        </div>

        {/* Parties Section */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-4 border-l-4 border-purple-600 pl-3">PARTIES TO THIS AGREEMENT</div>
          
          {/* Service Provider */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">SP</div>
              <div className="text-sm font-bold text-purple-800">SERVICE PROVIDER</div>
            </div>
            <div className="text-[8px] space-y-1">
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Company Name:</span>
                <span className="font-bold text-slate-900">[Provider.Company]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Address:</span>
                <span className="text-slate-700">[Provider.Address]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Email:</span>
                <span className="text-slate-700">[Provider.Email]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Phone:</span>
                <span className="text-slate-700">[Provider.Phone]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Representative:</span>
                <span className="text-slate-700">[Provider.Representative]</span>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">CL</div>
              <div className="text-sm font-bold text-blue-800">CLIENT</div>
            </div>
            <div className="text-[8px] space-y-1">
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Company Name:</span>
                <span className="font-bold text-slate-900">[Client.Company]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Address:</span>
                <span className="text-slate-700">[Client.Address]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Email:</span>
                <span className="text-slate-700">[Client.Email]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Phone:</span>
                <span className="text-slate-700">[Client.Phone]</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-600 font-semibold">Representative:</span>
                <span className="text-slate-700">[Client.Representative]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scope of Services */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">1. SCOPE OF SERVICES</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              The Service Provider agrees to provide the following services to the Client:
            </div>
            <ul className="mt-2 space-y-2 text-[8px] text-slate-700">
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>[Service Description 1] - Detailed description of the specific service to be provided, including deliverables, timelines, and quality standards.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>[Service Description 2] - Comprehensive outline of service parameters, expected outcomes, and performance metrics.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>[Service Description 3] - Complete specification of service requirements, documentation, and support provisions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Term and Termination */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">2. TERM AND TERMINATION</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
              <div>
                <strong>2.1 Duration:</strong> This Agreement shall commence on <span className="bg-yellow-100 px-1 font-semibold">[Start Date]</span> and shall continue until <span className="bg-yellow-100 px-1 font-semibold">[End Date]</span>, unless terminated earlier as provided herein.
              </div>
              <div>
                <strong>2.2 Renewal:</strong> This Agreement may be renewed for additional terms upon mutual written consent of both parties at least thirty (30) days prior to the expiration date.
              </div>
              <div>
                <strong>2.3 Termination for Convenience:</strong> Either party may terminate this Agreement for any reason upon thirty (30) days written notice to the other party.
              </div>
              <div>
                <strong>2.4 Termination for Cause:</strong> Either party may terminate this Agreement immediately upon written notice if the other party breaches any material term and fails to cure such breach within fifteen (15) days of receiving written notice.
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">3. PAYMENT TERMS</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
              <div>
                <strong>3.1 Fees:</strong> The Client agrees to pay the Service Provider the following fees: <span className="bg-yellow-100 px-1 font-bold">[Payment Amount]</span> per <span className="bg-yellow-100 px-1">[Payment Period]</span>.
              </div>
              <div>
                <strong>3.2 Payment Schedule:</strong> Invoices will be issued on the first day of each month and are due within fifteen (15) days of the invoice date.
              </div>
              <div>
                <strong>3.3 Late Payments:</strong> Late payments shall accrue interest at a rate of 1.5% per month (18% per annum) or the maximum rate permitted by law, whichever is less.
              </div>
              <div>
                <strong>3.4 Expenses:</strong> The Client shall reimburse the Service Provider for all reasonable and pre-approved expenses incurred in connection with the provision of services.
              </div>
            </div>
          </div>
        </div>

        {/* Confidentiality */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">4. CONFIDENTIALITY</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              Both parties agree to maintain the confidentiality of all proprietary and confidential information disclosed during the term of this Agreement. Confidential information includes, but is not limited to, business plans, financial data, customer lists, trade secrets, and any information marked as confidential. This obligation shall survive termination of this Agreement for a period of three (3) years.
            </div>
          </div>
        </div>

        {/* Warranties and Representations */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">5. WARRANTIES AND REPRESENTATIONS</div>
          <div className="bg-slate-50 p-4 rounded-lg text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div><strong>5.1</strong> The Service Provider warrants that services will be performed in a professional and workmanlike manner.</div>
            <div><strong>5.2</strong> The Service Provider represents that it has the necessary expertise, qualifications, and resources to perform the services.</div>
            <div><strong>5.3</strong> The Client warrants that it has the authority to enter into this Agreement and to grant the rights granted herein.</div>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="mb-6">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">6. LIMITATION OF LIABILITY</div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to this Agreement. The Service Provider's total liability shall not exceed the total amount paid by the Client under this Agreement in the twelve (12) months preceding the claim.
            </div>
          </div>
        </div>

        {/* General Provisions */}
        <div className="mb-8">
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">7. GENERAL PROVISIONS</div>
          <div className="bg-slate-50 p-4 rounded-lg text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div><strong>7.1 Governing Law:</strong> This Agreement shall be governed by the laws of [Jurisdiction].</div>
            <div><strong>7.2 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the parties.</div>
            <div><strong>7.3 Amendments:</strong> Any amendments must be made in writing and signed by both parties.</div>
            <div><strong>7.4 Severability:</strong> If any provision is found invalid, the remaining provisions shall continue in full force.</div>
            <div><strong>7.5 Notices:</strong> All notices shall be in writing and delivered to the addresses specified above.</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="border-t-4 border-slate-800 pt-6">
          <div className="text-sm font-bold text-slate-900 mb-4">SIGNATURES</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="border-t-2 border-slate-800 pt-2 mb-3">
                <div className="text-[8px] text-slate-600">Service Provider Signature</div>
              </div>
              <div className="text-[8px] space-y-1">
                <div className="font-bold text-slate-900">[Provider.Company]</div>
                <div className="text-slate-600">By: [Provider.Representative]</div>
                <div className="text-slate-600">Title: [Provider.Title]</div>
                <div className="text-slate-600">Date: _______________</div>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-2 mb-3">
                <div className="text-[8px] text-slate-600">Client Signature</div>
              </div>
              <div className="text-[8px] space-y-1">
                <div className="font-bold text-slate-900">[Client.Company]</div>
                <div className="text-slate-600">By: [Client.Representative]</div>
                <div className="text-slate-600">Title: [Client.Title]</div>
                <div className="text-slate-600">Date: _______________</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
          <div>This is a legally binding document. Please review carefully before signing.</div>
          <div className="mt-1">Page 1 of 2 | Contract #[Contract.Number] | Confidential</div>
        </div>
      </div>
    ),
    htmlTemplate: `<!-- Full HTML -->`
  },

  {
  id: 'payment-receipt-001',
  name: 'Payment Receipt',
  description: 'Professional payment confirmation receipt',
  category: 'invoices',
  popular: true,
  fields: ['Receipt #', 'Date', 'Amount', 'Payment Method', 'Transaction ID'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Success Icon */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="text-5xl text-white">✓</div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-2">PAYMENT RECEIPT</div>
        <div className="text-[8px] text-slate-600">Thank you for your payment!</div>
        <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-[8px] font-semibold mt-2">
          PAID IN FULL
        </div>
      </div>

      {/* Receipt Details Box */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-[7px] text-slate-600 font-semibold mb-1">RECEIPT NUMBER</div>
            <div className="text-lg font-bold text-slate-900">[Receipt.Number]</div>
          </div>
          <div className="text-right">
            <div className="text-[7px] text-slate-600 font-semibold mb-1">DATE ISSUED</div>
            <div className="text-lg font-bold text-slate-900">[Receipt.Date]</div>
          </div>
        </div>
        
        <div className="border-t-2 border-dashed border-slate-300 pt-4">
          <div className="text-[8px] text-slate-600 font-semibold mb-2">RECEIVED FROM:</div>
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <div className="font-bold text-slate-900 mb-1">[Payer.FullName]</div>
            <div className="text-[8px] text-slate-600">[Payer.Email]</div>
            <div className="text-[8px] text-slate-600">[Payer.Phone]</div>
            <div className="text-[8px] text-slate-600 mt-1">[Payer.Address]</div>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 mb-6 text-center text-white shadow-lg">
        <div className="text-[10px] opacity-90 font-semibold mb-2">AMOUNT PAID</div>
        <div className="text-5xl font-bold mb-2">${"[Amount.Paid]"}</div>
        <div className="text-[8px] opacity-80">USD - United States Dollar</div>
      </div>

      {/* Payment Details */}
      <div className="bg-slate-50 rounded-lg p-5 mb-6 border border-slate-200">
        <div className="text-[8px] font-bold text-slate-900 mb-3">PAYMENT DETAILS</div>
        <div className="space-y-2 text-[8px]">
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-slate-600">Payment Method:</span>
            <span className="font-semibold text-slate-900">[Payment.Method]</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-slate-600">Transaction ID:</span>
            <span className="font-mono font-semibold text-slate-900">[Transaction.ID]</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-slate-600">Reference Number:</span>
            <span className="font-mono font-semibold text-slate-900">[Reference.Number]</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600">Payment For:</span>
            <span className="font-semibold text-slate-900">[Payment.Purpose]</span>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="text-center bg-white border-2 border-slate-200 rounded-lg p-5">
        <div className="font-bold text-slate-900 mb-2">[Company.Name]</div>
        <div className="text-[8px] text-slate-600 space-y-1">
          <div>[Company.Address]</div>
          <div>[Company.City], [Company.State] [Company.Zip]</div>
          <div className="mt-2">[Company.Email] | [Company.Phone]</div>
          <div>[Company.Website]</div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <strong>Tax ID:</strong> [Company.TaxID]
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">This is an official payment receipt</div>
        <div>Please keep this receipt for your records</div>
        <div className="mt-2">Questions? Contact us at [Company.Email]</div>
        <div className="mt-2">Generated on [Generated.DateTime]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'business-proposal-001',
  name: 'Business Proposal',
  description: 'Comprehensive project proposal template',
  category: 'proposals',
  popular: false,
  fields: ['Project Name', 'Client', 'Budget', 'Timeline', 'Deliverables'],
  previewComponent: (
    <div className="w-full h-full bg-white text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Cover Page */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-12 text-center min-h-[50%] flex flex-col justify-center">
        <div className="text-5xl font-bold mb-4">PROJECT PROPOSAL</div>
        <div className="w-24 h-1 bg-white mx-auto mb-6 opacity-80"></div>
        <div className="text-2xl font-semibold mb-3">[Project.Name]</div>
        <div className="text-[10px] opacity-90 mb-8">
          <div>Prepared for: [Client.Company]</div>
          <div>Prepared by: [Provider.Company]</div>
        </div>
        <div className="text-[8px] opacity-80">
          <div>Date: [Proposal.Date]</div>
          <div>Valid Until: [Valid.Until]</div>
          <div>Proposal #: [Proposal.Number]</div>
        </div>
      </div>

      {/* Content Pages */}
      <div className="p-8">
        {/* Executive Summary */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">EXECUTIVE SUMMARY</div>
          <div className="text-[8px] text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-lg">
            <p className="mb-3">
              We are pleased to present this comprehensive proposal for <strong>[Project.Name]</strong>. This document outlines our understanding of your requirements, our proposed approach, deliverables, timeline, and investment details.
            </p>
            <p className="mb-3">
              Our team brings extensive experience in [Industry/Domain], and we are confident in our ability to deliver exceptional results that exceed your expectations and drive measurable business outcomes.
            </p>
            <p>
              [Executive.Summary.Details] - Additional context about the project opportunity, strategic alignment, and value proposition.
            </p>
          </div>
        </div>

        {/* Project Understanding */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">PROJECT UNDERSTANDING</div>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-5 rounded-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
              <div>
                <strong className="text-blue-800">Current Situation:</strong> [Current.Situation.Description]
              </div>
              <div>
                <strong className="text-blue-800">Objectives:</strong> [Project.Objectives]
              </div>
              <div>
                <strong className="text-blue-800">Expected Outcomes:</strong> [Expected.Outcomes]
              </div>
              <div>
                <strong className="text-blue-800">Success Criteria:</strong> [Success.Criteria]
              </div>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">SCOPE OF WORK</div>
          <div className="space-y-4">
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">[Phase.1.Title]</div>
                  <div className="text-[8px] text-slate-600 leading-relaxed">[Phase.1.Description]</div>
                  <div className="mt-2 text-[7px] text-blue-700">
                    <strong>Duration:</strong> [Phase.1.Duration] | <strong>Deliverables:</strong> [Phase.1.Deliverables]
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">[Phase.2.Title]</div>
                  <div className="text-[8px] text-slate-600 leading-relaxed">[Phase.2.Description]</div>
                  <div className="mt-2 text-[7px] text-blue-700">
                    <strong>Duration:</strong> [Phase.2.Duration] | <strong>Deliverables:</strong> [Phase.2.Deliverables]
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 mb-1">[Phase.3.Title]</div>
                  <div className="text-[8px] text-slate-600 leading-relaxed">[Phase.3.Description]</div>
                  <div className="mt-2 text-[7px] text-blue-700">
                    <strong>Duration:</strong> [Phase.3.Duration] | <strong>Deliverables:</strong> [Phase.3.Deliverables]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">PROJECT TIMELINE</div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[7px] text-blue-600 font-semibold mb-2">PROJECT START</div>
                <div className="text-xl font-bold text-slate-900">[Start.Date]</div>
              </div>
              <div className="border-x border-blue-200">
                <div className="text-[7px] text-blue-600 font-semibold mb-2">DURATION</div>
                <div className="text-xl font-bold text-slate-900">[Project.Duration]</div>
              </div>
              <div>
                <div className="text-[7px] text-blue-600 font-semibold mb-2">COMPLETION</div>
                <div className="text-xl font-bold text-slate-900">[End.Date]</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 text-[8px] text-slate-700">
              <strong>Key Milestones:</strong> [Milestone.1] • [Milestone.2] • [Milestone.3] • [Milestone.4]
            </div>
          </div>
        </div>

        {/* Investment */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">INVESTMENT</div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-8 text-white text-center shadow-xl">
            <div className="text-[10px] opacity-90 font-semibold mb-3">TOTAL PROJECT INVESTMENT</div>
            <div className="text-6xl font-bold mb-4">${"[Total.Investment]"}</div>
            <div className="text-[8px] opacity-80 mb-6">[Payment.Terms.Summary]</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-left">
              <div className="text-[8px] space-y-2">
                <div className="flex justify-between">
                  <span>Phase 1 (Deposit):</span>
                  <span className="font-bold">[Deposit.Amount]</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 2 (Milestone):</span>
                  <span className="font-bold">[Milestone.Payment]</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase 3 (Final):</span>
                  <span className="font-bold">[Final.Payment]</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-blue-700 mb-4 pb-2 border-b-4 border-blue-700">WHY CHOOSE US</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl mb-2">✓</div>
              <div className="font-bold text-slate-900 mb-1 text-[8px]">Proven Track Record</div>
              <div className="text-[7px] text-slate-600">[Track.Record.Details]</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl mb-2">✓</div>
              <div className="font-bold text-slate-900 mb-1 text-[8px]">Expert Team</div>
              <div className="text-[7px] text-slate-600">[Team.Expertise.Details]</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl mb-2">✓</div>
              <div className="font-bold text-slate-900 mb-1 text-[8px]">Quality Assurance</div>
              <div className="text-[7px] text-slate-600">[Quality.Assurance.Details]</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl mb-2">✓</div>
              <div className="font-bold text-slate-900 mb-1 text-[8px]">Ongoing Support</div>
              <div className="text-[7px] text-slate-600">[Support.Details]</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
          <div className="text-2xl font-bold text-green-700 mb-3">READY TO GET STARTED?</div>
          <div className="text-[8px] text-slate-700 mb-5 max-w-2xl mx-auto leading-relaxed">
            We're excited to partner with you on this project. To proceed, please review and sign this proposal. Upon acceptance, we'll schedule a kickoff meeting and begin work immediately.
          </div>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold">
            Contact: [Provider.Email] | [Provider.Phone]
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-6 border-t-2 border-slate-300">
          <div className="text-xl font-bold text-slate-900 mb-6">ACCEPTANCE</div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="border-t-2 border-slate-800 pt-3 mb-3">
                <div className="text-[8px] text-slate-600">Proposed By</div>
              </div>
              <div className="text-[8px] space-y-1">
                <div className="font-bold text-slate-900">[Provider.Company]</div>
                <div className="text-slate-600">By: [Provider.Name]</div>
                <div className="text-slate-600">Title: [Provider.Title]</div>
                <div className="text-slate-600">Date: _______________</div>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-3 mb-3">
                <div className="text-[8px] text-slate-600">Accepted By</div>
              </div>
              <div className="text-[8px] space-y-1">
                <div className="font-bold text-slate-900">[Client.Company]</div>
                <div className="text-slate-600">By: _____________________</div>
                <div className="text-slate-600">Title: ___________________</div>
                <div className="text-slate-600">Date: _______________</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-100 p-4 text-center text-[7px] text-slate-600 border-t">
        <div>[Provider.Company] | [Provider.Address]</div>
        <div>[Provider.Email] | [Provider.Phone] | [Provider.Website]</div>
        <div className="mt-2">Proposal #[Proposal.Number] | Confidential | Page 1 of 1</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'freelance-contract-001',
  name: 'Freelance Contract',
  description: 'Independent contractor agreement',
  category: 'contracts',
  popular: true,
  fields: ['Freelancer', 'Client', 'Scope', 'Payment', 'Timeline'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-teal-600">
        <div className="text-4xl font-bold text-teal-700 mb-2">FREELANCE AGREEMENT</div>
        <div className="text-[8px] text-slate-600">Independent Contractor Services Agreement</div>
        <div className="mt-3 inline-block bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-[8px] font-bold">
          CONTRACT ID: [Contract.ID]
        </div>
      </div>

      {/* Agreement Date */}
      <div className="bg-teal-50 border-l-4 border-teal-600 p-4 mb-6 rounded-r-lg">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          This Freelance Agreement ("Agreement") is entered into as of <span className="bg-yellow-100 px-2 font-bold">[Agreement.Date]</span> between:
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-teal-600 pl-3">CONTRACTING PARTIES</div>
        
        {/* Client */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
            <div>
              <div className="text-sm font-bold text-teal-800">CLIENT</div>
              <div className="text-[7px] text-slate-600">(The party receiving services)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Full Name:</div>
              <div className="text-slate-900 font-bold">[Client.FullName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Company:</div>
              <div className="text-slate-900 font-bold">[Client.Company]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Client.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Client.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Address:</div>
              <div className="text-slate-900">[Client.Address]</div>
            </div>
          </div>
        </div>

        {/* Freelancer */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">F</div>
            <div>
              <div className="text-sm font-bold text-cyan-800">FREELANCER</div>
              <div className="text-[7px] text-slate-600">(The independent contractor)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Full Name:</div>
              <div className="text-slate-900 font-bold">[Freelancer.FullName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Business Name:</div>
              <div className="text-slate-900 font-bold">[Freelancer.BusinessName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Freelancer.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Freelancer.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Address:</div>
              <div className="text-slate-900">[Freelancer.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">1. SCOPE OF WORK</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed mb-4">
            The Freelancer agrees to provide the following services ("Services") to the Client:
          </div>
          <div className="bg-white border-l-4 border-teal-500 p-4 rounded-r-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Scope.Of.Work.Detailed.Description]
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">2. DELIVERABLES</div>
        <div className="space-y-2">
          <div className="bg-white border-2 border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">1
                </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-[8px] mb-1">[Deliverable.1.Title]</div>
                <div className="text-[7px] text-slate-600">[Deliverable.1.Description]</div>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">2</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-[8px] mb-1">[Deliverable.2.Title]</div>
                <div className="text-[7px] text-slate-600">[Deliverable.2.Description]</div>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">3</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-[8px] mb-1">[Deliverable.3.Title]</div>
                <div className="text-[7px] text-slate-600">[Deliverable.3.Description]</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">3. PROJECT TIMELINE</div>
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[7px] text-teal-600 font-bold mb-2">START DATE</div>
              <div className="text-xl font-bold text-slate-900">[Start.Date]</div>
            </div>
            <div className="border-x-2 border-teal-200">
              <div className="text-[7px] text-teal-600 font-bold mb-2">DURATION</div>
              <div className="text-xl font-bold text-slate-900">[Duration]</div>
            </div>
            <div>
              <div className="text-[7px] text-teal-600 font-bold mb-2">END DATE</div>
              <div className="text-xl font-bold text-slate-900">[End.Date]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">4. COMPENSATION & PAYMENT</div>
        <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl p-6 text-white text-center mb-4 shadow-xl">
          <div className="text-[10px] opacity-90 font-semibold mb-2">TOTAL PROJECT FEE</div>
          <div className="text-5xl font-bold mb-3">${"[Total.Fee]"}</div>
          <div className="text-[8px] opacity-80">USD - United States Dollar</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] font-bold text-slate-900 mb-3">Payment Schedule:</div>
          <div className="space-y-2 text-[8px] text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>Initial Deposit (Upon Signing):</span>
              <span className="font-bold">[Deposit.Amount] ([Deposit.Percentage]%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>Milestone Payment:</span>
              <span className="font-bold">[Milestone.Amount] ([Milestone.Percentage]%)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Final Payment (Upon Completion):</span>
              <span className="font-bold">[Final.Amount] ([Final.Percentage]%)</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-300 text-[7px] text-slate-600">
            <strong>Payment Terms:</strong> Invoices are due within 15 days of receipt. Late payments will incur a fee of 1.5% per month.
          </div>
        </div>
      </div>

      {/* Independent Contractor Status */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">5. INDEPENDENT CONTRACTOR STATUS</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            The Freelancer is an independent contractor and not an employee, partner, or agent of the Client. The Freelancer shall be responsible for all taxes, insurance, and other obligations related to their independent contractor status.
          </div>
        </div>
      </div>

      {/* Intellectual Property */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">6. INTELLECTUAL PROPERTY RIGHTS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>6.1 Work Product:</strong> All work product, deliverables, and materials created by the Freelancer under this Agreement ("Work Product") shall be considered "work made for hire" under U.S. copyright law.
            </div>
            <div>
              <strong>6.2 Transfer of Rights:</strong> Upon receipt of full payment, all rights, title, and interest in the Work Product shall transfer to the Client, including all intellectual property rights.
            </div>
            <div>
              <strong>6.3 Pre-Existing Materials:</strong> Any pre-existing materials used in the Work Product shall be identified and the Freelancer grants the Client a perpetual, worldwide license to use such materials.
            </div>
          </div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">7. CONFIDENTIALITY</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Both parties agree to maintain the confidentiality of all proprietary and confidential information disclosed during the term of this Agreement. This obligation shall survive termination of this Agreement for a period of three (3) years.
          </div>
        </div>
      </div>

      {/* Termination */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">8. TERMINATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>8.1</strong> Either party may terminate this Agreement with 14 days written notice.</div>
          <div><strong>8.2</strong> In the event of termination, the Client shall pay for all work completed up to the termination date.</div>
          <div><strong>8.3</strong> The Client may terminate immediately for cause if the Freelancer breaches any material term of this Agreement.</div>
        </div>
      </div>

      {/* General Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-teal-600 pl-3">9. GENERAL PROVISIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>9.1 Governing Law:</strong> This Agreement shall be governed by the laws of [Jurisdiction].</div>
          <div><strong>9.2 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the parties.</div>
          <div><strong>9.3 Amendments:</strong> Any amendments must be made in writing and signed by both parties.</div>
          <div><strong>9.4 Severability:</strong> If any provision is found invalid, the remaining provisions shall remain in effect.</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-teal-600 pt-6">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
          <div className="text-[8px] text-yellow-900 leading-relaxed">
            <strong>⚠️ IMPORTANT:</strong> By signing below, both parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions of this Freelance Agreement.
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mb-4">AGREEMENT ACCEPTANCE</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-3 border-teal-600 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">FREELANCER SIGNATURE</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Freelancer.FullName]</div>
              <div className="text-slate-600">Business: [Freelancer.BusinessName]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
          <div>
            <div className="border-t-3 border-teal-600 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">CLIENT SIGNATURE</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Client.FullName]</div>
              <div className="text-slate-600">Company: [Client.Company]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold">This is a legally binding contract. Please review carefully before signing.</div>
        <div className="mt-1">Contract ID: [Contract.ID] | Generated: [Generated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'nda-agreement-001',
  name: 'NDA Agreement',
  description: 'Non-Disclosure Agreement for confidential information',
  category: 'contracts',
  popular: false,
  fields: ['Parties', 'Confidential Info', 'Duration', 'Obligations'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-double border-red-700">
        <div className="text-4xl font-bold text-red-700 mb-3">NON-DISCLOSURE AGREEMENT</div>
        <div className="text-[8px] text-slate-600">Mutual Confidentiality Agreement</div>
        <div className="mt-3 inline-block bg-red-100 text-red-700 px-4 py-2 rounded text-[8px] font-bold">
          🔒 CONFIDENTIAL | NDA #[NDA.Number]
        </div>
      </div>

      {/* Effective Date */}
      <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6 rounded-r-lg">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          This Non-Disclosure Agreement ("Agreement") is effective as of <span className="bg-yellow-100 px-2 font-bold">[Effective.Date]</span> and is entered into by and between:
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-red-600 pl-3">DISCLOSING PARTIES</div>
        
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-bold text-red-800 mb-3">PARTY A (Disclosing Party)</div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold">Name/Company:</div>
              <div className="font-bold text-slate-900">[Party.A.Name]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Representative:</div>
              <div className="font-bold text-slate-900">[Party.A.Representative]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">Address:</div>
              <div className="text-slate-900">[Party.A.Address]</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-5">
          <div className="text-sm font-bold text-slate-800 mb-3">PARTY B (Receiving Party)</div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold">Name/Company:</div>
              <div className="font-bold text-slate-900">[Party.B.Name]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Representative:</div>
              <div className="font-bold text-slate-900">[Party.B.Representative]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">Address:</div>
              <div className="text-slate-900">[Party.B.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Purpose */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">1. PURPOSE</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            The parties wish to explore a business opportunity of mutual interest ("Purpose") and in connection with this Purpose, may disclose certain confidential and proprietary information. This Agreement sets forth the terms under which confidential information will be disclosed and protected.
          </div>
        </div>
      </div>

      {/* Definition of Confidential Information */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">2. DEFINITION OF CONFIDENTIAL INFORMATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>2.1</strong> "Confidential Information" means any information disclosed by either party to the other party, including but not limited to:
            </div>
            <ul className="ml-4 space-y-1">
              <li>• Business plans, strategies, and financial information</li>
              <li>• Technical data, trade secrets, and know-how</li>
              <li>• Customer lists, supplier information, and business contacts</li>
              <li>• Product designs, prototypes, and specifications</li>
              <li>• Marketing plans and promotional strategies</li>
              <li>• Software, source code, and proprietary algorithms</li>
              <li>• Any information marked as "Confidential" or similar designation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Obligations */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">3. OBLIGATIONS OF RECEIVING PARTY</div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>3.1 Confidentiality:</strong> The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third parties without prior written consent.
            </div>
            <div>
              <strong>3.2 Use Restriction:</strong> The Receiving Party shall use the Confidential Information solely for the Purpose and not for any other purpose.
            </div>
            <div>
              <strong>3.3 Protection:</strong> The Receiving Party shall protect the Confidential Information with at least the same degree of care it uses to protect its own confidential information, but in no case less than reasonable care.
            </div>
            <div>
              <strong>3.4 Limited Disclosure:</strong> The Receiving Party may disclose Confidential Information only to employees, consultants, or advisors who have a legitimate need to know and who are bound by confidentiality obligations at least as protective as those in this Agreement.
            </div>
          </div>
        </div>
      </div>

      {/* Exceptions */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">4. EXCEPTIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            The obligations under this Agreement shall not apply to information that:
          </div>
          <ul className="mt-2 ml-4 space-y-1 text-[8px] text-slate-700">
            <li>a) Was known to the Receiving Party prior to disclosure</li>
            <li>b) Is or becomes publicly available through no breach of this Agreement</li>
            <li>c) Is rightfully received from a third party without breach of any confidentiality obligation</li>
            <li>d) Is independently developed by the Receiving Party without use of the Confidential Information</li>
            <li>e) Is required to be disclosed by law or court order (with prior notice to the Disclosing Party)</li>
          </ul>
        </div>
      </div>

      {/* Term */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">5. TERM</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>
              <strong>5.1 Duration:</strong> This Agreement shall remain in effect for a period of <span className="bg-yellow-100 px-1 font-bold">[Duration.Years]</span> years from the Effective Date.
            </div>
            <div>
              <strong>5.2 Survival:</strong> The confidentiality obligations shall survive termination of this Agreement and continue for an additional <span className="bg-yellow-100 px-1 font-bold">[Survival.Years]</span> years.
            </div>
          </div>
        </div>
      </div>

      {/* Return of Information */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">6. RETURN OF INFORMATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Upon request or termination of this Agreement, the Receiving Party shall promptly return or destroy all Confidential Information, including all copies, notes, and derivatives thereof, and certify in writing that it has done so.
          </div>
        </div>
      </div>

      {/* No License */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">7. NO LICENSE</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Nothing in this Agreement grants any license or right to use any patent, copyright, trademark, or other intellectual property right of either party. All intellectual property rights remain with the Disclosing Party.
          </div>
        </div>
      </div>

      {/* Remedies */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">8. REMEDIES</div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            The parties acknowledge that unauthorized disclosure of Confidential Information may cause irreparable harm for which monetary damages may be an inadequate remedy. Therefore, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.
          </div>
        </div>
      </div>

      {/* General Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-red-600 pl-3">9. GENERAL PROVISIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>9.1 Governing Law:</strong> This Agreement shall be governed by the laws of [Jurisdiction].</div>
          <div><strong>9.2 Entire Agreement:</strong> This Agreement constitutes the entire agreement regarding confidentiality.</div>
          <div><strong>9.3 Amendments:</strong> Any amendments must be in writing and signed by both parties.</div>
          <div><strong>9.4 Severability:</strong> If any provision is invalid, the remaining provisions shall remain in effect.</div>
          <div><strong>9.5 Waiver:</strong> Failure to enforce any provision shall not constitute a waiver.</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-double border-red-700 pt-6">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2 text-[8px] text-yellow-900">
            <div className="text-xl">⚠️</div>
            <div className="leading-relaxed">
              <strong>LEGAL NOTICE:</strong> This is a legally binding Non-Disclosure Agreement. By signing below, you acknowledge that you understand and agree to maintain the confidentiality of all information disclosed under this agreement. Breach of this agreement may result in legal action and damages.
            </div>
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mb-6">SIGNATURES</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-3 border-red-700 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">PARTY A</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Party.A.Name]</div>
              <div className="text-slate-600">By: [Party.A.Representative]</div>
              <div className="text-slate-600">Title: [Party.A.Title]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
          <div>
            <div className="border-t-3 border-red-700 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">PARTY B</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Party.B.Name]</div>
              <div className="text-slate-600">By: [Party.B.Representative]</div>
              <div className="text-slate-600">Title: [Party.B.Title]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="text-red-600 font-semibold mb-1">🔒 CONFIDENTIAL DOCUMENT</div>
        <div>NDA #[NDA.Number] | Page 1 of 1</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'social-media-contract-001',
  name: 'Social Media Management Contract',
  description: 'Comprehensive social media services agreement',
  category: 'contracts',
  popular: true,
  fields: ['Client Info', 'Manager Info', 'Platforms', 'Services', 'Payment', 'Term'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-purple-600">
        <div className="text-4xl font-bold text-purple-700 mb-2">SOCIAL MEDIA MANAGEMENT CONTRACT</div>
        <div className="text-[8px] text-slate-600">Professional Social Media Services Agreement</div>
        <div className="mt-3 inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-[8px] font-bold">
          📱 CONTRACT ID: [Contract.ID]
        </div>
      </div>

      {/* Agreement Date */}
      <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-6 rounded-r-lg">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          This Social Media Management Contract ("Agreement") is entered into as of <span className="bg-yellow-100 px-2 font-bold">[Agreement.Date]</span> between:
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-purple-600 pl-3">CONTRACTING PARTIES</div>
        
        {/* Client */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">C</div>
            <div>
              <div className="text-sm font-bold text-purple-800">CLIENT</div>
              <div className="text-[7px] text-slate-600">(The business/brand)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Business Name:</div>
              <div className="text-slate-900 font-bold">[Client.BusinessName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Contact Person:</div>
              <div className="text-slate-900 font-bold">[Client.ContactName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Client.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Client.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Business Address:</div>
              <div className="text-slate-900">[Client.Address]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Website:</div>
              <div className="text-slate-900">[Client.Website]</div>
            </div>
          </div>
        </div>

        {/* Social Media Manager */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-300 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">M</div>
            <div>
              <div className="text-sm font-bold text-pink-800">SOCIAL MEDIA MANAGER</div>
              <div className="text-[7px] text-slate-600">(The service provider)</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Name/Agency:</div>
              <div className="text-slate-900 font-bold">[Manager.Name]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Business Name:</div>
              <div className="text-slate-900 font-bold">[Manager.BusinessName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Manager.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Manager.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Address:</div>
              <div className="text-slate-900">[Manager.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">1. SERVICES OVERVIEW</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed mb-4">
            The Social Media Manager agrees to provide comprehensive social media management services for the Client's brand across designated platforms. Services include content creation, scheduling, community management, analytics, and strategic planning.
          </div>
        </div>
      </div>

      {/* Platforms Covered */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">2. PLATFORMS COVERED</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">📘</div>
            <div className="font-bold text-[8px] text-blue-900">Facebook</div>
            <div className="text-[7px] text-blue-700">[FB.Account.Handle]</div>
          </div>
          <div className="bg-pink-50 border-2 border-pink-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">📸</div>
            <div className="font-bold text-[8px] text-pink-900">Instagram</div>
            <div className="text-[7px] text-pink-700">[IG.Account.Handle]</div>
          </div>
          <div className="bg-sky-50 border-2 border-sky-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🐦</div>
            <div className="font-bold text-[8px] text-sky-900">Twitter/X</div>
            <div className="text-[7px] text-sky-700">[Twitter.Account.Handle]</div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">💼</div>
            <div className="font-bold text-[8px] text-blue-900">LinkedIn</div>
            <div className="text-[7px] text-blue-700">[LinkedIn.Account]</div>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">▶️</div>
            <div className="font-bold text-[8px] text-red-900">YouTube</div>
            <div className="text-[7px] text-red-700">[YouTube.Channel]</div>
          </div>
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🎵</div>
            <div className="font-bold text-[8px] text-purple-900">TikTok</div>
            <div className="text-[7px] text-purple-700">[TikTok.Account]</div>
          </div>
        </div>
      </div>

      {/* Scope of Services */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">3. SCOPE OF SERVICES</div>
        <div className="space-y-3">
          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📝</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">Content Creation & Curation</div>
                <div className="text-[8px] text-slate-600 leading-relaxed">
                  • Creating original graphics, photos, and videos<br/>
                  • Writing engaging captions and copy<br/>
                  • Sourcing and curating relevant third-party content<br/>
                  • Developing content themes and campaigns<br/>
                  • <strong>Posts per month:</strong> [Posts.Per.Month]
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📅</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">Content Scheduling & Publishing</div>
                <div className="text-[8px] text-slate-600 leading-relaxed">
                  • Strategic scheduling using [Scheduling.Tool]<br/>
                  • Optimal timing based on audience analytics<br/>
                  • Cross-platform content adaptation<br/>
                  • Content calendar management and approval process
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">💬</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">Community Management</div>
                <div className="text-[8px] text-slate-600 leading-relaxed">
                  • Responding to comments and messages<br/>
                  • Engaging with followers and relevant accounts<br/>
                  • Monitoring brand mentions and tags<br/>
                  • <strong>Response time:</strong> Within [Response.Time] hours during business days
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">📊</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">Analytics & Reporting</div>
                <div className="text-[8px] text-slate-600 leading-relaxed">
                  • Monthly performance reports with insights<br/>
                  • Tracking key metrics: reach, engagement, growth<br/>
                  • Competitor analysis and benchmarking<br/>
                  • Strategy recommendations based on data
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 mb-1">Strategy & Growth</div>
                <div className="text-[8px] text-slate-600 leading-relaxed">
                  • Quarterly strategy sessions<br/>
                  • Hashtag research and optimization<br/>
                  • Growth campaigns and promotions<br/>
                  • Trend monitoring and implementation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Package */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">4. SERVICE PACKAGE</div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
          <div className="text-center mb-4">
            <div className="inline-block bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-sm">
              [Package.Name] PACKAGE
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-[8px]">
            <div>
              <div className="text-purple-600 font-bold mb-1">Posts/Month</div>
              <div className="text-2xl font-bold text-slate-900">[Posts.Count]</div>
            </div>
            <div className="border-x border-purple-300">
              <div className="text-purple-600 font-bold mb-1">Platforms</div>
              <div className="text-2xl font-bold text-slate-900">[Platform.Count]</div>
            </div>
            <div>
              <div className="text-purple-600 font-bold mb-1">Stories/Week</div>
              <div className="text-2xl font-bold text-slate-900">[Stories.Count]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Responsibilities */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">5. CLIENT RESPONSIBILITIES</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div><strong>5.1</strong> Provide brand guidelines, logos, and approved assets</div>
            <div><strong>5.2</strong> Grant necessary access to all social media accounts</div>
            <div><strong>5.3</strong> Review and approve content within [Approval.Timeframe] hours</div>
            <div><strong>5.4</strong> Provide timely feedback and communication</div>
            <div><strong>5.5</strong> Supply product information, updates, and promotional materials</div>
            <div><strong>5.6</strong> Notify Manager of any sensitive issues or crisis situations</div>
          </div>
        </div>
      </div>

      {/* Content Approval Process */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">6. CONTENT APPROVAL PROCESS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div><strong>6.1</strong> Content calendar submitted by [Calendar.Submission.Day] of each month</div>
            <div><strong>6.2</strong> Client reviews and provides feedback within [Review.Days] business days</div>
            <div><strong>6.3</strong> Manager implements revisions within [Revision.Days] business days</div>
            <div><strong>6.4</strong> Emergency/time-sensitive posts may be published with verbal approval</div>
            <div><strong>6.5</strong> Revisions included: [Revisions.Included] rounds per content calendar</div>
          </div>
        </div>
      </div>

      {/* Contract Term */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">7. CONTRACT TERM</div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[7px] text-purple-600 font-bold mb-2">START DATE</div>
              <div className="text-xl font-bold text-slate-900">[Start.Date]</div>
            </div>
            <div className="border-x-2 border-purple-200">
              <div className="text-[7px] text-purple-600 font-bold mb-2">CONTRACT LENGTH</div>
              <div className="text-xl font-bold text-slate-900">[Contract.Length]</div>
            </div>
            <div>
              <div className="text-[7px] text-purple-600 font-bold mb-2">RENEWAL</div>
              <div className="text-xl font-bold text-slate-900">[Renewal.Type]</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 text-[8px] text-slate-700 text-center">
            <strong>Notice Period for Termination:</strong> [Notice.Period] days written notice required
          </div>
        </div>
      </div>

      {/* Investment & Payment */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">8. INVESTMENT & PAYMENT TERMS</div>
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center mb-4 shadow-xl">
          <div className="text-[10px] opacity-90 font-semibold mb-3">MONTHLY INVESTMENT</div>
          <div className="text-6xl font-bold mb-4">${"[Monthly.Fee]"}</div>
          <div className="text-[8px] opacity-80">Billed monthly on the [Billing.Day] of each month</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] font-bold text-slate-900 mb-3">Payment Details:</div>
          <div className="space-y-2 text-[8px] text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>Payment Method:</span>
              <span className="font-bold">[Payment.Method]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>Payment Due:</span>
              <span className="font-bold">Upon receipt of invoice</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>Late Payment Fee:</span>
              <span className="font-bold">[Late.Fee]% per month</span>
            </div>
            <div className="flex justify-between py-2">
              <span>First Payment (Setup Fee):</span>
              <span className="font-bold">${"[Setup.Fee]"} (one-time)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">9. ADDITIONAL SERVICES (Optional Add-Ons)</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-[8px]">
            <div>
              <div className="font-bold text-slate-900">Paid Advertising Management</div>
              <div className="text-slate-600">Campaign setup, monitoring, and optimization</div>
            </div>
            <div className="font-bold text-purple-600">${"[Ads.Fee]"}/mo</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-[8px]">
            <div>
              <div className="font-bold text-slate-900">Professional Photography</div>
              <div className="text-slate-600">Product and lifestyle shoots</div>
            </div>
            <div className="font-bold text-purple-600">${"[Photo.Fee]"}/session</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-[8px]">
            <div>
              <div className="font-bold text-slate-900">Video Production</div>
              <div className="text-slate-600">Reels, TikToks, and promotional videos</div>
            </div>
            <div className="font-bold text-purple-600">${"[Video.Fee]"}/video</div>
          </div>
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 text-[8px]">
            <div>
              <div className="font-bold text-slate-900">Influencer Collaboration</div>
              <div className="text-slate-600">Finding and coordinating with influencers</div>
            </div>
            <div className="font-bold text-purple-600">${"[Influencer.Fee]"}/campaign</div>
          </div>
        </div>
      </div>

      {/* Intellectual Property */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">10. INTELLECTUAL PROPERTY RIGHTS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>10.1 Client Content:</strong> Client retains all rights to their brand assets, logos, and provided materials.
            </div>
            <div>
              <strong>10.2 Created Content:</strong> Upon full payment, Client owns all content created specifically for their brand (graphics, captions, videos).
            </div>
            <div>
              <strong>10.3 Manager Portfolio:</strong> Manager may use created content in portfolio and case studies unless otherwise specified.
            </div>
            <div>
              <strong>10.4 Third-Party Content:</strong> Manager ensures proper licensing and attribution for stock images and third-party content.
            </div>
          </div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">11. CONFIDENTIALITY</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Both parties agree to maintain confidentiality of proprietary information including but not limited to: business strategies, customer data, unpublished content, analytics, and financial information. This obligation continues for [Confidentiality.Years] years after contract termination.
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">12. PERFORMANCE EXPECTATIONS</div>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div className="bg-white rounded p-3 border border-purple-200">
              <strong>Target Goals (90-day timeline):</strong><br/>
              • Follower Growth: [Growth.Target]%<br/>
              • Engagement Rate: [Engagement.Target]%<br/>
              • Reach Increase: [Reach.Target]%<br/>
              • Website Clicks: [Clicks.Target] per month
            </div>
            <div className="text-[7px] text-slate-600 mt-2">
              <strong>Note:</strong> These are goals, not guarantees. Social media success depends on multiple factors including content quality, industry, competition, and algorithm changes. Manager commits to best practices and continuous optimization.
            </div>
          </div>
        </div>
      </div>

      {/* Termination */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">13. TERMINATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>13.1</strong> Either party may terminate with [Notice.Period] days written notice</div>
          <div><strong>13.2</strong> Upon termination, Client receives all scheduled content and analytics reports</div>
          <div><strong>13.3</strong> Client must pay for all services rendered through termination date</div>
          <div><strong>13.4</strong> Manager will provide account access transition support for [Transition.Days] days</div>
          <div><strong>13.5</strong> Early termination fee: [Early.Termination.Fee] if terminated before [Minimum.Term]</div>
        </div>
      </div>

      {/* Limitation of Liability */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">14. LIMITATION OF LIABILITY</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>Manager is not liable for: platform algorithm changes, account suspension/deletion by social platforms, negative comments/reviews from third parties, or results affected by factors outside Manager's control.</div>
            <div className="mt-3"><strong>Total liability limited to:</strong> Amount paid by Client in the three months prior to claim.</div>
          </div>
        </div>
      </div>

      {/* General Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-purple-600 pl-3">15. GENERAL PROVISIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>15.1 Governing Law:</strong> This Agreement shall be governed by the laws of [Jurisdiction]</div>
          <div><strong>15.2 Entire Agreement:</strong> This document constitutes the entire agreement between parties</div>
          <div><strong>15.3 Amendments:</strong> Changes must be made in writing and signed by both parties</div>
          <div><strong>15.4 Force Majeure:</strong> Neither party liable for delays due to circumstances beyond their control</div>
          <div><strong>15.5 Independent Contractor:</strong> Manager is an independent contractor, not an employee</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-purple-600 pt-6">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
          <div className="text-[8px] text-green-900 leading-relaxed">
            <strong>✓ AGREEMENT ACKNOWLEDGMENT:</strong> By signing below, both parties confirm they have read, understood, and agree to all terms and conditions outlined in this Social Media Management Contract.
          </div>
        </div>

        <div className="text-lg font-bold text-slate-900 mb-6">SIGNATURES</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-3 border-purple-600 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">CLIENT SIGNATURE</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Client.BusinessName]</div>
              <div className="text-slate-600">By: [Client.ContactName]</div>
              <div className="text-slate-600">Title: [Client.Title]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
          <div>
            <div className="border-t-3 border-purple-600 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">MANAGER SIGNATURE</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Manager.Name]</div>
              <div className="text-slate-600">Business: [Manager.BusinessName]</div>
              <div className="text-slate-600">Title: [Manager.Title]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">📱 Social Media Management Contract</div>
        <div>Contract ID: [Contract.ID] | Generated: [Generated.Date]</div>
        <div className="mt-2 text-purple-600">Building Your Brand, Growing Your Presence</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'quotation-001',
  name: 'Quotation/Estimate',
  description: 'Professional price quote for services or products',
  category: 'invoices',
  popular: false,
  fields: ['Quote #', 'Valid Until', 'Items', 'Pricing', 'Terms'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-3 border-orange-600">
        <div>
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white text-3xl font-bold mb-3">
            Q
          </div>
          <div className="text-lg font-bold text-slate-900">[Company.Name]</div>
          <div className="text-[8px] text-slate-600 mt-1 space-y-0.5">
            <div>[Company.Address]</div>
            <div>[Company.City], [Company.State] [Company.Zip]</div>
            <div className="mt-1">[Company.Email]</div>
            <div>[Company.Phone]</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-orange-600 mb-3">QUOTATION</div>
          <div className="bg-orange-100 px-4 py-2 rounded-lg mb-2">
            <div className="text-[7px] text-orange-700 font-semibold">QUOTE NUMBER</div>
            <div className="text-lg font-bold text-slate-900">[Quote.Number]</div>
          </div>
          <div className="text-[8px] text-slate-600 space-y-1">
            <div><strong>Date:</strong> [Quote.Date]</div>
            <div><strong>Valid Until:</strong> <span className="bg-yellow-100 px-2 font-bold">[Valid.Until]</span></div>
          </div>
        </div>
      </div>

      {/* Quote For Section */}
      <div className="mb-6">
        <div className="text-sm font-bold text-orange-600 mb-3 border-l-4 border-orange-500 pl-3">QUOTE FOR:</div>
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5">
          <div className="grid grid-cols-2 gap-4 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Company/Name:</div>
              <div className="font-bold text-slate-900 text-sm">[Client.Name]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Contact Person:</div>
              <div className="font-bold text-slate-900">[Client.Contact]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Client.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Client.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Address:</div>
              <div className="text-slate-900">[Client.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items/Services Table */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3">ITEMS / SERVICES</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <th className="text-left p-3 font-semibold border border-orange-700">#</th>
              <th className="text-left p-3 font-semibold border border-orange-700">DESCRIPTION</th>
              <th className="text-center p-3 font-semibold border border-orange-700 w-16">QTY</th>
              <th className="text-right p-3 font-semibold border border-orange-700 w-24">UNIT PRICE</th>
              <th className="text-right p-3 font-semibold border border-orange-700 w-24">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 hover:bg-orange-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">1</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.1.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.1.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.1.Qty]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.1.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.1.Amount]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-orange-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">2</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.2.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.2.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.2.Qty]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.2.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.2.Amount]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-orange-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">3</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.3.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.3.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.3.Qty]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.3.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.3.Amount]</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-6">
        <div className="w-80">
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Subtotal:</span>
              <span className="font-bold text-slate-900">$[Subtotal]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Discount ([Discount.Percent]%):</span>
              <span className="font-bold text-green-600">-$[Discount.Amount]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Tax ([Tax.Rate]%):</span>
              <span className="font-bold text-slate-900">$[Tax.Amount]</span>
            </div>
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-4 flex justify-between items-center mt-3">
              <span className="text-sm font-bold">TOTAL AMOUNT:</span>
              <span className="text-2xl font-bold">${["total_amount"]}</span>
            </div>
          </div>   
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-orange-500 pl-3">TERMS & CONDITIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <ul className="text-[8px] text-slate-700 space-y-2 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Validity:</strong> This quotation is valid until [Valid.Until]. After this date, prices may be subject to change.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Payment Terms:</strong> 50% deposit required upon acceptance, balance due upon completion.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Delivery Time:</strong> Estimated delivery/completion time is [Delivery.Time] from order confirmation.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Acceptance:</strong> To accept this quotation, please sign and return a copy or reply via email.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600 font-bold">•</span>
              <span><strong>Cancellation:</strong> Cancellations must be made in writing. Deposits are non-refundable.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-orange-500 pl-3">ADDITIONAL NOTES</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            [Additional.Notes] - Any special conditions, warranty information, or additional details about the products/services being quoted.
          </div>
        </div>
      </div>

      {/* Acceptance Section */}
      <div className="border-t-2 border-orange-600 pt-6">
        <div className="text-sm font-bold text-slate-900 mb-4">QUOTATION ACCEPTANCE</div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 mb-4">
            I hereby accept the above quotation and agree to the terms and conditions stated.
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[7px] text-slate-600 mb-2">Client Signature:</div>
              <div className="border-b-2 border-slate-400 pb-1 mb-3 h-8"></div>
              <div className="text-[7px] text-slate-600">Print Name: _______________________</div>
            </div>
            <div>
              <div className="text-[7px] text-slate-600 mb-2">Date:</div>
              <div className="border-b-2 border-slate-400 pb-1 mb-3 h-8"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">Thank you for considering our services!</div>
        <div>Questions? Contact us at [Company.Email] or [Company.Phone]</div>
        <div className="mt-2">Quote #[Quote.Number] | Valid Until [Valid.Until]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'employment-contract-001',
  name: 'Employment Contract',
  description: 'Standard employment agreement template',
  category: 'contracts',
  popular: false,
  fields: ['Employee Info', 'Position', 'Salary', 'Benefits', 'Terms'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-double border-slate-900">
        <div className="text-4xl font-bold text-slate-900 mb-3">EMPLOYMENT CONTRACT</div>
        <div className="text-[8px] text-slate-600">Full-Time Employment Agreement</div>
        <div className="mt-3 inline-block bg-slate-900 text-white px-4 py-2 rounded text-[8px] font-bold">
          CONTRACT #[Contract.Number]
        </div>
      </div>

      {/* Agreement Statement */}
      <div className="bg-slate-50 border-l-4 border-slate-900 p-4 mb-6 rounded-r-lg">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          This Employment Contract ("Agreement") is made effective as of <span className="bg-yellow-100 px-2 font-bold">[Start.Date]</span> by and between:
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4">PARTIES</div>
        
        <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-5 mb-4">
          <div className="text-sm font-bold text-slate-900 mb-3">EMPLOYER</div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold">Company Name:</div>
              <div className="font-bold text-slate-900">[Employer.Company]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Business Type:</div>
              <div className="text-slate-900">[Employer.BusinessType]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">Address:</div>
              <div className="text-slate-900">[Employer.Address]</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
          <div className="text-sm font-bold text-blue-900 mb-3">EMPLOYEE</div>
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold">Full Name:</div>
              <div className="font-bold text-slate-900">[Employee.FullName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Date of Birth:</div>
              <div className="text-slate-900">[Employee.DOB]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Email:</div>
              <div className="text-slate-900">[Employee.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Phone:</div>
              <div className="text-slate-900">[Employee.Phone]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold">Address:</div>
              <div className="text-slate-900">[Employee.Address]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">SSN/ID:</div>
              <div className="text-slate-900">[Employee.SSN]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold">Emergency Contact:</div>
              <div className="text-slate-900">[Employee.EmergencyContact]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">1. POSITION AND DUTIES</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong>1.1 Job Title:</strong> The Employee is hired as <span className="bg-yellow-100 px-2 font-bold">[Job.Title]</span>.
            </div>
            <div>
              <strong>1.2 Department:</strong> [Department.Name]
            </div>
            <div>
              <strong>1.3 Reporting To:</strong> The Employee will report directly to [Supervisor.Name], [Supervisor.Title].
            </div>
            <div>
              <strong>1.4 Job Responsibilities:</strong>
              <ul className="ml-4 mt-2 space-y-1">
                <li>• [Responsibility.1]</li>
                <li>• [Responsibility.2]</li>
                <li>• [Responsibility.3]</li>
                <li>• [Responsibility.4]</li>
                <li>• Other duties as assigned by management</li>
              </ul>
            </div>
            <div>
              <strong>1.5 Work Location:</strong> [Work.Location]
            </div>
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">2. COMPENSATION</div>
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-green-200">
              <span className="font-semibold">Base Salary:</span>
              <span className="text-xl font-bold text-green-700">${"[annual_salary]"}</span>
            </div>  
            <div>
              <strong>2.1 Payment Frequency:</strong> Salary will be paid [Payment.Frequency] (bi-weekly/monthly).
            </div>
            <div>
              <strong>2.2 Payment Method:</strong> Direct deposit to the Employee's designated bank account.
            </div>
            <div>
              <strong>2.3 Overtime:</strong> [Overtime.Policy]
            </div>
            <div>
              <strong>2.4 Salary Review:</strong> Salary will be reviewed annually on [Review.Date] based on performance.
            </div>
            <div>
              <strong>2.5 Bonus/Commission:</strong> [Bonus.Structure]
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">3. BENEFITS</div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div className="font-semibold mb-2">The Employee is entitled to the following benefits:</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">🏥 Health Insurance</div>
                <div className="text-[7px]">[Health.Insurance.Details]</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">🦷 Dental Insurance</div>
                <div className="text-[7px]">[Dental.Insurance.Details]</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">👓 Vision Insurance</div>
                <div className="text-[7px]">[Vision.Insurance.Details]</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">💰 401(k) Plan</div>
                <div className="text-[7px]">[401k.Details]</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">🏖️ Paid Time Off</div>
                <div className="text-[7px]">[PTO.Days] days per year</div>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="font-bold text-blue-900 mb-1">🤒 Sick Leave</div>
                <div className="text-[7px]">[Sick.Days] days per year</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">4. WORK SCHEDULE</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>4.1 Work Hours:</strong> [Work.Hours] hours per week</div>
          <div><strong>4.2 Schedule:</strong> [Work.Schedule] (e.g., Monday-Friday, 9:00 AM - 5:00 PM)</div>
          <div><strong>4.3 Breaks:</strong> [Break.Policy]</div>
          <div><strong>4.4 Remote Work:</strong> [Remote.Work.Policy]</div>
        </div>
      </div>

      {/* Term and Termination */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">5. TERM AND TERMINATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-3">
          <div>
            <strong>5.1 Employment Type:</strong> This is a [Employment.Type] (permanent/contract) position.
          </div>
          <div>
            <strong>5.2 Probation Period:</strong> The first [Probation.Period] days/months shall be a probationary period.
          </div>
          <div>
            <strong>5.3 At-Will Employment:</strong> This is an at-will employment relationship. Either party may terminate this Agreement at any time with [Notice.Period] days written notice.
          </div>
          <div>
            <strong>5.4 Termination for Cause:</strong> The Employer may terminate immediately for misconduct, breach of policy, or poor performance.
          </div>
          <div>
            <strong>5.5 Severance:</strong> [Severance.Terms]
          </div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">6. CONFIDENTIALITY AND NON-COMPETE</div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>6.1</strong> Employee agrees to maintain confidentiality of all proprietary information.</div>
          <div><strong>6.2</strong> Employee shall not compete with the Employer during employment and for [NonCompete.Period] after termination.</div>
          <div><strong>6.3</strong> Employee shall not solicit clients or employees for [NonSolicit.Period] after termination.</div>
        </div>
      </div>

      {/* Other Provisions */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">7. OTHER PROVISIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>7.1 Governing Law:</strong> This Agreement shall be governed by the laws of [Jurisdiction].</div>
          <div><strong>7.2 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the parties.</div>
          <div><strong>7.3 Amendments:</strong> Any changes must be made in writing and signed by both parties.</div>
          <div><strong>7.4 Background Check:</strong> Employment is contingent upon successful background check and drug screening.</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-slate-900 pt-6">
        <div className="text-lg font-bold text-slate-900 mb-6">SIGNATURES</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="border-t-2 border-slate-900 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">EMPLOYER</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Employer.Company]</div>
              <div className="text-slate-600">By: [Employer.Representative]</div>
              <div className="text-slate-600">Title: [Employer.Title]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-slate-900 pt-3 mb-3">
              <div className="text-[8px] text-slate-600 font-semibold">EMPLOYEE</div>
            </div>
            <div className="text-[8px] space-y-2">
              <div className="font-bold text-slate-900">[Employee.FullName]</div>
              <div className="text-slate-600">SSN/ID: [Employee.SSN]</div>
              <div className="mt-3 pt-3 border-t border-slate-300">
                <div className="text-slate-600">Signature: _______________________</div>
              </div>
              <div className="text-slate-600">Date: _______________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>Contract #[Contract.Number] | Page 1 of 1</div>
        <div className="mt-1">This is a legally binding employment contract</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},


{
  id: 'bank-loan-proposal-001',
  name: 'Bank Loan Proposal',
  description: 'Professional business loan application proposal',
  category: 'proposals',
  popular: true,
  fields: ['Business Name', 'Loan Amount', 'Purpose', 'Financial Data', 'Collateral'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-4 border-green-700">
        <div className="text-4xl font-bold text-green-700 mb-3">BUSINESS LOAN PROPOSAL</div>
        <div className="text-[8px] text-slate-600">Formal Application for Business Financing</div>
        <div className="mt-3 inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-[8px] font-bold">
          💼 PROPOSAL ID: [Proposal.ID]
        </div>
      </div>

      {/* Submission Date */}
      <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6 rounded-r-lg">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          <strong>Date of Submission:</strong> <span className="bg-yellow-100 px-2 font-bold">[Submission.Date]</span>
        </div>
      </div>

      {/* Applicant Information */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-green-600 pl-3">APPLICANT INFORMATION</div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 text-[8px]">
            <div className="col-span-2">
              <div className="text-green-700 font-bold mb-2 text-sm">Business Details</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Legal Business Name:</div>
              <div className="text-slate-900 font-bold">[Business.LegalName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Trade Name (DBA):</div>
              <div className="text-slate-900 font-bold">[Business.TradeName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Business Type:</div>
              <div className="text-slate-900">[Business.Type]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Tax ID/EIN:</div>
              <div className="text-slate-900">[Business.TaxID]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Date Established:</div>
              <div className="text-slate-900">[Business.EstablishedDate]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Years in Business:</div>
              <div className="text-slate-900">[Business.YearsInBusiness]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Business Address:</div>
              <div className="text-slate-900">[Business.Address]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Business.Phone]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Business.Email]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Website:</div>
              <div className="text-slate-900">[Business.Website]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Industry:</div>
              <div className="text-slate-900">[Business.Industry]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Number of Employees:</div>
              <div className="text-slate-900">[Business.Employees]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Annual Revenue:</div>
              <div className="text-slate-900 font-bold">${"[Annual.Revenue]"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner/Principal Information */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-green-600 pl-3">OWNER/PRINCIPAL INFORMATION</div>
        
        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-5">
          <div className="grid grid-cols-2 gap-4 text-[8px]">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Full Name:</div>
              <div className="text-slate-900 font-bold">[Owner.FullName]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Title/Position:</div>
              <div className="text-slate-900">[Owner.Title]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Ownership Percentage:</div>
              <div className="text-slate-900">[Owner.Percentage]%</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">SSN/Tax ID:</div>
              <div className="text-slate-900">[Owner.SSN]</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-600 font-semibold mb-1">Home Address:</div>
              <div className="text-slate-900">[Owner.Address]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Phone:</div>
              <div className="text-slate-900">[Owner.Phone]</div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Email:</div>
              <div className="text-slate-900">[Owner.Email]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Request Summary */}
      <div className="mb-8">
        <div className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-green-600 pl-3">LOAN REQUEST SUMMARY</div>
        
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-8 text-white text-center shadow-xl mb-4">
          <div className="text-[10px] opacity-90 font-semibold mb-3">REQUESTED LOAN AMOUNT</div>
          <div className="text-6xl font-bold mb-4">${"[Loan.Amount]"}</div>
          <div className="text-[8px] opacity-80">United States Dollar (USD)</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-[7px] text-green-700 font-bold mb-2">LOAN TYPE</div>
            <div className="font-bold text-slate-900">[Loan.Type]</div>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-[7px] text-green-700 font-bold mb-2">LOAN TERM</div>
            <div className="font-bold text-slate-900">[Loan.Term]</div>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
            <div className="text-[7px] text-green-700 font-bold mb-2">PREFERRED RATE</div>
            <div className="font-bold text-slate-900">[Interest.Rate]%</div>
          </div>
        </div>
      </div>

      {/* Purpose of Loan */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">PURPOSE OF LOAN</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed mb-4">
            <strong>Primary Purpose:</strong> [Loan.Purpose.Primary]
          </div>
          <div className="bg-white border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Loan.Purpose.Detailed.Description]
            </div>
          </div>
        </div>
      </div>

      {/* Use of Funds Breakdown */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">USE OF FUNDS BREAKDOWN</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-2 border-b border-slate-300 bg-white px-3 rounded">
              <span className="font-semibold text-slate-700">[UseOfFunds.Category1]</span>
              <span className="font-bold text-slate-900">${"[UseOfFunds.Amount1]"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300 bg-white px-3 rounded">
              <span className="font-semibold text-slate-700">[UseOfFunds.Category2]</span>
              <span className="font-bold text-slate-900">${"[UseOfFunds.Amount2]"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300 bg-white px-3 rounded">
              <span className="font-semibold text-slate-700">[UseOfFunds.Category3]</span>
              <span className="font-bold text-slate-900">${"[UseOfFunds.Amount3]"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-300 bg-white px-3 rounded">
              <span className="font-semibold text-slate-700">[UseOfFunds.Category4]</span>
              <span className="font-bold text-slate-900">${"[UseOfFunds.Amount4]"}</span>
            </div>
            <div className="flex justify-between py-3 bg-green-100 px-3 rounded font-bold text-green-900">
              <span>TOTAL</span>
              <span>${"[Loan.Amount]"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Overview */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">BUSINESS OVERVIEW</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
            <div>
              <strong className="text-green-700">Company Description:</strong><br/>
              [Business.Description]
            </div>
            <div>
              <strong className="text-green-700">Products/Services:</strong><br/>
              [Business.Products.Services]
            </div>
            <div>
              <strong className="text-green-700">Target Market:</strong><br/>
              [Business.Target.Market]
            </div>
            <div>
              <strong className="text-green-700">Competitive Advantages:</strong><br/>
              [Business.Competitive.Advantages]
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">FINANCIAL INFORMATION</div>
        
        {/* Current Year */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5 mb-4">
          <div className="text-sm font-bold text-green-800 mb-3">Current Year ([Current.Year])</div>
          <div className="grid grid-cols-3 gap-4 text-[8px]">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-slate-600 font-semibold mb-1">Gross Revenue</div>
              <div className="text-lg font-bold text-slate-900">${"[Current.Revenue]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-slate-600 font-semibold mb-1">Operating Expenses</div>
              <div className="text-lg font-bold text-slate-900">${"[Current.Expenses]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-slate-600 font-semibold mb-1">Net Profit</div>
              <div className="text-lg font-bold text-green-700">${"[Current.NetProfit]"}</div>
            </div>
          </div>
        </div>

        {/* Previous Year */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 mb-4">
          <div className="text-sm font-bold text-slate-800 mb-3">Previous Year ([Previous.Year])</div>
          <div className="grid grid-cols-3 gap-4 text-[8px]">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-slate-600 font-semibold mb-1">Gross Revenue</div>
              <div className="text-lg font-bold text-slate-900">${"[Previous.Revenue]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-slate-600 font-semibold mb-1">Operating Expenses</div>
              <div className="text-lg font-bold text-slate-900">${"[Previous.Expenses]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-slate-600 font-semibold mb-1">Net Profit</div>
              <div className="text-lg font-bold text-green-700">${"[Previous.NetProfit]"}</div>
            </div>
          </div>
        </div>

        {/* Balance Sheet Snapshot */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-5">
          <div className="text-sm font-bold text-slate-800 mb-3">Balance Sheet Snapshot</div>
          <div className="grid grid-cols-2 gap-4 text-[8px]">
            <div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-300">
                  <span className="text-slate-600">Total Assets:</span>
                  <span className="font-bold text-slate-900">${"[Total.Assets]"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-300">
                  <span className="text-slate-600">Current Assets:</span>
                  <span className="font-bold text-slate-900">${"[Current.Assets]"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Fixed Assets:</span>
                  <span className="font-bold text-slate-900">${"[Fixed.Assets]"}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-300">
                  <span className="text-slate-600">Total Liabilities:</span>
                  <span className="font-bold text-slate-900">${"[Total.Liabilities]"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-300">
                  <span className="text-slate-600">Current Liabilities:</span>
                  <span className="font-bold text-slate-900">${"[Current.Liabilities]"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Owner's Equity:</span>
                  <span className="font-bold text-green-700">${"[Owners.Equity]"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Debt */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">EXISTING DEBT OBLIGATIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="space-y-2 text-[8px]">
            <div className="bg-white border border-slate-200 rounded p-3">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-900">[Debt.1.Creditor]</span>
                <span className="font-bold text-slate-900">${"[Debt.1.Balance]"}</span>
              </div>
              <div className="flex justify-between text-[7px] text-slate-600">
                <span>Monthly Payment: ${"[Debt.1.Payment]"}</span>
                <span>Rate: [Debt.1.Rate]%</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded p-3">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-900">[Debt.2.Creditor]</span>
                <span className="font-bold text-slate-900">${"[Debt.2.Balance]"}</span>
              </div>
              <div className="flex justify-between text-[7px] text-slate-600">
                <span>Monthly Payment: ${"[Debt.2.Payment]"}</span>
                <span>Rate: [Debt.2.Rate]%</span>
              </div>
            </div>
            <div className="flex justify-between py-3 bg-green-100 px-3 rounded font-bold text-green-900 mt-2">
              <span>TOTAL EXISTING DEBT</span>
              <span>${"[Total.Existing.Debt]"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collateral */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">COLLATERAL OFFERED</div>
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
          <div className="space-y-3 text-[8px]">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-600 font-semibold mb-1">Collateral Type:</div>
                  <div className="text-slate-900 font-bold">[Collateral.1.Type]</div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold mb-1">Estimated Value:</div>
                  <div className="text-green-700 font-bold">${"[Collateral.1.Value]"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-600 font-semibold mb-1">Description:</div>
                  <div className="text-slate-900">[Collateral.1.Description]</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-600 font-semibold mb-1">Collateral Type:</div>
                  <div className="text-slate-900 font-bold">[Collateral.2.Type]</div>
                </div>
                <div>
                  <div className="text-slate-600 font-semibold mb-1">Estimated Value:</div>
                  <div className="text-green-700 font-bold">${"[Collateral.2.Value]"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-600 font-semibold mb-1">Description:</div>
                  <div className="text-slate-900">[Collateral.2.Description]</div>
                </div>
              </div>
            </div>
            <div className="flex justify-between py-3 bg-green-600 text-white px-4 rounded font-bold">
              <span>TOTAL COLLATERAL VALUE</span>
              <span>${"[Total.Collateral.Value]"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Repayment Plan */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">PROPOSED REPAYMENT PLAN</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-[7px] text-slate-600 font-bold mb-1">MONTHLY PAYMENT</div>
              <div className="text-xl font-bold text-green-700">${"[Monthly.Payment]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-[7px] text-slate-600 font-bold mb-1">TOTAL INTEREST</div>
              <div className="text-xl font-bold text-slate-900">${"[Total.Interest]"}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-[7px] text-slate-600 font-bold mb-1">TOTAL REPAYMENT</div>
              <div className="text-xl font-bold text-slate-900">${"[Total.Repayment]"}</div>
            </div>
          </div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <strong>Repayment Source:</strong> [Repayment.Source.Description]
          </div>
        </div>
      </div>

      {/* Financial Projections */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">FINANCIAL PROJECTIONS (Post-Loan)</div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-4 text-[8px] text-center">
            <div>
              <div className="font-bold text-green-700 mb-2">Year 1</div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-slate-600 text-[7px] mb-1">Projected Revenue</div>
                <div className="font-bold text-slate-900">${"[Projection.Year1.Revenue]"}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200 mt-2">
                <div className="text-slate-600 text-[7px] mb-1">Projected Profit</div>
                <div className="font-bold text-green-700">${"[Projection.Year1.Profit]"}</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-green-700 mb-2">Year 2</div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-slate-600 text-[7px] mb-1">Projected Revenue</div>
                <div className="font-bold text-slate-900">${"[Projection.Year2.Revenue]"}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200 mt-2">
                <div className="text-slate-600 text-[7px] mb-1">Projected Profit</div>
                <div className="font-bold text-green-700">${"[Projection.Year2.Profit]"}</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-green-700 mb-2">Year 3</div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-slate-600 text-[7px] mb-1">Projected Revenue</div>
                <div className="font-bold text-slate-900">${"[Projection.Year3.Revenue]"}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200 mt-2">
                <div className="text-slate-600 text-[7px] mb-1">Projected Profit</div>
                <div className="font-bold text-green-700">${"[Projection.Year3.Profit]"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Documents */}
      <div className="mb-6">
        <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">SUPPORTING DOCUMENTS ATTACHED</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Business Tax Returns (Last 3 Years)</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Personal Tax Returns (Last 2 Years)</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Profit & Loss Statements</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Balance Sheets</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Bank Statements (Last 6 Months)</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Business Plan</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Credit Reports (Business & Personal)</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Collateral Documentation</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
              <span className="text-green-600 font-bold">✓</span>
              <span>Business Licenses & Permits</span>
            </div>
             <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
             <span className="text-green-600 font-bold">✓</span>
<span>Accounts Receivable/Payable</span>
</div>
</div>
</div>
</div>
{/* Management Team */}
  <div className="mb-6">
    <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">MANAGEMENT TEAM</div>
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <div className="space-y-3 text-[8px]">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="font-bold text-slate-900 mb-1">[Manager.1.Name] - [Manager.1.Title]</div>
          <div className="text-slate-700 leading-relaxed">[Manager.1.Experience]</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="font-bold text-slate-900 mb-1">[Manager.2.Name] - [Manager.2.Title]</div>
          <div className="text-slate-700 leading-relaxed">[Manager.2.Experience]</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="font-bold text-slate-900 mb-1">[Manager.3.Name] - [Manager.3.Title]</div>
          <div className="text-slate-700 leading-relaxed">[Manager.3.Experience]</div>
        </div>
      </div>
    </div>
  </div>

  {/* References */}
  <div className="mb-6">
    <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">BUSINESS REFERENCES</div>
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <div className="grid grid-cols-2 gap-4 text-[8px]">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="font-bold text-slate-900 mb-2">Reference 1</div>
          <div className="space-y-1 text-slate-700">
            <div><strong>Name:</strong> [Reference.1.Name]</div>
            <div><strong>Company:</strong> [Reference.1.Company]</div>
            <div><strong>Phone:</strong> [Reference.1.Phone]</div>
            <div><strong>Relationship:</strong> [Reference.1.Relationship]</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="font-bold text-slate-900 mb-2">Reference 2</div>
          <div className="space-y-1 text-slate-700">
            <div><strong>Name:</strong> [Reference.2.Name]</div>
            <div><strong>Company:</strong> [Reference.2.Company]</div>
            <div><strong>Phone:</strong> [Reference.2.Phone]</div>
            <div><strong>Relationship:</strong> [Reference.2.Relationship]</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="font-bold text-slate-900 mb-2">Reference 3</div>
          <div className="space-y-1 text-slate-700">
            <div><strong>Name:</strong> [Reference.3.Name]</div>
            <div><strong>Company:</strong> [Reference.3.Company]</div>
            <div><strong>Phone:</strong> [Reference.3.Phone]</div>
            <div><strong>Relationship:</strong> [Reference.3.Relationship]</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="font-bold text-slate-900 mb-2">Banking Reference</div>
          <div className="space-y-1 text-slate-700">
            <div><strong>Bank:</strong> [Bank.Name]</div>
            <div><strong>Branch:</strong> [Bank.Branch]</div>
            <div><strong>Account Type:</strong> [Bank.AccountType]</div>
            <div><strong>Years with Bank:</strong> [Bank.Years]</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Impact Statement */}
  <div className="mb-6">
    <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">IMPACT STATEMENT</div>
    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
      <div className="text-[8px] text-slate-700 leading-relaxed">
        <strong className="text-green-800 text-sm">How This Loan Will Help Our Business:</strong>
        <div className="mt-3 space-y-2">
          <div className="bg-white rounded p-3 border border-green-200">
            [Impact.Statement.Paragraph1]
          </div>
          <div className="bg-white rounded p-3 border border-green-200">
            [Impact.Statement.Paragraph2]
          </div>
          <div className="bg-white rounded p-3 border border-green-200">
            <strong>Expected Outcomes:</strong> [Expected.Outcomes]
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Risk Assessment */}
  <div className="mb-8">
    <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">RISK ASSESSMENT & MITIGATION</div>
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
      <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
        <div>
          <strong className="text-yellow-800">Identified Risks:</strong><br/>
          [Identified.Risks.Description]
        </div>
        <div>
          <strong className="text-yellow-800">Mitigation Strategies:</strong><br/>
          [Mitigation.Strategies.Description]
        </div>
        <div>
          <strong className="text-yellow-800">Contingency Plans:</strong><br/>
          [Contingency.Plans.Description]
        </div>
      </div>
    </div>
  </div>

  {/* Declaration */}
  <div className="mb-8">
    <div className="text-lg font-bold text-slate-900 mb-3 border-l-4 border-green-600 pl-3">DECLARATION</div>
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
      <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
        <p>I/We hereby declare that:</p>
        <ul className="ml-4 space-y-1">
          <li>• All information provided in this loan proposal is true, accurate, and complete to the best of my/our knowledge</li>
          <li>• I/We understand that any false or misleading information may result in denial of the loan application or legal action</li>
          <li>• I/We authorize the bank to verify all information provided and to obtain credit reports as necessary</li>
          <li>• I/We agree to provide any additional documentation or information requested by the bank</li>
          <li>• I/We understand that submission of this proposal does not guarantee loan approval</li>
          <li>• I/We have read and understood all terms and conditions associated with the loan application process</li>
        </ul>
      </div>
    </div>
  </div>

  {/* Signatures */}
  <div className="border-t-4 border-green-700 pt-6">
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
      <div className="text-[8px] text-blue-900 leading-relaxed">
        <strong>📋 APPLICANT CERTIFICATION:</strong> By signing below, I/we certify that all information provided in this loan proposal is accurate and complete. I/We understand that this information will be used to evaluate my/our creditworthiness and ability to repay the requested loan.
      </div>
    </div>

    <div className="text-lg font-bold text-slate-900 mb-6">APPLICANT SIGNATURE(S)</div>
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="border-t-3 border-green-700 pt-3 mb-3">
          <div className="text-[8px] text-slate-600 font-semibold">PRIMARY APPLICANT</div>
        </div>
        <div className="text-[8px] space-y-2">
          <div className="font-bold text-slate-900">[Owner.FullName]</div>
          <div className="text-slate-600">Title: [Owner.Title]</div>
          <div className="text-slate-600">Business: [Business.LegalName]</div>
          <div className="mt-3 pt-3 border-t border-slate-300">
            <div className="text-slate-600">Signature: _______________________</div>
          </div>
          <div className="text-slate-600">Date: _______________________</div>
          <div className="text-slate-600">SSN: [Owner.SSN]</div>
        </div>
      </div>
      <div>
        <div className="border-t-3 border-green-700 pt-3 mb-3">
          <div className="text-[8px] text-slate-600 font-semibold">CO-APPLICANT (If Applicable)</div>
        </div>
        <div className="text-[8px] space-y-2">
          <div className="font-bold text-slate-900">[CoApplicant.FullName]</div>
          <div className="text-slate-600">Title: [CoApplicant.Title]</div>
          <div className="text-slate-600">Ownership: [CoApplicant.Percentage]%</div>
          <div className="mt-3 pt-3 border-t border-slate-300">
            <div className="text-slate-600">Signature: _______________________</div>
          </div>
          <div className="text-slate-600">Date: _______________________</div>
          <div className="text-slate-600">SSN: [CoApplicant.SSN]</div>
        </div>
      </div>
    </div>
  </div>

  {/* Bank Use Only Section */}
  <div className="mt-8 border-t-2 border-slate-300 pt-6">
    <div className="bg-slate-100 border-2 border-slate-400 rounded-lg p-5">
      <div className="text-sm font-bold text-slate-900 mb-4">FOR BANK USE ONLY</div>
      <div className="grid grid-cols-2 gap-4 text-[8px]">
        <div>
          <div className="text-slate-600 mb-1">Application Received By:</div>
          <div className="border-b border-slate-400 pb-1">_________________________</div>
        </div>
        <div>
          <div className="text-slate-600 mb-1">Date Received:</div>
          <div className="border-b border-slate-400 pb-1">_________________________</div>
        </div>
        <div>
          <div className="text-slate-600 mb-1">Loan Officer Assigned:</div>
          <div className="border-b border-slate-400 pb-1">_________________________</div>
        </div>
        <div>
          <div className="text-slate-600 mb-1">Application Number:</div>
          <div className="border-b border-slate-400 pb-1">_________________________</div>
        </div>
        <div className="col-span-2">
          <div className="text-slate-600 mb-1">Initial Comments:</div>
          <div className="border border-slate-400 rounded p-2 h-16 bg-white"></div>
        </div>
      </div>
    </div>
  </div>

  {/* Footer */}
  <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
    <div className="font-semibold mb-1">💼 Business Loan Proposal</div>
    <div>Proposal ID: [Proposal.ID] | Submitted: [Submission.Date]</div>
    <div className="mt-2 text-green-600">Building Success Through Strategic Financing</div>
    <div className="mt-2">Page 1 of 1 | Confidential Document</div>
  </div>
</div>

 ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'business-proposal-001',
  name: 'Elite Business Proposal',
  description: 'Premium business proposal with ROI metrics and phased approach',
  category: 'proposals',
  popular: true,
  fields: ['Client Info', 'Project Details', 'Phases', 'Investment', 'ROI', 'Team'],
  previewComponent: (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-auto">
      {/* Premium Cover Page */}
      <div className="relative min-h-screen flex flex-col justify-between p-16 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white overflow-hidden">
        {/* Elegant Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-3xl font-bold">YC</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-300 tracking-widest uppercase">Your Company</div>
              <div className="text-xs text-slate-400 mt-1">Excellence in Innovation</div>
            </div>
          </div>
        </div>
        {/* Main Title */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-4xl">
          <div className="inline-block mb-6">
            <div className="text-xs font-bold text-indigo-300 tracking-widest uppercase mb-2 flex items-center gap-2">
              <div className="w-12 h-px bg-gradient-to-r from-indigo-400 to-transparent"></div>
              Business Proposal
            </div>
          </div>
          <h1 className="text-7xl font-bold mb-8 leading-tight">
            Strategic Partnership
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Proposal
            </span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mb-12">
            A comprehensive solution designed to transform your business operations, 
            accelerate growth, and deliver measurable results through innovative strategies 
            and proven methodologies.
          </p>
          {/* Key Stats Bar */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                [Project.Duration]
              </div>
              <div className="text-sm text-slate-400 mt-2">Project Timeline</div>
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                [ROI.Target]%
              </div>
              <div className="text-sm text-slate-400 mt-2">Expected ROI</div>
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-300">
                [Team.Size]
              </div>
              <div className="text-sm text-slate-400 mt-2">Expert Team Members</div>
            </div>
          </div>
        </div>
        {/* Footer Info */}
        <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-8">
          <div>
            <div className="text-xs text-slate-400 mb-2">PREPARED FOR</div>
            <div className="text-2xl font-bold">[Client.Company]</div>
            <div className="text-sm text-slate-400 mt-1">[Client.ContactName] • [Client.Title]</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-2">PROPOSAL DATE</div>
            <div className="text-lg font-semibold">[Proposal.Date]</div>
            <div className="text-xs text-slate-400 mt-1">Valid until: [Expiry.Date]</div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="max-w-6xl mx-auto px-16 py-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900">Executive Summary</h2>
        </div>
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="col-span-2 space-y-6 text-slate-700 leading-relaxed">
            <p className="text-lg">
              In today's rapidly evolving business landscape, <span className="font-semibold text-slate-900">[Client.Company]</span> stands 
              at a critical juncture. This proposal outlines a strategic framework designed to address your 
              organization's unique challenges while capitalizing on emerging opportunities in the marketplace.
            </p>
            <p>
              Our comprehensive analysis reveals significant potential for operational optimization, market 
              expansion, and revenue growth. Through a combination of innovative technology solutions, strategic 
              consulting, and hands-on implementation support, we propose a transformation initiative that will 
              position your organization for sustained competitive advantage.
            </p>
            <p>
              This proposal encompasses a <span className="font-semibold">[Project.Duration]</span> engagement, 
              delivering tangible results through a phased approach that minimizes disruption while maximizing value 
              creation. Our proven methodologies have consistently delivered <span className="font-semibold text-indigo-600">[Success.Rate]%</span> success 
              rates across similar engagements.
            </p>
          </div>
          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-100">
            <div className="text-sm font-bold text-indigo-900 mb-6 uppercase tracking-wider">At a Glance</div>
            <div className="space-y-5">
              <div>
                <div className="text-xs text-slate-600 mb-1">Investment Range</div>
                <div className="text-2xl font-bold text-slate-900">[Budget.Range]</div>
              </div>
              <div className="border-t border-indigo-200 pt-5">
                <div className="text-xs text-slate-600 mb-1">Delivery Timeline</div>
                <div className="text-2xl font-bold text-slate-900">[Weeks.Duration] weeks</div>
              </div>
              <div className="border-t border-indigo-200 pt-5">
                <div className="text-xs text-slate-600 mb-1">Key Deliverables</div>
                <div className="text-2xl font-bold text-slate-900">[Deliverables.Count]</div>
              </div>
              <div className="border-t border-indigo-200 pt-5">
                <div className="text-xs text-slate-600 mb-1">Success Guarantee</div>
                <div className="text-lg font-bold text-indigo-600">✓ Performance-based</div>
              </div>
            </div>
          </div>
        </div>
        {/* Value Proposition Highlights */}
        <div className="bg-slate-900 rounded-3xl p-12 text-white">
          <h3 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
            Why Partner With Us?
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <div className="font-bold text-lg mb-2">Proven Track Record</div>
                <div className="text-sm text-slate-400">Over [Years.Experience] years delivering exceptional results for Fortune 500 companies and innovative startups alike.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <div className="font-bold text-lg mb-2">Rapid Implementation</div>
                <div className="text-sm text-slate-400">Our agile methodology ensures quick wins while building towards long-term sustainable transformation.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <div className="font-bold text-lg mb-2">Premium Quality</div>
                <div className="text-sm text-slate-400">White-glove service with dedicated account management and 24/7 support throughout engagement.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <div className="font-bold text-lg mb-2">Measurable Results</div>
                <div className="text-sm text-slate-400">Data-driven approach with clear KPIs, regular reporting, and performance guarantees tied to outcomes.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Situation Analysis */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <div className="w-4 h-4 rounded-full bg-purple-400"></div>
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Current Situation Analysis</h2>
          </div>
          {/* Challenge Cards */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Key Challenges Identified</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">●</span>
                  <span>[Challenge.One] - impacting operational efficiency and customer satisfaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">●</span>
                  <span>[Challenge.Two] - resulting in revenue leakage and competitive disadvantage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">●</span>
                  <span>[Challenge.Three] - creating bottlenecks in scalability and growth potential</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Strategic Opportunities</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">●</span>
                  <span>[Opportunity.One] - potential for [X]% improvement in key metrics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">●</span>
                  <span>[Opportunity.Two] - untapped market segment worth $[Market.Size]M</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">●</span>
                  <span>[Opportunity.Three] - technology leverage for competitive differentiation</span>
                </li>
              </ul>
            </div>
          </div>
          {/* Market Context */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-white">
            <h3 className="text-2xl font-bold mb-6">Market Context & Industry Trends</h3>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-bold mb-2">[Growth.Rate]%</div>
                <div className="text-sm text-indigo-200">Market CAGR</div>
                <div className="text-xs text-indigo-300 mt-2">Industry growth trajectory indicates significant opportunity</div>
              </div>
              <div className="border-l border-white/20 pl-8">
                <div className="text-5xl font-bold mb-2">$[Market.Size]B</div>
                <div className="text-sm text-indigo-200">Total Addressable Market</div>
                <div className="text-xs text-indigo-300 mt-2">Expanding market with room for multiple players</div>
              </div>
              <div className="border-l border-white/20 pl-8">
                <div className="text-5xl font-bold mb-2">[Competition.Level]</div>
                <div className="text-sm text-indigo-200">Competitive Intensity</div>
                <div className="text-xs text-indigo-300 mt-2">Strategic positioning is critical for success</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Solution */}
      <div className="max-w-6xl mx-auto px-16 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900">Our Proposed Solution</h2>
        </div>
        {/* Solution Overview */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 mb-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-6">Integrated Transformation Framework</h3>
            <p className="text-lg text-slate-300 leading-relaxed max-w-4xl">
              Our solution combines cutting-edge technology, strategic consulting, and operational excellence to deliver 
              a comprehensive transformation that addresses your immediate needs while building long-term competitive advantage. 
              This three-phased approach ensures rapid value delivery with minimal business disruption.
            </p>
          </div>
        </div>
        {/* Phase Cards */}
        <div className="space-y-8">
          {/* Phase 1 */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold">01</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Discovery & Strategy</h3>
                  <div className="text-sm text-indigo-100 mt-1">Weeks 1-[Phase1.Duration] • Foundation Phase</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-indigo-100">Investment</div>
                <div className="text-2xl font-bold text-white">[Phase1.Cost]</div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-indigo-600">📋</span> Key Activities
                  </h4>
                  <ul className="space-y-2 text-slate-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">▸</span>
                      <span>Comprehensive business process analysis and documentation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">▸</span>
                      <span>Stakeholder interviews and requirements gathering sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">▸</span>
                      <span>Technology stack audit and infrastructure assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">▸</span>
                      <span>Competitive analysis and market positioning study</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">▸</span>
                      <span>Development of strategic roadmap and success metrics</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-green-600">✓</span> Deliverables
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Strategic Assessment Report</div>
                      <div className="text-xs text-slate-600">Handoff to ongoing support team with SLAs</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Implementation Roadmap</div>
                      <div className="text-xs text-slate-600">Detailed timeline with milestones and dependencies</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Success Metrics Framework</div>
                      <div className="text-xs text-slate-600">KPI dashboard and measurement methodology</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold">02</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Implementation & Development</h3>
                  <div className="text-sm text-purple-100 mt-1">Weeks [Phase2.Start]-[Phase2.End] • Execution Phase</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-purple-100">Investment</div>
                <div className="text-2xl font-bold text-white">[Phase2.Cost]</div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-purple-600">⚙️</span> Key Activities
                  </h4>
                  <ul className="space-y-2 text-slate-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">▸</span>
                      <span>Solution architecture design and technical specifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">▸</span>
                      <span>Agile development sprints with bi-weekly demos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">▸</span>
                      <span>Integration with existing systems and data migration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">▸</span>
                      <span>User experience design and interface development</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">▸</span>
                      <span>Quality assurance testing and security audits</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-green-600">✓</span> Deliverables
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Fully Functional Solution</div>
                      <div className="text-xs text-slate-600">Production-ready platform with all core features</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Technical Documentation</div>
                      <div className="text-xs text-slate-600">Complete system architecture and API documentation</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Training Materials</div>
                      <div className="text-xs text-slate-600">User guides, video tutorials, and admin manuals</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl font-bold">03</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Launch & Optimization</h3>
                  <div className="text-sm text-pink-100 mt-1">Weeks [Phase3.Start]-[Phase3.End] • Deployment Phase</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-100">Investment</div>
                <div className="text-2xl font-bold text-white">[Phase3.Cost]</div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-pink-600">🚀</span> Key Activities
                  </h4>
                  <ul className="space-y-2 text-slate-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">▸</span>
                      <span>Staged rollout with pilot user groups and feedback loops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">▸</span>
                      <span>Comprehensive user training and change management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">▸</span>
                      <span>Performance monitoring and optimization tuning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">▸</span>
                      <span>Post-launch support and rapid issue resolution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">▸</span>
                      <span>Success metrics tracking and executive reporting</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-green-600">✓</span> Deliverables
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Production Launch</div>
                      <div className="text-xs text-slate-600">Full system deployment with monitoring</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Performance Report</div>
                      <div className="text-xs text-slate-600">30-day metrics analysis and optimization recommendations</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-semibold text-slate-900 mb-1">Support Transition</div>
                      <div className="text-xs text-slate-600">Handoff to ongoing support team with SLAs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Breakdown */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-20">
        <div className="max-w-6xl mx-auto px-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              <div className="w-3 h-3 rounded-full bg-indigo-300"></div>
              <div className="w-4 h-4 rounded-full bg-indigo-200"></div>
            </div>
            <h2 className="text-4xl font-bold text-white">Investment Structure</h2>
          </div>
          {/* Pricing Tiers */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {/* Essential Package */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border-2 border-white/10 p-8 hover:border-indigo-400/50 transition-all duration-300">
              <div className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4">Essential</div>
              <div className="text-5xl font-bold text-white mb-2">[Essential.Price]</div>
              <div className="text-sm text-slate-400 mb-8">Perfect for focused initiatives</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-indigo-400">✓</span>
                  <span>Phase 1 & 2 Implementation</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-indigo-400">✓</span>
                  <span>Core features and integrations</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-indigo-400">✓</span>
                  <span>[Essential.Support] support</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-indigo-400">✓</span>
                  <span>Standard documentation</span>
                </li>
              </ul>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-300">
                Select Essential
              </button>
            </div>
            {/* Professional Package - Highlighted */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl border-2 border-indigo-400 p-8 transform scale-105 shadow-2xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-900 px-6 py-1 rounded-full text-xs font-bold">
                RECOMMENDED
              </div>
              <div className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-4">Professional</div>
              <div className="text-5xl font-bold text-white mb-2">[Professional.Price]</div>
              <div className="text-sm text-indigo-200 mb-8">Complete transformation package</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="text-yellow-300">✓</span>
                  <span>All 3 Phases Complete</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="text-yellow-300">✓</span>
                  <span>Advanced features & customization</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="text-yellow-300">✓</span>
                  <span>[Professional.Support] support</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="text-yellow-300">✓</span>
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <span className="text-yellow-300">✓</span>
                  <span>Performance guarantee</span>
                </li>
              </ul>
              <button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-3 rounded-xl transition-all duration-300 shadow-lg">
                Select Professional
              </button>
            </div>
            {/* Enterprise Package */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border-2 border-white/10 p-8 hover:border-purple-400/50 transition-all duration-300">
              <div className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4">Enterprise</div>
              <div className="text-5xl font-bold text-white mb-2">[Enterprise.Price]</div>
              <div className="text-sm text-slate-400 mb-8">Maximum value & flexibility</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-400">✓</span>
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-400">✓</span>
                  <span>White-glove concierge service</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-400">✓</span>
                  <span>24/7 priority support</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-400">✓</span>
                  <span>Custom integrations & APIs</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="text-purple-400">✓</span>
                  <span>Quarterly strategic reviews</span>
                </li>
              </ul>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-300">
                Select Enterprise
              </button>
            </div>
          </div>
          {/* Payment Terms */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Flexible Payment Options</h3>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-sm text-slate-400 mb-2">Payment Schedule</div>
                <div className="text-lg font-semibold text-white">[Payment.Schedule]</div>
                <div className="text-xs text-slate-500 mt-1">Milestone-based payments</div>
              </div>
              <div className="border-l border-white/10 pl-8">
                <div className="text-sm text-slate-400 mb-2">Financing Available</div>
                <div className="text-lg font-semibold text-white">Yes, [Financing.Terms]</div>
                <div className="text-xs text-slate-500 mt-1">Subject to credit approval</div>
              </div>
              <div className="border-l border-white/10 pl-8">
                <div className="text-sm text-slate-400 mb-2">Early Payment Discount</div>
                <div className="text-lg font-semibold text-white">[Discount.Percent]% off</div>
                <div className="text-xs text-slate-500 mt-1">If paid in full upfront</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Outcomes & ROI */}
      <div className="max-w-6xl mx-auto px-16 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-4 h-4 rounded-full bg-green-400"></div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900">Expected Outcomes & ROI</h2>
        </div>
        {/* ROI Timeline */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border-2 border-green-200 mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Projected Return on Investment</h3>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-sm text-slate-600 mb-2">Month 3</div>
              <div className="text-4xl font-bold text-green-600 mb-2">[ROI.Month3]%</div>
              <div className="text-xs text-slate-500">Quick wins realized</div>
            </div>
            <div className="text-center border-l-2 border-green-200">
              <div className="text-sm text-slate-600 mb-2">Month 6</div>
              <div className="text-4xl font-bold text-green-600 mb-2">[ROI.Month6]%</div>
              <div className="text-xs text-slate-500">Full implementation</div>
            </div>
            <div className="text-center border-l-2 border-green-200">
              <div className="text-sm text-slate-600 mb-2">Month 12</div>
              <div className="text-4xl font-bold text-green-600 mb-2">[ROI.Month12]%</div>
              <div className="text-xs text-slate-500">Optimization phase</div>
            </div>
            <div className="text-center border-l-2 border-green-200">
              <div className="text-sm text-slate-600 mb-2">Month 24</div>
              <div className="text-4xl font-bold text-green-600 mb-2">[ROI.Month24]%</div>
              <div className="text-xs text-slate-500">Sustained growth</div>
            </div>
          </div>
        </div>
        {/* Key Metrics Improvement */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">📊</span> Operational Metrics
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Efficiency Improvement</span>
                  <span className="text-lg font-bold text-green-600">+[Efficiency.Improvement]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Cost Reduction</span>
                  <span className="text-lg font-bold text-green-600">-[Cost.Reduction]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '70%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Processing Speed</span>
                  <span className="text-lg font-bold text-green-600">+[Speed.Increase]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '90%'}}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">💰</span> Business Impact
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Revenue Growth</span>
                  <span className="text-lg font-bold text-indigo-600">+[Revenue.Growth]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Customer Satisfaction</span>
                  <span className="text-lg font-bold text-indigo-600">+[CSAT.Improvement]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{width: '80%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Market Share</span>
                  <span className="text-lg font-bold text-indigo-600">+[Market.Share]%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team & Expertise */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Your Dedicated Team</h2>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-12">
            {/* Team Member 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                [PM.Initials]
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">[Project.Manager]</h3>
              <div className="text-sm text-indigo-600 font-semibold mb-3">Project Manager</div>
              <div className="text-xs text-slate-600 leading-relaxed">
                [PM.Years]+ years leading enterprise transformations. MBA from [PM.School]. Certified PMP and Agile practitioner.
              </div>
            </div>
            {/* Team Member 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                [TA.Initials]
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">[Technical.Architect]</h3>
              <div className="text-sm text-purple-600 font-semibold mb-3">Technical Architect</div>
              <div className="text-xs text-slate-600 leading-relaxed">
                [TA.Years]+ years in solution architecture. Former [TA.Company] engineer. Expert in cloud-native systems.
              </div>
            </div>
            {/* Team Member 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                [BA.Initials]
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">[Business.Analyst]</h3>
              <div className="text-sm text-pink-600 font-semibold mb-3">Business Analyst</div>
              <div className="text-xs text-slate-600 leading-relaxed">
                [BA.Years]+ years in business transformation. Industry expert in [BA.Industry]. Data-driven strategist.
              </div>
            </div>
          </div>
          {/* Company Credentials */}
          <div className="bg-white rounded-3xl p-12 shadow-xl border-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Why We're Qualified</h3>
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-indigo-600 mb-2">[Projects.Completed]+</div>
                <div className="text-sm text-slate-600">Projects Delivered</div>
              </div>
              <div className="text-center border-l-2 border-slate-200">
                <div className="text-5xl font-bold text-purple-600 mb-2">[Client.Satisfaction]%</div>
                <div className="text-sm text-slate-600">Client Satisfaction</div>
              </div>
              <div className="text-center border-l-2 border-slate-200">
                <div className="text-5xl font-bold text-pink-600 mb-2">[Industry.Awards]</div>
                <div className="text-sm text-slate-600">Industry Awards</div>
              </div>
              <div className="text-center border-l-2 border-slate-200">
                <div className="text-5xl font-bold text-rose-600 mb-2">[Years.Business]</div>
                <div className="text-sm text-slate-600">Years in Business</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Mitigation */}
      <div className="max-w-6xl mx-auto px-16 py-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-600"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-4 h-4 rounded-full bg-amber-400"></div>
          </div>
          <h2 className="text-4xl font-bold text-slate-900">Risk Mitigation & Guarantees</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-amber-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Our Guarantees</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <div>
                  <div className="font-semibold text-slate-900">Performance Guarantee</div>
                  <div className="text-xs text-slate-600 mt-1">If we don't meet agreed KPIs within [Guarantee.Period], we'll work for free until we do</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <div>
                  <div className="font-semibold text-slate-900">On-Time Delivery</div>
                  <div className="text-xs text-slate-600 mt-1">[Penalty.Percent]% monthly fee reduction for each week past deadline</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <div>
                  <div className="font-semibold text-slate-900">Quality Assurance</div>
                  <div className="text-xs text-slate-600 mt-1">Unlimited bug fixes for [Warranty.Period] post-launch</div>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Risk Management</h3>
            </div>
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold mt-1">▸</span>
                <div>
                  <div className="font-semibold text-slate-900">Agile Methodology</div>
                  <div className="text-xs text-slate-600 mt-1">Bi-weekly sprints allow for rapid course correction and continuous feedback</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold mt-1">▸</span>
                <div>
                  <div className="font-semibold text-slate-900">Phased Investment</div>
                  <div className="text-xs text-slate-600 mt-1">Milestone-based payments minimize financial exposure</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-500 font-bold mt-1">▸</span>
                <div>
                  <div className="font-semibold text-slate-900">Change Management</div>
                  <div className="text-xs text-slate-600 mt-1">Dedicated support for user adoption and organizational transition</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps & Call to Action */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        <div className="max-w-6xl mx-auto px-16 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-6">Let's Get Started</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Ready to transform your business? Here's how we'll move forward together.
            </p>
          </div>
          {/* Next Steps Timeline */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 mb-12">
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">1</div>
                <div className="text-white font-bold mb-2">Initial Meeting</div>
                <div className="text-sm text-slate-300">Schedule a consultation call within 48 hours</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">2</div>
                <div className="text-white font-bold mb-2">Deep Dive</div>
                <div className="text-sm text-slate-300">Detailed needs assessment and Q&A session</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">3</div>
                <div className="text-white font-bold mb-2">Finalize Terms</div>
                <div className="text-sm text-slate-300">Contract signing and payment setup</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">4</div>
                <div className="text-white font-bold mb-2">Project Kickoff</div>
                <div className="text-sm text-slate-300">Begin Phase 1 immediately</div>
              </div>
            </div>
          </div>
          {/* Contact CTA */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📞</div>
              <div className="text-white font-bold text-xl mb-2">Schedule a Call</div>
              <div className="text-indigo-200 text-sm mb-6">Speak with our team within 24 hours</div>
              <button className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-xl hover:bg-indigo-50 transition-all duration-300">
                Book Your Consultation
              </button>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">✉️</div>
              <div className="text-white font-bold text-xl mb-2">Send Questions</div>
              <div className="text-purple-200 text-sm mb-6">Get answers to your specific needs</div>
              <button className="bg-white text-purple-700 font-bold py-3 px-8 rounded-xl hover:bg-purple-50 transition-all duration-300">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Terms */}
      <div className="max-w-6xl mx-auto px-16 py-16">
        <div className="border-t-2 border-slate-200 pt-12">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Terms & Conditions</h3>
              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <p>• This proposal is valid for [Validity.Days] days from the date above</p>
                <p>• Pricing is subject to change after expiration date</p>
                <p>• Work begins upon signed contract and initial payment</p>
                <p>• All deliverables remain our property until final payment</p>
                <p>• Client responsible for providing timely feedback and approvals</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Contact Information</h3>
              <div className="text-sm text-slate-700 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600">📧</span>
                  <span>[Your.Email]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600">📱</span>
                  <span>[Your.Phone]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600">🌐</span>
                  <span>[Your.Website]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600">📍</span>
                  <span>[Your.Address]</span>
                </div>
              </div>
            </div>
          </div>
          {/* Signature Section */}
          <div className="bg-slate-50 rounded-2xl p-12 border-2 border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Acceptance & Authorization</h3>
            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <div className="mb-6">
                  <div className="text-sm text-slate-600 font-semibold mb-2">Client Name</div>
                  <div className="border-b-2 border-slate-300 pb-2 text-slate-900">[Client.ContactName]</div>
                </div>
                <div className="mb-6">
                  <div className="text-sm text-slate-600 font-semibold mb-2">Title</div>
                  <div className="border-b-2 border-slate-300 pb-2 text-slate-900">[Client.Title]</div>
                </div>
                <div className="mb-6">
                  <div className="text-sm text-slate-600 font-semibold mb-2">Company</div>
                  <div className="border-b-2 border-slate-300 pb-2 text-slate-900">[Client.Company]</div>
                </div>
              </div>
              <div>
                <div className="mb-6">
                  <div className="text-sm text-slate-600 font-semibold mb-2">Signature</div>
                  <div className="border-b-2 border-slate-900 pb-8"></div>
                </div>
                <div className="mb-6">
                  <div className="text-sm text-slate-600 font-semibold mb-2">Date</div>
                  <div className="border-b-2 border-slate-300 pb-2"></div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✓</div>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">By signing above, you acknowledge that:</strong> You have read and 
                  understood this proposal, you agree to the terms and conditions outlined, you have the authority to 
                  enter into this agreement on behalf of [Client.Company], and you authorize commencement of work as 
                  described upon receipt of signed contract and initial payment.
                </div>
              </div>
            </div>
          </div>
          {/* Final Footer */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">YC</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-1">[Your.Company.Name]</div>
            <div className="text-xs text-slate-500">Excellence in Innovation Since [Founded.Year]</div>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="text-xs text-slate-400">
                Proposal ID: [Proposal.ID] | Document Version [Version.Number] | Confidential & Proprietary
              </div>
              <div className="text-xs text-slate-400 mt-2">
                © {new Date().getFullYear()} [Your.Company.Name]. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML will be generated from this component -->`
},

{
  id: 'project-proposal-002',
  name: 'Creative Project Proposal',
  description: 'Modern proposal for creative projects',
  category: 'proposals',
  popular: false,
  fields: ['Project', 'Timeline', 'Budget', 'Team', 'Vision'],
  previewComponent: (
    <div className="w-full h-full bg-black text-white text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-12 min-h-[45%] flex flex-col justify-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-500"></div>
        <div className="text-[10px] text-cyan-400 font-bold mb-2 tracking-wider">CREATIVE PROPOSAL</div>
        <div className="text-5xl font-bold mb-4 leading-tight">[Project.Name]</div>
        <div className="text-lg text-pink-300 mb-6">[Project.Tagline]</div>
        <div className="flex gap-6 text-[8px]">
          <div>
            <div className="text-slate-400">Client</div>
            <div className="font-bold">[Client.Name]</div>
          </div>
          <div>
            <div className="text-slate-400">Date</div>
            <div className="font-bold">[Proposal.Date]</div>
          </div>
          <div>
            <div className="text-slate-400">Proposal #</div>
            <div className="font-bold">[Proposal.Number]</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Vision */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">THE VISION</div>
          <div className="bg-slate-900 border-l-4 border-cyan-400 p-5 rounded-r-lg">
            <div className="text-[8px] text-slate-300 leading-relaxed">
              [Project.Vision.Description] - A comprehensive explanation of the creative vision, artistic direction, and the transformative impact this project will have on the target audience.
            </div>
          </div>
        </div>

        {/* Project Phases */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">PROJECT PHASES</div>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-900/50 to-transparent border border-cyan-700 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">1</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-cyan-400">Discovery & Research</div>
                  <div className="text-[7px] text-slate-400">Week 1-2</div>
                </div>
              </div>
              <div className="text-[8px] text-slate-300">[Phase.1.Description]</div>
            </div>

            <div className="bg-gradient-to-r from-pink-900/50 to-transparent border border-pink-700 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center text-xl font-bold">2</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-pink-400">Concept Development</div>
                  <div className="text-[7px] text-slate-400">Week 3-5</div>
                </div>
              </div>
              <div className="text-[8px] text-slate-300">[Phase.2.Description]</div>
            </div>

            <div className="bg-gradient-to-r from-orange-900/50 to-transparent border border-orange-700 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-xl font-bold">3</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-orange-400">Production & Execution</div>
                  <div className="text-[7px] text-slate-400">Week 6-10</div>
                </div>
              </div>
              <div className="text-[8px] text-slate-300">[Phase.3.Description]</div>
            </div>
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">DELIVERABLES</div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-cyan-500 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-pink-500 rounded flex items-center justify-center text-sm font-bold">{i}</div>
                  <div className="text-[8px] font-bold">[Deliverable.{i}.Title]</div>
                </div>
                <div className="text-[7px] text-slate-400">[Deliverable.{i}.Description]</div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">INVESTMENT</div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-cyan-500 rounded-xl p-8 text-center">
            <div className="text-[10px] text-cyan-400 font-semibold mb-3">TOTAL PROJECT BUDGET</div>
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
                 ${"[total_budget]"}
            </div>
            <div className="text-[8px] text-slate-400 mb-6">[Payment.Schedule.Summary]</div>
            <div className="grid grid-cols-3 gap-4 text-[8px]">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 mb-1">Deposit</div>
                <div className="text-lg font-bold text-cyan-400">[Deposit.%]%</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 mb-1">Milestone</div>
                <div className="text-lg font-bold text-pink-400">[Milestone.%]%</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 mb-1">Final</div>
                <div className="text-lg font-bold text-yellow-400">[Final.%]%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">THE TEAM</div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">
                  👤
                </div>
                <div className="text-[8px] font-bold text-white">[Team.Member.{i}.Name]</div>
                <div className="text-[7px] text-cyan-400">[Team.Member.{i}.Role]</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-cyan-600 via-pink-600 to-orange-600 rounded-xl p-8 text-center">
          <div className="text-2xl font-bold mb-3">LET'S CREATE MAGIC TOGETHER</div>
          <div className="text-[8px] mb-5 max-w-2xl mx-auto">
            Ready to bring this vision to life? Let's collaborate and create something extraordinary that will captivate and inspire your audience.
          </div>
          <div className="text-[8px]">
            <div className="font-bold">[Company.Name]</div>
            <div className="mt-1">[Company.Email] | [Company.Phone]</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950 p-4 text-center text-[7px] text-slate-500 border-t border-slate-800">
        <div>Proposal #[Proposal.Number] | Confidential</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!-- Full HTML -->`
},

{
  id: 'purchase-order-001',
  name: 'Purchase Order',
  description: 'Official purchase order for goods/services',
  category: 'invoices',
  popular: true,
  fields: ['PO Number', 'Vendor Info', 'Items', 'Delivery Date', 'Terms'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-3 border-blue-600">
        <div>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold mb-3">
            PO
          </div>
          <div className="text-lg font-bold text-slate-900">[Company.Name]</div>
          <div className="text-[8px] text-slate-600 mt-1 space-y-0.5">
            <div>[Company.Address]</div>
            <div>[Company.City], [Company.State] [Company.Zip]</div>
            <div className="mt-1">[Company.Email]</div>
            <div>[Company.Phone]</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-blue-600 mb-3">PURCHASE ORDER</div>
          <div className="bg-blue-100 px-4 py-2 rounded-lg mb-2">
            <div className="text-[7px] text-blue-700 font-semibold">PO NUMBER</div>
            <div className="text-lg font-bold text-slate-900">[PO.Number]</div>
          </div>
          <div className="text-[8px] text-slate-600 space-y-1">
            <div><strong>Date:</strong> [PO.Date]</div>
            <div><strong>Required By:</strong> <span className="bg-yellow-100 px-2 font-bold">[Delivery.Date]</span></div>
          </div>
        </div>
      </div>

      {/* Vendor & Bill To */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="text-sm font-bold text-blue-600 mb-3 border-l-4 border-blue-500 pl-3">VENDOR</div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5">
            <div className="grid grid-cols-1 gap-2 text-[8px]">
              <div className="font-bold text-slate-900 text-sm">[Vendor.Name]</div>
              <div className="text-slate-900">[Vendor.Address]</div>
              <div className="text-slate-900">[Vendor.City], [Vendor.State] [Vendor.Zip]</div>
              <div className="text-slate-900 mt-2"><strong>Email:</strong> [Vendor.Email]</div>
              <div className="text-slate-900"><strong>Phone:</strong> [Vendor.Phone]</div>
              <div className="text-slate-900"><strong>Account #:</strong> [Vendor.AccountNumber]</div>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-slate-500 pl-3">BILL TO / SHIP TO</div>
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
            <div className="grid grid-cols-1 gap-2 text-[8px]">
              <div className="font-bold text-slate-900 text-sm">[Company.Name]</div>
              <div className="text-slate-900">[Shipping.Address]</div>
              <div className="text-slate-900">[Shipping.City], [Shipping.State] [Shipping.Zip]</div>
              <div className="text-slate-900 mt-2"><strong>Attn:</strong> [Shipping.Contact]</div>
              <div className="text-slate-900"><strong>Phone:</strong> [Shipping.Phone]</div>
              <div className="text-slate-900"><strong>PO Contact:</strong> [PO.ContactName]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <div className="text-sm font-bold text-slate-900 mb-3">ORDERED ITEMS</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <th className="text-left p-3 font-semibold border border-blue-700">#</th>
              <th className="text-left p-3 font-semibold border border-blue-700">DESCRIPTION</th>
              <th className="text-center p-3 font-semibold border border-blue-700 w-16">QTY</th>
              <th className="text-center p-3 font-semibold border border-blue-700 w-16">UNIT</th>
              <th className="text-right p-3 font-semibold border border-blue-700 w-20">UNIT PRICE</th>
              <th className="text-right p-3 font-semibold border border-blue-700 w-20">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 hover:bg-blue-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">1</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.1.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.1.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.1.Qty]</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.1.Unit]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.1.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.1.Amount]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-blue-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">2</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.2.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.2.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.2.Qty]</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.2.Unit]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.2.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.2.Amount]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-blue-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">3</td>
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.3.Name]</div>
                <div className="text-[7px] text-slate-600">[Item.3.Description]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.3.Qty]</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">[Item.3.Unit]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.3.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-slate-900">$[Item.3.Amount]</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Subtotal:</span>
              <span className="font-bold text-slate-900">$[Subtotal]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Shipping & Handling:</span>
              <span className="font-bold text-slate-900">$[Shipping.Cost]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Discount ([Discount.Percent]%):</span>
              <span className="font-bold text-green-600">-$[Discount.Amount]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Tax ([Tax.Rate]%):</span>
              <span className="font-bold text-slate-900">$[Tax.Amount]</span>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg p-4 flex justify-between items-center mt-3">
              <span className="text-sm font-bold">TOTAL DUE:</span>
              <span className="text-2xl font-bold">${"[total_amount]"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Notes */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-blue-500 pl-3">TERMS & CONDITIONS</div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <ul className="text-[8px] text-slate-700 space-y-2 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Payment Terms:</strong> Net [Payment.Terms] days from invoice date.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Late Payments:</strong> Subject to [Late.Fee]% monthly interest.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Delivery:</strong> Must be received by [Delivery.Date]. Late deliveries may be rejected.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Inspection:</strong> Goods subject to quality inspection within 5 business days of receipt.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Cancellation:</strong> PO may be canceled without penalty if vendor fails to meet delivery schedule.</span>
              </li>
            </ul>
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-amber-500 pl-3">ADDITIONAL NOTES</div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Additional.Notes] – Special instructions, packaging requirements, compliance certifications, or reference numbers (e.g., project code: [Project.Code]).
            </div>
          </div>
        </div>
      </div>

      {/* Authorization */}
      <div className="border-t-2 border-blue-600 pt-6">
        <div className="text-sm font-bold text-slate-900 mb-4">AUTHORIZED SIGNATURE</div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 mb-4">
            This purchase order is legally binding upon acceptance by the vendor. By signing below, the vendor agrees to all terms and conditions stated herein.
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-[7px] text-slate-600 mb-2">Vendor Signature:</div>
              <div className="border-b-2 border-slate-400 pb-1 mb-3 h-8"></div>
              <div className="text-[7px] text-slate-600">Name: _______________________</div>
            </div>
            <div>
              <div className="text-[7px] text-slate-600 mb-2">Date:</div>
              <div className="border-b-2 border-slate-400 pb-1 mb-3 h-8"></div>
            </div>
            <div>
              <div className="text-[7px] text-slate-600 mb-2">Company Stamp:</div>
              <div className="border-2 border-dashed border-slate-400 rounded w-full h-12 flex items-center justify-center text-[7px] text-slate-400">
                [Official Stamp]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">Thank you for your partnership!</div>
        <div>Questions? Contact [PO.ContactName] at [Company.Email] or [Company.Phone]</div>
        <div className="mt-2">PO #[PO.Number] | Issued [PO.Date] | Required by [Delivery.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Order</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid #2563eb;
    }
    .company-info {
      max-width: 200px;
    }
    .company-logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(to bottom right, #3b82f6, #06b6d4);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.75rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }
    .company-name {
      font-size: 1.125rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .company-details {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.2;
    }
    .po-title {
      font-size: 1.75rem;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 0.75rem;
      text-align: right;
    }
    .po-number-box {
      background-color: #dbeafe;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .po-number-label {
      font-size: 0.65rem;
      color: #1e40af;
      font-weight: 600;
      margin-bottom: 0.125rem;
    }
    .po-number {
      font-size: 1.125rem;
      font-weight: bold;
      color: #1e293b;
    }
    .po-dates {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.2;
    }
    .delivery-date {
      background-color: #fef3c7;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: bold;
      color: #92400e;
    }

    /* Vendor and Bill To Sections */
    .vendor-bill-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
      border-left: 4px solid #2563eb;
    }
    .vendor-section {
      background: linear-gradient(to right, #dbeafe, #bfdbfe);
      border: 2px solid #bfdbfe;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .bill-section {
      background-color: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .vendor-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .vendor-details {
      font-size: 0.7rem;
      color: #1e293b;
      line-height: 1.2;
    }
    .vendor-detail-label {
      font-weight: 600;
      color: #1e293b;
    }

    /* Items Table */
    .items-section {
      margin-bottom: 2rem;
    }
    .items-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.7rem;
    }
    .items-table th {
      background: linear-gradient(to right, #2563eb, #06b6d4);
      color: white;
      padding: 0.5rem;
      text-align: left;
      font-weight: 600;
      border: 1px solid #1e40af;
    }
    .items-table th:last-child,
    .items-table th:nth-last-child(2) {
      text-align: right;
    }
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) {
      text-align: center;
      width: 40px;
    }
    .items-table td {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .items-table td:last-child,
    .items-table td:nth-last-child(2) {
      text-align: right;
    }
    .items-table td:nth-child(3),
    .items-table td:nth-child(4) {
      text-align: center;
    }
    .items-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .items-table tr:hover {
      background-color: #dbeafe;
    }
    .item-number {
      font-weight: bold;
      color: #1e293b;
    }
    .item-name {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .item-description {
      font-size: 0.65rem;
      color: #64748b;
    }
    .item-amount {
      font-weight: bold;
      color: #1e293b;
    }

    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }
    .totals-box {
      width: 320px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.7rem;
    }
    .total-label {
      color: #64748b;
      font-weight: 600;
    }
    .total-value {
      font-weight: bold;
      color: #1e293b;
    }
    .total-discount {
      color: #10b981;
    }
    .grand-total {
      background: linear-gradient(to right, #2563eb, #06b6d4);
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-top: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grand-total-label {
      font-size: 0.875rem;
      font-weight: bold;
    }
    .grand-total-value {
      font-size: 1.5rem;
      font-weight: bold;
    }

    /* Terms and Notes */
    .terms-notes-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .terms-section {
      border-left: 4px solid #2563eb;
      padding-left: 0.75rem;
    }
    .notes-section {
      border-left: 4px solid #f59e0b;
      padding-left: 0.75rem;
    }
    .section-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .notes-box {
      background-color: #fef3c7;
      border: 2px solid #fde68a;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .terms-list {
      list-style: none;
      padding-left: 0;
    }
    .terms-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .terms-bullet {
      color: #2563eb;
      font-weight: bold;
      flex-shrink: 0;
    }
    .notes-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Authorization Section */
    .authorization-section {
      border-top: 2px solid #2563eb;
      padding-top: 1.5rem;
      margin-bottom: 2rem;
    }
    .authorization-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 1rem;
    }
    .authorization-box {
      background-color: #dbeafe;
      border: 2px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 1.25rem;
    }
    .authorization-text {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    .signature-field {
      text-align: center;
    }
    .signature-label {
      font-size: 0.65rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    .signature-line {
      border-bottom: 2px solid #cbd5e1;
      height: 2rem;
      margin-bottom: 0.5rem;
    }
    .stamp-box {
      border: 2px dashed #cbd5e1;
      border-radius: 0.25rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cbd5e1;
      font-size: 0.65rem;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem;
      color: #64748b;
    }
    .footer-bold {
      font-weight: 600;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="company-info">
      <div class="company-logo">PO</div>
      <div class="company-name">[Company.Name]</div>
      <div class="company-details">
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.Zip]</div>
        <div class="mt-1">[Company.Email]</div>
        <div>[Company.Phone]</div>
      </div>
    </div>
    <div>
      <div class="po-title">PURCHASE ORDER</div>
      <div class="po-number-box">
        <div class="po-number-label">PO NUMBER</div>
        <div class="po-number">[PO.Number]</div>
      </div>
      <div class="po-dates">
        <div><strong>Date:</strong> [PO.Date]</div>
        <div><strong>Required By:</strong> <span class="delivery-date">[Delivery.Date]</span></div>
      </div>
    </div>
  </div>

  <!-- Vendor and Bill To -->
  <div class="vendor-bill-section">
    <div>
      <div class="section-header">VENDOR</div>
      <div class="vendor-section">
        <div class="vendor-name">[Vendor.Name]</div>
        <div class="vendor-details">
          <div>[Vendor.Address]</div>
          <div>[Vendor.City], [Vendor.State] [Vendor.Zip]</div>
          <div class="mt-2"><span class="vendor-detail-label">Email:</span> [Vendor.Email]</div>
          <div><span class="vendor-detail-label">Phone:</span> [Vendor.Phone]</div>
          <div><span class="vendor-detail-label">Account #:</span> [Vendor.AccountNumber]</div>
        </div>
      </div>
    </div>
    <div>
      <div class="section-header" style="border-left-color: #64748b;">BILL TO / SHIP TO</div>
      <div class="bill-section">
        <div class="vendor-name">[Company.Name]</div>
        <div class="vendor-details">
          <div>[Shipping.Address]</div>
          <div>[Shipping.City], [Shipping.State] [Shipping.Zip]</div>
          <div class="mt-2"><span class="vendor-detail-label">Attn:</span> [Shipping.Contact]</div>
          <div><span class="vendor-detail-label">Phone:</span> [Shipping.Phone]</div>
          <div><span class="vendor-detail-label">PO Contact:</span> [PO.ContactName]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <div class="items-section">
    <div class="items-header">ORDERED ITEMS</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>DESCRIPTION</th>
          <th>QTY</th>
          <th>UNIT</th>
          <th>UNIT PRICE</th>
          <th>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="item-number">1</td>
          <td>
            <div class="item-name">[Item.1.Name]</div>
            <div class="item-description">[Item.1.Description]</div>
          </td>
          <td class="text-center">[Item.1.Qty]</td>
          <td class="text-center">[Item.1.Unit]</td>
          <td class="text-right">$[Item.1.Price]</td>
          <td class="text-right item-amount">$[Item.1.Amount]</td>
        </tr>
        <tr>
          <td class="item-number">2</td>
          <td>
            <div class="item-name">[Item.2.Name]</div>
            <div class="item-description">[Item.2.Description]</div>
          </td>
          <td class="text-center">[Item.2.Qty]</td>
          <td class="text-center">[Item.2.Unit]</td>
          <td class="text-right">$[Item.2.Price]</td>
          <td class="text-right item-amount">$[Item.2.Amount]</td>
        </tr>
        <tr>
          <td class="item-number">3</td>
          <td>
            <div class="item-name">[Item.3.Name]</div>
            <div class="item-description">[Item.3.Description]</div>
          </td>
          <td class="text-center">[Item.3.Qty]</td>
          <td class="text-center">[Item.3.Unit]</td>
          <td class="text-right">$[Item.3.Price]</td>
          <td class="text-right item-amount">$[Item.3.Amount]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">$[Subtotal]</span>
      </div>
      <div class="total-row">
        <span class="total-label">Shipping & Handling:</span>
        <span class="total-value">$[Shipping.Cost]</span>
      </div>
      <div class="total-row">
        <span class="total-label">Discount ([Discount.Percent]%):</span>
        <span class="total-value total-discount">-$[Discount.Amount]</span>
      </div>
      <div class="total-row">
        <span class="total-label">Tax ([Tax.Rate]%):</span>
        <span class="total-value">$[Tax.Amount]</span>
      </div>
      <div class="grand-total">
        <span class="grand-total-label">TOTAL DUE:</span>
        <span class="grand-total-value">${"[total_amount]"}</span>
      </div>
    </div>
  </div>

  <!-- Terms and Notes -->
  <div class="terms-notes-section">
    <div class="terms-section">
      <div class="section-header">TERMS & CONDITIONS</div>
      <div class="section-box">
        <ul class="terms-list">
          <li class="terms-item">
            <span class="terms-bullet">•</span>
            <span><strong>Payment Terms:</strong> Net [Payment.Terms] days from invoice date.</span>
          </li>
          <li class="terms-item">
            <span class="terms-bullet">•</span>
            <span><strong>Late Payments:</strong> Subject to [Late.Fee]% monthly interest.</span>
          </li>
          <li class="terms-item">
            <span class="terms-bullet">•</span>
            <span><strong>Delivery:</strong> Must be received by [Delivery.Date]. Late deliveries may be rejected.</span>
          </li>
          <li class="terms-item">
            <span class="terms-bullet">•</span>
            <span><strong>Inspection:</strong> Goods subject to quality inspection within 5 business days of receipt.</span>
          </li>
          <li class="terms-item">
            <span class="terms-bullet">•</span>
            <span><strong>Cancellation:</strong> PO may be canceled without penalty if vendor fails to meet delivery schedule.</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="notes-section">
      <div class="section-header" style="border-left-color: #f59e0b;">ADDITIONAL NOTES</div>
      <div class="notes-box">
        <div class="notes-text">
          [Additional.Notes] – Special instructions, packaging requirements, compliance certifications, or reference numbers (e.g., project code: [Project.Code]).
        </div>
      </div>
    </div>
  </div>

  <!-- Authorization -->
  <div class="authorization-section">
    <div class="authorization-header">AUTHORIZED SIGNATURE</div>
    <div class="authorization-box">
      <div class="authorization-text">
        This purchase order is legally binding upon acceptance by the vendor. By signing below, the vendor agrees to all terms and conditions stated herein.
      </div>
      <div class="signature-section">
        <div class="signature-field">
          <div class="signature-label">Vendor Signature:</div>
          <div class="signature-line"></div>
          <div class="signature-label">Name: _______________________</div>
        </div>
        <div class="signature-field">
          <div class="signature-label">Date:</div>
          <div class="signature-line"></div>
        </div>
        <div class="signature-field">
          <div class="signature-label">Company Stamp:</div>
          <div class="stamp-box">[Official Stamp]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-bold">Thank you for your partnership!</div>
    <div>Questions? Contact [PO.ContactName] at [Company.Email] or [Company.Phone]</div>
    <div class="mt-2">PO #[PO.Number] | Issued [PO.Date] | Required by [Delivery.Date]</div>
  </div>
</body>
</html>
`
},

{
  id: 'professional-resume-001',
  name: 'Professional Resume',
  description: 'Modern professional resume template',
  category: 'resumes',
  popular: true,
  fields: ['Full Name', 'Contact Info', 'Experience', 'Education', 'Skills'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-6 pb-6 border-b-4 border-blue-600">
        <div className="text-5xl font-bold text-slate-900 mb-2">[Full.Name]</div>
        <div className="text-lg text-blue-600 font-semibold mb-3">[Professional.Title]</div>
        <div className="flex justify-center gap-4 text-[8px] text-slate-600 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="font-bold">📧</span>
            <span>[Email.Address]</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">📱</span>
            <span>[Phone.Number]</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">📍</span>
            <span>[City], [State/Country]</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">💼</span>
            <span>[LinkedIn.URL]</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">🌐</span>
            <span>[Portfolio.Website]</span>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">PROFESSIONAL SUMMARY</div>
        <div className="text-[8px] text-slate-700 leading-relaxed">
          [Professional.Summary.Paragraph] - A results-driven professional with [Years.Experience]+ years of experience in [Industry/Field]. Proven track record of [Key.Achievement.1], [Key.Achievement.2], and [Key.Achievement.3]. Seeking to leverage expertise in [Core.Skill.1] and [Core.Skill.2] to contribute to [Target.Company.Type]'s success.
        </div>
      </div>

      {/* Core Competencies */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">CORE COMPETENCIES</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.1]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.2]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.3]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.4]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.5]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.6]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.7]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.8]</div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="text-[8px] font-semibold text-slate-900">[Competency.9]</div>
          </div>
        </div>
      </div>

      {/* Professional Experience */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">PROFESSIONAL EXPERIENCE</div>
        
        {/* Job 1 */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-slate-900">[Job.Title.1]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[Company.Name.1] | [Company.Location.1]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Start.Date.1] – [End.Date.1]</div>
          </div>
          <ul className="ml-4 space-y-1 text-[8px] text-slate-700 leading-relaxed">
            <li>• [Achievement.1.1] - Quantifiable result showing impact (e.g., "Increased sales by 35% through strategic marketing initiatives")</li>
            <li>• [Achievement.1.2] - Specific responsibility with measurable outcome</li>
            <li>• [Achievement.1.3] - Leadership or collaboration example</li>
            <li>• [Achievement.1.4] - Technical skill or process improvement</li>
            <li>• [Achievement.1.5] - Recognition or special project completion</li>
          </ul>
        </div>

        {/* Job 2 */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-slate-900">[Job.Title.2]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[Company.Name.2] | [Company.Location.2]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Start.Date.2] – [End.Date.2]</div>
          </div>
          <ul className="ml-4 space-y-1 text-[8px] text-slate-700 leading-relaxed">
            <li>• [Achievement.2.1] - Key accomplishment with metrics</li>
            <li>• [Achievement.2.2] - Process improvement or innovation</li>
            <li>• [Achievement.2.3] - Team leadership or mentoring experience</li>
            <li>• [Achievement.2.4] - Project management or strategic initiative</li>
            <li>• [Achievement.2.5] - Client relationship or stakeholder management</li>
          </ul>
        </div>

        {/* Job 3 */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-slate-900">[Job.Title.3]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[Company.Name.3] | [Company.Location.3]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Start.Date.3] – [End.Date.3]</div>
          </div>
          <ul className="ml-4 space-y-1 text-[8px] text-slate-700 leading-relaxed">
            <li>• [Achievement.3.1] - Demonstrated skill or accomplishment</li>
            <li>• [Achievement.3.2] - Contribution to team or company goals</li>
            <li>• [Achievement.3.3] - Technical proficiency or specialized knowledge</li>
            <li>• [Achievement.3.4] - Problem-solving or analytical capability</li>
          </ul>
        </div>

        {/* Job 4 */}
        <div className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-slate-900">[Job.Title.4]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[Company.Name.4] | [Company.Location.4]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Start.Date.4] – [End.Date.4]</div>
          </div>
          <ul className="ml-4 space-y-1 text-[8px] text-slate-700 leading-relaxed">
            <li>• [Achievement.4.1] - Early career responsibility or learning</li>
            <li>• [Achievement.4.2] - Foundation building experience</li>
            <li>• [Achievement.4.3] - Key skill development or certification earned</li>
          </ul>
        </div>
      </div>

      {/* Education */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">EDUCATION</div>
        
        <div className="mb-3">
          <div className="flex justify-between items-start mb-1">
            <div>
              <div className="text-sm font-bold text-slate-900">[Degree.1] in [Major.1]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[University.Name.1] | [University.Location.1]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Graduation.Date.1]</div>
          </div>
          <div className="text-[8px] text-slate-700">
            <span className="font-semibold">GPA:</span> [GPA.1] | <span className="font-semibold">Honors:</span> [Honors.1]
          </div>
          <div className="text-[8px] text-slate-700">
            <span className="font-semibold">Relevant Coursework:</span> [Coursework.1]
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-start mb-1">
            <div>
              <div className="text-sm font-bold text-slate-900">[Degree.2] in [Major.2]</div>
              <div className="text-[8px] text-blue-600 font-semibold">[University.Name.2] | [University.Location.2]</div>
            </div>
            <div className="text-[8px] text-slate-600 font-semibold">[Graduation.Date.2]</div>
          </div>
          <div className="text-[8px] text-slate-700">
            <span className="font-semibold">Relevant Coursework:</span> [Coursework.2]
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">CERTIFICATIONS & LICENSES</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="text-[8px] font-bold text-slate-900">[Certification.1.Name]</div>
            <div className="text-[7px] text-slate-600">[Issuing.Organization.1] | [Issue.Date.1]</div>
            <div className="text-[7px] text-slate-600">ID: [Certification.ID.1]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="text-[8px] font-bold text-slate-900">[Certification.2.Name]</div>
            <div className="text-[7px] text-slate-600">[Issuing.Organization.2] | [Issue.Date.2]</div>
            <div className="text-[7px] text-slate-600">ID: [Certification.ID.2]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="text-[8px] font-bold text-slate-900">[Certification.3.Name]</div>
            <div className="text-[7px] text-slate-600">[Issuing.Organization.3] | [Issue.Date.3]</div>
            <div className="text-[7px] text-slate-600">ID: [Certification.ID.3]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="text-[8px] font-bold text-slate-900">[Certification.4.Name]</div>
            <div className="text-[7px] text-slate-600">[Issuing.Organization.4] | [Issue.Date.4]</div>
            <div className="text-[7px] text-slate-600">ID: [Certification.ID.4]</div>
          </div>
        </div>
      </div>

      {/* Technical Skills */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">TECHNICAL SKILLS</div>
        <div className="grid grid-cols-2 gap-4 text-[8px]">
          <div>
            <div className="font-bold text-slate-900 mb-2">Programming & Development</div>
            <div className="text-slate-700 leading-relaxed">[Programming.Languages] | [Frameworks] | [Development.Tools]</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Software & Applications</div>
            <div className="text-slate-700 leading-relaxed">[Software.List] | [Design.Tools] | [Productivity.Tools]</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Databases & Cloud</div>
            <div className="text-slate-700 leading-relaxed">[Database.Systems] | [Cloud.Platforms] | [DevOps.Tools]</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Specialized Skills</div>
            <div className="text-slate-700 leading-relaxed">[Data.Analysis] | [Project.Management] | [Domain.Expertise]</div>
          </div>
        </div>
      </div>

      {/* Projects & Achievements */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">KEY PROJECTS & ACHIEVEMENTS</div>
        
        <div className="space-y-3">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="font-bold text-slate-900 text-[8px] mb-1">[Project.1.Name]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Project.1.Description] - Impact: [Project.1.Impact]
            </div>
            <div className="text-[7px] text-blue-600 mt-1">
              <strong>Technologies:</strong> [Project.1.Technologies]
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="font-bold text-slate-900 text-[8px] mb-1">[Project.2.Name]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Project.2.Description] - Impact: [Project.2.Impact]
            </div>
            <div className="text-[7px] text-blue-600 mt-1">
              <strong>Technologies:</strong> [Project.2.Technologies]
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r">
            <div className="font-bold text-slate-900 text-[8px] mb-1">[Project.3.Name]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              [Project.3.Description] - Impact: [Project.3.Impact]
            </div>
            <div className="text-[7px] text-blue-600 mt-1">
              <strong>Technologies:</strong> [Project.3.Technologies]
            </div>
          </div>
        </div>
      </div>

      {/* Awards & Recognition */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">AWARDS & RECOGNITION</div>
        <div className="grid grid-cols-2 gap-3 text-[8px]">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">🏆</span>
            <div>
              <div className="font-bold text-slate-900">[Award.1.Name]</div>
              <div className="text-slate-600">[Award.1.Organization] | [Award.1.Year]</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">🏆</span>
            <div>
              <div className="font-bold text-slate-900">[Award.2.Name]</div>
              <div className="text-slate-600">[Award.2.Organization] | [Award.2.Year]</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">🏆</span>
            <div>
              <div className="font-bold text-slate-900">[Award.3.Name]</div>
              <div className="text-slate-600">[Award.3.Organization] | [Award.3.Year]</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 text-lg">🏆</span>
            <div>
              <div className="font-bold text-slate-900">[Award.4.Name]</div>
              <div className="text-slate-600">[Award.4.Organization] | [Award.4.Year]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Affiliations */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">PROFESSIONAL AFFILIATIONS</div>
        <div className="grid grid-cols-2 gap-2 text-[8px]">
          <div className="bg-slate-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="font-semibold text-slate-900">[Association.1.Name]</div>
            <div className="text-slate-600">[Association.1.Role] | [Association.1.Years]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="font-semibold text-slate-900">[Association.2.Name]</div>
            <div className="text-slate-600">[Association.2.Role] | [Association.2.Years]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="font-semibold text-slate-900">[Association.3.Name]</div>
            <div className="text-slate-600">[Association.3.Role] | [Association.3.Years]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-600 px-3 py-2">
            <div className="font-semibold text-slate-900">[Association.4.Name]</div>
            <div className="text-slate-600">[Association.4.Role] | [Association.4.Years]</div>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">LANGUAGES</div>
        <div className="grid grid-cols-4 gap-3 text-[8px] text-center">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="font-bold text-slate-900">[Language.1]</div>
            <div className="text-slate-600">[Proficiency.1]</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="font-bold text-slate-900">[Language.2]</div>
            <div className="text-slate-600">[Proficiency.2]</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="font-bold text-slate-900">[Language.3]</div>
            <div className="text-slate-600">[Proficiency.3]</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="font-bold text-slate-900">[Language.4]</div>
            <div className="text-slate-600">[Proficiency.4]</div>
          </div>
        </div>
      </div>

      {/* Volunteer Experience */}
      <div className="mb-6">
        <div className="text-xl font-bold text-blue-600 mb-3 pb-2 border-b-2 border-blue-600">VOLUNTEER EXPERIENCE</div>
        <div className="space-y-3 text-[8px]">
          <div>
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-slate-900">[Volunteer.Role.1] - [Organization.1]</div>
              <div className="text-slate-600">[Volunteer.Dates.1]</div>
            </div>
            <div className="text-slate-700 leading-relaxed">[Volunteer.Description.1]</div>
          </div>
          <div>
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-slate-900">[Volunteer.Role.2] - [Organization.2]</div>
              <div className="text-slate-600">[Volunteer.Dates.2]</div>
            </div>
            <div className="text-slate-700 leading-relaxed">[Volunteer.Description.2]</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>References available upon request</div>
        <div className="mt-1">Last Updated: [Last.Updated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Resume</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid #2563eb;
    }
    .name {
      font-size: 2.25rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .title {
      font-size: 1.125rem;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 1.25rem;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #2563eb;
    }

    /* Core Competencies */
    .competencies-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .competency-item {
      background-color: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: #1e293b;
    }

    /* Experience Items */
    .experience-item {
      margin-bottom: 1.5rem;
    }
    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .experience-title {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
    }
    .experience-company {
      font-size: 0.7rem;
      color: #2563eb;
      font-weight: 600;
    }
    .experience-dates {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }
    .experience-details {
      margin-left: 1rem;
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    .experience-bullet {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .experience-bullet::before {
      content: "•";
      color: #2563eb;
      font-weight: bold;
    }

    /* Education Items */
    .education-item {
      margin-bottom: 1rem;
    }
    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }
    .education-degree {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
    }
    .education-school {
      font-size: 0.7rem;
      color: #2563eb;
      font-weight: 600;
    }
    .education-dates {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
    }
    .education-details {
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Certifications Grid */
    .certifications-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .certification-item {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .certification-name {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .certification-details {
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Technical Skills */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .skills-category {
      margin-bottom: 0.5rem;
    }
    .skills-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .skills-list {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Projects */
    .project-item {
      background-color: #dbeafe;
      border-left: 4px solid #2563eb;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.75rem;
    }
    .project-name {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .project-description {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
    }
    .project-tech {
      font-size: 0.65rem;
      color: #2563eb;
      font-weight: 600;
    }

    /* Awards Grid */
    .awards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .award-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.7rem;
    }
    .award-icon {
      color: #eab308;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .award-details h4 {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .award-details p {
      color: #64748b;
      font-size: 0.65rem;
    }

    /* Affiliations Grid */
    .affiliations-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .affiliation-item {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 0.5rem 0.75rem;
    }
    .affiliation-name {
      font-size: 0.7rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .affiliation-details {
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Languages Grid */
    .languages-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    .language-item {
      background-color: #dbeafe;
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #bfdbfe;
      text-align: center;
    }
    .language-name {
      font-size: 0.7rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .language-proficiency {
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Volunteer Experience */
    .volunteer-item {
      margin-bottom: 1rem;
    }
    .volunteer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }
    .volunteer-role {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
    }
    .volunteer-dates {
      font-size: 0.65rem;
      color: #64748b;
    }
    .volunteer-description {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Full.Name]</div>
    <div class="title">[Professional.Title]</div>
    <div class="contact-info">
      <div class="contact-item">
        <span>📧</span>
        <span>[Email.Address]</span>
      </div>
      <div class="contact-item">
        <span>📱</span>
        <span>[Phone.Number]</span>
      </div>
      <div class="contact-item">
        <span>📍</span>
        <span>[City], [State/Country]</span>
      </div>
      <div class="contact-item">
        <span>💼</span>
        <span>[LinkedIn.URL]</span>
      </div>
      <div class="contact-item">
        <span>🌐</span>
        <span>[Portfolio.Website]</span>
      </div>
    </div>
  </div>

  <!-- Professional Summary -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">PROFESSIONAL SUMMARY</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      [Professional.Summary.Paragraph] - A results-driven professional with [Years.Experience]+ years of experience in [Industry/Field]. Proven track record of [Key.Achievement.1], [Key.Achievement.2], and [Key.Achievement.3]. Seeking to leverage expertise in [Core.Skill.1] and [Core.Skill.2] to contribute to [Target.Company.Type]'s success.
    </div>
  </div>

  <!-- Core Competencies -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">CORE COMPETENCIES</div>
    <div class="competencies-grid">
      <div class="competency-item">[Competency.1]</div>
      <div class="competency-item">[Competency.2]</div>
      <div class="competency-item">[Competency.3]</div>
      <div class="competency-item">[Competency.4]</div>
      <div class="competency-item">[Competency.5]</div>
      <div class="competency-item">[Competency.6]</div>
      <div class="competency-item">[Competency.7]</div>
      <div class="competency-item">[Competency.8]</div>
      <div class="competency-item">[Competency.9]</div>
    </div>
  </div>

  <!-- Professional Experience -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">PROFESSIONAL EXPERIENCE</div>

    <!-- Job 1 -->
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-title">[Job.Title.1]</div>
          <div class="experience-company">[Company.Name.1] | [Company.Location.1]</div>
        </div>
        <div class="experience-dates">[Start.Date.1] – [End.Date.1]</div>
      </div>
      <div class="experience-details">
        <div class="experience-bullet">[Achievement.1.1] - Quantifiable result showing impact (e.g., "Increased sales by 35% through strategic marketing initiatives")</div>
        <div class="experience-bullet">[Achievement.1.2] - Specific responsibility with measurable outcome</div>
        <div class="experience-bullet">[Achievement.1.3] - Leadership or collaboration example</div>
        <div class="experience-bullet">[Achievement.1.4] - Technical skill or process improvement</div>
        <div class="experience-bullet">[Achievement.1.5] - Recognition or special project completion</div>
      </div>
    </div>

    <!-- Job 2 -->
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-title">[Job.Title.2]</div>
          <div class="experience-company">[Company.Name.2] | [Company.Location.2]</div>
        </div>
        <div class="experience-dates">[Start.Date.2] – [End.Date.2]</div>
      </div>
      <div class="experience-details">
        <div class="experience-bullet">[Achievement.2.1] - Key accomplishment with metrics</div>
        <div class="experience-bullet">[Achievement.2.2] - Process improvement or innovation</div>
        <div class="experience-bullet">[Achievement.2.3] - Team leadership or mentoring experience</div>
        <div class="experience-bullet">[Achievement.2.4] - Project management or strategic initiative</div>
        <div class="experience-bullet">[Achievement.2.5] - Client relationship or stakeholder management</div>
      </div>
    </div>

    <!-- Job 3 -->
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-title">[Job.Title.3]</div>
          <div class="experience-company">[Company.Name.3] | [Company.Location.3]</div>
        </div>
        <div class="experience-dates">[Start.Date.3] – [End.Date.3]</div>
      </div>
      <div class="experience-details">
        <div class="experience-bullet">[Achievement.3.1] - Demonstrated skill or accomplishment</div>
        <div class="experience-bullet">[Achievement.3.2] - Contribution to team or company goals</div>
        <div class="experience-bullet">[Achievement.3.3] - Technical proficiency or specialized knowledge</div>
        <div class="experience-bullet">[Achievement.3.4] - Problem-solving or analytical capability</div>
      </div>
    </div>

    <!-- Job 4 -->
    <div class="experience-item">
      <div class="experience-header">
        <div>
          <div class="experience-title">[Job.Title.4]</div>
          <div class="experience-company">[Company.Name.4] | [Company.Location.4]</div>
        </div>
        <div class="experience-dates">[Start.Date.4] – [End.Date.4]</div>
      </div>
      <div class="experience-details">
        <div class="experience-bullet">[Achievement.4.1] - Early career responsibility or learning</div>
        <div class="experience-bullet">[Achievement.4.2] - Foundation building experience</div>
        <div class="experience-bullet">[Achievement.4.3] - Key skill development or certification earned</div>
      </div>
    </div>
  </div>

  <!-- Education -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">EDUCATION</div>

    <div class="education-item">
      <div class="education-header">
        <div>
          <div class="education-degree">[Degree.1] in [Major.1]</div>
          <div class="education-school">[University.Name.1] | [University.Location.1]</div>
        </div>
        <div class="education-dates">[Graduation.Date.1]</div>
      </div>
      <div class="education-details">
        <div><span style="font-weight: 600;">GPA:</span> [GPA.1] | <span style="font-weight: 600;">Honors:</span> [Honors.1]</div>
        <div><span style="font-weight: 600;">Relevant Coursework:</span> [Coursework.1]</div>
      </div>
    </div>

    <div class="education-item">
      <div class="education-header">
        <div>
          <div class="education-degree">[Degree.2] in [Major.2]</div>
          <div class="education-school">[University.Name.2] | [University.Location.2]</div>
        </div>
        <div class="education-dates">[Graduation.Date.2]</div>
      </div>
      <div class="education-details">
        <div><span style="font-weight: 600;">Relevant Coursework:</span> [Coursework.2]</div>
      </div>
    </div>
  </div>

  <!-- Certifications -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">CERTIFICATIONS & LICENSES</div>
    <div class="certifications-grid">
      <div class="certification-item">
        <div class="certification-name">[Certification.1.Name]</div>
        <div class="certification-details">
          <div>[Issuing.Organization.1] | [Issue.Date.1]</div>
          <div>ID: [Certification.ID.1]</div>
        </div>
      </div>
      <div class="certification-item">
        <div class="certification-name">[Certification.2.Name]</div>
        <div class="certification-details">
          <div>[Issuing.Organization.2] | [Issue.Date.2]</div>
          <div>ID: [Certification.ID.2]</div>
        </div>
      </div>
      <div class="certification-item">
        <div class="certification-name">[Certification.3.Name]</div>
        <div class="certification-details">
          <div>[Issuing.Organization.3] | [Issue.Date.3]</div>
          <div>ID: [Certification.ID.3]</div>
        </div>
      </div>
      <div class="certification-item">
        <div class="certification-name">[Certification.4.Name]</div>
        <div class="certification-details">
          <div>[Issuing.Organization.4] | [Issue.Date.4]</div>
          <div>ID: [Certification.ID.4]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Technical Skills -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">TECHNICAL SKILLS</div>
    <div class="skills-grid">
      <div class="skills-category">
        <div class="skills-title">Programming & Development</div>
        <div class="skills-list">[Programming.Languages] | [Frameworks] | [Development.Tools]</div>
      </div>
      <div class="skills-category">
        <div class="skills-title">Software & Applications</div>
        <div class="skills-list">[Software.List] | [Design.Tools] | [Productivity.Tools]</div>
      </div>
      <div class="skills-category">
        <div class="skills-title">Databases & Cloud</div>
        <div class="skills-list">[Database.Systems] | [Cloud.Platforms] | [DevOps.Tools]</div>
      </div>
      <div class="skills-category">
        <div class="skills-title">Specialized Skills</div>
        <div class="skills-list">[Data.Analysis] | [Project.Management] | [Domain.Expertise]</div>
      </div>
    </div>
  </div>

  <!-- Projects -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">KEY PROJECTS & ACHIEVEMENTS</div>

    <div class="project-item">
      <div class="project-name">[Project.1.Name]</div>
      <div class="project-description">
        [Project.1.Description] - Impact: [Project.1.Impact]
      </div>
      <div class="project-tech">
        <strong>Technologies:</strong> [Project.1.Technologies]
      </div>
    </div>

    <div class="project-item">
      <div class="project-name">[Project.2.Name]</div>
      <div class="project-description">
        [Project.2.Description] - Impact: [Project.2.Impact]
      </div>
      <div class="project-tech">
        <strong>Technologies:</strong> [Project.2.Technologies]
      </div>
    </div>

    <div class="project-item">
      <div class="project-name">[Project.3.Name]</div>
      <div class="project-description">
        [Project.3.Description] - Impact: [Project.3.Impact]
      </div>
      <div class="project-tech">
        <strong>Technologies:</strong> [Project.3.Technologies]
      </div>
    </div>
  </div>

  <!-- Awards -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">AWARDS & RECOGNITION</div>
    <div class="awards-grid">
      <div class="award-item">
        <div class="award-icon">🏆</div>
        <div class="award-details">
          <h4>[Award.1.Name]</h4>
          <p>[Award.1.Organization] | [Award.1.Year]</p>
        </div>
      </div>
      <div class="award-item">
        <div class="award-icon">🏆</div>
        <div class="award-details">
          <h4>[Award.2.Name]</h4>
          <p>[Award.2.Organization] | [Award.2.Year]</p>
        </div>
      </div>
      <div class="award-item">
        <div class="award-icon">🏆</div>
        <div class="award-details">
          <h4>[Award.3.Name]</h4>
          <p>[Award.3.Organization] | [Award.3.Year]</p>
        </div>
      </div>
      <div class="award-item">
        <div class="award-icon">🏆</div>
        <div class="award-details">
          <h4>[Award.4.Name]</h4>
          <p>[Award.4.Organization] | [Award.4.Year]</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Professional Affiliations -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">PROFESSIONAL AFFILIATIONS</div>
    <div class="affiliations-grid">
      <div class="affiliation-item">
        <div class="affiliation-name">[Association.1.Name]</div>
        <div class="affiliation-details">[Association.1.Role] | [Association.1.Years]</div>
      </div>
      <div class="affiliation-item">
        <div class="affiliation-name">[Association.2.Name]</div>
        <div class="affiliation-details">[Association.2.Role] | [Association.2.Years]</div>
      </div>
      <div class="affiliation-item">
        <div class="affiliation-name">[Association.3.Name]</div>
        <div class="affiliation-details">[Association.3.Role] | [Association.3.Years]</div>
      </div>
      <div class="affiliation-item">
        <div class="affiliation-name">[Association.4.Name]</div>
        <div class="affiliation-details">[Association.4.Role] | [Association.4.Years]</div>
      </div>
    </div>
  </div>

  <!-- Languages -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">LANGUAGES</div>
    <div class="languages-grid">
      <div class="language-item">
        <div class="language-name">[Language.1]</div>
        <div class="language-proficiency">[Proficiency.1]</div>
      </div>
      <div class="language-item">
        <div class="language-name">[Language.2]</div>
        <div class="language-proficiency">[Proficiency.2]</div>
      </div>
      <div class="language-item">
        <div class="language-name">[Language.3]</div>
        <div class="language-proficiency">[Proficiency.3]</div>
      </div>
      <div class="language-item">
        <div class="language-name">[Language.4]</div>
        <div class="language-proficiency">[Proficiency.4]</div>
      </div>
    </div>
  </div>

  <!-- Volunteer Experience -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">VOLUNTEER EXPERIENCE</div>

    <div class="volunteer-item">
      <div class="volunteer-header">
        <div class="volunteer-role">[Volunteer.Role.1] - [Organization.1]</div>
        <div class="volunteer-dates">[Volunteer.Dates.1]</div>
      </div>
      <div class="volunteer-description">
        [Volunteer.Description.1]
      </div>
    </div>

    <div class="volunteer-item">
      <div class="volunteer-header">
        <div class="volunteer-role">[Volunteer.Role.2] - [Organization.2]</div>
        <div class="volunteer-dates">[Volunteer.Dates.2]</div>
      </div>
      <div class="volunteer-description">
        [Volunteer.Description.2]
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>References available upon request</div>
    <div style="margin-top: 0.25rem;">Last Updated: [Last.Updated.Date]</div>
  </div>
</body>
</html>
`
},
{
  id: 'professional-cover-letter-001',
  name: 'Professional Cover Letter',
  description: 'Modern professional cover letter template',
  category: 'resumes',
  popular: true,
  fields: ['Your Info', 'Company Info', 'Position', 'Opening', 'Body', 'Closing'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Your Information Header */}
      <div className="text-right mb-8">
        <div className="text-lg font-bold text-slate-900">[Your.Full.Name]</div>
        <div className="text-[8px] text-slate-600">[Your.Address]</div>
        <div className="text-[8px] text-slate-600">[Your.City], [Your.State] [Your.ZipCode]</div>
        <div className="text-[8px] text-slate-600">[Your.Phone.Number]</div>
        <div className="text-[8px] text-blue-600">[Your.Email.Address]</div>
        <div className="text-[8px] text-blue-600">[Your.LinkedIn.URL]</div>
      </div>

      {/* Date */}
      <div className="mb-6 text-[8px] text-slate-700">
        [Current.Date]
      </div>

      {/* Recipient Information */}
      <div className="mb-6">
        <div className="text-[8px] text-slate-700 leading-relaxed">
          <div className="font-bold">[Hiring.Manager.Name]</div>
          <div>[Hiring.Manager.Title]</div>
          <div className="font-bold">[Company.Name]</div>
          <div>[Company.Address]</div>
          <div>[Company.City], [Company.State] [Company.ZipCode]</div>
        </div>
      </div>

      {/* Salutation */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Hiring.Manager.Name] / Dear Hiring Manager,
      </div>

      {/* Opening Paragraph */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        I am writing to express my strong interest in the <span className="font-bold">[Position.Title]</span> position at <span className="font-bold">[Company.Name]</span>, as advertised on <span className="font-bold">[Job.Posting.Source]</span>. With <span className="font-bold">[Years.Of.Experience]</span> years of experience in <span className="font-bold">[Your.Industry/Field]</span> and a proven track record of <span className="font-bold">[Key.Achievement.Area]</span>, I am excited about the opportunity to contribute to your team's success and help <span className="font-bold">[Company.Name]</span> achieve its goals.
      </div>

      {/* Body Paragraph 1 - Your Qualifications */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        In my current role as <span className="font-bold">[Current.Job.Title]</span> at <span className="font-bold">[Current.Company.Name]</span>, I have successfully <span className="font-bold">[Major.Achievement.1]</span>, resulting in <span className="font-bold">[Quantifiable.Result.1]</span>. Additionally, I led <span className="font-bold">[Project.Or.Initiative]</span>, which <span className="font-bold">[Positive.Outcome]</span>. My expertise in <span className="font-bold">[Core.Skill.1]</span>, <span className="font-bold">[Core.Skill.2]</span>, and <span className="font-bold">[Core.Skill.3]</span> has enabled me to consistently deliver exceptional results and exceed performance targets.
      </div>

      {/* Body Paragraph 2 - Why This Company */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        What particularly attracts me to <span className="font-bold">[Company.Name]</span> is your <span className="font-bold">[Company.Quality.Or.Value]</span> and commitment to <span className="font-bold">[Company.Mission.Or.Goal]</span>. I am especially impressed by <span className="font-bold">[Specific.Company.Achievement.Or.Initiative]</span>, and I believe my background in <span className="font-bold">[Relevant.Experience.Area]</span> aligns perfectly with your organization's vision. I am confident that my experience with <span className="font-bold">[Relevant.Skill.Or.Tool]</span> and passion for <span className="font-bold">[Industry.Or.Field]</span> would make me a valuable addition to your team.
      </div>

      {/* Body Paragraph 3 - Additional Value */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        Beyond my technical capabilities, I bring strong <span className="font-bold">[Soft.Skill.1]</span> and <span className="font-bold">[Soft.Skill.2]</span> skills that have proven invaluable in <span className="font-bold">[Situation.Or.Context]</span>. My ability to <span className="font-bold">[Key.Ability]</span> has consistently resulted in <span className="font-bold">[Positive.Outcome.Or.Recognition]</span>. I am also <span className="font-bold">[Certification.Or.Qualification]</span>, which further strengthens my capability to excel in this role and contribute immediately to <span className="font-bold">[Company.Name]</span>'s objectives.
      </div>

      {/* Closing Paragraph */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        I am enthusiastic about the possibility of bringing my unique blend of skills, experience, and passion to the <span className="font-bold">[Position.Title]</span> role at <span className="font-bold">[Company.Name]</span>. I would welcome the opportunity to discuss how my background and qualifications align with your team's needs. Thank you for considering my application. I look forward to the possibility of speaking with you soon about how I can contribute to your continued success.
      </div>

      {/* Sign-off */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-12">Sincerely,</div>
        <div className="font-bold text-slate-900">[Your.Full.Name]</div>
      </div>

      {/* Enclosure */}
      <div className="mt-6 text-[7px] text-slate-500">
        Enclosure: Resume
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Cover Letter</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Your Information */
    .your-info {
      text-align: right;
      margin-bottom: 2rem;
    }
    .your-name {
      font-size: 1.125rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .your-details {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    /* Recipient Information */
    .recipient-info {
      margin-bottom: 1.5rem;
    }
    .recipient-name {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .recipient-details {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #1e293b;
    }

    /* Salutation */
    .salutation {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Content Text */
    .content-text {
      font-size: 0.75rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 1rem;
      text-align: justify;
    }

    /* Signature */
    .signature {
      margin-top: 2rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 1rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 3rem;
    }

    /* Enclosure */
    .enclosure {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <!-- Your Information -->
  <div class="your-info">
    <div class="your-name">[Your.Full.Name]</div>
    <div class="your-details">
      <div>[Your.Address]</div>
      <div>[Your.City], [Your.State] [Your.ZipCode]</div>
      <div>[Your.Phone.Number]</div>
      <div style="color: #2563eb;">[Your.Email.Address]</div>
      <div style="color: #2563eb;">[Your.LinkedIn.URL]</div>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient Information -->
  <div class="recipient-info">
    <div class="recipient-details">
      <div class="recipient-name">[Hiring.Manager.Name]</div>
      <div>[Hiring.Manager.Title]</div>
      <div class="company-name">[Company.Name]</div>
      <div>[Company.Address]</div>
      <div>[Company.City], [Company.State] [Company.ZipCode]</div>
    </div>
  </div>

  <!-- Salutation -->
  <div class="salutation">
    Dear [Hiring.Manager.Name] / Dear Hiring Manager,
  </div>

  <!-- Opening Paragraph -->
  <div class="content-text">
    I am writing to express my strong interest in the <span style="font-weight: bold;">[Position.Title]</span> position at <span style="font-weight: bold;">[Company.Name]</span>, as advertised on <span style="font-weight: bold;">[Job.Posting.Source]</span>. With <span style="font-weight: bold;">[Years.Of.Experience]</span> years of experience in <span style="font-weight: bold;">[Your.Industry/Field]</span> and a proven track record of <span style="font-weight: bold;">[Key.Achievement.Area]</span>, I am excited about the opportunity to contribute to your team's success and help <span style="font-weight: bold;">[Company.Name]</span> achieve its goals.
  </div>

  <!-- Body Paragraph 1 - Your Qualifications -->
  <div class="content-text">
    In my current role as <span style="font-weight: bold;">[Current.Job.Title]</span> at <span style="font-weight: bold;">[Current.Company.Name]</span>, I have successfully <span style="font-weight: bold;">[Major.Achievement.1]</span>, resulting in <span style="font-weight: bold;">[Quantifiable.Result.1]</span>. Additionally, I led <span style="font-weight: bold;">[Project.Or.Initiative]</span>, which <span style="font-weight: bold;">[Positive.Outcome]</span>. My expertise in <span style="font-weight: bold;">[Core.Skill.1]</span>, <span style="font-weight: bold;">[Core.Skill.2]</span>, and <span style="font-weight: bold;">[Core.Skill.3]</span> has enabled me to consistently deliver exceptional results and exceed performance targets.
  </div>

  <!-- Body Paragraph 2 - Why This Company -->
  <div class="content-text">
    What particularly attracts me to <span style="font-weight: bold;">[Company.Name]</span> is your <span style="font-weight: bold;">[Company.Quality.Or.Value]</span> and commitment to <span style="font-weight: bold;">[Company.Mission.Or.Goal]</span>. I am especially impressed by <span style="font-weight: bold;">[Specific.Company.Achievement.Or.Initiative]</span>, and I believe my background in <span style="font-weight: bold;">[Relevant.Experience.Area]</span> aligns perfectly with your organization's vision. I am confident that my experience with <span style="font-weight: bold;">[Relevant.Skill.Or.Tool]</span> and passion for <span style="font-weight: bold;">[Industry.Or.Field]</span> would make me a valuable addition to your team.
  </div>

  <!-- Body Paragraph 3 - Additional Value -->
  <div class="content-text">
    Beyond my technical capabilities, I bring strong <span style="font-weight: bold;">[Soft.Skill.1]</span> and <span style="font-weight: bold;">[Soft.Skill.2]</span> skills that have proven invaluable in <span style="font-weight: bold;">[Situation.Or.Context]</span>. My ability to <span style="font-weight: bold;">[Key.Ability]</span> has consistently resulted in <span style="font-weight: bold;">[Positive.Outcome.Or.Recognition]</span>. I am also <span style="font-weight: bold;">[Certification.Or.Qualification]</span>, which further strengthens my capability to excel in this role and contribute immediately to <span style="font-weight: bold;">[Company.Name]</span>'s objectives.
  </div>

  <!-- Closing Paragraph -->
  <div class="content-text">
    I am enthusiastic about the possibility of bringing my unique blend of skills, experience, and passion to the <span style="font-weight: bold;">[Position.Title]</span> role at <span style="font-weight: bold;">[Company.Name]</span>. I would welcome the opportunity to discuss how my background and qualifications align with your team's needs. Thank you for considering my application. I look forward to the possibility of speaking with you soon about how I can contribute to your continued success.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Sincerely,</div>
    <div class="signature-name">[Your.Full.Name]</div>
  </div>

  <!-- Enclosure -->
  <div class="enclosure">
    Enclosure: Resume
  </div>
</body>
</html>
`
},

{
  id: 'modern-cover-letter-001',
  name: 'Modern Cover Letter',
  description: 'Contemporary cover letter with visual design',
  category: 'resumes',
  popular: true,
  fields: ['Your Info', 'Company Info', 'Position', 'Skills', 'Achievements'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header with Color Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <div className="text-3xl font-bold mb-2">[Your.Full.Name]</div>
        <div className="text-sm mb-3">[Your.Professional.Title]</div>
        <div className="flex gap-4 text-[8px] flex-wrap">
          <div className="flex items-center gap-1">
            <span>📧</span>
            <span>[Your.Email]</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📱</span>
            <span>[Your.Phone]</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>[Your.City], [Your.State]</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💼</span>
            <span>[Your.LinkedIn]</span>
          </div>
        </div>
      </div>

      {/* Date and Recipient */}
      <div className="mb-6">
        <div className="text-[8px] text-slate-600 mb-4">[Current.Date]</div>
        <div className="bg-slate-50 border-l-4 border-indigo-600 p-4 rounded-r">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900">[Hiring.Manager.Name]</div>
            <div>[Hiring.Manager.Title]</div>
            <div className="font-bold text-indigo-600 mt-1">[Company.Name]</div>
            <div>[Company.Address]</div>
            <div>[Company.City], [Company.State] [Company.ZipCode]</div>
          </div>
        </div>
      </div>

      {/* Subject Line */}
      <div className="mb-4">
        <div className="bg-indigo-100 border-l-4 border-indigo-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-indigo-900">
            RE: Application for [Position.Title]
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Hiring.Manager.Name],
      </div>

      {/* Opening - Hook */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        When I discovered that <span className="font-bold text-indigo-600">[Company.Name]</span> was seeking a <span className="font-bold">[Position.Title]</span>, I knew I had to apply. As a passionate <span className="font-bold">[Your.Profession]</span> with <span className="font-bold">[Years.Experience]</span> years of experience driving <span className="font-bold">[Key.Result.Area]</span>, I am excited about the opportunity to bring my unique blend of skills and enthusiasm to your innovative team.
      </div>

      {/* Why You Section */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
          <div className="text-sm font-bold text-indigo-700 mb-2">🎯 WHY I'M THE RIGHT FIT</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            My track record speaks for itself: I've <span className="font-bold">[Major.Achievement.1.With.Numbers]</span>, <span className="font-bold">[Major.Achievement.2.With.Numbers]</span>, and <span className="font-bold">[Major.Achievement.3.With.Numbers]</span>. At <span className="font-bold">[Current.Company]</span>, I currently lead <span className="font-bold">[Current.Responsibility]</span>, where I've implemented <span className="font-bold">[Innovation.Or.Improvement]</span> that resulted in <span className="font-bold">[Quantifiable.Impact]</span>.
          </div>
        </div>
      </div>

      {/* Key Skills Highlight */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">💼 KEY STRENGTHS I BRING</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border-l-4 border-indigo-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-indigo-700 mb-1">[Strength.1.Title]</div>
            <div className="text-[7px] text-slate-600">[Strength.1.Brief.Example]</div>
          </div>
          <div className="bg-white border-l-4 border-purple-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-purple-700 mb-1">[Strength.2.Title]</div>
            <div className="text-[7px] text-slate-600">[Strength.2.Brief.Example]</div>
          </div>
          <div className="bg-white border-l-4 border-indigo-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-indigo-700 mb-1">[Strength.3.Title]</div>
            <div className="text-[7px] text-slate-600">[Strength.3.Brief.Example]</div>
          </div>
          <div className="bg-white border-l-4 border-purple-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-purple-700 mb-1">[Strength.4.Title]</div>
            <div className="text-[7px] text-slate-600">[Strength.4.Brief.Example]</div>
          </div>
        </div>
      </div>

      {/* Why This Company */}
      <div className="mb-4">
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r">
          <div className="text-sm font-bold text-purple-700 mb-2">🌟 WHY [Company.Name]?</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I've been following <span className="font-bold text-purple-600">[Company.Name]</span>'s journey, particularly impressed by <span className="font-bold">[Specific.Company.Achievement]</span>. Your commitment to <span className="font-bold">[Company.Value.Or.Mission]</span> resonates deeply with my professional values. I'm especially excited about <span className="font-bold">[Specific.Project.Or.Initiative]</span> and believe my expertise in <span className="font-bold">[Relevant.Skill]</span> could contribute significantly to this effort.
          </div>
        </div>
      </div>

      {/* Achievement Spotlight */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">🏆 ACHIEVEMENT SPOTLIGHT</div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            One accomplishment I'm particularly proud of: <span className="font-bold">[Detailed.Achievement.Story]</span>. This experience taught me <span className="font-bold">[Key.Lesson]</span> and demonstrated my ability to <span className="font-bold">[Key.Capability]</span> — skills directly applicable to the <span className="font-bold">[Position.Title]</span> role.
          </div>
        </div>
      </div>

      {/* What I'll Bring */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        In the <span className="font-bold text-indigo-600">[Position.Title]</span> role, I'm ready to hit the ground running. From day one, I'll bring <span className="font-bold">[Immediate.Contribution.1]</span>, <span className="font-bold">[Immediate.Contribution.2]</span>, and a proven ability to <span className="font-bold">[Key.Ability.Related.To.Role]</span>. My collaborative approach and passion for <span className="font-bold">[Industry.Or.Field]</span> will enable me to integrate seamlessly with your team while driving meaningful results.
      </div>

      {/* Call to Action */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg text-center">
          <div className="text-sm font-bold mb-2">LET'S CONNECT!</div>
          <div className="text-[8px] leading-relaxed">
            I would love the opportunity to discuss how my experience and passion align with <span className="font-bold">[Company.Name]</span>'s goals. I'm available for a conversation at your earliest convenience and can be reached at <span className="font-bold">[Your.Phone]</span> or <span className="font-bold">[Your.Email]</span>.
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        Thank you for considering my application. I'm genuinely excited about the possibility of contributing to <span className="font-bold text-indigo-600">[Company.Name]</span>'s continued success and look forward to hearing from you.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-8">Best regards,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
        <div className="text-slate-600">[Your.Professional.Title]</div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <div className="inline-block bg-slate-100 px-4 py-2 rounded-full text-[7px] text-slate-600">
          📎 Resume & Portfolio Attached
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Cover Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      background: linear-gradient(to right, #4f46e5, #7c3aed);
      color: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.8rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .title {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.7rem;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient Box */
    .recipient-box {
      background-color: #f8fafc;
      border-left: 4px solid #4f46e5;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
    }
    .recipient-name {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .company-name {
      font-weight: bold;
      color: #4f46e5;
      margin: 0.25rem 0;
    }
    .recipient-details {
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Subject Box */
    .subject-box {
      background-color: #e0e7ff;
      border-left: 4px solid #4f46e5;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e3a8a;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Highlight Boxes */
    .highlight-box {
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .why-fit-box {
      background: linear-gradient(to right, #e0e7ff, #c7d2fe);
      border: 2px solid #c7d2fe;
    }
    .why-company-box {
      background-color: #e9d5ff;
      border-left: 4px solid #7c3aed;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .achievement-box {
      background: linear-gradient(to right, #fef3c7, #fde68a);
      border: 2px solid #f59e0b;
      border-radius: 0.5rem;
    }

    /* Skills Grid */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .skill-box {
      background-color: #fff;
      border-left: 4px solid #4f46e5;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .skill-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 0.25rem;
    }
    .skill-description {
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Call to Action Box */
    .cta-box {
      background: linear-gradient(to right, #4f46e5, #7c3aed);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .cta-title {
      font-size: 0.875rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .cta-text {
      font-size: 0.7rem;
      line-height: 1.4;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 1.5rem;
    }
    .footer-badge {
      display: inline-block;
      background-color: #f8fafc;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-size: 0.65rem;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Professional.Title]</div>
    <div class="contact-info">
      <div class="contact-item">
        <span>📧</span>
        <span>[Your.Email]</span>
      </div>
      <div class="contact-item">
        <span>📱</span>
        <span>[Your.Phone]</span>
      </div>
      <div class="contact-item">
        <span>📍</span>
        <span>[Your.City], [Your.State]</span>
      </div>
      <div class="contact-item">
        <span>💼</span>
        <span>[Your.LinkedIn]</span>
      </div>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient-box">
    <div class="recipient-name">[Hiring.Manager.Name]</div>
    <div class="recipient-details">[Hiring.Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div class="recipient-details">[Company.Address]</div>
    <div class="recipient-details">[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    RE: Application for [Position.Title]
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Hiring.Manager.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    When I discovered that <span style="font-weight: bold; color: #4f46e5;">[Company.Name]</span> was seeking a <span style="font-weight: bold;">[Position.Title]</span>, I knew I had to apply. As a passionate <span style="font-weight: bold;">[Your.Profession]</span> with <span style="font-weight: bold;">[Years.Experience]</span> years of experience driving <span style="font-weight: bold;">[Key.Result.Area]</span>, I am excited about the opportunity to bring my unique blend of skills and enthusiasm to your innovative team.
  </div>

  <!-- Why You're the Right Fit -->
  <div class="highlight-box why-fit-box">
    <div class="section-header">
      🎯 WHY I'M THE RIGHT FIT
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      My track record speaks for itself: I've <span style="font-weight: bold;">[Major.Achievement.1.With.Numbers]</span>, <span style="font-weight: bold;">[Major.Achievement.2.With.Numbers]</span>, and <span style="font-weight: bold;">[Major.Achievement.3.With.Numbers]</span>. At <span style="font-weight: bold;">[Current.Company]</span>, I currently lead <span style="font-weight: bold;">[Current.Responsibility]</span>, where I've implemented <span style="font-weight: bold;">[Innovation.Or.Improvement]</span> that resulted in <span style="font-weight: bold;">[Quantifiable.Impact]</span>.
    </div>
  </div>

  <!-- Key Strengths -->
  <div class="section-header">💼 KEY STRENGTHS I BRING</div>
  <div class="skills-grid">
    <div class="skill-box">
      <div class="skill-title">[Strength.1.Title]</div>
      <div class="skill-description">[Strength.1.Brief.Example]</div>
    </div>
    <div class="skill-box" style="border-left-color: #7c3aed;">
      <div class="skill-title" style="color: #7c3aed;">[Strength.2.Title]</div>
      <div class="skill-description">[Strength.2.Brief.Example]</div>
    </div>
    <div class="skill-box">
      <div class="skill-title">[Strength.3.Title]</div>
      <div class="skill-description">[Strength.3.Brief.Example]</div>
    </div>
    <div class="skill-box" style="border-left-color: #7c3aed;">
      <div class="skill-title" style="color: #7c3aed;">[Strength.4.Title]</div>
      <div class="skill-description">[Strength.4.Brief.Example]</div>
    </div>
  </div>

  <!-- Why This Company -->
  <div class="why-company-box">
    <div class="section-header">
      🌟 WHY [Company.Name]?
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      I've been following <span style="font-weight: bold; color: #7c3aed;">[Company.Name]</span>'s journey, particularly impressed by <span style="font-weight: bold;">[Specific.Company.Achievement]</span>. Your commitment to <span style="font-weight: bold;">[Company.Value.Or.Mission]</span> resonates deeply with my professional values. I'm especially excited about <span style="font-weight: bold;">[Specific.Project.Or.Initiative]</span> and believe my expertise in <span style="font-weight: bold;">[Relevant.Skill]</span> could contribute significantly to this effort.
    </div>
  </div>

  <!-- Achievement Spotlight -->
  <div class="achievement-box">
    <div class="section-header">
      🏆 ACHIEVEMENT SPOTLIGHT
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      One accomplishment I'm particularly proud of: <span style="font-weight: bold;">[Detailed.Achievement.Story]</span>. This experience taught me <span style="font-weight: bold;">[Key.Lesson]</span> and demonstrated my ability to <span style="font-weight: bold;">[Key.Capability]</span> — skills directly applicable to the <span style="font-weight: bold;">[Position.Title]</span> role.
    </div>
  </div>

  <!-- What You'll Bring -->
  <div class="content-text">
    In the <span style="font-weight: bold; color: #4f46e5;">[Position.Title]</span> role, I'm ready to hit the ground running. From day one, I'll bring <span style="font-weight: bold;">[Immediate.Contribution.1]</span>, <span style="font-weight: bold;">[Immediate.Contribution.2]</span>, and a proven ability to <span style="font-weight: bold;">[Key.Ability.Related.To.Role]</span>. My collaborative approach and passion for <span style="font-weight: bold;">[Industry.Or.Field]</span> will enable me to integrate seamlessly with your team while driving meaningful results.
  </div>

  <!-- Call to Action -->
  <div class="cta-box">
    <div class="cta-title">LET'S CONNECT!</div>
    <div class="cta-text">
      I would love the opportunity to discuss how my experience and passion align with <span style="font-weight: bold;">[Company.Name]</span>'s goals. I'm available for a conversation at your earliest convenience and can be reached at <span style="font-weight: bold;">[Your.Phone]</span> or <span style="font-weight: bold;">[Your.Email]</span>.
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    Thank you for considering my application. I'm genuinely excited about the possibility of contributing to <span style="font-weight: bold; color: #4f46e5;">[Company.Name]</span>'s continued success and look forward to hearing from you.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Best regards,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Professional.Title]</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-badge">
      📎 Resume & Portfolio Attached
    </div>
  </div>
</body>
</html>
`
},

{
id: 'resignation-letter-immediate-001',
name: 'Immediate Resignation Letter',
description: 'Resignation letter without notice period (emergency situations)',
category: 'resumes',
popular: false,
fields: ['Effective Date', 'Brief Reason', 'Circumstances', 'Apology'],
previewComponent: (
<div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
{/* Header */}
<div className="border-b-4 border-red-600 pb-4 mb-6">
<div className="text-2xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
<div className="text-sm text-slate-700 mb-2">[Your.Current.Position]</div>
<div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
<span>📧 [Your.Email]</span>
<span>📱 [Your.Phone]</span>
<span>🏢 [Department.Name]</span>
</div>
</div>
  {/* Date */}
  <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

  {/* Recipient */}
  <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
    <div className="font-bold">[Manager.Name]</div>
    <div>[Manager.Title]</div>
    <div className="font-bold">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  {/* Subject - Urgent */}
  <div className="mb-4">
    <div className="bg-red-100 border-l-4 border-red-600 p-3 rounded-r">
      <div className="text-[8px] font-bold text-red-900">
        Re: Immediate Resignation - [Your.Full.Name] - Effective [Effective.Date]
      </div>
    </div>
  </div>

  {/* Greeting */}
  <div className="mb-4 text-[8px] text-slate-700">
    Dear [Manager.Name],
  </div>

  {/* Opening - Clear Statement */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    I am writing to inform you of my immediate resignation from my position as <span className="font-bold">[Your.Current.Position]</span> at <span className="font-bold">[Company.Name]</span>, effective <span className="font-bold bg-red-100 px-1">[Effective.Date: today / immediately]</span>. I understand this does not provide the standard notice period, and I sincerely apologize for any inconvenience this may cause.
  </div>

  {/* Urgent Notice Box */}
  <div className="mb-4">
    <div className="bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 rounded-lg p-4 text-center">
      <div className="text-[10px] text-red-800 font-bold mb-2">⚠️ IMMEDIATE RESIGNATION NOTICE</div>
      <div className="text-2xl font-bold text-red-700 mb-2">Effective: [Effective.Date]</div>
      <div className="text-[7px] text-red-700">Unable to provide standard notice period due to unforeseen circumstances</div>
    </div>
  </div>

  {/* Reason (Brief & General) */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    This decision is due to <span className="font-bold">[Brief.General.Reason: unforeseen personal circumstances / a family emergency / urgent health matters / circumstances beyond my control]</span> that require my immediate attention and make it impossible for me to continue in my current role.
  </div>

  {/* Acceptable Reasons (Choose One) */}
  <div className="mb-4 bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r">
    <div className="text-[7px] text-slate-600 italic">
      <strong>Sample Reasons (Use ONE - Keep Vague):</strong>
      <div className="mt-1 space-y-1">
        <div>• "Due to an urgent family emergency requiring my immediate and full attention..."</div>
        <div>• "Due to unforeseen personal health circumstances that require immediate care..."</div>
        <div>• "Due to a sudden family medical situation requiring my presence..."</div>
        <div>• "Due to circumstances beyond my control that have arisen unexpectedly..."</div>
        <div>• "Due to a personal crisis that requires my immediate focus..."</div>
        <div><strong>Note:</strong> You are NOT required to provide detailed medical or personal information</div>
      </div>
    </div>
  </div>

  {/* Apology & Acknowledgment */}
  <div className="mb-4">
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
      <div className="text-sm font-bold text-yellow-800 mb-2">🙏 SINCERE APOLOGY</div>
      <div className="text-[8px] text-slate-700 leading-relaxed">
        I deeply regret that I am unable to provide the customary <span className="font-bold">[Standard.Notice.Period]</span> notice period. I understand this creates challenges for the team and the organization, and I sincerely apologize for any disruption this causes. This decision was not made lightly, and I would have provided proper notice if circumstances had allowed.
      </div>
    </div>
  </div>

  {/* Limited Transition Assistance */}
  <div className="mb-4">
    <div className="text-sm font-bold text-slate-900 mb-2 border-b-2 border-slate-300 pb-1">📋 TRANSITION ASSISTANCE (To the Extent Possible)</div>
    <div className="text-[8px] text-slate-700 leading-relaxed">
      While I am unable to work a notice period, I will do my best to assist with the transition:
      
      <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold flex-shrink-0">◆</span>
            <div>I have prepared <span className="font-bold">[brief notes / a basic summary]</span> of my current projects and their status</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold flex-shrink-0">◆</span>
            <div>Critical contact information for <span className="font-bold">[Key.Clients.Or.Vendors]</span> is documented in <span className="font-bold">[Location]</span></div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold flex-shrink-0">◆</span>
            <div>Important files are located in <span className="font-bold">[File.Location.Or.System]</span></div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-600 font-bold flex-shrink-0">◆</span>
            <div>I am available for <span className="font-bold">[brief phone/email questions]</span> over the next <span className="font-bold">[few days/week]</span> if absolutely necessary at <span className="font-bold">[Your.Personal.Email]</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Gratitude (Even in Difficult Circumstances) */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    Despite the circumstances of my departure, I want to express my gratitude for the opportunities I had during my time at <span className="font-bold">[Company.Name]</span>. I learned <span className="font-bold">[Something.Positive]</span> and appreciated working with <span className="font-bold">[Team.Or.Colleagues]</span>.
  </div>

  {/* Company Property Return */}
  <div className="mb-4">
    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r">
      <div className="text-sm font-bold text-blue-700 mb-2">🔑 COMPANY PROPERTY</div>
      <div className="text-[8px] text-slate-700 leading-relaxed">
        I will return all company property including:
        <div className="mt-2 grid grid-cols-2 gap-2 text-[7px]">
          <div>☐ Laptop/Computer</div>
          <div>☐ Office Keys/Access Cards</div>
          <div>☐ Company Phone</div>
          <div>☐ Documents/Files</div>
          <div>☐ [Other.Equipment]</div>
          <div>☐ [Other.Property]</div>
        </div>
        <div className="mt-2">
          Please advise on the preferred method for returning these items: <span className="font-bold">[in person / by mail / via courier]</span>.
        </div>
      </div>
    </div>
  </div>

  {/* Final Matters */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    Please send information regarding final paycheck, accrued time off, benefits continuation (COBRA), and any other administrative matters to <span className="font-bold">[Your.Personal.Email]</span> or <span className="font-bold">[Your.Mailing.Address]</span>.
  </div>

  {/* Contact Information */}
  <div className="mb-4">
    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
      <div className="text-sm font-bold text-green-700 mb-2">📞 CONTACT INFORMATION</div>
      <div className="text-[8px] text-slate-700">
        After [Effective.Date], please reach me at:
        <div className="mt-2 bg-white rounded-lg p-3 border border-green-200">
          <div className="space-y-1">
            <div><span className="font-bold">Personal Email:</span> [Your.Personal.Email]</div>
            <div><span className="font-bold">Phone:</span> [Your.Personal.Phone]</div>
            <div><span className="font-bold">Mailing Address:</span> [Your.Personal.Address]</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Closing - Professional Despite Circumstances */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    I sincerely apologize once again for the abrupt nature of this resignation and any difficulties it creates. I wish <span className="font-bold">[Company.Name]</span> and the team continued success.
  </div>

  {/* Signature */}
  <div className="mt-6 text-[8px] text-slate-700">
    <div className="mb-10">Respectfully,</div>
    <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
    <div className="text-slate-600">[Your.Current.Position]</div>
    <div className="text-slate-600 mt-2">
      <div>Personal Email: [Your.Personal.Email]</div>
      <div>Phone: [Your.Personal.Phone]</div>
    </div>
  </div>

  {/* CC Line */}
  <div className="mt-6 text-[7px] text-slate-500">
    cc: [HR.Department] / [HR.Director.Name]
  </div>

  {/* Important Notice */}
  <div className="mt-8 bg-red-50 border-2 border-red-400 rounded-lg p-4">
    <div className="text-[8px] font-bold text-red-900 mb-2">⚠️ IMPORTANT - IMMEDIATE RESIGNATION CONSIDERATIONS:</div>
    <div className="text-[7px] text-slate-700 leading-relaxed space-y-1">
      <div>• <strong>Legal Review:</strong> Check your employment contract for consequences of not providing notice</div>
      <div>• <strong>Potential Penalties:</strong> Some contracts may include forfeit of final pay, bonuses, or benefits</div>
      <div>• <strong>Reference Impact:</strong> Leaving without notice may affect future references</div>
      <div>• <strong>Industry Reputation:</strong> Consider how this may impact your professional reputation</div>
      <div>• <strong>Bridge Burning:</strong> Use immediate resignation only when absolutely necessary</div>
      <div>• <strong>Document Everything:</strong> Keep copies of all communications</div>
      <div>• <strong>Valid Reasons:</strong> Only use for genuine emergencies (health, family crisis, unsafe work environment)</div>
      <div>• <strong>Consider Alternatives:</strong> Paid leave, FMLA, or negotiated early departure may be options</div>
    </div>
  </div>
</div>
),
htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Immediate Resignation Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #dc2626;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #1e293b;
    }

    /* Subject Box */
    .subject-box {
      background-color: #fee2e2;
      border-left: 4px solid #dc2626;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #7f1d1d;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Urgent Notice Box */
    .urgent-notice {
      background: linear-gradient(to right, #fee2e2, #fecaca);
      border: 2px solid #f87171;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .urgent-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #991b1b;
      margin-bottom: 0.5rem;
    }
    .urgent-date {
      font-size: 1.5rem;
      font-weight: bold;
      color: #b91c1c;
      margin-bottom: 0.5rem;
    }
    .urgent-note {
      font-size: 0.65rem;
      color: #991b1b;
    }

    /* Apology Box */
    .apology-box {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .apology-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    /* Transition Box */
    .transition-box {
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .transition-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .transition-list {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }
    .transition-item {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .transition-bullet {
      color: #ea580c;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Company Property Box */
    .property-box {
      background-color: #dbeafe;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
    }
    .property-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    .property-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .property-item {
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Contact Box */
    .contact-box {
      background-color: #dcfce7;
      border: 2px solid #bbf7d0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .contact-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #166534;
      margin-bottom: 0.5rem;
    }
    .contact-details {
      background-color: #fff;
      border: 1px solid #bbf7d0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }
    .contact-item {
      margin-bottom: 0.25rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Alternative Reasons Box */
    .alternative-box {
      background-color: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
      font-size: 0.65rem;
      color: #64748b;
      font-style: italic;
    }
    .alternative-item {
      margin-top: 0.25rem;
    }

    /* Important Notice Box */
    .important-notice {
      background-color: #fee2e2;
      border: 2px solid #f87171;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 2rem;
    }
    .notice-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #7f1d1d;
      margin-bottom: 0.5rem;
    }
    .notice-list {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
    }
    .notice-item {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .notice-item::before {
      content: "•";
      color: #dc2626;
      font-weight: bold;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }
    .signature-details {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    /* CC Line */
    .cc-line {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Current.Position]</div>
    <div class="contact-info">
      <span>📧 [Your.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>🏢 [Department.Name]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name" style="font-weight: bold;">[Manager.Name]</div>
    <div>[Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Re: Immediate Resignation - [Your.Full.Name] - Effective [Effective.Date]
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Manager.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    I am writing to inform you of my immediate resignation from my position as <span style="font-weight: bold;">[Your.Current.Position]</span> at <span style="font-weight: bold;">[Company.Name]</span>, effective <span style="font-weight: bold; background-color: #fee2e2; padding: 0 0.25rem;">[Effective.Date: today / immediately]</span>. I understand this does not provide the standard notice period, and I sincerely apologize for any inconvenience this may cause.
  </div>

  <!-- Urgent Notice Box -->
  <div class="urgent-notice">
    <div class="urgent-title">⚠️ IMMEDIATE RESIGNATION NOTICE</div>
    <div class="urgent-date">Effective: [Effective.Date]</div>
    <div class="urgent-note">Unable to provide standard notice period due to unforeseen circumstances</div>
  </div>

  <!-- Reason -->
  <div class="content-text">
    This decision is due to <span style="font-weight: bold;">[Brief.General.Reason: unforeseen personal circumstances / a family emergency / urgent health matters / circumstances beyond my control]</span> that require my immediate attention and make it impossible for me to continue in my current role.
  </div>

  <!-- Alternative Reasons -->
  <div class="alternative-box">
    <div><strong>Sample Reasons (Use ONE - Keep Vague):</strong></div>
    <div class="alternative-item">• "Due to an urgent family emergency requiring my immediate and full attention..."</div>
    <div class="alternative-item">• "Due to unforeseen personal health circumstances that require immediate care..."</div>
    <div class="alternative-item">• "Due to a sudden family medical situation requiring my presence..."</div>
    <div class="alternative-item">• "Due to circumstances beyond my control that have arisen unexpectedly..."</div>
    <div class="alternative-item">• "Due to a personal crisis that requires my immediate focus..."</div>
    <div class="alternative-item"><strong>Note:</strong> You are NOT required to provide detailed medical or personal information</div>
  </div>

  <!-- Apology -->
  <div class="apology-box">
    <div class="apology-title">🙏 SINCERE APOLOGY</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      I deeply regret that I am unable to provide the customary <span style="font-weight: bold;">[Standard.Notice.Period]</span> notice period. I understand this creates challenges for the team and the organization, and I sincerely apologize for any disruption this causes. This decision was not made lightly, and I would have provided proper notice if circumstances had allowed.
    </div>
  </div>

  <!-- Limited Transition Assistance -->
  <div class="transition-box">
    <div class="transition-title">📋 TRANSITION ASSISTANCE (To the Extent Possible)</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      While I am unable to work a notice period, I will do my best to assist with the transition:
      <div class="transition-list">
        <div class="transition-item">
          <div class="transition-bullet">◆</div>
          <div>I have prepared <span style="font-weight: bold;">[brief notes / a basic summary]</span> of my current projects and their status</div>
        </div>
        <div class="transition-item">
          <div class="transition-bullet">◆</div>
          <div>Critical contact information for <span style="font-weight: bold;">[Key.Clients.Or.Vendors]</span> is documented in <span style="font-weight: bold;">[Location]</span></div>
        </div>
        <div class="transition-item">
          <div class="transition-bullet">◆</div>
          <div>Important files are located in <span style="font-weight: bold;">[File.Location.Or.System]</span></div>
        </div>
        <div class="transition-item">
          <div class="transition-bullet">◆</div>
          <div>I am available for <span style="font-weight: bold;">[brief phone/email questions]</span> over the next <span style="font-weight: bold;">[few days/week]</span> if absolutely necessary at <span style="font-weight: bold;">[Your.Personal.Email]</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Gratitude -->
  <div class="content-text">
    Despite the circumstances of my departure, I want to express my gratitude for the opportunities I had during my time at <span style="font-weight: bold;">[Company.Name]</span>. I learned <span style="font-weight: bold;">[Something.Positive]</span> and appreciated working with <span style="font-weight: bold;">[Team.Or.Colleagues]</span>.
  </div>

  <!-- Company Property -->
  <div class="property-box">
    <div class="property-title">🔑 COMPANY PROPERTY</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      I will return all company property including:
      <div class="property-grid">
        <div class="property-item">☐ Laptop/Computer</div>
        <div class="property-item">☐ Office Keys/Access Cards</div>
        <div class="property-item">☐ Company Phone</div>
        <div class="property-item">☐ Documents/Files</div>
        <div class="property-item">☐ [Other.Equipment]</div>
        <div class="property-item">☐ [Other.Property]</div>
      </div>
      <div style="margin-top: 0.5rem;">
        Please advise on the preferred method for returning these items: <span style="font-weight: bold;">[in person / by mail / via courier]</span>.
      </div>
    </div>
  </div>

  <!-- Final Matters -->
  <div class="content-text">
    Please send information regarding final paycheck, accrued time off, benefits continuation (COBRA), and any other administrative matters to <span style="font-weight: bold;">[Your.Personal.Email]</span> or <span style="font-weight: bold;">[Your.Mailing.Address]</span>.
  </div>

  <!-- Contact Information -->
  <div class="contact-box">
    <div class="contact-title">📞 CONTACT INFORMATION</div>
    <div style="font-size: 0.7rem; color: #64748b;">
      After [Effective.Date], please reach me at:
      <div class="contact-details">
        <div class="contact-item"><span style="font-weight: bold;">Personal Email:</span> [Your.Personal.Email]</div>
        <div class="contact-item"><span style="font-weight: bold;">Phone:</span> [Your.Personal.Phone]</div>
        <div class="contact-item"><span style="font-weight: bold;">Mailing Address:</span> [Your.Personal.Address]</div>
      </div>
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    I sincerely apologize once again for the abrupt nature of this resignation and any difficulties it creates. I wish <span style="font-weight: bold;">[Company.Name]</span> and the team continued success.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Respectfully,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div class="signature-details">
      <div>[Your.Current.Position]</div>
      <div style="margin-top: 0.5rem;">
        <div>Personal Email: [Your.Personal.Email]</div>
        <div>Phone: [Your.Personal.Phone]</div>
      </div>
    </div>
  </div>

  <!-- CC Line -->
  <div class="cc-line">
    cc: [HR.Department] / [HR.Director.Name]
  </div>

  <!-- Important Notice -->
  <div class="important-notice">
    <div class="notice-title">⚠️ IMPORTANT - IMMEDIATE RESIGNATION CONSIDERATIONS:</div>
    <div class="notice-list">
      <div class="notice-item">Legal Review: Check your employment contract for consequences of not providing notice</div>
      <div class="notice-item">Potential Penalties: Some contracts may include forfeit of final pay, bonuses, or benefits</div>
      <div class="notice-item">Reference Impact: Leaving without notice may affect future references</div>
      <div class="notice-item">Industry Reputation: Consider how this may impact your professional reputation</div>
      <div class="notice-item">Bridge Burning: Use immediate resignation only when absolutely necessary</div>
      <div class="notice-item">Document Everything: Keep copies of all communications</div>
      <div class="notice-item">Valid Reasons: Only use for genuine emergencies (health, family crisis, unsafe work environment)</div>
      <div class="notice-item">Consider Alternatives: Paid leave, FMLA, or negotiated early departure may be options</div>
    </div>
  </div>
</body>
</html>
`
},

{
  id: 'resignation-letter-001',
  name: 'Professional Resignation Letter',
  description: 'Formal resignation letter with notice period',
  category: 'resumes',
  popular: true,
  fields: ['Last Day', 'Notice Period', 'Reason', 'Gratitude', 'Transition'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-4 border-slate-700 pb-4 mb-6">
        <div className="text-2xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
        <div className="text-sm text-slate-700 mb-2">[Your.Current.Position]</div>
        <div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
          <span>📧 [Your.Work.Email]</span>
          <span>📱 [Your.Phone]</span>
          <span>🏢 [Department.Name]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Manager.Name]</div>
        <div>[Manager.Title]</div>
        <div className="font-bold">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="bg-slate-100 border-l-4 border-slate-700 p-3 rounded-r">
          <div className="text-[8px] font-bold text-slate-900">
            Re: Resignation - [Your.Full.Name]
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Manager.Name],
      </div>

      {/* Opening - Clear Statement of Resignation */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am writing to formally notify you of my resignation from my position as <span className="font-bold">[Your.Current.Position]</span> at <span className="font-bold">[Company.Name]</span>. Per my employment contract and company policy, I am providing <span className="font-bold">[Notice.Period: two weeks / 30 days]</span> notice. My last day of work will be <span className="font-bold bg-yellow-100 px-1">[Last.Working.Day]</span>.
      </div>

      {/* Notice Period Box */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-slate-300 rounded-lg p-4 text-center">
          <div className="text-[7px] text-slate-600 font-bold mb-2">OFFICIAL NOTICE</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[7px] text-slate-600 mb-1">Resignation Date</div>
              <div className="text-sm font-bold text-slate-900">[Current.Date]</div>
            </div>
            <div className="border-x border-slate-300">
              <div className="text-[7px] text-slate-600 mb-1">Notice Period</div>
              <div className="text-sm font-bold text-slate-900">[Notice.Period]</div>
            </div>
            <div>
              <div className="text-[7px] text-slate-600 mb-1">Last Working Day</div>
              <div className="text-sm font-bold text-red-700">[Last.Working.Day]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason (Optional - Keep Brief and Positive) */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        This decision was not made lightly. After careful consideration, I have accepted a position that will allow me to <span className="font-bold">[Brief.Positive.Reason: further my career development / pursue new challenges / relocate for family reasons / explore a different industry]</span>. While I'm excited about this new opportunity, I want to ensure a smooth transition and maintain the positive relationships I've built here.
      </div>

      {/* Alternative Reasons (Choose One) */}
      <div className="mb-4 bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r">
        <div className="text-[7px] text-slate-600 italic">
          <strong>Alternative Reason Examples (Use ONE):</strong>
          <div className="mt-1 space-y-1">
            <div>• "I have decided to pursue an advanced degree in [Field] to further my professional development."</div>
            <div>• "I have accepted a position that offers new challenges and opportunities for growth in [Area]."</div>
            <div>• "Due to personal/family circumstances, I need to [relocate/take time off/change my work situation]."</div>
            <div>• "After much reflection, I've decided to transition into [New.Industry.Or.Role]."</div>
            <div>• "I've been presented with an opportunity that aligns more closely with my long-term career goals."</div>
          </div>
        </div>
      </div>

      {/* Gratitude & Positive Reflection */}
      <div className="mb-4">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="text-sm font-bold text-blue-700 mb-2">🙏 GRATITUDE & APPRECIATION</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I want to express my sincere gratitude for the opportunities I've had during my time at <span className="font-bold">[Company.Name]</span>. Over the past <span className="font-bold">[Years/Months.At.Company]</span>, I have:
            
            <div className="mt-2 space-y-1">
              <div>• Developed valuable skills in <span className="font-bold">[Skill.Area.1]</span> and <span className="font-bold">[Skill.Area.2]</span></div>
              <div>• Had the privilege of working on <span className="font-bold">[Notable.Project.Or.Achievement]</span></div>
              <div>• Learned from exceptional colleagues and mentors, particularly <span className="font-bold">[Mentor.Or.Team.Member]</span></div>
              <div>• Grown professionally through <span className="font-bold">[Training.Opportunity.Or.Experience]</span></div>
              <div>• Built lasting relationships with talented professionals</div>
            </div>
            
            <div className="mt-2">
              These experiences have been invaluable to my professional growth, and I will carry the lessons learned here throughout my career.
            </div>
          </div>
        </div>
      </div>

      {/* Transition Commitment */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2 border-b-2 border-slate-300 pb-1">🔄 COMMITMENT TO SMOOTH TRANSITION</div>
        <div className="text-[8px] text-slate-700 leading-relaxed">
          I am fully committed to ensuring a seamless transition during my remaining time. To facilitate this, I will:
          
          <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Document Current Projects:</span> Complete comprehensive documentation of all ongoing projects, including <span className="font-bold">[Project.1]</span>, <span className="font-bold">[Project.2]</span>, and <span className="font-bold">[Project.3]</span></div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Knowledge Transfer:</span> Provide detailed handover notes and conduct training sessions with <span className="font-bold">[Successor.Or.Team.Member]</span></div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Client/Stakeholder Communication:</span> Assist in transitioning relationships with key clients/stakeholders including <span className="font-bold">[Key.Contact.1]</span> and <span className="font-bold">[Key.Contact.2]</span></div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Complete Pending Tasks:</span> Finalize <span className="font-bold">[Specific.Deliverable]</span> and bring <span className="font-bold">[Project.Name]</span> to a logical stopping point</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Train Replacement:</span> Spend time training my replacement or designated team member(s) on critical responsibilities</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <div><span className="font-bold">Organize Files:</span> Ensure all files, passwords, and resources are properly organized and accessible</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability During Notice Period */}
      <div className="mb-4">
        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r">
          <div className="text-sm font-bold text-green-700 mb-2">📅 MY AVAILABILITY</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            During my notice period, I will be fully available and committed to my responsibilities. I'm happy to:
            <div className="mt-2 space-y-1">
              <div>• Work my regular hours through [Last.Working.Day]</div>
              <div>• Attend any necessary transition meetings</div>
              <div>• Be available for questions after my departure (within reason) via <span className="font-bold">[Personal.Email]</span></div>
              <div>• Assist with recruitment/interviews for my replacement if needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Items */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">📋 ADMINISTRATIVE MATTERS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Please let me know the process for:
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Return of company property (laptop, keys, access cards, etc.)
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Final paycheck and accrued vacation/PTO payout
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Benefits continuation (COBRA, 401k rollover, etc.)
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Exit interview scheduling
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Reference letters or recommendations
              </div>
              <div className="bg-white rounded p-2 border border-slate-200 text-[7px]">
                ✓ Final paperwork and documentation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future Connection */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I hope to maintain our professional relationship going forward. Please feel free to reach me at <span className="font-bold">[Your.Personal.Email]</span> or <span className="font-bold">[Your.Personal.Phone]</span> after my departure. I would be happy to stay connected via LinkedIn and wish the team continued success.
</div>
{/* Offer to Help */}
  <div className="mb-4">
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
      <div className="text-sm font-bold text-yellow-800 mb-2">🤝 CONTINUED SUPPORT</div>
      <div className="text-[8px] text-slate-700 leading-relaxed">
        Even after my last day, I'm willing to be available (within reasonable limits) to answer questions or provide clarification during the transition period. You can reach me at <span className="font-bold">[Your.Personal.Email]</span> if any urgent matters arise.
      </div>
    </div>
  </div>

  {/* Closing - Positive & Professional */}
  <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
    Thank you again for the opportunities, guidance, and support you've provided during my tenure at <span className="font-bold">[Company.Name]</span>. I have truly enjoyed being part of the team and am grateful for the professional relationships I've developed. I wish you and the entire <span className="font-bold">[Department.Or.Team.Name]</span> team all the best in your future endeavors.
  </div>

  {/* Signature */}
  <div className="mt-6 text-[8px] text-slate-700">
    <div className="mb-10">Respectfully,</div>
    <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
    <div className="text-slate-600">[Your.Current.Position]</div>
    <div className="text-slate-600 mt-2">
      <div>Work Email: [Your.Work.Email]</div>
      <div>Personal Email: [Your.Personal.Email]</div>
      <div>Phone: [Your.Phone]</div>
    </div>
  </div>

  {/* CC Line (if applicable) */}
  <div className="mt-6 text-[7px] text-slate-500">
    cc: [HR.Department] / [HR.Director.Name]
  </div>

  {/* Tips Section (Remove before sending) */}
  <div className="mt-8 bg-slate-100 border-2 border-slate-400 rounded-lg p-4">
    <div className="text-[8px] font-bold text-slate-900 mb-2">💡 RESIGNATION LETTER TIPS (Remove this section before sending):</div>
    <div className="text-[7px] text-slate-600 leading-relaxed space-y-1">
      <div>• <strong>Keep It Brief & Positive:</strong> No need to elaborate on reasons or air grievances</div>
      <div>• <strong>Be Clear on Dates:</strong> Specify exact last working day to avoid confusion</div>
      <div>• <strong>Don't Burn Bridges:</strong> You may need references or cross paths professionally later</div>
      <div>• <strong>Submit in Person First:</strong> Tell your manager face-to-face before submitting letter if possible</div>
      <div>• <strong>Deliver to HR:</strong> Submit copy to HR department as well as your manager</div>
      <div>• <strong>Check Your Contract:</strong> Verify required notice period and any restrictions (non-compete, etc.)</div>
      <div>• <strong>No Negotiation Points:</strong> This is not the place to discuss counter-offers or complaints</div>
      <div>• <strong>Professional Tone Always:</strong> Even if leaving due to negative circumstances</div>
      <div>• <strong>Keep a Copy:</strong> Save a copy for your records</div>
      <div>• <strong>Follow Up:</strong> Confirm receipt and discuss transition plan with manager</div>
    </div>
  </div>

  {/* Checklist */}
  <div className="mt-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
    <div className="text-[8px] font-bold text-blue-900 mb-2">✅ PRE-SUBMISSION CHECKLIST:</div>
    <div className="text-[7px] text-slate-700 leading-relaxed space-y-1">
      <div>☐ Have you calculated the correct notice period per your contract?</div>
      <div>☐ Is your last working day clearly stated?</div>
      <div>☐ Have you checked your employee handbook for resignation procedures?</div>
      <div>☐ Do you have your personal email/phone for future contact?</div>
      <div>☐ Have you removed any negative comments or complaints?</div>
      <div>☐ Is the tone positive and professional throughout?</div>
      <div>☐ Have you mentioned your commitment to transition?</div>
      <div>☐ Did you proofread for any errors?</div>
      <div>☐ Will you deliver this in person to your manager first?</div>
      <div>☐ Have you prepared to answer questions about your decision?</div>
    </div>
  </div>
</div>
),
htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professional Resignation Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #475569;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #1e293b;
    }

    /* Subject Box */
    .subject-box {
      background-color: #f1f5f9;
      border-left: 4px solid #475569;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Notice Period Box */
    .notice-box {
      background: linear-gradient(to right, #f1f5f9, #e2e8f0);
      border: 2px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .notice-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .notice-item {
      font-size: 0.65rem;
      color: #64748b;
    }
    .notice-value {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 0.25rem;
    }
    .last-day {
      color: #dc2626;
    }

    /* Gratitude Box */
    .gratitude-box {
      background-color: #dbeafe;
      border: 2px solid #93c5fd;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .gratitude-list {
      margin-top: 0.5rem;
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    .gratitude-item {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .gratitude-item::before {
      content: "•";
      color: #1e40af;
      font-weight: bold;
    }

    /* Transition Box */
    .transition-box {
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .transition-title {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .transition-list {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }
    .transition-item {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .transition-check {
      color: #16a34a;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Availability Box */
    .availability-box {
      background-color: #dcfce7;
      border-left: 4px solid #16a34a;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
    }
    .availability-list {
      margin-top: 0.5rem;
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    .availability-item {
      margin-bottom: 0.25rem;
    }

    /* Admin Box */
    .admin-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .admin-item {
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      padding: 0.5rem;
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Support Box */
    .support-box {
      background-color: #fef3c7;
      border: 2px solid #fde68a;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 0.25rem;
    }

    /* Alternative Reasons Box */
    .alternative-box {
      background-color: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
      font-size: 0.65rem;
      color: #64748b;
      font-style: italic;
    }
    .alternative-item {
      margin-top: 0.25rem;
    }

    /* Tips Section */
    .tips-section {
      background-color: #f8fafc;
      border: 2px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 2rem;
    }
    .tips-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .tips-list {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
    }
    .tip-item {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .tip-item::before {
      content: "•";
      color: #1e40af;
      font-weight: bold;
    }

    /* Checklist */
    .checklist {
      background-color: #dbeafe;
      border: 2px solid #93c5fd;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1.5rem;
    }
    .checklist-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    .checklist-item {
      margin-bottom: 0.25rem;
      font-size: 0.65rem;
      color: #64748b;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }
    .signature-details {
      font-size: 0.7rem;
      color: #64748b;
      margin-top: 0.5rem;
    }

    /* CC Line */
    .cc-line {
      font-size: 0.65rem;
      color: #64748b;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Current.Position]</div>
    <div class="contact-info">
      <span>📧 [Your.Work.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>🏢 [Department.Name]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name" style="font-weight: bold;">[Manager.Name]</div>
    <div>[Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Re: Resignation - [Your.Full.Name]
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Manager.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    I am writing to formally notify you of my resignation from my position as <span style="font-weight: bold;">[Your.Current.Position]</span> at <span style="font-weight: bold;">[Company.Name]</span>. Per my employment contract and company policy, I am providing <span style="font-weight: bold;">[Notice.Period: two weeks / 30 days]</span> notice. My last day of work will be <span style="font-weight: bold; background-color: #fef3c7; padding: 0 0.25rem;">[Last.Working.Day]</span>.
  </div>

  <!-- Notice Period Box -->
  <div class="notice-box">
    <div style="font-size: 0.65rem; color: #64748b; font-weight: bold; margin-bottom: 0.5rem;">OFFICIAL NOTICE</div>
    <div class="notice-grid">
      <div>
        <div class="notice-item">Resignation Date</div>
        <div class="notice-value">[Current.Date]</div>
      </div>
      <div class="border-x border-slate-300 px-2">
        <div class="notice-item">Notice Period</div>
        <div class="notice-value">[Notice.Period]</div>
      </div>
      <div>
        <div class="notice-item">Last Working Day</div>
        <div class="notice-value last-day">[Last.Working.Day]</div>
      </div>
    </div>
  </div>

  <!-- Reason -->
  <div class="content-text">
    This decision was not made lightly. After careful consideration, I have accepted a position that will allow me to <span style="font-weight: bold;">[Brief.Positive.Reason: further my career development / pursue new challenges / relocate for family reasons / explore a different industry]</span>. While I'm excited about this new opportunity, I want to ensure a smooth transition and maintain the positive relationships I've built here.
  </div>

  <!-- Alternative Reasons -->
  <div class="alternative-box">
    <div><strong>Alternative Reason Examples (Use ONE):</strong></div>
    <div class="alternative-item">• "I have decided to pursue an advanced degree in [Field] to further my professional development."</div>
    <div class="alternative-item">• "I have accepted a position that offers new challenges and opportunities for growth in [Area]."</div>
    <div class="alternative-item">• "Due to personal/family circumstances, I need to [relocate/take time off/change my work situation]."</div>
    <div class="alternative-item">• "After much reflection, I've decided to transition into [New.Industry.Or.Role]."</div>
    <div class="alternative-item">• "I've been presented with an opportunity that aligns more closely with my long-term career goals."</div>
  </div>

  <!-- Gratitude Section -->
  <div class="gratitude-box">
    <div class="section-header">🙏 GRATITUDE & APPRECIATION</div>
    <div class="gratitude-list">
      <div>I want to express my sincere gratitude for the opportunities I've had during my time at <span style="font-weight: bold;">[Company.Name]</span>. Over the past <span style="font-weight: bold;">[Years/Months.At.Company]</span>, I have:</div>
      <div class="gratitude-item">Developed valuable skills in <span style="font-weight: bold;">[Skill.Area.1]</span> and <span style="font-weight: bold;">[Skill.Area.2]</span></div>
      <div class="gratitude-item">Had the privilege of working on <span style="font-weight: bold;">[Notable.Project.Or.Achievement]</span></div>
      <div class="gratitude-item">Learned from exceptional colleagues and mentors, particularly <span style="font-weight: bold;">[Mentor.Or.Team.Member]</span></div>
      <div class="gratitude-item">Grown professionally through <span style="font-weight: bold;">[Training.Opportunity.Or.Experience]</span></div>
      <div class="gratitude-item">Built lasting relationships with talented professionals</div>
      <div style="margin-top: 0.5rem;">These experiences have been invaluable to my professional growth, and I will carry the lessons learned here throughout my career.</div>
    </div>
  </div>

  <!-- Transition Commitment -->
  <div class="transition-box">
    <div class="transition-title">🔄 COMMITMENT TO SMOOTH TRANSITION</div>
    <div class="content-text">
      I am fully committed to ensuring a seamless transition during my remaining time. To facilitate this, I will:
    </div>
    <div class="transition-list">
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Document Current Projects:</span> Complete comprehensive documentation of all ongoing projects, including <span style="font-weight: bold;">[Project.1]</span>, <span style="font-weight: bold;">[Project.2]</span>, and <span style="font-weight: bold;">[Project.3]</span></div>
      </div>
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Knowledge Transfer:</span> Provide detailed handover notes and conduct training sessions with <span style="font-weight: bold;">[Successor.Or.Team.Member]</span></div>
      </div>
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Client/Stakeholder Communication:</span> Assist in transitioning relationships with key clients/stakeholders including <span style="font-weight: bold;">[Key.Contact.1]</span> and <span style="font-weight: bold;">[Key.Contact.2]</span></div>
      </div>
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Complete Pending Tasks:</span> Finalize <span style="font-weight: bold;">[Specific.Deliverable]</span> and bring <span style="font-weight: bold;">[Project.Name]</span> to a logical stopping point</div>
      </div>
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Train Replacement:</span> Spend time training my replacement or designated team member(s) on critical responsibilities</div>
      </div>
      <div class="transition-item">
        <div class="transition-check">✓</div>
        <div><span style="font-weight: bold;">Organize Files:</span> Ensure all files, passwords, and resources are properly organized and accessible</div>
      </div>
    </div>
  </div>

  <!-- Availability -->
  <div class="availability-box">
    <div class="section-header">📅 MY AVAILABILITY</div>
    <div class="availability-list">
      <div>During my notice period, I will be fully available and committed to my responsibilities. I'm happy to:</div>
      <div class="availability-item">• Work my regular hours through [Last.Working.Day]</div>
      <div class="availability-item">• Attend any necessary transition meetings</div>
      <div class="availability-item">• Be available for questions after my departure (within reason) via <span style="font-weight: bold;">[Personal.Email]</span></div>
      <div class="availability-item">• Assist with recruitment/interviews for my replacement if needed</div>
    </div>
  </div>

  <!-- Administrative Items -->
  <div class="admin-box">
    <div class="section-header">📋 ADMINISTRATIVE MATTERS</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      <div>Please let me know the process for:</div>
      <div class="admin-grid">
        <div class="admin-item">✓ Return of company property (laptop, keys, access cards, etc.)</div>
        <div class="admin-item">✓ Final paycheck and accrued vacation/PTO payout</div>
        <div class="admin-item">✓ Benefits continuation (COBRA, 401k rollover, etc.)</div>
        <div class="admin-item">✓ Exit interview scheduling</div>
        <div class="admin-item">✓ Reference letters or recommendations</div>
        <div class="admin-item">✓ Final paperwork and documentation</div>
      </div>
    </div>
  </div>

  <!-- Future Connection -->
  <div class="content-text">
    I hope to maintain our professional relationship going forward. Please feel free to reach me at <span style="font-weight: bold;">[Your.Personal.Email]</span> or <span style="font-weight: bold;">[Your.Personal.Phone]</span> after my departure. I would be happy to stay connected via LinkedIn and wish the team continued success.
  </div>

  <!-- Support Box -->
  <div class="support-box">
    <div class="section-header">🤝 CONTINUED SUPPORT</div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      Even after my last day, I'm willing to be available (within reasonable limits) to answer questions or provide clarification during the transition period. You can reach me at <span style="font-weight: bold;">[Your.Personal.Email]</span> if any urgent matters arise.
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    Thank you again for the opportunities, guidance, and support you've provided during my tenure at <span style="font-weight: bold;">[Company.Name]</span>. I have truly enjoyed being part of the team and am grateful for the professional relationships I've developed. I wish you and the entire <span style="font-weight: bold;">[Department.Or.Team.Name]</span> team all the best in your future endeavors.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Respectfully,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div class="signature-details">
      <div>[Your.Current.Position]</div>
      <div style="margin-top: 0.5rem;">
        <div>Work Email: [Your.Work.Email]</div>
        <div>Personal Email: [Your.Personal.Email]</div>
        <div>Phone: [Your.Phone]</div>
      </div>
    </div>
  </div>

  <!-- CC Line -->
  <div class="cc-line">
    cc: [HR.Department] / [HR.Director.Name]
  </div>

  <!-- Tips Section -->
  <div class="tips-section">
    <div class="tips-title">💡 RESIGNATION LETTER TIPS (Remove this section before sending):</div>
    <div class="tips-list">
      <div class="tip-item">Keep It Brief & Positive: No need to elaborate on reasons or air grievances</div>
      <div class="tip-item">Be Clear on Dates: Specify exact last working day to avoid confusion</div>
      <div class="tip-item">Don't Burn Bridges: You may need references or cross paths professionally later</div>
      <div class="tip-item">Submit in Person First: Tell your manager face-to-face before submitting letter if possible</div>
      <div class="tip-item">Deliver to HR: Submit copy to HR department as well as your manager</div>
      <div class="tip-item">Check Your Contract: Verify required notice period and any restrictions (non-compete, etc.)</div>
      <div class="tip-item">No Negotiation Points: This is not the place to discuss counter-offers or complaints</div>
      <div class="tip-item">Professional Tone Always: Even if leaving due to negative circumstances</div>
      <div class="tip-item">Keep a Copy: Save a copy for your records</div>
      <div class="tip-item">Follow Up: Confirm receipt and discuss transition plan with manager</div>
    </div>
  </div>

  <!-- Checklist -->
  <div class="checklist">
    <div class="checklist-title">✅ PRE-SUBMISSION CHECKLIST:</div>
    <div class="tips-list">
      <div class="checklist-item">☐ Have you calculated the correct notice period per your contract?</div>
      <div class="checklist-item">☐ Is your last working day clearly stated?</div>
      <div class="checklist-item">☐ Have you checked your employee handbook for resignation procedures?</div>
      <div class="checklist-item">☐ Do you have your personal email/phone for future contact?</div>
      <div class="checklist-item">☐ Have you removed any negative comments or complaints?</div>
      <div class="checklist-item">☐ Is the tone positive and professional throughout?</div>
      <div class="checklist-item">☐ Have you mentioned your commitment to transition?</div>
      <div class="checklist-item">☐ Did you proofread for any errors?</div>
      <div class="checklist-item">☐ Will you deliver this in person to your manager first?</div>
      <div class="checklist-item">☐ Have you prepared to answer questions about your decision?</div>
    </div>
  </div>
</body>
</html>
`
},

{
  id: 'salary-negotiation-letter-001',
  name: 'Salary Negotiation Letter',
  description: 'Professional salary negotiation and counter-offer letter',
  category: 'resumes',
  popular: true,
  fields: ['Current Offer', 'Desired Salary', 'Justification', 'Market Research', 'Value Proposition'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-4 border-green-600 pb-4 mb-6">
        <div className="text-2xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
        <div className="text-sm text-green-700 mb-2">[Your.Professional.Title]</div>
        <div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
          <span>📧 [Your.Email]</span>
          <span>📱 [Your.Phone]</span>
          <span>📍 [Your.City], [Your.State]</span>
          <span>💼 [Your.LinkedIn]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Hiring.Manager.Name]</div>
        <div>[Hiring.Manager.Title]</div>
        <div className="font-bold text-green-700">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-green-900">
            Re: [Position.Title] Offer - Salary Discussion
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Hiring.Manager.Name],
      </div>

      {/* Opening - Express Gratitude & Enthusiasm */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        Thank you so much for extending the offer for the <span className="font-bold text-green-600">[Position.Title]</span> position at <span className="font-bold text-green-600">[Company.Name]</span>. I am genuinely excited about the opportunity to join your team and contribute to <span className="font-bold">[Specific.Company.Goal.Or.Project]</span>. After our conversations, I am confident this role aligns perfectly with my skills and career aspirations, and I'm enthusiastic about the value I can bring to your organization.
      </div>

      {/* Acknowledge the Offer */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <div className="text-sm font-bold text-green-700 mb-2">📋 OFFER ACKNOWLEDGMENT</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I have thoroughly reviewed the offer details you provided:
            <div className="mt-2 bg-white rounded-lg p-3 border border-green-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">Position:</span> [Position.Title]
                </div>
                <div>
                  <span className="font-bold">Start Date:</span> [Proposed.Start.Date]
                </div>
                <div>
                  <span className="font-bold">Base Salary:</span> ${"[Offered.Salary]"}/year
                </div>
                <div>
                  <span className="font-bold">Benefits:</span> [Benefits.Summary]
                </div>
              </div>
            </div>
            <div className="mt-2">
              I am grateful for this generous offer and appreciate the time invested in the interview process.
            </div>
          </div>
        </div>
      </div>

      {/* Transition to Negotiation */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        After careful consideration of the role's responsibilities, my qualifications, and current market conditions, I would like to discuss the compensation package. I believe a salary adjustment would better reflect the value I bring and align with industry standards for this position.
      </div>

      {/* Your Counter-Offer */}
      <div className="mb-4">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white text-center shadow-xl">
          <div className="text-[10px] opacity-90 font-semibold mb-2">PROPOSED SALARY</div>
          <div className="text-5xl font-bold mb-3">${"[Desired.Salary]"}</div>
          <div className="text-[8px] opacity-80">Annual Base Salary</div>
          <div className="mt-3 text-[7px] opacity-90">
            (Current Offer: ${"[Offered.Salary]"} | Difference: ${"[Difference]"})
          </div>
        </div>
      </div>

      {/* Justification - Your Value Proposition */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2 border-b-2 border-green-600 pb-1">💼 VALUE PROPOSITION & JUSTIFICATION</div>
        <div className="space-y-3">
          <div className="bg-white border-l-4 border-green-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-green-700 mb-1">Relevant Experience & Expertise</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              I bring <span className="font-bold">[Years.Experience]</span> years of specialized experience in <span className="font-bold">[Your.Expertise.Area]</span>, including <span className="font-bold">[Key.Skill.1]</span>, <span className="font-bold">[Key.Skill.2]</span>, and <span className="font-bold">[Key.Skill.3]</span>. My track record includes <span className="font-bold">[Quantifiable.Achievement.1]</span> and <span className="font-bold">[Quantifiable.Achievement.2]</span>, demonstrating my ability to deliver results that directly align with this role's objectives.
            </div>
          </div>

          <div className="bg-white border-l-4 border-emerald-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-emerald-700 mb-1">Immediate Impact & Contributions</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              From day one, I can contribute <span className="font-bold">[Immediate.Value.1]</span>, <span className="font-bold">[Immediate.Value.2]</span>, and <span className="font-bold">[Immediate.Value.3]</span>. My existing relationships with <span className="font-bold">[Relevant.Connections.Or.Clients]</span> and deep knowledge of <span className="font-bold">[Specialized.Area]</span> will enable me to hit the ground running and minimize ramp-up time.
            </div>
          </div>

          <div className="bg-white border-l-4 border-green-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-green-700 mb-1">Advanced Skills & Certifications</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              I hold <span className="font-bold">[Certification.1]</span> and <span className="font-bold">[Certification.2]</span>, which are highly relevant to this role. Additionally, my proficiency in <span className="font-bold">[Specialized.Tool.Or.Methodology]</span> and <span className="font-bold">[Another.Skill]</span> positions me to excel in the responsibilities outlined for this position.
            </div>
          </div>
        </div>
      </div>

      {/* Market Research Data */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2 border-b-2 border-green-600 pb-1">📊 MARKET RESEARCH & INDUSTRY STANDARDS</div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            Based on my research using <span className="font-bold">[Source.1: e.g., Glassdoor, Salary.com, PayScale]</span>, <span className="font-bold">[Source.2]</span>, and <span className="font-bold">[Source.3]</span>, the market rate for a <span className="font-bold">[Position.Title]</span> with my level of experience in <span className="font-bold">[Geographic.Market]</span> typically ranges from <span className="font-bold">${"[Market.Range.Low]"}</span> to <span className="font-bold">${"[Market.Range.High]"}</span>.
            
            <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
              <div className="font-bold text-blue-900 mb-2 text-[8px]">Comparable Positions:</div>
              <div className="space-y-1 text-[7px]">
                <div>• <span className="font-bold">[Company.1]</span> - Similar role: ${"[Salary.1]"} (Source: [Source])</div>
                <div>• <span className="font-bold">[Company.2]</span> - Similar role: ${"[Salary.2]"} (Source: [Source])</div>
                <div>• <span className="font-bold">[Company.3]</span> - Similar role: ${"[Salary.3]"} (Source: [Source])</div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <strong>Average Market Rate:</strong> ${"[Average.Market.Rate]"}
                </div>
              </div>
            </div>

            <div className="mt-2">
              My proposed salary of <span className="font-bold">${"[Desired.Salary]"}</span> falls within this range and reflects my specialized skills and the value I bring to <span className="font-bold text-green-700">[Company.Name]</span>.
            </div>
          </div>
        </div>
      </div>

      {/* Additional Considerations */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">💡 ADDITIONAL CONSIDERATIONS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>
              <span className="font-bold">Current Compensation:</span> My current total compensation is <span className="font-bold">${"[Current.Total.Comp]"}</span> (including base salary, bonus, and benefits). To make this transition financially viable, the proposed adjustment is important.
            </div>
            <div>
              <span className="font-bold">Cost of Living:</span> Given [Geographic.Consideration: relocation to a higher cost-of-living area / local market conditions], the adjusted salary would ensure financial stability and allow me to fully focus on delivering results.
            </div>
            <div>
              <span className="font-bold">Role Scope:</span> Based on our discussions, the position involves <span className="font-bold">[Additional.Responsibility.1]</span> and <span className="font-bold">[Additional.Responsibility.2]</span>, which extend beyond the typical scope for this role and warrant additional compensation consideration.
            </div>
          </div>
        </div>
      </div>

      {/* Flexibility & Alternative Options */}
      <div className="mb-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-sm font-bold text-yellow-800 mb-2">🤝 FLEXIBILITY & ALTERNATIVE COMPENSATION</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <div className="mb-2">I understand budget constraints exist, and I'm open to exploring alternative compensation structures:</div>
            <div className="space-y-1">
              <div>• <span className="font-bold">Performance Bonus:</span> Structure with ${"[Bonus.Amount]"} tied to [Specific.Metrics]</div>
              <div>• <span className="font-bold">Signing Bonus:</span> One-time ${"[Signing.Bonus]"} to bridge the gap</div>
              <div>• <span className="font-bold">Equity/Stock Options:</span> [Number] options vesting over [Timeframe]</div>
              <div>• <span className="font-bold">Accelerated Review:</span> Salary review at [Timeframe: 6 months] instead of annual</div>
              <div>• <span className="font-bold">Additional Benefits:</span> [Extra.Vacation.Days], [Professional.Development.Budget], [Remote.Work.Flexibility]</div>
              <div>• <span className="font-bold">Relocation Assistance:</span> ${"[Relocation.Amount]"} for moving expenses (if applicable)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reiterate Enthusiasm */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I want to emphasize my strong interest in this position and my commitment to contributing to <span className="font-bold text-green-600">[Company.Name]</span>'s success. This negotiation is about ensuring a compensation package that reflects the mutual value of our partnership. I'm confident we can reach an agreement that works for both parties.
      </div>

      {/* Next Steps */}
      <div className="mb-4">
        <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r">
          <div className="text-sm font-bold text-green-700 mb-2">📅 NEXT STEPS</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I would appreciate the opportunity to discuss this further at your earliest convenience. I'm available for a call <span className="font-bold">[Your.Availability: this week, any afternoon, etc.]</span> and am happy to work around your schedule. I'm optimistic we can find a mutually beneficial solution that allows me to join your team with enthusiasm and focus.
          </div>
        </div>
      </div>

      {/* Closing - Professional & Positive */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        Thank you for considering my request and for the time you've invested in this process. I truly appreciate your understanding and look forward to working together to finalize the details so I can begin contributing to <span className="font-bold text-green-600">[Company.Name]</span>'s continued success.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-10">Sincerely,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
        <div className="text-slate-600">[Your.Phone] | [Your.Email]</div>
      </div>

      {/* Tips Section (Remove before sending) */}
      <div className="mt-8 bg-green-50 border-2 border-green-400 rounded-lg p-4">
        <div className="text-[8px] font-bold text-green-900 mb-2">💡 NEGOTIATION TIPS (Remove this section before sending):</div>
        <div className="text-[7px] text-slate-600 leading-relaxed space-y-1">
          <div>• <strong>Always Show Enthusiasm:</strong> Make it clear you want the job</div>
          <div>• <strong>Be Specific:</strong> Use exact numbers, not ranges</div>
          <div>• <strong>Provide Evidence:</strong> Back up your request with market data</div>
          <div>• <strong>Focus on Value:</strong> Emphasize what you bring, not what you need</div>
          <div>• <strong>Stay Professional:</strong> Keep emotion out of it - this is business</div>
          <div>• <strong>Timing Matters:</strong> Negotiate after receiving written offer, before accepting</div>
          <div>• <strong>Consider Total Package:</strong> Don't focus only on base salary</div>
          <div>• <strong>Be Prepared to Walk:</strong> Know your minimum acceptable offer</div>
          <div>• <strong>Don't Apologize:</strong> Negotiating is expected and professional</div>
          <div>• <strong>Get Everything in Writing:</strong> Once agreed, request written confirmation</div>
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Negotiation Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #059669;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 0.875rem;
      color: #059669;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #059669;
    }

    /* Subject Box */
    .subject-box {
      background-color: #d1fae5;
      border-left: 4px solid #059669;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #04473d;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Salary Box */
    .salary-box {
      background: linear-gradient(to bottom right, #059669, #047857);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      color: white;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .salary-amount {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    .salary-label {
      font-size: 0.8rem;
      opacity: 0.9;
      margin-bottom: 0.25rem;
    }
    .salary-details {
      font-size: 0.65rem;
      opacity: 0.8;
      margin-top: 0.5rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #059669;
      padding-bottom: 0.25rem;
    }

    /* Value Proposition Boxes */
    .value-box {
      background-color: #fff;
      border-left: 4px solid #059669;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .value-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.25rem;
    }
    .value-description {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Market Research Box */
    .market-box {
      background-color: #dbeafe;
      border: 2px solid #93c5fd;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .market-data {
      background-color: #fff;
      border: 1px solid #93c5fd;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
      font-size: 0.65rem;
    }
    .market-item {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .market-item::before {
      content: "•";
      color: #1e40af;
      font-weight: bold;
    }

    /* Considerations Box */
    .considerations-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .consideration-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    /* Flexibility Box */
    .flexibility-box {
      background-color: #fef3c7;
      border: 2px solid #fde68a;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .flexibility-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .flexibility-item::before {
      content: "•";
      color: #92400e;
      font-weight: bold;
    }

    /* Next Steps Box */
    .next-steps-box {
      background-color: #d1fae5;
      border-left: 4px solid #059669;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
    }

    /* Offer Details Box */
    .offer-details {
      background-color: #fff;
      border: 1px solid #d1fae5;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }
    .offer-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      font-size: 0.7rem;
    }

    /* Tips Section */
    .tips-section {
      background-color: #d1fae5;
      border: 2px solid #a7f3d0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 2rem;
      font-size: 0.7rem;
    }
    .tips-title {
      font-weight: bold;
      color: #04473d;
      margin-bottom: 0.5rem;
    }
    .tip-item {
      color: #64748b;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .tip-item::before {
      content: "•";
      color: #059669;
      font-weight: bold;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Professional.Title]</div>
    <div class="contact-info">
      <span>📧 [Your.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>📍 [Your.City], [Your.State]</span>
      <span>💼 [Your.LinkedIn]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name" style="font-weight: bold;">[Hiring.Manager.Name]</div>
    <div>[Hiring.Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Re: [Position.Title] Offer - Salary Discussion
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Hiring.Manager.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    Thank you so much for extending the offer for the <span style="font-weight: bold; color: #059669;">[Position.Title]</span> position at <span style="font-weight: bold; color: #059669;">[Company.Name]</span>. I am genuinely excited about the opportunity to join your team and contribute to <span style="font-weight: bold;">[Specific.Company.Goal.Or.Project]</span>. After our conversations, I am confident this role aligns perfectly with my skills and career aspirations, and I'm enthusiastic about the value I can bring to your organization.
  </div>

  <!-- Offer Acknowledgment -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">📋 OFFER ACKNOWLEDGMENT</div>
    <div style="background: linear-gradient(to right, #d1fae5, #a7f3d0); border: 2px solid #a7f3d0; border-radius: 0.5rem; padding: 1rem;">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I have thoroughly reviewed the offer details you provided:
        <div class="offer-details">
          <div class="offer-grid">
            <div>
              <span style="font-weight: bold;">Position:</span> [Position.Title]
            </div>
            <div>
              <span style="font-weight: bold;">Start Date:</span> [Proposed.Start.Date]
            </div>
            <div>
              <span style="font-weight: bold;">Base Salary:</span> ${"[Offered.Salary]"}<span style="font-size: 0.6rem;">/year</span>
            </div>
            <div>
              <span style="font-weight: bold;">Benefits:</span> [Benefits.Summary]
            </div>
          </div>
        </div>
        <div style="margin-top: 0.5rem;">
          I am grateful for this generous offer and appreciate the time invested in the interview process.
        </div>
      </div>
    </div>
  </div>

  <!-- Transition to Negotiation -->
  <div class="content-text">
    After careful consideration of the role's responsibilities, my qualifications, and current market conditions, I would like to discuss the compensation package. I believe a salary adjustment would better reflect the value I bring and align with industry standards for this position.
  </div>

  <!-- Proposed Salary -->
  <div class="salary-box">
    <div class="salary-label">PROPOSED SALARY</div>
    <div class="salary-amount">${"[Desired.Salary]"}</div>
    <div class="salary-label">Annual Base Salary</div>
    <div class="salary-details">
      (Current Offer: ${"[Offered.Salary]"} | Difference: ${"[Difference]"})
    </div>
  </div>

  <!-- Value Proposition -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">💼 VALUE PROPOSITION & JUSTIFICATION</div>
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div class="value-box">
        <div class="value-title">Relevant Experience & Expertise</div>
        <div class="value-description">
          I bring <span style="font-weight: bold;">[Years.Experience]</span> years of specialized experience in <span style="font-weight: bold;">[Your.Expertise.Area]</span>, including <span style="font-weight: bold;">[Key.Skill.1]</span>, <span style="font-weight: bold;">[Key.Skill.2]</span>, and <span style="font-weight: bold;">[Key.Skill.3]</span>. My track record includes <span style="font-weight: bold;">[Quantifiable.Achievement.1]</span> and <span style="font-weight: bold;">[Quantifiable.Achievement.2]</span>, demonstrating my ability to deliver results that directly align with this role's objectives.
        </div>
      </div>
      <div class="value-box" style="border-left-color: #047857;">
        <div class="value-title" style="color: #047857;">Immediate Impact & Contributions</div>
        <div class="value-description">
          From day one, I can contribute <span style="font-weight: bold;">[Immediate.Value.1]</span>, <span style="font-weight: bold;">[Immediate.Value.2]</span>, and <span style="font-weight: bold;">[Immediate.Value.3]</span>. My existing relationships with <span style="font-weight: bold;">[Relevant.Connections.Or.Clients]</span> and deep knowledge of <span style="font-weight: bold;">[Specialized.Area]</span> will enable me to hit the ground running and minimize ramp-up time.
        </div>
      </div>
      <div class="value-box">
        <div class="value-title">Advanced Skills & Certifications</div>
        <div class="value-description">
          I hold <span style="font-weight: bold;">[Certification.1]</span> and <span style="font-weight: bold;">[Certification.2]</span>, which are highly relevant to this role. Additionally, my proficiency in <span style="font-weight: bold;">[Specialized.Tool.Or.Methodology]</span> and <span style="font-weight: bold;">[Another.Skill]</span> positions me to excel in the responsibilities outlined for this position.
        </div>
      </div>
    </div>
  </div>

  <!-- Market Research -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">📊 MARKET RESEARCH & INDUSTRY STANDARDS</div>
    <div class="market-box">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        Based on my research using <span style="font-weight: bold;">[Source.1: e.g., Glassdoor, Salary.com, PayScale]</span>, <span style="font-weight: bold;">[Source.2]</span>, and <span style="font-weight: bold;">[Source.3]</span>, the market rate for a <span style="font-weight: bold;">[Position.Title]</span> with my level of experience in <span style="font-weight: bold;">[Geographic.Market]</span> typically ranges from <span style="font-weight: bold;">${"[Market.Range.Low]"}</span> to <span style="font-weight: bold;">${"[Market.Range.High]"}</span>.

        <div class="market-data">
          <div style="font-weight: bold; color: #1e40af; margin-bottom: 0.25rem;">Comparable Positions:</div>
          <div style="font-size: 0.65rem;">
            <div class="market-item"><span style="font-weight: bold;">[Company.1]</span> - Similar role: ${"[Salary.1]"} (Source: [Source])</div>
            <div class="market-item"><span style="font-weight: bold;">[Company.2]</span> - Similar role: ${"[Salary.2]"} (Source: [Source])</div>
            <div class="market-item"><span style="font-weight: bold;">[Company.3]</span> - Similar role: ${"[Salary.3]"} (Source: [Source])</div>
            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e2e8f0;">
              <strong>Average Market Rate:</strong> ${"[Average.Market.Rate]"}
            </div>
          </div>
        </div>
        <div style="margin-top: 0.75rem;">
          My proposed salary of <span style="font-weight: bold;">${"[Desired.Salary]"}</span> falls within this range and reflects my specialized skills and the value I bring to <span style="font-weight: bold; color: #059669;">[Company.Name]</span>.
        </div>
      </div>
    </div>
  </div>

  <!-- Additional Considerations -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-header">💡 ADDITIONAL CONSIDERATIONS</div>
    <div class="considerations-box">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <div class="consideration-item">
          <span style="font-weight: bold;">Current Compensation:</span> My current total compensation is <span style="font-weight: bold;">${"[Current.Total.Comp]"}</span> (including base salary, bonus, and benefits). To make this transition financially viable, the proposed adjustment is important.
        </div>
        <div class="consideration-item">
          <span style="font-weight: bold;">Cost of Living:</span> Given [Geographic.Consideration: relocation to a higher cost-of-living area / local market conditions], the adjusted salary would ensure financial stability and allow me to fully focus on delivering results.
        </div>
        <div class="consideration-item">
          <span style="font-weight: bold;">Role Scope:</span> Based on our discussions, the position involves <span style="font-weight: bold;">[Additional.Responsibility.1]</span> and <span style="font-weight: bold;">[Additional.Responsibility.2]</span>, which extend beyond the typical scope for this role and warrant additional compensation consideration.
        </div>
      </div>
    </div>
  </div>

  <!-- Flexibility -->
  <div style="margin-bottom: 1.5rem;">
    <div class="flexibility-box">
      <div class="section-header" style="color: #92400e;">🤝 FLEXIBILITY & ALTERNATIVE COMPENSATION</div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <div style="margin-bottom: 0.5rem;">I understand budget constraints exist, and I'm open to exploring alternative compensation structures:</div>
        <div style="margin-top: 0.5rem;">
          <div class="flexibility-item">Performance Bonus: Structure with ${"[Bonus.Amount]"} tied to [Specific.Metrics]</div>
          <div class="flexibility-item">Signing Bonus: One-time ${"[Signing.Bonus]"} to bridge the gap</div>
          <div class="flexibility-item">Equity/Stock Options: [Number] options vesting over [Timeframe]</div>
          <div class="flexibility-item">Accelerated Review: Salary review at [Timeframe: 6 months] instead of annual</div>
          <div class="flexibility-item">Additional Benefits: [Extra.Vacation.Days], [Professional.Development.Budget], [Remote.Work.Flexibility]</div>
          <div class="flexibility-item">Relocation Assistance: ${"[Relocation.Amount]"} for moving expenses (if applicable)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reiterate Enthusiasm -->
  <div class="content-text">
    I want to emphasize my strong interest in this position and my commitment to contributing to <span style="font-weight: bold; color: #059669;">[Company.Name]</span>'s success. This negotiation is about ensuring a compensation package that reflects the mutual value of our partnership. I'm confident we can reach an agreement that works for both parties.
  </div>

  <!-- Next Steps -->
  <div style="margin-bottom: 1.5rem;">
    <div class="next-steps-box">
      <div class="section-header">📅 NEXT STEPS</div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I would appreciate the opportunity to discuss this further at your earliest convenience. I'm available for a call <span style="font-weight: bold;">[Your.Availability: this week, any afternoon, etc.]</span> and am happy to work around your schedule. I'm optimistic we can find a mutually beneficial solution that allows me to join your team with enthusiasm and focus.
      </div>
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    Thank you for considering my request and for the time you've invested in this process. I truly appreciate your understanding and look forward to working together to finalize the details so I can begin contributing to <span style="font-weight: bold; color: #059669;">[Company.Name]</span>'s continued success.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Sincerely,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Phone] | [Your.Email]</div>
  </div>

  <!-- Tips Section -->
  <div class="tips-section">
    <div class="tips-title">💡 NEGOTIATION TIPS (Remove this section before sending):</div>
    <div style="font-size: 0.65rem; color: #64748b; line-height: 1.4;">
      <div class="tip-item">Always Show Enthusiasm: Make it clear you want the job</div>
      <div class="tip-item">Be Specific: Use exact numbers, not ranges</div>
      <div class="tip-item">Provide Evidence: Back up your request with market data</div>
      <div class="tip-item">Focus on Value: Emphasize what you bring, not what you need</div>
      <div class="tip-item">Stay Professional: Keep emotion out of it - this is business</div>
      <div class="tip-item">Timing Matters: Negotiate after receiving written offer, before accepting</div>
      <div class="tip-item">Consider Total Package: Don't focus only on base salary</div>
      <div class="tip-item">Be Prepared to Walk: Know your minimum acceptable offer</div>
      <div class="tip-item">Don't Apologize: Negotiating is expected and professional</div>
      <div class="tip-item">Get Everything in Writing: Once agreed, request written confirmation</div>
    </div>
  </div>
</body>
</html>
`
},


{
  id: 'entry-level-cover-letter-001',
  name: 'Entry-Level Cover Letter',
  description: 'Cover letter for recent graduates and early career',
  category: 'resumes',
  popular: true,
  fields: ['Education', 'Internships', 'Skills', 'Enthusiasm', 'Willingness to Learn'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-5 rounded-lg mb-6">
        <div className="text-2xl font-bold mb-1">[Your.Full.Name]</div>
        <div className="text-sm mb-2">[Your.Degree] Graduate | [Graduation.Year]</div>
        <div className="flex gap-3 text-[8px] flex-wrap">
          <span>📧 [Your.Email]</span>
          <span>📱 [Your.Phone]</span>
          <span>📍 [Your.City], [Your.State]</span>
          <span>💼 [Your.LinkedIn]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Hiring.Manager.Name]</div>
        <div>[Hiring.Manager.Title]</div>
        <div className="font-bold text-emerald-700">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-emerald-900">
            Re: [Position.Title] - Eager [Your.Major] Graduate Ready to Contribute & Grow
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Hiring.Manager.Name],
      </div>

      {/* Opening - Show Enthusiasm */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        As a recent <span className="font-bold">[Your.Degree]</span> graduate from <span className="font-bold">[Your.University]</span> with a passion for <span className="font-bold">[Your.Field]</span>, I was thrilled to discover the <span className="font-bold text-emerald-600">[Position.Title]</span> opening at <span className="font-bold text-emerald-600">[Company.Name]</span>. While I am at the beginning of my professional journey, I bring fresh perspectives, strong academic foundations, proven eagerness to learn, and genuine enthusiasm that I believe will make me a valuable addition to your team.
      </div>

      {/* Education Highlight */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg p-4">
          <div className="text-sm font-bold text-emerald-700 mb-2">🎓 EDUCATIONAL FOUNDATION</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I graduated <span className="font-bold">[Honors.Or.Distinction]</span> from <span className="font-bold">[Your.University]</span> with a <span className="font-bold">[GPA]</span> GPA, specializing in <span className="font-bold">[Your.Major/Concentration]</span>. My coursework in <span className="font-bold">[Relevant.Course.1]</span>, <span className="font-bold">[Relevant.Course.2]</span>, and <span className="font-bold">[Relevant.Course.3]</span> provided me with a solid theoretical foundation in <span className="font-bold">[Relevant.Skills.Area]</span>, which directly applies to the requirements of the <span className="font-bold">[Position.Title]</span> role.
          </div>
        </div>
      </div>

      {/* Relevant Experience */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">💼 RELEVANT EXPERIENCE & PROJECTS</div>
        <div className="space-y-2">
          <div className="bg-white border-l-4 border-emerald-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-emerald-700 mb-1">[Internship.Or.Experience.1.Title] at [Company.Or.Organization]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              During my <span className="font-bold">[Duration]</span> at <span className="font-bold">[Organization]</span>, I <span className="font-bold">[Key.Responsibility.Or.Achievement]</span>, which resulted in <span className="font-bold">[Outcome.Or.Learning]</span>. This experience taught me <span className="font-bold">[Key.Skill.Learned]</span> and gave me practical exposure to <span className="font-bold">[Relevant.Area]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-teal-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-teal-700 mb-1">[Project.Or.Experience.2.Title]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              As part of my <span className="font-bold">[Academic.Or.Extracurricular.Context]</span>, I <span className="font-bold">[Project.Description.And.Role]</span>. This project enhanced my skills in <span className="font-bold">[Skills.Developed]</span> and demonstrated my ability to <span className="font-bold">[Key.Capability]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-emerald-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-emerald-700 mb-1">[Leadership.Or.Volunteer.Experience]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              Through my involvement in <span className="font-bold">[Organization.Or.Activity]</span>, I developed <span className="font-bold">[Soft.Skills]</span> and learned <span className="font-bold">[Key.Lesson.Or.Capability]</span>, skills that will be invaluable in the <span className="font-bold">[Position.Title]</span> role.
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Competencies */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">🚀 SKILLS & COMPETENCIES</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="font-bold text-[8px] text-emerald-700 mb-1">Technical Skills</div>
            <div className="text-[7px] text-slate-600">[Technical.Skill.1], [Technical.Skill.2], [Technical.Skill.3], [Technical.Skill.4]</div>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
            <div className="font-bold text-[8px] text-teal-700 mb-1">Software Proficiency</div>
            <div className="text-[7px] text-slate-600">[Software.1], [Software.2], [Software.3], [Software.4]</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="font-bold text-[8px] text-emerald-700 mb-1">Soft Skills</div>
            <div className="text-[7px] text-slate-600">[Soft.Skill.1], [Soft.Skill.2], [Soft.Skill.3], [Soft.Skill.4]</div>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
            <div className="font-bold text-[8px] text-teal-700 mb-1">Languages</div>
            <div className="text-[7px] text-slate-600">[Language.1] ([Proficiency.1]), [Language.2] ([Proficiency.2])</div>
          </div>
        </div>
      </div>

      {/* Why This Company */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        What draws me to <span className="font-bold text-emerald-600">[Company.Name]</span> is your <span className="font-bold">[Company.Quality.Or.Reputation]</span> and commitment to <span className="font-bold">[Company.Value.Or.Mission]</span>. I've been following <span className="font-bold">[Specific.Company.News.Or.Initiative]</span> and am inspired by your approach to <span className="font-bold">[Specific.Area]</span>. As someone starting their career, I'm seeking an organization where I can grow, contribute, and learn from industry leaders — and <span className="font-bold">[Company.Name]</span> represents exactly that opportunity.
      </div>

      {/* What You Bring */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4">
          <div className="text-sm font-bold text-teal-700 mb-2">✨ WHAT I BRING AS AN ENTRY-LEVEL CANDIDATE</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div>• <span className="font-bold">Fresh Perspective:</span> Up-to-date knowledge of current trends, technologies, and best practices from recent education</div>
            <div>• <span className="font-bold">Strong Work Ethic:</span> Demonstrated through [Academic.Achievement] and [Other.Achievement]</div>
            <div>• <span className="font-bold">Eagerness to Learn:</span> Quick learner who actively seeks feedback and embraces challenges</div>
            <div>• <span className="font-bold">Adaptability:</span> Comfortable with change and able to thrive in dynamic environments</div>
            <div>• <span className="font-bold">Team Player:</span> Collaborative mindset developed through [Group.Projects.Or.Team.Experience]</div>
            <div>• <span className="font-bold">Tech-Savvy:</span> Digital native proficient in [Modern.Tools.And.Platforms]</div>
          </div>
        </div>
      </div>

      {/* Learning & Growth Mindset */}
      <div className="mb-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
          <div className="text-sm font-bold text-yellow-800 mb-2">📚 COMMITMENT TO CONTINUOUS LEARNING</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I understand that as an entry-level professional, I have much to learn. I'm committed to professional development and have already begun <span className="font-bold">[Self.Learning.Initiative]</span>, including <span className="font-bold">[Online.Courses.Or.Certifications]</span>. I'm excited about the opportunity to learn from experienced professionals at <span className="font-bold text-emerald-600">[Company.Name]</span> and to grow alongside your team while making meaningful contributions from day one.
          </div>
        </div>
      </div>

      {/* How You'll Contribute */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        While I may be early in my career, I'm ready to make an immediate impact. I can contribute <span className="font-bold">[Immediate.Contribution.1]</span>, assist with <span className="font-bold">[Immediate.Contribution.2]</span>, and support <span className="font-bold">[Immediate.Contribution.3]</span>. My academic projects have prepared me to <span className="font-bold">[Relevant.Capability]</span>, and I'm eager to apply these skills in a professional setting while continuing to develop my expertise.
      </div>

      {/* Closing with Enthusiasm */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am genuinely excited about the opportunity to begin my career with <span className="font-bold text-emerald-600">[Company.Name]</span> as a <span className="font-bold">[Position.Title]</span>. I'm confident that my education, skills, enthusiasm, and willingness to learn make me a strong candidate for this position. I would welcome the opportunity to discuss how I can contribute to your team's success while growing professionally. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-10">Enthusiastically yours,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
        <div className="text-slate-600">[Your.Phone] | [Your.Email]</div>
      </div>

      {/* Enclosure */}
      <div className="mt-6">
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-2 rounded-r text-[7px] text-emerald-800">
          📎 Attachments: Resume, Academic Transcripts, Portfolio/Projects (if applicable)
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entry-Level Cover Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      background: linear-gradient(to right, #10b981, #059669);
      color: white;
      padding: 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .degree {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #04473d;
    }
    .manager-name {
      font-weight: bold;
    }

    /* Subject Box */
    .subject-box {
      background-color: #d1fae5;
      border-left: 4px solid #059669;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #04473d;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Highlight Boxes */
    .highlight-box {
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .education-box {
      background: linear-gradient(to right, #d1fae5, #a7f3d0);
      border: 2px solid #a7f3d0;
    }
    .what-i-bring {
      background: linear-gradient(to right, #a7f3d0, #6ee7b7);
      border: 2px solid #3b82f6;
    }
    .learning-goals {
      background-color: #fef3c7;
      border-left: 4px solid #d97706;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }

    /* Experience Boxes */
    .experience-box {
      background-color: #fff;
      border-left: 4px solid #059669;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .experience-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.25rem;
    }
    .experience-description {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Skills Grid */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .skill-box {
      background-color: #d1fae5;
      border: 1px solid #a7f3d0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.7rem;
    }
    .skill-title {
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.25rem;
    }
    .skill-list {
      color: #64748b;
      font-size: 0.65rem;
    }

    /* List Items */
    .list-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .list-item::before {
      content: "•";
      color: #059669;
      font-weight: bold;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }

    /* Enclosure */
    .enclosure {
      background-color: #d1fae5;
      border-left: 4px solid #059669;
      padding: 0.5rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-top: 1.5rem;
      font-size: 0.65rem;
      color: #04473d;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="degree">[Your.Degree] Graduate | [Graduation.Year]</div>
    <div class="contact-info">
      <span>📧 [Your.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>📍 [Your.City], [Your.State]</span>
      <span>💼 [Your.LinkedIn]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name">[Hiring.Manager.Name]</div>
    <div>[Hiring.Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Re: [Position.Title] - Eager [Your.Major] Graduate Ready to Contribute & Grow
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Hiring.Manager.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    As a recent <span style="font-weight: bold;">[Your.Degree]</span> graduate from <span style="font-weight: bold;">[Your.University]</span> with a passion for <span style="font-weight: bold;">[Your.Field]</span>, I was thrilled to discover the <span style="font-weight: bold; color: #059669;">[Position.Title]</span> opening at <span style="font-weight: bold; color: #059669;">[Company.Name]</span>. While I am at the beginning of my professional journey, I bring fresh perspectives, strong academic foundations, proven eagerness to learn, and genuine enthusiasm that I believe will make me a valuable addition to your team.
  </div>

  <!-- Education Highlight -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box education-box">
      <div class="section-header">
        🎓 EDUCATIONAL FOUNDATION
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I graduated <span style="font-weight: bold;">[Honors.Or.Distinction]</span> from <span style="font-weight: bold;">[Your.University]</span> with a <span style="font-weight: bold;">[GPA]</span> GPA, specializing in <span style="font-weight: bold;">[Your.Major/Concentration]</span>. My coursework in <span style="font-weight: bold;">[Relevant.Course.1]</span>, <span style="font-weight: bold;">[Relevant.Course.2]</span>, and <span style="font-weight: bold;">[Relevant.Course.3]</span> provided me with a solid theoretical foundation in <span style="font-weight: bold;">[Relevant.Skills.Area]</span>, which directly applies to the requirements of the <span style="font-weight: bold;">[Position.Title]</span> role.
      </div>
    </div>
  </div>

  <!-- Relevant Experience -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      💼 RELEVANT EXPERIENCE & PROJECTS
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div class="experience-box">
        <div class="experience-title">[Internship.Or.Experience.1.Title] at [Company.Or.Organization]</div>
        <div class="experience-description">
          During my <span style="font-weight: bold;">[Duration]</span> at <span style="font-weight: bold;">[Organization]</span>, I <span style="font-weight: bold;">[Key.Responsibility.Or.Achievement]</span>, which resulted in <span style="font-weight: bold;">[Outcome.Or.Learning]</span>. This experience taught me <span style="font-weight: bold;">[Key.Skill.Learned]</span> and gave me practical exposure to <span style="font-weight: bold;">[Relevant.Area]</span>.
        </div>
      </div>
      <div class="experience-box" style="border-left-color: #0891b2;">
        <div class="experience-title" style="color: #085f63;">[Project.Or.Experience.2.Title]</div>
        <div class="experience-description">
          As part of my <span style="font-weight: bold;">[Academic.Or.Extracurricular.Context]</span>, I <span style="font-weight: bold;">[Project.Description.And.Role]</span>. This project enhanced my skills in <span style="font-weight: bold;">[Skills.Developed]</span> and demonstrated my ability to <span style="font-weight: bold;">[Key.Capability]</span>.
        </div>
      </div>
      <div class="experience-box">
        <div class="experience-title">[Leadership.Or.Volunteer.Experience]</div>
        <div class="experience-description">
          Through my involvement in <span style="font-weight: bold;">[Organization.Or.Activity]</span>, I developed <span style="font-weight: bold;">[Soft.Skills]</span> and learned <span style="font-weight: bold;">[Key.Lesson.Or.Capability]</span>, skills that will be invaluable in the <span style="font-weight: bold;">[Position.Title]</span> role.
        </div>
      </div>
    </div>
  </div>

  <!-- Skills & Competencies -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      🚀 SKILLS & COMPETENCIES
    </div>
    <div class="skills-grid">
      <div class="skill-box">
        <div class="skill-title">Technical Skills</div>
        <div class="skill-list">[Technical.Skill.1], [Technical.Skill.2], [Technical.Skill.3], [Technical.Skill.4]</div>
      </div>
      <div class="skill-box" style="background-color: #a7f3d0;">
        <div class="skill-title" style="color: #085f63;">Software Proficiency</div>
        <div class="skill-list">[Software.1], [Software.2], [Software.3], [Software.4]</div>
      </div>
      <div class="skill-box">
        <div class="skill-title">Soft Skills</div>
        <div class="skill-list">[Soft.Skill.1], [Soft.Skill.2], [Soft.Skill.3], [Soft.Skill.4]</div>
      </div>
      <div class="skill-box" style="background-color: #a7f3d0;">
        <div class="skill-title" style="color: #085f63;">Languages</div>
        <div class="skill-list">[Language.1] ([Proficiency.1]), [Language.2] ([Proficiency.2])</div>
      </div>
    </div>
  </div>

  <!-- Why This Company -->
  <div class="content-text">
    What draws me to <span style="font-weight: bold; color: #059669;">[Company.Name]</span> is your <span style="font-weight: bold;">[Company.Quality.Or.Reputation]</span> and commitment to <span style="font-weight: bold;">[Company.Value.Or.Mission]</span>. I've been following <span style="font-weight: bold;">[Specific.Company.News.Or.Initiative]</span> and am inspired by your approach to <span style="font-weight: bold;">[Specific.Area]</span>. As someone starting their career, I'm seeking an organization where I can grow, contribute, and learn from industry leaders — and <span style="font-weight: bold;">[Company.Name]</span> represents exactly that opportunity.
  </div>

  <!-- What You Bring -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box what-i-bring">
      <div class="section-header">
        ✨ WHAT I BRING AS AN ENTRY-LEVEL CANDIDATE
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
        <div class="list-item">Fresh Perspective: Up-to-date knowledge of current trends, technologies, and best practices from recent education</div>
        <div class="list-item">Strong Work Ethic: Demonstrated through [Academic.Achievement] and [Other.Achievement]</div>
        <div class="list-item">Eagerness to Learn: Quick learner who actively seeks feedback and embraces challenges</div>
        <div class="list-item">Adaptability: Comfortable with change and able to thrive in dynamic environments</div>
        <div class="list-item">Team Player: Collaborative mindset developed through [Group.Projects.Or.Team.Experience]</div>
        <div class="list-item">Tech-Savvy: Digital native proficient in [Modern.Tools.And.Platforms]</div>
      </div>
    </div>
  </div>

  <!-- Learning & Growth Mindset -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box learning-goals">
      <div class="section-header" style="color: #92400e;">
        📚 COMMITMENT TO CONTINUOUS LEARNING
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I understand that as an entry-level professional, I have much to learn. I'm committed to professional development and have already begun <span style="font-weight: bold;">[Self.Learning.Initiative]</span>, including <span style="font-weight: bold;">[Online.Courses.Or.Certifications]</span>. I'm excited about the opportunity to learn from experienced professionals at <span style="font-weight: bold; color: #059669;">[Company.Name]</span> and to grow alongside your team while making meaningful contributions from day one.
      </div>
    </div>
  </div>

  <!-- How You'll Contribute -->
  <div class="content-text">
    While I may be early in my career, I'm ready to make an immediate impact. I can contribute <span style="font-weight: bold;">[Immediate.Contribution.1]</span>, assist with <span style="font-weight: bold;">[Immediate.Contribution.2]</span>, and support <span style="font-weight: bold;">[Immediate.Contribution.3]</span>. My academic projects have prepared me to <span style="font-weight: bold;">[Relevant.Capability]</span>, and I'm eager to apply these skills in a professional setting while continuing to develop my expertise.
  </div>

  <!-- Closing -->
  <div class="content-text">
    I am genuinely excited about the opportunity to begin my career with <span style="font-weight: bold; color: #059669;">[Company.Name]</span> as a <span style="font-weight: bold;">[Position.Title]</span>. I'm confident that my education, skills, enthusiasm, and willingness to learn make me a strong candidate for this position. I would welcome the opportunity to discuss how I can contribute to your team's success while growing professionally. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Enthusiastically yours,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Phone] | [Your.Email]</div>
  </div>

  <!-- Enclosure -->
  <div class="enclosure">
    📎 Attachments: Resume, Academic Transcripts, Portfolio/Projects (if applicable)
  </div>
</body>
</html>
`
},

{
  id: 'executive-cover-letter-001',
  name: 'Executive Cover Letter',
  description: 'Cover letter for senior leadership positions',
  category: 'resumes',
  popular: false,
  fields: ['Leadership', 'Strategic Vision', 'Track Record', 'Industry Impact'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Letterhead */}
      <div className="border-b-4 border-slate-800 pb-4 mb-6">
        <div className="text-3xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
        <div className="text-sm text-slate-700 mb-2">[Your.Executive.Title]</div>
        <div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
          <span>[Your.City], [Your.State]</span>
          <span>•</span>
          <span>[Your.Phone]</span>
          <span>•</span>
          <span>[Your.Email]</span>
          <span>•</span>
          <span>[Your.LinkedIn]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-6 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient - Board/CEO Level */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Board.Chair.Or.CEO.Name]</div>
        <div>[Their.Title]</div>
        <div className="font-bold text-slate-900">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Salutation */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Board.Chair.Or.CEO.Name],
      </div>

      {/* Opening - Executive Summary Style */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        As a proven executive leader with <span className="font-bold">[Years.Experience]</span> years of progressive leadership experience driving <span className="font-bold">[Key.Result.Area]</span>, I am writing to express my interest in the <span className="font-bold">[Executive.Position.Title]</span> role at <span className="font-bold">[Company.Name]</span>. Throughout my career, I have consistently delivered transformational results, including <span className="font-bold">[Major.Achievement.With.Numbers]</span>, while building high-performing teams and establishing strategic partnerships that create sustainable competitive advantages.
      </div>

      {/* Leadership Track Record */}
      <div className="mb-4">
        <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r">
          <div className="text-sm font-bold text-slate-900 mb-3">LEADERSHIP TRACK RECORD</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>
              <span className="font-bold">At [Current.Or.Recent.Company]</span> ([Current.Title], [Years]): Transformed operations by <span className="font-bold">[Transformation.Description]</span>, resulting in <span className="font-bold">[Financial.Impact]</span> in revenue growth and <span className="font-bold">[Efficiency.Improvement]</span>% operational efficiency improvement. Led a team of <span className="font-bold">[Team.Size]</span> across <span className="font-bold">[Geographic.Scope]</span>.
            </div>
            <div>
              <span className="font-bold">At [Previous.Company.1]</span> ([Previous.Title.1], [Years]): Spearheaded <span className="font-bold">[Strategic.Initiative]</span> that <span className="font-bold">[Major.Result]</span>. Successfully managed <span className="font-bold">[Budget.Size]</span> budget while achieving <span className="font-bold">[Performance.Metric]</span>.
            </div>
            <div>
              <span className="font-bold">At [Previous.Company.2]</span> ([Previous.Title.2], [Years]): Architected and executed <span className="font-bold">[Strategic.Change]</span>, positioning the organization for <span className="font-bold">[Long.Term.Benefit]</span> and achieving <span className="font-bold">[Measurable.Outcome]</span>.
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Capabilities */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2 border-b-2 border-slate-300 pb-1">CORE STRATEGIC CAPABILITIES</div>
        <div className="grid grid-cols-2 gap-3 text-[8px]">
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">Strategic Vision & Planning</div>
            <div className="text-slate-700 text-[7px]">[Specific.Example.Of.Strategy.Development]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">P&L Management</div>
            <div className="text-slate-700 text-[7px]">[Financial.Responsibility.Details]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">Organizational Transformation</div>
            <div className="text-slate-700 text-[7px]">[Change.Management.Example]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">Stakeholder Relations</div>
            <div className="text-slate-700 text-[7px]">[Board.Investor.Partner.Engagement]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">Talent Development</div>
            <div className="text-slate-700 text-[7px]">[Leadership.Pipeline.Building]</div>
          </div>
          <div className="bg-slate-50 border-l-4 border-slate-700 p-3 rounded-r">
            <div className="font-bold text-slate-900 mb-1">Market Expansion</div>
            <div className="text-slate-700 text-[7px]">[Growth.Initiative.Results]</div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        Understanding <span className="font-bold">[Company.Name]</span>'s current position in <span className="font-bold">[Market.Or.Industry]</span> and your strategic objectives around <span className="font-bold">[Known.Company.Priority]</span>, I am confident I can drive measurable impact in several key areas. My experience successfully navigating <span className="font-bold">[Relevant.Challenge.Or.Situation]</span> positions me uniquely to help <span className="font-bold">[Company.Name]</span> achieve <span className="font-bold">[Specific.Goal]</span> while strengthening <span className="font-bold">[Operational.Area]</span>.
      </div>

      {/* Key Differentiators */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-slate-300 rounded-lg p-4">
          <div className="text-sm font-bold text-slate-900 mb-3">KEY DIFFERENTIATORS</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>
              <span className="font-bold">Proven Change Agent:</span> Successfully led <span className="font-bold">[Number]</span> major organizational transformations, including <span className="font-bold">[Specific.Example]</span>, achieving <span className="font-bold">[Result]</span> while maintaining employee engagement scores above <span className="font-bold">[Percentage]</span>%.
            </div>
            <div>
              <span className="font-bold">Financial Acumen:</span> Managed P&Ls ranging from <span className="font-bold">[Range]</span>, consistently delivering <span className="font-bold">[Performance.Metric]</span> and achieving <span className="font-bold">[ROI.Or.EBITDA.Improvement]</span>.
            </div>
            <div>
              <span className="font-bold">Industry Expertise:</span> Deep understanding of <span className="font-bold">[Industry.Specifics]</span> with established relationships across <span className="font-bold">[Key.Stakeholder.Groups]</span> and recognized thought leadership through <span className="font-bold">[Publications.Speaking.Boards]</span>.
            </div>
            <div>
              <span className="font-bold">Global Perspective:</span> International experience across <span className="font-bold">[Geographic.Markets]</span>, leading cross-cultural teams and navigating complex regulatory environments.
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Vision for Role */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        In the <span className="font-bold">[Executive.Position.Title]</span> role, my immediate priorities would include: <span className="font-bold">[Priority.1]</span> to accelerate <span className="font-bold">[Outcome.1]</span>; <span className="font-bold">[Priority.2]</span> to strengthen <span className="font-bold">[Outcome.2]</span>; and <span className="font-bold">[Priority.3]</span> to position the organization for <span className="font-bold">[Long.Term.Vision]</span>. My 90-day plan would focus on stakeholder alignment, quick wins that demonstrate value, and establishing the strategic framework for sustainable long-term growth.
      </div>

      {/* Why This Opportunity */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        <span className="font-bold">[Company.Name]</span> represents an exceptional opportunity to leverage my experience in a context where I can make significant impact. Your <span className="font-bold">[Company.Quality]</span>, combined with the challenges and opportunities in <span className="font-bold">[Specific.Market.Or.Situation]</span>, align perfectly with my expertise and career aspirations. I am particularly drawn to <span className="font-bold">[Specific.Aspect.Of.Role.Or.Company]</span> and believe this is the ideal setting for me to contribute at the highest level.
      </div>

      {/* Board & Advisory Experience (if applicable) */}
      <div className="mb-4">
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
          <div className="text-sm font-bold text-slate-900 mb-2">BOARD & ADVISORY ROLES</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <span className="font-bold">[Board.Position.1]</span> - [Organization.1] ([Years])<br/>
            <span className="font-bold">[Board.Position.2]</span> - [Organization.2] ([Years])<br/>
            <span className="font-bold">[Advisory.Role]</span> - [Organization.3] ([Years])
          </div>
        </div>
      </div>

      {/* Education & Credentials */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">EDUCATION & CREDENTIALS</div>
        <div className="text-[8px] text-slate-700">
          <div className="mb-1"><span className="font-bold">[Degree]</span>, [University] | [Additional.Credentials]</div>
          <div><span className="font-bold">Executive Education:</span> [Executive.Programs] ([Institutions])</div>
        </div>
      </div>

      {/* Closing */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed text-justify">
        I am confident that my strategic vision, proven track record, and leadership capabilities make me an ideal candidate for the <span className="font-bold">[Executive.Position.Title]</span> position. I would welcome the opportunity to discuss how my experience aligns with <span className="font-bold">[Company.Name]</span>'s strategic priorities and how I can contribute to your continued success and growth. Thank you for your consideration, and I look forward to our conversation.
      </div>

      {/* Formal Signature */}
      <div className="mt-8 text-[8px] text-slate-700">
        <div className="mb-12">Respectfully,</div>
        <div className="font-bold text-slate-900 text-lg">[Your.Full.Name]</div>
        <div className="text-slate-600 mt-1">[Your.Executive.Title]</div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-3">
        References and detailed performance metrics available upon request
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Cover Letter</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #1e293b;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .company-name {
      font-weight: bold;
      color: #1e293b;
    }

    /* Content Text */
    .content-text {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 1rem;
      text-align: justify;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.9rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
      border-bottom: 2px solid #cbd5e1;
      padding-bottom: 0.25rem;
    }

    /* Leadership Box */
    .leadership-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e293b;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1.5rem;
    }
    .leadership-item {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }
    .company-name-bold {
      font-weight: bold;
    }

    /* Capabilities Grid */
    .capabilities-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .capability-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e293b;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .capability-title {
      font-size: 0.8rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .capability-detail {
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Differentiators Box */
    .differentiators-box {
      background: linear-gradient(to right, #f8fafc, #f1f5f9);
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .differentiator-item {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }

    /* Board Experience */
    .board-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .board-item {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 0.25rem;
    }

    /* Education */
    .education-section {
      margin-bottom: 1.5rem;
    }
    .education-item {
      font-size: 0.8rem;
      color: #333;
      line-height: 1.6;
      margin-bottom: 0.25rem;
    }

    /* Signature */
    .signature {
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #333;
    }
    .signature-name {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 3rem;
      margin-bottom: 0.5rem;
    }
    .signature-title {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Executive.Title]</div>
    <div class="contact-info">
      <span>[Your.City], [Your.State]</span>
      <span>•</span>
      <span>[Your.Phone]</span>
      <span>•</span>
      <span>[Your.Email]</span>
      <span>•</span>
      <span>[Your.LinkedIn]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name" style="font-weight: bold;">[Board.Chair.Or.CEO.Name]</div>
    <div>[Their.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.8rem; color: #333; margin-bottom: 1rem;">
    Dear [Board.Chair.Or.CEO.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    As a proven executive leader with <span style="font-weight: bold;">[Years.Experience]</span> years of progressive leadership experience driving <span style="font-weight: bold;">[Key.Result.Area]</span>, I am writing to express my interest in the <span style="font-weight: bold;">[Executive.Position.Title]</span> role at <span style="font-weight: bold;">[Company.Name]</span>. Throughout my career, I have consistently delivered transformational results, including <span style="font-weight: bold;">[Major.Achievement.With.Numbers]</span>, while building high-performing teams and establishing strategic partnerships that create sustainable competitive advantages.
  </div>

  <!-- Leadership Track Record -->
  <div class="leadership-box">
    <div class="section-header">LEADERSHIP TRACK RECORD</div>
    <div style="font-size: 0.8rem; color: #333; line-height: 1.6;">
      <div class="leadership-item">
        <span class="company-name-bold">At [Current.Or.Recent.Company]</span> (<span style="font-weight: bold;">[Current.Title]</span>, [Years]): Transformed operations by <span style="font-weight: bold;">[Transformation.Description]</span>, resulting in <span style="font-weight: bold;">[Financial.Impact]</span> in revenue growth and <span style="font-weight: bold;">[Efficiency.Improvement]</span>% operational efficiency improvement. Led a team of <span style="font-weight: bold;">[Team.Size]</span> across <span style="font-weight: bold;">[Geographic.Scope]</span>.
      </div>
      <div class="leadership-item">
        <span class="company-name-bold">At [Previous.Company.1]</span> (<span style="font-weight: bold;">[Previous.Title.1]</span>, [Years]): Spearheaded <span style="font-weight: bold;">[Strategic.Initiative]</span> that <span style="font-weight: bold;">[Major.Result]</span>. Successfully managed <span style="font-weight: bold;">[Budget.Size]</span> budget while achieving <span style="font-weight: bold;">[Performance.Metric]</span>.
      </div>
      <div class="leadership-item">
        <span class="company-name-bold">At [Previous.Company.2]</span> (<span style="font-weight: bold;">[Previous.Title.2]</span>, [Years]): Architected and executed <span style="font-weight: bold;">[Strategic.Change]</span>, positioning the organization for <span style="font-weight: bold;">[Long.Term.Benefit]</span> and achieving <span style="font-weight: bold;">[Measurable.Outcome]</span>.
      </div>
    </div>
  </div>

  <!-- Strategic Capabilities -->
  <div class="section-header">CORE STRATEGIC CAPABILITIES</div>
  <div class="capabilities-grid">
    <div class="capability-box">
      <div class="capability-title">Strategic Vision & Planning</div>
      <div class="capability-detail">[Specific.Example.Of.Strategy.Development]</div>
    </div>
    <div class="capability-box">
      <div class="capability-title">P&L Management</div>
      <div class="capability-detail">[Financial.Responsibility.Details]</div>
    </div>
    <div class="capability-box">
      <div class="capability-title">Organizational Transformation</div>
      <div class="capability-detail">[Change.Management.Example]</div>
    </div>
    <div class="capability-box">
      <div class="capability-title">Stakeholder Relations</div>
      <div class="capability-detail">[Board.Investor.Partner.Engagement]</div>
    </div>
    <div class="capability-box">
      <div class="capability-title">Talent Development</div>
      <div class="capability-detail">[Leadership.Pipeline.Building]</div>
    </div>
    <div class="capability-box">
      <div class="capability-title">Market Expansion</div>
      <div class="capability-detail">[Growth.Initiative.Results]</div>
    </div>
  </div>

  <!-- Value Proposition -->
  <div class="content-text">
    Understanding <span style="font-weight: bold;">[Company.Name]</span>'s current position in <span style="font-weight: bold;">[Market.Or.Industry]</span> and your strategic objectives around <span style="font-weight: bold;">[Known.Company.Priority]</span>, I am confident I can drive measurable impact in several key areas. My experience successfully navigating <span style="font-weight: bold;">[Relevant.Challenge.Or.Situation]</span> positions me uniquely to help <span style="font-weight: bold;">[Company.Name]</span> achieve <span style="font-weight: bold;">[Specific.Goal]</span> while strengthening <span style="font-weight: bold;">[Operational.Area]</span>.
  </div>

  <!-- Key Differentiators -->
  <div class="differentiators-box">
    <div class="section-header">KEY DIFFERENTIATORS</div>
    <div style="font-size: 0.8rem; color: #333; line-height: 1.6;">
      <div class="differentiator-item">
        <span style="font-weight: bold;">Proven Change Agent:</span> Successfully led <span style="font-weight: bold;">[Number]</span> major organizational transformations, including <span style="font-weight: bold;">[Specific.Example]</span>, achieving <span style="font-weight: bold;">[Result]</span> while maintaining employee engagement scores above <span style="font-weight: bold;">[Percentage]</span>%.
      </div>
      <div class="differentiator-item">
        <span style="font-weight: bold;">Financial Acumen:</span> Managed P&Ls ranging from <span style="font-weight: bold;">[Range]</span>, consistently delivering <span style="font-weight: bold;">[Performance.Metric]</span> and achieving <span style="font-weight: bold;">[ROI.Or.EBITDA.Improvement]</span>.
      </div>
      <div class="differentiator-item">
        <span style="font-weight: bold;">Industry Expertise:</span> Deep understanding of <span style="font-weight: bold;">[Industry.Specifics]</span> with established relationships across <span style="font-weight: bold;">[Key.Stakeholder.Groups]</span> and recognized thought leadership through <span style="font-weight: bold;">[Publications.Speaking.Boards]</span>.
      </div>
      <div class="differentiator-item">
        <span style="font-weight: bold;">Global Perspective:</span> International experience across <span style="font-weight: bold;">[Geographic.Markets]</span>, leading cross-cultural teams and navigating complex regulatory environments.
      </div>
    </div>
  </div>

  <!-- Strategic Vision -->
  <div class="content-text">
    In the <span style="font-weight: bold;">[Executive.Position.Title]</span> role, my immediate priorities would include: <span style="font-weight: bold;">[Priority.1]</span> to accelerate <span style="font-weight: bold;">[Outcome.1]</span>; <span style="font-weight: bold;">[Priority.2]</span> to strengthen <span style="font-weight: bold;">[Outcome.2]</span>; and <span style="font-weight: bold;">[Priority.3]</span> to position the organization for <span style="font-weight: bold;">[Long.Term.Vision]</span>. My 90-day plan would focus on stakeholder alignment, quick wins that demonstrate value, and establishing the strategic framework for sustainable long-term growth.
  </div>

  <!-- Why This Opportunity -->
  <div class="content-text">
    <span style="font-weight: bold;">[Company.Name]</span> represents an exceptional opportunity to leverage my experience in a context where I can make significant impact. Your <span style="font-weight: bold;">[Company.Quality]</span>, combined with the challenges and opportunities in <span style="font-weight: bold;">[Specific.Market.Or.Situation]</span>, align perfectly with my expertise and career aspirations. I am particularly drawn to <span style="font-weight: bold;">[Specific.Aspect.Of.Role.Or.Company]</span> and believe this is the ideal setting for me to contribute at the highest level.
  </div>

  <!-- Board Experience -->
  <div class="board-box">
    <div class="section-header">BOARD & ADVISORY ROLES</div>
    <div style="font-size: 0.8rem; color: #333; line-height: 1.6;">
      <div class="board-item">
        <span style="font-weight: bold;">[Board.Position.1]</span> - [Organization.1] ([Years])
      </div>
      <div class="board-item">
        <span style="font-weight: bold;">[Board.Position.2]</span> - [Organization.2] ([Years])
      </div>
      <div class="board-item">
        <span style="font-weight: bold;">[Advisory.Role]</span> - [Organization.3] ([Years])
      </div>
    </div>
  </div>

  <!-- Education -->
  <div class="education-section">
    <div class="section-header">EDUCATION & CREDENTIALS</div>
    <div style="font-size: 0.8rem; color: #333; line-height: 1.6;">
      <div class="education-item">
        <span style="font-weight: bold;">[Degree]</span>, [University] | [Additional.Credentials]
      </div>
      <div class="education-item">
        <span style="font-weight: bold;">Executive Education:</span> [Executive.Programs] ([Institutions])
      </div>
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    I am confident that my strategic vision, proven track record, and leadership capabilities make me an ideal candidate for the <span style="font-weight: bold;">[Executive.Position.Title]</span> position. I would welcome the opportunity to discuss how my experience aligns with <span style="font-weight: bold;">[Company.Name]</span>'s strategic priorities and how I can contribute to your continued success and growth. Thank you for your consideration, and I look forward to our conversation.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Respectfully,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div class="signature-title">[Your.Executive.Title]</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    References and detailed performance metrics available upon request
  </div>
</body>
</html>
`
},

{
  id: 'internship-cover-letter-001',
  name: 'Internship Cover Letter',
  description: 'Cover letter for internship applications',
  category: 'resumes',
  popular: true,
  fields: ['University', 'Major', 'Relevant Coursework', 'Career Goals', 'Availability'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5 rounded-lg mb-6">
        <div className="text-2xl font-bold mb-1">[Your.Full.Name]</div>
        <div className="text-sm mb-2">[Your.Major] Student | [University.Name]</div>
        <div className="flex gap-3 text-[8px] flex-wrap">
          <span>📧 [Your.Email]</span>
          <span>📱 [Your.Phone]</span>
          <span>📍 [Your.City], [Your.State]</span>
          <span>💼 [Your.LinkedIn]</span>
          <span>🎓 Expected Graduation: [Grad.Date]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Internship.Coordinator.Name]</div>
        <div>[Their.Title]</div>
        <div className="font-bold text-orange-700">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="bg-orange-50 border-l-4 border-orange-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-orange-900">
            Re: [Internship.Position.Title] - [Season/Term] [Year] Internship Application
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Internship.Coordinator.Name],
      </div>

      {/* Opening - Show Enthusiasm & Context */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am writing to apply for the <span className="font-bold text-orange-600">[Internship.Position.Title]</span> internship at <span className="font-bold text-orange-600">[Company.Name]</span> for <span className="font-bold">[Season/Term]</span> <span className="font-bold">[Year]</span>. As a <span className="font-bold">[Year.In.School]</span> <span className="font-bold">[Your.Major]</span> student at <span className="font-bold">[University.Name]</span> with a strong interest in <span className="font-bold">[Career.Interest.Area]</span>, I am eager to gain hands-on experience and contribute to your team while developing practical skills that complement my academic foundation.
      </div>

      {/* Academic Background */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4">
          <div className="text-sm font-bold text-orange-700 mb-2">🎓 ACADEMIC BACKGROUND</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I am currently pursuing a <span className="font-bold">[Degree.Type]</span> in <span className="font-bold">[Your.Major]</span> at <span className="font-bold">[University.Name]</span> with a current GPA of <span className="font-bold">[Your.GPA]</span>. My coursework has provided me with a strong foundation in <span className="font-bold">[Core.Area.1]</span> and <span className="font-bold">[Core.Area.2]</span>. Relevant courses include:
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-white rounded p-2 border border-orange-200">
                <span className="font-bold">✓</span> [Relevant.Course.1]
              </div>
              <div className="bg-white rounded p-2 border border-orange-200">
                <span className="font-bold">✓</span> [Relevant.Course.2]
              </div>
              <div className="bg-white rounded p-2 border border-orange-200">
                <span className="font-bold">✓</span> [Relevant.Course.3]
              </div>
              <div className="bg-white rounded p-2 border border-orange-200">
                <span className="font-bold">✓</span> [Relevant.Course.4]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Relevant Experience & Projects */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">💼 RELEVANT EXPERIENCE & PROJECTS</div>
        <div className="space-y-2">
          <div className="bg-white border-l-4 border-orange-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-orange-700 mb-1">[Academic.Project.Or.Experience.1]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              <span className="font-bold">[Context]:</span> [Project.Description] where I <span className="font-bold">[Your.Role.And.Contribution]</span>. This experience taught me <span className="font-bold">[Skills.Learned]</span> and demonstrated my ability to <span className="font-bold">[Key.Capability]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-amber-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-amber-700 mb-1">[Campus.Activity.Or.Leadership]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              As <span className="font-bold">[Your.Role]</span> in <span className="font-bold">[Organization]</span>, I <span className="font-bold">[Responsibility.Or.Achievement]</span>. This role developed my <span className="font-bold">[Soft.Skills]</span> and <span className="font-bold">[Other.Skills]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-orange-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-orange-700 mb-1">[Part.Time.Work.Or.Volunteer]</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              Through my work/volunteer experience at <span className="font-bold">[Organization]</span>, I gained practical exposure to <span className="font-bold">[Relevant.Area]</span> and learned <span className="font-bold">[Professional.Skill]</span>.
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Technical Proficiencies */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">🛠️ SKILLS & TECHNICAL PROFICIENCIES</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <div className="font-bold text-orange-700 mb-1">Technical Skills</div>
              <div className="text-slate-700">[Skill.1] • [Skill.2] • [Skill.3] • [Skill.4]</div>
            </div>
            <div>
              <div className="font-bold text-orange-700 mb-1">Software/Tools</div>
              <div className="text-slate-700">[Tool.1] • [Tool.2] • [Tool.3] • [Tool.4]</div>
            </div>
            <div>
              <div className="font-bold text-orange-700 mb-1">Professional Skills</div>
              <div className="text-slate-700">[Soft.Skill.1] • [Soft.Skill.2] • [Soft.Skill.3]</div>
            </div>
            <div>
              <div className="font-bold text-orange-700 mb-1">Languages</div>
              <div className="text-slate-700">[Language.1] • [Language.2]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why This Company & Internship */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am particularly drawn to <span className="font-bold text-orange-600">[Company.Name]</span> because of your <span className="font-bold">[Company.Quality.Or.Reputation]</span> and innovative work in <span className="font-bold">[Specific.Area]</span>. I recently learned about <span className="font-bold">[Specific.Company.Project.Or.Initiative]</span> and was impressed by <span className="font-bold">[What.Impressed.You]</span>. This internship represents an ideal opportunity to apply my classroom knowledge in a real-world setting while learning from industry professionals at a company that <span className="font-bold">[Company.Value.That.Resonates]</span>.
      </div>

      {/* What You'll Bring */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4">
          <div className="text-sm font-bold text-amber-700 mb-2">✨ WHAT I BRING AS AN INTERN</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div>• <span className="font-bold">Strong Academic Foundation:</span> Solid theoretical knowledge ready to be applied practically</div>
            <div>• <span className="font-bold">Quick Learner:</span> Eager to absorb new information and adapt to your team's workflow</div>
            <div>• <span className="font-bold">Fresh Perspective:</span> Current knowledge of latest trends, tools, and methodologies from recent coursework</div>
            <div>• <span className="font-bold">Dedicated Work Ethic:</span> Proven through academic success and extracurricular commitments</div>
            <div>• <span className="font-bold">Team Collaboration:</span> Experience working on group projects and cross-functional teams</div>
            <div>• <span className="font-bold">Genuine Enthusiasm:</span> Passionate about [Industry/Field] and eager to contribute meaningfully</div>
          </div>
        </div>
      </div>

      {/* Learning Goals */}
      <div className="mb-4">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r">
          <div className="text-sm font-bold text-blue-700 mb-2">🎯 MY LEARNING GOALS FOR THIS INTERNSHIP</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div>• Gain practical experience in <span className="font-bold">[Specific.Area.1]</span> and <span className="font-bold">[Specific.Area.2]</span></div>
            <div>• Develop professional skills in <span className="font-bold">[Skill.Area]</span> under mentorship of experienced professionals</div>
            <div>• Understand the day-to-day operations of <span className="font-bold">[Department.Or.Function]</span> in a professional environment</div>
            <div>• Contribute to meaningful projects while building my professional network</div>
            <div>• Apply classroom theory to real-world challenges and learn industry best practices</div>
          </div>
        </div>
      </div>

      {/* Availability & Logistics */}
      <div className="mb-4">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="text-sm font-bold text-green-700 mb-2">📅 AVAILABILITY & LOGISTICS</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-bold">Start Date:</span> Available from [Start.Date]
              </div>
              <div>
                <span className="font-bold">End Date:</span> Through [End.Date]
              </div>
              <div>
                <span className="font-bold">Hours/Week:</span> [Hours] hours per week ([Full.Time.Or.Part.Time])
              </div>
              <div>
                <span className="font-bold">Schedule:</span> Flexible / [Specific.Days]
              </div>
              <div className="col-span-2">
                <span className="font-bold">Location:</span> Available for [On.Site/Remote/Hybrid] work
              </div>
              <div className="col-span-2">
                <span className="font-bold">Academic Credit:</span> [Seeking.Credit.Or.Not] (Course: [Course.Number] if applicable)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How You'll Contribute */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        While I am seeking to learn, I am also committed to adding value to your team. I can assist with <span className="font-bold">[Specific.Task.1]</span>, support <span className="font-bold">[Specific.Task.2]</span>, and contribute to <span className="font-bold">[Specific.Task.3]</span>. My proficiency in <span className="font-bold">[Relevant.Skill.Or.Tool]</span> and my strong <span className="font-bold">[Soft.Skill]</span> will enable me to integrate quickly and make meaningful contributions from the start of the internship.
      </div>

      {/* Closing */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am genuinely excited about the opportunity to intern with <span className="font-bold text-orange-600">[Company.Name]</span> and believe this experience would be invaluable to my professional development. I would welcome the chance to discuss how I can contribute to your team while growing my skills. Thank you for considering my application, and I look forward to the possibility of speaking with you.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-10">Sincerely,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
        <div className="text-slate-600">[Your.Major], [University.Name]</div>
        <div className="text-slate-600">[Your.Phone] | [Your.Email]</div>
      </div>

      {/* Enclosure */}
      <div className="mt-6">
        <div className="bg-orange-50 border-l-4 border-orange-500 p-2 rounded-r text-[7px] text-orange-800">
          📎 Attachments: Resume, Academic Transcript, Portfolio/Writing Samples (if applicable)
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Internship Cover Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      background: linear-gradient(to right, #f97316, #ea580c);
      color: white;
      padding: 1.25rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .major {
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #9a3412;
    }
    .manager-name {
      font-weight: bold;
    }

    /* Subject Box */
    .subject-box {
      background-color: #fed7aa;
      border-left: 4px solid #9a3412;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #7c2d12;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Highlight Boxes */
    .highlight-box {
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .academic-background {
      background: linear-gradient(to right, #fed7aa, #fecaca);
      border: 2px solid #fca5a5;
    }
    .what-i-bring {
      background: linear-gradient(to right, #fef3c7, #fde68a);
      border: 2px solid #f59e0b;
    }
    .learning-goals {
      background-color: #dbeafe;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .availability {
      background-color: #dcfce7;
      border: 2px solid #bbf7d0;
      border-radius: 0.5rem;
    }

    /* Skill Boxes */
    .skill-box {
      background-color: #fff;
      border-left: 4px solid #9a3412;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .skill-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #9a3412;
      margin-bottom: 0.25rem;
    }
    .skill-description {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* Course Boxes */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .course-box {
      background-color: #fff;
      border: 1px solid #fed7aa;
      border-radius: 0.25rem;
      padding: 0.5rem;
      font-size: 0.7rem;
    }

    /* List Items */
    .list-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .list-item::before {
      content: "•";
      color: #9a3412;
      font-weight: bold;
    }

    /* Skills Grid */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .skills-column h4 {
      font-size: 0.7rem;
      font-weight: bold;
      color: #9a3412;
      margin-bottom: 0.25rem;
    }
    .skills-list {
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }

    /* Enclosure */
    .enclosure {
      background-color: #fed7aa;
      border-left: 4px solid #f97316;
      padding: 0.5rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-top: 1.5rem;
      font-size: 0.65rem;
      color: #9a3412;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="major">[Your.Major] Student | [University.Name]</div>
    <div class="contact-info">
      <span>📧 [Your.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>📍 [Your.City], [Your.State]</span>
      <span>💼 [Your.LinkedIn]</span>
      <span>🎓 Expected Graduation: [Grad.Date]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name">[Internship.Coordinator.Name]</div>
    <div>[Their.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Re: [Internship.Position.Title] - [Season/Term] [Year] Internship Application
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Internship.Coordinator.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    I am writing to apply for the <span style="font-weight: bold; color: #9a3412;">[Internship.Position.Title]</span> internship at <span style="font-weight: bold; color: #9a3412;">[Company.Name]</span> for <span style="font-weight: bold;">[Season/Term]</span> <span style="font-weight: bold;">[Year]</span>. As a <span style="font-weight: bold;">[Year.In.School]</span> <span style="font-weight: bold;">[Your.Major]</span> student at <span style="font-weight: bold;">[University.Name]</span> with a strong interest in <span style="font-weight: bold;">[Career.Interest.Area]</span>, I am eager to gain hands-on experience and contribute to your team while developing practical skills that complement my academic foundation.
  </div>

  <!-- Academic Background -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      🎓 ACADEMIC BACKGROUND
    </div>
    <div class="highlight-box academic-background">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I am currently pursuing a <span style="font-weight: bold;">[Degree.Type]</span> in <span style="font-weight: bold;">[Your.Major]</span> at <span style="font-weight: bold;">[University.Name]</span> with a current GPA of <span style="font-weight: bold;">[Your.GPA]</span>. My coursework has provided me with a strong foundation in <span style="font-weight: bold;">[Core.Area.1]</span> and <span style="font-weight: bold;">[Core.Area.2]</span>. Relevant courses include:
        <div class="course-grid">
          <div class="course-box">
            <span style="font-weight: bold;">✓</span> [Relevant.Course.1]
          </div>
          <div class="course-box">
            <span style="font-weight: bold;">✓</span> [Relevant.Course.2]
          </div>
          <div class="course-box">
            <span style="font-weight: bold;">✓</span> [Relevant.Course.3]
          </div>
          <div class="course-box">
            <span style="font-weight: bold;">✓</span> [Relevant.Course.4]
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Relevant Experience -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      💼 RELEVANT EXPERIENCE & PROJECTS
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div class="skill-box">
        <div class="skill-title">[Academic.Project.Or.Experience.1]</div>
        <div class="skill-description">
          <span style="font-weight: bold;">[Context]:</span> [Project.Description] where I <span style="font-weight: bold;">[Your.Role.And.Contribution]</span>. This experience taught me <span style="font-weight: bold;">[Skills.Learned]</span> and demonstrated my ability to <span style="font-weight: bold;">[Key.Capability]</span>.
        </div>
      </div>
      <div class="skill-box" style="border-left-color: #ea580c;">
        <div class="skill-title" style="color: #ea580c;">[Campus.Activity.Or.Leadership]</div>
        <div class="skill-description">
          As <span style="font-weight: bold;">[Your.Role]</span> in <span style="font-weight: bold;">[Organization]</span>, I <span style="font-weight: bold;">[Responsibility.Or.Achievement]</span>. This role developed my <span style="font-weight: bold;">[Soft.Skills]</span> and <span style="font-weight: bold;">[Other.Skills]</span>.
        </div>
      </div>
      <div class="skill-box">
        <div class="skill-title">[Part.Time.Work.Or.Volunteer]</div>
        <div class="skill-description">
          Through my work/volunteer experience at <span style="font-weight: bold;">[Organization]</span>, I gained practical exposure to <span style="font-weight: bold;">[Relevant.Area]</span> and learned <span style="font-weight: bold;">[Professional.Skill]</span>.
        </div>
      </div>
    </div>
  </div>

  <!-- Skills Section -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      🛠️ SKILLS & TECHNICAL PROFICIENCIES
    </div>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem;">
      <div class="skills-grid">
        <div>
          <div class="skills-column">
            <h4>Technical Skills</h4>
            <div class="skills-list">[Skill.1] • [Skill.2] • [Skill.3] • [Skill.4]</div>
          </div>
        </div>
        <div>
          <div class="skills-column">
            <h4>Software/Tools</h4>
            <div class="skills-list">[Tool.1] • [Tool.2] • [Tool.3] • [Tool.4]</div>
          </div>
        </div>
        <div>
          <div class="skills-column">
            <h4>Professional Skills</h4>
            <div class="skills-list">[Soft.Skill.1] • [Soft.Skill.2] • [Soft.Skill.3]</div>
          </div>
        </div>
        <div>
          <div class="skills-column">
            <h4>Languages</h4>
            <div class="skills-list">[Language.1] • [Language.2]</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Why This Company -->
  <div class="content-text">
    I am particularly drawn to <span style="font-weight: bold; color: #9a3412;">[Company.Name]</span> because of your <span style="font-weight: bold;">[Company.Quality.Or.Reputation]</span> and innovative work in <span style="font-weight: bold;">[Specific.Area]</span>. I recently learned about <span style="font-weight: bold;">[Specific.Company.Project.Or.Initiative]</span> and was impressed by <span style="font-weight: bold;">[What.Impressed.You]</span>. This internship represents an ideal opportunity to apply my classroom knowledge in a real-world setting while learning from industry professionals at a company that <span style="font-weight: bold;">[Company.Value.That.Resonates]</span>.
  </div>

  <!-- What You Bring -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box what-i-bring">
      <div class="section-header" style="color: #92400e;">
        ✨ WHAT I BRING AS AN INTERN
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
        <div class="list-item">Strong Academic Foundation: Solid theoretical knowledge ready to be applied practically</div>
        <div class="list-item">Quick Learner: Eager to absorb new information and adapt to your team's workflow</div>
        <div class="list-item">Fresh Perspective: Current knowledge of latest trends, tools, and methodologies from recent coursework</div>
        <div class="list-item">Dedicated Work Ethic: Proven through academic success and extracurricular commitments</div>
        <div class="list-item">Team Collaboration: Experience working on group projects and cross-functional teams</div>
        <div class="list-item">Genuine Enthusiasm: Passionate about [Industry/Field] and eager to contribute meaningfully</div>
      </div>
    </div>
  </div>

  <!-- Learning Goals -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box learning-goals">
      <div class="section-header">
        🎯 MY LEARNING GOALS FOR THIS INTERNSHIP
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
        <div class="list-item">Gain practical experience in <span style="font-weight: bold;">[Specific.Area.1]</span> and <span style="font-weight: bold;">[Specific.Area.2]</span></div>
        <div class="list-item">Develop professional skills in <span style="font-weight: bold;">[Skill.Area]</span> under mentorship of experienced professionals</div>
        <div class="list-item">Understand the day-to-day operations of <span style="font-weight: bold;">[Department.Or.Function]</span> in a professional environment</div>
        <div class="list-item">Contribute to meaningful projects while building my professional network</div>
        <div class="list-item">Apply classroom theory to real-world challenges and learn industry best practices</div>
      </div>
    </div>
  </div>

  <!-- Availability -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box availability">
      <div class="section-header" style="color: #059669;">
        📅 AVAILABILITY & LOGISTICS
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.5rem;">
          <div>
            <span style="font-weight: bold;">Start Date:</span> Available from [Start.Date]
          </div>
          <div>
            <span style="font-weight: bold;">End Date:</span> Through [End.Date]
          </div>
          <div>
            <span style="font-weight: bold;">Hours/Week:</span> [Hours] hours per week ([Full.Time.Or.Part.Time])
          </div>
          <div>
            <span style="font-weight: bold;">Schedule:</span> Flexible / [Specific.Days]
          </div>
          <div style="grid-column: span 2;">
            <span style="font-weight: bold;">Location:</span> Available for [On.Site/Remote/Hybrid] work
          </div>
          <div style="grid-column: span 2;">
            <span style="font-weight: bold;">Academic Credit:</span> [Seeking.Credit.Or.Not] (Course: [Course.Number] if applicable)
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- How You'll Contribute -->
  <div class="content-text">
    While I am seeking to learn, I am also committed to adding value to your team. I can assist with <span style="font-weight: bold;">[Specific.Task.1]</span>, support <span style="font-weight: bold;">[Specific.Task.2]</span>, and contribute to <span style="font-weight: bold;">[Specific.Task.3]</span>. My proficiency in <span style="font-weight: bold;">[Relevant.Skill.Or.Tool]</span> and my strong <span style="font-weight: bold;">[Soft.Skill]</span> will enable me to integrate quickly and make meaningful contributions from the start of the internship.
  </div>

  <!-- Closing -->
  <div class="content-text">
    I am genuinely excited about the opportunity to intern with <span style="font-weight: bold; color: #9a3412;">[Company.Name]</span> and believe this experience would be invaluable to my professional development. I would welcome the chance to discuss how I can contribute to your team while growing my skills. Thank you for considering my application, and I look forward to the possibility of speaking with you.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Sincerely,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Major], [University.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Phone] | [Your.Email]</div>
  </div>

  <!-- Enclosure -->
  <div class="enclosure">
    📎 Attachments: Resume, Academic Transcript, Portfolio/Writing Samples (if applicable)
  </div>
</body>
</html>
`
},

{
  id: 'networking-cover-letter-001',
  name: 'Networking Letter',
  description: 'Professional networking and informational interview request',
  category: 'resumes',
  popular: false,
  fields: ['Contact Info', 'Connection Point', 'Request', 'Value Exchange'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-4 border-violet-600 pb-4 mb-6">
        <div className="text-2xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
        <div className="text-sm text-violet-700 mb-2">[Your.Current.Title.Or.Role]</div>
        <div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
          <span>📧 [Your.Email]</span>
          <span>📱 [Your.Phone]</span>
          <span>📍 [Your.City], [Your.State]</span>
          <span>💼 [Your.LinkedIn]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Contact.Person.Name]</div>
        <div>[Their.Title]</div>
        <div className="font-bold text-violet-700">[Their.Company]</div>
        <div>[Company.Address] (if sending physically)</div>
        <div>[Contact.Person.Email] (if sending digitally)</div>
      </div>

      {/* Subject (for email) */}
      <div className="mb-4">
        <div className="bg-violet-50 border-l-4 border-violet-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-violet-900">
            Subject: Request for Informational Interview - [Brief.Context.Or.Referral]
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Contact.Person.Name],
      </div>

      {/* Opening - Establish Connection */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        <span className="font-bold">[How.You.Found.Them]:</span> I hope this message finds you well. <span className="font-bold">[Mutual.Connection.Name]</span> suggested I reach out to you, as they thought your experience in <span className="font-bold">[Their.Expertise.Area]</span> would be invaluable to me as I <span className="font-bold">[Your.Current.Situation: explore career opportunities / transition into the field / expand my network in the industry]</span>.
      </div>
      
      {/* Alternative Opening (if no mutual connection) */}
      <div className="mb-4 bg-slate-50 border-l-4 border-slate-400 p-3 rounded-r">
        <div className="text-[7px] text-slate-600 italic">
          <strong>Alternative (No Mutual Connection):</strong> I discovered your profile on LinkedIn while researching leaders in [Industry/Field], and I was particularly impressed by [Specific.Achievement.Or.Article.Or.Project]. Your career trajectory from [Point.A] to [Point.B] resonates with my own professional aspirations.
        </div>
      </div>

      {/* Who You Are */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-lg p-4">
          <div className="text-sm font-bold text-violet-700 mb-2">👤 A BIT ABOUT ME</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I am currently <span className="font-bold">[Your.Current.Role.Or.Status]</span> at <span className="font-bold">[Your.Organization.Or.University]</span>, where I focus on <span className="font-bold">[Your.Work.Or.Study.Area]</span>. My background includes <span className="font-bold">[Brief.Experience.Summary]</span>, and I have a particular interest in <span className="font-bold">[Specific.Interest.Area]</span>. I'm currently <span className="font-bold">[Your.Goal: exploring opportunities in X / seeking to learn more about Y / building connections in Z]</span>.
          </div>
        </div>
      </div>

      {/* Why You're Reaching Out */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am reaching out because I genuinely admire <span className="font-bold">[Specific.Thing.About.Them.1]</span> and <span className="font-bold">[Specific.Thing.About.Them.2]</span>. Your insights on <span className="font-bold">[Topic.They.Know.About]</span> would be incredibly valuable as I <span className="font-bold">[Your.Specific.Goal]</span>. I'm particularly interested in learning about <span className="font-bold">[Specific.Question.Area.1]</span> and <span className="font-bold">[Specific.Question.Area.2]</span> based on your experience at <span className="font-bold">[Their.Current.Or.Previous.Company]</span>.
      </div>

      {/* The Ask - Informational Interview */}
      <div className="mb-4">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="text-sm font-bold text-blue-700 mb-2">☕ MY REQUEST</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            I would greatly appreciate the opportunity to have a brief <span className="font-bold">20-30 minute informational conversation</span> with you — either over coffee, via phone call, or video chat, whichever is most convenient for you. I'm respectful of your time and would work around your schedule. This is <span className="font-bold">not a job inquiry</span>; I'm simply seeking advice and insights from someone whose career path I admire.
          </div>
        </div>
      </div>

      {/* Specific Questions/Topics */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">💬 TOPICS I'D LOVE TO DISCUSS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-1">
            <div>• Your career journey and how you got into <span className="font-bold">[Their.Field]</span></div>
            <div>• Key skills and experiences that have been most valuable in your role</div>
            <div>• Current trends and challenges in <span className="font-bold">[Industry.Or.Field]</span></div>
            <div>• Advice for someone looking to <span className="font-bold">[Your.Goal]</span></div>
            <div>• Your perspective on <span className="font-bold">[Specific.Topic.Or.Question]</span></div>
            <div>• Any recommendations for resources, connections, or next steps</div>
          </div>
        </div>
      </div>

      {/* What You Bring (Value Exchange) */}
      <div className="mb-4">
        <div className="bg-violet-50 border-l-4 border-violet-600 p-4 rounded-r">
          <div className="text-sm font-bold text-violet-700 mb-2">🤝 WHAT I BRING TO THE CONVERSATION</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            While I'm seeking your guidance, I'd also be happy to share insights on <span className="font-bold">[Your.Area.Of.Knowledge.1]</span> or <span className="font-bold">[Your.Area.Of.Knowledge.2]</span> if that would be of interest. I believe in mutual value exchange and am always looking for ways to be helpful to my network. Additionally, if there's anything I can assist you with — whether it's <span className="font-bold">[Specific.Skill.Or.Help.You.Can.Offer]</span> — I'd be glad to help.
          </div>
        </div>
      </div>

      {/* Your Interest in Their Work */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I've been following your work, particularly <span className="font-bold">[Specific.Project.Article.Or.Achievement]</span>, and found <span className="font-bold">[What.You.Found.Interesting.Or.Valuable]</span>. Your perspective on <span className="font-bold">[Specific.Topic]</span> really resonated with me because <span className="font-bold">[Personal.Connection.Or.Experience]</span>. This is exactly why I believe a conversation with you would be so valuable.
      </div>

      {/* Flexibility & Availability */}
      <div className="mb-4">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="text-sm font-bold text-green-700 mb-2">📅 FLEXIBLE & RESPECTFUL OF YOUR TIME</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <div className="mb-2">I'm completely flexible and happy to work around your schedule. Some options:</div>
            <div className="space-y-1">
              <div>• <span className="font-bold">Coffee/Lunch:</span> I'd be happy to meet in person if you're in [Location]</div>
              <div>• <span className="font-bold">Phone Call:</span> A quick 20-minute call at your convenience</div>
              <div>• <span className="font-bold">Video Chat:</span> Zoom, Teams, or any platform you prefer</div>
              <div>• <span className="font-bold">Email Exchange:</span> If a conversation isn't possible, I'd appreciate any brief advice you could share</div>
            </div>
          </div>
        </div>
      </div>

      {/* No Pressure Approach */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I completely understand if your schedule doesn't allow for a meeting right now. If that's the case, I'd still be grateful for any brief advice you could share via email, or even a recommendation of others in your network who might be willing to speak with me. I'm also happy to follow up at a later time if that works better for you.
      </div>

      {/* How You'll Follow Up */}
      <div className="mb-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <span className="font-bold">Next Steps:</span> I'll follow up with a brief email in <span className="font-bold">[Timeframe: about a week / 10 days]</span> if I haven't heard back, but please don't feel obligated to respond if this doesn't align with your schedule or interests.
          </div>
        </div>
      </div>

      {/* Closing - Gratitude */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        Thank you so much for considering my request. I genuinely appreciate your time and any guidance you're able to provide. Connecting with professionals like yourself is invaluable as I navigate <span className="font-bold">[Your.Career.Stage.Or.Goal]</span>, and I'm grateful for any insights you might share.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-10">Warmly,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
        <div className="text-slate-600">[Your.Current.Title.Or.Role]</div>
        <div className="text-slate-600">[Your.Phone] | [Your.Email]</div>
        <div className="text-violet-600">[Your.LinkedIn.Profile]</div>
      </div>

      {/* P.S. (Optional but Effective) */}
      <div className="mt-6">
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <span className="font-bold">P.S.</span> [Optional: Reference something specific and recent about them - recent post, article, promotion, company news, etc. This shows genuine interest and that you've done your homework]
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-violet-50 border-2 border-violet-300 rounded-lg p-4">
        <div className="text-[8px] font-bold text-violet-900 mb-2">💡 NETWORKING TIPS (Remove before sending):</div>
        <div className="text-[7px] text-slate-600 leading-relaxed space-y-1">
          <div>• <strong>Personalize:</strong> Always reference something specific about them</div>
          <div>• <strong>Be Brief:</strong> Respect their time - keep it concise</div>
          <div>• <strong>No Job Asks:</strong> Make it clear you're seeking advice, not a job</div>
          <div>• <strong>Mutual Connection:</strong> Always mention if someone referred you</div>
          <div>• <strong>Value Exchange:</strong> Think about what you can offer them</div>
          <div>• <strong>Follow Through:</strong> If they agree to meet, be prepared with good questions</div>
          <div>• <strong>Thank You Note:</strong> Always send a thank you after the conversation</div>
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Networking Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #7c3aed;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 0.875rem;
      color: #7c3aed;
      margin-bottom: 0.75rem;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.7rem;
      color: #64748b;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      color: #7c3aed;
    }
    .manager-name {
      font-weight: bold;
    }

    /* Subject Box */
    .subject-box {
      background-color: #e9d5ff;
      border-left: 4px solid #7c3aed;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #581c87;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Highlight Boxes */
    .highlight-box {
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .about-me {
      background: linear-gradient(to right, #e9d5ff, #ddd6fe);
      border: 2px solid #c4b5fd;
    }
    .my-request {
      background-color: #dbeafe;
      border: 2px solid #93c5fd;
    }
    .topics {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
    }
    .value-exchange {
      background-color: #e9d5ff;
      border-left: 4px solid #7c3aed;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .flexibility {
      background-color: #dcfce7;
      border: 2px solid #bbf7d0;
      border-radius: 0.5rem;
    }
    .follow-up {
      background-color: #fef3c7;
      border-left: 4px solid #d97706;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }

    /* Alternative Opening */
    .alternative-opening {
      background-color: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.65rem;
      color: #64748b;
      font-style: italic;
    }

    /* List Items */
    .list-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .list-item::before {
      content: "•";
      color: #7c3aed;
      font-weight: bold;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }

    /* Tips Section */
    .tips-section {
      background-color: #e9d5ff;
      border: 2px solid #c4b5fd;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1.5rem;
    }
    .tips-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #581c87;
      margin-bottom: 0.5rem;
    }
    .tips-list {
      font-size: 0.65rem;
      color: #64748b;
      line-height: 1.4;
    }
    .tips-list div {
      margin-bottom: 0.25rem;
    }

    /* PS Section */
    .ps-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="title">[Your.Current.Title.Or.Role]</div>
    <div class="contact-info">
      <span>📧 [Your.Email]</span>
      <span>📱 [Your.Phone]</span>
      <span>📍 [Your.City], [Your.State]</span>
      <span>💼 [Your.LinkedIn]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name">[Contact.Person.Name]</div>
    <div>[Their.Title]</div>
    <div class="company-name">[Their.Company]</div>
    <div>[Company.Address] (if sending physically)</div>
    <div>[Contact.Person.Email] (if sending digitally)</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Subject: Request for Informational Interview - [Brief.Context.Or.Referral]
  </div>

  <!-- Salutation -->
  <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 1rem;">
    Dear [Contact.Person.Name],
  </div>

  <!-- Opening -->
  <div class="content-text">
    <span style="font-weight: bold;">[How.You.Found.Them]:</span> I hope this message finds you well. <span style="font-weight: bold;">[Mutual.Connection.Name]</span> suggested I reach out to you, as they thought your experience in <span style="font-weight: bold;">[Their.Expertise.Area]</span> would be invaluable to me as I <span style="font-weight: bold;">[Your.Current.Situation: explore career opportunities / transition into the field / expand my network in the industry]</span>.
  </div>

  <!-- Alternative Opening -->
  <div class="alternative-opening">
    <strong>Alternative (No Mutual Connection):</strong> I discovered your profile on LinkedIn while researching leaders in [Industry/Field], and I was particularly impressed by [Specific.Achievement.Or.Article.Or.Project]. Your career trajectory from [Point.A] to [Point.B] resonates with my own professional aspirations.
  </div>

  <!-- About Me -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box about-me">
      <div class="section-header">
        👤 A BIT ABOUT ME
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I am currently <span style="font-weight: bold;">[Your.Current.Role.Or.Status]</span> at <span style="font-weight: bold;">[Your.Organization.Or.University]</span>, where I focus on <span style="font-weight: bold;">[Your.Work.Or.Study.Area]</span>. My background includes <span style="font-weight: bold;">[Brief.Experience.Summary]</span>, and I have a particular interest in <span style="font-weight: bold;">[Specific.Interest.Area]</span>. I'm currently <span style="font-weight: bold;">[Your.Goal: exploring opportunities in X / seeking to learn more about Y / building connections in Z]</span>.
      </div>
    </div>
  </div>

  <!-- Why Reaching Out -->
  <div class="content-text">
    I am reaching out because I genuinely admire <span style="font-weight: bold;">[Specific.Thing.About.Them.1]</span> and <span style="font-weight: bold;">[Specific.Thing.About.Them.2]</span>. Your insights on <span style="font-weight: bold;">[Topic.They.Know.About]</span> would be incredibly valuable as I <span style="font-weight: bold;">[Your.Specific.Goal]</span>. I'm particularly interested in learning about <span style="font-weight: bold;">[Specific.Question.Area.1]</span> and <span style="font-weight: bold;">[Specific.Question.Area.2]</span> based on your experience at <span style="font-weight: bold;">[Their.Current.Or.Previous.Company]</span>.
  </div>

  <!-- My Request -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box my-request">
      <div class="section-header" style="color: #1e40af;">
        ☕ MY REQUEST
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        I would greatly appreciate the opportunity to have a brief <span style="font-weight: bold;">20-30 minute informational conversation</span> with you — either over coffee, via phone call, or video chat, whichever is most convenient for you. I'm respectful of your time and would work around your schedule. This is <span style="font-weight: bold;">not a job inquiry</span>; I'm simply seeking advice and insights from someone whose career path I admire.
      </div>
    </div>
  </div>

  <!-- Topics to Discuss -->
  <div style="margin-bottom: 1rem;">
    <div class="section-header">
      💬 TOPICS I'D LOVE TO DISCUSS
    </div>
    <div class="highlight-box topics">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <div class="list-item">Your career journey and how you got into <span style="font-weight: bold;">[Their.Field]</span></div>
        <div class="list-item">Key skills and experiences that have been most valuable in your role</div>
        <div class="list-item">Current trends and challenges in <span style="font-weight: bold;">[Industry.Or.Field]</span></div>
        <div class="list-item">Advice for someone looking to <span style="font-weight: bold;">[Your.Goal]</span></div>
        <div class="list-item">Your perspective on <span style="font-weight: bold;">[Specific.Topic.Or.Question]</span></div>
        <div class="list-item">Any recommendations for resources, connections, or next steps</div>
      </div>
    </div>
  </div>

  <!-- Value Exchange -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box value-exchange">
      <div class="section-header">
        🤝 WHAT I BRING TO THE CONVERSATION
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        While I'm seeking your guidance, I'd also be happy to share insights on <span style="font-weight: bold;">[Your.Area.Of.Knowledge.1]</span> or <span style="font-weight: bold;">[Your.Area.Of.Knowledge.2]</span> if that would be of interest. I believe in mutual value exchange and am always looking for ways to be helpful to my network. Additionally, if there's anything I can assist you with — whether it's <span style="font-weight: bold;">[Specific.Skill.Or.Help.You.Can.Offer]</span> — I'd be glad to help.
      </div>
    </div>
  </div>

  <!-- Interest in Their Work -->
  <div class="content-text">
    I've been following your work, particularly <span style="font-weight: bold;">[Specific.Project.Article.Or.Achievement]</span>, and found <span style="font-weight: bold;">[What.You.Found.Interesting.Or.Valuable]</span>. Your perspective on <span style="font-weight: bold;">[Specific.Topic]</span> really resonated with me because <span style="font-weight: bold;">[Personal.Connection.Or.Experience]</span>. This is exactly why I believe a conversation with you would be so valuable.
  </div>

  <!-- Flexibility -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box flexibility">
      <div class="section-header" style="color: #059669;">
        📅 FLEXIBLE & RESPECTFUL OF YOUR TIME
      </div>
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <div style="margin-bottom: 0.5rem;">I'm completely flexible and happy to work around your schedule. Some options:</div>
        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <div class="list-item">Coffee/Lunch: I'd be happy to meet in person if you're in [Location]</div>
          <div class="list-item">Phone Call: A quick 20-minute call at your convenience</div>
          <div class="list-item">Video Chat: Zoom, Teams, or any platform you prefer</div>
          <div class="list-item">Email Exchange: If a conversation isn't possible, I'd appreciate any brief advice you could share</div>
        </div>
      </div>
    </div>
  </div>

  <!-- No Pressure -->
  <div class="content-text">
    I completely understand if your schedule doesn't allow for a meeting right now. If that's the case, I'd still be grateful for any brief advice you could share via email, or even a recommendation of others in your network who might be willing to speak with me. I'm also happy to follow up at a later time if that works better for you.
  </div>

  <!-- Follow Up -->
  <div style="margin-bottom: 1rem;">
    <div class="highlight-box follow-up">
      <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
        <span style="font-weight: bold;">Next Steps:</span> I'll follow up with a brief email in <span style="font-weight: bold;">[Timeframe: about a week / 10 days]</span> if I haven't heard back, but please don't feel obligated to respond if this doesn't align with your schedule or interests.
      </div>
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    Thank you so much for considering my request. I genuinely appreciate your time and any guidance you're able to provide. Connecting with professionals like yourself is invaluable as I navigate <span style="font-weight: bold;">[Your.Career.Stage.Or.Goal]</span>, and I'm grateful for any insights you might share.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Warmly,</div>
    <div class="signature-name">[Your.Full.Name]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Current.Title.Or.Role]</div>
    <div style="font-size: 0.7rem; color: #64748b;">[Your.Phone] | [Your.Email]</div>
    <div style="font-size: 0.7rem; color: #7c3aed;">[Your.LinkedIn.Profile]</div>
  </div>

  <!-- PS Section -->
  <div class="ps-section">
    <div style="font-weight: bold;">P.S.</div> [Optional: Reference something specific and recent about them - recent post, article, promotion, company news, etc. This shows genuine interest and that you've done your homework]
  </div>

  <!-- Tips Section -->
  <div class="tips-section">
    <div class="tips-title">💡 NETWORKING TIPS (Remove before sending):</div>
    <div class="tips-list">
      <div>• <strong>Personalize:</strong> Always reference something specific about them</div>
      <div>• <strong>Be Brief:</strong> Respect their time - keep it concise</div>
      <div>• <strong>No Job Asks:</strong> Make it clear you're seeking advice, not a job</div>
      <div>• <strong>Mutual Connection:</strong> Always mention if someone referred you</div>
      <div>• <strong>Value Exchange:</strong> Think about what you can offer them</div>
      <div>• <strong>Follow Through:</strong> If they agree to meet, be prepared with good questions</div>
      <div>• <strong>Thank You Note:</strong> Always send a thank you after the conversation</div>
    </div>
  </div>
</body>
</html>
`
},

{
  id: 'career-change-cover-letter-001',
  name: 'Career Change Cover Letter',
  description: 'Cover letter for transitioning to new industry',
  category: 'resumes',
  popular: false,
  fields: ['Current Career', 'Target Career', 'Transferable Skills', 'Motivation'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-4 border-teal-600 pb-4 mb-6">
        <div className="text-2xl font-bold text-slate-900 mb-1">[Your.Full.Name]</div>
        <div className="text-[8px] text-slate-600 flex gap-3 flex-wrap">
          <span>[Your.Address], [Your.City], [Your.State] [Your.Zip]</span>
          <span>•</span>
          <span>[Your.Phone]</span>
          <span>•</span>
          <span className="text-teal-600">[Your.Email]</span>
          <span>•</span>
          <span className="text-teal-600">[Your.LinkedIn]</span>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4 text-[8px] text-slate-700">[Current.Date]</div>

      {/* Recipient */}
      <div className="mb-6 text-[8px] text-slate-700 leading-relaxed">
        <div className="font-bold">[Hiring.Manager.Name]</div>
        <div>[Hiring.Manager.Title]</div>
        <div className="font-bold text-teal-700">[Company.Name]</div>
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.ZipCode]</div>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <div className="bg-teal-50 border-l-4 border-teal-600 p-3 rounded-r">
          <div className="text-[8px] font-bold text-teal-900">
            Subject: Application for [Position.Title] - Bringing [Years.Experience] Years of Proven Results to [New.Industry]
          </div>
        </div>
      </div>

      {/* Salutation */}
      <div className="mb-4 text-[8px] text-slate-700">
        Dear [Hiring.Manager.Name],
      </div>

      {/* Opening - Address the Career Change */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am writing to express my enthusiastic interest in the <span className="font-bold">[Position.Title]</span> position at <span className="font-bold text-teal-600">[Company.Name]</span>. While my background is in <span className="font-bold">[Current.Industry]</span>, I am making a strategic transition to <span className="font-bold">[Target.Industry]</span> — a move driven by my passion for <span className="font-bold">[Passion.Area]</span> and aligned with my long-term career aspirations. My <span className="font-bold">[Years.Experience]</span> years of experience have equipped me with transferable skills that directly apply to this role and will enable me to make an immediate impact.
      </div>

      {/* Why Career Change */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-lg p-4">
          <div className="text-sm font-bold text-teal-700 mb-2">🎯 WHY THIS CAREER TRANSITION</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            My decision to transition from <span className="font-bold">[Current.Industry]</span> to <span className="font-bold">[Target.Industry]</span> stems from <span className="font-bold">[Motivation.1]</span> and <span className="font-bold">[Motivation.2]</span>. Over the past <span className="font-bold">[Timeframe]</span>, I have <span className="font-bold">[Preparation.Steps.Taken]</span>, including <span className="font-bold">[Courses.Or.Certifications]</span>, <span className="font-bold">[Projects.Or.Volunteering]</span>, and <span className="font-bold">[Networking.Or.Research]</span>. This isn't a impulsive decision — it's a calculated move based on thorough preparation and genuine passion.
          </div>
        </div>
      </div>

      {/* Transferable Skills */}
      <div className="mb-4">
        <div className="text-sm font-bold text-slate-900 mb-2">🔄 TRANSFERABLE SKILLS & RELEVANT EXPERIENCE</div>
        <div className="space-y-2">
          <div className="bg-white border-l-4 border-teal-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-teal-700 mb-1">[Skill.1] (From [Current.Industry] to [Target.Industry])</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              In my role as <span className="font-bold">[Current.Job.Title]</span>, I <span className="font-bold">[Achievement.With.Skill.1]</span>. This directly translates to <span className="font-bold">[How.It.Applies.To.New.Role]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-cyan-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-cyan-700 mb-1">[Skill.2] (Proven Track Record)</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              I successfully <span className="font-bold">[Achievement.With.Skill.2]</span>, demonstrating my ability to <span className="font-bold">[Capability.Relevant.To.New.Role]</span>, which is essential for <span className="font-bold">[Target.Industry]</span>.
            </div>
          </div>
          <div className="bg-white border-l-4 border-teal-600 p-3 rounded-r shadow-sm">
            <div className="font-bold text-[8px] text-teal-700 mb-1">[Skill.3] (Universal Value)</div>
            <div className="text-[8px] text-slate-700 leading-relaxed">
              My experience in <span className="font-bold">[Specific.Area]</span> has honed my <span className="font-bold">[Skill.Description]</span>, which I understand is critical for success in the <span className="font-bold">[Position.Title]</span> role.
            </div>
          </div>
        </div>
      </div>

      {/* Relevant Accomplishments */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        Despite coming from a different industry, my accomplishments demonstrate capabilities directly applicable to your needs. I've <span className="font-bold">[Quantifiable.Achievement.1]</span>, <span className="font-bold">[Quantifiable.Achievement.2]</span>, and <span className="font-bold">[Quantifiable.Achievement.3]</span>. These results showcase my ability to <span className="font-bold">[Key.Ability.1]</span>, <span className="font-bold">[Key.Ability.2]</span>, and <span className="font-bold">[Key.Ability.3]</span> — skills that transcend industry boundaries and are essential for the <span className="font-bold">[Position.Title]</span> position.
      </div>

      {/* Preparation & Commitment */}
      <div className="mb-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-sm font-bold text-yellow-800 mb-2">📚 PREPARATION & COMMITMENT TO SUCCESS</div>
          <div className="text-[8px] text-slate-700 leading-relaxed">
            To ensure a successful transition, I have proactively <span className="font-bold">[Preparation.Action.1]</span>, completed <span className="font-bold">[Certification.Or.Course]</span>, and gained hands-on experience through <span className="font-bold">[Project.Or.Volunteer.Work]</span>. I've also <span className="font-bold">[Networking.Or.Industry.Research]</span> to deepen my understanding of <span className="font-bold">[Target.Industry]</span>. This groundwork demonstrates my commitment and ensures I can contribute effectively from day one.
          </div>
        </div>
      </div>

      {/* Why This Company */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        <span className="font-bold text-teal-600">[Company.Name]</span> stands out to me because of <span className="font-bold">[Company.Unique.Quality]</span> and your innovative approach to <span className="font-bold">[Company.Focus.Area]</span>. I'm particularly impressed by <span className="font-bold">[Specific.Company.Initiative.Or.Value]</span>, which aligns perfectly with my professional philosophy. I believe my fresh perspective from <span className="font-bold">[Current.Industry]</span>, combined with my transferable skills and genuine enthusiasm, would bring unique value to your team.
      </div>

      {/* What You Offer */}
      <div className="mb-4">
        <div className="bg-teal-50 border-l-4 border-teal-600 p-4 rounded-r">
          <div className="text-sm font-bold text-teal-700 mb-2">💡 WHAT I BRING TO THE TABLE</div>
          <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
            <div>• <span className="font-bold">Fresh Perspective:</span> Cross-industry insights that can drive innovation and creative problem-solving</div>
            <div>• <span className="font-bold">Proven Results:</span> Track record of [Key.Result.Area] with measurable outcomes</div>
            <div>• <span className="font-bold">Adaptability:</span> Demonstrated ability to learn quickly and excel in new environments</div>
            <div>• <span className="font-bold">Transferable Expertise:</span> [Years.Experience] years of applicable skills in [Skill.Area.1], [Skill.Area.2], and [Skill.Area.3]</div>
            <div>• <span className="font-bold">Genuine Passion:</span> Authentic enthusiasm for [Target.Industry] backed by concrete preparation</div>
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="mb-4 text-[8px] text-slate-700 leading-relaxed">
        I am confident that my unique combination of <span className="font-bold">[Current.Industry]</span> experience and passion for <span className="font-bold">[Target.Industry]</span> makes me an excellent fit for the <span className="font-bold">[Position.Title]</span> role. I would welcome the opportunity to discuss how my background and fresh perspective can contribute to <span className="font-bold text-teal-600">[Company.Name]</span>'s continued success. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.
      </div>

      {/* Signature */}
      <div className="mt-6 text-[8px] text-slate-700">
        <div className="mb-10">Sincerely,</div>
        <div className="font-bold text-slate-900 text-sm">[Your.Full.Name]</div>
      </div>

      {/* Enclosure */}
      <div className="mt-6">
        <div className="bg-slate-100 border-l-4 border-slate-400 p-2 rounded-r text-[7px] text-slate-600">
          Enclosures: Resume, Portfolio (if applicable), Certifications
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career Change Cover Letter</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      border-bottom: 4px solid #0d9488;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .name {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .contact-info {
      font-size: 0.7rem;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .contact-info span {
      display: flex;
      align-items: center;
    }
    .contact-info .separator {
      font-weight: bold;
    }
    .email, .linkedin {
      color: #0d9488;
    }

    /* Date */
    .date {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Recipient */
    .recipient {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .recipient .company-name {
      font-weight: bold;
      color: #0f766e;
    }
    .recipient .manager-name {
      font-weight: bold;
    }

    /* Subject Box */
    .subject-box {
      background-color: #d1fae5;
      border-left: 4px solid #0d9488;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: bold;
      color: #04473d;
    }

    /* Salutation */
    .salutation {
      font-size: 0.7rem;
      color: #64748b;
      margin-bottom: 1rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Content Text */
    .content-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    /* Highlight Boxes */
    .highlight-box {
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      line-height: 1.4;
    }
    .why-transition {
      background: linear-gradient(to right, #d1fae5, #a7f3d0);
      border: 2px solid #a7f3d0;
    }
    .preparation {
      background-color: #fef3c7;
      border: 2px solid #fde68a;
    }
    .what-i-bring {
      background-color: #d1fae5;
      border-left: 4px solid #0d9488;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }

    /* Skill Boxes */
    .skill-box {
      background-color: #fff;
      border-left: 4px solid #0d9488;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .skill-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #0f766e;
      margin-bottom: 0.25rem;
    }
    .skill-description {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }

    /* List Items */
    .list-item {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .list-item::before {
      content: "•";
      color: #0d9488;
      font-weight: bold;
    }

    /* Signature */
    .signature {
      margin-top: 1.5rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-name {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-top: 2rem;
    }

    /* Enclosure */
    .enclosure {
      background-color: #f1f5f9;
      border-left: 4px solid #cbd5e1;
      padding: 0.5rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-top: 1.5rem;
      font-size: 0.65rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">[Your.Full.Name]</div>
    <div class="contact-info">
      <span>[Your.Address], [Your.City], [Your.State] [Your.Zip]</span>
      <span class="separator">•</span>
      <span>[Your.Phone]</span>
      <span class="separator">•</span>
      <span class="email">[Your.Email]</span>
      <span class="separator">•</span>
      <span class="linkedin">[Your.LinkedIn]</span>
    </div>
  </div>

  <!-- Date -->
  <div class="date">[Current.Date]</div>

  <!-- Recipient -->
  <div class="recipient">
    <div class="manager-name">[Hiring.Manager.Name]</div>
    <div>[Hiring.Manager.Title]</div>
    <div class="company-name">[Company.Name]</div>
    <div>[Company.Address]</div>
    <div>[Company.City], [Company.State] [Company.ZipCode]</div>
  </div>

  <!-- Subject -->
  <div class="subject-box">
    Subject: Application for [Position.Title] - Bringing [Years.Experience] Years of Proven Results to [New.Industry]
  </div>

  <!-- Salutation -->
  <div class="salutation">Dear [Hiring.Manager.Name],</div>

  <!-- Opening -->
  <div class="content-text">
    I am writing to express my enthusiastic interest in the <span style="font-weight: bold;">[Position.Title]</span> position at <span style="font-weight: bold; color: #0d9488;">[Company.Name]</span>. While my background is in <span style="font-weight: bold;">[Current.Industry]</span>, I am making a strategic transition to <span style="font-weight: bold;">[Target.Industry]</span> — a move driven by my passion for <span style="font-weight: bold;">[Passion.Area]</span> and aligned with my long-term career aspirations. My <span style="font-weight: bold;">[Years.Experience]</span> years of experience have equipped me with transferable skills that directly apply to this role and will enable me to make an immediate impact.
  </div>

  <!-- Why Career Change -->
  <div class="highlight-box why-transition">
    <div class="section-header">
      🎯 WHY THIS CAREER TRANSITION
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      My decision to transition from <span style="font-weight: bold;">[Current.Industry]</span> to <span style="font-weight: bold;">[Target.Industry]</span> stems from <span style="font-weight: bold;">[Motivation.1]</span> and <span style="font-weight: bold;">[Motivation.2]</span>. Over the past <span style="font-weight: bold;">[Timeframe]</span>, I have <span style="font-weight: bold;">[Preparation.Steps.Taken]</span>, including <span style="font-weight: bold;">[Courses.Or.Certifications]</span>, <span style="font-weight: bold;">[Projects.Or.Volunteering]</span>, and <span style="font-weight: bold;">[Networking.Or.Research]</span>. This isn't a impulsive decision — it's a calculated move based on thorough preparation and genuine passion.
    </div>
  </div>

  <!-- Transferable Skills -->
  <div class="section-header">🔄 TRANSFERABLE SKILLS & RELEVANT EXPERIENCE</div>
  <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
    <div class="skill-box">
      <div class="skill-title">[Skill.1] (From [Current.Industry] to [Target.Industry])</div>
      <div class="skill-description">
        In my role as <span style="font-weight: bold;">[Current.Job.Title]</span>, I <span style="font-weight: bold;">[Achievement.With.Skill.1]</span>. This directly translates to <span style="font-weight: bold;">[How.It.Applies.To.New.Role]</span>.
      </div>
    </div>
    <div class="skill-box" style="border-left-color: #0891b2;">
      <div class="skill-title" style="color: #085f63;">[Skill.2] (Proven Track Record)</div>
      <div class="skill-description">
        I successfully <span style="font-weight: bold;">[Achievement.With.Skill.2]</span>, demonstrating my ability to <span style="font-weight: bold;">[Capability.Relevant.To.New.Role]</span>, which is essential for <span style="font-weight: bold;">[Target.Industry]</span>.
      </div>
    </div>
    <div class="skill-box">
      <div class="skill-title">[Skill.3] (Universal Value)</div>
      <div class="skill-description">
        My experience in <span style="font-weight: bold;">[Specific.Area]</span> has honed my <span style="font-weight: bold;">[Skill.Description]</span>, which I understand is critical for success in the <span style="font-weight: bold;">[Position.Title]</span> role.
      </div>
    </div>
  </div>

  <!-- Relevant Accomplishments -->
  <div class="content-text">
    Despite coming from a different industry, my accomplishments demonstrate capabilities directly applicable to your needs. I've <span style="font-weight: bold;">[Quantifiable.Achievement.1]</span>, <span style="font-weight: bold;">[Quantifiable.Achievement.2]</span>, and <span style="font-weight: bold;">[Quantifiable.Achievement.3]</span>. These results showcase my ability to <span style="font-weight: bold;">[Key.Ability.1]</span>, <span style="font-weight: bold;">[Key.Ability.2]</span>, and <span style="font-weight: bold;">[Key.Ability.3]</span> — skills that transcend industry boundaries and are essential for the <span style="font-weight: bold;">[Position.Title]</span> position.
  </div>

  <!-- Preparation & Commitment -->
  <div class="highlight-box preparation">
    <div class="section-header" style="color: #92400e;">
      📚 PREPARATION & COMMITMENT TO SUCCESS
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4;">
      To ensure a successful transition, I have proactively <span style="font-weight: bold;">[Preparation.Action.1]</span>, completed <span style="font-weight: bold;">[Certification.Or.Course]</span>, and gained hands-on experience through <span style="font-weight: bold;">[Project.Or.Volunteer.Work]</span>. I've also <span style="font-weight: bold;">[Networking.Or.Industry.Research]</span> to deepen my understanding of <span style="font-weight: bold;">[Target.Industry]</span>. This groundwork demonstrates my commitment and ensures I can contribute effectively from day one.
    </div>
  </div>

  <!-- Why This Company -->
  <div class="content-text">
    <span style="font-weight: bold; color: #0d9488;">[Company.Name]</span> stands out to me because of <span style="font-weight: bold;">[Company.Unique.Quality]</span> and your innovative approach to <span style="font-weight: bold;">[Company.Focus.Area]</span>. I'm particularly impressed by <span style="font-weight: bold;">[Specific.Company.Initiative.Or.Value]</span>, which aligns perfectly with my professional philosophy. I believe my fresh perspective from <span style="font-weight: bold;">[Current.Industry]</span>, combined with my transferable skills and genuine enthusiasm, would bring unique value to your team.
  </div>

  <!-- What You Bring -->
  <div class="highlight-box what-i-bring">
    <div class="section-header">
      💡 WHAT I BRING TO THE TABLE
    </div>
    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.4; margin-top: 0.5rem;">
      <div class="list-item">Fresh Perspective: Cross-industry insights that can drive innovation and creative problem-solving</div>
      <div class="list-item">Proven Results: Track record of [Key.Result.Area] with measurable outcomes</div>
      <div class="list-item">Adaptability: Demonstrated ability to learn quickly and excel in new environments</div>
      <div class="list-item">Transferable Expertise: [Years.Experience] years of applicable skills in [Skill.Area.1], [Skill.Area.2], and [Skill.Area.3]</div>
      <div class="list-item">Genuine Passion: Authentic enthusiasm for [Target.Industry] backed by concrete preparation</div>
    </div>
  </div>

  <!-- Closing -->
  <div class="content-text">
    I am confident that my unique combination of <span style="font-weight: bold;">[Current.Industry]</span> experience and passion for <span style="font-weight: bold;">[Target.Industry]</span> makes me an excellent fit for the <span style="font-weight: bold;">[Position.Title]</span> role. I would welcome the opportunity to discuss how my background and fresh perspective can contribute to <span style="font-weight: bold; color: #0d9488;">[Company.Name]</span>'s continued success. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.
  </div>

  <!-- Signature -->
  <div class="signature">
    <div>Sincerely,</div>
    <div class="signature-name">[Your.Full.Name]</div>
  </div>

  <!-- Enclosure -->
  <div class="enclosure">
    Enclosures: Resume, Portfolio (if applicable), Certifications
  </div>
</body>
</html>
`
},
{
  id: 'legal-agreement-001',
  name: 'Professional Legal Agreement',
  description: 'Modern, legally robust, and visually polished agreement template for business and professional use',
  category: 'legal',
  popular: true,
  fields: [
    'Agreement Title',
    'Agreement Number',
    'Effective Date',
    'Party 1 Name',
    'Party 1 Address',
    'Party 1 Contact',
    'Party 1 Representative',
    'Party 2 Name',
    'Party 2 Address',
    'Party 2 Contact',
    'Party 2 Representative',
    'Agreement Purpose',
    'Term Start Date',
    'Term End Date',
    'Confidentiality Period',
    'Payment Amount',
    'Payment Schedule',
    'Governing Law',
    'Dispute Resolution Method',
    'Signatory 1 Name',
    'Signatory 1 Title',
    'Signatory 2 Name',
    'Signatory 2 Title'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-8 pb-6 border-b-4 border-blue-800">
        <div className="text-4xl font-bold text-slate-900 mb-2">[Agreement.Title]</div>
        <div className="text-lg text-blue-800 font-semibold mb-3">Agreement Number: [Agreement.Number]</div>
        <div className="text-sm text-slate-600">Effective Date: [Effective.Date]</div>
      </div>

      {/* Parties Section */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PARTIES</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Party 1</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Party1.Name]</div>
              <div><strong>Address:</strong> [Party1.Address]</div>
              <div><strong>Contact:</strong> [Party1.Contact]</div>
              <div><strong>Representative:</strong> [Party1.Representative]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Party 2</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Party2.Name]</div>
              <div><strong>Address:</strong> [Party2.Address]</div>
              <div><strong>Contact:</strong> [Party2.Contact]</div>
              <div><strong>Representative:</strong> [Party2.Representative]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recitals Section */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">RECITALS</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div>WHEREAS, [Party1.Name] is engaged in the business of [Party1.Business];</div>
          <div>WHEREAS, [Party2.Name] is engaged in the business of [Party2.Business];</div>
          <div>WHEREAS, the Parties desire to enter into this Agreement for the purpose of [Agreement.Purpose];</div>
          <div>NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the Parties agree as follows:</div>
        </div>
      </div>

      {/* Term & Termination */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">TERM & TERMINATION</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>1. Term:</strong> This Agreement shall commence on [Term.Start.Date] and continue until [Term.End.Date], unless terminated earlier as provided herein.</div>
          <div><strong>2. Termination for Cause:</strong> Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any term and fails to cure such breach within [Cure.Period] days of written notice.</div>
          <div><strong>3. Termination for Convenience:</strong> Either Party may terminate this Agreement with [Notice.Period] days written notice.</div>
          <div><strong>4. Effect of Termination:</strong> Upon termination, all obligations shall cease except for those expressly surviving termination, including confidentiality and indemnification.</div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">CONFIDENTIALITY</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>1. Definition:</strong> "Confidential Information" means all non-public information disclosed by one Party to the other, whether oral, written, or electronic.</div>
          <div><strong>2. Obligations:</strong> The receiving Party shall maintain the confidentiality of all Confidential Information and use it solely for the purpose of this Agreement.</div>
          <div><strong>3. Exclusions:</strong> Confidential Information does not include information that is or becomes publicly available through no fault of the receiving Party.</div>
          <div><strong>4. Term:</strong> The confidentiality obligations shall survive termination of this Agreement for [Confidentiality.Period] years.</div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PAYMENT TERMS</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>1. Fees:</strong> [Party2.Name] shall pay [Party1.Name] the sum of [Payment.Amount] for the services rendered, as detailed in Exhibit A.</div>
          <div><strong>2. Payment Schedule:</strong> Payment shall be made as follows: [Payment.Schedule]</div>
          <div><strong>3. Late Fees:</strong> Late payments shall incur a [Late.Fee]% monthly interest charge.</div>
          <div><strong>4. Invoicing:</strong> Invoices shall be submitted [Invoicing.Frequency] and are due within [Payment.Term] days of receipt.</div>
        </div>
      </div>

      {/* Governing Law */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">GOVERNING LAW & DISPUTE RESOLUTION</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>1. Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of [Governing.Law].</div>
          <div><strong>2. Dispute Resolution:</strong> Any dispute arising out of or relating to this Agreement shall be resolved by [Dispute.Resolution.Method] in [Jurisdiction].</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">SIGNATURES</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">[Party1.Name]</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Signatory1.Name]</div>
              <div><strong>Title:</strong> [Signatory1.Title]</div>
              <div><strong>Date:</strong> [Signatory1.Date]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">[Party2.Name]</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Signatory2.Name]</div>
              <div><strong>Title:</strong> [Signatory2.Title]</div>
              <div><strong>Date:</strong> [Signatory2.Date]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>This document is legally binding and should be reviewed by legal counsel before signing.</div>
        <div className="mt-1">Last Updated: [Last.Updated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Agreement.Title]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid #1e40af;
    }
    .header-title {
      font-size: 2.25rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .header-subtitle {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.75rem;
    }
    .header-details {
      font-size: 0.875rem;
      color: #64748b;
    }

    /* Section Styles */
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #1e40af;
    }

    /* Party Boxes */
    .party-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .party-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .party-title {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .party-details {
      font-size: 0.75rem;
      color: #64748b;
    }
    .party-details div {
      margin-bottom: 0.25rem;
    }

    /* Content Styles */
    .content-text {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }
    .content-list {
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    /* Signature Section */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .signature-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .signature-title {
      font-size: 0.875rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .signature-details {
      font-size: 0.75rem;
      color: #64748b;
    }
    .signature-details div {
      margin-bottom: 0.25rem;
    }
    .signature-line {
      border-top: 1px solid #cbd5e1;
      margin-top: 1rem;
      padding-top: 0.5rem;
      text-align: center;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <div class="header-title">[Agreement.Title]</div>
    <div class="header-subtitle">Agreement Number: [Agreement.Number]</div>
    <div class="header-details">Effective Date: [Effective.Date]</div>
  </div>

  <!-- Parties Section -->
  <div class="section">
    <div class="section-title">PARTIES</div>
    <div class="party-grid">
      <div class="party-box">
        <div class="party-title">Party 1</div>
        <div class="party-details">
          <div><strong>Name:</strong> [Party1.Name]</div>
          <div><strong>Address:</strong> [Party1.Address]</div>
          <div><strong>Contact:</strong> [Party1.Contact]</div>
          <div><strong>Representative:</strong> [Party1.Representative]</div>
        </div>
      </div>
      <div class="party-box">
        <div class="party-title">Party 2</div>
        <div class="party-details">
          <div><strong>Name:</strong> [Party2.Name]</div>
          <div><strong>Address:</strong> [Party2.Address]</div>
          <div><strong>Contact:</strong> [Party2.Contact]</div>
          <div><strong>Representative:</strong> [Party2.Representative]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Recitals Section -->
  <div class="section">
    <div class="section-title">RECITALS</div>
    <div class="content-text">
      <div>WHEREAS, [Party1.Name] is engaged in the business of [Party1.Business];</div>
      <div>WHEREAS, [Party2.Name] is engaged in the business of [Party2.Business];</div>
      <div>WHEREAS, the Parties desire to enter into this Agreement for the purpose of [Agreement.Purpose];</div>
      <div>NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the Parties agree as follows:</div>
    </div>
  </div>

  <!-- Term & Termination -->
  <div class="section">
    <div class="section-title">TERM & TERMINATION</div>
    <div class="content-text">
      <div><strong>1. Term:</strong> This Agreement shall commence on [Term.Start.Date] and continue until [Term.End.Date], unless terminated earlier as provided herein.</div>
      <div><strong>2. Termination for Cause:</strong> Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any term and fails to cure such breach within [Cure.Period] days of written notice.</div>
      <div><strong>3. Termination for Convenience:</strong> Either Party may terminate this Agreement with [Notice.Period] days written notice.</div>
      <div><strong>4. Effect of Termination:</strong> Upon termination, all obligations shall cease except for those expressly surviving termination, including confidentiality and indemnification.</div>
    </div>
  </div>

  <!-- Confidentiality -->
  <div class="section">
    <div class="section-title">CONFIDENTIALITY</div>
    <div class="content-text">
      <div><strong>1. Definition:</strong> "Confidential Information" means all non-public information disclosed by one Party to the other, whether oral, written, or electronic.</div>
      <div><strong>2. Obligations:</strong> The receiving Party shall maintain the confidentiality of all Confidential Information and use it solely for the purpose of this Agreement.</div>
      <div><strong>3. Exclusions:</strong> Confidential Information does not include information that is or becomes publicly available through no fault of the receiving Party.</div>
      <div><strong>4. Term:</strong> The confidentiality obligations shall survive termination of this Agreement for [Confidentiality.Period] years.</div>
    </div>
  </div>

  <!-- Payment Terms -->
  <div class="section">
    <div class="section-title">PAYMENT TERMS</div>
    <div class="content-text">
      <div><strong>1. Fees:</strong> [Party2.Name] shall pay [Party1.Name] the sum of [Payment.Amount] for the services rendered, as detailed in Exhibit A.</div>
      <div><strong>2. Payment Schedule:</strong> Payment shall be made as follows: [Payment.Schedule]</div>
      <div><strong>3. Late Fees:</strong> Late payments shall incur a [Late.Fee]% monthly interest charge.</div>
      <div><strong>4. Invoicing:</strong> Invoices shall be submitted [Invoicing.Frequency] and are due within [Payment.Term] days of receipt.</div>
    </div>
  </div>

  <!-- Governing Law -->
  <div class="section">
    <div class="section-title">GOVERNING LAW & DISPUTE RESOLUTION</div>
    <div class="content-text">
      <div><strong>1. Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of [Governing.Law].</div>
      <div><strong>2. Dispute Resolution:</strong> Any dispute arising out of or relating to this Agreement shall be resolved by [Dispute.Resolution.Method] in [Jurisdiction].</div>
    </div>
  </div>

  <!-- Signatures -->
  <div class="section">
    <div class="section-title">SIGNATURES</div>
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-title">[Party1.Name]</div>
        <div class="signature-details">
          <div><strong>Name:</strong> [Signatory1.Name]</div>
          <div><strong>Title:</strong> [Signatory1.Title]</div>
          <div><strong>Date:</strong> [Signatory1.Date]</div>
          <div class="signature-line">
            <strong>Signature:</strong> ________________________
          </div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-title">[Party2.Name]</div>
        <div class="signature-details">
          <div><strong>Name:</strong> [Signatory2.Name]</div>
          <div><strong>Title:</strong> [Signatory2.Title]</div>
          <div><strong>Date:</strong> [Signatory2.Date]</div>
          <div class="signature-line">
            <strong>Signature:</strong> ________________________
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>This document is legally binding and should be reviewed by legal counsel before signing.</div>
    <div style="margin-top: 0.25rem;">Last Updated: [Last.Updated.Date]</div>
  </div>
</body>
</html>

  `
}, 

{
  id: 'statement-of-work-001',
  name: 'Professional Statement of Work',
  description: 'Modern, detailed, and visually polished SOW template for projects, services, and deliverables',
  category: 'legal',
  popular: true,
  fields: [
    'Project Title',
    'Project Number',
    'Effective Date',
    'Client Name',
    'Client Contact',
    'Vendor Name',
    'Vendor Contact',
    'Project Manager',
    'Project Overview',
    'Project Objectives',
    'Scope of Work',
    'Deliverables',
    'Timeline',
    'Milestones',
    'Assumptions',
    'Dependencies',
    'Acceptance Criteria',
    'Payment Terms',
    'Confidentiality',
    'Termination Clause',
    'Signatory 1 Name',
    'Signatory 1 Title',
    'Signatory 2 Name',
    'Signatory 2 Title'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-8 pb-6 border-b-4 border-blue-800">
        <div className="text-4xl font-bold text-slate-900 mb-2">STATEMENT OF WORK</div>
        <div className="text-lg text-blue-800 font-semibold mb-3">Project: [Project.Title]</div>
        <div className="text-sm text-slate-600">Project Number: [Project.Number] | Effective Date: [Effective.Date]</div>
      </div>

      {/* Parties Section */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PARTIES</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Client</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Client.Name]</div>
              <div><strong>Contact:</strong> [Client.Contact]</div>
              <div><strong>Address:</strong> [Client.Address]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Vendor</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Vendor.Name]</div>
              <div><strong>Contact:</strong> [Vendor.Contact]</div>
              <div><strong>Address:</strong> [Vendor.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PROJECT OVERVIEW</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>Project Manager:</strong> [Project.Manager]</div>
          <div><strong>Overview:</strong> [Project.Overview]</div>
          <div><strong>Objectives:</strong> [Project.Objectives]</div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">SCOPE OF WORK</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div>[Scope.of.Work]</div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">DELIVERABLES</div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-blue-50 border-l-4 border-blue-800 p-3 rounded-r">
              <div className="font-bold text-slate-900 text-[8px] mb-1">Deliverable {i+1}: [Deliverable.{i+1}.Name]</div>
              <div className="text-[8px] text-slate-700 leading-relaxed">
                <div><strong>Description:</strong> [Deliverable.{i+1}.Description]</div>
                <div><strong>Due Date:</strong> [Deliverable.{i+1}.DueDate]</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline & Milestones */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">TIMELINE & MILESTONES</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>Project Start Date:</strong> [Timeline.Start.Date]</div>
          <div><strong>Project End Date:</strong> [Timeline.End.Date]</div>
          <div className="mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-2">
                <div className="font-bold">Milestone {i+1}: [Milestone.{i+1}.Name]</div>
                <div><strong>Description:</strong> [Milestone.{i+1}.Description]</div>
                <div><strong>Due Date:</strong> [Milestone.{i+1}.DueDate]</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions & Dependencies */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">ASSUMPTIONS & DEPENDENCIES</div>
        <div className="grid grid-cols-2 gap-4 text-[8px]">
          <div>
            <div className="font-bold text-slate-900 mb-2">Assumptions</div>
            <div className="text-slate-700 leading-relaxed space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i}>• [Assumption.{i+1}]</div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-900 mb-2">Dependencies</div>
            <div className="text-slate-700 leading-relaxed space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i}>• [Dependency.{i+1}]</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">ACCEPTANCE CRITERIA</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i}>• [Acceptance.Criteria.{i+1}]</div>
          ))}
        </div>
      </div>

      {/* Payment Terms */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PAYMENT TERMS</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div><strong>Total Project Fee:</strong> [Payment.Total.Fee]</div>
          <div><strong>Payment Schedule:</strong> [Payment.Schedule]</div>
          <div><strong>Invoicing:</strong> [Invoicing.Details]</div>
          <div><strong>Late Fees:</strong> [Late.Fee.Details]</div>
        </div>
      </div>

      {/* Confidentiality */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">CONFIDENTIALITY</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div>[Confidentiality.Clauses]</div>
        </div>
      </div>

      {/* Termination Clause */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">TERMINATION CLAUSE</div>
        <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
          <div>[Termination.Clauses]</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">SIGNATURES</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Client</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Signatory1.Name]</div>
              <div><strong>Title:</strong> [Signatory1.Title]</div>
              <div><strong>Date:</strong> [Signatory1.Date]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Vendor</div>
            <div className="text-[8px] text-slate-700">
              <div><strong>Name:</strong> [Signatory2.Name]</div>
              <div><strong>Title:</strong> [Signatory2.Title]</div>
              <div><strong>Date:</strong> [Signatory2.Date]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>This document is legally binding and should be reviewed by legal counsel before signing.</div>
        <div className="mt-1">Last Updated: [Last.Updated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statement of Work: [Project.Title]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #fff;
    }

    /* Header Styles */
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 4px solid #1e40af;
    }
    .header-title {
      font-size: 2.25rem; /* text-4xl */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .header-subtitle {
      font-size: 1.125rem; /* text-lg */
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.75rem;
    }
    .header-details {
      font-size: 0.875rem; /* text-sm */
      color: #64748b;
    }

    /* Section Styles */
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.25rem; /* text-xl */
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #1e40af;
    }

    /* Party Boxes */
    .party-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .party-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .party-title {
      font-size: 0.875rem; /* text-sm */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .party-details {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
    }
    .party-details div {
      margin-bottom: 0.25rem;
    }

    /* Deliverables and Milestones */
    .deliverable-box {
      background-color: #f0f9ff; /* bg-blue-50 */
      border-left: 4px solid #1e40af;
      padding: 0.75rem;
      border-radius: 0 0.5rem 0.5rem 0;
      margin-bottom: 0.75rem;
    }
    .deliverable-title {
      font-size: 0.75rem; /* text-[8px] */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .deliverable-details {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
    }
    .deliverable-details div {
      margin-bottom: 0.25rem;
    }

    /* Milestone Styles */
    .milestone {
      margin-bottom: 0.75rem;
    }
    .milestone-title {
      font-size: 0.75rem; /* text-[8px] */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .milestone-details {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
    }
    .milestone-details div {
      margin-bottom: 0.25rem;
    }

    /* Assumptions and Dependencies */
    .assumptions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .assumptions-column h4 {
      font-size: 0.75rem; /* text-[8px] */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .assumptions-list {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
    }
    .assumptions-list div {
      margin-bottom: 0.25rem;
    }

    /* Acceptance Criteria */
    .acceptance-list {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .acceptance-list div {
      margin-bottom: 0.25rem;
    }

    /* Payment Terms */
    .payment-details {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .payment-details div {
      margin-bottom: 0.5rem;
    }

    /* Signature Section */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .signature-box {
      background-color: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .signature-title {
      font-size: 0.875rem; /* text-sm */
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .signature-details {
      font-size: 0.75rem; /* text-[8px] */
      color: #64748b;
    }
    .signature-details div {
      margin-bottom: 0.25rem;
    }
    .signature-line {
      border-top: 1px solid #cbd5e1;
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      text-align: center;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem; /* text-[7px] */
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <div class="header-title">STATEMENT OF WORK</div>
    <div class="header-subtitle">Project: [Project.Title]</div>
    <div class="header-details">Project Number: [Project.Number] | Effective Date: [Effective.Date]</div>
  </div>

  <!-- Parties Section -->
  <div class="section">
    <div class="section-title">PARTIES</div>
    <div class="party-grid">
      <div class="party-box">
        <div class="party-title">Client</div>
        <div class="party-details">
          <div><strong>Name:</strong> [Client.Name]</div>
          <div><strong>Contact:</strong> [Client.Contact]</div>
          <div><strong>Address:</strong> [Client.Address]</div>
        </div>
      </div>
      <div class="party-box">
        <div class="party-title">Vendor</div>
        <div class="party-details">
          <div><strong>Name:</strong> [Vendor.Name]</div>
          <div><strong>Contact:</strong> [Vendor.Contact]</div>
          <div><strong>Address:</strong> [Vendor.Address]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Project Overview -->
  <div class="section">
    <div class="section-title">PROJECT OVERVIEW</div>
    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.4;">
      <div><strong>Project Manager:</strong> [Project.Manager]</div>
      <div><strong>Overview:</strong> [Project.Overview]</div>
      <div><strong>Objectives:</strong> [Project.Objectives]</div>
    </div>
  </div>

  <!-- Scope of Work -->
  <div class="section">
    <div class="section-title">SCOPE OF WORK</div>
    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.4;">
      [Scope.of.Work]
    </div>
  </div>

  <!-- Deliverables -->
  <div class="section">
    <div class="section-title">DELIVERABLES</div>
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div class="deliverable-box">
        <div class="deliverable-title">Deliverable 1: [Deliverable.1.Name]</div>
        <div class="deliverable-details">
          <div><strong>Description:</strong> [Deliverable.1.Description]</div>
          <div><strong>Due Date:</strong> [Deliverable.1.DueDate]</div>
        </div>
      </div>
      <div class="deliverable-box">
        <div class="deliverable-title">Deliverable 2: [Deliverable.2.Name]</div>
        <div class="deliverable-details">
          <div><strong>Description:</strong> [Deliverable.2.Description]</div>
          <div><strong>Due Date:</strong> [Deliverable.2.DueDate]</div>
        </div>
      </div>
      <div class="deliverable-box">
        <div class="deliverable-title">Deliverable 3: [Deliverable.3.Name]</div>
        <div class="deliverable-details">
          <div><strong>Description:</strong> [Deliverable.3.Description]</div>
          <div><strong>Due Date:</strong> [Deliverable.3.DueDate]</div>
        </div>
      </div>
      <div class="deliverable-box">
        <div class="deliverable-title">Deliverable 4: [Deliverable.4.Name]</div>
        <div class="deliverable-details">
          <div><strong>Description:</strong> [Deliverable.4.Description]</div>
          <div><strong>Due Date:</strong> [Deliverable.4.DueDate]</div>
        </div>
      </div>
      <div class="deliverable-box">
        <div class="deliverable-title">Deliverable 5: [Deliverable.5.Name]</div>
        <div class="deliverable-details">
          <div><strong>Description:</strong> [Deliverable.5.Description]</div>
          <div><strong>Due Date:</strong> [Deliverable.5.DueDate]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Timeline & Milestones -->
  <div class="section">
    <div class="section-title">TIMELINE & MILESTONES</div>
    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.4;">
      <div><strong>Project Start Date:</strong> [Timeline.Start.Date]</div>
      <div><strong>Project End Date:</strong> [Timeline.End.Date]</div>
      <div style="margin-top: 0.75rem;">
        <div class="milestone">
          <div class="milestone-title">Milestone 1: [Milestone.1.Name]</div>
          <div class="milestone-details">
            <div><strong>Description:</strong> [Milestone.1.Description]</div>
            <div><strong>Due Date:</strong> [Milestone.1.DueDate]</div>
          </div>
        </div>
        <div class="milestone">
          <div class="milestone-title">Milestone 2: [Milestone.2.Name]</div>
          <div class="milestone-details">
            <div><strong>Description:</strong> [Milestone.2.Description]</div>
            <div><strong>Due Date:</strong> [Milestone.2.DueDate]</div>
          </div>
        </div>
        <div class="milestone">
          <div class="milestone-title">Milestone 3: [Milestone.3.Name]</div>
          <div class="milestone-details">
            <div><strong>Description:</strong> [Milestone.3.Description]</div>
            <div><strong>Due Date:</strong> [Milestone.3.DueDate]</div>
          </div>
        </div>
        <div class="milestone">
          <div class="milestone-title">Milestone 4: [Milestone.4.Name]</div>
          <div class="milestone-details">
            <div><strong>Description:</strong> [Milestone.4.Description]</div>
            <div><strong>Due Date:</strong> [Milestone.4.DueDate]</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Assumptions & Dependencies -->
  <div class="section">
    <div class="section-title">ASSUMPTIONS & DEPENDENCIES</div>
    <div class="assumptions-grid">
      <div>
        <h4>Assumptions</h4>
        <div class="assumptions-list">
          <div>• [Assumption.1]</div>
          <div>• [Assumption.2]</div>
          <div>• [Assumption.3]</div>
        </div>
      </div>
      <div>
        <h4>Dependencies</h4>
        <div class="assumptions-list">
          <div>• [Dependency.1]</div>
          <div>• [Dependency.2]</div>
          <div>• [Dependency.3]</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Acceptance Criteria -->
  <div class="section">
    <div class="section-title">ACCEPTANCE CRITERIA</div>
    <div class="acceptance-list">
      <div>• [Acceptance.Criteria.1]</div>
      <div>• [Acceptance.Criteria.2]</div>
      <div>• [Acceptance.Criteria.3]</div>
      <div>• [Acceptance.Criteria.4]</div>
    </div>
  </div>

  <!-- Payment Terms -->
  <div class="section">
    <div class="section-title">PAYMENT TERMS</div>
    <div class="payment-details">
      <div><strong>Total Project Fee:</strong> [Payment.Total.Fee]</div>
      <div><strong>Payment Schedule:</strong> [Payment.Schedule]</div>
      <div><strong>Invoicing:</strong> [Invoicing.Details]</div>
      <div><strong>Late Fees:</strong> [Late.Fee.Details]</div>
    </div>
  </div>

  <!-- Confidentiality -->
  <div class="section">
    <div class="section-title">CONFIDENTIALITY</div>
    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.4;">
      [Confidentiality.Clauses]
    </div>
  </div>

  <!-- Termination Clause -->
  <div class="section">
    <div class="section-title">TERMINATION CLAUSE</div>
    <div style="font-size: 0.75rem; color: #64748b; line-height: 1.4;">
      [Termination.Clauses]
    </div>
  </div>

  <!-- Signatures -->
  <div class="section">
    <div class="section-title">SIGNATURES</div>
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-title">Client</div>
        <div class="signature-details">
          <div><strong>Name:</strong> [Signatory1.Name]</div>
          <div><strong>Title:</strong> [Signatory1.Title]</div>
          <div><strong>Date:</strong> [Signatory1.Date]</div>
          <div class="signature-line">
            <strong>Signature:</strong> ________________________
          </div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Vendor</div>
        <div class="signature-details">
          <div><strong>Name:</strong> [Signatory2.Name]</div>
          <div><strong>Title:</strong> [Signatory2.Title]</div>
          <div><strong>Date:</strong> [Signatory2.Date]</div>
          <div class="signature-line">
            <strong>Signature:</strong> ________________________
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>This document is legally binding and should be reviewed by legal counsel before signing.</div>
    <div style="margin-top: 0.25rem;">Last Updated: [Last.Updated.Date]</div>
  </div>
</body>
</html>

  `
},

{
  id: 'credit-note-001',
  name: 'Credit Note',
  description: 'Credit memo for refunds or adjustments',
  category: 'invoices',
  popular: false,
  fields: ['Credit Note #', 'Original Invoice', 'Reason', 'Amount'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-3 border-green-600">
        <div>
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold mb-3">
            CR
          </div>
          <div className="text-lg font-bold text-slate-900">[Company.Name]</div>
          <div className="text-[8px] text-slate-600 mt-2 space-y-0.5">
            <div>[Company.Address]</div>
            <div>[Company.City], [Company.State] [Company.Zip]</div>
            <div className="mt-2">
              <div>Email: [Company.Email]</div>
              <div>Phone: [Company.Phone]</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-green-600 mb-3">CREDIT NOTE</div>
          <div className="bg-green-100 px-4 py-3 rounded-lg mb-3">
            <div className="text-[7px] text-green-700 font-semibold mb-1">CREDIT NOTE #</div>
            <div className="text-xl font-bold text-slate-900">[CreditNote.Number]</div>
          </div>
          <div className="text-[8px] text-slate-600 space-y-1">
            <div><strong>Date Issued:</strong> [CreditNote.Date]</div>
            <div><strong>Original Invoice:</strong> <span className="font-bold text-slate-900">[Original.Invoice.Number]</span></div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <div className="text-sm font-bold text-green-600 mb-3 border-l-4 border-green-500 pl-3">CREDIT ISSUED TO:</div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
          <div className="text-[8px] space-y-2">
            <div>
              <div className="text-slate-600 font-semibold mb-1">Customer Name:</div>
              <div className="font-bold text-slate-900 text-sm">[Customer.Name]</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-600 font-semibold mb-1">Email:</div>
                <div className="text-slate-900">[Customer.Email]</div>
              </div>
              <div>
                <div className="text-slate-600 font-semibold mb-1">Phone:</div>
                <div className="text-slate-900">[Customer.Phone]</div>
              </div>
            </div>
            <div>
              <div className="text-slate-600 font-semibold mb-1">Address:</div>
              <div className="text-slate-900">[Customer.Address]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason for Credit */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-green-500 pl-3">REASON FOR CREDIT</div>
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            <strong>Reason:</strong> [Credit.Reason]
            <div className="mt-2">[Credit.Detailed.Explanation]</div>
          </div>
        </div>
      </div>

      {/* Credit Items */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3">CREDIT DETAILS</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <th className="text-left p-3 font-semibold border border-green-700">DESCRIPTION</th>
              <th className="text-center p-3 font-semibold border border-green-700 w-16">QTY</th>
              <th className="text-right p-3 font-semibold border border-green-700 w-24">UNIT PRICE</th>
              <th className="text-right p-3 font-semibold border border-green-700 w-24">CREDIT AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 hover:bg-green-50">
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.1.Description]</div>
                <div className="text-[7px] text-slate-600">[Item.1.Details]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900 font-bold">[Item.1.Qty]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.1.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-green-600">-$[Item.1.Amount]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-green-50">
              <td className="p-3 border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">[Item.2.Description]</div>
                <div className="text-[7px] text-slate-600">[Item.2.Details]</div>
              </td>
              <td className="p-3 border border-slate-200 text-center text-slate-900 font-bold">[Item.2.Qty]</td>
              <td className="p-3 border border-slate-200 text-right text-slate-900">$[Item.2.Price]</td>
              <td className="p-3 border border-slate-200 text-right font-bold text-green-600">-$[Item.2.Amount]</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Credit Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Subtotal Credit:</span>
              <span className="font-bold text-green-600">-$[Subtotal.Credit]</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-600 font-semibold">Tax Adjustment:</span>
              <span className="font-bold text-green-600">-$[Tax.Credit]</span>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-4 flex justify-between items-center mt-3">
              <span className="text-sm font-bold">TOTAL CREDIT:</span>
              <span className="text-3xl font-bold">-${"[total_credit]"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* How Credit Will Be Applied */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-green-500 pl-3">CREDIT APPLICATION</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] text-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">✓</div>
              <div><strong>Application Method:</strong> [Credit.Application.Method]</div>
            </div>
            <div className="ml-8 leading-relaxed">
              [Credit.Application.Details] - Explanation of how this credit will be applied to the customer's account, whether it will be refunded, applied to future purchases, or handled in another way.
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3 border-l-4 border-green-500 pl-3">ADDITIONAL NOTES</div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="text-[8px] text-slate-700 leading-relaxed">
            [Additional.Notes] - Any additional information regarding this credit note, including customer service contact information or next steps.
          </div>
        </div>
      </div>

      {/* Authorization */}
      <div className="border-t-2 border-green-600 pt-6">
        <div className="text-sm font-bold text-slate-900 mb-4">AUTHORIZATION</div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-[7px] text-slate-600 mb-2">Authorized By:</div>
            <div className="border-b-2 border-slate-400 pb-2 mb-3 h-8"></div>
            <div className="text-[8px] space-y-1">
              <div className="font-bold text-slate-900">[Authorized.By.Name]</div>
              <div className="text-slate-600">Title: [Authorized.By.Title]</div>
              <div className="text-slate-600">Date: _____________</div>
            </div>
          </div>
          <div>
            <div className="text-[7px] text-slate-600 mb-2">Customer Acknowledgment:</div>
            <div className="border-b-2 border-slate-400 pb-2 mb-3 h-8"></div>
            <div className="text-[8px] space-y-1">
              <div className="text-slate-600">Signature: _____________</div>
              <div className="text-slate-600">Date: _____________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1 text-green-600">CREDIT NOTE - RETAIN FOR YOUR RECORDS</div>
        <div>This credit note supersedes charges on Invoice #[Original.Invoice.Number]</div>
        <div className="mt-2">Credit Note #[CreditNote.Number] | Questions? Contact [Company.Email]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Note #[CreditNote.Number]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #f8fafc;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 3px solid #059669;
    }
    .logo-box {
      width: 80px;
      height: 80px;
      background: linear-gradient(to bottom right, #059669, #047857);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.8rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }
    .company-info {
      font-size: 0.7rem;
      color: #64748b;
    }
    .company-name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .credit-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.75rem;
    }
    .credit-number {
      background: #dcfce7;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .credit-number-label {
      font-size: 0.65rem;
      color: #059669;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .credit-number-value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #1e293b;
    }
    .credit-dates {
      font-size: 0.7rem;
      color: #64748b;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.75rem;
      border-left: 4px solid #10b981;
      padding-left: 0.75rem;
    }
    .customer-info {
      background: linear-gradient(to right, #dcfce7, #bbf7d0);
      border: 2px solid #bbf7d0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .customer-name {
      font-size: 0.9rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .customer-details {
      font-size: 0.7rem;
      color: #64748b;
    }
    .reason-box {
      background: #fef3c7;
      border: 2px solid #fde68a;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .reason-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.7rem;
    }
    th {
      background: linear-gradient(to right, #059669, #047857);
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border: 1px solid #047857;
    }
    th:not(:first-child) {
      text-align: center;
    }
    th:last-child {
      text-align: right;
    }
    td {
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    td:not(:first-child) {
      text-align: center;
    }
    td:last-child {
      text-align: right;
      font-weight: bold;
      color: #059669;
    }
    tr:nth-child(even) {
      background: #f0fdf4;
    }
    .item-description {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .item-details {
      font-size: 0.65rem;
      color: #64748b;
    }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }
    .totals-box {
      width: 200px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.7rem;
    }
    .total-label {
      color: #64748b;
      font-weight: 600;
    }
    .total-value {
      color: #059669;
      font-weight: bold;
    }
    .grand-total {
      background: linear-gradient(to right, #059669, #047857);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }
    .grand-total-label {
      font-size: 0.85rem;
      font-weight: bold;
    }
    .grand-total-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .credit-application {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .application-title {
      font-size: 0.85rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .application-method {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .checkmark {
      width: 24px;
      height: 24px;
      background: #059669;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      flex-shrink: 0;
    }
    .application-details {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
      margin-left: 1.75rem;
    }
    .notes-box {
      background: #dbeafe;
      border: 2px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .notes-text {
      font-size: 0.7rem;
      color: #64748b;
      line-height: 1.4;
    }
    .authorization {
      border-top: 2px solid #059669;
      padding-top: 1.5rem;
    }
    .authorization-title {
      font-size: 0.85rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 1rem;
    }
    .signature-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .signature-box {
      padding-bottom: 0.5rem;
    }
    .signature-label {
      font-size: 0.65rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    .signature-line {
      border-bottom: 2px solid #cbd5e1;
      height: 2rem;
      margin-bottom: 0.75rem;
    }
    .signature-details {
      font-size: 0.7rem;
      color: #64748b;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem;
      color: #64748b;
    }
    .footer-title {
      font-weight: bold;
      color: #059669;
      margin-bottom: 0.25rem;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo-box">CR</div>
      <div class="company-name">[Company.Name]</div>
      <div class="company-info">
        <div>[Company.Address]</div>
        <div>[Company.City], [Company.State] [Company.Zip]</div>
        <div style="margin-top: 0.5rem;">
          <div>Email: [Company.Email]</div>
          <div>Phone: [Company.Phone]</div>
        </div>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="credit-title">CREDIT NOTE</div>
      <div class="credit-number">
        <div class="credit-number-label">CREDIT NOTE #</div>
        <div class="credit-number-value">[CreditNote.Number]</div>
      </div>
      <div class="credit-dates">
        <div><strong>Date Issued:</strong> [CreditNote.Date]</div>
        <div><strong>Original Invoice:</strong> <span style="font-weight: bold; color: #1e293b;">[Original.Invoice.Number]</span></div>
      </div>
    </div>
  </div>

  <!-- Customer Info -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-title">CREDIT ISSUED TO:</div>
    <div class="customer-info">
      <div>
        <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; margin-bottom: 0.25rem;">Customer Name:</div>
        <div class="customer-name">[Customer.Name]</div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 0.75rem 0;">
        <div>
          <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; margin-bottom: 0.25rem;">Email:</div>
          <div style="font-size: 0.7rem; color: #1e293b;">[Customer.Email]</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; margin-bottom: 0.25rem;">Phone:</div>
          <div style="font-size: 0.7rem; color: #1e293b;">[Customer.Phone]</div>
        </div>
      </div>
      <div style="margin-top: 0.5rem;">
        <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; margin-bottom: 0.25rem;">Address:</div>
        <div style="font-size: 0.7rem; color: #1e293b;">[Customer.Address]</div>
      </div>
    </div>
  </div>

  <!-- Reason for Credit -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-title">REASON FOR CREDIT</div>
    <div class="reason-box">
      <div class="reason-text">
        <strong>Reason:</strong> [Credit.Reason]
        <div style="margin-top: 0.5rem;">[Credit.Detailed.Explanation]</div>
      </div>
    </div>
  </div>

  <!-- Credit Items -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-title" style="color: #1e293b; border-color: #10b981;">CREDIT DETAILS</div>
    <table>
      <thead>
        <tr>
          <th>DESCRIPTION</th>
          <th style="width: 60px;">QTY</th>
          <th style="width: 90px;">UNIT PRICE</th>
          <th style="width: 90px;">CREDIT AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-description">[Item.1.Description]</div>
            <div class="item-details">[Item.1.Details]</div>
          </td>
          <td style="font-weight: bold;">[Item.1.Qty]</td>
          <td>$[Item.1.Price]</td>
          <td>-$[Item.1.Amount]</td>
        </tr>
        <tr>
          <td>
            <div class="item-description">[Item.2.Description]</div>
            <div class="item-details">[Item.2.Details]</div>
          </td>
          <td style="font-weight: bold;">[Item.2.Qty]</td>
          <td>$[Item.2.Price]</td>
          <td>-$[Item.2.Amount]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Credit Totals -->
  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row">
        <span class="total-label">Subtotal Credit:</span>
        <span class="total-value">-$[Subtotal.Credit]</span>
      </div>
      <div class="total-row">
        <span class="total-label">Tax Adjustment:</span>
        <span class="total-value">-$[Tax.Credit]</span>
      </div>
      <div class="grand-total">
        <span class="grand-total-label">TOTAL CREDIT:</span>
        <span class="grand-total-value">-${"[total_credit]"}</span>
      </div>
    </div>
  </div>

  <!-- How Credit Will Be Applied -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-title">CREDIT APPLICATION</div>
    <div class="credit-application">
      <div class="application-method">
        <div class="checkmark">✓</div>
        <div><strong>Application Method:</strong> [Credit.Application.Method]</div>
      </div>
      <div class="application-details">
        [Credit.Application.Details] - Explanation of how this credit will be applied to the customer's account, whether it will be refunded, applied to future purchases, or handled in another way.
      </div>
    </div>
  </div>

  <!-- Notes -->
  <div style="margin-bottom: 1.5rem;">
    <div class="section-title">ADDITIONAL NOTES</div>
    <div class="notes-box">
      <div class="notes-text">
        [Additional.Notes] - Any additional information regarding this credit note, including customer service contact information or next steps.
      </div>
    </div>
  </div>

  <!-- Authorization -->
  <div class="authorization">
    <div class="authorization-title">AUTHORIZATION</div>
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">Authorized By:</div>
        <div class="signature-line"></div>
        <div class="signature-details">
          <div style="font-weight: bold; color: #1e293b;">[Authorized.By.Name]</div>
          <div>Title: [Authorized.By.Title]</div>
          <div>Date: _____________</div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-label">Customer Acknowledgment:</div>
        <div class="signature-line"></div>
        <div class="signature-details">
          <div>Signature: _____________</div>
          <div>Date: _____________</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-title">CREDIT NOTE - RETAIN FOR YOUR RECORDS</div>
    <div>This credit note supersedes charges on Invoice #[Original.Invoice.Number]</div>
    <div style="margin-top: 0.5rem;">Credit Note #[CreditNote.Number] | Questions? Contact [Company.Email]</div>
  </div>
</body>
</html>
`
},

    {
  id: 'monthly-report-001',
  name: 'Monthly Report',
  description: 'Business performance and analytics report',
  category: 'reports',
  popular: false,
  fields: ['Period', 'Metrics', 'Charts', 'Analysis', 'Recommendations'],
  previewComponent: (
    <div className="w-full h-full bg-white text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Cover Page */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white p-10 min-h-[40%] flex flex-col justify-center">
        <div className="text-[10px] opacity-90 mb-2">MONTHLY BUSINESS REPORT</div>
        <div className="text-5xl font-bold mb-4">[Report.Month]</div>
        <div className="text-2xl font-semibold mb-6">[Report.Year]</div>
        <div className="w-32 h-1 bg-white mb-6 opacity-80"></div>
        <div className="text-[9px] opacity-90 space-y-1">
          <div>Prepared by: [Prepared.By]</div>
          <div>Department: [Department.Name]</div>
          <div>Report Date: [Report.Date]</div>
        </div>
      </div>
      {/* Content */}
      <div className="p-8">
        {/* Executive Summary */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">EXECUTIVE SUMMARY</div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-600 p-5 rounded-r-lg">
            <div className="text-[8px] text-slate-700 leading-relaxed space-y-2">
              <p>
                This report provides a comprehensive overview of business performance for <strong>[Report.Month] [Report.Year]</strong>. Key highlights include:
              </p>
              <ul className="ml-4 space-y-1">
                <li>• [Highlight.1]</li>
                <li>• [Highlight.2]</li>
                <li>• [Highlight.3]</li>
              </ul>
            </div>
          </div>
        </div>
        {/* Key Performance Indicators */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">KEY PERFORMANCE INDICATORS</div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
              <div className="text-[8px] opacity-90 mb-2">REVENUE</div>
              <div className="text-3xl font-bold mb-1">${"[revenue]"}</div>
              <div className="text-[7px] opacity-80 flex items-center gap-1">
                <span className="text-green-300">↑ 12.5%</span> vs last month
              </div>  
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 shadow-lg">
              <div className="text-[8px] opacity-90 mb-2">PROFIT</div>
              <div className="text-3xl font-bold mb-1"> ${"[profit]"}</div>
              <div className="text-[7px] opacity-80 flex items-center gap-1">
                <span className="text-green-300">↑ 8.3%</span> vs last month
              </div> 
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg">
              <div className="text-[8px] opacity-90 mb-2">CUSTOMERS</div>
              <div className="text-3xl font-bold mb-1">[Customer.Count]</div>
              <div className="text-[7px] opacity-80 flex items-center gap-1">
                <span className="text-green-300">↑ 15.2%</span> vs last month
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-5 shadow-lg">
              <div className="text-[8px] opacity-90 mb-2">GROWTH RATE</div>
              <div className="text-3xl font-bold mb-1">[Growth.Rate]%</div>
              <div className="text-[7px] opacity-80 flex items-center gap-1">
                <span className="text-green-300">↑ 3.1%</span> vs last month
              </div>
            </div>
          </div>
        </div>
        {/* Revenue Analysis */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">REVENUE ANALYSIS</div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="mb-4">
              <div className="text-[8px] font-semibold text-slate-900 mb-3">Monthly Revenue Trend</div>
              <div className="h-32 bg-white border border-slate-200 rounded-lg flex items-end justify-around p-3 gap-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height: '60%'}}></div>
                  <div className="text-[6px] text-slate-600">Jan</div>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height: '75%'}}></div>
                  <div className="text-[6px] text-slate-600">Feb</div>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height: '85%'}}></div>
                  <div className="text-[6px] text-slate-600">Mar</div>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t" style={{height: '95%'}}></div>
                  <div className="text-[6px] font-bold text-indigo-600">This</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-[8px]">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-slate-600 mb-1">Product Sales</div>
                <div className="text-xl font-bold text-slate-900">$[Product.Revenue]</div>
                <div className="text-[7px] text-green-600 mt-1">↑ 14.2%</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-slate-600 mb-1">Service Revenue</div>
                <div className="text-xl font-bold text-slate-900">$[Service.Revenue]</div>
                <div className="text-[7px] text-green-600 mt-1">↑ 9.8%</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="text-slate-600 mb-1">Recurring Revenue</div>
                <div className="text-xl font-bold text-slate-900">$[Recurring.Revenue]</div>
                <div className="text-[7px] text-green-600 mt-1">↑ 18.5%</div>
              </div>
            </div>
          </div>
        </div>
        {/* Customer Insights */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">CUSTOMER INSIGHTS</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
              <div className="text-[8px] font-semibold text-purple-900 mb-3">Customer Acquisition</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">New Customers:</span>
                  <span className="text-lg font-bold text-purple-700">[New.Customers]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">Churn Rate:</span>
                  <span className="text-lg font-bold text-slate-900">[Churn.Rate]%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">Retention Rate:</span>
                  <span className="text-lg font-bold text-green-600">[Retention.Rate]%</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
              <div className="text-[8px] font-semibold text-blue-900 mb-3">Customer Satisfaction</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">NPS Score:</span>
                  <span className="text-lg font-bold text-blue-700">[NPS.Score]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">CSAT Score:</span>
                  <span className="text-lg font-bold text-slate-900">[CSAT.Score]%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-700">Support Tickets:</span>
                  <span className="text-lg font-bold text-slate-900">[Support.Tickets]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Departmental Performance */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">DEPARTMENTAL PERFORMANCE</div>
          <div className="space-y-3">
            <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💼</span>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-slate-900">Sales Department</div>
                    <div className="text-[7px] text-slate-600">Target Achievement: <strong className="text-green-600">125%</strong></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">$[Sales.Revenue]</div>
                  <div className="text-[7px] text-green-600">↑ 25% vs target</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '125%', maxWidth: '100%'}}></div>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📢</span>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-slate-900">Marketing Department</div>
                    <div className="text-[7px] text-slate-600">Target Achievement: <strong className="text-green-600">110%</strong></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">[Marketing.Leads]</div>
                  <div className="text-[7px] text-green-600">↑ 10% vs target</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: '110%', maxWidth: '100%'}}></div>
              </div>
            </div>
            <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🛠️</span>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-slate-900">Operations Department</div>
                    <div className="text-[7px] text-slate-600">Efficiency Score: <strong className="text-blue-600">95%</strong></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">[Operations.Score]</div>
                  <div className="text-[7px] text-blue-600">↑ 5% improvement</div>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: '95%'}}></div>
              </div>
            </div>
          </div>
        </div>
        {/* Challenges & Opportunities */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">CHALLENGES & OPPORTUNITIES</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
              <div className="text-[8px] font-bold text-red-900 mb-3 flex items-center gap-2">
                <span className="text-lg">⚠️</span> CHALLENGES
              </div>
              <ul className="text-[8px] text-slate-700 space-y-2">
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>[Challenge.1]</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>[Challenge.2]</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>[Challenge.3]</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
              <div className="text-[8px] font-bold text-green-900 mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span> OPPORTUNITIES
              </div>
              <ul className="text-[8px] text-slate-700 space-y-2">
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>[Opportunity.1]</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>[Opportunity.2]</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  <span>[Opportunity.3]</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Recommendations */}
        <div className="mb-8">
          <div className="text-2xl font-bold text-indigo-700 mb-4 pb-2 border-b-3 border-indigo-600">RECOMMENDATIONS</div>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
            <div className="text-[8px] text-slate-700 leading-relaxed space-y-3">
              <div>
                <strong className="text-indigo-900">1. Short-term Actions (0-30 days):</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• [Short.Term.Action.1]</li>
                  <li>• [Short.Term.Action.2]</li>
                  <li>• [Short.Term.Action.3]</li>
                </ul>
              </div>
              <div>
                <strong className="text-indigo-900">2. Medium-term Initiatives (1-3 months):</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• [Medium.Term.Action.1]</li>
                  <li>• [Medium.Term.Action.2]</li>
                </ul>
              </div>
              <div>
                <strong className="text-indigo-900">3. Long-term Strategy (3-12 months):</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• [Long.Term.Action.1]</li>
                  <li>• [Long.Term.Action.2]</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Conclusion */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 text-center">
          <div className="text-lg font-bold mb-2">OVERALL PERFORMANCE</div>
          <div className="text-4xl font-bold mb-2">EXCELLENT</div>
          <div className="text-[8px] opacity-90">Based on all key metrics and departmental performance</div>
        </div>
      </div>
      {/* Footer */}
      <div className="bg-slate-100 p-4 text-center text-[7px] text-slate-600 border-t">
        <div className="font-semibold mb-1">CONFIDENTIAL - INTERNAL USE ONLY</div>
        <div>[Company.Name] | Monthly Business Report</div>
        <div className="mt-1">Report Period: [Report.Month] [Report.Year] | Generated: [Generated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Business Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      background-color: #fff;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #4c6ef5, #7c3aed, #ec4899);
      color: white;
      padding: 2.5rem;
      min-height: 40vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cover-title {
      font-size: 0.65rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .cover-month {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .cover-year {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .cover-divider {
      width: 8rem;
      height: 1px;
      background-color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1.5rem;
    }
    .cover-details {
      font-size: 0.55rem;
      opacity: 0.9;
      line-height: 1.4;
    }
    .cover-detail {
      margin-bottom: 0.25rem;
    }

    /* Content Container */
    .content {
      padding: 2rem;
    }

    /* Section Headers */
    .section-header {
      font-size: 1.25rem;
      font-weight: bold;
      color: #4c6ef5;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #4c6ef5;
    }

    /* Executive Summary */
    .summary-box {
      background: linear-gradient(to right, #e0e7ff, #c7d2fe);
      border-left: 4px solid #4c6ef5;
      padding: 1.25rem;
      border-radius: 0 0.75rem 0.75rem 0;
    }
    .summary-text {
      font-size: 0.55rem;
      color: #64748b;
      line-height: 1.4;
    }
    .summary-list {
      margin-top: 0.5rem;
      margin-left: 1rem;
    }
    .summary-item {
      margin-bottom: 0.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .summary-item::before {
      content: "•";
      color: #4c6ef5;
      font-weight: bold;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      border-radius: 0.75rem;
      padding: 1.25rem;
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .kpi-card-blue {
      background: linear-gradient(to bottom right, #3b82f6, #1d4ed8);
    }
    .kpi-card-green {
      background: linear-gradient(to bottom right, #10b981, #059669);
    }
    .kpi-card-purple {
      background: linear-gradient(to bottom right, #8b5cf6, #7c3aed);
    }
    .kpi-card-orange {
      background: linear-gradient(to bottom right, #f97316, #ea580c);
    }
    .kpi-label {
      font-size: 0.5rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 1.75rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .kpi-change {
      font-size: 0.5rem;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .kpi-change-positive {
      color: #10b981;
    }

    /* Revenue Analysis */
    .revenue-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    .revenue-header {
      font-size: 0.65rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .chart-container {
      height: 8rem;
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: end;
      justify-content: space-around;
      gap: 0.25rem;
    }
    .chart-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
    }
    .chart-bar-fill {
      width: 100%;
      border-radius: 0.25rem 0.25rem 0 0;
    }
    .chart-bar-blue {
      background: linear-gradient(to top, #3b82f6, #60a5fa);
    }
    .chart-bar-indigo {
      background: linear-gradient(to top, #4c6ef5, #6366f1);
    }
    .chart-month {
      font-size: 0.45rem;
      color: #64748b;
    }
    .revenue-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .revenue-metric {
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
    .metric-label {
      font-size: 0.5rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    .metric-value {
      font-size: 1rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .metric-change {
      font-size: 0.45rem;
      color: #10b981;
    }

    /* Customer Insights */
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .insights-card {
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .insights-card-purple {
      background: linear-gradient(to right, #f3e8ff, #e9d5ff);
      border: 1px solid #c4b5fd;
    }
    .insights-card-blue {
      background: linear-gradient(to right, #dbeafe, #bfdbfe);
      border: 1px solid #93c5fd;
    }
    .insights-header {
      font-size: 0.65rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    .insights-header-purple {
      color: #7c3aed;
    }
    .insights-header-blue {
      color: #1e40af;
    }
    .insights-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.55rem;
    }
    .insights-metric-label {
      color: #64748b;
    }
    .insights-metric-value {
      font-weight: bold;
      color: #1e293b;
    }
    .insights-metric-green {
      color: #10b981;
    }

    /* Departmental Performance */
    .department-item {
      background-color: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .department-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .department-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .department-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .department-icon-blue {
      background-color: #dbeafe;
    }
    .department-icon-green {
      background-color: #dcfce7;
    }
    .department-icon-purple {
      background-color: #e9d5ff;
    }
    .department-details h4 {
      font-size: 0.65rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .department-details p {
      font-size: 0.5rem;
      color: #64748b;
    }
    .department-metrics {
      text-align: right;
    }
    .department-value {
      font-size: 1.125rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.125rem;
    }
    .department-change {
      font-size: 0.5rem;
      color: #10b981;
    }
    .progress-bar {
      width: 100%;
      height: 0.25rem;
      background-color: #e2e8f0;
      border-radius: 0.25rem;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      border-radius: 0.25rem;
    }
    .progress-fill-blue {
      background: linear-gradient(to right, #3b82f6, #1d4ed8);
    }
    .progress-fill-green {
      background: linear-gradient(to right, #10b981, #059669);
    }
    .progress-fill-purple {
      background: linear-gradient(to right, #8b5cf6, #7c3aed);
    }

    /* Challenges & Opportunities */
    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .challenges-card {
      border: 2px solid;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .challenges-card-red {
      background-color: #fee2e2;
      border-color: #fecaca;
    }
    .challenges-card-green {
      background-color: #dcfce7;
      border-color: #bbf7d0;
    }
    .challenges-header {
      font-size: 0.65rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .challenges-header-red {
      color: #991b1b;
    }
    .challenges-header-green {
      color: #166534;
    }
    .challenges-icon {
      font-size: 1rem;
    }
    .challenges-list {
      list-style: none;
      padding-left: 0;
    }
    .challenges-item {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.55rem;
      color: #64748b;
    }
    .challenges-bullet-red {
      color: #dc2626;
    }
    .challenges-bullet-green {
      color: #16a34a;
    }

    /* Recommendations */
    .recommendations-box {
      background: linear-gradient(to right, #e0e7ff, #c7d2fe);
      border: 2px solid #c7d2fe;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 2rem;
    }
    .recommendations-section {
      margin-bottom: 1rem;
    }
    .recommendations-title {
      font-size: 0.65rem;
      font-weight: bold;
      color: #4c6ef5;
      margin-bottom: 0.5rem;
    }
    .recommendations-list {
      margin-top: 0.25rem;
      margin-left: 1rem;
    }
    .recommendations-item {
      margin-bottom: 0.25rem;
      font-size: 0.55rem;
      color: #64748b;
    }

    /* Conclusion */
    .conclusion-box {
      background: linear-gradient(to right, #4c6ef5, #7c3aed);
      color: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    .conclusion-title {
      font-size: 0.875rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .conclusion-rating {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .conclusion-subtitle {
      font-size: 0.65rem;
      opacity: 0.9;
    }

    /* Footer */
    .footer {
      background-color: #f8fafc;
      padding: 1rem;
      text-align: center;
      font-size: 0.5rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer-bold {
      font-weight: 600;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-title">MONTHLY BUSINESS REPORT</div>
    <div class="cover-month">[Report.Month]</div>
    <div class="cover-year">[Report.Year]</div>
    <div class="cover-divider"></div>
    <div class="cover-details">
      <div class="cover-detail">Prepared by: [Prepared.By]</div>
      <div class="cover-detail">Department: [Department.Name]</div>
      <div class="cover-detail">Report Date: [Report.Date]</div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    <!-- Executive Summary -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">EXECUTIVE SUMMARY</div>
      <div class="summary-box">
        <div class="summary-text">
          <p>
            This report provides a comprehensive overview of business performance for <strong>[Report.Month] [Report.Year]</strong>. Key highlights include:
          </p>
          <div class="summary-list">
            <div class="summary-item">[Highlight.1]</div>
            <div class="summary-item">[Highlight.2]</div>
            <div class="summary-item">[Highlight.3]</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Performance Indicators -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">KEY PERFORMANCE INDICATORS</div>
      <div class="kpi-grid">
        <div class="kpi-card kpi-card-blue">
          <div class="kpi-label">REVENUE</div>
          <div class="kpi-value">${"[revenue]"}</div>
          <div class="kpi-change kpi-change-positive">
            <span>↑ 12.5%</span>
            <span>vs last month</span>
          </div>
        </div>
        <div class="kpi-card kpi-card-green">
          <div class="kpi-label">PROFIT</div>
          <div class="kpi-value"> ${"[profit]"}</div>
          <div class="kpi-change kpi-change-positive">
            <span>↑ 8.3%</span>
            <span>vs last month</span>
          </div>
        </div>
        <div class="kpi-card kpi-card-purple">
          <div class="kpi-label">CUSTOMERS</div>
          <div class="kpi-value">[Customer.Count]</div>
          <div class="kpi-change kpi-change-positive">
            <span>↑ 15.2%</span>
            <span>vs last month</span>
          </div>
        </div>
        <div class="kpi-card kpi-card-orange">
          <div class="kpi-label">GROWTH RATE</div>
          <div class="kpi-value">[Growth.Rate]%</div>
          <div class="kpi-change kpi-change-positive">
            <span>↑ 3.1%</span>
            <span>vs last month</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Revenue Analysis -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">REVENUE ANALYSIS</div>
      <div class="revenue-section">
        <div class="revenue-header">Monthly Revenue Trend</div>
        <div class="chart-container">
          <div class="chart-bar">
            <div class="chart-bar-fill chart-bar-blue" style="height: 60%;"></div>
            <div class="chart-month">Jan</div>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill chart-bar-blue" style="height: 75%;"></div>
            <div class="chart-month">Feb</div>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill chart-bar-blue" style="height: 85%;"></div>
            <div class="chart-month">Mar</div>
          </div>
          <div class="chart-bar">
            <div class="chart-bar-fill chart-bar-indigo" style="height: 95%;"></div>
            <div class="chart-month" style="font-weight: bold; color: #4c6ef5;">This</div>
          </div>
        </div>
        <div class="revenue-metrics">
          <div class="revenue-metric">
            <div class="metric-label">Product Sales</div>
            <div class="metric-value">$[Product.Revenue]</div>
            <div class="metric-change">↑ 14.2%</div>
          </div>
          <div class="revenue-metric">
            <div class="metric-label">Service Revenue</div>
            <div class="metric-value">$[Service.Revenue]</div>
            <div class="metric-change">↑ 9.8%</div>
          </div>
          <div class="revenue-metric">
            <div class="metric-label">Recurring Revenue</div>
            <div class="metric-value">$[Recurring.Revenue]</div>
            <div class="metric-change">↑ 18.5%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Insights -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">CUSTOMER INSIGHTS</div>
      <div class="insights-grid">
        <div class="insights-card insights-card-purple">
          <div class="insights-header insights-header-purple">👥 Customer Acquisition</div>
          <div class="space-y-3">
            <div class="insights-metric">
              <span class="insights-metric-label">New Customers:</span>
              <span class="insights-metric-value">[New.Customers]</span>
            </div>
            <div class="insights-metric">
              <span class="insights-metric-label">Churn Rate:</span>
              <span class="insights-metric-value">[Churn.Rate]%</span>
            </div>
            <div class="insights-metric">
              <span class="insights-metric-label">Retention Rate:</span>
              <span class="insights-metric-value insights-metric-green">[Retention.Rate]%</span>
            </div>
          </div>
        </div>
        <div class="insights-card insights-card-blue">
          <div class="insights-header insights-header-blue">😊 Customer Satisfaction</div>
          <div class="space-y-3">
            <div class="insights-metric">
              <span class="insights-metric-label">NPS Score:</span>
              <span class="insights-metric-value">[NPS.Score]</span>
            </div>
            <div class="insights-metric">
              <span class="insights-metric-label">CSAT Score:</span>
              <span class="insights-metric-value">[CSAT.Score]%</span>
            </div>
            <div class="insights-metric">
              <span class="insights-metric-label">Support Tickets:</span>
              <span class="insights-metric-value">[Support.Tickets]</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Departmental Performance -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">DEPARTMENTAL PERFORMANCE</div>
      <div class="space-y-3">
        <div class="department-item">
          <div class="department-header">
            <div class="department-info">
              <div class="department-icon department-icon-blue">💼</div>
              <div class="department-details">
                <h4>Sales Department</h4>
                <p>Target Achievement: <strong class="text-green-600">125%</strong></p>
              </div>
            </div>
            <div class="department-metrics">
              <div class="department-value">$[Sales.Revenue]</div>
              <div class="department-change">↑ 25% vs target</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill progress-fill-blue" style="width: 100%;"></div>
          </div>
        </div>
        <div class="department-item">
          <div class="department-header">
            <div class="department-info">
              <div class="department-icon department-icon-green">📢</div>
              <div class="department-details">
                <h4>Marketing Department</h4>
                <p>Target Achievement: <strong class="text-green-600">110%</strong></p>
              </div>
            </div>
            <div class="department-metrics">
              <div class="department-value">[Marketing.Leads]</div>
              <div class="department-change">↑ 10% vs target</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill progress-fill-green" style="width: 100%;"></div>
          </div>
        </div>
        <div class="department-item">
          <div class="department-header">
            <div class="department-info">
              <div class="department-icon department-icon-purple">🛠️</div>
              <div class="department-details">
                <h4>Operations Department</h4>
                <p>Efficiency Score: <strong class="text-blue-600">95%</strong></p>
              </div>
            </div>
            <div class="department-metrics">
              <div class="department-value">[Operations.Score]</div>
              <div class="department-change">↑ 5% improvement</div>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill progress-fill-purple" style="width: 95%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Challenges & Opportunities -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">CHALLENGES & OPPORTUNITIES</div>
      <div class="challenges-grid">
        <div class="challenges-card challenges-card-red">
          <div class="challenges-header challenges-header-red">
            <span class="challenges-icon">⚠️</span>
            CHALLENGES
          </div>
          <ul class="challenges-list">
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-red">•</span>
              <span>[Challenge.1]</span>
            </li>
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-red">•</span>
              <span>[Challenge.2]</span>
            </li>
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-red">•</span>
              <span>[Challenge.3]</span>
            </li>
          </ul>
        </div>
        <div class="challenges-card challenges-card-green">
          <div class="challenges-header challenges-header-green">
            <span class="challenges-icon">💡</span>
            OPPORTUNITIES
          </div>
          <ul class="challenges-list">
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-green">•</span>
              <span>[Opportunity.1]</span>
            </li>
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-green">•</span>
              <span>[Opportunity.2]</span>
            </li>
            <li class="challenges-item">
              <span class="challenges-bullet challenges-bullet-green">•</span>
              <span>[Opportunity.3]</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div style="margin-bottom: 2rem;">
      <div class="section-header">RECOMMENDATIONS</div>
      <div class="recommendations-box">
        <div class="recommendations-section">
          <div class="recommendations-title">1. Short-term Actions (0-30 days):</div>
          <div class="recommendations-list">
            <div class="recommendations-item">• [Short.Term.Action.1]</div>
            <div class="recommendations-item">• [Short.Term.Action.2]</div>
            <div class="recommendations-item">• [Short.Term.Action.3]</div>
          </div>
        </div>
        <div class="recommendations-section">
          <div class="recommendations-title">2. Medium-term Initiatives (1-3 months):</div>
          <div class="recommendations-list">
            <div class="recommendations-item">• [Medium.Term.Action.1]</div>
            <div class="recommendations-item">• [Medium.Term.Action.2]</div>
          </div>
        </div>
        <div class="recommendations-section">
          <div class="recommendations-title">3. Long-term Strategy (3-12 months):</div>
          <div class="recommendations-list">
            <div class="recommendations-item">• [Long.Term.Action.1]</div>
            <div class="recommendations-item">• [Long.Term.Action.2]</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conclusion -->
    <div class="conclusion-box">
      <div class="conclusion-title">OVERALL PERFORMANCE</div>
      <div class="conclusion-rating">EXCELLENT</div>
      <div class="conclusion-subtitle">Based on all key metrics and departmental performance</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-bold">CONFIDENTIAL - INTERNAL USE ONLY</div>
      <div>[Company.Name] | Monthly Business Report</div>
      <div class="mt-1">Report Period: [Report.Month] [Report.Year] | Generated: [Generated.Date]</div>
    </div>
  </div>
</body>
</html>
`
},

{
  id: 'timesheet-001',
  name: 'Employee Timesheet',
  description: 'Weekly timesheet for tracking work hours',
  category: 'reports',
  popular: false,
  fields: ['Employee', 'Period', 'Hours', 'Tasks', 'Approval'],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-3xl font-bold mb-2">EMPLOYEE TIMESHEET</div>
            <div className="text-[8px] opacity-80">Weekly Time Record</div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <div className="text-[7px] opacity-80">Timesheet #</div>
              <div className="text-lg font-bold">[Timesheet.Number]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee & Period Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
          <div className="text-sm font-bold text-slate-900 mb-3">EMPLOYEE INFORMATION</div>
          <div className="text-[8px] space-y-2">
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Name:</span>
              <span className="font-bold text-slate-900">[Employee.FullName]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Employee ID:</span>
              <span className="text-slate-900">[Employee.ID]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Department:</span>
              <span className="text-slate-900">[Department.Name]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Position:</span>
              <span className="text-slate-900">[Job.Title]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Supervisor:</span>
              <span className="text-slate-900">[Supervisor.Name]</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <div className="text-sm font-bold text-blue-900 mb-3">PAY PERIOD</div>
          <div className="text-[8px] space-y-2">
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Week Ending:</span>
              <span className="font-bold text-slate-900">[Week.Ending.Date]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Period:</span>
              <span className="text-slate-900">[Pay.Period.Start] - [Pay.Period.End]</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold">Hourly Rate:</span>
              <span className="text-slate-900">$[Hourly.Rate]/hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Log Table */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3">TIME LOG</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left p-3 font-semibold border border-slate-700">DATE</th>
              <th className="text-left p-3 font-semibold border border-slate-700">DAY</th>
              <th className="text-center p-3 font-semibold border border-slate-700 w-20">TIME IN</th>
              <th className="text-center p-3 font-semibold border border-slate-700 w-20">TIME OUT</th>
              <th className="text-center p-3 font-semibold border border-slate-700 w-20">BREAK</th>
              <th className="text-center p-3 font-semibold border border-slate-700 w-20">HOURS</th>
              <th className="text-left p-3 font-semibold border border-slate-700">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.1]</td>
              <td className="p-3 border border-slate-200 text-slate-700">Monday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">9:00 AM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">5:00 PM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-600">1.0h</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-blue-600">7.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">[Notes.1]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.2]</td>
              <td className="p-3 border border-slate-200 text-slate-700">Tuesday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">9:00 AM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">5:00 PM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-600">1.0h</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-blue-600">7.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">[Notes.2]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.3]</td>
              <td className="p-3 border border-slate-200 text-slate-700">Wednesday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">9:00 AM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">5:00 PM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-600">1.0h</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-blue-600">7.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">[Notes.3]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.4]</td>
              <td className="p-3 border border-slate-200 text-slate-700">Thursday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">9:00 AM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">5:00 PM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-600">1.0h</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-blue-600">7.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">[Notes.4]</td>
            </tr>
            <tr className="border-b border-slate-200 hover:bg-slate-50">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.5]</td>
              <td className="p-3 border border-slate-200 text-slate-700">Friday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">9:00 AM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-900">5:00 PM</td>
              <td className="p-3 border border-slate-200 text-center text-slate-600">1.0h</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-blue-600">7.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">[Notes.5]</td>
            </tr>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.6]</td>
              <td className="p-3 border border-slate-200 text-slate-700 font-semibold">Saturday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-slate-400">0.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">Day Off</td>
            </tr>
            <tr className="bg-slate-100">
              <td className="p-3 border border-slate-200 font-bold text-slate-900">[Date.7]</td>
              <td className="p-3 border border-slate-200 text-slate-700 font-semibold">Sunday</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center text-slate-400">-</td>
              <td className="p-3 border border-slate-200 text-center font-bold text-slate-400">0.0</td>
              <td className="p-3 border border-slate-200 text-slate-600 text-[7px]">Day Off</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Hours Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 text-center">
          <div className="text-[8px] opacity-90 mb-2">REGULAR HOURS</div>
          <div className="text-4xl font-bold mb-1">[Regular.Hours]</div>
          <div className="text-[7px] opacity-80">@ $[Hourly.Rate]/hr</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-5 text-center">
          <div className="text-[8px] opacity-90 mb-2">OVERTIME HOURS</div>
          <div className="text-4xl font-bold mb-1">[Overtime.Hours]</div>
          <div className="text-[7px] opacity-80">@ $[Overtime.Rate]/hr</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 text-center">
          <div className="text-[8px] opacity-90 mb-2">TOTAL GROSS PAY</div>
          <div className="text-4xl font-bold">${"[gross_pay]"}</div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="text-[8px] font-bold text-slate-900 mb-3">LEAVE/ABSENCES</div>
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Sick Leave Used:</span>
              <span className="font-bold text-slate-900">[Sick.Hours] hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Vacation Used:</span>
              <span className="font-bold text-slate-900">[Vacation.Hours] hours</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Personal Time:</span>
              <span className="font-bold text-slate-900">[Personal.Hours] hours</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="text-[8px] font-bold text-blue-900 mb-3">PROJECT/TASK BREAKDOWN</div>
          <div className="space-y-2 text-[8px]">
            <div className="flex justify-between py-1 border-b border-blue-200">
              <span className="text-slate-700">[Project.1.Name]:</span>
              <span className="font-bold text-slate-900">[Project.1.Hours]h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-blue-200">
              <span className="text-slate-700">[Project.2.Name]:</span>
              <span className="font-bold text-slate-900">[Project.2.Hours]h</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-700">[Project.3.Name]:</span>
              <span className="font-bold text-slate-900">[Project.3.Hours]h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mb-6">
        <div className="text-sm font-bold text-slate-900 mb-3">EMPLOYEE COMMENTS</div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[60px]">
          <div className="text-[8px] text-slate-600 italic">[Employee.Comments]</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-3 border-slate-800 pt-6">
        <div className="text-sm font-bold text-slate-900 mb-6">CERTIFICATIONS</div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4">
              <div className="text-[8px] font-bold text-slate-900 mb-3">EMPLOYEE CERTIFICATION</div>
              <div className="text-[7px] text-slate-600 mb-4 leading-relaxed">
                I certify that the hours worked as shown on this timesheet are true and accurate to the best of my knowledge.
              </div>
              <div className="border-t-2 border-slate-400 pt-3 mb-2">
                <div className="text-[7px] text-slate-600">Employee Signature</div>
              </div>
              <div className="flex justify-between text-[8px] mt-3">
                <div>
                  <div className="text-slate-600">Name: [Employee.FullName]</div>
                </div>
                <div>
                  <div className="text-slate-600">Date: _____________</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="text-[8px] font-bold text-blue-900 mb-3">SUPERVISOR APPROVAL</div>
              <div className="text-[7px] text-slate-600 mb-4 leading-relaxed">
                I have reviewed this timesheet and approve the hours worked as recorded above.
              </div>
              <div className="border-t-2 border-blue-400 pt-3 mb-2">
                <div className="text-[7px] text-slate-600">Supervisor Signature</div>
              </div>
              <div className="flex justify-between text-[8px] mt-3">
                <div>
                  <div className="text-slate-600">Name: [Supervisor.Name]</div>
                </div>
                <div>
                  <div className="text-slate-600">Date: _____________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div className="font-semibold mb-1">CONFIDENTIAL EMPLOYEE RECORD</div>
        <div>Submit completed timesheet to HR/Payroll by [Submission.Deadline]</div>
        <div className="mt-2">Timesheet #[Timesheet.Number] | [Company.Name] Payroll Department</div>
      </div>
    </div>
  ),
  htmlTemplate: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Employee Timesheet #[Timesheet.Number]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      background-color: #f8fafc;
    }
    .header {
      background: linear-gradient(to right, #1e293b, #334155);
      color: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .header-title {
      font-size: 1.8rem;
      font-weight: bold;
      margin-bottom: 0.3rem;
    }
    .header-subtitle {
      font-size: 0.7rem;
      opacity: 0.8;
    }
    .timesheet-number {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }
    .timesheet-number-label {
      font-size: 0.7rem;
      opacity: 0.8;
    }
    .timesheet-number-value {
      font-size: 1.1rem;
      font-weight: bold;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .info-box {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .employee-info {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .pay-period-info {
      background: #f0f9ff;
      border: 2px solid #93c5fd;
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .info-title {
      font-size: 0.85rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
      color: #1e3a8a;
    }
    .pay-period-title {
      font-size: 0.85rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
      color: #084298;
    }
    .info-row {
      display: flex;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
    }
    .info-label {
      width: 80px;
      color: #64748b;
      font-weight: 600;
    }
    .info-value {
      color: #1e293b;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.7rem;
    }
    th {
      background: #1e293b;
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
    }
    th:not(:first-child) {
      text-align: center;
    }
    th:last-child {
      text-align: left;
    }
    td {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    td:not(:first-child) {
      text-align: center;
    }
    td:last-child {
      text-align: left;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    tr:nth-child(6), tr:nth-child(7) {
      background: #f1f5f9;
    }
    .hours-cell {
      font-weight: bold;
      color: #0891b2;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .summary-card {
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
      color: white;
    }
    .regular-hours {
      background: linear-gradient(to bottom right, #3b82f6, #2563eb);
    }
    .overtime-hours {
      background: linear-gradient(to bottom right, #f97316, #ea580c);
    }
    .total-pay {
      background: linear-gradient(to bottom right, #10b981, #059669);
    }
    .summary-label {
      font-size: 0.7rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .summary-value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .summary-rate {
      font-size: 0.7rem;
      opacity: 0.8;
    }
    .leave-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .leave-title {
      font-size: 0.7rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.75rem;
    }
    .leave-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.7rem;
    }
    .leave-row:last-child {
      border-bottom: none;
    }
    .leave-label {
      color: #64748b;
    }
    .leave-value {
      font-weight: bold;
      color: #1e293b;
    }
    .comments-section {
      margin-bottom: 1.5rem;
    }
    .comments-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      min-height: 60px;
      font-size: 0.7rem;
      color: #64748b;
      font-style: italic;
    }
    .certification-section {
      border-top: 3px solid #1e293b;
      padding-top: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .certification-title {
      font-size: 0.85rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 1rem;
    }
    .signature-box {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    .employee-signature, .supervisor-signature {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .supervisor-signature {
      background: #f0f9ff;
      border-color: #93c5fd;
    }
    .signature-title {
      font-size: 0.7rem;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }
    .employee-signature-title {
      color: #1e293b;
    }
    .supervisor-signature-title {
      color: #084298;
    }
    .signature-text {
      font-size: 0.65rem;
      color: #64748b;
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    .signature-line {
      border-top: 2px solid #cbd5e1;
      padding-top: 0.5rem;
      margin: 1rem 0;
      text-align: center;
    }
    .signature-label {
      font-size: 0.65rem;
      color: #64748b;
    }
    .signature-details {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      font-size: 0.7rem;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.65rem;
      color: #64748b;
    }
    .footer-title {
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="header-title">EMPLOYEE TIMESHEET</div>
        <div class="header-subtitle">Weekly Time Record</div>
      </div>
      <div class="timesheet-number">
        <div class="timesheet-number-label">Timesheet #</div>
        <div class="timesheet-number-value">[Timesheet.Number]</div>
      </div>
    </div>
  </div>

  <!-- Employee & Period Info -->
  <div class="grid-2">
    <div class="employee-info">
      <div class="info-title">EMPLOYEE INFORMATION</div>
      <div style="font-size: 0.75rem; color: #334155;">
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value" style="font-weight: bold;">[Employee.FullName]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee ID:</span>
          <span class="info-value">[Employee.ID]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department:</span>
          <span class="info-value">[Department.Name]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Position:</span>
          <span class="info-value">[Job.Title]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Supervisor:</span>
          <span class="info-value">[Supervisor.Name]</span>
        </div>
      </div>
    </div>
    <div class="pay-period-info">
      <div class="pay-period-title">PAY PERIOD</div>
      <div style="font-size: 0.75rem; color: #1e3a8a;">
        <div class="info-row">
          <span class="info-label">Week Ending:</span>
          <span class="info-value" style="font-weight: bold;">[Week.Ending.Date]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Period:</span>
          <span class="info-value">[Pay.Period.Start] - [Pay.Period.End]</span>
        </div>
        <div class="info-row">
          <span class="info-label">Hourly Rate:</span>
          <span class="info-value">$[Hourly.Rate]/hour</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Time Log Table -->
  <div class="section-title">TIME LOG</div>
  <table>
    <thead>
      <tr>
        <th>DATE</th>
        <th>DAY</th>
        <th style="width: 80px;">TIME IN</th>
        <th style="width: 80px;">TIME OUT</th>
        <th style="width: 80px;">BREAK</th>
        <th style="width: 80px;">HOURS</th>
        <th>NOTES</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight: bold;">[Date.1]</td>
        <td>Monday</td>
        <td>9:00 AM</td>
        <td>5:00 PM</td>
        <td>1.0h</td>
        <td class="hours-cell">7.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">[Notes.1]</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">[Date.2]</td>
        <td>Tuesday</td>
        <td>9:00 AM</td>
        <td>5:00 PM</td>
        <td>1.0h</td>
        <td class="hours-cell">7.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">[Notes.2]</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">[Date.3]</td>
        <td>Wednesday</td>
        <td>9:00 AM</td>
        <td>5:00 PM</td>
        <td>1.0h</td>
        <td class="hours-cell">7.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">[Notes.3]</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">[Date.4]</td>
        <td>Thursday</td>
        <td>9:00 AM</td>
        <td>5:00 PM</td>
        <td>1.0h</td>
        <td class="hours-cell">7.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">[Notes.4]</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">[Date.5]</td>
        <td>Friday</td>
        <td>9:00 AM</td>
        <td>5:00 PM</td>
        <td>1.0h</td>
        <td class="hours-cell">7.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">[Notes.5]</td>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <td style="font-weight: bold;">[Date.6]</td>
        <td style="font-weight: 600;">Saturday</td>
        <td style="color: #9ca3af;">-</td>
        <td style="color: #9ca3af;">-</td>
        <td style="color: #9ca3af;">-</td>
        <td class="hours-cell" style="color: #9ca3af;">0.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">Day Off</td>
      </tr>
      <tr style="background-color: #f1f5f9;">
        <td style="font-weight: bold;">[Date.7]</td>
        <td style="font-weight: 600;">Sunday</td>
        <td style="color: #9ca3af;">-</td>
        <td style="color: #9ca3af;">-</td>
        <td style="color: #9ca3af;">-</td>
        <td class="hours-cell" style="color: #9ca3af;">0.0</td>
        <td style="font-size: 0.65rem; color: #64748b;">Day Off</td>
      </tr>
    </tbody>
  </table>

  <!-- Hours Summary -->
  <div class="summary-grid">
    <div class="summary-card regular-hours">
      <div class="summary-label">REGULAR HOURS</div>
      <div class="summary-value">[Regular.Hours]</div>
      <div class="summary-rate">@ $[Hourly.Rate]/hr</div>
    </div>
    <div class="summary-card overtime-hours">
      <div class="summary-label">OVERTIME HOURS</div>
      <div class="summary-value">[Overtime.Hours]</div>
      <div class="summary-rate">@ $[Overtime.Rate]/hr</div>
    </div>
    <div class="summary-card total-pay">
      <div class="summary-label">TOTAL GROSS PAY</div>
      <div class="summary-value">${"[gross_pay]"}</div>
    </div>
  </div>

  <!-- Additional Details -->
  <div class="grid-2">
    <div class="leave-section">
      <div class="leave-title">LEAVE/ABSENCES</div>
      <div style="font-size: 0.7rem;">
        <div class="leave-row">
          <span class="leave-label">Sick Leave Used:</span>
          <span class="leave-value">[Sick.Hours] hours</span>
        </div>
        <div class="leave-row">
          <span class="leave-label">Vacation Used:</span>
          <span class="leave-value">[Vacation.Hours] hours</span>
        </div>
        <div class="leave-row">
          <span class="leave-label">Personal Time:</span>
          <span class="leave-value">[Personal.Hours] hours</span>
        </div>
      </div>
    </div>
    <div class="leave-section" style="background: #f0f9ff; border-color: #93c5fd;">
      <div class="leave-title" style="color: #084298;">PROJECT/TASK BREAKDOWN</div>
      <div style="font-size: 0.7rem;">
        <div class="leave-row">
          <span class="leave-label">[Project.1.Name]:</span>
          <span class="leave-value">[Project.1.Hours]h</span>
        </div>
        <div class="leave-row">
          <span class="leave-label">[Project.2.Name]:</span>
          <span class="leave-value">[Project.2.Hours]h</span>
        </div>
        <div class="leave-row">
          <span class="leave-label">[Project.3.Name]:</span>
          <span class="leave-value">[Project.3.Hours]h</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Comments -->
  <div class="comments-section">
    <div class="section-title">EMPLOYEE COMMENTS</div>
    <div class="comments-box">
      [Employee.Comments]
    </div>
  </div>

  <!-- Signatures -->
  <div class="certification-section">
    <div class="certification-title">CERTIFICATIONS</div>
    <div class="signature-box">
      <div class="employee-signature">
        <div class="signature-title employee-signature-title">EMPLOYEE CERTIFICATION</div>
        <div class="signature-text">
          I certify that the hours worked as shown on this timesheet are true and accurate to the best of my knowledge.
        </div>
        <div class="signature-line">
          <div class="signature-label">Employee Signature</div>
        </div>
        <div class="signature-details">
          <div>
            <div class="info-label">Name:</div>
            <div style="font-weight: bold;">[Employee.FullName]</div>
          </div>
          <div>
            <div class="info-label">Date:</div>
            <div>_____________</div>
          </div>
        </div>
      </div>
      <div class="supervisor-signature">
        <div class="signature-title supervisor-signature-title">SUPERVISOR APPROVAL</div>
        <div class="signature-text">
          I have reviewed this timesheet and approve the hours worked as recorded above.
        </div>
        <div class="signature-line">
          <div class="signature-label">Supervisor Signature</div>
        </div>
        <div class="signature-details">
          <div>
            <div class="info-label">Name:</div>
            <div style="font-weight: bold;">[Supervisor.Name]</div>
          </div>
          <div>
            <div class="info-label">Date:</div>
            <div>_____________</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-title">CONFIDENTIAL EMPLOYEE RECORD</div>
    <div>Submit completed timesheet to HR/Payroll by [Submission.Deadline]</div>
    <div style="margin-top: 0.5rem;">Timesheet #[Timesheet.Number] | [Company.Name] Payroll Department</div>
  </div>
</body>
</html>
`
}, 
{
  id: 'meeting-minutes-001',
  name: 'Professional Meeting Minutes',
  description: 'Clean, structured, and professional template for recording meeting minutes',
  category: 'business',
  popular: true,
  fields: [
    'Meeting Title',
    'Meeting Date',
    'Meeting Time',
    'Meeting Location',
    'Meeting Organizer',
    'Minute Taker',
    'Attendees',
    'Agenda Items',
    'Discussion Points',
    'Action Items',
    'Next Meeting Date',
    'Approved By'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-8 pb-6 border-b-4 border-blue-800">
        <div className="text-3xl font-bold text-slate-900 mb-2">MEETING MINUTES</div>
        <div className="text-lg text-blue-800 font-semibold mb-3">[Meeting.Title]</div>
        <div className="text-sm text-slate-600">
          <strong>Date:</strong> [Meeting.Date] |
          <strong> Time:</strong> [Meeting.Time] |
          <strong> Location:</strong> [Meeting.Location]
        </div>
      </div>

      {/* Meeting Details */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">MEETING DETAILS</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Organizer</div>
            <div className="text-[8px] text-slate-700">
              <div>[Meeting.Organizer]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Minute Taker</div>
            <div className="text-[8px] text-slate-700">
              <div>[Minute.Taker]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">ATENDEES</div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-blue-50 border-l-4 border-blue-800 px-3 py-2">
              <div className="text-[8px] font-semibold text-slate-900">[Attendee.{i+1}]</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda Items */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">AGENDA ITEMS</div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-blue-50 border-l-4 border-blue-800 p-3 rounded-r">
              <div className="font-bold text-slate-900 text-[8px] mb-1">[Agenda.Item.{i+1}.Title]</div>
              <div className="text-[8px] text-slate-700 leading-relaxed">
                <div><strong>Discussion:</strong> [Agenda.Item.{i+1}.Discussion]</div>
                <div><strong>Action Items:</strong> [Agenda.Item.{i+1}.ActionItems]</div>
                <div><strong>Owner:</strong> [Agenda.Item.{i+1}.Owner]</div>
                <div><strong>Deadline:</strong> [Agenda.Item.{i+1}.Deadline]</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Meeting */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">NEXT MEETING</div>
        <div className="text-[8px] text-slate-700 leading-relaxed">
          <div><strong>Date:</strong> [Next.Meeting.Date]</div>
          <div><strong>Agenda:</strong> [Next.Meeting.Agenda]</div>
        </div>
      </div>

      {/* Approval */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">APPROVAL</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Prepared By</div>
            <div className="text-[8px] text-slate-700">
              <div>[Prepared.By]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Approved By</div>
            <div className="text-[8px] text-slate-700">
              <div>[Approved.By]</div>
              <div className="mt-4 border-t border-slate-300 pt-2"><strong>Signature:</strong> ________________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>Confidential - For internal use only</div>
        <div className="mt-1">Last Updated: [Last.Updated.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Minutes: [Meeting.Title]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      border-bottom: 4px solid #1e40af;
      padding-bottom: 1.5rem;
    }
    .header h1 {
      font-size: 1.8rem;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 0.5rem;
    }
    .header h2 {
      font-size: 1.1rem;
      color: #1e40af;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 0.8rem;
      color: #64748b;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      color: #1e40af;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 0.5rem;
    }
    .detail-box {
      background: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
    }
    .detail-box h3 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: #1e3a8a;
    }
    .detail-box p {
      font-size: 0.8rem;
      margin: 0.2rem 0;
    }
    .attendee-box {
      background: #f0f9ff;
      border-left: 4px solid #1e40af;
      padding: 0.5rem;
      margin: 0.25rem;
      text-align: center;
      font-size: 0.8rem;
    }
    .agenda-box {
      background: #f0f9ff;
      border-left: 4px solid #1e40af;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .agenda-box h4 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      color: #1e3a8a;
    }
    .agenda-box p {
      font-size: 0.8rem;
      margin: 0.2rem 0;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.7rem;
      color: #64748b;
    }
    .signature-line {
      border-top: 1px solid #e2e8f0;
      padding-top: 0.5rem;
      margin-top: 1rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <!-- Header Section -->
  <div class="header">
    <h1>MEETING MINUTES</h1>
    <h2>[Meeting.Title]</h2>
    <p>
      <strong>Date:</strong> [Meeting.Date] |
      <strong>Time:</strong> [Meeting.Time] |
      <strong>Location:</strong> [Meeting.Location]
    </p>
  </div>

  <!-- Meeting Details -->
  <div class="section">
    <div class="section-title">MEETING DETAILS</div>
    <div class="grid-2">
      <div class="detail-box">
        <h3>Organizer</h3>
        <p>[Meeting.Organizer]</p>
      </div>
      <div class="detail-box">
        <h3>Minute Taker</h3>
        <p>[Minute.Taker]</p>
      </div>
    </div>
  </div>

  <!-- Attendees -->
  <div class="section">
    <div class="section-title">ATENDEES</div>
    <div class="grid-3">
      <div class="attendee-box">[Attendee.1]</div>
      <div class="attendee-box">[Attendee.2]</div>
      <div class="attendee-box">[Attendee.3]</div>
      <div class="attendee-box">[Attendee.4]</div>
      <div class="attendee-box">[Attendee.5]</div>
      <div class="attendee-box">[Attendee.6]</div>
      <div class="attendee-box">[Attendee.7]</div>
      <div class="attendee-box">[Attendee.8]</div>
      <div class="attendee-box">[Attendee.9]</div>
    </div>
  </div>

  <!-- Agenda Items -->
  <div class="section">
    <div class="section-title">AGENDA ITEMS</div>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div class="agenda-box">
        <h4>[Agenda.Item.1.Title]</h4>
        <p><strong>Discussion:</strong> [Agenda.Item.1.Discussion]</p>
        <p><strong>Action Items:</strong> [Agenda.Item.1.ActionItems]</p>
        <p><strong>Owner:</strong> [Agenda.Item.1.Owner]</p>
        <p><strong>Deadline:</strong> [Agenda.Item.1.Deadline]</p>
      </div>
      <div class="agenda-box">
        <h4>[Agenda.Item.2.Title]</h4>
        <p><strong>Discussion:</strong> [Agenda.Item.2.Discussion]</p>
        <p><strong>Action Items:</strong> [Agenda.Item.2.ActionItems]</p>
        <p><strong>Owner:</strong> [Agenda.Item.2.Owner]</p>
        <p><strong>Deadline:</strong> [Agenda.Item.2.Deadline]</p>
      </div>
      <div class="agenda-box">
        <h4>[Agenda.Item.3.Title]</h4>
        <p><strong>Discussion:</strong> [Agenda.Item.3.Discussion]</p>
        <p><strong>Action Items:</strong> [Agenda.Item.3.ActionItems]</p>
        <p><strong>Owner:</strong> [Agenda.Item.3.Owner]</p>
        <p><strong>Deadline:</strong> [Agenda.Item.3.Deadline]</p>
      </div>
      <div class="agenda-box">
        <h4>[Agenda.Item.4.Title]</h4>
        <p><strong>Discussion:</strong> [Agenda.Item.4.Discussion]</p>
        <p><strong>Action Items:</strong> [Agenda.Item.4.ActionItems]</p>
        <p><strong>Owner:</strong> [Agenda.Item.4.Owner]</p>
        <p><strong>Deadline:</strong> [Agenda.Item.4.Deadline]</p>
      </div>
      <div class="agenda-box">
        <h4>[Agenda.Item.5.Title]</h4>
        <p><strong>Discussion:</strong> [Agenda.Item.5.Discussion]</p>
        <p><strong>Action Items:</strong> [Agenda.Item.5.ActionItems]</p>
        <p><strong>Owner:</strong> [Agenda.Item.5.Owner]</p>
        <p><strong>Deadline:</strong> [Agenda.Item.5.Deadline]</p>
      </div>
    </div>
  </div>

  <!-- Next Meeting -->
  <div class="section">
    <div class="section-title">NEXT MEETING</div>
    <div class="detail-box">
      <p><strong>Date:</strong> [Next.Meeting.Date]</p>
      <p><strong>Agenda:</strong> [Next.Meeting.Agenda]</p>
    </div>
  </div>

  <!-- Approval -->
  <div class="section">
    <div class="section-title">APPROVAL</div>
    <div class="grid-2">
      <div class="detail-box">
        <h3>Prepared By</h3>
        <p>[Prepared.By]</p>
        <div class="signature-line">
          <strong>Signature:</strong> ________________________
        </div>
      </div>
      <div class="detail-box">
        <h3>Approved By</h3>
        <p>[Approved.By]</p>
        <div class="signature-line">
          <strong>Signature:</strong> ________________________
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Confidential - For internal use only</p>
    <p>Last Updated: [Last.Updated.Date]</p>
  </div>
</body>
</html>

  `
},
{
  id: 'certificate-001',
  name: 'Professional Certificate',
  description: 'Elegant and professional certificate template for awards, achievements, and completions',
  category: 'education',
  popular: true,
  fields: [
    'Certificate Title',
    'Recipient Name',
    'Course/Program Name',
    'Issuer Name',
    'Issuer Logo',
    'Issue Date',
    'Certificate ID',
    'Instructor/Signer Name',
    'Instructor/Signer Title',
    'Additional Notes'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Certificate Border and Background */}
      <div className="relative border-4 border-blue-800 p-8 bg-gradient-to-b from-blue-50 to-white">
        {/* Issuer Logo (Optional) */}
        <div className="flex justify-center mb-4">
          <img src="[Issuer.Logo]" alt="[Issuer.Name] Logo" className="h-16" />
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-blue-800 mb-2">CERTIFICATE OF [Certificate.Title]</div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-slate-900 mb-4">This is to certify that</div>
          <div className="text-3xl font-bold text-blue-800 mb-6 border-b-2 border-blue-800 pb-2 inline-block">[Recipient.Name]</div>
          <div className="text-xl text-slate-700 mb-4">has successfully completed the</div>
          <div className="text-2xl font-bold text-slate-900 mb-6">[Course/Program.Name]</div>
        </div>

        {/* Details */}
        <div className="text-center mb-8">
          <div className="text-sm text-slate-700 mb-2">Issued by: <strong>[Issuer.Name]</strong></div>
          <div className="text-sm text-slate-700 mb-2">Date: <strong>[Issue.Date]</strong></div>
          <div className="text-sm text-slate-700 mb-2">Certificate ID: <strong>[Certificate.ID]</strong></div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="text-center">
            <div className="border-t-2 border-blue-800 pt-2 mb-2">
              <div className="text-lg font-bold text-slate-900">[Instructor/Signer.Name]</div>
              <div className="text-[8px] text-slate-700">[Instructor/Signer.Title]</div>
            </div>
            <div className="text-[8px] text-slate-500">Signature</div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-blue-800 pt-2 mb-2">
              <div className="text-lg font-bold text-slate-900">[Issuer.Representative.Name]</div>
              <div className="text-[8px] text-slate-700">[Issuer.Representative.Title]</div>
            </div>
            <div className="text-[8px] text-slate-500">Signature</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[7px] text-slate-500">
          <div>[Additional.Notes]</div>
          <div className="mt-1">This certificate is awarded on [Issue.Date]</div>
        </div>
      </div>
    </div>
  ),
  htmlTemplate: `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate: [Certificate.Title]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background-color: #f8fafc;
    }
    .certificate {
      border: 4px solid #1e40af;
      padding: 2rem;
      background: linear-gradient(to bottom, #f0f9ff, white);
      position: relative;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .certificate-title {
      color: #1e40af;
      font-size: 2rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 1rem;
    }
    .recipient-name {
      color: #1e40af;
      font-size: 1.8rem;
      font-weight: bold;
      text-align: center;
      margin: 1rem 0;
      border-bottom: 2px solid #1e40af;
      display: inline-block;
      padding-bottom: 0.5rem;
    }
    .course-name {
      color: #1e3a8a;
      font-size: 1.5rem;
      font-weight: bold;
      text-align: center;
      margin: 1rem 0;
    }
    .signature-section {
      margin-top: 2rem;
    }
    .signature {
      border-top: 2px solid #1e40af;
      padding-top: 0.5rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.7rem;
      color: #64748b;
    }
    .logo-container {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .logo-container img {
      max-height: 4rem;
      max-width: 100%;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Issuer Logo (Optional) -->
    <div class="logo-container">
      <img src="[Issuer.Logo]" alt="[Issuer.Name] Logo" />
    </div>

    <!-- Certificate Title -->
    <div class="certificate-title">CERTIFICATE OF [Certificate.Title]</div>

    <!-- Main Content -->
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div style="font-size: 1.2rem; margin-bottom: 1rem;">This is to certify that</div>
      <div class="recipient-name">[Recipient.Name]</div>
      <div style="font-size: 1.1rem; margin: 1rem 0;">has successfully completed the</div>
      <div class="course-name">[Course/Program.Name]</div>
    </div>

    <!-- Details -->
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <p style="font-size: 0.9rem; margin: 0.5rem 0;">Issued by: <strong>[Issuer.Name]</strong></p>
      <p style="font-size: 0.9rem; margin: 0.5rem 0;">Date: <strong>[Issue.Date]</strong></p>
      <p style="font-size: 0.9rem; margin: 0.5rem 0;">Certificate ID: <strong>[Certificate.ID]</strong></p>
    </div>

    <!-- Signatures -->
    <div class="signature-section">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div class="signature">
          <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3rem;">[Instructor/Signer.Name]</div>
          <div style="font-size: 0.8rem; color: #64748b;">[Instructor/Signer.Title]</div>
        </div>
        <div class="signature">
          <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.3rem;">[Issuer.Representative.Name]</div>
          <div style="font-size: 0.8rem; color: #64748b;">[Issuer.Representative.Title]</div>
        </div>
      </div>
      <div style="text-align: center; font-size: 0.7rem; color: #64748b; margin-top: 1rem;">
        <p>[Additional.Notes]</p>
        <p>This certificate is awarded on [Issue.Date]</p>
      </div>
    </div>
  </div>
</body>
</html>

  `
},
 {
  id: 'tax-invoice-001',
  name: 'Professional Tax Invoice',
  description: 'Clean, professional, and legally compliant tax invoice template for businesses and freelancers',
  category: 'finance',
  popular: true,
  fields: [
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Company Name',
    'Company Address',
    'Company Contact',
    'Company Tax ID',
    'Client Name',
    'Client Address',
    'Client Contact',
    'Client Tax ID',
    'Item Description',
    'Item Quantity',
    'Item Unit Price',
    'Item Total',
    'Subtotal',
    'Tax Rate',
    'Tax Amount',
    'Total Amount',
    'Payment Terms',
    'Bank Details',
    'Notes'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="flex justify-between mb-8">
        <div>
          <div className="text-3xl font-bold text-slate-900">TAX INVOICE</div>
          <div className="text-lg text-blue-800 font-semibold mt-2"># [Invoice.Number]</div>
          <div className="text-sm text-slate-600 mt-1">
            <div>Date: [Invoice.Date]</div>
            <div>Due Date: [Due.Date]</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">[Company.Name]</div>
          <div className="text-[8px] text-slate-700 mt-1">
            <div>[Company.Address]</div>
            <div>Contact: [Company.Contact]</div>
            <div>Tax ID: [Company.Tax.ID]</div>
          </div>
        </div>
      </div>

      {/* Client and Invoice Details */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">BILL TO</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Client Details</div>
            <div className="text-[8px] text-slate-700">
              <div>[Client.Name]</div>
              <div>[Client.Address]</div>
              <div>Contact: [Client.Contact]</div>
              <div>Tax ID: [Client.Tax.ID]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Invoice Details</div>
            <div className="text-[8px] text-slate-700">
              <div>Invoice #: [Invoice.Number]</div>
              <div>Date: [Invoice.Date]</div>
              <div>Due Date: [Due.Date]</div>
              <div>Payment Terms: [Payment.Terms]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">INVOICE ITEMS</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-slate-300 p-2 text-left">#</th>
              <th className="border border-slate-300 p-2 text-left">Description</th>
              <th className="border border-slate-300 p-2 text-right">Quantity</th>
              <th className="border border-slate-300 p-2 text-right">Unit Price</th>
              <th className="border border-slate-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="border border-slate-300 p-2">{i+1}</td>
                <td className="border border-slate-300 p-2">[Item.{i+1}.Description]</td>
                <td className="border border-slate-300 p-2 text-right">[Item.{i+1}.Quantity]</td>
                <td className="border border-slate-300 p-2 text-right">[Item.{i+1}.Unit.Price]</td>
                <td className="border border-slate-300 p-2 text-right">[Item.{i+1}.Total]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">TOTALS</div>
        <div className="flex justify-end">
          <table className="w-1/3 text-[8px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-right">Subtotal:</td>
                <td className="border border-slate-300 p-2 text-right">[Subtotal]</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-right">Tax ([Tax.Rate]%):</td>
                <td className="border border-slate-300 p-2 text-right">[Tax.Amount]</td>
              </tr>
              <tr className="bg-blue-50 font-bold">
                <td className="border border-slate-300 p-2 text-right">Total:</td>
                <td className="border border-slate-300 p-2 text-right">[Total.Amount]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment and Notes */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">PAYMENT DETAILS</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Bank Details</div>
            <div className="text-[8px] text-slate-700">
              <div>[Bank.Details]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Notes</div>
            <div className="text-[8px] text-slate-700">
              <div>[Notes]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>Thank you for your business!</div>
        <div className="mt-1">Invoice generated on [Invoice.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice # [Invoice.Number]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .invoice-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: #1e3a8a;
    }
    .invoice-number {
      font-size: 1.1rem;
      color: #1e40af;
      font-weight: 600;
      margin-top: 0.5rem;
    }
    .invoice-dates {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.3rem;
    }
    .company-details {
      text-align: right;
    }
    .company-name {
      font-size: 1.2rem;
      font-weight: bold;
      color: #1e3a8a;
    }
    .company-info {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.3rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      color: #1e40af;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 0.5rem;
    }
    .client-box {
      background: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
    }
    .client-box h3 {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .client-box p {
      font-size: 0.8rem;
      margin: 0.2rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.7rem;
      margin-bottom: 1rem;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f0f9ff;
    }
    th:not(:first-child) {
      text-align: right;
    }
    td:not(:first-child) {
      text-align: right;
    }
    .totals-table {
      width: 33%;
      margin-left: auto;
    }
    .totals-table tr:last-child {
      background: #f0f9ff;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-number"># [Invoice.Number]</div>
      <div class="invoice-dates">
        <div>Date: [Invoice.Date]</div>
        <div>Due Date: [Due.Date]</div>
      </div>
    </div>
    <div class="company-details">
      <div class="company-name">[Company.Name]</div>
      <div class="company-info">
        <div>[Company.Address]</div>
        <div>Contact: [Company.Contact]</div>
        <div>Tax ID: [Company.Tax.ID]</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">BILL TO</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="client-box">
        <h3>Client Details</h3>
        <p>[Client.Name]</p>
        <p>[Client.Address]</p>
        <p>Contact: [Client.Contact]</p>
        <p>Tax ID: [Client.Tax.ID]</p>
      </div>
      <div class="client-box">
        <h3>Invoice Details</h3>
        <p>Invoice #: [Invoice.Number]</p>
        <p>Date: [Invoice.Date]</p>
        <p>Due Date: [Due.Date]</p>
        <p>Payment Terms: [Payment.Terms]</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INVOICE ITEMS</div>
    <table>
      <thead>
        <tr style="background: #f0f9ff;">
          <th style="text-align: left;">#</th>
          <th style="text-align: left;">Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td style="text-align: left;">[Item.1.Description]</td>
          <td>[Item.1.Quantity]</td>
          <td>[Item.1.Unit.Price]</td>
          <td>[Item.1.Total]</td>
        </tr>
        <tr>
          <td>2</td>
          <td style="text-align: left;">[Item.2.Description]</td>
          <td>[Item.2.Quantity]</td>
          <td>[Item.2.Unit.Price]</td>
          <td>[Item.2.Total]</td>
        </tr>
        <tr>
          <td>3</td>
          <td style="text-align: left;">[Item.3.Description]</td>
          <td>[Item.3.Quantity]</td>
          <td>[Item.3.Unit.Price]</td>
          <td>[Item.3.Total]</td>
        </tr>
        <tr>
          <td>4</td>
          <td style="text-align: left;">[Item.4.Description]</td>
          <td>[Item.4.Quantity]</td>
          <td>[Item.4.Unit.Price]</td>
          <td>[Item.4.Total]</td>
        </tr>
        <tr>
          <td>5</td>
          <td style="text-align: left;">[Item.5.Description]</td>
          <td>[Item.5.Quantity]</td>
          <td>[Item.5.Unit.Price]</td>
          <td>[Item.5.Total]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">TOTALS</div>
    <div style="display: flex; justify-content: flex-end;">
      <table class="totals-table">
        <tbody>
          <tr>
            <td style="text-align: right; padding: 0.5rem;">Subtotal:</td>
            <td style="text-align: right; padding: 0.5rem;">[Subtotal]</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 0.5rem;">Tax ([Tax.Rate]%):</td>
            <td style="text-align: right; padding: 0.5rem;">[Tax.Amount]</td>
          </tr>
          <tr style="background: #f0f9ff; font-weight: bold;">
            <td style="text-align: right; padding: 0.5rem;">Total:</td>
            <td style="text-align: right; padding: 0.5rem;">[Total.Amount]</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">PAYMENT DETAILS</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="client-box">
        <h3>Bank Details</h3>
        <p>[Bank.Details]</p>
      </div>
      <div class="client-box">
        <h3>Notes</h3>
        <p>[Notes]</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Invoice generated on [Invoice.Date]</p>
  </div>
</body>
</html>

  `
},
{
  id: 'expense-report-001',
  name: 'Professional Expense Report',
  description: 'Clean, detailed, and professional expense report template for businesses and individuals',
  category: 'finance',
  popular: true,
  fields: [
    'Report Title',
    'Report Number',
    'Report Date',
    'Employee Name',
    'Employee ID',
    'Department',
    'Manager Name',
    'Project Name',
    'Expense Items',
    'Expense Date',
    'Expense Category',
    'Expense Description',
    'Expense Amount',
    'Expense Receipt',
    'Subtotal',
    'Tax Amount',
    'Total Amount',
    'Payment Method',
    'Approval Status',
    'Notes'
  ],
  previewComponent: (
    <div className="w-full h-full bg-white p-8 text-[9px] overflow-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-8 pb-6 border-b-4 border-blue-800">
        <div className="text-3xl font-bold text-slate-900 mb-2">EXPENSE REPORT</div>
        <div className="text-lg text-blue-800 font-semibold mb-3">[Report.Title]</div>
        <div className="text-sm text-slate-600">
          <div>Report #: [Report.Number]</div>
          <div>Date: [Report.Date]</div>
        </div>
      </div>

      {/* Employee and Report Details */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">EMPLOYEE & REPORT DETAILS</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Employee Details</div>
            <div className="text-[8px] text-slate-700">
              <div>Name: [Employee.Name]</div>
              <div>ID: [Employee.ID]</div>
              <div>Department: [Department]</div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Report Details</div>
            <div className="text-[8px] text-slate-700">
              <div>Manager: [Manager.Name]</div>
              <div>Project: [Project.Name]</div>
              <div>Payment Method: [Payment.Method]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Items Table */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">EXPENSE ITEMS</div>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-slate-300 p-2 text-left">#</th>
              <th className="border border-slate-300 p-2 text-left">Date</th>
              <th className="border border-slate-300 p-2 text-left">Category</th>
              <th className="border border-slate-300 p-2 text-left">Description</th>
              <th className="border border-slate-300 p-2 text-right">Amount</th>
              <th className="border border-slate-300 p-2 text-left">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td className="border border-slate-300 p-2">{i+1}</td>
                <td className="border border-slate-300 p-2">[Expense.{i+1}.Date]</td>
                <td className="border border-slate-300 p-2">[Expense.{i+1}.Category]</td>
                <td className="border border-slate-300 p-2">[Expense.{i+1}.Description]</td>
                <td className="border border-slate-300 p-2 text-right">[Expense.{i+1}.Amount]</td>
                <td className="border border-slate-300 p-2">[Expense.{i+1}.Receipt]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">TOTALS</div>
        <div className="flex justify-end">
          <table className="w-1/3 text-[8px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-right">Subtotal:</td>
                <td className="border border-slate-300 p-2 text-right">[Subtotal]</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-right">Tax:</td>
                <td className="border border-slate-300 p-2 text-right">[Tax.Amount]</td>
              </tr>
              <tr className="bg-blue-50 font-bold">
                <td className="border border-slate-300 p-2 text-right">Total:</td>
                <td className="border border-slate-300 p-2 text-right">[Total.Amount]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval and Notes */}
      <div className="mb-8">
        <div className="text-xl font-bold text-blue-800 mb-3 pb-2 border-b-2 border-blue-800">APPROVAL & NOTES</div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Approval Status</div>
            <div className="text-[8px] text-slate-700">
              <div>[Approval.Status]</div>
              <div className="mt-4 border-t border-slate-300 pt-2">
                <div className="font-bold">Manager Signature:</div>
                <div className="mt-2">________________________</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border-l-4 border-blue-800 p-4 rounded-r">
            <div className="font-bold text-slate-900 text-sm mb-1">Notes</div>
            <div className="text-[8px] text-slate-700">
              <div>[Notes]</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[7px] text-slate-500 border-t border-slate-200 pt-4">
        <div>Please submit this report with all receipts attached.</div>
        <div className="mt-1">Report generated on [Report.Date]</div>
      </div>
    </div>
  ),
  htmlTemplate: `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expense Report: [Report.Title]</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      border-bottom: 4px solid #1e40af;
      padding-bottom: 1.5rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      color: #1e40af;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 0.5rem;
    }
    .detail-box {
      background: #f8fafc;
      border-left: 4px solid #1e40af;
      padding: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.7rem;
      margin-bottom: 1rem;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f0f9ff;
    }
    .totals-table {
      width: 33%;
      margin-left: auto;
    }
    .totals-table tr:last-child {
      background: #f0f9ff;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.7rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>EXPENSE REPORT</h1>
    <h2 style="color: #1e40af; font-size: 1.1rem; margin-bottom: 0.5rem;">[Report.Title]</h2>
    <p style="font-size: 0.8rem; color: #64748b;">
      Report #: [Report.Number]<br>
      Date: [Report.Date]
    </p>
  </div>

  <div class="section">
    <div class="section-title">EMPLOYEE & REPORT DETAILS</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="detail-box">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Employee Details</h3>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">Name: [Employee.Name]</p>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">ID: [Employee.ID]</p>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">Department: [Department]</p>
      </div>
      <div class="detail-box">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Report Details</h3>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">Manager: [Manager.Name]</p>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">Project: [Project.Name]</p>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">Payment Method: [Payment.Method]</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">EXPENSE ITEMS</div>
    <table>
      <thead>
        <tr style="background: #f0f9ff;">
          <th style="text-align: left;">#</th>
          <th style="text-align: left;">Date</th>
          <th style="text-align: left;">Category</th>
          <th style="text-align: left;">Description</th>
          <th style="text-align: right;">Amount</th>
          <th style="text-align: left;">Receipt</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>[Expense.1.Date]</td>
          <td>[Expense.1.Category]</td>
          <td>[Expense.1.Description]</td>
          <td style="text-align: right;">[Expense.1.Amount]</td>
          <td>[Expense.1.Receipt]</td>
        </tr>
        <tr>
          <td>2</td>
          <td>[Expense.2.Date]</td>
          <td>[Expense.2.Category]</td>
          <td>[Expense.2.Description]</td>
          <td style="text-align: right;">[Expense.2.Amount]</td>
          <td>[Expense.2.Receipt]</td>
        </tr>
        <tr>
          <td>3</td>
          <td>[Expense.3.Date]</td>
          <td>[Expense.3.Category]</td>
          <td>[Expense.3.Description]</td>
          <td style="text-align: right;">[Expense.3.Amount]</td>
          <td>[Expense.3.Receipt]</td>
        </tr>
        <tr>
          <td>4</td>
          <td>[Expense.4.Date]</td>
          <td>[Expense.4.Category]</td>
          <td>[Expense.4.Description]</td>
          <td style="text-align: right;">[Expense.4.Amount]</td>
          <td>[Expense.4.Receipt]</td>
        </tr>
        <tr>
          <td>5</td>
          <td>[Expense.5.Date]</td>
          <td>[Expense.5.Category]</td>
          <td>[Expense.5.Description]</td>
          <td style="text-align: right;">[Expense.5.Amount]</td>
          <td>[Expense.5.Receipt]</td>
        </tr>
        <tr>
          <td>6</td>
          <td>[Expense.6.Date]</td>
          <td>[Expense.6.Category]</td>
          <td>[Expense.6.Description]</td>
          <td style="text-align: right;">[Expense.6.Amount]</td>
          <td>[Expense.6.Receipt]</td>
        </tr>
        <tr>
          <td>7</td>
          <td>[Expense.7.Date]</td>
          <td>[Expense.7.Category]</td>
          <td>[Expense.7.Description]</td>
          <td style="text-align: right;">[Expense.7.Amount]</td>
          <td>[Expense.7.Receipt]</td>
        </tr>
        <tr>
          <td>8</td>
          <td>[Expense.8.Date]</td>
          <td>[Expense.8.Category]</td>
          <td>[Expense.8.Description]</td>
          <td style="text-align: right;">[Expense.8.Amount]</td>
          <td>[Expense.8.Receipt]</td>
        </tr>
        <tr>
          <td>9</td>
          <td>[Expense.9.Date]</td>
          <td>[Expense.9.Category]</td>
          <td>[Expense.9.Description]</td>
          <td style="text-align: right;">[Expense.9.Amount]</td>
          <td>[Expense.9.Receipt]</td>
        </tr>
        <tr>
          <td>10</td>
          <td>[Expense.10.Date]</td>
          <td>[Expense.10.Category]</td>
          <td>[Expense.10.Description]</td>
          <td style="text-align: right;">[Expense.10.Amount]</td>
          <td>[Expense.10.Receipt]</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">TOTALS</div>
    <div style="display: flex; justify-content: flex-end;">
      <table class="totals-table">
        <tbody>
          <tr>
            <td style="text-align: right; padding: 0.5rem;">Subtotal:</td>
            <td style="text-align: right; padding: 0.5rem;">[Subtotal]</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 0.5rem;">Tax:</td>
            <td style="text-align: right; padding: 0.5rem;">[Tax.Amount]</td>
          </tr>
          <tr style="background: #f0f9ff; font-weight: bold;">
            <td style="text-align: right; padding: 0.5rem;">Total:</td>
            <td style="text-align: right; padding: 0.5rem;">[Total.Amount]</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">APPROVAL & NOTES</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="detail-box">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Approval Status</h3>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">[Approval.Status]</p>
        <div style="margin-top: 1rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
          <p style="font-weight: bold; font-size: 0.8rem;">Manager Signature:</p>
          <p style="margin-top: 1rem;">________________________</p>
        </div>
      </div>
      <div class="detail-box">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Notes</h3>
        <p style="font-size: 0.8rem; margin: 0.2rem 0;">[Notes]</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Please submit this report with all receipts attached.</p>
    <p>Report generated on [Report.Date]</p>
  </div>
</body>
</html>

  `
},


  // Continue with more templates...
]
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Document Templates</h1>
        <p className="text-slate-600">Create professional documents in minutes with pre-built templates</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-10 h-12 bg-slate-50 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => router.push('/app/template')}
            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Document
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <category.icon className="h-4 w-4" />
            <span>{category.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedCategory === category.id
                ? 'bg-white/20'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Popular Templates Section */}
      {selectedCategory === 'all' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Popular Templates
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.popular).map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-xl border shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* BEAUTIFUL PREVIEW CARD */}
                <div className="h-64 border-b overflow-hidden relative">
                  {template.previewComponent}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTemplate(template)
                          setShowPreview(true)
                        }}
                        className="flex-1 bg-white/90 hover:bg-white"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/templates/editor/${template.id}`)
                        }}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg group-hover:text-purple-600 transition-colors">
                      {template.name}
                    </h3>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{template.description}</p>
                  <div className="text-xs text-slate-500">
                    {template.fields.length} customizable fields
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Templates Grid */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {selectedCategory === 'all' ? 'All Templates' : categories.find(c => c.id === selectedCategory)?.name}
          <span className="text-slate-500 font-normal ml-2">({filteredTemplates.length})</span>
        </h2>
        
        {filteredTemplates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-xl border shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* BEAUTIFUL MINI PREVIEW */}
                <div className="h-48 border-b overflow-hidden relative">
                  <div className="transform scale-75 origin-top-left w-[133%] h-[133%]">
                    {template.previewComponent}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="w-full flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTemplate(template)
                          setShowPreview(true)
                        }}
                        className="flex-1 h-8 text-xs bg-white/90 hover:bg-white"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/templates/editor/${template.id}`)
                        }}
                        className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{template.description}</p>
                  <div className="text-xs text-slate-500">
                    {template.fields.length} fields
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No templates found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or filter</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Template Preview Dialog - Full Size */}
      {selectedTemplate && showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
              <DialogDescription className="text-base">{selectedTemplate.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Full Size Preview */}
              <div className="border-2 rounded-lg overflow-hidden bg-slate-50 p-8">
                <div className="bg-white shadow-2xl rounded-lg overflow-hidden max-w-2xl mx-auto">
                  <div className="aspect-[8.5/11]">
                    {selectedTemplate.previewComponent}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false)
                    router.push(`/template/editor/${selectedTemplate.id}`)
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Use This Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
  )
}
  const sidebarItems = [
    { id: 'dashboard' as PageType, icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'content-library' as PageType, icon: Folder, label: 'Content library', badge: null },
    { id: 'spaces' as PageType, icon: FolderOpen, label: 'Spaces', badge: 'Data rooms' },
    { id: 'agreements' as PageType, icon: FileSignature, label: 'Agreements', badge: null },
    { id: 'templates' as PageType, icon: FileText, label: 'Templates', badge: null },
    { id: 'file-requests' as PageType, icon: Inbox, label: 'File requests', badge: null },
    { id: 'contacts' as PageType, icon: Users, label: 'Contacts', badge: null },
    { id: 'accounts' as PageType, icon: UserCircle, label: 'Accounts', badge: null },
  ]

  // Fetch agreements
const fetchAgreements = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await fetch("/api/agreements", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setAgreements(data.agreements)
      }
    }
  } catch (error) {
    console.error("Failed to fetch agreements:", error)
  }
}

// Fetch file requests
const fetchFileRequests = async () => {
  const token = localStorage.getItem("token")
  if (!token) return

  try {
    const res = await fetch("/api/file-requests", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setFileRequests(data.fileRequests)
      }
    }
  } catch (error) {
    console.error("Failed to fetch file requests:", error)
  }
}

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

  // Replace your entire useEffect with this:

useEffect(() => {
  const fetchUser = async () => {
    try {
      console.log('📥 Fetching user data...');
      
      // ✅ NEW: No token needed - cookie is sent automatically
      const res = await fetch("/api/auth/me", {
        credentials: 'include', // Send HTTP-only cookie
        cache: 'no-store'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to fetch user:", res.status, errorText);
        return;
      }

      const data = await res.json();
      console.log("✅ User data received:", data);

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
      console.error("❌ Fetch error:", error);
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
// Handle file upload
const handleFileUpload = async (file: File) => {
  if (!file) return;

  if (file.type !== 'application/pdf') {
    setUploadStatus('error');
    setUploadMessage('Please upload a PDF file');
    setTimeout(() => setUploadStatus('idle'), 3000);
    return;
  }

  setUploadStatus('uploading');
  setUploadMessage('Uploading your document...');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch("/api/upload", {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setUploadStatus('success');
      setUploadMessage(`Successfully uploaded ${file.name}`);

      // Redirect to the uploaded document's page
      router.push(`/documents/${data.documentId}`);


      // Refresh documents list
      fetchDocuments();

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } else {
      setUploadStatus('error');
      setUploadMessage(data.error || 'Upload failed');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  } catch (error) {
    console.error('Upload error:', error);
    setUploadStatus('error');
    setUploadMessage('Upload failed. Please try again.');
    setTimeout(() => setUploadStatus('idle'), 3000);
  }
};

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
  return <AgreementsSection />

     case 'file-requests':
  return <FileRequestsSection />
  case 'templates':
  return <TemplatesSection />

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
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
            {documents.map((doc) => (
  <button
    key={doc._id}
    onClick={(e) => {
      e.stopPropagation()
      setSelectedDocumentToShare(doc._id)
      setShowShareDialog(true)
    }}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
  >
    <Share2 className="h-5 w-5" />
    <span>Share document</span>
  </button>
))}

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
  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
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
  <DialogContent className="max-w-2xl bg-white">
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
  <DialogContent className="max-w-xl bg-white">
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
  <DialogContent className="max-w-xl bg-white">
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
  <DialogContent className="max-w-3xl bg-white">
    <DialogHeader>
      <DialogTitle >Integrations</DialogTitle>
      <DialogDescription>Connect DocMetrics with your favorite tools</DialogDescription>
    </DialogHeader>
    
    <div className="grid md:grid-cols-2 gap-4">
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
  <DialogContent className="max-w-md bg-white">
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

{/* Upload Agreement Dialog */}
<Dialog open={showUploadAgreementDialog} onOpenChange={setShowUploadAgreementDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle>Upload Agreement</DialogTitle>
      <DialogDescription>Upload an NDA or other legal document that viewers must sign</DialogDescription>
    </DialogHeader>
    
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="template">Use Template</TabsTrigger>
        <TabsTrigger value="create">Create New</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="space-y-4 mt-4">
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer"
          onClick={() => document.getElementById('agreement-file-input')?.click()}
        >
          <Upload className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900 mb-2">Drop your agreement here</p>
          <p className="text-sm text-slate-500 mb-4">or click to browse (PDF only)</p>
          <Button variant="outline">Select File</Button>
        </div>
        <input
          id="agreement-file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'agreement')
            
            try {
              const token = localStorage.getItem("token")
              const res = await fetch("/api/agreements/upload", {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
              })
              
              if (res.ok) {
                const data = await res.json()
                alert('Agreement uploaded successfully!')
                setShowUploadAgreementDialog(false)
                // Refresh agreements list
                fetchAgreements()
              }
            } catch (error) {
              console.error('Upload error:', error)
              alert('Failed to upload agreement')
            }
          }}
        />
        
        <div className="space-y-2">
          <Label>Agreement Title</Label>
          <Input placeholder="e.g., Mutual NDA - Client Name" />
        </div>
        
        <div className="space-y-2">
          <Label>Signers (comma-separated emails)</Label>
          <Textarea 
            placeholder="john@example.com, jane@company.com"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Message (optional)</Label>
          <Textarea 
            placeholder="Please review and sign this NDA before accessing our materials..."
            rows={3}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="require-signature" />
          <Label htmlFor="require-signature" className="text-sm font-normal">
            Require signature before document access
          </Label>
        </div>
        
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => setShowUploadAgreementDialog(false)}>
            Cancel
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Send className="mr-2 h-4 w-4" />
            Send for Signature
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="template" className="space-y-4 mt-4">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Mutual NDA', desc: 'Two-way confidentiality agreement', icon: '🤝' },
            { name: 'Unilateral NDA', desc: 'One-way confidentiality agreement', icon: '🔒' },
            { name: 'Service Agreement', desc: 'Professional services contract', icon: '📋' },
            { name: 'Partnership Agreement', desc: 'Business partnership terms', icon: '🤝' },
          ].map((template) => (
            <div key={template.name} className="border rounded-lg p-6 hover:border-purple-500 hover:bg-purple-50/30 transition-all cursor-pointer">
              <div className="text-4xl mb-3">{template.icon}</div>
              <h4 className="font-semibold text-slate-900 mb-1">{template.name}</h4>
              <p className="text-sm text-slate-600 mb-4">{template.desc}</p>
              <Button size="sm" variant="outline" className="w-full">Use Template</Button>
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="create" className="space-y-4 mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h4 className="font-semibold text-slate-900 mb-2">AI-Powered Agreement Builder</h4>
          <p className="text-sm text-slate-600 mb-4">Coming soon! Create custom agreements with AI assistance</p>
          <Button disabled variant="outline">Available in Pro Plan</Button>
        </div>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>

{/* Create File Request Dialog */}
<Dialog open={showCreateFileRequestDialog} onOpenChange={setShowCreateFileRequestDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle>Create File Request</DialogTitle>
      <DialogDescription>Request files from clients, partners, or team members</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Request Title</Label>
        <Input placeholder="e.g., Client Onboarding Documents" />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          placeholder="What files do you need? Include any specific requirements..."
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Recipients (comma-separated emails)</Label>
        <Textarea 
          placeholder="client@company.com, partner@business.com"
          rows={2}
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" />
        </div>
        
        <div className="space-y-2">
          <Label>Expected Files</Label>
          <Input type="number" placeholder="Number of files" defaultValue={1} />
        </div>
      </div>
      
      <div className="space-y-3">
        <Label>Requested Files</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="e.g., Driver's License" className="flex-1" />
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g., Proof of Address" className="flex-1" />
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Another File Type
        </Button>
      </div>
      
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Switch id="require-account" />
          <Label htmlFor="require-account" className="text-sm font-normal">
            Recipients must have DocMetrics account
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="send-reminders" defaultChecked />
          <Label htmlFor="send-reminders" className="text-sm font-normal">
            Send automatic reminders
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="allow-multiple" />
          <Label htmlFor="allow-multiple" className="text-sm font-normal">
            Allow multiple file uploads per type
          </Label>
        </div>
      </div>
      
      <div className="bg-slate-50 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Inbox className="h-5 w-5 text-slate-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 mb-1">How it works</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Recipients receive an email with a secure upload link</li>
              <li>• They can upload files without creating an account (unless required)</li>
              <li>• You'll get notified when files are uploaded</li>
              <li>• All files are encrypted and stored securely</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={() => setShowCreateFileRequestDialog(false)}>
          Cancel
        </Button>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          onClick={async () => {
            try {
              const token = localStorage.getItem("token")
              const res = await fetch("/api/file-requests", {
                method: 'POST',
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  title: "New File Request",
                  description: "Please upload the requested files",
                  recipients: [],
                  dueDate: new Date(),
                  expectedFiles: 1
                })
              })
              
              if (res.ok) {
                alert('File request created successfully!')
                setShowCreateFileRequestDialog(false)
                fetchFileRequests()
              }
            } catch (error) {
              console.error('Create error:', error)
              alert('Failed to create file request')
            }
          }}
        >
          <Send className="mr-2 h-4 w-4" />
          Create & Send Request
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
{/* Share Document Dialog */}
<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle>Share Document</DialogTitle>
      <DialogDescription>
        Share this document with others via email
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email addresses (comma-separated)</Label>
        <Textarea
          placeholder="john@example.com, jane@company.com"
          rows={3}
          value={shareEmails}
          onChange={(e) => setShareEmails(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Recipients will receive an email with a secure link to view this document
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Message (optional)</Label>
        <Textarea
          placeholder="Add a personal message..."
          rows={3}
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
        />
      </div>
      
      <div className="border rounded-lg p-4 space-y-3">
        <Label className="text-sm font-semibold">Permissions</Label>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Can view</p>
            <p className="text-xs text-slate-500">Recipients can view the document</p>
          </div>
          <Switch
            checked={sharePermissions.canView}
            onCheckedChange={(checked) =>
              setSharePermissions({ ...sharePermissions, canView: checked })
            }
            disabled
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Can download</p>
            <p className="text-xs text-slate-500">Recipients can download the document</p>
          </div>
          <Switch
            checked={sharePermissions.canDownload}
            onCheckedChange={(checked) =>
              setSharePermissions({ ...sharePermissions, canDownload: checked })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Can edit</p>
            <p className="text-xs text-slate-500">Recipients can make changes</p>
          </div>
          <Switch
            checked={sharePermissions.canEdit}
            onCheckedChange={(checked) =>
              setSharePermissions({ ...sharePermissions, canEdit: checked })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Can share</p>
            <p className="text-xs text-slate-500">Recipients can share with others</p>
          </div>
          <Switch
            checked={sharePermissions.canShare}
            onCheckedChange={(checked) =>
              setSharePermissions({ ...sharePermissions, canShare: checked })
            }
          />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Share2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Email notifications will be sent
            </p>
            <p className="text-xs text-blue-700">
              Recipients will receive an email with a secure link and your optional message. 
              You'll be notified when they view the document.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowShareDialog(false)
            setShareEmails('')
            setShareMessage('')
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleShareDocument}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Send className="mr-2 h-4 w-4" />
          Share Document
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}