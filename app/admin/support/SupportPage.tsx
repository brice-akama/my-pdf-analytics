'use client'

// app/admin/support/SupportPage.tsx

import { useState, useEffect, useCallback } from 'react'

interface SupportTicket {
  id: string
  email: string
  name: string | null
  companyName: string | null
  subject: string
  message: string
  status: string
  createdAt: string
  resolvedAt: string | null
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

function formatDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SupportPage() {
  const [items, setItems]             = useState<SupportTicket[]>([])
  const [total, setTotal]             = useState(0)
  const [openCount, setOpenCount]     = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [msg, setMsg]                 = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]               = useState(1)
  const [expanded, setExpanded]       = useState<string | null>(null)
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/admin/support?${p}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setItems(json.data || [])
      setTotal(json.total || 0)
      setOpenCount(json.openCount || 0)
      setResolvedCount(json.resolvedCount || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [statusFilter])

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg(status === 'resolved' ? 'Marked as resolved' : 'Reopened ticket')
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
  const BTN = (variant: 'ghost' | 'primary' | 'success'): React.CSSProperties => ({
    fontSize: 11, fontWeight: 600,
    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
    border: variant === 'primary' ? '1px solid #1E293B'
          : variant === 'success' ? '1px solid #16A34A'
          : '1px solid #E2E8F0',
    background: variant === 'primary' ? '#1E293B'
              : variant === 'success' ? '#16A34A'
              : '#fff',
    color: variant === 'ghost' ? '#475569' : '#fff',
  })

  const STAT = (bg: string, color: string): React.CSSProperties => ({
    background: bg, color, fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 20,
  })

  return (
    <div style={ROOT}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Support Tickets</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{total.toLocaleString()} total</span>
            {openCount > 0 && (
              <span style={STAT('#FEF3C7', '#92400E')}>{openCount} open</span>
            )}
            {resolvedCount > 0 && (
              <span style={STAT('#F0FDF4', '#166534')}>{resolvedCount} resolved</span>
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

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={SEL}>
          <option value="">All tickets</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
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
          Loading tickets…
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>No tickets found</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Support tickets submitted by users will appear here</div>
        </div>
      )}

      {/* Ticket list */}
      {!loading && items.map(item => {
        const isOpen     = item.status === 'open'
        const isExpanded = expanded === item.id

        return (
          <div key={item.id} style={{
            ...CARD,
            borderLeft: isOpen ? '3px solid #F59E0B' : '3px solid #22C55E',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>

              {/* Left — content */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Badges + meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' as const }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: isOpen ? '#FEF3C7' : '#F0FDF4',
                    color:      isOpen ? '#92400E' : '#166534',
                  }}>
                    {isOpen ? '● Open' : '✓ Resolved'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(item.createdAt)}</span>
                  {item.resolvedAt && (
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      resolved {formatDate(item.resolvedAt)}
                    </span>
                  )}
                </div>

                {/* Subject */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  {item.subject}
                </div>

                {/* Email + name */}
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
                  {item.email}
                  {item.name && <span style={{ color: '#94A3B8' }}> · {item.name}</span>}
                  {item.companyName && <span style={{ color: '#94A3B8' }}> · {item.companyName}</span>}
                </div>

                {/* Message — collapsed by default, expand on click */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  style={{
                    fontSize: 13, color: '#475569', lineHeight: 1.6,
                    background: '#F8FAFC', borderRadius: 8, padding: '10px 14px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical' as const,
                    WebkitLineClamp: isExpanded ? undefined : 2,
                    whiteSpace: isExpanded ? 'pre-wrap' : undefined,
                  }}
                >
                  {item.message}
                </div>
                {!isExpanded && item.message.length > 120 && (
                  <div
                    onClick={() => setExpanded(item.id)}
                    style={{ fontSize: 11, color: '#6366F1', marginTop: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Show more ↓
                  </div>
                )}
                {isExpanded && (
                  <div
                    onClick={() => setExpanded(null)}
                    style={{ fontSize: 11, color: '#6366F1', marginTop: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Show less ↑
                  </div>
                )}
              </div>

              {/* Right — actions */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => updateStatus(item.id, isOpen ? 'resolved' : 'open')}
                  style={BTN(isOpen ? 'success' : 'ghost')}
                >
                  {isOpen ? '✓ Resolve' : '↩ Reopen'}
                </button>
                <a
                  href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
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