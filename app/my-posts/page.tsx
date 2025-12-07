"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredToken, getMyEntries, deleteEntry } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Entry {
  id: string
  title: string
  content: string
  tags: string[]
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY"
  createdAt: string
}

export default function MyPostsPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }

    const loadEntries = async () => {
      try {
        const { data, error } = await getMyEntries()

        if (data && Array.isArray(data)) {
          setEntries(data as Entry[])
        }
      } catch (err) {
        console.error("Failed to load entries:", err)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      await deleteEntry(id)
      setEntries(entries.filter((e) => e.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post")
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
          <h1 className="text-4xl font-bold">My Stories</h1>
          <Link href="/write">
            <Button className="bg-primary hover:bg-primary/90">New Post</Button>
          </Link>
        </div>

        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't written any stories yet</p>
            <Link href="/write">
              <Button className="bg-primary hover:bg-primary/90">Write Your First Story</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/blog/${entry.id}`} className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 hover:text-primary">{entry.title}</h2>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.visibility === "PUBLIC"
                            ? "bg-primary/20 text-primary"
                            : entry.visibility === "FOLLOWERS_ONLY"
                              ? "bg-secondary/20 text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {entry.visibility}
                      </span>
                      <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/blog/${entry.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
