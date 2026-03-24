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
              <div className="h-8 w-8">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <defs>
                  <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#3B82F6", stopOpacity: 1 }} />
                  </linearGradient>
                  <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#60A5FA", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#A78BFA", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#mainGradient)" />
                <path d="M 120 50 L 120 70 L 140 70 Z" fill="url(#accentGradient)" opacity="0.7" />
                <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2" />
                <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2" />
                <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2" />
                <path d="M 75 105 L 88 90 L 100 92 L 113 78 L 125 75" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
                <circle cx="81" cy="97" r="3" fill="white" />
                <circle cx="94" cy="91" r="3" fill="white" />
                <circle cx="107" cy="85" r="3" fill="white" />
                <circle cx="119" cy="76" r="3" fill="white" />
              </svg>
            </div>
              <span className="text-xl font-bold text-blue-600">DocMetrics</span>
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
               
               
            </ul>
          </div>

         
          {/* Column 4: Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="https://docmetrics-documentation.gitbook.io/docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Getting Started
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
                <Link href="/solutions/fundraising" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Fundraising
                </Link>
              </li>
              <li>
                <Link href="/solutions/enterprise" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Client Portals
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