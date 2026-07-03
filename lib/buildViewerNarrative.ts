// lib/buildViewerNarrative.ts
// ── Single source of truth for "what happened" narrative text ─────
// Used by: dashboard (analytics/route.ts), session_end notifications
// (track/route.ts), and silent-deal checks (checkSilentDeals.ts).
// Pure function — no I/O, cannot throw, cannot fail silently or
// loudly because there is nothing here that can fail.
//
// JOLT Effect insight applied: silence with continued document
// activity (re-reads during quiet period) is different from silence
// with zero document activity. The first suggests paralysis —
// buyer is stuck on something specific and keeps returning to it.
// The second suggests genuine disengagement. Both are honest
// observations about document behavior, not deal verdicts.

export type ReReadPage = { page: number; count: number };
export type VideoReplay = { page: number; count: number };

export function buildViewerNarrative({
  viewerLabel,
  totalPages,
  reReadPages,
  videoReplays,
  daysSilent,
  lastPageBeforeSilence,
}: {
  viewerLabel: string;
  totalPages: number;
  reReadPages: ReReadPage[];
  videoReplays: VideoReplay[];
  daysSilent?: number;
  lastPageBeforeSilence?: number | null;
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

  // ── Has the viewer gone quiet? ────────────────────────────────
  // Only meaningful when daysSilent is explicitly passed by the
  // caller — checkSilentDeals.ts and gone_silent trigger paths.
  const isQuiet = typeof daysSilent === 'number' && daysSilent >= 5;

  // ── Are they still engaging with the document during silence? ─
  // JOLT insight: silence with document activity = paralysis signal.
  // Silence with zero document activity = disengagement signal.
  // reReadPages populated during the quiet period means they are
  // returning to the document even though communication has stopped.
  const quietButStillReading = isQuiet && reReadPages.length > 0;
  const quietAndGone = isQuiet && reReadPages.length === 0 && videoReplays.length === 0;

  let narrative = '';

  // ── CASE 1: Active re-reads — the primary signal ──────────────
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

    // ── JOLT layer: silence + continued reading = paralysis signal
    // Add this note when the viewer is quiet but still returning
    // to the document — that combination specifically suggests
    // they are stuck on a decision rather than disengaged.
    if (quietButStillReading && daysSilent) {
      narrative +=
        ` Communication has been quiet for ${daysSilent} day${daysSilent > 1 ? 's' : ''}, but they are still returning to the document. ` +
        `This combination — silence in communication alongside continued document engagement — ` +
        `is more consistent with a buyer working through a decision than one who has moved on. ` +
        `The specific pages they keep returning to may indicate where the hesitation lives.`;
    }

    if (videoReplays.length > 0) {
      const top = videoReplays[0];
      narrative += ` They also replayed the video on page ${top.page} ${top.count} time${top.count > 1 ? 's' : ''}, which reinforces that page as an area of specific interest.`;
    }

  // ── CASE 2: Video replays only — no re-reads ─────────────────
  } else if (videoReplays.length > 0) {
    const top = videoReplays[0];
    narrative =
      `${viewerLabel} replayed the video on page ${top.page} ${top.count} time${top.count > 1 ? 's' : ''}. ` +
      `Replaying a video almost always means either the content resonated strongly or it raised a question they are trying to resolve.`;

  // ── CASE 3: Quiet with zero document activity ─────────────────
  // JOLT: this is the disengagement pattern, not the paralysis one.
  // No re-reads, no video replays, communication has stopped.
  // More likely genuine disengagement than a stuck buyer.
  } else if (quietAndGone && daysSilent) {
    const lastPageNote = lastPageBeforeSilence
      ? ` The last page they viewed before going quiet was page ${lastPageBeforeSilence}.`
      : '';
    narrative =
      `${viewerLabel} has not engaged with this document in ${daysSilent} day${daysSilent > 1 ? 's' : ''} and has not returned to any section during that time.${lastPageNote} ` +
      `Silence without any document activity is a different pattern from silence where the buyer is still reading — ` +
      `it is more consistent with genuine disengagement than with a buyer who is stuck on a decision. ` +
      `Document engagement alone cannot explain why, but external factors — competing priorities, budget changes, ` +
      `or internal decisions made outside this document — regularly account for this pattern.`;

  // ── CASE 4: Quiet but no specific re-read signal yet ─────────
  } else if (isQuiet && daysSilent) {
    const lastPageNote = lastPageBeforeSilence
      ? ` The last page they viewed before communication went quiet was page ${lastPageBeforeSilence}.`
      : '';
    narrative =
      `${viewerLabel} has not engaged with this document in ${daysSilent} day${daysSilent > 1 ? 's' : ''}.${lastPageNote} ` +
      `Document silence alone cannot distinguish between a buyer who has moved on and one who is working through ` +
      `a decision internally. If they return to specific pages during this quiet period, that would suggest ` +
      `the latter — watching whether any document activity resumes will sharpen the picture.`;
  }

  if (!narrative) narrative = 'Engagement pattern detected across sessions.';

  return narrative;
}