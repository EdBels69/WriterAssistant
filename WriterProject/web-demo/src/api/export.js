import apiClient from './client'

export const exportAPI = {
  exportText: (format, data) => apiClient.post(`/export/text/${format}`, data, { responseType: 'blob' }),
  exportProject: (format, data) => apiClient.post(`/export/project/${format}`, data, { responseType: 'blob' })
}

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
