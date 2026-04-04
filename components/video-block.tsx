"use client"

import { useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"

export function VideoBlock({
  title,
  description,
  videoSrc,
  posterSrc,
  reverse = false,
}: {
  title: string
  description: string
  videoSrc: string
  posterSrc: string
  reverse?: boolean
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = ref.current
          if (!el) return
          if (entry.isIntersecting) {
            el.play()
              .then(() => setPlaying(true))
              .catch(() => {})
          } else {
            el.pause()
            setPlaying(false)
          }
        })
      },
      { threshold: 0.5 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mb-20">

      {/* Text on top */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-3">
          {title}
        </h2>
        <p className="text-base text-slate-500 leading-relaxed max-w-3xl">
          {description}
        </p>
      </div>

      {/* Video full width — same pattern as VideoShowcaseSection */}
      <div
        ref={containerRef}
        className="relative  aspect-[16/] rounded-2xl overflow-hidden shadow-xl cursor-pointer group max-w-5xl mx-auto"
        onClick={toggle}
      >
        <video
          ref={ref}
          src={videoSrc}
          poster={posterSrc}
          className="w-full h-full object-contain"
          playsInline
          loop
          muted
          onEnded={() => setPlaying(false)}
        />

        {/* Play/pause overlay */}
        <div
          className={`absolute inset-0  flex items-center justify-center transition-opacity duration-200 ${
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            {playing ? (
              <div className="flex gap-1">
                <div className="h-4 w-1.5 bg-sky-600 rounded-full" />
                <div className="h-4 w-1.5 bg-sky-600 rounded-full" />
              </div>
            ) : (
              <Play className="h-5 w-5 text-sky-600 fill-sky-600 ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}