"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredToken, getFeed } from "@/lib/api"
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
}

interface PageData {
  content: Entry[]
  totalPages: number
  number: number
}

export default function FeedPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }

    const loadFeed = async () => {
      try {
        setLoading(true)
        const { data, error } = await getFeed(page, 10)

        if (data && "content" in data) {
          setEntries((data as PageData).content)
          setTotalPages((data as PageData).totalPages)
        }
      } catch (err) {
        console.error("Failed to load feed:", err)
      } finally {
        setLoading(false)
      }
    }

    loadFeed()
  }, [page, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                B
              </div>
              <span className="text-xl font-bold">BlogHub</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/write">
                <Button className="bg-primary hover:bg-primary/90">New Post</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Your Feed</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No stories from people you follow yet</p>
            <Link href="/explore">
              <Button className="bg-primary hover:bg-primary/90">Explore Writers</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/blog/${entry.id}`}>
                <Card className="p-6 hover:bg-card/80 cursor-pointer transition hover:shadow-lg">
                  <h2 className="text-2xl font-bold mb-2 text-pretty">{entry.title}</h2>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{entry.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{entry.authorUsername}</span>
                      <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}

            {/* Pagination */}
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
          </div>
        )}
      </main>
    </div>
  )
}
