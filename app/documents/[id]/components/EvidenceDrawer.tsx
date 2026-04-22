"use client"

import { useState } from "react"
import { X, Download, Play, Camera, Video, Shield, Clock, Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface EvidenceDrawerProps {
  open: boolean
  onClose: () => void
  recipient: {
    name: string
    email: string
    signedAt?: string | null
    selfieVerification?: {
      selfieImageUrl: string
      capturedAt: string
      ipAddress?: string
      deviceInfo?: any
    } | null
    intentVideoUrl?: string | null
    intentVideoRecordedAt?: string | null
  } | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function EvidenceDrawer({
  open,
  onClose,
  recipient,
}: EvidenceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"selfie" | "video">("selfie")

  const hasSelfie = !!recipient?.selfieVerification?.selfieImageUrl
  const hasVideo  = !!recipient?.intentVideoUrl

  const handleDownloadSelfie = () => {
    if (!recipient?.selfieVerification?.selfieImageUrl) return
    const a = document.createElement("a")
    a.href = recipient.selfieVerification.selfieImageUrl
    a.download = `selfie-${recipient.email}-${Date.now()}.jpg`
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadVideo = () => {
    if (!recipient?.intentVideoUrl) return
    const a = document.createElement("a")
    a.href = recipient.intentVideoUrl
    a.download = `intent-video-${recipient.email}-${Date.now()}.mp4`
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {recipient?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{recipient?.name}</p>
                  <p className="text-xs text-slate-500">{recipient?.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Signed badge */}
            {recipient?.signedAt && (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-800">
                  Signed on {formatDate(recipient.signedAt)}
                </p>
              </div>
            )}

            {/* Tabs */}
            {hasSelfie && hasVideo && (
              <div className="flex border-b border-slate-100 px-6 pt-4 gap-4">
                {[
                  { key: "selfie" as const, label: "ID Selfie", icon: Camera },
                  { key: "video"  as const, label: "Intent Video", icon: Video  },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === key
                        ? "border-violet-600 text-violet-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ── Selfie panel ── */}
              {(!hasVideo || activeTab === "selfie") && hasSelfie && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-violet-600" />
                      <p className="text-sm font-semibold text-slate-900">Identity Selfie</p>
                    </div>
                    <button
                      onClick={handleDownloadSelfie}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>

                  {/* Selfie image */}
                  <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                    <img
                      src={recipient!.selfieVerification!.selfieImageUrl}
                      alt={`Selfie — ${recipient?.name}`}
                      className="w-full object-contain"
                      style={{ maxHeight: "340px" }}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    {recipient?.selfieVerification?.capturedAt && (
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Captured</p>
                          <p className="text-xs font-medium text-slate-700 mt-0.5">
                            {formatDate(recipient.selfieVerification.capturedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                    {recipient?.selfieVerification?.ipAddress && (
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Globe className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">IP Address</p>
                          <p className="text-xs font-medium text-slate-700 mt-0.5 font-mono">
                            {recipient.selfieVerification.ipAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit notice */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      This selfie was captured at the moment of signing as part of the identity verification process.
                      It is stored securely and forms part of the legally admissible audit trail.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Intent video panel ── */}
              {(!hasSelfie || activeTab === "video") && hasVideo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-violet-600" />
                      <p className="text-sm font-semibold text-slate-900">Intent Video</p>
                    </div>
                    <button
                      onClick={handleDownloadVideo}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>

                  {/* Video player */}
                  <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-black">
                    <video
                      src={recipient!.intentVideoUrl!}
                      controls
                      className="w-full"
                      style={{ maxHeight: "340px" }}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>

                  {/* Recorded at */}
                  {recipient?.intentVideoRecordedAt && (
                    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Recorded</p>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {formatDate(recipient.intentVideoRecordedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audit notice */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      This video was recorded by the signer to confirm their intent to sign the document.
                      It is part of the legally admissible audit trail and was captured before the signature was applied.
                    </p>
                  </div>
                </div>
              )}

              {/* No evidence state */}
              {!hasSelfie && !hasVideo && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">No evidence collected yet</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Selfie and intent video will appear here once the signer completes verification.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}