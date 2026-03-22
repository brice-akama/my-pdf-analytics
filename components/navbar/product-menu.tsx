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

const platformFeatures = [
  {
    title: "How it Works",
    href: "/product/how-it-works",
    description: "See the complete workflow from upload to insights",
  },
  {
    title: "Security and Control",
    href: "/product/security",
    description: "Enterprise-grade security and permissions",
  },
  {
    title: "See It In Action",
    href: "/product/demo",
    description: "Watch live demo of DocMetrics in action",
    badge: "Video",
  },
]

const features = [
  {
    title: "Document Analytics",
    href: "/features/analytics",
    description: "Track every view, page, and interaction",
  },
]

type NavItemProps = {
  title: string
  href: string
  children?: React.ReactNode
  className?: string
}

function PlatformItem({ title, href, children, className }: NavItemProps) {
  return (
    <div>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50",
            className
          )}
        >
          <div className="text-sm font-semibold leading-none text-gray-900 mb-1">
            {title}
          </div>
          <p className="text-xs leading-snug text-gray-500">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </div>
  )
}

function FeatureItem({ title, href, children, className }: NavItemProps) {
  return (
    <div>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50 focus:bg-gray-50",
            className
          )}
        >
          <div className="text-sm font-semibold leading-none text-gray-900 mb-1">
            {title}
          </div>
          <p className="text-xs leading-snug text-gray-500">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </div>
  )
}

export function ProductMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">
            Product
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[500px] p-4 bg-white">

              {/* Two column layout — platform left, features right */}
              <div className="grid grid-cols-2 gap-6">

                {/* LEFT — Platform */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Platform
                  </h4>
                  <div className="grid gap-1">
                    {platformFeatures.map((item) => (
                      <PlatformItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                      >
                        {item.description}
                      </PlatformItem>
                    ))}
                  </div>
                </div>

                {/* RIGHT — Features */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Features
                  </h4>
                  <div className="grid gap-1">
                    {features.map((feature) => (
                      <FeatureItem
                        key={feature.title}
                        title={feature.title}
                        href={feature.href}
                      >
                        {feature.description}
                      </FeatureItem>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}