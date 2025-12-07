"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { searchEntries } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Entry {
  id: string
  title: string
  content: string
  tags: string[]
  authorUsername: string
  createdAt: string
}

interface PageData {
  content: Entry[]
  totalPages: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false)
      return
    }

    const loadResults = async () => {
      try {
        setLoading(true)
        const { data, error } = await searchEntries(query, 0, 10)

        if (data && "content" in data) {
          setEntries((data as PageData).content)
          setTotalPages((data as PageData).totalPages)
        }
      } catch (err) {
        console.error("Failed to search:", err)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [query])

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
          <Link href="/explore">
            <Button variant="outline">Explore</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {query && <h1 className="text-4xl font-bold mb-8">Search Results for "{query}"</h1>}

        {loading ? (
          <div className="text-center py-12">Searching...</div>
        ) : !query.trim() ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Enter a search query</p>
          </Card>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No results found for "{query}"</p>
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
                      <Link href={`/author/${entry.authorUsername}`} className="font-medium hover:text-primary">
                        {entry.authorUsername}
                      </Link>
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
          </div>
        )}
      </main>
    </div>
  )
}
