"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStoredToken, getFeed, getPublicEntries } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Entry {
  id: string
  title: string
  content: string
  tags: string[]
  authorUsername: string
  authorProfilePicture?: string
  createdAt: string
  imageUrls?: string[]
}

export default function Home() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    setIsAuthenticated(!!token)

    const loadEntries = async () => {
      try {
        const endpoint = token ? "/api/entries/feed" : "/api/entries/public"
        const queryString = token ? "?page=0&size=10" : "?page=0&size=10"
        const { data, error } = token ? await getFeed(0, 10) : await getPublicEntries(0, 10)

        if (data && "content" in data) {
          setEntries(data.content)
        }
      } catch (err) {
        console.error("Failed to load entries:", err)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_expires")
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  D
                </div>
                <span className="text-xl font-bold">DailyBook</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/explore" className="text-muted-foreground hover:text-foreground transition">
                  Explore
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/feed" className="text-muted-foreground hover:text-foreground transition">
                      Feed
                    </Link>
                    <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition">
                      Notifications
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/write">
                    <Button className="bg-primary hover:bg-primary/90">New Post</Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline">Profile</Button>
                  </Link>
                  <Button variant="ghost" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {!isAuthenticated && (
        <section className="border-b border-border py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-pretty">Share Your Daily Stories</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with readers, grow your audience, and become part of a vibrant community of writers and thinkers.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Writing
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline">
                  Explore Stories
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Posts Feed */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">Loading stories...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stories yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/blog/${entry.id}`}>
                <Card className="p-6 hover:bg-card/80 cursor-pointer transition hover:shadow-lg overflow-hidden">
                  <div className="flex gap-6">
                    {entry.imageUrls && entry.imageUrls.length > 0 && (
                      <div className="flex-shrink-0">
                        <img
                          src={entry.imageUrls[0] || "/placeholder.svg"}
                          alt={entry.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2 text-pretty">{entry.title}</h2>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{entry.content}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{entry.authorUsername}</span>
                        <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
