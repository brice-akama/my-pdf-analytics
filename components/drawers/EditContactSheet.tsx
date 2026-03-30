"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Props = {
  open: boolean
  onClose: () => void
  name: string
  email: string
  company: string
  phone: string
  notes: string
  onSetName: (v: string) => void
  onSetEmail: (v: string) => void
  onSetCompany: (v: string) => void
  onSetPhone: (v: string) => void
  onSetNotes: (v: string) => void
  onSubmit: () => void
  onReset: () => void
}

export default function EditContactSheet({
  open,
  onClose,
  name,
  email,
  company,
  phone,
  notes,
  onSetName,
  onSetEmail,
  onSetCompany,
  onSetPhone,
  onSetNotes,
  onSubmit,
  onReset,
}: Props) {
  const handleClose = () => {
    onClose()
    onReset()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[500px] p-0 flex flex-col bg-white"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <SheetTitle className="text-xl">Edit Contact</SheetTitle>
          <SheetDescription>Update contact information</SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={name}
                onChange={(e) => onSetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => onSetEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Company (Optional)</Label>
              <Input
                placeholder="Acme Inc."
                value={company}
                onChange={(e) => onSetCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => onSetPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes about this contact..."
                rows={4}
                value={notes}
                onChange={(e) => onSetNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0 z-10 shadow-lg">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!name.trim() || !email.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}