"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Clock, Trash2, Check } from "lucide-react"
import { toast } from "sonner"

type NotificationType = {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  documentId?: string
  redirectUrl?: string
  actorName?: string
  actorEmail?: string
  metadata?: any
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        credentials: 'include',
      })
      
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id?: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      
      if (res.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Mark read error:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        toast.success('Notification deleted')
        fetchNotifications()
      } else {
        toast.error('Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
              <p className="text-xs text-slate-600">{notifications.length} total</p>
            </div>
          </div>

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsRead()}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  markAsRead(notification._id)
                  if (notification.redirectUrl) {
                    router.push(notification.redirectUrl)
                  } else if (notification.documentId) {
                    router.push(`/documents/${notification.documentId}`)
                  }
                }}
              >
                <div className="flex gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.actorName && (
                        <>
                          <span>•</span>
                          <span>{notification.actorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification._id)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No notifications</h3>
            <p className="text-slate-600">You're all caught up!</p>
          </div>
        )}
      </main>
    </div>
  )
}