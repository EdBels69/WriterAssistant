class TextChunkingService {
  constructor() {
    this.MAX_TOKENS_PER_CHUNK = 4000
    this.CHUNK_OVERLAP = 200
  }

  splitTextIntoChunks(text, maxTokens = this.MAX_TOKENS_PER_CHUNK, overlap = this.CHUNK_OVERLAP) {
    const chunks = []
    const sentences = this.splitIntoSentences(text)
    let currentChunk = ''
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence)

      if (currentTokens + sentenceTokens <= maxTokens) {
        currentChunk += sentence + ' '
        currentTokens += sentenceTokens
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim())
        }

        currentChunk = sentence + ' '
        currentTokens = sentenceTokens

        if (overlap > 0 && chunks.length > 0) {
          const lastChunk = chunks[chunks.length - 1]
          const lastSentences = this.splitIntoSentences(lastChunk).slice(-3)
          const overlapText = lastSentences.join(' ') + ' '
          currentChunk = overlapText + currentChunk
          currentTokens = this.estimateTokens(currentChunk)
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  splitIntoSentences(text) {
    return text.match(/[^.!?]*[.!?]+[\s"'']*/g) || [text]
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4)
  }

  async processLargeText(text, processFunction, options = {}) {
    const { onProgress, maxRetries = 3, delay = 1000 } = options
    const chunks = this.splitTextIntoChunks(text)
    const results = []
    const errors = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      let retries = 0
      let success = false

      while (retries < maxRetries && !success) {
        try {
          const result = await processFunction(chunk, {
            chunkIndex: i,
            totalChunks: chunks.length,
            context: i > 0 ? results[i - 1] : null
          })

          results.push(result)
          success = true

          if (onProgress) {
            onProgress({
              current: i + 1,
              total: chunks.length,
              percentage: Math.round(((i + 1) / chunks.length) * 100),
              result
            })
          }

          if (delay > 0) {
            await this.sleep(delay)
          }
        } catch (error) {
          retries++
          errors.push({
            chunkIndex: i,
            error: error.message,
            retry: retries
          })

          if (retries < maxRetries) {
            await this.sleep(delay * retries)
          }
        }
      }

      if (!success) {
        throw new Error(`Failed to process chunk ${i + 1} after ${maxRetries} retries`)
      }
    }

    return {
      success: true,
      chunks: results,
      errors: errors.filter(e => e.retry < maxRetries),
      totalChunks: chunks.length
    }
  }

  async mergeProcessedChunks(processedChunks, mergeStrategy = 'sequential') {
    switch (mergeStrategy) {
      case 'sequential':
        return processedChunks.join('\n\n')

      case 'smart':
        return this.smartMerge(processedChunks)

      case 'preserve':
        return processedChunks.map((chunk, index) => 
          `=== Часть ${index + 1} ===\n${chunk}\n=== Конец части ${index + 1} ===`
        ).join('\n\n')

      default:
        return processedChunks.join('\n\n')
    }
  }

  smartMerge(chunks) {
    let mergedText = ''

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const overlapStart = i > 0 ? this.findOverlap(chunks[i - 1], chunk) : null

      if (overlapStart) {
        mergedText += chunk.substring(overlapStart)
      } else {
        mergedText += (i > 0 ? '\n\n' : '') + chunk
      }
    }

    return mergedText
  }

  findOverlap(prevChunk, currentChunk) {
    const prevWords = prevChunk.split(' ')
    const currentWords = currentChunk.split(' ')

    for (let i = 1; i <= Math.min(50, prevWords.length, currentWords.length); i++) {
      const prevTail = prevWords.slice(-i).join(' ')
      const currentHead = currentWords.slice(0, i).join(' ')

      if (prevTail === currentHead) {
        return prevTail.length + 1
      }
    }

    return null
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export default TextChunkingService
