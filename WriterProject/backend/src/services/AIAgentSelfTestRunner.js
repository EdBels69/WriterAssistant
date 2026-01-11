import { validateBody } from '../middleware/validation.js'
import MetricsCollector from './MetricsCollector.js'
import OutputValidator from './OutputValidator.js'

class AIAgentSelfTestRunner {
  constructor(smartRouter, metricsCollector = new MetricsCollector(), outputValidator = new OutputValidator()) {
    this.smartRouter = smartRouter
    this.metricsCollector = metricsCollector
    this.outputValidator = outputValidator
    this.testResults = []
    this.testTimeout = 30000
  }

  async runAllTests(options = {}) {
    const { testTypes = ['unit', 'integration', 'performance', 'quality'], parallel = false } = options
    const results = {
      timestamp: new Date().toISOString(),
      testTypes,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      unitTests: [],
      integrationTests: [],
      performanceTests: [],
      qualityTests: [],
      criticalFailures: []
    }

    const startTime = Date.now()

    if (testTypes.includes('unit')) {
      const unitResults = await this.runUnitTests(parallel)
      results.unitTests = unitResults.tests
      results.summary.total += unitResults.summary.total
      results.summary.passed += unitResults.summary.passed
      results.summary.failed += unitResults.summary.failed
      results.summary.skipped += unitResults.summary.skipped
      results.criticalFailures.push(...unitResults.criticalFailures)
    }

    if (testTypes.includes('integration')) {
      const integrationResults = await this.runIntegrationTests(parallel)
      results.integrationTests = integrationResults.tests
      results.summary.total += integrationResults.summary.total
      results.summary.passed += integrationResults.summary.passed
      results.summary.failed += integrationResults.summary.failed
      results.summary.skipped += integrationResults.summary.skipped
      results.criticalFailures.push(...integrationResults.criticalFailures)
    }

    if (testTypes.includes('performance')) {
      const performanceResults = await this.runPerformanceTests(parallel)
      results.performanceTests = performanceResults.tests
      results.summary.total += performanceResults.summary.total
      results.summary.passed += performanceResults.summary.passed
      results.summary.failed += performanceResults.summary.failed
      results.summary.skipped += performanceResults.summary.skipped
    }

    if (testTypes.includes('quality')) {
      const qualityResults = await this.runQualityTests(parallel)
      results.qualityTests = qualityResults.tests
      results.summary.total += qualityResults.summary.total
      results.summary.passed += qualityResults.summary.passed
      results.summary.failed += qualityResults.summary.failed
      results.summary.skipped += qualityResults.summary.skipped
    }

    results.summary.duration = Date.now() - startTime
    this.testResults = results

    return results
  }

  async runUnitTests(parallel = false) {
    const tests = this.getUnitTests()
    const results = { tests: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 }, criticalFailures: [] }

    if (parallel) {
      const testPromises = tests.map(test => this.executeTest(test, 'unit'))
      const testResults = await Promise.allSettled(testPromises)
      testResults.forEach((result, index) => this.processTestResult(result, tests[index], results))
    } else {
      for (const test of tests) {
        const result = await this.executeTest(test, 'unit')
        this.processTestResult({ status: 'fulfilled', value: result }, test, results)
      }
    }

    return results
  }

  async runIntegrationTests(parallel = false) {
    const tests = this.getIntegrationTests()
    const results = { tests: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 }, criticalFailures: [] }

    if (parallel) {
      const testPromises = tests.map(test => this.executeTest(test, 'integration'))
      const testResults = await Promise.allSettled(testPromises)
      testResults.forEach((result, index) => this.processTestResult(result, tests[index], results))
    } else {
      for (const test of tests) {
        const result = await this.executeTest(test, 'integration')
        this.processTestResult({ status: 'fulfilled', value: result }, test, results)
      }
    }

    return results
  }

  async runPerformanceTests(parallel = false) {
    const tests = this.getPerformanceTests()
    const results = { tests: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 }, criticalFailures: [] }

    if (parallel) {
      const testPromises = tests.map(test => this.executeTest(test, 'performance'))
      const testResults = await Promise.allSettled(testPromises)
      testResults.forEach((result, index) => this.processTestResult(result, tests[index], results))
    } else {
      for (const test of tests) {
        const result = await this.executeTest(test, 'performance')
        this.processTestResult({ status: 'fulfilled', value: result }, test, results)
      }
    }

    return results
  }

  async runQualityTests(parallel = false) {
    const tests = this.getQualityTests()
    const results = { tests: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 }, criticalFailures: [] }

    if (parallel) {
      const testPromises = tests.map(test => this.executeTest(test, 'quality'))
      const testResults = await Promise.allSettled(testPromises)
      testResults.forEach((result, index) => this.processTestResult(result, tests[index], results))
    } else {
      for (const test of tests) {
        const result = await this.executeTest(test, 'quality')
        this.processTestResult({ status: 'fulfilled', value: result }, test, results)
      }
    }

    return results
  }

  async executeTest(test, testType) {
    const startTime = Date.now()
    let result

    try {
      result = await Promise.race([
        test.execute(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Test timeout after ${this.testTimeout}ms`)), this.testTimeout)
        )
      ])

      const duration = Date.now() - startTime

      if (testType === 'quality') {
        const qualityScore = this.outputValidator.validate(test.category, result.output)
        result.passed = qualityScore.isValid
        result.qualityScore = qualityScore.score
        result.errors = qualityScore.errors
      }

      return {
        name: test.name,
        category: test.category,
        tool: test.tool,
        passed: result.passed !== undefined ? result.passed : true,
        duration,
        output: result.output,
        errors: result.errors || [],
        metrics: result.metrics || {},
        critical: test.critical || false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: test.name,
        category: test.category,
        tool: test.tool,
        passed: false,
        duration,
        output: null,
        errors: [error.message],
        critical: test.critical || false
      }
    }
  }

  processTestResult(promiseResult, test, results) {
    results.summary.total++

    if (promiseResult.status === 'fulfilled') {
      const testResult = promiseResult.value
      results.tests.push(testResult)

      if (testResult.passed) {
        results.summary.passed++
      } else {
        results.summary.failed++
        if (testResult.critical) {
          results.criticalFailures.push({
            name: test.name,
            category: test.category,
            tool: test.tool,
            errors: testResult.errors
          })
        }
      }
    } else {
      results.tests.push({
        name: test.name,
        category: test.category,
        tool: test.tool,
        passed: false,
        duration: 0,
        output: null,
        errors: [promiseResult.reason.message],
        critical: test.critical || false
      })
      results.summary.failed++
      if (test.critical) {
        results.criticalFailures.push({
          name: test.name,
          category: test.category,
          tool: test.tool,
          errors: [promiseResult.reason.message]
        })
      }
    }
  }

  getUnitTests() {
    return [
      {
        name: 'Hypothesis Generator - Basic',
        category: 'creative',
        tool: 'hypothesis',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('hypothesis', 'Создай гипотезу для исследования влияния кофе на продуктивность', { temperature: 0.7 })
          return {
            passed: result.output && result.output.length > 50,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Literature Review - Summarization',
        category: 'research',
        tool: 'literature_review',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('literature_review', 'Сделай обзор литературы по теме машинного обучения в медицине', { temperature: 0.5 })
          return {
            passed: result.output && result.output.length > 100,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Code Generator - Simple Function',
        category: 'code',
        tool: 'code_generator',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('code', 'Напиши функцию для сортировки массива на JavaScript', { temperature: 0.3 })
          return {
            passed: result.output && (result.output.includes('function') || result.output.includes('const')),
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Multiagent Pipeline - Researcher',
        category: 'multiagent',
        tool: 'researcher',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('researcher', 'Проведи исследование темы: влияние нейросетей на образование', { temperature: 0.6 })
          return {
            passed: result.output && result.output.length > 100,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Methodology Generator - Experimental',
        category: 'creative',
        tool: 'methodology',
        critical: false,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('methodology', 'Разработай экспериментальную методологию для исследования влияния музыки на концентрацию', { temperature: 0.5 })
          return {
            passed: result.output && result.output.length > 50,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Critic Agent - Evaluation',
        category: 'multiagent',
        tool: 'critic',
        critical: false,
        execute: async () => {
          const testContent = 'Исследование показало, что кофе повышает продуктивность на 15%'
          const result = await this.smartRouter.routeRequest('critic', testContent, { temperature: 0.4 })
          return {
            passed: result.output && result.output.length > 20,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Synthesizer Agent - Integration',
        category: 'multiagent',
        tool: 'synthesizer',
        critical: false,
        execute: async () => {
          const inputs = 'Исследователь: тема важна\nКритик: нужно больше данных\nМетодолог: подход верный'
          const result = await this.smartRouter.routeRequest('synthesizer', inputs, { temperature: 0.5 })
          return {
            passed: result.output && result.output.length > 50,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Methodologist Agent - Design',
        category: 'multiagent',
        tool: 'methodologist',
        critical: false,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('methodologist', 'Разработай дизайн исследования для оценки эффективности онлайн-обучения', { temperature: 0.5 })
          return {
            passed: result.output && result.output.length > 50,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Statistician Agent - Analysis',
        category: 'multiagent',
        tool: 'statistician',
        critical: false,
        execute: async () => {
          const data = 'Выборка: 100 человек\nСреднее: 7.5\nСтандартное отклонение: 1.2'
          const result = await this.smartRouter.routeRequest('statistician', data, { temperature: 0.4 })
          return {
            passed: result.output && result.output.length > 30,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Abstract Generator - Paper Summary',
        category: 'creative',
        tool: 'abstract',
        critical: false,
        execute: async () => {
          const paper = 'В статье исследуется влияние искусственного интеллекта на научные публикации'
          const result = await this.smartRouter.routeRequest('abstract', paper, { temperature: 0.6 })
          return {
            passed: result.output && result.output.length > 50,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      }
    ]
  }

  getIntegrationTests() {
    return [
      {
        name: 'Multiagent Pipeline - Full Workflow',
        category: 'multiagent',
        tool: 'pipeline',
        critical: true,
        execute: async () => {
          const topic = 'влияние искусственного интеллекта на научное письмо'
          const agents = ['researcher', 'critic', 'synthesizer', 'methodologist', 'statistician']
          const results = []

          for (const agent of agents) {
            const result = await this.smartRouter.routeRequest(agent, topic, { temperature: 0.6 })
            results.push(result)
          }

          return {
            passed: results.every(r => r.output && r.output.length > 20),
            output: results.map(r => r.output).join('\n---\n'),
            metrics: { agentsExecuted: results.length, avgOutputLength: results.reduce((sum, r) => sum + r.output.length, 0) / results.length }
          }
        }
      },
      {
        name: 'Research + Literature Review Integration',
        category: 'research',
        tool: 'research_integration',
        critical: true,
        execute: async () => {
          const topic = 'методы глубокого обучения для обработки естественного языка'
          
          const researchResult = await this.smartRouter.routeRequest('researcher', topic, { temperature: 0.6 })
          const literatureResult = await this.smartRouter.routeRequest('literature_review', topic, { temperature: 0.5 })

          return {
            passed: researchResult.output?.length > 50 && literatureResult.output?.length > 100,
            output: `Research: ${researchResult.output}\n\nLiterature: ${literatureResult.output}`,
            metrics: { researchLength: researchResult.output?.length || 0, literatureLength: literatureResult.output?.length || 0 }
          }
        }
      },
      {
        name: 'Hypothesis + Methodology Integration',
        category: 'creative',
        tool: 'design_integration',
        critical: false,
        execute: async () => {
          const topic = 'влияние удаленной работы на ментальное здоровье'
          
          const hypothesisResult = await this.smartRouter.routeRequest('hypothesis', topic, { temperature: 0.7 })
          const methodologyResult = await this.smartRouter.routeRequest('methodology', topic, { temperature: 0.5 })

          return {
            passed: hypothesisResult.output?.length > 50 && methodologyResult.output?.length > 50,
            output: `Hypothesis: ${hypothesisResult.output}\n\nMethodology: ${methodologyResult.output}`,
            metrics: { hypothesisLength: hypothesisResult.output?.length || 0, methodologyLength: methodologyResult.output?.length || 0 }
          }
        }
      },
      {
        name: 'Code + Documentation Integration',
        category: 'code',
        tool: 'code_documentation',
        critical: false,
        execute: async () => {
          const codeTask = 'Напиши класс для управления задачами на JavaScript'
          const codeResult = await this.smartRouter.routeRequest('code', codeTask, { temperature: 0.3 })
          const docResult = await this.smartRouter.routeRequest('code', `Напиши документацию для этого кода: ${codeResult.output}`, { temperature: 0.4 })

          return {
            passed: codeResult.output?.length > 50 && docResult.output?.length > 30,
            output: `Code: ${codeResult.output}\n\nDocs: ${docResult.output}`,
            metrics: { codeLength: codeResult.output?.length || 0, docLength: docResult.output?.length || 0 }
          }
        }
      },
      {
        name: 'Metrics Collection Integration',
        category: 'system',
        tool: 'metrics',
        critical: true,
        execute: async () => {
          const initialMetrics = this.metricsCollector.getReport()
          
          await this.smartRouter.routeRequest('hypothesis', 'Test hypothesis generation', { temperature: 0.7 })
          
          const finalMetrics = this.metricsCollector.getReport()

          return {
            passed: finalMetrics.summary.totalRequests > initialMetrics.summary.totalRequests,
            output: `Initial requests: ${initialMetrics.summary.totalRequests}\nFinal requests: ${finalMetrics.summary.totalRequests}`,
            metrics: { requestsAdded: finalMetrics.summary.totalRequests - initialMetrics.summary.totalRequests }
          }
        }
      }
    ]
  }

  getPerformanceTests() {
    return [
      {
        name: 'Response Time - Creative Tasks',
        category: 'performance',
        tool: 'response_time_creative',
        critical: false,
        execute: async () => {
          const startTime = Date.now()
          await this.smartRouter.routeRequest('hypothesis', 'Generate a test hypothesis', { temperature: 0.7 })
          const duration = Date.now() - startTime

          return {
            passed: duration < 10000,
            output: `Response time: ${duration}ms`,
            metrics: { duration, threshold: 10000 }
          }
        }
      },
      {
        name: 'Response Time - Research Tasks',
        category: 'performance',
        tool: 'response_time_research',
        critical: false,
        execute: async () => {
          const startTime = Date.now()
          await this.smartRouter.routeRequest('literature_review', 'Review literature on AI', { temperature: 0.5 })
          const duration = Date.now() - startTime

          return {
            passed: duration < 15000,
            output: `Response time: ${duration}ms`,
            metrics: { duration, threshold: 15000 }
          }
        }
      },
      {
        name: 'Response Time - Code Tasks',
        category: 'performance',
        tool: 'response_time_code',
        critical: false,
        execute: async () => {
          const startTime = Date.now()
          await this.smartRouter.routeRequest('code', 'Write a test function', { temperature: 0.3 })
          const duration = Date.now() - startTime

          return {
            passed: duration < 8000,
            output: `Response time: ${duration}ms`,
            metrics: { duration, threshold: 8000 }
          }
        }
      },
      {
        name: 'Concurrent Requests - Stress Test',
        category: 'performance',
        tool: 'concurrent_requests',
        critical: false,
        execute: async () => {
          const concurrentCount = 5
          const startTime = Date.now()

          const requests = Array(concurrentCount).fill(null).map(() =>
            this.smartRouter.routeRequest('hypothesis', 'Test hypothesis', { temperature: 0.7 })
          )

          const results = await Promise.allSettled(requests)
          const duration = Date.now() - startTime

          const successCount = results.filter(r => r.status === 'fulfilled').length

          return {
            passed: successCount === concurrentCount && duration < 30000,
            output: `Completed ${successCount}/${concurrentCount} requests in ${duration}ms`,
            metrics: { concurrentCount, successCount, duration, threshold: 30000 }
          }
        }
      },
      {
        name: 'Large Input - Chunking Performance',
        category: 'performance',
        tool: 'large_input_chunking',
        critical: false,
        execute: async () => {
          const largeText = 'Test '.repeat(5000)
          const startTime = Date.now()
          
          await this.smartRouter.routeRequestWithChunking('literature_review', largeText, { temperature: 0.5 })
          
          const duration = Date.now() - startTime

          return {
            passed: duration < 60000,
            output: `Processed ${largeText.length} characters in ${duration}ms`,
            metrics: { inputLength: largeText.length, duration, threshold: 60000 }
          }
        }
      }
    ]
  }

  getQualityTests() {
    return [
      {
        name: 'Output Quality - Hypothesis Clarity',
        category: 'quality',
        tool: 'hypothesis_quality',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('hypothesis', 'Generate a clear, testable hypothesis about sleep and productivity', { temperature: 0.7 })
          return {
            passed: true,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Output Quality - Literature Review Depth',
        category: 'quality',
        tool: 'literature_quality',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('literature_review', 'Provide a comprehensive literature review on climate change impacts', { temperature: 0.5 })
          return {
            passed: true,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Output Quality - Code Correctness',
        category: 'quality',
        tool: 'code_quality',
        critical: true,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('code', 'Write a function to calculate factorial in JavaScript', { temperature: 0.3 })
          return {
            passed: true,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      },
      {
        name: 'Output Quality - Multiagent Consistency',
        category: 'quality',
        tool: 'multiagent_consistency',
        critical: false,
        execute: async () => {
          const topic = 'AI ethics in healthcare'
          const researcherResult = await this.smartRouter.routeRequest('researcher', topic, { temperature: 0.6 })
          const criticResult = await this.smartRouter.routeRequest('critic', researcherResult.output, { temperature: 0.4 })

          return {
            passed: true,
            output: `Researcher: ${researcherResult.output}\n\nCritic: ${criticResult.output}`,
            metrics: { researcherLength: researcherResult.output?.length || 0, criticLength: criticResult.output?.length || 0 }
          }
        }
      },
      {
        name: 'Output Quality - Methodology Rigor',
        category: 'quality',
        tool: 'methodology_quality',
        critical: false,
        execute: async () => {
          const result = await this.smartRouter.routeRequest('methodology', 'Design a rigorous experimental methodology for studying dietary effects', { temperature: 0.5 })
          return {
            passed: true,
            output: result.output,
            metrics: { outputLength: result.output?.length || 0 }
          }
        }
      }
    ]
  }

  getTestResults() {
    return this.testResults
  }

  generateTestReport() {
    const results = this.testResults

    if (!results || results.summary.total === 0) {
      return { success: false, error: 'No test results available' }
    }

    const report = {
      success: true,
      timestamp: results.timestamp,
      summary: {
        passRate: ((results.summary.passed / results.summary.total) * 100).toFixed(2) + '%',
        duration: `${(results.summary.duration / 1000).toFixed(2)}s`,
        criticalIssues: results.criticalFailures.length
      },
      byType: {
        unit: {
          total: results.unitTests.length,
          passed: results.unitTests.filter(t => t.passed).length,
          passRate: results.unitTests.length > 0 
            ? ((results.unitTests.filter(t => t.passed).length / results.unitTests.length) * 100).toFixed(2) + '%' 
            : 'N/A'
        },
        integration: {
          total: results.integrationTests.length,
          passed: results.integrationTests.filter(t => t.passed).length,
          passRate: results.integrationTests.length > 0 
            ? ((results.integrationTests.filter(t => t.passed).length / results.integrationTests.length) * 100).toFixed(2) + '%' 
            : 'N/A'
        },
        performance: {
          total: results.performanceTests.length,
          passed: results.performanceTests.filter(t => t.passed).length,
          passRate: results.performanceTests.length > 0 
            ? ((results.performanceTests.filter(t => t.passed).length / results.performanceTests.length) * 100).toFixed(2) + '%' 
            : 'N/A'
        },
        quality: {
          total: results.qualityTests.length,
          passed: results.qualityTests.filter(t => t.passed).length,
          passRate: results.qualityTests.length > 0 
            ? ((results.qualityTests.filter(t => t.passed).length / results.qualityTests.length) * 100).toFixed(2) + '%' 
            : 'N/A'
        }
      },
      criticalFailures: results.criticalFailures,
      recommendations: this.generateRecommendations(results)
    }

    return report
  }

  generateRecommendations(results) {
    const recommendations = []

    if (results.criticalFailures.length > 0) {
      recommendations.push({
        priority: 'critical',
        message: `${results.criticalFailures.length} critical test failures detected. Immediate attention required.`,
        details: results.criticalFailures.map(f => `${f.name}: ${f.errors.join(', ')}`)
      })
    }

    const unitPassRate = results.unitTests.length > 0 ? (results.unitTests.filter(t => t.passed).length / results.unitTests.length) * 100 : 100
    if (unitPassRate < 80) {
      recommendations.push({
        priority: 'high',
        message: `Unit test pass rate below 80% (${unitPassRate.toFixed(2)}%). Review failing tests.`,
        details: results.unitTests.filter(t => !t.passed).map(t => `${t.name}: ${t.errors.join(', ')}`)
      })
    }

    const perfFailures = results.performanceTests.filter(t => !t.passed)
    if (perfFailures.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: `${perfFailures.length} performance tests failed. Consider optimization.`,
        details: perfFailures.map(t => `${t.name}: ${t.metrics.duration}ms > ${t.metrics.threshold}ms`)
      })
    }

    const integrationPassRate = results.integrationTests.length > 0 ? (results.integrationTests.filter(t => t.passed).length / results.integrationTests.length) * 100 : 100
    if (integrationPassRate < 90) {
      recommendations.push({
        priority: 'medium',
        message: `Integration test pass rate below 90% (${integrationPassRate.toFixed(2)}%). Check component interactions.`,
        details: results.integrationTests.filter(t => !t.passed).map(t => `${t.name}: ${t.errors.join(', ')}`)
      })
    }

    return recommendations
  }

  async runSpecificTests(testNames, testType) {
    let tests
    switch (testType) {
      case 'unit':
        tests = this.getUnitTests()
        break
      case 'integration':
        tests = this.getIntegrationTests()
        break
      case 'performance':
        tests = this.getPerformanceTests()
        break
      case 'quality':
        tests = this.getQualityTests()
        break
      default:
        throw new Error(`Invalid test type: ${testType}`)
    }

    const selectedTests = tests.filter(t => testNames.includes(t.name))
    const results = { tests: [], summary: { total: 0, passed: 0, failed: 0, skipped: 0 } }

    for (const test of selectedTests) {
      const result = await this.executeTest(test, testType)
      this.processTestResult({ status: 'fulfilled', value: result }, test, results)
    }

    return results
  }
}

export default AIAgentSelfTestRunner
