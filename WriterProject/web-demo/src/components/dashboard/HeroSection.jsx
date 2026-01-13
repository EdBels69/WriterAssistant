import { Plus, ArrowRight } from 'lucide-react'

const HeroSection = ({ onCreateProject, onOpenTools }) => {
  return (
    <section className="academic-welcome-section">
      <div className="academic-welcome-card">
        <h2 className="academic-heading-2">Добро пожаловать в ScientificWriter AI</h2>
        <p className="academic-text-body">
          Интеллектуальный помощник для научных исследований. Используйте инструменты анализа для доступа ко всем функциям.
        </p>
        
        <div className="academic-welcome-actions">
          <button
            type="button"
            onClick={onCreateProject}
            className="academic-btn academic-btn-primary"
          >
            <Plus size={16} aria-hidden="true" />
            Создать новый проект
          </button>
          
          <button
            type="button"
            onClick={onOpenTools}
            className="academic-btn academic-btn-secondary"
          >
            <ArrowRight size={16} aria-hidden="true" />
            Перейти к инструментам
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection