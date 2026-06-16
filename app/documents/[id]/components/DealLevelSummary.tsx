//app/documents/[id]/components/DealLevelSummary.tsx
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
  committeeConfidence?: 'domain_confirmed' | 'link_only' | 'none';
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

// ── Helper: format seconds into readable time ─────────────────────
function fmtMins(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 1) return 'under a minute';
  if (m === 1) return '1 minute';
  return `${m} minutes`;
}

// ── Helper: describe secondary viewer group intelligently ─────────
// Instead of "1 high quality secondary viewer" this returns
// language an experienced rep would use themselves
function describeSecondaryViewers(
  secondaryViewerEngagement: {
    email: string;
    totalTimeSeconds: number;
    pagesViewed: number;
    engagementQuality: 'high' | 'medium' | 'low';
  }[]
): {
  deepReaders: typeof secondaryViewerEngagement;
  moderateReaders: typeof secondaryViewerEngagement;
  passiveOpens: typeof secondaryViewerEngagement;
  deepestReader: (typeof secondaryViewerEngagement)[0] | null;
} {
  const deepReaders = secondaryViewerEngagement.filter(v => v.engagementQuality === 'high');
  const moderateReaders = secondaryViewerEngagement.filter(v => v.engagementQuality === 'medium');
  const passiveOpens = secondaryViewerEngagement.filter(v => v.engagementQuality === 'low');

  // The most engaged secondary viewer — most time spent
  const deepestReader = secondaryViewerEngagement.length > 0
    ? [...secondaryViewerEngagement].sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds)[0]
    : null;

  return { deepReaders, moderateReaders, passiveOpens, deepestReader };
}

function computeDealPulse(props: DealLevelSummaryProps): DealPulse {
  const {
    viewers,
    committeeGrowing,
    committeeSize,
    prospectDomain,
    committeeConfidence = 'domain_confirmed',
    secondaryViewerEngagement = [],
    hasHighQualitySecondaryViewer = false,
    daysSinceLastActivity,
  } = props;

  // When committee detection came from matching share links rather than
  // a confirmed company domain, describe the group honestly instead of
  // implying we know they work at the same place.
  const groupLabel = committeeConfidence === 'link_only'
    ? `${committeeSize} different people`
    : `${committeeSize} people from ${prospectDomain}`;

  const totalViewers = viewers.length;
  const hotViewers = viewers.filter(v => v.dealStatus === 'hot').length;
  const warmViewers = viewers.filter(v => v.dealStatus === 'warm').length;
  const coldViewers = viewers.filter(v => v.dealStatus === 'cold').length;
  const acceleratingViewers = viewers.filter(v => v.momentumState === 'accelerating').length;
  const fadingViewers = viewers.filter(
    v => v.momentumState === 'fading' || v.momentumState === 'stalled'
  ).length;

  // ── Champion = first viewer (highest total time among identified viewers) ──
  const champion = viewers.length > 0
    ? [...viewers].sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds)[0]
    : null;

  const { deepReaders, moderateReaders, passiveOpens, deepestReader } =
    describeSecondaryViewers(secondaryViewerEngagement);

  // ── Build evidence list ───────────────────────────────────────────
  function buildEvidence(): EvidenceItem[] {
    const items: EvidenceItem[] = [];

    if (committeeSize >= 2) {
      items.push({
        label: 'Viewers from same company',
        value: `${committeeSize} people from ${prospectDomain} have opened this document`,
        signal: 'positive',
      });
    } else {
      items.push({
        label: 'Viewers from same company',
        value: `1 person from ${prospectDomain} has opened this document so far`,
        signal: 'warning',
      });
    }

    if (deepReaders.length > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${deepReaders.length} secondary viewer${deepReaders.length > 1 ? 's' : ''} spent 5+ minutes reading — active evaluation, not a passive glance`,
        signal: 'positive',
      });
    } else if (moderateReaders.length > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${moderateReaders.length} secondary viewer${moderateReaders.length > 1 ? 's' : ''} spent 1–5 minutes reading — moderate engagement`,
        signal: 'neutral',
      });
    } else if (passiveOpens.length > 0) {
      items.push({
        label: 'Secondary viewer depth',
        value: `${passiveOpens.length} secondary viewer${passiveOpens.length > 1 ? 's' : ''} opened briefly (under 1 minute) — passive forward, not active evaluation`,
        signal: 'warning',
      });
    }

    if (hotViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${hotViewers} viewer${hotViewers > 1 ? 's' : ''} showing strong engagement — multiple sessions, time spent, re-reads detected`,
        signal: 'positive',
      });
    } else if (warmViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${warmViewers} viewer${warmViewers > 1 ? 's' : ''} engaged but not yet at evaluation depth`,
        signal: 'neutral',
      });
    } else if (coldViewers > 0) {
      items.push({
        label: 'Primary contact engagement',
        value: `${coldViewers} viewer${coldViewers > 1 ? 's' : ''} with limited engagement so far`,
        signal: 'negative',
      });
    }

    if (daysSinceLastActivity === 0) {
      items.push({ label: 'Last activity', value: 'Activity recorded today', signal: 'positive' });
    } else if (daysSinceLastActivity <= 3) {
      items.push({ label: 'Last activity', value: `${daysSinceLastActivity} day${daysSinceLastActivity > 1 ? 's' : ''} ago — recent`, signal: 'positive' });
    } else if (daysSinceLastActivity <= 7) {
      items.push({ label: 'Last activity', value: `${daysSinceLastActivity} days ago — worth monitoring`, signal: 'neutral' });
    } else if (daysSinceLastActivity <= 14) {
      items.push({ label: 'Last activity', value: `${daysSinceLastActivity} days ago — engagement is dropping`, signal: 'negative' });
    } else {
      items.push({ label: 'Last activity', value: `${daysSinceLastActivity} days ago — prolonged silence`, signal: 'negative' });
    }

    if (acceleratingViewers > 0) {
      items.push({
        label: 'Momentum direction',
        value: `${acceleratingViewers} viewer${acceleratingViewers > 1 ? 's' : ''} returning and reading deeper with each visit`,
        signal: 'positive',
      });
    } else if (fadingViewers > 0) {
      items.push({
        label: 'Momentum direction',
        value: `${fadingViewers} viewer${fadingViewers > 1 ? 's' : ''} reading less with each return visit`,
        signal: 'negative',
      });
    }

    return items;
  }

  const evidence = buildEvidence();

  // ════════════════════════════════════════════════════════════════
  // DEAL PULSE STATES — ordered by signal strength
  // Each state produces: whatHappened, whatItMeans, recommendedAction
  //
  // Language rules:
  // — Never order the rep. Observe and interpret. Let them decide.
  // — Never say "your champion is selling internally" — we don't know that.
  // — Never say "follow up now" as a command.
  // — Acknowledge the rep knows the relationship better than the data does.
  // — Be specific about what the data actually shows. No filler.
  // ════════════════════════════════════════════════════════════════

  // ── STATE 1: ADVANCING ───────────────────────────────────────────
  // Committee growing + deep secondary engagement + hot primary
  if (committeeGrowing && hasHighQualitySecondaryViewer && hotViewers >= 1) {

    const deepReaderDetail = deepestReader
      ? ` One secondary viewer spent ${fmtMins(deepestReader.totalTimeSeconds)} across ${deepestReader.pagesViewed} page${deepestReader.pagesViewed !== 1 ? 's' : ''} — that is active evaluation, not a quick glance.`
      : '';

    const noiseNote = passiveOpens.length > 0
      ? ` ${passiveOpens.length} other viewer${passiveOpens.length > 1 ? 's' : ''} opened briefly and likely did not engage meaningfully.`
      : '';

    return {
      state: 'advancing',
      label: 'Deal Advancing',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
whatHappened:
  `${groupLabel} have opened this document.` +
  (committeeConfidence === 'link_only'
    ? ` Their email addresses don't share a company domain, so this may be a personal email being used for business, or the document being shared outside the original company.`
    : '') +
  deepReaderDetail +
  noiseNote,

      whatItMeans:
        `When a secondary viewer spends this much time reading, the document has moved beyond a courtesy forward. ` +
        `Someone beyond your original contact is evaluating it seriously. ` +
        `This combination — strong primary engagement plus a deep secondary reader — is one of the clearer buying signals in post-proposal analytics.`,

      recommendedAction:
        `High confidence signal. The data suggests internal evaluation is underway. ` +
        `Depending on your relationship with your contact, this may be a natural moment to check in — ` +
        `not about the document itself, but about whether there are questions on their side you could help address. ` +
        `Reps who know this account will have a better read on timing than the data alone.`,

      confidence: committeeConfidence === 'link_only' ? 'medium' : 'high',
      evidence,
    };
  }

  // ── STATE 2: INTERNAL CIRCULATION (committee, varying engagement) ─
  if (committeeGrowing) {

    // Build a precise picture of who is doing what
    const deepDetail = deepReaders.length > 0
      ? `${deepReaders.length} secondary viewer${deepReaders.length > 1 ? 's' : ''} spent significant time reading (5+ minutes)`
      : null;
    const moderateDetail = moderateReaders.length > 0
      ? `${moderateReaders.length} spent 1–5 minutes`
      : null;
    const passiveDetail = passiveOpens.length > 0
      ? `${passiveOpens.length} opened briefly under a minute`
      : null;

    const engagementBreakdown = [deepDetail, moderateDetail, passiveDetail]
      .filter(Boolean)
      .join(', ');

    const confidenceLevel: 'high' | 'medium' | 'low' =
  committeeConfidence === 'link_only'
    ? 'medium'
    : deepReaders.length > 0 ? 'high'
    : moderateReaders.length > 0 ? 'medium'
    : 'medium';

    const actionByDepth =
      deepReaders.length > 0
        ? `High confidence signal. Secondary viewers are reading deeply. ` +
          `Based on your knowledge of this account, it may be worth checking in with your contact about any questions that have come up internally — ` +
          `framed around being helpful rather than checking on progress.`
        : moderateReaders.length > 0
        ? `Medium confidence signal. The document is circulating and some secondary viewers are engaging. ` +
          `The signal is not strong enough yet to act with certainty. ` +
          `Monitoring whether secondary viewers return for another session will sharpen the picture before you reach out.`
        : `Medium confidence signal. The document has been forwarded but secondary engagement is light so far. ` +
          `This could mean the forwards were informational rather than part of an active evaluation. ` +
          `Watching whether secondary viewers return over the next few days will tell you more than acting on this alone.`;

    return {
      state: 'evaluating',
      label: 'Internal Circulation',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: <Users className="h-4 w-4 text-blue-600" />,

      whatHappened:
  `${groupLabel} have opened this document. ` +
  (committeeConfidence === 'link_only'
    ? `Their email addresses don't share a company domain, so this may be a personal email or the link forwarded outside the original company. `
    : '') +
  (engagementBreakdown
    ? `Across the secondary viewers: ${engagementBreakdown}.`
    : ''),

      whatItMeans:
        `The document has moved beyond your original contact. ` +
        (deepReaders.length > 0
          ? `When secondary viewers invest real time reading, it suggests they are evaluating rather than just being looped in. `
          : `Secondary engagement is mixed — some readers are engaging, others opened and moved on. `) +
        `The spread of engagement across viewers is more meaningful than any single viewer's behaviour here.`,

      recommendedAction: actionByDepth,
      confidence: confidenceLevel,
      evidence,
    };
  }

  // ── STATE 3: SINGLE THREADED RISK ────────────────────────────────
  // One viewer, engaged, but no committee after 4+ days
  if (!committeeGrowing && (hotViewers >= 1 || warmViewers >= 1) && daysSinceLastActivity >= 4) {

    const championEngagement = champion
      ? ` Your primary contact has spent time with this document and engagement is ${hotViewers >= 1 ? 'strong' : 'moderate'}.`
      : '';

    return {
      state: 'single_threaded_risk',
      label: 'Single Threaded',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,

      whatHappened:
        `Only one person from ${prospectDomain} has opened this document after ${daysSinceLastActivity} days.` +
        championEngagement,

      whatItMeans:
        `When a contact is engaged with a proposal but has not shared it internally after several days, ` +
        `it usually means one of three things: they are still forming their own view before involving others, ` +
        `they do not yet have the internal support to move it forward, or they are evaluating quietly before bringing it to a decision. ` +
        `The data cannot distinguish between these — your read on the relationship will matter more than the signal here.`,

      recommendedAction:
        `Medium confidence signal. The engagement is real but the deal is single threaded so far. ` +
        `If your relationship with this contact allows it, a natural conversation about who else might benefit from seeing this — ` +
        `framed around their needs rather than your process — tends to surface the internal situation ` +
        `without putting pressure on the contact directly.`,

      confidence: 'medium',
      evidence,
    };
  }

  // ── STATE 4: SINGLE STRONG (early, recent, accelerating) ─────────
  if (!committeeGrowing && (hotViewers >= 1 || warmViewers >= 1) && acceleratingViewers >= 1 && daysSinceLastActivity <= 3) {

    return {
      state: 'single_strong',
      label: 'Strong Early Engagement',
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      icon: <TrendingUp className="h-4 w-4 text-violet-600" />,

      whatHappened:
        `Your primary contact is reading this document deeply and returning to it. ` +
        `No one else from ${prospectDomain} has opened it yet, but activity is recent — within the last ${daysSinceLastActivity === 0 ? 'day' : `${daysSinceLastActivity} day${daysSinceLastActivity > 1 ? 's' : ''}`}.`,

      whatItMeans:
        `Strong single-contact engagement in the first few days is a positive early signal. ` +
        `The absence of internal sharing is normal at this stage — ` +
        `most contacts read a proposal themselves before deciding whether to involve others. ` +
        `The next meaningful signal will be whether a second viewer from the same company appears.`,

      recommendedAction:
        `Medium confidence signal. Engagement is strong and the momentum is building. ` +
        `This is typically a natural moment to add value rather than check in — ` +
        `sharing something relevant to their situation, or asking a question that opens the door to a conversation ` +
        `about who else on their side should be involved, depending on where you are in the relationship.`,

      confidence: 'medium',
      evidence,
    };
  }

  // ── STATE 5: AT RISK ─────────────────────────────────────────────
  if (!committeeGrowing && fadingViewers > warmViewers && daysSinceLastActivity >= 5) {

    return {
      state: 'at_risk',
      label: 'Engagement Dropping',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <TrendingDown className="h-4 w-4 text-red-500" />,

      whatHappened:
        `Engagement is declining across your contacts from ${prospectDomain}. ` +
        `${daysSinceLastActivity} days have passed since the last recorded activity and no new viewers have appeared.`,

      whatItMeans:
        `Declining engagement without stakeholder expansion is one of the more reliable warning patterns in proposal data. ` +
        `It often reflects a shift in internal priorities rather than a rejection — ` +
        `something else moved up the stack. ` +
        `The data alone cannot confirm this, but it is worth factoring into how you approach the next contact.`,

      recommendedAction:
        `Medium confidence signal. The window for a natural response is narrowing. ` +
        `A short, direct message focused on their priorities — not the document — ` +
        `tends to get a response even when engagement is dropping, ` +
        `because it asks them to say yes or no rather than leaving things open.`,

      confidence: 'medium',
      evidence,
    };
  }

  // ── STATE 6: STALLED ─────────────────────────────────────────────
  if (daysSinceLastActivity >= 14 && !committeeGrowing) {

    return {
      state: 'stalled',
      label: 'Gone Quiet',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: <AlertCircle className="h-4 w-4 text-slate-500" />,

      whatHappened:
        `No engagement has been recorded for ${daysSinceLastActivity} days. ` +
        `The document has not been forwarded internally and no return visits have been detected.`,

      whatItMeans:
        `Prolonged silence after a proposal is one of the most common patterns in deals that eventually go cold — ` +
        `but it is not always a closed door. ` +
        `External factors, budget cycles, and internal changes at the prospect's company ` +
        `regularly explain silences that look like disengagement from the outside.`,

      recommendedAction:
        `Low confidence signal. The data suggests the deal has stalled but cannot explain why. ` +
        `A short message that acknowledges the gap without pressure — ` +
        `and asks a direct question about whether the timing still works — ` +
        `is usually the lowest risk move at this stage. ` +
        `If there is no reply within a few days, parking the deal with a future reminder ` +
        `is a reasonable way to keep the pipeline clean without writing it off.`,

      confidence: 'low',
      evidence,
    };
  }

  // ── STATE 7: EARLY STAGE (default) ───────────────────────────────
  return {
    state: 'early',
    label: 'Early Stage',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: <Eye className="h-4 w-4 text-slate-400" />,

    whatHappened:
      `${totalViewers === 1 ? 'One person has' : `${totalViewers} people have`} opened this document so far. ` +
      `Engagement data is present but limited.`,

    whatItMeans:
      `It is too early to draw reliable conclusions from the available signals. ` +
      `The next 48 to 72 hours of engagement — or silence — will shape the picture significantly.`,

    recommendedAction:
      `Low confidence signal. Not enough data yet to read the situation clearly. ` +
      `Watching whether engagement continues, drops, or expands to new viewers ` +
      `will produce a more reliable signal than acting on what is here now.`,

    confidence: 'low',
    evidence,
  };
}

// ── Style maps ────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────
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
    {props.committeeConfidence === 'link_only'
      ? `${committeeSize} viewers, same link`
      : `${committeeSize} viewers from ${prospectDomain}`}
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
              🔥 {hotCount} viewer{hotCount > 1 ? 's' : ''} — strong engagement
            </span>
          )}
          {warmCount > 0 && (
            <span className="text-[11px] font-medium text-amber-600">
              🌤 {warmCount} viewer{warmCount > 1 ? 's' : ''} — moderate engagement
            </span>
          )}
          {coldCount > 0 && (
            <span className="text-[11px] font-medium text-slate-500">
              ❄️ {coldCount} viewer{coldCount > 1 ? 's' : ''} — light engagement
            </span>
          )}
        </div>
      )}

      {/* What happened */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What DocMetrics observed
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.whatHappened}
        </p>
      </div>

      {/* What it means */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What this pattern typically suggests
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.whatItMeans}
        </p>
      </div>

      {/* Combined signal recommendation */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Combined signal
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.recommendedAction}
        </p>
      </div>

      {/* Evidence toggle — for experienced reps who want the raw signals */}
      <button
        onClick={() => setShowEvidence(!showEvidence)}
        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
      >
        {showEvidence ? '▲ Hide signals' : '▼ Show signals behind this reading'}
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
    ? props.committeeConfidence === 'link_only'
      ? `These signals combine behaviour from ${committeeSize} viewers who opened this document using the same link. Their company relationship is not confirmed by email domain. Your knowledge of the account and relationship context will always matter more than any single data point here.`
      : `These signals combine behaviour from ${committeeSize} viewers at ${prospectDomain}. Your knowledge of the account and relationship context will always matter more than any single data point here.`
    : `These signals reflect your primary contact only. The picture becomes significantly clearer when a second viewer from the same company appears.`}
</p>

    </div>
  );
}