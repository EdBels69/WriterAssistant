import PDFDocument from 'pdfkit'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

class ExportService {
  async exportToPDF(text, options = {}) {
    const { title = 'WriterAssistant Document', fontSize = 12 } = options

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 72, right: 72 } })
        
        const chunks = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        doc.fontSize(20).text(title, { align: 'center' })
        doc.moveDown()
        doc.fontSize(fontSize).text(text, { align: 'justify', lineGap: 5 })
        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  async exportToDOCX(text, options = {}) {
    const { title = 'WriterAssistant Document' } = options

    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 }
              }),
              ...text.split('\n\n').map(
                para => new Paragraph({
                  children: [new TextRun({ text: para, size: 24 })],
                  spacing: { after: 200 }
                })
              )
            ]
          }
        ]
      })

      const buffer = await Packer.toBuffer(doc)
      return buffer
    } catch (error) {
      throw new Error(`DOCX export failed: ${error.message}`)
    }
  }

  async exportToTXT(text, options = {}) {
    const { title = 'WriterAssistant Document' } = options

    try {
      const content = `${title}\n${'='.repeat(title.length)}\n\n${text}`
      return Buffer.from(content, 'utf-8')
    } catch (error) {
      throw new Error(`TXT export failed: ${error.message}`)
    }
  }

  async exportProjectToPDF(project) {
    let text = `Проект: ${project.name}\n`
    text += `Жанр: ${project.genre || 'Не указан'}\n`
    text += `Описание: ${project.description || 'Нет описания'}\n\n`
    text += `${'='.repeat(50)}\n\n`

    if (project.chapters && project.chapters.length > 0) {
      project.chapters.forEach((chapter, index) => {
        text += `Глава ${index + 1}: ${chapter.title || 'Без названия'}\n\n`
        text += `${chapter.content || 'Нет содержимого'}\n\n`
        text += `${'-'.repeat(30)}\n\n`
      })
    }

    return this.exportToPDF(text, { title: project.name })
  }

  async exportProjectToDOCX(project) {
    let text = `Проект: ${project.name}\n`
    text += `Жанр: ${project.genre || 'Не указан'}\n`
    text += `Описание: ${project.description || 'Нет описания'}\n\n`
    text += `${'='.repeat(50)}\n\n`

    if (project.chapters && project.chapters.length > 0) {
      project.chapters.forEach((chapter, index) => {
        text += `Глава ${index + 1}: ${chapter.title || 'Без названия'}\n\n`
        text += `${chapter.content || 'Нет содержимого'}\n\n`
        text += `${'-'.repeat(30)}\n\n`
      })
    }

    return this.exportToDOCX(text, { title: project.name })
  }

  async exportProjectToTXT(project) {
    let text = `Проект: ${project.name}\n`
    text += `Жанр: ${project.genre || 'Не указан'}\n`
    text += `Описание: ${project.description || 'Нет описания'}\n\n`
    text += `${'='.repeat(50)}\n\n`

    if (project.chapters && project.chapters.length > 0) {
      project.chapters.forEach((chapter, index) => {
        text += `Глава ${index + 1}: ${chapter.title || 'Без названия'}\n\n`
        text += `${chapter.content || 'Нет содержимого'}\n\n`
        text += `${'-'.repeat(30)}\n\n`
      })
    }

    return this.exportToTXT(text, { title: project.name })
  }

  getContentType(format) {
    const contentTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain'
    }
    return contentTypes[format] || 'application/octet-stream'
  }

  getFileExtension(format) {
    const extensions = {
      pdf: '.pdf',
      docx: '.docx',
      txt: '.txt'
    }
    return extensions[format] || ''
  }
}

export default ExportService
