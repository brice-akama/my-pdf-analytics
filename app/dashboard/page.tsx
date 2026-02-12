"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import DashboardOverview from '@/components/DashboardOverview';
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
import { toast } from 'sonner'
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
  Eye,
  User,
  Edit
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
  SheetDescription,
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
  X,
  EyeOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import GlobalSearch from "@/components/GlobalSearch"
import PageInfoTooltip from "@/components/PageInfoTooltip"
import { Drawer } from "@/components/ui/drawer"

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
  recipients: { email: string }[]
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

type PageType = 'dashboard' | 'content-library' | 'spaces' | 'agreements' |'file-requests' | 'contacts' | 'documents' | 'reports'
type NotificationType = 'view' | 'download' | 'signature' | 'share' | 'comment' | 'system'

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  

  
  
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
const [uploadedAgreementsList, setUploadedAgreementsList] = useState<any[]>([])
const [selectedAgreementForConfig, setSelectedAgreementForConfig] = useState<string | null>(null)
const [uploadedAgreementFile, setUploadedAgreementFile] = useState<File | null>(null)
const [uploadedAgreementId, setUploadedAgreementId] = useState<string | null>(null)
const [agreementTitle, setAgreementTitle] = useState('')
const [agreementSigners, setAgreementSigners] = useState('')
const [agreementMessage, setAgreementMessage] = useState('')
const [requireSignatureBeforeAccess, setRequireSignatureBeforeAccess] = useState(true)
const [showSignatureLinkDialog, setShowSignatureLinkDialog] = useState(false)
const [generatedSignatureLink, setGeneratedSignatureLink] = useState('')
const [fileRequestTitle, setFileRequestTitle] = useState('')
const [fileRequestDescription, setFileRequestDescription] = useState('')
const [fileRequestRecipient, setFileRequestRecipient] = useState('')
const [fileRequestDueDate, setFileRequestDueDate] = useState('')
const [fileRequestExpectedFiles, setFileRequestExpectedFiles] = useState(1)
const [showFileRequestLinkDialog, setShowFileRequestLinkDialog] = useState(false)
const [generatedFileRequestLink, setGeneratedFileRequestLink] = useState('')
const [fileRequestEmailSent, setFileRequestEmailSent] = useState(false)
const [createdFileRequestId, setCreatedFileRequestId] = useState<string | null>(null)
const [fileRequestRecipients, setFileRequestRecipients] = useState('')
const [contacts, setContacts] = useState<any[]>([])
const [showAddContactDrawer, setShowAddContactDrawer] = useState(false)
const [showEditContactDrawer, setShowEditContactDrawer] = useState(false)
const [selectedContact, setSelectedContact] = useState<any>(null)
const [contactName, setContactName] = useState('')
const [contactEmail, setContactEmail] = useState('')
const [contactCompany, setContactCompany] = useState('')
const [contactPhone, setContactPhone] = useState('')
const [contactNotes, setContactNotes] = useState('')
const [uploadingAvatar, setUploadingAvatar] = useState(false)
const [showCurrentPassword, setShowCurrentPassword] = useState(false)
const [showNewPassword, setShowNewPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)
const [showTeamDrawer, setShowTeamDrawer] = useState(false)
const [teamMembers, setTeamMembers] = useState<any[]>([])
const [inviteEmail, setInviteEmail] = useState('')
const [inviteRole, setInviteRole] = useState('member')
const [generatedInviteLink, setGeneratedInviteLink] = useState('')
const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false)
const [selectedMember, setSelectedMember] = useState<any>(null)
const [loadingTeam, setLoadingTeam] = useState(false)
const [showMobileProfileDrawer, setShowMobileProfileDrawer] = useState(false)
const [showDemoDialog, setShowDemoDialog] = useState(false)
const [demoPhoneNumber, setDemoPhoneNumber] = useState('')
const [demoTeamSize, setDemoTeamSize] = useState('')
const [demoPreferredDate, setDemoPreferredDate] = useState('')
const [demoMessage, setDemoMessage] = useState('')
const [supportSubject, setSupportSubject] = useState('')
const [supportMessage, setSupportMessage] = useState('')
const [gmailStatus, setGmailStatus] = useState<{
  connected: boolean;
  email?: string;
}>({ connected: false });

const [showGmailSendDialog, setShowGmailSendDialog] = useState(false);
const [gmailRecipients, setGmailRecipients] = useState('');
const [gmailSubject, setGmailSubject] = useState('');
const [gmailMessage, setGmailMessage] = useState('');
const [selectedDocumentForEmail, setSelectedDocumentForEmail] = useState<string | null>(null);
const [slackStatus, setSlackStatus] = useState<{
  connected: boolean;
  teamName?: string;
  channelName?: string;
  channelId?: string;
}>({ connected: false });

const [showSlackChannelDialog, setShowSlackChannelDialog] = useState(false);
const [slackChannels, setSlackChannels] = useState<any[]>([]);
const [loadingSlackChannels, setLoadingSlackChannels] = useState(false);
const [hubspotStatus, setHubspotStatus] = useState<{
  connected: boolean;
  portalId?: string;
  accountType?: string;
}>({ connected: false });

const [showHubSpotContactsDialog, setShowHubSpotContactsDialog] = useState(false);
const [hubspotContacts, setHubspotContacts] = useState<any[]>([]);
const [loadingHubSpotContacts, setLoadingHubSpotContacts] = useState(false);
const [showIntegrationRequestDialog, setShowIntegrationRequestDialog] = useState(false)
const [requestedIntegration, setRequestedIntegration] = useState('')
const [integrationUseCase, setIntegrationUseCase] = useState('')
const [selectedSlackChannel, setSelectedSlackChannel] = useState<string | null>(null);
const [createdFileRequests, setCreatedFileRequests] = useState<Array<{
  email: string
  requestId: string
  shareToken: string
  link: string
}>>([])
const [showBulkFileRequestLinksDialog, setShowBulkFileRequestLinksDialog] = useState(false)
const [sharePermissions, setSharePermissions] = useState({
  canView: true,
  canDownload: true,
  canEdit: false,
  canShare: false
})


// Add state at the top of your component
const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({})
const [showDriveFilesDialog, setShowDriveFilesDialog] = useState(false)
const [driveFiles, setDriveFiles] = useState<any[]>([])
const [loadingDriveFiles, setLoadingDriveFiles] = useState(false)
const [driveSearchQuery, setDriveSearchQuery] = useState('')

// Computed filtered files
const filteredDriveFiles = driveFiles.filter(file =>
  file.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
)

// Add this useEffect to fetch integration status
useEffect(() => {
  const fetchIntegrationStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrationStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch integration status:', error)
    }
  }

  if (showIntegrationsDialog) {
    fetchIntegrationStatus()
  }
}, [showIntegrationsDialog])

// Show success notification after Google Drive connection
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const integration = params.get('integration')
  const status = params.get('status')
  
  if (integration === 'google_drive' && status === 'connected') {
    toast.success('Google Drive connected!', {
      description: 'You can now import files from your Drive',
      duration: 5000
    })
    
    // Clean URL
    window.history.replaceState({}, '', '/dashboard')
  }
}, [])

// Add function to connect Google Drive
const handleConnectGoogleDrive = async () => {
  window.location.href = '/api/integrations/google-drive/connect'
}

// Add function to disconnect
const handleDisconnectGoogleDrive = async () => {
  // Show custom dialog instead of browser confirm
  const confirmed = await new Promise((resolve) => {
    toast.warning('Disconnect Google Drive?', {
      description: 'You can reconnect anytime',
      duration: 10000,
      action: {
        label: 'Disconnect',
        onClick: () => resolve(true)
      },
      cancel: {
        label: 'Cancel',
        onClick: () => resolve(false)
      }
    })
  })

  if (!confirmed) return

  const loadingToast = toast.loading('Disconnecting...')
  
  try {
    const res = await fetch('/api/integrations/google-drive/disconnect', {
      method: 'POST',
      credentials: 'include'
    })

    if (res.ok) {
      toast.success('Google Drive disconnected', { id: loadingToast })
      setIntegrationStatus(prev => ({
        ...prev,
        google_drive: { connected: false }
      }))
    } else {
      toast.error('Failed to disconnect', { id: loadingToast })
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast })
  }
}

// Add function to browse files
// Add function to browse files
const handleBrowseDriveFiles = async () => {
  setLoadingDriveFiles(true)
  
  try {
    const res = await fetch('/api/integrations/google-drive/files', {
      credentials: 'include'
    })
    
    const data = await res.json()
    
    if (res.ok) {
      setDriveFiles(data.files || [])
      setShowDriveFilesDialog(true) // NOW open dialog with files loaded
    } else if (res.status === 401) {
      // ✅ TOKEN EXPIRED - PROMPT TO RECONNECT
      toast.error('Session expired', {
        description: 'Please reconnect Google Drive',
        action: {
          label: 'Reconnect',
          onClick: () => {
            handleDisconnectGoogleDrive() // Clear old connection
            setTimeout(() => handleConnectGoogleDrive(), 500) // Reconnect
          }
        }
      })
    } else {
      toast.error('Failed to load files', {
        description: data.error || 'Try reconnecting Google Drive'
      })
    }
  } catch (error) {
    console.error('Browse files error:', error)
    toast.error('Network error')
  } finally {
    setLoadingDriveFiles(false)
  }
}

// Add function to import file
const handleImportFile = async (fileId: string, fileName: string) => {
  const loadingToast = toast.loading(`Importing ${fileName}...`, {
    description: 'This may take a moment'
  })
  
  try {
    const res = await fetch('/api/integrations/google-drive/import', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, fileName })
    })
    
    const data = await res.json()
    
    if (res.ok) {
      toast.success('File imported!', { 
        id: loadingToast,
        description: `${fileName} is now in your library`,
        action: {
          label: 'View',
          onClick: () => router.push(`/documents/${data.documentId}`)
        }
      })
      setShowDriveFilesDialog(false)
      fetchDocuments()
    } else {
      toast.error(data.error || 'Import failed', { id: loadingToast })
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast })
  }
}


// Fetch HubSpot status
const fetchHubSpotStatus = async () => {
  try {
    const res = await fetch("/api/integrations/hubspot/status", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      setHubspotStatus(data);
    }
  } catch (error) {
    console.error("Failed to fetch HubSpot status:", error);
  }
};

// Connect to HubSpot
const handleConnectHubSpot = async () => {
  window.location.href = "/api/integrations/hubspot/connect";
};

// Disconnect HubSpot
const handleDisconnectHubSpot = async () => {
  const confirmed = await new Promise((resolve) => {
    toast.warning('Disconnect HubSpot?', {
      description: 'You can reconnect anytime',
      duration: 10000,
      action: {
        label: 'Disconnect',
        onClick: () => resolve(true)
      },
      cancel: {
        label: 'Cancel',
        onClick: () => resolve(false)
      }
    })
  });

  if (!confirmed) return;

  const loadingToast = toast.loading('Disconnecting...');
  
  try {
    const res = await fetch('/api/integrations/hubspot/disconnect', {
      method: 'POST',
      credentials: 'include'
    });

    if (res.ok) {
      toast.success('HubSpot disconnected', { id: loadingToast });
      setHubspotStatus({ connected: false });
    } else {
      toast.error('Failed to disconnect', { id: loadingToast });
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast });
  }
};

// Browse HubSpot contacts
const handleBrowseHubSpotContacts = async () => {
  setLoadingHubSpotContacts(true);
  setShowHubSpotContactsDialog(true);
  
  try {
    const res = await fetch("/api/integrations/hubspot/contacts", {
      credentials: "include",
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setHubspotContacts(data.contacts || []);
    } else {
      toast.error('Failed to load contacts', {
        description: data.error || 'Try reconnecting HubSpot'
      });
    }
  } catch (error) {
    console.error('Browse contacts error:', error);
    toast.error('Network error');
  } finally {
    setLoadingHubSpotContacts(false);
  }
};

// Sync HubSpot contacts
const handleSyncHubSpotContacts = async () => {
  const loadingToast = toast.loading('Syncing contacts...');
  
  try {
    const res = await fetch('/api/integrations/hubspot/contacts', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success(`${data.imported} contacts synced!`, { 
        id: loadingToast,
        description: 'Contacts have been added to your contacts list'
      });
      setShowHubSpotContactsDialog(false);
      fetchContacts(); // Refresh contacts list
    } else {
      toast.error(data.error || 'Sync failed', { id: loadingToast });
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast });
  }
};

// Add to useEffect that fetches statuses
useEffect(() => {
  fetchHubSpotStatus();
}, []);

// Show success toast after connection
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const integration = params.get('integration');
  const status = params.get('status');
  
  if (integration === 'hubspot' && status === 'connected') {
    toast.success('HubSpot connected!', {
      description: 'You can now sync contacts and track deals',
      duration: 5000
    });
    
    window.history.replaceState({}, '', '/dashboard');
  }
}, []);

// Fetch Slack status
const fetchSlackStatus = async () => {
  try {
    const res = await fetch("/api/integrations/slack/status", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      setSlackStatus(data);
    }
  } catch (error) {
    console.error("Failed to fetch Slack status:", error);
  }
};

// Connect to Slack
const handleConnectSlack = async () => {
  window.location.href = "/api/integrations/slack/connect";
};

// Disconnect Slack
const handleDisconnectSlack = async () => {
  if (!confirm("Disconnect Slack? You'll stop receiving notifications.")) {
    return;
  }

  try {
    const res = await fetch("/api/integrations/slack/disconnect", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      alert("✅ Slack disconnected");
      setSlackStatus({ connected: false });
    } else {
      alert("❌ Failed to disconnect");
    }
  } catch (error) {
    console.error("Disconnect error:", error);
    alert("❌ Failed to disconnect");
  }
};

// Browse Slack channels
const handleBrowseSlackChannels = async () => {
  setLoadingSlackChannels(true);
  setShowSlackChannelDialog(true);
  
  try {
    const res = await fetch("/api/integrations/slack/channels", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      setSlackChannels(data.channels || []);
    } else {
      alert("❌ Failed to load channels");
      setShowSlackChannelDialog(false);
    }
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    alert("❌ Failed to load channels");
    setShowSlackChannelDialog(false);
  } finally {
    setLoadingSlackChannels(false);
  }
};

// Select Slack channel
const handleSelectSlackChannel = async (channelId: string, channelName: string) => {
  try {
    const res = await fetch("/api/integrations/slack/set-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ channelId, channelName }),
    });

    if (res.ok) {
      alert(`✅ Notifications will be sent to #${channelName}`);
      setSlackStatus(prev => ({ ...prev, channelName, channelId }));
      setShowSlackChannelDialog(false);
    } else {
      alert("❌ Failed to set channel");
    }
  } catch (error) {
    console.error("Set channel error:", error);
    alert("❌ Failed to set channel");
  }
};


useEffect(() => {
  fetchSlackStatus();
}, []);

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
  fetchPreferences();
}, []);

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


  //   this useEffect   handle documents page redirect
useEffect(() => {
  if (activePage === 'documents') {
    router.push('/documents-page')
  }
}, [activePage, router])


  const fetchUploadedAgreements = async () => {
  try {
    const res = await fetch("/api/agreements/uploaded", {
      credentials: 'include',
    })
    
    if (res.ok) {
      const data = await res.json()
      setUploadedAgreementsList(data.agreements || [])
    }
  } catch (error) {
    console.error('Failed to fetch uploaded agreements:', error)
  }
}

// Call on dialog open
useEffect(() => {
  if (showUploadAgreementDialog) {
    fetchUploadedAgreements()
  }
}, [showUploadAgreementDialog])

useEffect(() => {
  if (showTeamDrawer) {
    fetchTeamMembers()
  }
}, [showTeamDrawer])

useEffect(() => {
  if (activePage === 'reports') {
    router.push('/reports')
  }
}, [activePage, router])


const fetchTeamMembers = async () => {
  setLoadingTeam(true)
  try {
    const res = await fetch("/api/team", {
      credentials: 'include',
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setTeamMembers(data.members)
      }
    }
  } catch (error) {
    console.error('Failed to fetch team:', error)
  } finally {
    setLoadingTeam(false)
  }
}

const handleInviteMember = async () => {
  if (!inviteEmail.trim()) {
    toast.error('Email required', {
      description: 'Please enter an email address'
    })
    return
  }

  const loadingToast = toast.loading('Sending invitation...')

  try {
    const res = await fetch("/api/team", {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: inviteEmail.trim(),
        role: inviteRole 
      }),
    })

    const data = await res.json()

    if (res.ok) {
      toast.success('Invitation sent!', {
        id: loadingToast,
        description: `Invite sent to ${inviteEmail}`
      })
      
      setGeneratedInviteLink(data.inviteLink)
      setShowInviteLinkDialog(true)
      setInviteEmail('')
      setInviteRole('member')
      fetchTeamMembers()
    } else {
      toast.error(data.error || 'Failed to send invitation', {
        id: loadingToast
      })
    }
  } catch (error) {
    console.error('Invite error:', error)
    toast.error('Network error', {
      id: loadingToast
    })
  }
}

// Fetch Gmail status
const fetchGmailStatus = async () => {
  try {
    const res = await fetch("/api/integrations/gmail/status", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      setGmailStatus(data);
    }
  } catch (error) {
    console.error("Failed to fetch Gmail status:", error);
  }
};

// Connect to Gmail
const handleConnectGmail = async () => {
  window.location.href = "/api/integrations/gmail/connect";
};

// Disconnect Gmail
const handleDisconnectGmail = async () => {
  const confirmed = await new Promise((resolve) => {
    toast.warning('Disconnect Gmail?', {
      description: 'You can reconnect anytime',
      duration: 10000,
      action: {
        label: 'Disconnect',
        onClick: () => resolve(true)
      },
      cancel: {
        label: 'Cancel',
        onClick: () => resolve(false)
      }
    });
  });

  if (!confirmed) return;

  const loadingToast = toast.loading('Disconnecting...');
  
  try {
    const res = await fetch('/api/integrations/gmail/disconnect', {
      method: 'POST',
      credentials: 'include'
    });

    if (res.ok) {
      toast.success('Gmail disconnected', { id: loadingToast });
      setGmailStatus({ connected: false });
    } else {
      toast.error('Failed to disconnect', { id: loadingToast });
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast });
  }
};

// Send email via Gmail
const handleSendViaGmail = async () => {
  if (!gmailRecipients.trim() || !gmailSubject.trim() || !selectedDocumentForEmail) {
    toast.error('Please fill all required fields');
    return;
  }

  const loadingToast = toast.loading('Sending email...');
  
  try {
    const res = await fetch('/api/integrations/gmail/send', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: gmailRecipients.split(',').map(e => e.trim()),
        subject: gmailSubject.trim(),
        message: gmailMessage.trim() || undefined,
        documentId: selectedDocumentForEmail,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success('Email sent!', { 
        id: loadingToast,
        description: data.message
      });
      setShowGmailSendDialog(false);
      setGmailRecipients('');
      setGmailSubject('');
      setGmailMessage('');
      setSelectedDocumentForEmail(null);
    } else {
      toast.error(data.error || 'Failed to send email', { id: loadingToast });
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast });
  }
};

// Add to useEffect
useEffect(() => {
  fetchGmailStatus();
}, []);

// Show success toast after connection
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const integration = params.get('integration');
  const status = params.get('status');
  
  if (integration === 'gmail' && status === 'connected') {
    toast.success('Gmail connected!', {
      description: 'You can now send tracked emails',
      duration: 5000
    });
    
    window.history.replaceState({}, '', '/dashboard');
  }
}, []);

const handleRemoveMember = async (memberId: string) => {
  if (!confirm('Remove this team member?')) return

  const loadingToast = toast.loading('Removing member...')

  try {
    const res = await fetch(`/api/team/${memberId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      toast.success('Member removed', {
        id: loadingToast
      })
      fetchTeamMembers()
    } else {
      toast.error('Failed to remove member', {
        id: loadingToast
      })
    }
  } catch (error) {
    toast.error('Network error', {
      id: loadingToast
    })
  }
}

const handleUpdateRole = async (memberId: string, newRole: string) => {
  const loadingToast = toast.loading('Updating role...')

  try {
    const res = await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })

    if (res.ok) {
      toast.success('Role updated', {
        id: loadingToast
      })
      fetchTeamMembers()
    } else {
      toast.error('Failed to update role', {
        id: loadingToast
      })
    }
  } catch (error) {
    toast.error('Network error', {
      id: loadingToast
    })
  }
}

const handleAvatarUpload = async (file: File) => {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be less than 5MB');
    return;
  }

  setUploadingAvatar(true);

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const res = await fetch("/api/user/avatar", {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok && data.success) {
  const avatarUrl = `${data.avatarUrl}?t=${Date.now()}`;
  setUser(prev => prev ? { ...prev, profile_image: avatarUrl } : null);
  
   
  
  toast.success('Avatar updated!', {
    description: 'Your profile picture has been changed'
  });
} else {
  toast.error(data.error || 'Failed to upload avatar', {
    description: 'Please try again with a different image'
  });
}
  } catch (error) {
  console.error('Avatar upload error:', error);
  toast.error('Upload failed', {
    description: 'Please check your connection and try again'
  });
} finally {
  setUploadingAvatar(false);
}
};

const fetchContacts = async () => {
  try {
    const res = await fetch("/api/contacts", {
      credentials: 'include',
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts)
      }
    }
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
  }
}

const handleAddContact = async () => {
  if (!contactName.trim() || !contactEmail.trim()) {
    alert('Please enter name and email')
    return
  }

  try {
    const res = await fetch("/api/contacts", {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactName.trim(),
        email: contactEmail.trim(),
        company: contactCompany.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      }),
    })

    if (res.ok) {
      alert('Contact added successfully!')
      setShowAddContactDrawer(false)
      resetContactForm()
      fetchContacts()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to add contact')
    }
  } catch (error) {
    console.error('Add contact error:', error)
    alert('Failed to add contact')
  }
}

const handleDeleteContact = async (contactId: string) => {
  if (!confirm('Delete this contact?')) return

  try {
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      alert('Contact deleted')
      fetchContacts()
    }
  } catch (error) {
    console.error('Delete contact error:', error)
    alert('Failed to delete contact')
  }
}

const resetContactForm = () => {
  setContactName('')
  setContactEmail('')
  setContactCompany('')
  setContactPhone('')
  setContactNotes('')
  setSelectedContact(null)
}



// Add this with your other useEffects
useEffect(() => {
  // Redirect to /spaces page when activePage is 'spaces'
  if (activePage === 'spaces') {
    router.push('/spaces')
  }
}, [activePage, router])

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
    const res = await fetch(`/api/documents/${selectedDocumentToShare}/share-with-user`, {
      method: 'POST',
      credentials: 'include', // ✅ Send HTTP-only cookie
      headers: {
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

const [notificationPreferences, setNotificationPreferences] = useState({
  emailNotifications: true,
  documentReminders: true,
  marketingEmails: true,
});

// Fetch preferences
const fetchPreferences = async () => {
  try {
    const res = await fetch("/api/user/preferences", {
      credentials: 'include',
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setNotificationPreferences(data.preferences);
      }
    }
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
  }
};

// Update preferences
const updatePreferences = async (preferences: any) => {
  try {
    const res = await fetch("/api/user/preferences", {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });
    
    if (res.ok) {
      toast.success('Preferences saved', {
        duration: 2000
      });
    } else {
      toast.error('Failed to save preferences');
    }
  } catch (error) {
    console.error('Failed to update preferences:', error);
    toast.error('Network error');
  }
};

const handlePasswordChange = async () => {
  const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value;
  const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value;
  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    toast.error('All password fields are required');
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error('Passwords do not match', {
      description: 'Please make sure both new password fields are the same'
    });
    return;
  }

  if (newPassword.length < 8) {
    toast.error('Password too short', {
      description: 'Password must be at least 8 characters'
    });
    return;
  }

  const loadingToast = toast.loading('Updating password...');

  try {
    const res = await fetch("/api/user/password", {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success('Password updated!', {
        id: loadingToast,
        description: 'Your password has been changed successfully'
      });
      
      // Clear fields
      (document.getElementById('current-password') as HTMLInputElement).value = '';
      (document.getElementById('new-password') as HTMLInputElement).value = '';
      (document.getElementById('confirm-password') as HTMLInputElement).value = '';
    } else {
      toast.error(data.error || 'Failed to update password', {
        id: loadingToast,
        description: 'Please check your current password and try again'
      });
    }
  } catch (error) {
    console.error('Password change error:', error);
    toast.error('Network error', {
      id: loadingToast,
      description: 'Please check your connection'
    });
  }
};

const handleSaveProfileChanges = async () => {
  const fullName = (document.getElementById('profile-full-name') as HTMLInputElement)?.value?.trim();
  const companyName = (document.getElementById('profile-company-name') as HTMLInputElement)?.value?.trim() || '';

  if (!fullName) {
    toast.error('Name required', {
      description: 'Please enter your full name'
    });
    return;
  }

  const loadingToast = toast.loading('Updating profile...');

  try {
    const res = await fetch("/api/user/profile", {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fullName,
        companyName: companyName || ''
      }),
    });

    if (res.ok) {
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setUser(prev => prev ? {
        ...prev,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName || ''
      } : null);
      
      toast.success('Profile updated!', {
        id: loadingToast,
        description: 'Your changes have been saved'
      });
      
      setShowSettingsDialog(false);
    } else {
      toast.error('Update failed', {
        id: loadingToast,
        description: 'Please try again'
      });
    }
  } catch (error) {
    console.error('Save error:', error);
    toast.error('Network error', {
      id: loadingToast,
      description: 'Please check your connection'
    });
  }
};

const handleCreateFileRequest = async () => {
  if (!fileRequestTitle.trim()) {
    alert('Please enter a title')
    return
  }

  // 🟢 HANDLE BOTH SINGLE AND MULTIPLE
  let emailList: string[] = []
  
  if (fileRequestRecipients.trim()) {
    // Multiple recipients mode
    emailList = fileRequestRecipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
  } else if (fileRequestRecipient.trim()) {
    // Single recipient mode
    emailList = [fileRequestRecipient.trim()]
  }

  if (emailList.length === 0) {
    alert('Please enter at least one email address')
    return
  }

  // Validate all emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmails = emailList.filter(email => !emailRegex.test(email))
  
  if (invalidEmails.length > 0) {
    alert(`Invalid email(s): ${invalidEmails.join(', ')}`)
    return
  }

  try {
    setUploadStatus('uploading')
    setUploadMessage(`Creating ${emailList.length} file request(s)...`)

    // 🟢 CREATE MULTIPLE REQUESTS
    const results = []
    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i]
      
      const res = await fetch("/api/file-requests", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: fileRequestTitle.trim(),
          description: fileRequestDescription.trim() || undefined,
          recipients: [email],
          dueDate: fileRequestDueDate || undefined,
          expectedFiles: fileRequestExpectedFiles,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        results.push({
          email,
          requestId: data.requestId,
          shareToken: data.shareToken,
          link: `${window.location.origin}/public/file-request/${data.shareToken}`
        })
        
        setUploadMessage(`Created ${i + 1}/${emailList.length} requests...`)
      } else {
        console.error(`Failed for ${email}:`, data.error)
      }
    }

    if (results.length > 0) {
      setUploadStatus('success')
      setUploadMessage(`Successfully created ${results.length} file request(s)!`)
      
      // 🟢 SHOW ALL LINKS IN DIALOG
      setCreatedFileRequests(results)
      setShowCreateFileRequestDialog(false)
      setShowBulkFileRequestLinksDialog(true)
      
      // Reset form
      setFileRequestTitle('')
      setFileRequestDescription('')
      setFileRequestRecipient('')
      setFileRequestRecipients('')
      setFileRequestDueDate('')
      setFileRequestExpectedFiles(1)
      
      // Refresh list
      fetchFileRequests()
      
      setTimeout(() => setUploadStatus('idle'), 3000)
    } else {
      setUploadStatus('error')
      setUploadMessage('Failed to create file requests')
      setTimeout(() => setUploadStatus('idle'), 3000)
    }
  } catch (error) {
    console.error('Create file request error:', error)
    setUploadStatus('error')
    setUploadMessage('Failed to create file request. Please try again.')
    setTimeout(() => setUploadStatus('idle'), 3000)
  }
}



// Fetch notifications
const fetchNotifications = async () => {
  try {
    const res = await fetch("/api/notifications", {
      method: 'GET',
      credentials: 'include', // ✅ Send HTTP-only cookie
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
  try {
    const res = await fetch("/api/notifications", {
      method: 'PATCH',
      credentials: 'include', // ✅ Send HTTP-only cookie
      headers: {
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
  fetchContacts()
  const interval = setInterval(() => {
    fetchDocuments()
    fetchAgreements()
    fetchFileRequests()
    fetchContacts()
  }, 30000)
  return () => clearInterval(interval)
}, [])


const handleUpdateContact = async () => {
  if (!contactName.trim() || !contactEmail.trim() || !selectedContact) {
    alert('Please enter name and email')
    return
  }

  try {
    const res = await fetch(`/api/contacts/${selectedContact._id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactName.trim(),
        email: contactEmail.trim(),
        company: contactCompany.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      }),
    })

    if (res.ok) {
      alert('Contact updated successfully!')
      setShowEditContactDrawer(false)
      resetContactForm()
      fetchContacts()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to update contact')
    }
  } catch (error) {
    console.error('Update contact error:', error)
    alert('Failed to update contact')
  }
}

// Agreements Section Component
const AgreementsSection = () => {
   // Add this useEffect
  useEffect(() => {
    fetchUploadedAgreements()
  }, [])
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

     {agreements.length === 0 && uploadedAgreementsList.length === 0 ? (
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
      ) : agreements.length === 0 && uploadedAgreementsList.length > 0 ? (
  // Show uploaded but not sent agreements
  <div className="space-y-4">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-sm text-blue-900">
        <strong>{uploadedAgreementsList.length}</strong> agreement(s) uploaded. 
        Click on any agreement below to configure and send for signature.
      </p>
    </div>
    
    {uploadedAgreementsList.map((agreement) => (
      <div 
        key={agreement._id}
         onClick={() => {
      //   Redirect to existing signature page
      router.push(`/documents/${agreement._id}/signature?mode=send&returnTo=/agreements`)
    }}
        className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <FileSignature className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">{agreement.filename}</h3>
            {/* ✅ Show uploader if not current user */}
    {agreement.uploadedBy?.userId !== user?.email && (
      <p className="text-xs text-slate-500">
        Uploaded by {agreement.uploadedBy?.name || 'team member'}
        {agreement.uploadedBy?.role === 'admin' && ' (Admin)'}
      </p>
    )}
    
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Uploaded {formatTimeAgo(agreement.createdAt)}
              </span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                Not sent yet
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ))}
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

      {/*   SHOW TOTAL COUNT */}
      {fileRequests.length > 0 && (
        <div className="mb-6 text-sm text-slate-600">
          Showing {fileRequests.length} file request{fileRequests.length !== 1 ? 's' : ''}
        </div>
      )}

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
          {/*   LOOP THROUGH ALL REQUESTS */}
          {fileRequests.map((request) => (
            <div 
              key={request._id}
              onClick={() => router.push(`/file-requests/${request._id}`)}
              className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Inbox className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{request.title}</h3>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                      {request.description || 'No description'}
                    </p>
                    
                     
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.recipients && request.recipients.length > 0 
                          ? request.recipients.map((r: any) => r.email).join(', ')
                          : 'No recipients'
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Upload className="h-4 w-4" />
                        {request.filesReceived}/{request.totalFiles} files
                      </span>
                      {request.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due {formatTimeAgo(request.dueDate)}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'active' ? 'bg-green-100 text-green-700' :
                        request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-3" />
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
  const sidebarItems: Array<{ id: PageType; icon: any; label: string; badge: string | null }> = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'content-library', icon: Folder, label: 'Content library', badge: null },
    { id: 'reports', icon: BarChart3, label: 'Reports', badge: 'Analytics' },
    { id: 'spaces', icon: FolderOpen, label: 'Spaces', badge: 'Data rooms' },
    { id: 'documents', icon: FileText, label: 'Documents', badge: null },
    { id: 'agreements', icon: FileSignature, label: 'Agreements', badge: null },
    { id: 'file-requests', icon: Inbox, label: 'File requests', badge: null },
    { id: 'contacts', icon: Users, label: 'Contacts', badge: null },
  ]

  // Fetch agreements
const fetchAgreements = async () => {
  try {
    const res = await fetch("/api/agreements", {
      method: 'GET',
      credentials: 'include', // ✅ Send HTTP-only cookie
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
  try {
    console.log('🔍 Fetching file requests...')
    
    const res = await fetch("/api/file-requests", {
      method: "GET",
      credentials: "include", // ✅ Important for cookies
    })

    console.log('📡 Response status:', res.status)

    if (res.ok) {
      const data = await res.json()
      console.log('📦 Received data:', data)
      
      if (data.success) {
        console.log('✅ File requests:', data.fileRequests)
        setFileRequests(data.fileRequests)
      } else {
        console.error('❌ Success=false:', data)
      }
    } else {
      console.error('❌ Failed to fetch:', await res.text())
    }
  } catch (error) {
    console.error("❌ Fetch error:", error)
  }
}
 
 

  // Handle logout
const handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    router.push('/login')
  }
}

// Handle feedback submit
const handleFeedbackSubmit = async () => {
  if (!feedbackText.trim()) {
    toast.error('Please enter your feedback');
    return;
  }

  const loadingToast = toast.loading('Sending feedback...');

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      credentials: 'include', // ✅ Send HTTP-only cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        feedback: feedbackText.trim() 
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success('Feedback sent!', {
        id: loadingToast,
        description: 'Thank you for helping us improve DocMetrics'
      });
      setFeedbackText('');
      setShowFeedbackDialog(false);
    } else {
      toast.error(data.error || 'Failed to send feedback', {
        id: loadingToast,
        description: 'Please try again later'
      });
    }
  } catch (error) {
    console.error('Feedback error:', error);
    toast.error('Network error', {
      id: loadingToast,
      description: 'Please check your connection'
    });
  }
};

  const quickActions = [
  {
    icon: Share2,
    title: "Share content with secure file sharing",
    description: "Share content",
    color: "from-blue-500 to-blue-600",
    onClick: () => {
      // If user has documents, show share dialog for first document
      if (documents.length > 0) {
        setSelectedDocumentToShare(documents[0]._id)
        setShowShareDialog(true)
      } else {
        alert('Upload a document first to share it')
      }
    }
  },
  {
    icon: BarChart3,
    title: "Track viewer analytics to see who engages with your file",
    description: "View analytics",
    color: "from-purple-500 to-purple-600",
    onClick: () => {
      // Navigate to first document's analytics
      if (documents.length > 0) {
        router.push(`/documents/${documents[0]._id}`)
      } else {
        alert('Upload a document first to view analytics')
      }
    }
  },
  {
    icon: FolderOpen,
    title: "Manage large projects and organize deals in one place",
    description: "Create a data room",
    color: "from-indigo-500 to-indigo-600",
    onClick: () => {
      // Navigate to spaces (data rooms)
      router.push('/spaces')
    }
  },
  {
    icon: FileSignature,
    title: "Collect eSignatures on contracts and agreements",
    description: "Request signatures",
    color: "from-pink-500 to-pink-600",
    onClick: () => {
      // Open upload agreement dialog
      setShowUploadAgreementDialog(true)
    }
  },
  {
    icon: Inbox,
    title: "Safely receive files in one place with file requests",
    description: "Request files",
    color: "from-orange-500 to-orange-600",
    onClick: () => {
      // Open create file request dialog
      setShowCreateFileRequestDialog(true)
    }
  }
]

// Fetch user data

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
          company_name: data.user.profile.companyName || "Company Name",
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
// Fetch documents
const fetchDocuments = async () => {
  try {
    const res = await fetch("/api/documents", {
      method: "GET",
      credentials: "include", // ✅ important to send the HTTP-only cookie
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } else {
      console.error("Failed to fetch documents:", await res.json());
    }
  } catch (error) {
    console.error("Failed to fetch documents:", error);
  }
};


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


      // Refresh documents list. 
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
      
      {/* 🎯 Real-time tracking dashboard */}
      <DashboardOverview />
    </div>
  );
      case 'content-library':
        return (
          <div>
             {/* ✅ PAGE-SPECIFIC TOOLTIP */}
      <PageInfoTooltip 
        pageId="content-library"
        message="Upload your PDFs here. Track who views them, when, and for how long. Share securely with a link."
        position="top"
      />
            
              
            <div className="mb-8">
  {/* Header - Responsive Layout */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    {/* Title and Breadcrumb */}
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Content library</h1>
      {/* Breadcrumb - Stack on mobile, inline on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 text-sm text-slate-600">
        <span className="font-medium">Team Folders</span>
        <ChevronRight className="h-4 w-4 hidden sm:block" />
        <span className="font-medium sm:font-normal">My Company Content</span>
      </div>
    </div>

    {/* Upload Button Only - No Share Button */}
    <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto">
      <Upload className="h-4 w-4" />
      Upload
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64 bg-white rounded-lg border shadow-md p-1">
    {/* Always show local upload first */}
    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
      <Upload className="h-4 w-4 mr-2" />
      <div>
        <p className="font-medium">From Computer</p>
        <p className="text-xs text-slate-500">Browse local files</p>
      </div>
    </DropdownMenuItem>
    
    {/* Divider before cloud options */}
    <DropdownMenuSeparator />
    
    {/* Cloud Storage Header */}
    <div className="px-2 py-1.5">
      <p className="text-xs font-semibold text-slate-500 uppercase">Cloud Storage</p>
    </div>
    
    {/* Google Drive */}
    {integrationStatus.google_drive?.connected ? (
      <DropdownMenuItem onClick={handleBrowseDriveFiles}>
        <div className="h-4 w-4 mr-2 flex items-center justify-center">
          📁
        </div>
        <div>
          <p className="font-medium">Google Drive</p>
          <p className="text-xs text-green-600">✓ Connected</p>
        </div>
      </DropdownMenuItem>
    ) : (
      <DropdownMenuItem onClick={handleConnectGoogleDrive}>
        <div className="h-4 w-4 mr-2 flex items-center justify-center opacity-50">
          📁
        </div>
        <div>
          <p className="font-medium text-slate-500">Google Drive</p>
          <p className="text-xs text-slate-400">Connect to import</p>
        </div>
      </DropdownMenuItem>
    )}
    
    {/* Dropbox - PLACEHOLDER for future */}
    <DropdownMenuItem 
      onClick={() => toast.info('Dropbox integration coming soon!')}
      disabled
    >
      <div className="h-4 w-4 mr-2 flex items-center justify-center opacity-50">
        📦
      </div>
      <div>
        <p className="font-medium text-slate-400">Dropbox</p>
        <p className="text-xs text-slate-400">Coming soon</p>
      </div>
    </DropdownMenuItem>
    
    {/* OneDrive - PLACEHOLDER for future */}
    <DropdownMenuItem 
      onClick={() => toast.info('OneDrive integration coming soon!')}
      disabled
    >
      <div className="h-4 w-4 mr-2 flex items-center justify-center opacity-50">
        ☁️
      </div>
      <div>
        <p className="font-medium text-slate-400">OneDrive</p>
        <p className="text-xs text-slate-400">Coming soon</p>
      </div>
    </DropdownMenuItem>
    
    {/* Footer - Link to integrations */}
    <DropdownMenuSeparator />
    <DropdownMenuItem 
      onClick={() => setShowIntegrationsDialog(true)}
      className="text-purple-600 hover:text-purple-700"
    >
      <Puzzle className="h-4 w-4 mr-2" />
      <div>
        <p className="font-medium">Manage Integrations</p>
      </div>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
  </div>

  {/* Hidden File Input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="application/pdf"
    onChange={handleFileInputChange}
    className="hidden"
  />
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
    <Button  onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-2">Upload PDF</Button>
  </div>
</div>
                  </div>
                  </div>
              </div>
            </div>

            <div>
              
              <h2 className="text-xl font-semibold text-slate-900 mb-6">5 ways to unlock DocMetrics full potential</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
  {quickActions.map((action, index) => (
    <div 
      key={index} 
      onClick={action.onClick}  // ✅ Add click handler
      className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer group"
    >
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
  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[400px]">
       
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to Spaces...</p>
      </div>
    </div>
  )


  case 'reports':
  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to Reports...</p>
      </div>
    </div>
  )

  case 'documents':
  return (
    <div className="flex items-center justify-center min-h-[400px]">
       
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to Documents...</p>
      </div>
    </div>
  )

     case 'agreements':
  return (
    <div>
      {/* ✅ DIFFERENT MESSAGE FOR AGREEMENTS PAGE */}
      <PageInfoTooltip 
        pageId="agreements"
        message="Require viewers to sign an NDA before accessing your content. Track signatures and send reminders automatically."
        position="top"
      />

      {/* Rest of agreements code */}
      <AgreementsSection />
    </div>
  )

     

  case 'file-requests':
  return (
    <div>
      {/* ✅ DIFFERENT MESSAGE FOR FILE REQUESTS PAGE */}
      <PageInfoTooltip 
        pageId="file-requests"
        message="Create file requests to collect documents from viewers. Set deadlines, track submissions, and manage access permissions."
        position="top"
      />

      {/* Rest of agreements code */}
      <FileRequestsSection />
    </div>
  )
  

   case 'contacts':
  return (
    <div>
        {/* ✅ DIFFERENT MESSAGE FOR CONTACTS PAGE */}
      <PageInfoTooltip 
        pageId="contacts"
        message="Manage your contacts for quick document sharing. Save contact details, add notes, and see who added them to the team."
        position="top"
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Contacts</h1>
          <p className="text-slate-600">Manage your contacts for quick document sharing</p>
        </div>
        <Button 
          onClick={() => setShowAddContactDrawer(true)}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
            <Users className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No contacts yet</h3>
          <p className="text-slate-600 mb-6">Add contacts to save their details for quick reference</p>
          <Button 
            onClick={() => setShowAddContactDrawer(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-slate-50 border-b px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-700">
            <div className="col-span-4">Contact</div>
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Phone</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y">
            {contacts.map((contact) => (
              <div key={contact._id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                {/* Contact Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(contact.email)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                    <p className="text-sm text-slate-600 truncate">{contact.email}</p>
                    {/* ✅ Show who added it if not current user */}
    {contact.addedBy !== user?.email && (
      <p className="text-xs text-slate-500 mt-1">
        Added by team member
      </p>
    )}
                  </div>
                </div>

                {/* Company */}
                <div className="col-span-3">
                  <p className="text-sm text-slate-700 truncate">{contact.company || '—'}</p>
                </div>

                {/* Phone */}
                <div className="col-span-3">
                  <p className="text-sm text-slate-700 truncate">{contact.phone || '—'}</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedContact(contact)
                      setContactName(contact.name)
                      setContactEmail(contact.email)
                      setContactCompany(contact.company || '')
                      setContactPhone(contact.phone || '')
                      setContactNotes(contact.notes || '')
                      setShowEditContactDrawer(true)
                    }}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact._id)}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
      
      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">
        DocMetrics
      </span>
    </div>

    {/* Desktop Search Bar - Centered */}
    <div className="hidden md:flex flex-1 justify-center px-8">
      <div className="w-full max-w-xl">
        <GlobalSearch 
          placeholder="Search documents, contacts, and more..."
          autoFocus={false}
        />
      </div>
    </div>

    {/* Mobile: Search Icon + Profile (closer together) */}
    <div className="flex md:hidden items-center gap-2 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileSearchOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Mobile Profile - Clickable Drawer Trigger */}
      <button
        onClick={() => setShowMobileProfileDrawer(true)}
        className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
{user?.profile_image ? (
    <>
      {/* Initials as fallback/loading state */}
      <span className="absolute inset-0 flex items-center justify-center">
        {getInitials(user?.email || "")}
      </span>
      {/* Image loads on top */}
      <Image
        src={user.profile_image}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-full object-cover w-full h-full relative z-10"
        key={user.profile_image}
        onError={(e) => {
          // Hide image if it fails, show initials
          e.currentTarget.style.display = 'none';
        }}
      />
    </>
  ) : (
    getInitials(user?.email || "")
  )}
      </button>
    </div>

    {/* Desktop Right Side Actions */}
    <div className="hidden md:flex items-center gap-3 ml-auto">
      <Button
        onClick={() => router.push('/plan')}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4"
      >
        ⬆ Upgrade
      </Button>

      {/* Bell Icon Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setNotificationsOpen(true)}
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Desktop User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-semibold text-slate-900">{user?.company_name}</div>
              <div className="text-xs text-slate-600">{user?.email}</div>
            </div>
<div
  className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden relative`}
>
  {user?.profile_image ? (
    <>
      {/* Initials as fallback/loading state */}
      <span className="absolute inset-0 flex items-center justify-center">
        {getInitials(user?.email || "")}
      </span>
      {/* Image loads on top */}
      <Image
        src={user.profile_image}
        alt="Profile"
        width={40}
        height={40}
        className="rounded-full object-cover w-full h-full relative z-10"
        key={user.profile_image}
        onError={(e) => {
          // Hide image if it fails, show initials
          e.currentTarget.style.display = 'none';
        }}
      />
    </>
  ) : (
    getInitials(user?.email || "")
  )}
</div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {/* Keep existing dropdown content */}
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
          
          <DropdownMenuItem onClick={() => setShowTeamDrawer(true)}>
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
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold"
            >
              ⚡ Upgrade
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</header>

      {/* Mobile Menu Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0 bg-white">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10">
                
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DocMetrics
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Search in Mobile Menu */}
          {/* Search in Mobile Menu */}
<div className="p-4 border-b">
  <GlobalSearch 
    placeholder="Search everything..."
    autoFocus={false}
  />
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
  <SheetContent side="left" className="w-80 p-0 bg-white">
    <SheetHeader className="border-b p-6">
      <SheetTitle>Search</SheetTitle>
    </SheetHeader>
    <div className="p-4">
      <GlobalSearch 
        placeholder="Search everything..."
        autoFocus={true}
        onClose={() => setMobileSearchOpen(false)}
      />
    </div>
  </SheetContent>
</Sheet>
      <div className="flex">
        {/* Sidebar with clickable links */}
<aside className="hidden lg:flex w-64 flex-col border-r bg-white shadow-sm">
  <nav className="flex-1 space-y-1 p-4">
    {sidebarItems.map((item) => (
      <button
        key={item.id}
        onClick={() => handleSidebarItemClick(item.id)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
           activePage === item.id
            ? 'bg-purple-50 text-purple-700'
            : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700'
        }`}
      >
                <div className="flex items-center gap-3">
  <item.icon className="h-5 w-5 flex-shrink-0" />
  <span className="truncate">{item.label}</span>
</div>
{item.badge && (
  <span className="text-xs text-slate-500 font-normal truncate">{item.badge}</span>
)}
              </button>
            ))}
          </nav>

          
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      {/* Settings Dialog */}
{/* Settings Drawer - Modern Cart-Style */}
<AnimatePresence>
  {showSettingsDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSettingsDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your account settings and preferences</p>
          </div>
          <button
            onClick={() => setShowSettingsDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
          <input
  id="settings-avatar-upload"
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
  }}
/>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="profile" className="w-full">
            <div className="sticky top-0 bg-white border-b px-6 pt-4 z-10">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 py-6">
              <TabsContent value="profile" className="space-y-6 mt-0">
                {/* ✅ AVATAR SECTION */}
                <div className="space-y-4 pb-6 border-b">
                  <Label className="text-base font-semibold">Profile Picture</Label>
                  <div className="flex items-center gap-6">
                    {/* Large Avatar Preview */}
                    <div className="relative">
                      <div className={`h-28 w-28 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-bold text-4xl shadow-lg overflow-hidden ring-4 ring-white`}>
                        {user?.profile_image ? (
                          <Image
                            src={user.profile_image}
                            alt="Profile"
                            width={112}
                            height={112}
                            className="rounded-full object-cover w-full h-full"
                          />
                        ) : (
                          getInitials(user?.email || "")
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute bottom-2 right-2 h-7 w-7 bg-green-500 rounded-full border-4 border-white"></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 flex-1">
                      <div>
                        <p className="text-base font-semibold text-slate-900 mb-1">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-slate-500 mb-3">{user?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => document.getElementById('settings-avatar-upload')?.click()}
  disabled={uploadingAvatar}
                          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Photo
                        </Button>
                        {user?.profile_image && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Remove your profile picture? Your initials will be shown instead.')) return;
                              
                              try {
                                const res = await fetch("/api/user/avatar", {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });

                                if (res.ok) {
  setUser(prev => prev ? { ...prev, profile_image: null } : null);
  toast.success('Profile picture removed', {
    description: 'Your initials will be shown instead'
  });
}
                              } catch (error) {
                                console.error('Remove avatar error:', error);
                                alert('Failed to remove picture');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Recommended: Square image, at least 400x400px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
  <Label>Full Name *</Label>
  <Input 
    id="profile-full-name"
    defaultValue={user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}`.trim() 
      : ''}
    className="h-11" 
    placeholder="John Doe"
  />
</div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={user?.email} type="email" className="h-11" />
                  </div>
                   <div className="space-y-2">
  <Label>Company Name</Label>
  <Input 
    id="profile-company-name"
    defaultValue={user?.company_name || ''} 
    className="h-11" 
    placeholder="Acme Inc."
  />
</div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4 mt-0">
  {notificationPreferences && (
    <>
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <p className="font-medium text-slate-900">Email Notifications</p>
          <p className="text-sm text-slate-500 mt-1">Receive email when someone views your document</p>
        </div>
        <Switch 
          checked={notificationPreferences.emailNotifications}
          onCheckedChange={(checked) => {
            setNotificationPreferences({
              ...notificationPreferences,
              emailNotifications: checked
            });
            updatePreferences({ ...notificationPreferences, emailNotifications: checked });
          }}
        />
      </div>
      
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <p className="font-medium text-slate-900">Document Reminders</p>
          <p className="text-sm text-slate-500 mt-1">Get reminders about pending signatures</p>
        </div>
        <Switch 
          checked={notificationPreferences.documentReminders}
          onCheckedChange={(checked) => {
            setNotificationPreferences({
              ...notificationPreferences,
              documentReminders: checked
            });
            updatePreferences({ ...notificationPreferences, documentReminders: checked });
          }}
        />
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium text-slate-900">Marketing Emails</p>
          <p className="text-sm text-slate-500 mt-1">Receive updates about new features</p>
        </div>
        <Switch 
          checked={notificationPreferences.marketingEmails}
          onCheckedChange={(checked) => {
            setNotificationPreferences({
              ...notificationPreferences,
              marketingEmails: checked
            });
            updatePreferences({ ...notificationPreferences, marketingEmails: checked });
          }}
        />
      </div>
    </>
  )}
</TabsContent>

              <TabsContent value="security" className="space-y-4 mt-0">
  <div className="space-y-2">
    <Label>Current Password</Label>
    <div className="relative">
      <Input 
        id="current-password"
        type={showCurrentPassword ? "text" : "password"}
        placeholder="Enter current password" 
        className="h-11 pr-10" 
      />
      <button
        type="button"
        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
  
  <div className="space-y-2">
    <Label>New Password</Label>
    <div className="relative">
      <Input 
        id="new-password"
        type={showNewPassword ? "text" : "password"}
        placeholder="Enter new password" 
        className="h-11 pr-10" 
      />
      <button
        type="button"
        onClick={() => setShowNewPassword(!showNewPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
  
  <div className="space-y-2">
    <Label>Confirm New Password</Label>
    <div className="relative">
      <Input 
        id="confirm-password"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm new password" 
        className="h-11 pr-10" 
      />
      <button
        type="button"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
  
  <Button
    onClick={handlePasswordChange}
    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
  >
    Update Password
  </Button>
</TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
  onClick={handleSaveProfileChanges}
  className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
>
  Save Changes
</Button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

 


{/* Team Drawer */}
{/* Team Drawer - IMPROVED WIDTH & STYLING */}
<Sheet open={showTeamDrawer} onOpenChange={setShowTeamDrawer}>
  <SheetContent 
    side="right" 
    className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col bg-white overflow-hidden"
  >
    {/* Header */}
    <SheetHeader className="px-8 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
      <SheetTitle className="text-2xl font-bold text-slate-900">Team Members</SheetTitle>
      <SheetDescription className="text-sm text-slate-600 mt-1">
        Invite colleagues and manage team permissions
      </SheetDescription>
    </SheetHeader>

    {/* Content */}
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 space-y-6">
        {/* Invite Section - UPDATED COLORS */}
        <div className="bg-gradient-to-br from-brand-primary-50 to-brand-secondary-50 border-2 border-brand-primary-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-brand-primary-600 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <Label className="text-lg font-bold text-slate-900 block mb-1">
                Invite Team Member
              </Label>
              <p className="text-sm text-slate-600">
                Enter their email address and select a role to send an invitation
              </p>
            </div>
          </div>
          
          {/* Input Row */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-12 text-base bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="w-full sm:w-48 space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-12 px-4 border border-slate-300 rounded-lg text-base bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            
            {/* Send Button - Full Width on Mobile */}
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail.trim()}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              <Send className="h-5 w-5 mr-2" />
              Send Invitation
            </Button>
          </div>
          
          {/* Role Descriptions - UPDATED COLORS */}
          <div className="bg-white/80 backdrop-blur border border-brand-primary-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-900 mb-2">Role Permissions:</p>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded bg-brand-secondary-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-brand-secondary-600" />
                </div>
                <div>
                  <p className="font-semibold text-brand-secondary-900">Admin</p>
                  <p className="text-slate-600">Full access + team management</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded bg-brand-primary-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-brand-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-brand-primary-900">Member</p>
                  <p className="text-slate-600">Create, edit, share documents</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-3 w-3 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Viewer</p>
                  <p className="text-slate-600">View documents only</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-bold text-slate-900">
              Team Members ({teamMembers.length})
            </Label>
            {teamMembers.some(m => m.status === 'invited') && (
              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                {teamMembers.filter(m => m.status === 'invited').length} pending
              </span>
            )}
          </div>
          
          {loadingTeam ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Loading team members...</p>
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="border-2 border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(member.email)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md`}>
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-base">
                        {member.name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {member.email}
                      </p>
                      {member.status === 'invited' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <p className="text-xs text-orange-600 font-medium">
                            Invitation pending • Sent {formatTimeAgo(member.invitedAt)}
                          </p>
                        </div>
                      )}
                      {member.lastActiveAt && member.status === 'active' && (
                        <p className="text-xs text-slate-400 mt-1">
                          Last active {formatTimeAgo(member.lastActiveAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {member.role === 'owner' ? (
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">
                        Owner
                      </span>
                    ) : (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium bg-white hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors"
                          disabled={member.status === 'invited'}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        
                        {member.status === 'invited' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const loadingToast = toast.loading('Resending invitation...')
                              
                              const res = await fetch("/api/team/resend-invite", {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ memberId: member.id }),
                              })
                              
                              if (res.ok) {
                                const data = await res.json()
                                toast.success('Invitation resent!', {
                                  id: loadingToast,
                                  description: 'Check your clipboard for the link'
                                })
                                setGeneratedInviteLink(data.inviteLink)
                                setShowInviteLinkDialog(true)
                              } else {
                                toast.error('Failed to resend', {
                                  id: loadingToast
                                })
                              }
                            }}
                            className="gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Resend
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <UsersIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-base font-medium text-slate-900 mb-1">No team members yet</p>
              <p className="text-sm text-slate-500">Invite your first team member above</p>
            </div>
          )}
        </div>

        {/* Upgrade Prompt */}
        {teamMembers.length >= 3 && user?.plan === 'free' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-yellow-900 mb-1">
                  🎯 Reached Free Plan Limit
                </p>
                <p className="text-sm text-yellow-800 mb-4">
                  Upgrade to Pro for unlimited team members, advanced analytics, and priority support
                </p>
                <Button
                  size="lg"
                  onClick={() => {
                    setShowTeamDrawer(false)
                    router.push('/plan')
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold shadow-md"
                >
                  ⚡ Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Footer */}
    <div className="px-8 py-4 border-t bg-slate-50 sticky bottom-0 shadow-lg">
      <Button
        variant="outline"
        onClick={() => setShowTeamDrawer(false)}
        className="w-full h-12 text-base font-semibold"
      >
        Close
      </Button>
    </div>
  </SheetContent>
</Sheet>

{/* Invite Link Dialog */}
<Dialog open={showInviteLinkDialog} onOpenChange={setShowInviteLinkDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        Invitation Sent!
      </DialogTitle>
      <DialogDescription>
        Email sent. You can also copy the link below to manually share it.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900 mb-1">
              📧 Invitation email sent to {inviteEmail}
            </p>
            <p className="text-xs text-green-700">
              They'll receive instructions to join your team.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Invitation Link (for manual sharing)</Label>
        <div className="flex gap-2">
          <Input 
            value={generatedInviteLink}
            readOnly
            className="flex-1 font-mono text-xs bg-slate-50"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(generatedInviteLink)
              toast.success('Link copied!')
            }}
          >
            Copy
          </Button>
          <Button
            onClick={() => window.open(generatedInviteLink, '_blank')}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Test
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Link expires in 7 days. You can resend if needed.
        </p>
      </div>
      
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={() => setShowInviteLinkDialog(false)}
          variant="outline"
        >
          Done
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Resources Drawer */}
<AnimatePresence>
  {showResourcesDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowResourcesDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
       <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Resources</h2>
            <p className="text-sm text-slate-600 mt-1">Helpful guides and documentation</p>
          </div>
          <button
            onClick={() => setShowResourcesDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            <a 
              href="https://docs.docmetrics.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Book className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 text-lg">Documentation</h4>
              <p className="text-sm text-slate-600 mb-3">Complete guides and API reference</p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <span>Browse Docs</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </a>
            
            <a 
              href="https://help.docmetrics.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 text-lg">Help Center</h4>
              <p className="text-sm text-slate-600 mb-3">FAQs and troubleshooting</p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <span>Get Help</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </a>
            
            <a 
              href="https://blog.docmetrics.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 text-lg">Blog</h4>
              <p className="text-sm text-slate-600 mb-3">Tips, updates, and best practices</p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <span>Read Blog</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </a>
            
            <a 
              href="https://www.youtube.com/@docmetrics" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 rounded-xl p-6 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2 text-lg">Video Tutorials</h4>
              <p className="text-sm text-slate-600 mb-3">Step-by-step video guides</p>
              <div className="flex items-center gap-2 text-sm text-purple-600 font-medium">
                <span>Watch Now</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </a>
          </div>

          {/* Quick Links */}
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Quick Links
            </h4>
            <div className="space-y-2">
              <a href="#" className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-slate-900">📖 Getting Started Guide</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-slate-900">🎨 Design Templates</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-slate-900">⚡ Keyboard Shortcuts</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                <span className="text-sm font-medium text-slate-900">🔌 API Documentation</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowResourcesDialog(false)}
            className="w-full h-11"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* Help Drawer - UPDATED WITH EMAIL INTEGRATION */}
<AnimatePresence>
  {showHelpDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowHelpDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[700px] lg:w-[900px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Help & Support</h2>
            <p className="text-sm text-slate-600 mt-1">We're here to help you succeed</p>
          </div>
          <button
            onClick={() => setShowHelpDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Email Support */}
              <div 
                onClick={() => {
                  setShowHelpDialog(false)
                  setShowContactDialog(true)
                }}
                className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-primary-400 hover:bg-brand-primary-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-primary-500 to-brand-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2 text-lg">📧 Email Support</h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      Send us a message and we'll respond within 24 hours
                    </p>
                    <div className="flex items-center gap-2 text-sm text-brand-primary-600 font-semibold">
                      <span>support@docmetrics.io</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Book a Demo */}
              <div 
                onClick={() => {
                  setShowHelpDialog(false)
                  setShowDemoDialog(true)
                }}
                className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-secondary-400 hover:bg-brand-secondary-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-secondary-500 to-brand-secondary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2 text-lg">🎥 Schedule a Demo</h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      Book a personalized walkthrough with our team
                    </p>
                    <div className="flex items-center gap-2 text-sm text-brand-secondary-600 font-semibold">
                      <span>Book a Demo</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <a 
                href="https://docs.docmetrics.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-success-DEFAULT hover:bg-success-light/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success-DEFAULT to-success-dark flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <Book className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2 text-lg">📚 Documentation</h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      Complete guides and API reference
                    </p>
                    <div className="flex items-center gap-2 text-sm text-success-dark font-semibold">
                      <span>Browse Docs</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </a>

              {/* Help Center */}
              <a 
                href="https://help.docmetrics.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-warning-DEFAULT hover:bg-warning-light/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-warning-DEFAULT to-warning-dark flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <HelpCircle className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2 text-lg">❓ Help Center</h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      FAQs and troubleshooting articles
                    </p>
                    <div className="flex items-center gap-2 text-sm text-warning-dark font-semibold">
                      <span>Get Help</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Common Questions */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning-DEFAULT" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {[
                  { 
                    q: 'How do I track who views my documents?', 
                    a: 'Every document you upload automatically tracks views. Go to Documents → Click on any document → View detailed analytics including viewer names, time spent, and pages viewed.' 
                  },
                  { 
                    q: 'How do I send a document for signature?', 
                    a: 'Upload your PDF → Click "Send for Signature" → Add recipient emails → Place signature fields on the document → Send. Recipients receive an email with a secure link to sign.' 
                  },
                  { 
                    q: 'Can I customize the branding on shared documents?', 
                    a: 'Yes! Pro and Enterprise plans include custom branding options. You can add your logo, customize colors, and create branded document links.' 
                  },
                  { 
                    q: 'How do I invite team members?', 
                    a: 'Go to Settings → Team → Enter their email address and select their role (Admin, Member, or Viewer) → Send invitation. They\'ll receive an email to join.' 
                  },
                  {
                    q: 'What file formats are supported?',
                    a: 'Currently we support PDF files for document tracking and signatures. We\'re working on adding support for Word, PowerPoint, and Excel files soon.'
                  },
                ].map((item, index) => (
                  <details 
                    key={index} 
                    className="group border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-brand-primary-300 transition-colors bg-white"
                  >
                    <summary className="font-semibold text-slate-900 text-base flex items-start gap-3 list-none">
                      <ChevronRight className="h-5 w-5 text-brand-primary-500 transition-transform group-open:rotate-90 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{item.q}</span>
                    </summary>
                    <p className="text-sm text-slate-600 mt-3 pl-8 leading-relaxed">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            {/* Status Notice */}
            <div className="bg-gradient-to-br from-success-light to-brand-primary-50 border-2 border-success-DEFAULT rounded-xl p-6 mt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-success-DEFAULT flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-success-dark mb-2 text-lg">All Systems Operational</h4>
                  <p className="text-sm text-success-dark leading-relaxed">
                    All DocMetrics services are running smoothly. Average response time: <strong>24 hours</strong>
                  </p>
                  <a 
                    href="https://status.docmetrics.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-success-dark font-semibold mt-2 hover:underline"
                  >
                    View Status Page
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
          <Button
            variant="outline"
            onClick={() => setShowHelpDialog(false)}
            className="w-full h-12 text-base font-semibold"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* UPDATED: Integrations Drawer */}
<AnimatePresence>
  {showIntegrationsDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowIntegrationsDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[700px] lg:w-[900px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header - UPDATED */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Integrations</h2>
            <p className="text-sm text-slate-600 mt-1">Connect DocMetrics with your favorite tools</p>
          </div>
          <button
            onClick={() => setShowIntegrationsDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search integrations..."
                  className="pl-10 h-12 bg-slate-50 border-2 border-slate-200 focus:border-brand-primary-400"
                />
              </div>
            </div>

            {/* Categories - UPDATED COLORS */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {['All', 'Communication', 'Storage', 'CRM', 'Automation', 'Analytics'].map((cat) => (
                <button
                  key={cat}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    cat === 'All'
                      ? 'bg-gradient-to-r from-brand-primary-600 to-brand-secondary-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent hover:border-brand-primary-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Popular Integrations - UPDATED STYLING */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Popular Integrations
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Slack Integration Card - FULL FEATURED */}
<div 
  key="slack-integration"
  className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer"
>
  <div className="flex items-start justify-between mb-3">
    {/* Slack Icon */}
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    </div>
    
    {/* Connect/Connected Button */}
    {slackStatus.connected ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Connected
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBrowseSlackChannels}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {slackStatus.channelName ? 'Change Channel' : 'Select Channel'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDisconnectSlack}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleConnectSlack}
      >
        Connect
      </Button>
    )}
  </div>
  
  <h4 className="font-bold text-slate-900 mb-1">Slack</h4>
  <p className="text-sm text-slate-600">Get real-time notifications in Slack</p>
  
  {/* Show channel info if connected */}
  {slackStatus.connected && slackStatus.channelName && (
    <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
      <p className="text-xs text-purple-900">
        ✓ Posting to <span className="font-semibold">#{slackStatus.channelName}</span>
      </p>
    </div>
  )}
  
  {/* Warning if connected but no channel */}
  {slackStatus.connected && !slackStatus.channelName && (
    <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
      <p className="text-xs text-orange-900">
        ⚠️ No channel selected yet
      </p>
    </div>
  )}
</div>

                {/* Google Drive Integration Card - YOUR CUSTOM CODE */}
                <div 
                  key="google-drive-integration"
                  className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-brand-primary-400 hover:bg-brand-primary-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-primary-500 to-brand-primary-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                      📁
                    </div>
                    {integrationStatus.google_drive?.connected ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Connected
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleBrowseDriveFiles}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Browse Files
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleDisconnectGoogleDrive}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Disconnect
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleConnectGoogleDrive}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Google Drive</h4>
                  <p className="text-sm text-slate-600">Import documents from Drive</p>
                  {integrationStatus.google_drive?.connected && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ {integrationStatus.google_drive.email}
                    </p>
                  )}
                </div>

               

            {/* HubSpot Integration Card */}
<div 
  key="hubspot-integration"
  className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer"
>
  <div className="flex items-start justify-between mb-3">
    {/* HubSpot Icon */}
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.873h-.067a2.199 2.199 0 00-1.978 1.267 2.198 2.198 0 00.07 1.8l-3.47 3.47a4.238 4.238 0 00-1.344-.246 4.33 4.33 0 00-3.751 2.184L3.072 6.694a2.192 2.192 0 10-.795.796l3.646 3.626a4.284 4.284 0 002.023 6.763 4.314 4.314 0 003.515-.81l3.466 3.466a2.198 2.198 0 101.566-.618l-3.467-3.467a4.314 4.314 0 00.81-3.515 4.285 4.285 0 00-2.128-3.065 2.198 2.198 0 012.129-3.82l.039.04 3.435-3.435A2.199 2.199 0 0018.164 7.93z"/>
      </svg>
    </div>
    
    {/* Connect/Connected Button */}
    {hubspotStatus.connected ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Connected
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBrowseHubSpotContacts}>
            <Users className="h-4 w-4 mr-2" />
            View Contacts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSyncHubSpotContacts}>
            <Download className="h-4 w-4 mr-2" />
            Sync Contacts
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDisconnectHubSpot}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleConnectHubSpot}
      >
        Connect
      </Button>
    )}
  </div>
  
  <h4 className="font-bold text-slate-900 mb-1">HubSpot</h4>
  <p className="text-sm text-slate-600">Sync contacts and track deals</p>
  
  {/* Show portal info if connected */}
  {hubspotStatus.connected && hubspotStatus.portalId && (
    <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
      <p className="text-xs text-orange-900">
        ✓ Portal ID: <span className="font-semibold">{hubspotStatus.portalId}</span>
      </p>
    </div>
  )}
</div>

{/* Gmail Integration Card */}
<div 
  key="gmail-integration"
  className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-red-400 hover:bg-red-50/30 transition-all cursor-pointer"
>
  <div className="flex items-start justify-between mb-3">
    {/* Gmail Icon */}
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
      </svg>
    </div>
    
    {/* Connect/Connected Button */}
    {gmailStatus.connected ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Connected
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={handleDisconnectGmail}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleConnectGmail}
      >
        Connect
      </Button>
    )}
  </div>
  
  <h4 className="font-bold text-slate-900 mb-1">Gmail</h4>
  <p className="text-sm text-slate-600">Send tracked emails directly</p>
  
  {/* Show email if connected */}
  {gmailStatus.connected && gmailStatus.email && (
    <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
      <p className="text-xs text-red-900">
        ✓ Sending as <span className="font-semibold">{gmailStatus.email}</span>
      </p>
    </div>
  )}
</div>

            

            {/* All Integrations - REMOVED, only show "Coming Soon" */}
<div>
  <h3 className="text-lg font-bold text-slate-900 mb-4">More Integrations</h3>
  
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-8 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
      <Sparkles className="h-8 w-8 text-slate-500" />
    </div>
    <h4 className="text-xl font-bold text-slate-900 mb-2">More Integrations Coming Soon</h4>
    <p className="text-slate-600 mb-6 max-w-md mx-auto">
      We're working on integrations with Zapier, Salesforce, Microsoft Teams, Notion, Airtable, Zoom, and more!
    </p>
    
    {/* Preview Grid */}
    <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6 max-w-2xl mx-auto">
      {[
        { name: 'Zapier', icon: '⚡' },
        { name: 'Salesforce', icon: '☁️' },
        { name: 'Teams', icon: '👥' },
        { name: 'Notion', icon: '📝' },
        { name: 'Airtable', icon: '🗂️' },
        { name: 'Zoom', icon: '🎥' },
        { name: 'Outlook', icon: '📧' },
        { name: 'OneDrive', icon: '☁️' },
      ].map((integration) => (
        <div 
          key={integration.name}
          className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 opacity-60"
        >
          <div className="text-3xl">{integration.icon}</div>
          <p className="text-xs text-slate-600 font-medium">{integration.name}</p>
        </div>
      ))}
    </div>

    <Button 
  size="sm"
  onClick={() => {
    setShowIntegrationsDialog(false)
    setShowIntegrationRequestDialog(true)
  }}
  className="bg-purple-600 hover:bg-purple-700 text-white"
>
  Request an Integration
</Button>
  </div>
</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              {3} integrations connected
            </p>
            <Button
              variant="outline"
              onClick={() => setShowIntegrationsDialog(false)}
              className="h-12 px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )}
  </AnimatePresence>

  {/* Google Drive Files Dialog */}
{/* Google Drive Files DRAWER - Replace the Dialog */}
<Drawer open={showDriveFilesDialog} onOpenChange={setShowDriveFilesDialog}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Import from Google Drive</h2>
            <p className="text-sm text-slate-600">
              {integrationStatus.google_drive?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDriveFilesDialog(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>

    {/* Search Bar */}
    <div className="px-6 py-4 border-b bg-slate-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search your Drive files..."
          className="pl-10 bg-white"
          value={driveSearchQuery}
          onChange={(e) => setDriveSearchQuery(e.target.value)}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Found {filteredDriveFiles.length} PDF file(s) in your Google Drive
      </p>
    </div>
    
    {/* File List */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {loadingDriveFiles ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-slate-600 font-medium">Loading your Drive files...</p>
          <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
        </div>
      ) : filteredDriveFiles.length > 0 ? (
        <div className="space-y-3">
          {filteredDriveFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
              onClick={() => handleImportFile(file.id, file.name)}
            >
              <div className="flex items-center gap-4">
                {/* PDF Icon */}
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate mb-1 group-hover:text-blue-700 transition-colors">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {file.size ? formatFileSize(parseInt(file.size)) : 'Unknown size'}
                    </span>
                    {file.modifiedTime && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Modified {formatTimeAgo(file.modifiedTime)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Import Button */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImportFile(file.id, file.name)
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {driveSearchQuery ? 'No files found' : 'No PDF files in Drive'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {driveSearchQuery 
              ? 'Try adjusting your search query'
              : 'Upload PDFs to your Google Drive to import them here'}
          </p>
        </div>
      )}
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t bg-slate-50">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span>{filteredDriveFiles.length} file(s) available</span>
        <button
          onClick={handleDisconnectGoogleDrive}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Disconnect Drive
        </button>
      </div>
      <Button
        variant="outline"
        onClick={() => setShowDriveFilesDialog(false)}
        className="w-full"
      >
        Close
      </Button>
    </div>
  </div>
</Drawer>
{/* Billing Drawer */}
<AnimatePresence>
  {showBillingDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowBillingDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Billing & Subscription</h2>
            <p className="text-sm text-slate-600 mt-1">
              {!user?.plan || user?.plan?.toLowerCase() === 'free' 
                ? 'Upgrade to unlock premium features'
                : 'Manage your subscription and billing'
              }
            </p>
          </div>
          <button
            onClick={() => setShowBillingDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* FREE PLAN VIEW */}
          {!user?.plan || user?.plan?.toLowerCase() === 'free' ? (
            <div className="space-y-6 max-w-3xl">
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
              <div className="bg-white rounded-lg border-2 p-6">
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
            </div>
          ) : (
            /* PAID PLAN VIEW */
            <div className="space-y-6 max-w-3xl">
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
              <div className="bg-white rounded-lg border-2 p-6">
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
              <div className="bg-white rounded-lg border-2 p-6">
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
              <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowBillingDialog(false)}
            className="w-full h-11"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* Feedback Drawer */}
{/* UPDATED: Send Feedback Drawer */}
<AnimatePresence>
  {showFeedbackDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowFeedbackDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header - UPDATED */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send Feedback</h2>
            <p className="text-sm text-slate-600 mt-1">Help us improve DocMetrics</p>
          </div>
          <button
            onClick={() => setShowFeedbackDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6 max-w-3xl">
            {/* Feedback Type Selection - UPDATED COLORS */}
            <div className="grid grid-cols-3 gap-4">
              <button className="p-5 border-2 border-slate-200 rounded-xl hover:border-red-400 hover:bg-red-50/30 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🐛</div>
                <p className="text-sm font-semibold text-slate-900">Bug Report</p>
              </button>
              <button className="p-5 border-2 border-slate-200 rounded-xl hover:border-brand-primary-400 hover:bg-brand-primary-50/30 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">💡</div>
                <p className="text-sm font-semibold text-slate-900">Feature Request</p>
              </button>
              <button className="p-5 border-2 border-slate-200 rounded-xl hover:border-brand-secondary-400 hover:bg-brand-secondary-50/30 transition-all text-center group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">💬</div>
                <p className="text-sm font-semibold text-slate-900">General Feedback</p>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">Your Feedback</Label>
                <Textarea 
                  placeholder="Tell us what you think, report bugs, or suggest new features..."
                  rows={8}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="resize-none border-2 border-slate-200 focus:border-brand-primary-400 focus:ring-brand-primary-400"
                />
                <p className="text-xs text-slate-500">
                  Be as detailed as possible. Screenshots can be sent to support@docmetrics.com
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">Email (optional)</Label>
                <Input 
                  type="email"
                  placeholder="your@email.com"
                  defaultValue={user?.email}
                  disabled
                  className="bg-slate-50 h-12 border-2"
                />
                <p className="text-xs text-slate-500">
                  We'll use this to follow up if needed
                </p>
              </div>
            </div>

            {/* Info Box - UPDATED */}
            <div className="bg-gradient-to-br from-brand-primary-50 to-brand-secondary-50 border-2 border-brand-primary-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-brand-primary-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-primary-900 mb-2">We value your feedback!</h4>
                  <p className="text-sm text-brand-primary-800 leading-relaxed">
                    Your suggestions help us build a better product. We read every piece of feedback 
                    and many of our best features came from user suggestions like yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - UPDATED */}
        <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackDialog(false)
                setFeedbackText('')
              }}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFeedbackSubmit}
              disabled={!feedbackText.trim()}
              className="h-12 px-6 bg-gradient-to-r from-brand-primary-600 to-brand-secondary-600 hover:from-brand-primary-700 hover:to-brand-secondary-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* Contact Us Dialog - UPDATED WITH EMAIL */}
<AnimatePresence>
  {showContactDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowContactDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Contact Support</h2>
            <p className="text-sm text-slate-600 mt-1">Send us a message and we'll respond within 24 hours</p>
          </div>
          <button
            onClick={() => setShowContactDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-5 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Your Name</Label>
                <Input 
                  value={`${user?.first_name} ${user?.last_name}`.trim()}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Email Address</Label>
                <Input 
                  value={user?.email}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Subject *</Label>
              <Input 
                placeholder="How can we help?" 
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Message *</Label>
              <Textarea 
                placeholder="Tell us more about your inquiry..." 
                rows={8}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Quick Contact Options */}
            <div className="bg-gradient-to-br from-brand-primary-50 to-brand-secondary-50 border-2 border-brand-primary-200 rounded-xl p-6">
              <h4 className="font-bold text-brand-primary-900 mb-4 flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                Other Ways to Reach Us
              </h4>
              <div className="space-y-3">
                <a 
                  href="mailto:support@docmetrics.io"
                  className="flex items-center gap-3 p-4 bg-white/80 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-brand-primary-200"
                >
                  <div className="h-10 w-10 rounded-lg bg-brand-primary-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Direct Email</p>
                    <p className="text-sm text-slate-600">support@docmetrics.io</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-success-DEFAULT flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Response Time</p>
                    <p className="text-sm text-slate-600">Usually within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12"
              onClick={() => {
                setShowContactDialog(false)
                setSupportSubject('')
                setSupportMessage('')
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!supportSubject.trim() || !supportMessage.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-brand-primary-500 to-brand-secondary-500 hover:from-brand-primary-600 hover:to-brand-secondary-600 shadow-lg"
              onClick={async () => {
                const loadingToast = toast.loading('Sending message...')
                
                try {
                  const res = await fetch('/api/support', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      subject: supportSubject.trim(),
                      message: supportMessage.trim(),
                    }),
                  })

                  const data = await res.json()

                  if (res.ok) {
                    toast.success('Message sent!', {
                      id: loadingToast,
                      description: "We'll get back to you within 24 hours"
                    })
                    setShowContactDialog(false)
                    setSupportSubject('')
                    setSupportMessage('')
                  } else {
                    toast.error(data.error || 'Failed to send message', {
                      id: loadingToast
                    })
                  }
                } catch (error) {
                  console.error('Support error:', error)
                  toast.error('Network error', {
                    id: loadingToast
                  })
                }
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>


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
  <DialogContent className="max-w-2xl bg-white scrollbar-thin max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Upload Agreement</DialogTitle>
      <DialogDescription>
        Upload your agreement PDF. You'll place signature fields on the next screen.
      </DialogDescription>
    </DialogHeader>
    
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="template">Use Template</TabsTrigger>
        <TabsTrigger value="create">Create New</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="space-y-4 mt-4">
        {/* Upload Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Your Uploaded Agreements</h3>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('agreement-file-input')?.click()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload New
          </Button>
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
              const res = await fetch("/api/agreements/upload", {
                method: 'POST',
                credentials: 'include',
                body: formData,
              })
              
              const data = await res.json()
              
              if (res.ok) {
                alert('Agreement uploaded successfully!')
                fetchUploadedAgreements()
              } else {
                alert(data.error || 'Upload failed')
              }
            } catch (error) {
              console.error('Upload error:', error)
              alert('Failed to upload agreement')
            }
          }}
        />

        {/* List of Uploaded Agreements */}
        {uploadedAgreementsList.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {uploadedAgreementsList.map((agreement) => (
              <div 
                key={agreement._id}
                className="border-2 rounded-lg p-4 transition-all cursor-pointer border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => {
                  setShowUploadAgreementDialog(false)
                  router.push(`/documents/${agreement._id}/signature?mode=send&returnTo=/agreements`)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{agreement.filename}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatFileSize(agreement.filesize)} • Uploaded {formatTimeAgo(agreement.createdAt)}
                      </p>
                      <p className="text-xs text-purple-600 mt-2 font-medium">
                        Click to configure and send →
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!confirm('Delete this agreement?')) return
                      
                      try {
                        const res = await fetch(`/api/agreements/${agreement._id}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        })
                        
                        if (res.ok) {
                          alert('Agreement deleted')
                          fetchUploadedAgreements()
                        }
                      } catch (error) {
                        console.error('Delete error:', error)
                        alert('Failed to delete')
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <Upload className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No agreements uploaded yet</p>
            <p className="text-xs text-slate-500 mt-1">Click "Upload New" to get started</p>
          </div>
        )}

        {/*   REMOVE THE ENTIRE CONFIGURATION FORM SECTION */}
      </TabsContent>
      
      {/* Keep template and create tabs as-is */}
    </Tabs>
  </DialogContent>
</Dialog>

{/* Mobile Profile Drawer */}
<AnimatePresence>
  {showMobileProfileDrawer && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowMobileProfileDrawer(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 md:hidden"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col md:hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`h-16 w-16 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden`}
            >
              {user?.profile_image ? (
                <Image
                  src={user.profile_image}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-full h-full"
                  key={user.profile_image}
                  unoptimized
                />
              ) : (
                getInitials(user?.email || "")
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-lg truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-sm text-slate-600 truncate">{user?.email}</div>
              <div className="text-xs text-slate-500 mt-1">{user?.company_name || "My Company"}</div>
            </div>
          </div>
          <button
            onClick={() => setShowMobileProfileDrawer(false)}
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 space-y-2">
            {/* Upgrade Button */}
            <Button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                router.push('/plan')
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold h-12 mb-3"
            >
              ⚡ Upgrade to Pro
            </Button>

            {/* Notifications */}
            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setNotificationsOpen(true)
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="h-6 w-6 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="border-t my-2"></div>

            {/* Menu Items */}
            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowSettingsDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Settings</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowTeamDrawer(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <UsersIcon className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Team</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowBillingDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <CreditCard className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Billing</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowResourcesDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Book className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Resources</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowHelpDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Help</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowFeedbackDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Feedback</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowIntegrationsDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Puzzle className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Integrations</span>
            </button>

            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                setShowContactDialog(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Contact Us</span>
            </button>

            {/* Divider */}
            <div className="border-t my-2"></div>

            {/* Logout */}
            <button
              onClick={() => {
                setShowMobileProfileDrawer(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* Create File Request Dialog */}
{/* Create File Request Dialog */}
<Dialog open={showCreateFileRequestDialog} onOpenChange={setShowCreateFileRequestDialog}>
  <DialogContent className="max-w-2xl bg-white scrollbar-thin max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create File Request</DialogTitle>
      <DialogDescription>Request files from clients, partners, or team members</DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Request Title *</Label>
        <Input 
          placeholder="e.g., Client Onboarding Documents" 
          value={fileRequestTitle}
          onChange={(e) => setFileRequestTitle(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          placeholder="What files do you need? Include any specific requirements..."
          rows={4}
          value={fileRequestDescription}
          onChange={(e) => setFileRequestDescription(e.target.value)}
        />
      </div>
      
      {/* 🟢 MODE SELECTOR */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Recipient</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Recipients</TabsTrigger>
        </TabsList>
        
        {/* 🟢 SINGLE RECIPIENT MODE */}
        <TabsContent value="single" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Recipient Email *</Label>
            <Input 
              type="email"
              placeholder="client@company.com"
              value={fileRequestRecipient}
              onChange={(e) => setFileRequestRecipient(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              One unique link will be created for this recipient
            </p>
          </div>
        </TabsContent>
        
        {/* 🟢 MULTIPLE RECIPIENTS MODE */}
        <TabsContent value="multiple" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Recipient Emails *</Label>
            <Textarea 
              placeholder="client1@company.com, client2@company.com, client3@company.com"
              rows={4}
              value={fileRequestRecipients}
              onChange={(e) => setFileRequestRecipients(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Enter multiple emails separated by commas. Each person gets their own unique upload link.
            </p>
          </div>
          
          {/* 🟢 PREVIEW */}
          {fileRequestRecipients.trim() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Will create {fileRequestRecipients.split(',').filter(e => e.trim()).length} file requests:
              </p>
              <div className="space-y-1">
                {fileRequestRecipients.split(',').filter(e => e.trim()).slice(0, 5).map((email, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>{email.trim()}</span>
                  </div>
                ))}
                {fileRequestRecipients.split(',').filter(e => e.trim()).length > 5 && (
                  <p className="text-sm text-blue-700 mt-2">
                    + {fileRequestRecipients.split(',').filter(e => e.trim()).length - 5} more...
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date (Optional)</Label>
          <Input 
            type="date" 
            value={fileRequestDueDate}
            onChange={(e) => setFileRequestDueDate(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Expected Files</Label>
          <Input 
            type="number" 
            placeholder="Number of files" 
            defaultValue={1}
            min={1}
            value={fileRequestExpectedFiles}
            onChange={(e) => setFileRequestExpectedFiles(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="bg-slate-50 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Inbox className="h-5 w-5 text-slate-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 mb-1">How it works</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Each recipient gets their own unique upload link</li>
              <li>• They can upload files without creating an account</li>
              <li>• You'll get notified when files are uploaded</li>
              <li>• All files are encrypted and stored securely</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={() => {
          setShowCreateFileRequestDialog(false)
          setFileRequestTitle('')
          setFileRequestDescription('')
          setFileRequestRecipient('')
          setFileRequestRecipients('')
          setFileRequestDueDate('')
          setFileRequestExpectedFiles(1)
        }}>
          Cancel
        </Button>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          onClick={handleCreateFileRequest}
          disabled={!fileRequestTitle.trim() || (!fileRequestRecipient.trim() && !fileRequestRecipients.trim())}
        >
          <Send className="mr-2 h-4 w-4" />
          Create Request
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* File Request Link Dialog */}
<Dialog open={showFileRequestLinkDialog} onOpenChange={setShowFileRequestLinkDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        File Request Created!
      </DialogTitle>
      <DialogDescription>
        {fileRequestEmailSent 
          ? `Email sent to ${fileRequestRecipient}. You can also copy the link below.`
          : 'Copy the link below and send it to the recipient manually.'
        }
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {fileRequestEmailSent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900 mb-1">
                📧 Email sent to {fileRequestRecipient}
              </p>
              <p className="text-xs text-green-700">
                They'll receive instructions and the upload link.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Upload Link</Label>
        <div className="flex gap-2">
          <Input 
            value={generatedFileRequestLink}
            readOnly
            className="flex-1 font-mono text-xs bg-slate-50"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(generatedFileRequestLink)
              alert('Link copied to clipboard!')
            }}
          >
            Copy
          </Button>
          <Button
            onClick={() => window.open(generatedFileRequestLink, '_blank')}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Open
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Share this link with anyone to collect files securely.
        </p>
      </div>
      
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => {
            setShowFileRequestLinkDialog(false)
            router.push(`/file-requests/${createdFileRequestId}`)
          }}
        >
          View Request
        </Button>
        <Button
          onClick={() => {
            setShowFileRequestLinkDialog(false)
            setActivePage('file-requests')
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Back to Requests
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Share Document Dialog */}
<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
  <DialogContent className="max-w-2xl bg-white scrollbar  max-h-[80vh] overflow-y-auto">
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

{/* Signature Link Dialog */}
<Dialog open={showSignatureLinkDialog} onOpenChange={setShowSignatureLinkDialog}>
  <DialogContent className="max-w-2xl bg-white scrollbar  max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        Agreement Sent Successfully!
      </DialogTitle>
      <DialogDescription>
        Emails have been sent to all signers. You can also copy the link below to manually test.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900 mb-1">
              📧 Emails sent to {agreementSigners.split(',').length} recipient(s)
            </p>
            <p className="text-xs text-green-700">
              {agreementSigners}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Signature Link (for testing)</Label>
        <div className="flex gap-2">
          <Input 
            value={generatedSignatureLink}
            readOnly
            className="flex-1 font-mono text-xs bg-slate-50"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(generatedSignatureLink)
              alert('Link copied to clipboard!')
            }}
          >
            Copy
          </Button>
          <Button
            onClick={() => window.open(generatedSignatureLink, '_blank')}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Open
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          This is the same link that was emailed to signers. Open it to test the signing flow.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Signers receive an email with the link</li>
              <li>• They click the link to view and sign the agreement</li>
              <li>• You'll be notified when they sign</li>
              <li>• Track progress in the Agreements section</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button 
          variant="outline"
          onClick={() => setShowSignatureLinkDialog(false)}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            setShowSignatureLinkDialog(false)
            setActivePage('agreements')
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          View All Agreements
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* 🟢 BULK FILE REQUEST LINKS DIALOG */}
<Dialog open={showBulkFileRequestLinksDialog} onOpenChange={setShowBulkFileRequestLinksDialog}>
  <DialogContent className="max-w-3xl bg-white max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-600" />
        {createdFileRequests.length} File Request(s) Created!
      </DialogTitle>
      <DialogDescription>
        Each recipient has their own unique upload link
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {createdFileRequests.map((request, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                {request.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-900">{request.email}</p>
                <p className="text-xs text-slate-500">Request #{index + 1}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={request.link}
              readOnly
              className="flex-1 font-mono text-xs bg-slate-50"
            />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(request.link)
                alert('Link copied!')
              }}
            >
              Copy
            </Button>
            <Button
              onClick={() => window.open(request.link, '_blank')}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Open
            </Button>
          </div>
        </div>
      ))}
      
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            const allLinks = createdFileRequests.map(r => `${r.email}: ${r.link}`).join('\n')
            navigator.clipboard.writeText(allLinks)
            alert('All links copied to clipboard!')
          }}
        >
          Copy All Links
        </Button>
        <Button
          onClick={() => setShowBulkFileRequestLinksDialog(false)}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Done
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* 🟢 ADD CONTACT DRAWER */}
<Sheet open={showAddContactDrawer} onOpenChange={setShowAddContactDrawer}>
  <SheetContent side="right" className="w-full sm:w-[640px] lg:w-[800px] p-0 flex flex-col bg-white "
>
    {/* Sticky Header */}
    <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
      <SheetTitle className="text-xl">Add New Contact</SheetTitle>
      <SheetDescription>
        Save contact details for quick document sharing
      </SheetDescription>
    </SheetHeader>

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-6 space-y-6">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            placeholder="John Doe"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email Address *</Label>
          <Input
            type="email"
            placeholder="john@company.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Company (Optional)</Label>
          <Input
            placeholder="Acme Inc."
            value={contactCompany}
            onChange={(e) => setContactCompany(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Phone (Optional)</Label>
          <Input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Add any additional notes about this contact..."
            rows={4}
            value={contactNotes}
            onChange={(e) => setContactNotes(e.target.value)}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Quick Sharing</p>
              <p className="text-xs text-blue-700">
                Once added, you can quickly share documents with this contact from anywhere in the app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Sticky Footer */}
    <div className="px-6 py-4 border-t bg-white sticky bottom-0 z-10 shadow-lg">
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setShowAddContactDrawer(false)
            resetContactForm()
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddContact}
          disabled={!contactName.trim() || !contactEmail.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>

{/* 🟢 EDIT CONTACT DRAWER */}
<Sheet open={showEditContactDrawer} onOpenChange={setShowEditContactDrawer}>
  <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col bg-white">
    {/* Sticky Header */}
    <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
      <SheetTitle className="text-xl">Edit Contact</SheetTitle>
      <SheetDescription>
        Update contact information
      </SheetDescription>
    </SheetHeader>

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-6 space-y-6">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input
            placeholder="John Doe"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email Address *</Label>
          <Input
            type="email"
            placeholder="john@company.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Company (Optional)</Label>
          <Input
            placeholder="Acme Inc."
            value={contactCompany}
            onChange={(e) => setContactCompany(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Phone (Optional)</Label>
          <Input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Add any additional notes about this contact..."
            rows={4}
            value={contactNotes}
            onChange={(e) => setContactNotes(e.target.value)}
          />
        </div>
      </div>
    </div>

    {/* Sticky Footer */}
    <div className="px-6 py-4 border-t bg-white sticky bottom-0 z-10 shadow-lg">
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setShowEditContactDrawer(false)
            resetContactForm()
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateContact}
          disabled={!contactName.trim() || !contactEmail.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Save Changes
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>

{/* Notifications Drawer - Modern Slide-in */}
<AnimatePresence>
  {notificationsOpen && (
    <>
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setNotificationsOpen(false)}
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
    />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-brand-primary-50 to-brand-secondary-50 sticky top-0 z-10">
          <div>
  <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
  <p className="text-sm text-slate-600 mt-1">
    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
  </p>
</div>
          <div className="flex items-center gap-2">
             {unreadCount > 0 && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => markAsRead()}
        className="text-xs font-semibold text-blue-600 hover:text-brand-primary-700 hover:bg-brand-primary-50"
      >
        Mark all read
      </Button>
    )}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <motion.div
  key={notification._id}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  className={`p-5 hover:bg-slate-50 cursor-pointer transition-all group relative ${
    !notification.read ? 'bg-brand-secondary-50/30 border-l-4 border-l-brand-secondary-500' : ''
  }`}
               onClick={() => {
  markAsRead(notification._id)
  setNotificationsOpen(false)
  
  let targetUrl;
  
  //   Use redirectUrl if provided
  if (notification.redirectUrl) {
    targetUrl = notification.redirectUrl;
  } 
  //   PRIORITY 2: Use uniqueId from metadata for signature notifications
  else if (notification.type === 'signature' && notification.metadata?.uniqueId) {
    targetUrl = `/signed/${notification.metadata.uniqueId}`;
  } 
  //   PRIORITY 3: Fallback to document analytics
  else if (notification.documentId) {
    targetUrl = `/documents/${notification.documentId}`;
  }
  
  if (targetUrl) {
    router.push(targetUrl);
  }
}}   >
                  {/* Delete Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      
                      try {
                        const res = await fetch(`/api/notifications?id=${notification._id}`, {
                          method: 'DELETE',
                          credentials: 'include'
                        })
                        
                        if (res.ok) {
                          toast.success('Notification deleted')
                          fetchNotifications()
                        } else {
                          toast.error('Failed to delete')
                        }
                      } catch (error) {
                        console.error('Delete error:', error)
                        toast.error('Failed to delete')
                      }
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-full z-10"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>

                  <div className="flex gap-4">
                    {/* Icon */}
<div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
  notification.type === 'view' ? 'bg-brand-secondary-100' :
  notification.type === 'download' ? 'bg-success-light' :
  notification.type === 'signature' ? 'bg-brand-primary-100' :
  notification.type === 'share' ? 'bg-warning-light' :
  'bg-slate-100'
}`}>
  {getNotificationIcon(notification.type)}
</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold ${
                          !notification.read ? 'text-slate-900' : 'text-slate-700'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
  <div className="h-2 w-2 bg-brand-secondary-500 rounded-full flex-shrink-0 mt-1"></div>
)}
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.actorName && (
                          <>
                            <span>•</span>
                            <span>{notification.actorName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Bell className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                When someone views, downloads, or signs your documents, you'll see notifications here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-4 border-t bg-slate-50 sticky bottom-0">
            <Button
  variant="outline"
  className="w-full"
  onClick={() => {
    setNotificationsOpen(false)
    router.push('/notifications') // ✅ Navigate to full page
  }}
>
  View All Notifications
</Button>
          </div>
        )}
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* Demo Booking Dialog */}
<Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
  <DialogContent className="max-w-2xl bg-white scrollbar  max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold">Schedule a Demo</DialogTitle>
      <DialogDescription>
        Book a personalized walkthrough of DocMetrics with our team
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-5 mt-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Your Name</Label>
          <Input 
            value={`${user?.first_name} ${user?.last_name}`.trim()}
            disabled
            className="bg-slate-50"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Email</Label>
          <Input 
            value={user?.email}
            disabled
            className="bg-slate-50"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Phone Number</Label>
          <Input 
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={demoPhoneNumber}
            onChange={(e) => setDemoPhoneNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Team Size</Label>
          <select
            value={demoTeamSize}
            onChange={(e) => setDemoTeamSize(e.target.value)}
            className="w-full h-11 px-4 border-2 border-slate-200 rounded-lg bg-white focus:border-brand-primary-400 focus:ring-2 focus:ring-brand-primary-400 focus:outline-none"
          >
            <option value="">Select team size</option>
            <option value="1-5">1-5 people</option>
            <option value="6-20">6-20 people</option>
            <option value="21-50">21-50 people</option>
            <option value="51+">51+ people</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Preferred Date/Time </Label>
        <Input 
          type="text"
          placeholder="e.g., Next Tuesday 2pm EST, or Week of Jan 15"
          value={demoPreferredDate}
          onChange={(e) => setDemoPreferredDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">What would you like to learn about? (Optional)</Label>
        <Textarea 
          placeholder="Share any specific features or use cases you're interested in..."
          rows={4}
          value={demoMessage}
          onChange={(e) => setDemoMessage(e.target.value)}
          className="resize-none"
        />
      </div>

      <div className="bg-gradient-to-br from-brand-primary-50 to-brand-secondary-50 border-2 border-brand-primary-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-primary-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-brand-primary-900 mb-1">What to expect</p>
            <ul className="text-sm text-brand-primary-800 space-y-1">
              <li>• 30-minute personalized demo tailored to your needs</li>
              <li>• Live Q&A with our product experts</li>
              <li>• Custom recommendations for your use case</li>
              <li>• No pressure sales pitch - just genuine help</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div className="flex gap-3 justify-end pt-4 border-t mt-4">
      <Button
        variant="outline"
        onClick={() => {
          setShowDemoDialog(false)
          setDemoPhoneNumber('')
          setDemoTeamSize('')
          setDemoPreferredDate('')
          setDemoMessage('')
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={async () => {
          const loadingToast = toast.loading('Sending demo request...')
          
          try {
            const res = await fetch('/api/demo', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phoneNumber: demoPhoneNumber.trim() || undefined,
                teamSize: demoTeamSize || undefined,
                preferredDate: demoPreferredDate.trim() || undefined,
                message: demoMessage.trim() || undefined,
              }),
            })

            const data = await res.json()

            if (res.ok) {
              toast.success('Demo request sent!', {
                id: loadingToast,
                description: "We'll contact you within 24 hours to schedule"
              })
              setShowDemoDialog(false)
              setDemoPhoneNumber('')
              setDemoTeamSize('')
              setDemoPreferredDate('')
              setDemoMessage('')
            } else {
              toast.error(data.error || 'Failed to send request', {
                id: loadingToast
              })
            }
          } catch (error) {
            console.error('Demo request error:', error)
            toast.error('Network error', {
              id: loadingToast
            })
          }
        }}
        className="bg-gradient-to-r from-brand-primary-500 to-brand-secondary-500 hover:from-brand-primary-600 hover:to-brand-secondary-600"
      >
        <Send className="mr-2 h-4 w-4" />
        Request Demo
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Slack Channel Selection Drawer */}
<Drawer open={showSlackChannelDialog} onOpenChange={setShowSlackChannelDialog}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select Slack Channel</h2>
            <p className="text-sm text-slate-600">
              {slackStatus.teamName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSlackChannelDialog(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>

    {/* Channel List */}
    <div className="flex-1 overflow-y-auto p-6">
      {loadingSlackChannels ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-sm text-slate-600 font-medium">Loading channels...</p>
        </div>
      ) : slackChannels.length > 0 ? (
        <div className="space-y-2">
          {slackChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleSelectSlackChannel(channel.id, channel.name)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-purple-400 hover:bg-purple-50 ${
                slackStatus.channelId === channel.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {channel.isPrivate ? '🔒' : '#'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {channel.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {channel.isPrivate ? 'Private channel' : 'Public channel'}
                    {!channel.isMember && ' • Not a member'}
                  </div>
                </div>
                {slackStatus.channelId === channel.id && (
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-600">No channels found</p>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t bg-slate-50">
      <Button
        variant="outline"
        onClick={() => setShowSlackChannelDialog(false)}
        className="w-full"
      >
        Close
      </Button>
    </div>
  </div>
</Drawer>

{/* HubSpot Contacts Drawer */}
<Drawer open={showHubSpotContactsDialog} onOpenChange={setShowHubSpotContactsDialog}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.873h-.067a2.199 2.199 0 00-1.978 1.267 2.198 2.198 0 00.07 1.8l-3.47 3.47a4.238 4.238 0 00-1.344-.246 4.33 4.33 0 00-3.751 2.184L3.072 6.694a2.192 2.192 0 10-.795.796l3.646 3.626a4.284 4.284 0 002.023 6.763 4.314 4.314 0 003.515-.81l3.466 3.466a2.198 2.198 0 101.566-.618l-3.467-3.467a4.314 4.314 0 00.81-3.515 4.285 4.285 0 00-2.128-3.065 2.198 2.198 0 012.129-3.82l.039.04 3.435-3.435A2.199 2.199 0 0018.164 7.93z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">HubSpot Contacts</h2>
            <p className="text-sm text-slate-600">
              {hubspotStatus.portalId ? `Portal: ${hubspotStatus.portalId}` : 'Your CRM contacts'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHubSpotContactsDialog(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>

    {/* Contact List */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {loadingHubSpotContacts ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mb-4" />
          <p className="text-sm text-slate-600 font-medium">Loading contacts...</p>
        </div>
      ) : hubspotContacts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 mb-4">
            Found {hubspotContacts.length} contact(s) in HubSpot
          </p>
          {hubspotContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-orange-400 hover:bg-orange-50/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(contact.email)} flex items-center justify-center text-white font-semibold`}>
                  {contact.firstName?.charAt(0)?.toUpperCase() || contact.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-sm text-slate-600 truncate">{contact.email}</p>
                  {contact.company && (
                    <p className="text-xs text-slate-500">{contact.company}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No contacts found in HubSpot</p>
        </div>
      )}
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t bg-slate-50">
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowHubSpotContactsDialog(false)}
          className="flex-1"
        >
          Close
        </Button>
        <Button
          onClick={handleSyncHubSpotContacts}
          disabled={hubspotContacts.length === 0}
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Sync {hubspotContacts.length} Contacts
        </Button>
      </div>
    </div>
  </div>
</Drawer>

{/* Gmail Send Email Dialog */}
<Dialog open={showGmailSendDialog} onOpenChange={setShowGmailSendDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-red-600" />
        Send via Gmail
      </DialogTitle>
      <DialogDescription>
        Send a tracked document link via your Gmail account
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Recipients *</Label>
        <Input
          placeholder="john@example.com, jane@company.com"
          value={gmailRecipients}
          onChange={(e) => setGmailRecipients(e.target.value)}
        />
        <p className="text-xs text-slate-500">Separate multiple emails with commas</p>
      </div>
      
      <div className="space-y-2">
        <Label>Subject *</Label>
        <Input
          placeholder="Check out this document"
          value={gmailSubject}
          onChange={(e) => setGmailSubject(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Message (Optional)</Label>
        <Textarea
          placeholder="Add a personal message..."
          rows={4}
          value={gmailMessage}
          onChange={(e) => setGmailMessage(e.target.value)}
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Email Tracking Enabled</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• You'll be notified when recipients open the email</li>
              <li>• Track when they view the document</li>
              <li>• See time spent on each page</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowGmailSendDialog(false);
            setGmailRecipients('');
            setGmailSubject('');
            setGmailMessage('');
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSendViaGmail}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        >
          <Send className="mr-2 h-4 w-4" />
          Send Email
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Integration Request Drawer */}
<AnimatePresence>
  {showIntegrationRequestDialog && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowIntegrationRequestDialog(false)}
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Request an Integration</h2>
            <p className="text-sm text-slate-600 mt-1">Tell us which tool you'd like to connect</p>
          </div>
          <button
            onClick={() => setShowIntegrationRequestDialog(false)}
            className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6 max-w-3xl">
            {/* Popular Requests - Quick Select */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-900">Popular Requests</Label>
              <p className="text-sm text-slate-600 mb-3">Select one or type your own below</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Zapier', icon: '⚡' },
                  { name: 'Salesforce', icon: '☁️' },
                  { name: 'Microsoft Teams', icon: '👥' },
                  { name: 'Notion', icon: '📝' },
                  { name: 'Airtable', icon: '🗂️' },
                  { name: 'Zoom', icon: '🎥' },
                  { name: 'Outlook', icon: '📧' },
                  { name: 'OneDrive', icon: '☁️' },
                ].map((integration) => (
                  <button
                    key={integration.name}
                    onClick={() => setRequestedIntegration(integration.name)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      requestedIntegration === integration.name
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">{integration.icon}</div>
                    <p className="text-xs font-semibold text-slate-900">{integration.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Integration Input */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-slate-900">
                Or type a different integration
              </Label>
              <Input 
                placeholder="e.g., Monday.com, Asana, Trello..."
                value={requestedIntegration}
                onChange={(e) => setRequestedIntegration(e.target.value)}
                className="h-12 text-base"
              />
              <p className="text-xs text-slate-500">
                Which tool would you like to connect with DocMetrics?
              </p>
            </div>

            {/* Use Case */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-slate-900">
                How would you use this integration? (Optional)
              </Label>
              <Textarea 
                placeholder="Tell us about your workflow and how this integration would help you..."
                rows={6}
                value={integrationUseCase}
                onChange={(e) => setIntegrationUseCase(e.target.value)}
                className="resize-none text-base"
              />
              <p className="text-xs text-slate-500">
                This helps us prioritize features that deliver the most value
              </p>
            </div>

            {/* Contact Info Preview */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-1">We'll follow up with you</p>
                  <p className="text-sm text-slate-600">
                    <strong>{user?.first_name} {user?.last_name}</strong> ({user?.email})
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    We'll email you when this integration becomes available
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">Your voice matters!</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Integration requests directly influence our development roadmap. The most requested 
                    integrations get built first. We'll notify you via email when your requested integration is available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowIntegrationRequestDialog(false)
                setRequestedIntegration('')
                setIntegrationUseCase('')
              }}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!requestedIntegration.trim()) {
                  toast.error('Please select or enter an integration');
                  return;
                }

                const loadingToast = toast.loading('Submitting request...');

                try {
                  const res = await fetch('/api/feedback', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      feedback: `Integration Request: ${requestedIntegration.trim()}\n\nUse Case: ${integrationUseCase.trim() || 'Not provided'}`,
                      type: 'integration_request' // Add this to differentiate
                    }),
                  });

                  const data = await res.json();

                  if (res.ok) {
                    toast.success('Request submitted!', {
                      id: loadingToast,
                      description: `We'll notify you when ${requestedIntegration} is available`
                    });
                    setRequestedIntegration('');
                    setIntegrationUseCase('');
                    setShowIntegrationRequestDialog(false);
                  } else {
                    toast.error(data.error || 'Failed to submit request', {
                      id: loadingToast
                    });
                  }
                } catch (error) {
                  console.error('Integration request error:', error);
                  toast.error('Network error', {
                    id: loadingToast
                  });
                }
              }}
              disabled={!requestedIntegration.trim()}
              className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
 
    </div>
  )
}

 
// Remove this entire function - it's a duplicate and not needed

