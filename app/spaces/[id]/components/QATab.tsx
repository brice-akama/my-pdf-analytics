"use client"

 
//
// WHAT'S NEW IN THIS VERSION:
//   SLA indicators — questions unanswered for 24h turn yellow, 48h turn red.
//   This tells you at a glance which investors are waiting too long for a reply.
//   No backend changes needed — everything is computed from createdAt on the client.

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  FileText,
  Send,
  Clock,
  AlertTriangle,
  AlertCircle,
} from "lucide-react"

type QAComment = {
  id: string
  documentId: string
  documentName: string
  email: string
  message: string
  shareLink: string | null
  linkLabel: string | null
  reply: string | null
  repliedAt: string | null
  createdAt: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA LOGIC
//
// < 24h  → no indicator (fresh question, no urgency)
// 24–48h → yellow warning  (investor waiting)
// > 48h  → red critical    (investor probably frustrated)
//
// Only applies to UNANSWERED questions. Once replied, SLA is cleared.
// ─────────────────────────────────────────────────────────────────────────────
type SLAStatus = 'ok' | 'warning' | 'critical'

function getSLAStatus(createdAt: string, hasReply: boolean): SLAStatus {
  if (hasReply) return 'ok'
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  if (hoursOld >= 48) return 'critical'
  if (hoursOld >= 24) return 'warning'
  return 'ok'
}

function getSLALabel(createdAt: string): string {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  if (hoursOld < 1) return 'Just now'
  if (hoursOld < 24) return `${Math.floor(hoursOld)}h ago`
  const daysOld = Math.floor(hoursOld / 24)
  return `${daysOld}d ago`
}

function SLABadge({ status, createdAt }: { status: SLAStatus; createdAt: string }) {
  if (status === 'ok') return null

  const hoursOld = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  )

  if (status === 'critical') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-semibold">
        <AlertCircle className="h-3 w-3" />
        {hoursOld}h — needs reply
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold">
      <AlertTriangle className="h-3 w-3" />
      {hoursOld}h waiting
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA SUMMARY BAR
// Shows at the top when there are overdue questions.
// ─────────────────────────────────────────────────────────────────────────────
function SLASummary({ comments }: { comments: QAComment[] }) {
  const unanswered = comments.filter(c => !c.reply)
  const critical = unanswered.filter(c => getSLAStatus(c.createdAt, false) === 'critical')
  const warning = unanswered.filter(c => getSLAStatus(c.createdAt, false) === 'warning')

  if (critical.length === 0 && warning.length === 0) return null

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border mb-4 ${
      critical.length > 0
        ? 'bg-red-50 border-red-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      {critical.length > 0
        ? <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        : <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      }
      <div>
        <p className={`text-sm font-semibold ${critical.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
          {critical.length > 0
            ? `${critical.length} question${critical.length !== 1 ? 's' : ''} unanswered for 48+ hours`
            : `${warning.length} question${warning.length !== 1 ? 's' : ''} waiting 24+ hours for a reply`
          }
        </p>
        <p className={`text-xs mt-0.5 ${critical.length > 0 ? 'text-red-600' : 'text-amber-600'}`}>
          Investors who wait too long stop engaging. Reply soon to keep the deal warm.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function QATab({
  spaceId,
  qaComments,
  qaLoading,
  fetchQAComments,
}: {
  spaceId: string
  qaComments: QAComment[]
  qaLoading: boolean
  fetchQAComments: () => void
}) {
  const [qaFilter, setQaFilter] = useState<'all' | 'unanswered' | 'answered'>('all')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/comments`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reply: replyText.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setReplyingTo(null)
        setReplyText('')
        await fetchQAComments()
      }
    } catch (error) {
      console.error('Reply failed:', error)
    } finally {
      setSendingReply(false)
    }
  }

  // Count for SLA summary — all unanswered regardless of filter
  const criticalCount = qaComments.filter(
    c => !c.reply && getSLAStatus(c.createdAt, false) === 'critical'
  ).length
  const warningCount = qaComments.filter(
    c => !c.reply && getSLAStatus(c.createdAt, false) === 'warning'
  ).length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Q&amp;A</h2>
          <p className="text-sm text-slate-500 mt-1">Questions from portal visitors</p>
        </div>
        <div className="flex items-center gap-2">
          {/* SLA legend */}
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mr-2">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} waiting
                </span>
              )}
            </div>
          )}

          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
            {(['all', 'unanswered', 'answered'] as const).map(f => (
              <button
                key={f}
                onClick={() => setQaFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  qaFilter === f
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
                {f === 'unanswered' && qaComments.filter(c => !c.reply).length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                    {qaComments.filter(c => !c.reply).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={fetchQAComments}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${qaLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SLA Summary Banner */}
      {!qaLoading && <SLASummary comments={qaComments} />}

      {qaLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : qaComments.length === 0 ? (
        <div className="border rounded-xl bg-white p-12 text-center">
          <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No questions yet</p>
          <p className="text-xs text-slate-400 mt-1">Questions from portal visitors will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const groupedComments = qaComments
              .filter(c => {
                if (qaFilter === 'unanswered') return !c.reply
                if (qaFilter === 'answered') return !!c.reply
                return true
              })
              .reduce((acc: Record<string, QAComment[]>, comment) => {
                const key = comment.email
                if (!acc[key]) acc[key] = []
                acc[key].push(comment)
                return acc
              }, {})

            const entries = Object.entries(groupedComments)

            // Sort: investors with critical SLA first, then warning, then ok
            entries.sort(([, aComments], [, bComments]) => {
              const aWorstSLA = aComments.reduce((worst, c) => {
                const s = getSLAStatus(c.createdAt, !!c.reply)
                if (s === 'critical') return 'critical'
                if (s === 'warning' && worst !== 'critical') return 'warning'
                return worst
              }, 'ok' as SLAStatus)
              const bWorstSLA = bComments.reduce((worst, c) => {
                const s = getSLAStatus(c.createdAt, !!c.reply)
                if (s === 'critical') return 'critical'
                if (s === 'warning' && worst !== 'critical') return 'warning'
                return worst
              }, 'ok' as SLAStatus)
              const order = { critical: 0, warning: 1, ok: 2 }
              return order[aWorstSLA] - order[bWorstSLA]
            })

            if (entries.length === 0) return (
              <div className="border rounded-xl bg-white p-10 text-center">
                <p className="text-sm text-slate-400">No {qaFilter} questions</p>
              </div>
            )

            return entries.map(([email, investorComments]) => {
              const unansweredCount = investorComments.filter(c => !c.reply).length
              const firstComment = investorComments[0]

              // Worst SLA across all this investor's unanswered questions
              const worstSLA = investorComments.reduce((worst, c) => {
                const s = getSLAStatus(c.createdAt, !!c.reply)
                if (s === 'critical') return 'critical'
                if (s === 'warning' && worst !== 'critical') return 'warning'
                return worst
              }, 'ok' as SLAStatus)

              return (
                <div
                  key={email}
                  className={`border rounded-xl overflow-hidden bg-white ${
                    worstSLA === 'critical'
                      ? 'border-red-200 shadow-sm shadow-red-100'
                      : worstSLA === 'warning'
                      ? 'border-amber-200 shadow-sm shadow-amber-100'
                      : ''
                  }`}
                >
                  {/* Visitor header */}
                  <div className={`flex items-center gap-3 px-4 py-3 border-b ${
                    worstSLA === 'critical'
                      ? 'bg-red-50'
                      : worstSLA === 'warning'
                      ? 'bg-amber-50'
                      : 'bg-slate-50'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
                      {firstComment.linkLabel && (
                        <p className="text-xs text-slate-400">via {firstComment.linkLabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">
                        {investorComments.length} message{investorComments.length !== 1 ? 's' : ''}
                      </span>
                      {unansweredCount > 0 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-white text-xs font-medium ${
                          worstSLA === 'critical'
                            ? 'bg-red-600'
                            : worstSLA === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-slate-900'
                        }`}>
                          {unansweredCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="divide-y divide-slate-100">
                    {investorComments.map(comment => {
                      const slaStatus = getSLAStatus(comment.createdAt, !!comment.reply)

                      return (
                        <div
                          key={comment.id}
                          className={`p-4 ${
                            !comment.reply
                              ? slaStatus === 'critical'
                                ? 'border-l-2 border-l-red-500 bg-red-50/30'
                                : slaStatus === 'warning'
                                ? 'border-l-2 border-l-amber-400 bg-amber-50/30'
                                : 'border-l-2 border-l-slate-900'
                              : 'border-l-2 border-l-slate-200'
                          }`}
                        >
                          {comment.documentId !== 'general' && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 mb-2">
                              <FileText className="h-3 w-3" />
                              {comment.documentName}
                            </div>
                          )}

                          <p className="text-sm text-slate-800 leading-relaxed">{comment.message}</p>

                          {/* Timestamp + SLA badge */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                              {' '}· {getSLALabel(comment.createdAt)}
                            </p>
                            {/* SLA badge only on unanswered */}
                            {!comment.reply && (
                              <SLABadge status={slaStatus} createdAt={comment.createdAt} />
                            )}
                          </div>

                          {comment.reply ? (
                            <div className="mt-3 ml-3 sm:ml-6 border rounded-lg p-3 bg-slate-50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-slate-700">Your reply</p>
                                {comment.repliedAt && (
                                  <p className="text-xs text-slate-400">
                                    {new Date(comment.repliedAt).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm text-slate-700">{comment.reply}</p>
                            </div>
                          ) : replyingTo === comment.id ? (
                            <div className="mt-3 ml-3 sm:ml-6 space-y-2">
                              <textarea
                                autoFocus
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleReply(comment.id)
                                  }
                                  if (e.key === 'Escape') {
                                    setReplyingTo(null)
                                    setReplyText('')
                                  }
                                }}
                                placeholder="Write a reply..."
                                rows={3}
                                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyText('') }}
                                  className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReply(comment.id)}
                                  disabled={sendingReply || !replyText.trim()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40"
                                >
                                  {sendingReply
                                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Sending</>
                                    : <><Send className="h-3 w-3" /> Reply</>
                                  }
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setReplyingTo(comment.id); setReplyText('') }}
                              className={`mt-2 ml-3 sm:ml-6 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                                slaStatus === 'critical'
                                  ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100'
                                  : slaStatus === 'warning'
                                  ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'
                                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <Send className="h-3 w-3" />
                              {slaStatus === 'critical' ? 'Reply now (overdue)' : 'Reply'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}