
"use client"

import { JSX, useRef, useState } from "react"
import Link from "next/link"
import { Play, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function VideoPlayer() {
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
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl aspect-video cursor-pointer group"
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

      {/* Overlay — hidden when playing */}
      <div className={`absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-200 mb-4">
          {playing
           ? <div className="flex gap-1.5"><div className="h-5 w-1.5 bg-sky-600 rounded-full" /><div className="h-5 w-1.5 bg-sky-600 rounded-full" /></div>
: <Play className="h-8 w-8 text-sky-600 fill-sky-600 ml-1" />
          }
        </div>
        <p className="text-white font-semibold text-lg">Watch the full walkthrough</p>
        <p className="text-white/60 text-sm mt-1">2 minutes · No sound needed</p>
      </div>
    </div>
  )
}

export default function SeeItInActionPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
         <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
          See It In Action
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
          The whole product in{" "}
          <span className="text-sky-600">two minutes.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
          Watch a real walkthrough of DocMetrics — from uploading a document to seeing exactly how long each person spent on every page.
        </p>
      </div>

      {/* ── Video ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <VideoPlayer />

        {/* What the video covers */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { time: "0:00", label: "Upload a document" },
            { time: "0:30", label: "Create a share link" },
            { time: "0:55", label: "See who read what" },
            { time: "1:30", label: "Spaces & data rooms" },
          ].map((item) => (
            <div key={item.time} className="flex items-start gap-2.5">
              <span className="text-xs font-mono font-semibold text-sky-500 mt-0.5 flex-shrink-0">
                {item.time}
              </span>
              <span className="text-xs text-slate-500 leading-relaxed">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
         <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            Ready to try it yourself?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Start for free — no credit card required. Upload your first document and see real analytics in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
  href="/signup"
  className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm"
>
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              How it works
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}