import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-blue-300 to-indigo-300" />
      
      {/* Brightness stabilizer (premium trick) */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Content */}
      <div className="relative container px-4">
        <div className="mx-auto max-w-4xl">
          
          {/* Main Heading */}
          <h1 className="mb-6 text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl md:text-7xl text-left md:text-center">
            Know When Your
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Documents Are Opened
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg sm:text-xl md:text-2xl text-slate-700 max-w-2xl text-left md:text-center md:mx-auto">
            Track every view, page, and second spent on your documents.
            Get instant alerts when prospects engage, and follow up at the
            perfect moment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start md:items-center md:justify-center gap-4">
            <Button
              size="lg"
              className="
                text-base px-8 py-6
                bg-slate-900 text-white
                hover:bg-slate-800
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

            <Button
              size="lg"
              variant="outline"
              className="
                text-base px-8 py-6
                w-full sm:w-auto
                border-slate-400
                text-slate-800
                hover:bg-white/60
                hover:border-slate-500
                transition-colors
              "
              asChild
            >
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  )
}
