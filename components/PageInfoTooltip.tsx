"use client"

import { useEffect, useState } from 'react'
import { X, Info } from 'lucide-react'

interface PageInfoTooltipProps {
  pageId: string
  message: string
  position?: 'top' | 'bottom' | 'center'
}

export default function PageInfoTooltip({
  pageId,
  message,
}: PageInfoTooltipProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem(`tooltip-seen-${pageId}`)
    if (!hasSeenTooltip) {
      setTimeout(() => setShow(true), 800)
    }
  }, [pageId])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(`tooltip-seen-${pageId}`, 'true')
  }

  if (!show) return null

  return (
    <div
      className="fixed top-5 right-5 z-[101] max-w-[340px] w-full"
      style={{
        animation: 'tooltipEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes tooltipEnter {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Card */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          boxShadow:
            '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 15px -3px rgba(0,0,0,0.07)',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
          }}
        />

        <div className="px-4 py-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              
             
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                width: 26,
                height: 26,
                color: '#94a3b8',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  '#f1f5f9'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#475569'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
              }}
            >
              <X style={{ width: 14, height: 14 }} strokeWidth={2} />
            </button>
          </div>

          {/* Message */}
          <p
            style={{
              fontSize: 13.5,
              lineHeight: '1.6',
              color: '#334155',
              margin: '0 0 14px 0',
            }}
          >
            {message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
             
            <button
              onClick={handleDismiss}
              className="rounded-lg transition-all"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: '#0284c7',
                border: 'none',
                padding: '6px 16px',
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  '#0369a1'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background =
                  '#0284c7'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}