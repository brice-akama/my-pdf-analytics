'use client'

// app/admin/billing/BillingPage.tsx
//
// WHAT THIS FILE DOES:
//   Platform-wide billing and revenue page for the owner dashboard.
//   All data comes from /api/admin/billing which queries your users
//   collection directly — the same fields your webhook handler writes:
//   plan, subscriptionStatus, billingCycle, currentPeriodEnd,
//   paddleCustomerId, paddleSubscriptionId, cancelAt, trialEndsAt.
//
// SECTIONS:
//   1. MRR KPIs — estimated MRR, growth, active subs, churn rate
//   2. Subscription breakdown — active / trialing / canceled / past_due
//   3. Revenue by plan — starter / pro / business with bar chart
//   4. New subscriptions sparkline (last 30 days)
//   5. Past due users — need immediate attention
//   6. Trials expiring soon (next 7 days)
//   7. Recent subscribers
//   8. Recent cancellations

import { useState, useEffect, useCallback } from 'react'

// ── Types (mirror what the API returns) ───────────────────────
interface BillingUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  plan: string
  billingCycle: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  paddleCustomerId: string | null
  updatedAt: string
  createdAt: string
}

interface BillingData {
  mrr: {
    estimated: number
    growthPercent: number
    byPlan: {
      starter:  { count: number; revenue: number }
      pro:      { count: number; revenue: number }
      business: { count: number; revenue: number }
    }
  }
  subscriptions: {
    active: number
    trialing: number
    canceled: number
    pastDue: number
    inactive: number
    newThisMonth: number
    canceledThisMonth: number
    newLastMonth: number
    canceledLastMonth: number
    churnRate: number
    monthlyBilling: number
    yearlyBilling: number
  }
  pastDueUsers: BillingUser[]
  expiringSoon: BillingUser[]
  recentSubscribers: BillingUser[]
  recentCancellations: BillingUser[]
  revenueSparkline: { date: string; count: number }[]
  generatedAt: string
}

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString() }
function fmtMoney(n: number) { return '$' + n.toLocaleString() }

function timeAgo(s: string | null) {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(s: string | null) {
  if (!s) return null
  const diff = new Date(s).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = ['#4338CA', '#0F766E', '#B45309', '#BE185D', '#1D4ED8', '#7C3AED']
function avatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

function planStyle(plan: string): { bg: string; color: string } {
  switch (plan) {
    case 'pro':      return { bg: '#EEF2FF', color: '#4338CA' }
    case 'business': return { bg: '#FEF3C7', color: '#92400E' }
    case 'starter':  return { bg: '#DCFCE7', color: '#166534' }
    default:         return { bg: '#F3F4F6', color: '#6B7280' }
  }
}

// ── Sparkline (with hover tooltip) ────────────────────────────
function Sparkline({ data, color = '#4338CA' }: {
  data: { date: string; count: number }[]
  color?: string
}) {
  const [tip, setTip] = useState<{ x: number; date: string; count: number } | null>(null)
  if (!data || data.length === 0) return (
    <div style={{ height: 64, display: 'flex', alignItems: 'center', color: '#CBD5E1', fontSize: 12 }}>No data yet</div>
  )
  const W = 500; const H = 64; const PX = 6; const PY = 8
  const max = Math.max(...data.map(d => d.count), 1)
  const pts = data.map((d, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - ((d.count / max) * (H - PY * 2)),
    date: d.date, count: d.count,
  }))
  const line = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = [`${pts[0].x},${H - PY}`, ...pts.map(p => `${p.x},${p.y}`), `${pts[pts.length-1].x},${H-PY}`].join(' ')
  const fmtD = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {tip && (
        <div style={{
          position: 'absolute', left: `${(tip.x / W) * 100}%`, top: -32,
          transform: 'translateX(-50%)', background: '#1E293B', color: '#fff',
          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
        }}>
          {fmtD(tip.date)} · {tip.count} new
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 64, display: 'block' }}
        onMouseLeave={() => setTip(null)}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mx = ((e.clientX - rect.left) / rect.width) * W
          let near = pts[0]; let md = Math.abs(pts[0].x - mx)
          for (const p of pts) { const d = Math.abs(p.x - mx); if (d < md) { md = d; near = p } }
          setTip(near)
        }}
      >
        <polygon points={area} fill={color} opacity="0.08" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3"
            fill={tip?.date === p.date ? color : 'transparent'}
            stroke={tip?.date === p.date ? color : 'transparent'} />
        ))}
        {pts.map((p, i) => (
          <rect key={`h${i}`} x={p.x - W/data.length/2} y={0}
            width={W/data.length} height={H} fill="transparent" style={{ cursor: 'crosshair' }} />
        ))}
      </svg>
    </div>
  )
}

// ── User row (shared between lists) ───────────────────────────
function UserRow({ u, extra }: { u: BillingUser; extra?: React.ReactNode }) {
  const ac = avatarColor(u.name)
  const ps = planStyle(u.plan)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
      {u.avatarUrl
        ? <img src={u.avatarUrl} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: ac + '22', color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{initials(u.name)}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
        <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: ps.bg, color: ps.color, whiteSpace: 'nowrap' }}>{u.plan}</span>
      {extra}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function BillingPage() {
  const [data, setData]       = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/billing', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || 'Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Inline styles ──────────────────────────────────────────
  const s: Record<string, React.CSSProperties> = {
    root:      { fontFamily: '"DM Sans", sans-serif', color: '#1E293B', background: '#F8FAFC', minHeight: '100vh', padding: '24px 32px' },
    header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title:     { fontSize: 18, fontWeight: 700, color: '#0F172A' },
    sub:       { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    grid4:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
    grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
    grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 },
    kpi:       { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' },
    kpiLabel:  { fontSize: 11, color: '#64748B', marginBottom: 6 },
    kpiValue:  { fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1 },
    kpiSub:    { fontSize: 11, color: '#94A3B8', marginTop: 5 },
    kpiUp:     { fontSize: 11, color: '#16A34A', marginTop: 5 },
    kpiDown:   { fontSize: 11, color: '#DC2626', marginTop: 5 },
    card:      { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' },
    cardTitle: { fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 14 },
    alertCard: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
    warnCard:  { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  }

  if (loading && !data) return (
    <div style={{ ...s.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading billing data…</div>
    </div>
  )

  if (error && !data) return (
    <div style={{ ...s.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 10 }}>{error}</div>
        <button onClick={fetchData} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  )

  const { mrr, subscriptions, pastDueUsers, expiringSoon, recentSubscribers, recentCancellations, revenueSparkline } = data!
  const totalMRR = mrr.byPlan.starter.revenue + mrr.byPlan.pro.revenue + mrr.byPlan.business.revenue
  const maxPlanRevenue = Math.max(mrr.byPlan.starter.revenue, mrr.byPlan.pro.revenue, mrr.byPlan.business.revenue, 1)

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Revenue & Billing</div>
          <div style={s.sub}>Live from your MongoDB · Paddle subscription data</div>
        </div>
        <button onClick={fetchData} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#475569' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Alerts — past due users at the top so you always see them */}
      {pastDueUsers.length > 0 && (
        <div style={s.alertCard}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> {pastDueUsers.length} user{pastDueUsers.length > 1 ? 's' : ''} with failed payments
          </div>
          {pastDueUsers.map(u => (
            <UserRow key={u.id} u={u} extra={
              <span style={{ fontSize: 11, color: '#991B1B', whiteSpace: 'nowrap' }}>
                past due · {timeAgo(u.updatedAt)}
              </span>
            } />
          ))}
        </div>
      )}

      {/* Trials expiring soon */}
      {expiringSoon.length > 0 && (
        <div style={s.warnCard}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⏳</span> {expiringSoon.length} trial{expiringSoon.length > 1 ? 's' : ''} expiring in the next 7 days
          </div>
          {expiringSoon.map(u => {
            const days = daysUntil(u.trialEndsAt)
            return (
              <UserRow key={u.id} u={u} extra={
                <span style={{ fontSize: 11, color: '#92400E', whiteSpace: 'nowrap' }}>
                  {days === 0 ? 'expires today' : days === 1 ? 'tomorrow' : `${days}d left`}
                </span>
              } />
            )
          })}
        </div>
      )}

      {/* MRR KPIs */}
      <div style={s.grid4}>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Estimated MRR</div>
          <div style={s.kpiValue}>{fmtMoney(mrr.estimated)}</div>
          <div style={mrr.growthPercent >= 0 ? s.kpiUp : s.kpiDown}>
            {mrr.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(mrr.growthPercent)}% vs last month
          </div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Active subscribers</div>
          <div style={s.kpiValue}>{fmt(subscriptions.active)}</div>
          <div style={s.kpiUp}>+{subscriptions.newThisMonth} this month</div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Churn rate</div>
          <div style={s.kpiValue}>{subscriptions.churnRate}%</div>
          <div style={subscriptions.canceledThisMonth > subscriptions.canceledLastMonth ? s.kpiDown : s.kpiUp}>
            {subscriptions.canceledThisMonth} canceled this month
          </div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Trialing</div>
          <div style={s.kpiValue}>{fmt(subscriptions.trialing)}</div>
          <div style={s.kpiSub}>{expiringSoon.length} expiring soon</div>
        </div>
      </div>

      {/* Subscription status + Billing cycle + Sparkline */}
      <div style={s.grid3}>

        {/* Status breakdown */}
        <div style={s.card}>
          <div style={s.cardTitle}>Subscription status</div>
          {[
            { label: 'Active',    count: subscriptions.active,   color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Trialing',  count: subscriptions.trialing, color: '#4338CA', bg: '#EEF2FF' },
            { label: 'Canceled',  count: subscriptions.canceled, color: '#DC2626', bg: '#FEE2E2' },
            { label: 'Past due',  count: subscriptions.pastDue,  color: '#D97706', bg: '#FEF3C7' },
            { label: 'Inactive',  count: subscriptions.inactive, color: '#6B7280', bg: '#F3F4F6' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>{row.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fmt(row.count)}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Past due (needs action)</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: subscriptions.pastDue > 0 ? '#DC2626' : '#94A3B8' }}>{subscriptions.pastDue}</span>
          </div>
        </div>

        {/* Revenue by plan */}
        <div style={s.card}>
          <div style={s.cardTitle}>Revenue by plan</div>
          {(['business', 'pro', 'starter'] as const).map(p => {
            const d = mrr.byPlan[p]
            const pct = Math.round((d.revenue / totalMRR) * 100) || 0
            const ps = planStyle(p)
            return (
              <div key={p} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: ps.bg, color: ps.color }}>{p}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{d.count} users</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{fmtMoney(d.revenue)}</span>
                </div>
                <div style={{ height: 4, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: 4, width: `${(d.revenue / maxPlanRevenue) * 100}%`, background: ps.color, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
          <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Total MRR</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{fmtMoney(totalMRR)}</span>
          </div>
        </div>

        {/* Billing cycle + sparkline */}
        <div style={s.card}>
          <div style={s.cardTitle}>New subscriptions — 30 days</div>
          <Sparkline data={revenueSparkline} color="#4338CA" />
          <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{subscriptions.monthlyBilling}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>monthly billing</div>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{subscriptions.yearlyBilling}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>yearly billing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent subscribers + Recent cancellations */}
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={s.cardTitle}>Recent subscribers</div>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>last 30 days</span>
          </div>
          {recentSubscribers.length === 0
            ? <div style={{ fontSize: 12, color: '#94A3B8' }}>No new subscribers yet</div>
            : recentSubscribers.map(u => (
                <UserRow key={u.id} u={u} extra={
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>{timeAgo(u.updatedAt)}</div>
                    {u.billingCycle && <div style={{ fontSize: 10, color: '#CBD5E1' }}>{u.billingCycle}</div>}
                  </div>
                } />
              ))
          }
        </div>

        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={s.cardTitle}>Recent cancellations</div>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>last 30 days</span>
          </div>
          {recentCancellations.length === 0
            ? <div style={{ fontSize: 12, color: '#16A34A' }}>No cancellations this month 🎉</div>
            : recentCancellations.map(u => (
                <UserRow key={u.id} u={u} extra={
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 11, color: '#DC2626', whiteSpace: 'nowrap' }}>{timeAgo(u.updatedAt)}</div>
                    {u.currentPeriodEnd && (
                      <div style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        access until {formatDate(u.currentPeriodEnd)}
                      </div>
                    )}
                  </div>
                } />
              ))
          }
        </div>
      </div>

    </div>
  )
}