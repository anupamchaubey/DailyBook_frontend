"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  getStoredToken,
  getFollowers,
  getFollowing,
  unfollow,
  getPendingFollowRequests,
  approveFollowRequest,
  rejectFollowRequest,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function FollowersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "pending">("followers")
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [pending, setPending] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }

    const loadFollowData = async () => {
      try {
        const [followersRes, followingRes, pendingRes] = await Promise.all([
          getFollowers(),
          getFollowing(),
          getPendingFollowRequests(),
        ])

        if (followersRes.data) {
          setFollowers(followersRes.data as string[])
        }

        if (followingRes.data) {
          setFollowing(followingRes.data as string[])
        }

        if (pendingRes.data) {
          setPending(pendingRes.data as string[])
        }
      } catch (err) {
        console.error("Failed to load follow data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadFollowData()
  }, [router])

  const handleUnfollow = async (username: string) => {
    try {
      await unfollow(username)
      setFollowing(following.filter((u) => u !== username))
    } catch (err) {
      console.error("Failed to unfollow:", err)
    }
  }

  const handleApprove = async (username: string) => {
    try {
      await approveFollowRequest(username)
      setPending(pending.filter((u) => u !== username))
      setFollowers([...followers, username])
    } catch (err) {
      console.error("Failed to approve:", err)
    }
  }

  const handleReject = async (username: string) => {
    try {
      await rejectFollowRequest(username)
      setPending(pending.filter((u) => u !== username))
    } catch (err) {
      console.error("Failed to reject:", err)
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Your Network</h1>

        <div className="flex gap-4 mb-8 border-b border-border flex-wrap">
          <button
            onClick={() => setActiveTab("followers")}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === "followers"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === "following"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Following ({following.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === "pending"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending ({pending.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "followers" &&
            (followers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No followers yet. Share amazing stories to grow your audience!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers.map((username) => (
                  <Card key={username} className="p-4 flex items-center justify-between hover:bg-card/80 transition">
                    <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                      <span className="font-medium text-lg">{username}</span>
                    </Link>
                    <Link href={`/author/${username}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            ))}

          {activeTab === "following" &&
            (following.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Not following anyone yet. Explore and discover amazing writers!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following.map((username) => (
                  <Card key={username} className="p-4 flex items-center justify-between hover:bg-card/80 transition">
                    <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                      <span className="font-medium text-lg">{username}</span>
                    </Link>
                    <div className="flex gap-2">
                      <Link href={`/author/${username}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(username)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        Unfollow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ))}

          {activeTab === "pending" &&
            (pending.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending follow requests</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((username) => (
                  <Card key={username} className="p-4 flex items-center justify-between hover:bg-card/80 transition">
                    <span className="font-medium text-lg">{username}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(username)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(username)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
        </div>
      </main>
    </div>
  )
}
