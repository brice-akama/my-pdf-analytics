// lib/buildViewerNarrative.ts
// ── Single source of truth for "what happened" narrative text ─────
// Used by: dashboard (analytics/route.ts), session_end notifications
// (track/route.ts), and silent-deal checks (checkSilentDeals.ts).
// Pure function — no I/O, cannot throw, cannot fail silently or
// loudly because there is nothing here that can fail.

export type ReReadPage = { page: number; count: number };
export type VideoReplay = { page: number; count: number };

export function buildViewerNarrative({
  viewerLabel,
  totalPages,
  reReadPages,
  videoReplays,
}: {
  viewerLabel: string;
  totalPages: number;
  reReadPages: ReReadPage[];
  videoReplays: VideoReplay[];
}): string {
  const totalDocPages = totalPages || 1;
  const reReadPageNumbers = reReadPages.map(p => p.page);
  const allPagesReRead = reReadPageNumbers.length >= totalDocPages;
  const isSelective = reReadPageNumbers.length <= 3;

  const furthestReRead = reReadPageNumbers.length > 0
    ? Math.max(...reReadPageNumbers)
    : null;

  const pagesNotReRead = Array.from(
    { length: totalDocPages }, (_, i) => i + 1
  ).filter(p => !reReadPageNumbers.includes(p));

  const firstSkippedAfterReRead = pagesNotReRead.find(
    p => furthestReRead !== null && p > furthestReRead
  );

  const maxReReadCount = reReadPages.length > 0
    ? Math.max(...reReadPages.map(p => p.count))
    : 0;

  let narrative = '';

  if (reReadPages.length > 0) {
    if (allPagesReRead) {
      narrative =
        `${viewerLabel} has read this document ${maxReReadCount} times in full across multiple sessions. ` +
        `Reading a proposal end-to-end more than once typically indicates serious evaluation or internal preparation — ` +
        `this is a stronger signal than a single thorough read.`;
    } else if (isSelective) {
      const pageList = [...reReadPages]
        .sort((a, b) => a.page - b.page)
        .map(p => `page ${p.page}`)
        .join(' and ');
      narrative =
        `${viewerLabel} returned specifically to ${pageList} without reading the surrounding pages again. ` +
        `Returning to isolated pages rather than reading linearly almost always means those pages raised a specific question ` +
        `or contain information they needed to revisit. ` +
        `These are the pages worth addressing directly if you follow up.`;
    } else {
      const reReadRange = `pages 1–${furthestReRead}`;
      const skippedNote = firstSkippedAfterReRead
        ? ` They did not return to page ${firstSkippedAfterReRead} onward in their second session.`
        : '';
      narrative =
        `${viewerLabel} returned to ${reReadRange} in a second session but did not continue past page ${furthestReRead}.${skippedNote} ` +
        `The pages they revisited are not necessarily the problem — ` +
        `the point where they stopped is where a question or hesitation may be developing.`;
    }

    if (videoReplays.length > 0) {
      const top = videoReplays[0];
      narrative += ` They also replayed the video on page ${top.page} ${top.count} time${top.count > 1 ? 's' : ''}, which reinforces that page as an area of specific interest.`;
    }
  } else if (videoReplays.length > 0) {
    const top = videoReplays[0];
    narrative =
      `${viewerLabel} replayed the video on page ${top.page} ${top.count} time${top.count > 1 ? 's' : ''}. ` +
      `Replaying a video almost always means either the content resonated strongly or it raised a question they are trying to resolve.`;
  }

  if (!narrative) narrative = 'Engagement pattern detected across sessions.';

  return narrative;
}