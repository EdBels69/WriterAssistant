import React, { useState } from 'react'
import { MessageSquare, Edit3, FileText } from 'lucide-react'

const EntryPoints = ({ inputMode, setInputMode, inputText, setInputText }) => {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [context, setContext] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileQuestion, setFileQuestion] = useState('')

  const handleModeChange = (mode) => {
    setInputMode(mode)
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAskQuestion = async () => {
    if (!fileQuestion.trim() || uploadedFiles.length === 0) return

    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Вопрос по загруженным файлам (${uploadedFiles.map(f => f.name).join(', ')}): ${fileQuestion}`,
          context: { fileNames: uploadedFiles.map(f => f.name) }
        })
      })

      const data = await response.json()

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        metadata: data.metadata
      }])

      setFileQuestion('')
    } catch (error) {
      console.error('Error asking question:', error)
      alert('Ошибка при задании вопроса по документам')
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')

    try {
      const response = await fetch('http://localhost:5001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          context: context
        })
      })

      const data = await response.json()

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response || data.content || 'Нет ответа от ИИ',
        timestamp: new Date().toISOString(),
        metadata: data.metadata || {}
      }

      setChatMessages(prev => [...prev, assistantMessage])

      if (data.metadata?.suggestedTools) {
        setContext(prev => ({
          ...prev,
          lastTools: data.metadata.suggestedTools
        }))
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Произошла ошибка при отправке сообщения. Попробуйте снова.',
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setChatMessages([])
    setContext({})
  }

  return (
    <div>
      <label className="block text-sm font-medium text-academic-navy-700 mb-2">Способ взаимодействия</label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => handleModeChange('chat')}
          className={`entry-mode-btn ${inputMode === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={24} />
          <span className="mode-label">Чат-идеация</span>
          <span className="mode-description">Свободный диалог для генерации идей</span>
        </button>

        <button
          onClick={() => handleModeChange('text')}
          className={`entry-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
        >
          <Edit3 size={24} />
          <span className="mode-label">Ввод текста</span>
          <span className="mode-description">Вставьте текст из Word для обработки</span>
        </button>

        <button
          onClick={() => handleModeChange('file')}
          className={`entry-mode-btn ${inputMode === 'file' ? 'active' : ''}`}
        >
          <FileText size={24} />
          <span className="mode-label">Загрузка файлов</span>
          <span className="mode-description">Загрузите PDF для анализа и вопросов</span>
        </button>
      </div>

      {inputMode === 'chat' && (
        <div className="chat-container mt-4">
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare size={32} className="mx-auto mb-2" />
                <p>Начните диалог с ИИ-ассистентом</p>
                <p className="text-sm">Задавайте вопросы, делитесь идеями, получайте рекомендации</p>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.type}`}>
                <div className="chat-message-meta">
                  {msg.type === 'user' ? 'Вы' : 'ИИ-ассистент'} • {new Date(msg.timestamp).toLocaleTimeString('ru-RU')}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.metadata?.suggestedTools && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <div className="text-xs opacity-70 mb-1">Рекомендуемые инструменты:</div>
                    {msg.metadata.suggestedTools.map((tool, idx) => (
                      <span key={idx} className="tool-suggestion">{tool}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите ваше сообщение или вопрос..."
              className="flex-1 input-field"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="btn btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare size={18} />
            </button>
          </div>

          {chatMessages.length > 0 && (
            <div className="context-panel">
              <div className="context-title">Контекст диалога</div>
              <div className="context-content">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Сообщений: {chatMessages.length}</span>
                  <button onClick={clearChat} className="text-xs text-red-600 hover:text-red-700">
                    Очистить диалог
                  </button>
                </div>
                {context.lastTools && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-600">Последние рекомендации:</div>
                    {context.lastTools.map((tool, idx) => (
                      <span key={idx} className="tool-suggestion">{tool}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {inputMode === 'text' && (
        <div className="text-input-container mt-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Вставьте текст для обработки из Word или другого редактора...

Вы можете применить к этому тексту все инструменты анализа:"
            className="textarea-field h-64"
          />

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Символов: {inputText.length}</span>
            <span>Примерно {Math.round(inputText.split(/\s+/).filter(w => w).length)} слов</span>
          </div>

          {inputText.length > 0 && (
            <div className="context-panel">
              <div className="context-title">Доступные инструменты для текста</div>
              <div>
                <span className="tool-suggestion">Структурирование идей</span>
                <span className="tool-suggestion">Извлечение ссылок</span>
                <span className="tool-suggestion">Генерация гипотез</span>
                <span className="tool-suggestion">Методология</span>
                <span className="tool-suggestion">Академический стиль</span>
              </div>
            </div>
          )}
        </div>
      )}

      {inputMode === 'file' && (
        <div className="file-input-container mt-4">
          <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-academic-teal-400 transition-colors">
            <label className="cursor-pointer block">
              <input 
                type="file" 
                accept=".txt,.md,.json,.csv,.pdf,.doc,.docx" 
                multiple
                onChange={handleFileUpload}
                className="hidden" 
              />
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Нажмите для загрузки или перетащите файлы</p>
                <p className="text-xs text-gray-400 mt-1">.txt, .md, .json, .csv, .pdf, .doc, .docx (поддерживается несколько файлов)</p>
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Загруженные файлы ({uploadedFiles.length})</span>
                <button 
                  onClick={() => setUploadedFiles([])}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Очистить все
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Задать вопрос по документам</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fileQuestion}
                  onChange={(e) => setFileQuestion(e.target.value)}
                  placeholder="Например: Какие основные выводы в этих документах?"
                  className="flex-1 input-field"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAskQuestion()
                  }}
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={!fileQuestion.trim()}
                  className="btn btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-2">
            <p>Поддерживается загрузка нескольких файлов для одновременного анализа</p>
            <p>После загрузки вы сможете задать вопросы по содержимому документов</p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="context-panel">
              <div className="context-title">Доступные инструменты для файлов</div>
              <div>
                <span className="tool-suggestion">Структурирование идей</span>
                <span className="tool-suggestion">Извлечение ссылок</span>
                <span className="tool-suggestion">Нарративный обзор</span>
                <span className="tool-suggestion">Систематический обзор</span>
                <span className="tool-suggestion">Мета-анализ</span>
                <span className="tool-suggestion">Вопросы по документу</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EntryPoints
