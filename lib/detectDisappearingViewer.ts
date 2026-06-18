// lib/detectDisappearingViewer.ts
// ── Detect when a previously-active viewer has gone quiet while ───
// other viewers on the same document remain active. Single source
// of truth so DealLevelSummary.tsx (and, later, any other consumer)
// reads this the same way instead of re-implementing the comparison.
// Pure function — no I/O, cannot throw, cannot crash a route.

export type ViewerActivitySnapshot = {
  email: string;
  isFirstViewer: boolean;
  sessionCount: number;
  daysSinceLastActivity: number;
  totalTimeSeconds: number;
};

export type DisappearingViewerResult = {
  detected: boolean;
  quietViewer: ViewerActivitySnapshot | null;
  stillActiveViewers: ViewerActivitySnapshot[];
};

export function detectDisappearingViewer(
  viewers: ViewerActivitySnapshot[]
): DisappearingViewerResult {
  if (viewers.length < 2) {
    return { detected: false, quietViewer: null, stillActiveViewers: [] };
  }

  // "Still active" = engaged recently relative to the deal, not
  // an absolute number — someone active within the last 5 days
  // counts as still active for this comparison.
  const ACTIVE_THRESHOLD_DAYS = 5;
  // A viewer must have had at least 2 sessions to count as having
  // been genuinely "engaged" before going quiet — a single brief
  // open isn't someone who "disappeared," they just never engaged.
  const MIN_SESSIONS_TO_COUNT = 2;
  // The quiet gap has to clearly exceed the active threshold to
  // avoid flagging normal day-to-day gaps as a disappearance.
  const QUIET_THRESHOLD_DAYS = 7;

  const stillActiveViewers = viewers.filter(
    v => v.daysSinceLastActivity <= ACTIVE_THRESHOLD_DAYS
  );

  // Look for a previously-engaged viewer who has now gone quiet
  // while at least one other viewer remains active.
  const candidates = viewers
    .filter(v =>
      v.sessionCount >= MIN_SESSIONS_TO_COUNT &&
      v.daysSinceLastActivity >= QUIET_THRESHOLD_DAYS
    )
    .filter(v => stillActiveViewers.some(active => active.email !== v.email));

  if (candidates.length === 0 || stillActiveViewers.length === 0) {
    return { detected: false, quietViewer: null, stillActiveViewers: [] };
  }

  // If multiple viewers went quiet, report the one with the most
  // prior engagement — that's the more significant disappearance.
  const quietViewer = [...candidates].sort(
    (a, b) => b.totalTimeSeconds - a.totalTimeSeconds
  )[0];

  return {
    detected: true,
    quietViewer,
    stillActiveViewers: stillActiveViewers.filter(v => v.email !== quietViewer.email),
  };
}