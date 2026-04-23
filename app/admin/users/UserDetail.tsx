'use client'

// app/admin/users/UserDetail.tsx

import { useState, useEffect } from 'react'

interface UserDetailProps {
  userId: string
  onBack?: () => void
}

interface UserData {
  user: {
    id: string
    email: string
    name: string
    avatarUrl: string | null
    companyName: string | null
    plan: string
    subscriptionStatus: string
    billingCycle: string | null
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    paddleCustomerId: string | null
    provider: string
    emailVerified: boolean
    industry: string | null
    companySize: string | null
    useCases: string[]
    totalStorageGB: number
    banned: boolean
    createdAt: string
    lastLoginAt: string | null
  }
  stats: { totalDocuments: number; totalSignatures: number; totalSpaces: number }
  documents: { id: string; name: string; sizeKB: number; views: number; downloads: number; createdAt: string }[]
  activity: { id: string; action: string; createdAt: string }[]
  signatures: { id: string; status: string; recipientEmail: string | null; createdAt: string }[]
}

function timeAgo(s: string | null) {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  trialing: { bg: '#EEF2FF', color: '#4338CA', label: 'Trialing' },
  canceled: { bg: '#FEE2E2', color: '#991B1B', label: 'Canceled' },
  past_due: { bg: '#FEF3C7', color: '#92400E', label: 'Past due' },
  inactive: { bg: '#F3F4F6', color: '#6B7280', label: 'Inactive' },
}

export default function UserDetail({ userId, onBack }: UserDetailProps) {
  const [data, setData]               = useState<UserData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [actionLoading, setAL]        = useState(false)
  const [msg, setMsg]                 = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirmDelete, setConfirmDel]= useState(false)

  async function load() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: any) {
      setError(e.message || 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  async function patch(changes: Record<string, any>) {
    setAL(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg({ type: 'ok', text: 'Updated successfully' })
      await load()
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || 'Update failed' })
    } finally {
      setAL(false)
    }
  }

  async function deleteAccount() {
    setAL(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMsg({ type: 'ok', text: 'Account deleted' })
      setTimeout(() => onBack?.(), 1200)
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || 'Delete failed' })
      setAL(false)
    }
  }

  // ── Styles ────────────────────────────────────────────────
  const ROOT: React.CSSProperties = {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    background: '#F8FAFC',
    minHeight: '100vh',
    padding: '24px 32px',
    color: '#1E293B',
  }

  const CARD: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  }

  function badge(bg: string, color: string): React.CSSProperties {
    return { display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 20, background: bg, color }
  }

  function field(label: string, value: React.ReactNode) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{value || '—'}</div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ ...ROOT, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading user…</div>
    </div>
  )

  if (error || !data) return (
    <div style={{ ...ROOT, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 10 }}>{error || 'User not found'}</div>
        {onBack && <button onClick={onBack} style={{ fontSize: 12, cursor: 'pointer', border: 'none', background: 'none', color: '#6366F1' }}>← Back</button>}
      </div>
    </div>
  )

  const { user, stats, documents, activity } = data
  const pb = PLAN_COLOR[user.plan]   || PLAN_COLOR.free
  const sb = STATUS_COLOR[user.subscriptionStatus] || STATUS_COLOR.inactive
  const avatarBg = ['#4338CA','#0F766E','#B45309','#BE185D','#1D4ED8'][user.name.charCodeAt(0) % 5]

  return (
    <div style={ROOT}>

      {/* Back */}
      {onBack && (
        <button onClick={onBack} style={{ fontSize: 13, color: '#6366F1', border: 'none', background: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to users
        </button>
      )}

      {/* Action message */}
      {msg && (
        <div style={{ background: msg.type === 'ok' ? '#DCFCE7' : '#FEE2E2', color: msg.type === 'ok' ? '#166534' : '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      {/* ── Profile header ──────────────────────────────────── */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user.avatarUrl
            ? <img src={user.avatarUrl} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            : <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarBg + '22', color: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{initials(user.name)}</div>
          }
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.name}
              {user.banned && <span style={badge('#FEE2E2', '#991B1B')}>Banned</span>}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{user.email}</div>
            {user.companyName && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{user.companyName}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              <span style={badge(pb.bg, pb.color)}>{user.plan}</span>
              <span style={badge(sb.bg, sb.color)}>{sb.label}</span>
              <span style={badge('#F3F4F6', '#6B7280')}>{user.provider}</span>
              {user.emailVerified && <span style={badge('#DCFCE7', '#166534')}>Email verified</span>}
            </div>
          </div>
        </div>

        {/* ── Admin actions ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, minWidth: 200 }}>

          {/* Change plan */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Change plan</div>
            <select
              disabled={actionLoading}
              defaultValue=""
              onChange={e => { if (e.target.value) { patch({ plan: e.target.value }); e.target.value = '' } }}
              style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#475569' }}
            >
              <option value="" disabled>Select plan…</option>
              <option value="free">Free</option>
              <option value="starter">Starter — $9/mo</option>
              <option value="pro">Pro — $29/mo</option>
              <option value="business">Business — $79/mo</option>
            </select>
          </div>

          {/* Change status */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Change status</div>
            <select
              disabled={actionLoading}
              defaultValue=""
              onChange={e => { if (e.target.value) { patch({ subscriptionStatus: e.target.value }); e.target.value = '' } }}
              style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#475569' }}
            >
              <option value="" disabled>Change status…</option>
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Ban / Unban */}
          <button
            disabled={actionLoading}
            onClick={() => patch({ banned: !user.banned })}
            style={{
              width: '100%',
              fontSize: 12,
              fontWeight: 600,
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              background: user.banned ? '#EEF2FF' : '#FEF3C7',
              color: user.banned ? '#4338CA' : '#92400E',
              borderColor: user.banned ? '#C7D2FE' : '#FDE68A',
            }}
          >
            {actionLoading ? '…' : user.banned ? '✓ Unban user' : '⊘ Ban user'}
          </button>

          {/* Delete account */}
          {!confirmDelete ? (
            <button
              disabled={actionLoading}
              onClick={() => setConfirmDel(true)}
              style={{
                width: '100%',
                fontSize: 12,
                fontWeight: 600,
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #FECACA',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                background: '#FEF2F2',
                color: '#991B1B',
              }}
            >
              🗑 Delete account
            </button>
          ) : (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 8, fontWeight: 500 }}>
                Permanently delete {user.email} and all their documents?
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={deleteAccount}
                  disabled={actionLoading}
                  style={{ flex: 1, fontSize: 12, fontWeight: 600, padding: '7px 0', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  style={{ flex: 1, fontSize: 12, padding: '7px 0', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Documents', value: stats.totalDocuments },
          { label: 'Signatures', value: stats.totalSignatures },
          { label: 'Storage used', value: `${user.totalStorageGB} GB` },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Billing + Account info ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Billing details</div>
          {field('Plan', <span style={badge(pb.bg, pb.color)}>{user.plan}</span>)}
          {field('Status', <span style={badge(sb.bg, sb.color)}>{sb.label}</span>)}
          {field('Billing cycle', user.billingCycle)}
          {field('Trial ends', user.trialEndsAt ? fmtDate(user.trialEndsAt) : null)}
          {field('Period ends', user.currentPeriodEnd ? fmtDate(user.currentPeriodEnd) : null)}
          {field('Paddle customer ID',
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94A3B8' }}>
              {user.paddleCustomerId || '—'}
            </span>
          )}
        </div>
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Account info</div>
          {field('Joined', fmtDate(user.createdAt))}
          {field('Last login', timeAgo(user.lastLoginAt))}
          {field('Sign-in method', user.provider)}
          {field('Email verified', user.emailVerified ? 'Yes' : 'No')}
          {field('Industry', user.industry)}
          {field('Company size', user.companySize)}
          {user.useCases?.length > 0 && field('Use cases',
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
              {user.useCases.map((uc: string) => (
                <span key={uc} style={badge('#F1F5F9', '#475569')}>{uc}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Documents ───────────────────────────────────────── */}
      {documents.length > 0 && (
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            Recent documents ({stats.totalDocuments} total)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr>
                {['Name', 'Size', 'Views', 'Downloads', 'Uploaded'].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '8px 12px', textAlign: 'left' as const, borderBottom: '1px solid #F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontSize: 12, padding: '9px 12px', borderBottom: '1px solid #F1F5F9', fontWeight: 500, color: '#1E293B', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{doc.name}</td>
                  <td style={{ fontSize: 12, padding: '9px 12px', borderBottom: '1px solid #F1F5F9', color: '#475569' }}>{doc.sizeKB} KB</td>
                  <td style={{ fontSize: 12, padding: '9px 12px', borderBottom: '1px solid #F1F5F9', color: doc.views > 0 ? '#4338CA' : '#CBD5E1', fontWeight: doc.views > 0 ? 600 : 400 }}>{doc.views}</td>
                  <td style={{ fontSize: 12, padding: '9px 12px', borderBottom: '1px solid #F1F5F9', color: '#475569' }}>{doc.downloads}</td>
                  <td style={{ fontSize: 12, padding: '9px 12px', borderBottom: '1px solid #F1F5F9', color: '#94A3B8' }}>{timeAgo(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Activity log ────────────────────────────────────── */}
      {activity.length > 0 && (
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Recent activity</div>
          {activity.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < activity.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{a.action}</span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}