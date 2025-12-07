interface ApiResponse<T> {
  data?: T
  error?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function setStoredToken(token: string, expiresAt: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem("auth_token", token)
  localStorage.setItem("auth_expires", expiresAt.toString())
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("auth_token")
  localStorage.removeItem("auth_expires")
}

function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const authToken = token || getStoredToken()
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

export async function apiCall<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  token?: string,
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: getHeaders(token),
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options)

    if (!response.ok) {
      const text = await response.text()
      return { error: text || `API error: ${response.status}` }
    }

    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return { data: data as T }
    } else {
      const text = await response.text()
      return { data: text as unknown as T }
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// Auth APIs
export async function register(username: string, email: string, password: string) {
  return apiCall("/api/auth/register", "POST", { username, email, password })
}

export async function login(username: string, password: string) {
  return apiCall<{ token: string; expiresAt: number }>("/api/auth/login", "POST", { username, password })
}

// Entry/Blog Post APIs
export async function createEntry(
  title: string,
  content: string,
  tags: string[],
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY",
  imageUrls: string[] = [],
) {
  return apiCall("/api/entries", "POST", { title, content, tags, visibility, imageUrls })
}

export async function getMyEntries() {
  return apiCall("/api/entries", "GET")
}

export async function getEntry(id: string) {
  return apiCall(`/api/entries/${id}`, "GET")
}

export async function deleteEntry(id: string) {
  return apiCall(`/api/entries/${id}`, "DELETE")
}

export async function getPublicEntries(page = 0, size = 10) {
  return apiCall(`/api/entries/public?page=${page}&size=${size}`, "GET")
}

export async function getUserPublicEntries(username: string, page = 0, size = 10) {
  return apiCall(`/api/entries/public/user/${username}?page=${page}&size=${size}`, "GET")
}

export async function searchEntries(query: string, page = 0, size = 10) {
  return apiCall(`/api/entries/public/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`, "GET")
}

export async function getFeed(page = 0, size = 10) {
  return apiCall(`/api/entries/feed?page=${page}&size=${size}`, "GET")
}

// Follow APIs
export async function sendFollowRequest(username: string) {
  return apiCall(`/api/follow/${username}`, "POST", {})
}

export async function unfollow(username: string) {
  return apiCall(`/api/follow/${username}`, "DELETE")
}

export async function getFollowers() {
  return apiCall<string[]>("/api/follow/me/followers", "GET")
}

export async function getFollowing() {
  return apiCall<string[]>("/api/follow/me/following", "GET")
}

export async function getPendingFollowRequests() {
  return apiCall<string[]>("/api/follow/me/requests", "GET")
}

export async function approveFollowRequest(username: string) {
  return apiCall(`/api/follow/approve/${username}`, "POST", {})
}

export async function rejectFollowRequest(username: string) {
  return apiCall(`/api/follow/reject/${username}`, "DELETE")
}

// Notifications APIs
export async function listNotifications(page = 0, size = 10) {
  return apiCall(`/api/notifications?page=${page}&size=${size}`, "GET")
}

export async function getUnreadNotificationsCount() {
  return apiCall<number>("/api/notifications/unread-count", "GET")
}

export async function markNotificationAsRead(id: string) {
  return apiCall(`/api/notifications/${id}/read`, "POST", {})
}

export async function markAllNotificationsAsRead() {
  return apiCall("/api/notifications/read-all", "POST", {})
}

// User Profile APIs
export async function getMyProfile() {
  return apiCall("/api/profile/me", "GET")
}

export async function updateMyProfile(bio: string, profilePicture: string) {
  return apiCall("/api/profile/me", "PUT", { bio, profilePicture })
}

export async function getUserProfile(username: string) {
  return apiCall(`/api/profile/${username}`, "GET")
}

export async function searchUsers(query: string) {
  return apiCall(`/api/profile/search?query=${encodeURIComponent(query)}`, "GET")
}

export async function getUserEntries(username: string, page = 0, size = 10) {
  return apiCall(`/api/users/${username}/entries?page=${page}&size=${size}`, "GET")
}
