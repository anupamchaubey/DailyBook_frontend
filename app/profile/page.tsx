"use client"

import type React from "react"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  getStoredToken,
  getMyProfile,
  updateMyProfile,
  getFollowers,
  getFollowing,
  unfollow,
  getMyEntries,
  deleteEntry,
} from "@/lib/api"

interface UserProfile {
  username: string
  email: string
  bio: string
  profilePicture: string
}

interface Entry {
  id: string
  title: string
  content: string
  tags: string[]
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY"
  createdAt: string
}

type Tab = "overview" | "settings" | "posts"

const ProfilePage = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [myPosts, setMyPosts] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [editBio, setEditBio] = useState("")
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [unfollowingUser, setUnfollowingUser] = useState<string | null>(null)
  const [removingFollower, setRemovingFollower] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
    if (!getStoredToken()) {
      router.push("/login")
      return
    }
    loadProfileData()
  }, [router])

  const loadProfileData = async () => {
    try {
      const [profileRes, followersRes, followingRes, postsRes] = await Promise.all([
        getMyProfile(),
        getFollowers(),
        getFollowing(),
        getMyEntries(),
      ])

      if (profileRes.data) {
        const userData = profileRes.data as UserProfile
        setProfile(userData)
        setEditBio(userData.bio || "")
        setPhotoPreview(userData.profilePicture || "")
      }

      if (followersRes.data) {
        setFollowers(followersRes.data as string[])
      }

      if (followingRes.data) {
        setFollowing(followingRes.data as string[])
      }

      if (postsRes.data && Array.isArray(postsRes.data)) {
        setMyPosts(postsRes.data as Entry[])
      }
    } catch (err) {
      console.error("Failed to load profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "")

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      )
      const data = await response.json()
      if (data.secure_url) {
        setPhotoPreview(data.secure_url)
      }
    } catch (err) {
      console.error("Failed to upload photo:", err)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      await updateMyProfile(editBio, photoPreview || profile.profilePicture)
      setProfile({ ...profile, bio: editBio, profilePicture: photoPreview || profile.profilePicture })
      alert("Profile updated successfully!")
    } catch (err) {
      console.error("Failed to save profile:", err)
      alert("Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnfollow = async (username: string) => {
    setUnfollowingUser(username)
    try {
      await unfollow(username)
      setFollowing(following.filter((u) => u !== username))
    } catch (err) {
      console.error("Failed to unfollow:", err)
    } finally {
      setUnfollowingUser(null)
    }
  }

  const handleRemoveFollower = async (username: string) => {
    setRemovingFollower(username)
    try {
      await unfollow(username)
      setFollowers(followers.filter((u) => u !== username))
    } catch (err) {
      console.error("Failed to remove follower:", err)
    } finally {
      setRemovingFollower(null)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return
    }

    setDeletingPostId(postId)
    try {
      await deleteEntry(postId)
      setMyPosts(myPosts.filter((post) => post.id !== postId))
    } catch (err) {
      console.error("Failed to delete post:", err)
      alert("Failed to delete post")
    } finally {
      setDeletingPostId(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Failed to load profile</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-8 items-start mb-8">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center ring-4 ring-primary/20">
                {photoPreview ? (
                  <Image
                    src={photoPreview || "/placeholder.svg"}
                    alt={profile.username}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-5xl font-bold text-primary">{profile.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.username}</h1>
              <p className="text-lg text-muted-foreground mb-6">{profile.email}</p>
              <p className="text-base text-foreground mb-6 max-w-2xl">{profile.bio || "No bio yet"}</p>

              {/* Quick Stats */}
              <div className="flex gap-6 flex-wrap">
                <button onClick={() => setShowFollowersModal(true)} className="group">
                  <div className="hover:text-primary transition cursor-pointer">
                    <div className="text-2xl font-bold text-primary">{followers.length}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                </button>
                <button onClick={() => setShowFollowingModal(true)} className="group">
                  <div className="hover:text-primary transition cursor-pointer">
                    <div className="text-2xl font-bold text-primary">{following.length}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </button>
                <div className="group">
                  <div>
                    <div className="text-2xl font-bold text-primary">{myPosts.length}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === "posts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              My Posts
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Followers Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Your Network</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Followers */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Recent Followers</h3>
                    <button
                      onClick={() => setShowFollowersModal(true)}
                      className="text-primary hover:underline text-sm"
                    >
                      View All
                    </button>
                  </div>
                  {followers.length === 0 ? (
                    <p className="text-muted-foreground">No followers yet</p>
                  ) : (
                    <div className="space-y-3">
                      {followers.slice(0, 5).map((username) => (
                        <Link
                          key={username}
                          href={`/author/${username}`}
                          className="block p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                        >
                          <span className="font-medium hover:text-primary">{username}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Following Overview */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Following</h3>
                    <button
                      onClick={() => setShowFollowingModal(true)}
                      className="text-primary hover:underline text-sm"
                    >
                      View All
                    </button>
                  </div>
                  {following.length === 0 ? (
                    <p className="text-muted-foreground">Not following anyone yet</p>
                  ) : (
                    <div className="space-y-3">
                      {following.slice(0, 5).map((username) => (
                        <Link
                          key={username}
                          href={`/author/${username}`}
                          className="block p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                        >
                          <span className="font-medium hover:text-primary">{username}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-8">Profile Settings</h2>

            <div className="space-y-8">
              {/* Photo Upload Section */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">Change Profile Photo</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
                      {photoPreview ? (
                        <Image
                          src={photoPreview || "/placeholder.svg"}
                          alt={profile.username}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl font-bold text-primary">
                          {profile.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition">
                      <span className="text-white text-sm font-medium text-center">Click to change</span>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-4">
                      Upload a new profile photo to personalize your profile.
                    </p>
                    <label className="inline-block">
                      <Button className="bg-primary hover:bg-primary/90">
                        <span>Choose Photo</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </Button>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Bio Edit Section */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">Edit Bio</h3>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 300))}
                  placeholder="Write your bio..."
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary outline-none transition resize-none"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-2 mb-4">{editBio.length}/300 characters</p>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                  {isSaving ? "Saving..." : "Save Profile Changes"}
                </Button>
              </Card>

              {/* Followers Management */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6">Manage Followers</h3>
                {followers.length === 0 ? (
                  <p className="text-muted-foreground">No followers yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {followers.map((username) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                      >
                        <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                          <span className="font-medium">{username}</span>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFollower(username)}
                          disabled={removingFollower === username}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          {removingFollower === username ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Following Management */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6">Manage Following</h3>
                {following.length === 0 ? (
                  <p className="text-muted-foreground">Not following anyone yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {following.map((username) => (
                      <div
                        key={username}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                      >
                        <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                          <span className="font-medium">{username}</span>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollow(username)}
                          disabled={unfollowingUser === username}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          {unfollowingUser === username ? "Unfollowing..." : "Unfollow"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">My Blog Posts</h2>
              <Link href="/write">
                <Button className="bg-primary hover:bg-primary/90">Write New Post</Button>
              </Link>
            </div>

            {myPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-6 text-lg">You haven't written any stories yet</p>
                <Link href="/write">
                  <Button className="bg-primary hover:bg-primary/90">Write Your First Story</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <Card key={post.id} className="p-6 hover:bg-secondary/30 transition">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/blog/${post.id}`} className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2 hover:text-primary truncate">{post.title}</h3>
                        <p className="text-muted-foreground mb-3 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              post.visibility === "PUBLIC"
                                ? "bg-primary/20 text-primary"
                                : post.visibility === "FOLLOWERS_ONLY"
                                  ? "bg-secondary text-foreground"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {post.visibility}
                          </span>
                          <span className="text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-xs text-primary">
                                  #{tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/blog/${post.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          className="hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                        >
                          {deletingPostId === post.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Followers Modal */}
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-96 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold">Followers ({followers.length})</h2>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {followers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No followers yet</p>
                ) : (
                  followers.map((username) => (
                    <div
                      key={username}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                    >
                      <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                        <span className="font-medium">{username}</span>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFollower(username)}
                        disabled={removingFollower === username}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        {removingFollower === username ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Following Modal */}
        {showFollowingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-96 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold">Following ({following.length})</h2>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {following.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Not following anyone</p>
                ) : (
                  following.map((username) => (
                    <div
                      key={username}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
                    >
                      <Link href={`/author/${username}`} className="hover:text-primary flex-1">
                        <span className="font-medium">{username}</span>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(username)}
                        disabled={unfollowingUser === username}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        {unfollowingUser === username ? "Unfollowing..." : "Unfollow"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProfilePage
