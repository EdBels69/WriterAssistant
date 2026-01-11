import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import useAppStore from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'dashboard',
      chatMessages: [
        { role: 'assistant', content: 'Добро пожаловать' }
      ],
      currentInput: '',
      settings: {
        primaryModel: 'glm-4.7',
        thinkingMode: 'interleaved',
        fallbackModel: 'deepseek-r1',
        textEditingModel: 'qwen',
        useCodingAPI: true,
        openRouterKey: ''
      }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('должен инициализироваться с начальными значениями', () => {
    const state = useAppStore.getState()
    expect(state.activeTab).toBe('dashboard')
    expect(state.chatMessages).toHaveLength(1)
    expect(state.currentInput).toBe('')
  })

  it('должен обновлять activeTab', () => {
    useAppStore.getState().setActiveTab('projects')
    expect(useAppStore.getState().activeTab).toBe('projects')
  })

  it('должен добавлять сообщение в чат', () => {
    useAppStore.getState().addChatMessage({ role: 'user', content: 'Привет' })
    expect(useAppStore.getState().chatMessages).toHaveLength(2)
    expect(useAppStore.getState().chatMessages[1].content).toBe('Привет')
  })

  it('должен обновлять текущий ввод', () => {
    useAppStore.getState().setCurrentInput('Тестовое сообщение')
    expect(useAppStore.getState().currentInput).toBe('Тестовое сообщение')
  })

  it('должен обновлять настройки', () => {
    useAppStore.getState().updateSettings('primaryModel', 'deepseek-r1')
    expect(useAppStore.getState().settings.primaryModel).toBe('deepseek-r1')
  })

  it('должен сбрасывать чат до начального состояния', () => {
    useAppStore.getState().addChatMessage({ role: 'user', content: 'Тест' })
    useAppStore.getState().setCurrentInput('Ввод')
    useAppStore.getState().resetChat()

    const state = useAppStore.getState()
    expect(state.chatMessages).toHaveLength(1)
    expect(state.currentInput).toBe('')
    expect(state.sessionId).toBe(null)
  })
})
