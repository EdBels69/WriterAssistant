import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Loader2,
  Clock,
  Sparkles,
  FileText,
  BarChart3,
  BookOpen,
  Edit3,
  RefreshCw,
  XCircle,
  WifiOff,
  AlertTriangle
} from 'lucide-react'
import usePipelineStore from '../stores/pipelineStore'
import useContextStore from '../stores/contextStore'
import useWebSocket from '../hooks/useWebSocket'
import { aiAPI } from '../api/ai'

const stepIcons = {
  brainstorm: Sparkles,
  structure: FileText,
  hypothesis: Sparkles,
  methodology: FileText,
  literature: BookOpen,
  analysis: BarChart3,
  discussion: FileText,
  conclusion: FileText,
  style: Edit3
}

const stepColors = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  running: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse',
  completed: 'bg-green-50 text-green-600 border-green-200',
  error: 'bg-red-50 text-red-600 border-red-200'
}

const PipelineVisualizer = ({ pipelineId, onStepClick }) => {
  const { pipelines, activePipeline, setActivePipeline, updateStepStatus, resetPipeline, deletePipeline, isPaused, pausePipeline, resumePipeline } = usePipelineStore()
  const { getContextForStep } = useContextStore()
  const { connectionState, setPausePipeline, getCircuitBreakerState } = useWebSocket()
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecutingStep, setCurrentExecutingStep] = useState(null)
  const [isErrorRecoveryDismissed, setIsErrorRecoveryDismissed] = useState(false)
  const [recoveryAttemptCount, setRecoveryAttemptCount] = useState(0)

  const pipeline = pipelines.find((p) => p.id === pipelineId)
  if (!pipeline) return null

  const hasErrorSteps = pipeline.steps.some((s) => s.status === 'error')
  const hasNetworkIssue = connectionState === 'circuit_open' || connectionState === 'disconnected'
  const errorRecoveryMode = hasNetworkIssue
    ? 'network'
    : (hasErrorSteps || recoveryAttemptCount > 0)
        ? 'step_error'
        : null
  const shouldShowErrorRecovery = Boolean(errorRecoveryMode) && !isErrorRecoveryDismissed
  const circuitBreakerState = getCircuitBreakerState()

  useEffect(() => {
    if (!hasErrorSteps && !hasNetworkIssue && !isExecuting) {
      setIsErrorRecoveryDismissed(false)
      setRecoveryAttemptCount(0)
    }
  }, [hasErrorSteps, hasNetworkIssue, isExecuting])

  const handleStartPipeline = async () => {
    if (isExecuting) return
    setIsExecuting(true)
    
    for (let i = 0; i < pipeline.steps.length; i++) {
      if (isPaused) break
      
      const step = pipeline.steps[i]
      setCurrentExecutingStep(step.id)
      updateStepStatus(pipelineId, step.id, 'running')
      
      try {
        const context = getContextForStep(step.type)
        await executeStep(step, context)
        updateStepStatus(pipelineId, step.id, 'completed')
      } catch (error) {
        updateStepStatus(pipelineId, step.id, 'error', { error: error.message })
        break
      }
    }
    
    setIsExecuting(false)
    setCurrentExecutingStep(null)
  }

  const executeStep = async (step, context) => {
    const apiMethods = {
      brainstorm: () => aiAPI.brainstorm({ ...step.params, context }),
      structure: () => aiAPI.structureIdeas({ ...step.params, context }),
      hypothesis: () => aiAPI.multiAgent.hypothesis({ ...step.params, context }),
      methodology: () => aiAPI.structureMethodology({ ...step.params, context }),
      literature: () => aiAPI.multiAgent.literatureReview({ ...step.params, context }),
      analysis: () => aiAPI.statisticalAnalysis({ ...step.params, context }),
      discussion: () => aiAPI.generateDiscussion({ ...step.params, context }),
      conclusion: () => aiAPI.generateConclusion({ ...step.params, context }),
      style: () => aiAPI.improveAcademicStyle({ ...step.params, context })
    }

    const apiMethod = apiMethods[step.type]
    if (!apiMethod) throw new Error(`Unknown step type: ${step.type}`)

    const result = await apiMethod()
    if (!result.success) throw new Error(result.error || 'Step execution failed')
    return result
  }

  const handlePauseResume = () => {
    if (isPaused) {
      resumePipeline()
    } else {
      pausePipeline()
    }
  }

  const handleReset = () => {
    if (confirm('Сбросить прогресс pipeline? Все результаты будут удалены.')) {
      handleResetPipeline()
    }
  }

  const handleDelete = () => {
    if (confirm('Удалить этот pipeline?')) {
      deletePipeline(pipelineId)
      if (activePipeline === pipelineId) {
        setActivePipeline(null)
      }
    }
  }

  const handleRecoveryAction = async (action) => {
    setRecoveryAttemptCount(prev => prev + 1)

    switch (action) {
      case 'retry_step':
        const errorStep = pipeline.steps.find((s) => s.status === 'error')
        if (errorStep) {
          updateStepStatus(pipelineId, errorStep.id, 'pending')
          await handleStartPipeline()
        }
        break

      case 'skip_step':
        const pendingErrorStep = pipeline.steps.find((s) => s.status === 'error')
        if (pendingErrorStep) {
          updateStepStatus(pipelineId, pendingErrorStep.id, 'completed')
          await handleStartPipeline()
        }
        break

      case 'retry_all':
        pipeline.steps.forEach((step) => {
          if (step.status === 'error') {
            updateStepStatus(pipelineId, step.id, 'pending')
          }
        })
        await handleStartPipeline()
        break

      case 'check_connection':
        setIsErrorRecoveryDismissed(true)
        break

      case 'wait_connection':
        setIsErrorRecoveryDismissed(true)
        break
    }
  }

  const handleResetPipeline = () => {
    resetPipeline(pipelineId)
    setIsExecuting(false)
    setCurrentExecutingStep(null)
    setIsErrorRecoveryDismissed(false)
    setRecoveryAttemptCount(0)
  }

  const getStepStatus = (step) => {
    if (currentExecutingStep === step.id) return 'running'
    return step.status
  }

  const getStepIcon = (step) => {
    const Icon = stepIcons[step.type] || Circle
    const status = getStepStatus(step)
    
    if (status === 'running') return <Loader2 size={20} className="animate-spin" />
    if (status === 'completed') return <CheckCircle size={20} />
    if (status === 'error') return <AlertCircle size={20} />
    return <Icon size={20} />
  }

  const getProgress = () => {
    const completedSteps = pipeline.steps.filter((s) => s.status === 'completed').length
    return (completedSteps / pipeline.steps.length) * 100
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-academic-navy-100 rounded-lg">
            <Sparkles size={20} className="text-academic-navy-600" />
          </div>
          <div>
            <h3 className="font-bold text-academic-navy-900 text-lg">{pipeline.name}</h3>
            <p className="text-sm text-academic-navy-600">{pipeline.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExecuting && !isPaused && (
            <button
              onClick={handleStartPipeline}
              className="flex items-center gap-2 px-4 py-2 bg-academic-teal-600 text-white rounded-lg hover:bg-academic-teal-700 transition-colors"
            >
              <Play size={16} />
              Запустить
            </button>
          )}
          
          {(isExecuting || isPaused) && (
            <button
              onClick={handlePauseResume}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Продолжить' : 'Пауза'}
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={16} />
            Сброс
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Прогресс</span>
          <span className="font-medium text-academic-navy-900">{getProgress().toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-academic-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {pipeline.steps.map((step, index) => {
          const status = getStepStatus(step)
          const colorClass = stepColors[status] || stepColors.pending
          
          return (
            <div
              key={step.id}
              onClick={() => onStepClick?.(step)}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${colorClass}`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{step.name}</h4>
                  {step.duration && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {step.duration}
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-75">{step.description}</p>
              </div>
              
              <ChevronRight size={20} className="opacity-50" />
            </div>
          )
        })}
      </div>

      {shouldShowErrorRecovery && (
        <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-lg" role="alert" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {errorRecoveryMode === 'network' ? (
                <div className="p-3 bg-amber-100 rounded-full">
                  <WifiOff size={24} className="text-amber-600" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle size={24} className="text-red-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-900 text-lg">
                  {errorRecoveryMode === 'network' ? 'Проблема с соединением' : 'Ошибка выполнения pipeline'}
                </h4>
                <button
                  onClick={() => {
                    setIsErrorRecoveryDismissed(true)
                    setRecoveryAttemptCount(0)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Закрыть панель восстановления"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              {errorRecoveryMode === 'network' ? (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    Потеряно соединение с сервером. Circuit breaker активирован для предотвращения каскадных ошибок.
                  </p>
                  
                  {circuitBreakerState && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <span className="font-medium">Статус circuit breaker:</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {circuitBreakerState.state === 'open' ? 'Открыт' : 
                           circuitBreakerState.state === 'half_open' ? 'Полуоткрыт' : 'Закрыт'}
                        </span>
                      </div>
                      {circuitBreakerState.failureCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Количество сбоев: {circuitBreakerState.failureCount}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRecoveryAction('check_connection')}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                    >
                      <RefreshCw size={16} />
                      Проверить соединение
                    </button>
                    <button
                      onClick={() => {
                        setIsErrorRecoveryDismissed(true)
                        setRecoveryAttemptCount(0)
                        setPausePipeline(false)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors font-medium text-sm"
                    >
                      <Clock size={16} />
                      Подождать восстановления
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-4">
                    Один или несколько этапов pipeline завершились с ошибкой. Вы можете:
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <RefreshCw size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Повторить ошибочный шаг</strong> - попытаться выполнить шаг заново</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <ChevronRight size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Пропустить шаг</strong> - продолжить выполнение без этого шага</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <RotateCcw size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Повторить всё</strong> - перезапустить весь pipeline</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRecoveryAction('retry_step')}
                      disabled={recoveryAttemptCount >= 3}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        recoveryAttemptCount >= 3 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      <RefreshCw size={16} />
                      Повторить шаг
                      {recoveryAttemptCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500">
                          {recoveryAttemptCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleRecoveryAction('skip_step')}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors font-medium text-sm"
                    >
                      <ChevronRight size={16} />
                      Пропустить
                    </button>
                    <button
                      onClick={() => handleRecoveryAction('retry_all')}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors font-medium text-sm"
                    >
                      <RotateCcw size={16} />
                      Повторить всё
                    </button>
                  </div>
                  
                  {recoveryAttemptCount >= 3 && (
                    <p className="text-xs text-gray-500 mt-3">
                      Превышено количество попыток повтора. Рекомендуется проверить настройки или обратитесь в поддержку.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PipelineVisualizer
