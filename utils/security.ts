/**
 * Security utilities for input validation and sanitization
 */

// HTML encoding for XSS prevention
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  }

  return text.replace(/[&<>"']/g, m => map[m])
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Validate and sanitize workspace/document names
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string')
  }

  // Remove HTML tags and trim whitespace
  const sanitized = name.replace(/<[^>]*>/g, '').trim()

  if (sanitized.length === 0) {
    throw new Error('Name cannot be empty after sanitization')
  }

  if (sanitized.length > 100) {
    throw new Error('Name must be 100 characters or less')
  }

  return sanitized
}

// Validate and sanitize description text
export function sanitizeDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return ''
  }

  // Remove HTML tags and trim whitespace
  const sanitized = description.replace(/<[^>]*>/g, '').trim()

  if (sanitized.length > 500) {
    throw new Error('Description must be 500 characters or less')
  }

  return sanitized
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Validate workspace/document ID format
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false
  }

  // Allow alphanumeric characters, hyphens, and underscores
  const idRegex = /^[a-zA-Z0-9_-]+$/
  return idRegex.test(id) && id.length >= 3 && id.length <= 50
}

// Rate limiting helper
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean, remaining: number, resetTime: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    // New window or first request
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitMap.set(identifier, newEntry)

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime
    }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  entry.count++

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      score: 0
    }
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  // Common pattern checks
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain repeated characters')
    score -= 1
  }

  // Common passwords check (simple version)
  const commonPasswords = [
    'password', 'password123', '123456789', 'qwerty', 'abc123',
    'password1', '12345678', 'welcome', 'admin', 'letmein'
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common')
    score = 0
  }

  return {
    isValid: errors.length === 0 && score >= 3,
    errors,
    score: Math.max(0, Math.min(5, score))
  }
}

// Sanitize file upload data
export function validateFileUpload(file: {
  name?: string
  size?: number
  type?: string
}): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  if (!file.name || typeof file.name !== 'string') {
    errors.push('File name is required')
  } else {
    // Check file extension
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
      '.pdf', '.doc', '.docx', '.txt', '.md', // Documents
      '.mp4', '.mov', '.avi', '.webm' // Videos
    ]

    const extension = file.name.toLowerCase().split('.').pop()
    if (!extension || !allowedExtensions.includes(`.${extension}`)) {
      errors.push('File type not allowed')
    }
  }

  if (!file.size || file.size <= 0) {
    errors.push('File size is required')
  } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
    errors.push('File size must be less than 10MB')
  }

  // MIME type validation
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/markdown',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ]

  if (file.type && !allowedMimeTypes.includes(file.type)) {
    errors.push('File MIME type not allowed')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
