'use client';

import React from 'react';
import {
  TrendingUp, TrendingDown, AlertCircle,
  Users, Eye, Clock, AlertTriangle,
} from 'lucide-react';

type ViewerSummary = {
  viewerEmail: string;
  dealStatus: 'hot' | 'warm' | 'cold' | 'dead';
  momentumState: 'accelerating' | 'holding' | 'fading' | 'stalled';
  totalTimeSeconds: number;
  summary?: string;
  recommendation?: string;
};

type DealLevelSummaryProps = {
  viewers: ViewerSummary[];
  committeeGrowing: boolean;
  committeeSize: number;
  prospectDomain: string;
  secondaryViewerEngagement?: {
    email: string;
    totalTimeSeconds: number;
    pagesViewed: number;
    engagementQuality: 'high' | 'medium' | 'low';
  }[];
  hasHighQualitySecondaryViewer?: boolean;
  daysSinceLastActivity: number;
};

type EvidenceItem = {
  label: string;
  value: string;
  signal: 'positive' | 'negative' | 'neutral' | 'warning';
};

type DealPulse = {
  state: 'advancing' | 'evaluating' | 'single_threaded_risk' | 'at_risk' | 'stalled' | 'single_strong' | 'early';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  whatHappened: string;
  whatItMeans: string;
  recommendedAction: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: EvidenceItem[];
};

function computeDealPulse(props: DealLevelSummaryProps): DealPulse {
  const {
    viewers,
    committeeGrowing,
    committeeSize,
    prospectDomain,
    secondaryViewerEngagement = [],
    hasHighQualitySecondaryViewer = false,
    daysSinceLastActivity,
  } = props;

  const totalViewers = viewers.length;
  const hotViewers = viewers.filter(v => v.dealStatus === 'hot').length;
  const warmViewers = viewers.filter(v => v.dealStatus === 'warm').length;
  const coldViewers = viewers.filter(v => v.dealStatus === 'cold').length;
  const acceleratingViewers = viewers.filter(v => v.momentumState === 'accelerating').length;
  const fadingViewers = viewers.filter(
    v => v.momentumState === 'fading' || v.momentumState === 'stalled'
  ).length;

  const highQualitySecondaryCount = secondaryViewerEngagement.filter(
    v => v.engagementQuality === 'high'
  ).length;
  const mediumQualitySecondaryCount = secondaryViewerEngagement.filter(
    v => v.engagementQuality === 'medium'
  ).length;
  const passiveSecondaryCount = secondaryViewerEngagement.filter(
    v => v.engagementQuality === 'low'
  ).length;

  // ── Build evidence list from raw signals ──────────────────────────
  function buildEvidence(): EvidenceItem[] {
    const items: EvidenceItem[] = [];

    // Committee size
    if (committeeSize >= 2) {
      items.push({
        label: 'Buying committee size',
        value: `${committeeSize} people from ${prospectDomain} have opened this proposal`,
        signal: 'positive',
      });
    } else {
      items.push({
        label: 'Buying committee size',
        value: `Only 1 person from ${prospectDomain} has opened this proposal`,
        signal: 'warning',
      });
    }

    // Secondary engagement quality
    if (highQualitySecondaryCount > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${highQualitySecondaryCount} secondary viewer${highQualitySecondaryCount > 1 ? 's' : ''} spent 5+ minutes reading — active evaluation not passive browsing`,
        signal: 'positive',
      });
    } else if (mediumQualitySecondaryCount > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${mediumQualitySecondaryCount} secondary viewer${mediumQualitySecondaryCount > 1 ? 's' : ''} spent 1 to 5 minutes reading — moderate engagement`,
        signal: 'neutral',
      });
    } else if (passiveSecondaryCount > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${passiveSecondaryCount} secondary viewer${passiveSecondaryCount > 1 ? 's' : ''} opened briefly under 1 minute — passive forward not active evaluation`,
        signal: 'warning',
      });
    }

    // Primary viewer engagement
    if (hotViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${hotViewers} viewer${hotViewers > 1 ? 's' : ''} classified as hot based on re-reads, time spent, and session depth`,
        signal: 'positive',
      });
    } else if (warmViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${warmViewers} viewer${warmViewers > 1 ? 's' : ''} classified as warm — engaged but not at evaluation depth`,
        signal: 'neutral',
      });
    } else if (coldViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${coldViewers} viewer${coldViewers > 1 ? 's' : ''} classified as cold — limited engagement detected`,
        signal: 'negative',
      });
    }

    // Recency
    if (daysSinceLastActivity === 0) {
      items.push({
        label: 'Last activity',
        value: 'Activity detected today',
        signal: 'positive',
      });
    } else if (daysSinceLastActivity <= 3) {
      items.push({
        label: 'Last activity',
        value: `${daysSinceLastActivity} day${daysSinceLastActivity > 1 ? 's' : ''} since last open — recent`,
        signal: 'positive',
      });
    } else if (daysSinceLastActivity <= 7) {
      items.push({
        label: 'Last activity',
        value: `${daysSinceLastActivity} days since last open — watch for further silence`,
        signal: 'neutral',
      });
    } else if (daysSinceLastActivity <= 14) {
      items.push({
        label: 'Last activity',
        value: `${daysSinceLastActivity} days since last open — engagement dropping`,
        signal: 'negative',
      });
    } else {
      items.push({
        label: 'Last activity',
        value: `${daysSinceLastActivity} days since last open — prolonged silence`,
        signal: 'negative',
      });
    }

    // Momentum direction
    if (acceleratingViewers > 0) {
      items.push({
        label: 'Momentum direction',
        value: `${acceleratingViewers} viewer${acceleratingViewers > 1 ? 's' : ''} showing accelerating engagement — returning and reading deeper each time`,
        signal: 'positive',
      });
    } else if (fadingViewers > 0) {
      items.push({
        label: 'Momentum direction',
        value: `${fadingViewers} viewer${fadingViewers > 1 ? 's' : ''} showing fading engagement — reading less with each return visit`,
        signal: 'negative',
      });
    }

    return items;
  }

  const evidence = buildEvidence();

  // ── ADVANCING: committee growing + high quality secondary + any hot viewer ──
  if (committeeGrowing && hasHighQualitySecondaryViewer && hotViewers >= 1) {
    return {
      state: 'advancing',
      label: 'Deal Advancing',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      whatHappened: `${committeeSize} people from ${prospectDomain} have opened this proposal and at least one secondary stakeholder spent significant time reading it — not a passive forward.`,
      whatItMeans: `The buying committee is growing and secondary stakeholders are actively evaluating. Your champion is selling internally on your behalf. This is the combination that experienced sales leaders say distinguishes deals that close from ones that stall.`,
      recommendedAction: `Signal detected (high confidence): Contact your champion today. Ask specifically who else is now involved, what each person cares about most, and whether they need help making the internal case. Do not send a generic follow up. The right message now is one that helps your champion sell to the people who are already reading this.`,
      confidence: 'high',
      evidence,
    };
  }

  // ── INTERNAL CIRCULATION: committee growing, any engagement level ──
  // This fires whenever committeeSize >= 2 regardless of hot/warm counts
  // because the committee signal itself is the most important indicator
  if (committeeGrowing) {
    const secondaryDepth = hasHighQualitySecondaryViewer
      ? 'at least one secondary stakeholder is engaging deeply'
      : secondaryViewerEngagement.some((v: any) => v.engagementQuality === 'medium')
      ? 'secondary viewers are showing moderate engagement'
      : 'secondary viewers are opening briefly rather than reading deeply';

    const confidenceLevel: 'high' | 'medium' | 'low' = hasHighQualitySecondaryViewer
      ? 'high'
      : secondaryViewerEngagement.some((v: any) => v.engagementQuality === 'medium')
      ? 'medium'
      : 'medium';

    const actionText = hasHighQualitySecondaryViewer
      ? `Signal detected (high confidence): ${committeeSize} people from ${prospectDomain} have opened this proposal and secondary engagement is deep. Contact your champion today. Ask who else is now involved, what each person cares about most, and whether they need help making the internal case.`
      : secondaryViewerEngagement.some((v: any) => v.engagementQuality === 'medium')
      ? `Signal detected (medium confidence): The proposal is circulating internally with moderate secondary engagement. Ask your champion who else is involved before sending any follow up. A premature generic message could interrupt the internal process.`
      : `Signal detected (medium confidence): The proposal has been forwarded internally but secondary viewers are engaging briefly. Monitor whether they return for deeper engagement. Asking your champion about the internal timeline is lower risk than following up with the group directly.`;

    return {
      state: 'evaluating',
      label: 'Internal Circulation',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <Users className="h-4 w-4 text-blue-600" />,
      whatHappened: `${committeeSize} people from ${prospectDomain} have opened this proposal and ${secondaryDepth}.`,
      whatItMeans: `The proposal has moved beyond your original contact and is being reviewed internally. This is what buying committees look like before a decision is made. The deal is alive and progressing through the buyer's internal process.`,
      recommendedAction: actionText,
      confidence: confidenceLevel,
      evidence,
    };
  }

  // ── SINGLE THREADED RISK: one viewer, hot, but no committee after 4+ days ──
  if (!committeeGrowing && (hotViewers >= 1 || warmViewers >= 1) && daysSinceLastActivity >= 4) {
    return {
      state: 'single_threaded_risk',
      label: 'Single Threaded Risk',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
      whatHappened: `Only one person from ${prospectDomain} has opened this proposal despite ${daysSinceLastActivity} days having passed since it was sent. Your primary contact is engaged but no internal sharing has been detected.`,
      whatItMeans: `Single threaded deals fail more often than multi stakeholder deals. A warm champion who has not introduced the proposal internally is either waiting for the right moment, does not have the authority to move forward alone, or has not prioritised it yet.`,
      recommendedAction: `Signal detected (medium confidence): Your primary contact is engaged but the deal is single threaded. Ask directly whether others on their side should be part of the evaluation. Phrase it as a helpful question — I want to make sure I am giving the right people what they need to evaluate this properly, who else should be involved in this conversation?`,
      confidence: 'medium',
      evidence,
    };
  }

  // ── SINGLE STRONG: one viewer, high engagement, recent ──
  if (!committeeGrowing && (hotViewers >= 1 || warmViewers >= 1) && acceleratingViewers >= 1 && daysSinceLastActivity <= 3) {
    return {
      state: 'single_strong',
      label: 'Strong Early Engagement',
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      icon: <TrendingUp className="h-4 w-4 text-violet-600" />,
      whatHappened: `Your primary contact is reading this proposal deeply and returning to it. No internal sharing has been detected yet but the deal is recent and engagement is strong.`,
      whatItMeans: `Early strong engagement from a single contact is a promising signal but the absence of stakeholder expansion means the buying process has not yet started internally. This is normal at the early evaluation stage.`,
      recommendedAction: `Signal detected (medium confidence): Engagement is strong and recent. Now is a natural moment to ask whether others on their side should be involved. That question moves the deal from single threaded evaluation to internal circulation which is where buying processes actually progress.`,
      confidence: 'medium',
      evidence,
    };
  }

  // ── AT RISK: engagement fading, no committee growth ──
  if (!committeeGrowing && fadingViewers > warmViewers && daysSinceLastActivity >= 5) {
    return {
      state: 'at_risk',
      label: 'Engagement Dropping',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <TrendingDown className="h-4 w-4 text-red-500" />,
      whatHappened: `Engagement from your contacts is declining. ${daysSinceLastActivity} days have passed since the last activity and no new stakeholders have appeared.`,
      whatItMeans: `Declining engagement without stakeholder expansion is one of the clearest warning patterns in proposal analytics. It often means the deal is losing internal priority without the salesperson being told.`,
      recommendedAction: `Signal detected (medium confidence): Do not send another follow up about the document. Send one direct question about whether this is still a priority right now. A direct question gets a response even when engagement is dropping because it forces a yes or no rather than allowing continued deferral.`,
      confidence: 'medium',
      evidence,
    };
  }

  // ── STALLED: prolonged silence, no committee growth ──
  if (daysSinceLastActivity >= 14 && !committeeGrowing) {
    return {
      state: 'stalled',
      label: 'Deal Stalled',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: <AlertCircle className="h-4 w-4 text-slate-500" />,
      whatHappened: `No engagement has been recorded for ${daysSinceLastActivity} days. The buying circle has not expanded beyond the original contact.`,
      whatItMeans: `Prolonged silence without stakeholder expansion is the most common pattern in lost deals. The data cannot tell you whether this deal is genuinely dead or paused for external reasons.`,
      recommendedAction: `Signal detected (low confidence): Send one final short message acknowledging the silence without guilt. If there is no reply within three days archive this deal and set a six week reminder. Some deals are not dead. They are waiting for an external trigger you cannot see.`,
      confidence: 'low',
      evidence,
    };
  }

  // ── EARLY STAGE: default fallback — minimal data ──
  return {
    state: 'early',
    label: 'Early Stage',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: <Eye className="h-4 w-4 text-slate-400" />,
    whatHappened: `${totalViewers === 1 ? 'One person has' : `${totalViewers} people have`} opened this proposal so far. Engagement data is present but limited.`,
    whatItMeans: `It is too early to draw reliable conclusions. Monitor engagement over the next 48 to 72 hours before acting.`,
    recommendedAction: `No strong signal yet: A short contextual follow up referencing something specific in the document tends to perform better than a generic check in after 72 hours of silence.`,
    confidence: 'low',
    evidence,
  };
}

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-500',
};

const SIGNAL_STYLES = {
  positive: 'text-green-600',
  negative: 'text-red-500',
  neutral: 'text-slate-500',
  warning: 'text-amber-600',
};

const SIGNAL_DOTS = {
  positive: 'bg-green-400',
  negative: 'bg-red-400',
  neutral: 'bg-slate-300',
  warning: 'bg-amber-400',
};

export function DealLevelSummary(props: DealLevelSummaryProps) {
  const { viewers, committeeSize, prospectDomain, daysSinceLastActivity } = props;
  const [showEvidence, setShowEvidence] = React.useState(false);

  if (!viewers || viewers.length === 0) return null;

  const pulse = computeDealPulse(props);

  const hotCount = viewers.filter(v => v.dealStatus === 'hot').length;
  const warmCount = viewers.filter(v => v.dealStatus === 'warm').length;
  const coldCount = viewers.filter(v => v.dealStatus === 'cold').length;

  return (
    <div className={`rounded-xl border ${pulse.borderColor} ${pulse.bgColor} p-5 space-y-4`}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {pulse.icon}
          <h3 className={`text-sm font-bold ${pulse.color}`}>{pulse.label}</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CONFIDENCE_STYLES[pulse.confidence]}`}>
            {pulse.confidence === 'high'
              ? 'High confidence'
              : pulse.confidence === 'medium'
              ? 'Medium confidence'
              : 'Low confidence'}
          </span>
          {committeeSize >= 2 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {committeeSize} stakeholders
            </span>
          )}
          {daysSinceLastActivity > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {daysSinceLastActivity}d since last activity
            </span>
          )}
        </div>
      </div>

      {/* Viewer status strip — only when multiple viewers */}
      {viewers.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          {hotCount > 0 && (
            <span className="text-[11px] font-medium text-green-700">
              🔥 {hotCount} hot viewer{hotCount > 1 ? 's' : ''}
            </span>
          )}
          {warmCount > 0 && (
            <span className="text-[11px] font-medium text-amber-600">
              🌤 {warmCount} warm viewer{warmCount > 1 ? 's' : ''}
            </span>
          )}
          {coldCount > 0 && (
            <span className="text-[11px] font-medium text-slate-500">
              ❄️ {coldCount} cold viewer{coldCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* What happened — the evidence */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What DocMetrics observed
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.whatHappened}
        </p>
      </div>

      {/* What it means — the interpretation */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What this typically means
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.whatItMeans}
        </p>
      </div>

      {/* Recommended action */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Combined signal recommendation
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.recommendedAction}
        </p>
      </div>

      {/* Show evidence toggle — for experienced reps who want to see the data */}
      <button
        onClick={() => setShowEvidence(!showEvidence)}
        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
      >
        {showEvidence ? '▲ Hide signals' : '▼ Show signals used to reach this conclusion'}
      </button>

      {showEvidence && (
        <div className="space-y-2 pt-1 border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Signals used
          </p>
          {pulse.evidence.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${SIGNAL_DOTS[item.signal]}`} />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500">{item.label}: </span>
                <span className={`text-[11px] ${SIGNAL_STYLES[item.signal]}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {committeeSize >= 2
          ? `This summary combines signals from ${committeeSize} viewers inside ${prospectDomain}. Your knowledge of the relationship and broader context should inform any decision to act.`
          : `This summary reflects engagement from your primary contact only. Deal level confidence increases significantly when internal sharing is detected.`}
      </p>

    </div>
  );
}