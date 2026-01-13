import { useCallback } from 'react'
import { aiAPI } from '../api/ai'
import useAppStore from '../stores/appStore'

export const useWritingAI = () => {
  const { userId, settings, textInputResult, setTextInputResult, inputText, setInputText } = useAppStore()

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

  const handleGenerateIdeas = useCallback(async () => {
    const genre = prompt('Жанр (фэнтези, научная фантастика, триллер, романтика и т.д.):')
    if (!genre) return

    const theme = prompt('Тема или концепция истории:')
    if (!theme) return

    const count = prompt('Количество идей (по умолчанию 5):') || '5'

    try {
      await executeAI('generateIdeas', {
        genre,
        theme,
        count: parseInt(count),
        text: inputText
      })
    } catch (error) {
      alert('Ошибка генерации идей: ' + error.message)
    }
  }, [executeAI, inputText])

  const handleExpandText = useCallback(async () => {
    const text = prompt('Текст для расширения:')
    if (!text) return

    const direction = prompt('Направление (развить, углубить, пояснить):') || 'развить'

    try {
      await executeAI('expandText', {
        text,
        direction
      })
    } catch (error) {
      alert('Ошибка расширения текста: ' + error.message)
    }
  }, [executeAI])

  const handleEditStyle = useCallback(async () => {
    const text = prompt('Текст для редактирования стиля:')
    if (!text) return

    const style = prompt('Желаемый стиль (академический, художественный, деловой):')
    if (!style) return

    try {
      await executeAI('editStyle', {
        text,
        style
      })
    } catch (error) {
      alert('Ошибка редактирования стиля: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateCharacter = useCallback(async () => {
    const description = prompt('Описание персонажа или контекст:')
    if (!description) return

    try {
      await executeAI('generateCharacter', {
        description,
        text: inputText
      })
    } catch (error) {
      alert('Ошибка генерации персонажа: ' + error.message)
    }
  }, [executeAI, inputText])

  const handleGeneratePlot = useCallback(async () => {
    const description = prompt('Описание ситуации или текущая точка сюжета:')
    if (!description) return

    const direction = prompt('Направление (развить, усложнить, разрешить):') || 'развить'

    try {
      await executeAI('generatePlot', {
        description,
        direction,
        text: inputText
      })
    } catch (error) {
      alert('Ошибка генерации сюжета: ' + error.message)
    }
  }, [executeAI, inputText])

  const handleGenerateDialogue = useCallback(async () => {
    const characters = prompt('Персонажи (через запятую):')
    if (!characters) return

    const context = prompt('Контекст или ситуация диалога:')
    if (!context) return

    const tone = prompt('Тон диалога (дружеский, напряженный, романтичный и т.д.):') || 'нейтральный'

    try {
      await executeAI('generateDialogue', {
        characters: characters.split(',').map(c => c.trim()),
        context,
        tone,
        text: inputText
      })
    } catch (error) {
      alert('Ошибка генерации диалога: ' + error.message)
    }
  }, [executeAI, inputText])

  const handleImproveWriting = useCallback(async () => {
    const text = prompt('Текст для улучшения:')
    if (!text) return

    const focus = prompt('Фокус улучшения (грамматика, стиль, ясность, структура):') || 'общее'

    try {
      await executeAI('improveWriting', {
        text,
        focus
      })
    } catch (error) {
      alert('Ошибка улучшения текста: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateDescription = useCallback(async () => {
    const subject = prompt('Объект или сцена для описания:')
    if (!subject) return

    const style = prompt('Стиль (реалистичный, атмосферный, метафорический):') || 'атмосферный'

    try {
      await executeAI('generateDescription', {
        subject,
        style
      })
    } catch (error) {
      alert('Ошибка генерации описания: ' + error.message)
    }
  }, [executeAI])

  const handleAnalyzeText = useCallback(async () => {
    const text = prompt('Текст для анализа:')
    if (!text) return

    const focus = prompt('Фокус анализа (сюжет, персонажи, стиль, структура):') || 'общий'

    try {
      await executeAI('analyzeText', {
        text,
        focus
      })
    } catch (error) {
      alert('Ошибка анализа текста: ' + error.message)
    }
  }, [executeAI])

  const handleBrainstorm = useCallback(async () => {
    const topic = prompt('Тема для мозгового штурма:')
    if (!topic) return

    const count = prompt('Количество идей (по умолчанию 10):') || '10'

    try {
      await executeAI('brainstorm', {
        topic,
        count: parseInt(count)
      })
    } catch (error) {
      alert('Ошибка мозгового штурма: ' + error.message)
    }
  }, [executeAI])

  const handleEditStyleText = useCallback(async () => {
    const text = prompt('Текст для редактирования стиля:')
    if (!text) return

    const style = prompt('Желаемый стиль:')
    if (!style) return

    try {
      await executeAI('editStyleText', {
        text,
        style
      })
    } catch (error) {
      alert('Ошибка редактирования стиля текста: ' + error.message)
    }
  }, [executeAI])

  const handleProcessLargeText = useCallback(async () => {
    const text = prompt('Большой текст для обработки:')
    if (!text) return

    const operation = prompt('Операция (summary, analysis, rewrite):')
    if (!operation) return

    try {
      await executeAI('processLargeText', {
        text,
        operation
      })
    } catch (error) {
      alert('Ошибка обработки большого текста: ' + error.message)
    }
  }, [executeAI])

  return {
    handleGenerateIdeas,
    handleExpandText,
    handleEditStyle,
    handleGenerateCharacter,
    handleGeneratePlot,
    handleGenerateDialogue,
    handleImproveWriting,
    handleGenerateDescription,
    handleAnalyzeText,
    handleBrainstorm,
    handleEditStyleText,
    handleProcessLargeText,
    textInputResult,
    setInputText
  }
}
