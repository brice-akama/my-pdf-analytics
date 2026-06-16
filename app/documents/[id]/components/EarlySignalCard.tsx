
//app/documents/[id]/components/EarlySignalCard

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
  currentMomentumState?: 'accelerating' | 'holding' | 'fading' | 'stalled';
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
  currentMomentumState = 'holding',
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
  // ── Per-viewer breakdown — treat each viewer independently ────
const activeViewers = recipientPageTracking.filter(
  r => !r.neverOpened && !r.bounced && !r.recipientEmail?.startsWith('Anonymous')
);

// Domain grouping — identify committee viewers
const domainGroups = new Map<string, string[]>();
activeViewers.forEach(r => {
  const domain = getDomain(r.recipientEmail);
  if (!domain) return;
  const existing = domainGroups.get(domain) || [];
  if (!existing.includes(r.recipientEmail)) {
    domainGroups.set(domain, [...existing, r.recipientEmail]);
  }
});

const largestGroup = Array.from(domainGroups.values())
  .sort((a, b) => b.length - a.length)[0] || [];
const committeeViewerCount = largestGroup.length;
const hasSecondViewer = committeeViewerCount >= 2;

// Primary viewer — first person to open
const primaryViewer = recipientPageTracking
  .filter(r => r.firstOpened)
  .sort((a, b) => new Date(a.firstOpened!).getTime() - new Date(b.firstOpened!).getTime())[0];

// Per-viewer session counts from sessionDepths length
const primarySessionCount = (primaryViewer as any)?.sessionDepths?.length || 1;
const primaryReturnCount = primarySessionCount - 1;

// Deepest page for primary viewer only
const primaryDepth = primaryViewer?.pageData
  ? Math.max(...primaryViewer.pageData.filter(p => p.visited).map(p => p.page), 0)
  : 0;
const primaryDepthPercent = totalPages > 0
  ? Math.round((primaryDepth / totalPages) * 100)
  : 0;

// Quick return — primary viewer came back within 24hrs
const hasQuickReturn = primarySessionCount >= 2;

// Late page engagement — primary viewer
const latePagesThreshold = Math.floor(totalPages * 0.7);
const timeOnLatePages = (primaryViewer?.pageData || [])
  .filter(p => p.page >= latePagesThreshold && p.visited)
  .reduce((s, p) => s + (p.timeSpent || 0), 0);
const engagedWithLatePages = timeOnLatePages > 30;

// ── Build signals — specific numbers, not vague language ─────
const signals: string[] = [];

if (primaryReturnCount >= 1) {
  signals.push(
    `returned ${primaryReturnCount} time${primaryReturnCount > 1 ? 's' : ''} already`
  );
}
if (primaryDepthPercent >= 70) {
  signals.push(`read ${primaryDepthPercent}% of the document`);
}
if (hasQuickReturn) {
  signals.push('came back within 24 hours');
}
if (hasSecondViewer) {
  signals.push(
    `${committeeViewerCount} people from the same organisation have now opened it`
  );
}
if (engagedWithLatePages) {
  signals.push(
    `spent time on the later sections — ${formatTime(timeOnLatePages)} on pages ${latePagesThreshold}+`
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

 const momentumQualifier =
  currentMomentumState === 'fading'
    ? `However, more recent sessions show declining reading depth — they are not going as deep into the document as their first visit. The early signal was real but momentum has since shifted. Both patterns are visible in the data and both matter.`
    : currentMomentumState === 'stalled'
    ? `However, there has been no activity since that early engagement. The initial signal was genuine but the silence since then changes the picture.`
    : currentMomentumState === 'accelerating'
    ? `More recent sessions confirm this pattern is continuing — they are reading deeper into the document with each return. The early signal and current momentum are pointing in the same direction.`
    : `Current engagement is holding steady since that early activity.`;

const narrative = `This proposal is showing ${strengthLabel} early engagement. ${hoursNote.charAt(0).toUpperCase() + hoursNote.slice(1)} the viewer has ${signalText}. Early patterns at this level are worth noting — they often indicate the document is being taken seriously rather than filed away. ${momentumQualifier} How and whether to act on this is best judged against what you know about the relationship and where things stand.`;

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 mt-3">

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Zap className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
        Early Engagement Pattern — First 72 Hours
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