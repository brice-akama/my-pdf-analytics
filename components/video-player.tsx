"use client"

import { useState } from "react"
import { Play } from "lucide-react"

export function VideoPlayer() {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        <iframe
          src="https://www.youtube.com/embed/6YhYah-a7QQ?autoplay=1&rel=0&modestbranding=1"
          title="DocMetrics Product Walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  return (
    <div
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl cursor-pointer group border border-slate-200"
      onClick={() => setPlaying(true)}
    >
      {/* YouTube thumbnail */}
      <img
       src="https://img.youtube.com/vi/6YhYah-a7QQ/maxresdefault.jpg"
        alt="DocMetrics walkthrough preview"
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/30 flex flex-col items-center justify-center group-hover:bg-slate-900/50 transition-colors duration-200">
        <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200 mb-4">
          <Play className="h-8 w-8 text-sky-600 fill-sky-600 ml-1" />
        </div>
        <p className="text-white font-semibold text-lg">
          Watch the full walkthrough
        </p>
        <p className="text-white/60 text-sm mt-1">
          No sound needed
        </p>
      </div>
    </div>
  )
}