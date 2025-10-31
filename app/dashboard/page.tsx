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
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
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
    { id: 'all', name: 'All Templates', icon: Grid, count: 5 },
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
}
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
                          router.push(`/template/editor/${template.id}`)
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          router.push(`/template/editor/${template.id}`)
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