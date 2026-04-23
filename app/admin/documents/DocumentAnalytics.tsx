'use client'

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
  topDocuments: any[]
  topUploaders: any[]
  documents: {
    data: any[]
    total: number
    page: number
    totalPages: number
  }
}

function MiniSparkline({ data, color = '#1e293b' }: { data: { date: string; count: number }[]; color?: string }) {
  if (!data.length) return null

  const max = Math.max(...data.map(d => d.count), 1)

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 200
    const y = 40 - (d.count / max) * 40
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function DocumentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/documents')
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const s: Record<string, React.CSSProperties> = {
    root: { padding: 24, background: '#F8FAFC' },
    card: { background: '#fff', padding: 20, borderRadius: 12, marginBottom: 16 },
    title: { fontSize: 18, fontWeight: 700 },
    row: { display: 'flex', justifyContent: 'space-between', padding: '6px 0' },

    fileTypeText: {
      fontSize: 11, // ✅ FIXED (only once)
      color: '#475569',
      minWidth: 80,
      textTransform: 'uppercase',
      fontFamily: 'monospace'
    }
  }

  if (loading) return <div style={s.root}>Loading...</div>
  if (error) return <div style={s.root}>{error}</div>

  return (
    <div style={s.root}>
      <div style={s.title}>Document Analytics</div>

      <div style={s.card}>
        <h3>Total Documents: {data?.stats.totalDocuments}</h3>
        <h3>Total Views: {data?.stats.totalViews}</h3>
      </div>

      <div style={s.card}>
        <h3>File Types</h3>
        {data?.fileTypes.map(ft => (
          <div key={ft.type} style={s.row}>
            <span style={s.fileTypeText}>{ft.type}</span>
            <span>{ft.count}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <h3>Uploads</h3>
        <MiniSparkline data={data?.sparklines.uploads || []} />
      </div>
    </div>
  )
}