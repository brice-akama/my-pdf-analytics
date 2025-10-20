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
import { Book, FileText, Video, HelpCircle, MessageSquare, Code } from "lucide-react"

const resources = {
  learn: [
    {
      title: "Getting Started",
      href: "/docs/getting-started",
      description: "Quick setup guide to start tracking in minutes",
      icon: Book,
    },
    {
      title: "Video Tutorials",
      href: "/tutorials",
      description: "Watch step-by-step video guides",
      icon: Video,
    },
    {
      title: "Best Practices",
      href: "/blog/best-practices",
      description: "Tips to maximize document engagement",
      icon: FileText,
    },
  ],
  support: [
    {
      title: "Help Center",
      href: "/help",
      description: "Find answers to common questions",
      icon: HelpCircle,
    },
    {
      title: "Contact Us",
      href: "/contact",
      description: "Get in touch with our team",
      icon: MessageSquare,
    },
    {
      title: "API Documentation",
      href: "/api-docs",
      description: "Integrate with our RESTful API",
      icon: Code,
    },
  ],
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
                {/* Learn Section - Left Column */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                    📚 Learn
                  </h4>
                  <div className="space-y-1">
                    {resources.learn.map((item) => (
                      <ResourceItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                      >
                        {item.description}
                      </ResourceItem>
                    ))}
                  </div>
                </div>

                {/* Support Section - Right Column */}
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                    🆘 Support
                  </h4>
                  <div className="space-y-1">
                    {resources.support.map((item) => (
                      <ResourceItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                      >
                        {item.description}
                      </ResourceItem>
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

const ResourceItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { 
    icon?: React.ElementType
    children?: React.ReactNode
    title?: string
  }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-3">
            {Icon && <Icon className="mt-0.5 h-4 w-4 text-purple-600" />}
            <div className="space-y-1">
              <div className="text-sm font-semibold leading-none text-gray-900">{title}</div>
              <p className="text-xs leading-snug text-gray-600">
                {children}
              </p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ResourceItem.displayName = "ResourceItem"