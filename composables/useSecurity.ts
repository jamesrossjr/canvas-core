/**
 * Client-side security utilities and composables
 */

import { ref, computed } from 'vue'

export interface SecurityConfig {
  enableCSRF: boolean
  enableRateLimit: boolean
  enableInputSanitization: boolean
  maxUploadSize: number
  allowedFileTypes: string[]
}

const defaultConfig: SecurityConfig = {
  enableCSRF: true,
  enableRateLimit: true,
  enableInputSanitization: true,
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/markdown',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
}

export function useSecurity(config: Partial<SecurityConfig> = {}) {
  const securityConfig = { ...defaultConfig, ...config }
  const csrfToken = ref<string>('')
  const isLoading = ref(false)

  // Get CSRF token from cookie or meta tag
  const getCsrfToken = () => {
    if (import.meta.client) {
      // Try to get from cookie first
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'csrf-token') {
          return decodeURIComponent(value)
        }
      }

      // Fallback to meta tag
      const metaTag = document.querySelector('meta[name="csrf-token"]')
      return metaTag?.getAttribute('content') || ''
    }
    return ''
  }

  // Initialize CSRF token
  onMounted(() => {
    csrfToken.value = getCsrfToken()
  })

  // Sanitize HTML input
  const sanitizeHtml = (input: string): string => {
    if (!securityConfig.enableInputSanitization) return input

    const div = document.createElement('div')
    div.textContent = input
    return div.innerHTML
  }

  // Validate file upload
  const validateFileUpload = (file: File): { valid: boolean, errors: string[] } => {
    const errors: string[] = []

    // Check file size
    if (file.size > securityConfig.maxUploadSize) {
      errors.push(`File size must be less than ${Math.round(securityConfig.maxUploadSize / 1024 / 1024)}MB`)
    }

    // Check file type
    if (!securityConfig.allowedFileTypes.includes(file.type)) {
      errors.push('File type not allowed')
    }

    // Check file name
    const fileName = file.name.toLowerCase()
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif']
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      errors.push('File type not allowed for security reasons')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Make secure API request with CSRF protection
  const secureRequest = async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    isLoading.value = true

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      // Add CSRF token for non-GET requests
      if (securityConfig.enableCSRF
        && options.method
        && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
        headers['X-CSRF-Token'] = csrfToken.value || getCsrfToken()
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new Error(`Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Secure request failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Validate password strength on client side
  const validatePassword = (password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } => {
    const feedback: string[] = []
    let score = 0

    if (password.length < 8) {
      feedback.push('Use at least 8 characters')
    } else if (password.length >= 12) {
      score += 2
    } else {
      score += 1
    }

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Add lowercase letters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Add uppercase letters')

    if (/[0-9]/.test(password)) score += 1
    else feedback.push('Add numbers')

    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    else feedback.push('Add special characters')

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters')
      score -= 1
    }

    const commonWords = ['password', 'admin', 'user', 'login', '123456']
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      feedback.push('Avoid common words')
      score = Math.max(0, score - 2)
    }

    return {
      isValid: score >= 3 && feedback.length <= 2,
      score: Math.max(0, Math.min(5, score)),
      feedback
    }
  }

  // Check if current page is served over HTTPS
  const isSecureConnection = computed(() => {
    if (import.meta.client) {
      return location.protocol === 'https:' || location.hostname === 'localhost'
    }
    return true // Assume secure on server side
  })

  // Generate secure random string for client-side use
  const generateSecureId = (length: number = 32): string => {
    if (import.meta.client && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length / 2)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    // Fallback for older browsers
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  // Log security events (in production, send to monitoring service)
  const logSecurityEvent = (event: string, details: Record<string, any> = {}) => {
    if (import.meta.dev) {
      console.warn('Security Event:', event, details)
    }

    // In production, send to monitoring service
    // await $fetch('/api/security/events', {
    //   method: 'POST',
    //   body: { event, details, timestamp: Date.now() }
    // })
  }

  return {
    // State
    csrfToken: readonly(csrfToken),
    isLoading: readonly(isLoading),
    isSecureConnection,

    // Methods
    sanitizeHtml,
    validateFileUpload,
    secureRequest,
    validatePassword,
    generateSecureId,
    logSecurityEvent,
    getCsrfToken
  }
}
