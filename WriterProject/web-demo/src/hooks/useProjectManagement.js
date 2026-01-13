import { useCallback } from 'react'
import { projectsAPI } from '../api/projects'
import { statisticsAPI } from '../api/statistics'
import useAppStore from '../stores/appStore'

export const useProjectManagement = () => {
  const {
    userId,
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    chapters,
    setChapters,
    projectActiveTab,
    setProjectActiveTab,
    projectAnalysisResults,
    setProjectAnalysisResults,
    showTemplateSelector,
    setShowTemplateSelector,
    selectedPipelineTemplate,
    setSelectedPipelineTemplate,
    activePipelineId,
    setActivePipelineId,
    activeTab,
    setActiveTab,
    comments,
    setComments,
    loading,
    setLoading,
    error,
    setError
  } = useAppStore()

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsData, projectsData] = await Promise.all([
        statisticsAPI.getOverview(userId),
        projectsAPI.getAll()
      ])
      setProjects(projectsData)
      setError(null)
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Ошибка загрузки данных. Убедитесь, что backend сервер запущен.')
    } finally {
      setLoading(false)
    }
  }, [userId, setProjects, setLoading, setError])

  const loadChapters = useCallback(async (projectId) => {
    try {
      const chaptersData = await projectsAPI.getChapters(projectId)
      setChapters(chaptersData || [])
    } catch (err) {
      console.error('Error loading chapters:', err)
      setChapters([])
    }
  }, [setChapters])

  const handleCreateProject = useCallback(async () => {
    setShowTemplateSelector(true)
  }, [setShowTemplateSelector])

  const handleTemplateSelect = useCallback(async (pipeline) => {
    setShowTemplateSelector(false)
    if (!pipeline) return

    const name = prompt('Введите название проекта:')
    if (!name) return

    try {
      const createdProject = await projectsAPI.create({
        userId,
        name,
        genre: 'general',
        description: '',
        targetWords: 50000,
        pipelineType: pipeline.type
      })
      setSelectedPipelineTemplate(pipeline)
      setActivePipelineId(pipeline.id)
      setActiveTab('projects')
      if (createdProject?.id) {
        setSelectedProject(createdProject)
        await loadChapters(createdProject.id)
      }
      await loadInitialData()
      setProjectActiveTab('pipeline')
      alert(`Проект "${name}" успешно создан!`)
    } catch (err) {
      console.error('Error creating project:', err)
      alert('Ошибка создания проекта: ' + (err.message || 'Неизвестная ошибка'))
    }
  }, [userId, setSelectedPipelineTemplate, setActivePipelineId, setActiveTab, setSelectedProject, loadChapters, loadInitialData, setProjectActiveTab, setShowTemplateSelector])

  const handleDeleteProject = useCallback(async (projectId) => {
    if (!confirm('Удалить этот проект?')) return

    try {
      await projectsAPI.delete(projectId)
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
      await loadInitialData()
    } catch (err) {
      console.error('Error deleting project:', err)
      alert('Ошибка удаления проекта')
    }
  }, [selectedProject, setSelectedProject, loadInitialData])

  const handleCreateChapter = useCallback(async () => {
    const title = prompt('Введите название раздела:')
    if (!title) return

    const description = prompt('Введите описание раздела (опционально):') || ''

    try {
      const newChapter = await projectsAPI.createChapter(selectedProject.id, {
        title,
        content: description,
        orderIndex: chapters.length
      })
      await loadChapters(selectedProject.id)
      await projectsAPI.update(selectedProject.id, {
        chapters: chapters.length + 1
      })
    } catch (err) {
      console.error('Error creating chapter:', err)
      alert('Ошибка создания раздела')
    }
  }, [selectedProject, chapters, loadChapters])

  const handleDeleteChapter = useCallback(async (chapterId) => {
    if (!confirm('Удалить этот раздел?')) return

    try {
      setChapters(chapters.filter(ch => ch.id !== chapterId))
      await projectsAPI.update(selectedProject.id, {
        chapters: chapters.length - 1
      })
    } catch (err) {
      console.error('Error deleting chapter:', err)
      alert('Ошибка удаления раздела')
    }
  }, [chapters, selectedProject, setChapters])

  const handleSelectProject = useCallback(async (project) => {
    setSelectedProject(project)
    setProjectAnalysisResults([])
    if (project?.id) {
      await loadChapters(project.id)
    }
  }, [setSelectedProject, setProjectAnalysisResults, loadChapters])

  return {
    loadInitialData,
    loadChapters,
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
  }
}
