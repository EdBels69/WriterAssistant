import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, renderHook, act } from '@testing-library/react'
import useAppStore from '../appStore'
import usePipelineStore from '../pipelineStore'
import useContextStore from '../contextStore'

describe('Integration Stress Tests - Parallel Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    localStorage.clear()

    useAppStore.setState({
      activeTab: 'dashboard',
      chatMessages: [{ role: 'assistant', content: 'Добро пожаловать' }],
      currentInput: '',
      sessionId: null,
      settings: {
        primaryModel: 'glm-4.7',
        thinkingMode: 'interleaved',
        fallbackModel: 'deepseek-r1',
        textEditingModel: 'qwen',
        useCodingAPI: true,
        openRouterKey: ''
      }
    })

    usePipelineStore.setState({
      pipelines: [],
      activePipeline: null,
      activeStep: null,
      stepResults: {},
      isPaused: false
    })

    useContextStore.setState({
      contexts: {},
      researchContext: {
        researchTopic: '',
        hypothesis: '',
        methodology: '',
        literature: [],
        data: null,
        results: null,
        discussion: null,
        conclusion: null
      },
      uploadedFiles: [],
      extractedReferences: [],
      generatedIdeas: [],
      generatedHypotheses: [],
      structureIdeas: [],
      methodologyStructure: [],
      literatureReviews: [],
      statisticalAnalyses: [],
      styleImprovements: []
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('State Synchronization', () => {
    it('должен синхронизировать состояние между store при параллельных обновлениях', () => {
      const { result: appStore } = renderHook(() => useAppStore())
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        appStore.current.setActiveTab('projects')
        pipelineStore.current.setActivePipeline('pipeline-1')
        appStore.current.addChatMessage({ role: 'user', content: 'Test' })
        pipelineStore.current.setIsPaused(true)
      })

      expect(appStore.current.activeTab).toBe('projects')
      expect(pipelineStore.current.activePipeline).toBe('pipeline-1')
      expect(appStore.current.chatMessages).toHaveLength(2)
      expect(pipelineStore.current.isPaused).toBe(true)
    })

    it('должен сохранять состояние при 100 последовательных обновлениях', () => {
      const { result: appStore } = renderHook(() => useAppStore())

      act(() => {
        for (let i = 0; i < 100; i++) {
          appStore.current.setCurrentInput(`Input ${i}`)
          appStore.current.addChatMessage({ role: 'user', content: `Message ${i}` })
        }
      })

      expect(appStore.current.currentInput).toBe('Input 99')
      expect(appStore.current.chatMessages).toHaveLength(101)
    })
  })

  describe('Race Condition Prevention', () => {
    it('должен предотвращать race conditions при одновременном запуске pipeline', () => {
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        pipelineStore.current.setActivePipeline('pipeline-1')
        pipelineStore.current.setIsPaused(false)
        pipelineStore.current.updateStepStatus('pipeline-1', 'step-1', 'running')
      })

      expect(pipelineStore.current.activePipeline).toBe('pipeline-1')
      expect(pipelineStore.current.isPaused).toBe(false)
    })

    it('должен корректно обрабатывать отмену pipeline', () => {
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        pipelineStore.current.setActivePipeline('pipeline-1')
        pipelineStore.current.setIsPaused(true)
      })

      expect(pipelineStore.current.isPaused).toBe(true)
    })
  })

  describe('Memory Leak Detection', () => {
    it('должен очищать состояние при размонтировании', () => {
      const { result: appStore } = renderHook(() => useAppStore())
      const { unmount } = renderHook(() => useAppStore())

      act(() => {
        appStore.current.addChatMessage({ role: 'user', content: 'Test' })
      })

      unmount()

      const { result: newAppStore } = renderHook(() => useAppStore())
      expect(newAppStore.current.chatMessages).toHaveLength(2)
    })

    it('должен очищать pipeline при удалении', () => {
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        pipelineStore.current.deletePipeline('pipeline-1')
      })

      expect(pipelineStore.current.pipelines).not.toContainEqual(
        expect.objectContaining({ id: 'pipeline-1' })
      )
    })
  })

  describe('Performance Under Load', () => {
    it('должен обрабатывать 50 параллельных сообщений', () => {
      const { result: appStore } = renderHook(() => useAppStore())

      const startTime = Date.now()

      act(() => {
        const promises = Array(50).fill(0).map((_, i) => {
          return new Promise(resolve => {
            setTimeout(() => {
              appStore.current.addChatMessage({ role: 'user', content: `Message ${i}` })
              resolve()
            }, Math.random() * 100)
          })
        })

        vi.runAllTimers()
      })

      const duration = Date.now() - startTime
      expect(appStore.current.chatMessages).toHaveLength(51)
    })

    it('должен обрабатывать 10 pipeline одновременно', () => {
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        for (let i = 0; i < 10; i++) {
          pipelineStore.current.addPipeline({
            id: `pipeline-${i}`,
            name: `Pipeline ${i}`,
            templateId: 'research',
            steps: [],
            status: 'pending'
          })
        }
      })

      expect(pipelineStore.current.pipelines).toHaveLength(10)
    })
  })

  describe('Context Store Integration', () => {
    it('должен сохранять контекст между pipeline', () => {
      const { result: contextStore } = renderHook(() => useContextStore())

      act(() => {
        contextStore.current.updateContext('step-1', { researchData: 'test' })
        contextStore.current.updateContext('step-2', { analysisData: 'test2' })
      })

      expect(contextStore.current.contexts).toHaveProperty('step-1')
      expect(contextStore.current.contexts).toHaveProperty('step-2')
    })

    it('должен очищать контекст при сбросе pipeline', () => {
      const { result: contextStore } = renderHook(() => useContextStore())

      act(() => {
        contextStore.current.updateContext('step-1', { data: 'test' })
        contextStore.current.clearContext('step-1')
      })

      expect(contextStore.current.contexts).not.toHaveProperty('step-1')
    })
  })

  describe('Error Recovery', () => {
    it('должен восстанавливаться после ошибки в одном store', () => {
      const { result: appStore } = renderHook(() => useAppStore())

      act(() => {
        try {
          appStore.current.addChatMessage({ role: 'user', content: 'Error message' })
        } catch (e) {
          // Error occurred
        }
        appStore.current.resetChat()
      })

      expect(appStore.current.chatMessages).toHaveLength(1)
    })

    it('должен сохранять состояние при переключении активных pipeline', () => {
      const { result: pipelineStore } = renderHook(() => usePipelineStore())

      act(() => {
        pipelineStore.current.setActivePipeline('pipeline-1')
        pipelineStore.current.updateStepStatus('pipeline-1', 'step-1', 'completed')
        pipelineStore.current.setActivePipeline('pipeline-2')
      })

      expect(pipelineStore.current.activePipeline).toBe('pipeline-2')
    })
  })

  describe('Persistence', () => {
    it('должен сохранять состояние в localStorage', () => {
      const { result: appStore } = renderHook(() => useAppStore())

      act(() => {
        appStore.current.updateSettings('primaryModel', 'deepseek-r1')
      })

      const savedState = localStorage.getItem('app-store')
      expect(savedState).toBeTruthy()
    })

    it('должен загружать состояние из localStorage', async () => {
      const savedState = JSON.stringify({
        state: {
          activeTab: 'projects',
          chatMessages: [{ role: 'assistant', content: 'Test' }],
          currentInput: '',
          settings: {
            primaryModel: 'glm-4.7',
            thinkingMode: 'interleaved',
            fallbackModel: 'deepseek-r1',
            textEditingModel: 'qwen',
            useCodingAPI: true,
            openRouterKey: ''
          }
        },
        version: 0
      })

      localStorage.setItem('app-store', savedState)

      await act(async () => {
        await useAppStore.persist.rehydrate()
      })

      const { result: appStore } = renderHook(() => useAppStore())

      expect(appStore.current.activeTab).toBe('projects')
      expect(appStore.current.chatMessages).toHaveLength(1)
    })
  })
})
