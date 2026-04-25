'use client'

// app/admin/feedback/FeedbackPage.tsx

import { useState, useEffect, useCallback } from 'react'

interface FeedbackItem {
  id: string
  email: string
  feedback: string
  type: string
  status: string
  createdAt: string
}

function timeAgo(s: string) {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_LABEL: Record<string, string> = {
  general:             'General',
  integration_request: 'Integration request',
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  general:             { bg: '#EFF6FF', color: '#1D4ED8' },
  integration_request: { bg: '#FDF4FF', color: '#7E22CE' },
}

export default function FeedbackPage() {
  const [items, setItems]       = useState<FeedbackItem[]>([])
  const [total, setTotal]       = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [msg, setMsg]           = useState<string | null>(null)

  const [typeFilter,   setTypeFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit),
        ...(typeFilter   && { type:   typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/admin/feedback?${p}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setItems(json.data || [])
      setTotal(json.total || 0)
      setNewCount(json.newCount || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [typeFilter, statusFilter])

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg(status === 'read' ? 'Marked as read' : 'Marked as new')
      setTimeout(() => setMsg(null), 2500)
      await fetchData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const totalPages = Math.ceil(total / limit)

  const ROOT: React.CSSProperties = {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    background: '#F8FAFC', minHeight: '100vh',
    padding: '24px 32px', color: '#1E293B',
  }
  const CARD: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 12, padding: '20px 24px', marginBottom: 12,
  }
  const SEL: React.CSSProperties = {
    fontSize: 13, padding: '8px 12px',
    border: '1px solid #E2E8F0', borderRadius: 8,
    background: '#fff', color: '#475569',
  }
  const BTN = (variant: 'ghost' | 'primary'): React.CSSProperties => ({
    fontSize: 11, fontWeight: 600,
    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
    border: variant === 'primary' ? '1px solid #1E293B' : '1px solid #E2E8F0',
    background: variant === 'primary' ? '#1E293B' : '#fff',
    color: variant === 'primary' ? '#fff' : '#475569',
  })

  return (
    <div style={ROOT}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Feedback</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{total.toLocaleString()} total</span>
            {newCount > 0 && (
              <span style={{ background: '#EEF2FF', color: '#4338CA', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                {newCount} new
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchData} style={BTN('ghost')}>↻ Refresh</button>
      </div>

      {/* Success message */}
      {msg && (
        <div style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={SEL}>
          <option value="">All types</option>
          <option value="general">General</option>
          <option value="integration_request">Integration request</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={SEL}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8', fontSize: 13 }}>
          Loading feedback…
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>No feedback yet</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Feedback submitted by users will appear here</div>
        </div>
      )}

      {/* Feedback list */}
      {!loading && items.map(item => {
        const ts   = TYPE_STYLE[item.type] || TYPE_STYLE.general
        const isNew = item.status === 'new'

        return (
          <div key={item.id} style={{
            ...CARD,
            borderLeft: isNew ? '3px solid #4338CA' : '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>

              {/* Left — content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badges + meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ts.bg, color: ts.color }}>
                    {TYPE_LABEL[item.type] || item.type}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: isNew ? '#EEF2FF' : '#F3F4F6',
                    color:      isNew ? '#4338CA' : '#6B7280',
                  }}>
                    {isNew ? '● New' : '○ Read'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(item.createdAt)}</span>
                </div>

                {/* Email */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>
                  {item.email}
                </div>

                {/* Feedback text */}
                <div style={{
                  fontSize: 13, color: '#475569', lineHeight: 1.6,
                  background: '#F8FAFC', borderRadius: 8, padding: '10px 14px',
                }}>
                  {item.feedback}
                </div>
              </div>

              {/* Right — actions */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => updateStatus(item.id, isNew ? 'read' : 'new')}
                  style={BTN('ghost')}
                >
                  {isNew ? '○ Mark read' : '● Mark new'}
                </button>
                <a
                  href={`mailto:${item.email}?subject=Re: Your feedback`}
                  style={{ ...BTN('primary'), textDecoration: 'none', textAlign: 'center' as const }}
                >
                  ✉ Reply
                </a>
              </div>
            </div>
          </div>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ ...BTN('ghost'), opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ ...BTN('ghost'), opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}