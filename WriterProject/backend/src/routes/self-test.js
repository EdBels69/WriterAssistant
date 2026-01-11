import express from 'express'
import SmartRouter from '../services/SmartRouter.js'
import MetricsCollector from '../services/MetricsCollector.js'
import OutputValidator from '../services/OutputValidator.js'
import AIAgentSelfTestRunner from '../services/AIAgentSelfTestRunner.js'

const router = express.Router()

const smartRouter = new SmartRouter()
const metricsCollector = new MetricsCollector()
const outputValidator = new OutputValidator()
const selfTestRunner = new AIAgentSelfTestRunner(smartRouter, metricsCollector, outputValidator)

router.post('/run-all', async (req, res) => {
  try {
    const { testTypes, parallel } = req.body
    
    const results = await selfTestRunner.runAllTests({ testTypes, parallel })
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/run/unit', async (req, res) => {
  try {
    const { parallel } = req.body
    
    const results = await selfTestRunner.runUnitTests(parallel)
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/run/integration', async (req, res) => {
  try {
    const { parallel } = req.body
    
    const results = await selfTestRunner.runIntegrationTests(parallel)
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/run/performance', async (req, res) => {
  try {
    const { parallel } = req.body
    
    const results = await selfTestRunner.runPerformanceTests(parallel)
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/run/quality', async (req, res) => {
  try {
    const { parallel } = req.body
    
    const results = await selfTestRunner.runQualityTests(parallel)
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.post('/run/specific', async (req, res) => {
  try {
    const { testNames, testType } = req.body
    
    if (!testNames || !Array.isArray(testNames) || testNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'testNames must be a non-empty array'
      })
    }
    
    if (!testType || !['unit', 'integration', 'performance', 'quality'].includes(testType)) {
      return res.status(400).json({
        success: false,
        error: 'testType must be one of: unit, integration, performance, quality'
      })
    }
    
    const results = await selfTestRunner.runSpecificTests(testNames, testType)
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/results', (req, res) => {
  try {
    const results = selfTestRunner.getTestResults()
    
    if (!results || results.summary.total === 0) {
      return res.status(404).json({
        success: false,
        error: 'No test results available. Run tests first.'
      })
    }
    
    res.json({
      success: true,
      data: results,
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
    const report = selfTestRunner.generateTestReport()
    
    if (!report.success) {
      return res.status(404).json({
        success: false,
        error: report.error
      })
    }
    
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

router.get('/tests', (req, res) => {
  try {
    const { type } = req.query
    
    let tests = []
    
    switch (type) {
      case 'unit':
        tests = selfTestRunner.getUnitTests()
        break
      case 'integration':
        tests = selfTestRunner.getIntegrationTests()
        break
      case 'performance':
        tests = selfTestRunner.getPerformanceTests()
        break
      case 'quality':
        tests = selfTestRunner.getQualityTests()
        break
      default:
        tests = {
          unit: selfTestRunner.getUnitTests().map(t => ({ name: t.name, category: t.category, tool: t.tool, critical: t.critical })),
          integration: selfTestRunner.getIntegrationTests().map(t => ({ name: t.name, category: t.category, tool: t.tool, critical: t.critical })),
          performance: selfTestRunner.getPerformanceTests().map(t => ({ name: t.name, category: t.category, tool: t.tool, critical: t.critical })),
          quality: selfTestRunner.getQualityTests().map(t => ({ name: t.name, category: t.category, tool: t.tool, critical: t.critical }))
        }
    }
    
    res.json({
      success: true,
      data: tests,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/status', (req, res) => {
  try {
    const results = selfTestRunner.getTestResults()
    
    const status = {
      hasResults: !!(results && results.summary.total > 0),
      lastRun: results ? results.timestamp : null,
      totalTests: results ? results.summary.total : 0,
      passedTests: results ? results.summary.passed : 0,
      failedTests: results ? results.summary.failed : 0,
      passRate: results && results.summary.total > 0 
        ? ((results.summary.passed / results.summary.total) * 100).toFixed(2) + '%' 
        : 'N/A',
      criticalFailures: results ? results.criticalFailures.length : 0
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

export default router
