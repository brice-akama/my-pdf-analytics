"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  FileText,
  Send
} from "lucide-react"
import { toast } from "sonner"

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Q&A</h2>
          <p className="text-sm text-slate-500 mt-1">Questions from portal visitors</p>
        </div>
        <div className="flex items-center gap-2">
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

            if (entries.length === 0) return (
              <div className="border rounded-xl bg-white p-10 text-center">
                <p className="text-sm text-slate-400">No {qaFilter} questions</p>
              </div>
            )

            return entries.map(([email, investorComments]) => {
              const unansweredCount = investorComments.filter(c => !c.reply).length
              const firstComment = investorComments[0]
              return (
                <div key={email} className="border rounded-xl overflow-hidden bg-white">
                  {/* Visitor header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{email}</p>
                      {firstComment.linkLabel && (
                        <p className="text-xs text-slate-400">via {firstComment.linkLabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{investorComments.length} message{investorComments.length !== 1 ? 's' : ''}</span>
                      {unansweredCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-medium">
                          {unansweredCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="divide-y divide-slate-100">
                    {investorComments.map(comment => (
                      <div
                        key={comment.id}
                        className={`p-4 ${!comment.reply ? 'border-l-2 border-l-slate-900' : 'border-l-2 border-l-slate-200'}`}
                      >
                        {comment.documentId !== 'general' && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 mb-2">
                            <FileText className="h-3 w-3" />
                            {comment.documentName}
                          </div>
                        )}

                        <p className="text-sm text-slate-800 leading-relaxed">{comment.message}</p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>

                        {comment.reply ? (
                          <div className="mt-3 ml-3 sm:ml-6 border rounded-lg p-3 bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-slate-700">Your reply</p>
                              {comment.repliedAt && (
                                <p className="text-xs text-slate-400">
                                  {new Date(comment.repliedAt).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment.id) }
                                if (e.key === 'Escape') { setReplyingTo(null); setReplyText('') }
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
                            className="mt-2 ml-3 sm:ml-6 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Send className="h-3 w-3" /> Reply
                          </button>
                        )}
                      </div>
                    ))}
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