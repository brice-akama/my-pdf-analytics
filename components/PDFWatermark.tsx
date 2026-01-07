// components/PDFWatermark.tsx
'use client'

import { useEffect, useState } from 'react'

interface PDFWatermarkProps {
  userEmail: string
  enabled: boolean
}

export function PDFWatermark({ userEmail, enabled }: PDFWatermarkProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (enabled) {
      setShow(true)
    }
  }, [enabled])

  if (!enabled || !show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="transform rotate-[-45deg] text-slate-900 font-bold text-6xl whitespace-nowrap">
          {userEmail}
        </div>
      </div>
      
      {/* Diagonal watermarks */}
      <div className="absolute top-1/4 left-1/4 transform rotate-[-45deg] text-slate-500 font-semibold text-2xl opacity-20">
        {userEmail}
      </div>
      <div className="absolute bottom-1/4 right-1/4 transform rotate-[-45deg] text-slate-500 font-semibold text-2xl opacity-20">
        {userEmail}
      </div>
      
      {/* Bottom corner watermark */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-600 bg-white/80 px-2 py-1 rounded">
        Viewed by: {userEmail}
      </div>
    </div>
  )
}