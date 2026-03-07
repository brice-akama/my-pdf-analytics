"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Clock,
  X,
  Trash2,
  Eye,
  Download,
  FileSignature,
  Share2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = "view" | "download" | "signature" | "share" | "comment" | "system"

interface NotificationItem {
  _id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  documentId?: string
  actorName?: string
  metadata?: Record<string, any>
  redirectUrl?: string
}

interface NotificationsDrawerProps {
  open: boolean
  onClose: () => void
  notifications: NotificationItem[]
  unreadCount: number
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onRefresh: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago"
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago"
  if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago"
  return date.toLocaleDateString()
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "view":      return <Eye className="h-4 w-4 text-blue-500" />
    case "download":  return <Download className="h-4 w-4 text-green-500" />
    case "signature": return <FileSignature className="h-4 w-4 text-purple-500" />
    case "share":     return <Share2 className="h-4 w-4 text-orange-500" />
    case "comment":   return <Mail className="h-4 w-4 text-pink-500" />
    default:          return <Bell className="h-4 w-4 text-slate-500" />
  }
}

const iconBg = (type: NotificationType) => {
  switch (type) {
    case "view":      return "bg-blue-100"
    case "download":  return "bg-green-100"
    case "signature": return "bg-purple-100"
    case "share":     return "bg-orange-100"
    default:          return "bg-slate-100"
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsDrawer({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onRefresh,
}: NotificationsDrawerProps) {
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        toast.success("Notification deleted")
        onRefresh()
      } else {
        toast.error("Failed to delete")
      }
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleClick = (n: NotificationItem) => {
    onMarkRead(n._id)
    onClose()

    let targetUrl: string | undefined
    if (n.redirectUrl) {
      targetUrl = n.redirectUrl
    } else if (n.type === "signature" && n.metadata?.uniqueId) {
      targetUrl = `/signed/${n.metadata.uniqueId}`
    } else if (n.documentId) {
      targetUrl = `/documents/${n.documentId}`
    }

    if (targetUrl) window.location.href = targetUrl
  }

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
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-5 hover:bg-slate-50 cursor-pointer transition-all group relative ${
                        !n.read ? "bg-blue-50/30 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => handleClick(n)}
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, n._id)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 rounded-full z-10"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>

                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${iconBg(n.type)}`}
                        >
                          {getIcon(n.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold ${!n.read ? "text-slate-900" : "text-slate-700"}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(n.createdAt)}
                            </span>
                            {n.actorName && (
                              <>
                                <span>•</span>
                                <span>{n.actorName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Bell className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications yet</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    When someone views, downloads, or signs your documents, you'll see notifications here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}