const fs = require('fs').promises
const path = require('path')

class PrismaFlowGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'prisma-diagrams')
    this.ensureOutputDir()
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create PRISMA diagrams directory:', error)
    }
  }

  generatePrismaFlowData(studyData) {
    const {
      totalRecords = 0,
      duplicatesRemoved = 0,
      recordsScreened = 0,
      recordsExcludedTitleAbstract = 0,
      fullTextAssessed = 0,
      fullTextExcludedWithReasons = [],
      studiesIncluded = 0,
      studiesQualitative = 0,
      studiesQuantitative = 0
    } = studyData

    return {
      identification: {
        recordsIdentified: totalRecords,
        recordsAfterDuplicatesRemoved: totalRecords - duplicatesRemoved
      },
      screening: {
        recordsScreened: recordsScreened,
        recordsExcluded: recordsExcludedTitleAbstract,
        fullTextAssessedForEligibility: fullTextAssessed
      },
      inclusion: {
        fullTextExcluded: {
          count: fullTextExcludedWithReasons.reduce((sum, item) => sum + item.count, 0),
          reasons: fullTextExcludedWithReasons
        },
        studiesIncludedInReview: studiesIncluded,
        studiesIncludedInQualitativeSynthesis: studiesQualitative,
        studiesIncludedInQuantitativeSynthesis: studiesQuantitative
      }
    }
  }

  generateSVGFlowDiagram(flowData) {
    const { identification, screening, inclusion } = flowData

    const boxes = [
      { id: 'identified', text: `Records identified (n = ${identification.recordsIdentified})`, x: 400, y: 30, width: 280, height: 50 },
      { id: 'duplicates', text: `Records after duplicates removed (n = ${identification.recordsAfterDuplicatesRemoved})`, x: 400, y: 100, width: 280, height: 50 },
      { id: 'screened', text: `Records screened (n = ${screening.recordsScreened})`, x: 400, y: 170, width: 280, height: 50 },
      { id: 'excluded1', text: `Records excluded (n = ${screening.recordsExcluded})`, x: 750, y: 170, width: 280, height: 50 },
      { id: 'assessed', text: `Full-text articles assessed (n = ${screening.fullTextAssessedForEligibility})`, x: 400, y: 240, width: 280, height: 50 },
      { id: 'excluded2', text: `Full-text articles excluded (n = ${inclusion.fullTextExcluded.count})`, x: 750, y: 240, width: 280, height: 50 },
      { id: 'included', text: `Studies included in review (n = ${inclusion.studiesIncludedInReview})`, x: 400, y: 310, width: 280, height: 50 },
      { id: 'qualitative', text: `Qualitative synthesis (n = ${inclusion.studiesIncludedInQualitativeSynthesis})`, x: 400, y: 380, width: 280, height: 50 },
      { id: 'quantitative', text: `Quantitative synthesis (n = ${inclusion.studiesIncludedInQuantitativeSynthesis})`, x: 400, y: 450, width: 280, height: 50 }
    ]

    const arrows = [
      { from: 'identified', to: 'duplicates', label: `-${identification.recordsIdentified - identification.recordsAfterDuplicatesRemoved} duplicates` },
      { from: 'duplicates', to: 'screened', label: '' },
      { from: 'screened', to: 'assessed', label: '' },
      { from: 'screened', to: 'excluded1', label: '' },
      { from: 'assessed', to: 'included', label: '' },
      { from: 'assessed', to: 'excluded2', label: '' },
      { from: 'included', to: 'qualitative', label: '' },
      { from: 'included', to: 'quantitative', label: '' }
    ]

    const svgContent = this.generateSVGFromBoxes(boxes, arrows, inclusion.fullTextExcluded.reasons)
    return svgContent
  }

  generateSVGFromBoxes(boxes, arrows, exclusionReasons) {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1050" height="550" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
    </marker>
    <style>
      .box { fill: #f0f4f8; stroke: #1e40af; stroke-width: 2; }
      .excluded-box { fill: #fee2e2; stroke: #dc2626; stroke-width: 2; }
      .text { font-family: Arial, sans-serif; font-size: 14px; text-anchor: middle; dominant-baseline: middle; }
      .arrow { stroke: #333; stroke-width: 2; marker-end: url(#arrowhead); }
      .label { font-family: Arial, sans-serif; font-size: 12px; fill: #666; text-anchor: middle; }
    </style>
  </defs>
`

    boxes.forEach(box => {
      const isExcluded = box.id.includes('excluded')
      const cssClass = isExcluded ? 'excluded-box' : 'box'
      svg += `  <rect x="${box.x - box.width/2}" y="${box.y}" width="${box.width}" height="${box.height}" class="${cssClass}" rx="5" />
  <text x="${box.x}" y="${box.y + box.height/2}" class="text">${box.text}</text>\n`
    })

    arrows.forEach(arrow => {
      const fromBox = boxes.find(b => b.id === arrow.from)
      const toBox = boxes.find(b => b.id === arrow.to)

      if (fromBox && toBox) {
        const x1 = fromBox.x
        const y1 = fromBox.y + fromBox.height
        const x2 = toBox.x
        const y2 = toBox.y

        if (arrow.from === 'screened' && arrow.to === 'excluded1') {
          svg += `  <line x1="${fromBox.x + fromBox.width/2}" y1="${fromBox.y + fromBox.height/2}" x2="${toBox.x - toBox.width/2}" y2="${toBox.y + toBox.height/2}" class="arrow" />\n`
        } else if (arrow.from === 'assessed' && arrow.to === 'excluded2') {
          svg += `  <line x1="${fromBox.x + fromBox.width/2}" y1="${fromBox.y + fromBox.height/2}" x2="${toBox.x - toBox.width/2}" y2="${toBox.y + toBox.height/2}" class="arrow" />\n`
        } else {
          svg += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="arrow" />\n`
        }

        if (arrow.label) {
          svg += `  <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" class="label">${arrow.label}</text>\n`
        }
      }
    })

    if (exclusionReasons.length > 0) {
      svg += `  <g transform="translate(920, 300)">
    <text x="0" y="0" class="text" style="font-weight: bold; text-anchor: start;">Exclusion reasons:</text>
`
      exclusionReasons.forEach((reason, index) => {
        const yOffset = (index + 1) * 25
        svg += `    <text x="0" y="${yOffset}" class="text" style="text-anchor: start; font-size: 12px;">${index + 1}. ${reason.reason} (n=${reason.count})</text>\n`
      })
      svg += '  </g>\n'
    }

    svg += '</svg>'
    return svg
  }

  async generatePrismaDiagram(studyData, filename = 'prisma-flow-diagram') {
    try {
      const flowData = this.generatePrismaFlowData(studyData)
      const svgContent = this.generateSVGFlowDiagram(flowData)

      const filepath = path.join(this.outputDir, `${filename}.svg`)
      await fs.writeFile(filepath, svgContent, 'utf-8')

      return {
        success: true,
        filepath,
        flowData
      }
    } catch (error) {
      console.error('Failed to generate PRISMA diagram:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  generateHTMLReport(flowData, metadata = {}) {
    const { identification, screening, inclusion } = flowData
    const { title = 'PRISMA Flow Diagram', date = new Date().toISOString().split('T')[0] } = metadata

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; text-align: center; }
    .date { text-align: center; color: #666; margin-bottom: 30px; }
    .phase { margin: 30px 0; padding: 20px; background: #f0f4f8; border-radius: 8px; }
    .phase h2 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    .stat { display: inline-block; margin: 10px 20px; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat .value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .stat .label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #1e40af; color: white; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="date">Generated: ${date}</p>

  <div class="phase">
    <h2>Identification</h2>
    <div class="stat">
      <div class="value">${identification.recordsIdentified}</div>
      <div class="label">Records identified</div>
    </div>
    <div class="stat">
      <div class="value">${identification.recordsAfterDuplicatesRemoved}</div>
      <div class="label">Records after duplicates removed</div>
    </div>
  </div>

  <div class="phase">
    <h2>Screening</h2>
    <div class="stat">
      <div class="value">${screening.recordsScreened}</div>
      <div class="label">Records screened</div>
    </div>
    <div class="stat">
      <div class="value">${screening.recordsExcluded}</div>
      <div class="label">Records excluded (title/abstract)</div>
    </div>
    <div class="stat">
      <div class="value">${screening.fullTextAssessedForEligibility}</div>
      <div class="label">Full-text articles assessed</div>
    </div>
  </div>

  <div class="phase">
    <h2>Inclusion</h2>
    <div class="stat">
      <div class="value">${inclusion.studiesIncludedInReview}</div>
      <div class="label">Studies included in review</div>
    </div>
    <div class="stat">
      <div class="value">${inclusion.studiesIncludedInQualitativeSynthesis}</div>
      <div class="label">Qualitative synthesis</div>
    </div>
    <div class="stat">
      <div class="value">${inclusion.studiesIncludedInQuantitativeSynthesis}</div>
      <div class="label">Quantitative synthesis (meta-analysis)</div>
    </div>
  </div>

  ${inclusion.fullTextExcluded.reasons.length > 0 ? `
  <div class="phase">
    <h2>Exclusion Reasons</h2>
    <table>
      <thead>
        <tr>
          <th>Reason</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${inclusion.fullTextExcluded.reasons.map(r => `
        <tr>
          <td>${r.reason}</td>
          <td>${r.count}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
</body>
</html>`
  }

  async generateFullPrismaReport(studyData, filename = 'prisma-report', metadata = {}) {
    try {
      const flowData = this.generatePrismaFlowData(studyData)

      const diagramResult = await this.generatePrismaDiagram(studyData, filename)
      if (!diagramResult.success) {
        return diagramResult
      }

      const htmlContent = this.generateHTMLReport(flowData, metadata)
      const htmlFilepath = path.join(this.outputDir, `${filename}.html`)
      await fs.writeFile(htmlFilepath, htmlContent, 'utf-8')

      return {
        success: true,
        diagramPath: diagramResult.filepath,
        htmlPath: htmlFilepath,
        flowData
      }
    } catch (error) {
      console.error('Failed to generate PRISMA report:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  validateStudyData(studyData) {
    const requiredFields = [
      'totalRecords',
      'recordsScreened',
      'fullTextAssessed',
      'studiesIncluded'
    ]

    const errors = []

    for (const field of requiredFields) {
      if (studyData[field] === undefined || studyData[field] === null) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    if (studyData.totalRecords < 0) {
      errors.push('totalRecords must be non-negative')
    }

    if (studyData.duplicatesRemoved > studyData.totalRecords) {
      errors.push('duplicatesRemoved cannot exceed totalRecords')
    }

    if (studyData.recordsScreened > studyData.totalRecords - studyData.duplicatesRemoved) {
      errors.push('recordsScreened cannot exceed records after duplicates removed')
    }

    if (studyData.fullTextAssessed > studyData.recordsScreened - studyData.recordsExcludedTitleAbstract) {
      errors.push('fullTextAssessed cannot exceed records after title/abstract screening')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  generatePlaceholderData() {
    return {
      totalRecords: 1250,
      duplicatesRemoved: 150,
      recordsScreened: 1100,
      recordsExcludedTitleAbstract: 950,
      fullTextAssessed: 150,
      fullTextExcludedWithReasons: [
        { reason: 'Wrong study design', count: 40 },
        { reason: 'Wrong population', count: 25 },
        { reason: 'Wrong intervention', count: 20 },
        { reason: 'Wrong outcome', count: 15 },
        { reason: 'Other', count: 10 }
      ],
      studiesIncluded: 50,
      studiesQualitative: 50,
      studiesQuantitative: 35
    }
  }
}

module.exports = PrismaFlowGenerator
