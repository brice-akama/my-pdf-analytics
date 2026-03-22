"use client"

import * as React from "react"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

type ResourceItemType = {
  title: string
  href: string
  description: string
}

const resources: { learn: ResourceItemType[]; support: ResourceItemType[] } = {
  learn: [
    {
      title: "Getting Started",
      href: "https://docmetrics-documentation.gitbook.io/docs",
      description: "Quick setup guide to start tracking in minutes",
    },
    {
      title: "Best Practices",
      href: "/blog/best-practices",
      description: "Tips to maximize document engagement",
    },
  ],
  support: [
    {
      title: "Contact Us",
      href: "/contact",
      description: "Get in touch with our team",
    },
  ],
}

type ResourceItemProps = {
  href: string
  title: string
  description: string
  target?: string
  rel?: string
}

function ResourceItem({ href, title, description, target, rel }: ResourceItemProps) {
  return (
    <div>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          target={target}
          rel={rel}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
          )}
        >
          <div className="text-sm font-semibold leading-none text-gray-900 mb-1">
            {title}
          </div>
          <p className="text-xs leading-snug text-gray-600">
            {description}
          </p>
        </Link>
      </NavigationMenuLink>
    </div>
  )
}

export function ResourcesMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[550px] p-4 bg-white">
              <div className="grid grid-cols-2 gap-6">

                {/* Learn Section */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                    Learn
                  </h4>
                  <div className="space-y-1">
                    {resources.learn.map((item) => (
                      <ResourceItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        description={item.description}
                        target={item.href.startsWith('https') ? '_blank' : undefined}
                        rel={item.href.startsWith('https') ? 'noopener noreferrer' : undefined}
                      />
                    ))}
                  </div>
                </div>

                {/* Support Section */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                    Support
                  </h4>
                  <div className="space-y-1">
                    {resources.support.map((item) => (
                      <ResourceItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        description={item.description}
                      />
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