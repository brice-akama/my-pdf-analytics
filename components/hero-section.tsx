import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    // Matches navbar gradient for seamless integration
    <section className="relative  bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100
 pt-20 pb-32">
      <div className="container px-4">
        <div className="mx-auto max-w-4xl">
          
          {/* Main Heading */}
<h1 className="mb-6 text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl md:text-7xl text-left md:text-center">
  Know When Your
  <br className="hidden md:block" /> {/* Hide on mobile, show on md+ */}
  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
    PDFs Are Opened
  </span>
</h1>

          {/* Subtitle */}
          <p className="mb-10 text-lg text-gray-600 sm:text-xl md:text-2xl max-w-2xl text-left md:text-center md:mx-auto">
            Track every view, page, and second spent on your documents. Get instant alerts when prospects engage, and follow up at the perfect moment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-start md:items-center md:justify-center gap-4">
            <Button 
              size="lg" 
              className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto bg-black text-white border-2" 
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
              className="text-base px-8 py-6 w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors" 
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