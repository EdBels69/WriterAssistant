import { memo } from 'react'
import { ChevronLeft, Sparkles, BookOpen, Activity, Edit3, Code, Brain, FileText, MessageSquare, Network } from 'lucide-react'

const analysisTools = {
  'data-analysis': [
    { id: 'generateIdeas', label: 'Исследование с нуля', description: 'Генерация идей для исследования', icon: Sparkles, color: 'accent-cyan' },
    { id: 'structureIdeas', label: 'Структурирование идей', description: 'Организовать идеи из источников', icon: Sparkles, color: 'accent-cyan' },
    { id: 'extractReferences', label: 'Извлечь ссылки', description: 'Извлечь библиографию', icon: BookOpen, color: 'accent-pink' },
    { id: 'generateHypothesis', label: 'Генерация гипотез', description: 'Сформировать гипотезы исследования', icon: Activity, color: 'accent-purple' }
  ],
  'literature-review': [
    { id: 'narrativeReview', label: 'Нарративный обзор', description: 'Обзор литературы по теме', icon: BookOpen, color: 'accent-purple' },
    { id: 'systematicReview', label: 'Систематический обзор', description: 'Структурированный обзор источников', icon: FileText, color: 'accent-cyan' },
    { id: 'metaAnalysis', label: 'Мета-анализ', description: 'Статистический анализ исследований', icon: Activity, color: 'accent-emerald' }
  ],
  'statistical-analysis': [
    { id: 'analyzeResults', label: 'Анализ результатов', description: 'Интерпретация статистических данных', icon: Activity, color: 'accent-emerald' },
    { id: 'generateDiscussion', label: 'Обсуждение результатов', description: 'Написание раздела обсуждения', icon: MessageSquare, color: 'accent-purple' },
    { id: 'generateConclusion', label: 'Заключение', description: 'Формулирование выводов', icon: Edit3, color: 'accent-pink' }
  ],
  'style-formatting': [
    { id: 'improveStyle', label: 'Улучшить стиль', description: 'Академический стиль текста', icon: Edit3, color: 'accent-pink' },
    { id: 'editStyleText', label: 'Редактирование', description: 'Редактирование текста', icon: Edit3, color: 'accent-pink' },
    { id: 'processLargeText', label: 'Обработка текста', description: 'Анализ больших текстов', icon: FileText, color: 'accent-cyan' }
  ],
  'code-tools': [
    { id: 'generateCode', label: 'Генерация кода', description: 'Создать код по описанию', icon: Code, color: 'accent-cyan' },
    { id: 'reviewCode', label: 'Ревью кода', description: 'Проверить качество кода', icon: Code, color: 'accent-emerald' },
    { id: 'debugCode', label: 'Отладка кода', description: 'Найти и исправить ошибки', icon: Code, color: 'accent-pink' },
    { id: 'optimizeCode', label: 'Оптимизация', description: 'Улучшить производительность', icon: Code, color: 'accent-purple' },
    { id: 'explainCode', label: 'Объяснение кода', description: 'Понять как работает код', icon: Code, color: 'accent-cyan' },
    { id: 'refactorCode', label: 'Рефакторинг', description: 'Улучшить структуру кода', icon: Code, color: 'accent-emerald' },
    { id: 'generateTests', label: 'Тесты', description: 'Создать тесты для кода', icon: Code, color: 'accent-pink' },
    { id: 'generateDocumentation', label: 'Документация', description: 'Сгенерировать документацию', icon: Code, color: 'accent-purple' }
  ],
  'multi-agent': [
    { id: 'multiAgentExecute', label: 'Выполнение пайплайна', description: 'Запустить мультиагентный процесс', icon: Brain, color: 'accent-purple' },
    { id: 'multiAgentPipelines', label: 'Доступные пайплайны', description: 'Просмотреть доступные пайплайны', icon: Network, color: 'accent-cyan' },
    { id: 'multiAgentStructureIdeas', label: 'Структура идей', description: 'Мультиагентная структура идей', icon: Sparkles, color: 'accent-emerald' },
    { id: 'multiAgentMetaAnalysis', label: 'Мета-анализ', description: 'Мультиагентный мета-анализ', icon: Activity, color: 'accent-pink' }
  ]
}

function AnalysisTools({ activeToolScreen, setActiveToolScreen, selectedTool, setSelectedTool, handleAnalyze }) {
  const screenTitle = {
    'data-analysis': 'Анализ данных',
    'literature-review': 'Обзор литературы',
    'statistical-analysis': 'Статистический анализ',
    'style-formatting': 'Стиль и форматирование',
    'code-tools': 'Код',
    'multi-agent': 'Мультиагентный ИИ'
  }

  const tools = analysisTools[activeToolScreen] || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveToolScreen(null)}
          className="p-2 hover:bg-dark-border rounded-lg transition-colors text-dark-muted hover:text-white"
          aria-label="Вернуться назад"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="text-2xl font-bold text-white font-display">{screenTitle[activeToolScreen] || 'Инструменты'}</h1>
      </div>

      <div className="card-elevated p-8 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list" aria-label="Инструменты анализа">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="listitem"
              onClick={() => { setSelectedTool(tool.id); handleAnalyze(); }}
              className={`tool-card p-6 text-left transition-all bg-dark-card border border-dark-border rounded-xl hover:border-primary-500/50 ${
                selectedTool === tool.id ? 'ring-2 ring-primary-500 shadow-glow' : ''
              }`}
              aria-pressed={selectedTool === tool.id}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-xl bg-${tool.color}/20`}>
                  <tool.icon className={`text-${tool.color}`} size={24} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{tool.label}</h3>
                  <p className="text-sm text-dark-muted">{tool.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(AnalysisTools)
