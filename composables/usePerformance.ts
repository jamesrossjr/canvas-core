/**
 * Performance monitoring composable
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  type: 'timing' | 'counter' | 'gauge'
  tags?: Record<string, string>
}

interface PerformanceConfig {
  enableMetrics: boolean
  enableWebVitals: boolean
  sampleRate: number
  endpoint?: string
}

const defaultConfig: PerformanceConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableWebVitals: true,
  sampleRate: 0.1 // 10% sampling in production
}

export function usePerformance(config: Partial<PerformanceConfig> = {}) {
  const perfConfig = { ...defaultConfig, ...config }
  const metrics = ref<PerformanceMetric[]>([])
  const isLoading = ref(false)

  // Web Vitals metrics
  const webVitals = ref({
    CLS: 0, // Cumulative Layout Shift
    FID: 0, // First Input Delay
    FCP: 0, // First Contentful Paint
    LCP: 0, // Largest Contentful Paint
    TTFB: 0 // Time to First Byte
  })

  // Memory usage info
  const memoryInfo = ref({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  })

  // Connection info
  const connectionInfo = ref({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  })

  // Record a performance metric
  const recordMetric = (name: string, value: number, type: PerformanceMetric['type'] = 'timing', tags?: Record<string, string>) => {
    if (!perfConfig.enableMetrics) return

    // Apply sampling
    if (Math.random() > perfConfig.sampleRate) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
      tags
    }

    metrics.value.push(metric)

    // Keep only last 1000 metrics in memory
    if (metrics.value.length > 1000) {
      metrics.value = metrics.value.slice(-1000)
    }

    // Send to monitoring service in production
    if (perfConfig.endpoint && import.meta.client) {
      sendMetricToService(metric)
    }
  }

  // Send metric to monitoring service
  const sendMetricToService = async (metric: PerformanceMetric) => {
    try {
      await $fetch(perfConfig.endpoint!, {
        method: 'POST',
        body: { metrics: [metric] },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.warn('Failed to send metric to monitoring service:', error)
    }
  }

  // Measure function execution time
  const measureFunction = async <T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - startTime
      recordMetric(`function.${name}`, duration, 'timing', tags)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      recordMetric(`function.${name}.error`, duration, 'timing', {
        ...tags,
        error: error instanceof Error ? error.message : 'unknown'
      })
      throw error
    }
  }

  // Measure component render time
  const measureRender = (componentName: string, renderTime: number) => {
    recordMetric(`render.${componentName}`, renderTime, 'timing')
  }

  // Update memory information
  const updateMemoryInfo = () => {
    if (import.meta.client && 'memory' in performance) {
      const memory = (performance as any).memory
      memoryInfo.value = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
  }

  // Update connection information
  const updateConnectionInfo = () => {
    if (import.meta.client && 'connection' in navigator) {
      const connection = (navigator as any).connection
      connectionInfo.value = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }
    }
  }

  // Initialize Web Vitals monitoring
  const initWebVitals = () => {
    if (!import.meta.client || !perfConfig.enableWebVitals) return

    // Observe performance entries
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          webVitals.value.LCP = lastEntry.startTime
          recordMetric('web_vitals.lcp', lastEntry.startTime, 'gauge')
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          webVitals.value.FID = (entry as any).processingStart - entry.startTime
          recordMetric('web_vitals.fid', webVitals.value.FID, 'gauge')
        }
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        webVitals.value.CLS = clsValue
        recordMetric('web_vitals.cls', clsValue, 'gauge')
      }).observe({ entryTypes: ['layout-shift'] })
    }

    // First Contentful Paint (FCP)
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcpEntry) {
      webVitals.value.FCP = fcpEntry.startTime
      recordMetric('web_vitals.fcp', fcpEntry.startTime, 'gauge')
    }

    // Time to First Byte (TTFB)
    const navigationEntries = performance.getEntriesByType('navigation')
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0] as PerformanceNavigationTiming
      webVitals.value.TTFB = nav.responseStart - nav.fetchStart
      recordMetric('web_vitals.ttfb', webVitals.value.TTFB, 'gauge')
    }
  }

  // Get performance report
  const getPerformanceReport = () => {
    updateMemoryInfo()
    updateConnectionInfo()

    return {
      webVitals: webVitals.value,
      memory: memoryInfo.value,
      connection: connectionInfo.value,
      metrics: metrics.value.slice(-100), // Last 100 metrics
      timestamp: Date.now()
    }
  }

  // Monitor route changes
  const monitorRouteChange = (to: string, from: string) => {
    recordMetric('navigation.route_change', Date.now(), 'counter', {
      from,
      to
    })
  }

  // Monitor API calls
  const monitorApiCall = (url: string, method: string, duration: number, status: number) => {
    recordMetric('api.request', duration, 'timing', {
      url: url.replace(/\/\d+/g, '/:id'), // Normalize URLs with IDs
      method: method.toLowerCase(),
      status: status.toString()
    })

    // Record error rates
    if (status >= 400) {
      recordMetric('api.error', 1, 'counter', {
        url: url.replace(/\/\d+/g, '/:id'),
        method: method.toLowerCase(),
        status: status.toString()
      })
    }
  }

  // Initialize monitoring
  onMounted(() => {
    if (import.meta.client) {
      initWebVitals()

      // Update system info periodically
      const interval = setInterval(() => {
        updateMemoryInfo()
        updateConnectionInfo()
      }, 30000) // Every 30 seconds

      onUnmounted(() => {
        clearInterval(interval)
      })
    }
  })

  // Report performance issues
  const reportPerformanceIssue = (issue: string, details: Record<string, any>) => {
    recordMetric('performance.issue', 1, 'counter', {
      issue,
      ...Object.entries(details).reduce((acc, [key, value]) => {
        acc[key] = String(value)
        return acc
      }, {} as Record<string, string>)
    })
  }

  // Get computed performance score (0-100)
  const performanceScore = computed(() => {
    const vitals = webVitals.value
    let score = 100

    // LCP scoring (good: <2.5s, needs improvement: 2.5s-4s, poor: >4s)
    if (vitals.LCP > 4000) score -= 30
    else if (vitals.LCP > 2500) score -= 15

    // FID scoring (good: <100ms, needs improvement: 100ms-300ms, poor: >300ms)
    if (vitals.FID > 300) score -= 25
    else if (vitals.FID > 100) score -= 10

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (vitals.CLS > 0.25) score -= 25
    else if (vitals.CLS > 0.1) score -= 10

    // FCP scoring (good: <1.8s, needs improvement: 1.8s-3s, poor: >3s)
    if (vitals.FCP > 3000) score -= 15
    else if (vitals.FCP > 1800) score -= 5

    // TTFB scoring (good: <600ms, needs improvement: 600ms-1.5s, poor: >1.5s)
    if (vitals.TTFB > 1500) score -= 5
    else if (vitals.TTFB > 600) score -= 2

    return Math.max(0, Math.min(100, score))
  })

  return {
    // State
    metrics: readonly(metrics),
    webVitals: readonly(webVitals),
    memoryInfo: readonly(memoryInfo),
    connectionInfo: readonly(connectionInfo),
    isLoading: readonly(isLoading),
    performanceScore,

    // Methods
    recordMetric,
    measureFunction,
    measureRender,
    monitorRouteChange,
    monitorApiCall,
    reportPerformanceIssue,
    getPerformanceReport,
    updateMemoryInfo,
    updateConnectionInfo
  }
}
