class MetricsCollector {
  constructor() {
    this.metrics = {
      creative: new Map(),
      research: new Map(),
      code: new Map(),
      multiagent: new Map()
    }
  }

  recordMetric(category, instrument, data) {
    const key = `${category}.${instrument}`
    const existing = this.metrics[category].get(instrument) || []
    
    existing.push({
      timestamp: new Date().toISOString(),
      responseTime: data.responseTime,
      success: data.success,
      outputLength: data.outputLength,
      qualityScore: data.qualityScore,
      error: data.error
    })
    
    this.metrics[category].set(instrument, existing)
  }

  getAggregatedMetrics(category, instrument) {
    const data = this.metrics[category].get(instrument) || []
    
    if (data.length === 0) return null
    
    const successfulRequests = data.filter(d => d.success)
    const failedRequests = data.filter(d => !d.success)
    
    return {
      totalRequests: data.length,
      successRate: successfulRequests.length / data.length,
      avgResponseTime: data.reduce((a, d) => a + d.responseTime, 0) / data.length,
      avgOutputLength: data.reduce((a, d) => a + (d.outputLength || 0), 0) / data.length,
      avgQualityScore: data.reduce((a, d) => a + (d.qualityScore || 0), 0) / data.length,
      p95ResponseTime: this.percentile(data.map(d => d.responseTime), 95),
      p99ResponseTime: this.percentile(data.map(d => d.responseTime), 99),
      errorRate: failedRequests.length / data.length,
      totalErrors: failedRequests.length,
      uniqueErrors: [...new Set(failedRequests.map(d => d.error).filter(Boolean))]
    }
  }

  getCategoryMetrics(category) {
    const instruments = this.metrics[category]
    const result = {}
    
    instruments.forEach((data, instrument) => {
      result[instrument] = this.getAggregatedMetrics(category, instrument)
    })
    
    return result
  }

  getTotalRequests() {
    let total = 0
    Object.values(this.metrics).forEach(instruments => {
      instruments.forEach(data => {
        total += data.length
      })
    })
    return total
  }

  getOverallSuccessRate() {
    let total = 0
    let successful = 0
    
    Object.values(this.metrics).forEach(instruments => {
      instruments.forEach(data => {
        total += data.length
        successful += data.filter(d => d.success).length
      })
    })
    
    return total > 0 ? successful / total : 0
  }

  getAvgResponseTime() {
    let total = 0
    let count = 0
    let sum = 0
    
    Object.values(this.metrics).forEach(instruments => {
      instruments.forEach(data => {
        data.forEach(d => {
          sum += d.responseTime
          count++
        })
      })
    })
    
    return count > 0 ? sum / count : 0
  }

  getTopErrors(limit = 10) {
    const errorCounts = new Map()
    
    Object.values(this.metrics).forEach(instruments => {
      instruments.forEach((data, instrument) => {
        data.forEach(d => {
          if (d.error) {
            const key = `${instrument}: ${d.error}`
            errorCounts.set(key, (errorCounts.get(key) || 0) + 1)
          }
        })
      })
    })
    
    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([error, count]) => ({ error, count }))
  }

  getSlowestEndpoints(limit = 10) {
    const endpoints = []
    
    Object.entries(this.metrics).forEach(([category, instruments]) => {
      instruments.forEach((data, instrument) => {
        const aggregated = this.getAggregatedMetrics(category, instrument)
        if (aggregated) {
          endpoints.push({
            endpoint: `${category}.${instrument}`,
            avgResponseTime: aggregated.avgResponseTime,
            p95ResponseTime: aggregated.p95ResponseTime,
            totalRequests: aggregated.totalRequests
          })
        }
      })
    })
    
    return endpoints
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit)
  }

  getQualityScores() {
    const scores = {}
    
    Object.entries(this.metrics).forEach(([category, instruments]) => {
      scores[category] = {}
      
      instruments.forEach((data, instrument) => {
        const aggregated = this.getAggregatedMetrics(category, instrument)
        if (aggregated) {
          scores[category][instrument] = {
            avgQualityScore: aggregated.avgQualityScore,
            totalRequests: aggregated.totalRequests
          }
        }
      })
    })
    
    return scores
  }

  getMetricsByTimeRange(category, instrument, startTime, endTime) {
    const data = this.metrics[category]?.get(instrument) || []
    
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    
    const filtered = data.filter(d => {
      const timestamp = new Date(d.timestamp).getTime()
      return timestamp >= start && timestamp <= end
    })
    
    if (filtered.length === 0) return null
    
    const successfulRequests = filtered.filter(d => d.success)
    const failedRequests = filtered.filter(d => !d.success)
    
    return {
      totalRequests: filtered.length,
      successRate: successfulRequests.length / filtered.length,
      avgResponseTime: filtered.reduce((a, d) => a + d.responseTime, 0) / filtered.length,
      avgOutputLength: filtered.reduce((a, d) => a + (d.outputLength || 0), 0) / filtered.length,
      avgQualityScore: filtered.reduce((a, d) => a + (d.qualityScore || 0), 0) / filtered.length,
      errorRate: failedRequests.length / filtered.length
    }
  }

  clearMetrics(category = null, instrument = null) {
    if (category && instrument) {
      this.metrics[category].delete(instrument)
    } else if (category) {
      this.metrics[category].clear()
    } else {
      Object.values(this.metrics).forEach(instruments => {
        instruments.clear()
      })
    }
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p / 100) - 1
    return sorted[Math.max(0, index)]
  }

  getReport() {
    const report = {
      summary: {
        totalRequests: this.getTotalRequests(),
        overallSuccessRate: this.getOverallSuccessRate(),
        avgResponseTime: this.getAvgResponseTime()
      },
      byCategory: {
        creative: this.getCategoryMetrics('creative'),
        research: this.getCategoryMetrics('research'),
        code: this.getCategoryMetrics('code'),
        multiagent: this.getCategoryMetrics('multiagent')
      },
      topErrors: this.getTopErrors(10),
      slowestEndpoints: this.getSlowestEndpoints(10),
      qualityScores: this.getQualityScores()
    }
    
    return report
  }
}

module.exports = MetricsCollector
