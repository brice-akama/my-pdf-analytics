'use client';

import { useState } from 'react';

interface HeatmapProps {
  pageNumber: number;
  totalPages: number;
  heatmapByPage: Record<number, {
    clicks: { x: number; y: number; count: number }[];
    scrollStops: { y: number; dwellTime: number }[];
    movementDensity: { x: number; y: number; density: number }[];
  }>;
  onPageChange: (page: number) => void;
}

export default function DocumentHeatmap({
  pageNumber,
  totalPages,
  heatmapByPage,
  onPageChange,
}: HeatmapProps) {
  const [mode, setMode] = useState<'clicks' | 'movement' | 'scroll'>('clicks');

  const data = heatmapByPage[pageNumber] || {
    clicks: [],
    scrollStops: [],
    movementDensity: [],
  };

  const maxClickCount = Math.max(...data.clicks.map(c => c.count), 1);
  const maxDensity = Math.max(...data.movementDensity.map(d => d.density), 1);
  const maxDwell = Math.max(...data.scrollStops.map(s => s.dwellTime), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-semibold text-slate-900 text-sm">Viewer Behavior Heatmap</h3>
        </div>

        {/* Mode selector */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
          {(['clicks', 'movement', 'scroll'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'clicks' ? '🖱️ Clicks' : m === 'movement' ? '👁️ Attention' : '📍 Read depth'}
            </button>
          ))}
        </div>
      </div>

      {/* Page selector */}
      <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-2">
        <span className="text-xs text-slate-500">Page:</span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-6 w-6 rounded text-xs font-medium transition-all ${
                p === pageNumber
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">
          {mode === 'clicks'
            ? `${data.clicks.reduce((s, c) => s + c.count, 0)} clicks recorded`
            : mode === 'movement'
            ? `${data.movementDensity.length} attention zones`
            : `${data.scrollStops.length} read stops`}
        </span>
      </div>

      {/* Heatmap canvas */}
      <div
        className="relative mx-auto bg-slate-100"
        style={{ width: '100%', paddingBottom: '141%' }} // A4 aspect ratio
      >
        {/* Document page background */}
        <div className="absolute inset-0 bg-white m-4 rounded shadow-sm" />

        {/* Empty state */}
        {((mode === 'clicks' && data.clicks.length === 0) ||
          (mode === 'movement' && data.movementDensity.length === 0) ||
          (mode === 'scroll' && data.scrollStops.length === 0)) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm">No {mode} data for page {pageNumber} yet</p>
              <p className="text-slate-300 text-xs mt-1">Share the document to start collecting data</p>
            </div>
          </div>
        )}

        {/* CLICK HEATMAP */}
        {mode === 'clicks' && data.clicks.map((click, i) => {
          const intensity = click.count / maxClickCount;
          const size = 20 + intensity * 30;
          const opacity = 0.3 + intensity * 0.6;
          const color = intensity > 0.7
            ? `rgba(239,68,68,${opacity})`
            : intensity > 0.4
            ? `rgba(249,115,22,${opacity})`
            : `rgba(234,179,8,${opacity})`;

          return (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${click.x}%`,
                top: `${click.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${color}, transparent)`,
                boxShadow: intensity > 0.7 ? `0 0 ${size}px ${color}` : 'none',
              }}
              title={`${click.count} click${click.count !== 1 ? 's' : ''}`}
            />
          );
        })}

        {/* MOVEMENT / ATTENTION HEATMAP */}
        {mode === 'movement' && data.movementDensity.map((pt, i) => {
          const intensity = pt.density / maxDensity;
          if (intensity < 0.1) return null;
          const opacity = 0.15 + intensity * 0.5;
          const size = 8 + intensity * 20;

          return (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${pt.x}%`,
                top: `${pt.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, rgba(124,58,237,${opacity}), transparent)`,
              }}
            />
          );
        })}

        {/* SCROLL STOP / READ DEPTH HEATMAP */}
        {mode === 'scroll' && data.scrollStops.map((stop, i) => {
          const intensity = stop.dwellTime / maxDwell;
          const opacity = 0.3 + intensity * 0.6;

          return (
            <div
              key={i}
              className="absolute left-4 right-4 pointer-events-none"
              style={{
                top: `${stop.y}%`,
                height: '3px',
                background: `rgba(16,185,129,${opacity})`,
                borderRadius: '2px',
                boxShadow: intensity > 0.5
                  ? `0 0 8px rgba(16,185,129,${opacity})`
                  : 'none',
              }}
              title={`${(stop.dwellTime / 1000).toFixed(1)}s dwell time`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-6">
        {mode === 'clicks' && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="text-xs text-slate-500">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-500">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs text-slate-500">High</span>
            </div>
          </>
        )}
        {mode === 'movement' && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-12 rounded-full"
              style={{ background: 'linear-gradient(to right, rgba(124,58,237,0.1), rgba(124,58,237,0.7))' }} />
            <span className="text-xs text-slate-500">Attention density</span>
          </div>
        )}
        {mode === 'scroll' && (
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-12 rounded-full"
              style={{ background: 'linear-gradient(to right, rgba(16,185,129,0.2), rgba(16,185,129,0.9))' }} />
            <span className="text-xs text-slate-500">Read depth (brighter = longer dwell)</span>
          </div>
        )}
        <span className="ml-auto text-xs text-slate-400">Page {pageNumber} of {totalPages}</span>
      </div>
    </div>
  );
}