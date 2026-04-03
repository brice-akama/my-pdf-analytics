"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Send, Sparkles } from "lucide-react"

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

type Props = {
  open: boolean
  onClose: () => void
  user: UserType | null
}

export default function DemoDialog({ open, onClose, user }: Props) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [message, setMessage] = useState("")

  const handleClose = () => {
    onClose()
    setPhoneNumber("")
    setTeamSize("")
    setPreferredDate("")
    setMessage("")
  }

  const handleSubmit = async () => {
    const loadingToast = toast.loading("Sending demo request...")
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim() || undefined,
          teamSize: teamSize || undefined,
          preferredDate: preferredDate.trim() || undefined,
          message: message.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Demo request sent!", {
          id: loadingToast,
          description: "We'll contact you within 24 hours to schedule",
        })
        handleClose()
      } else {
        toast.error(data.error || "Failed to send request", {
          id: loadingToast,
        })
      }
    } catch {
      toast.error("Network error", { id: loadingToast })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Schedule a Demo
          </DialogTitle>
          <DialogDescription>
            Book a personalized walkthrough of DocMetrics with our team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Name + Email (pre-filled) */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Your Name</Label>
              <Input
                value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email</Label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-slate-50"
              />
            </div>
          </div>

          {/* Phone + Team Size */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Phone Number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Team Size</Label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full h-11 px-4 border-2 border-slate-200 rounded-lg bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              >
                <option value="">Select team size</option>
                <option value="1-5">1-5 people</option>
                <option value="6-20">6-20 people</option>
                <option value="21-50">21-50 people</option>
                <option value="51+">51+ people</option>
              </select>
            </div>
          </div>

          {/* Preferred Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Preferred Date/Time
            </Label>
            <Input
              type="text"
              placeholder="e.g., Next Tuesday 2pm EST, or Week of Jan 15"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              What would you like to learn about? (Optional)
            </Label>
            <Textarea
              placeholder="Share any specific features or use cases you're interested in..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* What to expect */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-purple-900 mb-1">
                  What to expect
                </p>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• 30-minute personalized demo tailored to your needs</li>
                  <li>• Live Q&A with our product experts</li>
                  <li>• Custom recommendations for your use case</li>
                  <li>• No pressure sales pitch - just genuine help</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Request Demo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}