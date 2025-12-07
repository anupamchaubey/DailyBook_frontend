"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getStoredToken,
  listNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Notification {
  id: string
  recipientUsername: string
  actorUsername: string
  type: "FOLLOW_REQUEST" | "FOLLOW_APPROVED"
  message: string
  read: boolean
  createdAt: string
}

interface PageData {
  content: Notification[]
  totalPages: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }

    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const [notificationsRes, countRes] = await Promise.all([
          listNotifications(page, 10),
          getUnreadNotificationsCount(),
        ])

        if (notificationsRes.error) {
          setError(notificationsRes.error)
        } else if (notificationsRes.data && "content" in notificationsRes.data) {
          const pageData = notificationsRes.data as PageData
          setNotifications(pageData.content)
          setTotalPages(pageData.totalPages)
        } else {
          setNotifications([])
          setTotalPages(0)
        }

        if (typeof countRes.data === "number") {
          setUnreadCount(countRes.data)
        }
      } catch (err) {
        console.error("Failed to load notifications:", err)
        setError("Failed to load notifications")
      } finally {
        setLoading(false)
      }
    }

    void loadNotifications()
  }, [page, router])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark as read:", err)
      setError("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
      setError("Failed to mark all notifications as read")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              D
            </div>
            <span className="text-xl font-bold">DailyBook</span>
          </Link>
          <Link href="/profile">
            <Button variant="outline">Profile</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">{unreadCount} unread</span>
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                Mark all read
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 flex items-center justify-between gap-4 ${
                  !notification.read ? "border-primary border-2" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/author/${notification.actorUsername}`}
                      className="font-bold hover:text-primary"
                    >
                      {notification.actorUsername}
                    </Link>
                    <span className="text-muted-foreground">
                      {notification.type === "FOLLOW_REQUEST"
                        ? "wants to follow you"
                        : "started following you"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.read && (
                    <Button
                      onClick={() => handleMarkAsRead(notification.id)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Mark read
                    </Button>
                  )}
                  <Link href={`/author/${notification.actorUsername}`}>
                    <Button variant="outline" size="sm" className="text-xs bg-transparent">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-8">
                <Button variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
