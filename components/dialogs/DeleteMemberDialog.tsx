"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  memberName: string
  onConfirm: () => void
}

export default function DeleteMemberDialog({
  open,
  onClose,
  memberName,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            Remove Team Member
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600 pt-1">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-slate-900">{memberName}</span>{" "}
            from the team? They will lose access immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}