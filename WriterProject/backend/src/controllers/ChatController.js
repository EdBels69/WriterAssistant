import express from 'express'
import { v4 as uuidv4 } from 'uuid'

class ChatController {
  constructor(db, glmService, wsServer) {
    this.db = db
    this.glmService = glmService
    this.wsServer = wsServer
    this.router = express.Router()
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post('/message', this.sendMessage.bind(this))
    this.router.get('/history/:sessionId', this.getHistory.bind(this))
    this.router.post('/clear/:sessionId', this.clearHistory.bind(this))
  }

  async sendMessage(req, res) {
    try {
      const { userId, projectId, sessionId, message, mode } = req.body

      if (!message) {
        return res.status(400).json({ error: 'message is required' })
      }

      const currentSessionId = sessionId || uuidv4()

      this.db.saveChatMessage(userId, projectId, currentSessionId, 'user', message)

      const history = this.db.getChatHistoryBySession(currentSessionId)
      const context = history
        .filter(msg => msg.role !== 'user' || msg.content !== message)
        .map(msg => ({ role: msg.role, content: msg.content }))

      let systemPrompt = 'Ты - профессиональный писатель и литературный консультант. Помогай пользователям с написанием текстов, созданием идей, развитием персонажей и всеми аспектами творческого письма. Отвечай на русском языке.'

      if (mode === 'creative') {
        systemPrompt = 'Ты - креативный помощник для писателей. Генерируй оригинальные идеи, помогай с сюжетами и создавай вдохновляющий контент. Будь максимально творческим и изобретательным.'
      } else if (mode === 'editor') {
        systemPrompt = 'Ты - профессиональный редактор. Проверяй текст на ошибки, улучшай стиль и структуру. Давай конструктивную критику и конкретные рекомендации по улучшению.'
      } else if (mode === 'analyst') {
        systemPrompt = 'Ты - литературный критик и аналитик. Проводи глубокий анализ текстов, выявляй сильные и слабые стороны, давай экспертные оценки.'
      }

      const result = await this.glmService.generateCompletion(message, {
        systemPrompt,
        context: context.slice(-10),
        temperature: mode === 'creative' ? 0.8 : 0.7,
        maxTokens: 1500
      })

      if (result.success) {
        const assistantMessage = this.db.saveChatMessage(
          userId,
          projectId,
          currentSessionId,
          'assistant',
          result.content
        )

        this.db.saveAIRequest(
          userId,
          projectId,
          'chat_message',
          message,
          result.content,
          result.usage?.total_tokens
        )

        this.wsServer.broadcast(userId, 'chat_message', {
          sessionId: currentSessionId,
          role: 'assistant',
          content: result.content
        })

        res.json({
          sessionId: currentSessionId,
          response: result.content,
          usage: result.usage
        })
      } else {
        res.status(500).json({ error: result.error })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getHistory(req, res) {
    try {
      const history = this.db.getChatHistoryBySession(req.params.sessionId)
      res.json(history)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async clearHistory(req, res) {
    try {
      const stmt = this.db.db.prepare('DELETE FROM chat_history WHERE session_id = ?')
      stmt.run(req.params.sessionId)
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default ChatController