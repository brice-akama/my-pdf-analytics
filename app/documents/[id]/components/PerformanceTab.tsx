"use client";

import React from 'react';
import Link from 'next/link';
import { Check, TrendingUp, Users, Flame, Target, AlertTriangle, Wifi, MousePointer, BarChart2, Globe, RefreshCw } from "lucide-react";
import { Eye, FileText, BarChart3, Link as LinkIcon, Clock, ChevronRight } from "lucide-react";
import DocSendStyleCharts from '@/components/DocSendStyleCharts';
import dynamic from 'next/dynamic';

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
};

export default function PerformanceTab({
  analytics,
  analyticsLoading,
  liveViewerCount,
  liveViewers,
  heatmapPage,
  setHeatmapPage,
  doc,
  onCreateLink,
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

  return (
    <>
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
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {viewer.email ? viewer.email.charAt(0).toUpperCase() : '?'}
                </div>
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
      <div className="py-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Views — Last 7 Days</p>
          <BarChart2 className="h-3.5 w-3.5 text-slate-300" />
        </div>
        <div className="flex items-end justify-between gap-1.5" style={{ height: '120px' }}>
          {analytics.viewsByDate.map((day: any, index: number) => {
            const maxViews = Math.max(...analytics.viewsByDate.map((d: any) => d.views), 1);
            const height = (day.views / maxViews) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="relative w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  {day.views > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1">
                      {day.views}
                    </div>
                  )}
                  <div
                    className="w-full rounded-sm transition-all group-hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      minHeight: day.views > 0 ? '3px' : '0',
                      background: day.views > 0 ? 'linear-gradient(180deg, #a855f7 0%, #0ea5e9 100%)' : '#f1f5f9',
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-300 font-medium">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

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

      {/* SECTION 7 — PER-VIEWER PAGE BREAKDOWN */}
      {analytics.recipientPageTracking?.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 mb-5">
            <MousePointer className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Per-Viewer Page Breakdown</p>
          </div>
          <div className="space-y-5">
            {analytics.recipientPageTracking.map((recipient: any, idx: number) => (
              <div key={idx} className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {recipient.recipientEmail ? recipient.recipientEmail.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{recipient.recipientEmail || 'Anonymous'}</p>
                    <p className="text-[11px] text-slate-400">{recipient.totalTimeOnDoc} total</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${recipient.neverOpened ? 'text-slate-400 bg-slate-100' : recipient.bounced ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {recipient.neverOpened ? 'Never opened' : recipient.bounced ? 'Bounced' : 'Engaged'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recipient.pageData?.map((p: any) => (
                    <div key={p.page} title={p.skipped ? `Page ${p.page}: Skipped` : `Page ${p.page}: ${p.timeSpent}s · ${p.scrollDepth}% scroll`}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border ${p.skipped ? 'bg-slate-50 text-slate-300 border-slate-200' : p.timeSpent > 120 ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-violet-50 text-violet-600 border-violet-200'}`}>
                      <span className="tabular-nums">P{p.page}</span>
                      {!p.skipped && <span className="opacity-60">· {p.timeSpent}s</span>}
                      {p.skipped && <span>⊘</span>}
                      {!p.skipped && p.visits > 1 && <span>↩</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
            heatmapByPage={analytics.heatmapByPage}
            onPageChange={setHeatmapPage}
          />
        </div>
      )}
    </>
  );
}