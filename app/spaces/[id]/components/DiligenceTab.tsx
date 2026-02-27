// app/spaces/[id]/components/DiligenceTab.tsx
//
// WHAT CHANGED vs previous version:
//   1. InvestorCard: linkLabel badge (🔗 Sequoia link) next to email.
//   2. InvestorCard: "Returning" badge when isReturningInvestor === true.
//   3. InvestorCard: firstSeen shown alongside lastSeen in meta line.
//   4. InvestorCard expanded view: green dot = first open, purple = return visit.
//      Small "First" / "Return" badge next to each doc bar.
//   5. Per-link filter strip below summary stats — click a link pill to filter
//      the investor list to only people who came through that link.
//   6. View toggle count updates to reflect filtered list.
//   7. Types updated to include new fields from the route.

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

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
    >
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

      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
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

      <div className="w-20 flex-shrink-0 flex justify-end">
        {doc.totalSeconds === 0 ? (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">Not opened</span>
        ) : pct >= 70 ? (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">🔥 Hot</span>
        ) : pct >= 30 ? (
          <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">⚡ Warm</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">👁 Viewed</span>
        )}
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

  // Merge allDocs with this investor's breakdown (including unvisited docs)
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

  const engagementColor =
    investor.engagementScore >= 70 ? 'text-red-600 bg-red-50 border-red-200' :
    investor.engagementScore >= 40 ? 'text-orange-600 bg-orange-50 border-orange-200' :
    investor.engagementScore >= 15 ? 'text-blue-600 bg-blue-50 border-blue-200' :
    'text-slate-500 bg-slate-50 border-slate-200'

  // Insight text
  const skipped = docGrid.filter(d => d.totalSeconds === 0)
  const returnDocs = docGrid.filter(d => d.isReturnVisit && d.totalSeconds > 0)
  const topDoc = [...docGrid].sort((a, b) => b.totalSeconds - a.totalSeconds)[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.07 }}
      className="bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* ── Header row ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-sm font-black text-white">
            {investor.email.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Email + badges + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 text-sm truncate">{investor.email}</p>

            {/* NEW: link label badge */}
            {investor.linkLabel && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium border border-indigo-100">
                🔗 {investor.linkLabel}
              </span>
            )}

            {/* NEW: returning investor badge */}
            {investor.isReturningInvestor && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                <RotateCcw className="h-2.5 w-2.5" />
                Returning
              </span>
            )}

            {rank === 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                👑 Most engaged
              </span>
            )}
          </div>

          {/* NEW: firstSeen → lastSeen */}
          <p className="text-xs text-slate-400 mt-0.5">
            {investor.sessionCount} session{investor.sessionCount !== 1 ? 's' : ''} ·{' '}
            {investor.docsOpened} / {investor.totalDocs} docs ·{' '}
            {investor.firstSeen && investor.firstSeen !== investor.lastSeen
              ? <>first seen {timeAgo(investor.firstSeen)} · last seen {timeAgo(investor.lastSeen)}</>
              : <>last seen {timeAgo(investor.lastSeen)}</>
            }
          </p>
        </div>

        {/* Time spent */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-black text-slate-900">{investor.formattedTime}</p>
          <p className="text-xs text-slate-400">total time</p>
        </div>

        {/* Coverage bar */}
        <div className="w-24 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Coverage</span>
            <span className="text-xs font-semibold text-slate-700">{investor.coveragePct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-700 transition-all"
              style={{ width: `${investor.coveragePct}%` }}
            />
          </div>
        </div>

        {/* Engagement score */}
        <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-sm font-bold ${engagementColor}`}>
          {investor.engagementScore}
        </div>

        <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* ── Expanded: per-doc heat bars ─────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100">

              {/* Header + legend */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Time spent per document
                </p>
                {/* NEW: legend */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                    First open
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-purple-400 inline-block" />
                    Return visit
                  </span>
                </div>
              </div>

              {/* Doc grid */}
              <div className="grid gap-2">
                {docGrid.map((doc, i) => (
                  <div key={doc.documentId} className="flex items-center gap-3">

                    {/* NEW: first/return dot */}
                    <div className="flex-shrink-0">
                      {doc.totalSeconds > 0 ? (
                        <div
                          className={`h-2 w-2 rounded-full ${doc.isReturnVisit ? 'bg-purple-400' : 'bg-green-400'}`}
                          title={doc.isReturnVisit ? 'Return visit via this link' : 'First open via this link'}
                        />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-200" />
                      )}
                    </div>

                    {/* Doc name */}
                    <div className="w-44 min-w-0">
                      <p className={`text-xs truncate ${doc.totalSeconds === 0 ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {doc.documentName}
                      </p>
                    </div>

                    {/* Heat bar */}
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                      {doc.totalSeconds > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, doc.intensity)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.04 }}
                          className="h-full rounded-lg"
                          style={{ backgroundColor: heatBg(doc.intensity) }}
                        />
                      )}
                      {doc.totalSeconds > 0 && (
                        <div className="absolute inset-0 flex items-center px-2.5">
                          <span className={`text-xs font-semibold ${doc.intensity > 40 ? 'text-white' : 'text-slate-700'}`}>
                            {doc.formattedTime}
                            {doc.sessionCount > 1 && (
                              <span className="ml-1.5 opacity-75">· {doc.sessionCount} opens</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* NEW: first / return badge */}
                    {doc.totalSeconds > 0 ? (
                      <div className="flex-shrink-0 w-20 text-right">
                        {doc.isReturnVisit ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                            <RotateCcw className="h-2.5 w-2.5" />
                            Return
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                            <ArrowRight className="h-2.5 w-2.5" />
                            First
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 w-20 text-right flex-shrink-0">Skipped</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Insight callouts */}
              <div className="mt-4 space-y-2">
                {returnDocs.length > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-xs text-purple-800 font-medium">
                      🔁 Returned to {returnDocs.length} doc{returnDocs.length > 1 ? 's' : ''} via this link after viewing via another link:{' '}
                      {returnDocs.slice(0, 2).map(d => `"${d.documentName}"`).join(', ')}
                      {returnDocs.length > 2 && ` +${returnDocs.length - 2} more`}
                    </p>
                  </div>
                )}

                {skipped.length === 0 && topDoc && topDoc.totalSeconds > 0 ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs text-green-800 font-medium">
                      ✅ Reviewed all documents — most time on "{topDoc.documentName}" ({topDoc.formattedTime})
                    </p>
                  </div>
                ) : skipped.length > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 font-medium">
                      ⚠️ Skipped {skipped.length} doc{skipped.length > 1 ? 's' : ''}:{' '}
                      {skipped.slice(0, 3).map(d => `"${d.documentName}"`).join(', ')}
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
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-slate-900 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Analyzing diligence patterns…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-700 font-medium mb-3">{error}</p>
        <Button onClick={fetch_} variant="outline" size="sm">Try Again</Button>
      </div>
    </div>
  )

  if (!data) return null

  const { investors, heatmap, summary } = data
  const maxHeatSeconds = heatmap.length > 0 ? heatmap[0].totalSeconds : 1

  // Apply link filter
  const filteredInvestors = linkFilter === 'all'
    ? investors
    : investors.filter(i => i.shareLink === linkFilter)

  // Links that actually have investors
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
        <h2 className="text-2xl font-bold text-slate-900">Diligence Tracking</h2>
        <p className="text-sm text-slate-500 mt-1">Time-based engagement intelligence per investor</p>
      </div>
      <div className="bg-white rounded-2xl border p-16 text-center">
        <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Clock className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No diligence data yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Once investors open documents through your portal, you'll see exactly how long they spend on each one — including which documents they skip.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-600">
          <Zap className="h-4 w-4 text-amber-500" />
          Tracking starts automatically when portal is opened
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Diligence Tracking</h2>
          <p className="text-sm text-slate-500 mt-1">
            How long each investor spends on each document — per share link
          </p>
        </div>
        <button
          onClick={fetch_}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Time</p>
          </div>
          <p className="text-3xl font-black">{formatSeconds(summary.totalTimeSeconds)}</p>
          <p className="text-xs text-slate-500 mt-1">across all investors</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-purple-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investors</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{summary.totalInvestors}</p>
          <p className="text-xs text-slate-500 mt-1">tracked readers</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Time</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatSeconds(summary.avgSecondsPerInvestor)}</p>
          <p className="text-xs text-slate-500 mt-1">per investor</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{summary.totalSessions}</p>
          <p className="text-xs text-slate-500 mt-1">total document opens</p>
        </div>
      </div>

      {/* ── NEW: Per-link filter strip ───────────────────────────────────── */}
      {activeLinks.length > 1 && (
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Filter by share link
          </p>
          <div className="flex flex-wrap gap-2">
            {/* All links option */}
            <button
              onClick={() => setLinkFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                linkFilter === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              All links
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                linkFilter === 'all' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {investors.length}
              </span>
            </button>

            {summary.linkSummary
              .filter(l => l.investorCount > 0)
              .map(l => {
                const label = l.label || activeLinks.find(a => a.shareLink === l.shareLink)?.label || l.shareLink.slice(-6)
                const active = linkFilter === l.shareLink
                return (
                  <button
                    key={l.shareLink}
                    onClick={() => setLinkFilter(active ? 'all' : l.shareLink)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span className="font-medium">{label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                      active ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {l.investorCount}
                    </span>
                    <span className={`text-xs ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {l.formattedTime}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Insights Strip ───────────────────────────────────────────────── */}
      {(summary.hotDocs.length > 0 || summary.coldDocs.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {summary.hotDocs.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">🔥 Most read documents</p>
              <div className="space-y-1">
                {summary.hotDocs.map((name, i) => (
                  <p key={i} className="text-sm text-orange-900 font-medium truncate">{i + 1}. {name}</p>
                ))}
              </div>
            </div>
          )}
          {summary.coldDocs.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">❄️ Documents nobody opened</p>
              <div className="space-y-1">
                {summary.coldDocs.slice(0, 3).map((name, i) => (
                  <p key={i} className="text-sm text-slate-600 truncate">• {name}</p>
                ))}
                {summary.coldDocs.length > 3 && (
                  <p className="text-xs text-slate-400">+{summary.coldDocs.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── View Toggle ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setView('investors')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'investors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          👤 By Investor ({filteredInvestors.length})
        </button>
        <button
          onClick={() => setView('heatmap')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'heatmap' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🗺 Document Heatmap
        </button>
      </div>

      {/* Active filter label */}
      {linkFilter !== 'all' && view === 'investors' && (
        <div className="flex items-center gap-2 text-sm text-indigo-700">
          <Filter className="h-3.5 w-3.5" />
          Showing investors via{' '}
          <span className="font-semibold">
            {activeLinks.find(l => l.shareLink === linkFilter)?.label || linkFilter}
          </span>
          <span className="text-slate-400">({filteredInvestors.length} of {investors.length})</span>
          <button onClick={() => setLinkFilter('all')} className="text-xs underline text-indigo-500 ml-1">
            Clear
          </button>
        </div>
      )}

      {/* ── INVESTORS VIEW ───────────────────────────────────────────────── */}
      {view === 'investors' && (
        <div className="space-y-3">
          {filteredInvestors.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No investors for this link yet</p>
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

      {/* ── HEATMAP VIEW ─────────────────────────────────────────────────── */}
      {view === 'heatmap' && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="w-7">#</span>
              <span className="w-52">Document</span>
              <span className="flex-1">Engagement</span>
              <span className="w-20 text-right">Total time</span>
              <span className="w-20 text-right">Status</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {heatmap.map((doc, i) => (
              <HeatmapRow key={doc.documentId} doc={doc} maxSeconds={maxHeatSeconds} rank={i} />
            ))}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t flex items-center gap-4">
            <p className="text-xs text-slate-400 font-medium mr-2">Heat scale:</p>
            {[
              { label: 'Not opened', color: '#f1f5f9' },
              { label: 'Low',        color: '#dbeafe' },
              { label: 'Medium',     color: '#fef08a' },
              { label: 'High',       color: '#fb923c' },
              { label: 'Very high',  color: '#ef4444' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-3.5 w-5 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}