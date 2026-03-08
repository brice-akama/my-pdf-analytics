"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Clock, Package, Activity, ChevronRight, LinkIcon as Link } from 'lucide-react';
import SpacesList from './SpacesList';

type Props = {
  analytics: any;
  analyticsLoading: boolean;
  spacesCount: number;
  spacesLoading: boolean;
  doc: { _id: string; ownerEmail?: string };
  onCreateLink: () => void;
  params: { id: string | string[] };
};

export default function UtilizationTab({
  analytics,
  analyticsLoading,
  spacesCount,
  spacesLoading,
  doc,
  onCreateLink,
  params,
}: Props) {
  const router = useRouter();

  if (analyticsLoading || spacesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading usage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── TOP KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Share Links',
            value: analytics?.shares || 0,
            icon: Link,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            border: 'border-violet-100',
            sub: 'created total',
          },
          {
            label: 'Total Visits',
            value: analytics?.totalViews || 0,
            icon: Eye,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'border-sky-100',
            sub: 'across all links',
          },
          {
            label: 'Spaces',
            value: spacesCount,
            icon: Package,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            sub: 'you have access to',
          },
          {
            label: 'Avg. Time',
            value: analytics?.avgTimePerSession || '0m 0s',
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            sub: 'per viewing session',
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.border} ${stat.bg} p-4 sm:p-5`}>
            <div className={`h-8 w-8 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-black tabular-nums ${stat.color} leading-none`}>
              {stat.value}
            </div>
            <div className="text-sm font-semibold text-slate-700 mt-1.5">{stat.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── USAGE TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Document Usage</h3>
            <p className="text-xs text-slate-400 mt-0.5">Activity for this document</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
            Last 30 days
          </span>
        </div>

        {analytics && (analytics.shares > 0 || analytics.totalViews > 0) ? (
          <>
            {/* Desktop */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>Owner</span>
                <span className="text-center">Links Created</span>
                <span className="text-center">Spaces</span>
                <span className="text-center">Visits</span>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-5 items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(doc?.ownerEmail || analytics?.ownerEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {doc?.ownerEmail || analytics?.ownerEmail || 'You'}
                    </p>
                    <p className="text-xs text-slate-400">Document owner</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">{analytics.shares || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">{spacesCount}</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">{analytics.totalViews || 0}</span>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:hidden px-4 py-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(doc?.ownerEmail || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {doc?.ownerEmail || analytics?.ownerEmail || 'You'}
                  </p>
                  <p className="text-xs text-slate-400">Document owner</p>
                </div>
              </div>
              {[
                { label: 'Links Created', value: analytics.shares || 0, icon: Link, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Spaces', value: spacesCount, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Total Visits', value: analytics.totalViews || 0, icon: Eye, color: 'text-sky-600', bg: 'bg-sky-50' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg ${row.bg} flex items-center justify-center`}>
                      <row.icon className={`h-3.5 w-3.5 ${row.color}`} />
                    </div>
                    <span className="text-sm text-slate-600">{row.label}</span>
                  </div>
                  <span className={`text-xl font-black tabular-nums ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-slate-300" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-2">No usage data yet</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
              Create share links or add this document to a space to start tracking usage
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onCreateLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold"
              >
                <Link className="h-4 w-4" />
                Create Share Link
              </button>
              <button
                onClick={() => router.push('/spaces')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Package className="h-4 w-4" />
                Browse Spaces
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SPACES LIST ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Your Spaces</h3>
            <p className="text-xs text-slate-400 mt-0.5">{spacesCount} space{spacesCount !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => router.push('/spaces')}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {spacesCount === 0 ? (
          <div className="px-6 py-10 text-center">
            <Package className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">You haven't created any spaces yet</p>
            <button
              onClick={() => router.push('/spaces')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Package className="h-4 w-4" />
              Create a Space
            </button>
          </div>
        ) : (
          <SpacesList docId={String(params.id)} />
        )}
      </div>

      {/* ── LINK PERFORMANCE ── */}
      {analytics?.shares > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Link Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">How your share links are performing</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {[
              { label: 'Completion Rate', value: `${analytics.completionRate || 0}%`, sub: 'avg. across all links', color: 'text-green-600' },
              { label: 'Unique Viewers', value: analytics.uniqueViewers || 0, sub: 'distinct visitors', color: 'text-sky-600' },
              { label: 'Avg. Time', value: analytics.avgTimePerSession || '0m 0s', sub: 'per session', color: 'text-violet-600' },
            ].map((s) => (
              <div key={s.label} className="px-4 sm:px-6 py-4 sm:py-5">
                <div className={`text-xl sm:text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-sm font-semibold text-slate-700 mt-1">{s.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}