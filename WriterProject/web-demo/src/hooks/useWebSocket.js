import { useEffect, useRef, useCallback, useState } from 'react'

const useWebSocket = (userId, onMessage) => {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const onMessageRef = useRef(onMessage)
  const MAX_RECONNECT_ATTEMPTS = 20

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      return
    }

    const wsUrl = `ws://localhost:5001?userId=${userId}`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      reconnectAttempts.current = 0
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessageRef.current?.(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    wsRef.current.onclose = (event) => {
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason)
      setIsConnected(false)
      
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`)
          connect()
        }, 5000)
      } else {
        console.error('Max reconnection attempts reached, giving up')
      }
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      console.error('WebSocket readyState:', wsRef.current?.readyState)
    }
  }, [userId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
  }, [])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.error('WebSocket is not connected')
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
    send,
    joinProject,
    leaveProject,
    typingStart,
    typingStop
  }
}

export default useWebSocket