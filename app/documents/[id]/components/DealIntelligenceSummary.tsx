//app/documents/[id]/components/dealIntelligenceSummary
'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, TrendingUp, TrendingDown, Minus ,  ArrowUpRight, ArrowRight, ArrowDownRight, OctagonX } from 'lucide-react';
import { SecondaryViewerInsight } from './SecondaryViewerInsight';
import { EarlySignalCard } from './EarlySignalCard';

type DealStatus = 'hot' | 'warm' | 'cold' | 'dead';

type ViewerSummary = {
  viewerEmail: string;
  summary: string;
  recommendation: string;
  dealStatus: DealStatus;
   momentumState?: MomentumState;
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


// ── Momentum Indicator Config ─────────────────────────────────
type MomentumState = 'accelerating' | 'holding' | 'fading' | 'stalled';

const MOMENTUM_CONFIG: Record<MomentumState, {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  barColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  barWidth: string;
  pulse: boolean;
}> = {
  accelerating: {
    label: 'Accelerating',
   sublabel: 'Engagement is building across sessions',
    icon: <ArrowUpRight className="h-5 w-5" />,
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    barWidth: 'w-full',
    pulse: true,
  },
  holding: {
    label: 'Holding Steady',
    sublabel: 'Activity present — no strong direction yet',
    icon: <ArrowRight className="h-5 w-5" />,
    barColor: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    barWidth: 'w-2/3',
    pulse: false,
  },
  fading: {
    label: 'Fading',
     sublabel: 'Engagement dropping — mixed signals',
    icon: <ArrowDownRight className="h-5 w-5" />,
    barColor: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    barWidth: 'w-1/3',
    pulse: false,
  },
  stalled: {
    label: 'Stalled',
     sublabel: 'No recent activity detected',
    icon: <OctagonX className="h-5 w-5" />,
    barColor: 'bg-slate-400',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-500',
    borderColor: 'border-slate-200',
    barWidth: 'w-1/6',
    pulse: false,
  },
};

// ── Momentum Indicator Component ──────────────────────────────
function MomentumIndicator({ state }: { state: MomentumState }) {
  const config = MOMENTUM_CONFIG[state];

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} px-4 py-3 mb-3`}>
      {/* Top row — icon + label + sublabel */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* Animated icon container */}
        <div
          className={`
            h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0
            ${config.bgColor} border ${config.borderColor} ${config.textColor}
            ${config.pulse ? 'animate-pulse' : ''}
          `}
        >
          {config.icon}
        </div>

        {/* Label stack */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-bold ${config.textColor}`}>
              {config.label}
            </p>
            {config.pulse && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <p className={`text-[11px] ${config.textColor} opacity-80 leading-tight`}>
            {config.sublabel}
          </p>
        </div>
      </div>

      {/* Momentum bar */}
      <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden border border-white/40">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.barColor} ${config.pulse ? 'animate-pulse' : ''}`}
          style={{
            width: state === 'accelerating' ? '100%'
              : state === 'holding' ? '65%'
              : state === 'fading' ? '30%'
              : '10%',
          }}
        />
      </div>

      {/* Bar labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-400 font-medium">Stalled</span>
        <span className="text-[9px] text-slate-400 font-medium">Accelerating</span>
      </div>
    </div>
  );
}

type Props = {
  documentId: string;
  analytics: any;
   totalPages?: number;
};

export default function DealIntelligenceSummary({ documentId, analytics, totalPages = 1 }: Props) {
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
          totalSessions: (() => {
  // Count sessions belonging to THIS specific viewer only
  // not the total across all viewers
  if (!analytics.recipientPageTracking) return 1;
  const viewerDepths = r.sessionDepths || [];
  return viewerDepths.length > 0 ? viewerDepths.length : 1;
})(),
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
          // Progressive return pattern from revisit data
         // Progressive return pattern — now from route, not guessed
          progressionPattern: r.progressionPattern || 'single',
          progressionDetails: {
            sessionDepths: r.sessionDepths || [],
            stuckOnPages: r.stuckOnPages || [],
            deepestPageReached: r.sessionDepths?.length > 0
              ? Math.max(...(r.sessionDepths as number[]))
              : 0,
          },
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
                {/* Momentum Indicator — sits at very top of each card */}
              <MomentumIndicator
                state={(s.momentumState as MomentumState) || 'holding'}
              />
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
             {/*
              <div className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2">
                {config.icon}
                <p className="text-xs font-semibold text-slate-700 leading-snug">
                  {s.recommendation}
                </p>
              </div>
               */}
            </div>
          );
        })}

        {/* Early signal card — only shows in first 72 hours */}
        {analytics?.recipientPageTracking?.length > 0 && (
  <EarlySignalCard
    recipientPageTracking={analytics.recipientPageTracking}
    revisitData={analytics.revisitData}
    totalPages={totalPages}
    lastViewed={analytics.lastViewed}
    currentMomentumState={summaries[0]?.momentumState || 'holding'}
  />
)}

        {/* Secondary viewer insight — only shows when internal sharing detected */}
        {analytics?.recipientPageTracking?.length >= 2 && (
          <SecondaryViewerInsight
            viewers={analytics.recipientPageTracking}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  );
}