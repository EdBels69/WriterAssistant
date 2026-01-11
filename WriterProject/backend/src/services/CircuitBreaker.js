class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 60000
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3
    
    this.states = {
      closed: 'CLOSED',
      open: 'OPEN',
      halfOpen: 'HALF_OPEN'
    }
    
    this.services = new Map()
  }

  getService(serviceName) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, {
        state: this.states.closed,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        halfOpenCalls: 0,
        history: []
      })
    }
    return this.services.get(serviceName)
  }

  recordSuccess(serviceName) {
    const service = this.getService(serviceName)
    
    if (service.state === this.states.halfOpen) {
      service.successCount++
      service.halfOpenCalls++
      
      if (service.successCount >= this.halfOpenMaxCalls) {
        this.reset(service)
      }
    } else if (service.state === this.states.closed) {
      service.failureCount = 0
    }
    
    service.history.push({
      timestamp: new Date().toISOString(),
      status: 'success'
    })
    
    this.trimHistory(service)
  }

  recordFailure(serviceName, error) {
    const service = this.getService(serviceName)
    
    service.failureCount++
    service.lastFailureTime = Date.now()
    
    if (service.state === this.states.halfOpen) {
      this.open(service)
    } else if (service.state === this.states.closed && 
               service.failureCount >= this.failureThreshold) {
      this.open(service)
    }
    
    service.history.push({
      timestamp: new Date().toISOString(),
      status: 'failure',
      error: error?.message || 'Unknown error'
    })
    
    this.trimHistory(service)
  }

  open(service) {
    service.state = this.states.open
    service.failureCount = 0
    service.successCount = 0
  }

  halfOpen(service) {
    service.state = this.states.halfOpen
    service.failureCount = 0
    service.successCount = 0
    service.halfOpenCalls = 0
  }

  reset(service) {
    service.state = this.states.closed
    service.failureCount = 0
    service.successCount = 0
    service.halfOpenCalls = 0
    service.lastFailureTime = null
  }

  trimHistory(service) {
    if (service.history.length > 100) {
      service.history = service.history.slice(-100)
    }
  }

  async execute(serviceName, fn, fallback = null) {
    const service = this.getService(serviceName)
    
    if (service.state === this.states.open) {
      if (this.shouldAttemptReset(service)) {
        this.halfOpen(service)
      } else {
        if (fallback) {
          return fallback()
        }
        throw new CircuitBreakerOpenError(
          `Circuit breaker for ${serviceName} is OPEN`,
          serviceName,
          service
        )
      }
    }
    
    try {
      const result = await fn()
      this.recordSuccess(serviceName)
      return result
    } catch (error) {
      this.recordFailure(serviceName, error)
      
      if (fallback) {
        try {
          return fallback()
        } catch (fallbackError) {
          throw new CircuitBreakerError(
            `Primary and fallback failed for ${serviceName}`,
            serviceName,
            service,
            error
          )
        }
      }
      
      throw error
    }
  }

  shouldAttemptReset(service) {
    if (!service.lastFailureTime) return false
    const timeSinceLastFailure = Date.now() - service.lastFailureTime
    return timeSinceLastFailure >= this.resetTimeout
  }

  getState(serviceName) {
    const service = this.getService(serviceName)
    return {
      name: serviceName,
      state: service.state,
      failureCount: service.failureCount,
      successCount: service.successCount,
      halfOpenCalls: service.halfOpenCalls,
      lastFailureTime: service.lastFailureTime,
      lastFailureTimeAgo: service.lastFailureTime ? Date.now() - service.lastFailureTime : null,
      canAttemptReset: this.shouldAttemptReset(service),
      recentHistory: service.history.slice(-10)
    }
  }

  getAllStates() {
    const states = {}
    this.services.forEach((service, name) => {
      states[name] = this.getState(name)
    })
    return states
  }

  resetService(serviceName) {
    const service = this.getService(serviceName)
    this.reset(service)
  }

  resetAll() {
    this.services.forEach((service) => {
      this.reset(service)
    })
  }

  getOpenCircuits() {
    const open = []
    this.services.forEach((service, name) => {
      if (service.state === this.states.open) {
        open.push(name)
      }
    })
    return open
  }

  getHalfOpenCircuits() {
    const halfOpen = []
    this.services.forEach((service, name) => {
      if (service.state === this.states.halfOpen) {
        halfOpen.push(name)
      }
    })
    return halfOpen
  }

  getHealthReport() {
    const report = {
      totalServices: this.services.size,
      closed: 0,
      open: 0,
      halfOpen: 0,
      services: this.getAllStates()
    }
    
    Object.values(report.services).forEach(service => {
      report[service.state.toLowerCase()]++
    })
    
    return report
  }
}

class CircuitBreakerOpenError extends Error {
  constructor(message, serviceName, state) {
    super(message)
    this.name = 'CircuitBreakerOpenError'
    this.serviceName = serviceName
    this.state = state
  }
}

class CircuitBreakerError extends Error {
  constructor(message, serviceName, state, originalError) {
    super(message)
    this.name = 'CircuitBreakerError'
    this.serviceName = serviceName
    this.state = state
    this.originalError = originalError
  }
}

module.exports = { CircuitBreaker, CircuitBreakerOpenError, CircuitBreakerError }
