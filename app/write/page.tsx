"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getStoredToken, createEntry } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Visibility = "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY"

const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export default function WritePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)

  // Redirect unauthenticated users away from write page
  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_CLOUD_NAME) {
      setError("Image upload is not configured. Please contact the administrator.")
      return
    }

    setUploadingImage(true)
    setError("")

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()

        formData.append("file", file)
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
        )

        if (!response.ok) {
          const text = await response.text()
          console.error("Cloudinary error:", text)
          setError("Failed to upload image")
          continue
        }

        const data = await response.json()
        if (data?.secure_url) {
          setUploadedImages((prev) => [...prev, data.secure_url as string])
        }
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePublish = async () => {
    const token = getStoredToken()
    if (!token) {
      router.push("/login")
      return
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required")
      return
    }

    setError("")
    setLoading(true)

    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const { error: apiError } = await createEntry(title, content, tagList, visibility, uploadedImages)

      if (apiError) {
        setError(apiError)
        return
      }

      router.push("/feed")
    } catch (err) {
      console.error("Publish error:", err)
      setError(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setLoading(false)
    }
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <h1 className="text-4xl font-bold mb-8">Write New Story</h1>

          {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">{error}</div>}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your story an engaging title..."
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your story here..."
                className="w-full bg-input text-foreground border border-border rounded-lg p-4 font-mono min-h-96"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tech, writing, tutorial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="w-full bg-input text-foreground border border-border rounded-lg p-2"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="FOLLOWERS_ONLY">Followers Only</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Images</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {uploadingImage ? (
                    <span className="text-muted-foreground">Uploading images...</span>
                  ) : (
                    <>
                      <span className="text-primary font-medium">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedImages.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Uploaded ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button onClick={handlePublish} className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Publishing..." : "Publish Story"}
              </Button>
              <Link href="/">
                <Button variant="outline">Discard</Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
