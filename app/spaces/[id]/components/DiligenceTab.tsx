// app/spaces/[id]/components/DiligenceTab.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock, Users, FileText, TrendingUp, AlertCircle,
  ChevronDown, RefreshCw, Download, Eye, Loader2,
  Activity, BarChart3, Zap, Target, Share2, Filter,
  RotateCcw, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Types ──────────────────────────────────────────────────────────────────────

type DocBreakdown = {
  documentId:    string
  documentName:  string
  totalSeconds:  number
  sessionCount:  number
  openCount:     number
  lastSeen:      string
  firstOpenedAt: string | null
  formattedTime: string
  intensity:     number
  isFirstOpen:   boolean
  isReturnVisit: boolean
}

type Investor = {
  email:               string
  shareLink:           string
  linkLabel:           string
  isReturningInvestor: boolean
  totalSeconds:        number
  formattedTime:       string
  docsOpened:          number
  totalDocs:           number
  coveragePct:         number
  sessionCount:        number
  lastSeen:            string
  firstSeen:           string
  engagementScore:     number
  docBreakdown:        DocBreakdown[]
}

type HeatmapDoc = {
  documentId:          string
  documentName:        string
  totalSeconds:        number
  formattedTime:       string
  viewerCount:         number
  avgSecondsPerViewer: number
}

type LinkSummary = {
  shareLink:     string
  label:         string | null
  investorCount: number
  totalSeconds:  number
  formattedTime: string
}

type DiligenceData = {
  investors: Investor[]
  heatmap:   HeatmapDoc[]
  summary: {
    totalInvestors:        number
    totalSessions:         number
    totalTimeSeconds:      number
    avgSecondsPerInvestor: number
    mostEngagedInvestor:   string | null
    hotDocs:               string[]
    coldDocs:              string[]
    linkSummary:           LinkSummary[]
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | Date | null): string {
  if (!dateStr) return 'Never'
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSeconds(s: number): string {
  if (s === 0) return '—'
  if (s < 60)  return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m < 60) return r > 0 ? `${m}m ${r}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function heatBg(intensity: number): string {
  if (intensity === 0)  return '#f1f5f9'
  if (intensity < 15)   return '#dbeafe'
  if (intensity < 30)   return '#a5f3fc'
  if (intensity < 50)   return '#fef08a'
  if (intensity < 70)   return '#fb923c'
  if (intensity < 85)   return '#f97316'
  return '#ef4444'
}

// ── Document Heatmap Row ────────────────────────────────────────────────────────

function HeatmapRow({ doc, maxSeconds, rank }: {
  doc: HeatmapDoc
  maxSeconds: number
  rank: number
}) {
  const pct = maxSeconds > 0 ? (doc.totalSeconds / maxSeconds) * 100 : 0

  const statusLabel =
    doc.totalSeconds === 0 ? { text: 'Not opened', cls: 'bg-slate-100 text-slate-400' } :
    pct >= 70              ? { text: 'High',        cls: 'bg-red-100 text-red-600' } :
    pct >= 30              ? { text: 'Medium',      cls: 'bg-orange-100 text-orange-600' } :
                             { text: 'Low',         cls: 'bg-blue-100 text-blue-600' }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="hover:bg-slate-50 transition-colors"
    >
      {/* Mobile layout */}
      <div className="lg:hidden px-4 py-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
            rank === 0 ? 'bg-yellow-100 text-yellow-700' :
            rank === 1 ? 'bg-slate-200 text-slate-600' :
            rank === 2 ? 'bg-orange-100 text-orange-600' :
            'bg-slate-100 text-slate-400'
          }`}>
            {rank + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-slate-900 truncate">{doc.documentName}</p>
              <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${statusLabel.cls}`}>
                {statusLabel.text}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: rank * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: heatBg(pct) }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{doc.viewerCount} {doc.viewerCount === 1 ? 'viewer' : 'viewers'}{doc.viewerCount > 0 && ` · avg ${formatSeconds(doc.avgSecondsPerViewer)}`}</span>
              <span className={`font-semibold ${doc.totalSeconds === 0 ? 'text-slate-300' : 'text-slate-700'}`}>{doc.formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          rank === 0 ? 'bg-yellow-100 text-yellow-700' :
          rank === 1 ? 'bg-slate-200 text-slate-600' :
          rank === 2 ? 'bg-orange-100 text-orange-600' :
          'bg-slate-100 text-slate-400'
        }`}>
          {rank + 1}
        </div>

        <div className="w-52 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{doc.documentName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {doc.viewerCount} {doc.viewerCount === 1 ? 'viewer' : 'viewers'}
            {doc.viewerCount > 0 && ` · avg ${formatSeconds(doc.avgSecondsPerViewer)}`}
          </p>
        </div>

        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: rank * 0.05 }}
            className="h-full rounded-full"
            style={{ backgroundColor: heatBg(pct) }}
          />
        </div>

        <div className="text-right w-20 flex-shrink-0">
          <p className={`text-sm font-bold ${doc.totalSeconds === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
            {doc.formattedTime}
          </p>
        </div>

        <div className="w-24 flex-shrink-0 flex justify-end">
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusLabel.cls}`}>
            {statusLabel.text}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Investor Card ───────────────────────────────────────────────────────────────

function InvestorCard({ investor, allDocs, rank }: {
  investor: Investor
  allDocs:  HeatmapDoc[]
  rank:     number
}) {
  const [expanded, setExpanded] = useState(false)

  const docGrid = allDocs.map(hDoc => {
    const bd = investor.docBreakdown.find(d => d.documentId === hDoc.documentId)
    return {
      documentId:    hDoc.documentId,
      documentName:  hDoc.documentName,
      totalSeconds:  bd?.totalSeconds  ?? 0,
      sessionCount:  bd?.sessionCount  ?? 0,
      formattedTime: bd?.formattedTime ?? '—',
      intensity:     bd?.intensity     ?? 0,
      isFirstOpen:   bd?.isFirstOpen   ?? true,
      isReturnVisit: bd?.isReturnVisit ?? false,
    }
  })

  const skipped    = docGrid.filter(d => d.totalSeconds === 0)
  const returnDocs = docGrid.filter(d => d.isReturnVisit && d.totalSeconds > 0)
  const topDoc     = [...docGrid].sort((a, b) => b.totalSeconds - a.totalSeconds)[0]

  const scoreColor =
    investor.engagementScore >= 70 ? 'bg-red-50 text-red-600 border-red-200' :
    investor.engagementScore >= 40 ? 'bg-orange-50 text-orange-600 border-orange-200' :
    investor.engagementScore >= 15 ? 'bg-blue-50 text-blue-600 border-blue-200' :
    'bg-slate-100 text-slate-500 border-slate-200'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
      className="bg-white border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start sm:items-center gap-3 px-4 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {investor.email.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-900 truncate">{investor.email}</p>
            {investor.isReturningInvestor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 flex-shrink-0">
                <RotateCcw className="h-2.5 w-2.5" />
                Returning
              </span>
            )}
            {rank === 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex-shrink-0">
                Top
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {investor.linkLabel && (
              <span className="text-xs text-slate-400">via {investor.linkLabel}</span>
            )}
            <span className="text-xs text-slate-400">
              {investor.sessionCount} session{investor.sessionCount !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-slate-400">
              {investor.docsOpened}/{investor.totalDocs} docs
            </span>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-slate-400">{timeAgo(investor.lastSeen)}</span>
          </div>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Coverage — hidden on mobile */}
          <div className="hidden sm:block w-20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Coverage</span>
              <span className="text-xs font-medium text-slate-700">{investor.coveragePct}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-700"
                style={{ width: `${investor.coveragePct}%` }}
              />
            </div>
          </div>

          {/* Time */}
          <div className="text-right hidden sm:block">
            <p className="text-base font-bold text-slate-900">{investor.formattedTime}</p>
            <p className="text-xs text-slate-400">total</p>
          </div>

          {/* Score */}
          <div className={`text-xs font-bold px-2 py-1 rounded border ${scoreColor}`}>
            {investor.engagementScore}
          </div>

          <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Mobile stats row */}
      <div className="sm:hidden grid grid-cols-3 divide-x border-t">
        <div className="px-3 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{investor.formattedTime}</p>
          <p className="text-xs text-slate-400">Time</p>
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{investor.coveragePct}%</p>
          <p className="text-xs text-slate-400">Coverage</p>
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{investor.sessionCount}</p>
          <p className="text-xs text-slate-400">Sessions</p>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-slate-100">

              {/* Legend */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Time per document</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                    First open
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 inline-block" />
                    Return
                  </span>
                </div>
              </div>

              {/* Doc grid */}
              <div className="space-y-2">
                {docGrid.map((doc, i) => (
                  <div key={doc.documentId} className="flex items-center gap-2 sm:gap-3">
                    {/* Dot */}
                    <div className="flex-shrink-0">
                      {doc.totalSeconds > 0 ? (
                        <div className={`h-1.5 w-1.5 rounded-full ${doc.isReturnVisit ? 'bg-purple-400' : 'bg-green-400'}`} />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      )}
                    </div>

                    {/* Name */}
                    <div className="w-28 sm:w-44 min-w-0 flex-shrink-0">
                      <p className={`text-xs truncate ${doc.totalSeconds === 0 ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {doc.documentName}
                      </p>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
                      {doc.totalSeconds > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, doc.intensity)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.04 }}
                          className="h-full rounded-md"
                          style={{ backgroundColor: heatBg(doc.intensity) }}
                        />
                      )}
                      {doc.totalSeconds > 0 && (
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className={`text-xs font-medium ${doc.intensity > 40 ? 'text-white' : 'text-slate-700'}`}>
                            {doc.formattedTime}
                            {doc.sessionCount > 1 && (
                              <span className="ml-1 opacity-75 hidden sm:inline">· {doc.sessionCount}x</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="w-14 sm:w-20 flex-shrink-0 text-right">
                      {doc.totalSeconds > 0 ? (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          doc.isReturnVisit
                            ? 'bg-purple-50 text-purple-600'
                            : 'bg-green-50 text-green-600'
                        }`}>
                          {doc.isReturnVisit ? 'Return' : 'First'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">Skipped</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="mt-4 space-y-2">
                {returnDocs.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-600">
                      Returned to {returnDocs.length} doc{returnDocs.length > 1 ? 's' : ''} via this link:{' '}
                      <span className="font-medium">{returnDocs.slice(0, 2).map(d => d.documentName).join(', ')}</span>
                      {returnDocs.length > 2 && ` +${returnDocs.length - 2} more`}
                    </p>
                  </div>
                )}

                {skipped.length === 0 && topDoc && topDoc.totalSeconds > 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-600">
                      Reviewed all documents — most time on{' '}
                      <span className="font-medium">"{topDoc.documentName}"</span> ({topDoc.formattedTime})
                    </p>
                  </div>
                ) : skipped.length > 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-600">
                      Skipped {skipped.length} doc{skipped.length > 1 ? 's' : ''}:{' '}
                      <span className="font-medium">{skipped.slice(0, 3).map(d => d.documentName).join(', ')}</span>
                      {skipped.length > 3 && ` +${skipped.length - 3} more`}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main DiligenceTab ───────────────────────────────────────────────────────────

export function DiligenceTab({ spaceId }: { spaceId: string }) {
  const [data, setData]             = useState<DiligenceData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [view, setView]             = useState<'investors' | 'heatmap'>('investors')
  const [linkFilter, setLinkFilter] = useState<string>('all')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/spaces/${spaceId}/diligence`, { credentials: 'include' })
      const json = await res.json()
      if (json.success) setData(json)
      else setError(json.error || 'Failed to load diligence data')
    } catch {
      setError('Failed to load diligence data')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  useEffect(() => { fetch_() }, [spaceId])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="relative mx-auto mb-5 h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-slate-900 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Loading diligence data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 text-sm font-medium mb-3">{error}</p>
        <Button onClick={fetch_} variant="outline" size="sm">Try Again</Button>
      </div>
    </div>
  )

  if (!data) return null

  const { investors, heatmap, summary } = data
  const maxHeatSeconds = heatmap.length > 0 ? heatmap[0].totalSeconds : 1

  const filteredInvestors = linkFilter === 'all'
    ? investors
    : investors.filter(i => i.shareLink === linkFilter)

  const activeLinks = [
    ...new Map(
      investors
        .filter(i => i.shareLink)
        .map(i => [i.shareLink, { shareLink: i.shareLink, label: i.linkLabel }])
    ).values()
  ]

  if (investors.length === 0) return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Diligence Tracking</h2>
        <p className="text-sm text-slate-500 mt-1">Time-based engagement per investor</p>
      </div>
      <div className="border rounded-xl bg-white p-12 text-center">
        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 mb-1">No diligence data yet</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Once investors open documents through your portal, you'll see exactly how long they spend on each one.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Diligence Tracking</h2>
          <p className="text-sm text-slate-500 mt-1">How long each investor spends on each document</p>
        </div>
        <button
          onClick={fetch_}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Total Time</p>
          <p className="text-2xl font-bold">{formatSeconds(summary.totalTimeSeconds)}</p>
          <p className="text-xs text-slate-500 mt-1">across all investors</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Investors</p>
          <p className="text-2xl font-bold text-slate-900">{summary.totalInvestors}</p>
          <p className="text-xs text-slate-400 mt-1">tracked readers</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Avg Time</p>
          <p className="text-2xl font-bold text-slate-900">{formatSeconds(summary.avgSecondsPerInvestor)}</p>
          <p className="text-xs text-slate-400 mt-1">per investor</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Sessions</p>
          <p className="text-2xl font-bold text-slate-900">{summary.totalSessions}</p>
          <p className="text-xs text-slate-400 mt-1">total opens</p>
        </div>
      </div>

      {/* Per-link filter */}
      {activeLinks.length > 1 && (
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Filter by link</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLinkFilter('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                linkFilter === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              All links
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                linkFilter === 'all' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'
              }`}>
                {investors.length}
              </span>
            </button>

            {summary.linkSummary.filter(l => l.investorCount > 0).map(l => {
              const label  = l.label || activeLinks.find(a => a.shareLink === l.shareLink)?.label || l.shareLink.slice(-6)
              const active = linkFilter === l.shareLink
              return (
                <button
                  key={l.shareLink}
                  onClick={() => setLinkFilter(active ? 'all' : l.shareLink)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    active ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {l.investorCount}
                  </span>
                  <span className={`hidden sm:inline ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    {l.formattedTime}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      {(summary.hotDocs.length > 0 || summary.coldDocs.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {summary.hotDocs.length > 0 && (
            <div className="border rounded-xl p-4 bg-white">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Most read</p>
              <div className="space-y-1.5">
                {summary.hotDocs.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <p className="text-sm text-slate-800 font-medium truncate">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {summary.coldDocs.length > 0 && (
            <div className="border rounded-xl p-4 bg-white">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Not opened</p>
              <div className="space-y-1.5">
                {summary.coldDocs.slice(0, 3).map((name, i) => (
                  <p key={i} className="text-sm text-slate-500 truncate">{name}</p>
                ))}
                {summary.coldDocs.length > 3 && (
                  <p className="text-xs text-slate-400">+{summary.coldDocs.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setView('investors')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            view === 'investors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          By Investor ({filteredInvestors.length})
        </button>
        <button
          onClick={() => setView('heatmap')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            view === 'heatmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Document Heatmap
        </button>
      </div>

      {/* Active filter label */}
      {linkFilter !== 'all' && view === 'investors' && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3 w-3" />
          <span>
            Showing {filteredInvestors.length} of {investors.length} investors via{' '}
            <span className="font-medium text-slate-700">
              {activeLinks.find(l => l.shareLink === linkFilter)?.label || linkFilter}
            </span>
          </span>
          <button onClick={() => setLinkFilter('all')} className="text-slate-400 underline hover:text-slate-600">
            Clear
          </button>
        </div>
      )}

      {/* Investors View */}
      {view === 'investors' && (
        <div className="space-y-2">
          {filteredInvestors.length === 0 ? (
            <div className="border rounded-xl bg-white p-10 text-center">
              <Users className="h-6 w-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No investors for this link yet</p>
            </div>
          ) : (
            filteredInvestors.map((investor, i) => (
              <InvestorCard
                key={`${investor.email}||${investor.shareLink}`}
                investor={investor}
                allDocs={heatmap}
                rank={i}
              />
            ))
          )}
        </div>
      )}

      {/* Heatmap View */}
      {view === 'heatmap' && (
        <div className="border rounded-xl bg-white overflow-hidden">
          {/* Desktop header */}
          <div className="hidden lg:flex items-center gap-4 px-5 py-3 bg-slate-50 border-b">
            <span className="w-7 text-xs font-medium text-slate-400 uppercase">#</span>
            <span className="w-52 text-xs font-medium text-slate-400 uppercase">Document</span>
            <span className="flex-1 text-xs font-medium text-slate-400 uppercase">Engagement</span>
            <span className="w-20 text-right text-xs font-medium text-slate-400 uppercase">Time</span>
            <span className="w-24 text-right text-xs font-medium text-slate-400 uppercase">Status</span>
          </div>

          <div>
            {heatmap.map((doc, i) => (
              <HeatmapRow key={doc.documentId} doc={doc} maxSeconds={maxHeatSeconds} rank={i} />
            ))}
          </div>

          {/* Heat scale legend */}
          <div className="px-4 py-3 bg-slate-50 border-t flex items-center gap-3 flex-wrap">
            <p className="text-xs text-slate-400 font-medium">Scale:</p>
            {[
              { label: 'None',      color: '#f1f5f9' },
              { label: 'Low',       color: '#dbeafe' },
              { label: 'Medium',    color: '#fef08a' },
              { label: 'High',      color: '#fb923c' },
              { label: 'Very high', color: '#ef4444' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-3 w-4 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}