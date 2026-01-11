import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useCallback, useState } from 'react'
import useWebSocket from './hooks/useWebSocket'
import useAppStore from './stores/appStore'
import useSettings from './hooks/useSettings'
import usePipelineStore from './stores/pipelineStore'
import Header from './components/layout/Header'
import Navigation from './components/layout/Navigation'
import LoadingState from './components/ui/LoadingState'
import ErrorState from './components/ui/ErrorState'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ToolsPage from './pages/ToolsPage'
import ChatPage from './pages/ChatPage'

const AnalysisResultsSection = lazy(() => import('./components/AnalysisResultsSection'))
const EntryPoints = lazy(() => import('./components/EntryPoints'))
const PipelineVisualizer = lazy(() => import('./components/PipelineVisualizer'))
const MultiAgentFlow = lazy(() => import('./components/MultiAgentFlow'))
const TemplateSelector = lazy(() => import('./components/TemplateSelector'))

function App() {
  const {
    sessionId,
    setSessionId,
    chatMessages,
    setChatMessages,
    addChatMessage,
    loading,
    error,
    activeTab,
    setActiveTab,
    analysisResults,
    setAnalysisResults,
    inputMode,
    setInputMode,
    inputText,
    setInputText,
    selectedTemplate,
    setSelectedTemplate
  } = useAppStore()

  const { activePipeline } = usePipelineStore()
  const { userId } = useSettings()
  const [componentErrors, setComponentErrors] = useState({})

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'chat_message' && data.data.sessionId === sessionId) {
      addChatMessage({ role: 'assistant', content: data.data.content })
    }
  }, [sessionId, addChatMessage])

  useWebSocket(userId, handleWebSocketMessage)

  const handleTemplateSelect = useCallback((pipeline) => {
    setSelectedTemplate(pipeline)
  }, [setSelectedTemplate])

  const handleStepClick = useCallback((step) => {
    console.log('Step clicked:', step)
  }, [])

  const handleAgentClick = useCallback((agent) => {
    console.log('Agent clicked:', agent)
  }, [])

  const handleComponentError = useCallback((componentName) => {
    setComponentErrors(prev => ({ ...prev, [componentName]: true }))
  }, [])

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <div className="flex">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6">
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectsPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        {!componentErrors.analysisResults && (
          <ErrorBoundary
            fallbackTitle="Ошибка загрузки результатов анализа"
            fallbackMessage="Не удалось загрузить результаты анализа"
            resetButtonText="Повторить"
            onReset={() => handleComponentError('analysisResults')}
          >
            <AnalysisResultsSection 
              analysisResults={analysisResults}
              onClose={() => setAnalysisResults([])}
            />
          </ErrorBoundary>
        )}
        
        {!componentErrors.entryPoints && (
          <ErrorBoundary
            fallbackTitle="Ошибка загрузки точек входа"
            fallbackMessage="Не удалось загрузить точки входа"
            resetButtonText="Повторить"
            onReset={() => handleComponentError('entryPoints')}
          >
            <EntryPoints 
              inputMode={inputMode}
              setInputMode={setInputMode}
              inputText={inputText}
              setInputText={setInputText}
            />
          </ErrorBoundary>
        )}
        
        {!componentErrors.pipelineVisualizer && activePipeline && (
          <ErrorBoundary
            fallbackTitle="Ошибка загрузки визуализации pipeline"
            fallbackMessage="Не удалось загрузить визуализацию pipeline"
            resetButtonText="Повторить"
            onReset={() => handleComponentError('pipelineVisualizer')}
          >
            <PipelineVisualizer 
              pipelineId={activePipeline}
              onStepClick={handleStepClick}
            />
          </ErrorBoundary>
        )}
        
        {!componentErrors.multiAgentFlow && (
          <ErrorBoundary
            fallbackTitle="Ошибка загрузки multi-agent flow"
            fallbackMessage="Не удалось загрузить multi-agent flow"
            resetButtonText="Повторить"
            onReset={() => handleComponentError('multiAgentFlow')}
          >
            <MultiAgentFlow 
              agents={selectedTemplate?.steps?.map(s => s.type) || []}
              onAgentClick={handleAgentClick}
            />
          </ErrorBoundary>
        )}
        
        {!componentErrors.templateSelector && (
          <ErrorBoundary
            fallbackTitle="Ошибка загрузки выбора шаблона"
            fallbackMessage="Не удалось загрузить выбор шаблона"
            resetButtonText="Повторить"
            onReset={() => handleComponentError('templateSelector')}
          >
            <TemplateSelector onSelectTemplate={handleTemplateSelect} />
          </ErrorBoundary>
        )}
      </Suspense>
    </div>
  )
}

export default App
