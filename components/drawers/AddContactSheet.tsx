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
import { Plus, Users } from "lucide-react"

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

export default function AddContactSheet({
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
        className="w-full sm:w-[640px] lg:w-[800px] p-0 flex flex-col bg-white"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
          <SheetTitle className="text-xl">Add New Contact</SheetTitle>
          <SheetDescription>
            Save contact details for quick document sharing
          </SheetDescription>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Quick Sharing
                  </p>
                  <p className="text-xs text-blue-700">
                    Once added, you can quickly share documents with this
                    contact from anywhere in the app.
                  </p>
                </div>
              </div>
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
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}