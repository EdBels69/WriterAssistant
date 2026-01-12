class Humanizer {
  constructor() {
    this.aiPatterns = new Map([
      ['transition', /^(moreover|furthermore|additionally|in addition|consequently|therefore|thus|hence|accordingly|subsequently)/gi],
      ['passiveVoice', /is\s+(?:\w+ed|being\s+\w+ed)/gi],
      ['repetitiveWords', /(therefore|thus|however|furthermore)(?:\s+\1){1,}/gi],
      ['complexSentences', /[^.!?]{100,}/g],
      ['genericPhrases', /(it is important to note|it should be mentioned|it is worth noting|in order to|due to the fact that|for the purpose of)/gi],
      ['uncertainPhrases', /(could be|might be|may be|possibly|perhaps|potentially)/gi],
      ['excessiveAdverbs', /\b(very|really|extremely|highly|quite|rather|somewhat)\s+\w+/gi],
      ['redundantPhrases', /(at this point in time|in the event that|for all intents and purposes|in the majority of cases|prior to|subsequent to)/gi],
      ['clichedOpenings', /^(in conclusion|in summary|to summarize|in essence|to put it simply)/gim],
      ['aiMarkers', /(in today's digital age|in this day and age|in the modern world|with the advent of|in the era of)/gi]
    ])

    this.readabilityMetrics = [
      'fleschKincaidGrade',
      'fleschReadingEase',
      'gunningFog',
      'colemanLiau',
      'automatedReadabilityIndex'
    ]

    this.replacementPhrases = new Map([
      ['it is important to note', 'notably'],
      ['it should be mentioned', 'notably'],
      ['it is worth noting', 'notably'],
      ['in order to', 'to'],
      ['due to the fact that', 'because'],
      ['for the purpose of', 'for'],
      ['at this point in time', 'now'],
      ['in the event that', 'if'],
      ['in the majority of cases', 'usually'],
      ['prior to', 'before'],
      ['subsequent to', 'after'],
      ['in conclusion', 'concluding'],
      ['in summary', 'summarizing'],
      ['to summarize', 'summarizing'],
      ['in essence', 'essentially'],
      ['to put it simply', 'simply put']
    ])
  }

  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Invalid text input' }
    }

    const analysis = {
      length: text.length,
      wordCount: this.countWords(text),
      sentenceCount: this.countSentences(text),
      paragraphCount: this.countParagraphs(text),
      avgWordLength: this.avgWordLength(text),
      avgSentenceLength: this.avgSentenceLength(text),
      aiPatterns: this.detectAIPatterns(text),
      readability: this.calculateReadabilityMetrics(text),
      suggestions: this.generateSuggestions(text)
    }

    analysis.aiScore = this.calculateAIScore(analysis)
    analysis.humanScore = 1 - analysis.aiScore

    return analysis
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  countSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  countParagraphs(text) {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).length
  }

  avgWordLength(text) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    if (words.length === 0) return 0
    return words.reduce((sum, word) => sum + word.replace(/[^a-zA-Zа-яА-Я]/g, '').length, 0) / words.length
  }

  avgSentenceLength(text) {
    const wordCount = this.countWords(text)
    const sentenceCount = this.countSentences(text)
    return sentenceCount > 0 ? wordCount / sentenceCount : 0
  }

  detectAIPatterns(text) {
    const detected = {}

    for (const [patternName, pattern] of this.aiPatterns) {
      const matches = text.match(pattern)
      detected[patternName] = {
        count: matches ? matches.length : 0,
        examples: matches ? matches.slice(0, 3) : []
      }
    }

    return detected
  }

  calculateReadabilityMetrics(text) {
    const wordCount = this.countWords(text)
    const sentenceCount = this.countSentences(text)
    const syllableCount = this.countSyllables(text)
    const characterCount = text.replace(/\s/g, '').length
    const complexWords = this.countComplexWords(text)

    const metrics = {}

    if (wordCount > 0 && sentenceCount > 0) {
      metrics.fleschKincaidGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
      metrics.fleschReadingEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
    } else {
      metrics.fleschKincaidGrade = 0
      metrics.fleschReadingEase = 0
    }

    if (sentenceCount > 0 && wordCount > 0) {
      metrics.gunningFog = 0.4 * ((wordCount / sentenceCount) + (complexWords / wordCount) * 100)
    } else {
      metrics.gunningFog = 0
    }

    if (wordCount > 0) {
      const avgLetterCount = characterCount / wordCount
      const avgSentenceLength = wordCount / sentenceCount
      metrics.colemanLiau = 0.0588 * avgLetterCount - 0.296 * avgSentenceLength - 15.8
    } else {
      metrics.colemanLiau = 0
    }

    if (wordCount > 0 && sentenceCount > 0) {
      metrics.automatedReadabilityIndex = 4.71 * (characterCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43
    } else {
      metrics.automatedReadabilityIndex = 0
    }

    return metrics
  }

  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0)
    return words.reduce((total, word) => total + this.countWordSyllables(word), 0)
  }

  countWordSyllables(word) {
    word = word.replace(/[^a-zA-Z]/g, '')
    if (word.length <= 3) return 1

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }

  countComplexWords(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0)
    return words.filter(word => this.countWordSyllables(word) >= 3).length
  }

  calculateAIScore(analysis) {
    let score = 0

    const aiPatternScores = {
      transition: 0.05,
      passiveVoice: 0.03,
      repetitiveWords: 0.08,
      complexSentences: 0.04,
      genericPhrases: 0.06,
      uncertainPhrases: 0.03,
      excessiveAdverbs: 0.04,
      redundantPhrases: 0.07,
      clichedOpenings: 0.06,
      aiMarkers: 0.10
    }

    for (const [patternName, data] of Object.entries(analysis.aiPatterns)) {
      score += Math.min(data.count * aiPatternScores[patternName], 0.3)
    }

    if (analysis.avgSentenceLength > 25) {
      score += 0.05
    }

    if (analysis.avgSentenceLength > 30) {
      score += 0.05
    }

    if (analysis.readability.fleschReadingEase < 30) {
      score += 0.05
    }

    return Math.min(score, 1)
  }

  generateSuggestions(text) {
    const suggestions = []
    const aiPatterns = this.detectAIPatterns(text)

    if (aiPatterns.transition.count > 3) {
      suggestions.push({
        type: 'transition',
        severity: 'medium',
        message: 'Excessive use of formal transitions detected',
        examples: aiPatterns.transition.examples,
        recommendation: 'Replace some formal transitions with simpler alternatives'
      })
    }

    if (aiPatterns.passiveVoice.count > 5) {
      suggestions.push({
        type: 'passiveVoice',
        severity: 'medium',
        message: 'High passive voice usage detected',
        examples: aiPatterns.passiveVoice.examples,
        recommendation: 'Convert some passive constructions to active voice'
      })
    }

    if (aiPatterns.repetitiveWords.count > 0) {
      suggestions.push({
        type: 'repetitiveWords',
        severity: 'high',
        message: 'Repetitive word patterns detected',
        examples: aiPatterns.repetitiveWords.examples,
        recommendation: 'Vary your vocabulary and use synonyms'
      })
    }

    if (aiPatterns.complexSentences.count > 0) {
      suggestions.push({
        type: 'complexSentences',
        severity: 'medium',
        message: 'Overly long sentences detected',
        examples: ['Sentences with 100+ characters'],
        recommendation: 'Break long sentences into shorter, clearer ones'
      })
    }

    if (aiPatterns.genericPhrases.count > 3) {
      suggestions.push({
        type: 'genericPhrases',
        severity: 'low',
        message: 'Generic AI-like phrases detected',
        examples: aiPatterns.genericPhrases.examples,
        recommendation: 'Replace generic phrases with more specific language'
      })
    }

    if (aiPatterns.aiMarkers.count > 2) {
      suggestions.push({
        type: 'aiMarkers',
        severity: 'high',
        message: 'Common AI writing patterns detected',
        examples: aiPatterns.aiMarkers.examples,
        recommendation: 'Rewrite these phrases to sound more natural'
      })
    }

    return suggestions
  }

  humanizeText(text, options = {}) {
    const {
      removeTransitions = true,
      convertPassiveToActive = true,
      simplifyPhrases = true,
      breakLongSentences = true,
      reduceAdverbs = true,
      removeGenericPhrases = true,
      removeAIMarkers = true,
      maintainTone = 'academic'
    } = options

    if (!text || typeof text !== 'string') {
      return { success: false, error: 'Invalid text input' }
    }

    let result = text

    if (removeGenericPhrases) {
      result = this.replaceGenericPhrases(result)
    }

    if (simplifyPhrases) {
      result = this.simplifyRedundantPhrases(result)
    }

    if (removeAIMarkers) {
      result = this.removeAIMarkers(result)
    }

    if (reduceAdverbs) {
      result = this.reduceExcessiveAdverbs(result)
    }

    if (breakLongSentences) {
      result = this.breakComplexSentences(result)
    }

    if (removeTransitions) {
      result = this.reduceTransitions(result)
    }

    if (convertPassiveToActive) {
      result = this.convertPassiveToActive(result)
    }

    return {
      success: true,
      original: text,
      humanized: result,
      changes: this.calculateChanges(text, result)
    }
  }

  replaceGenericPhrases(text) {
    const replacements = [
      { pattern: /it is important to note that/gi, replacement: 'notably,' },
      { pattern: /it should be mentioned that/gi, replacement: 'notably,' },
      { pattern: /it is worth noting that/gi, replacement: 'notably,' },
      { pattern: /in order to/gi, replacement: 'to' },
      { pattern: /due to the fact that/gi, replacement: 'because' },
      { pattern: /for the purpose of/gi, replacement: 'for' },
      { pattern: /at this point in time/gi, replacement: 'currently' },
      { pattern: /in the event that/gi, replacement: 'if' }
    ]

    let result = text
    for (const { pattern, replacement } of replacements) {
      result = result.replace(pattern, replacement)
    }
    return result
  }

  simplifyRedundantPhrases(text) {
    const replacements = [
      { pattern: /in conclusion/gi, replacement: 'to conclude' },
      { pattern: /in summary/gi, replacement: 'summarizing' },
      { pattern: /to summarize/gi, replacement: 'summarizing' },
      { pattern: /in essence/gi, replacement: 'essentially' },
      { pattern: /to put it simply/gi, replacement: 'simply' },
      { pattern: /in the majority of cases/gi, replacement: 'usually' },
      { pattern: /prior to/gi, replacement: 'before' },
      { pattern: /subsequent to/gi, replacement: 'after' }
    ]

    let result = text
    for (const { pattern, replacement } of replacements) {
      result = result.replace(pattern, replacement)
    }
    return result
  }

  removeAIMarkers(text) {
    const replacements = [
      { pattern: /in today's digital age/gi, replacement: '' },
      { pattern: /in this day and age/gi, replacement: '' },
      { pattern: /in the modern world/gi, replacement: '' },
      { pattern: /with the advent of/gi, replacement: '' },
      { pattern: /in the era of/gi, replacement: '' },
      { pattern: /in today's society/gi, replacement: '' },
      { pattern: /in the 21st century/gi, replacement: '' }
    ]

    let result = text
    for (const { pattern, replacement } of replacements) {
      result = result.replace(pattern, replacement)
    }
    return result
  }

  reduceExcessiveAdverbs(text) {
    const adverbs = ['very', 'really', 'extremely', 'highly', 'quite', 'rather', 'somewhat']
    let result = text

    for (const adverb of adverbs) {
      const pattern = new RegExp(`\\b${adverb}\\s+(\\w+)\\b`, 'gi')
      result = result.replace(pattern, '$1')
    }

    return result
  }

  breakComplexSentences(text) {
    const sentences = text.split(/(?<=[.!?])\s+/)
    const result = sentences.map(sentence => {
      if (sentence.length > 150) {
        return this.splitLongSentence(sentence)
      }
      return sentence
    })

    return result.join(' ')
  }

  splitLongSentence(sentence) {
    const connectors = [', but ', ', and ', ', or ', ', which ', ', that ', ' because ', ' since ', ' while ']

    for (const connector of connectors) {
      if (sentence.includes(connector)) {
        const parts = sentence.split(connector)
        if (parts.length > 1) {
          return parts.join('. ')
        }
      }
    }

    return sentence
  }

  reduceTransitions(text) {
    const transitions = ['Moreover', 'Furthermore', 'Additionally', 'Consequently', 'Therefore', 'Thus', 'Hence', 'Accordingly', 'Subsequently']

    let result = text
    let transitionCount = 0

    for (const transition of transitions) {
      const pattern = new RegExp(`\\b${transition}\\b`, 'gi')
      result = result.replace(pattern, (match) => {
        transitionCount++
        if (transitionCount > 2) {
          return ''
        }
        return match
      })
    }

    return result
  }

  convertPassiveToActive(text) {
    const passivePatterns = [
      { pattern: /(\w+)\s+is\s+(\w+ed)\s+by\s+(\w+)/gi, template: '$3 $2 $1' },
      { pattern: /(\w+)\s+are\s+(\w+ed)\s+by\s+(\w+)/gi, template: '$3 $2 $1' },
      { pattern: /(\w+)\s+was\s+(\w+ed)\s+by\s+(\w+)/gi, template: '$3 $2 $1' },
      { pattern: /(\w+)\s+were\s+(\w+ed)\s+by\s+(\w+)/gi, template: '$3 $2 $1' }
    ]

    let result = text
    for (const { pattern, template } of passivePatterns) {
      result = result.replace(pattern, template)
    }

    return result
  }

  calculateChanges(original, humanized) {
    const originalWords = original.split(/\s+/)
    const humanizedWords = humanized.split(/\s+/)

    return {
      wordCountDifference: originalWords.length - humanizedWords.length,
      characterCountDifference: original.length - humanized.length,
      sentencesDifference: this.countSentences(humanized) - this.countSentences(original),
      originalPatterns: this.detectAIPatterns(original),
      humanizedPatterns: this.detectAIPatterns(humanized)
    }
  }

  generateReport(original, humanized, analysis, options = {}) {
    const { includeSuggestions = true, includeMetrics = true } = options

    const report = {
      original: {
        length: original.length,
        wordCount: analysis.wordCount,
        sentenceCount: analysis.sentenceCount,
        avgSentenceLength: analysis.avgSentenceLength,
        aiScore: analysis.aiScore,
        humanScore: analysis.humanScore
      },
      humanized: {
        length: humanized.length,
        wordCount: this.countWords(humanized),
        sentenceCount: this.countSentences(humanized),
        avgSentenceLength: this.avgSentenceLength(humanized),
        aiScore: this.calculateAIScore(this.analyzeText(humanized)),
        humanScore: 1 - this.calculateAIScore(this.analyzeText(humanized))
      },
      improvements: {
        aiScoreReduction: analysis.aiScore - this.calculateAIScore(this.analyzeText(humanized)),
        humanScoreIncrease: (1 - this.calculateAIScore(this.analyzeText(humanized))) - analysis.humanScore
      }
    }

    if (includeMetrics) {
      report.original.readability = analysis.readability
      report.humanized.readability = this.calculateReadabilityMetrics(humanized)
    }

    if (includeSuggestions) {
      report.suggestions = analysis.suggestions
    }

    return report
  }
}

module.exports = Humanizer
