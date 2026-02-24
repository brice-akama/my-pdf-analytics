"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  FolderOpen, FileText, Eye, Download, Lock, Mail, AlertCircle,
  Loader2, CheckCircle2, ChevronRight, ChevronDown, MessageSquare,
  Send, FileSignature, X, Folder, Home, Search, Clock, Shield,
  ArrowLeft, ExternalLink, Check
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type Doc = {
  id: string
  name: string
  type: string
  size: string
  cloudinaryPdfUrl: string
  folderId: string | null
}

type FolderType = { id: string; name: string; documentCount: number }

type Comment = {
  id: string
  documentId: string
  documentName: string
  author: string
  message: string
  createdAt: string
  reply?: string
}

type SpaceData = {
  name: string
  description: string
  allowDownloads: boolean
  ndaRequired: boolean
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

// ─── Step indicator ───────────────────────────────────────────────────────────
type Step = 'email' | 'password' | 'nda' | 'docs'

const STEP_ORDER: Step[] = ['email', 'password', 'nda', 'docs']

function StepDots({ current, steps }: { current: Step; steps: Step[] }) {
  const idx = steps.indexOf(current)
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < idx ? 'w-6 bg-gray-900' :
            i === idx ? 'w-8 bg-gray-900' :
            'w-4 bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Gate card wrapper ────────────────────────────────────────────────────────
function GateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-8 w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  )
}

// ─── Comment thread component ─────────────────────────────────────────────────
function CommentThread({
  docId, docName, visitorEmail, shareLink
}: {
  docId: string; docName: string; visitorEmail: string; shareLink: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [docId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/portal/${shareLink}/comments?documentId=${docId}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setComments(data.comments || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, documentName: docName, message: message.trim(), email: visitorEmail })
      })
      const data = await res.json()
      if (data.success) {
        setMessage("")
        setSent(true)
        await fetchComments()
        setTimeout(() => setSent(false), 3000)
      }
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Questions & Notes
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading…
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">{c.author}</p>
                <p className="text-sm text-gray-800">{c.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {c.reply && (
                <div className="ml-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Owner replied</p>
                  <p className="text-sm text-blue-900">{c.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">No questions yet. Ask anything about this document.</p>
      )}

      <div className="flex gap-2">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask a question or leave a note…"
          className="flex-1 text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {sent ? <Check className="h-4 w-4" /> : sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PortalPage() {
  const params = useParams()
  const shareLink = params.shareLink as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null)

  // Gate state
  const [step, setStep] = useState<Step>('email')
  const [activeSteps, setActiveSteps] = useState<Step[]>(['email'])
  const [visitorEmail, setVisitorEmail] = useState("")
  const [password, setPassword] = useState("")
  const [ndaAccepted, setNdaAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [gateError, setGateError] = useState("")
  const [signingNDA, setSigningNDA] = useState(false)
  const [showPasswordText, setShowPasswordText] = useState(false)

  // Requires flags from API
  const [requiresEmail, setRequiresEmail] = useState(true)
  const [requiresPassword, setRequiresPassword] = useState(false)

  // Docs UI
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [openComments, setOpenComments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // ── Fetch portal data ────────────────────────────────────────────────────────
  useEffect(() => { fetchPortalData() }, [shareLink])

  const fetchPortalData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/portal/${shareLink}`, { credentials: 'include' })
      if (!res.ok) {
        setError(res.status === 404 ? "This link is invalid or has expired." : "Access denied.")
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.success) {
        setSpaceData(data.space)
        setRequiresEmail(data.requiresEmail ?? true)
        setRequiresPassword(data.requiresPassword ?? false)

        // Build step sequence
        const steps: Step[] = []
        if (data.requiresEmail) steps.push('email')
        if (data.requiresPassword) steps.push('password')
        if (data.space.ndaRequired) steps.push('nda')
        steps.push('docs')
        setActiveSteps(steps)
        setStep(steps[0])
      } else {
        setError(data.error || "Failed to load space")
      }
    } catch {
      setError("Failed to load. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const advanceStep = () => {
    const idx = activeSteps.indexOf(step)
    if (idx < activeSteps.length - 1) setStep(activeSteps[idx + 1])
  }

  // ── Submit email/password ────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateError("")
    if (requiresEmail && !visitorEmail.trim()) { setGateError("Email is required"); return }
    if (step === 'password' && !password.trim()) { setGateError("Password is required"); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/${shareLink}/verify`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitorEmail.trim(), password: password.trim() })
      })
      const data = await res.json()
      if (data.success) {
        trackVisit()
        advanceStep()
      } else {
        setGateError(res.status === 403
          ? "This email is not authorized. Contact the sender."
          : res.status === 401
          ? "Incorrect password. Please try again."
          : data.error || "Access denied.")
      }
    } catch { setGateError("Connection error. Please try again.") }
    finally { setSubmitting(false) }
  }

  // ── Sign NDA ─────────────────────────────────────────────────────────────────
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

  const handleDownload = async (doc: Doc) => {
    if (!spaceData?.allowDownloads) return
    setDownloadingId(doc.id)
    try {
      const res = await fetch(`/api/portal/${shareLink}/documents/${doc.id}?download=true`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = doc.name
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { /* silent fail */ }
    finally { setDownloadingId(null) }
  }

  const handleView = async (doc: Doc) => {
    trackDocView(doc.id, doc.name)
    const win = window.open('about:blank', '_blank')
    try {
      const res = await fetch(`/api/portal/${shareLink}/documents/${doc.id}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      if (win) win.location.href = url
    } catch { if (win) win.close() }
  }

  const toggleComment = (docId: string) => {
    setOpenComments(prev => {
      const next = new Set(prev)
      next.has(docId) ? next.delete(docId) : next.add(docId)
      return next
    })
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(folderId) ? next.delete(folderId) : next.add(folderId)
      return next
    })
  }

  const getDocsInFolder = (folderId: string | null) =>
    (spaceData?.documents || []).filter(d =>
      folderId === null ? !d.folderId : d.folderId === folderId
    ).filter(d =>
      !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading secure portal…</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !spaceData) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Unavailable</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error || "This link is no longer active."}</p>
        </div>
      </div>
    )
  }

  const accent = spaceData.branding.primaryColor || '#111111'

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: EMAIL
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'email') {
    return (
      <GateCard>
        {activeSteps.length > 2 && <StepDots current="email" steps={activeSteps.filter(s => s !== 'docs')} />}

        {/* Branding */}
        <div className="text-center mb-8">
          {spaceData.branding.logoUrl ? (
            <img src={spaceData.branding.logoUrl} alt="Logo" className="h-10 mx-auto mb-4" />
          ) : (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: accent }}>
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
          )}
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{spaceData.name}</h1>
          {spaceData.branding.companyName && (
            <p className="text-sm text-gray-500">{spaceData.branding.companyName}</p>
          )}
        </div>

        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          {spaceData.branding.welcomeMessage || "Enter your email to access the documents shared with you."}
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
            <input
              type="email" required autoFocus
              placeholder="your@email.com"
              value={visitorEmail}
              onChange={e => { setVisitorEmail(e.target.value); setGateError("") }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            />
          </div>
          <button
            type="submit" disabled={submitting || !visitorEmail.trim()}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</span>
            ) : "Continue →"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5">
          🔒 Your email is only used to verify access to this secure portal.
        </p>
      </GateCard>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: PASSWORD
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'password') {
    return (
      <GateCard>
        {activeSteps.length > 2 && <StepDots current="password" steps={activeSteps.filter(s => s !== 'docs')} />}

        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-gray-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Password Required</h1>
          <p className="text-sm text-gray-500">Enter the password provided by the sender</p>
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
            <input
              type={showPasswordText ? "text" : "password"}
              required autoFocus placeholder="Enter password"
              value={password}
              onChange={e => { setPassword(e.target.value); setGateError("") }}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all font-mono"
            />
            <button type="button" onClick={() => setShowPasswordText(!showPasswordText)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <Eye className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit" disabled={submitting || !password.trim()}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {submitting
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Checking…</span>
              : "Unlock Access →"}
          </button>
        </form>

        <button onClick={() => setStep('email')} className="w-full text-xs text-gray-400 hover:text-gray-600 mt-4 flex items-center justify-center gap-1 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
      </GateCard>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // GATE: NDA
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 'nda') {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-gray-100 w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <StepDots current="nda" steps={activeSteps.filter(s => s !== 'docs')} />
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <FileSignature className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Non-Disclosure Agreement</h2>
                <p className="text-sm text-gray-500">Review and sign before accessing documents</p>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="mx-8 mb-4 rounded-xl border border-gray-200 overflow-hidden bg-gray-50" style={{ height: 380 }}>
            {spaceData.ndaDocumentUrl ? (
              <iframe src={spaceData.ndaDocumentUrl} className="w-full h-full" title="NDA Document" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">NDA Document</p>
                </div>
              </div>
            )}
          </div>

          {gateError && (
            <div className="mx-8 mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{gateError}</p>
            </div>
          )}

          {/* Acceptance */}
          <div className="mx-8 mb-4">
            <label className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-all">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={ndaAccepted}
                  onChange={e => setNdaAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${ndaAccepted ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                  {ndaAccepted && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">I have read and agree to the terms of this NDA</p>
                <p className="text-xs text-gray-500 mt-0.5">Your signature will be timestamped with your IP and email address. This is a legally binding agreement.</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:border-gray-400 transition-all"
            >
              Decline & Exit
            </button>
            <button
              onClick={handleSignNDA}
              disabled={!ndaAccepted || signingNDA}
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
              style={{ backgroundColor: accent }}
            >
              {signingNDA
                ? <><Loader2 className="h-4 w-4 animate-spin" />Signing…</>
                : <><FileSignature className="h-4 w-4" />Sign & Access Documents</>}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN PORTAL: Documents + Folders + Comments
  // ══════════════════════════════════════════════════════════════════════════════
  const unfiledDocs = getDocsInFolder(null)
  const totalDocs = spaceData.documents.length

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {spaceData.branding.logoUrl ? (
              <img src={spaceData.branding.logoUrl} alt="Logo" className="h-7" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{spaceData.name}</p>
              {spaceData.branding.companyName && (
                <p className="text-xs text-gray-400">{spaceData.branding.companyName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure portal</span>
            </div>
            {visitorEmail && (
              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <Mail className="h-3 w-3" />
                {visitorEmail}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Welcome banner ── */}
        {spaceData.description && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm"
          >
            <p className="text-sm text-gray-700 leading-relaxed">{spaceData.description}</p>
          </motion.div>
        )}

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-6 mb-6 text-sm text-gray-500"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <strong className="text-gray-900">{totalDocs}</strong> documents
          </span>
          <span className="flex items-center gap-1.5">
            <Folder className="h-4 w-4" />
            <strong className="text-gray-900">{spaceData.folders.length}</strong> folders
          </span>
          {spaceData.allowDownloads && (
            <span className="flex items-center gap-1.5 text-green-600">
              <Download className="h-4 w-4" />
              Downloads enabled
            </span>
          )}
        </motion.div>

        {/* ── Search ── */}
        {totalDocs > 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mb-6"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search documents…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* ── Folders ── */}
        <div className="space-y-3">
          {spaceData.folders.map((folder, fi) => {
            const folderDocs = getDocsInFolder(folder.id)
            const isExpanded = expandedFolders.has(folder.id)

            return (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: fi * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <Folder className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{folder.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{folderDocs.length} document{folderDocs.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {/* Folder documents */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      {folderDocs.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">
                          No documents in this folder
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {folderDocs.map(doc => (
                            <DocRow
                              key={doc.id}
                              doc={doc}
                              allowDownloads={spaceData.allowDownloads}
                              downloadingId={downloadingId}
                              openComments={openComments}
                              visitorEmail={visitorEmail}
                              shareLink={shareLink}
                              accent={accent}
                              onView={() => handleView(doc)}
                              onDownload={() => handleDownload(doc)}
                              onToggleComment={() => toggleComment(doc.id)}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* ── Unfiled documents ── */}
          {unfiledDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: spaceData.folders.length * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Documents</p>
                  <p className="text-xs text-gray-500">{unfiledDocs.length} file{unfiledDocs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {unfiledDocs.map(doc => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    allowDownloads={spaceData.allowDownloads}
                    downloadingId={downloadingId}
                    openComments={openComments}
                    visitorEmail={visitorEmail}
                    shareLink={shareLink}
                    accent={accent}
                    onView={() => handleView(doc)}
                    onDownload={() => handleDownload(doc)}
                    onToggleComment={() => toggleComment(doc.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Empty state ── */}
          {totalDocs === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-500">No documents yet</p>
              <p className="text-xs text-gray-400 mt-1">Documents will appear here when added by the sender.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">🔒 Secure document portal — do not share this link</p>
          <p className="text-xs text-gray-300">Powered by DocMetrics</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Doc Row component ────────────────────────────────────────────────────────
function DocRow({
  doc, allowDownloads, downloadingId, openComments, visitorEmail, shareLink, accent,
  onView, onDownload, onToggleComment
}: {
  doc: Doc
  allowDownloads: boolean
  downloadingId: string | null
  openComments: Set<string>
  visitorEmail: string
  shareLink: string
  accent: string
  onView: () => void
  onDownload: () => void
  onToggleComment: () => void
}) {
  const isCommentOpen = openComments.has(doc.id)

  return (
    <div className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* File icon */}
        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-red-500" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{doc.type} · {doc.size}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 bg-white rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>

          {allowDownloads && (
            <button
              onClick={onDownload}
              disabled={downloadingId === doc.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 bg-white rounded-lg hover:border-gray-400 hover:text-gray-900 transition-all disabled:opacity-40"
            >
              {downloadingId === doc.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              Download
            </button>
          )}

          <button
            onClick={onToggleComment}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
              isCommentOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-700 border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Q&A
          </button>
        </div>
      </div>

      {/* Comment thread */}
      <AnimatePresence>
        {isCommentOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-3">
              <CommentThread
                docId={doc.id}
                docName={doc.name}
                visitorEmail={visitorEmail}
                shareLink={shareLink}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}