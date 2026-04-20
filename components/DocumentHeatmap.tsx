'use client';

import { useState, useEffect, useRef } from 'react';
import { Flame, MousePointer, Eye, BookOpen, TrendingDown, Info } from 'lucide-react';

interface HeatmapProps {
  pageNumber: number;
  totalPages: number;
  documentId: string;
  heatmapByPage: Record<number, {
    clicks: { x: number; y: number; count: number }[];
    scrollStops: { y: number; dwellTime: number }[];
    movementDensity: { x: number; y: number; density: number }[];
  }>;
  onPageChange: (page: number) => void;
}

// ── Insight engine — turns raw data into plain English ────────────
function generateInsights(
  data: {
    clicks: { x: number; y: number; count: number }[];
    scrollStops: { y: number; dwellTime: number }[];
    movementDensity: { x: number; y: number; density: number }[];
  },
  pageNumber: number,
  totalPages: number
): { icon: string; text: string; type: 'good' | 'warn' | 'info' }[] {
  const insights: { icon: string; text: string; type: 'good' | 'warn' | 'info' }[] = []

  const totalClicks = data.clicks.reduce((s, c) => s + c.count, 0)
  const topClick = data.clicks.sort((a, b) => b.count - a.count)[0]
  const avgDwell = data.scrollStops.length > 0
    ? data.scrollStops.reduce((s, x) => s + x.dwellTime, 0) / data.scrollStops.length
    : 0
  const topStop = data.scrollStops.sort((a, b) => b.dwellTime - a.dwellTime)[0]
  const attentionZones = data.movementDensity.filter(d => d.density > 5).length

  if (totalClicks === 0 && data.scrollStops.length === 0 && data.movementDensity.length === 0) {
    insights.push({
      icon: '📭',
      text: 'No interaction data yet for this page. Share the document to start collecting.',
      type: 'info',
    })
    return insights
  }

  if (topClick && topClick.count >= 3) {
    const zone = topClick.y < 33 ? 'top third' : topClick.y < 66 ? 'middle' : 'bottom'
    insights.push({
      icon: '🖱️',
      text: `Viewers clicked the ${zone} of this page ${topClick.count} times — something there is driving action or confusion.`,
      type: topClick.count >= 5 ? 'warn' : 'good',
    })
  }

  if (topStop && topStop.dwellTime > 8000) {
    const secs = Math.round(topStop.dwellTime / 1000)
    const zone = topStop.y < 33 ? 'top' : topStop.y < 66 ? 'middle' : 'bottom'
    insights.push({
      icon: '📖',
      text: `Readers paused for ${secs}s near the ${zone} of this page — they are deeply reading that section.`,
      type: 'good',
    })
  }

  if (avgDwell > 0 && avgDwell < 2000 && data.scrollStops.length > 2) {
    insights.push({
      icon: '⚡',
      text: 'Viewers are scrolling quickly through this page without stopping — consider adding a visual, callout, or key stat to slow them down.',
      type: 'warn',
    })
  }

  if (attentionZones > 15) {
    insights.push({
      icon: '🎯',
      text: `High attention density — ${attentionZones} zones where viewers lingered. This page is performing well.`,
      type: 'good',
    })
  }

  if (pageNumber > 1 && totalClicks === 0 && data.movementDensity.length < 3) {
    insights.push({
      icon: '⚠️',
      text: 'Very little engagement on this page. Viewers may be skipping it — consider whether the content is essential.',
      type: 'warn',
    })
  }

  if (data.clicks.length > 0) {
    const bottomClicks = data.clicks.filter(c => c.y > 80)
    if (bottomClicks.length > 0) {
      insights.push({
        icon: '👇',
        text: 'Viewers are clicking at the bottom of this page — they may be looking for a CTA, next steps, or a link.',
        type: 'info',
      })
    }
  }

  return insights.slice(0, 3)
}

export default function DocumentHeatmap({
  pageNumber,
  totalPages,
  documentId,
  heatmapByPage,
  onPageChange,
}: HeatmapProps) {
  const [mode, setMode] = useState<'clicks' | 'movement' | 'scroll'>('clicks')
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [showInsights, setShowInsights] = useState(true)

  // Reset loaded state when page changes so the loader shows
  useEffect(() => {
    setPdfLoaded(false)
  }, [pageNumber])

  const data = heatmapByPage[pageNumber] || {
    clicks: [],
    scrollStops: [],
    movementDensity: [],
  }

  const maxClickCount = Math.max(...data.clicks.map(c => c.count), 1)
  const maxDensity = Math.max(...data.movementDensity.map(d => d.density), 1)
  const maxDwell = Math.max(...data.scrollStops.map(s => s.dwellTime), 1)

  const totalClicks = data.clicks.reduce((s, c) => s + c.count, 0)
  const hasData =
    data.clicks.length > 0 ||
    data.scrollStops.length > 0 ||
    data.movementDensity.length > 0

  const insights = generateInsights(data, pageNumber, totalPages)

  // Per-page summary stats
  const topDwellSeconds = data.scrollStops.length > 0
    ? Math.round(Math.max(...data.scrollStops.map(s => s.dwellTime)) / 1000)
    : 0
  const attentionZones = data.movementDensity.filter(d => d.density > 3).length

  return (
    <div className="space-y-4">

      {/* ── Page thumbnails strip ─────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
          const pageData = heatmapByPage[p] || { clicks: [], scrollStops: [], movementDensity: [] }
          const pageClicks = pageData.clicks.reduce((s, c) => s + c.count, 0)
          const hasPageData = pageData.clicks.length > 0 || pageData.scrollStops.length > 0 || pageData.movementDensity.length > 0

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="flex-shrink-0 relative group"
            >
              {/* Thumbnail */}
              <div
                className={`relative rounded-lg overflow-hidden transition-all ${
                  p === pageNumber
                    ? 'ring-2 ring-violet-500 shadow-lg scale-105'
                    : 'ring-1 ring-slate-200 hover:ring-violet-300 hover:scale-102'
                }`}
                style={{ width: '64px', height: '83px' }}
              >
                <iframe
                  src={`/api/documents/${documentId}/page?page=${p}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  className="pointer-events-none border-0"
                  style={{ width: '200%', height: '200%', transform: 'scale(0.5)', transformOrigin: 'top left' }}
                  scrolling="no"
                />

                {/* Activity overlay — darker = more activity */}
                {hasPageData && (
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `rgba(124, 58, 237, ${Math.min(0.35, pageClicks * 0.03 + 0.08)})`,
                    }}
                  />
                )}

                {/* Hot badge */}
                {pageClicks >= 5 && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                    <Flame className="h-2.5 w-2.5 text-white" />
                  </div>
                )}

                {/* Page number */}
                <div className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/50 px-1 rounded">
                  {p}
                </div>
              </div>

              {/* Click count below thumbnail */}
              {pageClicks > 0 && (
                <p className="text-[9px] text-center text-violet-600 font-bold mt-1">
                  {pageClicks} clicks
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Main panel ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Page {pageNumber} — Viewer Behavior
            </h3>
            {hasData && (
              <span className="text-xs text-slate-400">
                {totalClicks} click{totalClicks !== 1 ? 's' : ''} ·{' '}
                {data.scrollStops.length} read stop{data.scrollStops.length !== 1 ? 's' : ''} ·{' '}
                {attentionZones} attention zone{attentionZones !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
            {([
              { key: 'clicks',   icon: '', label: 'Clicks'    },
              { key: 'movement', icon: '', label: 'Attention' },
               
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === m.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── PDF + overlay ─────────────────────────────────────────── */}
        <div className="relative" style={{ paddingBottom: '129.4%' /* A4 ratio */ }}>

          {/* Actual PDF page as background */}
          {!pdfLoaded && (
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <div className="h-6 w-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading page {pageNumber}...</p>
              </div>
            </div>
          )}

          <iframe
            key={pageNumber}
            src={`/api/documents/${documentId}/page?page=${pageNumber}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            className="absolute inset-0 w-full h-full border-0"
            style={{ opacity: pdfLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            scrolling="no"
            onLoad={() => setPdfLoaded(true)}
          />

          {/* Semi-transparent overlay so heatmap dots are visible over PDF */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(15, 10, 40, 0.25)' }}
          />

          {/* ── No data state ── */}
          {!hasData && pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="text-center px-6 py-5 rounded-2xl mx-4"
                style={{ background: 'rgba(15,10,40,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="text-3xl mb-2">👁️</div>
                <p className="text-white text-sm font-semibold mb-1">
                  No interaction data yet
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  When recipients view this page through your share link,
                  their clicks, reading stops, and attention zones appear here
                  overlaid on the actual content.
                </p>
              </div>
            </div>
          )}

          {/* ── CLICK HEATMAP dots ── */}
          {mode === 'clicks' && data.clicks.map((click, i) => {
            const intensity = click.count / maxClickCount
            const size = 24 + intensity * 40
            const opacity = 0.4 + intensity * 0.55
            const color = intensity > 0.7
              ? `rgba(239,68,68,${opacity})`
              : intensity > 0.4
              ? `rgba(249,115,22,${opacity})`
              : `rgba(234,179,8,${opacity})`

            return (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${click.x}%`,
                  top: `${click.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}, transparent 70%)`,
                  boxShadow: intensity > 0.6
                    ? `0 0 ${size * 0.8}px ${color}`
                    : 'none',
                }}
              />
            )
          })}

          {/* Click count badges — shows the number on hotspots */}
          {mode === 'clicks' && data.clicks
            .filter(c => c.count >= 2)
            .map((click, i) => (
              <div
                key={`badge-${i}`}
                className="absolute pointer-events-none flex items-center justify-center"
                style={{
                  left: `${click.x}%`,
                  top: `${click.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
              >
                <span
                  className="text-[9px] font-black text-white rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(239,68,68,0.9)',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 3px',
                  }}
                >
                  {click.count}
                </span>
              </div>
            ))
          }

          {/* ── MOVEMENT / ATTENTION dots ── */}
          {mode === 'movement' && data.movementDensity.map((pt, i) => {
            const intensity = pt.density / maxDensity
            if (intensity < 0.08) return null
            const size = 10 + intensity * 28
            const opacity = 0.18 + intensity * 0.55

            return (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${pt.x}%`,
                  top: `${pt.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(139,92,246,${opacity}), transparent 70%)`,
                }}
              />
            )
          })}

          {/* ── SCROLL STOP lines — horizontal bands across the PDF ── */}
          {mode === 'scroll' && data.scrollStops.map((stop, i) => {
            const intensity = stop.dwellTime / maxDwell
            const opacity = 0.35 + intensity * 0.6
            const thickness = 2 + intensity * 6
            const secs = Math.round(stop.dwellTime / 1000)

            return (
              <div key={i} className="absolute left-0 right-0 pointer-events-none" style={{ top: `${stop.y}%` }}>
                {/* The line */}
                <div
                  style={{
                    height: `${thickness}px`,
                    background: `rgba(16,185,129,${opacity})`,
                    boxShadow: intensity > 0.5 ? `0 0 12px rgba(16,185,129,${opacity})` : 'none',
                  }}
                />
                {/* Dwell time label on the right */}
                {intensity > 0.3 && (
                  <div
                    className="absolute right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                    style={{
                      top: `-${thickness / 2}px`,
                      transform: 'translateY(-50%)',
                      background: 'rgba(16,185,129,0.85)',
                    }}
                  >
                    <BookOpen className="h-2 w-2" />
                    {secs}s
                  </div>
                )}
              </div>
            )
          })}

        </div>

        {/* ── Stats bar ─────────────────────────────────────────────── */}
        {hasData && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <MousePointer className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{totalClicks}</strong> clicks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{topDwellSeconds}s</strong> max reading stop
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs text-slate-600">
                <strong className="text-slate-900">{attentionZones}</strong> attention zones
              </span>
            </div>

            {/* Legend */}
            <div className="ml-auto flex items-center gap-4">
              {mode === 'clicks' && (
                <>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="text-[10px] text-slate-400">Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] text-slate-400">Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="text-[10px] text-slate-400">High</span>
                  </div>
                </>
              )}
              {mode === 'movement' && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-10 rounded-full"
                    style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.15), rgba(139,92,246,0.75))' }} />
                  <span className="text-[10px] text-slate-400">Attention</span>
                </div>
              )}
              {mode === 'scroll' && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-10 rounded-full"
                    style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.2), rgba(16,185,129,0.9))' }} />
                  <span className="text-[10px] text-slate-400">Dwell time</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Insights panel ─────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowInsights(v => !v)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                Page {pageNumber} Insights
              </span>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                {insights.length}
              </span>
            </div>
            <TrendingDown
              className={`h-4 w-4 text-slate-400 transition-transform ${showInsights ? '' : 'rotate-180'}`}
            />
          </button>

          {showInsights && (
            <div className="px-5 pb-4 space-y-3 border-t border-slate-100">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    insight.type === 'good'
                      ? 'bg-green-50 border border-green-100'
                      : insight.type === 'warn'
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{insight.icon}</span>
                  <p className={`text-xs leading-relaxed ${
                    insight.type === 'good'
                      ? 'text-green-800'
                      : insight.type === 'warn'
                      ? 'text-amber-800'
                      : 'text-blue-800'
                  }`}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}