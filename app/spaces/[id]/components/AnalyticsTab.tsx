"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  RefreshCw,
  Share2,
  Users,
  Eye,
  Download,
  Activity,
  FileText,
  ChevronRight,
  Copy,
  X,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

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

function eventLabel(event: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    'document_view': { label: 'Viewed document', color: 'text-blue-600 bg-blue-50' },
    'view': { label: 'Viewed document', color: 'text-blue-600 bg-blue-50' },
    'download': { label: 'Downloaded', color: 'text-green-600 bg-green-50' },
    'space_open': { label: 'Opened doc', color: 'text-purple-600 bg-purple-50' },
    'portal_enter': { label: 'Opened doc', color: 'text-purple-600 bg-purple-50' },
    'question_asked': { label: 'Asked a question', color: 'text-orange-600 bg-orange-50' },
    'nda_signed': { label: 'Signed NDA', color: 'text-green-700 bg-green-100' },
    'revisit': { label: 'Revisited', color: 'text-indigo-600 bg-indigo-50' },
  }
  return map[event] || { label: event, color: 'text-slate-600 bg-slate-100' }
}

function securityIcon(level: string) {
  if (level === 'whitelist') return { label: 'Whitelist', color: 'text-purple-700 bg-purple-50' }
  if (level === 'password') return { label: 'Password', color: 'text-blue-700 bg-blue-50' }
  return { label: 'Open', color: 'text-slate-600 bg-slate-100' }
}

export function AnalyticsTab({ spaceId, spaceName }: { spaceId: string; spaceName: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'links' | 'visitors' | 'documents' | 'timeline'>('links')
  const [expandedLink, setExpandedLink] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/analytics`, { credentials: 'include' })
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
  const shareLinks = data.shareLinks ?? []
  const maxDaily = Math.max(...dailyVisits.map(d => d.count), 1)

  const heatLabel =
    overview.dealHeatScore >= 70 ? { text: 'High activity', color: 'text-red-600 bg-red-50 border-red-200' }
    : overview.dealHeatScore >= 40 ? { text: 'Moderate activity', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    : overview.dealHeatScore >= 15 ? { text: 'Low activity', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    : { text: 'No activity', color: 'text-slate-500 bg-slate-50 border-slate-200' }

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
            {s === 'links' && `Links (${shareLinks?.length ?? 0})`}
            {s === 'visitors' && `Visitors (${visitors?.length ?? 0})`}
            {s === 'documents' && `Documents (${documents?.length ?? 0})`}
            {s === 'timeline' && `Activity`}
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
                      link.status === 'hot' ? 'bg-red-50 text-red-600' :
                      link.status === 'warm' ? 'bg-orange-50 text-orange-600' :
                      link.status === 'cold' ? 'bg-blue-50 text-blue-600' :
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
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!window.confirm('Disable this link?')) return
                              fetch(`/api/spaces/${spaceId}/public-access`, {
                                method: 'PATCH', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ shareLink: link.shareLink, updates: { enabled: false } })
                              }).then(r => r.json()).then(data => {
                                if (data.success) { toast.success('Link disabled'); fetchAnalytics() }
                                else toast.error(data.error || 'Failed')
                              }).catch(() => toast.error('Failed'))
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
                                      vd.status === 'hot' ? 'bg-red-50 text-red-600' :
                                      vd.status === 'warm' ? 'bg-orange-50 text-orange-600' :
                                      vd.status === 'new' ? 'bg-purple-50 text-purple-600' :
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
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{v.email}</p>
                    <p className="text-xs text-slate-400">First seen {timeAgo(v.firstSeen)}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                  v.status === 'hot' ? 'bg-red-50 text-red-600' :
                  v.status === 'warm' ? 'bg-orange-50 text-orange-600' :
                  v.status === 'new' ? 'bg-purple-50 text-purple-600' :
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

          .    <div className="flex items-center gap-2 mt-3">
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