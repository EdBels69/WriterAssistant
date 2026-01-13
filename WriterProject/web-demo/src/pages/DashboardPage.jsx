import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Sparkles, Clock, TrendingUp } from 'lucide-react'
import Dashboard from './Dashboard'

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleCreateProject = () => {
    navigate('/projects/new')
  }

  const handleOpenProject = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  return (
    <div className="academic-dashboard">
      <div className="academic-container">
        <header className="academic-dashboard-header">
          <div className="academic-dashboard-title">
            <LayoutDashboard size={24} className="academic-dashboard-icon" aria-hidden="true" />
            <h1 className="academic-heading-1">Панель управления</h1>
          </div>
          <p className="academic-text-lead">Обзор вашей писательской деятельности</p>
        </header>

        <Dashboard
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
        />
      </div>

      <style jsx>{`
        .academic-dashboard {
          min-height: 100vh;
          background-color: var(--academic-paper);
          padding: var(--academic-space-xl) 0;
        }

        .academic-dashboard-header {
          margin-bottom: var(--academic-space-xl);
          text-align: center;
        }

        .academic-dashboard-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--academic-space-sm);
          margin-bottom: var(--academic-space-sm);
        }

        .academic-dashboard-icon {
          color: var(--academic-blue);
        }

        .academic-heading-1 {
          font-family: var(--academic-font-serif);
          font-size: var(--academic-font-size-3xl);
          font-weight: 600;
          color: var(--academic-text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .academic-text-lead {
          font-family: var(--academic-font-sans);
          font-size: var(--academic-font-size-lg);
          color: var(--academic-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .academic-dashboard {
            padding: var(--academic-space-lg) 0;
          }

          .academic-dashboard-header {
            margin-bottom: var(--academic-space-lg);
          }

          .academic-heading-1 {
            font-size: var(--academic-font-size-2xl);
          }

          .academic-text-lead {
            font-size: var(--academic-font-size-base);
          }

          .academic-dashboard-title {
            flex-direction: column;
            gap: var(--academic-space-xs);
          }
        }

        @media (max-width: 480px) {
          .academic-heading-1 {
            font-size: var(--academic-font-size-xl);
          }

          .academic-text-lead {
            font-size: var(--academic-font-size-sm);
          }
        }
      `}</style>
    </div>
  )
}