"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus, Search, FolderOpen, Users, Lock, Eye, Share2, MoreVertical,
  FileText, ArrowLeft, Briefcase, DollarSign, Target, Link as LinkIcon,
  Copy, Trash2, Archive, X, RotateCcw, Mail, ChevronDown, Check,
} from "lucide-react"
import PageInfoTooltip from "@/components/PageInfoTooltip"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import * as React from "react"

// ─── Drawer (reused for create, templates, quick-invite) ──────────────────────
function Drawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  children: React.ReactNode
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-7">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  confirmClassName = "bg-gray-900 text-white hover:bg-gray-800",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  confirmClassName?: string
  onConfirm: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-6">{description}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onOpenChange(false) }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${confirmClassName}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
type SpaceType = {
  _id: string
  name: string
  description: string
  type: 'deal' | 'fundraising' | 'client' | 'custom'
  status: 'active' | 'archived' | 'draft'
  owner?: { name: string; email: string }
  teamMembers: number
  documentsCount: number
  viewsCount: number
  lastActivity: string
  createdAt: string
  color: string
  icon: string
  permissions: { canView: boolean; canEdit: boolean; canShare: boolean; canDownload: boolean }
}

type FilterType = 'all' | 'active' | 'archived'

const TEMPLATES = [
  { id: 'sales-proposal', name: 'Sales Proposal Room', description: 'Professional space for closing deals with prospects and clients', icon: '💼', color: 'from-blue-500 to-blue-600', type: 'deal', folders: ['Proposal & Pricing', 'Case Studies & Testimonials', 'Product Demos & Specs', 'Contract & Terms', 'Company Info & Credentials'] },
  { id: 'client-portal', name: 'Client Portal', description: 'Ongoing collaboration space for client projects and deliverables', icon: '🎯', color: 'from-cyan-500 to-cyan-600', type: 'client', folders: ['Welcome & Getting Started', 'Active Contracts & SOWs', 'Project Deliverables', 'Invoices & Payments', 'Support & Resources'] },
  { id: 'partnership-deal', name: 'Partnership Deal Room', description: 'Secure space for vendor partnerships and B2B collaborations', icon: '🤝', color: 'from-purple-500 to-purple-600', type: 'deal', folders: ['Partnership Proposal', 'Legal & Agreements', 'Integration & Technical Docs', 'Marketing & Co-Branding', 'Pricing & Commission'] },
  { id: 'rfp-response', name: 'RFP Response Room', description: 'Organized workspace for responding to RFPs and tender documents', icon: '📋', color: 'from-orange-500 to-orange-600', type: 'deal', folders: ['RFP Requirements', 'Technical Response', 'Pricing & Budget', 'Company Qualifications', 'References & Past Work', 'Compliance & Certifications'] },
  { id: 'quick-nda', name: 'Quick NDA Share', description: 'Simple, fast setup for confidential document sharing with NDA', icon: '🔒', color: 'from-green-500 to-green-600', type: 'custom', folders: ['NDA Document', 'Confidential Materials'] },
  { id: 'employee-onboarding', name: 'Employee Onboarding', description: 'Streamlined space for new hire paperwork and training materials', icon: '👥', color: 'from-indigo-500 to-indigo-600', type: 'custom', folders: ['Offer Letter & Contract', 'Company Policies & Handbook', 'Benefits & Payroll Forms', 'Training Materials', 'Equipment & Access'] },
]

const EMPTY_FORM = {
  name: '', description: '', type: 'custom' as SpaceType['type'], template: '',
  privacy: 'private', autoExpiry: false, expiryDate: '', requireNDA: false,
  enableWatermark: false, allowDownloads: true, notifyOnView: true,
}

const ROLES = [
  { value: 'viewer', label: 'Viewer', desc: 'Can view documents only', icon: '👁️' },
  { value: 'editor', label: 'Editor', desc: 'Can upload and edit', icon: '✏️' },
  { value: 'admin', label: 'Admin', desc: 'Full access', icon: '⚡' },
] as const

type InviteRole = 'viewer' | 'editor' | 'admin'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SpacesPage() {
  const router = useRouter()

  const [allSpaces, setAllSpaces] = useState<SpaceType[]>([])
  const [allMemberSpaces, setAllMemberSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>('all')

  // Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState(false)
  const [showInviteDrawer, setShowInviteDrawer] = useState(false)

  // Invite drawer state
  const [inviteTargetSpace, setInviteTargetSpace] = useState<SpaceType | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<InviteRole>('viewer')
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    confirmClassName: string
    onConfirm: () => void
  }>({
    open: false, title: '', description: '',
    confirmLabel: 'Confirm', confirmClassName: 'bg-gray-900 text-white hover:bg-gray-800',
    onConfirm: () => {}
  })

  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [newSpace, setNewSpace] = useState(EMPTY_FORM)

  // ── Fetch once on mount ────────────────────────────────────────────────────
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/spaces', { credentials: 'include' })
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json()
      if (data.success) {
        const mine = data.spaces.filter((s: any) =>
          s.role === 'owner' || s.role === 'admin' || s.role === 'member' || s.isOwner
        )
        const invited = data.spaces.filter((s: any) =>
          s.role === 'viewer' || s.role === 'editor'
        )
        setAllSpaces(mine)
        setAllMemberSpaces(invited)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchSpaces() }, [fetchSpaces])

  // ── Client-side filter ────────────────────────────────────────────────────
  const filteredSpaces = allSpaces.filter(space => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || space.name.toLowerCase().includes(q) || (space.description || '').toLowerCase().includes(q)
    const matchesFilter = filterType === 'all' || space.status === filterType
    return matchesSearch && matchesFilter
  })

  const filteredMemberSpaces = allMemberSpaces.filter(space => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || space.name.toLowerCase().includes(q) || (space.description || '').toLowerCase().includes(q)
    const matchesFilter = filterType === 'all' || space.status === filterType
    return matchesSearch && matchesFilter
  })

  const activeCount = allSpaces.filter(s => s.status === 'active').length
  const archivedCount = allSpaces.filter(s => s.status === 'archived').length

  // ── Quick Invite ───────────────────────────────────────────────────────────
  const openInviteDrawer = (space: SpaceType, e: React.MouseEvent) => {
    e.stopPropagation()
    setInviteTargetSpace(space)
    setInviteEmail("")
    setInviteRole('viewer')
    setInviteMessage("")
    setInviteSent(false)
    setShowInviteDrawer(true)
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteTargetSpace) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    setInviting(true)
    try {
      const res = await fetch(`/api/spaces/${inviteTargetSpace._id}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setInviteSent(true)
        toast.success(`Invite sent to ${inviteEmail.trim()}`)
      } else {
        toast.error(data.error || 'Failed to send invite')
      }
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleInviteAnother = () => {
    setInviteEmail("")
    setInviteMessage("")
    setInviteSent(false)
  }

  // ── Toggle (archive ↔ activate) ───────────────────────────────────────────
  const handleToggleSpace = async (spaceId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTogglingId(spaceId)
    const newStatus = currentStatus === 'active' ? 'archived' : 'active'
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAllSpaces(prev => prev.map(s =>
          s._id === spaceId ? { ...s, status: newStatus as SpaceType['status'] } : s
        ))
        toast.success(newStatus === 'active' ? 'Space restored' : 'Space archived')
      } else {
        toast.error(data.error || 'Failed to update space status')
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteSpace = (spaceId: string, spaceName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmModal({
      open: true,
      title: `Delete "${spaceName}"?`,
      description: 'This will permanently delete the space and all its documents. This cannot be undone.',
      confirmLabel: 'Delete Permanently',
      confirmClassName: 'bg-red-600 text-white hover:bg-red-700',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/spaces/${spaceId}`, { method: 'DELETE', credentials: 'include' })
          const data = await res.json()
          if (data.success) {
            setAllSpaces(prev => prev.filter(s => s._id !== spaceId))
            toast.success('Space deleted')
          } else {
            toast.error(data.error || 'Failed to delete space')
          }
        } catch {
          toast.error('Failed to delete space')
        }
      }
    })
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const handleDuplicateSpace = async (space: SpaceType, e: React.MouseEvent) => {
    e.stopPropagation()
    const toastId = toast.loading('Duplicating space…')
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${space.name} (Copy)`, description: space.description,
          type: space.type, status: 'active', privacy: 'private',
          allowDownloads: true, notifyOnView: true,
          requireNDA: false, enableWatermark: false, autoExpiry: false,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const newS: SpaceType = {
          _id: data.space._id, name: data.space.name, description: data.space.description || '',
          type: data.space.type, status: 'active', teamMembers: 1,
          documentsCount: 0, viewsCount: 0, lastActivity: new Date().toISOString(),
          createdAt: new Date().toISOString(), color: space.color, icon: '',
          permissions: { canView: true, canEdit: true, canShare: true, canDownload: true },
        }
        setAllSpaces(prev => [newS, ...prev])
        toast.success('Space duplicated', { id: toastId })
      } else {
        toast.error(data.error || 'Failed to duplicate space', { id: toastId })
      }
    } catch {
      toast.error('Failed to duplicate space', { id: toastId })
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreateSpace = async () => {
    if (!newSpace.name.trim()) { toast.error('Please enter a space name'); return }
    setCreating(true)
    const toastId = toast.loading('Creating space…')
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSpace, status: 'active' }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Space created!', { id: toastId })
        setShowCreateDrawer(false)
        setShowTemplatesDrawer(false)
        router.push(`/spaces/${data.space._id}`)
      } else {
        toast.error(data.error || 'Failed to create space', { id: toastId })
      }
    } catch {
      toast.error('Failed to create space. Please try again.', { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTimeAgo = (d: string) => {
    if (!d) return '—'
    const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (secs < 60) return 'Just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
    return new Date(d).toLocaleDateString()
  }

  const SpaceIcon = ({ type }: { type: string }) => {
    if (type === 'deal') return <Briefcase className="h-4 w-4" />
    if (type === 'fundraising') return <DollarSign className="h-4 w-4" />
    if (type === 'client') return <Target className="h-4 w-4" />
    return <FolderOpen className="h-4 w-4" />
  }

  const iconBg: Record<string, string> = {
    deal: 'bg-blue-100 text-blue-600',
    fundraising: 'bg-green-100 text-green-600',
    client: 'bg-cyan-100 text-cyan-600',
    custom: 'bg-purple-100 text-purple-600',
  }

  const typeBadge: Record<string, string> = {
    deal: 'bg-blue-50 text-blue-700',
    fundraising: 'bg-green-50 text-green-700',
    client: 'bg-cyan-50 text-cyan-700',
    custom: 'bg-purple-50 text-purple-700',
  }

  const typeLabel: Record<string, string> = {
    deal: 'Deal', fundraising: 'Fundraising', client: 'Client', custom: 'Custom',
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-9 w-9 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading spaces…</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <PageInfoTooltip pageId="spaces" message="Manage your secure data rooms." position="top" />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
            <span className="text-gray-300">·</span>
            <span className="text-sm font-semibold text-gray-900">Data Rooms</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplatesDrawer(true)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-all bg-white"
            >
              Templates
            </button>
            <button
              onClick={() => setShowCreateDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Space
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Spaces', value: allSpaces.length, cls: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'Active', value: activeCount, cls: 'bg-green-50 text-green-700 border-green-100' },
            { label: 'Documents', value: allSpaces.reduce((n, s) => n + (s.documentsCount || 0), 0), cls: 'bg-purple-50 text-purple-700 border-purple-100' },
            { label: 'Total Views', value: allSpaces.reduce((n, s) => n + (s.viewsCount || 0), 0), cls: 'bg-amber-50 text-amber-700 border-amber-100' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-4 ${s.cls}`}>
              <p className="text-xs font-medium opacity-60 mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filter ── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or description…"
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg">
            {([
              ['all', `All (${allSpaces.length})`],
              ['active', `Active (${activeCount})`],
              ['archived', `Archived (${archivedCount})`],
            ] as [FilterType, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  filterType === f ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty State ── */}
        {filteredSpaces.length === 0 && filteredMemberSpaces.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery
                ? 'No spaces match your search'
                : filterType === 'archived'
                ? 'No archived spaces'
                : filterType === 'active'
                ? 'No active spaces'
                : 'No data rooms yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              {searchQuery
                ? 'Try a different search term.'
                : filterType !== 'all'
                ? 'Try switching the filter above.'
                : 'Create a secure space to organize deals, fundraising, or client projects.'}
            </p>
            {!searchQuery && filterType === 'all' ? (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowTemplatesDrawer(true)}
                  className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
                >
                  Browse Templates
                </button>
                <button
                  onClick={() => setShowCreateDrawer(true)}
                  className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Space
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setSearchQuery(''); setFilterType('all') }}
                className="text-sm text-gray-500 hover:text-gray-900 underline transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── My Spaces Table ── */}
        {filteredSpaces.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">My Spaces</h2>
              <span className="text-xs text-gray-400">{filteredSpaces.length} spaces</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['', 'Name', 'Type', 'Docs', 'Members', 'Last Activity', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        i === 7 ? 'text-right' : 'text-left'
                      } ${i === 0 ? 'w-8' : ''}`}
                    >
                      {i === 0 ? <input type="checkbox" className="rounded border-gray-300" /> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSpaces.map(space => (
                  <tr
                    key={space._id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer group ${
                      space.status === 'archived' ? 'opacity-55' : ''
                    }`}
                    onClick={() => router.push(`/spaces/${space._id}`)}
                  >
                    {/* Checkbox */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>

                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[space.type] || iconBg.custom}`}>
                          <SpaceIcon type={space.type} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {space.name}
                          </p>
                          {space.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{space.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${typeBadge[space.type] || typeBadge.custom}`}>
                        {typeLabel[space.type] || 'Custom'}
                      </span>
                    </td>

                    {/* Docs / Members / Activity */}
                    <td className="px-5 py-3.5 text-sm text-gray-700">{space.documentsCount || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{space.teamMembers || 0}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {formatTimeAgo(space.lastActivity || space.createdAt)}
                    </td>

                    {/* Status toggle */}
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => handleToggleSpace(space._id, space.status, e)}
                          disabled={togglingId === space._id}
                          title={space.status === 'active' ? 'Click to archive' : 'Click to activate'}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            space.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                          } ${togglingId === space._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                            space.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <span className={`text-xs font-medium ${space.status === 'active' ? 'text-green-700' : 'text-gray-400'}`}>
                          {togglingId === space._id ? '…' : space.status === 'active' ? 'Active' : 'Archived'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* ── Quick Open button (hover) ── */}
                        {space.status === 'active' && (
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/spaces/${space._id}`) }}
                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-md transition-all opacity-0 group-hover:opacity-100 bg-white"
                          >
                            Open
                          </button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-all"
                              onClick={e => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-lg">
                            {space.status === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={e => { e.stopPropagation(); router.push(`/spaces/${space._id}`) }}
                                  className="cursor-pointer text-sm"
                                >
                                  <FolderOpen className="mr-2 h-4 w-4" /> Open Space
                                </DropdownMenuItem>

                                {/* ✅ QUICK INVITE — opens drawer inline, no navigation */}
                                <DropdownMenuItem
                                  onClick={e => openInviteDrawer(space, e)}
                                  className="cursor-pointer text-sm"
                                >
                                  <Share2 className="mr-2 h-4 w-4" /> Share Access
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={e => handleDuplicateSpace(space, e)}
                                  className="cursor-pointer text-sm"
                                >
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={e => handleToggleSpace(space._id, space.status, e)}
                                  className="cursor-pointer text-sm"
                                >
                                  <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {space.status === 'archived' && (
                              <DropdownMenuItem
                                onClick={e => handleToggleSpace(space._id, space.status, e)}
                                className="cursor-pointer text-sm text-green-700 focus:text-green-700 focus:bg-green-50"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" /> Restore
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={e => handleDeleteSpace(space._id, space.name, e)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-sm"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {space.status === 'archived' ? 'Delete Permanently' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-2.5 flex items-center justify-between">
              <p className="text-xs text-gray-400">{filteredSpaces.length} of {allSpaces.length} spaces shown</p>
              <p className="text-xs text-gray-400">
                {filteredSpaces.reduce((n, s) => n + (s.documentsCount || 0), 0)} docs ·{' '}
                {filteredSpaces.reduce((n, s) => n + (s.viewsCount || 0), 0)} views
              </p>
            </div>
          </div>
        )}

        {/* ── Shared With You ── */}
        {filteredMemberSpaces.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Shared with You</h2>
              <span className="text-xs text-gray-400">{filteredMemberSpaces.length} spaces</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  {['Name', 'Your Role', 'Docs', 'Members', ''].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMemberSpaces.map(space => (
                  <tr
                    key={space._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/spaces/${space._id}`)}
                  >
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: space.color || '#6366f1' }}
                        >
                          <FolderOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {space.name}
                          </p>
                          {space.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{space.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {space.role === 'admin' ? '⚡ Admin' : space.role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{space.documentsCount || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{space.teamMembers || 0}</td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/spaces/${space._id}`) }}
                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-md transition-all opacity-0 group-hover:opacity-100 bg-white"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          QUICK INVITE DRAWER
          — Lightweight: just email + role + optional message + send
          — Full share link config lives inside spaces/[id]
      ════════════════════════════════════════════════════════════════════════ */}
      <Drawer
        open={showInviteDrawer}
        onOpenChange={open => {
          setShowInviteDrawer(open)
          if (!open) {
            setInviteTargetSpace(null)
            setInviteSent(false)
            setInviteEmail("")
          }
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Access</h2>
            {inviteTargetSpace && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`h-5 w-5 rounded flex items-center justify-center ${iconBg[inviteTargetSpace.type] || iconBg.custom}`}>
                  <SpaceIcon type={inviteTargetSpace.type} />
                </div>
                <p className="text-sm text-gray-500 truncate max-w-[260px]">{inviteTargetSpace.name}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInviteDrawer(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!inviteSent ? (
            /* ── Invite Form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && inviteEmail.trim()) handleSendInvite() }}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access level
                </label>
                <div className="space-y-2">
                  {ROLES.map(role => (
                    <button
                      key={role.value}
                      onClick={() => setInviteRole(role.value)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left ${
                        inviteRole === role.value
                          ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-base">{role.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{role.label}</p>
                        <p className="text-xs text-gray-500">{role.desc}</p>
                      </div>
                      {inviteRole === role.value && (
                        <div className="h-4 w-4 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Add a personal note to your invitation…"
                  rows={3}
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all resize-none"
                />
              </div>

              {/* Info box */}
              <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  They'll receive an email invitation with a secure link to access this space.
                  For advanced share settings (password protection, link expiry, whitelist),{' '}
                  <button
                    onClick={() => {
                      setShowInviteDrawer(false)
                      if (inviteTargetSpace) router.push(`/spaces/${inviteTargetSpace._id}?action=share`)
                    }}
                    className="font-semibold underline underline-offset-2 hover:text-blue-900"
                  >
                    open the space
                  </button>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowInviteDrawer(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Success State ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center py-6"
            >
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Invite sent!</h3>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium text-gray-700">{inviteEmail}</span> will receive an email with access to{' '}
                <span className="font-medium text-gray-700">{inviteTargetSpace?.name}</span>.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleInviteAnother}
                  className="px-4 py-2 text-sm border border-gray-200 text-gray-600 hover:border-gray-400 rounded-xl transition-all"
                >
                  Invite Another
                </button>
                <button
                  onClick={() => setShowInviteDrawer(false)}
                  className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>

      {/* ── Templates Drawer ── */}
      <Drawer open={showTemplatesDrawer} onOpenChange={setShowTemplatesDrawer}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-500 mt-0.5">Start with a pre-configured data room</p>
          </div>
          <button
            onClick={() => setShowTemplatesDrawer(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => {
                setNewSpace({ ...newSpace, name: t.name, type: t.type as SpaceType['type'], template: t.id })
                setShowTemplatesDrawer(false)
                setShowCreateDrawer(true)
              }}
            >
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xl mb-3`}>
                {t.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors text-sm">
                {t.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{t.description}</p>
              <p className="text-xs text-gray-400">
                Includes: {t.folders.slice(0, 2).join(', ')}
                {t.folders.length > 2 && ` +${t.folders.length - 2} more`}
              </p>
            </div>
          ))}
        </div>
      </Drawer>

      {/* ── Create Space Drawer ── */}
      <Drawer
        open={showCreateDrawer}
        onOpenChange={open => { setShowCreateDrawer(open); if (!open) setNewSpace(EMPTY_FORM) }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Data Room</h2>
            <p className="text-sm text-gray-500 mt-0.5">Set up a secure space for your project</p>
          </div>
          <button
            onClick={() => { setShowCreateDrawer(false); setNewSpace(EMPTY_FORM) }}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 mb-4">
            <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
            <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Space Name *</Label>
              <input
                placeholder="e.g., Series A Fundraising Room"
                value={newSpace.name}
                onChange={e => setNewSpace({ ...newSpace, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</Label>
              <textarea
                placeholder="What is this space for?"
                rows={3}
                value={newSpace.description}
                onChange={e => setNewSpace({ ...newSpace, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none"
              />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-0">
            {[
              { key: 'requireNDA', label: 'Require NDA', desc: 'Visitors must sign NDA before access' },
              { key: 'enableWatermark', label: 'Dynamic Watermarks', desc: 'Add viewer email to all documents' },
              { key: 'autoExpiry', label: 'Auto-expire Access', desc: 'Automatically revoke access after date' },
              { key: 'notifyOnView', label: 'View Notifications', desc: 'Get notified when someone views content' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={newSpace[key as keyof typeof newSpace] as boolean}
                  onCheckedChange={v => setNewSpace({ ...newSpace, [key]: v })}
                />
              </div>
            ))}
            {newSpace.autoExpiry && (
              <div className="pt-3">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiry Date</Label>
                <input
                  type="date"
                  value={newSpace.expiryDate}
                  onChange={e => setNewSpace({ ...newSpace, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Allow Downloads</p>
                <p className="text-xs text-gray-500 mt-0.5">Users can download documents</p>
              </div>
              <Switch
                checked={newSpace.allowDownloads}
                onCheckedChange={v => setNewSpace({ ...newSpace, allowDownloads: v })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Privacy Setting</Label>
              <div className="space-y-2">
                {[
                  { value: 'private', icon: Lock, title: 'Private', desc: 'Only invited people can access' },
                  { value: 'link', icon: LinkIcon, title: 'Link Access', desc: 'Anyone with the link can access' },
                ].map(({ value, icon: Icon, title, desc }) => (
                  <button
                    key={value}
                    onClick={() => setNewSpace({ ...newSpace, privacy: value })}
                    className={`w-full flex items-center gap-3 p-3.5 border rounded-xl transition-all text-left ${
                      newSpace.privacy === value
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{title}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => { setShowCreateDrawer(false); setNewSpace(EMPTY_FORM) }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSpace}
            disabled={creating || !newSpace.name.trim()}
            className="px-4 py-2 text-sm bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating…' : 'Create Space'}
          </button>
        </div>
      </Drawer>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={confirmModal.open}
        onOpenChange={open => setConfirmModal(prev => ({ ...prev, open }))}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        confirmClassName={confirmModal.confirmClassName}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  )
}