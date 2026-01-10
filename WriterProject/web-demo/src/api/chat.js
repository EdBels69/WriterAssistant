import apiClient from './client.js'

export const chatAPI = {
  sendMessage: (data) => apiClient.post('/chat/message', data),
  
  getHistory: (sessionId) => apiClient.get(`/chat/history/${sessionId}`),
  
  clearHistory: (sessionId) => apiClient.post(`/chat/clear/${sessionId}`)
}