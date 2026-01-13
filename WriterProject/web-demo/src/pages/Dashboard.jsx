import { FileText, BookOpen, BarChart3, Edit3 } from 'lucide-react'
import { HeroSection, FeaturesGrid } from '../components/dashboard'

export default function Dashboard({ onCreateProject, onOpenProject }) {
  const features = [
    {
      id: 'data-analysis',
      title: 'Анализ данных',
      description: 'Структурирование идей, извлечение ссылок, генерация гипотез',
      icon: FileText,
      category: 'analysis'
    },
    {
      id: 'literature-review',
      title: 'Обзор литературы',
      description: 'Нарративный, систематический обзор, мета-анализ',
      icon: BookOpen,
      category: 'review'
    },
    {
      id: 'statistical-analysis',
      title: 'Статистический анализ',
      description: 'Интерпретация результатов, анализ данных',
      icon: BarChart3,
      category: 'statistics'
    },
    {
      id: 'style-formatting',
      title: 'Стиль и форматирование',
      description: 'Академический стиль, редактирование текстов',
      icon: Edit3,
      category: 'style'
    }
  ]

  const handleFeatureClick = (featureId) => {
    onOpenProject?.(featureId)
  }

  const handleOpenTools = () => {
    handleFeatureClick('tools')
  }

  return (
    <div className="academic-dashboard-content">
      <HeroSection 
        onCreateProject={onCreateProject}
        onOpenTools={handleOpenTools}
      />
      
      <FeaturesGrid 
        features={features}
        onFeatureClick={handleFeatureClick}
      />
    </div>
  )
}