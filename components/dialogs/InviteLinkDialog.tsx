"use client"

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
import { CheckCircle, Mail } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  inviteLink: string
  inviteEmail: string
}

export default function InviteLinkDialog({
  open,
  onClose,
  inviteLink,
  inviteEmail,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Invitation Sent!</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                A link was emailed. Share it manually if needed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Email confirmation */}
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-900">
              Invite email sent to{" "}
              <span className="font-semibold">{inviteEmail || "recipient"}</span>
            </p>
          </div>

          {/* Backup link */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Backup Invite Link
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1 font-mono text-xs bg-slate-50 text-slate-600"
              />
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink)
                  toast.success("Link copied to clipboard")
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Expires in 7 days · Use if the email doesn't arrive
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={onClose}
              className="h-10 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}