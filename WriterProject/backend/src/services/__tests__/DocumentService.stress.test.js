import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentService } from '../DocumentService.js'

describe('DocumentService Stress Tests - File Upload', () => {
  let documentService
  let mockFs
  let mockChunkingService

  beforeEach(() => {
    vi.clearAllMocks()

    mockFs = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })),
      writeFile: vi.fn().mockResolvedValue(undefined),
      unlink: vi.fn().mockResolvedValue(undefined)
    }

    mockChunkingService = {
      splitTextIntoChunks: vi.fn().mockReturnValue(['chunk'])
    }

    documentService = new DocumentService({
      storageDir: '/mock/documents',
      chunkingService: mockChunkingService,
      fsModule: mockFs
    })
  })

  describe('File Size Validation', () => {
    it('должен отклонять файл > 50MB', async () => {
      const mockFile = {
        originalname: 'large.txt',
        mimetype: 'text/plain',
        size: 52 * 1024 * 1024,
        content: 'x',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(mockFile)

      expect(result).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR'
      })
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'FILE_TOO_LARGE',
            message: expect.stringContaining('лимит 50 MB')
          })
        ])
      )
    })

    it('должен принимать файл 50MB', async () => {
      const mockFile = {
        originalname: 'exact50.txt',
        mimetype: 'text/plain',
        size: 50 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(mockFile)

      expect(result.success).toBe(true)
      expect(result.metadata.storageStrategy).toBe('filesystem')
    })
  })

  describe('Total Size Validation', () => {
    it('должен отклонять загрузку если общий размер > 100MB', async () => {
      documentService.metadata.set('doc-1', {
        id: 'doc-1',
        size: 60 * 1024 * 1024,
        userId: 'user-1',
        projectId: 'project-1'
      })
      documentService.metadata.set('doc-2', {
        id: 'doc-2',
        size: 45 * 1024 * 1024,
        userId: 'user-1',
        projectId: 'project-1'
      })

      const mockFile = {
        originalname: 'new.txt',
        mimetype: 'text/plain',
        size: 10 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(mockFile)

      expect(result).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR'
      })
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'TOTAL_SIZE_EXCEEDED',
            message: expect.stringContaining('лимит 100 MB')
          })
        ])
      )
    })

    it('должен принимать загрузку если общий размер = 100MB', async () => {
      documentService.metadata.set('doc-1', {
        id: 'doc-1',
        size: 50 * 1024 * 1024,
        userId: 'user-1',
        projectId: 'project-1'
      })

      const mockFile = {
        originalname: 'new.txt',
        mimetype: 'text/plain',
        size: 50 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(mockFile)

      expect(result.success).toBe(true)
    })
  })

  describe('MIME Type Validation', () => {
    it('должен отклонять .exe файлы', async () => {
      const mockFile = {
        originalname: 'malware.exe',
        mimetype: 'application/x-msdownload',
        size: 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(mockFile)

      expect(result).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR'
      })
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'UNSUPPORTED_MIMETYPE',
            message: expect.stringContaining('неподдерживаемый формат')
          })
        ])
      )
    })

    it('должен принимать поддерживаемые MIME типы', async () => {
      const supportedMimeTypes = [
        'text/plain',
        'text/markdown',
        'application/json',
        'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      for (const mimeType of supportedMimeTypes) {
        const mockFile = {
          originalname: `test.${mimeType.split('/')[1]}`,
          mimetype: mimeType,
          size: 1024 * 1024,
          content: 'hello. world.',
          userId: 'user-1',
          projectId: 'project-1',
          documentType: 'source'
        }

        const result = await documentService.uploadDocument(mockFile)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Concurrent Uploads', () => {
    it('должен обрабатывать 10 параллельных загрузок', async () => {
      const uploadPromises = Array(10).fill(0).map((_, i) => {
        const mockFile = {
          originalname: `file${i}.txt`,
          mimetype: 'text/plain',
          size: 1024 * 1024,
          content: `hello ${i}.`,
          userId: 'user-1',
          projectId: 'project-1',
          documentType: 'source'
        }

        return documentService.uploadDocument(mockFile)
      })

      const results = await Promise.all(uploadPromises)

      expect(results).toHaveLength(10)
      expect(results.every(r => r.success)).toBe(true)
    })
  })

  describe('Memory Management', () => {
    it('должен корректно обрабатывать большие файлы без утечек памяти', async () => {
      const largeFile = {
        originalname: 'large.txt',
        mimetype: 'text/plain',
        size: 45 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(largeFile)

      expect(result.success).toBe(true)
    })

    it('должен удалять файл при deleteDocument()', async () => {
      const mockFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 6 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const uploadResult = await documentService.uploadDocument(mockFile)
      expect(uploadResult.success).toBe(true)
      expect(uploadResult.documentId).toBeTruthy()

      await documentService.deleteDocument(uploadResult.documentId)
      expect(mockFs.unlink).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('должен обрабатывать пустой файл (0 bytes)', async () => {
      const emptyFile = {
        originalname: 'empty.txt',
        mimetype: 'text/plain',
        size: 0,
        content: '',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(emptyFile)
      expect(result.success).toBe(true)
    })

    it('должен обрабатывать файл с размером точно 50MB', async () => {
      const exactSizeFile = {
        originalname: 'exact50.txt',
        mimetype: 'text/plain',
        size: 50 * 1024 * 1024,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(exactSizeFile)

      expect(result.success).toBe(true)
    })

    it('должен обрабатывать файл с размером 50MB + 1 byte', async () => {
      const overSizeFile = {
        originalname: 'over50.txt',
        mimetype: 'text/plain',
        size: 50 * 1024 * 1024 + 1,
        content: 'hello',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      const result = await documentService.uploadDocument(overSizeFile)
      expect(result.success).toBe(false)
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'FILE_TOO_LARGE' })])
      )
    })
  })

  describe('Text Chunking Integration', () => {
    it('должен разбивать большой текст на чанки', async () => {
      const mockFile = {
        originalname: 'large.txt',
        mimetype: 'text/plain',
        size: 1024,
        content: 'Sentence one. Sentence two. Sentence three.',
        userId: 'user-1',
        projectId: 'project-1',
        documentType: 'source'
      }

      mockChunkingService.splitTextIntoChunks.mockReturnValueOnce(['chunk 1', 'chunk 2'])

      const result = await documentService.uploadDocument(mockFile)

      expect(result.success).toBe(true)
      expect(mockChunkingService.splitTextIntoChunks).toHaveBeenCalledTimes(1)
      expect(result.metadata.chunkCount).toBe(2)
    })
  })
})
