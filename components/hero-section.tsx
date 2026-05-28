
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    // overflow-visible = lets SocialProofSection bleed out below
    // pb-32 = enough room so the image overlaps into the hero bg
    <section className="relative pt-12 sm:pt-16 md:pt-20 pb-32 w-full flex flex-col items-center">
      <div className="" />

     <div className="relative container mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-4xl">

          {/* Main Heading */}
          <h1 className="mb-6 text-2xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-4xl font-semibold tracking-tight leading-tight md:leading-[1.1] text-slate-900 text-left md:text-center">
  Post-proposal{" "}
  <span className="text-blue-600">
    intelligence for sales teams
  </span>
</h1>   

          {/* Subtitle */}
          <p className="mb-10 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl text-left md:text-center md:mx-auto">
            Not just who opened it — what they actually did with it.Track re-reads, stakeholder activity, and deal momentum before the deal quietly stalls.

          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start md:items-center md:justify-center gap-4">
            <Button
  size="lg"
  className="
    text-base px-8 py-6
    bg-blue-600 text-white
    hover:bg-blue-700
    transition-colors
    w-full sm:w-auto
  "
  asChild
>
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  )
}