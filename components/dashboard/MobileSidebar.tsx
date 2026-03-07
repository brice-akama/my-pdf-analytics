"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Settings, LogOut } from "lucide-react"
import GlobalSearch from "@/components/GlobalSearch"
import { sidebarItems, type PageType } from "./Sidebar"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

interface MobileSidebarProps {
  /** Controls the navigation menu sheet */
  menuOpen: boolean
  onMenuClose: () => void

  /** Controls the search sheet */
  searchOpen: boolean
  onSearchClose: () => void

  user: UserType | null
  activePage: PageType
  onNavigate: (page: PageType) => void
  onOpenSettings: () => void
  onLogout: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (email: string) => email.charAt(0).toUpperCase()

const getAvatarColor = (email: string) => {
  const colors = [
    "from-purple-500 to-purple-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
  ]
  return colors[email.charCodeAt(0) % colors.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileSidebar({
  menuOpen,
  onMenuClose,
  searchOpen,
  onSearchClose,
  user,
  activePage,
  onNavigate,
  onOpenSettings,
  onLogout,
}: MobileSidebarProps) {
  const handleNavClick = (page: PageType) => {
    onNavigate(page)
    onMenuClose()
  }

  return (
    <>
      {/* ── Navigation menu sheet ── */}
      <Sheet open={menuOpen} onOpenChange={onMenuClose}>
        <SheetContent side="left" className="w-80 p-0 bg-white">
          <SheetHeader className="border-b p-6">
            <SheetTitle className="flex items-center gap-3">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DocMetrics
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Search inside menu */}
          <div className="p-4 border-b">
            <GlobalSearch placeholder="Search everything..." autoFocus={false} />
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${
                  activePage === item.id
                    ? "bg-purple-50 text-purple-700"
                    : "text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs text-slate-500">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* User footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email ?? "")} flex items-center justify-center text-white font-semibold text-xl overflow-hidden relative`}
              >
                {user?.profile_image ? (
                  <Image
                    src={user.profile_image}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  getInitials(user?.email ?? "")
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm text-slate-600 truncate">{user?.email}</div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => { onOpenSettings(); onMenuClose() }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => { onLogout(); onMenuClose() }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Search sheet ── */}
      <Sheet open={searchOpen} onOpenChange={onSearchClose}>
        <SheetContent side="left" className="w-80 p-0 bg-white">
          <SheetHeader className="border-b p-6">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <GlobalSearch
              placeholder="Search everything..."
              autoFocus={true}
              onClose={onSearchClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}