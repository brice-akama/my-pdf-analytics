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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { EmailAutocomplete } from "@/components/ui/EmailAutocomplete"
import { Send, Inbox, CheckCircle2 } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  recipient: string
  recipients: string
  dueDate: string
  expectedFiles: number
  onSetTitle: (v: string) => void
  onSetDescription: (v: string) => void
  onSetRecipient: (v: string) => void
  onSetRecipients: (v: string) => void
  onSetDueDate: (v: string) => void
  onSetExpectedFiles: (v: number) => void
  onSubmit: () => void
  onReset: () => void
}

export default function CreateFileRequestSheet({
  open,
  onClose,
  title,
  description,
  recipient,
  recipients,
  dueDate,
  expectedFiles,
  onSetTitle,
  onSetDescription,
  onSetRecipient,
  onSetRecipients,
  onSetDueDate,
  onSetExpectedFiles,
  onSubmit,
  onReset,
}: Props) {
  const handleClose = () => {
    onClose()
    onReset()
  }

  const isDisabled =
    !title.trim() || (!recipient.trim() && !recipients.trim())

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[540px] p-0 flex flex-col bg-white"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b sticky top-0 z-10 bg-white">
          <SheetTitle className="text-xl font-bold text-slate-900">
            Create File Request
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-500">
            Request files from clients, partners, or team members
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label>Request Title *</Label>
            <Input
              placeholder="e.g., Client Onboarding Documents"
              value={title}
              onChange={(e) => onSetTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What files do you need? Include any specific requirements..."
              rows={3}
              value={description}
              onChange={(e) => onSetDescription(e.target.value)}
            />
          </div>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Recipient</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Recipients</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Recipient Email *</Label>
                <EmailAutocomplete
                  value={recipient}
                  onChange={(val) => onSetRecipient(val)}
                  onSelect={({ email }) => onSetRecipient(email)}
                  placeholder="client@company.com"
                />
                <p className="text-xs text-slate-500">
                  One unique link will be created for this recipient
                </p>
              </div>
            </TabsContent>

            <TabsContent value="multiple" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Recipient Emails *</Label>
                <Textarea
                  placeholder="client1@company.com, client2@company.com"
                  rows={3}
                  value={recipients}
                  onChange={(e) => onSetRecipients(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Comma-separated. Each person gets their own unique link.
                </p>
              </div>
              {recipients.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    {
                      recipients
                        .split(",")
                        .filter((e) => e.trim()).length
                    }{" "}
                    request(s) will be created
                  </p>
                  {recipients
                    .split(",")
                    .filter((e) => e.trim())
                    .slice(0, 5)
                    .map((email, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-blue-800"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {email.trim()}
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => onSetDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Files</Label>
              <Input
                type="number"
                min={1}
                value={expectedFiles}
                onChange={(e) => onSetExpectedFiles(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-slate-50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Inbox className="h-5 w-5 text-slate-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  How it works
                </p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Each recipient gets their own unique upload link</li>
                  <li>• They upload files without creating an account</li>
                  <li>• You'll get notified when files are uploaded</li>
                  <li>• All files are encrypted and stored securely</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white sticky bottom-0">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={onSubmit}
              disabled={isDisabled}
            >
              <Send className="mr-2 h-4 w-4" />
              Create Request
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}