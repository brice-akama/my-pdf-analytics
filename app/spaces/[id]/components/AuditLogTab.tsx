"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Download,
  RefreshCw,
  Search,
  X,
  Activity,
  FileText,
  Users,
  Share2,
  Eye,
  Settings,
  AlertCircle,
  Loader2,
  ChevronDown
} from "lucide-react"

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

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

export function AuditLogTab({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<'all' | 'documents' | 'members' | 'links' | 'visitors' | 'settings'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const filtered = searchQuery.trim()
    ? events.filter(e =>
        e.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.actor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.documentName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events

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

  const groupedEvents = filtered.reduce((acc: Record<string, AuditEvent[]>, event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

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
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2">
              {date}
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="border rounded-xl bg-white overflow-hidden">
            {dateEvents.map((event, idx) => {
              const isExpanded = expandedId === event.id
              const isLast = idx === dateEvents.length - 1

              return (
                <div key={event.id}>
                  <div
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !isLast ? 'border-b border-slate-100' : ''
                    } ${isExpanded ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0 ${
                      event.category === 'documents' ? 'bg-blue-400' :
                      event.category === 'members'   ? 'bg-purple-400' :
                      event.category === 'links'     ? 'bg-indigo-400' :
                      event.category === 'visitors'  ? 'bg-green-400' :
                      event.category === 'settings'  ? 'bg-orange-400' :
                      'bg-slate-400'
                    }`} />

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