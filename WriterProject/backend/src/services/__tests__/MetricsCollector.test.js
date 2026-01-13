import MetricsCollector from '../MetricsCollector.js'
import { describe, it, expect, beforeEach } from 'vitest'

describe('MetricsCollector', () => {
  let collector

  beforeEach(() => {
    collector = new MetricsCollector()
  })

  describe('recordMetric', () => {
    it('should record a single metric successfully', () => {
      collector.recordMetric('research', 'hypothesis', {
        responseTime: 100,
        success: true,
        outputLength: 500,
        qualityScore: 0.85
      })

      const metrics = collector.metrics.research.get('hypothesis')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].responseTime).toBe(100)
      expect(metrics[0].success).toBe(true)
    })

    it('should record multiple metrics for the same instrument', () => {
      collector.recordMetric('research', 'hypothesis', {
        responseTime: 100,
        success: true,
        outputLength: 500,
        qualityScore: 0.85
      })

      collector.recordMetric('research', 'hypothesis', {
        responseTime: 150,
        success: false,
        outputLength: 300,
        qualityScore: 0.6,
        error: 'API timeout'
      })

      const metrics = collector.metrics.research.get('hypothesis')
      expect(metrics).toHaveLength(2)
    })

    it('should record metrics with error information', () => {
      collector.recordMetric('code', 'generate', {
        responseTime: 200,
        success: false,
        outputLength: 0,
        qualityScore: 0,
        error: 'Invalid API key'
      })

      const metrics = collector.metrics.code.get('generate')
      expect(metrics[0].error).toBe('Invalid API key')
      expect(metrics[0].success).toBe(false)
    })
  })

  describe('getAggregatedMetrics', () => {
    it('should calculate success rate correctly', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 150, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 200, success: false })

      const aggregated = collector.getAggregatedMetrics('research', 'hypothesis')
      expect(aggregated.successRate).toBeCloseTo(0.6667, 4)
    })

    it('should calculate average response time correctly', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 200, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 300, success: true })

      const aggregated = collector.getAggregatedMetrics('research', 'hypothesis')
      expect(aggregated.avgResponseTime).toBe(200)
    })

    it('should calculate average output length correctly', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true, outputLength: 500 })
      collector.recordMetric('research', 'hypothesis', { responseTime: 150, success: true, outputLength: 1000 })
      collector.recordMetric('research', 'hypothesis', { responseTime: 200, success: true, outputLength: 1500 })

      const aggregated = collector.getAggregatedMetrics('research', 'hypothesis')
      expect(aggregated.avgOutputLength).toBe(1000)
    })

    it('should calculate percentiles correctly', () => {
      const responseTimes = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550]
      responseTimes.forEach(rt => {
        collector.recordMetric('research', 'hypothesis', { responseTime: rt, success: true })
      })

      const aggregated = collector.getAggregatedMetrics('research', 'hypothesis')
      expect(aggregated.p95ResponseTime).toBe(525)
      expect(aggregated.p99ResponseTime).toBe(550)
    })

    it('should return null for non-existent instrument', () => {
      const aggregated = collector.getAggregatedMetrics('research', 'non-existent')
      expect(aggregated).toBeNull()
    })
  })

  describe('getCategoryMetrics', () => {
    it('should return metrics for all instruments in a category', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'methodology', { responseTime: 200, success: true })

      const categoryMetrics = collector.getCategoryMetrics('research')
      expect(Object.keys(categoryMetrics)).toContain('hypothesis')
      expect(Object.keys(categoryMetrics)).toContain('methodology')
    })

    it('should return empty object for category with no metrics', () => {
      const categoryMetrics = collector.getCategoryMetrics('creative')
      expect(Object.keys(categoryMetrics)).toHaveLength(0)
    })
  })

  describe('getTotalRequests', () => {
    it('should count total requests across all categories', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'methodology', { responseTime: 200, success: true })
      collector.recordMetric('code', 'generate', { responseTime: 150, success: true })

      const total = collector.getTotalRequests()
      expect(total).toBe(3)
    })

    it('should return 0 when no metrics recorded', () => {
      const total = collector.getTotalRequests()
      expect(total).toBe(0)
    })
  })

  describe('getOverallSuccessRate', () => {
    it('should calculate overall success rate correctly', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 150, success: true })
      collector.recordMetric('code', 'generate', { responseTime: 200, success: false })

      const successRate = collector.getOverallSuccessRate()
      expect(successRate).toBeCloseTo(0.6667, 4)
    })

    it('should return 0 when no metrics recorded', () => {
      const successRate = collector.getOverallSuccessRate()
      expect(successRate).toBe(0)
    })
  })

  describe('getTopErrors', () => {
    it('should return top errors sorted by frequency', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: false, error: 'API timeout' })
      collector.recordMetric('research', 'hypothesis', { responseTime: 150, success: false, error: 'API timeout' })
      collector.recordMetric('code', 'generate', { responseTime: 200, success: false, error: 'Invalid API key' })

      const topErrors = collector.getTopErrors(10)
      expect(topErrors).toHaveLength(2)
      expect(topErrors[0].error).toBe('hypothesis: API timeout')
      expect(topErrors[0].count).toBe(2)
      expect(topErrors[1].error).toBe('generate: Invalid API key')
      expect(topErrors[1].count).toBe(1)
    })

    it('should respect limit parameter', () => {
      for (let i = 0; i < 15; i++) {
        collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: false, error: `Error ${i}` })
      }

      const topErrors = collector.getTopErrors(5)
      expect(topErrors).toHaveLength(5)
    })
  })

  describe('getSlowestEndpoints', () => {
    it('should return endpoints sorted by average response time', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'hypothesis', { responseTime: 150, success: true })
      collector.recordMetric('code', 'generate', { responseTime: 300, success: true })
      collector.recordMetric('code', 'generate', { responseTime: 400, success: true })

      const slowest = collector.getSlowestEndpoints(10)
      expect(slowest[0].endpoint).toBe('code.generate')
      expect(slowest[0].avgResponseTime).toBe(350)
      expect(slowest[1].endpoint).toBe('research.hypothesis')
      expect(slowest[1].avgResponseTime).toBe(125)
    })
  })

  describe('getQualityScores', () => {
    it('should return quality scores for all categories', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true, qualityScore: 0.85 })
      collector.recordMetric('code', 'generate', { responseTime: 200, success: true, qualityScore: 0.9 })

      const scores = collector.getQualityScores()
      expect(scores.research.hypothesis.avgQualityScore).toBe(0.85)
      expect(scores.code.generate.avgQualityScore).toBe(0.9)
    })
  })

  describe('clearMetrics', () => {
    it('should clear metrics for specific category and instrument', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'methodology', { responseTime: 200, success: true })

      collector.clearMetrics('research', 'hypothesis')

      expect(collector.metrics.research.has('hypothesis')).toBe(false)
      expect(collector.metrics.research.has('methodology')).toBe(true)
    })

    it('should clear all metrics for specific category', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('research', 'methodology', { responseTime: 200, success: true })

      collector.clearMetrics('research')

      expect(collector.metrics.research.size).toBe(0)
    })

    it('should clear all metrics when no parameters provided', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true })
      collector.recordMetric('code', 'generate', { responseTime: 200, success: true })

      collector.clearMetrics()

      expect(collector.metrics.research.size).toBe(0)
      expect(collector.metrics.code.size).toBe(0)
    })
  })

  describe('getReport', () => {
    it('should return comprehensive report with all sections', () => {
      collector.recordMetric('research', 'hypothesis', { responseTime: 100, success: true, qualityScore: 0.85 })
      collector.recordMetric('code', 'generate', { responseTime: 200, success: false, qualityScore: 0.5, error: 'Test error' })

      const report = collector.getReport()

      expect(report.summary).toBeDefined()
      expect(report.summary.totalRequests).toBe(2)
      expect(report.byCategory).toBeDefined()
      expect(report.topErrors).toBeDefined()
      expect(report.slowestEndpoints).toBeDefined()
      expect(report.qualityScores).toBeDefined()
    })
  })
})
