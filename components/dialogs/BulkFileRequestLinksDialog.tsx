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
import { CheckCircle } from "lucide-react"

type FileRequestLink = {
  email: string
  requestId: string
  shareToken: string
  link: string
}

type Props = {
  open: boolean
  onClose: () => void
  requests: FileRequestLink[]
}

export default function BulkFileRequestLinksDialog({
  open,
  onClose,
  requests,
}: Props) {
  const handleCopyAll = () => {
    const allLinks = requests
      .map((r) => `${r.email}: ${r.link}`)
      .join("\n")
    navigator.clipboard.writeText(allLinks)
    toast.success("All links copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            {requests.length} File Request(s) Created!
          </DialogTitle>
          <DialogDescription>
            Each recipient has their own unique upload link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {requests.map((request, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {request.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{request.email}</p>
                  <p className="text-xs text-slate-500">
                    Request #{index + 1}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={request.link}
                  readOnly
                  className="flex-1 font-mono text-xs bg-slate-50"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(request.link)
                    toast.success("Link copied!")
                  }}
                >
                  Copy
                </Button>
                <Button
                  onClick={() => window.open(request.link, "_blank")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Open
                </Button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCopyAll}>
              Copy All Links
            </Button>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}