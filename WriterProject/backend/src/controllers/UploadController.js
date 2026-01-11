import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js'

class UploadController {
  constructor() {
    this.router = express.Router()
    this.uploadDir = path.join(process.cwd(), 'data', 'uploads')
    this.routes()
    this.ensureUploadDir()
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true })
    } catch (error) {
      console.error('Error creating upload directory:', error)
    }
  }

  routes() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir)
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
      }
    })

    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.txt', '.md', '.json', '.csv']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedTypes.includes(ext)) {
          cb(null, true)
        } else {
          cb(new Error('Только текстовые файлы (.txt, .md, .json, .csv) разрешены'))
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024
      }
    })

    this.router.post('/', upload.single('file'), asyncHandler(this.handleUpload.bind(this)))
    this.router.get('/:filename', asyncHandler(this.handleDownload.bind(this)))
    this.router.delete('/:filename', asyncHandler(this.handleDelete.bind(this)))
    this.router.get('/', asyncHandler(this.handleList.bind(this)))
  }

  async handleUpload(req, res) {
    if (!req.file) {
      throw new Error('Файл не загружен')
    }

    const filePath = req.file.path
    const content = await fs.readFile(filePath, 'utf-8')

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        content: content
      }
    })
  }

  async handleDownload(req, res) {
    const filename = req.params.filename
    const filePath = path.join(this.uploadDir, filename)

    try {
      await fs.access(filePath)
    } catch (error) {
      throw new NotFoundError('File not found')
    }

    res.download(filePath)
  }

  async handleDelete(req, res) {
    const filename = req.params.filename
    const filePath = path.join(this.uploadDir, filename)

    try {
      await fs.access(filePath)
    } catch (error) {
      throw new NotFoundError('File not found')
    }

    await fs.unlink(filePath)
    res.json({ success: true, message: 'Файл удален' })
  }

  async handleList(req, res) {
    const files = await fs.readdir(this.uploadDir)
    const fileInfos = []

    for (const filename of files) {
      const filePath = path.join(this.uploadDir, filename)
      const stats = await fs.stat(filePath)
      fileInfos.push({
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      })
    }

    res.json({ success: true, files: fileInfos })
  }
}

export default UploadController
