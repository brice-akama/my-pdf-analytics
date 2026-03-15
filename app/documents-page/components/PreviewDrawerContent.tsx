// app/documents-page/components/PreviewDrawerContent.tsx
"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Clock, BarChart3, Loader2, Check } from "lucide-react"
import { DocumentType, formatTimeAgo } from "./DocumentCard"

// ── Must match StepTwo / CC page / sign page exactly ──────────────────────────
const PDF_NATURAL_W = 794;
const PAGE_H_PX     = 297 * 3.78; // 1122px

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
  const docName  = doc.originalFilename || doc.filename
  const numPages = doc.numPages || 1

  // ── PDF.js state ──────────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null)
  const pdfWrapperRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<any>(null)
  const [pdfScale,  setPdfScale]  = useState(1)
  const [pdfReady,  setPdfReady]  = useState(false)
  const [pdfPages,  setPdfPages]  = useState(numPages)
  const [pdfUrl,    setPdfUrl]    = useState<string | null>(null)

  // ── Fetch PDF blob ────────────────────────────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null
    fetch(`/api/documents/${doc._id}/file?serve=blob`)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (!blob) return
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      })
      .catch(console.error)
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [doc._id])

  // ── PDF.js render — same pattern as CC page ───────────────────────────────
  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return
    let cancelled = false

    const render = async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch (_) {}
        renderTaskRef.current = null
        await new Promise(r => setTimeout(r, 50))
      }
      if (cancelled || !pdfCanvasRef.current) return
      setPdfReady(false)

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const pdf    = await pdfjsLib.getDocument(pdfUrl).promise
      if (cancelled) return

      const pages  = pdf.numPages
      setPdfPages(pages)

      const dpr    = window.devicePixelRatio || 1
      const canvas = pdfCanvasRef.current!
      canvas.width        = 1; canvas.height = 1
      canvas.width        = PDF_NATURAL_W * dpr
      canvas.height       = PAGE_H_PX * pages * dpr
      canvas.style.width  = `${PDF_NATURAL_W}px`
      canvas.style.height = `${PAGE_H_PX * pages}px`

      const ctx = canvas.getContext('2d', { alpha: false })!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      for (let p = 1; p <= pages; p++) {
        if (cancelled) return
        const page    = await pdf.getPage(p)
        const natural = page.getViewport({ scale: 1 })
        const scale   = (PDF_NATURAL_W / natural.width) * dpr
        ctx.save()
        ctx.translate(0, (p - 1) * PAGE_H_PX * dpr)
        const task = page.render({
          canvasContext: ctx,
          viewport:      page.getViewport({ scale }),
          intent:        'display',
        })
        renderTaskRef.current = task
        try { await task.promise } catch (err: any) {
          ctx.restore()
          if (err?.name === 'RenderingCancelledException') return
          throw err
        }
        ctx.restore()
      }

      if (cancelled) return
      if (pdfWrapperRef.current) {
        const avail = pdfWrapperRef.current.clientWidth - 8
        if (avail > 0) setPdfScale(Math.min(avail / PDF_NATURAL_W, 1))
      }
      renderTaskRef.current = null
      setPdfReady(true)
    }

    render().catch(err => {
      if (err?.name !== 'RenderingCancelledException') console.error(err)
    })
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch (_) {}
        renderTaskRef.current = null
      }
    }
  }, [pdfUrl])

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const recalc = () => {
      if (!pdfWrapperRef.current) return
      const avail = pdfWrapperRef.current.clientWidth - 8
      if (avail > 0) setPdfScale(Math.min(avail / PDF_NATURAL_W, 1))
    }
    const ob = new ResizeObserver(recalc)
    if (pdfWrapperRef.current) ob.observe(pdfWrapperRef.current)
    recalc()
    return () => ob.disconnect()
  }, [pdfReady])

  const handleDownload = async () => {
    try {
      const res  = await fetch(`/api/documents/${doc._id}/file?action=download&serve=blob`)
      const blob = await res.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = docName
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { alert("Failed to download") }
  }

  return (
    <div className="h-full flex flex-col sm:flex-row">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
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
                        r.status === "signed"   ? "bg-green-100 text-green-800" :
                        r.status === "viewed"   ? "bg-blue-100 text-blue-800" :
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
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Signature Fields
              </p>
              <p className="text-sm text-slate-700">
                {previewData.signatureFields.length} fields placed
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button onClick={handleDownload}
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => { onClose(); onNavigate(doc._id) }} className="w-full gap-2">
            <BarChart3 className="h-4 w-4" />View Analytics
          </Button>
        </div>
      </div>

      {/* ── PDF VIEWER ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
        <div
          ref={pdfWrapperRef}
          className="flex-1 overflow-auto p-3 sm:p-5"
        >
          {/* Loading */}
          {!pdfReady && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading preview...</p>
              </div>
            </div>
          )}

          {/* PDF canvas + overlays */}
          {pdfUrl && (
            <div
              className="relative mx-auto"
              style={{
                width:        pdfReady ? PDF_NATURAL_W * pdfScale : 0,
                height:       pdfReady ? PAGE_H_PX * pdfPages * pdfScale : 0,
                background:   '#fff',
                boxShadow:    pdfReady ? '0 4px 24px rgba(0,0,0,0.18)' : 'none',
                borderRadius: 4,
                overflow:     'hidden',
                display:      pdfReady ? 'block' : 'none',
              }}
            >
              {/* Inner natural-size container — CSS scaled */}
              <div style={{
                width:           PDF_NATURAL_W,
                height:          PAGE_H_PX * pdfPages,
                transform:       `scale(${pdfScale})`,
                transformOrigin: 'top left',
                position:        'absolute',
                top: 0, left: 0,
              }}>
                {/* PDF.js canvas */}
                <canvas
                  ref={pdfCanvasRef}
                  style={{ display: 'block', width: `${PDF_NATURAL_W}px` }}
                />

                {/* Page dividers */}
                {Array.from({ length: pdfPages - 1 }, (_, i) => (
                  <div key={i} style={{
                    position:   'absolute',
                    top:        PAGE_H_PX * (i + 1),
                    left: 0, right: 0,
                    height:     2,
                    background: 'rgba(99,102,241,0.15)',
                    zIndex:     5,
                  }} />
                ))}

                {/* ── Signature field overlays ──────────────────────────────
                    Coordinate math identical to StepTwo / CC page:
                      topPx = (page-1) * PAGE_H_PX + (y/100 * PAGE_H_PX)
                      left  = x% with transform: translate(-50%, 0)
                ─────────────────────────────────────────────────────────── */}
                <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                  {previewData?.signatureFields.map((field, i) => {
                    const topPx     = ((field.page - 1) * PAGE_H_PX) + (field.y / 100 * PAGE_H_PX)
                    const W = field.width  ?? (field.type === 'signature' ? 140 : field.type === 'checkbox' ? 24 : field.type === 'dropdown' ? 180 : 120)
                    const H = field.height ?? (field.type === 'signature' ? 50  : field.type === 'checkbox' ? 24 : field.type === 'dropdown' ? 36  : 32)

                    const recipient      = previewData.recipients[field.recipientIndex ?? 0]
                    const recipientColor = `hsl(${(field.recipientIndex ?? 0) * 60}, 70%, 50%)`
                    const signedField    = recipient?.signedFields?.find((sf: any) => String(sf.id) === String(field.id))
                    const isSigned       = recipient?.status === "signed" && signedField

                    return (
                      <div
                        key={i}
                        style={{
                          position:   'absolute',
                          left:       `${field.x}%`,
                          top:        `${topPx}px`,
                          width:      `${W}px`,
                          height:     `${H}px`,
                          transform:  'translate(-50%, 0)',
                          zIndex:     10,
                          border:     isSigned ? 'none' : `2px solid ${recipientColor}`,
                          background: isSigned ? 'transparent' : `${recipientColor}18`,
                          borderRadius: 3,
                          display:    'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSigned ? (
                          <>
                            {field.type === 'signature' && signedField.signatureData && (
                              <img
                                src={signedField.signatureData}
                                alt="Signature"
                                style={{
                                  maxWidth:     '100%',
                                  maxHeight:    '100%',
                                  objectFit:    'contain',
                                  mixBlendMode: 'multiply',
                                }}
                              />
                            )}
                            {field.type === 'date' && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                                {signedField.dateValue || new Date(recipient.signedAt).toLocaleDateString()}
                              </span>
                            )}
                            {field.type === 'text' && (
                              <span style={{ fontSize: 10, fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'visible' }}>
                                {signedField.textValue}
                              </span>
                            )}
                            {field.type === 'checkbox' && signedField.textValue === 'true' && (
                              <Check style={{ width: 14, height: 14, color: '#7c3aed' }} />
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 9, fontWeight: 700, color: recipientColor, whiteSpace: 'nowrap' }}>
                            {field.type === 'signature' ? '✍️' : field.type === 'date' ? '📅' : field.type === 'checkbox' ? '☑️' : '📝'}
                            {' '}{recipient?.name?.split(' ')[0] || `R${(field.recipientIndex ?? 0) + 1}`}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}