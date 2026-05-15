'use client';

import React from 'react';
import { Zap } from 'lucide-react';

type PageData = {
  page: number;
  visited: boolean;
  timeSpent: number;
  skipped: boolean;
};

type ViewerTracking = {
  recipientEmail: string;
  pageData: PageData[];
  totalTimeSeconds: number;
  firstOpened: string | null;
  bounced: boolean;
  neverOpened: boolean;
};

type RevisitData = {
  totalSessions: number;
  uniqueVisitors: number;
  revisits: number;
};

type Props = {
  recipientPageTracking: ViewerTracking[];
  revisitData: RevisitData | null;
  totalPages: number;
  lastViewed: string | null;
};

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 seconds';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} seconds`;
  if (s === 0) return `${m} minute${m > 1 ? 's' : ''}`;
  return `${m} minute${m > 1 ? 's' : ''} and ${s} seconds`;
}

function getDomain(email: string): string {
  if (!email || email.startsWith('Anonymous')) return '';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : '';
}

export function EarlySignalCard({
  recipientPageTracking,
  revisitData,
  totalPages,
  lastViewed,
}: Props) {

  // Only show within first 72 hours of first open
  const firstOpen = recipientPageTracking
    .filter(r => r.firstOpened)
    .map(r => new Date(r.firstOpened!).getTime())
    .sort((a, b) => a - b)[0];

  if (!firstOpen) return null;

  const hoursElapsed = (Date.now() - firstOpen) / (1000 * 60 * 60);
  if (hoursElapsed > 72) return null;

  // ── Compute early signals ────────────────────────────────────

  // Signal 1 — Total sessions in first 72 hours
  const totalSessions = revisitData?.totalSessions || 1;

  // Signal 2 — Deepest page reached across all viewers
  const deepestPage = recipientPageTracking.reduce((max, r) => {
    const visited = r.pageData?.filter(p => p.visited) || [];
    const maxPage = visited.length > 0
      ? Math.max(...visited.map(p => p.page))
      : 0;
    return Math.max(max, maxPage);
  }, 0);
  const depthPercent = totalPages > 0
    ? Math.round((deepestPage / totalPages) * 100)
    : 0;

  // Signal 3 — Return within 24 hours
  const hasQuickReturn = revisitData ? revisitData.revisits > 0 : false;

  // Signal 4 — Second viewer from same domain appeared
  const domainGroups = new Map<string, number>();
  recipientPageTracking.forEach(r => {
    if (!r.recipientEmail || r.recipientEmail.startsWith('Anonymous')) return;
    const domain = getDomain(r.recipientEmail);
    if (!domain) return;
    domainGroups.set(domain, (domainGroups.get(domain) || 0) + 1);
  });
  const hasSecondViewer = Array.from(domainGroups.values()).some(count => count >= 2);

  // Signal 5 — Time spent on late pages (last 30% of document)
  const latePagesThreshold = Math.floor(totalPages * 0.7);
  const timeOnLatePages = recipientPageTracking.reduce((sum, r) => {
    return sum + (r.pageData || [])
      .filter(p => p.page >= latePagesThreshold && p.visited)
      .reduce((s, p) => s + (p.timeSpent || 0), 0);
  }, 0);
  const engagedWithLatePages = timeOnLatePages > 30;

  // ── Count strong signals ──────────────────────────────────────
  const signals: string[] = [];

  if (totalSessions >= 2) {
    signals.push(
      `returned ${totalSessions - 1} time${totalSessions - 1 > 1 ? 's' : ''} already`
    );
  }
  if (depthPercent >= 70) {
    signals.push(`read ${depthPercent}% of the document`);
  }
  if (hasQuickReturn) {
    signals.push('came back within 24 hours');
  }
  if (hasSecondViewer) {
    signals.push('a second person from the same organisation opened it');
  }
  if (engagedWithLatePages) {
    signals.push(
      `spent time on the later sections — ${formatTime(timeOnLatePages)} on pages ${latePagesThreshold} onwards`
    );
  }

  // Only show if at least 2 strong signals exist
  if (signals.length < 2) return null;

  // ── Build narrative ───────────────────────────────────────────
  const hoursNote = hoursElapsed < 24
    ? `in the first ${Math.round(hoursElapsed)} hours`
    : `within the first ${Math.round(hoursElapsed / 24)} days`;

  const signalText = signals.length === 2
    ? `${signals[0]} and ${signals[1]}`
    : signals.slice(0, -1).join(', ') + ', and ' + signals[signals.length - 1];

  const strengthLabel = signals.length >= 4
    ? 'very strong'
    : signals.length === 3
    ? 'strong'
    : 'positive';

  const narrative = `This proposal is showing ${strengthLabel} early momentum. ${hoursNote.charAt(0).toUpperCase() + hoursNote.slice(1)} your prospect has ${signalText}. Early engagement at this level is a reliable indicator that the deal is being taken seriously. This is the right moment to follow up with something specific rather than waiting for them to reach out first.`;

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 mt-3">

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Zap className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
          Early Signal — First 72 Hours
        </p>
        <span className="ml-auto text-[10px] text-emerald-600 font-medium">
          {Math.round(hoursElapsed)}h since first open
        </span>
      </div>

      {/* Plain paragraph narrative */}
      <p className="text-sm text-slate-700 leading-relaxed">
        {narrative}
      </p>

      {/* Signal tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        {signals.map((signal, i) => (
          <span
            key={i}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
          >
            {signal}
          </span>
        ))}
      </div>

    </div>
  );
}