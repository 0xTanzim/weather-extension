// Performance monitoring utility for the weather extension
// Helps track memory usage and detect potential memory leaks

interface PerformanceMetrics {
  memoryUsage: number;
  cacheSize: number;
  activeTimers: number;
  domNodes: number;
  timestamp: number;
}

interface MemoryLeakDetector {
  isLeaking: boolean;
  leakType?: 'cache' | 'timers' | 'dom' | 'listeners';
  severity: 'low' | 'medium' | 'high';
  details: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getCacheSize(): number {
    // This would need to be integrated with the actual cache
    return 0; // Placeholder
  }

  private getActiveTimers(): number {
    // This is a rough estimate - in a real implementation you'd track timers
    return 0; // Placeholder
  }

  private getDOMNodes(): number {
    return document.querySelectorAll('*').length;
  }

  private collectMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      cacheSize: this.getCacheSize(),
      activeTimers: this.getActiveTimers(),
      domNodes: this.getDOMNodes(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);

    // Keep only the last maxMetrics measurements
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return metrics;
  }

  private detectMemoryLeak(): MemoryLeakDetector | null {
    if (this.metrics.length < 10) {
      return null; // Need more data
    }

    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);

    const avgRecentMemory =
      recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const avgOlderMemory =
      older.reduce((sum, m) => sum + m.memoryUsage, 0) / older.length;

    const memoryGrowth = avgRecentMemory - avgOlderMemory;
    const growthRate = memoryGrowth / avgOlderMemory;

    if (growthRate > 0.1) {
      // 10% growth
      return {
        isLeaking: true,
        leakType: 'cache',
        severity:
          growthRate > 0.3 ? 'high' : growthRate > 0.2 ? 'medium' : 'low',
        details: `Memory usage increased by ${(growthRate * 100).toFixed(1)}%`,
      };
    }

    return null;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      const metrics = this.collectMetrics();
      const leak = this.detectMemoryLeak();

      if (leak) {
        console.warn('🚨 Potential memory leak detected:', leak);
        this.reportLeak(leak, metrics);
      }

      // Log metrics every 5 minutes
      if (this.metrics.length % 60 === 0) {
        console.log('📊 Performance metrics:', {
          memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
          cacheSize: metrics.cacheSize,
          domNodes: metrics.domNodes,
          timestamp: new Date(metrics.timestamp).toISOString(),
        });
      }
    }, 5000); // Check every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  private reportLeak(
    leak: MemoryLeakDetector,
    metrics: PerformanceMetrics
  ): void {
    // In a real extension, you might want to send this to a monitoring service
    const report = {
      type: 'memory_leak',
      leak,
      metrics,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    console.error('Memory leak report:', report);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0
      ? this.metrics[this.metrics.length - 1]
      : null;
  }

  cleanup(): void {
    this.stopMonitoring();
    this.metrics = [];
  }
}

// Create global performance monitor
export const performanceMonitor = new PerformanceMonitor();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}

export { PerformanceMonitor };
export type { MemoryLeakDetector, PerformanceMetrics };
