import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container px-4 py-12 sm:py-16">
        
        {/* Main Footer Content */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          
          {/* Column 1: Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-blue-600">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DocMetrics</span>
            </Link>
            <p className="mb-6 text-sm text-gray-600 leading-relaxed">
              Track every view, page, and interaction. Know exactly when prospects engage with your documents.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/product/how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="/product/demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  See It In Action
                </Link>
              </li>
              <li>
                <Link href="/product/security" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Security & Control
                </Link>
              </li>
              <li>
                <Link href="/features/analytics" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Document Analytics
                </Link>
              </li>
              <li>
                <Link href="/features/notifications" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Real-Time Notifications
                </Link>
              </li>
              <li>
                <Link href="/features/engagement" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Engagement Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Solutions
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/solutions/sales" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Sales Teams
                </Link>
              </li>
              <li>
                <Link href="/solutions/real-estate" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Real Estate
                </Link>
              </li>
              <li>
                <Link href="/solutions/freelancers" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Freelancers
                </Link>
              </li>
              <li>
                <Link href="/solutions/recruiting" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Recruiting
                </Link>
              </li>
              <li>
                <Link href="/solutions/fundraising" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Fundraising
                </Link>
              </li>
              <li>
                <Link href="/solutions/enterprise" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Enterprise
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs/getting-started" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Video Tutorials
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} DocMetrics. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Cookies
              </Link>
              <Link href="/sitemap" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}