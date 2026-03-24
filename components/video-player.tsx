"use client"

import { useRef, useState } from "react"
import { Play } from "lucide-react"

export function VideoPlayer() {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play()
      setPlaying(true)
    }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl aspect-video cursor-pointer group"
      onClick={toggle}
    >
      <video
        ref={ref}
        src="/videos/demo.mp4"
        poster="/assets/screenshots/demo-poster.png"
        className="w-full h-full object-cover"
        playsInline
        onEnded={() => setPlaying(false)}
      />

      <div
        className={`absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center transition-opacity duration-200 ${
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-200 mb-4">
          {playing ? (
            <div className="flex gap-1.5">
              <div className="h-5 w-1.5 bg-sky-600 rounded-full" />
              <div className="h-5 w-1.5 bg-sky-600 rounded-full" />
            </div>
          ) : (
            <Play className="h-8 w-8 text-sky-600 fill-sky-600 ml-1" />
          )}
        </div>
        <p className="text-white font-semibold text-lg">
          Watch the full walkthrough
        </p>
        <p className="text-white/60 text-sm mt-1">
          2 minutes · No sound needed
        </p>
      </div>
    </div>
  )
}