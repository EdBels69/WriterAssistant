import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PipelineVisualizer from '../PipelineVisualizer'
import usePipelineStore from '../../stores/pipelineStore'
import useContextStore from '../../stores/contextStore'
import useWebSocket from '../../hooks/useWebSocket'

vi.mock('../../stores/pipelineStore')
vi.mock('../../stores/contextStore')
vi.mock('../../hooks/useWebSocket')
vi.mock('../../api/ai')

const mockPipeline = {
  id: 'test-pipeline-1',
  name: 'Test Pipeline',
  templateId: 'research',
  status: 'pending',
  steps: [
    { id: 'step-1', name: 'Analysis', status: 'completed', result: 'result-1' },
    { id: 'step-2', name: 'Processing', status: 'error', result: null, error: 'API Error' },
    { id: 'step-3', name: 'Finalization', status: 'pending', result: null }
  ],
  createdAt: new Date().toISOString()
}

let pipelineStoreValue

describe('PipelineVisualizer Stress Tests - Error Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    pipelineStoreValue = {
      pipelines: [mockPipeline],
      activePipeline: 'test-pipeline-1',
      setActivePipeline: vi.fn(),
      updateStepStatus: vi.fn(),
      resetPipeline: vi.fn(),
      deletePipeline: vi.fn(),
      isPaused: false,
      pausePipeline: vi.fn(),
      resumePipeline: vi.fn()
    }

    usePipelineStore.mockReturnValue(pipelineStoreValue)

    useWebSocket.mockReturnValue({
      connectionState: 'connected',
      setPausePipeline: vi.fn(),
      getCircuitBreakerState: () => ({
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null
      })
    })

    useContextStore.mockReturnValue({
      getContextForStep: vi.fn(() => ({}))
    })

    vi.mocked(usePipelineStore).getState = vi.fn(() => pipelineStoreValue)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Error Detection', () => {
    it('должен показывать error recovery UI при наличии шагов со статусом error', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.getByText(/ошибка выполнения pipeline/i)).toBeInTheDocument()
    })

    it('должен показывать error recovery UI при отключении WebSocket', () => {
      useWebSocket.mockReturnValue({
        connectionState: 'disconnected',
        setPausePipeline: vi.fn(),
        getCircuitBreakerState: () => ({
          state: 'open',
          failureCount: 5,
          lastFailureTime: Date.now()
        })
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.getByText(/проблема с соединением/i)).toBeInTheDocument()
    })

    it('НЕ должен показывать error recovery UI при успешном выполнении', () => {
      const successPipeline = {
        ...mockPipeline,
        steps: mockPipeline.steps.map(s => ({ ...s, status: 'completed' }))
      }

      usePipelineStore.mockReturnValue({
        ...pipelineStoreValue,
        pipelines: [successPipeline]
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.queryByText(/ошибка выполнения pipeline/i)).not.toBeInTheDocument()
    })
  })

  describe('Retry Step Action', () => {
    it('должен повторять только ошибочный шаг', async () => {
      const updateStepStatus = vi.fn()
      usePipelineStore.mockReturnValue({
        ...pipelineStoreValue,
        updateStepStatus
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryButton = screen.getByRole('button', { name: /повторить шаг/i })
      await act(async () => {
        fireEvent.click(retryButton)
      })

      expect(updateStepStatus).toHaveBeenCalledWith(
        'test-pipeline-1',
        'step-2',
        'pending'
      )
    })

    it('должен показывать счетчик попыток повтора', async () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryButton = screen.getByRole('button', { name: /повторить шаг/i })

      await act(async () => {
        fireEvent.click(retryButton)
      })

      expect(screen.getByText(/1/)).toBeInTheDocument()
    })

    it('должен отключать кнопку после 3 попыток', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryButton = screen.getByRole('button', { name: /повторить шаг/i })

      act(() => {
        fireEvent.click(retryButton)
        fireEvent.click(retryButton)
        fireEvent.click(retryButton)
      })

      expect(retryButton).toBeDisabled()
    })

    it('должен показывать предупреждение после 3 попыток', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryButton = screen.getByRole('button', { name: /повторить шаг/i })

      act(() => {
        fireEvent.click(retryButton)
        fireEvent.click(retryButton)
        fireEvent.click(retryButton)
      })

      expect(screen.getByText(/превышено количество попыток повтора/i)).toBeInTheDocument()
    })
  })

  describe('Skip Step Action', () => {
    it('должен помечать ошибочный шаг как completed', async () => {
      const updateStepStatus = vi.fn()
      usePipelineStore.mockReturnValue({
        ...pipelineStoreValue,
        updateStepStatus
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const skipButton = screen.getByRole('button', { name: /пропустить/i })
      await act(async () => {
        fireEvent.click(skipButton)
      })

      expect(updateStepStatus).toHaveBeenCalledWith(
        'test-pipeline-1',
        'step-2',
        'completed'
      )
    })
  })

  describe('Retry All Action', () => {
    it('должен повторять все шаги со статусом error', async () => {
      const updateStepStatus = vi.fn()
      const pipelineWithMultipleErrors = {
        ...mockPipeline,
        steps: [
          { id: 'step-1', name: 'Analysis', status: 'error', result: null },
          { id: 'step-2', name: 'Processing', status: 'error', result: null },
          { id: 'step-3', name: 'Finalization', status: 'pending', result: null }
        ]
      }

      usePipelineStore.mockReturnValue({
        ...pipelineStoreValue,
        pipelines: [pipelineWithMultipleErrors],
        updateStepStatus
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryAllButton = screen.getByRole('button', { name: /повторить всё/i })
      await act(async () => {
        fireEvent.click(retryAllButton)
      })

      expect(updateStepStatus).toHaveBeenCalledWith(
        'test-pipeline-1',
        'step-1',
        'pending'
      )
      expect(updateStepStatus).toHaveBeenCalledWith(
        'test-pipeline-1',
        'step-2',
        'pending'
      )
    })
  })

  describe('Network Error Recovery', () => {
    it('должен показывать статус circuit breaker', () => {
      useWebSocket.mockReturnValue({
        connectionState: 'circuit_open',
        setPausePipeline: vi.fn(),
        getCircuitBreakerState: () => ({
          state: 'open',
          failureCount: 5,
          lastFailureTime: Date.now()
        })
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.getByText(/статус circuit breaker:/i)).toBeInTheDocument()
      expect(screen.getByText(/открыт/i)).toBeInTheDocument()
    })

    it('должен показывать количество сбоев', () => {
      useWebSocket.mockReturnValue({
        connectionState: 'circuit_open',
        setPausePipeline: vi.fn(),
        getCircuitBreakerState: () => ({
          state: 'open',
          failureCount: 7,
          lastFailureTime: Date.now()
        })
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.getByText(/количество сбоев: 7/i)).toBeInTheDocument()
    })

    it('должен закрывать панель при "Подождать восстановления"', () => {
      useWebSocket.mockReturnValue({
        connectionState: 'circuit_open',
        setPausePipeline: vi.fn(),
        getCircuitBreakerState: () => ({
          state: 'open',
          failureCount: 5,
          lastFailureTime: Date.now()
        })
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const waitButton = screen.getByRole('button', { name: /подождать восстановления/i })
      act(() => {
        fireEvent.click(waitButton)
      })

      expect(screen.queryByText(/проблема с соединением/i)).not.toBeInTheDocument()
    })
  })

  describe('Panel Dismissal', () => {
    it('должен закрывать панель по кнопке закрытия', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const closeButton = screen.getByLabelText(/закрыть панель восстановления/i)
      act(() => {
        fireEvent.click(closeButton)
      })

      expect(screen.queryByText(/ошибка выполнения pipeline/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('должен иметь role="alert"', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const alertPanel = screen.getByRole('alert')
      expect(alertPanel).toBeInTheDocument()
    })

    it('должен иметь aria-live="polite"', () => {
      const { container } = render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const alertPanel = container.querySelector('[role="alert"]')
      expect(alertPanel).toHaveAttribute('aria-live', 'polite')
    })

    it('должен иметь aria-label на кнопке закрытия', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const closeButton = screen.getByLabelText(/закрыть панель восстановления/i)
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Integration with Pipeline State', () => {
    it('должен скрывать error recovery UI при успешном повторе', async () => {
      const pipelineAfterRetry = {
        ...mockPipeline,
        steps: mockPipeline.steps.map(s => ({ ...s, status: 'completed' }))
      }

      usePipelineStore.mockReturnValue({
        ...pipelineStoreValue,
        pipelines: [pipelineAfterRetry]
      })

      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.queryByText(/ошибка выполнения pipeline/i)).not.toBeInTheDocument()
    })

    it('должен показывать error recovery UI при повторной ошибке', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      expect(screen.getByText(/ошибка выполнения pipeline/i)).toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('должен сбрасывать счетчик попыток при закрытии панели', () => {
      render(<PipelineVisualizer pipelineId="test-pipeline-1" />)

      const retryButton = screen.getByRole('button', { name: /повторить шаг/i })

      act(() => {
        fireEvent.click(retryButton)
        fireEvent.click(retryButton)
      })

      const closeButton = screen.getByLabelText(/закрыть панель восстановления/i)
      act(() => {
        fireEvent.click(closeButton)
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(screen.queryByText(/ошибка выполнения pipeline/i)).not.toBeInTheDocument()
    })
  })
})
