import apiClient from './client.js'

export const statisticsAPI = {
  getOverview: (userId) => apiClient.get(`/statistics/overview/${userId}`),
  
  getProductivity: (userId, days = 30) => apiClient.get(`/statistics/productivity/${userId}`, { params: { days } }),
  
  getSessions: (userId, options = {}) => apiClient.get(`/statistics/sessions/${userId}`, { params: options }),
  
  getGoals: (userId, status) => apiClient.get(`/statistics/goals/${userId}`, { params: { status } }),
  
  createGoal: (data) => apiClient.post('/statistics/goals', data),
  
  updateGoal: (id, data) => apiClient.put(`/statistics/goals/${id}`, data),
  
  deleteGoal: (id) => apiClient.delete(`/statistics/goals/${id}`)
}