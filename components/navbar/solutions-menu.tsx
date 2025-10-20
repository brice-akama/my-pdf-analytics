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
import { Briefcase, Building2, Code2, GraduationCap, Home, TrendingUp } from "lucide-react"

const solutions = [
  {
    emoji: "💼",
    title: "Sales Teams",
    href: "/solutions/sales",
    description: "Close more deals with proposal tracking and engagement insights",
    icon: Briefcase,
  },
  {
    emoji: "🏢",
    title: "Real Estate",
    href: "/solutions/real-estate",
    description: "Track property brochures and know which listings interest clients",
    icon: Home,
  },
  {
    emoji: "💻",
    title: "Freelancers & Agencies",
    href: "/solutions/freelancers",
    description: "Monitor portfolio views and client engagement with proposals",
    icon: Code2,
  },
  {
    emoji: "🎯",
    title: "Recruiting",
    href: "/solutions/recruiting",
    description: "See which candidates engage with job descriptions and offers",
    icon: GraduationCap,
  },
  {
    emoji: "💰",
    title: "Fundraising",
    href: "/solutions/fundraising",
    description: "Track investor engagement with pitch decks and term sheets",
    icon: TrendingUp,
  },
  {
    emoji: "🏛️",
    title: "Enterprise",
    href: "/solutions/enterprise",
    description: "Secure document sharing with advanced analytics and controls",
    icon: Building2,
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
                    icon={solution.icon}
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
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}

const SolutionItem = React.forwardRef<HTMLAnchorElement, SolutionItemProps>(
  ({ className, title, children, icon: Icon, href }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
              className
            )}
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-100">
                  <Icon className="h-4 w-4 text-purple-600" />
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm font-semibold leading-none text-gray-900">{title}</div>
                <p className="line-clamp-2 text-xs leading-snug text-gray-600">
                  {children}
                </p>
              </div>
            </div>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  }
)

SolutionItem.displayName = "SolutionItem"