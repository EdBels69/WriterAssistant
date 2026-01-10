import express from 'express'
import multer from 'multer'
import path from 'path'
import DocumentService from '../services/DocumentService.js'

class DocumentController {
  constructor() {
    this.router = express.Router()
    this.routes()
  }

  routes() {
    const storage = multer.memoryStorage()
    
    const upload = multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024
      }
    })

    this.router.post('/upload', upload.single('file'), this.handleUpload.bind(this))
    this.router.get('/', this.handleList.bind(this))
    this.router.get('/:documentId', this.handleGet.bind(this))
    this.router.get('/:documentId/context', this.handleGetContext.bind(this))
    this.router.get('/:documentId/metadata', this.handleGetMetadata.bind(this))
    this.router.delete('/:documentId', this.handleDelete.bind(this))
    this.router.patch('/:documentId/status', this.handleUpdateStatus.bind(this))
  }

  async handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' })
      }

      const { userId, projectId, documentType } = req.body

      const content = req.file.buffer.toString('utf-8')

      const result = await DocumentService.uploadDocument({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        content,
        size: req.file.size,
        userId,
        projectId,
        documentType
      })

      res.json(result)
    } catch (error) {
      console.error('Error uploading document:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleList(req, res) {
    try {
      const { userId, projectId, documentType, status } = req.query

      const documents = await DocumentService.listDocuments({
        userId,
        projectId,
        documentType,
        status
      })

      res.json({
        success: true,
        documents,
        count: documents.length
      })
    } catch (error) {
      console.error('Error listing documents:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleGet(req, res) {
    try {
      const documentId = req.params.documentId
      const document = await DocumentService.getDocument(documentId)

      res.json({
        success: true,
        document
      })
    } catch (error) {
      console.error('Error getting document:', error)
      res.status(404).json({ error: error.message })
    }
  }

  async handleGetContext(req, res) {
    try {
      const documentId = req.params.documentId
      const { query, maxTokens, topK } = req.query

      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' })
      }

      const context = await DocumentService.getDocumentContext(documentId, query, {
        maxTokens: maxTokens ? parseInt(maxTokens) : 4000,
        topK: topK ? parseInt(topK) : 5
      })

      res.json({
        success: true,
        context
      })
    } catch (error) {
      console.error('Error getting document context:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleGetMetadata(req, res) {
    try {
      const documentId = req.params.documentId
      const metadata = await DocumentService.getDocumentMetadata(documentId)

      res.json({
        success: true,
        metadata
      })
    } catch (error) {
      console.error('Error getting document metadata:', error)
      res.status(404).json({ error: error.message })
    }
  }

  async handleDelete(req, res) {
    try {
      const documentId = req.params.documentId
      await DocumentService.deleteDocument(documentId)

      res.json({
        success: true,
        message: 'Document deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      res.status(404).json({ error: error.message })
    }
  }

  async handleUpdateStatus(req, res) {
    try {
      const documentId = req.params.documentId
      const { status, ...additionalData } = req.body

      if (!status) {
        return res.status(400).json({ error: 'Status is required' })
      }

      const metadata = await DocumentService.updateDocumentStatus(
        documentId,
        status,
        additionalData
      )

      res.json({
        success: true,
        metadata
      })
    } catch (error) {
      console.error('Error updating document status:', error)
      res.status(404).json({ error: error.message })
    }
  }
}

export default DocumentController
