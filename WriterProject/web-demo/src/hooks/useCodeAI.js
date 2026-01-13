import { useCallback } from 'react'
import { aiAPI } from '../api/ai'
import useAppStore from '../stores/appStore'

export const useCodeAI = () => {
  const { textInputResult, setTextInputResult } = useAppStore()

  const executeAI = useCallback(async (endpoint, params) => {
    try {
      const response = await aiAPI[endpoint](params)
      if (response?.success && response?.data) {
        setTextInputResult(response.data)
        return response
      }
      throw new Error(response?.error || 'Unknown error')
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error)
      throw error
    }
  }, [setTextInputResult])

  const handleGenerateCode = useCallback(async () => {
    const description = prompt('Описание задачи или желаемого функционала:')
    if (!description) return

    const language = prompt('Язык программирования (Python, JavaScript, Java и т.д.):')
    if (!language) return

    try {
      await executeAI('generateCode', {
        description,
        language
      })
    } catch (error) {
      alert('Ошибка генерации кода: ' + error.message)
    }
  }, [executeAI])

  const handleReviewCode = useCallback(async () => {
    const code = prompt('Код для рецензии:')
    if (!code) return

    const language = prompt('Язык программирования:')
    if (!language) return

    try {
      await executeAI('reviewCode', {
        code,
        language
      })
    } catch (error) {
      alert('Ошибка рецензии кода: ' + error.message)
    }
  }, [executeAI])

  const handleDebugCode = useCallback(async () => {
    const code = prompt('Код с ошибкой:')
    if (!code) return

    const errorDescription = prompt('Описание ошибки или поведения:') || ''

    try {
      await executeAI('debugCode', {
        code,
        errorDescription
      })
    } catch (error) {
      alert('Ошибка отладки кода: ' + error.message)
    }
  }, [executeAI])

  const handleOptimizeCode = useCallback(async () => {
    const code = prompt('Код для оптимизации:')
    if (!code) return

    const goal = prompt('Цель оптимизации (производительность, память, читаемость):') || 'производительность'

    try {
      await executeAI('optimizeCode', {
        code,
        goal
      })
    } catch (error) {
      alert('Ошибка оптимизации кода: ' + error.message)
    }
  }, [executeAI])

  const handleExplainCode = useCallback(async () => {
    const code = prompt('Код для объяснения:')
    if (!code) return

    const language = prompt('Язык программирования:')
    if (!language) return

    try {
      await executeAI('explainCode', {
        code,
        language
      })
    } catch (error) {
      alert('Ошибка объяснения кода: ' + error.message)
    }
  }, [executeAI])

  const handleRefactorCode = useCallback(async () => {
    const code = prompt('Код для рефакторинга:')
    if (!code) return

    const language = prompt('Язык программирования:')
    if (!language) return

    try {
      await executeAI('refactorCode', {
        code,
        language
      })
    } catch (error) {
      alert('Ошибка рефакторинга кода: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateTests = useCallback(async () => {
    const code = prompt('Код для тестирования:')
    if (!code) return

    const language = prompt('Язык программирования:')
    if (!language) return

    const framework = prompt('Тестовый фреймворк (Jest, pytest, JUnit и т.д.):') || 'auto'

    try {
      await executeAI('generateTests', {
        code,
        language,
        framework
      })
    } catch (error) {
      alert('Ошибка генерации тестов: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateDocumentation = useCallback(async () => {
    const code = prompt('Код для документирования:')
    if (!code) return

    const language = prompt('Язык программирования:')
    if (!language) return

    const format = prompt('Формат (JSDoc, docstring, doc comment):') || 'auto'

    try {
      await executeAI('generateDocumentation', {
        code,
        language,
        format
      })
    } catch (error) {
      alert('Ошибка генерации документации: ' + error.message)
    }
  }, [executeAI])

  return {
    handleGenerateCode,
    handleReviewCode,
    handleDebugCode,
    handleOptimizeCode,
    handleExplainCode,
    handleRefactorCode,
    handleGenerateTests,
    handleGenerateDocumentation,
    textInputResult
  }
}
