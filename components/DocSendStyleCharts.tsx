"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';

type PageData = {
  page: number;
  avgTime: number;
  totalViews: number;
  views: number;
};

type LocationData = {
  country: string;
  countryCode?: string;
  views: number;
  percentage: number;
  topCities?: string[];
};

type DocSendStyleChartsProps = {
  documentId: string;
  pageEngagement: PageData[];
  totalPages: number;
  locations?: LocationData[];
};

// ── SVG coordinate system ────────────────────────────────────────
const CHART_W = 500;
const CHART_H = 260;
const PAD_LEFT = 48;
const PAD_BOTTOM = 24;
const PLOT_W = CHART_W - PAD_LEFT;
const PLOT_H = CHART_H - PAD_BOTTOM;

function getX(index: number, total: number): number {
  if (total <= 1) return PAD_LEFT + PLOT_W / 2;
  return PAD_LEFT + (index / (total - 1)) * PLOT_W;
}

function getY(value: number, max: number): number {
  if (max === 0) return PLOT_H;
  return PLOT_H - (value / max) * PLOT_H;
}

function flagEmoji(code?: string): string {
  if (!code || code.length !== 2) return '🌍';
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m 0s';
  if (seconds < 60) return `0m ${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function DocSendStyleCharts({
  documentId,
  pageEngagement,
  totalPages,
  locations = [],
}: DocSendStyleChartsProps) {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [hoveredChart, setHoveredChart] = useState<'time' | 'dropoff' | null>(null);

  if (!pageEngagement || pageEngagement.length === 0) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
        <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No page engagement data yet</p>
      </div>
    );
  }

  const n = pageEngagement.length;
  const maxTime = Math.max(...pageEngagement.map(p => p.avgTime), 1);

  // Dropoff = % of all viewers who reached that page (relative to page 1)
  const firstPageViews = pageEngagement[0]?.totalViews || 1;
  const dropoffData = pageEngagement.map((page) => ({
    page: page.page,
    percentage: firstPageViews > 0
      ? Math.round((page.totalViews / firstPageViews) * 100)
      : 0,
    views: page.totalViews,
  }));

  // Polyline point strings using absolute SVG coordinates
  const timePoints = pageEngagement
    .map((p, i) => `${getX(i, n)},${getY(p.avgTime, maxTime)}`)
    .join(' ');

  const dropPoints = dropoffData
    .map((d, i) => `${getX(i, n)},${getY(d.percentage, 100)}`)
    .join(' ');

  const timeYTicks = [0, 25, 50, 75, 100].map(pct => ({
    label: Math.round((pct / 100) * maxTime),
    y: PLOT_H - (pct / 100) * PLOT_H,
  }));

  const dropYTicks = [0, 25, 50, 75, 100].map(pct => ({
    label: pct,
    y: PLOT_H - (pct / 100) * PLOT_H,
  }));

  return (
    <div className="space-y-4">

      {/* ── COUNTRY / STATE BANNER above the charts ── */}
      {locations.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-violet-500" />
            <h3 className="font-bold text-slate-900 text-sm">Viewer Locations</h3>
            <span className="ml-auto text-xs text-slate-400">{locations.length} countr{locations.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              >
                <span className="text-xl leading-none">{flagEmoji(loc.countryCode)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{loc.country}</p>
                  {loc.topCities && loc.topCities.length > 0 && (
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                      {loc.topCities.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-violet-600 ml-1 flex-shrink-0">
                  {loc.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TWO CHARTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── LEFT: TIME PER PAGE ─── */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-violet-500" />
            <h3 className="font-bold text-slate-900 text-lg">Time Per Page</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 ml-6">average time spent per visit</p>

          <div className="relative">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="grad-time-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="grad-time-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {timeYTicks.map((t) => (
                <g key={t.label}>
                  <line x1={PAD_LEFT} y1={t.y} x2={CHART_W} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={PAD_LEFT - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                    {t.label}s
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />
              <line x1={PAD_LEFT} y1={PLOT_H} x2={CHART_W} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />

              {/* Area fill under line */}
              <polygon
                points={[
                  ...pageEngagement.map((p, i) => `${getX(i, n)},${getY(p.avgTime, maxTime)}`),
                  `${getX(n - 1, n)},${PLOT_H}`,
                  `${getX(0, n)},${PLOT_H}`,
                ].join(' ')}
                fill="url(#grad-time-fill)"
              />

              {/* ── THE LINE connecting all dots ── */}
              <polyline
                points={timePoints}
                fill="none"
                stroke="url(#grad-time-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots + x-labels */}
              {pageEngagement.map((p, i) => {
                const cx = getX(i, n);
                const cy = getY(p.avgTime, maxTime);
                const isHov = hoveredPage === p.page && hoveredChart === 'time';
                return (
                  <g key={p.page}>
                    {isHov && <circle cx={cx} cy={cy} r={14} fill="#8B5CF6" fillOpacity="0.12" />}
                    <circle
                      cx={cx} cy={cy}
                      r={isHov ? 7 : 5}
                      fill={isHov ? '#8B5CF6' : '#fff'}
                      stroke={isHov ? '#8B5CF6' : '#3B82F6'}
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'r 0.12s' }}
                      onMouseEnter={() => { setHoveredPage(p.page); setHoveredChart('time'); }}
                      onMouseLeave={() => { setHoveredPage(null); setHoveredChart(null); }}
                    />
                    <text x={cx} y={CHART_H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
                      P{p.page}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredPage !== null && hoveredChart === 'time' && (() => {
                const idx = hoveredPage - 1;
                const p = pageEngagement[idx];
                if (!p) return null;
                const ratio = idx / Math.max(n - 1, 1);
                return (
                  <motion.div
                    key="tip-time"
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-2 pointer-events-none z-50"
                    style={ratio < 0.6
                      ? { left: `${ratio * 70 + 5}%` }
                      : { right: `${(1 - ratio) * 70 + 5}%` }}
                  >
                    <div className="bg-white rounded-xl shadow-2xl border-2 border-violet-400 p-3 w-52">
                      {/* iframe kept as requested */}
                      <div style={{ overflow: 'hidden', height: '170px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                        <iframe
                          src={`/api/documents/${documentId}/page?page=${hoveredPage}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                          className="pointer-events-none"
                          style={{ border: 'none', width: 'calc(100% + 20px)', height: '190px', marginRight: '-20px', marginBottom: '-20px' }}
                          scrolling="no"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mb-0.5">
                        <Clock className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-xl font-black text-violet-600">{formatTime(p.avgTime)}</span>
                      </div>
                      <p className="text-xs text-center text-slate-600 font-semibold">Page {hoveredPage}</p>
                      <p className="text-xs text-center text-slate-400">{p.totalViews} visit{p.totalViews !== 1 ? 's' : ''}</p>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── RIGHT: DROPOFF REPORT ─── */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <h3 className="font-bold text-slate-900 text-lg">Dropoff Report</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 ml-6">% of viewers who reached each page</p>

          <div className="relative">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="grad-drop-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="grad-drop-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {dropYTicks.map((t) => (
                <g key={t.label}>
                  <line x1={PAD_LEFT} y1={t.y} x2={CHART_W} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={PAD_LEFT - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                    {t.label}%
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />
              <line x1={PAD_LEFT} y1={PLOT_H} x2={CHART_W} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />

              {/* Area fill */}
              <polygon
                points={[
                  ...dropoffData.map((d, i) => `${getX(i, n)},${getY(d.percentage, 100)}`),
                  `${getX(n - 1, n)},${PLOT_H}`,
                  `${getX(0, n)},${PLOT_H}`,
                ].join(' ')}
                fill="url(#grad-drop-fill)"
              />

              {/* ── THE LINE connecting all dots ── */}
              <polyline
                points={dropPoints}
                fill="none"
                stroke="url(#grad-drop-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots + x-labels */}
              {dropoffData.map((d, i) => {
                const cx = getX(i, n);
                const cy = getY(d.percentage, 100);
                const isHov = hoveredPage === d.page && hoveredChart === 'dropoff';
                return (
                  <g key={d.page}>
                    {isHov && <circle cx={cx} cy={cy} r={14} fill="#3B82F6" fillOpacity="0.12" />}
                    <circle
                      cx={cx} cy={cy}
                      r={isHov ? 7 : 5}
                      fill={isHov ? '#3B82F6' : '#fff'}
                      stroke={isHov ? '#3B82F6' : '#8B5CF6'}
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'r 0.12s' }}
                      onMouseEnter={() => { setHoveredPage(d.page); setHoveredChart('dropoff'); }}
                      onMouseLeave={() => { setHoveredPage(null); setHoveredChart(null); }}
                    />
                    <text x={cx} y={CHART_H - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
                      P{d.page}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredPage !== null && hoveredChart === 'dropoff' && (() => {
                const idx = hoveredPage - 1;
                const d = dropoffData[idx];
                if (!d) return null;
                const ratio = idx / Math.max(n - 1, 1);
                return (
                  <motion.div
                    key="tip-drop"
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-2 pointer-events-none z-50"
                    style={ratio < 0.6
                      ? { left: `${ratio * 70 + 5}%` }
                      : { right: `${(1 - ratio) * 70 + 5}%` }}
                  >
                    <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-400 p-3 w-52">
                      {/* iframe kept as requested */}
                      <div style={{ overflow: 'hidden', height: '170px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                        <iframe
                          src={`/api/documents/${documentId}/page?page=${hoveredPage}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                          className="pointer-events-none"
                          style={{ border: 'none', width: 'calc(100% + 20px)', height: '190px', marginRight: '-20px', marginBottom: '-20px' }}
                          scrolling="no"
                        />
                      </div>
                      <p className="text-xl font-black text-blue-600 text-center">{d.percentage}%</p>
                      <p className="text-xs text-center text-slate-600 font-semibold">Page {hoveredPage}</p>
                      <p className="text-xs text-center text-slate-400">{d.views} viewer{d.views !== 1 ? 's' : ''} reached this page</p>
                      {idx > 0 && d.percentage < 100 && (
                        <p className="text-xs text-center text-red-400 mt-0.5">
                          {100 - d.percentage}% dropped before this page
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}