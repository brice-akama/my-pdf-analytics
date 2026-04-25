'use client'

// app/admin/announcements/AnnouncementsPage.tsx
//
// WHAT THIS FILE DOES:
//   Full announcements management page for the owner dashboard.
//
// FEATURES:
//   1. Create new announcement (banner, email blast, or both)
//   2. Toggle banner on/off — live on user dashboard instantly
//   3. Send email to all verified users via Resend
//   4. Preview the announcement before sending
//   5. See history of past announcements with sent counts
//   6. Delete announcements

import { useState, useEffect, useCallback } from 'react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'maintenance'
  target: 'banner' | 'email' | 'both'
  active: boolean
  sentAt: string | null
  recipientCount: number
  expiresAt: string | null
  createdAt: string
}

// ── Type colors ────────────────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  info:        { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Info' },
  warning:     { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Warning' },
  success:     { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Success' },
  maintenance: { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF', label: 'Maintenance' },
}

function timeAgo(s: string | null) {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Banner preview (how it looks in user dashboard) ───────────
function BannerPreview({ title, message, type }: { title: string; message: string; type: string }) {
  const ts = TYPE_STYLE[type] || TYPE_STYLE.info
  const icons: Record<string, string> = {
    info: 'ℹ', warning: '⚠', success: '✓', maintenance: '🔧',
  }
  return (
    <div style={{
      background: ts.bg, border: `1px solid ${ts.border}`,
      borderRadius: 8, padding: '12px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{icons[type] || 'ℹ'}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: ts.color }}>{title || 'Announcement title'}</div>
        <div style={{ fontSize: 12, color: ts.color, opacity: 0.85, marginTop: 2, lineHeight: 1.5 }}>
          {message || 'Announcement message will appear here…'}
        </div>
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [msg, setMsg]                     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Form state
  const [title, setTitle]       = useState('')
  const [message, setMessage]   = useState('')
  const [type, setType]         = useState<'info' | 'warning' | 'success' | 'maintenance'>('info')
  const [target, setTarget]     = useState<'banner' | 'email' | 'both'>('banner')
  const [expiresAt, setExpires] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Send email state
  const [sending, setSending]         = useState<string | null>(null) // announcementId being sent
  const [sendConfirm, setSendConfirm] = useState<string | null>(null) // announcementId awaiting confirm
  const [totalUsers, setTotalUsers]   = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [annRes, usersRes] = await Promise.all([
        fetch('/api/admin/announcements', { credentials: 'include' }),
        fetch('/api/admin/users?limit=1', { credentials: 'include' }),
      ])
      if (!annRes.ok) throw new Error(`HTTP ${annRes.status}`)
      const annJson = await annRes.json()
      setAnnouncements(annJson.data || [])

      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        setTotalUsers(usersJson.total || 0)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function showMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  // ── Create announcement ──────────────────────────────────────
  async function handleCreate() {
    if (!title.trim() || !message.trim()) {
      showMsg('err', 'Title and message are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type, target, expiresAt: expiresAt || null }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      showMsg('ok', 'Announcement created')
      setTitle(''); setMessage(''); setType('info'); setTarget('banner'); setExpires('')
      setShowForm(false)
      await fetchData()
    } catch (e: any) {
      showMsg('err', e.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  // ── Toggle banner active ─────────────────────────────────────
  async function toggleActive(a: Announcement) {
    try {
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !a.active }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showMsg('ok', a.active ? 'Banner hidden from users' : 'Banner now live for all users')
      await fetchData()
    } catch (e: any) {
      showMsg('err', e.message || 'Failed to update')
    }
  }

  // ── Send email blast ─────────────────────────────────────────
  async function sendEmail(announcementId: string) {
    setSending(announcementId); setSendConfirm(null)
    try {
      const res = await fetch('/api/admin/announcements/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ announcementId }),
      })
      const json = await res.json()
      if (!res.ok) {
        // 409 means already sent
        if (res.status === 409) {
          showMsg('err', `Already sent to ${json.recipientCount} users on ${fmtDate(json.sentAt)}. Edit the announcement to resend.`)
        } else {
          throw new Error(json.error || `HTTP ${res.status}`)
        }
      } else {
        showMsg('ok', `✓ Email sent to ${json.sent} users${json.failed > 0 ? ` (${json.failed} failed)` : ''}`)
        await fetchData()
      }
    } catch (e: any) {
      showMsg('err', e.message || 'Failed to send')
    } finally {
      setSending(null)
    }
  }

  // ── Delete ───────────────────────────────────────────────────
  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showMsg('ok', 'Deleted')
      await fetchData()
    } catch (e: any) {
      showMsg('err', e.message || 'Failed to delete')
    }
  }

  // ── Styles ───────────────────────────────────────────────────
  const ROOT: React.CSSProperties = {
    fontFamily: '"DM Sans", "Helvetica Neue", sans-serif',
    background: '#F8FAFC', minHeight: '100vh',
    padding: '24px 32px', color: '#1E293B',
  }
  const CARD: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 12, padding: '20px 24px', marginBottom: 16,
  }
  const INPUT: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '9px 12px',
    border: '1px solid #E2E8F0', borderRadius: 8,
    background: '#fff', outline: 'none', color: '#1E293B',
    marginBottom: 10,
  }
  const LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 4, display: 'block',
  }
  const BTN = (variant: 'primary' | 'ghost' | 'danger' | 'warning'): React.CSSProperties => {
    const v = {
      primary: { background: '#1E293B', color: '#fff', border: '1px solid #1E293B' },
      ghost:   { background: '#fff', color: '#475569', border: '1px solid #E2E8F0' },
      danger:  { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
      warning: { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
    }
    return { ...v[variant], fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  }

  return (
    <div style={ROOT}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Announcements</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Manage banners and send emails to all users
            {totalUsers !== null && ` · ${totalUsers.toLocaleString()} users`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData} style={BTN('ghost')}>↻ Refresh</button>
          <button onClick={() => setShowForm(f => !f)} style={BTN('primary')}>
            {showForm ? '✕ Cancel' : '+ New announcement'}
          </button>
        </div>
      </div>

      {/* Action message */}
      {msg && (
        <div style={{
          background: msg.type === 'ok' ? '#F0FDF4' : '#FEF2F2',
          color: msg.type === 'ok' ? '#166534' : '#991B1B',
          border: `1px solid ${msg.type === 'ok' ? '#BBF7D0' : '#FECACA'}`,
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
        }}>
          {msg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={CARD}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
            New announcement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <div>
              <label style={LABEL}>Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)}
                style={{ ...INPUT, marginBottom: 0 }}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>Target</label>
              <select value={target} onChange={e => setTarget(e.target.value as any)}
                style={{ ...INPUT, marginBottom: 0 }}>
                <option value="banner">Banner only (shows in dashboard)</option>
                <option value="email">Email only (send to all users)</option>
                <option value="both">Both banner + email</option>
              </select>
            </div>
          </div>

          <label style={LABEL}>Title</label>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance on Saturday"
            style={INPUT}
          />

          <label style={LABEL}>Message</label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write your announcement message here…"
            rows={3}
            style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />

          {(target === 'banner' || target === 'both') && (
            <div>
              <label style={LABEL}>Expires at (optional — banner auto-hides)</label>
              <input type="datetime-local" value={expiresAt}
                onChange={e => setExpires(e.target.value)}
                style={{ ...INPUT }} />
            </div>
          )}

          {/* Live preview */}
          {(title || message) && (
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Banner preview</label>
              <BannerPreview title={title} message={message} type={type} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={creating}
              style={{ ...BTN('primary'), opacity: creating ? 0.6 : 1 }}>
              {creating ? 'Creating…' : 'Create announcement'}
            </button>
            <button onClick={() => setShowForm(false)} style={BTN('ghost')}>Cancel</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8', fontSize: 13 }}>
          Loading announcements…
        </div>
      )}

      {/* Empty */}
      {!loading && announcements.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>No announcements yet</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Create one to show a banner or send an email to all users</div>
        </div>
      )}

      {/* Announcements list */}
      {!loading && announcements.map(a => {
        const ts = TYPE_STYLE[a.type] || TYPE_STYLE.info
        const isSending = sending === a.id
        const isConfirming = sendConfirm === a.id
        const canSendEmail = a.target === 'email' || a.target === 'both'
        const canShowBanner = a.target === 'banner' || a.target === 'both'

        return (
          <div key={a.id} style={CARD}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>

              {/* Left — content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                    {ts.label}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: '#475569' }}>
                    {a.target}
                  </span>
                  {canShowBanner && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: a.active ? '#DCFCE7' : '#F3F4F6', color: a.active ? '#166534' : '#6B7280', fontWeight: 600 }}>
                      {a.active ? '● Live' : '○ Hidden'}
                    </span>
                  )}
                  {a.sentAt && (
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      Sent {timeAgo(a.sentAt)} · {a.recipientCount} recipients
                    </span>
                  )}
                  {a.expiresAt && (
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      Expires {fmtDate(a.expiresAt)}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{a.message}</div>

                {/* Banner preview */}
                {canShowBanner && (
                  <div style={{ marginTop: 12 }}>
                    <BannerPreview title={a.title} message={a.message} type={a.type} />
                  </div>
                )}
              </div>

              {/* Right — actions */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, minWidth: 160 }}>

                {/* Toggle banner */}
                {canShowBanner && (
                  <button onClick={() => toggleActive(a)} style={BTN(a.active ? 'warning' : 'primary')}>
                    {a.active ? '○ Hide banner' : '● Show banner'}
                  </button>
                )}

                {/* Send email */}
                {canSendEmail && !isConfirming && (
                  <button
                    onClick={() => setSendConfirm(a.id)}
                    disabled={isSending}
                    style={{ ...BTN('ghost'), opacity: isSending ? 0.6 : 1 }}
                  >
                    {isSending ? 'Sending…' : a.sentAt ? '↺ Resend email' : '✉ Send email'}
                  </button>
                )}

                {/* Confirm send */}
                {isConfirming && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
                      Send to {totalUsers !== null ? totalUsers.toLocaleString() : 'all'} users?
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => sendEmail(a.id)} disabled={isSending}
                        style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 0', borderRadius: 6, border: 'none', background: '#1E293B', color: '#fff', cursor: 'pointer' }}>
                        {isSending ? '…' : 'Yes, send'}
                      </button>
                      <button onClick={() => setSendConfirm(null)}
                        style={{ flex: 1, fontSize: 11, padding: '6px 0', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button onClick={() => deleteAnnouncement(a.id)} style={BTN('danger')}>
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}