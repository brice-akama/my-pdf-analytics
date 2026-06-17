// lib/shouldFireSpaceIntelligence.ts
// ── Decide if a space visitor's intelligence is worth firing ──────
// Mirrors shouldFireBehavioral() in checkSilentDeals.ts — only fires
// when something MEANINGFULLY CHANGED, not on every open. Compares
// against the last-known state stored on viewer_identities-style
// records so the same visitor opening again doesn't re-fire.

import { SpaceVisitorIntelligence } from './buildSpaceVisitorIntelligence';

export function shouldFireSpaceIntelligence({
  current,
  previous,
}: {
  current: SpaceVisitorIntelligence;
  previous: {
    hasInternalSharing?: boolean;
    hasLinkOnlySharing?: boolean;
    momentumState?: string;
    returnWithQuestion?: boolean;
  } | null;
}): boolean {
  // First time we've ever seen this visitor — nothing to compare
  // against, so never fire on a brand new single visitor. The
  // generic "document opened" notification already covers this.
  if (!previous) return false;

  // Committee just formed — domain-confirmed OR link-only
  const committeeJustFormed =
    (current.hasInternalSharing && !previous.hasInternalSharing) ||
    (current.hasLinkOnlySharing && !previous.hasLinkOnlySharing);
  if (committeeJustFormed) return true;

  // Momentum just became accelerating
  const justAccelerated =
    current.momentumState === 'accelerating' &&
    previous.momentumState !== 'accelerating';
  if (justAccelerated) return true;

  // Silence-then-question just fired
  const justReturnedWithQuestion =
    current.returnWithQuestion && !previous.returnWithQuestion;
  if (justReturnedWithQuestion) return true;

  return false;
}