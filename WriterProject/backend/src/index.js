import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from './database/Database.js'
import GLMService from './services/GLMService.js'
import ExportService from './services/ExportService.js'
import ProjectController from './controllers/ProjectController.js'
import ChatController from './controllers/ChatController.js'
import StatisticsController from './controllers/StatisticsController.js'
import AIController from './controllers/AIController.js'
import ExportController from './controllers/ExportController.js'
import CommentsController from './controllers/CommentsController.js'
import UploadController from './controllers/UploadController.js'
import DocumentController from './controllers/DocumentController.js'
import WebSocketServer from './websocket/WebSocketServer.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { aiLimiter, apiLimiter, uploadLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true
}))
app.use(express.json())

const db = new Database(join(__dirname, '../data/writer-assistant.db'))
const glmService = new GLMService(process.env.GLM_API_KEY)
const exportService = new ExportService()
const wsServer = new WebSocketServer()

const projectController = new ProjectController(db, glmService)
const chatController = new ChatController(db, glmService, wsServer)
const statisticsController = new StatisticsController(db)
const aiController = new AIController(glmService)
const exportController = new ExportController(exportService)
const commentsController = new CommentsController(db)
const uploadController = new UploadController()
const documentController = new DocumentController()

app.use('/api/projects', apiLimiter, projectController.router)
app.use('/api/chat', apiLimiter, chatController.router)
app.use('/api/statistics', apiLimiter, statisticsController.router)
app.use('/api/ai', aiLimiter, aiController.router)
app.use('/api/export', apiLimiter, exportController.router)
app.use('/api/comments', apiLimiter, commentsController.router)
app.use('/api/upload', uploadLimiter, uploadController.router)
app.use('/api/documents', apiLimiter, documentController.router)
app.use('/api/metrics', apiLimiter, metricsRouter)
app.use('/api/self-test', apiLimiter, selfTestRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(notFound)
app.use(errorHandler)

async function startServer() {
  try {
    await db.init()
    
    const server = app.listen(PORT, () => {
      console.log(`WriterAssistant Backend running on port ${PORT}`)
      console.log(`GLM-4.7 Integration: ${process.env.GLM_API_KEY ? 'Configured' : 'Not configured'}`)
    })
    
    wsServer.start(server)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app