'use client'

// app/admin/DashboardPage.tsx
//
// WHAT THIS FILE DOES:
//   The real owner overview dashboard. Fetches from /api/admin/metrics
//   and renders live data — no fake numbers anywhere.
//
// HOW IT FITS INTO REACT ADMIN:
//   Registered as the <Dashboard> prop on your <Admin> component in AdminApp.tsx.
//   React Admin renders this as the default page when the admin logs in.
//
// DEPENDENCIES:
//   Uses only React + fetch. No extra packages needed.
//   Chart rendering uses a lightweight SVG sparkline — no Chart.js required.

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────
interface MetricsData {
  users: {
    total: number
    newToday: number
    newThisMonth: number
    newLastMonth: number
    trialExpiringSoon: number
    byPlan: Record<string, number>
    recent: {
      id: string
      email: string
      name: string
      avatarUrl: string | null
      plan: string
      subscriptionStatus: string
      createdAt: string
      lastLoginAt: string | null
    }[]
  }
  documents: { total: number; thisMonth: number }
  views: { total: number; thisMonth: number }
  signatures: { completed: number; thisMonth: number }
  fileRequests: { total: number }
  spaces: { total: number }
  storage: { totalBytes: number; totalGB: number }
  revenue: {
    estimatedMRR: number
    activeSubscriptions: number
    cancelledThisMonth: number
    byPlan: { starter: number; pro: number; business: number }
  }
  integrations: {
    slack: number
    hubspot: number
    googleDrive: number
    zapier: number
    gmail: number
    onedrive: number
  }
  feedback: {
    total: number
    recent: { id: string; message: string; email: string; type: string; createdAt: string }[]
  }
  support: {
    total: number
    recent: { id: string; subject: string; email: string; status: string; createdAt: string }[]
  }
  sparkline: { date: string; count: number }[]
  generatedAt: string
}

// ── Helpers ────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function planColor(plan: string): { bg: string; text: string; label: string } {
  switch (plan) {
    case 'pro':
      return { bg: '#EEF2FF', text: '#4338CA', label: 'Pro' }
    case 'business':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Business' }
    case 'starter':
      return { bg: '#DCFCE7', text: '#166534', label: 'Starter' }
    default:
      return { bg: '#F3F4F6', text: '#6B7280', label: 'Free' }
  }
}

// ── Sparkline SVG ──────────────────────────────────────────────
function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map((d) => d.count), 1)
  const width = 300
  const height = 56
  const padding = 4

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((d.count / max) * (height - padding * 2))
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = [
    `${padding},${height - padding}`,
    ...data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((d.count / max) * (height - padding * 2))
      return `${x},${y}`
    }),
    `${width - padding},${height - padding}`,
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 56 }}>
      <polygon points={areaPoints} fill="#1e293b" opacity="0.07" />
      <polyline
        points={points}
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Plan donut (pure SVG, no library) ─────────────────────────
function PlanDonut({ byPlan }: { byPlan: Record<string, number> }) {
  const colors: Record<string, string> = {
    pro: '#4338CA',
    business: '#D97706',
    starter: '#16A34A',
    free: '#9CA3AF',
    trialing: '#6366F1',
  }

  const entries = Object.entries(byPlan).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No data</div>

  const cx = 60; const cy = 60; const r = 48; const inner = 30
  let angle = -Math.PI / 2
  const slices = entries.map(([key, val]) => {
    const sweep = (val / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    angle += sweep
    const x2 = cx + r * Math.cos(angle)
    const y2 = cy + r * Math.sin(angle)
    const xi1 = cx + inner * Math.cos(angle)
    const yi1 = cy + inner * Math.sin(angle)
    const xi2 = cx + inner * Math.cos(angle - sweep)
    const yi2 = cy + inner * Math.sin(angle - sweep)
    const large = sweep > Math.PI ? 1 : 0
    return {
      key,
      val,
      color: colors[key] || '#CBD5E1',
      path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi1},${yi1} A${inner},${inner} 0 ${large},0 ${xi2},${yi2} Z`,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, flexShrink: 0 }}>
        {slices.map((s) => (
          <path key={s.key} d={s.path} fill={s.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#64748B">total</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="600" fill="#1E293B">
          {formatNumber(total)}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#475569', textTransform: 'capitalize' }}>{s.key}</span>
            <span style={{ color: '#1E293B', fontWeight: 500, marginLeft: 'auto', paddingLeft: 8 }}>
              {s.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshed, setRefreshed] = useState<string>('')

  async function fetchMetrics() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/metrics', { credentials: 'include' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setRefreshed(new Date().toLocaleTimeString())
    } catch (e: any) {
      setError(e.message || 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  // ── Styles (scoped inline to avoid collisions with React Admin's MUI) ──
  const styles = {
    root: {
      fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
      background: '#F8FAFC',
      minHeight: '100vh',
      padding: '0 0 48px',
      color: '#1E293B',
    } as React.CSSProperties,
    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 32px 16px',
      borderBottom: '1px solid #E2E8F0',
      background: '#fff',
      marginBottom: 24,
    } as React.CSSProperties,
    section: { padding: '0 32px', marginBottom: 24 } as React.CSSProperties,
    sectionLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: '#94A3B8',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.07em',
      marginBottom: 12,
    },
    grid4: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
    } as React.CSSProperties,
    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
    } as React.CSSProperties,
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
    } as React.CSSProperties,
    kpiCard: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: '16px 20px',
    } as React.CSSProperties,
    card: {
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: '20px 24px',
    } as React.CSSProperties,
    kpiLabel: { fontSize: 12, color: '#64748B', marginBottom: 6 },
    kpiValue: { fontSize: 26, fontWeight: 700, color: '#0F172A', lineHeight: 1 },
    kpiSub: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
    kpiUp: { fontSize: 11, color: '#16A34A', marginTop: 5 },
    kpiDown: { fontSize: 11, color: '#DC2626', marginTop: 5 },
    cardTitle: { fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 16 },
    badge: (plan: string) => {
      const c = planColor(plan)
      return {
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 20,
        background: c.bg,
        color: c.text,
        whiteSpace: 'nowrap' as const,
      }
    },
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 0',
      borderBottom: '1px solid #F1F5F9',
    } as React.CSSProperties,
    avatar: (seed: string) => {
      const colors = ['#4338CA', '#0F766E', '#B45309', '#BE185D', '#1D4ED8']
      const idx = seed.charCodeAt(0) % colors.length
      return {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: colors[idx] + '22',
        color: colors[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0,
      } as React.CSSProperties
    },
    intRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid #F1F5F9',
    } as React.CSSProperties,
    barWrap: {
      flex: 1,
      height: 4,
      background: '#F1F5F9',
      borderRadius: 4,
      overflow: 'hidden',
    } as React.CSSProperties,
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...styles.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8 }}>Loading metrics…</div>
          <div style={{ fontSize: 11, color: '#CBD5E1' }}>Querying your MongoDB collections</div>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{ ...styles.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 8 }}>{error || 'No data'}</div>
          <button
            onClick={fetchMetrics}
            style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Growth delta helpers ───────────────────────────────────
  const userGrowth = data.users.newLastMonth > 0
    ? Math.round(((data.users.newThisMonth - data.users.newLastMonth) / data.users.newLastMonth) * 100)
    : 0

  const intMaxVal = Math.max(
    data.integrations.slack,
    data.integrations.hubspot,
    data.integrations.googleDrive,
    data.integrations.zapier,
    data.integrations.gmail,
    data.integrations.onedrive,
    1
  )

  const integrationList = [
    { name: 'Slack', count: data.integrations.slack, color: '#4A154B' },
    { name: 'Google Drive', count: data.integrations.googleDrive, color: '#1967D2' },
    { name: 'HubSpot', count: data.integrations.hubspot, color: '#FF7A59' },
    { name: 'Zapier', count: data.integrations.zapier, color: '#FF4A00' },
    { name: 'Gmail', count: data.integrations.gmail, color: '#EA4335' },
    { name: 'OneDrive', count: data.integrations.onedrive, color: '#0078D4' },
  ].sort((a, b) => b.count - a.count)

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Owner Dashboard</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Live data · refreshed at {refreshed}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {data.users.trialExpiringSoon > 0 && (
            <div style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
              {data.users.trialExpiringSoon} trials expiring in 3 days
            </div>
          )}
          <button
            onClick={fetchMetrics}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#475569' }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Key metrics</div>
        <div style={styles.grid4}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Estimated MRR</div>
            <div style={styles.kpiValue}>${data.revenue.estimatedMRR.toLocaleString()}</div>
            <div style={styles.kpiSub}>{data.revenue.activeSubscriptions} active subscribers</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Total users</div>
            <div style={styles.kpiValue}>{formatNumber(data.users.total)}</div>
            <div style={userGrowth >= 0 ? styles.kpiUp : styles.kpiDown}>
              {userGrowth >= 0 ? '↑' : '↓'} {Math.abs(userGrowth)}% vs last month
            </div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Documents</div>
            <div style={styles.kpiValue}>{formatNumber(data.documents.total)}</div>
            <div style={styles.kpiSub}>+{data.documents.thisMonth} this month</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Cancelled this month</div>
            <div style={styles.kpiValue}>{data.revenue.cancelledThisMonth}</div>
            <div style={styles.kpiSub}>{data.users.newToday} new signups today</div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div style={styles.section}>
        <div style={styles.grid4}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Total views</div>
            <div style={styles.kpiValue}>{formatNumber(data.views.total)}</div>
            <div style={styles.kpiSub}>+{data.views.thisMonth} this month</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Signatures completed</div>
            <div style={styles.kpiValue}>{formatNumber(data.signatures.completed)}</div>
            <div style={styles.kpiSub}>+{data.signatures.thisMonth} this month</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>File requests</div>
            <div style={styles.kpiValue}>{formatNumber(data.fileRequests.total)}</div>
            <div style={styles.kpiSub}>all time</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Storage used</div>
            <div style={styles.kpiValue}>{data.storage.totalGB} GB</div>
            <div style={styles.kpiSub}>across all users</div>
          </div>
        </div>
      </div>

      {/* Sparkline + Plan breakdown + Integrations */}
      <div style={styles.section}>
        <div style={styles.grid3}>
          {/* Signups sparkline */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Signups — last 30 days</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{data.users.newThisMonth}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>this month</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>{data.users.newToday}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>today</div>
              </div>
            </div>
            <Sparkline data={data.sparkline} />
          </div>

          {/* Plan donut */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Users by plan</div>
            <PlanDonut byPlan={data.users.byPlan} />
          </div>

          {/* Revenue breakdown */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Revenue by plan</div>
            {(['starter', 'pro', 'business'] as const).map((p) => (
              <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#475569', textTransform: 'capitalize' }}>{p}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{data.revenue.byPlan[p]} users</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', minWidth: 60, textAlign: 'right' }}>
                    ${(data.revenue.byPlan[p] * ({ starter: 9, pro: 29, business: 79 }[p])).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>Est. MRR</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>${data.revenue.estimatedMRR.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent users + Integrations */}
      <div style={styles.section}>
        <div style={styles.grid2}>
          {/* Recent signups */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={styles.cardTitle}>Recent signups</div>
              <a href="/admin#/users" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none' }}>View all →</a>
            </div>
            {data.users.recent.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>No signups yet</div>
            )}
            {data.users.recent.map((u, i) => {
              const pc = planColor(u.plan)
              return (
                <div key={u.id} style={{ ...styles.userRow, borderBottom: i === data.users.recent.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={styles.avatar(u.name)}>
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                      : initials(u.name)
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <span style={styles.badge(u.plan)}>{pc.label}</span>
                  <span style={{ fontSize: 10, color: '#CBD5E1', marginLeft: 8, whiteSpace: 'nowrap' }}>{timeAgo(u.createdAt)}</span>
                </div>
              )
            })}
          </div>

          {/* Integrations */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Integration usage</div>
            {integrationList.map((int) => (
              <div key={int.name} style={styles.intRow}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', minWidth: 90 }}>{int.name}</span>
                <div style={styles.barWrap}>
                  <div style={{ height: 4, width: `${(int.count / intMaxVal) * 100}%`, background: int.color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, color: '#64748B', minWidth: 28, textAlign: 'right' }}>{int.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Spaces created</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{data.spaces.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback + Support */}
      <div style={styles.section}>
        <div style={styles.grid2}>
          {/* Feedback */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={styles.cardTitle}>Latest feedback</div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{data.feedback.total} total</span>
            </div>
            {data.feedback.recent.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>No feedback yet</div>
            )}
            {data.feedback.recent.map((f, i) => (
              <div key={f.id} style={{ padding: '8px 0', borderBottom: i === data.feedback.recent.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 12, color: '#1E293B', marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                  {f.message || '—'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{f.email} · {timeAgo(f.createdAt)}</div>
              </div>
            ))}
          </div>

          {/* Support tickets */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={styles.cardTitle}>Support tickets</div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{data.support.total} total</span>
            </div>
            {data.support.recent.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>No tickets yet</div>
            )}
            {data.support.recent.map((s, i) => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: i === data.support.recent.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {s.subject || 'No subject'}
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 20,
                    background: s.status === 'open' ? '#FEF3C7' : '#DCFCE7',
                    color: s.status === 'open' ? '#92400E' : '#166534',
                    fontWeight: 500,
                  }}>
                    {s.status || 'open'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.email} · {timeAgo(s.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}