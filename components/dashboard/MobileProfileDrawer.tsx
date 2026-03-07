"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Settings,
  Users as UsersIcon,
  CreditCard,
  Book,
  HelpCircle,
  Mail,
  Puzzle,
  LogOut,
  X,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

interface MobileProfileDrawerProps {
  open: boolean
  onClose: () => void
  user: UserType | null
  unreadCount: number
  onOpenNotifications: () => void
  onOpenSettings: () => void
  onOpenTeam: () => void
  onOpenBilling: () => void
  onOpenResources: () => void
  onOpenHelp: () => void
  onOpenFeedback: () => void
  onOpenIntegrations: () => void
  onOpenContact: () => void
  onLogout: () => void
  onUpgrade: () => void
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

// ─── Menu item helper ─────────────────────────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        danger
          ? "hover:bg-red-50 text-red-600"
          : "hover:bg-slate-50 text-slate-900"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileProfileDrawer({
  open,
  onClose,
  user,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenTeam,
  onOpenBilling,
  onOpenResources,
  onOpenHelp,
  onOpenFeedback,
  onOpenIntegrations,
  onOpenContact,
  onLogout,
  onUpgrade,
}: MobileProfileDrawerProps) {
  // Wraps an action: close drawer first, then call the handler
  const wrap = (fn: () => void) => () => { onClose(); fn() }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col md:hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 relative">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`h-16 w-16 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email ?? "")} flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden flex-shrink-0`}
                >
                  {user?.profile_image ? (
                    <Image
                      src={user.profile_image}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="rounded-full object-cover w-full h-full"
                      key={user.profile_image}
                      unoptimized
                    />
                  ) : (
                    getInitials(user?.email ?? "")
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-lg truncate">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-sm text-slate-600 truncate">{user?.email}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {user?.company_name ?? "My Company"}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-4 space-y-1">
                {/* Upgrade */}
                <Button
                  onClick={wrap(onUpgrade)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 font-semibold h-12 mb-3"
                >
                  ⚡ Upgrade to Pro
                </Button>

                {/* Notifications (special: shows badge) */}
                <button
                  onClick={wrap(onOpenNotifications)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="font-medium text-slate-900">Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="h-6 w-6 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <div className="border-t my-2" />

                <MenuItem icon={Settings}   label="Settings"     onClick={wrap(onOpenSettings)} />
                <MenuItem icon={UsersIcon}  label="Team"         onClick={wrap(onOpenTeam)} />
                <MenuItem icon={CreditCard} label="Billing"      onClick={wrap(onOpenBilling)} />
                <MenuItem icon={Book}       label="Resources"    onClick={wrap(onOpenResources)} />
                <MenuItem icon={HelpCircle} label="Help"         onClick={wrap(onOpenHelp)} />
                <MenuItem icon={Mail}       label="Feedback"     onClick={wrap(onOpenFeedback)} />
                <MenuItem icon={Puzzle}     label="Integrations" onClick={wrap(onOpenIntegrations)} />
                <MenuItem icon={Mail}       label="Contact Us"   onClick={wrap(onOpenContact)} />

                <div className="border-t my-2" />

                <MenuItem icon={LogOut} label="Log out" onClick={wrap(onLogout)} danger />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}