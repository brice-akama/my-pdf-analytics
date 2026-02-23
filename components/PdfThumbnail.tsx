'use client'

import { useEffect, useState } from 'react'

interface PdfThumbnailProps {
  documentId: string
  filename?: string
}

export default function PdfThumbnail({ documentId, filename }: PdfThumbnailProps) {
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')

        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const loadingTask = pdfjsLib.getDocument({
          url: `/api/documents/${documentId}/file?serve=blob`,
          withCredentials: true,
        })

        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)

        // Use fixed scale 4 — no dpr multiplication, just high resolution
        const viewport = page.getViewport({ scale: 4 })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        // White background before rendering
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display',
        }).promise

        if (!cancelled) {
          // PNG instead of JPEG — no compression artifacts on text
          setCanvasUrl(canvas.toDataURL('image/png'))
        }
      } catch (err) {
        console.error('PDF render error:', err)
        if (!cancelled) setError(true)
      }
    }

    render()
    return () => { cancelled = true }
  }, [documentId])

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }

  if (!canvasUrl) {
    return (
      <div className="h-full w-full bg-slate-200 animate-pulse rounded" />
    )
  }

  return (
    <img
      src={canvasUrl}
      alt={filename || 'Document preview'}
      className="w-full h-full object-cover object-top"
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}