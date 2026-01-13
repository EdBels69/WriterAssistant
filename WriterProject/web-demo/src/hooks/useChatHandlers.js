import { useCallback } from 'react'
import { chatAPI } from '../api/chat'
import useAppStore from '../stores/appStore'

export const useChatHandlers = () => {
  const {
    userId,
    sessionId,
    setSessionId,
    chatMessages,
    addChatMessage,
    currentInput,
    setCurrentInput,
    chatMode,
    setChatMode,
    settings
  } = useAppStore()

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim()) return

    const userMessage = currentInput
    addChatMessage({ role: 'user', content: userMessage })
    setCurrentInput('')

    try {
      const response = await chatAPI.sendMessage({
        userId,
        projectId: null,
        sessionId,
        message: userMessage,
        mode: chatMode,
        settings: {
          thinkingMode: settings.thinkingMode,
          primaryModel: settings.primaryModel,
          fallbackModel: settings.fallbackModel,
          useCodingAPI: settings.useCodingAPI,
          openRouterKey: settings.openRouterKey
        }
      })

      setSessionId(response.sessionId)

      addChatMessage({ role: 'assistant', content: response.response, thinking: response.thinking })
    } catch (err) {
      console.error('Error sending message:', err)
      addChatMessage({ role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте позже.' })
    }
  }, [currentInput, userId, sessionId, chatMode, settings, addChatMessage, setCurrentInput, setSessionId])

  const handleChat = useCallback(async (message) => {
    if (!message?.trim()) return

    addChatMessage({ role: 'user', content: message })

    try {
      const response = await chatAPI.sendMessage({
        userId,
        projectId: null,
        sessionId,
        message,
        mode: chatMode,
        settings: {
          thinkingMode: settings.thinkingMode,
          primaryModel: settings.primaryModel,
          fallbackModel: settings.fallbackModel,
          useCodingAPI: settings.useCodingAPI,
          openRouterKey: settings.openRouterKey
        }
      })

      setSessionId(response.sessionId)

      addChatMessage({ role: 'assistant', content: response.response, thinking: response.thinking })
    } catch (err) {
      console.error('Error sending chat message:', err)
      addChatMessage({ role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте позже.' })
    }
  }, [userId, sessionId, chatMode, settings, addChatMessage, setSessionId])

  return {
    handleSendMessage,
    handleChat
  }
}
