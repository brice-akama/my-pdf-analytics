'use client'

import { useState, useEffect } from 'react'

interface UserDetailProps {
  userId: string
  onBack?: () => void
}

interface UserData {
  user: any
  stats: any
  documents: any[]
  activity: any[]
  signatures: any[]
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function planBadge(plan: string) {
  const map: any = {
    pro:      { bg: '#EEF2FF', color: '#4338CA' },
    business: { bg: '#FEF3C7', color: '#92400E' },
    starter:  { bg: '#DCFCE7', color: '#166534' },
    free:     { bg: '#F3F4F6', color: '#6B7280' },
  }
  return map[plan] || map.free
}

function statusBadge(status: string) {
  const map: any = {
    active:   { bg: '#DCFCE7', color: '#166534', label: 'Active' },
    trialing: { bg: '#EEF2FF', color: '#4338CA', label: 'Trialing' },
    canceled: { bg: '#FEE2E2', color: '#991B1B', label: 'Canceled' },
    past_due: { bg: '#FEF3C7', color: '#92400E', label: 'Past due' },
    inactive: { bg: '#F3F4F6', color: '#6B7280', label: 'Inactive' },
  }
  return map[status] || map.inactive
}

export default function UserDetail({ userId, onBack }: UserDetailProps) {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`)
        const json = await res.json()
        setData(json)
      } catch {
        setError('Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const s = {
    root: { padding: 24, background: '#F8FAFC' } as React.CSSProperties,
    card: { background: '#fff', padding: 20, borderRadius: 12, marginBottom: 16 } as React.CSSProperties,
    title: { fontSize: 18, fontWeight: 700 } as React.CSSProperties,

    badge: (bg: string, color: string): React.CSSProperties => ({
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 20,
      background: bg,
      color,
    }),

    actionBtn: (variant: 'danger' | 'warning' | 'primary'): React.CSSProperties => {
      const map = {
        danger:  { background: '#FEE2E2', color: '#991B1B' },
        warning: { background: '#FEF3C7', color: '#92400E' },
        primary: { background: '#EEF2FF', color: '#4338CA' },
      }
      return {
        ...map[variant],
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        border: 'none'
      }
    }
  }

  if (loading) return <div style={s.root}>Loading...</div>
  if (error || !data) return <div style={s.root}>{error}</div>

  const { user } = data
  const pb = planBadge(user.plan)
  const sb = statusBadge(user.subscriptionStatus)

  return (
    <div style={s.root}>
      {onBack && <button onClick={onBack}>← Back</button>}

      <div style={s.card}>
        <div style={s.title}>{user.name}</div>

        <div style={{ marginTop: 8 }}>{user.email}</div>

        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <span style={s.badge(pb.bg, pb.color)}>{user.plan}</span>
          <span style={s.badge(sb.bg, sb.color)}>{sb.label}</span>
        </div>
      </div>

      <div style={s.card}>
        <button style={s.actionBtn('warning')}>
          Ban User
        </button>

        <button style={s.actionBtn('danger')}>
          Delete Account
        </button>
      </div>
    </div>
  )
}