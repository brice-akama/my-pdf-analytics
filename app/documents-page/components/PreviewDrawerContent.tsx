// app/documents-page/components/PreviewDrawerContent.tsx
"use client"

import { Button } from "@/components/ui/button"
import { FileText, Clock, BarChart3, CheckCircle2 } from "lucide-react"
import { DocumentType, formatTimeAgo } from "./DocumentCard"

type Props = {
  doc: DocumentType
  previewData: {
    recipients: any[]
    signatureFields: any[]
    viewMode: string
  } | null
  onClose: () => void
  onNavigate: (id: string) => void
}

export default function PreviewDrawerContent({ doc, previewData, onClose, onNavigate }: Props) {
  const docName = doc.originalFilename || doc.filename
  const numPages = doc.numPages || 1
  const pageHeight = 297 * 3.78

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${doc._id}/file?action=download&serve=blob`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = docName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch { alert("Failed to download") }
  }

  return (
    <div className="h-full flex flex-col sm:flex-row">
      {/* Sidebar */}
      <div className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-slate-900 mb-1">Document Preview</h3>
          <p className="text-xs text-slate-500 truncate">{docName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Recipients */}
          {previewData && previewData.recipients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Recipients ({previewData.recipients.length})
              </p>
              <div className="space-y-2">
                {previewData.recipients.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: `hsl(${i * 60}, 70%, 50%)` }}>
                        {r.name?.charAt(0) || i + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{r.name}</span>
                    </div>
                    <p className="text-xs text-slate-500">{r.email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "signed" ? "bg-green-100 text-green-800" :
                        r.status === "viewed" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {r.status === "signed" ? "✓ Signed" : r.status === "viewed" ? "👁 Viewed" : "⏳ Pending"}
                      </span>
                      {r.status === "signed" && r.signedAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(r.signedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Details</p>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>{numPages} pages</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{formatTimeAgo(doc.createdAt)}</span>
              </div>
            </div>
          </div>

          {previewData && previewData.signatureFields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Signature Fields</p>
              <p className="text-sm text-slate-700">{previewData.signatureFields.length} fields placed</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={handleDownload}
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => { onClose(); onNavigate(doc._id) }} className="w-full gap-2">
            <BarChart3 className="h-4 w-4" />View Analytics
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden relative"
            style={{ minHeight: `${pageHeight * numPages}px` }}>
            <embed
              src={`/api/documents/${doc._id}/file?serve=blob#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="w-full border-0"
              style={{ height: `${pageHeight * numPages}px`, display: "block", pointerEvents: "none" }}
            />

            {/* Signature field overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {previewData?.signatureFields.map((field, i) => {
                const recipient = previewData.recipients[field.recipientIndex]
                const topPosition = (field.page - 1) * pageHeight + (field.y / 100) * pageHeight
                const signedFieldData = recipient?.signedFields?.find((sf: any) => sf.id === field.id)
                const isSigned = recipient?.status === "signed" && signedFieldData

                return (
                  <div key={i}
                    className={`absolute pointer-events-none ${!isSigned ? "border-2 rounded bg-white/90 shadow-lg border-gray-400" : ""}`}
                    style={{
                      left: `${field.x}%`,
                      top: `${topPosition}px`,
                      width: field.type === "signature" ? "140px" : "120px",
                      height: field.type === "signature" ? "50px" : "36px",
                      transform: "translate(-50%, 0%)",
                    }}
                  >
                    {isSigned ? (
                      <div className="h-full w-full flex items-center justify-center">
                        {field.type === "signature" && signedFieldData.signatureData && (
                          <img src={signedFieldData.signatureData} alt="Signature"
                            className="max-w-full max-h-full object-contain" />
                        )}
                        {field.type === "date" && (
                          <span className="text-xs font-semibold text-gray-900">
                            {signedFieldData.dateValue || new Date(recipient.signedAt).toLocaleDateString()}
                          </span>
                        )}
                        {field.type === "text" && (
                          <span className="text-xs font-semibold text-gray-900 truncate px-1">
                            {signedFieldData.textValue}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center px-2">
                        <span className="text-xs font-semibold text-gray-600 truncate">
                          {field.type === "signature" ? "✍️ Awaiting" : field.type === "date" ? "📅 Date" : "📝 Text"}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}