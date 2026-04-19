"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreditCard,
  Users as UsersIcon,
  Book,
  Puzzle,
  Mail,
  Bell,
  Search,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  HelpCircle,
  Lock,
} from "lucide-react"
import GlobalSearch from "@/components/GlobalSearch"

// ─── Types ───────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
  logo_url?: string | null
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  user: UserType | null
  unreadCount: number
  onOpenMobileMenu: () => void
  onOpenMobileSearch: () => void
  onOpenNotifications: () => void
  onOpenSettings: () => void
  onOpenTeam: () => void
  onOpenBilling: () => void
  onOpenResources: () => void
  onOpenHelp: () => void
  onOpenFeedback: () => void
  onOpenIntegrations: () => void
  onOpenContact: () => void
  onOpenMobileProfile: () => void
  onLogout: () => void
  currentUserIsOwner: boolean  // ← controls which items are restricted
}

// ─── Small helper: a dropdown item that is locked for non-owners ──────────────
//
// When isOwner is true  → behaves exactly like a normal DropdownMenuItem
// When isOwner is false → greyed out, not clickable, shows "Owner only" label
//                         and a lock icon, title tooltip on hover explains why

function RestrictedMenuItem({
  isOwner,
  onClick,
  icon: Icon,
  label,
  tooltipText,
  className = "",
}: {
  isOwner: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  tooltipText: string
  className?: string
}) {
  if (isOwner) {
    return (
      <DropdownMenuItem onClick={onClick} className={className}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      disabled
      title={tooltipText}
      className="opacity-50 cursor-not-allowed focus:bg-transparent data-[disabled]:opacity-50 data-[disabled]:pointer-events-auto data-[disabled]:cursor-not-allowed"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
      <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
        <Lock className="h-3 w-3" />
        Owner only
      </span>
    </DropdownMenuItem>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopNav({
  user,
  unreadCount,
  onOpenMobileMenu,
  onOpenMobileSearch,
  onOpenNotifications,
  onOpenSettings,
  onOpenTeam,
  onOpenBilling,
  onOpenResources,
  onOpenHelp,
  onOpenFeedback,
  onOpenIntegrations,
  onOpenContact,
  onOpenMobileProfile,
  onLogout,
  currentUserIsOwner,
}: TopNavProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">

        {/* ── Mobile: hamburger ── */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* ── Logo ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hidden sm:inline">
            DocMetrics
          </span>
        </div>

        {/* ── Desktop: centred search ── */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <div className="w-full max-w-xl">
            <GlobalSearch
              placeholder="Search documents, contacts, and more..."
              autoFocus={false}
            />
          </div>
        </div>

        {/* ── Mobile: search icon + avatar ── */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={onOpenMobileSearch}>
            <Search className="h-5 w-5" />
          </Button>

          {/* Mobile avatar → opens profile drawer */}
          <button
            onClick={onOpenMobileProfile}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
          >
            {user?.profile_image ? (
              <>
                <span className="absolute inset-0 flex items-center justify-center">
                  {getInitials(user?.email ?? "")}
                </span>
                <Image
                  src={user.profile_image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-full h-full relative z-10"
                  key={user.profile_image}
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              </>
            ) : (
              getInitials(user?.email ?? "")
            )}
          </button>
        </div>

        {/* ── Desktop: right-side actions ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto flex-shrink-0">

          {/* Upgrade button — hidden for invited members, they cannot upgrade */}
          {currentUserIsOwner && (
            <Button
              onClick={() => router.push("/plan")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4"
            >
              ⬆ Upgrade
            </Button>
          )}

          {/* Notifications bell — available to everyone */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onOpenNotifications}
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors">
                {/* Company + email (large screens) */}
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-semibold text-slate-900">
                    {user?.company_name}
                  </div>
                  <div className="text-xs text-slate-600">{user?.email}</div>
                </div>

                {/* Avatar */}
                <div
                  className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                    user?.email ?? ""
                  )} flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden relative`}
                >
                  {user?.profile_image ? (
                    <>
                      <span className="absolute inset-0 flex items-center justify-center">
                        {getInitials(user?.email ?? "")}
                      </span>
                      <Image
                        src={user.profile_image}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-full h-full relative z-10"
                        key={user.profile_image}
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </>
                  ) : (
                    getInitials(user?.email ?? "")
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72 z-90 bg-white rounded-lg border shadow-md p-1"
            >
              {/* Header block */}
              <div className="px-4 py-3 bg-slate-50">
                <div className="font-semibold text-slate-900 text-base">
                  {user?.company_name ?? "My Company"}
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  Advanced Data Rooms
                </div>
              </div>
              <DropdownMenuSeparator className="my-0" />

              {/* User info block */}
              <div className="px-4 py-3 bg-white">
                <div className="font-medium text-slate-900">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm text-slate-600">{user?.email}</div>
                {/* Show role badge for invited members so they know their status */}
                {!currentUserIsOwner && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                    <UsersIcon className="h-3 w-3" />
                    Team Member
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />

              {/* ── Settings — owner only ── */}
              <RestrictedMenuItem
                isOwner={currentUserIsOwner}
                onClick={onOpenSettings}
                icon={Settings}
                label="Settings"
                tooltipText="Only the account owner can change account settings"
              />

              {/* ── Logout — available to everyone ── */}
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* ── Team — available to everyone (members can VIEW the team) ── */}
              <DropdownMenuItem onClick={onOpenTeam}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Team
              </DropdownMenuItem>

              {/* ── Billing — owner only ── */}
              <RestrictedMenuItem
                isOwner={currentUserIsOwner}
                onClick={onOpenBilling}
                icon={CreditCard}
                label="Billing"
                tooltipText="Only the account owner can manage billing and subscription"
              />

              {/* ── Resources — available to everyone ── */}
              <DropdownMenuItem onClick={onOpenResources}>
                <Book className="mr-2 h-4 w-4" />
                Resources
              </DropdownMenuItem>

              {/* ── Help — available to everyone ── */}
              <DropdownMenuItem onClick={onOpenHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>

              {/* ── Feedback — available to everyone ── */}
              <DropdownMenuItem onClick={onOpenFeedback}>
                <Mail className="mr-2 h-4 w-4" />
                Feedback
              </DropdownMenuItem>

              {/* ── Integrations — owner only ── */}
              <RestrictedMenuItem
                isOwner={currentUserIsOwner}
                onClick={onOpenIntegrations}
                icon={Puzzle}
                label="Integrations"
                tooltipText="Only the account owner can manage integrations"
              />

              {/* ── Contact Us — available to everyone ── */}
              <DropdownMenuItem onClick={onOpenContact}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Us
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* ── Upgrade button — owner only ── */}
              <div className="px-2 py-2">
                {currentUserIsOwner ? (
                  <Button
                    onClick={() => router.push("/plan")}
                    className="w-full bg-sky-blue-600 hover:bg-sky-blue-700 text-slate-900 font-semibold"
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    Upgrade
                  </Button>
                ) : (
                  <div
                    title="Only the account owner can upgrade the plan"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed select-none"
                  >
                    <Lock className="h-4 w-4" />
                    Upgrade (Owner only)
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}