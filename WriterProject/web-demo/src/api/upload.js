import apiClient from './client'

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  getFiles: () => apiClient.get('/upload'),
  deleteFile: (filename) => apiClient.delete(`/upload/${filename}`)
}

export default uploadAPI
