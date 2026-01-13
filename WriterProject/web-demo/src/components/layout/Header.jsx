import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, Settings } from 'lucide-react'

export default function Header({ isConnected, setIsChatOpen, setShowSettings }) {
  const navigate = useNavigate()

  const handleChatClick = () => {
    navigate('/chat')
  }

  const handleSettingsClick = () => {
    if (setShowSettings) {
      setShowSettings(true)
    }
  }

  return (
    <header className="academic-header">
      <div className="academic-container">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-icon" aria-hidden="true">
              <BookOpen size={20} />
            </div>
            <h1 className="header-title">WriterAssistant</h1>
          </div>

          <div className="header-actions">
            <div className="connection-status">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
              <span className="status-text">
                {isConnected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleChatClick}
              className="academic-btn academic-btn-primary header-chat-btn"
              aria-label="Открыть ИИ-помощника"
            >
              <MessageSquare size={16} aria-hidden="true" />
              ИИ-помощник
            </button>
            
            <button
              type="button"
              onClick={handleSettingsClick}
              className="academic-btn academic-btn-ghost header-settings-btn"
              aria-label="Настройки"
            >
              <Settings size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .academic-header {
          background-color: var(--academic-surface);
          border-bottom: 1px solid var(--academic-border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--academic-space-md) 0;
        }
        
        .header-brand {
          display: flex;
          align-items: center;
          gap: var(--academic-space-sm);
        }
        
        .header-icon {
          color: var(--academic-blue);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .header-title {
          font-family: 'Crimson Text', serif;
          font-size: var(--academic-text-xl);
          font-weight: 600;
          margin: 0;
          color: var(--academic-text-primary);
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--academic-space-md);
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--academic-space-sm);
          padding: var(--academic-space-sm) var(--academic-space-md);
          background-color: var(--academic-surface-subtle);
          border: 1px solid var(--academic-border);
          border-radius: var(--academic-radius-md);
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--academic-gray-400);
        }
        
        .status-dot.connected {
          background-color: var(--academic-green);
        }
        
        .status-dot.disconnected {
          background-color: var(--academic-red);
        }
        
        .status-text {
          font-size: var(--academic-text-sm);
          color: var(--academic-text-secondary);
        }
        
        .header-chat-btn {
          padding: var(--academic-space-sm) var(--academic-space-lg);
        }
        
        .header-settings-btn {
          padding: var(--academic-space-sm);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .header-content {
            padding: var(--academic-space-sm) 0;
          }
          
          .header-title {
            font-size: var(--academic-text-lg);
          }
          
          .connection-status {
            display: none;
          }
          
          .header-actions {
            gap: var(--academic-space-sm);
          }
        }
      `}</style>
    </header>
  )
}