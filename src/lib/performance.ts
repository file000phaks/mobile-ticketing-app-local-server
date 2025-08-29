// Performance monitoring service for tracking app performance metrics
// Implements startup time tracking, load performance, and user experience metrics

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface NavigationTiming {
  navigationStart: number;
  unloadEventStart: number;
  unloadEventEnd: number;
  redirectStart: number;
  redirectEnd: number;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  domLoading: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private startTime: number;
  private initialized = false;

  constructor() {
    this.startTime = performance.now();
  }

  // Initialize performance monitoring
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      this.setupPerformanceObservers();
      this.trackNavigationTiming();
      this.trackResourceTiming();
      this.trackUserTiming();
      this.trackCustomMetrics();
      
      this.initialized = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  // Setup performance observers for Core Web Vitals
  private setupPerformanceObservers(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime, {
            element: (lastEntry as any).element?.tagName,
            size: (lastEntry as any).size
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer setup failed:', error);
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime, {
              eventType: (entry as any).name
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer setup failed:', error);
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          this.recordMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer setup failed:', error);
      }
    }
  }

  // Track navigation timing
  private trackNavigationTiming(): void {
    // Wait for load event to ensure all timing data is available
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // DNS lookup time
          const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
          this.recordMetric('DNS_Lookup', dnsTime);

          // TCP connection time
          const tcpTime = navigation.connectEnd - navigation.connectStart;
          this.recordMetric('TCP_Connection', tcpTime);

          // Request time
          const requestTime = navigation.responseStart - navigation.requestStart;
          this.recordMetric('Request_Time', requestTime);

          // Response time
          const responseTime = navigation.responseEnd - navigation.responseStart;
          this.recordMetric('Response_Time', responseTime);

          // DOM processing time
          const domTime = navigation.domComplete - navigation.domLoading;
          this.recordMetric('DOM_Processing', domTime);

          // Page load time
          const loadTime = navigation.loadEventEnd - navigation.navigationStart;
          this.recordMetric('Page_Load_Time', loadTime);

          // Time to first byte
          const ttfb = navigation.responseStart - navigation.navigationStart;
          this.recordMetric('TTFB', ttfb);

          // Time to interactive
          const tti = navigation.domInteractive - navigation.navigationStart;
          this.recordMetric('TTI', tti);

          // First contentful paint
          const fcpEntries = performance.getEntriesByName('first-contentful-paint');
          if (fcpEntries.length > 0) {
            this.recordMetric('FCP', fcpEntries[0].startTime);
          }
        }
      }, 0);
    });
  }

  // Track resource timing
  private trackResourceTiming(): void {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      
      let totalSize = 0;
      let imageSize = 0;
      let scriptSize = 0;
      let cssSize = 0;
      
      resources.forEach((resource: any) => {
        const size = resource.transferSize || 0;
        totalSize += size;
        
        if (resource.initiatorType === 'img') {
          imageSize += size;
        } else if (resource.initiatorType === 'script') {
          scriptSize += size;
        } else if (resource.initiatorType === 'css') {
          cssSize += size;
        }
      });
      
      this.recordMetric('Total_Resource_Size', totalSize);
      this.recordMetric('Image_Size', imageSize);
      this.recordMetric('Script_Size', scriptSize);
      this.recordMetric('CSS_Size', cssSize);
      this.recordMetric('Resource_Count', resources.length);
    });
  }

  // Track user timing marks and measures
  private trackUserTiming(): void {
    // Record app startup time
    this.recordMetric('App_Startup_Time', performance.now() - this.startTime);
  }

  // Track custom application metrics
  private trackCustomMetrics(): void {
    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.recordMetric('Memory_Used', memory.usedJSHeapSize);
      this.recordMetric('Memory_Total', memory.totalJSHeapSize);
      this.recordMetric('Memory_Limit', memory.jsHeapSizeLimit);
    }

    // Connection information
    if ((navigator as any).connection) {
      const connection = (navigator as any).connection;
      this.recordMetric('Network_Downlink', connection.downlink, {
        effectiveType: connection.effectiveType,
        rtt: connection.rtt
      });
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata
    };
    
    this.metrics.push(metric);
    
    // Log important metrics for debugging
    if (['App_Startup_Time', 'Page_Load_Time', 'LCP', 'FID', 'CLS'].includes(name)) {
      console.log(`Performance: ${name} = ${value.toFixed(2)}ms`, metadata);
    }
    
    // Send to monitoring service in production
    if (this.isProduction()) {
      this.sendToMonitoringService(metric);
    }
  }

  // Mark a performance timing point
  mark(name: string): void {
    try {
      performance.mark(name);
      this.recordMetric(`Mark_${name}`, performance.now());
    } catch (error) {
      console.warn('Failed to create performance mark:', error);
    }
  }

  // Measure time between two marks
  measure(name: string, startMark?: string, endMark?: string): number {
    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name);
      }
      
      const measures = performance.getEntriesByName(name, 'measure');
      const duration = measures.length > 0 ? measures[measures.length - 1].duration : 0;
      
      this.recordMetric(`Measure_${name}`, duration);
      return duration;
    } catch (error) {
      console.warn('Failed to create performance measure:', error);
      return 0;
    }
  }

  // Time a function execution
  async timeFunction<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(`Function_${name}`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`Function_${name}_Error`, duration, { error: error.message });
      throw error;
    }
  }

  // Get performance summary
  getSummary(): {
    coreWebVitals: Record<string, number>;
    timing: Record<string, number>;
    resources: Record<string, number>;
    memory: Record<string, number>;
  } {
    const coreWebVitals: Record<string, number> = {};
    const timing: Record<string, number> = {};
    const resources: Record<string, number> = {};
    const memory: Record<string, number> = {};

    this.metrics.forEach(metric => {
      if (['LCP', 'FID', 'CLS', 'FCP'].includes(metric.name)) {
        coreWebVitals[metric.name] = metric.value;
      } else if (metric.name.includes('Time') || metric.name.includes('TTI') || metric.name.includes('TTFB')) {
        timing[metric.name] = metric.value;
      } else if (metric.name.includes('Size') || metric.name.includes('Count')) {
        resources[metric.name] = metric.value;
      } else if (metric.name.includes('Memory')) {
        memory[metric.name] = metric.value;
      }
    });

    return { coreWebVitals, timing, resources, memory };
  }

  // Check if performance meets thresholds
  checkThresholds(): {
    passed: boolean;
    failures: Array<{ metric: string; value: number; threshold: number }>;
  } {
    const thresholds = {
      'App_Startup_Time': 2000, // 2 seconds
      'Page_Load_Time': 3000, // 3 seconds
      'LCP': 2500, // 2.5 seconds
      'FID': 100, // 100ms
      'CLS': 0.1, // 0.1
      'TTFB': 600 // 600ms
    };

    const failures: Array<{ metric: string; value: number; threshold: number }> = [];

    Object.entries(thresholds).forEach(([metricName, threshold]) => {
      const metric = this.metrics.find(m => m.name === metricName);
      if (metric && metric.value > threshold) {
        failures.push({
          metric: metricName,
          value: metric.value,
          threshold
        });
      }
    });

    return {
      passed: failures.length === 0,
      failures
    };
  }

  // Send metrics to monitoring service
  private sendToMonitoringService(metric: PerformanceMetric): void {
    try {
      // In production, send to monitoring service like Grafana, New Relic, etc.
      if (this.isProduction()) {
        // Mock implementation - replace with actual monitoring service
        console.log('Sending metric to monitoring service:', metric);
      }
    } catch (error) {
      console.warn('Failed to send metric to monitoring service:', error);
    }
  }

  // Check if running in production
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // Clean up observers
  cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting performance observer:', error);
      }
    });
    this.observers = [];
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    performanceMonitor.initialize();
  }, 100);
}

export default performanceMonitor;
