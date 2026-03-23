"use client"

import { JSX, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mt-16 mb-8">
      {children}
    </p>
  )
}

function ScreenshotBlock({
  title,
  description,
  imageSrc,
  imageAlt,
  reverse = false,
}: {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  reverse?: boolean
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
      <div className={reverse ? "lg:order-2" : "lg:order-1"}>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
          {title}
        </h2>
        <p className="text-base text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className={`${reverse ? "lg:order-1" : "lg:order-2"} rounded-2xl overflow-hidden shadow-xl bg-slate-50`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1200}
          height={800}
          quality={100}
          className="w-full h-auto block"
        />
      </div>
    </div>
  )
}

function VideoBlock({
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
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play(); setPlaying(true) }
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
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
      <div className={reverse ? "lg:order-2" : "lg:order-1"}>
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-snug mb-4">
          {title}
        </h2>
        <p className="text-base text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div
        ref={containerRef}
        className={`${reverse ? "lg:order-1" : "lg:order-2"} relative rounded-2xl overflow-hidden shadow-xl bg-slate-900 cursor-pointer group`}
        onClick={toggle}
      >
        <video
          ref={ref}
          src={videoSrc}
          poster={posterSrc}
          className="w-full h-auto block"
          playsInline
          loop
          muted
          onEnded={() => setPlaying(false)}
        />
        <div className={`absolute inset-0 bg-slate-900/30 flex items-center justify-center transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
          <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            {playing
             ? <div className="flex gap-1"><div className="h-4 w-1.5 bg-sky-600 rounded-full" /><div className="h-4 w-1.5 bg-sky-600 rounded-full" /></div>
: <Play className="h-5 w-5 text-sky-600 fill-sky-600 ml-0.5" />
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentAnalyticsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
           <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-4">
              Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-5">
              Know exactly what happens{" "}
               <span className="text-sky-600">after you send.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              Every document you share becomes a live data source. See who read it, how long they spent on each page, whether they understood it, and where they dropped off.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">No credit card required</p>
          </div>

          {/* Hero image — use the dashboard screenshot you uploaded */}
          <div className="rounded-2xl overflow-hidden shadow-xl bg-slate-50">
            <Image
              src="/assets/feature-dataroom.png"
              alt="DocMetrics most engaged contacts dashboard"
              width={1200}
              height={800}
              quality={100}
              priority
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>

      {/* ── Feature sections ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <SectionLabel>Page by page reading data</SectionLabel>

        {/* Bar chart — video because hover popup cannot be shown in screenshot */}
        <VideoBlock
          title="See how long each person spent on every page."
          description="When someone opens your document a bar chart builds in real time showing their reading time per page. Tall bars mean they read carefully. Short bars mean they skimmed or skipped. Hover over any bar to see a thumbnail of that page and the exact time spent. You see this for every visitor individually — not averaged across everyone."
          videoSrc="/videos/analytics-demo.mp4"
          posterSrc="/assets/screenshots/page-bar-chart-poster.png"
        />

        <SectionLabel>Visitor identity and history</SectionLabel>

        <ScreenshotBlock
          title="Know who opened your document, not just that someone did."
          description="Every visitor is identified by their email address — either captured at the gate before they open the link, or matched against your share link settings. You see their first visit, every return visit, total time spent across all sessions, and which pages they came back to. Multiple visits from the same person stack into one profile so you see the full picture of their engagement over time."
          imageSrc="/assets/doc-open.png"
          imageAlt="Visitor engagement profile"
          reverse
        />

        <SectionLabel>Understanding analytics</SectionLabel>

        <ScreenshotBlock
          title="Reading time tells you how long. This tells you if they understood."
          description="For every page that has a video walkthrough recorded, you see two bars per visitor — their reading time and how much of your explanation they watched. If someone watched your page 4 walkthrough three times you know that page needs a conversation. If they marked every page as clear and answered ready to move forward on the deal intent question, you know the timing is right to close."
          imageSrc="/assets/understanding-bars.png"
          imageAlt="Do they understand it analytics"
        />

        <SectionLabel>Real time notifications</SectionLabel>

        <VideoBlock
  title="Know the moment someone opens your document."
  description="The instant a recipient opens your share link you receive a notification — in your dashboard, by email, and in Slack if connected. The notification includes their email, which document they opened, and what time. If they are viewing right now a live indicator appears on your dashboard. You always know when to follow up and you never have to guess whether they have seen it yet."
  videoSrc="/videos/tracking-demo.mp4"
  posterSrc="/assets/screenshots/notifications-poster.png"
  reverse
/>

        <SectionLabel>Signature analytics</SectionLabel>

        <ScreenshotBlock
          title="Track the entire signing journey, not just the outcome."
          description="For every signature request you see a funnel — how many recipients opened the document, how many scrolled to the signature field, how many started signing, and how many completed it. For each individual signer you see their reading time per page, their video walkthrough completion, and if they declined, the page they were on and the reason they gave."
          imageSrc="/assets/signature-analytics.png"
          imageAlt="E-signature analytics funnel"
        />

        <SectionLabel>Dashboard overview</SectionLabel>

        <ScreenshotBlock
          title="Your most engaged contacts, always at the top."
          description="Your dashboard shows the contacts who have spent the most time across all your documents in the last 30 days — ranked by visits, total time, and number of documents viewed. Below that you see your top documents by views, your most recent visits in real time, and your hottest visitors by engagement score. Everything you need to know about what is happening across your entire document library, without digging."
          imageSrc="/assets/dashboard.png"
          imageAlt="DocMetrics dashboard overview"
          reverse
        />

      </div>

      {/* ── CTA ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-sky-600 px-8 py-14 sm:px-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
            See your own documents come alive.
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
            Upload any PDF and share it. You will see your first analytics within seconds of your recipient opening the link.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-3 rounded-xl hover:bg-sky-50 transition-colors shadow-sm text-sm">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 border border-white/40 text-white font-medium px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">
              How it works
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-5">No credit card required</p>
        </div>
      </div>

    </div>
  )
}