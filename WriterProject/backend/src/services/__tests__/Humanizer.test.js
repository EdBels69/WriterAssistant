import Humanizer from '../Humanizer.js'
import SmartRouter from '../SmartRouter.js'

describe('Humanizer', () => {
  let humanizer
  let mockRouter

  beforeEach(() => {
    mockRouter = new SmartRouter('test-key', 'test-key')
    humanizer = new Humanizer(mockRouter)
  })

  describe('analyzeText', () => {
    it('should detect AI markers in text', () => {
      const text = 'In today\'s digital age, it is important to note that AI is transforming everything.'
      const analysis = humanizer.analyzeText(text)
      
      expect(analysis).toHaveProperty('aiMarkers')
      expect(analysis).toHaveProperty('readabilityMetrics')
      expect(analysis).toHaveProperty('aiScore')
      expect(analysis).toHaveProperty('humanScore')
      expect(analysis.aiMarkers.length).toBeGreaterThan(0)
    })

    it('should calculate readability metrics', () => {
      const text = 'The quick brown fox jumps over the lazy dog. This is a test sentence.'
      const analysis = humanizer.analyzeText(text)
      
      expect(analysis.readabilityMetrics).toHaveProperty('fleschKincaid')
      expect(analysis.readabilityMetrics).toHaveProperty('gunningFog')
      expect(analysis.readabilityMetrics).toHaveProperty('wordCount')
      expect(analysis.readabilityMetrics).toHaveProperty('sentenceCount')
    })

    it('should count AI markers correctly', () => {
      const text = 'It is important to note that this is significant. In today\'s digital age, we see patterns.'
      const analysis = humanizer.analyzeText(text)
      
      expect(analysis.aiMarkers).toContain('it is important to note')
      expect(analysis.aiMarkers).toContain('in today\'s digital age')
    })
  })

  describe('improveText', () => {
    it('should remove AI markers from text', () => {
      const text = 'In today\'s digital age, it is important to note that AI helps us.'
      const improved = humanizer.improveText(text)
      
      expect(improved).not.toContain('In today\'s digital age')
      expect(improved).not.toContain('it is important to note')
    })

    it('should convert passive voice to active voice', () => {
      const text = 'The results were obtained by the researchers.'
      const improved = humanizer.improveText(text)
      
      expect(improved).not.toMatch(/were obtained by/)
    })

    it('should break up long sentences', () => {
      const text = 'This is a very long sentence that contains many clauses and goes on for quite some time without stopping.'
      const improved = humanizer.improveText(text)
      
      const sentenceCount = improved.split(/[.!?]/).filter(s => s.trim().length > 0).length
      expect(sentenceCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('generateReport', () => {
    it('should generate comparison report', () => {
      const original = 'In today\'s digital age, it is important to note that AI is important.'
      const improved = 'AI significantly impacts modern technology.'
      
      const report = humanizer.generateReport(original, improved)
      
      expect(report).toHaveProperty('originalAnalysis')
      expect(report).toHaveProperty('improvedAnalysis')
      expect(report).toHaveProperty('improvementMetrics')
      expect(report).toHaveProperty('recommendations')
    })

    it('should show improvement in AI score', () => {
      const original = 'In today\'s digital age, it is important to note that AI is important.'
      const improved = 'AI significantly impacts modern technology.'
      
      const report = humanizer.generateReport(original, improved)
      
      expect(report.improvementMetrics.aiScoreReduction).toBeGreaterThan(0)
      expect(report.improvedAnalysis.aiScore).toBeLessThan(report.originalAnalysis.aiScore)
    })

    it('should provide recommendations', () => {
      const original = 'In today\'s digital age, it is important to note that AI is important.'
      const improved = 'AI significantly impacts modern technology.'
      
      const report = humanizer.generateReport(original, improved)
      
      expect(report.recommendations).toBeInstanceOf(Array)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('generatePlaceholderData', () => {
    it('should generate placeholder data for testing', () => {
      const data = humanizer.generatePlaceholderData()
      
      expect(data).toHaveProperty('original')
      expect(data).toHaveProperty('improved')
      expect(data.original).toBeInstanceOf(String)
      expect(data.improved).toBeInstanceOf(String)
      expect(data.original.length).toBeGreaterThan(0)
    })

    it('should generate different data on multiple calls', () => {
      const data1 = humanizer.generatePlaceholderData()
      const data2 = humanizer.generatePlaceholderData()
      
      expect(data1.original).not.toBe(data2.original)
    })
  })

  describe('setParameters', () => {
    it('should update humanizer parameters', () => {
      const params = {
        removeAIMarkers: true,
        convertPassiveToActive: true,
        breakLongSentences: true,
        removeExcessiveAdverbs: false
      }
      
      humanizer.setParameters(params)
      expect(humanizer.parameters.removeExcessiveAdverbs).toBe(false)
      expect(humanizer.parameters.removeAIMarkers).toBe(true)
    })

    it('should use updated parameters when improving text', () => {
      humanizer.setParameters({ removeAIMarkers: false })
      
      const text = 'In today\'s digital age, AI is important.'
      const improved = humanizer.improveText(text)
      
      expect(improved).toContain('In today\'s digital age')
    })
  })
})
