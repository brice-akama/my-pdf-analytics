// app/spaces/[id]/components/PermissionsTab.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Share2, Lock, Users, Globe, Key, Eye, Download,
  ChevronDown, ChevronRight, Copy, X, RefreshCw,
  Shield, Clock, AlertCircle, CheckCircle2, Loader2,
  MoreVertical, Trash2, Calendar, Droplets, Folder,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type ShareLink = {
  shareLink:     string
  label:         string | null
  securityLevel: string
  createdAt:     string | null
  expiresAt:     string | null
  viewLimit:     number | null
  currentViews:  number
  enabled:       boolean
  publicUrl:     string
  // from analytics — merged in
  visits?:       number
  visitors?:     number
  downloads?:    number
  status?:       'hot' | 'warm' | 'cold' | 'never'
  allowDownloads?:  boolean
  allowQA?:         boolean
  enableWatermark?: boolean
  requireNDA?:      boolean
  allowedEmails?:   string[]
  allowedDomains?:  string[]
}

type FolderPermission = {
  id:               string
  folderId:         string
  folderName:       string
  grantedTo:        string
  role:             string
  canDownload:      boolean
  canUpload:        boolean
  expiresAt:        string | null
  watermarkEnabled: boolean
  grantedBy:        string
  grantedAt:        string
  isExpired:        boolean
}

type FolderWithPerms = {
  id:          string
  name:        string
  permissions: FolderPermission[]
  loading:     boolean
  expanded:    boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string | null) {
  if (!d) return 'Never'
  const diff  = Date.now() - new Date(d).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function securityBadge(level: string) {
  if (level === 'whitelist') return { label: 'Whitelist', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Shield }
  if (level === 'password')  return { label: 'Password',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: Key }
  return { label: 'Open', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Globe }
}

function statusDot(enabled: boolean, expiresAt: string | null) {
  if (!enabled) return { color: 'bg-slate-300', label: 'Disabled' }
  if (expiresAt && new Date(expiresAt) < new Date()) return { color: 'bg-red-400', label: 'Expired' }
  return { color: 'bg-emerald-400', label: 'Active' }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PermissionsTab({
  spaceId,
  folders,
  canManage,
}: {
  spaceId:    string
  folders:    Array<{ id: string; name: string }>
  canManage:  boolean
}) {
  const [activeSection, setActiveSection] = useState<'links' | 'folders'>('links')

  // ── Share Links state ──────────────────────────────────────────────────────
  const [links,         setLinks]         = useState<ShareLink[]>([])
  const [linksLoading,  setLinksLoading]  = useState(true)
  const [expandedLink,  setExpandedLink]  = useState<string | null>(null)
  const [togglingLink,  setTogglingLink]  = useState<string | null>(null)

  // ── Folder Permissions state ───────────────────────────────────────────────
  const [folderRows,    setFolderRows]    = useState<FolderWithPerms[]>([])

  // ── Fetch share links ──────────────────────────────────────────────────────
  const fetchLinks = useCallback(async () => {
    setLinksLoading(true)
    try {
      const [linksRes, analyticsRes] = await Promise.all([
        fetch(`/api/spaces/${spaceId}/public-access`, { credentials: 'include' }),
        fetch(`/api/spaces/${spaceId}/analytics`,     { credentials: 'include' }),
      ])
      const linksData     = await linksRes.json()
      const analyticsData = await analyticsRes.json()

      if (linksData.success) {
        const analyticsLinks = analyticsData.analytics?.shareLinks || []
        const merged = (linksData.links || [])
          .filter((l: any) => l && l.shareLink)
          .map((l: ShareLink) => {
          const al = analyticsLinks.find((a: any) => a.shareLink === l.shareLink)
          return {
            ...l,
            visits:    al?.visits    ?? 0,
            visitors:  al?.visitors  ?? 0,
            downloads: al?.downloads ?? 0,
            status:    al?.status    ?? 'never',
          }
        })
        setLinks(merged)
      }
    } catch {
      toast.error('Failed to load share links')
    } finally {
      setLinksLoading(false)
    }
  }, [spaceId])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  // ── Init folder rows ───────────────────────────────────────────────────────
  useEffect(() => {
    setFolderRows(folders.map(f => ({
      id:          f.id,
      name:        f.name,
      permissions: [],
      loading:     false,
      expanded:    false,
    })))
  }, [folders])

  // ── Toggle link ────────────────────────────────────────────────────────────
  const toggleLink = async (link: ShareLink) => {
    setTogglingLink(link.shareLink)
    try {
      const res  = await fetch(`/api/spaces/${spaceId}/public-access`, {
        method:  'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shareLink: link.shareLink, updates: { enabled: !link.enabled } }),
      })
      const data = await res.json()
      if (data.success) {
        setLinks(prev => prev.map(l =>
          l.shareLink === link.shareLink ? { ...l, enabled: !l.enabled } : l
        ))
        toast.success(link.enabled ? 'Link disabled' : 'Link enabled')
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setTogglingLink(null)
    }
  }

  // ── Delete link ────────────────────────────────────────────────────────────
  const deleteLink = async (shareLink: string) => {
    if (!confirm('Permanently delete this link?')) return
    try {
      const res  = await fetch(
        `/api/spaces/${spaceId}/public-access?shareLink=${shareLink}`,
        { method: 'DELETE', credentials: 'include' }
      )
      const data = await res.json()
      if (data.success) {
        setLinks(prev => prev.filter(l => l.shareLink !== shareLink))
        toast.success('Link deleted')
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // ── Expand folder and fetch permissions ────────────────────────────────────
  const toggleFolder = async (folderId: string) => {
    const row = folderRows.find(f => f.id === folderId)
    if (!row) return

    if (row.expanded) {
      setFolderRows(prev => prev.map(f => f.id === folderId ? { ...f, expanded: false } : f))
      return
    }

    // already fetched — just expand
    if (row.permissions.length > 0) {
      setFolderRows(prev => prev.map(f => f.id === folderId ? { ...f, expanded: true } : f))
      return
    }

    // fetch
    setFolderRows(prev => prev.map(f => f.id === folderId ? { ...f, loading: true, expanded: true } : f))
    try {
      const res  = await fetch(
        `/api/spaces/${spaceId}/folders/${folderId}/permissions`,
        { credentials: 'include' }
      )
      const data = await res.json()
      setFolderRows(prev => prev.map(f =>
        f.id === folderId
          ? { ...f, loading: false, permissions: data.success ? data.permissions : [] }
          : f
      ))
    } catch {
      setFolderRows(prev => prev.map(f =>
        f.id === folderId ? { ...f, loading: false } : f
      ))
    }
  }

  // ── Revoke folder permission ───────────────────────────────────────────────
  const revokePermission = async (folderId: string, email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return
    try {
      const res  = await fetch(
        `/api/spaces/${spaceId}/folders/${folderId}/permissions/${encodeURIComponent(email)}`,
        { method: 'DELETE', credentials: 'include' }
      )
      const data = await res.json()
      if (data.success) {
        setFolderRows(prev => prev.map(f =>
          f.id === folderId
            ? { ...f, permissions: f.permissions.filter(p => p.grantedTo !== email) }
            : f
        ))
        toast.success('Access revoked')
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────
  const activeLinks   = links.filter(l => l.enabled && !(l.expiresAt && new Date(l.expiresAt) < new Date())).length
  const disabledLinks = links.filter(l => !l.enabled).length
  const expiredLinks  = links.filter(l => l.expiresAt && new Date(l.expiresAt) < new Date()).length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Permissions</h2>
          <p className="text-sm text-slate-500 mt-1">Manage who can access this space and how</p>
        </div>
        <button
          onClick={fetchLinks}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Summary cards — same pattern as analytics overview ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <p className="text-xs font-medium text-slate-400 mb-2">Share Links</p>
          <p className="text-3xl font-bold">{links.length}</p>
          <p className="text-xs text-slate-400 mt-1">total created</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">Active</p>
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeLinks}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">Disabled</p>
            <div className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{disabledLinks}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500">Expired</p>
            <div className="h-2 w-2 rounded-full bg-red-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{expiredLinks}</p>
        </div>
      </div>

      {/* ── Section tabs — identical to analytics ─────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['links', 'folders'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
              activeSection === s
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s === 'links'   && `Share Links (${links.length})`}
            {s === 'folders' && `Folder Access (${folders.length})`}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SHARE LINKS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'links' && (
        <div className="space-y-3">
          {linksLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : links.length === 0 ? (
            <div className="py-16 text-center border rounded-xl bg-white">
              <Share2 className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No share links yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a link from the Share button to start</p>
            </div>
          ) : (
            links.map(link => {
              const sec    = securityBadge(link.securityLevel || 'open')
              const SecIcon = sec.icon
              const dot    = statusDot(link.enabled ?? true, link.expiresAt ?? null)
              const isExp  = !!link.shareLink && expandedLink === link.shareLink
              const toggling = !!link.shareLink && togglingLink === link.shareLink

              return (
                <div key={link.shareLink || Math.random().toString()} className="border rounded-xl bg-white overflow-hidden">

                  {/* ── Main row ── */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedLink(isExp ? null : link.shareLink)}
                  >
                    {/* Status dot */}
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${dot.color}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {link.label || 'Untitled Link'}
                        </p>
                        {/* Security badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sec.bg} ${sec.text} ${sec.border}`}>
                          <SecIcon className="h-3 w-3" />
                          {sec.label}
                        </span>
                        {/* Status label */}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          dot.label === 'Active'   ? 'bg-emerald-50 text-emerald-700' :
                          dot.label === 'Expired'  ? 'bg-red-50 text-red-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {dot.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-400 font-mono">{(link.shareLink || '').slice(0, 14)}…</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400">Created {timeAgo(link.createdAt)}</span>
                        {link.expiresAt && (
                          <>
                            <span className="text-slate-200">·</span>
                            <span className={`text-xs ${new Date(link.expiresAt) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>
                              {new Date(link.expiresAt) < new Date() ? 'Expired' : 'Expires'}{' '}
                              {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Toggle switch */}
                    <div onClick={e => { e.stopPropagation(); if (!toggling && canManage) toggleLink(link) }}>
                      <button
                        disabled={toggling || !canManage}
                        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                          toggling ? 'opacity-50 cursor-wait' :
                          canManage ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        style={{ background: link.enabled ? '#0f172a' : '#e2e8f0' }}
                      >
                        <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${link.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <ChevronDown className={`h-4 w-4 text-slate-300 flex-shrink-0 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  </div>

                  {/* ── Stats strip — same as analytics ── */}
                  <div className="grid grid-cols-3 divide-x border-t bg-slate-50">
                    {[
                      { label: 'Visits',    value: link.visits    ?? 0 },
                      { label: 'People',    value: link.visitors  ?? 0 },
                      { label: 'Downloads', value: link.downloads ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="px-3 py-2 text-center">
                        <p className={`text-base font-bold ${value === 0 ? 'text-slate-300' : 'text-slate-900'}`}>{value}</p>
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Expanded panel ── */}
                  {isExp && (
                    <div className="border-t px-5 py-4 space-y-4">

                      {/* Permissions granted on this link */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                          Link Permissions
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { icon: Download, label: 'Downloads',  value: link.allowDownloads !== false ? 'Allowed'  : 'Blocked' },
                            { icon: Droplets, label: 'Watermark',  value: link.enableWatermark ? 'Enabled'  : 'Off'    },
                            { icon: Eye,      label: 'View limit', value: link.viewLimit ? `${link.currentViews}/${link.viewLimit}` : 'Unlimited' },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                                <p className="text-xs font-semibold text-slate-800 mt-0.5">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Whitelist emails/domains */}
                      {link.securityLevel === 'whitelist' && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Allowed Emails / Domains
                          </p>
                          {(link.allowedEmails?.length || 0) + (link.allowedDomains?.length || 0) === 0 ? (
                            <p className="text-xs text-slate-400">No restrictions set</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {(link.allowedEmails || []).map(e => (
                                <span key={e} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-xs text-purple-700">
                                  <Users className="h-3 w-3" />{e}
                                </span>
                              ))}
                              {(link.allowedDomains || []).map(d => (
                                <span key={d} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700">
                                  <Globe className="h-3 w-3" />@{d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t">
                        <button
                          onClick={() => { navigator.clipboard.writeText(link.publicUrl); toast.success('Copied!') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border hover:bg-slate-50 transition-colors"
                        >
                          <Copy className="h-3 w-3" /> Copy link
                        </button>

                        {canManage && (
                          <button
                            onClick={() => deleteLink(link.shareLink)}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
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

      {/* ══════════════════════════════════════════════════════════════════════
          FOLDER PERMISSIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'folders' && (
        <div className="space-y-3">
          {folderRows.length === 0 ? (
            <div className="py-16 text-center border rounded-xl bg-white">
              <Folder className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">No folders in this space</p>
              <p className="text-xs text-slate-400 mt-1">Create folders to manage granular access</p>
            </div>
          ) : (
            folderRows.map(folder => (
              <div key={folder.id} className="border rounded-xl bg-white overflow-hidden">

                {/* Folder row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Folder className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{folder.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {folder.permissions.length > 0
                        ? `${folder.permissions.length} permission${folder.permissions.length !== 1 ? 's' : ''} set`
                        : folder.expanded && !folder.loading
                        ? 'No custom permissions'
                        : 'Click to view permissions'}
                    </p>
                  </div>

                  {folder.loading
                    ? <Loader2 className="h-4 w-4 animate-spin text-slate-300 flex-shrink-0" />
                    : <ChevronDown className={`h-4 w-4 text-slate-300 flex-shrink-0 transition-transform ${folder.expanded ? 'rotate-180' : ''}`} />
                  }
                </div>

                {/* ── Permissions list ── */}
                {folder.expanded && !folder.loading && (
                  <div className="border-t">
                    {folder.permissions.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <Shield className="h-5 w-5 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">No custom permissions</p>
                        <p className="text-xs text-slate-400 mt-1">Space members can access based on their space role</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {folder.permissions.map(perm => (
                          <div key={perm.id} className={`flex items-start gap-3 px-5 py-3.5 ${perm.isExpired ? 'bg-red-50/50' : ''}`}>

                            {/* Avatar */}
                            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-slate-600">
                                {perm.grantedTo.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-slate-900 truncate">{perm.grantedTo}</p>
                                {perm.isExpired && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Expired</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {/* Role */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                  perm.role === 'editor'     ? 'bg-green-50 text-green-700 border border-green-200' :
                                  perm.role === 'restricted' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {perm.role === 'editor' ? '✏️' : perm.role === 'restricted' ? '🔒' : '👁️'}
                                  {' '}{perm.role.charAt(0).toUpperCase() + perm.role.slice(1)}
                                </span>

                                {/* Download */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
                                  perm.canDownload
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                  {perm.canDownload ? <Download className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                  {perm.canDownload ? 'Download' : 'View only'}
                                </span>

                                {/* Watermark */}
                                {perm.watermarkEnabled && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                    <Droplets className="h-3 w-3" /> Watermark
                                  </span>
                                )}

                                {/* Expiry */}
                                {perm.expiresAt && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
                                    perm.isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    <Calendar className="h-3 w-3" />
                                    {new Date(perm.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-400 mt-1.5">
                                Granted by {perm.grantedBy} · {timeAgo(perm.grantedAt)}
                              </p>
                            </div>

                            {/* Revoke */}
                            {canManage && (
                              <button
                                onClick={() => revokePermission(folder.id, perm.grantedTo)}
                                className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors mt-0.5"
                                title="Revoke access"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer hint */}
                    {canManage && (
                      <div className="px-5 py-3 border-t bg-slate-50">
                        <p className="text-xs text-slate-400">
                          To grant access, right-click a folder from the Home tab → Manage Access
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}