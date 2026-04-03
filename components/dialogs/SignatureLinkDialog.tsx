"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CheckCircle, Mail, Activity } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  signatureLink: string
  signers: string
  onViewAgreements: () => void
}

export default function SignatureLinkDialog({
  open,
  onClose,
  signatureLink,
  signers,
  onViewAgreements,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Agreement Sent Successfully!
          </DialogTitle>
          <DialogDescription>
            Emails have been sent to all signers. You can also copy the link
            below to manually test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emails sent confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  📧 Emails sent to {signers.split(",").length} recipient(s)
                </p>
                <p className="text-xs text-green-700">{signers}</p>
              </div>
            </div>
          </div>

          {/* Signature link */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Signature Link (for testing)
            </Label>
            <div className="flex gap-2">
              <Input
                value={signatureLink}
                readOnly
                className="flex-1 font-mono text-xs bg-slate-50"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(signatureLink)
                  toast.success("Link copied!")
                }}
              >
                Copy
              </Button>
              <Button
                onClick={() => window.open(signatureLink, "_blank")}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Open
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              This is the same link that was emailed to signers. Open it to
              test the signing flow.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  What happens next?
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Signers receive an email with the link</li>
                  <li>• They click the link to view and sign the agreement</li>
                  <li>• You'll be notified when they sign</li>
                  <li>• Track progress in the Agreements section</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => { onClose(); onViewAgreements() }}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              View All Agreements
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}