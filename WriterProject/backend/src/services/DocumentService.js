import fsPromises from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import TextChunkingService from './TextChunkingService.js'

export class DocumentService {
  constructor(options = {}) {
    const {
      storageDir = path.join(process.cwd(), 'data', 'documents'),
      chunkingService = new TextChunkingService(),
      fsModule = fsPromises
    } = options

    this.fs = fsModule
    this.storageDir = storageDir
    this.metadataFile = path.join(this.storageDir, 'metadata.json')
    this.chunkingService = chunkingService
    this.metadata = new Map()
    this.maxFileSize = 50 * 1024 * 1024
    this.maxTotalSize = 100 * 1024 * 1024
    this.allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    this.ready = this.init()
  }

  async init() {
    await this.ensureStorageDir()
    await this.loadMetadata()
  }

  async ensureStorageDir() {
    try {
      await this.fs.mkdir(this.storageDir, { recursive: true })
    } catch (error) {
      console.error('Error creating storage directory:', error)
    }
  }

  async loadMetadata() {
    try {
      const data = await this.fs.readFile(this.metadataFile, 'utf-8')
      const metadataArray = JSON.parse(data)
      this.metadata = new Map(metadataArray.map(m => [m.id, m]))
    } catch (error) {
    }
  }

  async saveMetadata() {
    const metadataArray = Array.from(this.metadata.values())
    await this.fs.writeFile(this.metadataFile, JSON.stringify(metadataArray, null, 2))
  }

  generateDocumentId() {
    return crypto.randomBytes(16).toString('hex')
  }

  async validateFile(fileData, currentTotalSize = 0) {
    const errors = []

    if (fileData.size > this.maxFileSize) {
      errors.push({
        field: 'size',
        message: `Файл "${fileData.originalname}" превышает лимит ${(this.maxFileSize / 1024 / 1024).toFixed(0)} MB`,
        code: 'FILE_TOO_LARGE'
      })
    }

    if (currentTotalSize + fileData.size > this.maxTotalSize) {
      errors.push({
        field: 'size',
        message: `Общий размер файлов превышает лимит ${(this.maxTotalSize / 1024 / 1024).toFixed(0)} MB`,
        code: 'TOTAL_SIZE_EXCEEDED'
      })
    }

    if (!this.allowedMimeTypes.includes(fileData.mimetype)) {
      errors.push({
        field: 'mimetype',
        message: `Файл "${fileData.originalname}" имеет неподдерживаемый формат. Допустимые: ${this.allowedMimeTypes.join(', ')}`,
        code: 'UNSUPPORTED_MIMETYPE'
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  async getTotalSize(userId, projectId) {
    await this.ready
    const documents = await this.listDocuments({ userId, projectId })
    return documents.reduce((total, doc) => total + (doc.size || 0), 0)
  }

  determineStorageStrategy(content, size) {
    if (size < 5 * 1024 * 1024) {
      return 'memory'
    } else if (size < 50 * 1024 * 1024) {
      return 'disk'
    } else {
      return 'filesystem'
    }
  }

  async uploadDocument(fileData, options = {}) {
    await this.ready
    const {
      originalname,
      mimetype,
      content,
      size,
      userId,
      projectId,
      documentType
    } = fileData

    const currentTotalSize = await this.getTotalSize(userId, projectId)
    const validation = await this.validateFile(fileData, currentTotalSize)

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      }
    }

    const documentId = this.generateDocumentId()
    const storageStrategy = this.determineStorageStrategy(content, size)

    const metadata = {
      id: documentId,
      originalname,
      mimetype,
      size,
      userId,
      projectId,
      documentType,
      storageStrategy,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      chunkCount: 0,
      hash: crypto.createHash('sha256').update(content).digest('hex')
    }

    if (storageStrategy === 'memory') {
      metadata.content = content
      await this.processDocumentContent(documentId, content, metadata)
    } else {
      const filePath = path.join(this.storageDir, `${documentId}${path.extname(originalname)}`)
      await this.fs.writeFile(filePath, content)
      metadata.filePath = filePath
      await this.processDocumentContent(documentId, content, metadata)
    }

    this.metadata.set(documentId, metadata)
    await this.saveMetadata()

    return {
      success: true,
      documentId,
      metadata
    }
  }

  async processDocumentContent(documentId, content, metadata) {
    try {
      const chunks = this.chunkingService.splitTextIntoChunks(content)
      
      metadata.chunks = chunks.map((chunk, index) => ({
        index,
        content: chunk,
        tokens: this.estimateTokens(chunk)
      }))
      metadata.chunkCount = chunks.length
      metadata.estimatedTokens = metadata.chunks.reduce((sum, c) => sum + c.tokens, 0)
      metadata.status = 'ready'

      if (metadata.storageStrategy !== 'memory') {
        delete metadata.chunks
      }
    } catch (error) {
      metadata.status = 'error'
      metadata.error = error.message
      console.error('Error processing document:', error)
    }
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4)
  }

  async getDocument(documentId) {
    await this.ready
    const metadata = this.metadata.get(documentId)
    if (!metadata) {
      throw new Error('Document not found')
    }

    if (metadata.storageStrategy === 'memory') {
      return metadata
    } else {
      const content = await this.fs.readFile(metadata.filePath, 'utf-8')
      return {
        ...metadata,
        content
      }
    }
  }

  async getDocumentContext(documentId, query, options = {}) {
    await this.ready
    const { maxTokens = 4000, topK = 5 } = options
    const metadata = this.metadata.get(documentId)
    
    if (!metadata) {
      throw new Error('Document not found')
    }

    if (metadata.storageStrategy === 'memory' && metadata.chunks) {
      return this.selectRelevantChunks(metadata.chunks, query, maxTokens, topK)
    } else {
      const content = await this.fs.readFile(metadata.filePath, 'utf-8')
      const chunks = this.chunkingService.splitTextIntoChunks(content)
      return this.selectRelevantChunks(
        chunks.map((chunk, index) => ({
          index,
          content: chunk,
          tokens: this.estimateTokens(chunk)
        })),
        query,
        maxTokens,
        topK
      )
    }
  }

  selectRelevantChunks(chunks, query, maxTokens, topK) {
    const scoredChunks = chunks.map(chunk => ({
      ...chunk,
      score: this.calculateRelevanceScore(chunk.content, query)
    }))

    const sortedChunks = scoredChunks.sort((a, b) => b.score - a.score)
    const topChunks = sortedChunks.slice(0, topK)

    let tokenCount = 0
    const selectedChunks = []

    for (const chunk of topChunks) {
      if (tokenCount + chunk.tokens <= maxTokens) {
        selectedChunks.push(chunk)
        tokenCount += chunk.tokens
      }
    }

    return {
      chunks: selectedChunks,
      totalTokens: tokenCount,
      query
    }
  }

  calculateRelevanceScore(content, query) {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()

    let score = 0
    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi')
      const matches = contentLower.match(regex)
      if (matches) {
        score += matches.length
      }
    }

    return score
  }

  async listDocuments(options = {}) {
    await this.ready
    const { userId, projectId, documentType, status } = options

    let documents = Array.from(this.metadata.values())

    if (userId) {
      documents = documents.filter(d => d.userId === userId)
    }

    if (projectId) {
      documents = documents.filter(d => d.projectId === projectId)
    }

    if (documentType) {
      documents = documents.filter(d => d.documentType === documentType)
    }

    if (status) {
      documents = documents.filter(d => d.status === status)
    }

    return documents
  }

  async deleteDocument(documentId) {
    await this.ready
    const metadata = this.metadata.get(documentId)
    if (!metadata) {
      throw new Error('Document not found')
    }

    if (metadata.filePath) {
      try {
        await this.fs.unlink(metadata.filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }

    this.metadata.delete(documentId)
    await this.saveMetadata()

    return { success: true, documentId }
  }

  async getDocumentMetadata(documentId) {
    await this.ready
    const metadata = this.metadata.get(documentId)
    if (!metadata) {
      throw new Error('Document not found')
    }
    return metadata
  }

  async updateDocumentStatus(documentId, status, additionalData = {}) {
    await this.ready
    const metadata = this.metadata.get(documentId)
    if (!metadata) {
      throw new Error('Document not found')
    }

    metadata.status = status
    Object.assign(metadata, additionalData)
    this.metadata.set(documentId, metadata)
    await this.saveMetadata()

    return metadata
  }
}

export default new DocumentService()
