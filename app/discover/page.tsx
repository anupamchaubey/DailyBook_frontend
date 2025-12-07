"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { searchUsers } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface UserProfile {
  id: string
  username: string
  bio: string | null
  profilePicture: string | null
  joinedAt: string
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!search.trim()) {
      setUsers([])
      return
    }

    const loadUsers = async () => {
      try {
        setLoading(true)
        const { data, error } = await searchUsers(search)

        if (data && Array.isArray(data)) {
          setUsers(data as UserProfile[])
        }
      } catch (err) {
        console.error("Failed to search users:", err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(loadUsers, 300)
    return () => clearTimeout(timer)
  }, [search])

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
              <Link href="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Discover Writers</h1>

        {/* Search */}
        <div className="mb-8">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for writers..."
            className="text-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Searching...</div>
        ) : search.trim() === "" ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Start typing to discover writers</p>
          </Card>
        ) : users.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No writers found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users.map((user) => (
              <Link key={user.id} href={`/author/${user.username}`}>
                <Card className="p-6 hover:bg-card/80 cursor-pointer transition hover:shadow-lg h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    {user.profilePicture && (
                      <img
                        src={user.profilePicture || "/placeholder.svg"}
                        alt={user.username}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{user.username}</h3>
                      <p className="text-muted-foreground text-sm">
                        Joined {new Date(user.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {user.bio && <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">{user.bio}</p>}
                  <Button variant="outline" className="w-full bg-transparent">
                    View Profile
                  </Button>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
