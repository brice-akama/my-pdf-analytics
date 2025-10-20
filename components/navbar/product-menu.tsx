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
import { 
  FileText, 
  Bell, 
  TrendingUp, 
  Link2, 
  Download, 
  Share2,
  Eye,
  BarChart3,
  Clock,
  MapPin
} from "lucide-react";

const platformFeatures = [
  {
    title: "How it Works",
    href: "/product/how-it-works",
    description: "See the complete workflow from upload to insights",
    icon: Eye,
  },
  {
    title: "See It In Action",
    href: "/product/demo",
    description: "Watch live demo of DocMetrics in action",
    icon: FileText,
    badge: "Video",
  },
  {
    title: "Security & Control",
    href: "/product/security",
    description: "Enterprise-grade security and permissions",
    icon: Download,
  },
];

const features = [
  {
    title: "Document Analytics",
    href: "/features/analytics",
    description: "Track every view, page, and interaction",
    icon: BarChart3,
  },
  {
    title: "Real-Time Notifications",
    href: "/features/notifications",
    description: "Get instant alerts on document engagement",
    icon: Bell,
  },
  {
    title: "Engagement Tracking",
    href: "/features/engagement",
    description: "See which pages capture attention",
    icon: TrendingUp,
  },
  {
    title: "Time Tracking",
    href: "/features/time-tracking",
    description: "Measure time spent on each page",
    icon: Clock,
  },
  {
    title: "Viewer Location",
    href: "/features/location",
    description: "Track geographic location of viewers",
    icon: MapPin,
  },
  {
    title: "Shareable Links",
    href: "/features/links",
    description: "Generate secure tracking links instantly",
    icon: Link2,
  },
  {
    title: "Download Tracking",
    href: "/features/downloads",
    description: "Know when viewers download your PDFs",
    icon: Download,
  },
  {
    title: "Share Detection",
    href: "/features/sharing",
    description: "Track when documents get forwarded",
    icon: Share2,
  },
];

export function ProductMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium">
            Product
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-white shadow-lg border border-gray-200 z-[110]">
            <div className="w-[700px] p-4 bg-white">
              {/* Platform Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-900">
                  The DocMetrics Platform
                </h4>
                <div className="mt-3 grid gap-2">
                  {platformFeatures.map((item) => (
                    <PlatformItem
                      key={item.title}
                      title={item.title}
                      href={item.href}
                      icon={item.icon}
                      badge={item.badge}
                    >
                      {item.description}
                    </PlatformItem>
                  ))}
                </div>
              </div>

              {/* Features Section */}
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-900">
                  Features
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <FeatureItem
                      key={feature.title}
                      title={feature.title}
                      href={feature.href}
                      icon={feature.icon}
                    >
                      {feature.description}
                    </FeatureItem>
                  ))}
                </div>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const PlatformItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { 
    icon?: React.ElementType; 
    badge?: string;
    href: string; // ✅ explicitly required
  }
>(({ className, title, children, icon: Icon, badge, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href} // ✅ passed directly, not via spread
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-100">
                <Icon className="h-4 w-4 text-purple-600" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold leading-none text-gray-900">{title}</span>
                {badge && (
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs leading-snug text-gray-600">
                {children}
              </p>
            </div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
PlatformItem.displayName = "PlatformItem";

const FeatureItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { 
    icon?: React.ElementType;
    href: string; // ✅ explicitly required
  }
>(({ className, title, children, icon: Icon, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={href} // ✅ passed directly
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-2">
            {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />}
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
  );
});
FeatureItem.displayName = "FeatureItem";