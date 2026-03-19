"use client"

import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"

const SLIDES = [
  {
    id: "upload",
    label: "Upload documents",
    image: "/assets/feature-upload.png",
  },
  {
    id: "track",
    label: "Track visitor analytics",
    image: "/assets/feature-dataroom.png",
  },
  {
    id: "dataroom",
    label: "Create a Data Room",
    image: "/assets/feature-tracking.png",
  },
]

const AUTO_INTERVAL = 4000

export function SocialProofSection() {
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [sliding, setSliding] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("left")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (idx: number) => {
      if (idx === active || sliding) return
      setDirection(idx > active ? "left" : "right")
      setPrev(active)
      setActive(idx)
      setSliding(true)
      setTimeout(() => {
        setPrev(null)
        setSliding(false)
      }, 400)
    },
    [active, sliding]
  )

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % SLIDES.length
        setDirection("left")
        setPrev(current)
        setSliding(true)
        setTimeout(() => {
          setPrev(null)
          setSliding(false)
        }, 400)
        return next
      })
    }, AUTO_INTERVAL)
  }, [])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  const handleTabClick = (idx: number) => {
    goTo(idx)
    startTimer()
  }

  const getSlideClass = (i: number) => {
    const isActive = i === active
    const isPrev = i === prev

    if (!sliding) {
      return isActive
        ? "absolute inset-0 z-20 translate-x-0"
        : "absolute inset-0 z-10 translate-x-full opacity-0"
    }
    if (isActive) {
      return direction === "left"
        ? "absolute inset-0 z-20 animate-slide-in-right"
        : "absolute inset-0 z-20 animate-slide-in-left"
    }
    if (isPrev) {
      return direction === "left"
        ? "absolute inset-0 z-10 animate-slide-out-left"
        : "absolute inset-0 z-10 animate-slide-out-right"
    }
    return "absolute inset-0 z-10 translate-x-full opacity-0"
  }

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0%); }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0%); }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0%); }
          to   { transform: translateX(-100%); }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0%); }
          to   { transform: translateX(100%); }
        }
        .animate-slide-in-right  { animation: slideInFromRight 400ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .animate-slide-in-left   { animation: slideInFromLeft  400ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .animate-slide-out-left  { animation: slideOutToLeft   400ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .animate-slide-out-right { animation: slideOutToRight  400ms cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>

      {/*
        -mt-36 pulls this section UP by 144px into the hero's pb-48.
        So ~144px of the image sits inside the hero background,
        and the rest (including the tab bar) hangs below into white.
        relative z-10 keeps it above the hero's background div.
        Adjust -mt-36 up/down to control how much sits inside the hero.
      */}
      <section className="relative z-0 -mt-20 pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          <div
            className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl"
            style={{ paddingTop: "43.08%" }}
          >
            {SLIDES.map((slide, i) => (
              <div key={slide.id} className={getSlideClass(i)}>
                <Image
                  src={slide.image}
                  alt={slide.label}
                  fill
                  quality={100}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1792px"
                  className="object-fill"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* DESKTOP TABS */}
          <div className="hidden lg:flex items-stretch justify-center border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden bg-white">
            {SLIDES.map((slide, i) => (
              <div key={slide.id} className="flex flex-1">
                {i > 0 && <div className="w-px bg-slate-200 shrink-0" />}
                <button
                  onClick={() => handleTabClick(i)}
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

          {/* TABLET TABS */}
          <div className="hidden sm:grid lg:hidden grid-cols-2 border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden bg-white">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => handleTabClick(i)}
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

          {/* MOBILE TABS */}
          <div className="flex sm:hidden flex-col border border-t-0 border-slate-200 rounded-b-2xl overflow-hidden divide-y divide-slate-200 bg-white">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => handleTabClick(i)}
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
    </>
  )
}