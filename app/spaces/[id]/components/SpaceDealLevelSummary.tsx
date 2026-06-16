//app/spaces/[id]/components/SpaceDealLevelSummary.tsx

'use client';

import React from 'react';
import { TrendingUp, Users, Eye, Clock } from 'lucide-react';

type SecondaryEngagement = {
  email: string;
  docsOpened: number;
  totalEvents: number;
  engagementQuality: 'high' | 'medium' | 'low';
};

type Props = {
  committeeGrowing: boolean;
  committeeSize: number;
  committeeConfidence?: 'domain_confirmed' | 'link_only' | 'none';
  prospectDomain: string;
  recommendedAction: string;
  secondaryViewerEngagement?: SecondaryEngagement[];
  hasHighQualitySecondaryViewer?: boolean;
  totalVisitors: number;
  lastActivity: string | null;
};

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function SpaceDealLevelSummary(props: Props) {
  const {
    committeeGrowing,
    committeeSize,
    committeeConfidence = 'domain_confirmed',
    prospectDomain,
    recommendedAction,
    secondaryViewerEngagement = [],
    hasHighQualitySecondaryViewer = false,
    totalVisitors,
    lastActivity,
  } = props;

  // Don't render at all if there's no committee signal — single
  // visitor cards already cover that case individually
  if (!committeeGrowing || committeeSize < 2) return null;

  const days = daysSince(lastActivity);

  const groupLabel = committeeConfidence === 'link_only'
    ? `${committeeSize} different people`
    : `${committeeSize} people from ${prospectDomain}`;

  const confidence: 'high' | 'medium' | 'low' =
    committeeConfidence === 'link_only'
      ? 'medium'
      : hasHighQualitySecondaryViewer
      ? 'high'
      : 'medium';

  const confidenceStyles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-slate-100 text-slate-500',
  };

  const deepReaders = secondaryViewerEngagement.filter(v => v.engagementQuality === 'high');
  const moderateReaders = secondaryViewerEngagement.filter(v => v.engagementQuality === 'medium');
  const passiveOpens = secondaryViewerEngagement.filter(v => v.engagementQuality === 'low');

  const whatHappened = committeeConfidence === 'link_only'
    ? `${groupLabel} have accessed this space. Their email addresses don't share a company domain, so this may be personal email used for business, or the space link forwarded outside the original company.`
    : `${groupLabel} have accessed this space.` +
      (deepReaders.length > 0
        ? ` ${deepReaders.length} secondary visitor${deepReaders.length > 1 ? 's' : ''} opened multiple documents actively.`
        : moderateReaders.length > 0
        ? ` ${moderateReaders.length} secondary visitor${moderateReaders.length > 1 ? 's' : ''} showed moderate engagement.`
        : passiveOpens.length > 0
        ? ` ${passiveOpens.length} secondary visitor${passiveOpens.length > 1 ? 's' : ''} opened briefly.`
        : '');

  const whatItMeans = committeeConfidence === 'link_only'
    ? `More than one person is looking at this space, even though the data cannot confirm they work at the same company. Worth asking your contact directly who else has seen it.`
    : deepReaders.length > 0
    ? `When a secondary visitor opens multiple documents, the space has moved beyond a courtesy forward. Someone beyond your original contact is actively evaluating this.`
    : `The space has been shared or accessed by more than one person. The spread of engagement across visitors is more meaningful than any single visitor's behaviour here.`;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-700">
            {committeeConfidence === 'link_only' ? 'Multiple Visitors Detected' : 'Internal Circulation'}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${confidenceStyles[confidence]}`}>
            {confidence === 'high' ? 'High confidence' : confidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {committeeConfidence === 'link_only'
              ? `${committeeSize} visitors, same link`
              : `${committeeSize} visitors from ${prospectDomain}`}
          </span>
          {days > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {days}d since last activity
            </span>
          )}
        </div>
      </div>

      {/* What happened */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What DocMetrics observed
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{whatHappened}</p>
      </div>

      {/* What it means */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          What this pattern typically suggests
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{whatItMeans}</p>
      </div>

      {/* Combined signal */}
      <div className="bg-white rounded-lg border border-blue-100 p-3 space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Combined signal
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{recommendedAction}</p>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {committeeConfidence === 'link_only'
          ? `These signals combine behaviour from ${committeeSize} visitors who accessed this space using the same link. Their company relationship is not confirmed by email domain. Your knowledge of the account will always matter more than any single data point here.`
          : `These signals combine behaviour from ${committeeSize} visitors at ${prospectDomain}. Your knowledge of the account and relationship context will always matter more than any single data point here.`}
      </p>
    </div>
  );
}