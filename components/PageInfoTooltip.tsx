"use client"

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      setTimeout(() => {
        setShow(true)
      }, 800)
    }
  }, [pageId])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(`tooltip-seen-${pageId}`, 'true')
  }

  if (!show) return null

  return (
    <>
      {/* Subtle backdrop - NO CLICK TO DISMISS */}
      <div className="fixed inset-0   z-[100] animate-in fade-in duration-500 pointer-events-none" />
      
      {/* ✅ FIXED TOP-RIGHT TOOLTIP - CURVED & BEAUTIFUL */}
      <div className="fixed top-6 right-6 z-[101] animate-in slide-in-from-top-2 fade-in duration-500 max-w-sm">
        <div className="relative">
          
          
          {/* Main tooltip card */}
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 text-white rounded-2xl shadow-2xl p-6 border border-white/20">
            {/* Sparkle icon */}
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-bounce">
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </div>
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="ml-auto h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all flex items-center justify-center group"
                aria-label="Dismiss tooltip"
              >
                <X className="h-4 w-4 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Message */}
            <p className="text-sm leading-relaxed text-white/95 mb-5 pr-2">
              {message}
            </p>

            {/* Got It button - Curved & Fancy */}
            <Button
              onClick={handleDismiss}
              className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl h-11"
            >
              Got It
            </Button>

            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-tr-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tl from-blue-400/20 to-transparent rounded-bl-2xl pointer-events-none"></div>
          </div>
        </div>
      </div>
    </>
  )
}