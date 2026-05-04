'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type DealStatus = 'hot' | 'warm' | 'cold' | 'dead';

type ViewerSummary = {
  viewerEmail: string;
  summary: string;
  recommendation: string;
  dealStatus: DealStatus;
  cached: boolean;
};

const STATUS_CONFIG: Record<DealStatus, {
  label: string;
  bg: string;
  border: string;
  badge: string;
  badgeText: string;
  icon: React.ReactNode;
}> = {
  hot: {
    label: 'Hot',
    bg: 'bg-green-50/60',
    border: 'border-green-100',
    badge: 'bg-green-100 text-green-700',
    badgeText: '🔥 Hot',
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
  },
  warm: {
    label: 'Warm',
    bg: 'bg-amber-50/60',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700',
    badgeText: '⚡ Warm',
    icon: <Minus className="h-4 w-4 text-amber-500" />,
  },
  cold: {
    label: 'Cold',
    bg: 'bg-sky-50/60',
    border: 'border-sky-100',
    badge: 'bg-sky-100 text-sky-700',
    badgeText: '❄️ Cold',
    icon: <TrendingDown className="h-4 w-4 text-sky-500" />,
  },
  dead: {
    label: 'Dead',
    bg: 'bg-slate-50/60',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-500',
    badgeText: '☠️ Dead',
    icon: <TrendingDown className="h-4 w-4 text-slate-400" />,
  },
};

type Props = {
  documentId: string;
  analytics: any;
};

export default function DealIntelligenceSummary({ documentId, analytics }: Props) {
  const [summaries, setSummaries] = useState<ViewerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const buildViewerData = () => {
    if (!analytics?.recipientPageTracking) return [];

    return analytics.recipientPageTracking
      .filter((r: any) => !r.neverOpened && !r.recipientEmail?.startsWith('Anonymous'))
      .map((r: any) => {
        // Find re-read pages for this viewer from dealInsight
        const viewerInsight = analytics.dealInsight?.viewers?.find(
          (v: any) => v.viewerEmail === r.recipientEmail
        );

        // Find pages with most and least time
        const sortedPages = [...(r.pageData || [])].sort(
          (a: any, b: any) => b.timeSpent - a.timeSpent
        );

        return {
          email: r.recipientEmail,
          totalViews: analytics.totalViews || 0,
          totalSessions: analytics.revisitData?.totalSessions || 1,
          daysSinceLastView: analytics.lastViewed
            ? Math.floor(
                (Date.now() - new Date(analytics.lastViewed).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          daysSinceFirstView: 0,
          completionRate: r.pageData?.filter((p: any) => p.visited).length /
            Math.max((r.pageData?.length || 1), 1) * 100,
          totalTimeSeconds: r.totalTimeSeconds || 0,
          reReadPages: viewerInsight?.reReadPages || [],
          skippedPages: r.pageData
            ?.filter((p: any) => p.skipped)
            .map((p: any) => p.page) || [],
          videoReplays: viewerInsight?.videoReplays || [],
          bounced: r.bounced || false,
          newViewersFromSameCompany: 0,
          deadDealScore: analytics.deadDeal?.score || 0,
          intentLevel: analytics.intentScores?.find(
            (v: any) => v.email === r.recipientEmail
          )?.intentLevel || 'low',
          pageWithMostTime: sortedPages[0]?.page || null,
          pageWithLeastTime: sortedPages[sortedPages.length - 1]?.page || null,
          totalPages: analytics.pageEngagement?.length || 1,
        };
      });
  };

  const fetchSummaries = async (force = false) => {
    try {
      const viewerData = buildViewerData();
      if (viewerData.length === 0) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/documents/${documentId}/deal-intelligence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ viewerData, forceRegenerate: force }),
        }
      );

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.summaries) {
        setSummaries(data.summaries);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      // Silent failure — never crash the page
      console.error('[DealIntelligenceSummary] fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummaries(false);
  }, [documentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummaries(true);
  };

  if (loading) {
    return (
      <div className="py-5 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-3.5 w-3.5 text-violet-400" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Deal Intelligence
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className="h-20 bg-slate-50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (summaries.length === 0) return null;

  return (
    <div className="py-5 border-b border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Deal Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-300">
            {lastRefreshed.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Thinking...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* One card per viewer */}
      <div className="space-y-3">
        {summaries.map((s, i) => {
          const config = STATUS_CONFIG[s.dealStatus] || STATUS_CONFIG.cold;
          return (
            <div
              key={s.viewerEmail || i}
              className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
            >
              {/* Viewer email + status badge */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-800 truncate flex-1 mr-3">
                  {s.viewerEmail}
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}
                >
                  {config.badgeText}
                </span>
              </div>

              {/* AI summary */}
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {s.summary}
              </p>

              {/* Recommended action */}
              <div className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2">
                {config.icon}
                <p className="text-xs font-semibold text-slate-700 leading-snug">
                  {s.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}