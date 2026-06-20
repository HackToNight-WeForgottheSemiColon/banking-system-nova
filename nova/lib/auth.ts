import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// ── Secret Management ──────────────────────────────────────────────
// In production set SESSION_SECRET in .env.local — at least 32 random bytes.
// If absent we generate one at boot so the app never runs unsigned,
// but tokens won't survive a restart.
const SESSION_SECRET: string =
  process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex')

const TOKEN_EXPIRY = '8h' // 8-hour sessions

// ── Types ──────────────────────────────────────────────────────────
export interface TokenPayload {
  userId: number
  role: string
}

interface JwtClaims extends TokenPayload {
  iat: number
  exp: number
}

export interface AuthResult {
  userId: number
  role: string
}

// ── Token helpers ──────────────────────────────────────────────────
export function createSessionToken(userId: number, role: string): string {
  const payload: TokenPayload = { userId, role }
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifySessionToken(request: Request): AuthResult | null {
  const token = extractToken(request)
  if (!token) return null

  try {
    const decoded = jwt.verify(token, SESSION_SECRET) as JwtClaims
    return { userId: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}

// ── Middleware-style guards ────────────────────────────────────────
/**
 * Returns null when authentication succeeds (caller gets AuthResult from verifySessionToken),
 * or a Response when it fails — caller should return it immediately.
 */
export function requireAuth(
  request: Request
): { auth: AuthResult } | { response: Response } {
  const auth = verifySessionToken(request)
  if (!auth) {
    return {
      response: Response.json(
        { ok: false, message: 'Authentication required.' },
        { status: 401 }
      )
    }
  }
  return { auth }
}

export function requireAdmin(
  request: Request
): { auth: AuthResult } | { response: Response } {
  const result = requireAuth(request)
  if ('response' in result) return result

  if (result.auth.role !== 'admin') {
    return {
      response: Response.json(
        { ok: false, message: 'Admin access required.' },
        { status: 403 }
      )
    }
  }
  return result
}

// ── Cookie builder ─────────────────────────────────────────────────
export function sessionCookieHeaders(token: string): Headers {
  const headers = new Headers()
  const isProduction = process.env.NODE_ENV === 'production'
  const cookie = [
    `session_token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${8 * 60 * 60}`, // 8 hours
    isProduction ? 'Secure' : ''
  ]
    .filter(Boolean)
    .join('; ')

  headers.set('set-cookie', cookie)
  return headers
}

// ── Internal ───────────────────────────────────────────────────────
function extractToken(request: Request): string | null {
  // 1. Authorization header (Bearer)
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  // 2. Cookie
  const cookies = request.headers.get('cookie') || ''
  const match = cookies.match(/(?:^|;\s*)session_token=([^;]+)/)
  return match ? match[1] : null
}
