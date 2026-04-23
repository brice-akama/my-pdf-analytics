'use client'

// app/admin/users/UserList.tsx

import { useState, useEffect, useCallback } from 'react'

interface UserListProps {
  onSelectUser?: (id: string) => void
}

interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  companyName: string | null
  plan: string
  subscriptionStatus: string
  documentCount: number
  totalStorageGB: number
  createdAt: string
  lastLoginAt: string | null
  banned: boolean
}

function timeAgo(s: string | null) {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d < 30) return `${d}d ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const PLAN_COLOR: Record<string, { bg: string; color: string }> = {
  pro:      { bg: '#EEF2FF', color: '#4338CA' },
  business: { bg: '#FEF3C7', color: '#92400E' },
  starter:  { bg: '#DCFCE7', color: '#166534' },
  free:     { bg: '#F3F4F6', color: '#6B7280' },
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  active:   { bg: '#DCFCE7', color: '#166534', label: 'Active' },
  trialing: { bg: '#EEF2FF', color: '#4338CA', label: 'Trial' },
  canceled: { bg: '#FEE2E2', color: '#991B1B', label: 'Canceled' },
  past_due: { bg: '#FEF3C7', color: '#92400E', label: 'Past due' },
  inactive: { bg: '#F3F4F6', color: '#6B7280', label: 'Inactive' },
}

const AVATAR_COLORS = ['#4338CA', '#0F766E', '#B45309', '#BE185D', '#1D4ED8', '#7C3AED']

export default function UserList({ onSelectUser }: UserListProps) {
  const [users, setUsers]   = useState<User[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [plan, setPlan]     = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit),
        sort: 'created_at', order: 'desc',
        ...(search && { search }),
        ...(plan   && { plan }),
        ...(status && { status }),
      })
      const res = await fetch(`/api/admin/users?${p}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setUsers(json.data || [])
      setTotal(json.total || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, plan, status])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(1) }, [search, plan, status])

  const totalPages = Math.ceil(total / limit)

  // ── Styles ──────────────────────────────────────────────
  const ROOT: React.CSSProperties = {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    background: '#F8FAFC',
    minHeight: '100vh',
    padding: '24px 32px',
    color: '#1E293B',
  }

  const TH: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '11px 16px', textAlign: 'left',
    background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
  }

  const TD: React.CSSProperties = {
    fontSize: 13, padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
    verticalAlign: 'middle',
  }

  function badge(bg: string, color: string, text: string) {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' as const }}>
        {text}
      </span>
    )
  }

  return (
    <div style={ROOT}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>User Management</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{total.toLocaleString()} total users</div>
        </div>
        <button onClick={fetchUsers} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#475569' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' as const }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or name…"
          style={{ fontSize: 13, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', outline: 'none', color: '#1E293B', minWidth: 260 }}
        />
        <select value={plan} onChange={e => setPlan(e.target.value)}
          style={{ fontSize: 13, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#475569' }}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ fontSize: 13, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#475569' }}>
          <option value="">All statuses</option>
          <option value="trialing">Trialing</option>
          <option value="active">Active</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past due</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>User</th>
              <th style={TH}>Plan</th>
              <th style={TH}>Status</th>
              <th style={TH}>Docs</th>
              <th style={TH}>Storage</th>
              <th style={TH}>Joined</th>
              <th style={TH}>Last login</th>
              <th style={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#94A3B8', padding: 32 }}>Loading users…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#94A3B8', padding: 32 }}>No users found</td></tr>
            )}
            {!loading && users.map(u => {
              const pc = PLAN_COLOR[u.plan]   || PLAN_COLOR.free
              const sc = STATUS_COLOR[u.subscriptionStatus] || STATUS_COLOR.inactive
              const ac = AVATAR_COLORS[u.name.charCodeAt(0) % AVATAR_COLORS.length]
              return (
                <tr key={u.id}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                >
                  {/* User cell — click to open detail */}
                  <td style={TD} onClick={() => onSelectUser?.(u.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                        : <div style={{ width: 34, height: 34, borderRadius: '50%', background: ac + '22', color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{initials(u.name)}</div>
                      }
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {u.name}
                          {u.banned && <span style={{ fontSize: 9, background: '#FEE2E2', color: '#991B1B', padding: '1px 5px', borderRadius: 20 }}>banned</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{u.email}</div>
                        {u.companyName && <div style={{ fontSize: 11, color: '#CBD5E1' }}>{u.companyName}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={TD} onClick={() => onSelectUser?.(u.id)}>{badge(pc.bg, pc.color, u.plan)}</td>
                  <td style={TD} onClick={() => onSelectUser?.(u.id)}>{badge(sc.bg, sc.color, sc.label)}</td>
                  <td style={{ ...TD, color: '#475569' }} onClick={() => onSelectUser?.(u.id)}>{u.documentCount}</td>
                  <td style={{ ...TD, color: '#475569' }} onClick={() => onSelectUser?.(u.id)}>{u.totalStorageGB} GB</td>
                  <td style={{ ...TD, fontSize: 12, color: '#94A3B8' }} onClick={() => onSelectUser?.(u.id)}>{timeAgo(u.createdAt)}</td>
                  <td style={{ ...TD, fontSize: 12, color: '#94A3B8' }} onClick={() => onSelectUser?.(u.id)}>{timeAgo(u.lastLoginAt)}</td>

                  {/* Actions column — does NOT bubble to row click */}
                  <td style={TD} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectUser?.(u.id)}
                      style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#475569', marginRight: 6 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#94A3B8' }}>
          {total > 0 && `Showing ${((page - 1) * limit) + 1}–${Math.min(page * limit, total)} of ${total.toLocaleString()}`}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#CBD5E1' : '#475569' }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: `1px solid ${p === page ? '#6366F1' : '#E2E8F0'}`, background: p === page ? '#6366F1' : '#fff', color: p === page ? '#fff' : '#475569', cursor: 'pointer' }}>
                {p}
              </button>
            )
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#CBD5E1' : '#475569' }}>
            Next →
          </button>
        </div>
      </div>

    </div>
  )
}