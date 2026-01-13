import { useEffect, useRef, useCallback, useState } from 'react'

const deriveWsBaseUrl = (apiBaseUrl) => {
  if (!apiBaseUrl || typeof apiBaseUrl !== 'string') return null
  const normalized = apiBaseUrl.replace(/\/$/, '')
  const wsBase = normalized.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://')
  if (wsBase.startsWith('ws://') || wsBase.startsWith('wss://')) return wsBase
  return null
}

const useWebSocket = (userId, onMessage) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected')
  const wsRef = useRef(null)
  const debugWsRef = useRef(new EventTarget())
  const connectRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const circuitResetTimeoutRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const heartbeatIntervalRef = useRef(null)
  const isReconnectingRef = useRef(false)
  const connectionAttemptRef = useRef(0)

  const circuitBreakerRef = useRef({
    state: 'closed',
    failureCount: 0,
    lastFailureTime: null,
    resetTimeout: 30000,
    failureThreshold: 5
  })

  const connectionMetricsRef = useRef({
    connects: 0,
    disconnects: 0,
    failures: 0,
    connectedAt: null,
    lastUptime: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalReconnectTime: 0,
    lastReconnectTime: null
  })

  const pausePipelineRef = useRef(null)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const pausePipeline = useCallback(() => {
    if (typeof pausePipelineRef.current === 'function') {
      pausePipelineRef.current()
    }
  }, [])

  const resumePipeline = useCallback(() => {
    const event = new CustomEvent('websocket-resume')
    window.dispatchEvent(event)
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, 30000)
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const calculateReconnectDelay = useCallback((attempt) => {
    const baseDelay = 1000
    const maxDelay = 30000
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    const jitter = Math.random() * exponentialDelay * 0.1
    return Math.floor(exponentialDelay + jitter)
  }, [])

  const resetCircuitBreaker = useCallback(() => {
    if (circuitResetTimeoutRef.current) {
      clearTimeout(circuitResetTimeoutRef.current)
      circuitResetTimeoutRef.current = null
    }
    circuitBreakerRef.current = {
      ...circuitBreakerRef.current,
      state: 'closed',
      failureCount: 0,
      lastFailureTime: null
    }
  }, [])

  const openCircuitBreaker = useCallback(() => {
    if (circuitResetTimeoutRef.current) {
      clearTimeout(circuitResetTimeoutRef.current)
      circuitResetTimeoutRef.current = null
    }

    circuitBreakerRef.current = {
      ...circuitBreakerRef.current,
      state: 'open',
      lastFailureTime: Date.now()
    }
    pausePipeline()
    setConnectionState('circuit_open')

    circuitResetTimeoutRef.current = setTimeout(() => {
      if (circuitBreakerRef.current.state !== 'open') return
      circuitBreakerRef.current = {
        ...circuitBreakerRef.current,
        state: 'half_open'
      }
      setConnectionState('reconnecting')
    }, circuitBreakerRef.current.resetTimeout)
  }, [pausePipeline])

  const shouldAttemptConnection = useCallback(() => {
    const { state, lastFailureTime, resetTimeout } = circuitBreakerRef.current

    if (state === 'closed') {
      return true
    }

    if (state === 'open') {
      const timeSinceLastFailure = Date.now() - lastFailureTime
      if (timeSinceLastFailure >= resetTimeout) {
        circuitBreakerRef.current.state = 'half_open'
        setConnectionState('reconnecting')
        return true
      }
      return false
    }

    if (state === 'half_open') {
      setConnectionState('reconnecting')
      return true
    }

    return false
  }, [])

  const handleOpen = useCallback(() => {
    setIsConnected(true)
    setConnectionState('connected')
    connectionMetricsRef.current.connects++
    connectionMetricsRef.current.successfulConnections++
    connectionMetricsRef.current.connectedAt = Date.now()
    isReconnectingRef.current = false
    connectionAttemptRef.current = 0

    if (circuitBreakerRef.current.state === 'half_open') {
      resetCircuitBreaker()
      resumePipeline()
    } else {
      circuitBreakerRef.current.failureCount = 0
    }

    startHeartbeat()
  }, [resetCircuitBreaker, resumePipeline, startHeartbeat])

  const handleClose = useCallback(() => {
    setIsConnected(false)
    setConnectionState('disconnected')
    connectionMetricsRef.current.disconnects++
    isReconnectingRef.current = false
    stopHeartbeat()

    const now = Date.now()
    if (connectionMetricsRef.current.connectedAt) {
      connectionMetricsRef.current.lastUptime = Math.max(
        0,
        now - connectionMetricsRef.current.connectedAt
      )
      connectionMetricsRef.current.connectedAt = null
    }

    const { state, failureThreshold } = circuitBreakerRef.current
    circuitBreakerRef.current.failureCount++
    connectionMetricsRef.current.failures++
    connectionMetricsRef.current.failedConnections++

    if (circuitBreakerRef.current.failureCount >= failureThreshold) {
      openCircuitBreaker()
      return
    }

    if (!userId) return
    if (state === 'open') return

    const reconnectAttempt = connectionMetricsRef.current.failedConnections
    const delay = calculateReconnectDelay(reconnectAttempt)
    reconnectTimeoutRef.current = setTimeout(() => {
      connectRef.current?.()
    }, delay)
  }, [calculateReconnectDelay, openCircuitBreaker, stopHeartbeat, userId])

  const handleError = useCallback(() => {
    const { state, failureThreshold } = circuitBreakerRef.current
    connectionMetricsRef.current.failures++
    connectionMetricsRef.current.failedConnections++

    if (state === 'half_open') {
      circuitBreakerRef.current.failureCount = failureThreshold
      openCircuitBreaker()
      return
    }

    circuitBreakerRef.current.failureCount++
    if (circuitBreakerRef.current.failureCount >= failureThreshold) {
      openCircuitBreaker()
    }
  }, [openCircuitBreaker])

  const handleMessage = useCallback((event) => {
    const raw = event?.data
    if (!raw) return

    try {
      const data = JSON.parse(raw)
      if (data?.type === 'pong') return
      onMessageRef.current?.(data)
    } catch {
      onMessageRef.current?.(raw)
    }
  }, [])

  useEffect(() => {
    const target = debugWsRef.current

    target.addEventListener('open', handleOpen)
    target.addEventListener('close', handleClose)
    target.addEventListener('error', handleError)
    target.addEventListener('message', handleMessage)

    return () => {
      target.removeEventListener('open', handleOpen)
      target.removeEventListener('close', handleClose)
      target.removeEventListener('error', handleError)
      target.removeEventListener('message', handleMessage)
    }
  }, [handleClose, handleError, handleMessage, handleOpen])

  const connect = useCallback(() => {
    if (!shouldAttemptConnection()) {
      const timeUntilReset = circuitBreakerRef.current.resetTimeout - (Date.now() - circuitBreakerRef.current.lastFailureTime)
      console.warn(`Circuit breaker is open, retrying in ${Math.ceil(timeUntilReset / 1000)}s`)
      return
    }

    if (isReconnectingRef.current) {
      console.warn('Reconnection already in progress, skipping duplicate connect call')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    isReconnectingRef.current = true
    connectionAttemptRef.current++
    setConnectionState('connecting')
    const wsBaseUrl = import.meta.env.VITE_WS_URL || deriveWsBaseUrl(import.meta.env.VITE_API_URL) || 'ws://localhost:5001'
    const wsUrl = `${wsBaseUrl}?userId=${userId}`

    const connectStartTime = Date.now()
    
    try {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.addEventListener('open', () => {
        connectionMetricsRef.current.lastReconnectTime = Date.now() - connectStartTime
        connectionMetricsRef.current.totalReconnectTime += connectionMetricsRef.current.lastReconnectTime
        handleOpen()
      })

      socket.addEventListener('message', handleMessage)

      socket.addEventListener('close', () => {
        handleClose()
      })

      socket.addEventListener('error', () => {
        handleError()
      })
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      isReconnectingRef.current = false
      setConnectionState('disconnected')
    }
  }, [userId, shouldAttemptConnection, handleClose, handleError, handleMessage, handleOpen])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    isReconnectingRef.current = false
    stopHeartbeat()
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (circuitResetTimeoutRef.current) {
      clearTimeout(circuitResetTimeoutRef.current)
      circuitResetTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [stopHeartbeat])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const joinProject = useCallback((projectId) => {
    send({ type: 'join_project', projectId })
  }, [send])

  const leaveProject = useCallback(() => {
    send({ type: 'leave_project' })
  }, [send])

  const typingStart = useCallback((chapterId) => {
    send({ type: 'typing_start', chapterId })
  }, [send])

  const typingStop = useCallback((chapterId) => {
    send({ type: 'typing_stop', chapterId })
  }, [send])

  useEffect(() => {
    if (userId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [userId, connect, disconnect])

  return {
    isConnected,
    connectionState,
    ws: debugWsRef.current,
    send,
    joinProject,
    leaveProject,
    typingStart,
    typingStop,
    setPausePipeline: (callback) => { pausePipelineRef.current = callback },
    getConnectionMetrics: () => ({
      ...connectionMetricsRef.current,
      uptime: connectionMetricsRef.current.connectedAt
        ? Math.max(0, Date.now() - connectionMetricsRef.current.connectedAt)
        : connectionMetricsRef.current.lastUptime
    }),
    getCircuitBreakerState: () => circuitBreakerRef.current
  }
}

export default useWebSocket
