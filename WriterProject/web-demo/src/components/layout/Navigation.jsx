import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, BookOpen, BarChart3, Activity, Edit3, Code, Brain, Sparkles, MessageSquare } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Обзор', icon: Activity, path: '/' },
  { id: 'projects', label: 'Проекты', icon: BookOpen, path: '/projects' },
  { id: 'tools', label: 'Инструменты', icon: Sparkles, path: '/tools' },
  { id: 'chat', label: 'Чат', icon: MessageSquare, path: '/chat' }
]

const dropdownItems = {
  analysis: {
    label: 'Инструменты анализа',
    items: [
      { id: 'data-analysis', label: 'Анализ данных', icon: Sparkles },
      { id: 'literature-review', label: 'Обзор литературы', icon: BookOpen },
      { id: 'statistical-analysis', label: 'Статистический анализ', icon: BarChart3 },
      { id: 'style-formatting', label: 'Стиль и форматирование', icon: Edit3 }
    ]
  },
  tools: {
    label: 'Инструменты',
    items: [
      { id: 'code-tools', label: 'Код', icon: Code },
      { id: 'multi-agent', label: 'Мультиагентный ИИ', icon: Brain }
    ]
  }
}

export default function Navigation({ activeTab, activeDropdown, activeToolScreen, setActiveTab, setActiveDropdown, setActiveToolScreen }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavClick = (path) => {
    navigate(path)
    setActiveTab(path.replace('/', '') || 'dashboard')
    setActiveToolScreen(null)
    setActiveDropdown(null)
  }

  const handleDropdownClick = (key) => {
    setActiveDropdown(activeDropdown === key ? null : key)
    if (activeDropdown !== key) {
      navigate('/tools')
    }
  }

  const handleDropdownItemClick = (itemId) => {
    setActiveToolScreen(itemId)
    setActiveDropdown(null)
  }

  return (
    <nav className="academic-nav" role="navigation" aria-label="Основная навигация">
      <div className="academic-nav-container">
        <ul className="academic-nav-list" role="tablist">
          {navItems.map((item) => (
            <li key={item.id} className="academic-nav-item">
              <button
                type="button"
                role="tab"
                aria-selected={location.pathname === item.path}
                aria-controls={`${item.id}-panel`}
                onClick={() => handleNavClick(item.path)}
                className={`academic-nav-button ${
                  location.pathname === item.path ? 'academic-nav-button-active' : ''
                }`}
              >
                <item.icon size={16} className="academic-nav-icon" aria-hidden="true" />
                <span className="academic-nav-text">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="academic-nav-dropdowns">
          {Object.entries(dropdownItems).map(([key, dropdown]) => (
            <div key={key} className="academic-nav-dropdown">
              <button
                type="button"
                onClick={() => handleDropdownClick(key)}
                aria-expanded={activeDropdown === key}
                aria-haspopup="true"
                className={`academic-nav-button academic-nav-dropdown-button ${
                  activeDropdown === key || activeToolScreen ? 'academic-nav-button-active' : ''
                }`}
              >
                <span className="academic-nav-text">{dropdown.label}</span>
                {activeDropdown === key ? (
                  <ChevronDown size={14} className="academic-nav-dropdown-icon" aria-hidden="true" />
                ) : (
                  <ChevronRight size={14} className="academic-nav-dropdown-icon" aria-hidden="true" />
                )}
              </button>

              {activeDropdown === key && (
                <div className="academic-nav-dropdown-menu" role="menu">
                  {dropdown.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleDropdownItemClick(item.id)}
                      className="academic-nav-dropdown-item"
                    >
                      <item.icon size={16} className="academic-nav-dropdown-item-icon" aria-hidden="true" />
                      <span className="academic-nav-dropdown-item-text">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .academic-nav {
          margin-top: var(--academic-space-md);
          border-bottom: 1px solid var(--academic-gray-200);
          background-color: var(--academic-white);
        }

        .academic-nav-container {
          max-width: var(--academic-container-max-width);
          margin: 0 auto;
          padding: 0 var(--academic-space-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--academic-space-lg);
        }

        .academic-nav-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: var(--academic-space-xs);
        }

        .academic-nav-item {
          position: relative;
        }

        .academic-nav-button {
          display: flex;
          align-items: center;
          gap: var(--academic-space-xs);
          padding: var(--academic-space-sm) var(--academic-space-md);
          font-family: var(--academic-font-sans);
          font-size: var(--academic-font-size-sm);
          font-weight: 500;
          line-height: 1;
          color: var(--academic-text-secondary);
          background: none;
          border: none;
          border-radius: var(--academic-radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .academic-nav-button:hover {
          color: var(--academic-text-primary);
          background-color: var(--academic-gray-50);
        }

        .academic-nav-button:focus {
          outline: 2px solid var(--academic-blue);
          outline-offset: 2px;
        }

        .academic-nav-button-active {
          color: var(--academic-blue);
          background-color: var(--academic-blue-50);
        }

        .academic-nav-button-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--academic-blue);
        }

        .academic-nav-icon {
          color: currentColor;
        }

        .academic-nav-text {
          font-weight: inherit;
        }

        .academic-nav-dropdowns {
          display: flex;
          gap: var(--academic-space-sm);
        }

        .academic-nav-dropdown {
          position: relative;
        }

        .academic-nav-dropdown-button {
          padding-right: var(--academic-space-lg);
        }

        .academic-nav-dropdown-icon {
          position: absolute;
          right: var(--academic-space-sm);
          top: 50%;
          transform: translateY(-50%);
          color: var(--academic-text-tertiary);
          transition: transform 0.2s ease;
        }

        .academic-nav-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 240px;
          background-color: var(--academic-white);
          border: 1px solid var(--academic-gray-200);
          border-radius: var(--academic-radius-md);
          box-shadow: var(--academic-shadow-md);
          z-index: 50;
          margin-top: var(--academic-space-xs);
          padding: var(--academic-space-xs) 0;
        }

        .academic-nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--academic-space-sm);
          width: 100%;
          padding: var(--academic-space-sm) var(--academic-space-md);
          font-family: var(--academic-font-sans);
          font-size: var(--academic-font-size-sm);
          color: var(--academic-text-primary);
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .academic-nav-dropdown-item:hover {
          background-color: var(--academic-gray-50);
        }

        .academic-nav-dropdown-item:focus {
          outline: 2px solid var(--academic-blue);
          outline-offset: -2px;
        }

        .academic-nav-dropdown-item-icon {
          color: var(--academic-blue);
          flex-shrink: 0;
        }

        .academic-nav-dropdown-item-text {
          flex: 1;
        }

        @media (max-width: 768px) {
          .academic-nav-container {
            flex-direction: column;
            align-items: stretch;
            gap: var(--academic-space-sm);
            padding: 0 var(--academic-space-sm);
          }

          .academic-nav-list {
            justify-content: space-around;
            gap: 0;
          }

          .academic-nav-button {
            flex-direction: column;
            gap: var(--academic-space-xs);
            padding: var(--academic-space-sm);
            font-size: var(--academic-font-size-xs);
          }

          .academic-nav-text {
            font-size: var(--academic-font-size-xs);
          }

          .academic-nav-dropdowns {
            justify-content: center;
            flex-wrap: wrap;
          }

          .academic-nav-dropdown-menu {
            left: 50%;
            transform: translateX(-50%);
            min-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .academic-nav-list {
            flex-wrap: wrap;
            justify-content: center;
          }

          .academic-nav-item {
            flex: 1;
            min-width: 80px;
          }

          .academic-nav-dropdowns {
            flex-direction: column;
            align-items: stretch;
          }

          .academic-nav-dropdown-button {
            padding-right: var(--academic-space-md);
            justify-content: center;
          }
        }
      `}</style>
    </nav>
  )
}