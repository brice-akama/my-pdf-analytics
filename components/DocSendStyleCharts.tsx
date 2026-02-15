"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

type PageData = {
  page: number;
  avgTime: number;
  totalViews: number;
  views: number; // percentage
};

type DocSendStyleChartsProps = {
  documentId: string;
  pageEngagement: PageData[];
  totalPages: number;
};

export default function DocSendStyleCharts({ 
  documentId, 
  pageEngagement, 
  totalPages 
}: DocSendStyleChartsProps) {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [hoveredChart, setHoveredChart] = useState<'time' | 'dropoff' | null>(null);

  // Calculate max values for scaling
  const maxTime = Math.max(...pageEngagement.map(p => p.avgTime), 1);
  const maxViews = Math.max(...pageEngagement.map(p => p.totalViews), 1);

  // Calculate dropoff rates
  const dropoffData = pageEngagement.map((page, index) => {
    const currentViews = page.totalViews;
    const previousViews = index === 0 ? currentViews : pageEngagement[0].totalViews;
    const dropoffPercent = previousViews > 0 
      ? Math.round((currentViews / previousViews) * 100)
      : 100;
    return {
      page: page.page,
      percentage: dropoffPercent,
      views: currentViews,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ─── LEFT CHART: TIME PER PAGE ─── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-2 text-lg">Time Per Page</h3>
        <p className="text-xs text-slate-500 mb-6">(average seconds per visit)</p>
        
        <div className="relative h-80">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-400">
            {[175, 150, 125, 100, 75, 50, 25].map(val => (
              <div key={val} className="text-right pr-2">{val}</div>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8 border-l border-b border-slate-200">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(val => (
              <div 
                key={val}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ bottom: `${val}%` }}
              />
            ))}

            {/* Line chart */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
              {/* Draw line */}
              <polyline
                points={pageEngagement.map((p, i) => {
                  const x = (i / (totalPages - 1)) * 100;
                  const y = 100 - ((p.avgTime / maxTime) * 100);
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="url(#gradient-time)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient-time" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {pageEngagement.map((p, i) => {
                const x = (i / (totalPages - 1)) * 100;
                const y = 100 - ((p.avgTime / maxTime) * 100);
                return (
                  <circle
                    key={p.page}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={hoveredPage === p.page && hoveredChart === 'time' ? 8 : 6}
                    fill={hoveredPage === p.page && hoveredChart === 'time' ? '#8B5CF6' : '#3B82F6'}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => {
                      setHoveredPage(p.page);
                      setHoveredChart('time');
                    }}
                    onMouseLeave={() => {
                      setHoveredPage(null);
                      setHoveredChart(null);
                    }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Hover tooltip with PDF preview */}
          <AnimatePresence>
            {hoveredPage && hoveredChart === 'time' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute z-50 pointer-events-none"
                style={{
                  left: `${((hoveredPage - 1) / (totalPages - 1)) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl border-2 border-violet-500 p-4 w-64">
                  {/* PDF Page Preview */}
                  <div className="mb-3 rounded-lg overflow-hidden border-2 border-slate-200">
                   <iframe
  src={`/api/documents/${documentId}/page?page=${hoveredPage}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
  className="w-full h-32 pointer-events-none"
  style={{ border: 'none' }}
/>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-center">
                    <p className="text-2xl font-black text-violet-600">
                      {formatTime(pageEngagement[hoveredPage - 1]?.avgTime || 0)}
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      Page {hoveredPage}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visits: {pageEngagement[hoveredPage - 1]?.totalViews || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* X-axis page numbers */}
        <div className="flex justify-between mt-2 px-12">
          {pageEngagement.map(p => (
            <span key={p.page} className="text-xs text-slate-400">P{p.page}</span>
          ))}
        </div>
      </div>

      {/* ─── RIGHT CHART: DROPOFF RATE ─── */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-2 text-lg">Dropoff Report</h3>
        <p className="text-xs text-slate-500 mb-6">(percent of visits reaching page)</p>
        
        <div className="relative h-80">
          {/* Y-axis labels (percentage) */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-400">
            {[100, 80, 60, 40, 20].map(val => (
              <div key={val} className="text-right pr-2">{val}</div>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8 border-l border-b border-slate-200">
            {/* Grid lines */}
            {[0, 20, 40, 60, 80, 100].map(val => (
              <div 
                key={val}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ bottom: `${val}%` }}
              />
            ))}

            {/* Line chart */}
            <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
              {/* Draw line */}
              <polyline
                points={dropoffData.map((d, i) => {
                  const x = (i / (totalPages - 1)) * 100;
                  const y = 100 - d.percentage;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="url(#gradient-dropoff)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient-dropoff" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {dropoffData.map((d, i) => {
                const x = (i / (totalPages - 1)) * 100;
                const y = 100 - d.percentage;
                return (
                  <circle
                    key={d.page}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={hoveredPage === d.page && hoveredChart === 'dropoff' ? 8 : 6}
                    fill={hoveredPage === d.page && hoveredChart === 'dropoff' ? '#3B82F6' : '#8B5CF6'}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => {
                      setHoveredPage(d.page);
                      setHoveredChart('dropoff');
                    }}
                    onMouseLeave={() => {
                      setHoveredPage(null);
                      setHoveredChart(null);
                    }}
                  />
                );
              })}
            </svg>
          </div>

          {/* Hover tooltip with PDF preview */}
          <AnimatePresence>
            {hoveredPage && hoveredChart === 'dropoff' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute z-50 pointer-events-none"
                style={{
                  left: `${((hoveredPage - 1) / (totalPages - 1)) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 p-4 w-64">
                  {/* PDF Page Preview */}
                  <div className="mb-3 rounded-lg overflow-hidden border-2 border-slate-200">
                    <iframe
                      src={`/api/documents/${documentId}/file?page=${hoveredPage}&serve=blob#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-32 pointer-events-none"
                      style={{ border: 'none' }}
                    />
                  </div>
                  
                  {/* Stats */}
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-600">
                      {dropoffData[hoveredPage - 1]?.percentage}%
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-1">
                      Page {hoveredPage}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visits: {dropoffData[hoveredPage - 1]?.views || 0}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* X-axis page numbers */}
        <div className="flex justify-between mt-2 px-12">
          {dropoffData.map(d => (
            <span key={d.page} className="text-xs text-slate-400">P{d.page}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 60) return `00:${String(seconds).padStart(2, '0')}`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}