"use client"

import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { BarChart2, Database, Users } from "lucide-react"

const CARDS = [
  {
    id: "analytics",
    tag: "Document Analytics",
    icon: BarChart2,
    heading: "Know exactly how your documents perform.",
    description:
      "See who opened your document, how long they spent on each page, and which sections captured the most attention — all in real time.",
    // sky blue family — brand.primary
    cardBg:   "bg-[#e0f2fe]",
    iconBg:   "bg-[#bae6fd]",
    iconColor:"text-[#0369a1]",
    tagColor: "text-[#0284c7]",
    image: "/assets/feature-tracking.png",
    imageAlt: "Document Analytics dashboard",
  },
  {
    id: "datarooms",
    tag: "Data Rooms",
    icon: Database,
    heading: "Create professional data rooms in one click.",
    description:
      "Organise your documents into secure, branded spaces. Share with investors, clients or partners — with full control over who sees what.",
    // purple family — brand.secondary
    cardBg:   "bg-[#f3e8ff]",
    iconBg:   "bg-[#e9d5ff]",
    iconColor:"text-[#7e22ce]",
    tagColor: "text-[#9333ea]",
    image: "/assets/feature-dataroom.png",
    imageAlt: "Data Room spaces",
  },
  {
    id: "collaboration",
    tag: "Team Collaboration",
    icon: Users,
    heading: "Keep your whole team perfectly in sync.",
    description:
      "Invite teammates, assign roles and manage permissions. Everyone sees the same data — no more confusion over who has access to what.",
    // slightly deeper sky — still brand.primary family
    cardBg:   "bg-[#f0f9ff]",
    iconBg:   "bg-[#bae6fd]",
    iconColor:"text-[#075985]",
    tagColor: "text-[#0ea5e9]",
    image: "/assets/feature-upload.png",
    imageAlt: "Team collaboration view",
  },
]

const AUTO_INTERVAL = 5000

export function FeatureBentoSection() {
  const [active, setActive]     = useState(0)
  const [fading, setFading]     = useState(false)
  const [direction, setDirection] = useState<"left"|"right">("left")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (idx === active) return
    setDirection(idx > active ? "left" : "right")
    setFading(true)
    setTimeout(() => {
      setActive(idx)
      setFading(false)
    }, 220)
  }, [active])

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setDirection("left")
      setFading(true)
      setTimeout(() => {
        setActive(cur => (cur + 1) % CARDS.length)
        setFading(false)
      }, 220)
    }, AUTO_INTERVAL)
  }, [])

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer])

  const card = CARDS[active]
  const Icon = card.icon

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        

        {/* ── Card ── */}
        <div
          className={`
            rounded-2xl overflow-hidden ${card.cardBg}
            transition-opacity duration-200
            ${fading ? "opacity-0" : "opacity-100"}
          `}
        >
          <div className="flex flex-col lg:flex-row min-h-[420px]">

            {/* LEFT — text, vertically centered */}
            <div className="flex flex-col justify-center gap-5 p-8 sm:p-12 lg:p-14 lg:w-[44%] shrink-0">

              {/* Tag */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center rounded-lg p-2 ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
                <span className={`text-xs font-bold uppercase tracking-widest ${card.tagColor}`}>
                  {card.tag}
                </span>
              </div>

              {/* Heading */}
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {card.heading}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/*
              RIGHT — image centered vertically and horizontally
              No fill, no object-cover — full image always visible
              Sits in the middle of the right half, not at the bottom
            */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
              <div className="w-full rounded-xl overflow-hidden shadow-xl border border-white/80">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  width={1337}
                  height={576}
                  quality={100}
                  sizes="(max-width: 768px) 90vw, 50vw"
                  className="w-full h-auto"
                  priority={active === 0}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Dot indicators ── */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {CARDS.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); startTimer() }}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                active === i
                  ? "w-6 h-2 bg-[#0ea5e9]"
                  : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}