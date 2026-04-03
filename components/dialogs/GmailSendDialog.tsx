"use client"

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
import { Mail, Send, Activity } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  recipients: string
  subject: string
  message: string
  onSetRecipients: (v: string) => void
  onSetSubject: (v: string) => void
  onSetMessage: (v: string) => void
  onSubmit: () => void
}

export default function GmailSendDialog({
  open,
  onClose,
  recipients,
  subject,
  message,
  onSetRecipients,
  onSetSubject,
  onSetMessage,
  onSubmit,
}: Props) {
  const handleClose = () => {
    onClose()
    onSetRecipients("")
    onSetSubject("")
    onSetMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-600" />
            Send via Gmail
          </DialogTitle>
          <DialogDescription>
            Send a tracked document link via your Gmail account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients *</Label>
            <Input
              placeholder="john@example.com, jane@company.com"
              value={recipients}
              onChange={(e) => onSetRecipients(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              placeholder="Check out this document"
              value={subject}
              onChange={(e) => onSetSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal message..."
              rows={4}
              value={message}
              onChange={(e) => onSetMessage(e.target.value)}
            />
          </div>

          {/* Tracking info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Email Tracking Enabled
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• You'll be notified when recipients open the email</li>
                  <li>• Track when they view the document</li>
                  <li>• See time spent on each page</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}