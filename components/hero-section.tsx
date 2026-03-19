import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Background — pure indigo gradient */}
      <div className="" />

      {/* Content */}
      <div className="relative container px-4">
        <div className="mx-auto max-w-4xl">

          {/* Main Heading */}
          <h1 className="mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-tight md:leading-[1.1] text-slate-900 text-left md:text-center">
  Know When Your{" "}
  <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
    Documents Are Opened
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
                bg-indigo-600 text-white
                hover:bg-indigo-700
                shadow-lg hover:shadow-xl
                transition-all
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