export default defineEventHandler(async (event) => {
  // Skip for API routes that need different handling
  if (event.node.req.url?.startsWith('/api/')) {
    return
  }

  // Content Security Policy
  const csp = [
    'default-src \'self\'',
    'script-src \'self\' \'unsafe-eval\' \'unsafe-inline\'', // unsafe-eval needed for Vue/Nuxt
    'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
    'font-src \'self\' https://fonts.gstatic.com data:',
    'img-src \'self\' data: https: blob:',
    'media-src \'self\' blob:',
    'connect-src \'self\' ws: wss: https://api.github.com https://*.supabase.co https://*.supabase.io',
    'frame-src \'self\'',
    'object-src \'none\'',
    'base-uri \'self\'',
    'form-action \'self\'',
    'frame-ancestors \'none\'',
    'upgrade-insecure-requests'
  ].join('; ')

  // Security Headers
  setResponseHeaders(event, {
    // Content Security Policy
    'Content-Security-Policy': csp,

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', '),

    // HSTS (HTTP Strict Transport Security) - only in production
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),

    // Remove server information
    'X-Powered-By': '',
    'Server': ''
  })
})
