"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import DashboardOverview from '@/components/DashboardOverview';
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

      {/* 🟢 SHOW TOTAL COUNT */}
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
          {/* 🟢 LOOP THROUGH ALL REQUESTS */}
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
          company_name: data.user.profile.companyName || "My Team",
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
    <Button  onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-2">Upload PDF</Button>
  </div>
</div>
                  </div>
                  </div>
              </div>
            </div>

            <div>
              
              <h2 className="text-xl font-semibold text-slate-900 mb-6">5 ways to get the most out of DocMetrics</h2>
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
  return <AgreementsSection />

     case 'file-requests':
  return <FileRequestsSection />
  

   case 'contacts':
  return (
    <div>
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
  className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden`}
>
  {user?.profile_image ? (
    <Image
      src={user.profile_image}
      alt="Profile"
      width={40}
      height={40}
      className="rounded-full object-cover w-full h-full"
      key={user.profile_image} // ✅ Forces re-render on URL change
      unoptimized // ✅ Prevents Next.js caching issues
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
  className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden`}
>
  {user?.profile_image ? (
    <Image
      src={user.profile_image}
      alt="Profile"
      width={40}
      height={40}
      className="rounded-full object-cover w-full h-full"
      key={user.profile_image}
      unoptimized
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
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
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
                      <div className={`h-28 w-28 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email || "")} flex items-center justify-center text-white font-bold text-4xl shadow-lg overflow-hidden ring-4 ring-slate-100`}>
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

{/* Team Drawer */}
{/* Team Drawer - IMPROVED WIDTH & STYLING */}
<Sheet open={showTeamDrawer} onOpenChange={setShowTeamDrawer}>
  <SheetContent 
    side="right" 
    className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col bg-white overflow-hidden"
  >
    {/* Header */}
    <SheetHeader className="px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
      <SheetTitle className="text-2xl font-bold">Team Members</SheetTitle>
      <SheetDescription className="text-base mt-1">
        Invite colleagues and manage team permissions
      </SheetDescription>
    </SheetHeader>

    {/* Content */}
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 space-y-6">
        {/* IMPROVED Invite Section */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
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
          
          {/* Role Descriptions */}
          <div className="bg-white/80 backdrop-blur border border-purple-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-900 mb-2">Role Permissions:</p>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-purple-900">Admin</p>
                  <p className="text-slate-600">Full access + team management</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Member</p>
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


 
    </div>
  )
}

 
// Remove this entire function - it's a duplicate and not needed

