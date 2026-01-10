import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'

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

    this.router.post('/', upload.single('file'), this.handleUpload.bind(this))
    this.router.get('/:filename', this.handleDownload.bind(this))
    this.router.delete('/:filename', this.handleDelete.bind(this))
    this.router.get('/', this.handleList.bind(this))
  }

  async handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' })
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
    } catch (error) {
      console.error('Error uploading file:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleDownload(req, res) {
    try {
      const filename = req.params.filename
      const filePath = path.join(this.uploadDir, filename)

      await fs.access(filePath)
      res.download(filePath)
    } catch (error) {
      console.error('Error downloading file:', error)
      res.status(404).json({ error: 'Файл не найден' })
    }
  }

  async handleDelete(req, res) {
    try {
      const filename = req.params.filename
      const filePath = path.join(this.uploadDir, filename)

      await fs.unlink(filePath)
      res.json({ success: true, message: 'Файл удален' })
    } catch (error) {
      console.error('Error deleting file:', error)
      res.status(404).json({ error: 'Файл не найден' })
    }
  }

  async handleList(req, res) {
    try {
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
    } catch (error) {
      console.error('Error listing files:', error)
      res.status(500).json({ error: error.message })
    }
  }
}

export default UploadController
