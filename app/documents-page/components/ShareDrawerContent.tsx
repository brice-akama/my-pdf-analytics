// app/documents-page/components/ShareDrawerContent.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { Label } from "@radix-ui/react-dropdown-menu"
import { DocumentType } from "./DocumentCard"

type Props = {
  doc: DocumentType
  onClose: () => void
}

const defaultSettings = {
  requireEmail: true,
  allowDownload: false,
  expiresIn: 7,
  password: "",
  recipientEmails: [] as string[],
  sendEmailNotification: true,
  customMessage: "",
  requireNDA: false,
  allowedEmails: [] as string[],
  enableWatermark: false,
  watermarkText: "",
  watermarkPosition: "bottom",
  ndaText: "",
  ndaTemplateId: "",
  customNdaText: "",
  useCustomNda: false,
}

export default function ShareDrawerContent({ doc, onClose }: Props) {
  const router = useRouter()
  const [shareSettings, setShareSettings] = useState(defaultSettings)
  const [recipientInput, setRecipientInput] = useState("")
  const [ndaTemplates, setNdaTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const docName = doc.originalFilename || doc.filename

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const res = await fetch("/api/nda-templates", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setNdaTemplates(data.templates)
          const def = data.templates.find((t: any) => t.isDefault)
          if (def) setShareSettings(p => ({ ...p, ndaTemplateId: def.id }))
        }
      } catch (e) { console.error(e) }
      finally { setLoadingTemplates(false) }
    }
    fetchTemplates()
  }, [])

  const addRecipient = () => {
    const email = recipientInput.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    if (shareSettings.recipientEmails.includes(email)) return
    setShareSettings(p => ({ ...p, recipientEmails: [...p.recipientEmails, email] }))
    setRecipientInput("")
  }

  const handleSubmit = async () => {
    // Auto-add typed email
    const email = recipientInput.trim()
    const emails = [...shareSettings.recipientEmails]
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      emails.push(email)
      setRecipientInput("")
    }

    try {
      const res = await fetch(`/api/documents/${doc._id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requireEmail: shareSettings.requireEmail,
          allowDownload: shareSettings.allowDownload,
          password: shareSettings.password || null,
          expiresIn: shareSettings.expiresIn === 0 ? "never" : shareSettings.expiresIn.toString(),
          allowedEmails: emails,
          customMessage: shareSettings.customMessage || null,
          sendEmailNotification: shareSettings.sendEmailNotification,
          notifyOnView: true,
          allowPrint: true,
          trackDetailedAnalytics: true,
          enableWatermark: shareSettings.enableWatermark,
          watermarkText: shareSettings.watermarkText || null,
          watermarkPosition: shareSettings.watermarkPosition,
          requireNDA: shareSettings.requireNDA,
          ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
          customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const shareLink = data.shareLink
        const modal = document.createElement("div")
        modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        modal.innerHTML = `
          <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900">Link Created!</h3>
                <p class="text-sm text-slate-600">${emails.length > 0 ? `Sent to ${emails.length} recipient(s)` : "Anyone with link can view"}</p>
              </div>
            </div>
            <div class="mb-4">
              <label class="text-sm font-medium text-slate-700 block mb-2">Share Link:</label>
              <div class="flex gap-2">
                <input type="text" value="${shareLink}" readonly
                  class="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50"/>
                <button onclick="navigator.clipboard.writeText('${shareLink}');this.innerHTML='✓ Copied';setTimeout(()=>this.innerHTML='Copy',2000)"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">Copy</button>
              </div>
            </div>
            <div class="space-y-1 text-sm text-slate-600 mb-4">
              <p>⏰ Expires: ${shareSettings.expiresIn === 0 ? "Never" : `${shareSettings.expiresIn} days`}</p>
              <p>📥 Download: ${shareSettings.allowDownload ? "Allowed" : "Disabled"}</p>
              ${shareSettings.password ? "<p>🔒 Password protected</p>" : ""}
            </div>
            <div class="flex gap-3">
              <button onclick="window.open('${shareLink}','_blank');this.closest('.fixed').remove()"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Test Link</button>
              <button onclick="this.closest('.fixed').remove()"
                class="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg">Close</button>
            </div>
          </div>`
        document.body.appendChild(modal)
        modal.onclick = (e) => { if (e.target === modal) modal.remove() }
        onClose()
        setShareSettings(defaultSettings)
      } else {
        if (data.upgrade) alert(`❌ ${data.error}\n\nUpgrade to Premium for this feature.`)
        else alert(`❌ ${data.error || "Failed to create share link"}`)
      }
    } catch (e) { alert("❌ Failed. Please try again.") }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-slate-900">Share Document</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-slate-500 truncate">{docName}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Recipients */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Recipients (Optional)</h3>
            <p className="text-sm text-slate-500 mb-4">Add emails to restrict access. Leave empty for anyone with the link.</p>
            <div className="flex gap-2 mb-3">
              <Input type="email" value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="recipient@company.com"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient() } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addRecipient}>Add</Button>
            </div>
            {shareSettings.recipientEmails.length > 0 && (
              <div className="space-y-2">
                {shareSettings.recipientEmails.map((email, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                    <span className="text-sm">{email}</span>
                    <button onClick={() => setShareSettings(p => ({
                      ...p, recipientEmails: p.recipientEmails.filter((_, j) => j !== i)
                    }))} className="text-red-600 text-sm hover:text-red-700">Remove</button>
                  </div>
                ))}
              </div>
            )}
            {shareSettings.recipientEmails.length > 0 && (
              <label className="flex items-center justify-between cursor-pointer mt-4 pt-4 border-t">
                <div>
                  <div className="font-medium text-sm text-slate-900">Send Email Notification</div>
                  <div className="text-xs text-slate-500">Email recipients with the link</div>
                </div>
                <input type="checkbox" checked={shareSettings.sendEmailNotification}
                  onChange={(e) => setShareSettings(p => ({ ...p, sendEmailNotification: e.target.checked }))}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600" />
              </label>
            )}
          </div>

          {/* Message */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Message (Optional)</h3>
            <textarea
              value={shareSettings.customMessage}
              onChange={(e) => setShareSettings(p => ({ ...p, customMessage: e.target.value }))}
              placeholder="Add a personal note for recipients..."
              rows={3} maxLength={500}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{shareSettings.customMessage.length}/500</p>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Security Settings</h3>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-sm text-slate-900">Require Email Verification</div>
                <div className="text-xs text-slate-500">Viewers must enter email to access</div>
              </div>
              <input type="checkbox" checked={shareSettings.requireEmail}
                onChange={(e) => setShareSettings(p => ({ ...p, requireEmail: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-blue-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-sm text-slate-900">Allow Download</div>
                <div className="text-xs text-slate-500">Let viewers download the PDF</div>
              </div>
              <input type="checkbox" checked={shareSettings.allowDownload}
                onChange={(e) => setShareSettings(p => ({ ...p, allowDownload: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-blue-600" />
            </label>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Link Expires In</label>
              <select value={shareSettings.expiresIn}
                onChange={(e) => setShareSettings(p => ({ ...p, expiresIn: parseInt(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="0">Never</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Password (Optional)</label>
              <Input type="password" value={shareSettings.password}
                onChange={(e) => setShareSettings(p => ({ ...p, password: e.target.value }))}
                placeholder="Leave empty for no password" />
            </div>
          </div>

          {/* Watermark */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">💧 Watermark</h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Premium</span>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-sm text-slate-900">Enable Watermark</div>
                <div className="text-xs text-slate-500">Add viewer's email to each page</div>
              </div>
              <input type="checkbox" checked={shareSettings.enableWatermark}
                onChange={(e) => setShareSettings(p => ({ ...p, enableWatermark: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-purple-600" />
            </label>
            {shareSettings.enableWatermark && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Watermark Text</label>
                  <Input value={shareSettings.watermarkText}
                    onChange={(e) => setShareSettings(p => ({ ...p, watermarkText: e.target.value }))}
                    placeholder="Leave empty to use viewer's email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Position</label>
                  <select value={shareSettings.watermarkPosition}
                    onChange={(e) => setShareSettings(p => ({ ...p, watermarkPosition: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="diagonal">Diagonal</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* NDA */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">📜 NDA Requirement</h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Premium</span>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-sm text-slate-900">Require NDA Acceptance</div>
                <div className="text-xs text-slate-500">Viewers must accept terms before viewing</div>
              </div>
              <input type="checkbox" checked={shareSettings.requireNDA}
                onChange={(e) => setShareSettings(p => ({ ...p, requireNDA: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-purple-600" />
            </label>

            {shareSettings.requireNDA && (
              <>
                <div className="flex gap-1">
                  <button onClick={() => setShareSettings(p => ({ ...p, useCustomNda: false }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${!shareSettings.useCustomNda ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-slate-200 text-slate-600"}`}>
                    Use Template
                  </button>
                  <button onClick={() => setShareSettings(p => ({ ...p, useCustomNda: true }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${shareSettings.useCustomNda ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-slate-200 text-slate-600"}`}>
                    Custom Text
                  </button>
                </div>

                {!shareSettings.useCustomNda ? (
                  <div>
                    {loadingTemplates ? (
                      <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
                    ) : (
                      <select value={shareSettings.ndaTemplateId}
                        onChange={(e) => setShareSettings(p => ({ ...p, ndaTemplateId: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="">Select a template...</option>
                        {ndaTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (Default)" : ""}</option>
                        ))}
                      </select>
                    )}
                    <Link href="/settings/nda-templates">
                      <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                        <FileText className="h-4 w-4" />Manage Templates
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <textarea value={shareSettings.customNdaText}
                      onChange={(e) => setShareSettings(p => ({ ...p, customNdaText: e.target.value }))}
                      placeholder="Enter custom NDA text..." rows={8} maxLength={2000}
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono resize-none" />
                    <p className="text-xs text-slate-400 mt-1">{shareSettings.customNdaText.length}/2000</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📊 <strong>Track views:</strong> See who viewed your document, time spent, and location in analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit}
            className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Share2 className="h-4 w-4" />
            {shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification
              ? `Send to ${shareSettings.recipientEmails.length} Recipient${shareSettings.recipientEmails.length > 1 ? "s" : ""}`
              : "Create Link"}
          </Button>
        </div>
      </div>
    </div>
  )
}