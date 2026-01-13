import React, { useState } from 'react'
import { MessageSquare, Edit3, FileText } from 'lucide-react'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const MAX_TOTAL_SIZE = 100 * 1024 * 1024
const ALLOWED_FILE_TYPES = ['.txt', '.md', '.json', '.csv', '.pdf', '.doc', '.docx']

const EntryPoints = ({ inputMode, setInputMode, inputText, setInputText, uploadedFiles: uploadedFilesProp, setUploadedFiles: setUploadedFilesProp }) => {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [context, setContext] = useState({})
  const [uploadedFilesState, setUploadedFilesState] = useState([])
  const uploadedFiles = uploadedFilesProp ?? uploadedFilesState
  const setUploadedFiles = setUploadedFilesProp ?? setUploadedFilesState
  const [fileQuestion, setFileQuestion] = useState('')
  const [fileErrors, setFileErrors] = useState([])

  const calculateTotalSize = (files) => {
    return files.reduce((total, file) => total + file.size, 0)
  }

  const validateFile = (file) => {
    const errors = []

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Файл "${file.name}" превышает лимит ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB`)
    }

    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      errors.push(`Файл "${file.name}" имеет неподдерживаемый формат. Допустимые: ${ALLOWED_FILE_TYPES.join(', ')}`)
    }

    return errors
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newErrors = []

    const currentTotalSize = calculateTotalSize(uploadedFiles)
    const newFilesTotalSize = calculateTotalSize(files)

    if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE) {
      newErrors.push(`Общий размер файлов превышает лимит ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB`)
      setFileErrors(newErrors)
      return
    }

    const validFiles = []
    files.forEach(file => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors)
      } else {
        validFiles.push(file)
      }
    })

    if (newErrors.length > 0) {
      setFileErrors(newErrors)
      setTimeout(() => setFileErrors([]), 5000)
    }

    if (validFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...validFiles])
    }
  }

  const handleModeChange = (mode) => {
    setInputMode(mode)
  }

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
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
      <label className="block text-sm font-medium text-academic-navy-700 mb-2" id="interaction-mode-label">Способ взаимодействия</label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4" role="radiogroup" aria-labelledby="interaction-mode-label">
        <button
          type="button"
          onClick={() => handleModeChange('chat')}
          className={`entry-mode-btn ${inputMode === 'chat' ? 'active' : ''}`}
          role="radio"
          aria-checked={inputMode === 'chat'}
          aria-label="Режим чат-идеации"
        >
          <MessageSquare size={24} aria-hidden="true" />
          <span className="mode-label">Чат-идеация</span>
          <span className="mode-description">Свободный диалог для генерации идей</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('text')}
          className={`entry-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          role="radio"
          aria-checked={inputMode === 'text'}
          aria-label="Режим ввода текста"
        >
          <Edit3 size={24} aria-hidden="true" />
          <span className="mode-label">Ввод текста</span>
          <span className="mode-description">Вставьте текст из Word для обработки</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('file')}
          className={`entry-mode-btn ${inputMode === 'file' ? 'active' : ''}`}
          role="radio"
          aria-checked={inputMode === 'file'}
          aria-label="Режим загрузки файлов"
        >
          <FileText size={24} aria-hidden="true" />
          <span className="mode-label">Загрузка файлов</span>
          <span className="mode-description">Загрузите PDF для анализа и вопросов</span>
        </button>
      </div>

      {inputMode === 'chat' && (
        <div className="chat-container mt-4">
          <div className="chat-messages" role="log" aria-live="polite" aria-atomic="false" aria-label="Чат с ИИ-ассистентом">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare size={32} className="mx-auto mb-2" aria-hidden="true" />
                <p>Начните диалог с ИИ-ассистентом</p>
                <p className="text-sm">Задавайте вопросы, делитесь идеями, получайте рекомендации</p>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.type}`} role="article" aria-label={`${msg.type === 'user' ? 'Сообщение от вас' : 'Сообщение от ИИ-ассистента'} от ${new Date(msg.timestamp).toLocaleTimeString('ru-RU')}`}>
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
              aria-label="Введите сообщение для ИИ-ассистента"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="btn btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Отправить сообщение"
            >
              <MessageSquare size={18} aria-hidden="true" />
            </button>
          </div>

          {chatMessages.length > 0 && (
            <div className="context-panel" role="region" aria-label="Информация о диалоге">
              <div className="context-title">Контекст диалога</div>
              <div className="context-content">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Сообщений: {chatMessages.length}</span>
                  <button type="button" onClick={clearChat} className="text-xs text-red-600 hover:text-red-700" aria-label="Очистить все сообщения в чате">
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
            aria-label="Текстовое поле для ввода и обработки текста"
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
          <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-academic-teal-400 transition-colors" role="region" aria-label="Зона загрузки файлов">
            <label className="cursor-pointer block">
              <input 
                type="file" 
                accept=".txt,.md,.json,.csv,.pdf,.doc,.docx" 
                multiple
                onChange={handleFileUpload}
                className="hidden" 
                aria-label="Загрузить файлы / Upload files"
              />
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 text-gray-400" aria-hidden="true" />
                <p className="text-sm text-gray-600">Нажмите для загрузки или перетащите файлы</p>
                <p className="text-xs text-gray-400 mt-1">.txt, .md, .json, .csv, .pdf, .doc, .docx (поддерживается несколько файлов)</p>
              </div>
            </label>
          </div>

          {fileErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
              <div className="flex items-start gap-2">
                <span className="text-red-600">⚠️</span>
                <div className="flex-1">
                  <div className="font-medium text-red-800 text-sm">Ошибки при загрузке файлов</div>
                  <ul className="mt-2 space-y-1">
                    {fileErrors.map((error, idx) => (
                      <li key={idx} className="text-xs text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setFileErrors([])}
                  className="text-red-600 hover:text-red-700 text-sm"
                  aria-label="Закрыть сообщения об ошибках"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

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
              <div className="space-y-2" role="list" aria-label="Загруженные файлы">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded" role="listitem">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" aria-hidden="true" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Удалить файл ${file.name}`}
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
