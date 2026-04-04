"use client"

import { useRef, useState, useEffect } from "react"
import { Play, X } from "lucide-react"

// ── Fullscreen Modal ──────────────────────────────────────────
function VideoModal({ onClose }: { onClose: () => void }) {
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
      className="fixed inset-0 z-[200] flex items-center justify-center  backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
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
          src="/videos/demo.mp4"
          poster="/assets/feature-upload.png"
          className="w-full h-auto max-h-[85vh] object-contain"
          controls
          playsInline
          preload="auto"
        />
      </div>
    </div>
  )
}

// ── Thumbnail Card ────────────────────────────────────────────
export function VideoPlayer() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Thumbnail — click opens modal */}
      <div
        className="relative  aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl cursor-pointer group max-w-4xl mx-auto border border-slate-200"
        onClick={() => setModalOpen(true)}
      >
        {/* Poster image */}
        <img
          src="/assets/feature-upload.png"
          alt="DocMetrics walkthrough preview"
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0  flex flex-col items-center justify-center group-hover:bg-slate-900/50 transition-colors duration-200">
          <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200 mb-4">
            <Play className="h-8 w-8 text-sky-600 fill-sky-600 ml-1" />
          </div>
          <p className="text-white font-semibold text-lg">
            Watch the full walkthrough
          </p>
          <p className="text-white/60 text-sm mt-1">
            4 min 27 sec · No sound needed
          </p>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <VideoModal onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}