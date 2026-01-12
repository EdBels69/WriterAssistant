import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Sparkles, Clock, TrendingUp } from 'lucide-react'
import Dashboard from './Dashboard'

function DashboardPage() {
  const navigate = useNavigate()

  const handleCreateProject = () => {
    navigate('/projects/new')
  }

  const handleOpenProject = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="text-slate-400">Обзор вашей писательской деятельности</p>
        </div>

        <Dashboard
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
        />
      </div>
    </div>
  )
}

export default memo(DashboardPage)
