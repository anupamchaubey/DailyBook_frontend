"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getEntry } from "@/lib/api"
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
  updatedAt: string
  imageUrls?: string[]
}

export default function BlogPostPage() {
  const params = useParams<{ id: string }>()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEntry = async () => {
      if (!params?.id) {
        setError("Invalid post ID")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error } = await getEntry(params.id)

        if (error) {
          console.error("Failed to load entry:", error)
          setError(error)
          setEntry(null)
          return
        }

        if (data) {
          setEntry(data as Entry)
        } else {
          setEntry(null)
        }
      } catch (err) {
        console.error("Failed to load entry:", err)
        setError("Failed to load post")
        setEntry(null)
      } finally {
        setLoading(false)
      }
    }

    loadEntry()
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          {error || "Post not found"}
        </p>
        <Link href="/">
          <Button variant="outline">Back Home</Button>
        </Link>
      </div>
    )
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
          <Link href="/">
            <Button variant="outline">Back Home</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article>
          <h1 className="text-5xl font-bold mb-4 text-pretty">{entry.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
            {entry.authorProfilePicture && (
              <img
                src={entry.authorProfilePicture || "/placeholder.svg"}
                alt={entry.authorUsername}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <Link href={`/author/${entry.authorUsername}`}>
                <p className="font-bold text-lg hover:text-primary cursor-pointer">
                  {entry.authorUsername}
                </p>
              </Link>
              <p className="text-muted-foreground">
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Images */}
          {entry.imageUrls && entry.imageUrls.length > 0 && (
            <div className="mb-8">
              {entry.imageUrls.length === 1 ? (
                <img
                  src={entry.imageUrls[0] || "/placeholder.svg"}
                  alt={entry.title}
                  className="w-full rounded-lg mb-4 max-h-96 object-cover"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {entry.imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url || "/placeholder.svg"}
                      alt={`${entry.title} ${idx + 1}`}
                      className="w-full rounded-lg object-cover max-h-64"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-8 whitespace-pre-wrap text-foreground leading-relaxed">
            {entry.content}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t border-border">
              {entry.tags.map((tag) => (
                <Link key={tag} href={`/explore?query=${encodeURIComponent(tag)}`}>
                  <Button variant="outline" size="sm">
                    #{tag}
                  </Button>
                </Link>
              ))}
            </div>
          )}

          {/* Author Card */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              {entry.authorProfilePicture && (
                <img
                  src={entry.authorProfilePicture || "/placeholder.svg"}
                  alt={entry.authorUsername}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">{entry.authorUsername}</h3>
                <p className="text-muted-foreground mb-4">
                  Author of this story
                </p>
                <Link href={`/author/${entry.authorUsername}`}>
                  <Button variant="outline">View Profile</Button>
                </Link>
              </div>
            </div>
          </Card>
        </article>
      </main>
    </div>
  )
}
