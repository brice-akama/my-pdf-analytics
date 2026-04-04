"use client"

import { useRef, useState, useEffect } from "react"
import { Play, X } from "lucide-react"

// ── Fullscreen Modal ──────────────────────────────────────────
function VideoModal({
  videoSrc,
  posterSrc,
  onClose,
}: {
  videoSrc: string
  posterSrc: string
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    videoRef.current?.play()
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center   p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          className="w-full h-auto max-h-[85vh] object-contain"
          controls
          playsInline
          preload="auto"
        />
      </div>
    </div>
  )
}

// ── Video Block ───────────────────────────────────────────────
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
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
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

        {/* Thumbnail — click opens modal */}
        <div
          className="relative  aspect-[16/9] rounded-2xl overflow-hidden shadow-xl cursor-pointer group max-w-4xl border border-slate-200"
          onClick={() => setModalOpen(true)}
        >
          {/* Poster image */}
          <img
            src={posterSrc}
            alt={title}
            className="w-full h-full object-contain"
          />

          {/* Overlay */}
          <div className="absolute inset-0  flex items-center justify-center group-hover:bg-slate-900/50 transition-colors duration-200">
            <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <Play className="h-5 w-5 text-sky-600 fill-sky-600 ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <VideoModal
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}