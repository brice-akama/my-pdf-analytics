

//app/spaces/[id]/page.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer } from "@/components/ui/drawer"
import { motion } from "framer-motion"
import { toast } from 'sonner'
import { ShareSpaceDrawer } from "@/components/ShareSpaceDrawer"
import { SendDigestButton } from "@/components/SendDigestButton"

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
export function AuditLogTab({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<'all' | 'documents' | 'members' | 'links' | 'visitors' | 'settings'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showRequestFilesDrawer, setShowRequestFilesDrawer] = useState(false)
  const [requestFilesFolder, setRequestFilesFolder] = useState<{ id: string; name: string } | null>(null)

  const fetchAudit = useCallback(async (cat = category) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/spaces/${spaceId}/audit?category=${cat}&limit=200`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (data.success) {
        setEvents(data.events)
        setSummary(data.summary)
      } else {
        setError(data.error || 'Failed to load audit log')
      }
    } catch {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [spaceId, category])

  useEffect(() => { fetchAudit(category) }, [category])

  // ── Filter by search ───────────────────────────────────────────────────────
  const filtered = searchQuery.trim()
    ? events.filter(e =>
        e.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.actor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.documentName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      ['Timestamp', 'Category', 'Event', 'Actor', 'Detail', 'IP Address'].join(','),
      ...filtered.map(e => [
        formatTimestamp(e.timestamp),
        e.category,
        e.event,
        e.actor || 'System',
        `"${e.detail.replace(/"/g, '""')}"`,
        e.ipAddress || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Group events by date ───────────────────────────────────────────────────
  const groupedEvents = filtered.reduce((acc: Record<string, AuditEvent[]>, event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading audit log…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-2">{error}</p>
          <Button onClick={() => fetchAudit()} variant="outline" size="sm">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Log</h2>
          <p className="text-sm text-slate-500 mt-1">Complete history of all activity in this space</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <button
            onClick={() => fetchAudit(category)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(cat => {
            const config = CATEGORY_CONFIG[cat]
            const Icon = config.icon
            const count = cat === 'all' ? summary.total : summary[cat as keyof AuditSummary]
            const isActive = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat as typeof category)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`text-xl font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {count}
                </p>
                <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {config.label}
                </p>
              </button>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400">
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        {searchQuery && ` matching "${searchQuery}"`}
        {category !== 'all' && ` in ${CATEGORY_CONFIG[category].label}`}
      </p>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="border rounded-xl bg-white p-12 text-center">
          <Activity className="h-6 w-6 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No activity yet</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'No events match your search' : 'Events will appear here as people interact with this space'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="space-y-1">

          {/* Date divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2">
              {date}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Events */}
          <div className="border rounded-xl bg-white overflow-hidden">
            {dateEvents.map((event, idx) => {
              const isExpanded = expandedId === event.id
              const isLast = idx === dateEvents.length - 1
              const catConfig = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.settings

              return (
                <div key={event.id}>
                  <div
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !isLast ? 'border-b border-slate-100' : ''
                    } ${isExpanded ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    {/* Category dot */}
                    <div className={`h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0 ${
                      event.category === 'documents' ? 'bg-blue-400' :
                      event.category === 'members'   ? 'bg-purple-400' :
                      event.category === 'links'     ? 'bg-indigo-400' :
                      event.category === 'visitors'  ? 'bg-green-400' :
                      event.category === 'settings'  ? 'bg-orange-400' :
                      'bg-slate-400'
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 leading-snug">{event.detail}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 capitalize">{event.category}</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400">
                          {event.actorType === 'owner' ? 'Owner' : 'Visitor'}
                        </span>
                        {event.shareLink && (
                          <>
                            <span className="text-slate-200">·</span>
                            <span className="text-xs text-slate-400 font-mono">
                              {event.shareLink.slice(0, 10)}…
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Time + chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">{timeAgo(event.timestamp)}</p>
                        <p className="text-xs text-slate-300">
                          {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 sm:hidden">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className={`px-4 py-4 bg-slate-50 border-t border-slate-100 ${!isLast ? 'border-b border-slate-100' : ''}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Details</p>
                          {[
                            { label: 'Event', value: event.event, mono: true },
                            event.actor ? { label: 'Actor', value: event.actor } : null,
                            event.documentName ? { label: 'Document', value: event.documentName } : null,
                            { label: 'Time', value: formatTimestamp(event.timestamp) },
                          ].filter(Boolean).map((item: any) => (
                            <div key={item.label} className="flex gap-2">
                              <span className="text-slate-400 w-20 flex-shrink-0 text-xs">{item.label}</span>
                              {item.mono ? (
                                <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 truncate">{item.value}</code>
                              ) : (
                                <span className="text-xs text-slate-700 truncate">{item.value}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Technical</p>
                          {event.ipAddress && (
                            <div className="flex gap-2">
                              <span className="text-slate-400 w-20 flex-shrink-0 text-xs">IP</span>
                              <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{event.ipAddress}</code>
                            </div>
                          )}
                          {event.shareLink && (
                            <div className="flex gap-2">
                              <span className="text-slate-400 w-20 flex-shrink-0 text-xs">Link</span>
                              <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[180px]">{event.shareLink}</code>
                            </div>
                          )}
                          {Object.entries(event.meta || {}).map(([key, val]) =>
                            val != null ? (
                              <div key={key} className="flex gap-2">
                                <span className="text-slate-400 w-20 flex-shrink-0 text-xs capitalize truncate">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-xs text-slate-600 truncate max-w-[180px]">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
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

function eventLabel(event: string): { label: string; color: string; icon: string } {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    'document_view':  { label: 'Viewed document',  color: 'text-blue-600 bg-blue-50',     icon: '👁️' },
    'view':           { label: 'Viewed document',  color: 'text-blue-600 bg-blue-50',     icon: '👁️' },
    'download':       { label: 'Downloaded',       color: 'text-green-600 bg-green-50',   icon: '⬇️' },
    'space_open':     { label: 'Opened space',     color: 'text-purple-600 bg-purple-50', icon: '🔓' },
    'portal_enter':   { label: 'Entered portal',   color: 'text-purple-600 bg-purple-50', icon: '🚪' },
    'question_asked': { label: 'Asked a question', color: 'text-orange-600 bg-orange-50', icon: '💬' },
    'nda_signed':     { label: 'Signed NDA',       color: 'text-green-700 bg-green-100',  icon: '✍️' },
  }
  return map[event] || { label: event, color: 'text-slate-600 bg-slate-100', icon: '📌' }
}

function securityIcon(level: string) {
  if (level === 'whitelist') return { icon: '🛡️', label: 'Whitelist', color: 'text-purple-700 bg-purple-50' }
  if (level === 'password')  return { icon: '🔒', label: 'Password',  color: 'text-blue-700 bg-blue-50' }
  return { icon: '🌐', label: 'Open', color: 'text-slate-600 bg-slate-100' }
}

// ── Main Component ────────────────────────────────────────────────────────────
function AnalyticsTab({ spaceId, spaceName }: { spaceId: string; spaceName: string }) {
  const [data, setData]             = useState<AnalyticsData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'links' | 'visitors' | 'documents' | 'timeline'>('links')
  const [expandedLink, setExpandedLink]   = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/spaces/${spaceId}/analytics`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setData(json.analytics)
      else setError(json.error || 'Failed to load analytics')
    } catch {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [spaceId])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading deal analytics...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-medium mb-2">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">Try Again</Button>
      </div>
    </div>
  )

  if (!data) return null

  const { overview, visitors, documents, timeline, dailyVisits } = data
const shareLinks = data.shareLinks ?? []   // ← safe fallback
  const maxDaily = Math.max(...dailyVisits.map(d => d.count), 1)

  const heatLabel =
    overview.dealHeatScore >= 70 ? { text: 'Hot Deal 🔥',    color: 'text-red-600 bg-red-50 border-red-200' }
    : overview.dealHeatScore >= 40 ? { text: 'Warming Up ⚡', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    : overview.dealHeatScore >= 15 ? { text: 'Cool 🌤️',       color: 'text-blue-600 bg-blue-50 border-blue-200' }
    : { text: 'Quiet 💤',            color: 'text-slate-500 bg-slate-50 border-slate-200' }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">{spaceName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${heatLabel.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              overview.dealHeatScore >= 70 ? 'bg-red-500' :
              overview.dealHeatScore >= 40 ? 'bg-orange-500' :
              overview.dealHeatScore >= 15 ? 'bg-blue-500' : 'bg-slate-400'
            }`} />
            {overview.dealHeatScore >= 70 ? 'High activity' :
             overview.dealHeatScore >= 40 ? 'Moderate activity' :
             overview.dealHeatScore >= 15 ? 'Low activity' : 'No activity'}
          </span>
          <button onClick={fetchAnalytics} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="col-span-2 lg:col-span-1 bg-slate-900 rounded-xl p-4 text-white">
          <p className="text-xs font-medium text-slate-400 mb-3">Deal Score</p>
          <div className="flex items-end gap-1 mb-3">
            <p className="text-4xl font-bold">{overview.dealHeatScore}</p>
            <p className="text-slate-400 mb-1 text-sm">/100</p>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overview.dealHeatScore >= 70 ? 'bg-red-400' :
                overview.dealHeatScore >= 40 ? 'bg-orange-400' :
                overview.dealHeatScore >= 15 ? 'bg-blue-400' : 'bg-slate-500'
              }`}
              style={{ width: `${overview.dealHeatScore}%` }}
            />
          </div>
        </div>

        {[
          { label: 'Share Links', value: overview.totalShareLinks, icon: Share2 },
          { label: 'Visitors', value: overview.uniqueVisitors, icon: Users },
          { label: 'Views', value: overview.totalViews, icon: Eye },
          { label: 'Downloads', value: overview.totalDownloads, icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <Icon className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl border p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">Last 30 Days</p>
          <p className="text-xs text-slate-400">{overview.totalEvents} events</p>
        </div>
        <div className="flex items-end gap-0.5 h-16">
          {dailyVisits.map((day, i) => {
            const height = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0
            const isToday = i === dailyVisits.length - 1
            return (
              <div key={day.date} className="flex-1 group relative" title={`${day.date}: ${day.count}`}>
                <div className="w-full flex items-end" style={{ height: '64px' }}>
                  <div
                    className={`w-full rounded-sm transition-all ${
                      day.count === 0 ? 'bg-slate-100' :
                      isToday ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-500'
                    }`}
                    style={{ height: `${Math.max(height, day.count > 0 ? 10 : 0)}%` }}
                  />
                </div>
                {day.count > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                    {day.count}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>{dailyVisits[0]?.date ? new Date(dailyVisits[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
        {(['links', 'visitors', 'documents', 'timeline'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 capitalize ${
              activeSection === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s === 'links'     && `Links (${shareLinks?.length ?? 0})`}
            {s === 'visitors'  && `Visitors (${visitors?.length ?? 0})`}
            {s === 'documents' && `Documents (${documents?.length ?? 0})`}
            {s === 'timeline'  && `Activity`}
          </button>
        ))}
      </div>

      {/* SHARE LINKS */}
      {activeSection === 'links' && (
        <div className="space-y-3">
          {shareLinks.length === 0 ? (
            <div className="py-16 text-center border rounded-xl bg-white">
              <Share2 className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No share links created yet</p>
              <p className="text-xs text-slate-400 mt-1">Generate a link to start tracking engagement</p>
            </div>
          ) : (
            shareLinks.map((link) => {
              const sec = securityIcon(link.securityLevel)
              const isExpanded = expandedLink === link.shareLink
              const docsLabel = link.totalDocs > 0 ? `${link.docsVisited}/${link.totalDocs}` : `${link.docsVisited}`

              return (
                <div key={link.shareLink} className="border rounded-xl bg-white overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedLink(isExpanded ? null : link.shareLink)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {link.label || 'Untitled Link'}
                        </p>
                        {link.isExpired && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 flex-shrink-0">Expired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{sec.label}</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400 font-mono">{link.shareLink.slice(0, 10)}…</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400">{timeAgo(link.lastActivity)}</span>
                      </div>
                    </div>

                    <div className={`text-xs font-medium px-2.5 py-1 rounded-md flex-shrink-0 ${
                      link.status === 'hot'   ? 'bg-red-50 text-red-600' :
                      link.status === 'warm'  ? 'bg-orange-50 text-orange-600' :
                      link.status === 'cold'  ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {link.status === 'hot' ? 'Hot' : link.status === 'warm' ? 'Warm' : link.status === 'cold' ? 'Cold' : 'No visits'}
                    </div>

                    <ChevronRight className={`h-4 w-4 text-slate-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Stats strip */}
                  <div className="grid grid-cols-4 divide-x border-t bg-slate-50">
                    {[
                      { label: 'Visits', value: link.visits },
                      { label: 'People', value: link.visitors },
                      { label: 'Downloads', value: link.downloads },
                      { label: 'Docs', value: docsLabel },
                    ].map(({ label, value }) => (
                      <div key={label} className="px-3 py-2 text-center">
                        <p className={`text-base font-bold ${value === 0 || value === '0' ? 'text-slate-300' : 'text-slate-900'}`}>{value}</p>
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t px-4 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visitors</p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(link.publicUrl); toast.success('Copied') }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                          >
                            <Copy className="h-3 w-3" /> Copy link
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!confirm('Disable this link?')) return
                              try {
                                const res = await fetch(`/api/spaces/${spaceId}/public-access`, {
                                  method: 'PATCH', credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ shareLink: link.shareLink, updates: { enabled: false } })
                                })
                                const data = await res.json()
                                if (data.success) { toast.success('Link disabled'); fetchAnalytics() }
                                else toast.error(data.error || 'Failed')
                              } catch { toast.error('Failed') }
                            }}
                            disabled={link.enabled === false}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                              link.enabled === false
                                ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'text-red-500 border-red-200 hover:bg-red-50'
                            }`}
                          >
                            <X className="h-3 w-3" />
                            {link.enabled === false ? 'Disabled' : 'Revoke'}
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const emails = [...new Set(
                          timeline.filter(t => t.shareLink === link.shareLink).map(t => t.email).filter(e => e !== 'Anonymous')
                        )]
                        if (emails.length === 0) return (
                          <p className="text-sm text-slate-400 py-4 text-center">No visitors have used this link yet</p>
                        )
                        return (
                          <div className="space-y-1.5">
                            {emails.map(email => {
                              const vd = visitors.find(v => v.email === email)
                              return (
                                <div key={email} className="flex items-center gap-3 py-2 border-b last:border-0">
                                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-slate-600">{email.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900 truncate">{email}</p>
                                    {vd && <p className="text-xs text-slate-400">{vd.docsViewed} docs · {vd.downloads} downloads · {timeAgo(vd.lastSeen)}</p>}
                                  </div>
                                  {vd && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                                      vd.status === 'hot'  ? 'bg-red-50 text-red-600' :
                                      vd.status === 'warm' ? 'bg-orange-50 text-orange-600' :
                                      vd.status === 'new'  ? 'bg-purple-50 text-purple-600' :
                                      'bg-slate-100 text-slate-400'
                                    }`}>{vd.status}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}

                      <div className="flex gap-4 pt-2 text-xs text-slate-400 border-t">
                        {link.createdAt && <span>Created {timeAgo(link.createdAt)}</span>}
                        {link.expiresAt && (
                          <span className={link.isExpired ? 'text-red-400' : ''}>
                            {link.isExpired ? 'Expired' : 'Expires'} {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* VISITORS */}
      {activeSection === 'visitors' && (
        <div className="space-y-2">
          {visitors.length === 0 ? (
            <div className="py-16 text-center border rounded-xl bg-white">
              <Users className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No visitors yet</p>
            </div>
          ) : visitors.map((v) => (
            <div key={v.email} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-600">{v.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{v.email}</p>
                    <p className="text-xs text-slate-400">First seen {timeAgo(v.firstSeen)}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                  v.status === 'hot'  ? 'bg-red-50 text-red-600' :
                  v.status === 'warm' ? 'bg-orange-50 text-orange-600' :
                  v.status === 'new'  ? 'bg-purple-50 text-purple-600' :
                  'bg-slate-100 text-slate-500'
                }`}>{v.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{v.docsViewed}</p>
                  <p className="text-xs text-slate-400">Docs viewed</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${v.downloads > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{v.downloads}</p>
                  <p className="text-xs text-slate-400">Downloads</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{timeAgo(v.lastSeen)}</p>
                  <p className="text-xs text-slate-400">Last seen</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    v.engagementScore >= 70 ? 'bg-red-400' :
                    v.engagementScore >= 40 ? 'bg-orange-400' :
                    v.engagementScore >= 15 ? 'bg-blue-400' : 'bg-slate-300'
                  }`} style={{ width: `${v.engagementScore}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right">{v.engagementScore}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENTS */}
      {activeSection === 'documents' && (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="py-16 text-center border rounded-xl bg-white">
              <FileText className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No document activity yet</p>
            </div>
          ) : documents.map((doc, idx) => {
            const maxViews = documents[0]?.views || 1
            const interestPct = Math.round((doc.views / maxViews) * 100)
            return (
              <div key={doc.documentId} className="bg-white border rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.documentName}</p>
                      {idx === 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 flex-shrink-0">Top</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Last viewed {timeAgo(doc.lastViewed)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.views}</p>
                    <p className="text-xs text-slate-400">Views</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.uniqueViewers}</p>
                    <p className="text-xs text-slate-400">Viewers</p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${doc.downloads > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{doc.downloads}</p>
                    <p className="text-xs text-slate-400">Downloads</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${interestPct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{interestPct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ACTIVITY TIMELINE */}
      {activeSection === 'timeline' && (
        <div className="border rounded-xl bg-white overflow-hidden">
          {timeline.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {timeline.map((event) => {
                const { label } = eventLabel(event.event)
                const linkInfo = event.shareLink ? shareLinks.find(l => l.shareLink === event.shareLink) : null
                return (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 truncate">{event.email}</span>
                        <span className="text-xs text-slate-500">{label.toLowerCase()}</span>
                        {event.documentName && (
                          <span className="text-xs text-slate-400 truncate max-w-[160px]">{event.documentName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{timeAgo(event.timestamp)}</span>
                        {linkInfo && (
                          <span className="text-xs text-slate-400">via {linkInfo.label || 'link'}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* High engagement alert */}
      {visitors.filter(v => v.status === 'hot').length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {visitors.filter(v => v.status === 'hot').length} highly engaged visitor{visitors.filter(v => v.status === 'hot').length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {visitors.filter(v => v.status === 'hot').map(v => v.email).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

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
          onClick={() => setActiveTab('diligence')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'diligence'
              ? 'bg-purple-50 text-purple-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Diligence</span>
        </button>

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

        <button
          onClick={() => setActiveTab('audit')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-purple-50 text-purple-700'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Audit Log</span>
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
          <SendDigestButton spaceId={params.id as string} />
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
  const [activeTab, setActiveTab] = useState<'home' | 'folders'  | 'qa' | 'trash' | 'analytics' | 'audit' | 'diligence' | 'members'>('home')
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
  addedAt: string
}>>([])
const [user, setUser] = useState<{ email: string } | null>(null)
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

const handleReply = async (commentId: string) => {
  if (!replyText.trim()) return
  setSendingReply(true)
  try {
    const res = await fetch(`/api/spaces/${params.id}/comments`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, reply: replyText.trim() })
    })
    const data = await res.json()
    if (data.success) {
      setReplyingTo(null)
      setReplyText('')
      await fetchQAComments()
    }
  } catch (error) {
    console.error('Reply failed:', error)
  } finally {
    setSendingReply(false)
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
      alert(data.message)
      // Refresh permissions list
      await fetchFolderPermissions(selectedFolderForPermissions)
      // Reset form
      setNewPermissionEmail('')
      setNewPermissionRole('viewer')
      setNewPermissionCanDownload(true)
      setNewPermissionExpiresAt('')
      setNewPermissionWatermark(false)
    } else {
      alert(data.error || 'Failed to grant permission')
    }
  } catch (error) {
    console.error('Failed to grant permission:', error)
    alert('Failed to grant permission')
  } finally {
    setAddingPermission(false)
  }
}

//   Revoke folder permission
const handleRevokeFolderPermission = async (email: string) => {
  if (!selectedFolderForPermissions) return
  if (!confirm(`Revoke access from ${email}?`)) return

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
    alert('Please accept the NDA to continue');
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
      alert('✅ NDA document set successfully!')
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
  
  // ✅ Remove deleted document from state immediately
  setDocuments(prev => prev.filter(doc => doc.id !== fileId))
  setAllDocuments(prev => prev.filter(doc => doc.id !== fileId))
  
  // ✅ FIX: Immediately fetch trashed documents to update count
  await fetchTrashedDocuments()
  await fetchFolders()
} else {
      alert(data.error || 'Failed to delete file')
    }
  } catch (error) {
    alert('Failed to delete file')
  }
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
      alert(data.message);
      // Refresh both lists
      await fetchSpace();
      await fetchTrashedDocuments();
    } else {
      alert(data.error || 'Failed to restore document');
    }
  } catch (error) {
    console.error('Restore error:', error);
    alert('Failed to restore document');
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
      alert(data.message);
      await fetchTrashedDocuments();
    } else {
      alert(data.error || 'Failed to delete permanently');
    }
  } catch (error) {
    console.error('Permanent delete error:', error);
    alert('Failed to delete permanently');
  }
};

// Empty entire trash
const handleEmptyTrash = async () => {
  try {
    // Delete all trashed documents one by one
    const deletePromises = trashedDocuments.map(doc =>
      fetch(`/api/spaces/${params.id}/files/${doc.id}?permanent=true`, {
        method: 'DELETE',
        credentials: 'include',
      })
    );

    await Promise.all(deletePromises);
    alert('Trash emptied successfully');
    await fetchTrashedDocuments();
  } catch (error) {
    console.error('Empty trash error:', error);
    alert('Failed to empty trash');
  }
};

const handleAddContact = async () => {
  if (!contactEmail.trim()) return;

  setAddingContact(true);

  try {
    const res = await fetch(`/api/spaces/${params.id}/contacts`, {
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
      
      // ✅ Show popup with invitation link
      setShareLink(data.invitationLink); // Store the link
      setSharingStatus('success'); // Reuse existing dialog state
      setShowShareDialog(true); // Show the share dialog
      
      setContactEmail('');
      setContactRole('viewer');
      setShowAddContactDialog(false);
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
        allowedEmails: securityLevel === 'whitelist' ? finalAllowedEmails : [], // ✅ Use final array
        allowedDomains: securityLevel === 'whitelist' ? finalAllowedDomains : [], // ✅ Use final array
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
    alert('Link copied to clipboard!')
  } catch (error) {
    console.error('Copy error:', error)
    alert('❌ Failed to copy. Please copy manually.')
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
        <h1 className="text-sm lg:text-base font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[220px] lg:max-w-none">
          {space.name}
        </h1>
        <div className="hidden sm:flex items-center gap-2">
          <RoleBadge role={userRole} />
        </div>
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
              <DropdownMenuItem onClick={async () => {
                const newName = prompt('Name for the duplicated space:', `${space?.name} (Copy)`)
                if (!newName) return
                const toastId = toast.loading('Duplicating space...')
                try {
                  const res = await fetch(`/api/spaces/${params.id}/duplicate`, {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName.trim() })
                  })
                  const data = await res.json()
                  if (data.success) {
                    toast.success(`Duplicated! ${data.summary.folders} folders, ${data.summary.documents} docs copied.`, { id: toastId })
                    router.push(`/spaces/${data.newSpaceId}`)
                  } else {
                    toast.error(data.error || 'Duplication failed', { id: toastId })
                  }
                } catch { toast.error('Duplication failed', { id: toastId }) }
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
  />
</aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
           <div className="p-4 lg:p-8">

            {activeTab === 'diligence' && <DiligenceTab spaceId={params.id as string} />}

             {activeTab === 'trash' && (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Trash</h2>
        <p className="text-sm text-slate-600 mt-1">
          {trashedDocuments.length} deleted {trashedDocuments.length === 1 ? 'item' : 'items'}
        </p>
      </div>
      {trashedDocuments.length > 0 && (
        <Button 
          variant="destructive"
          onClick={() => {
           handleEmptyTrash()
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Empty Trash
        </Button>
      )}
    </div>

    {trashedDocuments.length === 0 ? (
      <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
        <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Trash is empty</h3>
        <p className="text-slate-600">Deleted files will appear here</p>
      </div>
    ) : (
     <div className="overflow-hidden">
  {/* Mobile: stacked cards */}
  <div className="lg:hidden divide-y divide-slate-100">
    {getFilteredDocuments()
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10)
      .map((doc) => (
        <div key={`mobile-${doc.id}`} className="flex items-center gap-3 py-3 px-1">
          <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {doc.folder ? (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  {folders.find(f => f.id === doc.folder)?.name || 'Folder'}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Unfiled</span>
              )}
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{doc.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
              {doc.signatureRequestId && (
                <span className={`text-xs font-medium ${doc.signatureStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {doc.signatureStatus === 'completed' ? '✅ Signed' : '🖊️ Pending'}
                </span>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem onClick={() => window.open(`/api/spaces/${params.id}/files/${doc.id}/view`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" />View
              </DropdownMenuItem>
              {doc.canDownload !== false ? (
                <DropdownMenuItem onClick={async () => {
                  const response = await fetch(`/api/spaces/${params.id}/files/${doc.id}/download`, { credentials: 'include' })
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = doc.name
                  document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
                }}>
                  <Download className="mr-2 h-4 w-4" />Download
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="text-slate-400"><Lock className="mr-2 h-4 w-4" />Restricted</DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}/signature?mode=send&returnTo=/spaces/${params.id}`)}>
                    <FileSignature className="mr-2 h-4 w-4" />Send for Signature
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedFile(doc); setNewFilename(doc.name); setShowRenameDialog(true) }}>
                    <Edit className="mr-2 h-4 w-4" />Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedFile(doc); setShowMoveDialog(true) }}>
                    <Activity className="mr-2 h-4 w-4" />Move to Folder
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

  {/* Desktop: full table, no card border */}
  <table className="w-full hidden lg:table">
    <thead className="border-b border-slate-100">
      <tr>
        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Folder</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Activity</th>
        <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Last updated</th>
        <th className="text-right px-4 py-3"></th>
      </tr>
    </thead>
          <tbody className="divide-y">
            {trashedDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50">
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
                    {/*   NEW: View-Only Indicator */}
      {doc.folder && (
        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
          <Eye className="h-3 w-3" />
          View Only
        </span>
      )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">
                    {doc.folder ? folders.find(f => f.id === doc.folder)?.name : 'Root'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{doc.lastUpdated}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreDocument(doc.id)}
                      className="gap-2"
                    >
                      <Activity className="h-4 w-4" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handlePermanentDelete(doc.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
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
          <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
            <Eye className="mr-2 h-4 w-4" />View
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
  <DropdownMenuItem onClick={() => window.open(doc.cloudinaryPdfUrl, '_blank')}>
    <Eye className="mr-2 h-4 w-4" />
    View
  </DropdownMenuItem>
 {/* ✅ Show download only if allowed */}
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
        alert('Download failed. Please try again.');
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
    const current = doc.expiresAt ? new Date(doc.expiresAt).toISOString().split('T')[0] : ''
    const dateInput = prompt('Set expiry date (YYYY-MM-DD), or leave blank to remove:', current)
    if (dateInput === null) return // cancelled
    fetch(`/api/spaces/${params.id}/documents/${doc.id}/expiry`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresAt: dateInput || null })
    }).then(r => r.json()).then(data => {
      if (data.success) { toast.success(data.message); }
      else toast.error(data.error || 'Failed to set expiry')
    })
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
          
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Documents</h2>
            <div className="flex flex-wrap gap-2">
              {canShareSpace && (
                <Button
                  onClick={handleShareWithClient}
                  variant="outline"
                  className="gap-2 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 hover:text-sky-800 hover:border-sky-400 flex-1 sm:flex-none justify-center"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              <Button
                variant={showUnfiledOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowUnfiledOnly(!showUnfiledOnly);
                  setSelectedFolder(null);
                }}
                className="gap-2 flex-1 sm:flex-none justify-center"
              >
                <FileText className="h-4 w-4" />
                {showUnfiledOnly ? 'Show All' : 'Unfiled Only'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('folders')}
                className="gap-2 flex-1 sm:flex-none justify-center"
              >
                <Folder className="h-4 w-4" />
                View All Folders
              </Button>
            </div>
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
            <>
              {/* Mobile: stacked cards */}
              <div className="lg:hidden divide-y divide-slate-100">
                {getFilteredDocuments()
                  .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                  .slice(0, 10)
                  .map((doc) => (
                    <div key={`mobile-home-${doc.id}`} className="flex items-center gap-3 py-3 px-1">
                      <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.folder ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              {folders.find(f => f.id === doc.folder)?.name || 'Folder'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Unfiled</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Eye className="h-3 w-3" />{doc.views}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
                          {doc.signatureRequestId && (
                            <span className={`text-xs font-medium ${doc.signatureStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {doc.signatureStatus === 'completed' ? '✅ Signed' : '🖊️ Pending'}
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                          <DropdownMenuItem onClick={() => window.open(`/api/spaces/${params.id}/files/${doc.id}/view`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />View
                          </DropdownMenuItem>
                          {doc.canDownload !== false ? (
                            <DropdownMenuItem onClick={async () => {
                              const response = await fetch(`/api/spaces/${params.id}/files/${doc.id}/download`, { credentials: 'include' })
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a'); a.href = url; a.download = doc.name
                              document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
                            }}>
                              <Download className="mr-2 h-4 w-4" />Download
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="text-slate-400"><Lock className="mr-2 h-4 w-4" />Restricted</DropdownMenuItem>
                          )}
                          {canEdit && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}/signature?mode=send&returnTo=/spaces/${params.id}`)}>
                                <FileSignature className="mr-2 h-4 w-4" />Send for Signature
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedFile(doc); setNewFilename(doc.name); setShowRenameDialog(true) }}>
                                <Edit className="mr-2 h-4 w-4" />Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedFile(doc); setShowMoveDialog(true) }}>
                                <Activity className="mr-2 h-4 w-4" />Move to Folder
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

              {/* Desktop: clean table, no card wrapper */}
              <table className="w-full hidden lg:table">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                      <input type="checkbox" className="rounded" checked={selectAll} onChange={handleSelectAll} />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Folder</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Activity</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last updated</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
  {getFilteredDocuments() // ✅ Use the filtered documents
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 10)
    .map((doc) => (
      <tr key={`recent-${doc.id}`} className="hover:bg-slate-50">
        {/*   ADD: Individual Checkbox */}
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          className="rounded"
          checked={selectedDocs.includes(doc.id)}
          onChange={() => handleSelectDoc(doc.id)}
          disabled={doc.signatureStatus === 'completed'}
        />
      </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium text-slate-900">{doc.name}</span>
            {doc.signatureRequestId && (
  <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
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
          {doc.folder ? (
            <button
              onClick={() => {
                setSelectedFolder(doc.folder);
                setShowUnfiledOnly(false); // ✅ Clear filter when clicking folder badge
                setActiveTab('home');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-sm text-blue-700"
            >
              <Folder className="h-3 w-3" />
              <span>{folders.find(f => f.id === doc.folder)?.name || 'Unknown'}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-600">
              <Home className="h-3 w-3" />
              <span>Unfiled</span>
            </span>
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
        <td className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              {/* ✅ FIX 3: Proper View handler */}
              <DropdownMenuItem onClick={async () => {
                try {
                  window.open(`/api/spaces/${params.id}/files/${doc.id}/view`, '_blank');
                } catch (err) {
                  console.error('View error:', err);
                  alert('Failed to open document');
                }
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>

              {/* ✅ FIX 4: Proper Download handler */}
              {/* ✅ Show download only if allowed */}
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
        alert('Download failed. Please try again.');
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

              {/* Rest of the menu items... */}
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

              {/* ✅ NEW: Manage Access */}
  {canManageContacts && (
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
  )}
              
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setSelectedFile(doc);
                    setNewFilename(doc.name);
                    setShowRenameDialog(true);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedFile(doc);
                    setShowMoveDialog(true);
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
    ))}
</tbody>
              </table>
             </>
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
      {canCreateFolders && (
  <Button
    onClick={() => setShowCreateFolderDialog(true)}
    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
  >
    <Plus className="h-4 w-4" />
    New Folder
  </Button>
)}
    </div>

    {/* Empty State */}
    {folders.length === 0 ? (
  <div className="py-16 text-center">
    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
      <Folder className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">No folders yet</h3>
    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
      Create folders to organize your documents and keep everything tidy
    </p>
    {canCreateFolders && (
      <Button
        onClick={() => setShowCreateFolderDialog(true)}
        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Plus className="h-4 w-4" />
        Create Your First Folder
      </Button>
    )}
  </div>
) : (
  <>
    {/* ── Mobile: stacked rows ───────────────────────── */}
    <div className="lg:hidden divide-y divide-slate-100">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center gap-3 py-3 px-1"
          onClick={() => { setSelectedFolder(folder.id); setActiveTab('home') }}
        >
          {/* Icon */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Folder className="h-5 w-5 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{folder.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {folder.documentCount} {folder.documentCount === 1 ? 'file' : 'files'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{folder.lastUpdated}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                setSelectedFolder(folder.id); setActiveTab('home')
              }}>
                <FolderOpen className="mr-2 h-4 w-4" />Open Folder
              </DropdownMenuItem>

              {canCreateFolders && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFolder(folder.id); setShowCreateFolderDialog(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" />Create Subfolder
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                setRequestFilesFolder({ id: folder.id, name: folder.name })
                setShowRequestFilesDrawer(true)
              }}>
                <Inbox className="mr-2 h-4 w-4" />Request Files
              </DropdownMenuItem>

              {canManageContacts && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFolderForPermissions(folder.id)
                  fetchFolderPermissions(folder.id)
                  setShowFolderPermissionsDialog(true)
                }}>
                  <Lock className="mr-2 h-4 w-4" />Manage Access
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                const newName = prompt(`Rename "${folder.name}" to:`, folder.name)
                if (!newName || newName.trim() === folder.name) return
                fetch(`/api/spaces/${params.id}/folders/${folder.id}`, {
                  method: 'PATCH', credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newName.trim() })
                }).then(r => r.json()).then(data => {
                  if (data.success) { toast.success(`Renamed to "${newName.trim()}"`); fetchFolders() }
                  else toast.error(data.error || 'Rename failed')
                })
              }}>
                <Edit className="mr-2 h-4 w-4" />Rename
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={async (e) => {
                  e.stopPropagation()
                  const docCount = folder.documentCount || 0
                  const message = docCount > 0
                    ? `Delete "${folder.name}"? The ${docCount} file(s) inside will be moved to root.`
                    : `Delete "${folder.name}"?`
                  if (!confirm(message)) return
                  const res = await fetch(`/api/spaces/${params.id}/folders/${folder.id}?force=true`, {
                    method: 'DELETE', credentials: 'include'
                  })
                  const data = await res.json()
                  if (data.success) { toast.success(data.message); fetchFolders(); fetchSpace() }
                  else toast.error(data.error || 'Delete failed')
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>

    {/* ── Desktop: clean table, no card border ──────── */}
    <table className="w-full hidden lg:table">
      <thead className="border-b border-slate-100">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
            <input type="checkbox" className="rounded" />
          </th>
          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Name
          </th>
          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Items
          </th>
          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Last Modified
          </th>
          <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {folders.map((folder) => (
          <tr
            key={folder.id}
            className="hover:bg-slate-50 transition-colors cursor-pointer group"
            onClick={() => { setSelectedFolder(folder.id); setActiveTab('home') }}
          >
            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="rounded" />
            </td>

            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Folder className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                    {folder.name}
                  </p>
                  <p className="text-xs text-slate-400">Folder</p>
                </div>
              </div>
            </td>

            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm text-slate-700 font-medium">{folder.documentCount}</span>
                <span className="text-sm text-slate-400">{folder.documentCount === 1 ? 'file' : 'files'}</span>
              </div>
            </td>

            <td className="px-4 py-4">
              <span className="text-sm text-slate-500">{folder.lastUpdated}</span>
            </td>

            <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setSelectedFolder(folder.id); setActiveTab('home') }}
                >
                  <Eye className="h-3.5 w-3.5" />
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
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFolder(folder.id); setActiveTab('home')
                    }}>
                      <FolderOpen className="mr-2 h-4 w-4" />Open Folder
                    </DropdownMenuItem>

                    {canCreateFolders && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFolder(folder.id); setShowCreateFolderDialog(true)
                      }}>
                        <Plus className="mr-2 h-4 w-4" />Create Subfolder
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setRequestFilesFolder({ id: folder.id, name: folder.name })
                      setShowRequestFilesDrawer(true)
                    }}>
                      <Inbox className="mr-2 h-4 w-4" />Request Files
                    </DropdownMenuItem>

                    {canManageContacts && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFolderForPermissions(folder.id)
                        fetchFolderPermissions(folder.id)
                        setShowFolderPermissionsDialog(true)
                      }}>
                        <Lock className="mr-2 h-4 w-4" />Manage Access
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      const newName = prompt(`Rename "${folder.name}" to:`, folder.name)
                      if (!newName || newName.trim() === folder.name) return
                      fetch(`/api/spaces/${params.id}/folders/${folder.id}`, {
                        method: 'PATCH', credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newName.trim() })
                      }).then(r => r.json()).then(data => {
                        if (data.success) { toast.success(`Renamed to "${newName.trim()}"`); fetchFolders() }
                        else toast.error(data.error || 'Rename failed')
                      })
                    }}>
                      <Edit className="mr-2 h-4 w-4" />Rename
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const docCount = folder.documentCount || 0
                        const message = docCount > 0
                          ? `Delete "${folder.name}"? The ${docCount} file(s) inside will be moved to root.`
                          : `Delete "${folder.name}"?`
                        if (!confirm(message)) return
                        const res = await fetch(`/api/spaces/${params.id}/folders/${folder.id}?force=true`, {
                          method: 'DELETE', credentials: 'include'
                        })
                        const data = await res.json()
                        if (data.success) { toast.success(data.message); fetchFolders(); fetchSpace() }
                        else toast.error(data.error || 'Delete failed')
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* ── Footer stats ──────────────────────────────── */}
    <div className="flex items-center gap-6 pt-4 mt-2 border-t border-slate-100 text-sm text-slate-500">
      <span className="flex items-center gap-1.5">
        <Folder className="h-4 w-4 text-blue-500" />
        <strong className="text-slate-700">{folders.length}</strong> folders
      </span>
      <span className="flex items-center gap-1.5">
        <FileText className="h-4 w-4 text-green-500" />
        <strong className="text-slate-700">{folders.reduce((sum, f) => sum + f.documentCount, 0)}</strong> files total
      </span>
      <span className="flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-purple-500" />
        <strong className="text-slate-700">{folders.filter(f => f.documentCount > 0).length}</strong> active
      </span>
    </div>
  </>
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
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Q&A</h2>
        <p className="text-sm text-slate-500 mt-1">Questions from portal visitors</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
          {(['all', 'unanswered', 'answered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setQaFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                qaFilter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
              {f === 'unanswered' && qaComments.filter(c => !c.reply).length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                  {qaComments.filter(c => !c.reply).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={fetchQAComments}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${qaLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>

    {qaLoading ? (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ) : qaComments.length === 0 ? (
      <div className="border rounded-xl bg-white p-12 text-center">
        <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">No questions yet</p>
        <p className="text-xs text-slate-400 mt-1">Questions from portal visitors will appear here</p>
      </div>
    ) : (
      <div className="space-y-3">
        {(() => {
          const groupedComments = qaComments
            .filter(c => {
              if (qaFilter === 'unanswered') return !c.reply
              if (qaFilter === 'answered') return !!c.reply
              return true
            })
            .reduce((acc: Record<string, typeof qaComments>, comment) => {
              const key = comment.email
              if (!acc[key]) acc[key] = []
              acc[key].push(comment)
              return acc
            }, {})

          const entries = Object.entries(groupedComments)

          if (entries.length === 0) return (
            <div className="border rounded-xl bg-white p-10 text-center">
              <p className="text-sm text-slate-400">No {qaFilter} questions</p>
            </div>
          )

          return entries.map(([email, investorComments]) => {
            const unansweredCount = investorComments.filter(c => !c.reply).length
            const firstComment = investorComments[0]
            return (
              <div key={email} className="border rounded-xl overflow-hidden bg-white">
                {/* Visitor header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50">
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-600">{email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
                    {firstComment.linkLabel && (
                      <p className="text-xs text-slate-400">via {firstComment.linkLabel}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{investorComments.length} message{investorComments.length !== 1 ? 's' : ''}</span>
                    {unansweredCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-medium">
                        {unansweredCount} new
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="divide-y divide-slate-100">
                  {investorComments.map(comment => (
                    <div
                      key={comment.id}
                      className={`p-4 ${!comment.reply ? 'border-l-2 border-l-slate-900' : 'border-l-2 border-l-slate-200'}`}
                    >
                      {/* Document tag */}
                      {comment.documentId !== 'general' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 mb-2">
                          <FileText className="h-3 w-3" />
                          {comment.documentName}
                        </div>
                      )}

                      {/* Message */}
                      <p className="text-sm text-slate-800 leading-relaxed">{comment.message}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>

                      {/* Reply */}
                      {comment.reply ? (
                        <div className="mt-3 ml-3 sm:ml-6 border rounded-lg p-3 bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-slate-700">Your reply</p>
                            {comment.repliedAt && (
                              <p className="text-xs text-slate-400">
                                {new Date(comment.repliedAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-slate-700">{comment.reply}</p>
                        </div>
                      ) : replyingTo === comment.id ? (
                        <div className="mt-3 ml-3 sm:ml-6 space-y-2">
                          <textarea
                            autoFocus
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment.id) }
                              if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
                            }}
                            placeholder="Write a reply..."
                            rows={3}
                            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText('') }}
                              className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={sendingReply || !replyText.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40"
                            >
                              {sendingReply
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Sending</>
                                : <><Send className="h-3 w-3" /> Reply</>
                              }
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReplyingTo(comment.id); setReplyText('') }}
                          className="mt-2 ml-3 sm:ml-6 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Send className="h-3 w-3" /> Reply
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        })()}
      </div>
    )}
  </div>
)}

{activeTab === 'members' && (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Members</h2>
        <p className="text-sm text-slate-500 mt-1">{contacts.length} people have access</p>
      </div>
      {canManageContacts && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkInviteDialog(true)}
            className="gap-2 text-xs flex-1 sm:flex-none justify-center"
          >
            <Users className="h-3.5 w-3.5" />
            Bulk Invite
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddContactDialog(true)}
            className="gap-2 text-xs bg-slate-900 hover:bg-slate-800 text-white flex-1 sm:flex-none justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </Button>
        </div>
      )}
    </div>

    {contacts.length === 0 ? (
      <div className="border rounded-xl bg-white p-12 text-center">
        <Users className="h-6 w-6 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">No members yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">Invite people to collaborate in this space</p>
        {canManageContacts && (
          <Button
            size="sm"
            onClick={() => setShowAddContactDialog(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Member
          </Button>
        )}
      </div>
    ) : (
      <div className="border rounded-xl bg-white overflow-hidden">

        {/* Owner row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-slate-50">
          <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400">Space owner</p>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-900 text-white flex-shrink-0">
            Owner
          </span>
        </div>

        {/* Members list */}
        <div className="divide-y divide-slate-100">
          {contacts.map((contact) => (
            <div key={contact.email} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-slate-600">
                  {contact.email.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{contact.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400 capitalize">{contact.role}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">
                    Added {new Date(contact.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {contact.invitationStatus === 'pending' && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-orange-500">Pending</span>
                    </>
                  )}
                </div>
              </div>

              {canManageContacts && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-white">
                    {contact.invitationStatus === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/spaces/${params.id}/contacts`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: contact.email, role: contact.role, resend: true })
                              })
                              const data = await res.json()
                              if (data.success) toast.success(`Invitation resent`)
                              else toast.error(data.error || 'Failed to resend')
                            } catch { toast.error('Failed to resend') }
                          }}
                        >
                          <Mail className="mr-2 h-3.5 w-3.5" />
                          Resend Invite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={async () => {
                        if (!confirm(`Remove ${contact.email}?`)) return
                        try {
                          const res = await fetch(`/api/spaces/${params.id}/members/${contact.email}`, {
                            method: 'DELETE', credentials: 'include'
                          })
                          const data = await res.json()
                          if (data.success) { toast.success('Member removed'); fetchContacts() }
                          else toast.error(data.error || 'Failed to remove')
                        } catch { toast.error('Failed to remove member') }
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>

        {/* Footer count */}
        <div className="px-4 py-3 border-t bg-slate-50">
          <p className="text-xs text-slate-400">{contacts.length + 1} total member{contacts.length + 1 !== 1 ? 's' : ''} including owner</p>
        </div>
      </div>
    )}
  </div>
)}
            {activeTab === 'analytics' && (
  <AnalyticsTab spaceId={params.id as string} spaceName={space?.name} />
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
                  onClick={() => {
                    window.open(`/api/spaces/${params.id}/files/${doc.id}/view`, '_blank')
                  }}
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
                defaultValue={space?.name}
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

            <Button className="bg-purple-600 hover:bg-purple-700">
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
  onClick={async () => {
    if (!confirm(`Archive "${space?.name}"? It will be hidden from your active spaces but not deleted.`)) return
    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Space archived')
        router.push('/spaces')
      } else {
        toast.error(data.error || 'Failed to archive space')
      }
    } catch {
      toast.error('Failed to archive space')
    }
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
  onClick={async () => {
    const confirmed = confirm(
      `Permanently delete "${space?.name}"?\n\nThis will delete all ${documents.length} documents and cannot be undone.`
    )
    if (!confirmed) return

    const doubleConfirmed = confirm(`Are you absolutely sure? Type OK to confirm deletion.`)
    if (!doubleConfirmed) return

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Space permanently deleted')
        router.push('/spaces')
      } else {
        toast.error(data.error || 'Failed to delete space')
      }
    } catch {
      toast.error('Failed to delete space')
    }
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
          // TODO: Implement send for signature
          console.log('Send for signature:', selectedFile)
          alert('E-signature feature coming soon!')
          setShowSignatureDialog(false)
        }}
      >
        Send for Signature
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* ✅ Folder Permissions Dialog */}
<Dialog open={showFolderPermissionsDialog} onOpenChange={setShowFolderPermissionsDialog}>
  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-purple-600" />
        Manage Folder Access
      </DialogTitle>
      <DialogDescription>
        Control who can access "{folders.find(f => f.id === selectedFolderForPermissions)?.name}"
      </DialogDescription>
    </DialogHeader>

    <Tabs defaultValue="permissions" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="permissions">Current Access</TabsTrigger>
        <TabsTrigger value="grant">Grant Access</TabsTrigger>
      </TabsList>

      {/* Current Permissions Tab */}
      <TabsContent value="permissions" className="space-y-4 mt-4">
        {loadingPermissions ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
            <p className="text-slate-600">Loading permissions...</p>
          </div>
        ) : folderPermissions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No specific permissions set</p>
            <p className="text-sm text-slate-500 mt-1">
              Space members with editor/admin roles can access this folder
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {folderPermissions.map((permission) => (
              <div
                key={permission.id}
                className={`border rounded-lg p-4 ${
                  permission.isExpired ? 'bg-red-50 border-red-200' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold flex-shrink-0">
                      {permission.grantedTo.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {permission.grantedTo}
                        </p>
                        {permission.isExpired && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {/* Role Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${
                          permission.role === 'editor' ? 'bg-green-100 text-green-700' :
                          permission.role === 'viewer' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {permission.role === 'editor' && '✏️'}
                          {permission.role === 'viewer' && '👁️'}
                          {permission.role === 'restricted' && '🔒'}
                          {permission.role.charAt(0).toUpperCase() + permission.role.slice(1)}
                        </span>

                        {/* Download Permission */}
                        {permission.canDownload ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                            <Download className="h-3 w-3" />
                            Can Download
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 text-yellow-700">
                            <Eye className="h-3 w-3" />
                            View Only
                          </span>
                        )}

                        {/* Watermark */}
                        {permission.watermarkEnabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-700">
                            <ShieldCheck className="h-3 w-3" />
                            Watermark
                          </span>
                        )}

                        {/* Expiration */}
                        {permission.expiresAt && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                            <Calendar className="h-3 w-3" />
                            Expires {new Date(permission.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2">
                        Granted by {permission.grantedBy} on {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeFolderPermission(permission.grantedTo)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Grant Access Tab */}
      <TabsContent value="grant" className="space-y-4 mt-4">
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <Label className="text-sm font-medium text-slate-700">Email Address *</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={newPermissionEmail}
              onChange={(e) => setNewPermissionEmail(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Role Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">
              Access Level *
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setNewPermissionRole('viewer')
                  setNewPermissionCanDownload(true)
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  newPermissionRole === 'viewer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <Eye className="h-5 w-5 text-blue-600 mb-2" />
                <div className="font-semibold text-slate-900 text-sm">Viewer</div>
                <div className="text-xs text-slate-600 mt-1">View & Download</div>
              </button>

              <button
                onClick={() => {
                  setNewPermissionRole('editor')
                  setNewPermissionCanDownload(true)
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  newPermissionRole === 'editor'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <Edit className="h-5 w-5 text-green-600 mb-2" />
                <div className="font-semibold text-slate-900 text-sm">Editor</div>
                <div className="text-xs text-slate-600 mt-1">Upload & Edit</div>
              </button>

              <button
                onClick={() => {
                  setNewPermissionRole('restricted')
                  setNewPermissionCanDownload(false)
                }}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  newPermissionRole === 'restricted'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <Lock className="h-5 w-5 text-orange-600 mb-2" />
                <div className="font-semibold text-slate-900 text-sm">Restricted</div>
                <div className="text-xs text-slate-600 mt-1">View Only (No Download)</div>
              </button>
            </div>
          </div>

          {/* Download Permission Toggle */}
          {newPermissionRole !== 'restricted' && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">Allow Downloads</p>
                <p className="text-sm text-slate-600">User can download files from this folder</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPermissionCanDownload}
                  onChange={(e) => setNewPermissionCanDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          )}

          {/* Watermark Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Enable Watermark</p>
              <p className="text-sm text-slate-600">Show user's email on viewed documents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newPermissionWatermark}
                onChange={(e) => setNewPermissionWatermark(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Expiration Date */}
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Expiration Date (Optional)
            </Label>
            <Input
              type="datetime-local"
              value={newPermissionExpiresAt}
              onChange={(e) => setNewPermissionExpiresAt(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">
              Access will automatically expire after this date
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Access Summary:</p>
                <ul className="space-y-1">
                  <li>• Role: <strong>{newPermissionRole}</strong></li>
                  <li>• Download: <strong>{newPermissionCanDownload ? 'Allowed' : 'Blocked'}</strong></li>
                  <li>• Watermark: <strong>{newPermissionWatermark ? 'Enabled' : 'Disabled'}</strong></li>
                  {newPermissionExpiresAt && (
                    <li>• Expires: <strong>{new Date(newPermissionExpiresAt).toLocaleString()}</strong></li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setNewPermissionEmail('')
                setNewPermissionRole('viewer')
                setNewPermissionCanDownload(true)
                setNewPermissionExpiresAt('')
                setNewPermissionWatermark(false)
              }}
              disabled={addingPermission}
            >
              Clear
            </Button>
            <Button
              onClick={handleGrantFolderPermission}
              disabled={!newPermissionEmail.trim() || addingPermission}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {addingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Granting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Grant Access
                </>
              )}
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <div className="flex justify-end pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => {
          setShowFolderPermissionsDialog(false)
          setSelectedFolderForPermissions(null)
          setFolderPermissions([])
        }}
      >
        Close
      </Button>
    </div>
  </DialogContent>
</Dialog>

 

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
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-white">
                            {signature.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
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
                              alert('✅ Signature details copied!');
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

    </div>
  )
}


