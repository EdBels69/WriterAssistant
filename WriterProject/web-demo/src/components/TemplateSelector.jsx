import React, { useState } from 'react'
import { 
  Sparkles, 
  FileText, 
  BookOpen, 
  BarChart3, 
  Edit3,
  ChevronRight,
  Plus,
  Target,
  Search
} from 'lucide-react'
import usePipelineStore from '../stores/pipelineStore'

const pipelineTemplates = {
  researchFromScratch: {
    name: 'Исследование с нуля',
    description: 'Полный цикл научного исследования от идеи до публикации',
    icon: Sparkles,
    color: 'bg-teal-400',
    steps: [
      { id: 'brainstorm', type: 'brainstorm', name: 'Генерация идей', description: 'Структурирование идей из источников', duration: '2-3 мин' },
      { id: 'hypothesis', type: 'hypothesis', name: 'Генерация гипотез', description: 'Формулирование исследовательских гипотез', duration: '3-5 мин' },
      { id: 'methodology', type: 'methodology', name: 'Методология', description: 'Структурирование материалов и методов', duration: '2-3 мин' },
      { id: 'literature', type: 'literature', name: 'Обзор литературы', description: 'Нарративный обзор источников', duration: '5-7 мин' },
      { id: 'analysis', type: 'analysis', name: 'Статистический анализ', description: 'Анализ результатов и интерпретация', duration: '3-5 мин' },
      { id: 'discussion', type: 'discussion', name: 'Обсуждение', description: 'Генерация раздела обсуждения', duration: '3-4 мин' },
      { id: 'conclusion', type: 'conclusion', name: 'Заключение', description: 'Формулирование итоговых выводов', duration: '2-3 мин' },
      { id: 'style', type: 'style', name: 'Стиль и форматирование', description: 'Улучшение академического стиля', duration: '2-3 мин' }
    ]
  },
  literatureReview: {
    name: 'Обзор литературы',
    description: 'Систематический обзор научных источников',
    icon: BookOpen,
    color: 'bg-teal-400',
    steps: [
      { id: 'structure', type: 'structure', name: 'Структурирование идей', description: 'Организация идей из источников', duration: '2-3 мин' },
      { id: 'literature', type: 'literature', name: 'Нарративный обзор', description: 'Создание обзора литературы', duration: '5-7 мин' },
      { id: 'style', type: 'style', name: 'Редактирование', description: 'Улучшение научного стиля', duration: '2-3 мин' }
    ]
  },
  dataAnalysis: {
    name: 'Анализ данных',
    description: 'Статистический анализ и интерпретация результатов',
    icon: BarChart3,
    color: 'bg-amber-400',
    steps: [
      { id: 'methodology', type: 'methodology', name: 'Методология', description: 'Проверка методологических стандартов', duration: '2-3 мин' },
      { id: 'analysis', type: 'analysis', name: 'Статистический анализ', description: 'Интерпретация результатов', duration: '3-5 мин' },
      { id: 'discussion', type: 'discussion', name: 'Обсуждение', description: 'Генерация обсуждения', duration: '3-4 мин' }
    ]
  },
  styleRefinement: {
    name: 'Редактирование текста',
    description: 'Улучшение академического стиля и форматирование',
    icon: Edit3,
    color: 'bg-slate-400',
    steps: [
      { id: 'style', type: 'style', name: 'Академический стиль', description: 'Улучшение стиля текста', duration: '2-3 мин' },
      { id: 'conclusion', type: 'conclusion', name: 'Заключение', description: 'Формулирование выводов', duration: '2-3 мин' }
    ]
  },
  hypothesisGeneration: {
    name: 'Генерация гипотез',
    description: 'Создание и проверка исследовательских гипотез',
    icon: Target,
    color: 'bg-rose-400',
    steps: [
      { id: 'brainstorm', type: 'brainstorm', name: 'Генерация идей', description: 'Структурирование идей', duration: '2-3 мин' },
      { id: 'hypothesis', type: 'hypothesis', name: 'Генерация гипотез', description: 'Формулирование гипотез', duration: '3-5 мин' },
      { id: 'literature', type: 'literature', name: 'Проверка литературы', description: 'Поиск подтверждающих/опровергающих данных', duration: '3-4 мин' }
    ]
  },
  customPipeline: {
    name: 'Создать свой pipeline',
    description: 'Соберите уникальный workflow из доступных инструментов',
    icon: Plus,
    color: 'bg-gray-400',
    steps: []
  }
}

const TemplateSelector = ({ onSelectTemplate }) => {
  const { createPipeline, addStep } = usePipelineStore()
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const handleSelectTemplate = (templateKey) => {
    const template = pipelineTemplates[templateKey]
    setSelectedTemplate(templateKey)
    
    if (templateKey !== 'customPipeline') {
      const pipeline = createPipeline(template.name, templateKey)
      
      template.steps.forEach((step) => {
        addStep(pipeline.id, step)
      })
      
      onSelectTemplate?.(pipeline)
    } else {
      onSelectTemplate?.(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-academic-navy-900 mb-2">Выберите шаблон workflow</h2>
        <p className="text-academic-navy-600">
          Начните с готового шаблона или создайте свой уникальный pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(pipelineTemplates).map(([key, template]) => {
          const Icon = template.icon
          const isSelected = selectedTemplate === key
          
          return (
            <button
              key={key}
              onClick={() => handleSelectTemplate(key)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                isSelected 
                  ? 'border-academic-teal-500 bg-academic-teal-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${template.color} rounded-t-xl`} />
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${template.color} text-white shrink-0`}>
                  <Icon size={24} />
                </div>
                
                <div>
                  <h3 className="font-bold text-academic-navy-900 text-lg">{template.name}</h3>
                  <p className="text-sm text-academic-navy-600 mt-1">{template.description}</p>
                </div>
              </div>

              {template.steps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {template.steps.length} этапов
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.steps.slice(0, 3).map((step) => (
                      <span
                        key={step.id}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {step.name}
                      </span>
                    ))}
                    {template.steps.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{template.steps.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <ChevronRight 
                className={`absolute bottom-4 right-4 transition-transform ${
                  isSelected ? 'rotate-90 text-academic-teal-600' : 'text-gray-400'
                }`} 
                size={20}
              />
            </button>
          )
        })}
      </div>

      {selectedTemplate === 'customPipeline' && (
        <div className="mt-6 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Plus size={48} className="mx-auto mb-3 text-gray-400" />
            <h3 className="font-bold text-academic-navy-900 mb-2">Создать кастомный pipeline</h3>
            <p className="text-sm text-academic-navy-600 mb-4">
              Выберите инструменты и создайте свой уникальный workflow
            </p>
            <button
              onClick={() => onSelectTemplate?.(null)}
              className="px-6 py-2 bg-academic-teal-600 text-white rounded-lg hover:bg-academic-teal-700 transition-colors"
            >
              Открыть редактор pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
