"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer } from "@/components/ui/drawer"
import { motion } from "framer-motion"
import { toast } from 'sonner'
import { ShareSpaceDrawer } from "@/components/ShareSpaceDrawer"
 import { PermissionsTab } from "./components/PermissionsTab"
 import { AuditLogTab } from "./components/AuditLogTab"
import { AnalyticsTab } from "./components/AnalyticsTab"
import { QATab } from "./components/QATab"
import { MembersTab } from "./components/MembersTab"
import { TrashTab } from "./components/TrashTab"
import { FoldersTab } from "./components/FoldersTab"
import { DocumentsTable } from "./components/DocumentsTable"

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  AlertCircle,
  Archive,
  Loader2,
  ShieldCheck,
  Key,
  Mail,
  X,
  Calendar,
  Copy,
  FileSignature,
  Package,
  MessageSquare, RefreshCw, 
  Send,
  ChevronDown,
  Target,
  Inbox
} from "lucide-react"
import { useSearchParams } from 'next/navigation'
import { Switch } from "@radix-ui/react-switch"
import PageInfoTooltip from "@/components/PageInfoTooltip"
import { DiligenceTab } from "./components/DiligenceTab"
import { RequestFilesDrawer } from "@/components/RequestFilesDrawer"
import { PdfViewerDrawer } from "@/components/PdfViewerDrawer"

// Role Badge Component
const RoleBadge = ({ role }: { role: string }) => {
  const roleConfig = {
    owner: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-300',
      icon: '👑',
      label: 'Owner'
    },
    admin: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: '⚡',
      label: 'Admin'
    },
    editor: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: '✏️',
      label: 'Editor'
    },
    viewer: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: '👁️',
      label: 'Viewer'
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-semibold`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

// Permission descriptions for tooltip
const PermissionTooltip = ({ role }: { role: string }) => {
  const permissions = {
    owner: ['Full control', 'Manage members', 'Delete space', 'All editor permissions'],
    admin: ['Manage members', 'Delete files/folders', 'All editor permissions'],
    editor: ['Upload files', 'Create folders', 'Rename & move files', 'View & download'],
    viewer: ['View documents', 'Download files', 'Read-only access']
  };

  const rolePermissions = permissions[role as keyof typeof permissions] || permissions.viewer;

  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs">
      <p className="font-semibold mb-2">Your permissions:</p>
      <ul className="space-y-1">
        {rolePermissions.map((permission, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>{permission}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

type FolderType = {
  id: string
  name: string
  documentCount: number
  parentId: string | null
  lastUpdated: string
}

type DocumentType = {
  id: string
  name: string
  type: string
  size: string
  views: number
  expiresAt?: string | null
  originalFilename: string
  downloads: number
  lastUpdated: string
  folderId: string | null
  folder: string
  cloudinaryPdfUrl: string 
  canDownload?: boolean
  signatureRequestId?: string | null
  signatureStatus?: 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'pending'        
  | 'completed'      
  | null
  | undefined

}

// ── Types ─────────────────────────────────────────────────────────────────────
type AuditEvent = {
  id: string
  category: 'documents' | 'members' | 'links' | 'visitors' | 'settings'
  event: string
  actor: string | null
  actorType: 'owner' | 'visitor'
  target: string | null
  detail: string
  icon: string
  timestamp: string
  ipAddress: string | null
  shareLink: string | null
  documentName: string | null
  documentId: string | null
  meta: Record<string, any>
}

type AuditSummary = {
  total: number
  documents: number
  members: number
  links: number
  visitors: number
  settings: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// used the same one as in analytics

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const CATEGORY_CONFIG = {
  all: {
    label: 'All Activity',
    icon: Activity,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200'
  },
  documents: {
    label: 'Documents',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  members: {
    label: 'Members',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  links: {
    label: 'Share Links',
    icon: Share2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  visitors: {
    label: 'Visitors',
    icon: Eye,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
}

// ── Main Component ────────────────────────────────────────────────────────────
 
// ─────────────────────────────────────────────────────────────────────────────
//  AnalyticsTab-component.tsx
// 
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────
type ShareLinkStat = {
  shareLink: string
  label: string | null
  securityLevel: string
  createdAt: string | null
  expiresAt: string | null
  isExpired: boolean
  enabled: boolean
  visits: number
  visitors: number
  downloads: number
  docsVisited: number
  totalDocs: number
  lastActivity: string | null
  heatScore: number
  status: 'hot' | 'warm' | 'cold' | 'never'
  publicUrl: string
}

type AnalyticsData = {
  overview: {
    totalViews: number
    totalDownloads: number
    uniqueVisitors: number
    totalEvents: number
    lastActivity: string | null
    dealHeatScore: number
    totalShareLinks: number
  }
  shareLinks: ShareLinkStat[]
  visitors: Array<{
    email: string
    totalEvents: number
    docsViewed: number
    downloads: number
    firstSeen: string
    lastSeen: string
    engagementScore: number
    status: 'hot' | 'warm' | 'cold' | 'new'
  }>
  documents: Array<{
    documentId: string
    documentName: string
    views: number
    downloads: number
    uniqueViewers: number
    lastViewed: string | null
  }>
  timeline: Array<{
    id: string
    email: string
    event: string
    documentName: string | null
    documentId: string | null
    timestamp: string
    ipAddress: string | null
    shareLink: string | null
  }>
  dailyVisits: Array<{
    date: string
    count: number
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  
}

function eventLabel(event: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    'document_view':  { label: 'Viewed document',  color: 'text-blue-600 bg-blue-50'     },
    'view':           { label: 'Viewed document',  color: 'text-blue-600 bg-blue-50'     },
    'download':       { label: 'Downloaded',       color: 'text-green-600 bg-green-50'   },
    'space_open':     { label: 'Opened doc',       color: 'text-purple-600 bg-purple-50' },
    'portal_enter':   { label: 'Opened doc',       color: 'text-purple-600 bg-purple-50' },
    'question_asked': { label: 'Asked a question', color: 'text-orange-600 bg-orange-50' },
    'nda_signed':     { label: 'Signed NDA',       color: 'text-green-700 bg-green-100'  },
    'revisit':        { label: 'Revisited',        color: 'text-indigo-600 bg-indigo-50' },
  }
  return map[event] || { label: event, color: 'text-slate-600 bg-slate-100' }
}

function securityIcon(level: string) {
  if (level === 'whitelist') return { label: 'Whitelist', color: 'text-purple-700 bg-purple-50' }
  if (level === 'password')  return { label: 'Password',  color: 'text-blue-700 bg-blue-50' }
  return { label: 'Open', color: 'text-slate-600 bg-slate-100' }
}

// ── Main Component ────────────────────────────────────────────────────────────

// ADD this helper function above SpaceDetailPage:
function OwnerFolderTree({
  folders,
  parentId = null,
  depth = 0,
  selectedFolder,
  onSelect,
}: {
  folders: FolderType[]
  parentId: string | null
  depth: number
  selectedFolder: string | null
  onSelect: (id: string) => void
}) {
  const children = folders.filter(f => (f.parentId || null) === parentId)
  if (children.length === 0) return null

  return (
    <>
      {children.map(folder => {
        const hasChildren = folders.some(f => f.parentId === folder.id)
        const isSelected = selectedFolder === folder.id
        return (
          <div key={folder.id}>
            <button
              onClick={() => onSelect(folder.id)}
              className={`w-full flex items-center gap-2 py-1.5 pr-3 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
            >
              <Folder className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-purple-500' : 'text-blue-400'}`} />
              <span className="truncate flex-1 text-left">{folder.name}</span>
              {folder.documentCount > 0 && (
                <span className="text-xs text-slate-400 flex-shrink-0">{folder.documentCount}</span>
              )}
            </button>
            {/* Render children recursively — capped at depth 3 */}
            {hasChildren && depth < 3 && (
              <OwnerFolderTree
                folders={folders}
                parentId={folder.id}
                depth={depth + 1}
                selectedFolder={selectedFolder}
                onSelect={onSelect}
              />
            )}
          </div>
        )
      })}
    </>
  )
}


function SidebarContent({
  activeTab,
  setActiveTab,
  selectedFolder,
  setSelectedFolder,
  setShowUnfiledOnly,
  folders,
  qaComments,
  fetchQAComments,
  trashedDocuments,
  fetchTrashedDocuments,
  canManageSpace,
  setShowCreateFolderDialog,
  setShowSettingsDialog,
  params,
  plan,
}: {
  activeTab: string
  setActiveTab: (tab: any) => void
  selectedFolder: string | null
  setSelectedFolder: (id: string | null) => void
  setShowUnfiledOnly: (v: boolean) => void
  folders: FolderType[]
  qaComments: any[]
  fetchQAComments: () => void
  trashedDocuments: any[]
  fetchTrashedDocuments: () => void
  canManageSpace: boolean
  setShowCreateFolderDialog: (v: boolean) => void
  setShowSettingsDialog: (v: boolean) => void
  params: any
  plan?: string
}) {
  return (
    <>
      {/* Main Nav */}
      <div className="p-4 space-y-1">
        <button
          onClick={() => { setActiveTab('home'); setSelectedFolder(null) }}
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
        {plan === 'free' ? (
          <div className="relative group/nav">
            <button disabled className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-300 cursor-not-allowed select-none">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
              <Lock className="h-3 w-3 ml-auto" />
            </button>
            <div className="absolute left-full top-0 ml-2 z-[999] hidden group-hover/nav:block w-56 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none">
              <p className="font-semibold text-white mb-1">Starter+ feature</p>
              <p className="text-slate-300 leading-relaxed">Full visitor analytics, page heatmaps, and engagement scores require a paid plan.</p>
              <a href="/plan" className="mt-2 flex items-center gap-1 text-sky-400 font-semibold">⚡ Upgrade to Starter</a>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'analytics' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
        )}

        {/* Diligence */}
        {plan === 'free' ? (
          <div className="relative group/nav">
            <button disabled className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-300 cursor-not-allowed select-none">
              <Target className="h-4 w-4" />
              <span>Diligence</span>
              <Lock className="h-3 w-3 ml-auto" />
            </button>
            <div className="absolute left-full top-0 ml-2 z-[999] hidden group-hover/nav:block w-56 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none">
              <p className="font-semibold text-white mb-1">Starter+ feature</p>
              <p className="text-slate-300 leading-relaxed">Track exactly how long each investor spends on every document. Requires a paid plan.</p>
              <a href="/plan" className="mt-2 flex items-center gap-1 text-sky-400 font-semibold">⚡ Upgrade to Starter</a>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('diligence')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'diligence' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Diligence</span>
          </button>
        )}

        <button
          onClick={() => { setActiveTab('qa'); fetchQAComments() }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'qa'
              ? 'bg-purple-50 text-purple-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Q&amp;A</span>
          {qaComments.filter((c) => !c.reply).length > 0 && (
            <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {qaComments.filter((c) => !c.reply).length}
            </span>
          )}
        </button>

        {/* Audit Log */}
        {(plan === 'free' || plan === 'starter') ? (
          <div className="relative group/nav">
            <button disabled className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-slate-300 cursor-not-allowed select-none">
              <FileText className="h-4 w-4" />
              <span>Audit Log</span>
              <Lock className="h-3 w-3 ml-auto" />
            </button>
            <div className="absolute left-full top-0 ml-2 z-[999] hidden group-hover/nav:block w-56 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none">
              <p className="font-semibold text-white mb-1">Pro+ feature</p>
              <p className="text-slate-300 leading-relaxed">Full audit logs with complete activity history require Pro or Business plan.</p>
              <a href="/plan" className="mt-2 flex items-center gap-1 text-sky-400 font-semibold">⚡ Upgrade to Pro</a>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'audit' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Audit Log</span>
          </button>
        )}
        <button
  onClick={() => setActiveTab('permissions')}
  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
    activeTab === 'permissions'
      ? 'bg-purple-50 text-purple-700'
      : 'text-slate-700 hover:bg-slate-50'
  }`}
>
  <Lock className="h-4 w-4" />
  <span>Permissions</span>
</button>
      </div>

      {/* Folders Section */}
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
          <button
            onClick={() => { setActiveTab('folders'); setSelectedFolder(null) }}
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

          <OwnerFolderTree
            folders={folders}
            parentId={null}
            depth={0}
            selectedFolder={selectedFolder}
            onSelect={(id) => {
              setSelectedFolder(id)
              setShowUnfiledOnly(false)
              setActiveTab('home')
            }}
          />
        </div>
      </div>

      {/* Settings */}
      {canManageSpace && (
        <div className="p-4 border-t">
          <button
            onClick={() => setShowSettingsDialog(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Space Settings</span>
          </button>
          
        </div>
      )}

      {/* Trash */}
      <div className="p-4 border-t">
        <button
          onClick={() => { setActiveTab('trash'); fetchTrashedDocuments() }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'trash'
              ? 'bg-red-50 text-red-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Trash2 className="h-4 w-4" />
          <span>Trash</span>
          <span className="ml-auto text-xs">({trashedDocuments.length})</span>
        </button>
      </div>
    </>
  )
}


export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'home' | 'folders'  | 'qa' | 'trash' | 'analytics' | 'audit' | 'diligence' | 'members' | 'permissions'>('home')
  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders')
  const [searchQuery, setSearchQuery] = useState("")
  const [spaceName, setSpaceName] = useState(space?.name || '')
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
const [showExpiryDialog, setShowExpiryDialog] = useState(false)
const [expiryDateInput, setExpiryDateInput] = useState('')
const [searchResults, setSearchResults] = useState<DocumentType[]>([])
const [showRenameDialog, setShowRenameDialog] = useState(false)
const [showMoveDialog, setShowMoveDialog] = useState(false)
const [selectedFile, setSelectedFile] = useState<DocumentType | null>(null)
const [newFilename, setNewFilename] = useState('')
const [showPdfDrawer, setShowPdfDrawer] = useState(false)
const [pdfDrawerDocId, setPdfDrawerDocId] = useState<string>("")
const [pdfDrawerDocName, setShowPdfDrawerDocName] = useState<string>("")
const [pdfDrawerUrl, setPdfDrawerUrl] = useState<string | null>(null)
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
const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false)
const [bulkEmails, setBulkEmails] = useState('')
const [bulkRole, setBulkRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
const [bulkInviting, setBulkInviting] = useState(false)
const [showNDADialog, setShowNDADialog] = useState(false)
const [ndaSettings, setNdaSettings] = useState<any>(null)
const [ndaAccepted, setNdaAccepted] = useState(false)
const [signingNDA, setSigningNDA] = useState(false)
const ndaFileInputRef = useRef<HTMLInputElement>(null)
const [showSignaturesDrawer, setShowSignaturesDrawer] = useState(false)
const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
const [searchFolderResults, setSearchFolderResults] = useState<FolderType[]>([])
const [bulkInviteResults, setBulkInviteResults] = useState<{
  success: string[]
  failed: { email: string; reason: string }[]
} | null>(null)
const [contacts, setContacts] = useState<Array<{
  id: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  invitationStatus?: 'pending' | 'accepted'
  invitationLink?: string;
  addedAt: string
}>>([])
const [uploadProgress, setUploadProgress] = useState<
  Array<{
    name: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    message?: string;
  }>
>([])
const [user, setUser] = useState<{ email: string } | null>(null)
const [userPlan, setUserPlan] = useState<string>('free')


const [isOwner, setIsOwner] = useState(false)
const [userRole, setUserRole] = useState<string>(''); // ← Initialize as empty
const canUpload = ['owner', 'admin', 'editor'].includes(userRole);
const canEdit = ['owner', 'admin', 'editor'].includes(userRole);
const canDelete = ['owner', 'admin', 'editor'].includes(userRole);
const canManageContacts = ['owner', 'admin'].includes(userRole);
const canManageSpace = userRole === 'owner';
const canCreateFolders = ['owner', 'admin', 'editor'].includes(userRole);
const canShareSpace = ['owner', 'admin'].includes(userRole);
const searchParams = useSearchParams();
const [showSettingsDialog, setShowSettingsDialog] = useState(false)
const [showSignatureDialog, setShowSignatureDialog] = useState(false)
const [showUnfiledOnly, setShowUnfiledOnly] = useState(false)
const [allDocuments, setAllDocuments] = useState<DocumentType[]>([])
const [securityLevel, setSecurityLevel] = useState<'open' | 'password' | 'whitelist'>('password')
const [allowedEmails, setAllowedEmails] = useState<string[]>([])
const [emailInput, setEmailInput] = useState('')
const [allowedDomains, setAllowedDomains] = useState<string[]>([])
const [domainInput, setDomainInput] = useState('')
const [password, setPassword] = useState('')
const [expiresAt, setExpiresAt] = useState('')
const [viewLimit, setViewLimit] = useState('')
const [showPassword, setShowPassword] = useState(false)
const [trashedDocuments, setTrashedDocuments] = useState<DocumentType[]>([])
const [showFolderPermissionsDialog, setShowFolderPermissionsDialog] = useState(false)
const [selectedFolderForPermissions, setSelectedFolderForPermissions] = useState<string | null>(null)
const [folderPermissions, setFolderPermissions] = useState<Array<{
  id: string
  grantedTo: string
  role: string
  canDownload: boolean
  canUpload: boolean
  expiresAt: Date | null
  watermarkEnabled: boolean
  grantedBy: string
  grantedAt: Date
  isExpired: boolean
}>>([])
const [loadingPermissions, setLoadingPermissions] = useState(false)
const [newPermissionEmail, setNewPermissionEmail] = useState('')
const [newPermissionRole, setNewPermissionRole] = useState<'viewer' | 'editor' | 'restricted'>('viewer')
const [newPermissionCanDownload, setNewPermissionCanDownload] = useState(true)
const [newPermissionExpiresAt, setNewPermissionExpiresAt] = useState('')
const [newPermissionWatermark, setNewPermissionWatermark] = useState(false)
const [addingPermission, setAddingPermission] = useState(false)
const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
const [selectAll, setSelectAll] = useState(false);
const [shareLinkLabel, setShareLinkLabel] = useState('')
const [showRequestFilesDrawer, setShowRequestFilesDrawer] = useState(false)
const [requestFilesFolder, setRequestFilesFolder] = useState<{ id: string; name: string } | null>(null)
const [myRole, setMyRole] = useState<string>('');
const [bulkMode, setBulkMode] = useState(false)
const [showDriveFilesDialog,    setShowDriveFilesDialog]    = useState(false)
const [driveFiles,              setDriveFiles]              = useState<any[]>([])
const [loadingDriveFiles,       setLoadingDriveFiles]       = useState(false)
const [driveSearchQuery,        setDriveSearchQuery]        = useState('')
const [showOneDriveFilesDialog, setShowOneDriveFilesDialog] = useState(false)
const [oneDriveFiles,           setOneDriveFiles]           = useState<any[]>([])
const [loadingOneDriveFiles,    setLoadingOneDriveFiles]    = useState(false)
const [oneDriveSearchQuery,     setOneDriveSearchQuery]     = useState('')
const [integrationStatus,       setIntegrationStatus]       = useState<Record<string, any>>({})
const [oneDriveStatus,          setOneDriveStatus]          = useState<{ connected: boolean; email?: string }>({ connected: false })
const [qaComments, setQaComments] = useState<Array<{
  id: string
  documentId: string
  documentName: string
  email: string
  message: string
  shareLink: string | null    
  linkLabel: string | null  
  reply: string | null
  repliedAt: string | null
  createdAt: string
}>>([])
const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false)
const [invitationLink,       setInvitationLink]       = useState('')
const [qaLoading, setQaLoading] = useState(false)
const [replyingTo, setReplyingTo] = useState<string | null>(null)
const [replyText, setReplyText] = useState('')
const [sendingReply, setSendingReply] = useState(false)
const [qaFilter, setQaFilter] = useState<'all' | 'unanswered' | 'answered'>('all')
const [showMobileSidebar, setShowMobileSidebar] = useState(false)
const [permissions, setPermissions] = useState({
  canManageMembers: false,
  canUpload: false,
  canDelete: false
});
const [selectedDriveImports, setSelectedDriveImports] = useState<Set<string>>(new Set())
const [selectedOneDriveImports, setSelectedOneDriveImports] = useState<Set<string>>(new Set())
const [importingDriveFiles, setImportingDriveFiles] = useState(false)
const [importingOneDriveFiles, setImportingOneDriveFiles] = useState(false)
const [confirmDialog, setConfirmDialog] = useState<{
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  variant?: 'default' | 'destructive'
} | null>(null)
const [duplicateDialog, setDuplicateDialog] = useState(false)
const [duplicateName, setDuplicateName] = useState('')
const [renameFolderDialog, setRenameFolderDialog] = useState(false)
const [renameFolderTarget, setRenameFolderTarget] = useState<FolderType | null>(null)
const [renameFolderName, setRenameFolderName] = useState('')


useEffect(() => {
  const tabParam = searchParams.get('tab')
  if (tabParam === 'analytics') {
    setActiveTab('analytics')
  }
}, [searchParams])


 
useEffect(() => {
  console.log('🔍 Current user role state:', {
    userRole,
    isOwner,
    canUpload,
    canEdit,
    canDelete
  });
}, [userRole, isOwner]);


useEffect(() => {
  let cancelled = false; // ✅ Prevent race conditions

  const fetchMyRole = async () => {
    try {
      const res = await fetch(`/api/spaces/${params.id}/my-role`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        
        // ✅ ONLY update if this fetch wasn't cancelled
        if (!cancelled) {
          console.log('✅ Setting role from /my-role:', data.role);
          setUserRole(data.role);
          setIsOwner(data.role === 'owner');
          setMyRole(data.role);
          setPermissions({
            canManageMembers: data.canManageMembers || false,
            canUpload: data.canUpload || false,
            canDelete: data.canDelete || false
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
    }
  };

  fetchMyRole();

  // ✅ Cleanup function - prevents stale updates
  return () => {
    cancelled = true;
  };
}, [params.id]);


useEffect(() => {
  const checkNDABeforeAccess = async () => {
    if (!user || !params.id) return;

    try {
      const res = await fetch(`/api/spaces/${params.id}/nda-sign`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: user?.email }),
});

      if (res.ok) {
        const data = await res.json();
        
        // ✅ BLOCK ACCESS if NDA needed
        if (data.needsNDA) {
          setNdaSettings({
            documentUrl: data.ndaDocumentUrl,
            documentName: data.ndaDocumentName
          });
          setShowNDADialog(true);
          setLoading(false); // Stop loading, show NDA modal
          return; // DON'T fetch space data yet
        }
      }
      
      // ✅ If no NDA needed or already signed, load space
      fetchSpace();
      
    } catch (error) {
      console.error('NDA check error:', error);
      fetchSpace(); // Fail open
    }
  };

  checkNDABeforeAccess();
}, [params.id, user]);



// Handle URL actions (share, settings)
useEffect(() => {
  const action = searchParams.get('action')
  
  if (action === 'share' && canShareSpace) {
    // ✅ Automatically trigger share generation
    handleShareWithClient()
    // Clear the URL parameter after opening
    router.replace(`/spaces/${params.id}`, { scroll: false })
  } else if (action === 'settings' && canManageSpace) {
    setShowSettingsDialog(true)
    router.replace(`/spaces/${params.id}`, { scroll: false })
  }
}, [searchParams, canShareSpace, canManageSpace])



const showConfirm = (title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'destructive') => {
  setConfirmDialog({ open: true, title, description, onConfirm, variant })
}

const getUnsignedDocs = () => {
  return displayedFilterDocuments.filter(doc => 
    !doc.signatureRequestId || doc.signatureStatus !== 'completed'
  );
};

// Handle select all
const handleSelectAll = () => {
  if (selectAll) {
    setSelectedDocs([]);
  } else {
    const unsignedDocIds = getUnsignedDocs().map(d => d.id);
    setSelectedDocs(unsignedDocIds);
  }
  setSelectAll(!selectAll);
};

// Handle individual checkbox
const handleSelectDoc = (docId: string) => {
  setSelectedDocs(prev => 
    prev.includes(docId) 
      ? prev.filter(id => id !== docId)
      : [...prev, docId]
  );
};


const handleImportMultipleDriveFiles = async () => {
  if (selectedDriveImports.size === 0) return
  setImportingDriveFiles(true)
  const filesToImport = driveFiles.filter(f => selectedDriveImports.has(f.id))
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < filesToImport.length; i++) {
    const file = filesToImport[i]
    try {
      const importRes = await fetch('/api/integrations/google-drive/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name }),
      })
      const importData = await importRes.json()
      if (importRes.ok && importData.documentId) {
        await fetch(`/api/spaces/${params.id}/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: importData.documentId,
            folderId: selectedFolder || null,
          }),
        })
        successCount++
      } else {
        failCount++
      }
    } catch {
      failCount++
    }
  }

  setImportingDriveFiles(false)
  setSelectedDriveImports(new Set())
  setShowDriveFilesDialog(false)
  fetchSpace()

  if (failCount === 0) {
    toast.success(`${successCount} file${successCount > 1 ? 's' : ''} imported from Google Drive!`)
  } else if (successCount === 0) {
    toast.error(`All ${failCount} imports failed`)
  } else {
    toast.success(`${successCount} imported, ${failCount} failed`)
  }
}

const handleImportMultipleOneDriveFiles = async () => {
  if (selectedOneDriveImports.size === 0) return
  setImportingOneDriveFiles(true)
  const filesToImport = oneDriveFiles.filter(f => selectedOneDriveImports.has(f.id))
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < filesToImport.length; i++) {
    const file = filesToImport[i]
    try {
      const importRes = await fetch('/api/integrations/onedrive/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id, fileName: file.name }),
      })
      const importData = await importRes.json()
      if (importRes.ok && importData.documentId) {
        await fetch(`/api/spaces/${params.id}/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: importData.documentId,
            folderId: selectedFolder || null,
          }),
        })
        successCount++
      } else {
        failCount++
      }
    } catch {
      failCount++
    }
  }

  setImportingOneDriveFiles(false)
  setSelectedOneDriveImports(new Set())
  setShowOneDriveFilesDialog(false)
  fetchSpace()

  if (failCount === 0) {
    toast.success(`${successCount} file${successCount > 1 ? 's' : ''} imported from OneDrive!`)
  } else if (successCount === 0) {
    toast.error(`All ${failCount} imports failed`)
  } else {
    toast.success(`${successCount} imported, ${failCount} failed`)
  }
}

const openPdfDrawer = (doc: DocumentType) => {
  setPdfDrawerDocId(doc.id)
  setShowPdfDrawerDocName(doc.name)
  setPdfDrawerUrl(doc.cloudinaryPdfUrl)
  setShowPdfDrawer(true)
}


const handleMultipleUpload = async (files: File[]) => {
  // Single file — use existing flow with status messages
  if (files.length === 1) {
    handleFileUpload(files[0])
    return
  }

  // Multiple files — show per-file progress
  setUploadStatus('uploading')
  setUploadProgress(files.map(f => ({ name: f.name, status: 'pending' })))

  let allOk = true

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    setUploadProgress(prev => prev.map((p, idx) =>
      idx === i ? { ...p, status: 'uploading' } : p
    ))

    const formData = new FormData()
    formData.append('file', file)
    if (selectedFolder) formData.append('folderId', selectedFolder)

    try {
      const res  = await fetch(`/api/spaces/${params.id}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'done' } : p
        ))
      } else {
        allOk = false
        setUploadProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', message: data.error || 'Failed' } : p
        ))
      }
    } catch {
      allOk = false
      setUploadProgress(prev => prev.map((p, idx) =>
        idx === i ? { ...p, status: 'error', message: 'Network error' } : p
      ))
    }
  }

  setUploadStatus(allOk ? 'success' : 'error')
  setUploadMessage(
    allOk
      ? `${files.length} files uploaded successfully!`
      : 'Some files failed — check results above'
  )
  setUploadProgress([])
  fetchSpace()

  setTimeout(() => {
    setUploadStatus('idle')
    setUploadMessage('')
    if (allOk) setShowUploadDialog(false)
  }, 2000)
}

const fetchQAComments = async () => {
  setQaLoading(true)
  try {
    const res = await fetch(`/api/spaces/${params.id}/comments`, {
      credentials: 'include'
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success) setQaComments(data.comments || [])
    }
  } catch (error) {
    console.error('Failed to fetch Q&A comments:', error)
  } finally {
    setQaLoading(false)
  }
}




const handleBulkInvite = async () => {
  // Parse emails
  const emailList = bulkEmails
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0)

  if (emailList.length < 2) {
   toast.error('Please enter at least 2 email addresses')
    return
  }

  setBulkInviting(true)
  setBulkInviteResults(null)

  try {
    const res = await fetch(`/api/spaces/${params.id}/contacts/bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: emailList,
        role: bulkRole
      })
    })

    const data = await res.json()

    if (data.success) {
      setBulkInviteResults({
        success: data.results.success,
        failed: data.results.failed
      })
      
      // Refresh contacts list
      await fetchContacts()
      
      // Clear form if all succeeded
      if (data.results.failed.length === 0) {
        setBulkEmails('')
        setTimeout(() => {
          setShowBulkInviteDialog(false)
          setBulkInviteResults(null)
        }, 3000)
      }
    } else {
     toast.error(data.error || 'Bulk invite failed')
    }
  } catch (error) {
    console.error('Bulk invite error:', error)
    toast.error('Failed to send invitations')
  } finally {
    setBulkInviting(false)
  }
}


// ✅ Fetch folder permissions
const fetchFolderPermissions = async (folderId: string) => {
  setLoadingPermissions(true)
  try {
    const res = await fetch(
      `/api/spaces/${params.id}/folders/${folderId}/permissions`,
      {
        credentials: 'include',
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setFolderPermissions(data.permissions)
      }
    }
  } catch (error) {
    console.error('Failed to fetch folder permissions:', error)
  } finally {
    setLoadingPermissions(false)
  }
}

//  Grant folder permission
const handleGrantFolderPermission = async () => {
  if (!newPermissionEmail.trim() || !selectedFolderForPermissions) return

  setAddingPermission(true)

  try {
    const res = await fetch(
      `/api/spaces/${params.id}/folders/${selectedFolderForPermissions}/permissions`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantedTo: newPermissionEmail.trim(),
          role: newPermissionRole,
          canDownload: newPermissionCanDownload,
          canUpload: newPermissionRole === 'editor',
          expiresAt: newPermissionExpiresAt || null,
          watermarkEnabled: newPermissionWatermark,
        }),
      }
    )

    const data = await res.json()

    if (res.ok && data.success) {
      toast.success(data.message)
      // Refresh permissions list
      await fetchFolderPermissions(selectedFolderForPermissions)
      // Reset form
      setNewPermissionEmail('')
      setNewPermissionRole('viewer')
      setNewPermissionCanDownload(true)
      setNewPermissionExpiresAt('')
      setNewPermissionWatermark(false)
    } else {
      toast.error(data.error || 'Failed to grant permission')
    }
  } catch (error) {
    console.error('Failed to grant permission:', error)
    toast.error('Failed to grant permission')
  } finally {
    setAddingPermission(false)
  }
}

//   Revoke folder permission
const handleRevokeFolderPermission = async (email: string) => {
  if (!selectedFolderForPermissions) return
   

  try {
    const res = await fetch(
      `/api/spaces/${params.id}/folders/${selectedFolderForPermissions}/permissions/${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    )

    const data = await res.json()

    if (res.ok && data.success) {
      toast.success(data.message)
      await fetchFolderPermissions(selectedFolderForPermissions)
    } else {
      toast.error(data.error || 'Failed to revoke permission')
    }
  } catch (error) {
    console.error('Failed to revoke permission:', error)
    toast.error('Failed to revoke permission')
  }
}


const handleSearch = async (query: string) => {
  if (!query.trim()) {
    setSearchResults([])
    setSearchFolderResults([])
    setIsSearching(false)
    return
  }
  setIsSearching(true)
  try {
    const res = await fetch(
      `/api/documents/search?spaceId=${params.id}&query=${encodeURIComponent(query)}`,
      { method: "GET", credentials: "include" }
    )
    if (!res.ok) throw new Error("Search request failed")
    const data = await res.json()
    if (data.success) {
      setSearchResults(data.documents || [])
      setSearchFolderResults(data.folders || [])
    } else {
      setSearchResults([])
      setSearchFolderResults([])
    }
  } catch (error) {
    console.error("Search failed:", error)
  } finally {
    setIsSearching(false)
  }
}

const fetchContacts = async () => {
  try {
    const res = await fetch(`/api/spaces/${params.id}/contacts`, {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    }
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
  }
};

const handleSignNDA = async () => {
  if (!ndaAccepted) {
    toast.error('Please accept the NDA to continue');
    return;
  }

  setSigningNDA(true);

  try {
    const res = await fetch(`/api/spaces/${params.id}/nda`, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      setShowNDADialog(false);
      setNdaAccepted(false);
      
      // ✅ NOW load the space
      await fetchSpace();
      
    } else {
      toast.error(data.error || 'Failed to sign NDA');
    }
  } catch (error) {
    console.error('Sign NDA error:', error);
    toast.error('Failed to sign NDA');
  } finally {
    setSigningNDA(false);
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
        parentFolderId: selectedFolder || null,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // ✅ Refresh folders from database
      await fetchFolders();
      
      setNewFolderName('');
      setShowCreateFolderDialog(false);
      toast.success('Folder created successfully!');
    } else {
      toast.error(data.error || 'Failed to create folder');
    }
  } catch (error) {
    console.error('Failed to create folder:', error);
    toast.error('Failed to create folder');
  } finally {
    setCreatingFolder(false);
  }
};

// Add email to whitelist
const handleAddEmail = () => {
  if (emailInput.trim() && !allowedEmails.includes(emailInput.toLowerCase())) {
    setAllowedEmails([...allowedEmails, emailInput.toLowerCase()]);
    setEmailInput('');
  }
};

// Add domain to whitelist
const handleAddDomain = () => {
  if (domainInput.trim() && !allowedDomains.includes(domainInput.toLowerCase())) {
    setAllowedDomains([...allowedDomains, domainInput.toLowerCase()]);
    setDomainInput('');
  }
};

// File upload handler
const handleFileUpload = async (file: File, isNDADocument = false) => {
  if (!file) return

  setUploadStatus('uploading')
  setUploadMessage(`Uploading ${file.name}...`)

  const formData = new FormData()
  formData.append('file', file)
  
  if (selectedFolder) {
    formData.append('folderId', selectedFolder)
  }

  // ✅ NEW: Mark as NDA if specified
  if (isNDADocument) {
    formData.append('isNDA', 'true')
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
      
      // ✅ If NDA upload, update space NDA settings
      if (isNDADocument && data.document) {
        await updateSpaceNDA(data.document)
      }
      
      fetchSpace()
      
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

const updateSpaceNDA = async (document: any) => {
  try {
    const res = await fetch(`/api/spaces/${params.id}/nda`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: true,
        ndaDocumentId: document.id,
        ndaDocumentName: document.name,
        ndaDocumentUrl: document.cloudinaryPdfUrl
      })
    })

    const data = await res.json()
    
    if (data.success) {
      toast.success('✅ NDA document set successfully!')
      await fetchSpace() // Refresh to show new NDA
    }
  } catch (error) {
    console.error('Failed to set NDA:', error)
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
  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) handleMultipleUpload(files)
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
      toast.success(data.message)
      setShowRenameDialog(false)
      setSelectedFile(null)
      setNewFilename('')
      fetchSpace()
    } else {
      toast.error(data.error || 'Failed to rename file')
    }
  } catch (error) {
    toast.error('Failed to rename file')
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
      toast.success(data.message)
      setShowMoveDialog(false)
      setSelectedFile(null)
      setTargetFolderId(null)
      fetchSpace()
    } else {
      toast.error(data.error || 'Failed to move file')
    }
  } catch (error) {
    toast.error('Failed to move file')
  }
}

// Delete file
 const handleDeleteFile = async (fileId: string, filename: string) => {
  showConfirm(
    'Move to Trash',
    `"${filename}" will be moved to trash. You can restore it later.`,
    async () => {
      try {
        const res = await fetch(`/api/spaces/${params.id}/files/${fileId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success(data.message || 'Moved to trash')
          setDocuments(prev => prev.filter(doc => doc.id !== fileId))
          setAllDocuments(prev => prev.filter(doc => doc.id !== fileId))
          await fetchTrashedDocuments()
          await fetchFolders()
        } else {
          toast.error(data.error || 'Failed to delete file')
        }
      } catch {
        toast.error('Failed to delete file')
      }
    }
  )
}

// Fetch trashed documents
const fetchTrashedDocuments = async () => {
  try {
    const res = await fetch(
      `/api/documents?spaceId=${params.id}&archived=true`,
      {
        credentials: 'include',
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setTrashedDocuments(data.documents || []);
      }
    }
  } catch (error) {
    console.error('Failed to fetch trashed documents:', error);
  }
};

// Restore document from trash
const handleRestoreDocument = async (fileId: string) => {
  try {
    const res = await fetch(`/api/spaces/${params.id}/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'restore' }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      toast.success(data.message);
      // Refresh both lists
      await fetchSpace();
      await fetchTrashedDocuments();
    } else {
      toast.error(data.error || 'Failed to restore document');
    }
  } catch (error) {
    console.error('Restore error:', error);
    toast.error('Failed to restore document');
  }
};

// Permanently delete document
const handlePermanentDelete = async (fileId: string) => {
  try {
    const res = await fetch(
      `/api/spaces/${params.id}/files/${fileId}?permanent=true`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    const data = await res.json();

    if (res.ok && data.success) {
      toast.success(data.message);
      await fetchTrashedDocuments();
    } else {
      toast.error(data.error || 'Failed to delete permanently');
    }
  } catch (error) {
    console.error('Permanent delete error:', error);
    toast.error('Failed to delete permanently');
  }
};

// Empty entire trash
const handleEmptyTrash = async () => {
  showConfirm(
    'Empty Trash',
    `Permanently delete all ${trashedDocuments.length} item${trashedDocuments.length !== 1 ? 's' : ''}? This cannot be undone.`,
    async () => {
      try {
        const deletePromises = trashedDocuments.map(doc =>
          fetch(`/api/spaces/${params.id}/files/${doc.id}?permanent=true`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
        await Promise.all(deletePromises)
        toast.success('Trash emptied')
        await fetchTrashedDocuments()
      } catch {
        toast.error('Failed to empty trash')
      }
    }
  )
}

const handleAddContact = async () => {
  if (!contactEmail.trim()) return
  setAddingContact(true)
  try {
    const res  = await fetch(`/api/spaces/${params.id}/contacts`, {
      method:  'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: contactEmail.trim(), role: contactRole }),
    })
    const data = await res.json()

    if (!res.ok) throw new Error(data.error || 'Failed to add contact')

    if (data.success) {
      await fetchContacts()
      setContactEmail('')
      setContactRole('viewer')
      setShowAddContactDialog(false)
      // show dedicated invite modal
      setInvitationLink(data.invitationLink)
      setShowInviteLinkDialog(true)
    }
  } catch (error: any) {
    toast.error(error.message || 'Failed to add contact')
  } finally {
    setAddingContact(false)
  }
}

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
  const sorted = [...allDocuments].sort((a, b) => {
    let comparison = 0
    switch (sortType) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'date':
        comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        break
      case 'size':
        comparison = parseFloat(a.size) - parseFloat(b.size)
        break
      case 'views':
        comparison = a.views - b.views
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })
  setAllDocuments(sorted)
  setDocuments(sorted)
}

  useEffect(() => {
  fetchSpace();
  fetchCurrentUser();
  fetchTrashedDocuments();
  // fetch cloud storage statuses
  fetch('/api/integrations/status', { credentials: 'include' })
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data) setIntegrationStatus(data) })
    .catch(() => {})
  fetch('/api/integrations/onedrive/status', { credentials: 'include' })
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data) setOneDriveStatus(data) })
    .catch(() => {})
}, [params.id]);


const handleBrowseDriveFiles = async () => {
  setLoadingDriveFiles(true)
  try {
    const res  = await fetch('/api/integrations/google-drive/files', { credentials: 'include' })
    const data = await res.json()
    if (res.ok) {
      setDriveFiles(data.files || [])
      setShowDriveFilesDialog(true)
    } else {
      toast.error(data.error || 'Failed to load Drive files')
    }
  } catch { toast.error('Network error') }
  finally { setLoadingDriveFiles(false) }
}

const handleImportDriveFile = async (fileId: string, fileName: string) => {
  const t = toast.loading(`Importing ${fileName}...`)
  try {
    const res  = await fetch('/api/integrations/google-drive/import', {
      method:  'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, fileName }),
    })
    const data = await res.json()
    if (res.ok) {
      // Now attach to this space
      await fetch(`/api/spaces/${params.id}/upload`, {
        method:  'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId: data.documentId, folderId: selectedFolder || null }),
      })
      toast.success(`${fileName} imported!`, { id: t })
      setShowDriveFilesDialog(false)
      fetchSpace()
    } else {
      toast.error(data.error || 'Import failed', { id: t })
    }
  } catch { toast.error('Network error', { id: t }) }
}

const handleBrowseOneDriveFiles = async () => {
  setLoadingOneDriveFiles(true)
  try {
    const res  = await fetch('/api/integrations/onedrive/files', { credentials: 'include' })
    const data = await res.json()
    if (res.ok) {
      setOneDriveFiles(data.files || [])
      setShowOneDriveFilesDialog(true)
    } else {
      toast.error(data.error || 'Failed to load OneDrive files')
    }
  } catch { toast.error('Network error') }
  finally { setLoadingOneDriveFiles(false) }
}

const handleImportOneDriveFile = async (fileId: string, fileName: string) => {
  const t = toast.loading(`Importing ${fileName}...`)
  try {
    const res  = await fetch('/api/integrations/onedrive/import', {
      method:  'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, fileName }),
    })
    const data = await res.json()
    if (res.ok) {
      await fetch(`/api/spaces/${params.id}/upload`, {
        method:  'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentId: data.documentId, folderId: selectedFolder || null }),
      })
      toast.success(`${fileName} imported!`, { id: t })
      setShowOneDriveFilesDialog(false)
      fetchSpace()
    } else {
      toast.error(data.error || 'Import failed', { id: t })
    }
  } catch { toast.error('Network error', { id: t }) }
}

const fetchCurrentUser = async () => {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
   if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setUserPlan(data.user?.billing?.plan || data.user?.plan || 'free');
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
};

const fetchSpace = async () => {
  try {
    const res = await fetch(`/api/spaces/${params.id}`, {
      credentials: 'include',
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
          credentials: 'include',
        }
      );

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        if (docsData.success) {
          const validDocuments = Array.isArray(docsData.documents)
            ? docsData.documents.filter((doc: { id: any }) => doc && doc.id)
            : [];
          setAllDocuments(validDocuments);
          setDocuments(validDocuments);

          
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



//  NEW: Handle share with client
const handleShareWithClient = () => {
  // ✅ Just open the dialog - no validation yet!
  setShowShareDialog(true);
  setSharingStatus('idle'); // Start in idle state
  setShareError('');
}

const handleGenerateShareLink = async () => {
  // ✅ Auto-add email if user typed one but didn't click Plus
  let finalAllowedEmails = [...allowedEmails];
  if (securityLevel === 'whitelist' && emailInput.trim()) {
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!finalAllowedEmails.includes(trimmedEmail)) {
      console.log('📧 Auto-adding typed email:', trimmedEmail);
      finalAllowedEmails.push(trimmedEmail);
      setAllowedEmails(finalAllowedEmails); // Update state
      setEmailInput(''); // Clear input
    }
  }

  // ✅ Auto-add domain if user typed one but didn't click Plus
  let finalAllowedDomains = [...allowedDomains];
  if (securityLevel === 'whitelist' && domainInput.trim()) {
    const trimmedDomain = domainInput.trim().toLowerCase();
    if (!finalAllowedDomains.includes(trimmedDomain)) {
      console.log('🌐 Auto-adding typed domain:', trimmedDomain);
      finalAllowedDomains.push(trimmedDomain);
      setAllowedDomains(finalAllowedDomains); // Update state
      setDomainInput(''); // Clear input
    }
  }

  // ✅ Password validation
  if ((securityLevel === 'password' || securityLevel === 'whitelist') && !password) {
    setShareError('Password is required for this security level');
    return;
  }

  // ✅ Whitelist validation (now using finalAllowedEmails)
  if (securityLevel === 'whitelist' && finalAllowedEmails.length === 0 && finalAllowedDomains.length === 0) {
    console.log('❌ Whitelist validation failed');
    console.log('📧 finalAllowedEmails:', finalAllowedEmails);
    console.log('🌐 finalAllowedDomains:', finalAllowedDomains);
    setShareError('Add at least one email or domain for whitelist security');
    return;
  }

  setSharingStatus('generating');
  setShareError('');
  
  try {
    const res = await fetch(`/api/spaces/${params.id}/public-access`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        securityLevel,
        password: (securityLevel === 'password' || securityLevel === 'whitelist') ? password : undefined,
        allowedEmails: securityLevel === 'whitelist' ? finalAllowedEmails : [], //  Use final array
        allowedDomains: securityLevel === 'whitelist' ? finalAllowedDomains : [], //  Use final array
        expiresAt: expiresAt || null,
        viewLimit: viewLimit ? parseInt(viewLimit) : null,
        label: shareLinkLabel.trim() || null,
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      setShareLink(data.publicUrl);
      setSharingStatus('success');
    } else {
      setShareError(data.error || 'Failed to create share link');
      setSharingStatus('error');
    }
  } catch (error) {
    console.error('Share error:', error);
    setShareError('Failed to create share link. Please try again.');
    setSharingStatus('error');
  }
}

//   NEW: Copy link to clipboard
const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink)
    toast.success('Link copied to clipboard!')
  } catch (error) {
    console.error('Copy error:', error)
    toast.error('❌ Failed to copy. Please copy manually.')
  }
}

const getFilteredDocuments = () => {
  if (searchQuery.trim()) {
    return searchResults.filter(doc => doc && doc.id);
  }
  
  if (selectedFolder) {
    // When viewing a folder, ALWAYS show folder contents (ignore unfiled filter)
    return allDocuments.filter(doc => 
      doc && doc.id && doc.folder === selectedFolder
    );
  }
  
  if (showUnfiledOnly) {
    // Only show documents WITHOUT a folder
    return allDocuments.filter(doc => 
      doc && doc.id && !doc.folder
    );
  }
  
  // Default: show all documents
  return allDocuments.filter(doc => doc && doc.id);
};
const displayedFilterDocuments = getFilteredDocuments();


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
    ? documents.filter(doc => doc && doc.id && doc.folderId && doc.folder === selectedFolder)
    : documents.filter(doc => doc && doc.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white">

       {/* ✅ DIFFERENT MESSAGE FOR SPACES PAGE */}
            <PageInfoTooltip 
              pageId="spaces"
              message="Manage your secure data rooms. Create spaces for deals, fundraising, and client collaboration."
              position="top"
            />
            
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
      {/* Mobile Sidebar Toggle State */}
{/* Add this to your state declarations at the top of the component: */}
{/* const [showMobileSidebar, setShowMobileSidebar] = useState(false) */}

<header className="sticky top-0 z-50 border-b bg-white">
  <div className="flex items-center justify-between h-14 lg:h-16 px-3 lg:px-6">

    {/* LEFT: Back + Space Info */}
    <div className="flex items-center gap-2 lg:gap-4 min-w-0">

      {/* Hamburger — mobile + tablet */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 flex-shrink-0"
        onClick={() => setShowMobileSidebar(true)}
      >
        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Back button — desktop only */}
      {isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex flex-shrink-0"
          onClick={() => router.push('/spaces')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Space name + role */}
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        <div
          className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ background: space.color }}
        >
          <FolderOpen className="h-4 w-4 text-white" />
        </div>
       <span className="text-sm lg:text-base font-bold text-blue-600 tracking-tight hidden sm:block">
  DocMetrics
</span>
      </div>
    </div>

    {/* RIGHT: Actions */}
    <div className="flex items-center gap-1.5 lg:gap-3 flex-shrink-0">

      {/* Search — desktop only */}
      <div className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => {
  setSearchQuery(e.target.value)
  handleSearch(e.target.value)
  if (e.target.value.trim()) {
    setActiveTab('home')
    setSelectedFolder(null)
  }
}}
          className="pl-10 w-64"
        />
      </div>

      {/* Organize — desktop only */}
      <div className="hidden lg:block">
        <DropdownMenu open={showOrganizeMenu} onOpenChange={setShowOrganizeMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Organize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold">Sort by</div>
            <DropdownMenuItem onClick={() => { setSortBy('name'); applySorting('name') }}>
              <FileText className="mr-2 h-4 w-4" />Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('date'); applySorting('date') }}>
              <Clock className="mr-2 h-4 w-4" />Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('size'); applySorting('size') }}>
              <Download className="mr-2 h-4 w-4" />Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('views'); applySorting('views') }}>
              <Eye className="mr-2 h-4 w-4" />Views {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); applySorting(sortBy) }}>
              {sortOrder === 'asc' ? 'Descending' : 'Ascending'} order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recent Files — desktop only */}
      <Button
        variant="outline"
        className="hidden lg:flex gap-2"
        onClick={() => { fetchRecentFiles(); setShowRecentFiles(true) }}
      >
        <Clock className="h-4 w-4" />
        Recent files
      </Button>

      {/* Members — desktop only */}
      <Button
        variant="outline"
        className="hidden lg:flex gap-2"
        onClick={() => setActiveTab('members')}
      >
        <Users className="h-4 w-4" />
        <span>Members ({contacts.length})</span>
      </Button>

      {/* Upload — always visible, icon-only on mobile/tablet */}
      {canUpload && (
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden lg:inline">Upload</span>
        </Button>
      )}

      {/* More menu — always visible */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white z-10 w-52">

          {/* Mobile + tablet only items */}
          <div className="lg:hidden">
            <DropdownMenuItem onClick={() => {
              setShowMobileSidebar(true)
              // sidebar has search built in
            }}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { fetchRecentFiles(); setShowRecentFiles(true) }}>
              <Clock className="mr-2 h-4 w-4" />
              Recent Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab('members')}>
              <Users className="mr-2 h-4 w-4" />
              Members ({contacts.length})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          {/* Always visible */}
          {canCreateFolders && (
            <DropdownMenuItem onClick={() => setShowCreateFolderDialog(true)}>
              <Folder className="mr-2 h-4 w-4" />
              Create Folder
            </DropdownMenuItem>
          )}
          {canManageContacts && (
            <DropdownMenuItem onClick={() => setShowAddContactDialog(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Contact
            </DropdownMenuItem>
          )}
          {canManageSpace && (
            <>
              <DropdownMenuItem onClick={() => setShowSettingsDrawer(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Space Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
  setDuplicateName(`${space?.name} (Copy)`)
  setDuplicateDialog(true)
}}>
  <Copy className="mr-2 h-4 w-4" />
  Duplicate Space
</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Space
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  </div>
</header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
          
{/* ── Mobile Sidebar Overlay ──────────────────────────────────── */}
{showMobileSidebar && (
  <div className="fixed inset-0 z-50 lg:hidden">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setShowMobileSidebar(false)}
    />
    {/* Drawer */}
    <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: space.color }}
          >
            <FolderOpen className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate max-w-[160px]">{space.name}</p>
            <RoleBadge role={userRole} />
          </div>
        </div>
        <button
          onClick={() => setShowMobileSidebar(false)}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Mobile Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              handleSearch(e.target.value)
            }}
            className="pl-10 text-sm"
          />
        </div>
      </div>

      {/* Drawer Nav — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setShowMobileSidebar(false) }}
          selectedFolder={selectedFolder}
          setSelectedFolder={(id) => { setSelectedFolder(id); setShowMobileSidebar(false) }}
          setShowUnfiledOnly={setShowUnfiledOnly}
          folders={folders}
          qaComments={qaComments}
          fetchQAComments={fetchQAComments}
          trashedDocuments={trashedDocuments}
          fetchTrashedDocuments={fetchTrashedDocuments}
          canManageSpace={canManageSpace}
          setShowCreateFolderDialog={setShowCreateFolderDialog}
          setShowSettingsDialog={setShowSettingsDialog}
          params={params}
          plan={userPlan}
        />
      </div>

      {/* Mobile bottom actions */}
      {isOwner && (
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => router.push('/spaces')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Spaces
          </Button>
        </div>
      )}
    </div>
  </div>
)}

{/* ── Desktop Sidebar ─────────────────────────────────────────── */}
<aside className="hidden lg:flex w-64 border-r bg-white overflow-y-auto flex-col flex-shrink-0">
  <SidebarContent
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    selectedFolder={selectedFolder}
    setSelectedFolder={(id) => {
      setSelectedFolder(id)
      setShowUnfiledOnly(false)
      setActiveTab('home')
    }}
    setShowUnfiledOnly={setShowUnfiledOnly}
    folders={folders}
    qaComments={qaComments}
    fetchQAComments={fetchQAComments}
    trashedDocuments={trashedDocuments}
    fetchTrashedDocuments={fetchTrashedDocuments}
    canManageSpace={canManageSpace}
    setShowCreateFolderDialog={setShowCreateFolderDialog}
    setShowSettingsDialog={setShowSettingsDialog}
    params={params}
    plan={userPlan}
  />
</aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
           <div className="p-4 lg:p-8">

            {activeTab === 'diligence' && <DiligenceTab spaceId={params.id as string} />}

             {activeTab === 'trash' && (
  <TrashTab
    spaceId={params.id as string}
    trashedDocuments={trashedDocuments}
    folders={folders}
    canEdit={canEdit}
    canDelete={canDelete}
    onRestore={handleRestoreDocument}
    onPermanentDelete={handlePermanentDelete}
    onEmptyTrash={handleEmptyTrash}
    onOpenPdf={openPdfDrawer}
    onRename={(doc) => { setSelectedFile(doc); setNewFilename(doc.name); setShowRenameDialog(true) }}
    onMove={(doc) => { setSelectedFile(doc); setShowMoveDialog(true) }}
    onDeleteFile={handleDeleteFile}
    router={router}
  />
)}

              
{!canUpload && activeTab === 'home' && (
  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold text-blue-900 mb-1">Viewer Mode</p>
        <p className="text-sm text-blue-700">
          You have read-only access to this space. You can view and download documents, but cannot upload, edit, or delete files.
        </p>
      </div>
    </div>
  </div>
)}

{activeTab === 'home' && (
  <>

  {/* Space identity header */}
<div className="flex items-center gap-3 mb-6">
  <div
    className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
    style={{ background: space.color }}
  >
    <FolderOpen className="h-5 w-5 text-white" />
  </div>
  <div>
    <h1 className="text-xl font-bold text-slate-900">{space.name}</h1>
     
  </div>
</div>

  {/* Search Results Banner */}
{searchQuery.trim() && (
  <div className="mb-6">
    {isSearching ? (
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        Searching...
      </div>
    ) : (
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
        <Search className="h-4 w-4" />
        <span>
          Found <strong>{searchResults.length}</strong> document{searchResults.length !== 1 ? 's' : ''}
          {searchFolderResults.length > 0 && <> and <strong>{searchFolderResults.length}</strong> folder{searchFolderResults.length !== 1 ? 's' : ''}</>}
          {' '}for "<strong>{searchQuery}</strong>"
        </span>
      </div>
    )}

    {/* Folder results */}
    {searchFolderResults.length > 0 && (
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Folders</p>
        <div className="flex flex-wrap gap-2">
          {searchFolderResults.map(f => (
            <button
              key={f.id}
              onClick={() => { setSelectedFolder(f.id); setSearchQuery(''); setSearchFolderResults([]); setSearchResults([]); setActiveTab('home') }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm font-medium text-slate-700"
            >
              <Folder className="h-4 w-4 text-blue-500" />
              {f.name}
              <span className="text-xs text-slate-400">{f.documentCount} files</span>
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)}
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
          {canUpload && (
  <Button
    onClick={() => setShowUploadDialog(true)}
    className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
  >
    <Upload className="h-4 w-4 text-white" />
    Upload to Folder
  </Button>
)}
        </div>

        {/* Mobile folder list */}
<div className="lg:hidden divide-y divide-slate-100">
  {filteredDocuments.length === 0 ? (
    <div className="py-12 text-center">
      <Folder className="h-10 w-10 text-slate-300 mx-auto mb-2" />
      <p className="text-slate-500 text-sm">This folder is empty</p>
    </div>
  ) : filteredDocuments.map((doc) => (
    <div key={doc.id} className="flex items-center gap-3 py-3 px-1">
      <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <FileText className="h-4 w-4 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
          <span className="text-xs text-slate-500 flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
          <span className="text-xs text-slate-400">{doc.lastUpdated}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem onClick={() => openPdfDrawer(doc)}>
  <Eye className="mr-2 h-4 w-4" />
  View
</DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSelectedFile(doc); setNewFilename(doc.name); setShowRenameDialog(true) }}>
                <Edit className="mr-2 h-4 w-4" />Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedFile(doc); setShowMoveDialog(true) }}>
                <Activity className="mr-2 h-4 w-4" />Move
              </DropdownMenuItem>
            </>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteFile(doc.id, doc.name)}>
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ))}
</div>
        
        <div className="overflow-hidden">
  <table className="w-full hidden lg:table">
    <thead className="border-b border-slate-100">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
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
                        {/* Signature Status Badge */}
      {doc.signatureRequestId && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          doc.signatureStatus === 'completed' 
            ? 'bg-green-100 text-green-700'
            : doc.signatureStatus === 'declined'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {doc.signatureStatus === 'completed' && '✅ Signed'}
          {doc.signatureStatus === 'pending' && '🖊️ Awaiting Signature'}
          {doc.signatureStatus === 'declined' && '❌ Declined'}
        </span>
      )}
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
  <DropdownMenuItem onClick={() => openPdfDrawer(doc)}>
    <Eye className="mr-2 h-4 w-4" />
    View
  </DropdownMenuItem>
 {/*  Show download only if allowed */}
  {doc.canDownload !== false ? (
    <DropdownMenuItem onClick={async () => {
      try {
        const response = await fetch(
          `/api/spaces/${params.id}/files/${doc.id}/download`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Download error:', err);
        toast.error('Download failed. Please try again.');
      }
    }}>
      <Download className="mr-2 h-4 w-4" />
      Download
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem disabled className="text-slate-400">
      <Lock className="mr-2 h-4 w-4" />
      Download Restricted
    </DropdownMenuItem>
  )}
  {/* Show message if download blocked */}
  {!Download && (
    <DropdownMenuItem disabled className="text-slate-400">
      <Lock className="mr-2 h-4 w-4" />
      Download Restricted
    </DropdownMenuItem>
  )}

               {/* ✅ NEW: Manage Access */}
 {canManageContacts && (
    userPlan === 'free' ? (
      <DropdownMenuItem
        disabled
        className="text-slate-300 cursor-not-allowed"
        title="Folder permissions require Starter plan"
      >
        <Lock className="mr-2 h-4 w-4" />
        Manage Access
        <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
          Starter+
        </span>
      </DropdownMenuItem>
    ) : (
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation()
          setSelectedFile(doc);
          const folder = folders.find(f => f.id === doc.folder);
          if (folder) {
            setSelectedFolderForPermissions(folder.id);
            fetchFolderPermissions(folder.id)
          }
          setShowFolderPermissionsDialog(true)
        }}
      >
        <Lock className="mr-2 h-4 w-4" />
        Manage Access
      </DropdownMenuItem>
    )
  )}
  
  {/* ✅ NEW: Send for Signature */}
  {canEdit && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
  onClick={() => router.push(`/documents/${doc.id}/signature?mode=send&returnTo=/spaces/${params.id}`)}
>
  <FileSignature className="mr-2 h-4 w-4" />
  Send for Signature
</DropdownMenuItem>
    </>
  )}
  
  {canEdit && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setNewFilename(doc.name)
        setShowRenameDialog(true)
      }}>
        <Edit className="mr-2 h-4 w-4" />
        Rename
      </DropdownMenuItem>

      {canEdit && (
  <DropdownMenuItem onClick={() => {
  setSelectedFile(doc)
  setShowExpiryDialog(true)
}}>
  <Clock className="mr-2 h-4 w-4" />
  {doc.expiresAt ? 'Change Expiry' : 'Set Expiry'}
</DropdownMenuItem>
)}
      <DropdownMenuItem onClick={() => {
        setSelectedFile(doc)
        setShowMoveDialog(true)
      }}>
        <Activity className="mr-2 h-4 w-4" />
        Move to Folder
      </DropdownMenuItem>
    </>
  )}
  {canDelete && (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="text-red-600"
        onClick={() => handleDeleteFile(doc.id, doc.name)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </>
  )}
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

      
       

        {/* Recent Documents */}
        <div>
          
          
          
          <DocumentsTable
  spaceId={params.id as string}
  documents={getFilteredDocuments()}
  folders={folders}
  selectedFolder={selectedFolder}
  showUnfiledOnly={showUnfiledOnly}
  canUpload={canUpload}
  canEdit={canEdit}
  canDelete={canDelete}
  canManageContacts={canManageContacts}
  canShareSpace={canShareSpace}
  selectAll={selectAll}
  selectedDocs={selectedDocs}
  onSelectAll={handleSelectAll}
  onSelectDoc={handleSelectDoc}
  onOpenPdf={openPdfDrawer}
  onDownload={async (doc) => {
    try {
      const response = await fetch(
        `/api/spaces/${params.id}/files/${doc.id}/download`,
        { method: 'GET', credentials: 'include' }
      )
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
      toast.error('Download failed. Please try again.')
    }
  }}
  onRename={(doc) => {
    setSelectedFile(doc)
    setNewFilename(doc.name)
    setShowRenameDialog(true)
  }}
  onMove={(doc) => {
    setSelectedFile(doc)
    setShowMoveDialog(true)
  }}
  onDelete={handleDeleteFile}
  onSetExpiry={(doc) => {
    setSelectedFile(doc)
    setExpiryDateInput(doc.expiresAt ? new Date(doc.expiresAt).toISOString().split('T')[0] : '')
    setShowExpiryDialog(true)
  }}
  onManageAccess={(doc) => {
    setSelectedFile(doc)
    const folder = folders.find(f => f.id === doc.folder)
    if (folder) {
      setSelectedFolderForPermissions(folder.id)
      fetchFolderPermissions(folder.id)
    }
    setShowFolderPermissionsDialog(true)
  }}
  onShare={handleShareWithClient}
  onToggleUnfiled={() => {
    setShowUnfiledOnly(!showUnfiledOnly)
    setSelectedFolder(null)
  }}
  onViewFolders={() => setActiveTab('folders')}
  onUpload={() => setShowUploadDialog(true)}
  onFolderClick={(folderId) => {
    setSelectedFolder(folderId)
    setShowUnfiledOnly(false)
    setActiveTab('home')
  }}
/>
        </div>
      </div>
    )}
  </>
)}

 {activeTab === 'folders' && (
  <FoldersTab
    folders={folders}
    canCreateFolders={canCreateFolders}
    canManageContacts={canManageContacts}
    onOpenFolder={(folderId) => {
      setSelectedFolder(folderId)
      setActiveTab('home')
    }}
    onCreateSubfolder={(folderId) => {
      setSelectedFolder(folderId)
      setShowCreateFolderDialog(true)
    }}
    onRenameFolder={(folder) => {
      setRenameFolderTarget(folder)
      setRenameFolderName(folder.name)
      setRenameFolderDialog(true)
    }}
    onDeleteFolder={(folder) => {
      const docCount = folder.documentCount || 0
      const message = docCount > 0
        ? `"${folder.name}" has ${docCount} file(s) inside that will be moved to root.`
        : `Delete "${folder.name}"?`
      showConfirm('Delete Folder', message, async () => {
        const res = await fetch(`/api/spaces/${params.id}/folders/${folder.id}?force=true`, {
          method: 'DELETE', credentials: 'include'
        })
        const data = await res.json()
        if (data.success) { toast.success(data.message); fetchFolders(); fetchSpace() }
        else toast.error(data.error || 'Delete failed')
      })
    }}
    onManageAccess={(folderId) => {
      setSelectedFolderForPermissions(folderId)
      fetchFolderPermissions(folderId)
      setShowFolderPermissionsDialog(true)
    }}
    onRequestFiles={(folder) => {
      setRequestFilesFolder(folder)
      setShowRequestFilesDrawer(true)
    }}
    onCreateFolder={() => setShowCreateFolderDialog(true)}
  />
)}

        {activeTab === 'qa' && (
  <QATab
    spaceId={params.id as string}
    qaComments={qaComments}
    qaLoading={qaLoading}
    fetchQAComments={fetchQAComments}
  />
)}




   {activeTab === 'members' && (
  <MembersTab
    spaceId={params.id as string}
    contacts={contacts}
    userEmail={user?.email}
    canManageContacts={canManageContacts}
    fetchContacts={fetchContacts}
  />
)}

            {activeTab === 'analytics' && (
  <AnalyticsTab spaceId={params.id as string} spaceName={space?.name} />
)}

{activeTab === 'permissions' && (
  <PermissionsTab
    spaceId={params.id as string}
    folders={folders.map(f => ({ id: f.id, name: f.name }))}
    canManage={canManageSpace || canManageContacts}
  />
)}

            
{activeTab === 'audit' && (
  <AuditLogTab spaceId={params.id as string} />
)}
          </div>
        </main>
      </div>
      
      {/* Recent Files Drawer */}
{showRecentFiles && (
  <div className="fixed inset-0 z-50 flex justify-end">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => setShowRecentFiles(false)}
    />
    {/* Drawer */}
    <div className="relative w-[560px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Recent Files
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Recently uploaded documents in this space</p>
        </div>
        <button
          onClick={() => setShowRecentFiles(false)}
          className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {recentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No recent files</p>
            <p className="text-sm text-slate-400">Documents you upload will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentFiles.map((doc, index) => (
              <div
                key={`recent-${doc.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
              >
                {/* File icon with index */}
                <div className="relative flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                 <p className="font-semibold text-slate-900 truncate">{doc.name || doc.originalFilename || "Untitled"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {doc.lastUpdated}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">{doc.type}</span>
                    {doc.size && doc.size !== '—' && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-400">{doc.size}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {doc.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    {doc.downloads}
                  </span>
                </div>

                {/* View button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => openPdfDrawer(doc)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 bg-slate-50">
        <p className="text-xs text-slate-400 text-center">
          Showing {recentFiles.length} most recently uploaded document{recentFiles.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  </div>
)}

{/* Add Contact Dialog */}
<Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
  <DialogContent className="max-w-lg bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Add Contact
      </DialogTitle>
      <DialogDescription>Invite one person or multiple at once</DialogDescription>
    </DialogHeader>

    {/* Toggle */}
    <div className="flex items-center bg-slate-100 rounded-lg p-1 w-fit gap-1 mt-2">
      <button
        onClick={() => setBulkMode(false)}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!bulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Single
      </button>
      <button
        onClick={() => setBulkMode(true)}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${bulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Bulk
      </button>
    </div>

    <div className="space-y-4 py-2">
      {!bulkMode ? (
        <>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Email address</label>
            <Input type="email" placeholder="contact@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
            <select value={contactRole} onChange={(e) => setContactRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="viewer">Viewer — can view documents</option>
              <option value="editor">Editor — can upload and edit</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Email addresses</label>
            <Textarea
              placeholder={"john@company.com\njane@company.com\nmike@company.com"}
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Separate with commas or new lines</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Role for all</label>
            <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="viewer">Viewer — can view documents</option>
              <option value="editor">Editor — can upload and edit</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
        </>
      )}

      {/* Bulk results */}
      {bulkInviteResults && (
        <div className="space-y-2">
          {bulkInviteResults.success.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ {bulkInviteResults.success.length} invited: {bulkInviteResults.success.join(', ')}
            </div>
          )}
          {bulkInviteResults.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              ❌ {bulkInviteResults.failed.map(f => `${f.email} (${f.reason})`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>

    <div className="flex gap-2 justify-end pt-2 border-t">
      <Button variant="outline" onClick={() => { setShowAddContactDialog(false); setContactEmail(''); setBulkEmails(''); setBulkInviteResults(null) }}>
        Cancel
      </Button>
      <Button
        onClick={bulkMode ? handleBulkInvite : handleAddContact}
        disabled={bulkMode ? (bulkInviting || !bulkEmails.trim()) : (!contactEmail.trim() || addingContact)}
        className="bg-slate-900 hover:bg-slate-800 text-white"
      >
        {(bulkMode ? bulkInviting : addingContact) ? 'Sending...' : bulkMode ? 'Send Invitations' : 'Add Contact'}
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Create Folder Dialog */}
<Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <DialogTitle>
        {selectedFolder ? 'Create Subfolder' : 'Create New Folder'}
      </DialogTitle>
      <DialogDescription>
        {selectedFolder
          ? `Creating subfolder inside "${folders.find(f => f.id === selectedFolder)?.name}"`
          : 'Add a new folder to organize your documents in this space'}
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
      {/* ── Upload Drawer ─────────────────────────────────────────────────────────
     Replace the entire <Dialog open={showUploadDialog}...> block with this
─────────────────────────────────────────────────────────────────────────── */}

{showUploadDialog && (
  <div className="fixed inset-0 z-50 flex justify-end">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => {
        if (uploadStatus === 'idle') setShowUploadDialog(false)
      }}
    />

    {/* Drawer */}
    <div className="relative w-full sm:w-[580px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-white flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Upload Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedFolder
              ? `Uploading to: ${folders.find(f => f.id === selectedFolder)?.name}`
              : 'Adding to this space'}
          </p>
        </div>
        {uploadStatus === 'idle' && (
          <button
            onClick={() => setShowUploadDialog(false)}
            className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

        {/* ── IDLE ── */}
        {uploadStatus === 'idle' && (
          <>
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-900 mb-1">
                {isDragging ? 'Drop files here' : 'Drop files here to upload'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                or click to browse — select multiple files at once
              </p>
              <Button variant="outline" size="sm">Select Files</Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) handleMultipleUpload(files)
              }}
            />

            {/* Folder indicator */}
            {selectedFolder && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                Files will be uploaded to:{' '}
                <span className="font-semibold text-slate-900">
                  {folders.find(f => f.id === selectedFolder)?.name}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Or import from cloud
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Cloud options */}
            <div className="grid grid-cols-2 gap-3">

              {/* Google Drive */}
              <button
                onClick={() => {
                  setShowUploadDialog(false)
                  integrationStatus.google_drive?.connected
                    ? handleBrowseDriveFiles()
                    : (window.location.href = '/api/integrations/google-drive/connect')
                }}
                disabled={loadingDriveFiles}
                className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all text-left group disabled:opacity-60"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-xl">📁</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                    Google Drive
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {integrationStatus.google_drive?.connected
                      ? `✓ ${integrationStatus.google_drive.email || 'Connected'}`
                      : 'Click to connect'}
                  </p>
                </div>
                {loadingDriveFiles
                  ? <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                }
              </button>

              {/* OneDrive */}
              <button
                onClick={() => {
                  setShowUploadDialog(false)
                  oneDriveStatus.connected
                    ? handleBrowseOneDriveFiles()
                    : (window.location.href = '/api/integrations/onedrive/connect')
                }}
                disabled={loadingOneDriveFiles}
                className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all text-left group disabled:opacity-60"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-xl">☁️</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                    OneDrive
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {oneDriveStatus.connected
                      ? `✓ ${oneDriveStatus.email || 'Connected'}`
                      : 'Click to connect'}
                  </p>
                </div>
                {loadingOneDriveFiles
                  ? <Loader2 className="h-4 w-4 animate-spin text-sky-500 flex-shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0 group-hover:text-sky-400 transition-colors" />
                }
              </button>

            </div>
          </>
        )}

        {/* ── UPLOADING ── */}
        {uploadStatus === 'uploading' && (
          <div className="space-y-3">
            {uploadProgress.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-slate-700">
                  Uploading {uploadProgress.length} file{uploadProgress.length !== 1 ? 's' : ''}…
                </p>
                {uploadProgress.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                    <div className="flex-shrink-0">
                      {f.status === 'pending'   && <div className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                      {f.status === 'uploading' && <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
                      {f.status === 'done'      && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {f.status === 'error'     && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{f.name}</p>
                      {f.message && <p className="text-xs text-red-500 mt-0.5">{f.message}</p>}
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${
                      f.status === 'done'      ? 'text-green-600' :
                      f.status === 'error'     ? 'text-red-500'  :
                      f.status === 'uploading' ? 'text-purple-600' :
                      'text-slate-400'
                    }`}>
                      {f.status === 'done'      ? 'Done'        :
                       f.status === 'error'     ? 'Failed'      :
                       f.status === 'uploading' ? 'Uploading…'  :
                       'Waiting'}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mb-4" />
                <p className="text-slate-700 font-semibold">{uploadMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* ── SUCCESS ── */}
        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <p className="text-slate-900 font-semibold text-lg">{uploadMessage}</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {uploadStatus === 'error' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-9 w-9 text-red-600" />
            </div>
            <p className="text-red-900 font-semibold text-lg mb-4">{uploadMessage}</p>
            <Button variant="outline" onClick={() => setUploadStatus('idle')}>
              Try Again
            </Button>
          </div>
        )}

      </div>

      {/* Footer */}
      {uploadStatus === 'idle' && (
        <div className="flex-shrink-0 px-6 py-4 border-t bg-white">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowUploadDialog(false)}
          >
            Cancel
          </Button>
        </div>
      )}

    </div>
  </div>
)}

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
      {/* Share Space — Professional Drawer */}
<ShareSpaceDrawer
  open={showShareDialog}
  onClose={() => {
    setShowShareDialog(false)
    setSharingStatus('idle')
  }}
  spaceId={params.id as string}
  spaceName={space?.name || ""}
  onSuccess={(url) => {
    setShareLink(url)
    setSharingStatus('success')
  }}
/>
{/* Members Dialog */}
 
<Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
  <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
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
        </div>
      ) : (
        <>
          {/* Owner Section */}
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
                👑 Owner
              </span>
            </div>
          </div>

          {/* All Contacts - TEST VERSION */}
          {contacts.map((contact, index) => {
            // ✅ Log each contact as we render it
            console.log(`Rendering contact ${index}:`, contact);
            
            return (
              <div key={contact.email} className="border rounded-lg p-4 hover:bg-slate-50">
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
                      {/* ✅ DEBUG INFO */}
                      <p className="text-xs font-mono bg-slate-100 px-2 py-1 mt-1 rounded">
                        role: "{contact.role}"
                      </p>
                    </div>
                  </div>
                  
                  {/* ✅ Direct role display - no conditionals */}
                  <div className="text-right">
                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-1">
                      {contact.role}
                    </div>
                    <div className="text-xs text-slate-500">
                      Index: {index}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
{/* Settings Drawer - Advanced UI */}
<Drawer open={showSettingsDrawer} onOpenChange={setShowSettingsDrawer}>
  <div className="h-[90vh] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Header */}
    <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" />
          Space Settings
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Manage settings for "{space?.name}"
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSettingsDrawer(false)}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="nda">NDA</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-700">Space Name</Label>
              <Input
  value={spaceName}
  onChange={(e) => setSpaceName(e.target.value)}
  placeholder="Enter space name"
  className="mt-2"
/>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Description</Label>
              <Textarea
                defaultValue={space?.description}
                placeholder="What is this space for?"
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Space Color</Label>
              <div className="flex gap-2 mt-2">
                {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                  <button
                    key={color}
                    className="h-10 w-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button 
  onClick={async () => {
    const res = await fetch(`/api/spaces/${params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: spaceName.trim() })
    })
    const data = await res.json()
    if (data.success) { toast.success('Space name updated'); fetchSpace() }
    else toast.error(data.error || 'Failed to update')
  }}
  className="bg-purple-600 hover:bg-purple-700"
>
  Save Changes
</Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Dynamic Watermarks</p>
                <p className="text-sm text-slate-500">Add viewer email to all documents</p>
              </div>
              <Switch defaultChecked={space?.settings?.enableWatermark} />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-slate-900">View Notifications</p>
                <p className="text-sm text-slate-500">Get notified when someone views documents</p>
              </div>
              <Switch defaultChecked={space?.settings?.notifyOnView} />
            </div>

            <Button className="bg-purple-600 hover:bg-purple-700">
              Update Security Settings
            </Button>
          </div>
        </TabsContent>

        {/* NDA Settings */}
        <TabsContent value="nda" className="space-y-4 mt-6">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">Require NDA Signature</p>
                <p className="text-sm text-slate-500">Clients must sign before viewing documents</p>
              </div>
              <Switch 
                checked={space?.ndaSettings?.enabled} 
                disabled={!space?.ndaSettings?.ndaDocumentUrl}
              />
            </div>

            {/* Current NDA Document */}
            {space?.ndaSettings?.ndaDocumentUrl ? (
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {space.ndaSettings.ndaDocumentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Uploaded {new Date(space.ndaSettings.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(space.ndaSettings.ndaDocumentUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>

                {/* Signatures Count */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">
                        NDA Signatures
                      </p>
                      <p className="text-sm text-green-700">
                        <strong>{space.ndaSignatures?.length || 0}</strong> client{(space.ndaSignatures?.length || 0) !== 1 ? 's have' : ' has'} signed
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSettingsDrawer(false)
                        setShowSignaturesDrawer(true)
                      }}
                      className="gap-2"
                    >
                      <FileSignature className="h-4 w-4" />
                      View Signatures
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-slate-50">
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-900 font-medium mb-1">No NDA document uploaded</p>
                <p className="text-sm text-slate-500 mb-4">
                  Upload a PDF NDA that clients must accept
                </p>
                <Button
                  onClick={() => {
                    setShowSettingsDrawer(false)
                    setShowUploadDialog(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload NDA Document
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-4 mt-6">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="border border-red-200 bg-red-50 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Archive Space</h3>
                  <p className="text-sm text-red-700">
                    Archive this space to hide it from active spaces
                  </p>
                </div>
              </div>
              <Button
  variant="outline"
  className="border-red-300 text-red-700 hover:bg-red-100"
  onClick={() => {
  showConfirm(
    'Archive Space',
    `Archive "${space?.name}"? It will be hidden from your active spaces but not deleted.`,
    async () => {
      try {
        const res = await fetch(`/api/spaces/${params.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: true })
        })
        const data = await res.json()
        if (data.success) { toast.success('Space archived'); router.push('/spaces') }
        else toast.error(data.error || 'Failed to archive space')
      } catch { toast.error('Failed to archive space') }
    },
    'default'
  )
}}
>
  <Archive className="h-4 w-4 mr-2" />
  Archive Space
</Button>
            </div>

            <div className="border border-red-200 bg-red-50 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Delete Space</h3>
                  <p className="text-sm text-red-700 mb-2">
                    Permanently delete this space and all its documents
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ {documents.length} documents will be deleted
                  </p>
                </div>
              </div>
              <Button
  variant="destructive"
  className="bg-red-600 hover:bg-red-700"
  onClick={() => {
  showConfirm(
    'Delete Space Permanently',
    `This will permanently delete "${space?.name}" and all ${documents.length} documents. This cannot be undone.`,
    async () => {
      try {
        const res = await fetch(`/api/spaces/${params.id}`, {
          method: 'DELETE', credentials: 'include'
        })
        const data = await res.json()
        if (data.success) { toast.success('Space permanently deleted'); router.push('/spaces') }
        else toast.error(data.error || 'Failed to delete space')
      } catch { toast.error('Failed to delete space') }
    }
  )
}}
>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete Space Permanently
</Button>

              
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</Drawer>

{/* Send for Signature Dialog */}
<Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
  <DialogContent className="max-w-md bg-white scrollball-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Edit className="h-5 w-5 text-blue-600" />
        Send for Signature
      </DialogTitle>
      <DialogDescription>
        Request signatures for "{selectedFile?.name}"
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>📝 Note:</strong> Recipients will receive an email with a secure link to sign this document.
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700">Signer Email(s)</Label>
        <Input 
          type="email"
          placeholder="email@example.com"
          className="mt-2"
        />
        <p className="text-xs text-slate-500 mt-1">
          Separate multiple emails with commas
        </p>
      </div>
      
      <div>
        <Label className="text-sm font-medium text-slate-700">Message (Optional)</Label>
        <Textarea
          placeholder="Please review and sign this document..."
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-700">Signature Type</Label>
        <select className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="simple">Simple E-Signature</option>
          <option value="advanced">Advanced E-Signature (with ID verification)</option>
        </select>
      </div>
    </div>
    
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        onClick={() => {
          setShowSignatureDialog(false)
          setSelectedFile(null)
        }}
      >
        Cancel
      </Button>
      <Button 
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => {
  console.log('Send for signature:', selectedFile)
  toast.info('E-signature feature coming soon!')
  setShowSignatureDialog(false)
}}
      >
        Send for Signature
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* ✅ Folder Permissions Dialog */}
{showFolderPermissionsDialog && (
  <div className="fixed inset-0 z-50 flex justify-end">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => {
        setShowFolderPermissionsDialog(false)
        setSelectedFolderForPermissions(null)
        setFolderPermissions([])
      }}
    />

    {/* Drawer */}
    <div className="relative w-full sm:w-[680px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="sticky top-0 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-6 py-4 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manage Access</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {folders.find(f => f.id === selectedFolderForPermissions)?.name || 'Folder'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowFolderPermissionsDialog(false)
              setSelectedFolderForPermissions(null)
              setFolderPermissions([])
            }}
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-slate-100 p-1 rounded-xl">
          {(['permissions', 'grant'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                const el = document.getElementById(`manage-access-tab-${tab}`)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all text-slate-500 hover:text-slate-900 hover:bg-white"
            >
              {tab === 'permissions' ? 'Current Access' : 'Grant Access'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-white">

        {/* ── SECTION: Current Access ── */}
        <div id="manage-access-tab-permissions">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Current Access
          </p>

          {loadingPermissions ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Loading permissions...</p>
            </div>
          ) : folderPermissions.length === 0 ? (
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-10 text-center">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium">No specific permissions set</p>
              <p className="text-slate-400 text-sm mt-1">
                Space members with editor/admin roles can access this folder
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {folderPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className={`rounded-xl border p-4 transition-all ${
                    permission.isExpired
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                        {permission.grantedTo.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {permission.grantedTo}
                          </p>
                          {permission.isExpired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-500 text-xs font-medium border border-red-200">
                              <AlertCircle className="h-3 w-3" />
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            permission.role === 'editor'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : permission.role === 'viewer'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                            {permission.role === 'editor' && '✏️'}
                            {permission.role === 'viewer' && '👁️'}
                            {permission.role === 'restricted' && '🔒'}
                            {' '}{permission.role.charAt(0).toUpperCase() + permission.role.slice(1)}
                          </span>

                          {permission.canDownload ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs border border-slate-200">
                              <Download className="h-3 w-3" />
                              Can Download
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-600 text-xs border border-yellow-200">
                              <Eye className="h-3 w-3" />
                              View Only
                            </span>
                          )}

                          {permission.watermarkEnabled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs border border-purple-200">
                              <ShieldCheck className="h-3 w-3" />
                              Watermark
                            </span>
                          )}

                          {permission.expiresAt && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs border border-slate-200">
                              <Calendar className="h-3 w-3" />
                              {new Date(permission.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Granted by {permission.grantedBy} · {new Date(permission.grantedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
  showConfirm(
    'Revoke Access',
    `Remove folder access for ${permission.grantedTo}?`,
    () => handleRevokeFolderPermission(permission.grantedTo)
  )
}}
                      className="h-9 w-9 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all text-slate-400 hover:text-red-500 flex-shrink-0"
                      title="Revoke access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* ── SECTION: Grant Access ── */}
        <div id="manage-access-tab-grant" className="space-y-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Grant Access
          </p>

          {/* Email Input */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={newPermissionEmail}
              onChange={(e) => setNewPermissionEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">
              Access Level <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'viewer', icon: <Eye className="h-5 w-5 text-blue-500" />, label: 'Viewer', desc: 'View & Download', color: 'border-blue-500 bg-blue-50' },
                { value: 'editor', icon: <Edit className="h-5 w-5 text-green-500" />, label: 'Editor', desc: 'Upload & Edit', color: 'border-green-500 bg-green-50' },
                { value: 'restricted', icon: <Lock className="h-5 w-5 text-orange-500" />, label: 'Restricted', desc: 'View Only', color: 'border-orange-500 bg-orange-50' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setNewPermissionRole(opt.value as any)
                    if (opt.value === 'restricted') setNewPermissionCanDownload(false)
                    else setNewPermissionCanDownload(true)
                  }}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    newPermissionRole === opt.value
                      ? opt.color
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2">{opt.icon}</div>
                  <p className="font-semibold text-slate-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Download Toggle */}
          {newPermissionRole !== 'restricted' && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="font-medium text-slate-900 text-sm">Allow Downloads</p>
                <p className="text-xs text-slate-500 mt-0.5">User can download files from this folder</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPermissionCanDownload}
                  onChange={(e) => setNewPermissionCanDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          )}

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <p className="font-medium text-slate-900 text-sm">Enable Watermark</p>
              <p className="text-xs text-slate-500 mt-0.5">Overlay user's email on viewed documents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newPermissionWatermark}
                onChange={(e) => setNewPermissionWatermark(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Expiration Date <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={newPermissionExpiresAt}
              onChange={(e) => setNewPermissionExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all [color-scheme:light]"
            />
            <p className="text-xs text-slate-400 mt-1.5">Access auto-expires after this date</p>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-semibold text-blue-800 mb-1">Access Summary</p>
                <p>Role: <span className="font-medium text-slate-900">{newPermissionRole}</span></p>
                <p>Download: <span className="font-medium text-slate-900">{newPermissionCanDownload ? 'Allowed' : 'Blocked'}</span></p>
                <p>Watermark: <span className="font-medium text-slate-900">{newPermissionWatermark ? 'Enabled' : 'Disabled'}</span></p>
                {newPermissionExpiresAt && (
                  <p>Expires: <span className="font-medium text-slate-900">{new Date(newPermissionExpiresAt).toLocaleString()}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-white flex gap-3">
        <button
          onClick={() => {
            setNewPermissionEmail('')
            setNewPermissionRole('viewer')
            setNewPermissionCanDownload(true)
            setNewPermissionExpiresAt('')
            setNewPermissionWatermark(false)
          }}
          disabled={addingPermission}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-40"
        >
          Clear
        </button>
        <button
          onClick={handleGrantFolderPermission}
          disabled={!newPermissionEmail.trim() || addingPermission}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
        >
          {addingPermission ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Granting...
            </>
          ) : (
            <>
              <Key className="h-4 w-4" />
              Grant Access
            </>
          )}
        </button>
      </div>

    </div>
  </div>
)}

{/* Floating Action Bar */}
{selectedDocs.length > 0 && (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
    <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-slate-700">
      {/* Selection Count */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">
          {selectedDocs.length}
        </div>
        <span className="font-medium">
          {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="h-8 w-px bg-slate-700" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* ✅ SINGLE DOCUMENT - Go to individual signature page */}
        {selectedDocs.length === 1 ? (
          <Button
            onClick={() => {
              const docId = selectedDocs[0];
              router.push(`/documents/${docId}/signature?mode=send&returnTo=/spaces/${params.id}`);
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <FileSignature className="h-4 w-4" />
            Send for Signature
          </Button>
        ) : (
          /*   MULTIPLE DOCUMENTS - Go to envelope/batch page */
          <Button
            onClick={() => {
              const docIds = selectedDocs.join(',');
              router.push(`/documents/envelope/create?docs=${docIds}&spaceId=${params.id}`);
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Package className="h-4 w-4" />
            {/* ⭐ CLEAR BUTTON TEXT */}
            Bundle & Send for Signatures ({selectedDocs.length})
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedDocs([]);
            setSelectAll(false);
          }}
          className="text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  </div>
)}

{/* Bulk Invite Dialog */}
<Dialog open={showBulkInviteDialog} onOpenChange={setShowBulkInviteDialog}>
  <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-purple-600" />
        Bulk Invite Contacts
      </DialogTitle>
      <DialogDescription>
        Invite multiple people at once (comma or newline separated)
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      {/* Email Input */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Email Addresses (2 or more)
        </Label>
        <Textarea
          placeholder="john@company.com, jane@company.com&#10;mike@company.com"
          value={bulkEmails}
          onChange={(e) => setBulkEmails(e.target.value)}
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-slate-500 mt-2">
          Separate emails with commas or new lines. Minimum 2 emails.
        </p>
      </div>

      {/* Role Selection */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Role for All Invitees
        </Label>
        <select
          value={bulkRole}
          onChange={(e) => setBulkRole(e.target.value as 'viewer' | 'editor' | 'admin')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="viewer">Viewer - Can view documents</option>
          <option value="editor">Editor - Can upload and edit</option>
          <option value="admin">Admin - Full access</option>
        </select>
      </div>

      {/* Results Display */}
      {bulkInviteResults && (
        <div className="space-y-3">
          {bulkInviteResults.success.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-2">
                ✅ Successfully invited ({bulkInviteResults.success.length})
              </p>
              <div className="space-y-1">
                {bulkInviteResults.success.map((email) => (
                  <div key={email} className="text-sm text-green-700">
                    • {email}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bulkInviteResults.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">
                ❌ Failed ({bulkInviteResults.failed.length})
              </p>
              <div className="space-y-1">
                {bulkInviteResults.failed.map((item) => (
                  <div key={item.email} className="text-sm text-red-700">
                    • {item.email}: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>📧 What happens next:</strong>
          <br />• Each person receives an invitation email
          <br />• They can accept and join the space
          <br />• All invites have the same role initially
        </p>
      </div>
    </div>

    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        onClick={() => {
          setShowBulkInviteDialog(false)
          setBulkEmails('')
          setBulkInviteResults(null)
        }}
        disabled={bulkInviting}
      >
        Cancel
      </Button>
      <Button
        onClick={handleBulkInvite}
        disabled={bulkInviting || bulkEmails.trim().length === 0}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {bulkInviting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Invitations
          </>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* NDA Dialog - BLOCKS ACCESS */}
<Dialog open={showNDADialog} onOpenChange={() => {}}>
  <DialogContent 
    className="max-w-4xl bg-white max-h-[95vh] overflow-hidden" 
    onInteractOutside={(e) => e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()}
  >
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-xl">
        <FileSignature className="h-6 w-6 text-purple-600" />
        Sign NDA to Continue
      </DialogTitle>
      <DialogDescription>
        You must review and sign the NDA before accessing this space
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* PDF Viewer */}
      <div className="border rounded-lg bg-slate-50 overflow-hidden" style={{ height: '500px' }}>
        {ndaSettings?.documentUrl ? (
          <iframe
            src={ndaSettings.documentUrl}
            className="w-full h-full"
            title="NDA Document"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {/* Document Info */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <FileText className="h-4 w-4" />
        <span>{ndaSettings?.documentName || 'NDA.pdf'}</span>
        <a 
          href={ndaSettings?.documentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-auto text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          Download PDF
        </a>
      </div>

      {/* Acceptance Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="nda-accept"
          checked={ndaAccepted}
          onChange={(e) => setNdaAccepted(e.target.checked)}
          className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label htmlFor="nda-accept" className="text-sm text-slate-700 cursor-pointer">
          <strong className="text-slate-900 text-base">I have read and agree to the terms of this Non-Disclosure Agreement.</strong>
          <br />
          <span className="text-xs text-slate-600 mt-2 block">
            By checking this box and signing, you are legally bound to confidentiality obligations. 
            Your signature will be timestamped, IP logged, and recorded.
          </span>
        </label>
      </div>

      {/* Legal Warning */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-900 text-sm">Legal Agreement</p>
            <p className="text-sm text-yellow-800 mt-1">
              This is a legally binding contract. You will not be able to access any documents until you sign. 
              Violations may result in legal action.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="flex gap-2 justify-end pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => router.push('/spaces')}
        disabled={signingNDA}
      >
        Cancel & Exit
      </Button>
      <Button
        onClick={handleSignNDA}
        disabled={!ndaAccepted || signingNDA}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {signingNDA ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <FileSignature className="h-4 w-4 mr-2" />
            Sign & Access Space
          </>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>


{/*  NDA SIGNATURES DRAWER - Modern Design */}
<Drawer
  open={showSignaturesDrawer}
  onOpenChange={setShowSignaturesDrawer}
>
  <div className="p-6 space-y-6">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <FileSignature className="h-6 w-6 text-purple-600" />
        NDA Signature Records
      </h2>
      <p className="text-sm text-slate-600 mt-1">Track who has signed your NDA and when</p>
    </div>
    {!space?.ndaSettings?.enabled ? (
      /* No NDA Enabled State */
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-200 mb-4">
          <FileSignature className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          NDA Not Enabled
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Enable NDA requirements in space settings to start tracking signatures
        </p>
        <Button
          onClick={() => {
            setShowSignaturesDrawer(false)
            setShowSettingsDialog(true)
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Go to Settings
        </Button>
      </motion.div>
    ) : !space?.ndaSignatures || space.ndaSignatures.length === 0 ? (
      /* No Signatures Yet State */
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-12 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Signatures Yet
        </h3>
        <p className="text-slate-600 mb-2 max-w-md mx-auto">
          Clients will appear here after signing the NDA
        </p>
        <p className="text-sm text-slate-500">
          Share your space or invite contacts to get started
        </p>
      </motion.div>
    ) : (
      /* Signatures List */
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {space.ndaSignatures.length}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  Total Signatures
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {space.ndaSignatures.filter((s: any) => {
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return new Date(s.signedAt) > dayAgo;
                  }).length}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  Last 24 Hours
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {space.ndaSignatures.filter((s: any) => {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return new Date(s.signedAt) > weekAgo;
                  }).length}
                </p>
                <p className="text-xs text-purple-600 font-medium">
                  Last 7 Days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {(() => {
                    const sorted = [...space.ndaSignatures].sort(
                      (a: any, b: any) => 
                        new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
                    );
                    if (sorted.length === 0) return '-';
                    const latest = new Date(sorted[0].signedAt);
                    const hours = Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60));
                    return hours < 1 ? 'Now' : `${hours}h`;
                  })()}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  Latest Activity
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search signatures..."
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const csv = [
                ['Email', 'Signed At', 'IP Address', 'User Agent'].join(','),
                ...space.ndaSignatures.map((sig: any) => 
                  [
                    sig.email,
                    new Date(sig.signedAt).toISOString(),
                    sig.ipAddress,
                    `"${sig.userAgent || 'N/A'}"`
                  ].join(',')
                )
              ].join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nda-signatures-${space.name}-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Signatures Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border shadow-sm overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Signer
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Signed At
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Device
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {space.ndaSignatures
                .sort((a: any, b: any) => 
                  new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()
                )
                .map((signature: any, index: number) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         
                        <div>
                          <p className="font-semibold text-slate-900">
                            {signature.email}
                          </p>
                          {signature.userId && (
                            <p className="text-xs text-slate-500 font-mono">
                              ID: {signature.userId.slice(0, 12)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(signature.signedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(signature.signedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          <Clock className="h-3 w-3" />
                          {(() => {
                            const diff = Date.now() - new Date(signature.signedAt).getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor(diff / (1000 * 60));
                            
                            if (days > 0) return `${days}d ago`;
                            if (hours > 0) return `${hours}h ago`;
                            return `${minutes}m ago`;
                          })()}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2.5 py-1.5 rounded-md font-mono text-slate-700">
                        {signature.ipAddress}
                      </code>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        {signature.userAgent?.includes('Mobile') ? (
                          <span className="flex items-center gap-1">
                            📱 Mobile
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            💻 Desktop
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              const details = `Signer: ${signature.email}\nSigned At: ${new Date(signature.signedAt).toLocaleString()}\nIP Address: ${signature.ipAddress}\nUser Agent: ${signature.userAgent || 'N/A'}`;
                              navigator.clipboard.writeText(details);
                               toast.success('Signature details copied!')
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              console.log('NDA Signature:', signature);
                              toast.info('Details logged to console');
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Log
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              toast.info('Revoke coming soon')
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    )}
  </div>
</Drawer>

{requestFilesFolder && (
  <RequestFilesDrawer
    open={showRequestFilesDrawer}
    onClose={() => { setShowRequestFilesDrawer(false); setRequestFilesFolder(null) }}
    spaceId={params.id as string}
    spaceName={space?.name || ""}
    folderId={requestFilesFolder.id}
    folderName={requestFilesFolder.name}
  />
)}

{/* Google Drive Drawer */}
{showDriveFilesDialog && (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => setShowDriveFilesDialog(false)}
    />
    <div className="relative w-full sm:w-[680px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <span className="text-xl">📁</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Import from Google Drive</h2>
            <p className="text-xs text-slate-500">{integrationStatus.google_drive?.email || 'Google Drive'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDriveFilesDialog(false)}
          className="h-9 w-9 rounded-lg hover:bg-white/80 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Search */}
   {/* Search + Select All */}
<div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-3">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input
      placeholder="Search your Drive files..."
      className="pl-9 bg-white"
      value={driveSearchQuery}
      onChange={e => setDriveSearchQuery(e.target.value)}
    />
  </div>
  <button
    onClick={() => {
      const filtered = driveFiles.filter(f =>
        f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
      )
      if (selectedDriveImports.size === filtered.length) {
        setSelectedDriveImports(new Set())
      } else {
        setSelectedDriveImports(new Set(filtered.map(f => f.id)))
      }
    }}
    className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
  >
    {selectedDriveImports.size ===
      driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length &&
    driveFiles.length > 0
      ? 'Deselect All'
      : 'Select All'}
  </button>
</div>

{/* Files */}
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
  {loadingDriveFiles ? (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
      <p className="text-sm text-slate-500">Loading your Drive files...</p>
    </div>
  ) : driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length === 0 ? (
    <div className="text-center py-20">
      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-600">
        {driveSearchQuery ? 'No files match your search' : 'No PDF files found in Drive'}
      </p>
    </div>
  ) : (
    driveFiles
      .filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase()))
      .map(file => (
        <div
          key={file.id}
          onClick={() => {
            setSelectedDriveImports(prev => {
              const next = new Set(prev)
              next.has(file.id) ? next.delete(file.id) : next.add(file.id)
              return next
            })
          }}
          className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
            selectedDriveImports.has(file.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/40'
          }`}
        >
          {/* Checkbox */}
          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selectedDriveImports.has(file.id)
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-300 group-hover:border-blue-400'
          }`}>
            {selectedDriveImports.has(file.id) && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText className="h-6 w-6 text-red-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : ''}
              {file.modifiedTime
                ? ` · Modified ${new Date(file.modifiedTime).toLocaleDateString()}`
                : ''}
            </p>
          </div>
        </div>
      ))
  )}
</div>

{/* Footer */}
<div className="px-6 py-4 border-t bg-slate-50">
  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
    <span>
      {selectedDriveImports.size > 0
        ? `${selectedDriveImports.size} file${selectedDriveImports.size > 1 ? 's' : ''} selected`
        : 'Click files to select'}
    </span>
    <span className="text-slate-400">
      {driveFiles.length} total
    </span>
  </div>
  <div className="flex gap-2">
    <Button
      variant="outline"
      className="flex-1"
      onClick={() => {
        setShowDriveFilesDialog(false)
        setSelectedDriveImports(new Set())
      }}
    >
      Cancel
    </Button>
    {selectedDriveImports.size > 0 && (
      <Button
        onClick={handleImportMultipleDriveFiles}
        disabled={importingDriveFiles}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {importingDriveFiles ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Import {selectedDriveImports.size} File{selectedDriveImports.size > 1 ? 's' : ''}
          </>
        )}
      </Button>
    )}
  </div>
</div>
  </div>
  </div>
)}

{/* OneDrive Drawer */}
{showOneDriveFilesDialog && (
  <div className="fixed inset-0 z-50 flex justify-end">
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => setShowOneDriveFilesDialog(false)}
    />
    <div className="relative w-full sm:w-[680px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <span className="text-xl">☁️</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Import from OneDrive</h2>
            <p className="text-xs text-slate-500">{oneDriveStatus.email || 'Microsoft OneDrive'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowOneDriveFilesDialog(false)}
          className="h-9 w-9 rounded-lg hover:bg-white/80 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Search */}
      {/* Search + Select All */}
<div className="px-6 py-3 border-b bg-slate-50 flex items-center gap-3">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <Input
      placeholder="Search your OneDrive files..."
      className="pl-9 bg-white"
      value={oneDriveSearchQuery}
      onChange={e => setOneDriveSearchQuery(e.target.value)}
    />
  </div>
  <button
    onClick={() => {
      const filtered = oneDriveFiles.filter(f =>
        f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())
      )
      if (selectedOneDriveImports.size === filtered.length) {
        setSelectedOneDriveImports(new Set())
      } else {
        setSelectedOneDriveImports(new Set(filtered.map(f => f.id)))
      }
    }}
    className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
  >
    {selectedOneDriveImports.size ===
      oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())).length &&
    oneDriveFiles.length > 0
      ? 'Deselect All'
      : 'Select All'}
  </button>
</div>

{/* Files */}
<div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
  {loadingOneDriveFiles ? (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
      <p className="text-sm text-slate-500">Loading your OneDrive files...</p>
    </div>
  ) : oneDriveFiles.filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase())).length === 0 ? (
    <div className="text-center py-20">
      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-600">
        {oneDriveSearchQuery ? 'No files match your search' : 'No PDF files found in OneDrive'}
      </p>
    </div>
  ) : (
    oneDriveFiles
      .filter(f => f.name.toLowerCase().includes(oneDriveSearchQuery.toLowerCase()))
      .map(file => (
        <div
          key={file.id}
          onClick={() => {
            setSelectedOneDriveImports(prev => {
              const next = new Set(prev)
              next.has(file.id) ? next.delete(file.id) : next.add(file.id)
              return next
            })
          }}
          className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
            selectedOneDriveImports.has(file.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/40'
          }`}
        >
          {/* Checkbox */}
          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selectedOneDriveImports.has(file.id)
              ? 'bg-blue-600 border-blue-600'
              : 'border-slate-300 group-hover:border-blue-400'
          }`}>
            {selectedOneDriveImports.has(file.id) && (
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : ''}
              {file.modifiedTime
                ? ` · Modified ${new Date(file.modifiedTime).toLocaleDateString()}`
                : ''}
            </p>
          </div>
        </div>
      ))
  )}
</div>

{/* Footer */}
<div className="px-6 py-4 border-t bg-slate-50">
  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
    <span>
      {selectedOneDriveImports.size > 0
        ? `${selectedOneDriveImports.size} file${selectedOneDriveImports.size > 1 ? 's' : ''} selected`
        : 'Click files to select'}
    </span>
    <span className="text-slate-400">
      {oneDriveFiles.length} total
    </span>
  </div>
  <div className="flex gap-2">
    <Button
      variant="outline"
      className="flex-1"
      onClick={() => {
        setShowOneDriveFilesDialog(false)
        setSelectedOneDriveImports(new Set())
      }}
    >
      Cancel
    </Button>
    {selectedOneDriveImports.size > 0 && (
      <Button
        onClick={handleImportMultipleOneDriveFiles}
        disabled={importingOneDriveFiles}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {importingOneDriveFiles ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Import {selectedOneDriveImports.size} File{selectedOneDriveImports.size > 1 ? 's' : ''}
          </>
        )}
      </Button>
    )}
  </div>
</div>
    </div>
  </div>
)}

{/* ── Invitation Success Modal ──────────────────────────────────────────── */}
<Dialog open={showInviteLinkDialog} onOpenChange={setShowInviteLinkDialog}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <div className="flex items-center gap-3 mb-1">
        <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <DialogTitle className="text-lg">Member Added!</DialogTitle>
          <DialogDescription className="text-sm mt-0.5">
            An invitation email has been sent. Share the link below as a backup.
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    <div className="space-y-4 pt-1">
      {/* Email sent confirmation */}
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
        <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-800">
          Invite email sent to{' '}
          <span className="font-semibold">{contactEmail || 'recipient'}</span>
        </p>
      </div>

      {/* Link copy */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Backup Invite Link
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={invitationLink}
            className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none select-all"
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="outline"
            className="flex-shrink-0 gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(invitationLink)
              toast.success('Link copied!')
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Expires in 7 days · Send this if the email doesn't arrive
        </p>
      </div>

      {/* Members section nudge */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <Users className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          The new member is now visible in the{' '}
          <button
            className="font-semibold text-purple-600 hover:underline"
            onClick={() => {
              setShowInviteLinkDialog(false)
              setActiveTab('members')
            }}
          >
            Members tab
          </button>
          .
        </p>
      </div>

      <div className="flex justify-end pt-1 border-t">
        <Button
          onClick={() => setShowInviteLinkDialog(false)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6"
        >
          Done
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Confirmation Dialog */}
{confirmDialog && (
  <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog(null)}>
    <DialogContent className="max-w-sm bg-white">
      <DialogHeader>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogDescription>{confirmDialog.description}</DialogDescription>
      </DialogHeader>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={() => setConfirmDialog(null)}>
          Cancel
        </Button>
        <Button
          variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
          className={confirmDialog.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          onClick={() => {
            confirmDialog.onConfirm()
            setConfirmDialog(null)
          }}
        >
          Confirm
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}

<PdfViewerDrawer
  open={showPdfDrawer}
  onClose={() => setShowPdfDrawer(false)}
  pdfUrl={pdfDrawerUrl}
  docName={pdfDrawerDocName}
  spaceId={params.id as string}
  docId={pdfDrawerDocId}
/>

{/* Duplicate Space Dialog */}
<Dialog open={duplicateDialog} onOpenChange={setDuplicateDialog}>
  <DialogContent className="max-w-sm bg-white">
    <DialogHeader>
      <DialogTitle>Duplicate Space</DialogTitle>
      <DialogDescription>Enter a name for the duplicated space</DialogDescription>
    </DialogHeader>
    <Input
      value={duplicateName}
      onChange={e => setDuplicateName(e.target.value)}
      placeholder="Space name..."
      className="my-4"
      autoFocus
    />
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setDuplicateDialog(false)}>
        Cancel
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800"
        disabled={!duplicateName.trim()}
        onClick={async () => {
          if (!duplicateName.trim()) return
          setDuplicateDialog(false)
          const toastId = toast.loading('Duplicating space...')
          try {
            const res = await fetch(`/api/spaces/${params.id}/duplicate`, {
              method: 'POST', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: duplicateName.trim() })
            })
            const data = await res.json()
            if (data.success) {
              toast.success(`Duplicated! ${data.summary.folders} folders, ${data.summary.documents} docs copied.`, { id: toastId })
              router.push(`/spaces/${data.newSpaceId}`)
            } else {
              toast.error(data.error || 'Duplication failed', { id: toastId })
            }
          } catch { toast.error('Duplication failed', { id: toastId }) }
        }}
      >
        Duplicate
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* Rename Folder Dialog */}
<Dialog open={renameFolderDialog} onOpenChange={setRenameFolderDialog}>
  <DialogContent className="max-w-sm bg-white">
    <DialogHeader>
      <DialogTitle>Rename Folder</DialogTitle>
      <DialogDescription>
        Enter a new name for "{renameFolderTarget?.name}"
      </DialogDescription>
    </DialogHeader>
    <Input
      value={renameFolderName}
      onChange={e => setRenameFolderName(e.target.value)}
      placeholder="Folder name..."
      className="my-4"
      autoFocus
      onKeyDown={async (e) => {
        if (e.key === 'Enter' && renameFolderName.trim() && renameFolderTarget) {
          setRenameFolderDialog(false)
          const res = await fetch(`/api/spaces/${params.id}/folders/${renameFolderTarget.id}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: renameFolderName.trim() })
          })
          const data = await res.json()
          if (data.success) { toast.success(`Renamed to "${renameFolderName.trim()}"`); fetchFolders() }
          else toast.error(data.error || 'Rename failed')
        }
      }}
    />
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setRenameFolderDialog(false)}>
        Cancel
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800"
        disabled={!renameFolderName.trim()}
        onClick={async () => {
          if (!renameFolderName.trim() || !renameFolderTarget) return
          setRenameFolderDialog(false)
          const res = await fetch(`/api/spaces/${params.id}/folders/${renameFolderTarget.id}`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: renameFolderName.trim() })
          })
          const data = await res.json()
          if (data.success) { toast.success(`Renamed to "${renameFolderName.trim()}"`); fetchFolders() }
          else toast.error(data.error || 'Rename failed')
        }}
      >
        Rename
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog open={showExpiryDialog} onOpenChange={setShowExpiryDialog}>
  <DialogContent className="max-w-sm bg-white">
    <DialogHeader>
      <DialogTitle>Set Document Expiry</DialogTitle>
      <DialogDescription>
        Set an expiry date for "{selectedFile?.name}" or leave blank to remove.
      </DialogDescription>
    </DialogHeader>
    <Input
      type="date"
      value={expiryDateInput}
      onChange={e => setExpiryDateInput(e.target.value)}
      className="my-4"
      autoFocus
    />
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => {
        setShowExpiryDialog(false)
        setExpiryDateInput('')
      }}>
        Cancel
      </Button>
      <Button
        variant="outline"
        className="text-red-600 border-red-200"
        onClick={async () => {
          if (!selectedFile) return
          setShowExpiryDialog(false)
          const res = await fetch(`/api/spaces/${params.id}/documents/${selectedFile.id}/expiry`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresAt: null })
          })
          const data = await res.json()
          if (data.success) toast.success(data.message)
          else toast.error(data.error || 'Failed')
          setExpiryDateInput('')
        }}
      >
        Remove Expiry
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800"
        onClick={async () => {
          if (!selectedFile) return
          setShowExpiryDialog(false)
          const res = await fetch(`/api/spaces/${params.id}/documents/${selectedFile.id}/expiry`, {
            method: 'PATCH', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresAt: expiryDateInput || null })
          })
          const data = await res.json()
          if (data.success) toast.success(data.message)
          else toast.error(data.error || 'Failed')
          setExpiryDateInput('')
        }}
      >
        Set Expiry
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}






