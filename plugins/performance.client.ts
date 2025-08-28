/**
 * Performance monitoring plugin - client-side only
 */

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const { recordMetric, monitorRouteChange, monitorApiCall } = usePerformance({
    enableMetrics: true,
    enableWebVitals: true,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  })

  // Monitor route changes
  const router = useRouter()
  router.beforeEach((to, from) => {
    if (from.path !== to.path) {
      monitorRouteChange(to.path, from.path)
    }
  })

  // Monitor API calls by intercepting fetch
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const [input, init] = args
    const url = typeof input === 'string' ? input : input.url
    const method = init?.method || 'GET'
    const startTime = performance.now()

    try {
      const response = await originalFetch(...args)
      const duration = performance.now() - startTime

      // Only monitor API calls (not assets)
      if (url.includes('/api/') || url.startsWith('http')) {
        monitorApiCall(url, method, duration, response.status)
      }

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      if (url.includes('/api/') || url.startsWith('http')) {
        monitorApiCall(url, method, duration, 0) // 0 indicates network error
      }

      throw error
    }
  }

  // Monitor unhandled errors
  window.addEventListener('error', (event) => {
    recordMetric('error.javascript', 1, 'counter', {
      message: event.message,
      filename: event.filename,
      line: event.lineno?.toString(),
      column: event.colno?.toString()
    })
  })

  // Monitor unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    recordMetric('error.promise_rejection', 1, 'counter', {
      reason: event.reason?.toString() || 'unknown'
    })
  })

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          recordMetric('performance.long_task', entry.duration, 'timing', {
            name: entry.name
          })
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      // Long task API not supported
      console.debug('Long task monitoring not supported')
    }
  }

  // Record page load metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        recordMetric('page.load_time', navigation.loadEventEnd - navigation.fetchStart, 'timing')
        recordMetric('page.dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'timing')
        recordMetric('page.first_byte', navigation.responseStart - navigation.fetchStart, 'timing')
      }
    }, 0)
  })

  console.log('🚀 Performance monitoring initialized')
})
