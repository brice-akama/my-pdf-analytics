"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles } from "lucide-react"

interface FeedbackDrawerProps {
  open: boolean
  onClose: () => void
  feedbackText: string
  onSetFeedback: (v: string) => void
  onSubmit: () => void
  userEmail?: string
}

export default function FeedbackDrawer({
  open,
  onClose,
  feedbackText,
  onSetFeedback,
  onSubmit,
  userEmail,
}: FeedbackDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Send Feedback</h2>
                <p className="text-sm text-slate-600 mt-1">Help us improve DocMetrics</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6 max-w-3xl">
                {/* Type selection */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { emoji: "🐛", label: "Bug Report" },
                    { emoji: "💡", label: "Feature Request" },
                    { emoji: "💬", label: "General Feedback" },
                  ].map((t) => (
                    <button
                      key={t.label}
                      className="p-5 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 transition-all text-center group"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{t.emoji}</div>
                      <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-900">Your Feedback</Label>
                  <Textarea
                    placeholder="Tell us what you think, report bugs, or suggest new features..."
                    rows={8}
                    value={feedbackText}
                    onChange={(e) => onSetFeedback(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Be as detailed as possible. Screenshots can be sent to support@docmetrics.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-900">Email (pre-filled)</Label>
                  <input
                    type="email"
                    value={userEmail ?? ""}
                    disabled
                    className="w-full h-12 px-4 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-base"
                  />
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 mb-2">We value your feedback!</h4>
                      <p className="text-sm text-purple-800 leading-relaxed">
                        Your suggestions help us build a better product. We read every piece of feedback
                        and many of our best features came from user suggestions like yours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { onClose(); onSetFeedback("") }} className="h-12 px-6">
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={!feedbackText.trim()}
                  className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}