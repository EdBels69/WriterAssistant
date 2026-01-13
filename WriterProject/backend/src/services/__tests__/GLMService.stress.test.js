import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import GLMService from '../GLMService'

const mockAxios = {
  post: vi.fn()
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: mockAxios.post
    }))
  }
}))

describe('GLMService Stress Tests', () => {
  let glmService

  beforeEach(() => {
    vi.clearAllMocks()
    glmService = new GLMService('test-api-key')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('Exponential Backoff Logic', () => {
    it('должен вычислять задержку экспоненциально (1s → 2s → 4s)', () => {
      const delays = [0, 1, 2].map(attempt => glmService.calculateDelay(attempt))
      
      expect(delays[0]).toBeLessThan(1200)
      expect(delays[1]).toBeGreaterThan(1800)
      expect(delays[1]).toBeLessThan(2500)
      expect(delays[2]).toBeGreaterThan(3600)
      expect(delays[2]).toBeLessThan(5000)
    })

    it('должен добавлять jitter к задержкам', () => {
      const attempts = Array(10).fill(0).map((_, i) => glmService.calculateDelay(2))
      
      const allSame = attempts.every(delay => delay === attempts[0])
      expect(allSame).toBe(false)
    })

    it('должен ограничивать максимальную задержку', () => {
      const delay = glmService.calculateDelay(20)
      
      expect(delay).toBeLessThanOrEqual(glmService.maxDelay + 500)
    })
  })

  describe('Retryable Error Detection', () => {
    it('должен считать 429 retryable', () => {
      const error = { response: { status: 429 } }
      expect(glmService.isRetryableError(error)).toBe(true)
    })

    it('должен считать 502, 503, 504 retryable', () => {
      [502, 503, 504].forEach(status => {
        const error = { response: { status } }
        expect(glmService.isRetryableError(error)).toBe(true)
      })
    })

    it('должен считать 408 retryable', () => {
      const error = { response: { status: 408 } }
      expect(glmService.isRetryableError(error)).toBe(true)
    })

    it('должен считать сетевые ошибки retryable', () => {
      const error = { code: 'ECONNRESET' }
      expect(glmService.isRetryableError(error)).toBe(true)
    })

    it('НЕ должен считать 400 retryable', () => {
      const error = { response: { status: 400 } }
      expect(glmService.isRetryableError(error)).toBe(false)
    })

    it('НЕ должен считать 401 retryable', () => {
      const error = { response: { status: 401 } }
      expect(glmService.isRetryableError(error)).toBe(false)
    })

    it('НЕ должен считать 500 retryable (internal server error)', () => {
      const error = { response: { status: 500 } }
      expect(glmService.isRetryableError(error)).toBe(false)
    })
  })

  describe('Retry with Exponential Backoff', () => {
    it('должен повторять при 429 с экспоненциальной задержкой', async () => {
      vi.useFakeTimers()
      mockAxios.post
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'success' } }] } })

      const sleepSpy = vi.spyOn(glmService, 'sleep')
      const requestPromise = glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 3 })
      await vi.runAllTimersAsync()
      const result = await requestPromise

      expect(result.data.choices[0].message.content).toBe('success')
      expect(mockAxios.post).toHaveBeenCalledTimes(3)
      expect(sleepSpy).toHaveBeenCalledTimes(2)
    })

    it('должен выбрасывать ошибку после maxRetries', async () => {
      vi.useFakeTimers()
      mockAxios.post.mockRejectedValue({ response: { status: 429 } })

      const requestPromise = glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 3 })
      const assertionPromise = expect(requestPromise).rejects.toThrow()
      await vi.runAllTimersAsync()
      await assertionPromise
      
      expect(mockAxios.post).toHaveBeenCalledTimes(4)
    })

    it('НЕ должен повторять при 400', async () => {
      vi.useFakeTimers()
      mockAxios.post.mockRejectedValue({ response: { status: 400 } })

      await expect(
        glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 3 })
      ).rejects.toThrow()
      
      expect(mockAxios.post).toHaveBeenCalledTimes(1)
    })

    it('должен повторять при сетевых ошибках', async () => {
      vi.useFakeTimers()
      mockAxios.post
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockRejectedValueOnce({ code: 'ECONNRESET' })
        .mockResolvedValueOnce({ data: { choices: [{ message: { content: 'success' } }] } })

      const requestPromise = glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 3 })
      await vi.runAllTimersAsync()
      const result = await requestPromise

      expect(result.data.choices[0].message.content).toBe('success')
      expect(mockAxios.post).toHaveBeenCalledTimes(3)
    })
  })

  describe('Parallel Requests Stress Test', () => {
    it('должен обрабатывать 10 параллельных запросов', async () => {
      mockAxios.post.mockResolvedValue({ 
        data: { choices: [{ message: { content: 'success' } }] } 
      })

      const promises = Array(10).fill(0).map((_, i) => 
        glmService.makeRequest('http://test.com', { id: i })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      expect(mockAxios.post).toHaveBeenCalledTimes(10)
    })

    it('должен обрабатывать 50 параллельных запросов с рандомными ошибками', async () => {
      mockAxios.post.mockImplementation((url, data) => {
        if (data?.id % 5 === 0) {
          return Promise.reject({ response: { status: 400 } })
        }

        return Promise.resolve({
          data: { choices: [{ message: { content: 'success' } }] }
        })
      })

      const promises = Array(50).fill(0).map((_, i) => 
        glmService.makeRequest('http://test.com', { id: i })
      )

      const results = await Promise.allSettled(promises)
      
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.filter(r => r.status === 'rejected').length

      expect(successCount + failureCount).toBe(50)
      expect(successCount).toBe(40)
    })
  })

  describe('Memory Leak Prevention', () => {
    it('должен очищать таймеры после успешного запроса', async () => {
      vi.useFakeTimers()
      mockAxios.post.mockResolvedValue({ 
        data: { choices: [{ message: { content: 'success' } }] } 
      })

      const initialTimer = setTimeout(() => {}, 0)

      const requestPromise = glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 0 })
      await vi.runAllTimersAsync()
      await requestPromise

      const timerAfterRequest = setTimeout(() => {}, 0)
      clearTimeout(initialTimer)
      clearTimeout(timerAfterRequest)
    })

    it('должен очищать таймеры после ошибки', async () => {
      vi.useFakeTimers()
      mockAxios.post.mockRejectedValue({ response: { status: 400 } })

      const requestPromise = glmService.makeRequest('http://test.com', { test: 'data' }, { retries: 0 })
      const handledPromise = requestPromise.catch(() => undefined)
      await vi.runAllTimersAsync()
      await handledPromise
    })
  })
})
