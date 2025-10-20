"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductMenu } from "./product-menu";
import { SolutionsMenu } from "./solutions-menu";
import { ResourcesMenu } from "./resources-menu";
import { MobileNav } from "./mobile-nav";
import { UserNav } from "./user-nav";

export function Navbar() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isLoggedIn = false;

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-purple-100/50 bg-gradient-to-r from-purple-50/95 to-blue-50/95 backdrop-blur supports-[backdrop-filter]:bg-purple-50/80">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <defs>
                  <linearGradient
                    id="mainGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" style={{ stopColor: "#8B5CF6", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#3B82F6", stopOpacity: 1 }} />
                  </linearGradient>
                  <linearGradient
                    id="accentGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" style={{ stopColor: "#60A5FA", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#A78BFA", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z"
                  fill="url(#mainGradient)"
                />
                <path
                  d="M 120 50 L 120 70 L 140 70 Z"
                  fill="url(#accentGradient)"
                  opacity="0.7"
                />
                <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2" />
                <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2" />
                <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2" />
                <path
                  d="M 75 105 L 88 90 L 100 92 L 113 78 L 125 75"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <circle cx="81" cy="97" r="3" fill="white" />
                <circle cx="94" cy="91" r="3" fill="white" />
                <circle cx="107" cy="85" r="3" fill="white" />
                <circle cx="119" cy="76" r="3" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold">DocMetrics</span>
          </Link>

          {/* Desktop Navigation — only render on client to avoid hydration mismatch */}
          {isClient && (
            <nav className="hidden md:flex items-center gap-4">
              <ProductMenu />
              <SolutionsMenu />
              <ResourcesMenu />
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </nav>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {isClient && isLoggedIn ? (
            <UserNav />
          ) : (
            isClient && (
              <>
                <Link href="/login" className="hidden md:block ">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="hidden md:block bg-black text-white px-4 py-2 shadow-lg hover:shadow-xl transition-shadow">
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )
          )}

          {isClient && <MobileNav />}
        </div>
      </div>
    </header>
  );
}