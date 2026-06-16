//app/documents/[id]/components/SecondaryViewerInsight.tsx

'use client';

import React from 'react';
import { Users } from 'lucide-react';

type PageData = {
  page: number;
  visited: boolean;
  timeSpent: number;
  skipped: boolean;
};

type ViewerProfile = {
  recipientEmail: string;
  pageData: PageData[];
  totalTimeSeconds: number;
  firstOpened: string | null;
};

type Props = {
  viewers: ViewerProfile[];
  totalPages: number;
};

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
  'mail.com', 'live.com', 'msn.com', 'googlemail.com',
]);

function getDomain(email: string): string {
  if (!email || email.startsWith('Anonymous')) return '';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : '';
}

function isFreeEmailDomain(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 seconds';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} seconds`;
  if (s === 0) return `${m} minute${m > 1 ? 's' : ''}`;
  return `${m} minute${m > 1 ? 's' : ''} and ${s} seconds`;
}

function getTopPages(pageData: PageData[], limit = 3): PageData[] {
  return [...pageData]
    .filter(p => p.visited && p.timeSpent > 0)
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, limit);
}

function getOrdinal(n: number): string {
  const ordinals = ['', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  return ordinals[n] || `${n}th`;
}

function getRoleHint(
  secondary: ViewerProfile,
  primary: ViewerProfile,
  totalPages: number
): string {
  const secondaryTopPages = getTopPages(secondary.pageData);
  const primaryTopPages = getTopPages(primary.pageData);

  const secondaryFocusedOnLatePages = secondaryTopPages.length > 0 &&
    secondaryTopPages[0].page >= Math.floor(totalPages * 0.6);
  const primaryFocusedOnEarlyPages = primaryTopPages.length > 0 &&
    primaryTopPages[primaryTopPages.length - 1].page <= Math.floor(totalPages * 0.5);

  if (secondaryFocusedOnLatePages && primaryFocusedOnEarlyPages) {
    return ' This pattern is consistent with a procurement or legal reviewer who skipped the solution sections and went straight to commercial terms.';
  }

  if (
    secondaryTopPages.length > 0 &&
    primaryTopPages.length > 0 &&
    secondaryTopPages[0].page !== primaryTopPages[0].page
  ) {
    return ' The difference in focus suggests this stakeholder is evaluating the proposal from a different angle than your original contact.';
  }

  return '';
}

function buildViewerNarrative(
  viewer: ViewerProfile,
  primary: ViewerProfile,
  position: number,
  domain: string,
  totalPages: number
): string {
  const ordinal = getOrdinal(position);
  const topPages = getTopPages(viewer.pageData);
  const primaryTopPages = getTopPages(primary.pageData);

  const focusDescription = topPages.length > 0
    ? `page${topPages.length > 1 ? 's' : ''} ${topPages.map(p => p.page).join(' and ')}`
    : 'the document';

  const primaryFocusDescription = primaryTopPages.length > 0
    ? `page${primaryTopPages.length > 1 ? 's' : ''} ${primaryTopPages.map(p => p.page).join(' and ')}`
    : 'the document';

  const daysBetween = primary.firstOpened && viewer.firstOpened
    ? Math.round(
        (new Date(viewer.firstOpened).getTime() -
          new Date(primary.firstOpened).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const timingNote = daysBetween !== null && daysBetween > 0
    ? `${daysBetween} day${daysBetween > 1 ? 's' : ''} after your original contact first opened it`
    : 'shortly after your original contact first opened it';

  const timeNote = viewer.totalTimeSeconds > 0
    ? ` spending ${formatTime(viewer.totalTimeSeconds)} reading it`
    : '';

  const roleHint = getRoleHint(viewer, primary, totalPages);

  const engagementNote = position === 2
    ? `Your original contact focused most of their attention on ${primaryFocusDescription} while this new viewer spent the most time on ${focusDescription}.`
    : `This viewer spent the most time on ${focusDescription}.`;

  return `A ${ordinal} person from ${domain} opened this document ${timingNote}${timeNote}. ${engagementNote}${roleHint}`;
}

function getEngagementQuality(viewer: ViewerProfile): 'high' | 'medium' | 'low' {
  if (viewer.totalTimeSeconds >= 300) return 'high';
  if (viewer.totalTimeSeconds >= 60) return 'medium';
  return 'low';
}

function getEngagementLabel(quality: 'high' | 'medium' | 'low'): string {
  if (quality === 'high') return 'Deep review';
  if (quality === 'medium') return 'Moderate review';
  return 'Brief open';
}

function getEngagementColor(quality: 'high' | 'medium' | 'low'): string {
  if (quality === 'high') return 'bg-green-100 text-green-700';
  if (quality === 'medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-slate-100 text-slate-600';
}

export function SecondaryViewerInsight({ viewers, totalPages }: Props) {
  const domainGroups = new Map<string, ViewerProfile[]>();
  // Free-provider viewers go in a single bucket keyed by 'link_only' —
  // we cannot claim they share a company, only that they share the doc
  const linkOnlyViewers: ViewerProfile[] = [];

  viewers.forEach(viewer => {
    if (!viewer.recipientEmail || viewer.recipientEmail.startsWith('Anonymous')) return;
    const domain = getDomain(viewer.recipientEmail);
    if (!domain) return;

    if (isFreeEmailDomain(domain)) {
      linkOnlyViewers.push(viewer);
      return;
    }

    if (!domainGroups.has(domain)) domainGroups.set(domain, []);
    domainGroups.get(domain)!.push(viewer);
  });

  const sharedDomains: [string, ViewerProfile[]][] = Array.from(domainGroups.entries())
    .filter(([, domainViewers]) => domainViewers.length >= 2);

  // Free-email viewers count as a "shared group" too, just unconfirmed —
  // only surface it if 2+ distinct free-email viewers opened this doc
  const hasLinkOnlyGroup = linkOnlyViewers.length >= 2;

  if (sharedDomains.length === 0 && !hasLinkOnlyGroup) return null;

  // Combine confirmed domain groups with the link-only group for rendering
  const allGroups: { domain: string; domainViewers: ViewerProfile[]; isLinkOnly: boolean }[] = [
    ...sharedDomains.map(([domain, domainViewers]) => ({ domain, domainViewers, isLinkOnly: false })),
    ...(hasLinkOnlyGroup ? [{ domain: 'multiple providers', domainViewers: linkOnlyViewers, isLinkOnly: true }] : []),
  ];

  return (
    <div className="space-y-4 mt-4">
      {allGroups.map(({ domain, domainViewers, isLinkOnly }) => {
        // Sort by first opened — earliest is the primary viewer
        const sorted = [...domainViewers].sort((a, b) => {
          if (!a.firstOpened) return 1;
          if (!b.firstOpened) return -1;
          return new Date(a.firstOpened).getTime() - new Date(b.firstOpened).getTime();
        });

        const primary = sorted[0];
        const secondaryViewers = sorted.slice(1);

        // Show individual narratives for positions 2 and 3
        // Group position 4+ together
        const individualViewers = secondaryViewers.slice(0, 2);
        const groupedViewers = secondaryViewers.slice(2);

        const totalSecondaryCount = secondaryViewers.length;

        return (
          <div
            key={domain}
            className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
               <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                 {isLinkOnly
                   ? 'Multiple Viewers Detected — Same Link'
                   : `Multiple Viewers Detected — ${domain}`}
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                {totalSecondaryCount + 1} people total
              </span>
            </div>

            {/* Original contact tag */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100">
              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Original contact</p>
                <p className="text-xs font-medium text-slate-800 truncate">{primary.recipientEmail}</p>
              </div>
              {primary.totalTimeSeconds > 0 && (
                <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getEngagementColor(getEngagementQuality(primary))}`}>
                  {getEngagementLabel(getEngagementQuality(primary))}
                </span>
              )}
            </div>

            {/* Individual narratives for 2nd and 3rd viewers */}
            {individualViewers.map((viewer, index) => {
              const position = index + 2;
              const domainLabel = isLinkOnly ? 'the same link' : domain;
              const narrative = buildViewerNarrative(viewer, primary, position, domainLabel, totalPages);
              const quality = getEngagementQuality(viewer);

              return (
                <div key={viewer.recipientEmail} className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-indigo-100">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {getOrdinal(position).charAt(0).toUpperCase() + getOrdinal(position).slice(1)} viewer
                      </p>
                      <p className="text-xs font-medium text-slate-800 truncate">{viewer.recipientEmail}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getEngagementColor(quality)}`}>
                      {getEngagementLabel(quality)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed px-1">
                    {narrative}
                  </p>
                </div>
              );
            })}

            {/* Grouped summary for 4th viewer onwards */}
            {groupedViewers.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  {groupedViewers.length} additional viewer{groupedViewers.length > 1 ? 's' : ''} from same organisation
                </p>
                <div className="space-y-1">
                  {groupedViewers.map(viewer => {
                    const quality = getEngagementQuality(viewer);
                    return (
                      <div key={viewer.recipientEmail} className="flex items-center justify-between">
                        <p className="text-xs text-slate-600 truncate flex-1">{viewer.recipientEmail}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${getEngagementColor(quality)}`}>
                          {getEngagementLabel(quality)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  {groupedViewers.filter(v => getEngagementQuality(v) === 'high').length > 0
                   ? `${groupedViewers.filter(v => getEngagementQuality(v) === 'high').length} of these viewer${groupedViewers.filter(v => getEngagementQuality(v) === 'high').length > 1 ? 's' : ''} spent significant time reading — a signal worth noting alongside what you know about the account.`
                    : 'These viewers opened briefly. Return visits from any of them would strengthen the signal considerably.'}
                </p>
              </div>
            )}

          {/* Bottom conclusion */}
            <p className="text-sm font-medium text-blue-800 border-t border-blue-100 pt-3">
              {isLinkOnly
                ? `${totalSecondaryCount + 1} different people have opened this document using the same link. Their email addresses don't share a company domain, so this may be personal email used for business, or the link forwarded outside the original company. Either way, more than one person is now looking at this document.`
                : totalSecondaryCount === 1
                ? `A second person from ${domain} has opened this document. This may indicate your contact has shared it internally, though the data alone cannot confirm that. Your read on the relationship and what you know about their internal process will matter more than this signal alone.`
                : `${totalSecondaryCount + 1} people from ${domain} have now opened this document. The spread of engagement across these viewers may indicate the proposal is moving through an internal review. Whether and how to act on this is best judged against what you know about the account.`}
            </p>
          </div>
        );
      })}
    </div>
  );
}