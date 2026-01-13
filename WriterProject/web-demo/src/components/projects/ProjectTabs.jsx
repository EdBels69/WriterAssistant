import { BarChart3, BookOpen, Target, FileText, MessageSquare } from 'lucide-react'

export function ProjectOverview({ project }) {
  return (
    <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Обзор проекта</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-dark-muted">Прогресс</span>
          <span className="text-accent-cyan font-bold">{project.progress || 0}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-dark-muted">Разделов</span>
          <span className="text-white font-bold">{project.chapters || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-dark-muted">Создан</span>
          <span className="text-white">{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </div>
  )
}

export function ProjectChapters({ project }) {
  return (
    <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Разделы</h3>
      <p className="text-dark-muted">Список разделов проекта будет здесь</p>
    </div>
  )
}

export function ProjectGoals({ project }) {
  return (
    <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Цели</h3>
      <p className="text-dark-muted">Цели проекта и прогресс по ним будут здесь</p>
    </div>
  )
}

export function ProjectFiles({ project }) {
  return (
    <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Файлы</h3>
      <p className="text-dark-muted">Загруженные файлы проекта будут здесь</p>
    </div>
  )
}

export function ProjectComments({ project }) {
  return (
    <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Комментарии</h3>
      <p className="text-dark-muted">Комментарии к проекту будут здесь</p>
    </div>
  )
}
