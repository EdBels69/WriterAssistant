import request from 'supertest'
import { describe, it, expect, beforeAll, vi } from 'vitest'

vi.mock('../GLMService.js', () => {
  return {
    default: class GLMService {
      constructor() {}

      async generateCompletion(prompt) {
        return {
          success: true,
          content: `TEST: ${prompt}`.slice(0, 2000),
          thinking: null,
          usage: { total_tokens: 0 }
        }
      }
    }
  }
})

let app

beforeAll(async () => {
  const mod = await import('../../index.js')
  app = mod.default
})

describe('AI Endpoints Integration Tests', () => {
  describe('POST /api/ai/hypothesis', () => {
    it('should generate a hypothesis successfully', async () => {
      const response = await request(app)
        .post('/api/ai/hypothesis')
        .send({
          researchArea: 'Психология труда',
          researchQuestion: 'Как кофе влияет на продуктивность?',
          context: 'Короткий контекст'
        })

      const content = response.body.content || response.body.output

      expect(response.status).toBe(200)
      expect(content).toBeTruthy()
      expect(String(content).length).toBeGreaterThan(20)
      expect(response.body).toHaveProperty('validationPassed')
      expect(response.body).toHaveProperty('qualityScore')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/ai/hypothesis')
        .send({
          researchArea: ''
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/structure-ideas', () => {
    it('should structure ideas successfully via provider mode', async () => {
      const response = await request(app)
        .post('/api/ai/structure-ideas')
        .send({
          sources: 'Источник 1: ...\nИсточник 2: ...',
          researchGoal: 'Структурировать основные идеи',
          context: 'Дополнительный контекст',
          provider: 'openrouter',
          openRouterKey: 'test-key'
        })

      const content = response.body.content || response.body.output

      expect(response.status).toBe(200)
      expect(content).toBeTruthy()
      expect(String(content).length).toBeGreaterThan(20)
    })

    it('should return 400 for missing sources', async () => {
      const response = await request(app)
        .post('/api/ai/structure-ideas')
        .send({
          researchGoal: 'Goal'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/literature-review', () => {
    it('should generate literature review successfully via provider mode', async () => {
      const response = await request(app)
        .post('/api/ai/literature-review')
        .send({
          topic: 'Машинное обучение в медицине',
          reviewType: 'narrative',
          context: 'Короткий контекст',
          provider: 'openrouter',
          openRouterKey: 'test-key'
        })

      const content = response.body.content || response.body.output

      expect(response.status).toBe(200)
      expect(content).toBeTruthy()
    })

    it('should return 400 for missing topic', async () => {
      const response = await request(app)
        .post('/api/ai/literature-review')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/statistical-analysis', () => {
    it('should generate analysis successfully via provider mode', async () => {
      const response = await request(app)
        .post('/api/ai/statistical-analysis')
        .send({
          researchQuestion: 'Есть ли связь между X и Y?',
          dataDescription: 'Выборка: 100 человек; метрики: ...',
          provider: 'openrouter',
          openRouterKey: 'test-key'
        })

      const content = response.body.content || response.body.output

      expect(response.status).toBe(200)
      expect(content).toBeTruthy()
    })

    it('should return 400 for missing dataDescription', async () => {
      const response = await request(app)
        .post('/api/ai/statistical-analysis')
        .send({
          researchQuestion: 'Q'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/style-editing', () => {
    it('should handle large text via chunking', async () => {
      const response = await request(app)
        .post('/api/ai/style-editing')
        .send({
          text: 'Текст. '.repeat(5000),
          targetStyle: 'academic',
          provider: 'qwen',
          openRouterKey: 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.content).toBeTruthy()
      expect(response.body.provider).toBeTruthy()
    })

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/ai/style-editing')
        .send({
          targetStyle: 'academic'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })
})

describe('Metrics Endpoints Integration Tests', () => {
  describe('GET /api/metrics/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/metrics/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('uptime')
      expect(response.body.data).toHaveProperty('services')
    })
  })

  describe('GET /api/metrics/dashboard', () => {
    it('should return dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('overview')
      expect(response.body.data).toHaveProperty('byCategory')
    })
  })

  describe('GET /api/metrics/category/:category', () => {
    it('should return metrics for valid category', async () => {
      const response = await request(app)
        .get('/api/metrics/category/creative')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('totalRequests')
    })

    it('should return error for invalid category', async () => {
      const response = await request(app)
        .get('/api/metrics/category/invalid')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
    })
  })

  describe('POST /api/metrics/record', () => {
    it('should record metric successfully', async () => {
      const response = await request(app)
        .post('/api/metrics/record')
        .send({
          category: 'creative',
          instrument: 'hypothesis',
          responseTime: 1500,
          success: true,
          outputLength: 200,
          qualityScore: 0.85
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
    })

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/metrics/record')
        .send({
          category: 'creative',
          instrument: 'hypothesis'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('success', false)
    })
  })
})

describe('Self-Test Endpoints Integration Tests', () => {
  describe('GET /api/self-test/tests', () => {
    it('should return all available tests', async () => {
      const response = await request(app)
        .get('/api/self-test/tests')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('unit')
      expect(response.body.data).toHaveProperty('integration')
      expect(response.body.data).toHaveProperty('performance')
      expect(response.body.data).toHaveProperty('quality')
    })

    it('should return tests for specific type', async () => {
      const response = await request(app)
        .get('/api/self-test/tests?type=unit')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/self-test/status', () => {
    it('should return test status', async () => {
      const response = await request(app)
        .get('/api/self-test/status')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('hasResults')
      expect(response.body.data).toHaveProperty('totalTests')
    })
  })

  describe('POST /api/self-test/run/unit', () => {
    it('should run unit tests', async () => {
      const response = await request(app)
        .post('/api/self-test/run/unit')
        .send({ parallel: false })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('tests')
      expect(response.body.data).toHaveProperty('summary')
    }, 60000)
  })
})

describe('Error Handling Integration Tests', () => {
  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/non-existent')

    expect(response.status).toBe(404)
  })

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/ai/generate-hypothesis')
      .set('Content-Type', 'application/json')
      .send('invalid json')

    expect(response.status).toBe(400)
  })
})
