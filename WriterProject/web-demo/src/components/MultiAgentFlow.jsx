import React, { useState, useEffect } from 'react'
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  ArrowDown,
  Activity,
  Sparkles,
  BookOpen,
  Edit3,
  BarChart3,
  Loader2
} from 'lucide-react'

const agentConfig = {
  researcher: {
    name: 'Исследователь',
    icon: Activity,
    color: 'bg-blue-500',
    description: 'Анализирует источники и выдвигает гипотезы'
  },
  critic: {
    name: 'Критик',
    icon: Sparkles,
    color: 'bg-amber-500',
    description: 'Оценивает качество и выявляет ошибки'
  },
  synthesizer: {
    name: 'Синтезатор',
    icon: BookOpen,
    color: 'bg-emerald-500',
    description: 'Интегрирует результаты и формулирует выводы'
  },
  methodologist: {
    name: 'Методолог',
    icon: Edit3,
    color: 'bg-purple-500',
    description: 'Проверяет методологические стандарты'
  },
  statistician: {
    name: 'Статистик',
    icon: BarChart3,
    color: 'bg-rose-500',
    description: 'Оценивает статистическую значимость'
  }
}

const MultiAgentFlow = ({ agents, onAgentClick }) => {
  const [activeAgents, setActiveAgents] = useState([])
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const getAgentStatus = (agentName) => {
    const agent = activeAgents.find((a) => a.name === agentName)
    return agent?.status || 'idle'
  }

  const getAgentIcon = (agentName) => {
    const status = getAgentStatus(agentName)
    const config = agentConfig[agentName] || { icon: Users }
    const Icon = config.icon

    if (status === 'processing') return <Loader2 size={24} className="animate-spin" />
    if (status === 'completed') return <CheckCircle size={24} />
    if (status === 'error') return <Activity size={24} />
    return <Icon size={24} />
  }

  const simulateAgentInteraction = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    setMessages([])

    const sequence = agents.length > 0 ? agents : ['researcher', 'critic', 'synthesizer']

    for (let i = 0; i < sequence.length; i++) {
      const agentName = sequence[i]
      setActiveAgents((prev) => [...prev, { name: agentName, status: 'processing' }])
      
      const config = agentConfig[agentName]
      
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const newMessage = {
        id: Date.now(),
        agent: agentName,
        content: `[${config.name}]: Обработка данных...`,
        timestamp: new Date().toISOString()
      }
      
      setMessages((prev) => [...prev, newMessage])
      
      setActiveAgents((prev) =>
        prev.map((a) => (a.name === agentName ? { ...a, status: 'completed' } : a))
      )
    }

    setIsProcessing(false)
  }

  const renderConnectionLines = () => {
    const lines = []
    const sequence = agents.length > 0 ? agents : ['researcher', 'critic', 'synthesizer']

    for (let i = 0; i < sequence.length - 1; i++) {
      const currentAgent = sequence[i]
      const nextAgent = sequence[i + 1]
      lines.push(
        <div key={`${currentAgent}-${nextAgent}`} className="flex justify-center">
          <ArrowRight className="text-gray-400 my-2" size={24} />
        </div>
      )
    }

    return lines
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-academic-navy-100 rounded-lg">
            <Users size={20} className="text-academic-navy-600" />
          </div>
          <div>
            <h3 className="font-bold text-academic-navy-900 text-lg">Multi-Agent Pipeline</h3>
            <p className="text-sm text-academic-navy-600">
              {agents.length > 0 ? `${agents.length} агентов` : '3 агента (по умолчанию)'}
            </p>
          </div>
        </div>

        <button
          onClick={simulateAgentInteraction}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-academic-teal-600 text-white rounded-lg hover:bg-academic-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isProcessing ? 'Выполняется...' : 'Запустить'}
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col items-center gap-2">
          {agents.length > 0 ? (
            agents.map((agentName, index) => {
              const config = agentConfig[agentName]
              const status = getAgentStatus(agentName)
              
              return (
                <React.Fragment key={agentName}>
                  <div
                    onClick={() => onAgentClick?.(agentName)}
                    className={`w-full p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      status === 'processing' ? 'border-blue-300 bg-blue-50' :
                      status === 'completed' ? 'border-green-300 bg-green-50' :
                      status === 'error' ? 'border-red-300 bg-red-50' :
                      'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${config.color} text-white`}>
                        {getAgentIcon(agentName)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-academic-navy-900">{config.name}</h4>
                          {status !== 'idle' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              status === 'processing' ? 'bg-blue-100 text-blue-700' :
                              status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {status === 'processing' ? 'Обработка...' :
                               status === 'completed' ? 'Завершено' :
                               'Ошибка'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>

                      <MessageSquare size={20} className="text-gray-400" />
                    </div>
                  </div>
                  
                  {index < agents.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowDown className="text-gray-400 my-2" size={20} />
                    </div>
                  )}
                </React.Fragment>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>Нет активных агентов</p>
              <p className="text-sm">Запустите pipeline для начала работы</p>
            </div>
          )}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-academic-navy-900 mb-4">Сообщения агентов</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((message) => {
              const config = agentConfig[message.agent]
              return (
                <div key={message.id} className="flex gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.color} text-white shrink-0`}>
                    {config.icon({ size: 16 })}
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{config.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MultiAgentFlow
