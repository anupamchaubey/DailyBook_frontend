"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  getUserProfile,
  getUserEntries,
  sendFollowRequest,
  unfollow,
  getFollowing,
  getStoredToken,
  getMyProfile,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface UserProfile {
  id: string
  username: string
  bio: string | null
  profilePicture: string | null
  joinedAt: string
}

interface Entry {
  id: string
  title: string
  content: string
  tags: string[]
  authorUsername: string
  createdAt: string
  imageUrls?: string[]
}

interface PageData {
  content: Entry[]
  totalPages: number
}

export default function AuthorPage() {
  const params = useParams<{ username: string }>()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAuthorData = async () => {
      const username = params.username
      if (!username) return

      setLoading(true)
      setError(null)

      try {
        const token = getStoredToken()

        if (token) {
          // Logged-in user: load author, posts, my profile and my following list
          const [profileRes, entriesRes, meRes, followingRes] = await Promise.all([
            getUserProfile(username),
            getUserEntries(username, 0, 10),
            getMyProfile(),
            getFollowing(),
          ])

          if (profileRes.data) {
            setProfile(profileRes.data as UserProfile)
          }

          if (entriesRes.data && "content" in entriesRes.data) {
            setEntries((entriesRes.data as PageData).content)
          }

          if (meRes.data) {
            const me = meRes.data as { username: string }
            setCurrentUsername(me.username)
          }

          if (followingRes.data) {
            const followingList = followingRes.data as string[]
            setIsFollowing(followingList.includes(username))
          }
        } else {
          // Guest: only author + posts
          const [profileRes, entriesRes] = await Promise.all([
            getUserProfile(username),
            getUserEntries(username, 0, 10),
          ])

          if (profileRes.data) {
            setProfile(profileRes.data as UserProfile)
          }

          if (entriesRes.data && "content" in entriesRes.data) {
            setEntries((entriesRes.data as PageData).content)
          }
        }
      } catch (err) {
        console.error("Failed to load author data:", err)
        setError("Failed to load author data")
      } finally {
        setLoading(false)
      }
    }

    if (params.username) {
      void loadAuthorData()
    }
  }, [params.username])

  const handleFollowToggle = async () => {
    const token = getStoredToken()
    if (!token) {
      router.push("/login")
      return
    }

    const username = params.username
    if (!username) return

    if (currentUsername && currentUsername === username) {
      alert("You cannot follow yourself")
      return
    }

    try {
      if (isFollowing) {
        await unfollow(username)
        setIsFollowing(false)
      } else {
        await sendFollowRequest(username)
        setIsFollowing(true)
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err)
      setError("Failed to update follow status")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Author not found</p>
        <Link href="/explore">
          <Button variant="outline">Back to Explore</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              D
            </div>
            <span className="text-xl font-bold">DailyBook</span>
          </Link>
          <Link href="/explore">
            <Button variant="outline">Explore</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {/* Author Header */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-card to-card/50">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{profile.username}</h1>
              <p className="text-muted-foreground mb-4">
                Joined{" "}
                {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
              {profile.bio && (
                <p className="text-lg text-foreground leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <img
                src={profile.profilePicture || "/placeholder.svg?height=160&width=160&query=user+avatar"}
                alt={profile.username}
                className="w-40 h-40 rounded-2xl object-cover border-4 border-primary/20"
              />

              {getStoredToken() && currentUsername === profile.username && (
                <Link href="/profile">
                  <Button className="bg-primary hover:bg-primary/90">View My Profile</Button>
                </Link>
              )}

              {getStoredToken() && currentUsername !== profile.username && (
                <Button
                  onClick={handleFollowToggle}
                  className={isFollowing ? "bg-secondary" : "bg-primary"}
                  variant={isFollowing ? "outline" : undefined}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>

          {/* Simple stats (only posts count, which we know is correct) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{entries.length}</div>
              <div className="text-muted-foreground text-sm">Posts</div>
            </div>
          </div>
        </Card>

        {/* Posts */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded"></span>
          Stories by {profile.username}
        </h2>

        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No stories published yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/blog/${entry.id}`}>
                <Card className="p-6 hover:bg-card/80 cursor-pointer transition">
                  <h3 className="text-xl font-bold mb-2">{entry.title}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
