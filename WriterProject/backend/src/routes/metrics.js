import express from 'express'
import MetricsCollector from '../services/MetricsCollector.js'
import { CircuitBreaker } from '../services/CircuitBreaker.js'
import { PriorityRequestQueue } from '../services/PriorityRequestQueue.js'
import OutputValidator from '../services/OutputValidator.js'

const router = express.Router()

const metricsCollector = new MetricsCollector()
const circuitBreaker = new CircuitBreaker()
const requestQueue = new PriorityRequestQueue()
const outputValidator = new OutputValidator()

router.get('/dashboard', (req, res) => {
  try {
    const dashboard = {
      overview: {
        totalRequests: metricsCollector.getTotalRequests(),
        avgResponseTime: metricsCollector.getAvgResponseTime(),
        successRate: metricsCollector.getOverallSuccessRate(),
        activeCircuitBreakers: circuitBreaker.getOpenCircuits().length,
        queueStatus: requestQueue.getQueueStatus(),
        uptime: process.uptime()
      },
      byCategory: {
        creative: metricsCollector.getCategoryMetrics('creative'),
        research: metricsCollector.getCategoryMetrics('research'),
        code: metricsCollector.getCategoryMetrics('code'),
        multiagent: metricsCollector.getCategoryMetrics('multiagent')
      },
      topErrors: metricsCollector.getTopErrors(10),
      slowestEndpoints: metricsCollector.getSlowestEndpoints(10),
      qualityScores: metricsCollector.getQualityScores(),
      circuitBreakers: circuitBreaker.getAllStates(),
      recentRequests: metricsCollector.getMetricsByTimeRange(
        'research',
        'generateHypothesis',
        Date.now() - 3600000,
        Date.now()
      )
    }
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params
    const validCategories = ['creative', 'research', 'code', 'multiagent']
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Valid categories: ${validCategories.join(', ')}`
      })
    }
    
    const metrics = metricsCollector.getCategoryMetrics(category)
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/instrument/:category/:instrument', (req, res) => {
  try {
    const { category, instrument } = req.params
    
    const metrics = metricsCollector.getAggregatedMetrics(category, instrument)
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this instrument'
      })
    }
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/time-range', (req, res) => {
  try {
    const { category, instrument, startTime, endTime } = req.query
    
    if (!category || !instrument || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: category, instrument, startTime, endTime'
      })
    }
    
    const metrics = metricsCollector.getMetricsByTimeRange(
      category,
      instrument,
      parseInt(startTime),
      parseInt(endTime)
    )
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this time range'
      })
    }
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/record', (req, res) => {
  try {
    const { category, instrument, responseTime, success, outputLength, qualityScore, error } = req.body
    
    if (!category || !instrument || responseTime === undefined || success === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: category, instrument, responseTime, success'
      })
    }
    
    metricsCollector.recordMetric(category, instrument, {
      responseTime,
      success,
      outputLength,
      qualityScore,
      error
    })
    
    res.json({
      success: true,
      message: 'Metric recorded successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/errors', (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    const topErrors = metricsCollector.getTopErrors(parseInt(limit))
    
    res.json({
      success: true,
      data: topErrors,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/slow-endpoints', (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    const slowestEndpoints = metricsCollector.getSlowestEndpoints(parseInt(limit))
    
    res.json({
      success: true,
      data: slowestEndpoints,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/quality', (req, res) => {
  try {
    const qualityScores = metricsCollector.getQualityScores()
    
    res.json({
      success: true,
      data: qualityScores,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/report', (req, res) => {
  try {
    const report = metricsCollector.getReport()
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/circuit-breakers', (req, res) => {
  try {
    const health = circuitBreaker.getHealthReport()
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/circuit-breakers/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params
    
    const state = circuitBreaker.getState(serviceName)
    
    res.json({
      success: true,
      data: state,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/circuit-breakers/:serviceName/reset', (req, res) => {
  try {
    const { serviceName } = req.params
    
    circuitBreaker.resetService(serviceName)
    
    res.json({
      success: true,
      message: `Circuit breaker for ${serviceName} has been reset`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/queue', (req, res) => {
  try {
    const queueStatus = requestQueue.getQueueStatus()
    
    res.json({
      success: true,
      data: queueStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/queue/processing', (req, res) => {
  try {
    const processing = requestQueue.getProcessingRequests()
    
    res.json({
      success: true,
      data: processing,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/queue/completed', (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    const completed = requestQueue.getCompletedRequests(parseInt(limit))
    
    res.json({
      success: true,
      data: completed,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/queue/:requestId', (req, res) => {
  try {
    const { requestId } = req.params
    
    const status = requestQueue.getStatus(requestId)
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      })
    }
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/queue/:requestId/prioritize', (req, res) => {
  try {
    const { requestId } = req.params
    const { priority } = req.body
    
    const updatedRequest = requestQueue.prioritizeRequest(requestId, priority)
    
    res.json({
      success: true,
      data: updatedRequest,
      message: 'Request priority updated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.delete('/queue/:requestId', (req, res) => {
  try {
    const { requestId } = req.params
    
    const cancelled = requestQueue.cancelRequest(requestId)
    
    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or cannot be cancelled'
      })
    }
    
    res.json({
      success: true,
      message: 'Request cancelled successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/validate', (req, res) => {
  try {
    const { output, category, instrument } = req.body
    
    if (!output || !category || !instrument) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: output, category, instrument'
      })
    }
    
    const validation = outputValidator.validate(output, category, instrument)
    
    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/validate/batch', (req, res) => {
  try {
    const { outputs } = req.body
    
    if (!outputs || !Array.isArray(outputs)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: outputs (array)'
      })
    }
    
    const validations = outputValidator.validateBatch(outputs)
    
    res.json({
      success: true,
      data: validations,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      metricsCollector: metricsCollector.getTotalRequests(),
      circuitBreaker: circuitBreaker.getHealthReport(),
      requestQueue: requestQueue.getQueueStatus()
    }
  }
  
  res.json({
    success: true,
    data: health
  })
})

export default router
