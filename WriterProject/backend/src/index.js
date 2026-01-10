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

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://192.168.0.139:3001', 'http://192.168.0.139:3002', 'http://198.18.0.1:3001', 'http://198.18.0.1:3002'],
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

app.use('/api/projects', projectController.router)
app.use('/api/chat', chatController.router)
app.use('/api/statistics', statisticsController.router)
app.use('/api/ai', aiController.router)
app.use('/api/export', exportController.router)
app.use('/api/comments', commentsController.router)
app.use('/api/upload', uploadController.router)
app.use('/api/documents', documentController.router)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

async function startServer() {
  try {
    await db.init()
    console.log('Database initialized successfully')
    
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