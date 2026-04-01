"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { Upload, ChevronRight } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  integrationStatus: Record<string, any>
  onConnectGoogleDrive: () => void
  onBrowseDriveFiles: () => void
  onAgreementUploaded: () => void
  onNavigateToAgreements: () => void
}

export default function UploadAgreementSheet({
  open,
  onClose,
  integrationStatus,
  onConnectGoogleDrive,
  onBrowseDriveFiles,
  onAgreementUploaded,
  onNavigateToAgreements,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] p-0 flex flex-col bg-white"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b bg-white sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-slate-900">
            Upload Agreement
          </SheetTitle>
           
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Hidden file input */}
          <input
            id="agreement-file-input"
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const formData = new FormData()
              formData.append("file", file)
              formData.append("type", "agreement")
              try {
                const res = await fetch("/api/agreements/upload", {
                  method: "POST",
                  credentials: "include",
                  body: formData,
                })
                const data = await res.json()
                if (res.ok) {
                  toast.success("Agreement uploaded!")
                  onAgreementUploaded()
                  onClose()
                  onNavigateToAgreements()
                } else {
                  toast.error(data.error || "Upload failed")
                }
              } catch {
                toast.error("Failed to upload agreement")
              }
            }}
          />

          <div className="space-y-3">
            {/* From Computer */}
            <button
              onClick={() =>
                document.getElementById("agreement-file-input")?.click()
              }
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100">
                <Upload className="h-5 w-5 text-slate-600 group-hover:text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-purple-700">
                  From Computer
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse and upload a PDF from your device
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-500 flex-shrink-0" />
            </button>

            {/* From Google Drive */}
             
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}