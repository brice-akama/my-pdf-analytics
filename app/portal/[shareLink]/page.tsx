"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FolderOpen, FileText, Eye, Download, Lock, Mail, AlertCircle,
  Loader2, CheckCircle2, MessageSquare, Send, FileSignature,
  X, Folder, Search, Shield, ChevronDown, ChevronRight,
  ArrowLeft, Check, Menu, Plus, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, ChevronLeft, ExternalLink
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────
type Doc = {
  id: string
  name: string
  type: string
  size: string
  cloudinaryPdfUrl: string
  folderId: string | null
}

type FolderType = {
  id: string
  name: string
  documentCount: number
  parentId?: string | null
  index?: number | null
}

type Comment = {
  id: string
  documentId: string
  documentName: string
  author: string
  message: string
  createdAt: string
  reply?: string | null
  repliedAt?: string | null
}

type SpaceData = {
  name: string
  description: string
  allowDownloads: boolean
  allowQA: boolean
  ndaRequired: boolean
  enableWatermark: boolean
  ndaDocumentUrl?: string
  ndaDocumentName?: string
  branding: {
    logoUrl?: string
    primaryColor: string
    companyName?: string
    welcomeMessage: string
  }
  documents: Doc[]
  folders: FolderType[]
}

// ── OTP added to Step type ─────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'password' | 'nda' | 'docs'

// ─── Watermark — single centered stamp (DocSend style) ─────────────────────────
function Watermark({ email }: { email: string }) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  return (
    <div
      className="pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div style={{ transform: 'rotate(-35deg)', opacity: 0.12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#000', letterSpacing: '0.04em', whiteSpace: 'nowrap', fontFamily: 'system-ui,sans-serif' }}>
          {email}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#000', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontFamily: 'system-ui,sans-serif' }}>
          {timestamp}
        </span>
      </div>
    </div>
  )
}

// ─── Gate Card ─────────────────────────────────────────────────────────────────
function GateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm"
      >
        {children}
      </motion.div>
    </div>
  )
}

// ─── Step Dots ─────────────────────────────────────────────────────────────────
function StepDots({ current, steps }: { current: Step; steps: Step[] }) {
  const idx = steps.indexOf(current)
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {steps.map((s, i) => (
        <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
          i < idx ? 'w-5 bg-gray-900' : i === idx ? 'w-7 bg-gray-900' : 'w-3 bg-gray-200'
        }`} />
      ))}
    </div>
  )
}

// ─── Document Viewer Drawer ─────────────────────────────────────────────────────
function DocViewerDrawer({ doc, onClose, shareLink, enableWatermark, allowDownloads, onDownload, downloadingId, visitorEmail }: {
  doc: Doc | null
  onClose: () => void
  shareLink: string
  allowDownloads: boolean
  onDownload: (doc: Doc) => void
  downloadingId: string | null
  visitorEmail: string
  enableWatermark: boolean
}) {
  const [loadError, setLoadError]       = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [blobUrl, setBlobUrl]           = useState<string | null>(null)

  const sessionIdRef      = useRef<string | null>(null)
  const totalSecondsRef   = useRef(0)
  const heartbeatRef      = useRef<NodeJS.Timeout | null>(null)
  const HEARTBEAT_INTERVAL = 10

  // Heartbeat tracking
  useEffect(() => {
    if (!doc) return
    sessionIdRef.current    = `${visitorEmail || 'anon'}-${doc.id}-${Date.now()}`
    totalSecondsRef.current = 0

    heartbeatRef.current = setInterval(async () => {
      totalSecondsRef.current += HEARTBEAT_INTERVAL
      try {
        await fetch(`/api/portal/${shareLink}/track`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: visitorEmail, event: 'page_heartbeat',
            documentId: doc.id, documentName: doc.name,
            sessionId: sessionIdRef.current,
            secondsOnPage: HEARTBEAT_INTERVAL,
            totalSeconds: totalSecondsRef.current,
          })
        })
      } catch { /* silent */ }
    }, HEARTBEAT_INTERVAL * 1000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (totalSecondsRef.current > 0 && sessionIdRef.current) {
        fetch(`/api/portal/${shareLink}/track`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: visitorEmail, event: 'page_heartbeat',
            documentId: doc.id, documentName: doc.name,
            sessionId: sessionIdRef.current,
            secondsOnPage: 0, totalSeconds: totalSecondsRef.current,
          })
        }).catch(() => {})
      }
    }
  }, [doc?.id])

  // Blob URL loading
  useEffect(() => {
    if (!doc) return
    setLoadError(false); setIframeLoading(true); setBlobUrl(null)
    fetch(`/api/portal/${shareLink}/documents/${doc.id}`)
      .then(res => { if (!res.ok) throw new Error(); return res.blob() })
      .then(blob => setBlobUrl(URL.createObjectURL(blob)))
      .catch(() => { setLoadError(true); setIframeLoading(false) })
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [doc?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {doc && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl"
            style={{ width: 'min(780px, 92vw)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{doc.type} · {doc.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {allowDownloads && (
                  <button
                    onClick={() => onDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 bg-white transition-all disabled:opacity-40"
                  >
                    {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Download
                  </button>
                )}
                <a href={doc.cloudinaryPdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 bg-white transition-all">
                  <ExternalLink className="h-3.5 w-3.5" /> Open tab
                </a>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* PDF area — watermark ONLY lives here */}
            <div className="flex-1 relative bg-gray-100 overflow-hidden">
              {enableWatermark && <Watermark email={visitorEmail} />}

              {iframeLoading && !loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <div className="h-9 w-9 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading document…</p>
                  </div>
                </div>
              )}

              {loadError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-4">Failed to load document.</p>
                    <a href={doc.cloudinaryPdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all mx-auto w-fit">
                      <ExternalLink className="h-4 w-4" /> Open in new tab
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  key={doc.id}
                  src={blobUrl ? `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0` : undefined}
                  className="w-full h-full border-0" title={doc.name}
                  onLoad={() => { if (blobUrl) setIframeLoading(false) }}
                  onError={() => { setLoadError(true); setIframeLoading(false) }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Comment Thread (unchanged) ────────────────────────────────────────────────
function CommentThread({ docId, docName, visitorEmail, shareLink }: {
  docId: string; docName: string; visitorEmail: string; shareLink: string
}) {
  const [comments, setComments]   = useState<Comment[]>([])
  const [message, setMessage]     = useState("")
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchComments()
    pollRef.current = setInterval(fetchComments, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [docId])

  const fetchComments = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const url = new URL(`/api/portal/${shareLink}/comments`, window.location.origin)
      url.searchParams.set('documentId', docId)
      url.searchParams.set('email', visitorEmail)
      const res = await fetch(url.toString(), { credentials: 'include' })
      if (res.ok) { const data = await res.json(); if (data.success) setComments(data.comments || []) }
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false) }
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/comments`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, documentName: docName, message: message.trim(), email: visitorEmail })
      })
      const data = await res.json()
      if (data.success) { setMessage(""); setSent(true); await fetchComments(); setTimeout(() => setSent(false), 2000) }
    } catch { /* silent */ } finally { setSending(false) }
  }

  const hasReplies = comments.some(c => c.reply)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Questions & Notes</p>
        <button onClick={() => fetchComments(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {hasReplies ? 'Refresh' : 'Check for replies'}
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id}>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-700">{c.author.charAt(0).toUpperCase()}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-600 truncate">{c.author}</p>
                  <p className="text-xs text-gray-400 ml-auto flex-shrink-0">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-sm text-gray-800">{c.message}</p>
              </div>
              {c.reply ? (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="ml-4 mt-1.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">O</span>
                    </div>
                    <p className="text-xs font-semibold text-blue-700">Owner replied</p>
                    {c.repliedAt && <p className="text-xs text-blue-400 ml-auto flex-shrink-0">
                      {new Date(c.repliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>}
                  </div>
                  <p className="text-sm text-blue-900">{c.reply}</p>
                </motion.div>
              ) : (
                <div className="ml-4 mt-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 italic">Awaiting reply from owner…</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">No questions yet. Ask anything about this document.</p>
      )}
      <div className="flex flex-col gap-2">
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask a question… (Enter to send)"
          rows={3}
          className="w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Replies appear here automatically</p>
          <button onClick={handleSend} disabled={sending || !message.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40">
            {sent ? <><Check className="h-3.5 w-3.5" /> Sent</> : sending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ask Question Modal (unchanged) ────────────────────────────────────────────
function AskQuestionModal({ onClose, visitorEmail, shareLink, spaceName }: {
  onClose: () => void; visitorEmail: string; shareLink: string; spaceName: string
}) {
  const [message, setMessage]   = useState("")
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchGeneralComments()
    pollRef.current = setInterval(fetchGeneralComments, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const fetchGeneralComments = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/comments?documentId=general`, { credentials: 'include' })
      if (res.ok) { const data = await res.json(); if (data.success) setComments(data.comments || []) }
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false) }
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/comments`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: 'general', documentName: 'General Question', message: message.trim(), email: visitorEmail })
      })
      if (res.ok) { setSent(true); setMessage(""); await fetchGeneralComments(); setTimeout(() => setSent(false), 2000) }
    } catch { /* silent */ } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Ask a question</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchGeneralComments(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4 flex-shrink-0">
          Ask anything about <span className="font-medium text-gray-700">{spaceName}</span> — the owner will be notified.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2 flex-shrink-0"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 mb-4 overflow-y-auto flex-1 pr-1">
            {comments.map(c => (
              <div key={c.id}>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-700">{c.author.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-600 truncate">{c.author}</p>
                    <p className="text-xs text-gray-400 ml-auto flex-shrink-0">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800">{c.message}</p>
                </div>
                {c.reply ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="ml-4 mt-1.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">O</span>
                      </div>
                      <p className="text-xs font-semibold text-blue-700">Owner replied</p>
                      {c.repliedAt && <p className="text-xs text-blue-400 ml-auto flex-shrink-0">
                        {new Date(c.repliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>}
                    </div>
                    <p className="text-sm text-blue-900">{c.reply}</p>
                  </motion.div>
                ) : (
                  <div className="ml-4 mt-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 italic">Awaiting reply from owner…</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex-shrink-0 pt-3 border-t border-gray-100">
          <textarea autoFocus={comments.length === 0} rows={4} value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type your question here…"
            className="w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 transition-all">Close</button>
            <button onClick={handleSend} disabled={sending || !message.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              {sent ? <><Check className="h-3.5 w-3.5" /> Sent!</> : sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send Question</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Folder Tree Item (unchanged) ───────────────────────────────────────────────
function FolderTreeItem({ folder, allFolders, depth, selectedFolderId, onSelect, getDocCount }: {
  folder: FolderType; allFolders: FolderType[]; depth: number
  selectedFolderId: string | null; onSelect: (id: string) => void; getDocCount: (id: string) => number
}) {
  const children   = allFolders.filter(f => f.parentId === folder.id)
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = children.length > 0
  const isSelected  = selectedFolderId === folder.id
  const docCount    = getDocCount(folder.id)

  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (hasChildren) setExpanded(!expanded) }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 text-gray-400">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ) : <span className="w-3.5 flex-shrink-0" />}
        <Folder className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-blue-400'}`} />
        <span className="text-sm truncate flex-1">{folder.index != null ? `${folder.index} ` : ''}{folder.name}</span>
        {docCount > 0 && <span className="text-xs text-gray-400 flex-shrink-0">{docCount}</span>}
      </button>
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            {children.map(child => (
              <FolderTreeItem key={child.id} folder={child} allFolders={allFolders}
                depth={depth + 1} selectedFolderId={selectedFolderId}
                onSelect={onSelect} getDocCount={getDocCount} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function PortalPage() {
  const params    = useParams()
  const shareLink = params.shareLink as string

  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null)

  // Gate state
  const [step, setStep]                 = useState<Step>('email')
  const [activeSteps, setActiveSteps]   = useState<Step[]>(['email'])
  const [visitorEmail, setVisitorEmail] = useState("")
  const [password, setPassword]         = useState("")
  const [ndaAccepted, setNdaAccepted]   = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [gateError, setGateError]       = useState("")
  const [signingNDA, setSigningNDA]     = useState(false)
  const [showPasswordText, setShowPasswordText] = useState(false)
  const [requiresEmail, setRequiresEmail]       = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [requiresOtp, setRequiresOtp]           = useState(false)  // ← NEW

  // OTP state
  const [otpCode, setOtpCode]         = useState("")          // ← NEW
  const [otpSending, setOtpSending]   = useState(false)       // ← NEW
  const [otpVerifying, setOtpVerifying] = useState(false)     // ← NEW
  const [otpError, setOtpError]       = useState("")          // ← NEW
  const [otpCountdown, setOtpCountdown] = useState(0)         // ← NEW
  const countdownRef = useRef<NodeJS.Timeout | null>(null)    // ← NEW

  // Portal UI
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]           = useState("")
  const [showAskModal, setShowAskModal]         = useState(false)
  const [openComments, setOpenComments]         = useState<Set<string>>(new Set())
  const [downloadingId, setDownloadingId]       = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen]           = useState(true)
  const [viewingDoc, setViewingDoc]             = useState<Doc | null>(null)

  useEffect(() => { fetchPortalData() }, [shareLink])

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/portal/${shareLink}`, { credentials: 'include' })
      if (!res.ok) {
        setError(res.status === 404 ? "This link is invalid or has expired." : "Access denied.")
        setLoading(false); return
      }
      const data = await res.json()
      if (data.success) {
        setSpaceData(data.space)
        setRequiresEmail(data.requiresEmail ?? true)
        setRequiresPassword(data.requiresPassword ?? false)
        setRequiresOtp(data.requiresOtp ?? false)           // ← NEW

        const steps: Step[] = []
        if (data.requiresEmail)     steps.push('email')
        if (data.requiresOtp)       steps.push('otp')      // ← NEW
        if (data.requiresPassword)  steps.push('password')
        if (data.space.ndaRequired) steps.push('nda')
        steps.push('docs')
        setActiveSteps(steps)
        setStep(steps[0])

        if (data.space.folders?.length > 0) {
          const roots = data.space.folders.filter((f: FolderType) => !f.parentId)
          if (roots.length > 0) setSelectedFolderId(roots[0].id)
        }
      } else {
        setError(data.error || "Failed to load space")
      }
    } catch {
      setError("Failed to load. Please check your connection.")
    } finally { setLoading(false) }
  }

  const advanceStep = () => {
    const idx = activeSteps.indexOf(step)
    if (idx < activeSteps.length - 1) setStep(activeSteps[idx + 1])
  }

  // ── OTP helpers ──────────────────────────────────────────────────────────────
  const startOtpCountdown = () => {
    setOtpCountdown(60)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const sendOtp = async (email: string): Promise<boolean> => {
    const res = await fetch(`/api/portal/${shareLink}/otp`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (data.success) { startOtpCountdown(); return true }
    setGateError(data.error || 'Failed to send verification code')
    return false
  }

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return
    setOtpSending(true); setOtpError("")
    try {
      const res = await fetch(`/api/portal/${shareLink}/otp`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail.trim() })
      })
      const data = await res.json()
      if (data.success) { startOtpCountdown(); setOtpCode("") }
      else setOtpError(data.error || 'Failed to resend')
    } catch { setOtpError('Connection error') }
    finally { setOtpSending(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpVerifying) return
    if (otpCode.length !== 6) { setOtpError("Enter the 6-digit code"); return }
    setOtpVerifying(true); setOtpError("")
    try {
      const res = await fetch(`/api/portal/${shareLink}/otp`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail.trim(), code: otpCode.trim() })
      })
      const data = await res.json()
      if (data.verified) {
        if (!requiresPassword) {
          const vRes = await fetch(`/api/portal/${shareLink}/verify`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: visitorEmail.trim(), password: '' })
          })
          const vData = await vRes.json()
          if (vData.success) { trackVisit(); advanceStep() }
          else setOtpError(vRes.status === 403 ? "Email not authorized. Contact the sender." : vData.error || "Access denied.")
        } else {
          advanceStep()
        }
      } else {
        setOtpError(data.error || 'Incorrect code')
      }
    } catch { setOtpError('Connection error. Please try again.') }
    finally { setOtpVerifying(false) }
  }

  // ── Gate handlers ─────────────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateError("")

    if (step === 'email') {
      if (!visitorEmail.trim()) { setGateError("Email is required"); return }

      // If OTP required — send code then advance to OTP step
      if (requiresOtp) {
        setSubmitting(true)
        try {
          const ok = await sendOtp(visitorEmail.trim())
          if (ok) advanceStep()
        } finally { setSubmitting(false) }
        return
      }

      // No OTP — existing flow
      if (!requiresPassword) {
        setSubmitting(true)
        try {
          const res = await fetch(`/api/portal/${shareLink}/verify`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: visitorEmail.trim(), password: '' })
          })
          const data = await res.json()
          if (data.success) { trackVisit(); advanceStep() }
          else setGateError(res.status === 403 ? "This email is not authorized. Contact the sender." : data.error || "Access denied.")
        } catch { setGateError("Connection error. Please try again.") }
        finally { setSubmitting(false) }
        return
      }
      advanceStep(); return
    }

    if (step === 'password') {
      if (!password.trim()) { setGateError("Password is required"); return }
      setSubmitting(true)
      try {
        const res = await fetch(`/api/portal/${shareLink}/verify`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: visitorEmail.trim(), password: password.trim() })
        })
        const data = await res.json()
        if (data.success) { trackVisit(); advanceStep() }
        else setGateError(res.status === 403 ? "This email is not authorized. Contact the sender." : res.status === 401 ? "Incorrect password." : data.error || "Access denied.")
      } catch { setGateError("Connection error. Please try again.") }
      finally { setSubmitting(false) }
    }
  }

  const handleSignNDA = async () => {
    if (!ndaAccepted) return
    setSigningNDA(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/nda-sign`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail })
      })
      const data = await res.json()
      if (data.success) advanceStep()
      else setGateError(data.error || "Failed to sign NDA")
    } catch { setGateError("Failed to sign NDA. Please try again.") }
    finally { setSigningNDA(false) }
  }

  const trackVisit = async () => {
    try {
      await fetch(`/api/portal/${shareLink}/track`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail, event: 'portal_opened' })
      })
    } catch { /* silent */ }
  }

  const trackDocView = async (docId: string, docName: string) => {
    try {
      await fetch(`/api/portal/${shareLink}/track`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail, event: 'document_viewed', documentId: docId, documentName: docName })
      })
    } catch { /* silent */ }
  }

  const handleView = (doc: Doc) => { trackDocView(doc.id, doc.name); setViewingDoc(doc) }

  const handleDownload = async (doc: Doc) => {
    if (!spaceData?.allowDownloads) return
    setDownloadingId(doc.id)
    try {
      // ← Pass email so the server can bake the watermark into the PDF
      const res = await fetch(
        `/api/portal/${shareLink}/documents/${doc.id}?download=true&email=${encodeURIComponent(visitorEmail)}`
      )
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = doc.name
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)
      await fetch(`/api/portal/${shareLink}/track`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail, event: 'download', documentId: doc.id, documentName: doc.name })
      })
    } catch { /* silent */ }
    finally { setDownloadingId(null) }
  }

  const getDocCount = (folderId: string) => (spaceData?.documents || []).filter(d => d.folderId === folderId).length
  const getDocsForPanel = () => {
    let docs = spaceData?.documents || []
    if (selectedFolderId) docs = docs.filter(d => d.folderId === selectedFolderId)
    else docs = docs.filter(d => !d.folderId)
    if (searchQuery) docs = docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return docs
  }

  const rootFolders = (spaceData?.folders || []).filter(f => !f.parentId && f.id && f.name && f.name !== 'null')

  // ── Loading / Error ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-9 w-9 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading secure portal…</p>
      </div>
    </div>
  )

  if (error || !spaceData) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Link Unavailable</h2>
        <p className="text-sm text-gray-500">{error || "This link is no longer active."}</p>
      </div>
    </div>
  )

  const accent = spaceData.branding.primaryColor || '#0061FF'

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: EMAIL
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'email') return (
    <GateCard>
      {activeSteps.filter(s => s !== 'docs').length > 1 && (
        <StepDots current="email" steps={activeSteps.filter(s => s !== 'docs')} />
      )}
      <div className="text-center mb-6">
        {spaceData.branding.logoUrl ? (
          <img src={spaceData.branding.logoUrl} alt="Logo" className="h-9 mx-auto mb-4" />
        ) : (
          <div className="h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accent }}>
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
        )}
        <h1 className="text-lg font-semibold text-gray-900">{spaceData.name}</h1>
        {spaceData.branding.companyName && <p className="text-xs text-gray-400 mt-0.5">{spaceData.branding.companyName}</p>}
      </div>
      <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
        {spaceData.branding.welcomeMessage || "Enter your email to access these documents."}
      </p>
      {gateError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{gateError}</p>
        </div>
      )}
      <form onSubmit={handleVerify} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="email" required autoFocus placeholder="your@email.com"
            value={visitorEmail} onChange={e => { setVisitorEmail(e.target.value); setGateError("") }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all" />
        </div>
        <button type="submit" disabled={submitting || !visitorEmail.trim()}
          className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: accent }}>
          {submitting
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Sending code…</span>
            : requiresOtp ? "Send verification code →" : "Continue →"}
        </button>
      </form>
      <p className="text-xs text-gray-400 text-center mt-4">
        {requiresOtp ? '🔐 A 6-digit code will be sent to verify your email.' : '🔒 Your email is only used to verify access.'}
      </p>
    </GateCard>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: OTP  ← NEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'otp') return (
    <GateCard>
      <StepDots current="otp" steps={activeSteps.filter(s => s !== 'docs')} />

      <div className="text-center mb-6">
        <div className="h-14 w-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-2xl">📬</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-800">{visitorEmail}</span>
        </p>
      </div>

      {otpError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{otpError}</p>
        </div>
      )}

      {/* 6-digit input */}
      <div className="mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          placeholder="000000"
          value={otpCode}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6)
            setOtpCode(val)
            setOtpError("")
            // Auto-submit when 6 digits entered
            if (val.length === 6) setTimeout(() => handleVerifyOtp(), 100)
          }}
          onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp() }}
          className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 px-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 transition-all bg-gray-50 placeholder:text-gray-200"
        />
        <p className="text-xs text-gray-400 text-center mt-2">Code expires in 10 minutes</p>
      </div>

      <button
        onClick={handleVerifyOtp}
        disabled={otpVerifying || otpCode.length !== 6}
        className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2 mb-4"
        style={{ backgroundColor: accent }}
      >
        {otpVerifying
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
          : <><CheckCircle2 className="h-4 w-4" /> Verify & Continue</>}
      </button>

      {/* Resend */}
      <div className="text-center mb-3">
        {otpCountdown > 0 ? (
          <p className="text-xs text-gray-400">
            Resend in <span className="font-semibold text-gray-600 tabular-nums">{otpCountdown}s</span>
          </p>
        ) : (
          <button onClick={handleResendOtp} disabled={otpSending}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors inline-flex items-center gap-1">
            {otpSending ? <><Loader2 className="h-3 w-3 animate-spin" /> Sending…</> : <><RefreshCw className="h-3 w-3" /> Resend code</>}
          </button>
        )}
      </div>

      <button onClick={() => { setStep('email'); setOtpCode(""); setOtpError("") }}
        className="w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Use a different email
      </button>
    </GateCard>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: PASSWORD
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'password') return (
    <GateCard>
      <StepDots current="password" steps={activeSteps.filter(s => s !== 'docs')} />
      <div className="text-center mb-6">
        <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-5 w-5 text-gray-700" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Password Required</h1>
        <p className="text-sm text-gray-500 mt-1">Enter the password provided by the sender</p>
      </div>
      {gateError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{gateError}</p>
        </div>
      )}
      <form onSubmit={handleVerify} className="space-y-3">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type={showPasswordText ? "text" : "password"} required autoFocus placeholder="Enter password"
            value={password} onChange={e => { setPassword(e.target.value); setGateError("") }}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all" />
          <button type="button" onClick={() => setShowPasswordText(!showPasswordText)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <Eye className="h-4 w-4" />
          </button>
        </div>
        <button type="submit" disabled={submitting || !password.trim()}
          className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: accent }}>
          {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Checking…</span> : "Unlock →"}
        </button>
      </form>
      <button onClick={() => setStep('email')} className="w-full text-xs text-gray-400 hover:text-gray-600 mt-4 flex items-center justify-center gap-1 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
    </GateCard>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: NDA
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'nda') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl overflow-hidden">
        <div className="px-7 pt-7 pb-4">
          <StepDots current="nda" steps={activeSteps.filter(s => s !== 'docs')} />
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileSignature className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Non-Disclosure Agreement</h2>
              <p className="text-sm text-gray-500">Review and sign before accessing documents</p>
            </div>
          </div>
        </div>
        <div className="mx-7 mb-4 rounded-xl border border-gray-200 overflow-hidden bg-gray-50" style={{ height: 360 }}>
          {spaceData.ndaDocumentUrl ? (
            <iframe src={spaceData.ndaDocumentUrl} className="w-full h-full" title="NDA" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center"><FileText className="h-10 w-10 mx-auto mb-2" /><p className="text-sm">NDA Document</p></div>
            </div>
          )}
        </div>
        {gateError && (
          <div className="mx-7 mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{gateError}</p>
          </div>
        )}
        <div className="mx-7 mb-4">
          <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-all">
            <div className="mt-0.5 flex-shrink-0">
              <input type="checkbox" checked={ndaAccepted} onChange={e => setNdaAccepted(e.target.checked)} className="sr-only" />
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${ndaAccepted ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                {ndaAccepted && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">I have read and agree to the terms of this NDA</p>
              <p className="text-xs text-gray-500 mt-0.5">Legally binding. Your email, IP, and timestamp will be recorded.</p>
            </div>
          </label>
        </div>
        <div className="px-7 pb-7 flex gap-3">
          <button onClick={() => window.history.back()}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 transition-all">
            Decline & Exit
          </button>
          <button onClick={handleSignNDA} disabled={!ndaAccepted || signingNDA}
            className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: accent }}>
            {signingNDA ? <><Loader2 className="h-4 w-4 animate-spin" />Signing…</> : <><FileSignature className="h-4 w-4" />Sign & Access Documents</>}
          </button>
        </div>
      </motion.div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN PORTAL
  // ══════════════════════════════════════════════════════════════════════════════
  const panelDocs      = getDocsForPanel()
  const selectedFolder = spaceData.folders.find(f => f.id === selectedFolderId)

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Navbar */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 bg-white z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          {spaceData.branding.logoUrl ? (
            <img src={spaceData.branding.logoUrl} alt="Logo" className="h-7" />
          ) : (
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent }}>
              <FolderOpen className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{spaceData.name}</span>
            {spaceData.branding.companyName && <span className="text-sm text-gray-400">· {spaceData.branding.companyName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input placeholder="Search this space" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 focus:w-64 transition-all" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {spaceData.allowQA && (
            <button onClick={() => setShowAskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: accent }}>
              <MessageSquare className="h-4 w-4" /> Ask a question
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-gray-200 overflow-y-auto transition-all duration-200 bg-white`}>
          <div className="p-3">
            <button onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all mb-1 ${selectedFolderId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-400" /> <span>Home</span>
            </button>
            <div className="space-y-0.5">
              {rootFolders.map(folder => (
                <FolderTreeItem key={folder.id} folder={folder} allFolders={spaceData.folders}
                  depth={0} selectedFolderId={selectedFolderId}
                  onSelect={setSelectedFolderId} getDocCount={getDocCount} />
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-1.5 text-sm text-gray-500">
            <button onClick={() => setSelectedFolderId(null)} className="hover:text-gray-900 transition-colors">Home</button>
            {selectedFolder && (<><ChevronRight className="h-3.5 w-3.5 text-gray-300" /><span className="text-gray-900 font-medium">{selectedFolder.name}</span></>)}
          </div>
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">{selectedFolder ? selectedFolder.name : 'Home'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{panelDocs.length} {panelDocs.length === 1 ? 'document' : 'documents'}</p>
          </div>
          <div className="px-6 pb-8">
            {panelDocs.length === 0 ? (
              <div className="py-16 text-center">
                <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">{searchQuery ? 'No documents match your search' : 'No documents in this folder'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {panelDocs.map((doc, i) => {
                  const isCommentOpen = openComments.has(doc.id)
                  return (
                    <motion.div key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <span className="text-xs text-gray-300 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{doc.type} · {doc.size}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => handleView(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 hover:text-gray-900 bg-white transition-all">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {spaceData.allowDownloads && (
                            <button onClick={() => handleDownload(doc)} disabled={downloadingId === doc.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-gray-400 bg-white transition-all disabled:opacity-40">
                              {downloadingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              Download
                            </button>
                          )}
                          {spaceData.allowQA && (
                            <button
                              onClick={() => setOpenComments(prev => { const next = new Set(prev); next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id); return next })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${isCommentOpen ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-700 border-gray-200 bg-white hover:border-gray-400'}`}>
                              <MessageSquare className="h-3.5 w-3.5" /> Q&A
                            </button>
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {isCommentOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                            <div className="px-4 pb-4">
                              <CommentThread docId={doc.id} docName={doc.name} visitorEmail={visitorEmail} shareLink={shareLink} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Doc Viewer Drawer */}
      <DocViewerDrawer
        doc={viewingDoc} onClose={() => setViewingDoc(null)}
        shareLink={shareLink} allowDownloads={spaceData.allowDownloads}
        enableWatermark={spaceData.enableWatermark}
        onDownload={handleDownload} downloadingId={downloadingId}
        visitorEmail={visitorEmail}
      />

      {/* Ask Modal */}
      <AnimatePresence>
        {showAskModal && (
          <AskQuestionModal onClose={() => setShowAskModal(false)}
            visitorEmail={visitorEmail} shareLink={shareLink} spaceName={spaceData.name} />
        )}
      </AnimatePresence>
    </div>
  )
}