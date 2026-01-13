import { Plus, BookOpen, FileText, Trash2, Activity, ChevronLeft } from 'lucide-react'
import { ProjectOverview, ProjectChapters, ProjectGoals, ProjectFiles, ProjectComments } from '../components/projects/ProjectTabs'

export default function Projects({
  projects,
  selectedProject,
  setSelectedProject,
  projectActiveTab,
  setProjectActiveTab,
  handleCreateProject,
  handleExportProject,
  handleDeleteProject
}) {
  if (!selectedProject) {
    return (
      <div className="card p-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-display">Проекты</h2>
          <button onClick={handleCreateProject} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} aria-hidden="true" />
            Новый проект
          </button>
        </div>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-dark-muted">
              <BookOpen size={48} className="mx-auto mb-4 text-dark-muted" aria-hidden="true" />
              <p>У вас пока нет проектов</p>
              <button onClick={handleCreateProject} className="text-primary-500 hover:underline mt-2">
                Создать первый проект
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project)
                    setProjectActiveTab('overview')
                  }}
                  className="p-6 bg-dark-card border border-dark-border hover:shadow-glow hover:border-primary-500/50 transition-all cursor-pointer rounded-xl"
                  role="button"
                  tabIndex={0}
                  aria-label={`Открыть проект ${project.name}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-accent-cyan/20 p-3 rounded-lg">
                      <BookOpen className="text-accent-cyan" size={24} aria-hidden="true" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportProject(project, 'pdf')
                        }}
                        className="p-2 text-dark-muted hover:text-accent-cyan hover:bg-accent-cyan/20 rounded-lg transition-colors"
                        aria-label="Экспортировать проект в PDF"
                      >
                        <FileText size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="p-2 text-dark-muted hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                        aria-label="Удалить проект"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{project.name}</h3>
                  <p className="text-sm text-dark-muted mb-4">{project.genre || 'Без области исследования'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-accent-cyan">{project.progress || 0}%</span>
                      <span className="text-dark-muted">прогресс</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{project.chapters || 0}</span>
                      <span className="text-dark-muted">разделов</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dark-border">
                    <div className="flex items-center gap-2 text-accent-cyan text-sm font-medium">
                      <Activity size={16} aria-hidden="true" />
                      Открыть проект
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="card p-6 mb-6 bg-dark-card/50 backdrop-blur-xl border border-dark-border rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="p-2 hover:bg-dark-border rounded-lg transition-colors text-dark-muted hover:text-white"
              aria-label="Вернуться к списку проектов"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white font-display">{selectedProject.name}</h2>
              <p className="text-sm text-dark-muted">{selectedProject.genre || 'Без области исследования'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExportProject(selectedProject, 'pdf')} className="btn btn-secondary flex items-center gap-2">
              <FileText size={16} aria-hidden="true" />
              PDF
            </button>
            <button onClick={() => handleExportProject(selectedProject, 'docx')} className="btn btn-secondary flex items-center gap-2">
              <FileText size={16} aria-hidden="true" />
              DOCX
            </button>
          </div>
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Вкладки проекта">
          {['overview', 'chapters', 'goals', 'files', 'comments'].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={projectActiveTab === tab}
              onClick={() => setProjectActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                projectActiveTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-muted hover:bg-dark-border hover:text-white'
              }`}
            >
              {tab === 'overview' && 'Обзор'}
              {tab === 'chapters' && 'Разделы'}
              {tab === 'goals' && 'Цели'}
              {tab === 'files' && 'Файлы'}
              {tab === 'comments' && 'Комментарии'}
            </button>
          ))}
        </div>
      </div>

      <div id="project-content">
        {projectActiveTab === 'overview' && <ProjectOverview project={selectedProject} />}
        {projectActiveTab === 'chapters' && <ProjectChapters project={selectedProject} />}
        {projectActiveTab === 'goals' && <ProjectGoals project={selectedProject} />}
        {projectActiveTab === 'files' && <ProjectFiles project={selectedProject} />}
        {projectActiveTab === 'comments' && <ProjectComments project={selectedProject} />}
      </div>
    </div>
  )
}
