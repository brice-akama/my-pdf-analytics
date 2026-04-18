"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import DashboardOverview from '@/components/DashboardOverview';
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmailAutocomplete } from '@/components/ui/EmailAutocomplete';
import TopNav from "@/components/dashboard/TopNav"
 import EarnCreditDialog from "@/components/dialogs/EarnCreditDialog"
import ShareDocumentDialog from "@/components/dialogs/ShareDocumentDialog"
import SignatureLinkDialog from "@/components/dialogs/SignatureLinkDialog"
import BulkFileRequestLinksDialog from "@/components/dialogs/BulkFileRequestLinksDialog"
import InviteLinkDialog from "@/components/dialogs/InviteLinkDialog"
import DeleteMemberDialog from "@/components/dialogs/DeleteMemberDialog"
import GmailSendDialog from "@/components/dialogs/GmailSendDialog"
import DemoDialog from "@/components/dialogs/DemoDialog"
import ZapierSetupDialog from "@/components/dialogs/ZapierSetupDialog"
import OneDriveFilesDrawer from "@/components/drawers/OneDriveFilesDrawer"
import SlackChannelDrawer from "@/components/drawers/SlackChannelDrawer"
import HubSpotContactsDrawer from "@/components/drawers/HubSpotContactsDrawer"
 
import AddContactSheet from "@/components/drawers/AddContactSheet"
import EditContactSheet from "@/components/drawers/EditContactSheet"
 
 
import Sidebar from "@/components/dashboard/Sidebar"
import MobileSidebar from "@/components/dashboard/MobileSidebar"
import MobileProfileDrawer from "@/components/dashboard/MobileProfileDrawer"
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer"
import SettingsDrawer from "@/components/dashboard/SettingsDrawer"
import TeamDrawer from "@/components/dashboard/TeamDrawer"
import ResourcesDrawer from "@/components/drawers/ResourcesDrawer"
import HelpDrawer from "@/components/drawers/HelpDrawer"
import IntegrationsDrawer from "@/components/drawers/IntegrationsDrawer"
import BillingDrawer from "@/components/drawers/BillingDrawer"
import FeedbackDrawer from "@/components/dashboard/FeedbackDrawer"
import ContactDrawer from "@/components/dashboard/ContactDrawer"
import AgreementsSection from "@/components/dashboard/AgreementsSection"
import FileRequestsSection from "@/components/dashboard/FileRequestsSection"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import SpacesView from "@/components/SpacesView"
import DriveFilesDrawer from "@/components/drawers/DriveFilesDrawer"
import UploadAgreementSheet from "@/components/drawers/UploadAgreementSheet"
import CreateFileRequestSheet from "@/components/drawers/CreateFileRequestSheet"
import TeamsChannelSheet from "@/components/drawers/TeamsChannelSheet"
import TrialBanner from "@/components/dashboard/TrialBanner"

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
   logo_url?: string | null

  
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
  shareToken: string   
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
const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false)
const [memberToDelete, setMemberToDelete] = useState<{id: string, name: string} | null>(null)
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
const [outlookStatus, setOutlookStatus] = useState<{
  connected: boolean
  email?: string
}>({ connected: false })
const [oneDriveStatus, setOneDriveStatus] = useState<{
  connected: boolean
  email?: string
}>({ connected: false })
const [showOneDriveFilesDialog, setShowOneDriveFilesDialog] = useState(false)
const [oneDriveFiles, setOneDriveFiles] = useState<any[]>([])
const [loadingOneDriveFiles, setLoadingOneDriveFiles] = useState(false)
const [oneDriveSearchQuery, setOneDriveSearchQuery] = useState('')
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
const [autoOpenRequestId, setAutoOpenRequestId] = useState<string | null>(null)
const [selectedDriveFiles, setSelectedDriveFiles] = useState<Set<string>>(new Set())
const [selectedOneDriveFiles, setSelectedOneDriveFiles] = useState<Set<string>>(new Set())
const [teamsStatus, setTeamsStatus] = useState<{
  connected: boolean
  email?: string
  channelName?: string
  channelPicked?: boolean
}>({ connected: false })
const [showTeamsChannelPicker, setShowTeamsChannelPicker] = useState(false)
const [teamsChannels, setTeamsChannels] = useState<any[]>([])
const [loadingTeamsChannels, setLoadingTeamsChannels] = useState(false)
const [selectedTeamId, setSelectedTeamId] = useState('')
const [selectedChannelId, setSelectedChannelId] = useState('')
const [selectedTeamName, setSelectedTeamName] = useState('')
const [selectedChannelName, setSelectedChannelName] = useState('')
const [savingTeamsChannel, setSavingTeamsChannel] = useState(false)
const [showZapierSetupDialog, setShowZapierSetupDialog] = useState(false)
const [zapierApiKey, setZapierApiKey] = useState('')
const [loadingZapierKey, setLoadingZapierKey] = useState(false)
const [copiedZapierKey, setCopiedZapierKey] = useState(false)


// Returns true if the user's current plan includes the given integration.
// We check against the user state that is already loaded on dashboard mount.
const planIncludesDriveIntegrations = (userPlan: string | undefined): boolean => {
  return userPlan === 'pro' || userPlan === 'business'
}

// useEffects
useEffect(() => {
  fetch('/api/integrations/teams/status', { credentials: 'include' })
    .then(r => r.json()).then(setTeamsStatus).catch(() => {})
}, [])

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('integration') === 'teams' && params.get('status') === 'connected') {
    toast.success('Teams connected! Now pick a channel.')
    setShowTeamsChannelPicker(true)
    window.history.replaceState({}, '', '/dashboard')
    fetch('/api/integrations/status', { credentials: 'include' })
      .then(r => r.json())
      .then(setIntegrationStatus)
      .catch(() => {})
    fetchTeamsChannels()
  }
}, [])

// Handlers
const fetchTeamsChannels = async () => {
  setLoadingTeamsChannels(true)
  try {
    const res = await fetch('/api/integrations/teams/channels', { credentials: 'include' })
    const data = await res.json()
    if (res.ok) setTeamsChannels(data.teams || [])
    else toast.error(data.error || 'Failed to load channels')
  } catch { toast.error('Network error') }
  finally { setLoadingTeamsChannels(false) }
}

const handleConnectTeams = () => {
  window.location.href = '/api/integrations/teams/connect'
}

const handleSaveTeamsChannel = async () => {
  if (!selectedTeamId || !selectedChannelId) return
  setSavingTeamsChannel(true)
  const t = toast.loading('Saving channel...')
  try {
    const res = await fetch('/api/integrations/teams/select-channel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: selectedTeamId,
        channelId: selectedChannelId,
        teamName: selectedTeamName,
        channelName: selectedChannelName,
      })
    })
    if (res.ok) {
      toast.success('Teams channel saved!', { id: t })
      setTeamsStatus({
        connected: true,
        channelName: `${selectedTeamName} → ${selectedChannelName}`,
        channelPicked: true
      })
      setShowTeamsChannelPicker(false)
    } else {
      toast.error('Failed to save channel', { id: t })
    }
  } catch { toast.error('Network error', { id: t }) }
  finally { setSavingTeamsChannel(false) }
}


const handleDeleteAgreement = async (id: string) => {
  const loadingToast = toast.loading("Deleting agreement...")
  try {
    const res = await fetch(`/api/agreements/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (res.ok) {
      toast.success("Agreement deleted", { id: loadingToast })
      fetchUploadedAgreements()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to delete", { id: loadingToast })
    }
  } catch {
    toast.error("Network error", { id: loadingToast })
  }
}

const handleDisconnectTeams = async () => {
  const res = await fetch('/api/integrations/teams/disconnect', { method: 'POST', credentials: 'include' })
  if (res.ok) {
    toast.success('Teams disconnected')
    setTeamsStatus({ connected: false })
  }
}

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

   
  fetchIntegrationStatus()
}, [showIntegrationsDialog])



useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const page = params.get('page')
  const openRequest = params.get('openRequest')

  if (page === 'file-requests') {
    setActivePage('file-requests')

    // If a specific request ID is in the URL, the FileRequestsSection
    // needs to know to auto-open that drawer.
    // Store it in state so FileRequestsSection can pick it up.
    if (openRequest) {
      setAutoOpenRequestId(openRequest)
    }

    // Clean the URL so refreshing doesn't re-trigger
    window.history.replaceState({}, '', '/dashboard')
  }
}, [])

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


useEffect(() => {
  fetchOutlookStatus()
}, [])


useEffect(() => {
  fetchOneDriveStatus()
}, [])

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('integration') === 'onedrive' && params.get('status') === 'connected') {
    toast.success('OneDrive connected!', {
      description: 'You can now import files from OneDrive',
      duration: 5000,
    })
    window.history.replaceState({}, '', '/dashboard')
  }
}, [])

// Success toast after OAuth redirect
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('integration') === 'outlook' && params.get('status') === 'connected') {
    toast.success('Outlook connected!', {
      description: 'You can now send tracked emails',
      duration: 5000,
    })
    window.history.replaceState({}, '', '/dashboard')
  }
}, [])


const fetchOneDriveStatus = async () => {
  try {
    const res = await fetch('/api/integrations/onedrive/status', {
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setOneDriveStatus(data)
    }
  } catch (error) {
    console.error('Failed to fetch OneDrive status:', error)
  }
}

const handleConnectOneDrive = () => {
  // PLAN GATE: OneDrive is Pro/Business only
  if (!planIncludesDriveIntegrations(user?.plan)) {
    toast.error('OneDrive requires Pro or Business', {
      description: 'Upgrade your plan to connect OneDrive and import files directly.',
      duration: 6000,
      action: {
        label: 'See plans',
        onClick: () => router.push('/plan'),
      },
    })
    return
  }
 
  // Original behaviour — start the OneDrive OAuth flow
  window.location.href = '/api/integrations/onedrive/connect'
}

const handleDisconnectOneDrive = async () => {
  const confirmed = await new Promise((resolve) => {
    toast.warning('Disconnect OneDrive?', {
      description: 'You can reconnect anytime',
      duration: 10000,
      action: { label: 'Disconnect', onClick: () => resolve(true) },
      cancel: { label: 'Cancel', onClick: () => resolve(false) },
    })
  })
  if (!confirmed) return

  const loadingToast = toast.loading('Disconnecting...')
  try {
    const res = await fetch('/api/integrations/onedrive/disconnect', {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok) {
      toast.success('OneDrive disconnected', { id: loadingToast })
      setOneDriveStatus({ connected: false })
    } else {
      toast.error('Failed to disconnect', { id: loadingToast })
    }
  } catch {
    toast.error('Network error', { id: loadingToast })
  }
}

const handleBrowseOneDriveFiles = async () => {
  // PLAN GATE: Same check as connect
  if (!planIncludesDriveIntegrations(user?.plan)) {
    toast.error('OneDrive requires Pro or Business', {
      description: 'Upgrade your plan to import files from OneDrive.',
      duration: 6000,
      action: {
        label: 'See plans',
        onClick: () => router.push('/plan'),
      },
    })
    return
  }
 
  // Original behaviour unchanged below this line
  setLoadingOneDriveFiles(true)
 
  try {
    const res = await fetch('/api/integrations/onedrive/files', {
      credentials: 'include',
    })
    const data = await res.json()
 
    if (res.ok) {
      setOneDriveFiles(data.files || [])
      setShowOneDriveFilesDialog(true)
    } else {
      toast.error('Failed to load files', {
        description: data.error || 'Try reconnecting OneDrive',
      })
    }
  } catch (error) {
    toast.error('Network error')
  } finally {
    setLoadingOneDriveFiles(false)
  }
}

const handleImportOneDriveFile = async (fileId: string, fileName: string) => {
  const loadingToast = toast.loading(`Importing ${fileName}...`)
  try {
    const res = await fetch('/api/integrations/onedrive/import', {
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
      setShowOneDriveFilesDialog(false)
      fetchDocuments()
    } else {
      toast.error(data.error || 'Import failed', { id: loadingToast })
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast })
  }
}


// Fetch Outlook status
const fetchOutlookStatus = async () => {
  try {
    const res = await fetch('/api/integrations/outlook/status', {
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setOutlookStatus(data)
    }
  } catch (error) {
    console.error('Failed to fetch Outlook status:', error)
  }
}

const handleConnectOutlook = () => {
  window.location.href = '/api/integrations/outlook/connect'
}

const handleDisconnectOutlook = async () => {
  const confirmed = await new Promise((resolve) => {
    toast.warning('Disconnect Outlook?', {
      description: 'You can reconnect anytime',
      duration: 10000,
      action: { label: 'Disconnect', onClick: () => resolve(true) },
      cancel: { label: 'Cancel', onClick: () => resolve(false) },
    })
  })

  if (!confirmed) return

  const loadingToast = toast.loading('Disconnecting...')
  try {
    const res = await fetch('/api/integrations/outlook/disconnect', {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok) {
      toast.success('Outlook disconnected', { id: loadingToast })
      setOutlookStatus({ connected: false })
    } else {
      toast.error('Failed to disconnect', { id: loadingToast })
    }
  } catch {
    toast.error('Network error', { id: loadingToast })
  }
}


const handleDeleteFileRequest = async (id: string) => {
  const loadingToast = toast.loading('Deleting request...')
  try {
    const res = await fetch(`/api/file-requests/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok && data.success) {
      toast.success('File request deleted', { id: loadingToast })
      setFileRequests((prev) => prev.filter((r) => r._id !== id))
    } else {
      toast.error(data.error || 'Failed to delete', { id: loadingToast })
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast })
  }
}

// Add function to connect Google Drive
const handleConnectGoogleDrive = async () => {
  // PLAN GATE: Google Drive is Pro/Business only
  // Free and Starter users see an upgrade prompt instead of the OAuth flow
  if (!planIncludesDriveIntegrations(user?.plan)) {
    toast.error('Google Drive requires Pro or Business', {
      description: 'Upgrade your plan to connect Google Drive and import files directly.',
      duration: 6000,
      action: {
        label: 'See plans',
        onClick: () => router.push('/plan'),
      },
    })
    return
  }
 
  // Original behaviour — start the Google OAuth flow
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
  // PLAN GATE: Same check as connect — if they somehow have a connected Drive
  // but downgraded their plan, we still block browsing
  if (!planIncludesDriveIntegrations(user?.plan)) {
    toast.error('Google Drive requires Pro or Business', {
      description: 'Upgrade your plan to import files from Google Drive.',
      duration: 6000,
      action: {
        label: 'See plans',
        onClick: () => router.push('/plan'),
      },
    })
    return
  }
 
  // Original behaviour unchanged below this line
  setLoadingDriveFiles(true)
 
  try {
    const res = await fetch('/api/integrations/google-drive/files', {
      credentials: 'include',
    })
 
    const data = await res.json()
 
    if (res.ok) {
      setDriveFiles(data.files || [])
      setShowDriveFilesDialog(true)
    } else if (res.status === 401) {
      toast.error('Session expired', {
        description: 'Please reconnect Google Drive',
        action: {
          label: 'Reconnect',
          onClick: () => {
            handleDisconnectGoogleDrive()
            setTimeout(() => handleConnectGoogleDrive(), 500)
          },
        },
      })
    } else {
      toast.error('Failed to load files', {
        description: data.error || 'Try reconnecting Google Drive',
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
  const loadingToast = toast.loading(`Importing ${fileName}...`)
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
      })
      setShowDriveFilesDialog(false)
      setSelectedDriveFiles(new Set())
      fetchDocuments()
    } else {
      toast.error(data.error || 'Import failed', { id: loadingToast })
    }
  } catch {
    toast.error('Network error', { id: loadingToast })
  }
}

const handleImportMultipleOneDriveFiles = async () => {
  if (selectedOneDriveFiles.size === 0) return

  const filesToImport = oneDriveFiles.filter(f => selectedOneDriveFiles.has(f.id))
  const loadingToast = toast.loading(`Importing 0 of ${filesToImport.length} files...`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < filesToImport.length; i++) {
    const file = filesToImport[i]
    toast.loading(`Importing ${i + 1} of ${filesToImport.length} — ${file.name}`, {
      id: loadingToast,
    })

    try {
      const res = await fetch('/api/integrations/onedrive/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name })
      })
      const data = await res.json()
      if (res.ok) {
        successCount++
      } else {
        failCount++
        console.error(`Failed to import ${file.name}:`, data.error)
      }
    } catch {
      failCount++
      console.error(`Network error importing ${file.name}`)
    }
  }

  if (failCount === 0) {
    toast.success(`${successCount} file${successCount > 1 ? 's' : ''} imported!`, {
      id: loadingToast,
      description: 'All files are now in your library',
    })
  } else if (successCount === 0) {
    toast.error(`All ${failCount} imports failed`, { id: loadingToast })
  } else {
    toast.success(`${successCount} imported, ${failCount} failed`, { id: loadingToast })
  }

  setSelectedOneDriveFiles(new Set())
  setShowOneDriveFilesDialog(false)
  fetchDocuments()
}

const handleImportMultipleDriveFiles = async () => {
  if (selectedDriveFiles.size === 0) return

  const filesToImport = driveFiles.filter(f => selectedDriveFiles.has(f.id))
  const loadingToast = toast.loading(`Importing 0 of ${filesToImport.length} files...`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < filesToImport.length; i++) {
    const file = filesToImport[i]
    toast.loading(`Importing ${i + 1} of ${filesToImport.length} — ${file.name}`, {
      id: loadingToast,
    })

    try {
      const res = await fetch('/api/integrations/google-drive/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name })
      })
      const data = await res.json()
      if (res.ok) {
        successCount++
      } else {
        failCount++
        console.error(`Failed to import ${file.name}:`, data.error)
      }
    } catch {
      failCount++
      console.error(`Network error importing ${file.name}`)
    }
  }

  if (failCount === 0) {
    toast.success(`${successCount} file${successCount > 1 ? 's' : ''} imported!`, {
      id: loadingToast,
      description: 'All files are now in your library',
    })
  } else if (successCount === 0) {
    toast.error(`All ${failCount} imports failed`, { id: loadingToast })
  } else {
    toast.success(`${successCount} imported, ${failCount} failed`, { id: loadingToast })
  }

  setSelectedDriveFiles(new Set())
  setShowDriveFilesDialog(false)
  fetchDocuments()
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
      toast.success("✅ Slack disconnected", { duration: 5000 });
      setSlackStatus({ connected: false });
    } else {
      toast.error("❌ Failed to disconnect", { duration: 5000 });
    }
  } catch (error) {
    console.error("Disconnect error:", error);
    toast.error("❌ Failed to disconnect", { duration: 5000 });
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
    
    const data = await res.json(); // always parse it
    console.log("Slack channels response:", res.status, data); // 👈 see exact error
    
    if (res.ok) {
      setSlackChannels(data.channels || []);
    } else {
      toast.error(data.error || "Failed to load channels", {
        description: JSON.stringify(data.debug || "") // 👈 show debug info
      });
      setShowSlackChannelDialog(false);
    }
  } catch (error: any) {
    console.error("Failed to fetch channels:", error);
    toast.error("Network error", { description: error.message });
    setShowSlackChannelDialog(false);
  } finally {
    setLoadingSlackChannels(false);
  }
};

// Select Slack channel
const handleSelectSlackChannel = async (channelId: string, channelName: string) => {
  const loadingToast = toast.loading(`Setting #${channelName}...`);
  try {
    const res = await fetch("/api/integrations/slack/set-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ channelId, channelName }),
    });

    const data = await res.json();
    
    // This will show in a toast so you can see it in production
    if (res.ok) {
      toast.success(`Done! matched:${data.debug?.matchedCount} modified:${data.debug?.modifiedCount}`, { id: loadingToast });
      setSlackStatus(prev => ({ ...prev, channelName, channelId }));
      setShowSlackChannelDialog(false);
    } else {
      toast.error(`${data.error} — ${data.debug}`, { id: loadingToast, duration: 10000 });
    }
  } catch (error: any) {
    toast.error(`Network error: ${error.message}`, { id: loadingToast, duration: 10000 });
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
  // Show the dashboard right away — don't wait
  setIsAuthenticated(true)
  setLoading(false)

  // Verify in background — only redirect if actually invalid
  fetch('/api/auth/verify', { credentials: 'include' })
    .then(res => {
      if (!res.ok) router.push('/login')
    })
    .catch(() => router.push('/login'))
}, [router])

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

const handleRemoveMember = async (memberId: string, memberName: string) => {
  setMemberToDelete({ id: memberId, name: memberName })
  setShowDeleteMemberDialog(true)
}

const confirmRemoveMember = async () => {
  if (!memberToDelete) return
  
  setShowDeleteMemberDialog(false)
  const loadingToast = toast.loading('Removing member...')

  try {
    const res = await fetch(`/api/team/${memberToDelete.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      toast.success('Member removed', { id: loadingToast })
      fetchTeamMembers()
    } else {
      toast.error('Failed to remove member', { id: loadingToast })
    }
  } catch (error) {
    toast.error('Network error', { id: loadingToast })
  } finally {
    setMemberToDelete(null)
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
    toast.error('Please upload an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be less than 5MB');
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
     toast.error('Name and email are required')
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
       toast.success('Contact added!', { description: `${contactName} has been saved` })
      setShowAddContactDrawer(false)
      resetContactForm()
      fetchContacts()
    } else {
      const data = await res.json()
       toast.error(data.error || 'Failed to add contact')
    }
  } catch (error) {
    console.error('Add contact error:', error)
     toast.error('Network error', { description: 'Please check your connection' })
  }
}

 
const handleDeleteContact = async (contactId: string) => {
  toast.warning('Delete this contact?', {
    description: 'This action cannot be undone.',
    duration: 6000,
    action: {
      label: 'Delete',
      onClick: async () => {
        const loadingToast = toast.loading('Deleting contact...')
        try {
          const res = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (res.ok) {
            toast.success('Contact deleted', { id: loadingToast })
            fetchContacts()
          } else {
            toast.error('Failed to delete contact', { id: loadingToast })
          }
        } catch (error) {
          toast.error('Network error', { id: loadingToast })
        }
      },
    },
    cancel: {
      label: 'Cancel',
      onClick: () => {},
    },
  })
}

const resetContactForm = () => {
  setContactName('')
  setContactEmail('')
  setContactCompany('')
  setContactPhone('')
  setContactNotes('')
  setSelectedContact(null)
}





// Handle document sharing
const handleShareDocument = async () => {
  if (!selectedDocumentToShare || !shareEmails.trim()) {
    toast.error('Please enter at least one email address')
    return
  }

  const emails = shareEmails
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0)

  if (emails.length === 0) {
    toast.error('Please enter valid email addresses')
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
      toast.error(data.error || 'Failed to share document')
    }
  } catch (error) {
    console.error('Share error:', error)
    toast.error('Failed to share document. Please try again.')
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
    toast.error('Please enter a title')
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
    toast.error('Please enter at least one email address')
    return
  }

  // Validate all emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmails = emailList.filter(email => !emailRegex.test(email))
  
  if (invalidEmails.length > 0) {
    toast.error(`Invalid email(s): ${invalidEmails.join(', ')}`)
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
     toast.error('Name and email are required')
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
      toast.success('Contact updated successfully!')
      setShowEditContactDrawer(false)
      resetContactForm()
      fetchContacts()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed to update contact')
    }
  } catch (error) {
    console.error('Update contact error:', error)
    toast.error('Failed to update contact')
  }
}

// Agreements Section Component



// File Requests Section Component

// Templates Section Component
 
  const sidebarItems: Array<{ id: PageType; icon: any; label: string; badge: string | null }> = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'content-library', icon: Folder, label: 'Content library', badge: null },
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
    onClick: () => router.push('/documents-page'),
    //  Goes to documents page where user uploads and shares
  },
  {
    icon: BarChart3,
    title: "Track viewer analytics to see who engages with your file",
    description: "View analytics",
    color: "from-purple-500 to-purple-600",
    onClick: () => setActivePage('dashboard'),
    //  Switches to dashboard tab which renders DashboardOverview
  },
  {
    icon: FolderOpen,
    title: "Manage large projects and organize deals in one place",
    description: "Create a data room",
    color: "from-indigo-500 to-indigo-600",
    onClick: () => setActivePage('spaces'),
    //  Switches to spaces tab - stays inside dashboard
  },
  {
    icon: FileSignature,
    title: "Collect eSignatures on contracts and agreements",
    description: "Request signatures",
    color: "from-pink-500 to-pink-600",
    onClick: () => setActivePage('agreements'),
    //  Switches to agreements tab - stays inside dashboard
  },
  {
    icon: Inbox,
    title: "Safely receive files in one place with file requests",
    description: "Request files",
    color: "from-orange-500 to-orange-600",
    onClick: () => setActivePage('file-requests'),
    //  Switches to file-requests tab - stays inside dashboard
  },
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
          plan: data.user.profile.plan || "Free Plan",
          logo_url: data.user.profile.logoUrl || null,  
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
    handleMultipleFileUpload(Array.from(files))
  }
}

const handleMultipleFileUpload = async (files: File[]) => {
  // Filter only PDFs
  const pdfFiles = files.filter(f => f.type === 'application/pdf')
  const nonPdf = files.filter(f => f.type !== 'application/pdf')

  if (nonPdf.length > 0) {
    setUploadStatus('error')
    setUploadMessage(`${nonPdf.length} file(s) skipped — only PDF files are supported`)
    setTimeout(() => setUploadStatus('idle'), 3000)
    if (pdfFiles.length === 0) return
  }

  if (pdfFiles.length === 0) return

  // Single file — redirect to document page after upload
  if (pdfFiles.length === 1) {
    const file = pdfFiles[0]
    setUploadStatus('uploading')
    setUploadMessage(`Uploading ${file.name}...`)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
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
        setTimeout(() => { setUploadStatus('idle'); setUploadMessage('') }, 3000)
      } else {
        setUploadStatus('error')
        setUploadMessage(data.error || 'Upload failed')
        setTimeout(() => setUploadStatus('idle'), 3000)
      }
    } catch {
      setUploadStatus('error')
      setUploadMessage('Upload failed. Please try again.')
      setTimeout(() => setUploadStatus('idle'), 3000)
    }
    return
  }

  // Multiple files — upload all, stay on page
  setUploadStatus('uploading')
  setUploadMessage(`Uploading 0 of ${pdfFiles.length} files...`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i]
    setUploadMessage(`Uploading ${i + 1} of ${pdfFiles.length} — ${file.name}`)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        successCount++
      } else {
        failCount++
        console.error(`Failed to upload ${file.name}:`, data.error)
      }
    } catch {
      failCount++
      console.error(`Network error uploading ${file.name}`)
    }
  }

  // Final status
  if (failCount === 0) {
    setUploadStatus('success')
    setUploadMessage(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`)
  } else if (successCount === 0) {
    setUploadStatus('error')
    setUploadMessage(`All ${failCount} uploads failed. Please try again.`)
  } else {
    setUploadStatus('success')
    setUploadMessage(`${successCount} uploaded successfully, ${failCount} failed`)
  }

  fetchDocuments()
  setTimeout(() => { setUploadStatus('idle'); setUploadMessage('') }, 4000)
}

const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (files && files.length > 0) {
    handleMultipleFileUpload(Array.from(files))
  }
}

  // Render different content based on active page
  const renderContent = () => {
    switch (activePage) {
case 'dashboard':
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h1>
      
      {/*  Real-time tracking dashboard */}
      <DashboardOverview />
    </div>
  );
      case 'content-library':
        return (
          <div>
             {/*  PAGE-SPECIFIC TOOLTIP */}
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
          
        </div>
        <div>
          <p className="font-medium">Google Drive</p>
          <p className="text-xs text-green-600">✓ Connected</p>
        </div>
      </DropdownMenuItem>
    ) : (
      <DropdownMenuItem onClick={handleConnectGoogleDrive}>
        <div className="h-4 w-4 mr-2 flex items-center justify-center opacity-50">
          
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
        
      </div>
      <div>
        <p className="font-medium text-slate-400">Dropbox</p>
        <p className="text-xs text-slate-400">Coming soon</p>
      </div>
    </DropdownMenuItem>
    
    {/* OneDrive - PLACEHOLDER for future */}
    <DropdownMenuItem 
  onClick={() => oneDriveStatus.connected ? handleBrowseOneDriveFiles() : handleConnectOneDrive()}
>
  <div className="h-4 w-4 mr-2 flex items-center justify-center">
    
  </div>
  <div>
    <p className="font-medium">OneDrive</p>
    <p className="text-xs text-green-600">{oneDriveStatus.connected ? '✓ Connected' : 'Connect to import'}</p>
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
  multiple
  onChange={handleFileInputChange}
  className="hidden"
/>
</div>

            <div className="mb-8">
               
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
  return (
    <div className="p-6">
      <SpacesView />
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
      <PageInfoTooltip
        pageId="agreements"
        message="Require viewers to sign an NDA before accessing your content. Track signatures and send reminders automatically."
        position="top"
      />
      <AgreementsSection
        agreements={agreements}
        uploadedAgreementsList={uploadedAgreementsList}
        user={user}
        onUploadClick={() => setShowUploadAgreementDialog(true)}
        onDeleteAgreement={handleDeleteAgreement}
        fetchUploadedAgreements={fetchUploadedAgreements}
      />
    </div>
  )
     

  case 'file-requests':
  return (
    <div>
      <PageInfoTooltip
        pageId="file-requests"
        message="Create file requests to collect documents from viewers. Set deadlines, track submissions, and manage access permissions."
        position="top"
      />
      <FileRequestsSection
        fileRequests={fileRequests}
        onCreateClick={() => setShowCreateFileRequestDialog(true)}
        onDeleteRequest={handleDeleteFileRequest}
      />
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
        <div className=" p-12 text-center">
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
        <div className=" overflow-hidden">
          {/* Table Header */}
          <div className=" border-b px-6 py-3 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-700">
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
<TopNav
  user={user}
  unreadCount={unreadCount}
  onOpenMobileMenu={() => setMobileMenuOpen(true)}
  onOpenMobileSearch={() => setMobileSearchOpen(true)}
  onOpenNotifications={() => setNotificationsOpen(true)}
  onOpenSettings={() => setShowSettingsDialog(true)}
  onOpenTeam={() => setShowTeamDrawer(true)}
  onOpenBilling={() => setShowBillingDialog(true)}
  onOpenResources={() => setShowResourcesDialog(true)}
  onOpenHelp={() => setShowHelpDialog(true)}
  onOpenFeedback={() => setShowFeedbackDialog(true)}
  onOpenIntegrations={() => setShowIntegrationsDialog(true)}
  onOpenContact={() => setShowContactDialog(true)}
  onOpenMobileProfile={() => setShowMobileProfileDrawer(true)}
  onLogout={handleLogout}
/>

     <MobileSidebar
  menuOpen={mobileMenuOpen}
  onMenuClose={() => setMobileMenuOpen(false)}
  searchOpen={mobileSearchOpen}
  onSearchClose={() => setMobileSearchOpen(false)}
  user={user}
  activePage={activePage}
  onNavigate={(page) => { setActivePage(page); setMobileMenuOpen(false) }}
  onOpenSettings={() => setShowSettingsDialog(true)}
  onLogout={handleLogout}
/>

<TrialBanner />
       <div className="flex min-h-[calc(100vh-64px)]"> 
        {/* Sidebar with clickable links */}
  <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      {/* Settings Dialog */}
<SettingsDrawer
  open={showSettingsDialog}
  onClose={() => setShowSettingsDialog(false)}
  user={user}
  uploadingAvatar={uploadingAvatar}
  notificationPreferences={notificationPreferences}
  showCurrentPassword={showCurrentPassword}
  showNewPassword={showNewPassword}
  showConfirmPassword={showConfirmPassword}
  onToggleCurrentPw={() => setShowCurrentPassword(p => !p)}
  onToggleNewPw={() => setShowNewPassword(p => !p)}
  onToggleConfirmPw={() => setShowConfirmPassword(p => !p)}
  onAvatarUpload={handleAvatarUpload}
  onRemoveAvatar={async () => {
    const res = await fetch("/api/user/avatar", { method: "DELETE", credentials: "include" })
    if (res.ok) setUser(prev => prev ? { ...prev, profile_image: null } : null)
  }}
  onSaveProfile={handleSaveProfileChanges}
  onPasswordChange={handlePasswordChange}
  onUpdatePreferences={updatePreferences}
  onSetPreferences={setNotificationPreferences}
/>
 


<TeamDrawer
  open={showTeamDrawer}
  onClose={() => setShowTeamDrawer(false)}
  user={user}
  teamMembers={teamMembers}
  loadingTeam={loadingTeam}
  inviteEmail={inviteEmail}
  inviteRole={inviteRole}
  generatedInviteLink={generatedInviteLink}
  showInviteLinkDialog={showInviteLinkDialog}
  showDeleteMemberDialog={showDeleteMemberDialog}
  memberToDelete={memberToDelete}
  onSetInviteEmail={setInviteEmail}
  onSetInviteRole={setInviteRole}
  onInviteMember={handleInviteMember}
  onRemoveMember={handleRemoveMember}
  onConfirmRemoveMember={confirmRemoveMember}
  onUpdateRole={handleUpdateRole}
  onSetShowInviteLinkDialog={setShowInviteLinkDialog}
  onSetShowDeleteMemberDialog={setShowDeleteMemberDialog}
  onSetMemberToDelete={setMemberToDelete}
  onSetGeneratedInviteLink={setGeneratedInviteLink}
/>

{/* Invite Link Dialog */}
<InviteLinkDialog
  open={showInviteLinkDialog}
  onClose={() => setShowInviteLinkDialog(false)}
  inviteLink={generatedInviteLink}
  inviteEmail={inviteEmail}
/>

{/* Delete Member Confirmation Dialog */}
<DeleteMemberDialog
  open={showDeleteMemberDialog}
  onClose={() => { setShowDeleteMemberDialog(false); setMemberToDelete(null) }}
  memberName={memberToDelete?.name ?? ''}
  onConfirm={confirmRemoveMember}
/>

{/* Resources Drawer */}
 <ResourcesDrawer
  open={showResourcesDialog}
  onClose={() => setShowResourcesDialog(false)}
/>

{/* Help Drawer - UPDATED WITH EMAIL INTEGRATION */}
<HelpDrawer
  open={showHelpDialog}
  onClose={() => setShowHelpDialog(false)}
  onOpenContact={() => setShowContactDialog(true)}
  onOpenDemo={() => setShowDemoDialog(true)}
/>

{/* UPDATED: Integrations Drawer */}
 <IntegrationsDrawer
  open={showIntegrationsDialog}
  onClose={() => setShowIntegrationsDialog(false)}
  integrationStatus={integrationStatus}
  slackStatus={slackStatus}
  gmailStatus={gmailStatus}
  outlookStatus={outlookStatus}
  oneDriveStatus={oneDriveStatus}
  hubspotStatus={hubspotStatus}
  teamsStatus={teamsStatus}
  onConnectGoogleDrive={handleConnectGoogleDrive}
  onDisconnectGoogleDrive={handleDisconnectGoogleDrive}
  onBrowseDriveFiles={handleBrowseDriveFiles}
  onConnectOneDrive={handleConnectOneDrive}
  onDisconnectOneDrive={handleDisconnectOneDrive}
  onBrowseOneDriveFiles={handleBrowseOneDriveFiles}
  onConnectSlack={handleConnectSlack}
  onDisconnectSlack={handleDisconnectSlack}
  onBrowseSlackChannels={handleBrowseSlackChannels}
  onConnectGmail={handleConnectGmail}
  onDisconnectGmail={handleDisconnectGmail}
  onConnectOutlook={handleConnectOutlook}
  onDisconnectOutlook={handleDisconnectOutlook}
  onConnectHubSpot={handleConnectHubSpot}
  onDisconnectHubSpot={handleDisconnectHubSpot}
  onBrowseHubSpotContacts={handleBrowseHubSpotContacts}
  onSyncHubSpotContacts={handleSyncHubSpotContacts}
  onConnectTeams={handleConnectTeams}
  onDisconnectTeams={handleDisconnectTeams}
  onOpenTeamsChannelPicker={() => setShowTeamsChannelPicker(true)}
  fetchTeamsChannels={fetchTeamsChannels}
  onOpenZapierSetup={() => setShowZapierSetupDialog(true)}
  onOpenIntegrationRequest={() => setShowIntegrationRequestDialog(true)}
/>

  {/* Google Drive Files Dialog */}
<DriveFilesDrawer
  open={showDriveFilesDialog}
  onClose={() => { setShowDriveFilesDialog(false); setSelectedDriveFiles(new Set()) }}
  files={driveFiles}
  loading={loadingDriveFiles}
  searchQuery={driveSearchQuery}
  onSearchChange={setDriveSearchQuery}
  selectedFiles={selectedDriveFiles}
  onToggleFile={(id) => setSelectedDriveFiles(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
  onImportSelected={handleImportMultipleDriveFiles}
  onDisconnect={handleDisconnectGoogleDrive}
  connectedEmail={integrationStatus.google_drive?.email}
/>
{/* Billing Drawer */}
<BillingDrawer
  open={showBillingDialog}
  onClose={() => setShowBillingDialog(false)}
  user={user}
  documents={documents}
  onUpgrade={() => router.push('/plan')}
/>

<FeedbackDrawer
  open={showFeedbackDialog}
  onClose={() => setShowFeedbackDialog(false)}
  feedbackText={feedbackText}
  onSetFeedback={setFeedbackText}
  onSubmit={handleFeedbackSubmit}
  userEmail={user?.email}
/>

<ContactDrawer
  open={showContactDialog}
  onClose={() => setShowContactDialog(false)}
  user={user}
  supportSubject={supportSubject}
  supportMessage={supportMessage}
  onSetSubject={setSupportSubject}
  onSetMessage={setSupportMessage}
/>

{/* Earn Credit Dialog */}
<EarnCreditDialog
  open={showEarnCreditDialog}
  onClose={() => setShowEarnCreditDialog(false)}
  userEmail={user?.email}
/>

<UploadAgreementSheet
  open={showUploadAgreementDialog}
  onClose={() => setShowUploadAgreementDialog(false)}
  integrationStatus={integrationStatus}
  onConnectGoogleDrive={handleConnectGoogleDrive}
  onBrowseDriveFiles={handleBrowseDriveFiles}
  onAgreementUploaded={fetchUploadedAgreements}
  onNavigateToAgreements={() => setActivePage('agreements')}
/>

{/* Mobile Profile Drawer */}
<MobileProfileDrawer
  open={showMobileProfileDrawer}
  onClose={() => setShowMobileProfileDrawer(false)}
  user={user}
  unreadCount={unreadCount}
  onOpenNotifications={() => setNotificationsOpen(true)}
  onOpenSettings={() => setShowSettingsDialog(true)}
  onOpenTeam={() => setShowTeamDrawer(true)}
  onOpenBilling={() => setShowBillingDialog(true)}
  onOpenResources={() => setShowResourcesDialog(true)}
  onOpenHelp={() => setShowHelpDialog(true)}
  onOpenFeedback={() => setShowFeedbackDialog(true)}
  onOpenIntegrations={() => setShowIntegrationsDialog(true)}
  onOpenContact={() => setShowContactDialog(true)}
  onLogout={handleLogout}
  onUpgrade={() => router.push("/plan")}
/>


<CreateFileRequestSheet
  open={showCreateFileRequestDialog}
  onClose={() => setShowCreateFileRequestDialog(false)}
  title={fileRequestTitle}
  description={fileRequestDescription}
  recipient={fileRequestRecipient}
  recipients={fileRequestRecipients}
  dueDate={fileRequestDueDate}
  expectedFiles={fileRequestExpectedFiles}
  onSetTitle={setFileRequestTitle}
  onSetDescription={setFileRequestDescription}
  onSetRecipient={setFileRequestRecipient}
  onSetRecipients={setFileRequestRecipients}
  onSetDueDate={setFileRequestDueDate}
  onSetExpectedFiles={setFileRequestExpectedFiles}
  onSubmit={handleCreateFileRequest}
  onReset={() => {
    setFileRequestTitle('')
    setFileRequestDescription('')
    setFileRequestRecipient('')
    setFileRequestRecipients('')
    setFileRequestDueDate('')
    setFileRequestExpectedFiles(1)
  }}
/>

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
<ShareDocumentDialog
  open={showShareDialog}
  onClose={() => setShowShareDialog(false)}
  emails={shareEmails}
  message={shareMessage}
  permissions={sharePermissions}
  onSetEmails={setShareEmails}
  onSetMessage={setShareMessage}
  onSetPermissions={setSharePermissions}
  onSubmit={handleShareDocument}
/>

{/* Signature Link Dialog */}
<SignatureLinkDialog
  open={showSignatureLinkDialog}
  onClose={() => setShowSignatureLinkDialog(false)}
  signatureLink={generatedSignatureLink}
  signers={agreementSigners}
  onViewAgreements={() => setActivePage('agreements')}
/>

{/* 🟢 BULK FILE REQUEST LINKS DIALOG */}
<BulkFileRequestLinksDialog
  open={showBulkFileRequestLinksDialog}
  onClose={() => setShowBulkFileRequestLinksDialog(false)}
  requests={createdFileRequests}
/>

{/*  ADD CONTACT DRAWER */}
<AddContactSheet
  open={showAddContactDrawer}
  onClose={() => setShowAddContactDrawer(false)}
  name={contactName}
  email={contactEmail}
  company={contactCompany}
  phone={contactPhone}
  notes={contactNotes}
  onSetName={setContactName}
  onSetEmail={setContactEmail}
  onSetCompany={setContactCompany}
  onSetPhone={setContactPhone}
  onSetNotes={setContactNotes}
  onSubmit={handleAddContact}
  onReset={resetContactForm}
/>

{/*  EDIT CONTACT DRAWER */}
<EditContactSheet
  open={showEditContactDrawer}
  onClose={() => setShowEditContactDrawer(false)}
  name={contactName}
  email={contactEmail}
  company={contactCompany}
  phone={contactPhone}
  notes={contactNotes}
  onSetName={setContactName}
  onSetEmail={setContactEmail}
  onSetCompany={setContactCompany}
  onSetPhone={setContactPhone}
  onSetNotes={setContactNotes}
  onSubmit={handleUpdateContact}
  onReset={resetContactForm}
/>

<NotificationsDrawer
  open={notificationsOpen}
  onClose={() => setNotificationsOpen(false)}
  notifications={notifications}
  unreadCount={unreadCount}
  onMarkAllRead={() => markAsRead()}
  onMarkRead={(id) => markAsRead(id)}
  onRefresh={fetchNotifications}
/>

{/* Demo Booking Dialog */}

       <DemoDialog
  open={showDemoDialog}
  onClose={() => setShowDemoDialog(false)}
  user={user}
/>

{/* Slack Channel Selection Drawer */}
<SlackChannelDrawer
  open={showSlackChannelDialog}
  onClose={() => setShowSlackChannelDialog(false)}
  channels={slackChannels}
  loading={loadingSlackChannels}
  slackStatus={slackStatus}
  onSelectChannel={handleSelectSlackChannel}
/>


{/* HubSpot Contacts Drawer */}
<HubSpotContactsDrawer
  open={showHubSpotContactsDialog}
  onClose={() => setShowHubSpotContactsDialog(false)}
  contacts={hubspotContacts}
  loading={loadingHubSpotContacts}
  portalId={hubspotStatus.portalId}
  onSyncContacts={handleSyncHubSpotContacts}
/>

{/* Gmail Send Email Dialog */}
<GmailSendDialog
  open={showGmailSendDialog}
  onClose={() => setShowGmailSendDialog(false)}
  recipients={gmailRecipients}
  subject={gmailSubject}
  message={gmailMessage}
  onSetRecipients={setGmailRecipients}
  onSetSubject={setGmailSubject}
  onSetMessage={setGmailMessage}
  onSubmit={handleSendViaGmail}
/>

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

{/* OneDrive Files Drawer */}
<OneDriveFilesDrawer
  open={showOneDriveFilesDialog}
  onClose={() => { setShowOneDriveFilesDialog(false); setSelectedOneDriveFiles(new Set()) }}
  files={oneDriveFiles}
  loading={loadingOneDriveFiles}
  searchQuery={oneDriveSearchQuery}
  onSearchChange={setOneDriveSearchQuery}
  selectedFiles={selectedOneDriveFiles}
  onToggleFile={(id) => setSelectedOneDriveFiles(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
  onImportSelected={handleImportMultipleOneDriveFiles}
  onDisconnect={handleDisconnectOneDrive}
  connectedEmail={oneDriveStatus.email}
/>

{/* Channel Picker Dialog */}
<TeamsChannelSheet
  open={showTeamsChannelPicker}
  onClose={() => setShowTeamsChannelPicker(false)}
  teams={teamsChannels}
  loading={loadingTeamsChannels}
  saving={savingTeamsChannel}
  selectedTeamId={selectedTeamId}
  selectedChannelId={selectedChannelId}
  selectedTeamName={selectedTeamName}
  selectedChannelName={selectedChannelName}
  onSelectChannel={(teamId, channelId, teamName, channelName) => {
    setSelectedTeamId(teamId)
    setSelectedChannelId(channelId)
    setSelectedTeamName(teamName)
    setSelectedChannelName(channelName)
  }}
  onSave={handleSaveTeamsChannel}
  onRetry={fetchTeamsChannels}
/>



{/* Zapier Setup Dialog */}
    <ZapierSetupDialog
  open={showZapierSetupDialog}
  onClose={() => setShowZapierSetupDialog(false)}
/>   </div>
  )
}