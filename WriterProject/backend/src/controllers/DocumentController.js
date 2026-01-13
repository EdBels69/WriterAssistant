import express from 'express'
import multer from 'multer'
import path from 'path'
import DocumentService from '../services/DocumentService.js'
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js'
import { validateBody, documentUploadValidationSchema, documentStatusValidationSchema } from '../middleware/validation.js'

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

    this.router.post('/upload', upload.single('file'), validateBody(documentUploadValidationSchema), asyncHandler(this.handleUpload.bind(this)))
    this.router.get('/', asyncHandler(this.handleList.bind(this)))
    this.router.get('/:documentId', asyncHandler(this.handleGet.bind(this)))
    this.router.get('/:documentId/context', asyncHandler(this.handleGetContext.bind(this)))
    this.router.get('/:documentId/metadata', asyncHandler(this.handleGetMetadata.bind(this)))
    this.router.delete('/:documentId', asyncHandler(this.handleDelete.bind(this)))
    this.router.patch('/:documentId/status', validateBody(documentStatusValidationSchema), asyncHandler(this.handleUpdateStatus.bind(this)))
  }

  async handleUpload(req, res) {
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
  }

  async handleList(req, res) {
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
  }

  async handleGet(req, res) {
    const documentId = req.params.documentId
    const document = await DocumentService.getDocument(documentId)

    res.json({
      success: true,
      document
    })
  }

  async handleGetContext(req, res) {
    const documentId = req.params.documentId
    const { query, maxTokens, topK } = req.query

    const context = await DocumentService.getDocumentContext(documentId, query, {
      maxTokens: maxTokens ? parseInt(maxTokens) : 4000,
      topK: topK ? parseInt(topK) : 5
    })

    res.json({
      success: true,
      context
    })
  }

  async handleGetMetadata(req, res) {
    const documentId = req.params.documentId
    const metadata = await DocumentService.getDocumentMetadata(documentId)

    res.json({
      success: true,
      metadata
    })
  }

  async handleDelete(req, res) {
    const documentId = req.params.documentId
    await DocumentService.deleteDocument(documentId)

    res.json({
      success: true,
      message: 'Document deleted successfully'
    })
  }

  async handleUpdateStatus(req, res) {
    const documentId = req.params.documentId
    const { status, ...additionalData } = req.body

    const metadata = await DocumentService.updateDocumentStatus(
      documentId,
      status,
      additionalData
    )

    res.json({
      success: true,
      metadata
    })
  }
}

export default DocumentController
