// lib/detectSignalAgreement.ts
// ── Robin Callender's "stakeholder triangulation" idea, applied ───
// to deal signals instead of stakeholders: confidence shouldn't come
// from any single signal alone, it should come from whether multiple
// independently-computed signals agree. When they agree, say so and
// raise confidence. When they disagree, say so and lower it — don't
// silently average them or let one branch's confidence stand alone.
// Pure function — no I/O, cannot throw, cannot crash a route.
// Works identically for domain_confirmed and link_only committees,
// since the comparison is about momentum direction, not domain trust.

export type DealStatus = 'hot' | 'warm' | 'cold' | 'dead';
export type MomentumState = 'accelerating' | 'holding' | 'fading' | 'stalled';

export type SignalAgreementResult = {
  agreement: 'aligned' | 'conflicting' | 'insufficient_data';
  note: string;
};

// Only 'hot' + 'accelerating' counts as genuinely strong for this
// comparison. 'warm' is explicitly "engaged but not yet at evaluation
// depth" per DealLevelSummary's own evidence language — including it
// here let the headline sentence overstate what the evidence showed.
const POSITIVE_DEAL_STATUS: DealStatus[] = ['hot'];
const POSITIVE_MOMENTUM: MomentumState[] = ['accelerating'];

export function detectSignalAgreement({
  strongestIndividualViewer,
  committeeGrowing,
  hasHighQualitySecondaryViewer,
  hasMediumQualitySecondaryViewer,
}: {
  strongestIndividualViewer: {
    email: string;
    dealStatus: DealStatus;
    momentumState: MomentumState;
  } | null;
  committeeGrowing: boolean;
  hasHighQualitySecondaryViewer: boolean;
  hasMediumQualitySecondaryViewer: boolean;
}): SignalAgreementResult {

  // Need both an individual read AND a committee read to compare —
  // if there's only one viewer, there's nothing to triangulate yet.
  if (!strongestIndividualViewer || !committeeGrowing) {
    return { agreement: 'insufficient_data', note: '' };
  }

  const individualIsStrong =
    POSITIVE_DEAL_STATUS.includes(strongestIndividualViewer.dealStatus) &&
    POSITIVE_MOMENTUM.includes(strongestIndividualViewer.momentumState);

  const groupIsStrong = hasHighQualitySecondaryViewer;
  const groupIsWeak = !hasHighQualitySecondaryViewer && !hasMediumQualitySecondaryViewer;

  // ── Both strong: signals agree, confidence should rise ──────────
  if (individualIsStrong && groupIsStrong) {
    return {
      agreement: 'aligned',
      note: ` Both ${strongestIndividualViewer.email}'s individual engagement and the broader group signal point the same direction — this convergence is a stronger basis for confidence than either signal alone.`,
    };
  }

  // ── Strong individual, weak group: signals conflict ──────────────
  if (individualIsStrong && groupIsWeak) {
    return {
      agreement: 'conflicting',
      note: ` Worth noting: ${strongestIndividualViewer.email}'s individual engagement is strong, but that strength hasn't translated into broader interest from the other viewers, who opened briefly and have not returned. These two signals point in different directions — a single highly engaged person and a group that isn't yet expanding are not the same thing as broad internal momentum.`,
    };
  }

  // ── Weak individual, strong group: also worth flagging ───────────
  if (!individualIsStrong && groupIsStrong) {
    return {
      agreement: 'conflicting',
      note: ` Worth noting: while ${strongestIndividualViewer.email}'s own engagement has cooled, at least one other viewer is now reading deeply. The strongest signal right now is coming from someone other than the original viewer — that shift in who is driving the evaluation is itself worth tracking`,
    };
  }

  // Both weak, or mixed-but-not-clearly-conflicting — not enough
  // of a clear pattern either way to claim agreement or conflict.
  return { agreement: 'insufficient_data', note: '' };
}