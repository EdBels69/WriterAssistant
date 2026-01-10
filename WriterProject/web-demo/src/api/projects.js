import apiClient from './client.js'

export const projectsAPI = {
  getAll: () => apiClient.get('/projects'),
  
  getById: (id) => apiClient.get(`/projects/${id}`),
  
  create: (data) => apiClient.post('/projects', data),
  
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  
  delete: (id) => apiClient.delete(`/projects/${id}`),
  
  getChapters: (projectId) => apiClient.get(`/projects/${projectId}/chapters`),
  
  createChapter: (projectId, data) => apiClient.post(`/projects/${projectId}/chapters`, data),
  
  getCharacters: (projectId) => apiClient.get(`/projects/${projectId}/characters`),
  
  createCharacter: (projectId, data) => apiClient.post(`/projects/${projectId}/characters`, data),
  
  generateIdeas: (projectId, data) => apiClient.post(`/projects/${projectId}/ideas`, data),
  
  generateOutline: (projectId, data) => apiClient.post(`/projects/${projectId}/outline`, data),
  
  expandText: (projectId, data) => apiClient.post(`/projects/${projectId}/expand`, data)
}