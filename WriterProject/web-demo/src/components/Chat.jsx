import { Sparkles, Brain, Trash2, FileText } from 'lucide-react'
import { debounce } from '../utils/debounce'

export default function Chat({
  isChatOpen,
  chatMode,
  setChatMode,
  chatMessages,
  currentInput,
  setCurrentInput,
  handleSendMessage,
  handleFileUpload,
  setIsChatOpen
}) {
  const debouncedSetCurrentInput = debounce(setCurrentInput, 300)

  if (!isChatOpen) return null

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[480px] h-[600px] bg-white rounded-t-2xl shadow-2xl flex flex-col z-50" role="dialog" aria-label="Чат с ИИ-помощником">
      <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-purple-600 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <div>
              <h3 className="font-bold text-white">ИИ-помощник</h3>
              <p className="text-xs text-white/80">Powered by GLM-4.7</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            aria-label="Закрыть чат"
          >
            <Trash2 size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex border-b border-white/20 mt-4" role="tablist">
          {[
            { mode: 'creative', label: 'Креативный' },
            { mode: 'editor', label: 'Редактор' },
            { mode: 'analyst', label: 'Аналитик' }
          ].map((item) => (
            <button
              key={item.mode}
              type="button"
              onClick={() => setChatMode(item.mode)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg ${
                chatMode === item.mode
                  ? 'bg-white text-primary-700'
                  : 'text-white/80 hover:bg-white/10'
              }`}
              role="tab"
              aria-selected={chatMode === item.mode}
              aria-controls="chat-content"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="chat-content"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        role="tabpanel"
        aria-live="polite"
        aria-atomic="true"
      >
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-[80%] space-y-2">
              {message.thinking && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-600 font-semibold mb-1 flex items-center gap-1">
                    <Brain size={12} aria-hidden="true" />
                    Рассуждение
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.thinking}</p>
                </div>
              )}
              <div
                className={`p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors">
            <input
              type="file"
              accept=".txt,.md,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Загрузить файл в чат"
            />
            <FileText size={20} aria-hidden="true" />
          </label>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => debouncedSetCurrentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Напишите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Поле для ввода сообщения"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            aria-label="Отправить сообщение"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  )
}
