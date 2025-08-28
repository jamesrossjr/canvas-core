/**
 * CSRF (Cross-Site Request Forgery) protection middleware
 */

import { randomBytes, createHash } from 'crypto'

// Store CSRF tokens in memory (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string, expires: number }>()

// Generate a secure random token
function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

// Create a hash of the token for comparison
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const url = getRequestURL(event)

  // Skip CSRF protection for:
  // - GET, HEAD, OPTIONS requests (safe methods)
  // - API routes that use other authentication methods
  // - Auth callback routes
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(method)
    || url.pathname.startsWith('/api/auth/')
    || url.pathname === '/auth/callback'
  ) {
    return
  }

  // For POST, PUT, DELETE, PATCH requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const sessionId = getCookie(event, 'session-id') || 'anonymous'
    const csrfToken = getHeader(event, 'x-csrf-token')
      || getCookie(event, 'csrf-token')

    if (!csrfToken) {
      throw createError({
        statusCode: 403,
        statusMessage: 'CSRF token missing'
      })
    }

    const storedTokenData = csrfTokens.get(sessionId)

    if (!storedTokenData || Date.now() > storedTokenData.expires) {
      throw createError({
        statusCode: 403,
        statusMessage: 'CSRF token expired'
      })
    }

    const hashedToken = hashToken(csrfToken)
    const storedHashedToken = hashToken(storedTokenData.token)

    if (hashedToken !== storedHashedToken) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid CSRF token'
      })
    }

    // Token is valid, continue processing
    return
  }

  // For other requests, generate and set CSRF token
  const sessionId = getCookie(event, 'session-id') || 'anonymous'

  if (!csrfTokens.has(sessionId)
    || Date.now() > (csrfTokens.get(sessionId)?.expires || 0)) {
    const newToken = generateCSRFToken()
    const expires = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    csrfTokens.set(sessionId, { token: newToken, expires })

    // Set CSRF token in cookie and header
    setCookie(event, 'csrf-token', newToken, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    setResponseHeader(event, 'x-csrf-token', newToken)
  }
})

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, tokenData] of csrfTokens.entries()) {
    if (now > tokenData.expires) {
      csrfTokens.delete(sessionId)
    }
  }
}, 60 * 60 * 1000) // Clean up every hour
