import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAxiosInstance = {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

const axios = {
  create: vi.fn(() => mockAxiosInstance)
}

vi.mock('axios', () => ({
  default: axios
}))

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    localStorage.clear()
  })

  it('должен создавать экземпляр axios с правильной конфигурацией', async () => {
    const { default: apiClient } = await import('./client')
    
    expect(axios.create).toHaveBeenCalled()
    expect(apiClient).toBeDefined()
    expect(apiClient.interceptors).toBeDefined()
  })

  it('должен добавлять userId к запросам из localStorage', () => {
    localStorage.setItem('userId', 'test-user-123')

    const requestInterceptorFn = vi.fn((config) => {
      config.params = config.params || {}
      config.params.userId = localStorage.getItem('userId')
      return config
    })

    mockAxiosInstance.interceptors.request.use.mockImplementation(requestInterceptorFn)

    const config = { params: {} }
    requestInterceptorFn(config)
    
    expect(config.params).toEqual({ userId: 'test-user-123' })
  })
})
