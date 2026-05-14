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

function getDomain(email: string): string {
  if (!email || email.startsWith('Anonymous')) return '';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : '';
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

function buildNarrative(
  primary: ViewerProfile,
  secondary: ViewerProfile,
  totalPages: number
): string {
  const primaryDomain = getDomain(primary.recipientEmail);
  const secondaryEmail = secondary.recipientEmail;
  const daysBetween = primary.firstOpened && secondary.firstOpened
    ? Math.round(
        (new Date(secondary.firstOpened).getTime() -
          new Date(primary.firstOpened).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const primaryTopPages = getTopPages(primary.pageData);
  const secondaryTopPages = getTopPages(secondary.pageData);

  const primaryFocus = primaryTopPages.length > 0
    ? `page${primaryTopPages.length > 1 ? 's' : ''} ${primaryTopPages.map(p => p.page).join(' and ')}`
    : 'the document';

  const secondaryFocus = secondaryTopPages.length > 0
    ? `page${secondaryTopPages.length > 1 ? 's' : ''} ${secondaryTopPages.map(p => p.page).join(' and ')}`
    : 'the document';

  // Detect what kind of secondary viewer this likely is
  const secondarySkippedEarly = secondaryTopPages.every(p => p.page >= Math.floor(totalPages * 0.6));
  const secondaryFocusedOnLatePages = secondaryTopPages.length > 0 &&
    secondaryTopPages[0].page >= Math.floor(totalPages * 0.6);
  const primaryFocusedOnEarlyPages = primaryTopPages.length > 0 &&
    primaryTopPages[primaryTopPages.length - 1].page <= Math.floor(totalPages * 0.5);

  let roleHint = '';
  if (secondaryFocusedOnLatePages && primaryFocusedOnEarlyPages) {
    roleHint = ' This pattern is consistent with a procurement or legal reviewer who skipped the solution sections and went straight to commercial terms.';
  } else if (secondaryTopPages.length > 0 && secondaryTopPages[0].page !== primaryTopPages[0]?.page) {
    roleHint = ' The difference in focus suggests this is a different stakeholder evaluating the proposal from a different angle than your original contact.';
  }

  const timingNote = daysBetween !== null && daysBetween > 0
    ? `${daysBetween} day${daysBetween > 1 ? 's' : ''} after your original contact first opened it`
    : 'shortly after your original contact first opened it';

  const timeNote = secondary.totalTimeSeconds > 0
    ? ` spending ${formatTime(secondary.totalTimeSeconds)} reading it`
    : '';

  return `A second person from ${primaryDomain} opened this document ${timingNote}${timeNote}. Your original contact focused most of their attention on ${primaryFocus} while this new viewer spent the most time on ${secondaryFocus}.${roleHint} This almost certainly means your proposal has moved beyond your initial contact and is being reviewed internally. The deal is progressing — your champion has been selling it on your behalf.`;
}

export function SecondaryViewerInsight({ viewers, totalPages }: Props) {
  // Group viewers by company domain
  const domainGroups = new Map<string, ViewerProfile[]>();

  viewers.forEach(viewer => {
    if (!viewer.recipientEmail || viewer.recipientEmail.startsWith('Anonymous')) return;
    const domain = getDomain(viewer.recipientEmail);
    if (!domain) return;
    if (!domainGroups.has(domain)) domainGroups.set(domain, []);
    domainGroups.get(domain)!.push(viewer);
  });

  // Find domains with 2+ viewers — these are the internal sharing signals
  const sharedDomains = Array.from(domainGroups.entries())
    .filter(([, viewers]) => viewers.length >= 2);

  if (sharedDomains.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      {sharedDomains.map(([domain, domainViewers]) => {
        // Sort by first opened — earliest is the primary viewer
        const sorted = [...domainViewers].sort((a, b) => {
          if (!a.firstOpened) return 1;
          if (!b.firstOpened) return -1;
          return new Date(a.firstOpened).getTime() - new Date(b.firstOpened).getTime();
        });

        const primary = sorted[0];
        const secondary = sorted[1];

        if (!primary || !secondary) return null;

        const narrative = buildNarrative(primary, secondary, totalPages);

        return (
          <div
            key={domain}
            className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Internal Sharing Detected — {domain}
              </p>
            </div>

            {/* Plain paragraph narrative */}
            <p className="text-sm text-slate-700 leading-relaxed">
              {narrative}
            </p>

            {/* Subtle viewer tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Original — {primary.recipientEmail}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                New viewer — {secondary.recipientEmail}
              </span>
              {sorted.length > 2 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  +{sorted.length - 2} more from same organisation
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}