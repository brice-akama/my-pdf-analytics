"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';

type PageData = {
  page: number;
  avgTime: number;
  totalViews: number;
  views: number;
  totalTime: number;
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
const PAD_LEFT = 52;
const PAD_BOTTOM = 28;
const PLOT_W = CHART_W - PAD_LEFT - 8;
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

// ── Detect touch device ──────────────────────────────────────────
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);
  return isTouch;
}

export default function DocSendStyleCharts({
  documentId,
  pageEngagement,
  totalPages,
  locations = [],
}: DocSendStyleChartsProps) {
  const isTouch = useIsTouchDevice();

  // ⭐ Single state for both hover (desktop) and tap (mobile)
  const [activePage, setActivePage] = useState<number | null>(null);
  const [activeChart, setActiveChart] = useState<'time' | 'dropoff' | null>(null);

  const timeChartRef = useRef<HTMLDivElement>(null);
  const dropChartRef = useRef<HTMLDivElement>(null);

  // Mobile: close when tapping outside both charts
  useEffect(() => {
    if (!isTouch || activePage === null) return;
    function handler(e: TouchEvent) {
      const target = e.target as Node;
      const insideTime = timeChartRef.current?.contains(target);
      const insideDrop = dropChartRef.current?.contains(target);
      if (!insideTime && !insideDrop) {
        setActivePage(null);
        setActiveChart(null);
      }
    }
    document.addEventListener('touchstart', handler);
    return () => document.removeEventListener('touchstart', handler);
  }, [isTouch, activePage]);

  const handleDotEnter = (page: number, chart: 'time' | 'dropoff') => {
    if (isTouch) return; // mobile uses onClick
    setActivePage(page);
    setActiveChart(chart);
  };

  const handleDotLeave = () => {
    if (isTouch) return;
    setActivePage(null);
    setActiveChart(null);
  };

  const handleDotTap = (page: number, chart: 'time' | 'dropoff') => {
    if (!isTouch) return; // desktop uses onMouseEnter/Leave
    if (activePage === page && activeChart === chart) {
      setActivePage(null);
      setActiveChart(null);
    } else {
      setActivePage(page);
      setActiveChart(chart);
    }
  };

  if (!pageEngagement || pageEngagement.length === 0) {
    return (
      <div className="py-8 text-center border-b border-slate-100">
        <Clock className="h-8 w-8 text-slate-200 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No page engagement data yet</p>
      </div>
    );
  }

  const n = pageEngagement.length;
  const maxTime = Math.max(...pageEngagement.map(p => p.avgTime), 1);

  const firstPageViews = pageEngagement[0]?.totalViews || 1;
  const dropoffData = pageEngagement.map((page) => ({
    page: page.page,
    percentage: firstPageViews > 0
      ? Math.round((page.totalViews / firstPageViews) * 100)
      : 0,
    views: page.totalViews,
  }));

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
    <div className="space-y-0">

      {/* ── LOCATIONS ── */}
      {locations.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Viewer Locations
            </p>
            <span className="ml-auto text-[11px] text-slate-300">
              {locations.length} countr{locations.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border border-slate-100 rounded-lg px-3 py-1.5 hover:border-sky-200 hover:bg-sky-50/40 transition-colors"
              >
                <span className="text-base leading-none">{flagEmoji(loc.countryCode)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{loc.country}</p>
                  {loc.topCities && loc.topCities.length > 0 && (
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[100px]">
                      {loc.topCities.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-sky-600 ml-1 flex-shrink-0">
                  {loc.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TWO CHARTS ── */}
      <div className="py-5 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-slate-100">

          {/* ─── LEFT: TIME PER PAGE ─── */}
          <div className="lg:pr-8 pb-8 lg:pb-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Time Per Page
            </p>
            <p className="text-[11px] text-slate-300 mb-5">avg. time spent per visit</p>

            {/* Mobile tap hint */}
            {isTouch && (
              <p className="text-[10px] text-slate-300 mb-3 flex items-center gap-1">
                <span>👆</span> Tap a dot to see details
              </p>
            )}

            <div className="relative" ref={timeChartRef}>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="w-full"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="grad-time-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="grad-time-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>

                {timeYTicks.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={PAD_LEFT} y1={t.y}
                      x2={CHART_W - 8} y2={t.y}
                      stroke={i === 0 ? '#e2e8f0' : '#f1f5f9'}
                      strokeWidth="1"
                    />
                    <text
                      x={PAD_LEFT - 8} y={t.y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="ui-monospace, monospace"
                    >
                      {t.label}s
                    </text>
                  </g>
                ))}

                <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />

                <polygon
                  points={[
                    ...pageEngagement.map((p, i) => `${getX(i, n)},${getY(p.avgTime, maxTime)}`),
                    `${getX(n - 1, n)},${PLOT_H}`,
                    `${getX(0, n)},${PLOT_H}`,
                  ].join(' ')}
                  fill="url(#grad-time-fill)"
                />

                <polyline
                  points={timePoints}
                  fill="none"
                  stroke="url(#grad-time-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {pageEngagement.map((p, i) => {
                  const cx = getX(i, n);
                  const cy = getY(p.avgTime, maxTime);
                  const isActive = activePage === p.page && activeChart === 'time';
                  return (
                    <g key={p.page}>
                      {isActive && (
                        <circle cx={cx} cy={cy} r={12} fill="#0ea5e9" fillOpacity="0.10" />
                      )}
                      {/* ⭐ Larger invisible hit area for easy tapping on mobile */}
                      <circle
                        cx={cx} cy={cy}
                        r={isTouch ? 18 : 12}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => handleDotEnter(p.page, 'time')}
                        onMouseLeave={handleDotLeave}
                        onClick={() => handleDotTap(p.page, 'time')}
                      />
                      <circle
                        cx={cx} cy={cy}
                        r={isActive ? 6 : 4}
                        fill={isActive ? '#0ea5e9' : '#ffffff'}
                        stroke={isActive ? '#0ea5e9' : '#a855f7'}
                        strokeWidth="2"
                        style={{ pointerEvents: 'none', transition: 'r 0.1s' }}
                      />
                      <text
                        x={cx} y={CHART_H - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isActive ? '#0ea5e9' : '#94a3b8'}
                        fontWeight={isActive ? '700' : '400'}
                      >
                        {p.page}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip — same design, works for both hover and tap */}
              <AnimatePresence>
                {activePage !== null && activeChart === 'time' && (() => {
                  const idx = activePage - 1;
                  const p = pageEngagement[idx];
                  if (!p) return null;
                  const ratio = idx / Math.max(n - 1, 1);
                  return (
                    <motion.div
                      key="tip-time"
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-0 pointer-events-none z-50"
                      style={ratio < 0.6
                        ? { left: `${ratio * 65 + 8}%` }
                        : { right: `${(1 - ratio) * 65 + 8}%` }}
                    >
                      <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden w-48">
                        <div style={{ height: '140px', overflow: 'hidden', background: '#fff' }}>
                          <iframe
                            src={`/api/documents/${documentId}/page?page=${activePage}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                            className="pointer-events-none w-full"
                            style={{ border: 'none', height: '160px', marginTop: '-10px' }}
                            scrolling="no"
                          />
                        </div>
                        <div className="px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Page {activePage}</p>
                              <p className="text-sm font-black text-white tabular-nums">{formatTime(p.avgTime)}</p>
                              <p className="text-[9px] text-slate-500">avg per viewer</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Visits</p>
                              <p className="text-sm font-black text-white tabular-nums">{p.totalViews}</p>
                            </div>
                          </div>
                          {p.totalTime > 0 && (
                            <div className="pt-1.5 border-t border-slate-700/50">
                              <p className="text-[9px] text-slate-400">
                                Combined: <span className="text-slate-200 font-bold">{formatTime(p.totalTime ?? 0)}</span>
                                <span className="text-slate-500"> across {p.totalViews} viewer{p.totalViews !== 1 ? 's' : ''}</span>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="h-0.5 bg-slate-700">
                          <div
                            className="h-full bg-sky-400"
                            style={{ width: `${Math.min((p.avgTime / maxTime) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>

          {/* ─── RIGHT: DROPOFF REPORT ─── */}
          <div className="lg:pl-8 pt-8 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Dropoff Report
            </p>
            <p className="text-[11px] text-slate-300 mb-5">% of viewers who reached each page</p>

            {isTouch && (
              <p className="text-[10px] text-slate-300 mb-3 flex items-center gap-1">
                <span>👆</span> Tap a dot to see details
              </p>
            )}

            <div className="relative" ref={dropChartRef}>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                className="w-full"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="grad-drop-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="grad-drop-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </linearGradient>
                </defs>

                {dropYTicks.map((t, i) => (
                  <g key={i}>
                    <line
                      x1={PAD_LEFT} y1={t.y}
                      x2={CHART_W - 8} y2={t.y}
                      stroke={i === 0 ? '#e2e8f0' : '#f1f5f9'}
                      strokeWidth="1"
                    />
                    <text
                      x={PAD_LEFT - 8} y={t.y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#94a3b8"
                      fontFamily="ui-monospace, monospace"
                    >
                      {t.label}%
                    </text>
                  </g>
                ))}

                <line x1={PAD_LEFT} y1={0} x2={PAD_LEFT} y2={PLOT_H} stroke="#e2e8f0" strokeWidth="1" />

                <polygon
                  points={[
                    ...dropoffData.map((d, i) => `${getX(i, n)},${getY(d.percentage, 100)}`),
                    `${getX(n - 1, n)},${PLOT_H}`,
                    `${getX(0, n)},${PLOT_H}`,
                  ].join(' ')}
                  fill="url(#grad-drop-fill)"
                />

                <polyline
                  points={dropPoints}
                  fill="none"
                  stroke="url(#grad-drop-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {dropoffData.map((d, i) => {
                  const cx = getX(i, n);
                  const cy = getY(d.percentage, 100);
                  const isActive = activePage === d.page && activeChart === 'dropoff';
                  return (
                    <g key={d.page}>
                      {isActive && (
                        <circle cx={cx} cy={cy} r={12} fill="#a855f7" fillOpacity="0.10" />
                      )}
                      {/* ⭐ Larger invisible hit area for easy tapping on mobile */}
                      <circle
                        cx={cx} cy={cy}
                        r={isTouch ? 18 : 12}
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => handleDotEnter(d.page, 'dropoff')}
                        onMouseLeave={handleDotLeave}
                        onClick={() => handleDotTap(d.page, 'dropoff')}
                      />
                      <circle
                        cx={cx} cy={cy}
                        r={isActive ? 6 : 4}
                        fill={isActive ? '#a855f7' : '#ffffff'}
                        stroke={isActive ? '#a855f7' : '#0ea5e9'}
                        strokeWidth="2"
                        style={{ pointerEvents: 'none', transition: 'r 0.1s' }}
                      />
                      <text
                        x={cx} y={CHART_H - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isActive ? '#a855f7' : '#94a3b8'}
                        fontWeight={isActive ? '700' : '400'}
                      >
                        {d.page}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              <AnimatePresence>
                {activePage !== null && activeChart === 'dropoff' && (() => {
                  const idx = activePage - 1;
                  const d = dropoffData[idx];
                  if (!d) return null;
                  const ratio = idx / Math.max(n - 1, 1);
                  return (
                    <motion.div
                      key="tip-drop"
                      initial={{ opacity: 0, scale: 0.92, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-0 pointer-events-none z-50"
                      style={ratio < 0.6
                        ? { left: `${ratio * 65 + 8}%` }
                        : { right: `${(1 - ratio) * 65 + 8}%` }}
                    >
                      <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden w-48">
                        <div style={{ height: '140px', overflow: 'hidden', background: '#fff' }}>
                          <iframe
                            src={`/api/documents/${documentId}/page?page=${activePage}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                            className="pointer-events-none w-full"
                            style={{ border: 'none', height: '160px', marginTop: '-10px' }}
                            scrolling="no"
                          />
                        </div>
                        <div className="px-3 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Page {activePage}</p>
                            <p className="text-sm font-black text-white tabular-nums">{d.percentage}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Viewers</p>
                            <p className="text-sm font-black text-white tabular-nums">{d.views}</p>
                          </div>
                        </div>
                        {idx > 0 && d.percentage < 100 && (
                          <div className="px-3 pb-2">
                            <p className="text-[10px] text-red-400 tabular-nums">
                              ↓ {100 - d.percentage}% dropped before here
                            </p>
                          </div>
                        )}
                        <div className="h-0.5 bg-slate-700">
                          <div
                            className="h-full bg-violet-400"
                            style={{ width: `${d.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}