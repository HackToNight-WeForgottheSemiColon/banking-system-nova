export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('session_token') : null
  const headers = new Headers(options?.headers)

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  let body: any
  try {
    body = await res.json()
  } catch (err) {
    // If not JSON, return status text
    if (!res.ok) throw new Error(res.statusText)
    return {} as T
  }

  if (!res.ok) {
    throw body
  }

  return body
}
