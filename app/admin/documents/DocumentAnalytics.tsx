'use client'

// app/admin/documents/DocumentAnalytics.tsx
//
// WHAT THIS FILE DOES:
//   Platform-wide document analytics page for the owner dashboard.
//   Shows total uploads, views, top documents, top uploaders, file type
//   breakdown, signature stats, and a browsable document list.
//
// DATA SOURCE:
//   /api/admin/documents — queries documents, viewer_identities,
//   signature_requests directly from MongoDB.

import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  stats: {
    totalDocuments: number
    totalDocumentsThisMonth: number
    totalDocumentsThisWeek: number
    totalArchivedDocuments: number
    totalViews: number
    totalViewsThisMonth: number
    totalSignaturesCompleted: number
    totalSignaturesPending: number
    avgViewsPerDocument: number
  }
  sparklines: {
    uploads: { date: string; count: number }[]
    views: { date: string; count: number }[]
  }
  fileTypes: { type: string; count: number }[]
  topDocuments: {
    id: string
    name: string
    views: number
    downloads: number
    userId: string
    createdAt: string
    sizeKB: number
  }[]
  topUploaders: {
    userId: string
    email: string
    name: string
    avatarUrl: string | null
    documentCount: number
    totalViews: number
  }[]
  documents: {
    data: {
      id: string
      name: string
      userId: string
      sizeKB: number
      views: number
      downloads: number
      mimeType: string | null
      createdAt: string
    }[]
    total: number
    page: number
    totalPages: number
  }
}

// ── Inline SVG sparkline ───────────────────────────────────────
function MiniSparkline({ data, color = '#4338CA', label = 'count' }: {
  data: { date: string; count: number }[]
  color?: string
  label?: string
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null)

  if (!data || data.length === 0) return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: 12 }}>
      No data yet
    </div>
  )

  const W = 600; const H = 80; const PX = 8; const PY = 12
  const max = Math.max(...data.map(d => d.count), 1)

  const points = data.map((d, i) => ({
    x: PX + (i / (data.length - 1)) * (W - PX * 2),
    y: H - PY - ((d.count / max) * (H - PY * 2)),
    date: d.date,
    count: d.count,
  }))

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ')

  const areaStr = [
    `${points[0].x},${H - PY}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${H - PY}`,
  ].join(' ')

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${(tooltip.x / W) * 100}%`,
          top: -36,
          transform: 'translateX(-50%)',
          background: '#1E293B',
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {fmtDate(tooltip.date)} · {tooltip.count} {label}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 80, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mouseX = ((e.clientX - rect.left) / rect.width) * W
          let nearest = points[0]
          let minDist = Math.abs(points[0].x - mouseX)
          for (const p of points) {
            const dist = Math.abs(p.x - mouseX)
            if (dist < minDist) { minDist = dist; nearest = p }
          }
          setTooltip(nearest)
        }}
      >
        {[0, 0.5, 1].map((frac, i) => {
          const y = PY + frac * (H - PY * 2)
          return <line key={i} x1={PX} y1={y} x2={W - PX} y2={y} stroke="#F1F5F9" strokeWidth="1" />
        })}
        <polygon points={areaStr} fill={color} opacity="0.08" />
        <polyline points={polylineStr} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3"
            fill={tooltip?.date === p.date ? color : 'transparent'}
            stroke={tooltip?.date === p.date ? color : 'transparent'} />
        ))}
        {points.map((p, i) => (
          <rect key={`h${i}`} x={p.x - (W / data.length / 2)} y={0}
            width={W / data.length} height={H} fill="transparent" style={{ cursor: 'crosshair' }} />
        ))}
        {points.filter((_, i) => i % 7 === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={H} textAnchor="middle" fontSize="9" fill="#CBD5E1">
            {fmtDate(p.date)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = ['#4338CA', '#0F766E', '#B45309', '#BE185D', '#1D4ED8']
function avatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length]
}

export default function DocumentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('createdAt')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort,
        order: 'desc',
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/documents?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [page, search, sort])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [search, sort])

  const s: Record<string, React.CSSProperties> = {
    root: { fontFamily: '"DM Sans", sans-serif', color: '#1E293B', background: '#F8FAFC', minHeight: '100vh', padding: '24px 32px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    title: { fontSize: 18, fontWeight: 700, color: '#0F172A' },
    subtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 },
    kpi: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px' },
    kpiLabel: { fontSize: 11, color: '#64748B', marginBottom: 6 },
    kpiValue: { fontSize: 24, fontWeight: 700, color: '#0F172A', lineHeight: 1 },
    kpiSub: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 },
    card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' },
    cardTitle: { fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 14 },
    th: { fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '10px 14px', textAlign: 'left' as const, background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
    td: { fontSize: 12, padding: '10px 14px', borderBottom: '1px solid #F1F5F9', color: '#475569' },
    input: { fontSize: 13, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', outline: 'none', color: '#1E293B', minWidth: 220 },
    select: { fontSize: 13, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#475569' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
    barWrap: { flex: 1, height: 4, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', margin: '0 12px' },
  }

  if (loading && !data) return (
    <div style={{ ...s.root, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading document analytics…</div>
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

  const st = data?.stats

  const maxFileType = Math.max(...(data?.fileTypes.map(f => f.count) || [1]))
  const maxUploaderDocs = Math.max(...(data?.topUploaders.map(u => u.documentCount) || [1]))

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Document Analytics</div>
          <div style={s.subtitle}>Platform-wide · real data from your MongoDB</div>
        </div>
        <button onClick={fetchData} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#475569' }}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={s.kpiGrid}>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Total documents</div>
          <div style={s.kpiValue}>{(st?.totalDocuments || 0).toLocaleString()}</div>
          <div style={s.kpiSub}>+{st?.totalDocumentsThisMonth || 0} this month</div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Total views</div>
          <div style={s.kpiValue}>{(st?.totalViews || 0).toLocaleString()}</div>
          <div style={s.kpiSub}>+{st?.totalViewsThisMonth || 0} this month</div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Signatures completed</div>
          <div style={s.kpiValue}>{(st?.totalSignaturesCompleted || 0).toLocaleString()}</div>
          <div style={s.kpiSub}>{st?.totalSignaturesPending || 0} pending</div>
        </div>
        <div style={s.kpi}>
          <div style={s.kpiLabel}>Avg views / doc</div>
          <div style={s.kpiValue}>{st?.avgViewsPerDocument || 0}</div>
          <div style={s.kpiSub}>{st?.totalDocumentsThisWeek || 0} uploads this week</div>
        </div>
      </div>

      {/* Sparklines */}
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardTitle}>Uploads — last 30 days</div>
          <MiniSparkline data={data?.sparklines.uploads || []} color="#4338CA" label="uploads" />
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{st?.totalDocumentsThisMonth}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>this month</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{st?.totalDocumentsThisWeek}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>this week</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{st?.totalArchivedDocuments}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>archived</div></div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Views — last 30 days</div>
          <MiniSparkline data={data?.sparklines.views || []} color="#0F766E" label="views" />
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{st?.totalViewsThisMonth}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>this month</div></div>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{st?.avgViewsPerDocument}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>avg per doc</div></div>
          </div>
        </div>
      </div>

      {/* Top docs + file types + top uploaders */}
      <div style={s.grid3}>
        {/* Top documents by views */}
        <div style={s.card}>
          <div style={s.cardTitle}>Most viewed documents</div>
          {(data?.topDocuments || []).slice(0, 8).map((doc, i) => (
            <div key={doc.id} style={s.row}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, color: '#CBD5E1', minWidth: 14 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginLeft: 8, whiteSpace: 'nowrap' }}>{doc.views} views</span>
            </div>
          ))}
          {(data?.topDocuments || []).length === 0 && <div style={{ fontSize: 12, color: '#94A3B8' }}>No documents yet</div>}
        </div>

        {/* File types */}
        <div style={s.card}>
          <div style={s.cardTitle}>File types</div>
          {(data?.fileTypes || []).map(ft => (
            <div key={ft.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 11, color: '#475569', minWidth: 80, textTransform: 'uppercase', fontFamily: 'monospace' }}>{(ft.type || 'unknown').replace('application/', '').replace('image/', '').slice(0, 12)}</span>
              <div style={s.barWrap}>
                <div style={{ height: 4, width: `${(ft.count / maxFileType) * 100}%`, background: '#4338CA', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: '#64748B', minWidth: 24, textAlign: 'right' as const }}>{ft.count}</span>
            </div>
          ))}
          {(data?.fileTypes || []).length === 0 && <div style={{ fontSize: 12, color: '#94A3B8' }}>No data</div>}
        </div>

        {/* Top uploaders */}
        <div style={s.card}>
          <div style={s.cardTitle}>Top uploaders</div>
          {(data?.topUploaders || []).map((u, i) => {
            const ac = avatarColor(u.name)
            return (
              <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 10, color: '#CBD5E1', minWidth: 14 }}>{i + 1}</span>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  : <div style={{ width: 26, height: 26, borderRadius: '50%', background: ac + '22', color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>{initials(u.name)}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{u.documentCount} docs · {u.totalViews} views</div>
                </div>
              </div>
            )
          })}
          {(data?.topUploaders || []).length === 0 && <div style={{ fontSize: 12, color: '#94A3B8' }}>No data</div>}
        </div>
      </div>

      {/* All documents list */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={s.cardTitle}>All documents — {(data?.documents.total || 0).toLocaleString()} total</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={s.input}
              placeholder="Search by filename…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select style={s.select} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="createdAt">Newest first</option>
              <option value="tracking.views">Most viewed</option>
              <option value="tracking.downloads">Most downloaded</option>
              <option value="size">Largest</option>
            </select>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={s.th}>Filename</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Size</th>
              <th style={s.th}>Views</th>
              <th style={s.th}>Downloads</th>
              <th style={s.th}>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: 24, color: '#94A3B8' }}>Loading…</td></tr>
            )}
            {!loading && (data?.documents.data || []).length === 0 && (
              <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: 24, color: '#94A3B8' }}>No documents found</td></tr>
            )}
            {!loading && (data?.documents.data || []).map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ ...s.td, fontWeight: 500, color: '#1E293B', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</td>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>{(doc.mimeType || 'unknown').replace('application/', '').replace('image/', '').slice(0, 10)}</td>
                <td style={s.td}>{doc.sizeKB} KB</td>
                <td style={{ ...s.td, fontWeight: doc.views > 0 ? 600 : 400, color: doc.views > 0 ? '#4338CA' : '#CBD5E1' }}>{doc.views}</td>
                <td style={s.td}>{doc.downloads}</td>
                <td style={s.td}>{timeAgo(doc.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {(data?.documents.totalPages || 0) > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Page {page} of {data?.documents.totalPages}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#CBD5E1' : '#475569' }}>← Prev</button>
              <button disabled={page === data?.documents.totalPages} onClick={() => setPage(p => p + 1)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page === data?.documents.totalPages ? 'not-allowed' : 'pointer', color: page === data?.documents.totalPages ? '#CBD5E1' : '#475569' }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}