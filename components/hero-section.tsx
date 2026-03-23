
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    // overflow-visible = lets SocialProofSection bleed out below
    // pb-32 = enough room so the image overlaps into the hero bg
    <section className="relative pt-12 sm:pt-16 md:pt-20 pb-32">
      <div className="" />

      <div className="relative container px-4">
        <div className="mx-auto max-w-4xl">

          {/* Main Heading */}
          <h1 className="mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-6xl font-semibold tracking-tight leading-tight md:leading-[1.1] text-slate-900 text-left md:text-center">
            Stop Guessing{" "}
            <span className="text-sky-600">
  Know Exactly When Deals Move
</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl text-left md:text-center md:mx-auto">
            Track every view and see when prospects truly understand your documents. Get alerts and follow up at the perfect moment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start md:items-center md:justify-center gap-4">
            <Button
  size="lg"
  className="
    text-base px-8 py-6
    bg-sky-600 text-white
    hover:bg-sky-700
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