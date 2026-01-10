const API_BASE = 'http://localhost:5000/api/documents'

export const documentsAPI = {
  async uploadDocument(file, options = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options.userId) {
      formData.append('userId', options.userId)
    }
    
    if (options.projectId) {
      formData.append('projectId', options.projectId)
    }
    
    if (options.documentType) {
      formData.append('documentType', options.documentType)
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload document')
    }
    
    return result
  },

  async listDocuments(options = {}) {
    const params = new URLSearchParams()
    
    if (options.userId) {
      params.append('userId', options.userId)
    }
    
    if (options.projectId) {
      params.append('projectId', options.projectId)
    }
    
    if (options.documentType) {
      params.append('documentType', options.documentType)
    }
    
    if (options.status) {
      params.append('status', options.status)
    }

    const response = await fetch(`${API_BASE}?${params}`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to list documents')
    }
    
    return result
  },

  async getDocument(documentId) {
    const response = await fetch(`${API_BASE}/${documentId}`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get document')
    }
    
    return result
  },

  async getDocumentContext(documentId, query, options = {}) {
    const params = new URLSearchParams()
    params.append('query', query)
    
    if (options.maxTokens) {
      params.append('maxTokens', options.maxTokens)
    }
    
    if (options.topK) {
      params.append('topK', options.topK)
    }

    const response = await fetch(`${API_BASE}/${documentId}/context?${params}`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get document context')
    }
    
    return result
  },

  async getDocumentMetadata(documentId) {
    const response = await fetch(`${API_BASE}/${documentId}/metadata`)
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get document metadata')
    }
    
    return result
  },

  async deleteDocument(documentId) {
    const response = await fetch(`${API_BASE}/${documentId}`, {
      method: 'DELETE'
    })
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete document')
    }
    
    return result
  },

  async updateDocumentStatus(documentId, status, additionalData = {}) {
    const response = await fetch(`${API_BASE}/${documentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, ...additionalData })
    })
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update document status')
    }
    
    return result
  }
}
