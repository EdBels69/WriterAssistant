import express from 'express'

class ExportController {
  constructor(exportService) {
    this.router = express.Router()
    this.exportService = exportService
    this.routes()
  }

  routes() {
    this.router.post('/text/:format', this.exportText.bind(this))
    this.router.post('/project/:format', this.exportProject.bind(this))
  }

  async exportText(req, res) {
    try {
      const { format } = req.params
      const { text, title } = req.body

      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }

      if (!['pdf', 'docx', 'txt'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use pdf, docx, or txt' })
      }

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
    } catch (error) {
      console.error('Export error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async exportProject(req, res) {
    try {
      const { format } = req.params
      const { project } = req.body

      if (!project) {
        return res.status(400).json({ error: 'project is required' })
      }

      if (!['pdf', 'docx', 'txt'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use pdf, docx, or txt' })
      }

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
    } catch (error) {
      console.error('Export error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}

export default ExportController
