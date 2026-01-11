import request from 'supertest'
import app from '../../index.js'
import Database from '../../database/Database.js'
import { join } from 'path'

describe('AI Endpoints Integration Tests', () => {
  let db

  beforeAll(async () => {
    db = new Database(join(process.cwd(), '../data/writer-assistant.test.db'))
    await db.init()
  })

  afterAll(async () => {
    await db.close()
  })

  describe('POST /api/ai/generate-hypothesis', () => {
    it('should generate a hypothesis successfully', async () => {
      const response = await request(app)
        .post('/api/ai/generate-hypothesis')
        .send({
          prompt: 'Создай гипотезу для исследования влияния кофе на продуктивность',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(20)
    })

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate-hypothesis')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return error for empty prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate-hypothesis')
        .send({
          prompt: '',
          provider: 'openrouter'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/literature-review', () => {
    it('should generate a literature review successfully', async () => {
      const response = await request(app)
        .post('/api/ai/literature-review')
        .send({
          prompt: 'Сделай обзор литературы по теме машинного обучения в медицине',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(50)
    })

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/literature-review')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/generate-methodology', () => {
    it('should generate a methodology successfully', async () => {
      const response = await request(app)
        .post('/api/ai/generate-methodology')
        .send({
          prompt: 'Разработай экспериментальную методологию для исследования влияния музыки на концентрацию',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(30)
    })

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate-methodology')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/generate-code', () => {
    it('should generate code successfully', async () => {
      const response = await request(app)
        .post('/api/ai/generate-code')
        .send({
          prompt: 'Напиши функцию для сортировки массива на JavaScript',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(10)
    })

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate-code')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/generate-abstract', () => {
    it('should generate an abstract successfully', async () => {
      const response = await request(app)
        .post('/api/ai/generate-abstract')
        .send({
          prompt: 'В статье исследуется влияние искусственного интеллекта на научные публикации',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(20)
    })

    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate-abstract')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/pipeline', () => {
    it('should run multiagent pipeline successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/pipeline')
        .send({
          topic: 'влияние искусственного интеллекта на научное письмо',
          agents: ['researcher', 'critic', 'synthesizer'],
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(50)
    })

    it('should return error for missing topic', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/pipeline')
        .send({
          agents: ['researcher'],
          provider: 'openrouter'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return error for missing agents array', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/pipeline')
        .send({
          topic: 'test topic',
          provider: 'openrouter'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/researcher', () => {
    it('should run researcher agent successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/researcher')
        .send({
          topic: 'влияние нейросетей на образование',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
      expect(response.body.output.length).toBeGreaterThan(30)
    })

    it('should return error for missing topic', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/researcher')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/critic', () => {
    it('should run critic agent successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/critic')
        .send({
          content: 'Исследование показало, что кофе повышает продуктивность на 15%',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
    })

    it('should return error for missing content', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/critic')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/synthesizer', () => {
    it('should run synthesizer agent successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/synthesizer')
        .send({
          inputs: 'Исследователь: тема важна\nКритик: нужно больше данных\nМетодолог: подход верный',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
    })

    it('should return error for missing inputs', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/synthesizer')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/methodologist', () => {
    it('should run methodologist agent successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/methodologist')
        .send({
          topic: 'Разработай дизайн исследования для оценки эффективности онлайн-обучения',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
    })

    it('should return error for missing topic', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/methodologist')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/multiagent/statistician', () => {
    it('should run statistician agent successfully', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/statistician')
        .send({
          data: 'Выборка: 100 человек\nСреднее: 7.5\nСтандартное отклонение: 1.2',
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
    })

    it('should return error for missing data', async () => {
      const response = await request(app)
        .post('/api/ai/multiagent/statistician')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/ai/chunked-request', () => {
    it('should handle chunked request successfully', async () => {
      const largeText = 'Test text for chunking. '.repeat(500)
      
      const response = await request(app)
        .post('/api/ai/chunked-request')
        .send({
          taskType: 'literature_review',
          text: largeText,
          provider: 'openrouter',
          openRouterKey: process.env.OPENROUTER_API_KEY || 'test-key'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('output')
      expect(response.body.output).toBeTruthy()
    })

    it('should return error for missing taskType', async () => {
      const response = await request(app)
        .post('/api/ai/chunked-request')
        .send({
          text: 'some text',
          provider: 'openrouter'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return error for missing text', async () => {
      const response = await request(app)
        .post('/api/ai/chunked-request')
        .send({
          taskType: 'literature_review',
          provider: 'openrouter'
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
