"use client";

import React from 'react';
import Link from 'next/link';
import { Check, TrendingUp, Users, Flame, Target, AlertTriangle, Wifi, MousePointer, BarChart2, Globe, RefreshCw } from "lucide-react";
import { Eye, FileText, BarChart3, Link as LinkIcon, Clock, ChevronRight } from "lucide-react";
import DocSendStyleCharts from '@/components/DocSendStyleCharts';
import dynamic from 'next/dynamic';
import DealIntelligenceSummary from './DealIntelligenceSummary';

const DocumentHeatmap = dynamic(() => import('@/components/DocumentHeatmap'), { ssr: false });
const ViewerMap = dynamic(() => import('@/components/ViewerMap'), { ssr: false });

type Props = {
  analytics: any;
  analyticsLoading: boolean;
  liveViewerCount: number;
  liveViewers: any[];
  heatmapPage: number;
  setHeatmapPage: (page: number) => void;
  doc: { _id: string; numPages: number };
  onCreateLink: () => void;
  analyticsLevel?: string;   
};


function AnalyticsUpgradeBanner() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-10 text-center my-6">
      <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="h-7 w-7 text-purple-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Advanced Analytics — Starter Plan & Above
      </h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
        Upgrade to unlock per-viewer breakdowns, time-per-page charts, location data,
        heatmaps, dead deal detection, and real-time viewer tracking.
      </p>
      
      <a  href="/plan"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
      >
        ⚡ Upgrade to Starter
      </a>
    </div>
  )
}

// ── Deal Insight Card with Refresh ───────────────────────────────
function DealInsightCard({
  dealInsight: initialInsight,
  documentId,
}: {
  dealInsight: any;
  documentId: string;
}) {
  const [insight, setInsight] = React.useState(initialInsight);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());

  const refresh = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/documents/${documentId}/analytics`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.analytics.dealInsight) {
        setInsight(data.analytics.dealInsight);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('[DealInsight] refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="py-5 border-b border-slate-100 bg-white rounded-lg">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Target className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Deal Insight
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                {lastRefreshed.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Narrative */}
         {insight.viewerEmail && (
            <p className="text-xs font-semibold text-amber-700 mb-1">
              {insight.viewerEmail}
            </p>
          )}
          <p className="text-sm text-slate-700 leading-relaxed">
            {insight.narrative}
          </p>

          {/* Signal tags */}
          <div className="flex flex-wrap gap-3 mt-3">
            {insight.reReadPages?.map((r: any) => (
              <span
                key={r.page}
                className="text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700"
              >
                Page {r.page} re-read {r.count}×
              </span>
            ))}
            {insight.videoReplays?.map((v: any) => (
              <span
                key={v.page}
                className="text-[11px] font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700"
              >
                Page {v.page} video replayed {v.count}×
              </span>
            ))}
            {insight.backNavigations?.map((p: number) => (
              <span
                key={p}
                className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600"
              >
                Jumped back to page {p}
              </span>
            ))}
            {insight.engagementDropping && (
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
                Engagement dropping
              </span>
            )}
            {insight.neverForwarded && (
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                Never forwarded
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PerformanceTab({
  analytics,
  analyticsLoading,
  liveViewerCount,
  liveViewers,
  heatmapPage,
  setHeatmapPage,
  doc,
  onCreateLink,
  analyticsLevel = 'full', 
}: Props) {
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  

  if (
    !analytics ||
    (analytics.totalViews === 0 &&
      analytics.uniqueViewers === 0 &&
      (!analytics.pageEngagement || analytics.pageEngagement.every((p: any) => p.totalViews === 0)))
  ) {
    return (
      <div className="py-32 text-center border-b border-slate-100">
        <BarChart3 className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">No views yet</h3>
        <p className="text-sm text-slate-400 mb-6">Share your document to start tracking performance</p>
        <button
          onClick={onCreateLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Create Share Link
        </button>
      </div>
    );
  }

  // Free plan — show KPI numbers only, gate everything else
  if (analyticsLevel === 'basic') {
    return (
      <>
        {/* Show the 3 basic KPIs */}
        <div className="py-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Overview</p>
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100 overflow-hidden">
            {[
              { label: 'Total Views', value: analytics.totalViews, icon: Eye, color: 'text-sky-500' },
              { label: 'Unique Viewers', value: analytics.uniqueViewers, icon: Users, color: 'text-violet-500' },
              { label: 'Completion', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-green-500' },
            ].map((stat) => (
              <div key={stat.label} className="px-2 sm:px-6 first:pl-0 last:pr-0">
                <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color} mb-1.5 sm:mb-2`} />
                <div className="text-xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{stat.value}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 font-medium leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Views by date chart — still shown on basic */}
        {/* Views by date chart — shown on basic */}
        {(() => {
          const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
          const maxViews = Math.max(...analytics.viewsByDate.map((d: any) => d.views), 1);
          const totalPeriodViews = analytics.viewsByDate.reduce((sum: number, d: any) => sum + d.views, 0);
          const hoveredDay = hoveredIndex !== null ? analytics.viewsByDate[hoveredIndex] : null;

          const formatFullDate = (dateStr: string) => {
            const [month, day] = dateStr.split('/');
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return `${months[parseInt(month) - 1]} ${day}`;
          };

          return (
            <div className="py-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Project Views
                </p>
                <BarChart2 className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <p className="text-[10px] text-slate-300 mb-5">
                Project views by date (last 30 days)
              </p>

              <div className="flex items-end gap-[3px]" style={{ height: '100px' }}>
                {analytics.viewsByDate.map((day: any, index: number) => {
                  const height = (day.views / maxViews) * 100;
                  const isHovered = hoveredIndex === index;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col justify-end cursor-pointer"
                      style={{ height: '100px' }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div
                        className="w-full rounded-t-sm transition-all duration-150"
                        style={{
                          height: `${Math.max(height, day.views > 0 ? 4 : 0)}%`,
                          minHeight: day.views > 0 ? '4px' : '0',
                          background: isHovered
                            ? '#0ea5e9'
                            : day.views > 0
                            ? 'linear-gradient(180deg, #a855f7 0%, #0ea5e9 100%)'
                            : '#f1f5f9',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-[3px] mt-1.5 mb-5">
                {analytics.viewsByDate.map((day: any, index: number) => (
                  <div key={index} className="flex-1 text-center">
                    {index % 5 === 0 && (
                      <span className="text-[9px] text-slate-300 font-medium">
                        {day.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {hoveredDay ? (
                <div className="border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Date</p>
                      <p className="text-xs font-semibold text-slate-900">
                        {formatFullDate(hoveredDay.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Views</p>
                      <p className="text-xs font-semibold text-slate-900">
                        {hoveredDay.views} {hoveredDay.views === 1 ? 'view' : 'views'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Period</p>
                      <p className="text-xs font-semibold text-slate-900">Last 30 days</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">Total Views</p>
                      <p className="text-xs font-semibold text-slate-900">{totalPeriodViews}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {/* Upgrade banner — gates all the rich analytics below */}
        <AnalyticsUpgradeBanner />
      </>
    )
  }

  return (
    <>
    {/* SECTION 0 — DEAL INTELLIGENCE SUMMARY */}
      <DealIntelligenceSummary
        documentId={doc._id}
        analytics={analytics}
      />
      {/* SECTION 1 — DEAD DEAL ALERT */}
      {analytics.deadDeal?.score >= 60 && (
        <div className={`py-5 border-b ${analytics.deadDeal.score >= 80 ? 'border-red-200 bg-red-50/40' : 'border-orange-200 bg-orange-50/40'}`}>
          <div className="flex items-start gap-4">
            <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${analytics.deadDeal.score >= 80 ? 'text-red-500' : 'text-orange-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-bold ${analytics.deadDeal.score >= 80 ? 'text-red-900' : 'text-orange-900'}`}>
                  {analytics.deadDeal.score >= 80 ? '☠️ Dead Deal Detected' : '⚠️ Deal At Risk'}
                </p>
                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <div className={`text-xl font-black tabular-nums ${analytics.deadDeal.score >= 80 ? 'text-red-600' : 'text-orange-600'}`}>{analytics.deadDeal.score}%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">dead score</div>
                  </div>
                  <div>
                    <div className="text-xl font-black tabular-nums text-green-600">{analytics.deadDeal.recoveryProbability}%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">recovery</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {analytics.deadDeal.signals?.map((signal: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${signal.type === 'CRITICAL' ? 'bg-red-500' : signal.type === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    {signal.signal}
                  </div>
                ))}
              </div>
              {analytics.deadDeal.recommendations?.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {analytics.deadDeal.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-slate-500">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {rec.action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1B — DEAL INSIGHT*/}
       
      {analytics.dealInsight && (
  <>
    {analytics.dealInsight.viewers && analytics.dealInsight.viewers.length > 1 ? (
      // Multiple viewers — show each one
      analytics.dealInsight.viewers.map((viewerInsight: any, idx: number) => (
        <DealInsightCard
          key={viewerInsight.viewerEmail || idx}
          dealInsight={viewerInsight}
          documentId={doc._id}
        />
      ))
    ) : (
      // Single viewer or legacy shape
      <DealInsightCard
        dealInsight={analytics.dealInsight}
        documentId={doc._id}
      />
    )}
  </>
)}

      {/* SECTION 2 — LIVE VIEWERS */}
      {liveViewerCount > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-green-700">{liveViewerCount} viewing right now</span>
            <Wifi className="h-3.5 w-3.5 text-green-500 ml-auto" />
          </div>
          <div className="space-y-2">
            {liveViewers.map((viewer: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                 
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{viewer.email || 'Anonymous viewer'}</p>
                  <p className="text-[11px] text-slate-400">Page {viewer.page} · {viewer.device}</p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3 — KPI ROW */}
      <div className="py-5 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Overview</p>
        <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100 mb-5 overflow-hidden">
          {[
            { label: 'Total Views', value: analytics.totalViews, icon: Eye, color: 'text-sky-500' },
            { label: 'Unique Viewers', value: analytics.uniqueViewers, icon: Users, color: 'text-violet-500' },
            { label: 'Completion', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-green-500' },
          ].map((stat) => (
            <div key={stat.label} className="px-2 sm:px-6 first:pl-0 last:pr-0">
              <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color} mb-1.5 sm:mb-2`} />
              <div className="text-xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{stat.value}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
          <div className="pr-3 sm:pr-6">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-400 mb-1.5 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums leading-none">{analytics.avgTimePerSession}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 font-medium leading-tight">Avg. Time / Visit</div>
            <div className="hidden sm:block text-[11px] text-slate-300">across {analytics.totalViews} sessions</div>
          </div>
          <div className="pl-3 sm:pl-6">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400 mb-1.5 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums leading-none">{analytics.avgTotalTimePerViewer}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 font-medium leading-tight">Total Time / Viewer</div>
            <div className="hidden sm:block text-[11px] text-slate-300">cumulative across all visits</div>
          </div>
        </div>
      </div>

      {/* SECTION 12 — DOCSEND CHARTS */}
      <div className="py-5">
        <DocSendStyleCharts
          documentId={doc._id}
          pageEngagement={analytics.pageEngagement}
          totalPages={doc.numPages}
          locations={analytics.locations || []}
        />
      </div>
    
    
      {analytics.locations && analytics.locations.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 mb-5">
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Viewer Map</p>
          </div>
          <ViewerMap locations={analytics.locations} />
        </div>
      )}

      {/* SECTION 4 — VIEWS CHART */}
      {/* SECTION 4 — VIEWS CHART */}
      {(() => {
        const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
        const maxViews = Math.max(...analytics.viewsByDate.map((d: any) => d.views), 1);
        const totalPeriodViews = analytics.viewsByDate.reduce((sum: number, d: any) => sum + d.views, 0);
        const hoveredDay = hoveredIndex !== null ? analytics.viewsByDate[hoveredIndex] : null;

        // Find the top page for a given day from recipientPageTracking
        // We use viewsByDate topViewers if available, otherwise blank
        const formatFullDate = (dateStr: string) => {
          const [month, day] = dateStr.split('/');
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          return `${months[parseInt(month) - 1]} ${day}`;
        };

        const formatDuration = (seconds: number) => {
          if (!seconds || seconds <= 0) return '0m 0s';
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${m}m ${s}s`;
        };

        return (
          <div className="py-5 border-b border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Project Views
              </p>
              <BarChart2 className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-300 mb-5">
              Project views by date (last 30 days)
            </p>

            {/* Bar chart */}
            <div
              className="flex items-end gap-[3px]"
              style={{ height: '100px' }}
            >
              {analytics.viewsByDate.map((day: any, index: number) => {
                const height = (day.views / maxViews) * 100;
                const isHovered = hoveredIndex === index;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col justify-end cursor-pointer"
                    style={{ height: '100px' }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className="w-full rounded-t-sm transition-all duration-150"
                      style={{
                        height: `${Math.max(height, day.views > 0 ? 4 : 0)}%`,
                        minHeight: day.views > 0 ? '4px' : '0',
                        background: isHovered
                          ? '#0ea5e9'
                          : day.views > 0
                          ? 'linear-gradient(180deg, #a855f7 0%, #0ea5e9 100%)'
                          : '#f1f5f9',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X axis labels — show every 5th */}
            <div className="flex gap-[3px] mt-1.5 mb-5">
              {analytics.viewsByDate.map((day: any, index: number) => (
                <div key={index} className="flex-1 text-center">
                  {index % 5 === 0 && (
                    <span className="text-[9px] text-slate-300 font-medium">
                      {day.date}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Hover detail row — shows when bar is hovered */}
  {/* Detail row — always visible, updates on hover */}
            <div className="border-t border-slate-100 pt-4">
              {hoveredDay ? (
                // Hovered state — show that specific day
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Date</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {formatFullDate(hoveredDay.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Views</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {hoveredDay.views} {hoveredDay.views === 1 ? 'view' : 'views'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Duration</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {hoveredDay.totalTimeSeconds > 0
                        ? formatDuration(hoveredDay.totalTimeSeconds)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Location</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {hoveredDay.topCountry || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Top Page</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {hoveredDay.views > 0 && analytics.pageEngagement?.length > 0
                        ? `Page ${[...analytics.pageEngagement].sort((a: any, b: any) => b.totalViews - a.totalViews)[0]?.page}`
                        : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                // Default state — always visible summary
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Period</p>
                    <p className="text-xs font-semibold text-slate-900">Last 30 days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Total Views</p>
                    <p className="text-xs font-semibold text-slate-900">{totalPeriodViews}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Total Time</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {(() => {
                        const total = analytics.viewsByDate.reduce(
                          (sum: number, d: any) => sum + (d.totalTimeSeconds || 0), 0
                        );
                        if (!total || total <= 0) return analytics.avgTimePerSession || '—';
                        const m = Math.floor(total / 60);
                        const s = total % 60;
                        return `${m}m ${s}s`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Top Location</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {analytics.locations?.[0]?.country || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium mb-0.5">Top Page</p>
                    <p className="text-xs font-semibold text-slate-900">
                      {analytics.pageEngagement?.length > 0
                        ? `Page ${[...analytics.pageEngagement].sort((a: any, b: any) => b.totalViews - a.totalViews)[0]?.page}`
                        : '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SECTION 5 — PAGE ENGAGEMENT */}
      {analytics.pageEngagement?.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Page Engagement</p>
          <div className="space-y-3">
            {analytics.pageEngagement.slice(0, 10).map((page: any, i: number) => {
              const maxViews = Math.max(...analytics.pageEngagement.map((p: any) => p.totalViews), 1);
              const pct = (page.totalViews / maxViews) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 w-8 flex-shrink-0 text-right tabular-nums">P{page.page}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 70 ? '#0ea5e9' : pct > 40 ? '#a855f7' : '#cbd5e1' }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums w-8 flex-shrink-0">{page.totalViews}</span>
                  {page.avgTimeSpent && (
                    <span className="text-[11px] text-slate-400 flex-shrink-0 tabular-nums w-14 text-right">
                      {Math.floor(page.avgTimeSpent / 60)}:{String(Math.round(page.avgTimeSpent % 60)).padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 6 — REVISIT + INTENT */}
      {analytics.revisitData && (
        <div className="py-5 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-slate-100">
            <div className="md:pr-8 pb-5 md:pb-0">
              <div className="flex items-center gap-1.5 mb-4">
                <RefreshCw className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Return Visits</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Total sessions', value: analytics.revisitData.totalSessions, color: 'text-slate-900' },
                  { label: 'Revisits', value: analytics.revisitData.revisits, color: 'text-violet-600' },
                  { label: 'Avg / viewer', value: `${analytics.revisitData.avgVisitsPerViewer}×`, color: 'text-sky-600' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
              {analytics.revisitData.highFrequencyViewers?.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest"> High-frequency</p>
                  {analytics.revisitData.highFrequencyViewers.slice(0, 3).map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 truncate flex-1">{v.email || 'Anonymous'}</span>
                      <span className="text-xs font-bold text-violet-600 ml-3 flex-shrink-0">{v.visitCount} visits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {analytics.intentScores && (
              <div className="md:pl-8 pt-5 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="flex items-center gap-1.5 mb-4">
                   
                   
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'High', value: analytics.intentData?.highIntent || 0, color: 'text-green-600', emoji: '' },
                    { label: 'Medium', value: analytics.intentData?.mediumIntent || 0, color: 'text-amber-500', emoji: '' },
                    { label: 'Low', value: analytics.intentData?.lowIntent || 0, color: 'text-slate-400', emoji: '' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-base mb-0.5">{s.emoji}</div>
                      <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  {analytics.intentScores.slice(0, 3).map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 truncate flex-1">{v.email || 'Anonymous'}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${Math.min((v.intentScore / 50) * 100, 100)}%`, background: v.intentLevel === 'high' ? '#22c55e' : v.intentLevel === 'medium' ? '#f59e0b' : '#94a3b8' }} />
                      </div>
                      <span className={`text-xs font-bold tabular-nums w-6 text-right flex-shrink-0 ${v.intentLevel === 'high' ? 'text-green-600' : v.intentLevel === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}>{v.intentScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      
         

      {/* SECTION 8 — BOUNCE ANALYTICS */}
      {analytics.bounceAnalytics && (
        <div className="py-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Bounce Analytics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-100 gap-y-4">
            {[
              { label: 'Total', value: analytics.bounceAnalytics.totalRecipients, color: 'text-slate-900' },
              { label: 'Bounced', value: analytics.bounceAnalytics.bounced, color: 'text-red-500' },
              { label: 'Engaged', value: analytics.bounceAnalytics.engaged, color: 'text-green-600' },
              { label: 'Bounce Rate', value: `${analytics.bounceAnalytics.bounceRate}%`, color: 'text-orange-500' },
            ].map((s) => (
              <div key={s.label} className="px-4 first:pl-0 last:pr-0">
                <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9 — TOP VIEWERS */}
      {analytics.topViewers?.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Top Viewers</p>
            </div>
          </div>
          <div className="grid grid-cols-3 py-2 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <span>Viewer</span><span className="text-center">Views</span><span className="text-right">Last seen</span>
          </div>
          {analytics.topViewers.map((viewer: any, index: number) => (
            <div key={index} className="grid grid-cols-3 items-center py-3.5 border-b border-slate-50 last:border-b-0 group hover:bg-slate-50/50 transition-colors -mx-1 px-1 rounded">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {viewer.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{viewer.email}</p>
                  <p className="text-[11px] text-slate-400">{viewer.time} total</p>
                </div>
              </div>
              <div className="text-center"><span className="text-sm font-bold text-slate-900 tabular-nums">{viewer.views}</span></div>
              <div className="text-right"><span className="text-[11px] text-slate-400">{viewer.lastViewed}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 10 — NDA ACCEPTANCES */}
      {analytics?.ndaAcceptances?.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-violet-400" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">NDA Acceptances ({analytics.ndaAcceptances.length})</p>
            </div>
            <Link href="/nda-records">
              <button className="text-[11px] text-sky-500 hover:text-sky-700 font-semibold flex items-center gap-0.5">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          {analytics.ndaAcceptances.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-b-0">
              <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900">{a.viewerName}</p>
                <p className="text-[11px] text-slate-400">{a.viewerEmail}{a.viewerCompany ? ` · ${a.viewerCompany}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-[11px] text-slate-400">{new Date(a.timestamp).toLocaleDateString()}</p>
                <button className="text-[11px] font-semibold text-sky-500 hover:text-sky-700"
                  onClick={async () => {
                    const res = await fetch(`/api/nda-certificates/${a.certificateId}`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = `NDA-Certificate-${a.certificateId}.pdf`;
                      document.body.appendChild(anchor);
                      anchor.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(anchor);
                    }
                  }}>Download</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 11 — HEATMAP */}
      {analytics.heatmapByPage && Object.keys(analytics.heatmapByPage).length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 mb-5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Heatmap</p>
          </div>
          <DocumentHeatmap
            pageNumber={heatmapPage}
            totalPages={doc.numPages}
            documentId={doc._id} 
            heatmapByPage={analytics.heatmapByPage}
            onPageChange={setHeatmapPage}
          />
        </div>
      )}
    </>
  );
}