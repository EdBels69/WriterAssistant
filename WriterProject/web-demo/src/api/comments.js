import apiClient from './client'

export const commentsAPI = {
  getCommentsByProject: (projectId) => apiClient.get(`/comments/project/${projectId}`),
  getCommentsByChapter: (chapterId) => apiClient.get(`/comments/chapter/${chapterId}`),
  createComment: (data) => apiClient.post('/comments', data),
  updateComment: (id, data) => apiClient.put(`/comments/${id}`, data),
  deleteComment: (id) => apiClient.delete(`/comments/${id}`)
}
