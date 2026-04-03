"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
}

const triggers = [
  { icon: "👁️", label: "Document Viewed", desc: "When someone views your doc" },
  { icon: "⬇️", label: "Document Downloaded", desc: "When someone downloads" },
  { icon: "✍️", label: "Signature Completed", desc: "When someone signs" },
  { icon: "📥", label: "File Request Received", desc: "When files are uploaded" },
  { icon: "📤", label: "Send Document", desc: "Send a doc via email" },
  { icon: "📋", label: "Create File Request", desc: "Create a new request" },
]

export default function ZapierSetupDialog({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleClose = () => {
    onClose()
    setApiKey("")
  }

  const handleGenerateKey = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/zapier/generate-key", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        setApiKey(data.apiKey)
        toast.success("API key generated!")
      } else {
        toast.error(data.error || "Failed to generate key")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success("API key copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.768 5.44a.75.75 0 01-.712.513H8.918a.75.75 0 01-.712-.513L6.438 8.247A.75.75 0 017.15 7.2h9.7a.75.75 0 01.712 1.047z" />
              </svg>
            </div>
            Connect to Zapier
          </DialogTitle>
          <DialogDescription>
            Use your API key to connect DocMetrics with 5,000+ apps via Zapier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">

          {/* Step 1 — API Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <p className="font-semibold text-slate-900">Get your API Key</p>
            </div>

            <div className="ml-8 space-y-3">
              <p className="text-sm text-slate-600">
                Generate your personal API key. Keep it secret — it gives
                access to your account.
              </p>

              {apiKey ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      readOnly
                      className="flex-1 font-mono text-xs bg-slate-50"
                    />
                    <Button variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        "Copy"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    ⚠️ Store this somewhere safe. You won't see it again after
                    closing this dialog.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateKey}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate API Key"
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* Step 2 — Go to Zapier */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <p className="font-semibold text-slate-900">Connect in Zapier</p>
            </div>
            <div className="ml-8 space-y-3">
              <p className="text-sm text-slate-600">
                Go to Zapier, create a new Zap, search for{" "}
                <strong>DocMetrics</strong>, and paste your API key when
                prompted.
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  window.open("https://zapier.com/apps/connections", "_blank")
                }
              >
                Open Zapier
              </Button>
            </div>
          </div>

          <div className="border-t" />

          {/* Triggers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                ✦
              </div>
              <p className="font-semibold text-slate-900">
                What you can automate
              </p>
            </div>
            <div className="ml-8 grid grid-cols-2 gap-2">
              {triggers.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}