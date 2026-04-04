"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, X, ArrowRight } from "lucide-react"
import Link from "next/link"

const VIDEOS = [
  {
    id: "tracking",
    title: "Know Exactly Who Read What",
    description: "See every page your prospect spent time on, how long they stayed, and where they dropped off — all in real time.",
    src: "/videos/tracking-demo.mp4",
    poster: "/assets/doc-tracking.png",
    href: "/features/analytics",
  },
  {
    id: "analytics",
    title: "Analytics That Drive Action",
    description: "Time spent per page, completion rates, and engagement scores — everything you need to follow up with confidence.",
    src: "/videos/analytics-demo.mp4",
    poster: "/assets/doc2-tracking.png",
    href: "/features/analytics",
  },
  {
    id: "dataroom",
    title: "Secure Data Rooms",
    description: "Create a branded space for investors or clients. Control access, track every view, and collect signatures — all in one place.",
    src: "/videos/dataroom-demo.mp4",
    poster: "/assets/feature-tracking.png",
    href: "/solutions/enterprise",
  },
]

// ── Fullscreen modal ──────────────────────────────────────────
function VideoModal({
  video,
  onClose,
}: {
  video: typeof VIDEOS[0]
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // auto-play when modal opens
  useEffect(() => {
    videoRef.current?.play()
    // lock body scroll
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    // backdrop
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center -sm p-4 sm:p-8"
      onClick={onClose}
    >
      {/* modal box — stop click bubbling */}
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* video — full quality, no crop */}
        <video
          ref={videoRef}
          src={video.src}
          poster={video.poster}
          className="w-full h-auto max-h-[80vh]"
          controls
          playsInline
          preload="auto"
        />
      </div>
    </div>
  )
}

// ── Video card ────────────────────────────────────────────────
function VideoCard({
  video,
  onPlay,
}: {
  video: typeof VIDEOS[0]
  onPlay: () => void
}) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md hover:shadow-xl transition-shadow duration-300">

      {/* Thumbnail — click opens modal */}
      <div
        className="relative bg-slate-900 aspect-[16/8] group cursor-pointer"
        onClick={onPlay}
      >
        <video
          src={video.src}
          poster={video.poster}
          className="w-full h-full object-contain"
          preload="metadata"
          playsInline
        />

        {/* overlay with play button */}
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center group-hover:bg-slate-900/50 transition-colors duration-200">
          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
            <Play className="h-5 w-5 text-[#0369a1] fill-[#0369a1] ml-0.5" />
          </div>
        </div>
      </div>

      {/* Text + learn more */}
      <div className="p-6 flex flex-col gap-3">
        <h3 className="text-base font-semibold text-slate-900">{video.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{video.description}</p>

        {/* Transparent "Learn more" link */}
        <Link
          href={video.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0284c7] hover:text-[#0369a1] transition-colors duration-150 group/link mt-1"
        >
          Learn more
          <ArrowRight className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>

    </div>
  )
}

// ── Section ───────────────────────────────────────────────────
export function VideoShowcaseSection() {
  const [activeVideo, setActiveVideo] = useState<typeof VIDEOS[0] | null>(null)

  return (
    <>
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 leading-tight">
              Built for teams who need to{" "}
              <span className="text-[#0284c7]">close deals faster</span>
            </h2>
            <p className="mt-4 text-base text-slate-500 max-w-xl mx-auto">
              Watch how teams use DocMetrics to track documents, manage data rooms and close deals faster.
            </p>
          </div>

          {/* 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIDEOS.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={() => setActiveVideo(video)}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Fullscreen modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </>
  )
}