"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { X, Mail, Clock, Sparkles, ChevronRight, Send } from "lucide-react"

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
}

interface ContactDrawerProps {
  open: boolean
  onClose: () => void
  user: UserType | null
  supportSubject: string
  supportMessage: string
  onSetSubject: (v: string) => void
  onSetMessage: (v: string) => void
}

export default function ContactDrawer({
  open,
  onClose,
  user,
  supportSubject,
  supportMessage,
  onSetSubject,
  onSetMessage,
}: ContactDrawerProps) {
  const handleSend = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) return
    const loadingToast = toast.loading("Sending message...")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: supportSubject.trim(),
          message: supportMessage.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Message sent!", {
          id: loadingToast,
          description: "We'll get back to you within 24 hours",
        })
        onClose()
        onSetSubject("")
        onSetMessage("")
      } else {
        toast.error(data.error || "Failed to send message", { id: loadingToast })
      }
    } catch {
      toast.error("Network error", { id: loadingToast })
    }
  }

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
                <h2 className="text-2xl font-bold text-slate-900">Contact Support</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Send us a message and we'll respond within 24 hours
                </p>
              </div>
              <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-5 max-w-3xl mx-auto">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Your Name</Label>
                    <Input
                      value={`${user?.first_name} ${user?.last_name}`.trim()}
                      disabled className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Email Address</Label>
                    <Input value={user?.email} disabled className="bg-slate-50" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Subject *</Label>
                  <Input
                    placeholder="How can we help?"
                    value={supportSubject}
                    onChange={(e) => onSetSubject(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Message *</Label>
                  <Textarea
                    placeholder="Tell us more about your inquiry..."
                    rows={8}
                    value={supportMessage}
                    onChange={(e) => onSetMessage(e.target.value)}
                    className="resize-none"
                  />
                </div>

                {/* Other options */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    Other Ways to Reach Us
                  </h4>
                  <div className="space-y-3">
                    <a
                      href="mailto:support@docmetrics.io"
                      className="flex items-center gap-3 p-4 bg-white/80 rounded-lg hover:bg-white transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Direct Email</p>
                        <p className="text-sm text-slate-600">support@docmetrics.io</p>
                      </div>
                    </a>
                    <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                      <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Response Time</p>
                        <p className="text-sm text-slate-600">Usually within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => { onClose(); onSetSubject(""); onSetMessage("") }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!supportSubject.trim() || !supportMessage.trim()}
                  onClick={handleSend}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}