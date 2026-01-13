import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Brain, Code, BookOpen } from 'lucide-react'
import AnalysisTools from './AnalysisTools'
import { aiAPI } from '../api/ai'
import useAppStore from '../stores/appStore'

export default function ToolsPage() {
  const navigate = useNavigate()

  const {
    activeToolScreen,
    setActiveToolScreen,
    selectedTool,
    setSelectedTool,
    analysisResults,
    setAnalysisResults,
    isAnalyzing,
    setIsAnalyzing
  } = useAppStore()

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const extractContent = (payload) => {
    if (!payload) return ''
    if (typeof payload === 'string') return payload
    if (typeof payload.content === 'string') return payload.content
    if (typeof payload.output === 'string') return payload.output
    if (typeof payload.response === 'string') return payload.response
    if (payload.data && typeof payload.data === 'string') return payload.data
    return JSON.stringify(payload, null, 2)
  }

  const appendResult = (tool, payload) => {
    const next = [...(analysisResults || []), {
      tool,
      timestamp: new Date().toISOString(),
      content: extractContent(payload),
      metadata: payload?.usage || payload?.metadata || null,
      raw: payload
    }]
    setAnalysisResults(next.slice(-50))
  }

  const runTool = async (toolId) => {
    switch (toolId) {
      case 'generateIdeas': {
        const topic = prompt('Тема/область исследования:')
        if (!topic) return null
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.brainstorm({ topic, context })
      }
      case 'structureIdeas': {
        const researchGoal = prompt('Цель исследования:')
        if (!researchGoal) return null
        const sources = prompt('Материалы/заметки (вставьте текст):')
        if (!sources) return null
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.structureIdeas({ researchGoal, sources, context })
      }
      case 'extractReferences': {
        const fileName = prompt('Имя документа (например, paper.txt):') || 'document.txt'
        const fileContent = prompt('Вставьте текст документа:')
        if (!fileContent) return null
        return await aiAPI.extractReferences({ fileName, fileContent })
      }
      case 'generateHypothesis': {
        const researchArea = prompt('Область исследования:')
        if (!researchArea) return null
        const researchQuestion = prompt('Исследовательский вопрос:')
        if (!researchQuestion) return null
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.generateHypothesis({ researchArea, researchQuestion, context })
      }
      case 'narrativeReview': {
        const topic = prompt('Тема обзора литературы:')
        if (!topic) return null
        const context = prompt('Ключевые источники/контекст (опционально):') || ''
        return await aiAPI.literatureReview({ topic, reviewType: 'narrative', context })
      }
      case 'systematicReview': {
        const topic = prompt('Тема систематического обзора:')
        if (!topic) return null
        const context = prompt('Критерии/контекст (опционально):') || ''
        return await aiAPI.literatureReview({ topic, reviewType: 'systematic', context })
      }
      case 'metaAnalysis': {
        const topic = prompt('Тема мета-анализа:')
        if (!topic) return null
        const context = prompt('Контекст/набор исследований (опционально):') || ''
        return await aiAPI.literatureReview({ topic, reviewType: 'meta-analysis', context })
      }
      case 'analyzeResults': {
        const researchQuestion = prompt('Исследовательский вопрос:')
        if (!researchQuestion) return null
        const results = prompt('Результаты (описание, цифры, наблюдения):')
        if (!results) return null
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.analyzeResults({ researchQuestion, results, context })
      }
      case 'generateDiscussion': {
        const results = prompt('Результаты (описание):')
        if (!results) return null
        const limitations = prompt('Ограничения (опционально):') || ''
        const implications = prompt('Импликации (опционально):') || ''
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.generateDiscussion({ results, limitations, implications, context })
      }
      case 'generateConclusion': {
        const results = prompt('Результаты (описание):')
        if (!results) return null
        const implications = prompt('Импликации (опционально):') || ''
        return await aiAPI.generateConclusion({ results, implications })
      }
      case 'improveStyle': {
        const text = prompt('Текст для улучшения:')
        if (!text) return null
        const targetAudience = prompt('Аудитория (academic, student, general):') || 'academic'
        return await aiAPI.improveAcademicStyle({ text, targetAudience })
      }
      case 'editStyleText': {
        const text = prompt('Текст для редактирования:')
        if (!text) return null
        const targetStyle = prompt('Стиль (academic, formal, casual, creative):') || 'academic'
        return await aiAPI.styleEditing({ text, targetStyle })
      }
      case 'processLargeText': {
        const text = prompt('Текст для обработки:')
        if (!text) return null
        const task = prompt('Задача (edit, improve, summarize, analyze):')
        if (!task) return null
        return await aiAPI.processLargeText({ text, task })
      }
      case 'generateCode': {
        const promptText = prompt('Задача/описание:')
        if (!promptText) return null
        const language = prompt('Язык (например, JavaScript):')
        if (!language) return null
        return await aiAPI.coding.generateCode({ prompt: promptText, language })
      }
      case 'reviewCode': {
        const code = prompt('Код для ревью:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.reviewCode({ code, language })
      }
      case 'debugCode': {
        const code = prompt('Код с ошибкой:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        const error = prompt('Текст ошибки:')
        if (!error) return null
        return await aiAPI.coding.debugCode({ code, language, error })
      }
      case 'optimizeCode': {
        const code = prompt('Код для оптимизации:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.optimizeCode({ code, language })
      }
      case 'explainCode': {
        const code = prompt('Код для объяснения:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.explainCode({ code, language })
      }
      case 'refactorCode': {
        const code = prompt('Код для рефакторинга:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.refactorCode({ code, language })
      }
      case 'generateTests': {
        const code = prompt('Код для генерации тестов:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.generateTests({ code, language })
      }
      case 'generateDocumentation': {
        const code = prompt('Код для документации:')
        if (!code) return null
        const language = prompt('Язык:')
        if (!language) return null
        return await aiAPI.coding.generateDocumentation({ code, language })
      }
      case 'multiAgentExecute': {
        const description = prompt('Задача для мультиагента:')
        if (!description) return null
        const agentsRaw = prompt('Агенты (через запятую):') || 'researcher,critic,synthesizer'
        const agents = agentsRaw.split(',').map(a => a.trim()).filter(Boolean)
        const task = { type: 'custom', description, data: {} }
        return await aiAPI.multiAgent.execute({ task, agents })
      }
      case 'multiAgentPipelines': {
        return await aiAPI.multiAgent.getPipelines()
      }
      case 'multiAgentStructureIdeas': {
        const researchGoal = prompt('Цель исследования:')
        if (!researchGoal) return null
        const sources = prompt('Источники/заметки (вставьте текст):')
        if (!sources) return null
        const context = prompt('Контекст (опционально):') || ''
        return await aiAPI.multiAgent.structureIdeas({ researchGoal, sources, context })
      }
      case 'multiAgentMetaAnalysis': {
        const studiesRaw = prompt('Исследования (вставьте через "---"):')
        if (!studiesRaw) return null
        const studies = studiesRaw.split('---').map(s => s.trim()).filter(Boolean)
        const effectMeasuresRaw = prompt('Меры эффекта (через запятую, опционально):') || ''
        const effectMeasures = effectMeasuresRaw ? effectMeasuresRaw.split(',').map(s => s.trim()).filter(Boolean) : []
        return await aiAPI.multiAgent.metaAnalysis({ studies, effectMeasures })
      }
      default:
        throw new Error(`Unknown tool: ${toolId}`)
    }
  }

  const handleAnalyze = async (toolId) => {
    if (!toolId || isAnalyzing) return
    try {
      setIsAnalyzing(true)
      const payload = await runTool(toolId)
      if (!payload) return
      appendResult(toolId, payload)
    } catch (error) {
      appendResult(toolId, { content: error?.error || error?.message || 'Ошибка выполнения инструмента' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToDashboard}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">AI Tools</h1>
          </div>
        </div>

        {activeToolScreen ? (
          <AnalysisTools
            activeToolScreen={activeToolScreen}
            setActiveToolScreen={setActiveToolScreen}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            handleAnalyze={handleAnalyze}
          />
        ) : (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-xl p-10">
            <div className="max-w-2xl">
              <h2 className="text-white text-2xl font-bold">Выберите категорию в навигации</h2>
              <p className="text-slate-300 mt-2">Откройте «Инструменты анализа» или «Инструменты» сверху, затем выберите нужный экран.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
