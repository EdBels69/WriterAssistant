class PriorityRequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3
    this.maxQueueSize = options.maxQueueSize || 100
    this.defaultPriority = options.defaultPriority || 5
    this.processingTimeout = options.processingTimeout || 30000
    
    this.queue = []
    this.processing = new Map()
    this.completed = []
    
    this.priorityLevels = {
      critical: 0,
      high: 3,
      normal: 5,
      low: 7,
      background: 9
    }
    
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      avgProcessingTime: 0,
      peakQueueSize: 0
    }
    
    this.startTime = null
  }

  enqueue(request, priority = null) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new QueueFullError(
        `Queue is full (${this.maxQueueSize} requests). Try again later.`
      )
    }

    const queueRequest = {
      id: this.generateId(),
      request,
      priority: this.normalizePriority(priority),
      queuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      attempts: 0,
      status: 'queued'
    }

    this.queue.push(queueRequest)
    this.stats.totalQueued++
    this.stats.peakQueueSize = Math.max(this.stats.peakQueueSize, this.queue.length)
    
    if (!this.startTime) this.startTime = Date.now()

    return queueRequest.id
  }

  normalizePriority(priority) {
    if (priority === null || priority === undefined) {
      return this.defaultPriority
    }
    
    if (typeof priority === 'string') {
      return this.priorityLevels[priority.toLowerCase()] || this.defaultPriority
    }
    
    if (typeof priority === 'number') {
      return Math.max(0, Math.min(9, Math.round(priority)))
    }
    
    return this.defaultPriority
  }

  async dequeue() {
    if (this.processing.size >= this.maxConcurrent) {
      return null
    }

    if (this.queue.length === 0) {
      return null
    }

    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return a.queuedAt - b.queuedAt
    })

    const request = this.queue.shift()
    request.status = 'processing'
    request.startedAt = Date.now()
    this.processing.set(request.id, request)

    return request
  }

  async processRequest(requestId, processor) {
    const request = this.processing.get(requestId)
    if (!request) {
      throw new RequestNotFoundError(`Request ${requestId} not found in processing`)
    }

    request.attempts++

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), this.processingTimeout)
      })

      const result = await Promise.race([processor(request.request), timeoutPromise])

      this.completeRequest(requestId, result)
      return result
    } catch (error) {
      this.failRequest(requestId, error)
      throw error
    }
  }

  completeRequest(requestId, result) {
    const request = this.processing.get(requestId)
    if (!request) return

    request.completedAt = Date.now()
    request.status = 'completed'
    request.result = result

    const processingTime = request.completedAt - request.startedAt
    this.stats.totalProcessed++
    this.stats.avgProcessingTime = 
      (this.stats.avgProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / 
      this.stats.totalProcessed

    this.processing.delete(requestId)
    this.completed.push(request)

    if (this.completed.length > 100) {
      this.completed.shift()
    }
  }

  failRequest(requestId, error) {
    const request = this.processing.get(requestId)
    if (!request) return

    request.completedAt = Date.now()
    request.status = 'failed'
    request.error = error?.message || 'Unknown error'

    this.stats.totalFailed++
    this.stats.totalProcessed++

    this.processing.delete(requestId)
    this.completed.push(request)

    if (this.completed.length > 100) {
      this.completed.shift()
    }
  }

  getStatus(requestId) {
    const queued = this.queue.find(r => r.id === requestId)
    if (queued) {
      return {
        ...queued,
        position: this.queue.indexOf(queued) + 1,
        estimatedWaitTime: this.estimateWaitTime(queued)
      }
    }

    const processing = this.processing.get(requestId)
    if (processing) {
      return {
        ...processing,
        elapsedProcessingTime: Date.now() - processing.startedAt
      }
    }

    const completed = this.completed.find(r => r.id === requestId)
    if (completed) {
      return completed
    }

    return null
  }

  estimateWaitTime(request) {
    const higherPriorityCount = this.queue.filter(
      r => r.priority < request.priority || (r.priority === request.priority && r.queuedAt < request.queuedAt)
    ).length

    const avgProcessingTime = this.stats.avgProcessingTime || 5000
    const availableSlots = this.maxConcurrent - this.processing.size

    return Math.ceil(higherPriorityCount / Math.max(1, availableSlots)) * avgProcessingTime
  }

  cancelRequest(requestId) {
    const queueIndex = this.queue.findIndex(r => r.id === requestId)
    if (queueIndex !== -1) {
      const request = this.queue.splice(queueIndex, 1)[0]
      request.status = 'cancelled'
      request.completedAt = Date.now()
      this.completed.push(request)
      return true
    }

    if (this.processing.has(requestId)) {
      return false
    }

    return false
  }

  prioritizeRequest(requestId, newPriority) {
    const request = this.queue.find(r => r.id === requestId)
    if (!request) {
      throw new RequestNotFoundError(`Request ${requestId} not found in queue`)
    }

    request.priority = this.normalizePriority(newPriority)
    return request
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      availableSlots: this.maxConcurrent - this.processing.size,
      stats: { ...this.stats },
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      priorityDistribution: this.getPriorityDistribution()
    }
  }

  getPriorityDistribution() {
    const distribution = {}
    Object.keys(this.priorityLevels).forEach(level => {
      distribution[level] = 0
    })

    this.queue.forEach(request => {
      const level = Object.entries(this.priorityLevels).find(
        ([_, value]) => value === request.priority
      )?.[0] || 'normal'
      distribution[level]++
    })

    return distribution
  }

  getProcessingRequests() {
    return Array.from(this.processing.values()).map(request => ({
      id: request.id,
      priority: request.priority,
      attempts: request.attempts,
      elapsedProcessingTime: Date.now() - request.startedAt
    }))
  }

  getCompletedRequests(limit = 10) {
    return this.completed.slice(-limit).reverse()
  }

  clear() {
    const cancelledCount = this.queue.length
    this.queue.forEach(request => {
      request.status = 'cancelled'
      request.completedAt = Date.now()
      this.completed.push(request)
    })
    this.queue = []
    return cancelledCount
  }

  reset() {
    this.queue.forEach(request => {
      request.status = 'cancelled'
      request.completedAt = Date.now()
      this.completed.push(request)
    })
    this.queue = []
    this.processing.clear()
    this.startTime = Date.now()
  }

  generateId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

class QueueFullError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QueueFullError'
  }
}

class RequestNotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RequestNotFoundError'
  }
}

module.exports = { PriorityRequestQueue, QueueFullError, RequestNotFoundError }
