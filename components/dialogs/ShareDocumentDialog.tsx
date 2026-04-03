"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Share2, Send } from "lucide-react"

type Permissions = {
  canView: boolean
  canDownload: boolean
  canEdit: boolean
  canShare: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  emails: string
  message: string
  permissions: Permissions
  onSetEmails: (v: string) => void
  onSetMessage: (v: string) => void
  onSetPermissions: (p: Permissions) => void
  onSubmit: () => void
}

export default function ShareDocumentDialog({
  open,
  onClose,
  emails,
  message,
  permissions,
  onSetEmails,
  onSetMessage,
  onSetPermissions,
  onSubmit,
}: Props) {
  const handleClose = () => {
    onClose()
    onSetEmails("")
    onSetMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share this document with others via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email addresses (comma-separated)</Label>
            <Textarea
              placeholder="john@example.com, jane@company.com"
              rows={3}
              value={emails}
              onChange={(e) => onSetEmails(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Recipients will receive an email with a secure link to view this
              document
            </p>
          </div>

          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Add a personal message..."
              rows={3}
              value={message}
              onChange={(e) => onSetMessage(e.target.value)}
            />
          </div>

          {/* Permissions */}
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Permissions</Label>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Can view</p>
                <p className="text-xs text-slate-500">
                  Recipients can view the document
                </p>
              </div>
              <Switch
                checked={permissions.canView}
                onCheckedChange={(checked) =>
                  onSetPermissions({ ...permissions, canView: checked })
                }
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Can download
                </p>
                <p className="text-xs text-slate-500">
                  Recipients can download the document
                </p>
              </div>
              <Switch
                checked={permissions.canDownload}
                onCheckedChange={(checked) =>
                  onSetPermissions({ ...permissions, canDownload: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Can edit</p>
                <p className="text-xs text-slate-500">
                  Recipients can make changes
                </p>
              </div>
              <Switch
                checked={permissions.canEdit}
                onCheckedChange={(checked) =>
                  onSetPermissions({ ...permissions, canEdit: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Can share</p>
                <p className="text-xs text-slate-500">
                  Recipients can share with others
                </p>
              </div>
              <Switch
                checked={permissions.canShare}
                onCheckedChange={(checked) =>
                  onSetPermissions({ ...permissions, canShare: checked })
                }
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Share2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Email notifications will be sent
                </p>
                <p className="text-xs text-blue-700">
                  Recipients will receive an email with a secure link and your
                  optional message. You'll be notified when they view the
                  document.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Share Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}