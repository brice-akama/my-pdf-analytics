// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/RequestFilesDrawer.tsx
// A self-contained drawer that creates a space-linked file request.
// Import and drop into your spaces/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Inbox, Plus, Trash2, Calendar, FileText,
  CheckCircle2, Copy, AlertCircle, Loader2, Link2,
  ChevronRight, Mail, Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  open: boolean
  onClose: () => void
  spaceId: string
  spaceName: string
  folderId: string
  folderName: string
}

type Step = "form" | "success"

// ── Component ─────────────────────────────────────────────────────────────────
export function RequestFilesDrawer({
  open,
  onClose,
  spaceId,
  spaceName,
  folderId,
  folderName,
}: Props) {
  // Form state
  const [step, setStep]                   = useState<Step>("form")
  const [title, setTitle]                 = useState("")
  const [description, setDescription]     = useState("")
  const [recipientInput, setRecipientInput] = useState("")
  const [recipients, setRecipients]       = useState<string[]>([])
  const [dueDate, setDueDate]             = useState("")
  const [expectedFiles, setExpectedFiles] = useState(1)
  const [submitting, setSubmitting]       = useState(false)
  const [shareToken, setShareToken]       = useState("")
  const [shareUrl, setShareUrl]           = useState("")
  const [copied, setCopied]               = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addRecipient = () => {
    const email = recipientInput.trim().toLowerCase()
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address")
      return
    }
    if (recipients.includes(email)) {
      toast.error("Email already added")
      return
    }
    setRecipients(prev => [...prev, email])
    setRecipientInput("")
  }

  const removeRecipient = (email: string) =>
    setRecipients(prev => prev.filter(e => e !== email))

  const reset = () => {
    setStep("form")
    setTitle("")
    setDescription("")
    setRecipientInput("")
    setRecipients([])
    setDueDate("")
    setExpectedFiles(1)
    setShareToken("")
    setShareUrl("")
    setCopied(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Upload link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (recipients.length === 0) {
      // Auto-add if user typed but didn't press enter
      const email = recipientInput.trim().toLowerCase()
      if (email && email.includes("@")) {
        setRecipients([email])
        setRecipientInput("")
      } else {
        toast.error("Add at least one recipient")
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/file-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          recipients: recipients.length > 0 ? recipients : [recipientInput.trim()],
          dueDate: dueDate || null,
          expectedFiles,
          spaceId,
          folderId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const url = `${window.location.origin}/public/file-request/${data.shareToken}`
        setShareToken(data.shareToken)
        setShareUrl(url)
        setStep("success")
      } else {
        toast.error(data.error || "Failed to create request")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Request Files</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400">{spaceName}</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="text-xs font-medium text-indigo-600">
                  📁 {folderName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── FORM STEP ──────────────────────────────────────────────── */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-6 space-y-6"
              >
                {/* Destination banner */}
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-900">Files will land in</p>
                    <p className="text-sm text-indigo-700 font-medium truncate">
                      {spaceName} → {folderName}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-800">
                    Request Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Please upload your signed NDA"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Description / Message */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-800">
                    Message to Recipient
                    <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    placeholder="Explain what you need, any specific format requirements, naming conventions, etc."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Recipients */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">
                    Recipients <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Only these email addresses will be allowed to upload files
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="investor@sequoia.com"
                      value={recipientInput}
                      onChange={e => setRecipientInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); addRecipient() }
                      }}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRecipient}
                      disabled={!recipientInput.trim()}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Recipient chips */}
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {recipients.map(email => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-700"
                        >
                          <Mail className="h-3 w-3 text-slate-400" />
                          {email}
                          <button
                            onClick={() => removeRecipient(email)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expected files + Due date — two columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-800">
                      <Hash className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                      Expected files
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={expectedFiles}
                      onChange={e => setExpectedFiles(parseInt(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-800">
                      <Calendar className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                      Due date
                      <span className="ml-1 text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Info callout */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-amber-800">
                    <p className="font-semibold mb-0.5">How it works</p>
                    <p className="text-xs leading-relaxed">
                      You'll get a shareable upload link. When the recipient uploads their files,
                      they'll automatically appear in <strong>{folderName}</strong> — no manual work needed.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS STEP ───────────────────────────────────────────── */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-6"
              >
                {/* Success banner */}
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Request created!
                  </h3>
                  <p className="text-sm text-slate-500">
                    Share the link below with your recipient
                  </p>
                </div>

                {/* Upload link */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-indigo-500" />
                    Upload Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-xs bg-slate-50 flex-1"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className={`flex-shrink-0 gap-1.5 transition-all ${
                        copied ? "bg-green-50 border-green-300 text-green-700" : ""
                      }`}
                    >
                      {copied ? (
                        <><CheckCircle2 className="h-4 w-4" /> Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Request Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Title</span>
                      <span className="font-medium text-slate-900 text-right max-w-[220px] truncate">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination</span>
                      <span className="font-medium text-indigo-600">{folderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipients</span>
                      <span className="font-medium text-slate-900">{recipients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expected files</span>
                      <span className="font-medium text-slate-900">{expectedFiles}</span>
                    </div>
                    {dueDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Due date</span>
                        <span className="font-medium text-slate-900">
                          {new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* What happens next */}
                <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
                  <Inbox className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="text-indigo-800">
                    <p className="font-semibold mb-0.5">What happens next</p>
                    <p className="text-xs leading-relaxed">
                      When the recipient uploads their files, they'll automatically appear
                      in <strong>{folderName}</strong> in your space. You'll see them immediately.
                    </p>
                  </div>
                </div>

                {/* Create another */}
                <button
                  onClick={reset}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
                >
                  Create another request for this folder
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="border-t px-6 py-4 bg-white sticky bottom-0 flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || (recipients.length === 0 && !recipientInput.trim())}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><Inbox className="h-4 w-4" /> Create Request</>
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="border-t px-6 py-4 bg-white sticky bottom-0">
            <Button
              onClick={handleClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Done
            </Button>
          </div>
        )}
      </motion.div>
    </>
  )
}

 