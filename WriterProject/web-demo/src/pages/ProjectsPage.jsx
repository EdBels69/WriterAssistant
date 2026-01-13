import { useNavigate, useParams } from 'react-router-dom'
import { FileText, Plus, ArrowLeft } from 'lucide-react'
import Projects from './Projects'
import { useProjectManagement } from '../hooks/useProjectManagement'
import { useSettings } from '../hooks/useSettings'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()

  const {
    loadInitialData,
    handleCreateProject,
    handleTemplateSelect,
    handleDeleteProject,
    handleCreateChapter,
    handleDeleteChapter,
    handleSelectProject,
    projects,
    selectedProject,
    chapters,
    projectActiveTab,
    setProjectActiveTab,
    projectAnalysisResults,
    showTemplateSelector,
    selectedPipelineTemplate,
    activePipelineId
  } = useProjectManagement()

  const { handleLoadComments, comments, handleAddComment, handleDeleteComment } = useSettings()

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const handleProjectCreated = (project) => {
    navigate(`/projects/${project.id}`)
  }

  const handleNewProject = () => {
    handleCreateProject()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToDashboard}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <FileText className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        <Projects
          projects={projects}
          selectedProject={selectedProject}
          chapters={chapters}
          projectActiveTab={projectActiveTab}
          projectAnalysisResults={projectAnalysisResults}
          showTemplateSelector={showTemplateSelector}
          selectedPipelineTemplate={selectedPipelineTemplate}
          activePipelineId={activePipelineId}
          comments={comments}
          onProjectCreated={handleProjectCreated}
          onDeleteProject={handleDeleteProject}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onSelectProject={handleSelectProject}
          onTemplateSelect={handleTemplateSelect}
          onTabChange={setProjectActiveTab}
          onLoadComments={handleLoadComments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      </div>
    </div>
  )
}
