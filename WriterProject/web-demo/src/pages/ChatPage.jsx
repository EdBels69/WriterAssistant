import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import Chat from '../components/Chat'
import { useChatHandlers } from '../hooks/useChatHandlers'
import { useSettings } from '../hooks/useSettings'

export default function ChatPage() {
  const navigate = useNavigate()

  const {
    currentInput,
    setCurrentInput,
    chatMode,
    setChatMode,
    chatMessages,
    loading
  } = useSettings()

  const { handleSendMessage, handleChat } = useChatHandlers()

  const handleBackToDashboard = () => {
    navigate('/')
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
            <MessageSquare className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">AI Chat</h1>
          </div>
        </div>

        <Chat
          isChatOpen={true}
          chatMode={chatMode}
          onChatModeChange={setChatMode}
          messages={chatMessages}
          currentInput={currentInput}
          onInputChange={setCurrentInput}
          onSendMessage={handleSendMessage}
          onChat={handleChat}
          loading={loading}
        />
      </div>
    </div>
  )
}
