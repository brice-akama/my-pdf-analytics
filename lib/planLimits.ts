// lib/planLimits.ts
//
// THE SINGLE SOURCE OF TRUTH FOR ALL PLAN LIMITS IN DOCMETRICS.
//
// Why this file exists:
//   Before this, plan limits were scattered — some hardcoded inside /api/auth/me,
//   some checked inline in upload routes, all using old plan names like "premium".
//   That meant changing a limit required hunting through multiple files.
//   Now every route, every middleware, every check imports from here. One change
//   here cascades everywhere automatically.
//
// How to use it:
//   import { PLAN_LIMITS, getPlanLimits, hasFeature } from '@/lib/planLimits'
//
// How to change a limit:
//   Edit the number below and deploy. That is all.
//
// Storage values are always in BYTES internally. We never store "1 GB" as a string
// anywhere in the backend — only bytes. The frontend formats them for display.
// Doing math on strings causes bugs. Doing math on numbers does not.
//
// Why these specific free/starter limits:
//   Free    = 200 MB  (209_715_200 bytes)  — enough to try the product, not enough to abuse it
//   Starter = 5 GB    (5_368_709_120 bytes) — meaningful for a solo user, not a warehouse
//   Pro     = 50 GB   — team-level usage
//   Business = 100 GB — enterprise-level usage
//
// Why analyticsLevel is a string and not a boolean:
//   Analytics is not on/off — it is tiered across plans. A boolean hasAnalytics
//   would not capture the difference between "basic" (free), "full" (starter/pro),
//   and "advanced" (business, which adds compliance reports on top of full).
//   Using a string level lets the frontend and API routes switch on the exact
//   tier without needing multiple overlapping boolean flags.
//
//   'basic'    — view counts, link activity. Free plan.
//   'full'     — full document analytics, per-viewer breakdown, time on page.
//                Starter and Pro.
//   'advanced' — everything in full plus compliance reports, export, audit trail.
//                Business only.

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// Every plan we sell. "free" is the default for all new and downgraded accounts.
export type PlanName = 'free' | 'starter' | 'pro' | 'business'

// The three analytics tiers. Used by the frontend to gate analytics views
// and by analytics API routes to decide how much data to return.
export type AnalyticsLevel = 'basic' | 'full' | 'advanced'

// The shape of limits for a single plan.
// -1 on a numeric field means "unlimited" — check with === -1 before comparing.
export interface PlanLimit {
  // ── Storage ─────────────────────────────────────────────────────────────
  storageLimitBytes: number        // total storage the user can accumulate
  maxFileSizeBytes: number         // single file upload ceiling

  // ── Document counts ──────────────────────────────────────────────────────
  maxDocuments: number             // -1 = unlimited

  // ── Share links ──────────────────────────────────────────────────────────
  maxShareLinks: number            // -1 = unlimited

  // ── Spaces (data rooms / folders) ────────────────────────────────────────
  maxSpaces: number                // -1 = unlimited

  // ── eSignatures per calendar month ───────────────────────────────────────
  maxESignaturesPerMonth: number   // -1 = unlimited

  // ── Team seats (owner counts as 1) ───────────────────────────────────────
  maxTeamMembers: number

  // ── Feature flags ────────────────────────────────────────────────────────
  // Boolean flags gate entire features on/off.
  // analyticsLevel is a string tier — see AnalyticsLevel type above.
  // Never add a boolean for something that has graduated tiers — use a string.
  features: {
    // ── Analytics tier (string, not boolean — see file header) ───────────
    analyticsLevel: AnalyticsLevel

    // ── Document features ────────────────────────────────────────────────
    videoWalkthroughs: boolean      // record + embed video on a doc
    customBranding: boolean         // remove DocMetrics branding, add own logo
    versionHistory: boolean         // restore previous versions of a document

    // ── Sending features ─────────────────────────────────────────────────
    bulkSend: boolean               // send one doc to many recipients at once
    ndaAndAgreements: boolean       // attach NDA to a share link before viewing

    // ── Security features ────────────────────────────────────────────────
    dynamicWatermarking: boolean    // stamp viewer email/IP on every page
    emailOtpVerification: boolean   // require OTP code before viewing a link

    // ── Compliance & reporting ───────────────────────────────────────────
    complianceReports: boolean      // downloadable compliance and activity reports
    fullAuditLogs: boolean          // full immutable audit trail — business only
    folderLevelPermissions: boolean // per-folder access control — business only

    // ── Integrations ─────────────────────────────────────────────────────
    googleDriveIntegration: boolean
    oneDriveIntegration: boolean

    // Communication & automation integrations
    slackIntegration: boolean       // Pro+ only — team notification workflow
    hubspotIntegration: boolean     // Pro+ only — CRM sales workflow
    zapierIntegration: boolean      // Starter+ — automation power feature

    // ── Team & admin ─────────────────────────────────────────────────────
    advancedDataRooms: boolean      // investor/M&A grade data rooms — business only
    advancedTeamManagement: boolean // roles, permissions, SSO prep — business only
    customDocsDomain: boolean       // serve docs from docs.yourcompany.com
    prioritySupport: boolean        // dedicated support queue
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE LIMITS TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanName, PlanLimit> = {

  // ── FREE ──────────────────────────────────────────────────────────────────
  // Deliberately restricted so the product is useful enough to try but limited
  // enough that anyone doing real work will need to upgrade.
  // After a 14-day Pro trial expires without payment, the user lands here.
  free: {
    storageLimitBytes:      209_715_200,  // 200 MB
    maxFileSizeBytes:        10_485_760,  // 10 MB per file

    maxDocuments:                     5,
    maxShareLinks:                    3,
    maxSpaces:                        1,
    maxESignaturesPerMonth:           2,
    maxTeamMembers:                   1,  // solo only — no invites on free

    features: {
      analyticsLevel:            'basic',

      videoWalkthroughs:          false,
      customBranding:             false,
      versionHistory:             false,

      bulkSend:                   false,
      ndaAndAgreements:           false,

      dynamicWatermarking:        false,
      emailOtpVerification:       false,

      complianceReports:          false,
      fullAuditLogs:              false,
      folderLevelPermissions:     false,

      googleDriveIntegration:     false,
      oneDriveIntegration:        false,

      slackIntegration:           false,  // team feature — no value solo
      hubspotIntegration:         false,  // sales feature — no scale at free
      zapierIntegration:          false,  // upgrade incentive to Starter

      advancedDataRooms:          false,
      advancedTeamManagement:     false,
      customDocsDomain:           false,
      prioritySupport:            false,
    },
  },

  // ── STARTER ($19/month) ───────────────────────────────────────────────────
  // For freelancers and solo professionals doing real client work.
  // More room than free but still capped to push heavier users toward Pro.
  // No team seats — teams are a Pro feature.
  // No integrations — Google Drive / OneDrive are Pro features.
  starter: {
    storageLimitBytes:    5_368_709_120,  // 5 GB
    maxFileSizeBytes:       104_857_600,  // 100 MB per file

    maxDocuments:                    -1,  // unlimited
    maxShareLinks:                   -1,  // unlimited
    maxSpaces:                        3,
    maxESignaturesPerMonth:          10,
    maxTeamMembers:                   1,  // still solo — team is a Pro feature

    features: {
      analyticsLevel:             'full',

      videoWalkthroughs:           true,
      customBranding:              true,
      versionHistory:             false,  // version history is Pro+

      bulkSend:                   false,
      ndaAndAgreements:           false,

      dynamicWatermarking:        false,
      emailOtpVerification:       false,

      complianceReports:          false,
      fullAuditLogs:              false,
      folderLevelPermissions:     false,

      googleDriveIntegration:     false,
      oneDriveIntegration:        false,

      slackIntegration:           false,  // team feature — no value solo
      hubspotIntegration:         false,  // sales feature — no scale at free
      zapierIntegration:          true,  // upgrade incentive to Starter

      advancedDataRooms:          false,
      advancedTeamManagement:     false,
      customDocsDomain:           false,
      prioritySupport:            false,
    },
  },

  // ── PRO ($49/month) ───────────────────────────────────────────────────────
  // The main revenue plan. Teams, integrations, compliance, watermarking.
  // This is what most paying customers will be on.
  // Trial users experience this plan during their 14-day trial period.
  pro: {
    storageLimitBytes:   53_687_091_200,  // 50 GB
    maxFileSizeBytes:       524_288_000,  // 500 MB per file

    maxDocuments:                    -1,
    maxShareLinks:                   -1,
    maxSpaces:                       -1,
    maxESignaturesPerMonth:          -1,
    maxTeamMembers:                   3,  // owner + 2 additional seats

    features: {
      analyticsLevel:             'full',

      videoWalkthroughs:           true,
      customBranding:              true,
      versionHistory:              true,

      bulkSend:                    true,
      ndaAndAgreements:            true,

      dynamicWatermarking:         true,
      emailOtpVerification:        true,

      complianceReports:           true,
      fullAuditLogs:              false,  // business-only
      folderLevelPermissions:     false,  // business-only

      googleDriveIntegration:      true,
      oneDriveIntegration:         true,

      slackIntegration:           true,  // team feature — no value solo
      hubspotIntegration:         true,  // sales feature — no scale at free
      zapierIntegration:          true,  // upgrade incentive to Starter

      advancedDataRooms:          false,  // business-only
      advancedTeamManagement:     false,  // business-only
      customDocsDomain:           false,  // business-only
      prioritySupport:            false,
    },
  },

  // ── BUSINESS ($99/month) ──────────────────────────────────────────────────
  // Everything unlocked. Larger teams, advanced data rooms, full audit logs,
  // folder permissions, custom domain, priority support.
  // analyticsLevel is 'advanced' — adds compliance export and full audit trail
  // on top of everything 'full' already includes.
  business: {
    storageLimitBytes:  107_374_182_400,  // 100 GB
    maxFileSizeBytes:     2_147_483_648,  // 2 GB per file

    maxDocuments:                    -1,
    maxShareLinks:                   -1,
    maxSpaces:                       -1,
    maxESignaturesPerMonth:          -1,
    maxTeamMembers:                  10,  // owner + 9 seats

    features: {
      analyticsLevel:          'advanced',

      videoWalkthroughs:           true,
      customBranding:              true,
      versionHistory:              true,

      bulkSend:                    true,
      ndaAndAgreements:            true,

      dynamicWatermarking:         true,
      emailOtpVerification:        true,

      complianceReports:           true,
      fullAuditLogs:               true,
      folderLevelPermissions:      true,

      googleDriveIntegration:      true,
      oneDriveIntegration:         true,

      slackIntegration:           true,  // team feature — no value solo
      hubspotIntegration:         true,  // sales feature — no scale at free
      zapierIntegration:          true,  // upgrade incentive to Starter

      advancedDataRooms:           true,
      advancedTeamManagement:      true,
      customDocsDomain:            true,
      prioritySupport:             true,
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getPlanLimits
 *
 * Safe getter — always returns a valid PlanLimit even if an unknown plan name
 * somehow ends up in the database. Falls back to free so the user never gets
 * more than they paid for.
 *
 * Usage:
 *   const limits = getPlanLimits(user.plan)
 *   if (user.totalStorageUsedBytes >= limits.storageLimitBytes) { ... }
 */
export function getPlanLimits(plan: string): PlanLimit {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.free
}

/**
 * hasFeature
 *
 * Check if a plan includes a specific boolean feature.
 * Do NOT pass 'analyticsLevel' here — it is not a boolean.
 * Use getAnalyticsLevel() for analytics checks instead.
 *
 * Usage:
 *   if (!hasFeature(user.plan, 'bulkSend')) {
 *     return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 })
 *   }
 */
export function hasFeature(
  plan: string,
  // analyticsLevel is excluded from this function's type on purpose —
  // it is a string tier, not a boolean. Passing it here is a compile error.
  feature: keyof Omit<PlanLimit['features'], 'analyticsLevel'>
): boolean {
  return getPlanLimits(plan).features[feature]
}

/**
 * getAnalyticsLevel
 *
 * Returns the analytics tier for a given plan: 'basic' | 'full' | 'advanced'.
 * Use this in analytics API routes to decide how much data to return,
 * and in the frontend to show or hide analytics sections.
 *
 * Usage:
 *   const level = getAnalyticsLevel(user.plan)
 *   if (level === 'basic')    { // return view counts only }
 *   if (level === 'full')     { // return per-viewer breakdown }
 *   if (level === 'advanced') { // return full + compliance export }
 */
export function getAnalyticsLevel(plan: string): AnalyticsLevel {
  return getPlanLimits(plan).features.analyticsLevel
}

/**
 * isStorageAvailable
 *
 * Returns true if the user has enough remaining storage to upload a file
 * of the given size. Call this before streaming anything to Cloudinary or R2.
 *
 * Usage:
 *   if (!isStorageAvailable(user.plan, user.totalStorageUsedBytes, file.size)) {
 *     return NextResponse.json({ error: 'STORAGE_LIMIT_REACHED' }, { status: 403 })
 *   }
 */
export function isStorageAvailable(
  plan: string,
  usedBytes: number,
  incomingFileBytes: number
): boolean {
  const limits = getPlanLimits(plan)
  return (usedBytes + incomingFileBytes) <= limits.storageLimitBytes
}

/**
 * isFileSizeAllowed
 *
 * Returns true if a single file is within the plan's per-file size ceiling.
 * This is a separate check from total storage — a Pro user cannot upload a
 * 1 GB file even if they have 40 GB free, because their per-file cap is 500 MB.
 *
 * Usage:
 *   if (!isFileSizeAllowed(user.plan, file.size)) {
 *     return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 413 })
 *   }
 */
export function isFileSizeAllowed(plan: string, fileSizeBytes: number): boolean {
  return fileSizeBytes <= getPlanLimits(plan).maxFileSizeBytes
}

/**
 * getStoragePercentage
 *
 * Returns 0–100 representing how full the user's storage is.
 * Capped at 100 so the progress bar never overflows.
 *
 * Thresholds for the frontend storage bar:
 *   pct >= 95 → red — block uploads, show upgrade prompt
 *   pct >= 80 → yellow — show warning nudge
 *   pct  < 80 → green — all good
 *
 * Usage:
 *   const pct = getStoragePercentage(user.plan, user.totalStorageUsedBytes)
 */
export function getStoragePercentage(plan: string, usedBytes: number): number {
  const { storageLimitBytes } = getPlanLimits(plan)
  return Math.min(100, Math.round((usedBytes / storageLimitBytes) * 100))
}

/**
 * canInviteMoreMembers
 *
 * Returns true if the organization has not yet hit its seat limit.
 * currentMemberCount should include the owner — owner takes up one seat.
 * Call this before processing any team invite in /api/team/invite.
 *
 * Usage:
 *   const count = await db.collection('organization_members')
 *     .countDocuments({ organizationId, status: 'active' })
 *   if (!canInviteMoreMembers(user.plan, count)) {
 *     return NextResponse.json({ error: 'TEAM_LIMIT_REACHED' }, { status: 403 })
 *   }
 */
export function canInviteMoreMembers(
  plan: string,
  currentMemberCount: number
): boolean {
  const { maxTeamMembers } = getPlanLimits(plan)
  return currentMemberCount < maxTeamMembers
}