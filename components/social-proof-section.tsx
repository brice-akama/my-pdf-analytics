"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"

const SLIDES = [
  {
    id: "upload",
    label: "Upload documents",
    image: "/assets/feature-upload.png",
  },
  {
    id: "track",
    label: "Track visitor analytics",
    image: "/assets/feature-tracking.png",
  },
  {
    id: "dataroom",
    label: "Create a Data Room",
    image: "/assets/feature-dataroom.png",
  },
]

const AUTO_INTERVAL = 4000

export function SocialProofSection() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)

  // ✅ SAFE CURRENT SLIDE (prevents crash)
  const currentSlide = SLIDES[active] || SLIDES[0]

  const goTo = useCallback(
    (idx: number) => {
      if (idx === active) return
      setFading(true)
      setTimeout(() => {
        setActive(idx)
        setFading(false)
      }, 180)
    },
    [active]
  )

  // ✅ AUTO SLIDE
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActive((prev) => (prev + 1) % SLIDES.length)
        setFading(false)
      }, 180)
    }, AUTO_INTERVAL)

    return () => clearInterval(id)
  }, [])

  // ✅ SAFETY RESET (if slides change)
  useEffect(() => {
    if (active >= SLIDES.length) {
      setActive(0)
    }
  }, [active])

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* IMAGE */}
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <span className="text-sm text-slate-300 tracking-wide">
              {currentSlide.image}
            </span>
          </div>

          {/* Image */}
          <Image
            key={currentSlide.id}
            src={currentSlide.image}
            alt={currentSlide.label}
            fill
            className="object-cover object-top transition-opacity duration-200"
            style={{ opacity: fading ? 0 : 1 }}
            priority={active === 0}
          />
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:flex items-stretch justify-center border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden">
          {SLIDES.map((slide, i) => (
            <div key={slide.id} className="flex flex-1">
              {i > 0 && <div className="w-px bg-slate-200 shrink-0" />}
              <button
                onClick={() => goTo(i)}
                className={`relative flex-1 px-5 py-4 text-sm font-medium text-center transition-colors duration-150 ${
                  active === i
                    ? "text-slate-900 bg-white"
                    : "text-slate-500 bg-white hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {active === i && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                )}
                {slide.label}
              </button>
            </div>
          ))}
        </div>

        {/* TABLET */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className={`relative px-5 py-4 text-sm font-medium text-center transition-colors duration-150 ${
                i === 1 ? "border-l border-slate-200" : ""
              } ${i >= 2 ? "border-t border-slate-200" : ""} ${
                active === i
                  ? "text-slate-900 bg-white"
                  : "text-slate-500 bg-white hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {active === i && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
              )}
              {slide.label}
            </button>
          ))}
        </div>

        {/* MOBILE */}
        <div className="flex sm:hidden flex-col border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden divide-y divide-slate-200">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className={`relative px-5 py-3.5 text-sm font-medium text-left transition-colors duration-150 ${
                active === i
                  ? "text-slate-900 bg-white"
                  : "text-slate-500 bg-white hover:text-slate-800"
              }`}
            >
              {active === i && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-900" />
              )}
              {slide.label}
            </button>
          ))}
        </div>

      </div>
    </section>
  )
}