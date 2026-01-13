import { useCallback } from 'react'
import { aiAPI } from '../api/ai'
import useAppStore from '../stores/appStore'

export const useResearchAI = () => {
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

  const handleGenerateHypothesis = useCallback(async () => {
    const topic = prompt('Тема исследования:')
    if (!topic) return

    const variables = prompt('Переменные (через запятую):')
    if (!variables) return

    try {
      await executeAI('generateHypothesis', {
        topic,
        variables: variables.split(',').map(v => v.trim())
      })
    } catch (error) {
      alert('Ошибка генерации гипотезы: ' + error.message)
    }
  }, [executeAI])

  const handleStructureIdeas = useCallback(async () => {
    const topic = prompt('Тема исследования:')
    if (!topic) return

    const section = prompt('Раздел (Introduction, Methods, Results, Discussion):')
    if (!section) return

    try {
      await executeAI('structureIdeas', {
        topic,
        section
      })
    } catch (error) {
      alert('Ошибка структурирования идей: ' + error.message)
    }
  }, [executeAI])

  const handleStructureMethodology = useCallback(async () => {
    const topic = prompt('Тема исследования:')
    if (!topic) return

    const methodType = prompt('Тип методологии (quantitative, qualitative, mixed):')
    if (!methodType) return

    try {
      await executeAI('structureMethodology', {
        topic,
        methodType
      })
    } catch (error) {
      alert('Ошибка структурирования методологии: ' + error.message)
    }
  }, [executeAI])

  const handleLiteratureReview = useCallback(async () => {
    const topic = prompt('Тема обзора литературы:')
    if (!topic) return

    const papers = prompt('Основные работы (через запятую):') || ''

    try {
      await executeAI('literatureReview', {
        topic,
        papers: papers ? papers.split(',').map(p => p.trim()) : []
      })
    } catch (error) {
      alert('Ошибка обзора литературы: ' + error.message)
    }
  }, [executeAI])

  const handleStatisticalAnalysis = useCallback(async () => {
    const description = prompt('Описание данных и вопроса исследования:')
    if (!description) return

    const testType = prompt('Тип теста (t-test, ANOVA, regression, correlation):') || 'auto'

    try {
      await executeAI('statisticalAnalysis', {
        description,
        testType
      })
    } catch (error) {
      alert('Ошибка статистического анализа: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateNarrativeReview = useCallback(async () => {
    const topic = prompt('Тема нарративного обзора:')
    if (!topic) return

    const keywords = prompt('Ключевые слова (через запятую):') || ''

    try {
      await executeAI('generateNarrativeReview', {
        topic,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
      })
    } catch (error) {
      alert('Ошибка генерации нарративного обзора: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateSystematicReview = useCallback(async () => {
    const topic = prompt('Тема систематического обзора:')
    if (!topic) return

    const inclusionCriteria = prompt('Критерии включения:')
    if (!inclusionCriteria) return

    const exclusionCriteria = prompt('Критерии исключения:') || ''

    try {
      await executeAI('generateSystematicReview', {
        topic,
        inclusionCriteria,
        exclusionCriteria
      })
    } catch (error) {
      alert('Ошибка генерации систематического обзора: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateMetaAnalysis = useCallback(async () => {
    const topic = prompt('Тема мета-анализа:')
    if (!topic) return

    const effectSize = prompt('Тип эффекта (Cohen d, OR, RR):') || 'Cohen d'

    try {
      await executeAI('generateMetaAnalysis', {
        topic,
        effectSize
      })
    } catch (error) {
      alert('Ошибка генерации мета-анализа: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateResearchDesign = useCallback(async () => {
    const topic = prompt('Тема исследования:')
    if (!topic) return

    const designType = prompt('Тип дизайна (experimental, quasi-experimental, observational):')
    if (!designType) return

    try {
      await executeAI('generateResearchDesign', {
        topic,
        designType
      })
    } catch (error) {
      alert('Ошибка генерации исследовательского дизайна: ' + error.message)
    }
  }, [executeAI])

  const handleAnalyzeResults = useCallback(async () => {
    const results = prompt('Описание результатов:')
    if (!results) return

    const context = prompt('Контекст исследования:') || ''

    try {
      await executeAI('analyzeResults', {
        results,
        context
      })
    } catch (error) {
      alert('Ошибка анализа результатов: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateDiscussion = useCallback(async () => {
    const results = prompt('Описание результатов:')
    if (!results) return

    const literature = prompt('Связанная литература:') || ''

    try {
      await executeAI('generateDiscussion', {
        results,
        literature
      })
    } catch (error) {
      alert('Ошибка генерации обсуждения: ' + error.message)
    }
  }, [executeAI])

  const handleGenerateConclusion = useCallback(async () => {
    const results = prompt('Описание результатов:')
    if (!results) return

    const implications = prompt('Влияние (implications):') || ''

    try {
      await executeAI('generateConclusion', {
        results,
        implications
      })
    } catch (error) {
      alert('Ошибка генерации заключения: ' + error.message)
    }
  }, [executeAI])

  const handleImproveAcademicStyle = useCallback(async () => {
    const text = prompt('Текст для улучшения:')
    if (!text) return

    const style = prompt('Стиль (formal, concise, persuasive):') || 'formal'

    try {
      await executeAI('improveAcademicStyle', {
        text,
        style
      })
    } catch (error) {
      alert('Ошибка улучшения академического стиля: ' + error.message)
    }
  }, [executeAI])

  return {
    handleGenerateHypothesis,
    handleStructureIdeas,
    handleStructureMethodology,
    handleLiteratureReview,
    handleStatisticalAnalysis,
    handleGenerateNarrativeReview,
    handleGenerateSystematicReview,
    handleGenerateMetaAnalysis,
    handleGenerateResearchDesign,
    handleAnalyzeResults,
    handleGenerateDiscussion,
    handleGenerateConclusion,
    handleImproveAcademicStyle,
    textInputResult
  }
}
