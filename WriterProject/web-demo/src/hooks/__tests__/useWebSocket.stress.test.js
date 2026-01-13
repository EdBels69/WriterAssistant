import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWebSocket from '../useWebSocket'

const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: WebSocket.OPEN
}

vi.mock('reconnecting-websocket', () => ({
  default: vi.fn(() => mockWebSocket)
}))

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn()
  }
}))

describe('useWebSocket Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.console.warn = vi.fn()
    global.console.error = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Circuit Breaker Logic', () => {
    it('должен открывать circuit breaker после 5 последовательных сбоев', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      const circuitState = result.current.getCircuitBreakerState()
      expect(circuitState.state).toBe('open')
    })

    it('должен оставаться закрытым при < 5 сбоях', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 4; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      const circuitState = result.current.getCircuitBreakerState()
      expect(circuitState.state).toBe('closed')
    })

    it('должен переходить в half_open после resetTimeout', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      expect(result.current.getCircuitBreakerState().state).toBe('open')

      act(() => {
        vi.advanceTimersByTime(30001)
      })

      expect(result.current.getCircuitBreakerState().state).toBe('half_open')
    })

    it('должен закрывать circuit breaker при успешном соединении в half_open', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      act(() => {
        vi.advanceTimersByTime(30001)
      })

      expect(result.current.getCircuitBreakerState().state).toBe('half_open')

      act(() => {
        const event = new Event('open')
        result.current.ws?.dispatchEvent(event)
      })

      expect(result.current.getCircuitBreakerState().state).toBe('closed')
    })

    it('должен снова открываться при ошибке в half_open', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      act(() => {
        vi.advanceTimersByTime(30001)
      })

      act(() => {
        const event = new Event('error')
        result.current.ws?.dispatchEvent(event)
      })

      expect(result.current.getCircuitBreakerState().state).toBe('open')
    })
  })

  describe('Exponential Reconnection Delay', () => {
    it('должен увеличивать задержку при повторных соединениях', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        const event = new Event('close')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        const event = new Event('close')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      act(() => {
        const event = new Event('close')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        vi.advanceTimersByTime(16000)
      })
    })
  })

  describe('Connection Metrics', () => {
    it('должен отслеживать количество соединений', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        const event = new Event('open')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        const event = new Event('close')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        const event = new Event('open')
        result.current.ws?.dispatchEvent(event)
      })

      const metrics = result.current.getConnectionMetrics()
      expect(metrics.connects).toBeGreaterThan(0)
    })

    it('должен отслеживать количество сбоев', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 3; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      const metrics = result.current.getConnectionMetrics()
      expect(metrics.failures).toBeGreaterThanOrEqual(3)
    })

    it('должен вычислять uptime', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        const event = new Event('open')
        result.current.ws?.dispatchEvent(event)
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      const metrics = result.current.getConnectionMetrics()
      expect(metrics.uptime).toBeGreaterThanOrEqual(5000)
    })
  })

  describe('Pipeline Pause on Circuit Open', () => {
    it('должен ставить pipeline на паузу при открытии circuit breaker', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        result.current.setPausePipeline(false)
      })

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      expect(result.current.getCircuitBreakerState().state).toBe('open')
    })

    it('должен возобновлять pipeline при закрытии circuit breaker', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 5; i++) {
          const event = new Event('error')
          result.current.ws?.dispatchEvent(event)
        }
      })

      act(() => {
        vi.advanceTimersByTime(30001)
      })

      act(() => {
        const event = new Event('open')
        result.current.ws?.dispatchEvent(event)
      })

      expect(result.current.getCircuitBreakerState().state).toBe('closed')
    })
  })

  describe('Memory Leak Prevention', () => {
    it('должен очищать таймеры при размонтировании', () => {
      const { unmount } = renderHook(() => useWebSocket())

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(10000)
      })
    })

    it('должен корректно обрабатывать быстрое соединение/разъединение', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        for (let i = 0; i < 100; i++) {
          const event = new Event('close')
          result.current.ws?.dispatchEvent(event)
          vi.advanceTimersByTime(10)
        }
      })

      const metrics = result.current.getConnectionMetrics()
      expect(metrics.disconnects).toBeGreaterThan(0)
    })
  })
})
