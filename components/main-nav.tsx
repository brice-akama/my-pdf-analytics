"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

// ── data ────────────────────────────────────────────────────────────────────

const platformFeatures = [
  { title: "How it Works",       href: "/product/how-it-works", description: "See the complete workflow from upload to insights" },
  { title: "Security and Control", href: "/product/security",   description: "Enterprise-grade security and permissions" },
  { title: "See It In Action",   href: "/product/demo",         description: "Watch live demo of DocMetrics in action", badge: "Video" },
];

const features = [
  { title: "Document Analytics", href: "/features/analytics",  description: "Track every view, page, and interaction" },
];

const solutions = [
  { title: "Sales Teams",   href: "/solutions/sales",       description: "Close more deals with proposal tracking and engagement insights" },
  { title: "Fundraising",   href: "/solutions/fundraising",  description: "Track investor engagement with pitch decks and term sheets" },
  { title: "Client Portals", href: "/solutions/enterprise", description: "Secure document sharing with advanced analytics and controls" },
];

const resources = {
  learn: [
    { title: "Getting Started", href: "https://docmetrics-documentation.gitbook.io/docs", description: "Quick setup guide to start tracking in minutes" },
    { title: "Best Practices",  href: "/blog/best-practices", description: "Tips to maximize document engagement" },
    { title: "Blog",            href: "/blog",                description: "Latest news and insights on document analytics" },
  ],
  support: [
    { title: "Contact Us", href: "/contact", description: "Get in touch with our team" },
  ],
};

// ── shared item component ────────────────────────────────────────────────────

function NavItem({ title, href, description, className, target, rel }: {
  title: string; href: string; description: string;
  className?: string; target?: string; rel?: string;
}) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        target={target}
        rel={rel}
        className={cn(
          "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50",
          className
        )}
      >
        <div className="text-sm font-semibold leading-none text-gray-900 mb-1">{title}</div>
        <p className="text-xs leading-snug text-gray-500">{description}</p>
      </Link>
    </NavigationMenuLink>
  );
}

// ── unified nav ──────────────────────────────────────────────────────────────

export function MainNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList>

        {/* Product */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">Product</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[500px] p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Platform</h4>
                  <div className="grid gap-1">
                    {platformFeatures.map((item) => <NavItem key={item.title} {...item} />)}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Features</h4>
                  <div className="grid gap-1">
                    {features.map((item) => <NavItem key={item.title} {...item} />)}
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Solutions */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">Solutions</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[500px] p-4">
              <div className="mb-4">
                <h4 className="text-sm font-bold leading-none text-gray-900">Solutions by Industry</h4>
                <p className="mt-1 text-sm text-gray-600">Tailored for your specific needs</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {solutions.map((item) => <NavItem key={item.title} {...item} />)}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">Resources</NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[500px] p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">Learn</h4>
                  <div className="space-y-1">
                    {resources.learn.map((item) => (
                      <NavItem
                        key={item.title}
                        {...item}
                        target={item.href.startsWith("https") ? "_blank" : undefined}
                        rel={item.href.startsWith("https") ? "noopener noreferrer" : undefined}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">Support</h4>
                  <div className="space-y-1">
                    {resources.support.map((item) => <NavItem key={item.title} {...item} />)}
                  </div>
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  );
}