const fs = require('fs').promises
const path = require('path')

class ForestPlotGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'forest-plots')
    this.ensureOutputDir()
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create forest plots directory:', error)
    }
  }

  validateStudyData(studies) {
    if (!Array.isArray(studies) || studies.length === 0) {
      return { valid: false, errors: ['Studies must be a non-empty array'] }
    }

    const errors = []

    for (let i = 0; i < studies.length; i++) {
      const study = studies[i]

      if (!study.name) {
        errors.push(`Study ${i + 1} missing name`)
      }

      if (typeof study.effectSize !== 'number' || isNaN(study.effectSize)) {
        errors.push(`Study ${i + 1} has invalid effectSize`)
      }

      if (typeof study.lowerCI !== 'number' || isNaN(study.lowerCI)) {
        errors.push(`Study ${i + 1} has invalid lowerCI`)
      }

      if (typeof study.upperCI !== 'number' || isNaN(study.upperCI)) {
        errors.push(`Study ${i + 1} has invalid upperCI`)
      }

      if (study.lowerCI > study.upperCI) {
        errors.push(`Study ${i + 1}: lowerCI cannot be greater than upperCI`)
      }

      if (typeof study.weight !== 'number' || isNaN(study.weight) || study.weight <= 0) {
        errors.push(`Study ${i + 1} has invalid weight`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  calculatePooledEffect(studies, method = 'random-effects') {
    if (studies.length === 0) {
      return { effectSize: 0, lowerCI: 0, upperCI: 0, se: 0 }
    }

    const weights = studies.map(s => s.weight)
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)

    if (totalWeight === 0) {
      return { effectSize: 0, lowerCI: 0, upperCI: 0, se: 0 }
    }

    const weightedSum = studies.reduce((sum, s) => sum + s.effectSize * s.weight, 0)
    const pooledEffect = weightedSum / totalWeight

    let pooledSE = 0

    if (method === 'random-effects') {
      const squaredErrors = studies.map(s => (s.effectSize - pooledEffect) ** 2)
      const q = squaredErrors.reduce((sum, se) => sum + se, 0)

      const c = totalWeight - (weights.reduce((sum, w) => sum + w ** 2, 0) / totalWeight)
      const tau2 = Math.max(0, (q - (studies.length - 1)) / c)

      const adjustedWeights = studies.map(s => 1 / ((1 / s.weight) + tau2))
      const totalAdjustedWeight = adjustedWeights.reduce((sum, w) => sum + w, 0)

      const adjustedWeightedSum = studies.reduce((sum, s, i) => sum + s.effectSize * adjustedWeights[i], 0)
      const adjustedPooledEffect = adjustedWeightedSum / totalAdjustedWeight

      pooledEffect = adjustedPooledEffect
      pooledSE = Math.sqrt(1 / totalAdjustedWeight)
    } else {
      pooledSE = Math.sqrt(1 / totalWeight)
    }

    const z = 1.96
    const lowerCI = pooledEffect - z * pooledSE
    const upperCI = pooledEffect + z * pooledSE

    return {
      effectSize: pooledEffect,
      lowerCI,
      upperCI,
      se: pooledSE,
      zScore: pooledEffect / pooledSE,
      pValue: 2 * (1 - this.normalCDF(Math.abs(pooledEffect / pooledSE)))
    }
  }

  normalCDF(x) {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  generateSVGForestPlot(studies, pooledEffect, options = {}) {
    const {
      title = 'Forest Plot',
      effectSizeLabel = 'Effect Size (Standardized Mean Difference)',
      showCI = true,
      showWeights = true,
      showOverall = true,
      width = 1000,
      height = 600,
      margin = { top: 80, right: 50, bottom: 80, left: 300 }
    } = options

    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom

    const allValues = [
      ...studies.flatMap(s => [s.effectSize, s.lowerCI, s.upperCI]),
      ...(showOverall ? [pooledEffect.effectSize, pooledEffect.lowerCI, pooledEffect.upperCI] : [])
    ]

    const minVal = Math.min(...allValues) - 0.5
    const maxVal = Math.max(...allValues) + 0.5

    const scale = value => margin.left + ((value - minVal) / (maxVal - minVal)) * plotWidth

    const nullLineX = scale(0)

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; text-anchor: middle; fill: #1e40af; }
      .axis-label { font-family: Arial, sans-serif; font-size: 14px; text-anchor: middle; fill: #333; }
      .study-label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: end; fill: #333; }
      .effect-value { font-family: Arial, sans-serif; font-size: 12px; text-anchor: start; fill: #333; }
      .ci-value { font-family: Arial, sans-serif; font-size: 11px; text-anchor: start; fill: #666; }
      .weight-value { font-family: Arial, sans-serif; font-size: 11px; text-anchor: end; fill: #666; }
      .null-line { stroke: #999; stroke-width: 2; stroke-dasharray: 5,5; }
      .ci-line { stroke: #333; stroke-width: 1.5; }
      .effect-point { fill: #1e40af; }
      .overall-point { fill: #dc2626; }
      .overall-ci-line { stroke: #dc2626; stroke-width: 2.5; }
      .grid-line { stroke: #e5e7eb; stroke-width: 1; }
    </style>
  </defs>
`

    svg += `  <text x="${width / 2}" y="40" class="title">${title}</text>\n`

    svg += `  <text x="${width / 2}" y="${height - 30}" class="axis-label">${effectSizeLabel}</text>\n`

    const gridLines = 10
    for (let i = 0; i <= gridLines; i++) {
      const value = minVal + (i / gridLines) * (maxVal - minVal)
      const x = scale(value)
      svg += `  <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" class="grid-line" />\n`
      svg += `  <text x="${x}" y="${height - margin.bottom + 20}" class="axis-label">${value.toFixed(1)}</text>\n`
    }

    svg += `  <line x1="${nullLineX}" y1="${margin.top}" x2="${nullLineX}" y2="${height - margin.bottom}" class="null-line" />\n`

    const rowHeight = (plotHeight - 40) / (studies.length + (showOverall ? 1 : 0))
    let currentY = margin.top + 30

    studies.forEach((study, index) => {
      const x = scale(study.effectSize)
      const xLower = scale(study.lowerCI)
      const xUpper = scale(study.upperCI)

      svg += `  <text x="${margin.left - 10}" y="${currentY}" class="study-label">${study.name}</text>\n`
      svg += `  <line x1="${xLower}" y1="${currentY}" x2="${xUpper}" y2="${currentY}" class="ci-line" />\n`
      svg += `  <circle cx="${x}" cy="${currentY}" r="5" class="effect-point" />\n`

      svg += `  <text x="${width - margin.right + 10}" y="${currentY}" class="effect-value">${study.effectSize.toFixed(2)}</text>\n`
      
      if (showCI) {
        svg += `  <text x="${width - margin.right + 60}" y="${currentY}" class="ci-value">[${study.lowerCI.toFixed(2)}, ${study.upperCI.toFixed(2)}]</text>\n`
      }

      if (showWeights) {
        svg += `  <text x="${margin.left + plotWidth - 10}" y="${currentY}" class="weight-value">${study.weight.toFixed(1)}%</text>\n`
      }

      currentY += rowHeight
    })

    if (showOverall) {
      currentY += 20
      const x = scale(pooledEffect.effectSize)
      const xLower = scale(pooledEffect.lowerCI)
      const xUpper = scale(pooledEffect.upperCI)

      svg += `  <line x1="${margin.left - 10}" y1="${currentY + 20}" x2="${width - margin.right}" y2="${currentY + 20}" stroke="#1e40af" stroke-width="2" />\n`
      svg += `  <text x="${margin.left - 10}" y="${currentY}" class="study-label" style="font-weight: bold;">Overall</text>\n`
      svg += `  <line x1="${xLower}" y1="${currentY}" x2="${xUpper}" y2="${currentY}" class="overall-ci-line" />\n`
      svg += `  <circle cx="${x}" cy="${currentY}" r="7" class="overall-point" />\n`

      svg += `  <text x="${width - margin.right + 10}" y="${currentY}" class="effect-value" style="font-weight: bold;">${pooledEffect.effectSize.toFixed(2)}</text>\n`
      
      if (showCI) {
        svg += `  <text x="${width - margin.right + 60}" y="${currentY}" class="ci-value" style="font-weight: bold;">[${pooledEffect.lowerCI.toFixed(2)}, ${pooledEffect.upperCI.toFixed(2)}]</text>\n`
      }

      if (pooledEffect.pValue !== undefined) {
        svg += `  <text x="${width / 2}" y="${height - 50}" class="axis-label">Z = ${pooledEffect.zScore.toFixed(2)}, P = ${pooledEffect.pValue < 0.001 ? '< 0.001' : pooledEffect.pValue.toFixed(3)}</text>\n`
      }
    }

    svg += '</svg>'
    return svg
  }

  async generateForestPlot(studies, options = {}, filename = 'forest-plot') {
    try {
      const validation = this.validateStudyData(studies)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid study data',
          details: validation.errors
        }
      }

      const pooledEffect = this.calculatePooledEffect(studies, options.method || 'random-effects')
      const svgContent = this.generateSVGForestPlot(studies, pooledEffect, options)

      const filepath = path.join(this.outputDir, `${filename}.svg`)
      await fs.writeFile(filepath, svgContent, 'utf-8')

      return {
        success: true,
        filepath,
        pooledEffect,
        studyCount: studies.length
      }
    } catch (error) {
      console.error('Failed to generate forest plot:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  generateHTMLReport(studies, pooledEffect, options = {}) {
    const { title = 'Forest Plot Analysis', date = new Date().toISOString().split('T')[0] } = options

    const ciIncludesZero = pooledEffect.lowerCI <= 0 && pooledEffect.upperCI >= 0
    const significance = pooledEffect.pValue < 0.05 ? 'statistically significant' : 'not statistically significant'

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
    .summary { background: #f0f4f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .summary h2 { color: #1e40af; margin-top: 0; }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat .value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .stat .label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #1e40af; color: white; }
    tr:hover { background: #f9f9f9; }
    .significant { background: #dcfce7; }
    .not-significant { background: #fee2e2; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="date">Generated: ${date}</p>

  <div class="summary ${ciIncludesZero ? 'not-significant' : 'significant'}">
    <h2>Overall Effect</h2>
    <div class="stat">
      <div class="value">${pooledEffect.effectSize.toFixed(3)}</div>
      <div class="label">Effect Size</div>
    </div>
    <div class="stat">
      <div class="value">[${pooledEffect.lowerCI.toFixed(3)}, ${pooledEffect.upperCI.toFixed(3)}]</div>
      <div class="label">95% CI</div>
    </div>
    <div class="stat">
      <div class="value">${pooledEffect.zScore.toFixed(2)}</div>
      <div class="label">Z-score</div>
    </div>
    <div class="stat">
      <div class="value">${pooledEffect.pValue < 0.001 ? '< 0.001' : pooledEffect.pValue.toFixed(3)}</div>
      <div class="label">P-value</div>
    </div>
    <p style="margin-top: 20px; font-weight: bold;">
      The overall effect is <span style="color: ${ciIncludesZero ? '#dc2626' : '#16a34a'}">${significance}</span>.
    </p>
  </div>

  <h2>Study Details</h2>
  <table>
    <thead>
      <tr>
        <th>Study</th>
        <th>Effect Size</th>
        <th>95% CI</th>
        <th>Weight (%)</th>
      </tr>
    </thead>
    <tbody>
      ${studies.map(study => `
      <tr>
        <td>${study.name}</td>
        <td>${study.effectSize.toFixed(3)}</td>
        <td>[${study.lowerCI.toFixed(3)}, ${study.upperCI.toFixed(3)}]</td>
        <td>${study.weight.toFixed(2)}%</td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`
  }

  async generateFullForestPlotReport(studies, options = {}, filename = 'forest-plot-report') {
    try {
      const validation = this.validateStudyData(studies)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid study data',
          details: validation.errors
        }
      }

      const pooledEffect = this.calculatePooledEffect(studies, options.method || 'random-effects')

      const plotResult = await this.generateForestPlot(studies, options, filename)
      if (!plotResult.success) {
        return plotResult
      }

      const htmlContent = this.generateHTMLReport(studies, pooledEffect, {
        ...options,
        filename
      })

      const htmlFilepath = path.join(this.outputDir, `${filename}.html`)
      await fs.writeFile(htmlFilepath, htmlContent, 'utf-8')

      return {
        success: true,
        plotPath: plotResult.filepath,
        htmlPath: htmlFilepath,
        pooledEffect,
        studyCount: studies.length
      }
    } catch (error) {
      console.error('Failed to generate forest plot report:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  generatePlaceholderData() {
    return [
      { name: 'Study 1', effectSize: 0.45, lowerCI: 0.15, upperCI: 0.75, weight: 25.3 },
      { name: 'Study 2', effectSize: 0.62, lowerCI: 0.32, upperCI: 0.92, weight: 22.1 },
      { name: 'Study 3', effectSize: 0.38, lowerCI: 0.08, upperCI: 0.68, weight: 20.5 },
      { name: 'Study 4', effectSize: 0.51, lowerCI: 0.21, upperCI: 0.81, weight: 18.7 },
      { name: 'Study 5', effectSize: 0.29, lowerCI: -0.01, upperCI: 0.59, weight: 13.4 }
    ]
  }
}

module.exports = ForestPlotGenerator
