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

const solutions = [
  {
    title: "Sales Teams",
    href: "/solutions/sales",
    description: "Close more deals with proposal tracking and engagement insights",
  },
  {
    title: "Fundraising",
    href: "/solutions/fundraising",
    description: "Track investor engagement with pitch decks and term sheets",
  },
  {
    title: "Client Portals",
    href: "/solutions/enterprise",
    description: "Secure document sharing with advanced analytics and controls",
  },
]

export function SolutionsMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">
            Solutions
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[550px] p-4 bg-white">
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-bold leading-none text-gray-900">
                  Solutions by Industry
                </h4>
                <p className="text-sm text-gray-600">
                  Tailored for your specific needs
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {solutions.map((solution) => (
                  <SolutionItem
                    key={solution.title}
                    title={solution.title}
                    href={solution.href}
                  >
                    {solution.description}
                  </SolutionItem>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

interface SolutionItemProps {
  title: string
  href: string
  children: React.ReactNode
  className?: string
}

function SolutionItem({ className, title, children, href }: SolutionItemProps) {
  return (
    <div>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
            className
          )}
        >
          <div className="text-sm font-semibold leading-none text-gray-900 mb-1">
            {title}
          </div>
          <p className="line-clamp-2 text-xs leading-snug text-gray-600">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </div>
  )
}