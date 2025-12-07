"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  getUserProfile,
  getUserEntries,
  sendFollowRequest,
  unfollow,
  getFollowers,
  getFollowing,
  getStoredToken,
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
  const params = useParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const currentUser = getStoredToken() ? localStorage.getItem("current_username") : null

  useEffect(() => {
    const loadAuthorData = async () => {
      try {
        const username = params.username as string

        const [profileRes, entriesRes, followersRes, followingRes] = await Promise.all([
          getUserProfile(username),
          getUserEntries(username, 0, 10),
          getFollowers(),
          getFollowing(),
        ])

        if (profileRes.data) {
          setProfile(profileRes.data as UserProfile)
        }

        if (entriesRes.data && "content" in entriesRes.data) {
          setEntries((entriesRes.data as PageData).content)
        }

        if (followersRes.data) {
          setFollowers(followersRes.data as string[])
        }

        if (followingRes.data) {
          const followList = followingRes.data as string[]
          setFollowing(followList)
          setIsFollowing(followList.includes(username))
        }
      } catch (err) {
        console.error("Failed to load author data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (params.username) {
      loadAuthorData()
    }
  }, [params.username])

  const handleFollowToggle = async () => {
    if (!getStoredToken()) {
      return
    }

    const username = params.username as string

    if (currentUser === username) {
      alert("You cannot follow yourself")
      return
    }

    try {
      if (isFollowing) {
        await unfollow(username)
        setFollowing(following.filter((u) => u !== username))
      } else {
        await sendFollowRequest(username)
        setFollowing([...following, username])
      }
      setIsFollowing(!isFollowing)
    } catch (err) {
      console.error("Failed to toggle follow:", err)
    }
  }

  const SocialModal = ({
    title,
    items,
    isOpen,
    onClose,
  }: {
    title: string
    items: string[]
    isOpen: boolean
    onClose: () => void
  }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 max-h-96 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
            <h3 className="text-lg font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No {title.toLowerCase()} yet</p>
            ) : (
              items.map((username) => (
                <Link
                  key={username}
                  href={`/author/${username}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition"
                >
                  <span className="font-medium">{username}</span>
                  <span className="text-primary text-sm">→</span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Author not found</div>
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
        {/* Author Header */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-card to-card/50">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{profile.username}</h1>
              <p className="text-muted-foreground mb-4">
                Joined {new Date(profile.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </p>
              {profile.bio && <p className="text-lg text-foreground leading-relaxed max-w-2xl">{profile.bio}</p>}
            </div>
            <div className="flex flex-col items-center gap-4">
              <img
                src={profile.profilePicture || "/placeholder.svg?height=160&width=160&query=user+avatar"}
                alt={profile.username}
                className="w-40 h-40 rounded-2xl object-cover border-4 border-primary/20"
              />
              {getStoredToken() && currentUser === profile.username ? (
                <Link href="/profile">
                  <Button className="bg-primary hover:bg-primary/90">View My Profile</Button>
                </Link>
              ) : getStoredToken() && currentUser !== profile.username ? (
                <Button
                  onClick={handleFollowToggle}
                  className={isFollowing ? "bg-secondary" : "bg-primary"}
                  variant={isFollowing ? "outline" : undefined}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setShowFollowersModal(true)} className="group">
              <div className="text-center hover:bg-secondary/30 p-3 rounded-lg transition">
                <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                  {followers.length}
                </div>
                <div className="text-muted-foreground text-sm">Followers</div>
              </div>
            </button>
            <button onClick={() => setShowFollowingModal(true)} className="group">
              <div className="text-center hover:bg-secondary/30 p-3 rounded-lg transition">
                <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                  {following.length}
                </div>
                <div className="text-muted-foreground text-sm">Following</div>
              </div>
            </button>
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
                      <div className="flex gap-2">
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

      {/* Modals */}
      <SocialModal
        title={`Followers (${followers.length})`}
        items={followers}
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />
      <SocialModal
        title={`Following (${following.length})`}
        items={following}
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
      />
    </div>
  )
}
