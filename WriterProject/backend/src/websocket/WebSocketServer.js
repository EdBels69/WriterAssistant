import { WebSocketServer as WSServer } from 'ws'

class WebSocketServer {
  constructor() {
    this.wss = null
    this.clients = new Map()
    this.clientLastPong = new WeakMap()
    this.heartbeatInterval = null
  }

  start(server) {
    this.wss = new WSServer({ 
      server,
      clientTracking: true
    })

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error)
    })

    this.wss.on('connection', (ws, req) => {
      const userId = this.extractUserId(req)

      if (userId) {
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set())
        }
        this.clients.get(userId).add(ws)

        this.clientLastPong.set(ws, Date.now())

        ws.send(JSON.stringify({
          type: 'connected',
          userId,
          timestamp: new Date().toISOString()
        }))

        ws.on('pong', () => {
          this.clientLastPong.set(ws, Date.now())
        })
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleMessage(ws, userId, data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      ws.on('close', (code, reason) => {
        console.log(`WebSocket disconnected for user: ${userId}, code: ${code}, reason: ${reason}`)
        if (userId && this.clients.has(userId)) {
          this.clients.get(userId).delete(ws)
          if (this.clients.get(userId).size === 0) {
            this.clients.delete(userId)
          }
        }
      })

      ws.on('error', (error) => {
        console.error('WebSocket connection error:', error)
      })
    })

    this.startHeartbeat()
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 60000

      this.wss.clients.forEach(ws => {
        if (this.clientLastPong.has(ws)) {
          const lastPong = this.clientLastPong.get(ws)
          if (now - lastPong > timeout) {
            console.log('Client timeout, closing connection')
            ws.terminate()
          } else {
            ws.ping()
          }
        }
      })
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  extractUserId(req) {
    const url = new URL(req.url, `http://${req.headers.host}`)
    return url.searchParams.get('userId')
  }

  handleMessage(ws, userId, data) {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
        break
      case 'join_project':
        ws.projectId = data.projectId
        this.broadcastToProject(data.projectId, 'user_joined', { userId })
        break
      case 'leave_project':
        const projectId = ws.projectId
        ws.projectId = null
        if (projectId) {
          this.broadcastToProject(projectId, 'user_left', { userId })
        }
        break
      case 'typing_start':
        if (ws.projectId) {
          this.broadcastToProject(ws.projectId, 'typing_start', {
            userId,
            chapterId: data.chapterId
          }, ws)
        }
        break
      case 'typing_stop':
        if (ws.projectId) {
          this.broadcastToProject(ws.projectId, 'typing_stop', {
            userId,
            chapterId: data.chapterId
          }, ws)
        }
        break
    }
  }

  broadcast(userId, type, data) {
    if (this.clients.has(userId)) {
      const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })

      this.clients.get(userId).forEach(client => {
        if (client.readyState === 1) {
          client.send(message)
        }
      })
    }
  }

  broadcastToProject(projectId, type, data, excludeWs = null) {
    const message = JSON.stringify({
      type,
      data,
      projectId,
      timestamp: new Date().toISOString()
    })

    this.clients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.readyState === 1 && client.projectId === projectId && client !== excludeWs) {
          client.send(message)
        }
      })
    })
  }

  getConnectedUsers(projectId) {
    const users = new Set()
    this.clients.forEach((clients, userId) => {
      clients.forEach(client => {
        if (client.projectId === projectId) {
          users.add(userId)
        }
      })
    })
    return Array.from(users)
  }
}

export default WebSocketServer