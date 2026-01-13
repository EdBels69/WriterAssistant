import express from 'express'
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js'
import { validateBody, exportTextValidationSchema, exportProjectValidationSchema } from '../middleware/validation.js'

class ExportController {
  constructor(exportService) {
    this.router = express.Router()
    this.exportService = exportService
    this.routes()
  }

  routes() {
    this.router.post('/text/:format', validateBody(exportTextValidationSchema), asyncHandler(this.exportText.bind(this)))
    this.router.post('/project/:format', validateBody(exportProjectValidationSchema), asyncHandler(this.exportProject.bind(this)))
  }

  async exportText(req, res) {
    const { format } = req.params
    const { text, title } = req.body

    let buffer

    switch (format) {
      case 'pdf':
        buffer = await this.exportService.exportToPDF(text, { title })
        break
      case 'docx':
        buffer = await this.exportService.exportToDOCX(text, { title })
        break
      case 'txt':
        buffer = await this.exportService.exportToTXT(text, { title })
        break
    }

    const contentType = this.exportService.getContentType(format)
    const extension = this.exportService.getFileExtension(format)
    const filename = `${title || 'document'}${extension}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  }

  async exportProject(req, res) {
    const { format } = req.params
    const { project } = req.body

    let buffer

    switch (format) {
      case 'pdf':
        buffer = await this.exportService.exportProjectToPDF(project)
        break
      case 'docx':
        buffer = await this.exportService.exportProjectToDOCX(project)
        break
      case 'txt':
        buffer = await this.exportService.exportProjectToTXT(project)
        break
    }

    const contentType = this.exportService.getContentType(format)
    const extension = this.exportService.getFileExtension(format)
    const filename = `${project.name || 'project'}${extension}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    res.send(buffer)
  }
}

export default ExportController
