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

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }

    const loadNotifications = async () => {
      try {
        const [notificationsRes, countRes] = await Promise.all([
          listNotifications(page, 10),
          getUnreadNotificationsCount(),
        ])

        if (notificationsRes.data && "content" in notificationsRes.data) {
          setNotifications((notificationsRes.data as PageData).content)
          setTotalPages((notificationsRes.data as PageData).totalPages)
        }

        if (countRes.data) {
          setUnreadCount(countRes.data as number)
        }
      } catch (err) {
        console.error("Failed to load notifications:", err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [page, router])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
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
              B
            </div>
            <span className="text-xl font-bold">BlogHub</span>
          </Link>
          <Link href="/profile">
            <Button variant="outline">Profile</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <Card key={notification.id} className={`p-4 ${!notification.read ? "border-primary border-2" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link href={`/author/${notification.actorUsername}`} className="font-bold hover:text-primary">
                        {notification.actorUsername}
                      </Link>
                      <span className="text-muted-foreground">
                        {notification.type === "FOLLOW_REQUEST" ? "wants to follow you" : "started following you"}
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
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-8">
                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  Previous
                </Button>
                <span className="text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
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
