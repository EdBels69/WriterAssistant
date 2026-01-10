import React, { useState, useEffect, useCallback } from 'react'
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  BarChart3, 
  Activity,
  BookOpen,
  Sparkles,
  Target,
  MessageSquare,
  Plus,
  Clock,
  Edit,
  Edit3,
  Trash2,
  Merge,
  Upload,
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Play,
  Pause
} from 'lucide-react'
import { projectsAPI } from './api/projects'
import { chatAPI } from './api/chat'
import { statisticsAPI } from './api/statistics'
import { aiAPI } from './api/ai'
import { exportAPI, downloadFile } from './api/export'
import { commentsAPI } from './api/comments'
import { uploadAPI } from './api/upload'
import { documentsAPI } from './api/documents'
import useWebSocket from './hooks/useWebSocket'
import AnalysisResultsSection from './components/AnalysisResultsSection'
import EntryPoints from './components/EntryPoints'
import PipelineVisualizer from './components/PipelineVisualizer'
import MultiAgentFlow from './components/MultiAgentFlow'
import TemplateSelector from './components/TemplateSelector'
import usePipelineStore from './stores/pipelineStore'
import useContextStore from './stores/contextStore'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeToolScreen, setActiveToolScreen] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Добро пожаловать в ScientificWriter AI — ваш интеллектуальный помощник для научных исследований. Я специализируюсь на:\n\n• Генерации и проверке исследовательских гипотез\n• Систематическом обзоре литературы\n• Структурировании методологии\n• Статистическом анализе и интерпретации результатов\n• Редактировании научных текстов до академических стандартов\n\nКакой аспект вашего исследования мы можем оптимизировать сегодня?' }
  ])
  const [currentInput, setCurrentInput] = useState('')
  const [chatMode, setChatMode] = useState('creative')
  const [sessionId, setSessionId] = useState(null)

  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [inputMode, setInputMode] = useState('file')
  const [inputText, setInputText] = useState('')
  const [documentType, setDocumentType] = useState('scientific')
  const [selectedTool, setSelectedTool] = useState(null)
  const [textInputResult, setTextInputResult] = useState(null)
  const [projectAnalysisResults, setProjectAnalysisResults] = useState([])
  const [projectActiveTab, setProjectActiveTab] = useState('overview')
  const [chapters, setChapters] = useState([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedPipelineTemplate, setSelectedPipelineTemplate] = useState(null)
  const [showPipelineVisualization, setShowPipelineVisualization] = useState(false)
  const [activePipelineId, setActivePipelineId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(() => ({
    primaryModel: 'glm-4.7',
    thinkingMode: 'interleaved',
    fallbackModel: 'deepseek-r1',
    textEditingModel: 'qwen',
    useCodingAPI: true,
    openRouterKey: ''
  }))

  const userId = localStorage.getItem('userId') || 'demo-user'
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'chat_message' && data.data.sessionId === sessionId) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.data.content }
      ])
    }
  }, [sessionId])

  const { isConnected, send } = useWebSocket(userId, handleWebSocketMessage)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      handleLoadComments(selectedProject.id)
      setProjectAnalysisResults([])
      setProjectActiveTab('overview')
    }
  }, [selectedProject])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [statsData, projectsData] = await Promise.all([
        statisticsAPI.getOverview(userId),
        projectsAPI.getAll()
      ])
      setStats(statsData)
      setProjects(projectsData)
    } catch (err) {
      setError('Ошибка загрузки данных. Убедитесь, что backend сервер запущен.')
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim()) return

    const userMessage = currentInput
    setChatMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage }
    ])
    setCurrentInput('')

    try {
      const response = await chatAPI.sendMessage({
        userId,
        projectId: null,
        sessionId,
        message: userMessage,
        mode: chatMode
      })

      setSessionId(response.sessionId)

      if (isConnected) {
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.response }
        ])
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте позже.' }
      ])
    }
  }

  const handleCreateProject = async () => {
    setShowTemplateSelector(true)
  }

  const handleTemplateSelect = async (pipeline) => {
    setShowTemplateSelector(false)
    if (!pipeline) return

    const name = prompt('Введите название проекта:')
    if (!name) return

    try {
      await projectsAPI.create({
        userId,
        name,
        genre: 'general',
        description: '',
        targetWords: 50000,
        pipelineType: pipeline.type
      })
      setSelectedPipelineTemplate(pipeline)
      loadInitialData()
    } catch (err) {
      console.error('Error creating project:', err)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Удалить этот проект?')) return

    try {
      await projectsAPI.delete(projectId)
      loadInitialData()
    } catch (err) {
      console.error('Error deleting project:', err)
    }
  }

  const handleCreateChapter = async () => {
    const title = prompt('Введите название раздела:')
    if (!title) return

    const description = prompt('Введите описание раздела (опционально):') || ''

    try {
      const newChapter = {
        id: Date.now(),
        projectId: selectedProject?.id,
        title,
        description,
        order: chapters.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setChapters([...chapters, newChapter])
      await projectsAPI.update(selectedProject.id, {
        chapters: chapters.length + 1
      })
      await loadInitialData()
    } catch (err) {
      console.error('Error creating chapter:', err)
      alert('Ошибка создания раздела')
    }
  }

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('Удалить этот раздел?')) return

    try {
      setChapters(chapters.filter(ch => ch.id !== chapterId))
      await projectsAPI.update(selectedProject.id, {
        chapters: chapters.length - 1
      })
      await loadInitialData()
    } catch (err) {
      console.error('Error deleting chapter:', err)
      alert('Ошибка удаления раздела')
    }
  }

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    localStorage.setItem('swSettings', JSON.stringify({ ...settings, [key]: value }))
  }

  const handleSaveSettings = () => {
    localStorage.setItem('swSettings', JSON.stringify(settings))
    setShowSettings(false)
  }

  const handleGenerateIdeas = async () => {
    const genre = prompt('Введите жанр (например, фантастика, детектив, роман):')
    if (!genre) return

    const theme = prompt('Введите тему:')
    if (!theme) return

    try {
      const result = await aiAPI.generateIdeas({ genre, theme, count: 5 })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating ideas:', err)
      alert('Ошибка генерации идей')
    }
  }

  const handleExpandText = async () => {
    const text = prompt('Введите текст для расширения:')
    if (!text) return

    try {
      const result = await aiAPI.expandText({ text })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error expanding text:', err)
      alert('Ошибка расширения текста')
    }
  }

  const handleEditStyle = async () => {
    const text = prompt('Введите текст для изменения стиля:')
    if (!text) return

    const targetStyle = prompt('Введите желаемый стиль (например, формальный, разговорный, поэтический):')
    if (!targetStyle) return

    try {
      const result = await aiAPI.styleEditing({ 
        text, 
        targetStyle,
        provider: settings.textEditingModel,
        openRouterKey: settings.openRouterKey
      })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error editing style:', err)
      alert('Ошибка изменения стиля')
    }
  }

  const handleGenerateCharacter = async () => {
    const name = prompt('Введите имя персонажа:')
    if (!name) return

    const role = prompt('Введите роль персонажа (например, главный герой, антагонист, второстепенный персонаж):')
    if (!role) return

    const genre = prompt('Введите жанр:')
    if (!genre) return

    try {
      const result = await aiAPI.generateCharacter({ name, role, genre })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating character:', err)
      alert('Ошибка генерации персонажа')
    }
  }

  const handleGeneratePlot = async () => {
    const storyIdea = prompt('Введите идею истории:')
    if (!storyIdea) return

    const chapters = prompt('Введите количество глав (по умолчанию 10):') || '10'

    try {
      const result = await aiAPI.generatePlotOutline({ storyIdea, chapters: parseInt(chapters) })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating plot:', err)
      alert('Ошибка генерации сюжета')
    }
  }

  const handleGenerateDialogue = async () => {
    const character1 = prompt('Введите имя первого персонажа:')
    if (!character1) return

    const character2 = prompt('Введите имя второго персонажа:')
    if (!character2) return

    const situation = prompt('Опишите ситуацию:')
    if (!situation) return

    const tone = prompt('Укажите тон диалога (например, напряженный, дружеский, романтичный):') || 'нейтральный'

    try {
      const result = await aiAPI.generateDialogue({ character1, character2, situation, tone })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating dialogue:', err)
      alert('Ошибка генерации диалога')
    }
  }

  const handleImproveWriting = async () => {
    const text = prompt('Введите текст для улучшения:')
    if (!text) return

    const focusArea = prompt('Укажите область улучшения (grammar, flow, vocabulary, clarity, pacing):') || 'general'

    try {
      const result = await aiAPI.improveWriting({ text, focusArea })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error improving writing:', err)
      alert('Ошибка улучшения текста')
    }
  }

  const handleGenerateDescription = async () => {
    const scene = prompt('Опишите сцену:')
    if (!scene) return

    const type = prompt('Укажите тип описания (visual, auditory, emotional):') || 'visual'

    try {
      const result = await aiAPI.generateDescription({ scene, type })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating description:', err)
      alert('Ошибка генерации описания')
    }
  }

  const handleAnalyzeText = async () => {
    const text = prompt('Введите текст для анализа:')
    if (!text) return

    const analysisType = prompt('Укажите тип анализа (general, plot, characters, style, pacing):') || 'general'

    try {
      const result = await aiAPI.analyzeText({ text, analysisType })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error analyzing text:', err)
      alert('Ошибка анализа текста')
    }
  }

  const handleBrainstorm = async () => {
    const topic = prompt('Введите тему для мозгового штурма:')
    if (!topic) return

    const category = prompt('Укажите категорию (ideas, characters, plots, scenes):') || 'ideas'

    try {
      const result = await aiAPI.brainstorm({ topic, category })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error brainstorming:', err)
      alert('Ошибка мозгового штурма')
    }
  }

  const handleGenerateHypothesis = async () => {
    let researchArea = ''
    let researchQuestion = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      researchArea = prompt('Введите область исследования (используется текст из поля ввода):') || 'На основе загруженного текста'
      researchQuestion = prompt('Сформулируйте исследовательский вопрос:')
      if (!researchQuestion) return
    } else {
      researchArea = prompt('Введите область исследования:')
      if (!researchArea) return
      researchQuestion = prompt('Сформулируйте исследовательский вопрос:')
      if (!researchQuestion) return
    }

    try {
      const result = await aiAPI.multiAgent.hypothesis({
        researchArea,
        researchQuestion,
        context: inputMode === 'text' ? inputText : undefined
      })

      if (result.success) {
        const finalContent = result.finalResult?.result?.content || result.content || 'Нет доступного результата'
        const pipelineSummary = result.pipelineResults?.map(p => 
          `${p.stage}: ${p.result.bestResult?.result?.content?.substring(0, 100) || 'Нет данных'}...`
        ).join('\n') || ''

        const analysisResult = {
          tool: 'multiAgentHypothesis',
          content: `=== Многоагентный конвейер (Sakana-style) ===\n\n${finalContent}\n\n--- Процесс анализа ---\n${pipelineSummary}`,
          timestamp: new Date().toISOString(),
          metadata: { 
            researchArea, 
            researchQuestion,
            iterations: result.totalIterations,
            agentsUsed: result.pipelineResults?.flatMap(p => p.result.bestResult?.result?.agent) || []
          }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'))
      }
    } catch (err) {
      console.error('Error generating hypothesis with multiagent:', err)
      alert('Ошибка генерации гипотез с многоагентным конвейером')
    }
  }

  const handleStructureIdeas = async () => {
    let sources = inputText
    let researchGoal = ''

    if (inputMode === 'text') {
      if (!sources) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      researchGoal = prompt('Укажите цель исследования (опционально):') || 'Структурирование идей'
    } else {
      sources = prompt('Вставьте тексты или описания источников:')
      if (!sources) return
      researchGoal = prompt('Укажите цель исследования:')
      if (!researchGoal) return
    }

    try {
      const result = await aiAPI.structureIdeas({ sources, researchGoal })
      if (result.success) {
        const analysisResult = {
          tool: 'structureIdeas',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { sources, researchGoal }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error structuring ideas:', err)
      alert('Ошибка структурирования идей')
    }
  }

  const handleStructureMethodology = async () => {
    let researchDesign = ''
    let variables = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      researchDesign = prompt('Опишите дизайн исследования (используется текст из поля ввода):') || 'На основе загруженного текста'
      variables = prompt('Укажите переменные (независимые, зависимые, контрольные):')
      if (!variables) return
    } else {
      researchDesign = prompt('Опишите дизайн исследования:')
      if (!researchDesign) return
      variables = prompt('Укажите переменные (независимые, зависимые, контрольные):')
      if (!variables) return
    }

    try {
      const result = await aiAPI.structureMethodology({ researchDesign, variables, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'structureMethodology',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { researchDesign, variables }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error structuring methodology:', err)
      alert('Ошибка структурирования методологии')
    }
  }

  const handleLiteratureReview = async () => {
    let topic = ''
    const reviewType = prompt('Тип обзора (narrative, systematic, meta-analysis):') || 'narrative'

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      topic = prompt('Введите тему обзора литературы (используется текст из поля ввода):') || 'На основе загруженного текста'
    } else {
      topic = prompt('Введите тему обзора литературы:')
      if (!topic) return
    }

    try {
      const result = await aiAPI.literatureReview({ topic, reviewType, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: reviewType === 'narrative' ? 'narrativeReview' : reviewType === 'systematic' ? 'systematicReview' : 'metaAnalysis',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { topic, reviewType }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating literature review:', err)
      alert('Ошибка генерации обзора литературы')
    }
  }

  const handleStatisticalAnalysis = async () => {
    let dataDescription = ''
    let analysisGoal = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      dataDescription = prompt('Опишите данные (используется текст из поля ввода):') || 'На основе загруженного текста'
      analysisGoal = prompt('Цель анализа (описательная, сравнительная, корреляционная, регрессионная):')
      if (!analysisGoal) return
    } else {
      dataDescription = prompt('Опишите данные (тип, объем, переменные):')
      if (!dataDescription) return
      analysisGoal = prompt('Цель анализа (описательная, сравнительная, корреляционная, регрессионная):')
      if (!analysisGoal) return
    }

    try {
      const result = await aiAPI.statisticalAnalysis({ dataDescription, analysisGoal, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'analyzeResults',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { dataDescription, analysisGoal }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating statistical analysis:', err)
      alert('Ошибка статистического анализа')
    }
  }

  const handleGenerateNarrativeReview = async () => {
    let topic = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      topic = prompt('Введите тему обзора (используется текст из поля ввода):') || 'На основе загруженного текста'
    } else {
      topic = prompt('Введите тему обзора:')
      if (!topic) return
    }

    try {
      const result = await aiAPI.literatureReview({ topic, reviewType: 'narrative', text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'narrativeReview',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { topic, reviewType: 'narrative' }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating narrative review:', err)
      alert('Ошибка генерации нарративного обзора')
    }
  }

  const handleGenerateSystematicReview = async () => {
    let topic = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      topic = prompt('Введите тему систематического обзора (используется текст из поля ввода):') || 'На основе загруженного текста'
    } else {
      topic = prompt('Введите тему систематического обзора:')
      if (!topic) return
    }

    try {
      const result = await aiAPI.literatureReview({ topic, reviewType: 'systematic', text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'systematicReview',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { topic, reviewType: 'systematic' }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating systematic review:', err)
      alert('Ошибка генерации систематического обзора')
    }
  }

  const handleGenerateMetaAnalysis = async () => {
    let topic = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      topic = prompt('Введите тему для мета-анализа (используется текст из поля ввода):') || 'На основе загруженного текста'
    } else {
      topic = prompt('Введите тему для мета-анализа:')
      if (!topic) return
    }

    try {
      const result = await aiAPI.literatureReview({ topic, reviewType: 'meta-analysis', text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'metaAnalysis',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { topic, reviewType: 'meta-analysis' }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating meta-analysis:', err)
      alert('Ошибка генерации мета-анализа')
    }
  }

  const handleGenerateResearchDesign = async () => {
    let researchQuestion = ''
    let researchType = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      researchQuestion = prompt('Сформулируйте исследовательский вопрос (используется текст из поля ввода):') || 'На основе загруженного текста'
      researchType = prompt('Тип исследования (экспериментальное, корреляционное, качественное, смешанное):')
      if (!researchType) return
    } else {
      researchQuestion = prompt('Сформулируйте исследовательский вопрос:')
      if (!researchQuestion) return
      researchType = prompt('Тип исследования (экспериментальное, корреляционное, качественное, смешанное):')
      if (!researchType) return
    }

    try {
      const result = await aiAPI.generateResearchDesign({ researchQuestion, researchType, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating research design:', err)
      alert('Ошибка генерации дизайна исследования')
    }
  }

  const handleAnalyzeResults = async () => {
    let results = ''
    let context = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      results = prompt('Введите результаты исследования (используется текст из поля ввода):') || 'На основе загруженного текста'
      context = prompt('Контекст исследования (гипотезы, методы):') || ''
    } else {
      results = prompt('Введите результаты исследования:')
      if (!results) return
      context = prompt('Контекст исследования (гипотезы, методы):') || ''
    }

    try {
      const result = await aiAPI.analyzeResults({ results, context, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        const analysisResult = {
          tool: 'analyzeResults',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { results, context }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error analyzing results:', err)
      alert('Ошибка анализа результатов')
    }
  }

  const handleGenerateDiscussion = async () => {
    let results = ''
    let context = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      results = prompt('Введите результаты исследования (используется текст из поля ввода):') || 'На основе загруженного текста'
      context = prompt('Контекст (гипотезы, методы, предыдущие исследования):') || ''
    } else {
      results = prompt('Введите результаты исследования:')
      if (!results) return
      context = prompt('Контекст (гипотезы, методы, предыдущие исследования):') || ''
    }

    try {
      const result = await aiAPI.generateDiscussion({ results, context, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating discussion:', err)
      alert('Ошибка генерации обсуждения')
    }
  }

  const handleGenerateConclusion = async () => {
    let results = ''
    let discussion = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      results = prompt('Введите результаты исследования (используется текст из поля ввода):') || 'На основе загруженного текста'
      discussion = prompt('Основные выводы из обсуждения:') || ''
    } else {
      results = prompt('Введите результаты исследования:')
      if (!results) return
      discussion = prompt('Основные выводы из обсуждения:') || ''
    }

    try {
      const result = await aiAPI.generateConclusion({ results, discussion, text: inputMode === 'text' ? inputText : undefined })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error generating conclusion:', err)
      alert('Ошибка генерации заключения')
    }
  }

  const handleImproveAcademicStyle = async () => {
    let text = ''
    let focusArea = ''

    if (inputMode === 'text') {
      if (!inputText) {
        alert('Пожалуйста, введите текст для обработки')
        return
      }
      text = inputText
      focusArea = prompt('Область улучшения (clarity, flow, vocabulary, conciseness, formal):') || 'clarity'
    } else {
      text = prompt('Введите текст для улучшения:')
      if (!text) return
      focusArea = prompt('Область улучшения (clarity, flow, vocabulary, conciseness, formal):') || 'clarity'
    }

    try {
      const result = await aiAPI.styleEditing({ 
        text, 
        targetStyle: focusArea,
        provider: settings.textEditingModel,
        openRouterKey: settings.openRouterKey
      })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error improving academic style:', err)
      alert('Ошибка улучшения академического стиля')
    }
  }

  const handleAnalyzeUpload = async () => {
    const fileName = prompt('Введите имя загруженного файла:')
    if (!fileName) return

    const analysisType = prompt('Тип анализа (comprehensive, summary, keyPoints, structure, methodology, references):') || 'comprehensive'

    const fileContent = prompt('Введите содержимое файла:')
    if (!fileContent) return

    try {
      const result = await aiAPI.analyzeUpload({ fileContent, fileName, analysisType })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error analyzing upload:', err)
      alert('Ошибка анализа файла')
    }
  }

  const handleEditUpload = async () => {
    const fileName = prompt('Введите имя загруженного файла:')
    if (!fileName) return

    const editType = prompt('Тип редактирования (academic, simplify, expand, correct, restructure, paraphrase):') || 'academic'

    const instructions = prompt('Дополнительные инструкции:') || ''

    const fileContent = prompt('Введите содержимое файла:')
    if (!fileContent) return

    try {
      const result = await aiAPI.editUpload({ fileContent, fileName, editType, instructions })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error editing upload:', err)
      alert('Ошибка редактирования файла')
    }
  }

  const handleExtractReferences = async () => {
    const fileName = prompt('Введите имя загруженного файла:')
    if (!fileName) return

    const fileContent = prompt('Введите содержимое файла:')
    if (!fileContent) return

    try {
      const result = await aiAPI.extractReferences({ fileContent, fileName })
      if (result.success) {
        const analysisResult = {
          tool: 'extractReferences',
          content: result.content,
          timestamp: new Date().toISOString(),
          metadata: { fileName }
        }
        
        if (inputMode === 'text') {
          setTextInputResult(analysisResult)
        } else {
          setProjectAnalysisResults(prev => [...prev, analysisResult])
        }
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error extracting references:', err)
      alert('Ошибка извлечения ссылок')
    }
  }

  const handleSynthesizeUploads = async () => {
    const researchGoal = prompt('Введите цель исследования:')
    if (!researchGoal) return

    const uploadedFilesJSON = prompt('Введите массив загруженных файлов в формате JSON:')
    if (!uploadedFilesJSON) return

    try {
      const uploadedFiles = JSON.parse(uploadedFilesJSON)
      const result = await aiAPI.synthesizeUploads({ uploadedFiles, researchGoal })
      if (result.success) {
        alert(result.content)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error synthesizing uploads:', err)
      alert('Ошибка синтеза файлов')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const result = await documentsAPI.uploadDocument(file, {
        userId,
        projectId: selectedProject?.id || null,
        documentType
      })

      if (result.success) {
        const documentWithMetadata = {
          id: result.documentId,
          ...result.metadata
        }
        setUploadedFiles(prev => [...prev, documentWithMetadata])
        alert(`Документ "${result.metadata.originalname}" успешно загружен!`)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error uploading document:', err)
      alert('Ошибка загрузки документа')
    }
  }

  const handleExportText = async (format) => {
    const text = prompt('Введите текст для экспорта:')
    if (!text) return

    const title = prompt('Введите название документа:') || 'WriterAssistant Document'

    try {
      const blob = await exportAPI.exportText(format, { text, title })
      const extension = format === 'pdf' ? '.pdf' : format === 'docx' ? '.docx' : '.txt'
      downloadFile(blob, `${title}${extension}`)
    } catch (err) {
      console.error('Error exporting text:', err)
      alert('Ошибка экспорта текста')
    }
  }

  const handleExportProject = async (project, format) => {
    if (!project) {
      alert('Выберите проект для экспорта')
      return
    }

    try {
      const blob = await exportAPI.exportProject(format, { project })
      const extension = format === 'pdf' ? '.pdf' : format === 'docx' ? '.docx' : '.txt'
      downloadFile(blob, `${project.name}${extension}`)
    } catch (err) {
      console.error('Error exporting project:', err)
      alert('Ошибка экспорта проекта')
    }
  }

  const handleLoadComments = async (projectId) => {
    try {
      const result = await commentsAPI.getCommentsByProject(projectId)
      if (result.success) {
        setComments(result.comments)
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleAddComment = async (content, projectId = selectedProject?.id) => {
    if (!projectId) {
      alert('Выберите проект для добавления комментария')
      return
    }

    if (!content || !content.trim()) {
      alert('Введите текст комментария')
      return
    }

    try {
      const result = await commentsAPI.createComment({
        projectId,
        userId,
        content: content.trim()
      })
      if (result.success) {
        await handleLoadComments(projectId)
      } else {
        alert('Ошибка: ' + result.error)
      }
    } catch (err) {
      console.error('Error adding comment:', err)
      alert('Ошибка добавления комментария')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
          <p className="text-gray-600 text-sm">Убедитесь, что backend сервер запущен на порту 5001</p>
        </div>
      </div>
    )
  }

  const defaultStats = [
    { label: 'Проекты', value: stats?.projectCount || 0, change: stats?.projectCount > 0 ? '+1' : '0', icon: LayoutDashboard },
    { label: 'Обработано', value: uploadedFiles.length, change: uploadedFiles.length > 0 ? `+${uploadedFiles.length}` : '0', icon: FileText },
    { label: 'Тип документа', value: documentType === 'scientific' ? 'Научный' : documentType === 'manual' ? 'Пособие' : 'ФГОС', change: '✓', icon: Activity },
    { label: 'Активный проект', value: selectedProject ? selectedProject.name : 'Не выбран', change: selectedProject ? '✓' : '-', icon: BarChart3 }
  ]

  const features = [
    {
      icon: BookOpen,
      title: 'Управление проектами',
      description: 'Создавайте и организуйте научные проекты с структурой статей и исследований',
      color: 'bg-blue-500'
    },
    {
      icon: Sparkles,
      title: 'ИИ-помощник',
      description: 'Генерация гипотез, обзор литературы, статистический анализ с помощью GLM-4.7',
      color: 'bg-purple-500'
    },
    {
      icon: Target,
      title: 'Цели и трекинг',
      description: 'Установите цели по словам/времени и отслеживайте прогресс в реальном времени',
      color: 'bg-green-500'
    },
    {
      icon: MessageSquare,
      title: 'Интерактивный чат',
      description: 'Общайтесь с ИИ-ассистентом для получения помощи на любом этапе исследования',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold">WriterAssistant</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600">
                  {isConnected ? 'Подключено' : 'Отключено'}
                </span>
              </div>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <MessageSquare size={18} />
                ИИ-помощник
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Настройки"
              >
                <Settings size={24} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {['dashboard', 'projects'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setActiveToolScreen(null)
                  setActiveDropdown(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'dashboard' && 'Обзор'}
                {tab === 'projects' && 'Проекты'}
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'analysis' ? null : 'analysis')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeDropdown === 'analysis' || activeToolScreen
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sparkles size={16} />
                Инструменты анализа
                <ChevronDown size={14} className={activeDropdown === 'analysis' ? 'rotate-180' : ''} />
              </button>

              {activeDropdown === 'analysis' && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 min-w-[200px] z-50">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setActiveToolScreen('data-analysis')
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Анализ данных
                    </button>
                    <button
                      onClick={() => {
                        setActiveToolScreen('literature-review')
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <BookOpen size={16} />
                      Обзор литературы
                    </button>
                    <button
                      onClick={() => {
                        setActiveToolScreen('statistical-analysis')
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <BarChart3 size={16} />
                      Статистический анализ
                    </button>
                    <button
                      onClick={() => {
                        setActiveToolScreen('style-formatting')
                        setActiveDropdown(null)
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      Стиль и форматирование
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="card-elevated p-8">
              <h2 className="section-header mb-6">Добро пожаловать в ScientificWriter AI</h2>
              
              <p className="text-academic-navy-700 mb-6">
                Интеллектуальный помощник для научных исследований. Используйте вкладку «Инструменты анализа» для доступа к всем функциям.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-academic-teal-50 rounded-xl border border-academic-teal-100">
                  <div className="p-3 rounded-lg bg-academic-teal-100 w-fit mb-4">
                    <FileText size={24} className="text-academic-teal-600" />
                  </div>
                  <h3 className="font-bold text-academic-navy-900 mb-2">Анализ данных</h3>
                  <p className="text-sm text-academic-navy-600">Структурирование идей, извлечение ссылок, генерация гипотез</p>
                </div>

                <div className="p-6 bg-academic-cyan-50 rounded-xl border border-academic-cyan-100">
                  <div className="p-3 rounded-lg bg-academic-cyan-100 w-fit mb-4">
                    <BookOpen size={24} className="text-academic-cyan-600" />
                  </div>
                  <h3 className="font-bold text-academic-navy-900 mb-2">Обзор литературы</h3>
                  <p className="text-sm text-academic-navy-600">Нарративный, систематический обзор, мета-анализ</p>
                </div>

                <div className="p-6 bg-academic-amber-50 rounded-xl border border-academic-amber-100">
                  <div className="p-3 rounded-lg bg-academic-amber-100 w-fit mb-4">
                    <BarChart3 size={24} className="text-academic-amber-600" />
                  </div>
                  <h3 className="font-bold text-academic-navy-900 mb-2">Статистический анализ</h3>
                  <p className="text-sm text-academic-navy-600">Интерпретация результатов, анализ данных</p>
                </div>

                <div className="p-6 bg-academic-slate-50 rounded-xl border border-academic-slate-100">
                  <div className="p-3 rounded-lg bg-academic-slate-100 w-fit mb-4">
                    <Edit3 size={24} className="text-academic-slate-600" />
                  </div>
                  <h3 className="font-bold text-academic-navy-900 mb-2">Стиль и форматирование</h3>
                  <p className="text-sm text-academic-navy-600">Академический стиль, редактирование текстов</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolScreen && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveToolScreen(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-academic-navy-900">
                {activeToolScreen === 'data-analysis' && 'Анализ данных'}
                {activeToolScreen === 'literature-review' && 'Обзор литературы'}
                {activeToolScreen === 'statistical-analysis' && 'Статистический анализ'}
                {activeToolScreen === 'style-formatting' && 'Стиль и форматирование'}
              </h1>
            </div>

            <div className="card-elevated p-8">
              {activeToolScreen === 'data-analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setSelectedTool('structureIdeas')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'structureIdeas' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-teal-100">
                        <Sparkles className="text-academic-teal-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Структурирование идей</h3>
                        <p className="text-sm text-academic-navy-600">Организовать идеи из источников</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setSelectedTool('extractReferences')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'extractReferences' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-rose-100">
                        <BookOpen className="text-academic-rose-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Извлечь ссылки</h3>
                        <p className="text-sm text-academic-navy-600">Извлечь библиографию</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setSelectedTool('generateHypothesis')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'generateHypothesis' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-navy-100">
                        <Activity className="text-academic-navy-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Генерация гипотез</h3>
                        <p className="text-sm text-academic-navy-600">Сформировать гипотезы исследования</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setSelectedTool('structureMethodology')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'structureMethodology' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-emerald-100">
                        <Edit className="text-academic-emerald-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Методология</h3>
                        <p className="text-sm text-academic-navy-600">Структурировать материалы и методы</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {activeToolScreen === 'literature-review' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setSelectedTool('narrativeReview')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'narrativeReview' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-cyan-100">
                        <BookOpen className="text-academic-cyan-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Нарративный обзор</h3>
                        <p className="text-sm text-academic-navy-600">Создать обзор литературы</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setSelectedTool('systematicReview')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'systematicReview' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-indigo-100">
                        <BarChart3 className="text-academic-indigo-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Систематический обзор</h3>
                        <p className="text-sm text-academic-navy-600">Структурированный анализ</p>
                      </div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setSelectedTool('metaAnalysis')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'metaAnalysis' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-amber-100">
                        <Target className="text-academic-amber-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Мета-анализ</h3>
                        <p className="text-sm text-academic-navy-600">Статистический синтез</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {activeToolScreen === 'statistical-analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setSelectedTool('analyzeResults')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'analyzeResults' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-amber-100">
                        <BarChart3 className="text-academic-amber-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Анализ результатов</h3>
                        <p className="text-sm text-academic-navy-600">Интерпретация статистики</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {activeToolScreen === 'style-formatting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setSelectedTool('improveStyle')}
                    className={`tool-card p-6 text-left transition-all ${
                      selectedTool === 'improveStyle' ? 'ring-2 ring-academic-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-academic-slate-100">
                        <Edit className="text-academic-slate-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-academic-navy-900 text-lg">Академический стиль</h3>
                        <p className="text-sm text-academic-navy-600">Улучшить научный стиль</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {selectedTool && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <EntryPoints 
                    inputMode={inputMode}
                    setInputMode={setInputMode}
                    inputText={inputText}
                    setInputText={setInputText}
                  />

                  {inputMode !== 'chat' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-academic-navy-700 mb-2">Тип документа</label>
                      <select 
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-academic-teal-500 focus:outline-none transition-colors"
                      >
                        <option value="scientific">Научная статья</option>
                        <option value="manual">Учебное пособие</option>
                        <option value="umc">Документ учебно-методического комплекса</option>
                        <option value="methodical">Методические указания</option>
                      </select>
                    </div>
                  )}

                  {inputMode === 'file' && (
                    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-academic-teal-400 transition-colors">
                      <label className="cursor-pointer block">
                        <input type="file" accept=".txt,.md,.json,.csv,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                        <div className="text-center">
                          <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Нажмите для загрузки или перетащите файл</p>
                          <p className="text-xs text-gray-400 mt-1">.txt, .md, .json, .csv, .pdf, .doc, .docx</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-academic-navy-700 mb-2">Загруженные файлы</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                doc.status === 'ready' 
                                  ? 'bg-academic-emerald-100' 
                                  : doc.status === 'processing'
                                  ? 'bg-academic-amber-100'
                                  : 'bg-red-100'
                              }`}>
                                <Check 
                                  className={`${
                                    doc.status === 'ready' 
                                      ? 'text-academic-emerald-600' 
                                      : doc.status === 'processing'
                                      ? 'text-academic-amber-600'
                                      : 'text-red-600'
                                  }`} 
                                  size={16} 
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold text-academic-navy-900 text-sm">{doc.originalname}</h4>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(doc.size)} • {doc.chunkCount} фрагментов • {doc.estimatedTokens} токенов
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-6 btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Activity size={18} className="animate-spin" />
                        Анализирую...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Запустить анализ
                      </>
                    )}
                  </button>
                </div>
              )}

              {textInputResult && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <AnalysisResultsSection 
                    analysisResults={[textInputResult]}
                    onClose={() => setTextInputResult(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            {!selectedProject ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Проекты</h2>
                  <button onClick={handleCreateProject} className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Новый проект
                  </button>
                </div>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>У вас пока нет проектов</p>
                      <button onClick={handleCreateProject} className="text-primary-600 hover:underline mt-2">
                        Создать первый проект
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projects.map((project) => (
                        <div 
                          key={project.id} 
                          onClick={() => setSelectedProject(project)}
                          className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-academic-teal-400 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-academic-teal-100 p-3 rounded-lg">
                              <BookOpen className="text-academic-teal-600" size={24} />
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleExportProject(project, 'pdf')
                                }}
                                className="p-2 text-gray-400 hover:text-academic-teal-600 hover:bg-academic-teal-50 rounded-lg transition-colors"
                              >
                                <FileText size={16} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg text-academic-navy-900 mb-2">{project.name}</h3>
                          <p className="text-sm text-academic-navy-600 mb-4">{project.genre || 'Без области исследования'}</p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-academic-teal-600">{project.progress || 0}%</span>
                              <span className="text-gray-400">прогресс</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-academic-navy-700">{project.chapters || 0}</span>
                              <span className="text-gray-400">разделов</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-academic-teal-600 text-sm font-medium">
                              <Activity size={16} />
                              Открыть проект
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="card p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedProject(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-academic-navy-900">{selectedProject.name}</h2>
                        <p className="text-sm text-academic-navy-600">{selectedProject.genre || 'Без области исследования'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-academic-teal-50 rounded-lg">
                        <Activity className="text-academic-teal-600" size={18} />
                        <span className="font-bold text-academic-teal-600">{selectedProject.progress || 0}%</span>
                      </div>
                      <button 
                        onClick={() => handleExportProject(selectedProject, 'pdf')}
                        className="btn btn-outline flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Экспорт
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(selectedProject.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-academic-cream-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-academic-navy-600 mb-1">
                        <BookOpen size={16} />
                        <span>Разделов</span>
                      </div>
                      <p className="text-2xl font-bold text-academic-navy-900">{chapters.length}</p>
                    </div>
                    <div className="p-4 bg-academic-cream-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-academic-navy-600 mb-1">
                        <MessageSquare size={16} />
                        <span>Слов</span>
                      </div>
                      <p className="text-2xl font-bold text-academic-navy-900">{chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setProjectActiveTab('overview')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        projectActiveTab === 'overview'
                          ? 'text-academic-teal-600 border-b-2 border-academic-teal-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Обзор
                    </button>
                    <button
                      onClick={() => setProjectActiveTab('analysis')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        projectActiveTab === 'analysis'
                          ? 'text-academic-teal-600 border-b-2 border-academic-teal-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Результаты анализа
                    </button>
                    <button
                      onClick={() => setProjectActiveTab('pipeline')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        projectActiveTab === 'pipeline'
                          ? 'text-academic-teal-600 border-b-2 border-academic-teal-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Пайплайн
                    </button>
                  </div>
                </div>

                {projectActiveTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="card p-6">
                        <h3 className="text-lg font-bold text-academic-navy-900 mb-4">Разделы исследования</h3>
                      {chapters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>Разделов пока нет</p>
                          <p className="text-sm mt-2">Создайте первый раздел для начала работы</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chapters.map((chapter, index) => (
                            <div key={chapter.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-academic-teal-400 transition-colors cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-academic-teal-100 flex items-center justify-center text-academic-teal-600 font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-academic-navy-900">{chapter.title}</h4>
                                    <p className="text-sm text-gray-500">{chapter.description || 'Без описания'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400">{chapter.wordCount || 0} слов</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteChapter(chapter.id)
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <ChevronRight size={18} className="text-gray-400" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={handleCreateChapter}
                        className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-academic-teal-400 hover:text-academic-teal-600 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Plus size={18} />
                          <span>Добавить раздел</span>
                        </div>
                      </button>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-academic-navy-900 mb-4">Загруженные файлы</h3>
                      {uploadedFiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Upload size={48} className="mx-auto mb-4 text-gray-300" />
                          <p>Файлы не загружены</p>
                          <p className="text-sm mt-2">Загрузите источники для анализа</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {uploadedFiles.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  doc.status === 'ready' 
                                    ? 'bg-academic-emerald-100' 
                                    : doc.status === 'processing'
                                    ? 'bg-academic-amber-100'
                                    : 'bg-red-100'
                                }`}>
                                  <Check 
                                    className={`${
                                      doc.status === 'ready' 
                                        ? 'text-academic-emerald-600' 
                                        : doc.status === 'processing'
                                        ? 'text-academic-amber-600'
                                        : 'text-red-600'
                                    }`} 
                                    size={16} 
                                  />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-academic-navy-900">{doc.originalname}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatFileSize(doc.size)} • {doc.chunkCount} фрагментов • {doc.estimatedTokens} токенов
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={handleFileUpload}
                        className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-academic-teal-400 hover:text-academic-teal-600 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Upload size={18} />
                          <span>Загрузить файл</span>
                        </div>
                      </button>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-bold text-academic-navy-900 mb-4">Комментарии</h3>
                      <div className="space-y-3 mb-4">
                        {comments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>Комментариев пока нет</p>
                          </div>
                        ) : (
                          comments.map((comment, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-academic-teal-100 flex items-center justify-center text-academic-teal-600 font-bold text-sm">
                              {comment.user_id === userId ? 'Я' : 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-academic-navy-900 text-sm">
                                  {comment.user_id === userId ? 'Вы' : 'Пользователь'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                              <p className="text-sm text-academic-navy-800">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="comment-input"
                      placeholder="Добавить комментарий..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-academic-teal-500 text-sm"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('comment-input')
                        if (input) {
                          handleAddComment(input.value)
                          input.value = ''
                        }
                      }}
                      className="px-4 py-2 bg-academic-teal-600 text-white rounded-lg hover:bg-academic-teal-700 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>

                </div>
                )}
                
                {projectActiveTab === 'analysis' && (
                  <AnalysisResultsSection 
                    analysisResults={projectAnalysisResults}
                    documentName={selectedProject.name}
                  />
                )}

                {projectActiveTab === 'pipeline' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PipelineVisualizer 
                      pipeline={selectedPipelineTemplate}
                      pipelineId={activePipelineId}
                      onStart={() => setShowPipelineVisualization(true)}
                      onPause={() => setShowPipelineVisualization(false)}
                      onReset={() => setActivePipelineId(null)}
                    />
                    <MultiAgentFlow 
                      pipeline={selectedPipelineTemplate}
                      pipelineId={activePipelineId}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Sparkles className="text-primary-600" size={24} />
                <div>
                  <h3 className="font-bold">ИИ-помощник</h3>
                  <p className="text-xs text-gray-600">Powered by GLM-4.7</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex border-b">
              {[
                { mode: 'creative', label: 'Креативный' },
                { mode: 'editor', label: 'Редактор' },
                { mode: 'analyst', label: 'Аналитик' }
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setChatMode(item.mode)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    chatMode === item.mode
                      ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FileText size={20} />
                </label>
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplateSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-xl">Выберите шаблон пайплайна</h3>
                <p className="text-sm text-gray-600">Выберите оптимальный рабочий процесс для вашего исследования</p>
              </div>
              <button 
                onClick={() => setShowTemplateSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TemplateSelector onSelectTemplate={handleTemplateSelect} />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="font-bold text-xl">Настройки</h3>
                <p className="text-sm text-gray-600">Конфигурация моделей и API</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-academic-navy-900 mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" />
                  Основная модель
                </h4>
                <select
                  value={settings.primaryModel}
                  onChange={(e) => handleSettingsChange('primaryModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="glm-4.7">GLM-4.7 (Z.ai)</option>
                  <option value="deepseek-r1">DeepSeek R1 (OpenRouter)</option>
                  <option value="qwen">Qwen 2.5 Coder (OpenRouter)</option>
                </select>
              </div>

              <div>
                <h4 className="font-semibold text-academic-navy-900 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-primary-600" />
                  Режим мышления GLM-4.7
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { mode: 'interleaved', label: 'Interleaved', desc: 'Поочередное рассуждение и вывод' },
                    { mode: 'preserved', label: 'Preserved', desc: 'Сохранение истории рассуждений' },
                    { mode: 'ultrathink', label: 'Ultrathink', desc: 'Глубокое многоуровневое мышление' }
                  ].map((option) => (
                    <button
                      key={option.mode}
                      onClick={() => handleSettingsChange('thinkingMode', option.mode)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        settings.thinkingMode === option.mode
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-academic-navy-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-academic-navy-900 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-primary-600" />
                  Резервная модель
                </h4>
                <select
                  value={settings.fallbackModel}
                  onChange={(e) => handleSettingsChange('fallbackModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="deepseek-r1">DeepSeek R1 (OpenRouter)</option>
                  <option value="qwen">Qwen 2.5 Coder (OpenRouter)</option>
                </select>
              </div>

              <div>
                <h4 className="font-semibold text-academic-navy-900 mb-4 flex items-center gap-2">
                  <Edit size={18} className="text-primary-600" />
                  Модель редактуры текста
                </h4>
                <select
                  value={settings.textEditingModel}
                  onChange={(e) => handleSettingsChange('textEditingModel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="qwen">Qwen 2.5 Coder (OpenRouter - бесплатно)</option>
                  <option value="glm-4.7">GLM-4.7 (Z.ai)</option>
                </select>
              </div>

              <div>
                <h4 className="font-semibold text-academic-navy-900 mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-primary-600" />
                  API конфигурация
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenRouter API ключ (для DeepSeek R1 / Qwen)
                    </label>
                    <input
                      type="password"
                      value={settings.openRouterKey}
                      onChange={(e) => handleSettingsChange('openRouterKey', e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Получите ключ на <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">openrouter.ai/keys</a>
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.useCodingAPI}
                      onChange={(e) => handleSettingsChange('useCodingAPI', e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-academic-navy-900">Использовать Coding API</div>
                      <div className="text-sm text-gray-600">GLM-4.7 через coding endpoint (без проверки баланса)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App