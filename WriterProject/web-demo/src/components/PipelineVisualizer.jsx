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
  Edit3
} from 'lucide-react'
import usePipelineStore from '../stores/pipelineStore'
import useContextStore from '../stores/contextStore'
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
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecutingStep, setCurrentExecutingStep] = useState(null)

  const pipeline = pipelines.find((p) => p.id === pipelineId)
  if (!pipeline) return null

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
      resetPipeline(pipelineId)
      setIsExecuting(false)
      setCurrentExecutingStep(null)
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

      {pipeline.steps.some((s) => s.status === 'error') && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle size={20} />
            Ошибка выполнения
          </div>
          <p className="text-sm text-red-600">
            Некоторые этапы завершились с ошибкой. Проверьте детали шагов для получения информации.
          </p>
        </div>
      )}
    </div>
  )
}

export default PipelineVisualizer
