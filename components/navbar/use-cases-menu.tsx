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

const useCases = [
  {
    emoji: "💼",
    title: "Sales Teams",
    href: "/use-cases/sales",
    description: "Track proposals and close deals faster with engagement insights",
  },
  {
    emoji: "🏢",
    title: "Real Estate Agents",
    href: "/use-cases/real-estate",
    description: "Know which properties interest clients the most",
  },
  {
    emoji: "💻",
    title: "Freelancers",
    href: "/use-cases/freelancers",
    description: "See when clients review your portfolios and proposals",
  },
  {
    emoji: "🎯",
    title: "Recruiters",
    href: "/use-cases/recruiters",
    description: "Track which candidates engage with job descriptions",
  },
  {
    emoji: "💰",
    title: "Investors",
    href: "/use-cases/investors",
    description: "Monitor pitch deck views and investor engagement",
  },
  {
    emoji: "📚",
    title: "Content Creators",
    href: "/use-cases/creators",
    description: "Measure performance of ebooks, guides, and resources",
  },
]

export function UseCasesMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">
            Use Cases
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[500px] p-4">
              <div className="mb-4">
                <h4 className="mb-1 text-sm font-medium leading-none">
                  Who Uses DocMetrics
                </h4>
                <p className="text-sm text-muted-foreground">
                  Solutions tailored to your industry
                </p>
              </div>
              <div className="grid gap-2">
                {useCases.map((useCase) => (
                  <UseCaseItem
                    key={useCase.title}
                    emoji={useCase.emoji}
                    title={useCase.title}
                    href={useCase.href}
                  >
                    {useCase.description}
                  </UseCaseItem>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const UseCaseItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { emoji: string }
>(({ className, title, children, emoji, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div className="space-y-1">
              <div className="text-sm font-medium leading-none">{title}</div>
              <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                {children}
              </p>
            </div>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  )
})